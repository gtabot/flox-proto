import { Lexicons } from '@atproto/lexicon'
import type { LexiconDoc } from '@atproto/lexicon'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Valid property types in AT Protocol Lexicon
const VALID_PRIMITIVE_TYPES = ['string', 'boolean', 'integer', 'float', 'datetime']
const VALID_COMPLEX_TYPES = ['array', 'object', 'blob', 'bytes', 'cid-link', 'ref', 'union', 'unknown']
const VALID_TYPES = [...VALID_PRIMITIVE_TYPES, ...VALID_COMPLEX_TYPES]

// Valid key types for records
const VALID_RECORD_KEYS = ['tid', 'cid', 'string']

function validatePropertyType(propName: string, prop: any, defId: string) {
    if (!prop.type) {
        throw new Error(`Missing type for property "${propName}" in ${defId}`)
    }
    if (!VALID_TYPES.includes(prop.type)) {
        throw new Error(`Invalid type "${prop.type}" for property "${propName}" in ${defId}`)
    }

    // Validate array items
    if (prop.type === 'array') {
        if (!prop.items) {
            throw new Error(`Array property "${propName}" in ${defId} must specify items`)
        }
        validatePropertyType(`${propName}.items`, prop.items, defId)
    }

    // Validate union variants
    if (prop.type === 'union') {
        if (!Array.isArray(prop.refs)) {
            throw new Error(`Union property "${propName}" in ${defId} must specify refs array`)
        }
        if (prop.refs.length < 2) {
            throw new Error(`Union property "${propName}" in ${defId} must have at least 2 refs`)
        }
        // Could add validation for ref format (NSID) here
    }

    // Validate object properties
    if (prop.type === 'object' && prop.properties) {
        for (const [subPropName, subProp] of Object.entries(prop.properties)) {
            validatePropertyType(`${propName}.${subPropName}`, subProp, defId)
        }
    }

    // Validate string formats
    if (prop.type === 'string' && prop.format) {
        const validFormats = ['datetime', 'uri', 'at-uri', 'did', 'handle', 'at-identifier', 'nsid', 'cid']
        if (!validFormats.includes(prop.format)) {
            throw new Error(`Invalid string format "${prop.format}" for property "${propName}" in ${defId}`)
        }
    }

    // Validate number constraints
    if (['integer', 'float'].includes(prop.type)) {
        if (typeof prop.minimum === 'number' && typeof prop.maximum === 'number' && prop.minimum > prop.maximum) {
            throw new Error(`Invalid range: minimum > maximum for property "${propName}" in ${defId}`)
        }
    }

    // Validate ref property
    if (prop.type === 'ref') {
        if (!prop.ref) {
            throw new Error(`Ref property "${propName}" in ${defId} must specify ref target`)
        }
        // Validate ref format - must be either a definition name prefixed with # or a full NSID
        if (!prop.ref.startsWith('#') && !prop.ref.match(/^[a-zA-Z][a-zA-Z0-9-]+(\.[a-zA-Z][a-zA-Z0-9-]+)*$/)) {
            throw new Error(`Invalid ref format "${prop.ref}" for property "${propName}" in ${defId} - must be #defName or valid NSID`)
        }
    }
}

function getLexiconFiles(dir: string): string[] {
    const files: string[] = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            files.push(...getLexiconFiles(fullPath))
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            files.push(fullPath)
        }
    }

    return files
}


const lexicons = new Lexicons()
const lexiconDir = path.join(__dirname, '..', 'src', 'lexicons')
const files = getLexiconFiles(lexiconDir)
let hasError = false

for (const file of files) {
    try {
        const doc = JSON.parse(fs.readFileSync(file, 'utf-8')) as LexiconDoc

        // Basic schema validation
        if (doc.lexicon !== 1) {
            throw new Error('Invalid lexicon version - must be 1')
        }
        if (!doc.id || typeof doc.id !== 'string') {
            throw new Error('Missing or invalid lexicon ID')
        }
        if (!doc.id.match(/^[a-zA-Z][a-zA-Z0-9-]+(\.[a-zA-Z][a-zA-Z0-9-]+)*$/)) {
            throw new Error('Invalid lexicon ID format - must be valid NSID')
        }
        if (!doc.defs || typeof doc.defs !== 'object') {
            throw new Error('Missing or invalid defs object')
        }

        // Validate each definition
        for (const [defId, def] of Object.entries(doc.defs)) {
            if (!def || typeof def !== 'object') {
                throw new Error(`Invalid definition for ${defId}`)
            }
            if (!def.type) {
                throw new Error(`Missing type in definition ${defId}`)
            }

            // For record types, validate structure and key
            if (def.type === 'record') {
                if (!def.record || !def.record.properties) {
                    throw new Error(`Missing record properties in definition ${defId}`)
                }
                if (!def.key) {
                    throw new Error(`Missing key in record definition ${defId}`)
                }

                const props = def.record.properties
                const required = def.record.required || []

                // Validate each property
                for (const [propName, prop] of Object.entries(props)) {
                    validatePropertyType(propName, prop, defId)
                }

                // Validate required properties exist
                for (const reqProp of required) {
                    if (!props[reqProp]) {
                        throw new Error(`Required property "${reqProp}" not found in properties for ${defId}`)
                    }
                }
            }

            // Validate query parameters
            if (def.type === 'query') {
                if (def.parameters?.properties) {
                    for (const [paramName, param] of Object.entries(def.parameters.properties)) {
                        validatePropertyType(paramName, param, `${defId}.parameters`)
                    }
                }
                if (def.output?.encoding && def.output.encoding !== 'application/json') {
                    throw new Error(`Invalid output encoding "${def.output.encoding}" in query ${defId}`)
                }
            }

            // Validate procedure parameters
            if (def.type === 'procedure') {
                if (def.parameters?.properties) {
                    for (const [paramName, param] of Object.entries(def.parameters.properties)) {
                        validatePropertyType(paramName, param, `${defId}.parameters`)
                    }
                }
                if (def.input?.encoding && !['application/json', 'application/*'].includes(def.input.encoding)) {
                    throw new Error(`Invalid input encoding "${def.input.encoding}" in procedure ${defId}`)
                }
                if (def.output?.encoding && def.output.encoding !== 'application/json') {
                    throw new Error(`Invalid output encoding "${def.output.encoding}" in procedure ${defId}`)
                }
            }
        }

        // If all validation passes, add to lexicons
        lexicons.add(doc)
        console.log(`✓ Valid lexicon: ${path.relative(process.cwd(), file)}`)
    } catch (err) {
        hasError = true
        console.error(`✗ Invalid lexicon: ${path.relative(process.cwd(), file)}`)
        console.error(err)
    }
}

if (hasError) {
    process.exit(1)
}
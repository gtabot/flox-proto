export interface Content {
    text: string;           // Main post content
    facets?: Facet[];       // Annotations (e.g., mentions, hashtags)
    reply?: ReplyRef;       // If this is a reply to another post
    embeds?: Embed[];       // Embedded media
}

export interface Facet {
    type: string;           // Type of facet, e.g., mention, hashtag
    value: string;          // The value being referenced
    start: number;          // Start index for the facet in the post text
    end: number;            // End index for the facet in the post text
}

export interface ReplyRef {
    rootId: string;           // Reference to the root post
    parentId: string;         // Reference to the parent post
}

export interface Embed {
    type: string;           // Embed type, e.g., image, video
    url: string;            // URL of the embedded content
}

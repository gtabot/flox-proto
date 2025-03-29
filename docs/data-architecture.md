# Flok Data Architecture

## Overview

Flok uses a hybrid architecture combining user-owned repository records with centralized service data, following the AT Protocol patterns.

## Record Storage Locations

| Record Type | Flok PDS | User PDS | Description |
|------------|:--------:|:--------:|-------------|
| `app.flox.feed.post` |  | ✓ | Encrypted Flok post content |
| `app.flox.flok.flok` | ✓ |  | Core Flok configuration and metadata |
| `app.flox.flok.discovery` | ✓ |  | Public discovery settings for a Flok |
| `app.flox.flok.update` | ✓ |  | Record of changes to Flok configuration |
| `app.flox.flok.member` | ✓ |  | Record of Flok membership |
| `app.flox.flok.invite` | ✓ |  | Invitation record and state |
| `app.flox.flok.invite.accept` | ✓ |  | Record of accepted invitation |
| `app.flox.flok.join.request` | ✓ |  | Join request state and queue management |
| `app.flox.flok.join.response` | ✓ |  | Join response state and processing |
| `app.flox.flok.leave` | ✓ |  | Record of user leaving a Flok |
| `app.flox.flok.memberKeys` | ✓ |  | Encrypted Flok key for each member |

## Service Data (Flok PDS)

Data stored centrally in the Flok PDS. This includes private data and operational state needed for the service.

### Private Tables

Some sensitive data is stored in private tables rather than as records:

#### Master Keys

- Flok encryption keys
- Never exposed through API
- Used server-side only

#### Session Management

- Active member sessions
- Authentication tokens
- Expiration tracking

#### Reference Mapping

- Secure flokRef to flokId mapping
- Used for post attribution
- Never exposed through API

### Flok Records

#### Core Flok Record (`app.flox.flok.flok`)

- Contains complete Flok configuration
- Manages membership rules and join types
- Private to the Flok PDS
- Source of truth for Flok state

#### Update Record (`app.flox.flok.flok.update`)

- Tracks changes to Flok configuration
- Records who made changes and when
- Maintains audit history of modifications
- Includes before/after values for changes

#### Discovery Record (`app.flox.flok.flok.discovery`)

- Controls public discoverability of the Flok
- When enabled, provides secure reference to Flok
- No private information exposed
- Managed through controlled functions

### Membership Records

#### Member Record (`app.flox.flok.member`)

- Records current membership status
- Tracks member roles and permissions
- Links to invitation or join request if applicable

#### Join Request/Response (`app.flox.flok.join.*`)

- Manages join request workflow
- Tracks request status and queue position
- Records admin responses and decisions
- Maintains history of join attempts

#### Invite Records (`app.flox.flok.invite.*`)

- Manages invitation workflow
- Tracks invite status and expiration
- Records acceptances and outcomes
- Maintains history of invitations

## Data Flow Examples

### Discovery Flow

1. Flok created with discovery disabled
2. Admin enables discovery
   - System generates secure flokRef/token
   - Updates discovery record with enabled=true
3. Flok becomes discoverable
   - Public can find Flok through discovery
   - Can request to join if joinType allows

### Join Request Flow

1. User discovers Flok and requests to join
   - Flok PDS creates `join.request` record
2. Request processed based on join type
   - If open: Automatic approval
   - If request: Admin reviews and responds
3. Response recorded
   - Flok PDS creates `join.response` record
   - Member record created on approval
   - Request/response records maintained for history

### Invitation Flow

1. Admin creates invite
   - Flok PDS creates `invite` record with pending status
2. User accepts invite
   - Flok PDS creates `accept` record
   - Flok PDS updates `invite` record status
   - Flok PDS creates `member` record

### Record Lifecycle

- Discovery record: Maintained while Flok exists
- Member record: Active while membership maintained
- Join/Invite records: Preserved for audit history
- Update records: Permanent record of changes
- All records managed by Flok PDS

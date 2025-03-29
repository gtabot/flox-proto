# Flok Encryption System

## Overview

Flok uses a secure encryption system that leverages Bluesky's existing DID (Decentralized Identifier) infrastructure. All encryption and decryption happens server-side in the Flok PDS, with access control managed through secure session tokens.

## Key Components

### Master Flok Key (`flokKey`)

- A master symmetric key generated for each Flok
- Stored ONLY in PDS internal storage
- Never leaves the server
- Used to encrypt/decrypt all posts

### Member Session Keys

Each member gets:

- A secure session key for API authentication
- Limited time validity
- Can be revoked instantly
- Used to authorize post access

### Member DID Keys

Each Bluesky user has:

- A public key in their DID document
- A corresponding private key they control
- Used for initial authentication

## How It Works

### Member Authentication

**When a Member Joins**

```
1. Member authenticates with their DID
2. PDS verifies their membership
3. PDS generates a session key
4. Returns session key to member
```

**When a Member Makes Requests**

```
1. Member includes session key in request headers
2. PDS validates session key and membership
3. If valid, processes the request
4. If invalid, rejects with auth error
```

**When a Member is Revoked**

```
1. PDS invalidates their session keys
2. Member can no longer make authorized requests
3. Must re-authenticate if reinstated
```

### Post Encryption

**Creating a Post**

```
1. Member sends post content (with session key)
2. PDS validates session
3. PDS encrypts content with flokKey
4. Stores encrypted content with flokRef
```

**Reading a Post**

```
1. Member requests post (with session key)
2. PDS validates session
3. PDS decrypts post with flokKey
4. Returns decrypted content
```

## Implementation Details

### Key Storage

Private Tables:

```sql
-- Master Flok keys (highly secure internal table)
CREATE TABLE flok_master_keys (
  flok_id TEXT PRIMARY KEY,
  master_key TEXT,     -- The flokKey, never exposed
  created_at TIMESTAMP
);

-- Member sessions (internal table)
CREATE TABLE member_sessions (
  session_id TEXT PRIMARY KEY,
  member_id TEXT,      -- DID of the member
  flok_id TEXT,        -- ID of the Flok
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  UNIQUE(member_id, flok_id)
);

-- flokRef mapping (highly secure internal table)
CREATE TABLE flok_refs (
  flok_ref TEXT PRIMARY KEY,
  flok_id TEXT,
  created_at TIMESTAMP
);
```

PDS Records:

- `memberKeys` record stores each member's encrypted Flok key
- Uses `cid` as key for state management
- Never exposed through member listing operations

### Example Flow

```typescript
// When a member joins/authenticates
async function createMemberSession(memberId: string, flokId: string) {
  // Verify membership
  const member = await db.members.findOne({ 
    member_id: memberId,
    flok_id: flokId 
  });
  if (!member) throw new Error('Not a member');
  
  // Generate session
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  
  // Store session
  await db.member_sessions.insert({
    session_id: sessionId,
    member_id: memberId,
    flok_id: flokId,
    expires_at: expiresAt,
    created_at: new Date()
  });
  
  return { sessionId, expiresAt };
}

// When handling post requests
async function handlePostRequest(postId: string, sessionId: string) {
  // Validate session
  const session = await db.member_sessions.findOne({
    session_id: sessionId,
    expires_at: { $gt: new Date() }
  });
  if (!session) throw new Error('Invalid or expired session');
  
  // Get post content
  const post = await db.posts.findOne({ id: postId });
  if (post.flokId !== session.flok_id) {
    throw new Error('Not authorized for this Flok');
  }
  
  // Decrypt with flokKey
  const flokKey = await getFlokMasterKey(post.flokId);
  return await decryptPost(post.encryptedContent, flokKey);
}

// When revoking access
async function revokeMemberAccess(memberId: string, flokId: string) {
  // Remove all sessions
  await db.member_sessions.deleteMany({
    member_id: memberId,
    flok_id: flokId
  });
}
```

## Security Properties

- All encryption/decryption happens server-side
- `flokKey` never leaves the PDS
- Simple session-based access control
- Instant revocation through session invalidation
- No client-side key management needed
- No exposure of encryption keys

## Notes

- Uses standard session-based auth pattern
- All sensitive operations happen server-side
- Compatible with AT Protocol's security model
- Simpler than distributed key management

### Session Management

**Session Lifecycle**

```
1. Creation:
   - Generated when member authenticates
   - Default 24-hour expiration
   - One active session per member per Flok

2. Validation:
   - Checked on every request
   - Verified against expiration time
   - Validated for specific Flok

3. Expiration:
   - Automatic after expiration time
   - Manual through logout
   - Force-expired on revocation

4. Renewal:
   - Can request new session before expiry
   - Old session invalidated on renewal
   - Maintains continuous access
```

```typescript
// Additional session management functions

// Renew a session before it expires
async function renewSession(currentSessionId: string): Promise<SessionInfo> {
  // Verify current session is still valid
  const currentSession = await db.member_sessions.findOne({
    session_id: currentSessionId,
    expires_at: { $gt: new Date() }
  });
  if (!currentSession) throw new Error('Invalid or expired session');
  
  // Create new session
  const newSession = await createMemberSession(
    currentSession.member_id,
    currentSession.flok_id
  );
  
  // Invalidate old session
  await db.member_sessions.update(
    { session_id: currentSessionId },
    { expires_at: new Date() }
  );
  
  return newSession;
}

// Manually end a session (logout)
async function endSession(sessionId: string): Promise<void> {
  await db.member_sessions.update(
    { session_id: sessionId },
    { expires_at: new Date() }
  );
}

// Clean up expired sessions
async function cleanupExpiredSessions(): Promise<number> {
  const result = await db.member_sessions.deleteMany({
    expires_at: { $lt: new Date() }
  });
  return result.deletedCount;
}

// Get active sessions for a member
async function getActiveSessions(memberId: string, flokId: string): Promise<SessionInfo[]> {
  return await db.member_sessions.find({
    member_id: memberId,
    flok_id: flokId,
    expires_at: { $gt: new Date() }
  });
}
```

### Session Security Properties

1. **Expiration**
   - Sessions automatically expire after 24 hours
   - Can be manually ended by user (logout)
   - Force-expired on membership revocation
   - Regular cleanup of expired sessions

2. **Validation**
   - Every request validates session
   - Checks expiration time
   - Verifies Flok membership
   - Ensures session hasn't been revoked

3. **Management**
   - One active session per member per Flok
   - Can be renewed before expiration
   - Tracks creation and expiration times
   - Supports manual invalidation

4. **Cleanup**
   - Automatic removal of expired sessions
   - Reduces database bloat
   - Maintains security hygiene
   - Regular maintenance task

# Flox Protocol

Backend protocol definitions for Flox — invite-only encrypted communities on the AT Protocol.

## Overview

Flox Protocol enables the creation and management of private, encrypted communities (called "Floks") on the AT Protocol/Bluesky network. It provides a secure and controlled environment for group interactions while leveraging the decentralized nature of the AT Protocol.

## Features

- **Encrypted Communities**: Create and manage private, encrypted group spaces
- **Invite-Only Access**: Control membership through an invitation system
- **Role-Based Permissions**: Support for admin and member roles
- **Secure Communication**: End-to-end encrypted content sharing
- **AT Protocol Integration**: Built on and compatible with Bluesky's AT Protocol

## Installation

```bash
npm install flox-protocol
```

## Usage

The protocol provides several key components for managing Floks:

### Creating a Flok

```typescript
interface CreateFlokContent {
    name: string;               // Display name of the Flok
    description?: string;       // Optional description
    private: boolean;           // Whether the Flok is private
    inviteOnly: boolean;        // Whether joins require invites
    members?: {
        memberIds: string[];    // Initial member DIDs
        adminIds: string[];     // Initial admin DIDs
        maxMembers?: number;    // Optional member cap
    };
}
```

### Managing Posts

```typescript
interface PostContent {
    text: string;           // Main post content
    facets?: Facet[];      // Annotations (e.g., mentions, hashtags)
    reply?: ReplyRef;      // If this is a reply to another post
    embeds?: Embed[];      // Embedded media
}
```

## Protocol Specifications

The protocol includes lexicons for various operations:

- Community Management (`app.flox.flok.*`)
  - Creating Floks
  - Managing Invitations
  - Handling Join Requests
  - Member Management
- Content Management (`app.flox.feed.*`)
  - Post Creation
  - Content Encryption
  - Media Embedding

## Development

### Prerequisites

- Node.js >= 18
- npm or pnpm

### Setup

1. Clone the repository:

```bash
git clone https://github.com/gtabot/flox-protocol.git
cd flox-protocol
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

### Scripts

- `npm run build` - Build the TypeScript code
- `npm run update` - Update dependencies
- `npm run validate` - Validate lexicon definitions

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## Security

If you discover any security issues, please report them via email to <gregg@flox.social>.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

- Author: Gregg Tabot
- Email: <gregg@flox.social>
- GitHub: [@gtabot](https://github.com/gtabot)

## Acknowledgments

Built on the [AT Protocol](https://atproto.com/) by [Bluesky](https://bsky.social/)

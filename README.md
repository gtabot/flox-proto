# Flok Protocol

Protocol definitions for encrypted communities on the AT Protocol.

## Overview

Flok enables the creation and management of private, encrypted communities (Floks) on Bluesky. Each Flok supports:

- End-to-end encrypted content
- Points-based permissions
- Invite-only or open membership
- Customizable thresholds for actions

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm

### Quick Start

```bash
# Clone repository
git clone https://github.com/gtabot/flok-proto.git
cd flok-proto

# Install dependencies
npm install

# Build project
npm run build

# Validate lexicons
npm run validate
```

### Project Structure

```txt
src/
├── lexicons/           # AT Protocol lexicon definitions
│   └── app/
│       └── flox/      # Core Flok operations
├── encrypted_schemas/  # Typescript interfaces for encrypted data
└── scripts/           # Development utilities
```

## Contact

- Email: <gregg@flox.social>
- GitHub: [@gtabot](https://github.com/gtabot)

Built on the [AT Protocol](https://atproto.com/)

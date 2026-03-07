# souls

Install and publish SOUL.md personality templates for OpenClaw agents.

## Installation

```bash
npx souls.sh install <identifier>
```

Or install globally:

```bash
npm install -g souls.sh
```

## API target

By default, the CLI talks to `https://souls.sh`.

For local testing, set `SOULS_API_BASE_URL`:

```bash
SOULS_API_BASE_URL=http://localhost:3000 npx souls.sh list
SOULS_API_BASE_URL=http://localhost:3000 npx souls.sh publish your-username/souls --all
```

## Commands

### `souls install <identifier>`

Install a SOUL.md from GitHub or Moltbook to your workspace.

```bash
# Install from owner/repo (auto-detects name if only one soul exists)
npx souls.sh install souls-sh/souls.sh

# Install a specific soul from a multi-soul repo
npx souls.sh install souls-sh/souls.sh --name marvin

# Install to a specific workspace
npx souls.sh install souls-sh/souls.sh --dir ~/my-workspace

# Back up existing SOUL.md before overwriting
npx souls.sh install souls-sh/souls.sh --backup

# Force overwrite without a backup
npx souls.sh install souls-sh/souls.sh --force

# Install a published Moltbook soul
npx souls.sh install moltbook/agent-name
```

**Install options:**

- `-n, --name <name>` - Soul name for multi-soul GitHub repos
- `-d, --dir <path>` - Install into this workspace path
- `-b, --backup` - Back up existing SOUL.md before overwriting
- `-f, --force` - Overwrite existing SOUL.md without a backup

### `souls publish <identifier>`

Publish a GitHub soul to the souls.sh directory.

```bash
# Root-level SOUL.md
npx souls.sh publish your-username/my-soul

# Multi-soul repo
npx souls.sh publish your-username/souls --name my-soul

# Publish all souls from a multi-soul repo
npx souls.sh publish your-username/souls --all
```

**Publish options:**

- `-n, --name <name>` - Soul name for multi-soul GitHub repos
- `--all` - Publish every soul found in a multi-soul GitHub repo

`--name` and `--all` are mutually exclusive.

Note: Moltbook publishing is API-only (see below).

### `souls list`

Display the top 10 souls from the leaderboard.

```bash
npx souls.sh list
```

### `souls where`

Show the current workspace location and SOUL.md status.

```bash
npx souls.sh where
npx souls.sh where --dir ~/my-workspace
```

## Workspace Resolution

The CLI resolves workspace location in this order:

1. `--dir <path>` - Use this workspace path directly
2. Default: `~/.openclaw/workspace`

## Repository Structure

The CLI supports two repository layouts:

**Single Soul (simple)** - SOUL.md at repo root:

```
my-soul/
  SOUL.md
```

**Multiple Souls** - souls in subdirectories:

```
my-souls/
  souls/
    cheerful/
      SOUL.md
    serious/
      SOUL.md
```

For single-soul repos, the name defaults to the repo name.

## Publish via API

### GitHub

```bash
curl -X POST https://souls.sh/api/publish \
  -H "Content-Type: application/json" \
  -d '{"source":"github","name":"marvin","owner":"myuser","repo":"myrepo"}'
```

### Moltbook (API-only)

```bash
curl -X POST https://souls.sh/api/publish \
  -H "Content-Type: application/json" \
  -d '{"source":"moltbook","name":"agent-name","content":"# Cleaned SOUL.md content"}'
```

## What is SOUL.md?

SOUL.md files define an AI agent's personality, including:

- Core personality traits
- Behavioral guidelines
- Operational boundaries
- Interaction style

Browse available souls at [souls.sh](https://souls.sh)

## Release

For publishing the CLI package:

```bash
npm run release:patch
npm run release:minor
npm run release:major
```

From repo root, use:

```bash
npm run release:cli
```

These scripts run `npm version` and then `npm publish` for the `cli` package.

## License

MIT

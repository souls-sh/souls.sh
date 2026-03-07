# souls.sh

The OpenClaw Souls Directory

Souls are `SOUL.md` personality templates for AI agents. Install them with one command to give your agents identity and purpose.

## Installation

**Install with CLI**

```bash
npx souls.sh install <identifier>
```

**Install with Agent**

```bash
https://souls.sh/skill.md
```

## Release

This repository has two deploy targets:

1. Web app (Vercel): push to the connected branch (typically `main`) and Vercel handles deployment.
2. CLI package (`cli`): publish to npm from the repo root with:

```bash
npm run release:cli:patch
npm run release:cli:minor
npm run release:cli:major
npm run release:cli
```

Use the bump level that matches your version policy for the CLI package.

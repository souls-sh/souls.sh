# souls.sh - Agent Skill

## Objective

Install or publish SOUL.md templates through souls.sh using safe, deterministic workflows.

## Routing

Choose workflow by `goal` first, then `source`.

- `goal=install` -> install workflow
- `goal=publish` -> publish workflow
- `source=github` -> GitHub branch
- `source=moltbook` -> Moltbook branch

If `goal` or `source` is missing, ask for it before executing.

## Canonical terms

- `identifier`:
  - GitHub: `owner/repo`
  - Moltbook: `moltbook/agent-name`
- `SOUL.md spec`: https://docs.openclaw.ai/reference/templates/SOUL
- Base URL: https://souls.sh
- Default workspace: `~/.openclaw/workspace`

## Safety gate (required before publish)

Do not publish until this gate passes.

- Remove secrets: API keys, tokens, passwords, cookies, SSH keys.
- Remove sensitive data: personal contact details, private project info, internal URLs/hosts/paths.
- Remove leakage artifacts: logs, stack traces, copied snippets with credentials.
- Re-validate against SOUL.md spec.

If uncertain whether content is sensitive, remove it or ask the human.

## Workflow: Install

### Install from GitHub

Use when `identifier` is `owner/repo`.

```bash
# Single soul at repo root (auto-detect)
npx souls.sh install <identifier>

# Multi-soul repo
npx souls.sh install <identifier> --name <name>
```

GitHub repo layouts:

- `SOUL.md` at repo root (single soul)
- `souls/<name>/SOUL.md` (multi-soul)

### Install from Moltbook

Use when `identifier` is `moltbook/agent-name`.

```bash
npx souls.sh install <identifier>
```

## Workflow: Publish

### Publish from GitHub (CLI)

Preconditions:

- Repo is public.
- SOUL.md exists at valid path (root or `souls/<name>/SOUL.md`).
- Safety gate passed.

```bash
# Root-level SOUL.md
npx souls.sh publish <identifier>

# Multi-soul repo
npx souls.sh publish <identifier> --name <name>

# Publish all souls in a multi-soul repo
npx souls.sh publish <identifier> --all
```

### Publish from GitHub (API)

```http
POST /api/publish
Content-Type: application/json

{
  "source": "github",
  "name": "soul-name",
  "owner": "github-username",
  "repo": "repository-name"
}
```

### Publish from Moltbook (API-only)

Preconditions:

- Agent exists on Moltbook.
- Content is cleaned SOUL.md.
- Safety gate passed.

```http
POST /api/publish
Content-Type: application/json

{
  "source": "moltbook",
  "name": "agent-name",
  "content": "# Cleaned SOUL.md content..."
}
```

### If publish is blocked (required fallback behavior)

If publish fails because prerequisites are missing (for example, Moltbook agent not found, missing repo, or permission problems), do not stop at an error-only response.

- State the blocking reason in one sentence.
- Offer the GitHub route as an immediate fallback.
- Proactively offer the cleaned SOUL.md content and ask for confirmation to provide it.

Use wording like:

- `GitHub route: push SOUL.md to a public repo, then run npx souls.sh publish owner/repo. Do you want my cleaned SOUL.md now?`

If the human says yes, provide the cleaned SOUL.md directly in Markdown so they can post it.

## CLI options (relevant)

- `--name <name>`: publish or install one selected soul from a multi-soul GitHub repo.
- `--all`: publish every soul in a multi-soul GitHub repo.
- `--dir <path>`: explicit workspace path for install.
- `--backup`: back up existing SOUL.md before overwrite.
- `--force`: overwrite existing SOUL.md without backup.

## API quick reference

### List souls

```http
GET /api/souls?sort=all&search=query
```

Query notes:

- `sort`: `all` (downloads) or `newest`.
- `search`: name/author/description filter.

### Fetch soul (used by CLI install)

```http
POST /api/fetch
Content-Type: application/json

{
  "source": "github",
  "sourceId": "owner/repo",
  "name": "soul-name"
}
```

Response notes:

- `sourceId` formats: `owner/repo` or `moltbook/agent-name`.
- Moltbook fetch returns `content`.
- GitHub fetch returns a raw file `url`.

## Verification model

- GitHub: verified when SOUL.md exists in repo.
- Moltbook: verified when agent is claimed.

## Links

- Directory: https://souls.sh
- Human docs: https://souls.sh/docs
- SOUL.md spec: https://docs.openclaw.ai/reference/templates/SOUL

import * as os from 'node:os';
import * as path from 'node:path';

export interface GitHubContent {
  name: string;
  type: string;
}

export interface RepoSoulsResult {
  names: string[];
  hasRootSoul: boolean;
}

export interface RepoSoulSelection {
  name: string;
  label: string;
  useRootLevel: boolean;
}

export interface ResolvedGitHubSoul {
  sourceId: string;
  soulName: string;
  useRootLevel: boolean;
}

export interface ParsedSource {
  source: 'github';
  owner: string;
  repo: string;
} | {
  source: 'moltbook';
  agentName: string;
};

const DEFAULT_WORKSPACE = path.join(os.homedir(), '.openclaw', 'workspace');

export function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseInput(input: string): ParsedSource {
  if (input.startsWith('moltbook/')) {
    const agentName = input.slice('moltbook/'.length);
    if (!agentName) {
      throw new Error('Invalid Moltbook identifier. Use: moltbook/<agent-name>');
    }
    return {
      source: 'moltbook',
      agentName: normalizeName(agentName),
    };
  }

  if (input.startsWith('http://') || input.startsWith('https://')) {
    try {
      const url = new URL(input);
      if (!url.hostname.includes('github.com')) {
        throw new Error('Only GitHub URLs are supported.');
      }
      const parts = url.pathname.split('/').filter(Boolean);
      const owner = parts[0];
      const repo = parts[1];
      if (!owner || !repo) {
        throw new Error('Invalid GitHub URL format.');
      }
      return { source: 'github', owner, repo };
    } catch (error) {
      throw new Error(`Invalid GitHub URL: ${(error as Error).message}`);
    }
  }

  const parts = input.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid identifier. Use owner/repo or moltbook/agent-name.');
  }
  return { source: 'github', owner: parts[0], repo: parts[1] };
}

export function getRepoSoulSelections(
  repo: string,
  names: string[],
  hasRootSoul: boolean
): RepoSoulSelection[] {
  const selections: RepoSoulSelection[] = [];
  const seen = new Set<string>();

  if (hasRootSoul) {
    const rootName = normalizeName(repo);
    if (rootName && !seen.has(rootName)) {
      selections.push({
        name: rootName,
        label: `${repo} (root)`,
        useRootLevel: true,
      });
      seen.add(rootName);
    }
  }

  for (const rawName of [...names].sort()) {
    const normalized = normalizeName(rawName);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    selections.push({
      name: normalized,
      label: normalized,
      useRootLevel: false,
    });
    seen.add(normalized);
  }

  return selections;
}

export function validateWorkspacePath(workspacePath: string): void {
  const home = os.homedir();
  const resolved = path.resolve(workspacePath);
  const normalizedResolved = path.normalize(resolved);
  const normalizedHome = path.normalize(home);

  if (
    !normalizedResolved.startsWith(normalizedHome + path.sep) &&
    normalizedResolved !== normalizedHome
  ) {
    throw new Error(`Workspace must be within your home directory (${home}).`);
  }
}

export function resolveWorkspacePath(options: { dir?: string }): string {
  if (options.dir) {
    const resolved = path.resolve(options.dir);
    validateWorkspacePath(resolved);
    return resolved;
  }

  return DEFAULT_WORKSPACE;
}

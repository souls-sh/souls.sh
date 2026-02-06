#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import ora from 'ora';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = (process.env.SOULS_API_BASE_URL || 'https://souls.sh').replace(/\/+$/, '');
const FETCH_API = `${API_BASE_URL}/api/fetch`;
const PUBLISH_API = `${API_BASE_URL}/api/publish`;
const SOULS_LIST_API = `${API_BASE_URL}/api/souls`;
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
const VERSION = pkg.version;

// Default workspace location per OpenClaw docs
const DEFAULT_WORKSPACE = path.join(os.homedir(), '.openclaw', 'workspace');

interface SoulListItem {
  name: string;
  source: string;
  sourceId: string;
  authorName: string;
  downloads: number;
}

interface ApiErrorResponse {
  error?: string;
}

interface FetchResponse extends ApiErrorResponse {
  success?: boolean;
  source?: string;
  content?: string;
  url?: string;
  downloads?: number;
}

interface PublishResponse extends ApiErrorResponse {
  success?: boolean;
  message?: string;
}

interface ApiPostResult<T> {
  statusCode: number;
  data: T | null;
}

interface ParsedSource {
  source: 'github' | 'moltbook';
  // GitHub fields
  owner?: string;
  repo?: string;
  // Moltbook fields
  agentName?: string;
}

interface GitHubContent {
  name: string;
  type: string;
}

interface RepoSoulsResult {
  names: string[];
  hasRootSoul: boolean;
}

interface ResolvedGitHubSoul {
  sourceId: string;
  soulName: string;
  useRootLevel: boolean;
}

interface RepoSoulSelection {
  name: string;
  label: string;
  useRootLevel: boolean;
}

function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'souls-cli',
      },
    };

    const client = url.startsWith('http://') ? http : https;
    client
      .get(url, options, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const redirectUrl = res.headers.location;
          if (redirectUrl) {
            fetchUrl(redirectUrl).then(resolve).catch(reject);
            return;
          }
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

function postJson<T>(url: string, payload: unknown): Promise<ApiPostResult<T>> {
  return new Promise((resolve) => {
    const postData = JSON.stringify(payload);
    const client = url.startsWith('http://') ? http : https;

    const req = client.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed: T | null = null;
          try {
            parsed = JSON.parse(data) as T;
          } catch {
            parsed = null;
          }

          resolve({
            statusCode: res.statusCode ?? 0,
            data: parsed,
          });
        });
      }
    );

    req.on('error', () => resolve({ statusCode: 0, data: null }));
    req.write(postData);
    req.end();
  });
}

function parseInput(input: string): ParsedSource {
  // Check for moltbook/<agentname> format
  if (input.startsWith('moltbook/')) {
    const agentName = input.slice('moltbook/'.length);
    if (!agentName) {
      throw new Error('Invalid Moltbook identifier. Use: moltbook/<agent-name>');
    }
    return { source: 'moltbook', agentName: normalizeName(agentName) };
  }

  // GitHub URL
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

  // GitHub owner/repo format
  const parts = input.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid identifier. Use owner/repo or moltbook/agent-name.');
  }

  return { source: 'github', owner: parts[0], repo: parts[1] };
}

async function fetchRepoSouls(owner: string, repo: string): Promise<RepoSoulsResult> {
  const result: RepoSoulsResult = { names: [], hasRootSoul: false };

  // Check for souls/ directory with subdirectories
  const soulsApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/souls`;
  try {
    const response = await fetchUrl(soulsApiUrl);
    const contents: GitHubContent[] = JSON.parse(response);
    result.names = contents.filter((item) => item.type === 'dir').map((item) => item.name);
  } catch {
    // No souls/ directory
  }

  // Check for root-level SOUL.md
  const rootApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/SOUL.md`;
  try {
    await fetchUrl(rootApiUrl);
    result.hasRootSoul = true;
  } catch {
    // No root SOUL.md
  }

  return result;
}

async function fetchFromApi(
  source: string,
  sourceId: string,
  name: string
): Promise<FetchResponse | null> {
  const response = await postJson<FetchResponse>(FETCH_API, { source, sourceId, name });
  return response.data;
}

async function recordDownload(source: string, sourceId: string, name: string): Promise<void> {
  await fetchFromApi(source, sourceId, name);
}

function getNextBackupPath(filePath: string): string {
  const bakPath = `${filePath}.bak`;

  // If .bak doesn't exist, use it
  if (!fs.existsSync(bakPath)) {
    return bakPath;
  }

  // Find next available numbered backup
  let i = 1;
  while (fs.existsSync(`${bakPath}.${i}`)) {
    i++;
  }

  return `${bakPath}.${i}`;
}

function createBackup(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const backupPath = getNextBackupPath(filePath);
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

function validateWorkspacePath(workspacePath: string): void {
  const home = os.homedir();
  const resolved = path.resolve(workspacePath);

  // Normalize paths to handle symlinks and trailing slashes
  const normalizedResolved = path.normalize(resolved);
  const normalizedHome = path.normalize(home);

  // Check if workspace is within home directory
  if (
    !normalizedResolved.startsWith(normalizedHome + path.sep) &&
    normalizedResolved !== normalizedHome
  ) {
    throw new Error(`Workspace must be within your home directory (${home}).`);
  }
}

function resolveWorkspacePath(options: { dir?: string }): string {
  if (options.dir) {
    const resolved = path.resolve(options.dir);
    validateWorkspacePath(resolved);
    return resolved;
  }

  return DEFAULT_WORKSPACE;
}

function getRepoSoulSelections(
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

async function resolveGitHubSoul(
  owner: string,
  repo: string,
  explicitName?: string,
  mode: 'install' | 'publish' = 'install'
): Promise<ResolvedGitHubSoul> {
  const sourceId = `${owner}/${repo}`;

  if (explicitName) {
    const soulName = normalizeName(explicitName);
    if (!soulName) {
      throw new Error('Invalid --name value. Use letters, numbers, or dashes.');
    }

    return {
      sourceId,
      soulName,
      useRootLevel: soulName === normalizeName(repo),
    };
  }

  const { names, hasRootSoul } = await fetchRepoSouls(owner, repo);
  const selections = getRepoSoulSelections(repo, names, hasRootSoul);
  const totalSouls = selections.length;

  if (totalSouls === 0) {
    throw new Error(
      `No souls found in ${owner}/${repo}. Add SOUL.md at repo root or souls/<name>/SOUL.md.`
    );
  }

  if (totalSouls > 1) {
    const available = selections.map((selection) => selection.label).join(', ');
    if (mode === 'publish') {
      throw new Error(
        `Multiple souls found in ${owner}/${repo}. Use --name <name> to publish an individual soul. Use --all to publish all souls. Available souls: ${available}.`
      );
    }
    throw new Error(
      `Multiple souls found in ${owner}/${repo}. Use --name <name>. Available souls: ${available}.`
    );
  }

  return {
    sourceId,
    soulName: selections[0].name,
    useRootLevel: selections[0].useRootLevel,
  };
}

async function fetchGitHubSoulContent(
  owner: string,
  repo: string,
  soulName: string,
  useRootLevelHint: boolean
): Promise<string> {
  const tryRootLevel = useRootLevelHint || soulName === normalizeName(repo);

  async function tryFetchSoul(soulPath: string): Promise<string | undefined> {
    const mainUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${soulPath}`;
    const masterUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${soulPath}`;

    try {
      return await fetchUrl(mainUrl);
    } catch {
      try {
        return await fetchUrl(masterUrl);
      } catch {
        return undefined;
      }
    }
  }

  if (tryRootLevel) {
    const rootContent = await tryFetchSoul('SOUL.md');
    if (rootContent) {
      return rootContent;
    }
  }

  const nestedContent = await tryFetchSoul(`souls/${soulName}/SOUL.md`);
  if (nestedContent) {
    return nestedContent;
  }

  const locations = tryRootLevel
    ? `SOUL.md (root) or souls/${soulName}/SOUL.md`
    : `souls/${soulName}/SOUL.md`;

  throw new Error(`Could not find ${locations} in ${owner}/${repo}.`);
}

async function installSoul(
  input: string,
  options: {
    dir?: string;
    force?: boolean;
    backup?: boolean;
    name?: string;
  }
) {
  const spinner = ora('Fetching SOUL.md...').start();

  try {
    let parsed: ParsedSource;
    try {
      parsed = parseInput(input);
    } catch (error) {
      spinner.fail(chalk.red((error as Error).message));
      process.exit(1);
    }

    let content: string;
    let displaySource: string;
    let sourceId: string;
    let soulName: string;

    if (parsed.source === 'moltbook') {
      const agentName = parsed.agentName!;
      sourceId = `moltbook/${agentName}`;
      soulName = agentName;
      displaySource = sourceId;

      const apiResponse = await fetchFromApi('moltbook', sourceId, soulName);
      if (!apiResponse?.success || !apiResponse.content) {
        spinner.fail(chalk.red(`Soul not found: ${displaySource}`));
        process.exit(1);
      }

      content = apiResponse.content;
    } else {
      const owner = parsed.owner!;
      const repo = parsed.repo!;
      const resolved = await resolveGitHubSoul(owner, repo, options.name);

      sourceId = resolved.sourceId;
      soulName = resolved.soulName;
      displaySource = `${sourceId}/${soulName}`;

      content = await fetchGitHubSoulContent(owner, repo, soulName, resolved.useRootLevel);

      // Best-effort telemetry for leaderboard ranking
      recordDownload('github', sourceId, soulName).catch(() => {});
    }

    let workspacePath: string;
    try {
      workspacePath = resolveWorkspacePath(options);
    } catch (error) {
      spinner.fail(chalk.red((error as Error).message));
      process.exit(1);
    }

    const outputPath = path.join(workspacePath, 'SOUL.md');

    // Ensure workspace directory exists
    if (!fs.existsSync(workspacePath)) {
      fs.mkdirSync(workspacePath, { recursive: true });
    }

    // Handle existing file
    let backupPath: string | null = null;
    if (fs.existsSync(outputPath)) {
      if (options.backup) {
        backupPath = createBackup(outputPath);
      } else if (!options.force) {
        spinner.stop();
        console.log(chalk.yellow(`\nSOUL.md already exists at ${outputPath}`));
        console.log(
          chalk.gray('Use --backup to create a backup and install, or --force to overwrite.')
        );
        process.exit(1);
      }
    }

    fs.writeFileSync(outputPath, content);

    spinner.succeed(chalk.green('SOUL.md installed successfully!'));
    console.log();
    console.log(chalk.gray(`  Workspace: ${workspacePath}`));
    console.log(chalk.gray(`  Location:  ${outputPath}`));
    if (backupPath) {
      console.log(chalk.cyan(`  Backup:    ${backupPath}`));
    }
    console.log(chalk.gray(`  Source:    ${displaySource}`));
    console.log();
  } catch (error) {
    spinner.fail(chalk.red(`Failed to install SOUL.md: ${error}`));
    process.exit(1);
  }
}

async function publishSoul(input: string, options: { name?: string; all?: boolean }) {
  const spinner = ora('Publishing soul...').start();

  try {
    let parsed: ParsedSource;
    try {
      parsed = parseInput(input);
    } catch (error) {
      spinner.fail(chalk.red((error as Error).message));
      process.exit(1);
    }

    if (parsed.source === 'moltbook') {
      spinner.fail(
        chalk.red('Moltbook publishing is API-only. Use POST /api/publish with content.')
      );
      process.exit(1);
    }

    const owner = parsed.owner!;
    const repo = parsed.repo!;
    if (options.name && options.all) {
      spinner.fail(chalk.red('Use either --name <name> or --all, not both.'));
      process.exit(1);
    }

    if (options.all) {
      const { names, hasRootSoul } = await fetchRepoSouls(owner, repo);
      const selections = getRepoSoulSelections(repo, names, hasRootSoul);

      if (selections.length === 0) {
        spinner.fail(
          chalk.red(
            `No souls found in ${owner}/${repo}. Add SOUL.md at repo root or souls/<name>/SOUL.md.`
          )
        );
        process.exit(1);
      }

      const successes: string[] = [];
      const failures: Array<{ label: string; error: string }> = [];

      for (const selection of selections) {
        spinner.text = `Publishing ${selection.label}...`;
        const payload = {
          source: 'github',
          name: selection.name,
          owner,
          repo,
        };

        const { statusCode, data } = await postJson<PublishResponse>(PUBLISH_API, payload);

        if (statusCode === 0 || !data) {
          failures.push({
            label: selection.label,
            error: 'No response from server',
          });
          continue;
        }

        if (statusCode >= 400 || !data.success) {
          failures.push({
            label: selection.label,
            error: data.error || `HTTP ${statusCode}`,
          });
          continue;
        }

        successes.push(selection.label);
      }

      console.log();
      if (successes.length > 0) {
        console.log(chalk.green(`  Published (${successes.length}): ${successes.join(', ')}`));
      }
      if (failures.length > 0) {
        console.log(
          chalk.red(
            `  Failed (${failures.length}): ${failures.map((failure) => failure.label).join(', ')}`
          )
        );
        for (const failure of failures) {
          console.log(chalk.gray(`    - ${failure.label}: ${failure.error}`));
        }
      }
      console.log(chalk.gray(`  View at: ${API_BASE_URL}`));
      console.log();

      if (failures.length > 0) {
        if (successes.length > 0) {
          spinner.warn(chalk.yellow(`Published ${successes.length}/${selections.length} souls.`));
        } else {
          spinner.fail(chalk.red('Failed to publish souls.'));
        }
        process.exit(1);
      }

      spinner.succeed(chalk.green(`Published ${successes.length} souls successfully!`));
      process.exit(0);
    }

    const resolved = await resolveGitHubSoul(owner, repo, options.name, 'publish');
    const payload = {
      source: 'github',
      name: resolved.soulName,
      owner,
      repo,
    };

    const { statusCode, data } = await postJson<PublishResponse>(PUBLISH_API, payload);

    if (statusCode === 0 || !data) {
      spinner.fail(chalk.red('Failed to publish soul. Check your internet connection.'));
      process.exit(1);
    }

    if (statusCode >= 400 || !data.success) {
      spinner.fail(chalk.red(data.error || `Failed to publish soul (HTTP ${statusCode}).`));
      process.exit(1);
    }

    spinner.succeed(chalk.green('Soul published successfully!'));
    console.log();
    console.log(chalk.gray(`  Source: ${resolved.sourceId}/${resolved.soulName}`));
    console.log(chalk.gray(`  View at: ${API_BASE_URL}`));
    console.log();
    process.exit(0);
  } catch (error) {
    spinner.fail(chalk.red(`Failed to publish soul: ${error}`));
    process.exit(1);
  }
}

async function listSouls() {
  const spinner = ora('Fetching souls...').start();

  try {
    const response = await fetchUrl(SOULS_LIST_API);
    const souls = JSON.parse(response);

    spinner.stop();
    console.log(chalk.bold('\n  SOULS LEADERBOARD\n'));
    console.log(
      chalk.gray('  #   ') + chalk.white('SOUL') + ' '.repeat(24) + chalk.gray('DOWNLOADS')
    );
    console.log(chalk.gray('  ' + '-'.repeat(50)));

    souls.slice(0, 10).forEach((soul: SoulListItem, i: number) => {
      const rank = String(i + 1).padStart(2, ' ');
      const name = soul.name.padEnd(18, ' ');
      const identifier = soul.sourceId.slice(0, 26).padEnd(26, ' ');
      const downloads = String(soul.downloads).padStart(8, ' ');
      console.log(
        chalk.gray(`  ${rank}  `) +
          chalk.white(name) +
          chalk.gray(identifier) +
          chalk.cyan(downloads)
      );
    });

    console.log(chalk.gray(`\n  View more at ${API_BASE_URL}\n`));
  } catch {
    spinner.fail(chalk.red('Failed to fetch souls. Check your internet connection.'));
    process.exit(1);
  }
}

async function showWorkspace(options: { dir?: string }) {
  let workspacePath: string;
  try {
    workspacePath = resolveWorkspacePath(options);
  } catch (error) {
    console.log(chalk.red(`\n  ${(error as Error).message}\n`));
    process.exit(1);
  }

  const soulPath = path.join(workspacePath, 'SOUL.md');

  console.log(chalk.bold('\n  Current Workspace\n'));
  console.log(chalk.gray(`  Path:  ${workspacePath}`));

  if (fs.existsSync(soulPath)) {
    const stats = fs.statSync(soulPath);
    console.log(chalk.green('  SOUL.md: ✓ exists'));
    console.log(chalk.gray(`  Modified: ${stats.mtime.toLocaleDateString()}`));
  } else {
    console.log(chalk.yellow('  SOUL.md: ✗ not found'));
  }

  console.log();
}

const program = new Command();

program
  .name('souls')
  .description('Install and publish SOUL.md personality templates for OpenClaw agents')
  .version(VERSION);

program
  .command('install <identifier>')
  .description('Install a SOUL.md to your workspace')
  .option('-d, --dir <path>', 'Path to workspace directory')
  .option('-n, --name <name>', 'Soul name for multi-soul GitHub repos')
  .option('-b, --backup', 'Back up existing SOUL.md before overwriting')
  .option('-f, --force', 'Overwrite existing SOUL.md without a backup')
  .action(installSoul);

program
  .command('publish <identifier>')
  .description('Publish a GitHub soul to souls.sh')
  .option('-n, --name <name>', 'Soul name for multi-soul GitHub repos')
  .option('--all', 'Publish all souls from a multi-soul GitHub repo')
  .action(publishSoul);

program
  .command('list')
  .alias('ls')
  .description('List popular souls from souls.sh')
  .action(listSouls);

program
  .command('where')
  .description('Show workspace location and SOUL.md status')
  .option('-d, --dir <path>', 'Path to workspace directory')
  .action(showWorkspace);

program.parse();

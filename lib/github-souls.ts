const GITHUB_API_BASE_URL = 'https://api.github.com';
const GITHUB_OWNER_PATTERN = /^(?!-)[A-Za-z0-9-]{1,39}(?<!-)$/;
const GITHUB_REPO_PATTERN = /^(?![.-])(?!.*\.\.)(?!.*\/)[A-Za-z0-9_.-]{1,100}$/;

export type GitHubSoulLocation = 'root' | 'souls';

export interface GitHubSoulMetadata {
  version: 1;
  location: GitHubSoulLocation;
  branch: string;
  canonicalName: string;
  contentPath: string;
  htmlUrl: string;
}

interface GitHubRepoResponse {
  default_branch: string;
}

interface GitHubContentsFileResponse {
  type: string;
  path: string;
  html_url: string;
  content?: string;
  encoding?: string;
}

type GitHubFetchOptions = RequestInit & {
  next?: {
    revalidate: number;
  };
};

export type GitHubSoulVerificationResult =
  | {
      kind: 'match';
      metadata: GitHubSoulMetadata;
    }
  | {
      kind: 'root-name-mismatch';
      canonicalName: string;
    }
  | {
      kind: 'missing';
    };

export function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function assertValidGitHubCoordinates(owner: string, repo: string): void {
  if (!GITHUB_OWNER_PATTERN.test(owner)) {
    throw new Error('Invalid GitHub owner.');
  }

  if (!GITHUB_REPO_PATTERN.test(repo)) {
    throw new Error('Invalid GitHub repo.');
  }
}

export function parseGitHubSourceId(sourceId: string): { owner: string; repo: string } | null {
  const parts = sourceId.split('/');
  if (parts.length !== 2) {
    return null;
  }

  const [owner, repo] = parts;

  try {
    assertValidGitHubCoordinates(owner, repo);
    return { owner, repo };
  } catch {
    return null;
  }
}

export function getGitHubSoulContentPath(
  location: GitHubSoulLocation,
  canonicalName: string
): string {
  return location === 'root' ? 'SOUL.md' : `souls/${canonicalName}/SOUL.md`;
}

export function createGitHubSoulMetadata({
  branch,
  canonicalName,
  location,
  htmlUrl,
}: {
  branch: string;
  canonicalName: string;
  location: GitHubSoulLocation;
  htmlUrl: string;
}): GitHubSoulMetadata {
  return {
    version: 1,
    branch,
    canonicalName,
    location,
    contentPath: getGitHubSoulContentPath(location, canonicalName),
    htmlUrl,
  };
}

export function parseGitHubSoulMetadata(value: unknown): GitHubSoulMetadata | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<GitHubSoulMetadata>;
  if (candidate.version !== 1) {
    return null;
  }

  if (candidate.location !== 'root' && candidate.location !== 'souls') {
    return null;
  }

  if (typeof candidate.branch !== 'string' || candidate.branch.length === 0) {
    return null;
  }

  if (typeof candidate.canonicalName !== 'string' || candidate.canonicalName.length === 0) {
    return null;
  }

  const normalizedCanonicalName = normalizeName(candidate.canonicalName);
  if (!normalizedCanonicalName || normalizedCanonicalName !== candidate.canonicalName) {
    return null;
  }

  if (typeof candidate.contentPath !== 'string' || typeof candidate.htmlUrl !== 'string') {
    return null;
  }

  const expectedContentPath = getGitHubSoulContentPath(candidate.location, normalizedCanonicalName);
  if (candidate.contentPath !== expectedContentPath) {
    return null;
  }

  return {
    version: 1,
    location: candidate.location,
    branch: candidate.branch,
    canonicalName: normalizedCanonicalName,
    contentPath: candidate.contentPath,
    htmlUrl: candidate.htmlUrl,
  };
}

function buildGitHubApiUrl(pathSegments: string[], searchParams?: Record<string, string>): string {
  const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
  const url = new URL(`${GITHUB_API_BASE_URL}/${encodedPath}`);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

function githubRequestHeaders(): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'souls.sh',
  };
}

async function fetchGitHubRepo(owner: string, repo: string): Promise<GitHubRepoResponse | null> {
  const response = await fetch(buildGitHubApiUrl(['repos', owner, repo]), {
    headers: githubRequestHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub repo lookup failed with HTTP ${response.status}.`);
  }

  return (await response.json()) as GitHubRepoResponse;
}

async function fetchGitHubContentsFile(
  owner: string,
  repo: string,
  contentPath: string,
  branch: string,
  options?: GitHubFetchOptions
): Promise<GitHubContentsFileResponse | null> {
  const pathSegments = ['repos', owner, repo, 'contents', ...contentPath.split('/')];
  const response = await fetch(buildGitHubApiUrl(pathSegments, { ref: branch }), {
    ...options,
    headers: githubRequestHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `GitHub content lookup failed for ${contentPath} with HTTP ${response.status}.`
    );
  }

  const data = (await response.json()) as GitHubContentsFileResponse;
  if (data.type !== 'file') {
    return null;
  }

  return data;
}

function decodeGitHubContent(content: string, encoding: string | undefined): string {
  if (encoding !== 'base64') {
    throw new Error(`Unsupported GitHub content encoding: ${encoding ?? 'unknown'}.`);
  }

  return Buffer.from(content.replace(/\n/g, ''), 'base64').toString('utf-8');
}

export async function verifyGitHubSoul(
  owner: string,
  repo: string,
  requestedName: string
): Promise<GitHubSoulVerificationResult> {
  assertValidGitHubCoordinates(owner, repo);

  const repoData = await fetchGitHubRepo(owner, repo);
  if (!repoData?.default_branch) {
    return { kind: 'missing' };
  }

  const branch = repoData.default_branch;
  const canonicalName = normalizeName(repo);

  if (requestedName === canonicalName) {
    const rootFile = await fetchGitHubContentsFile(owner, repo, 'SOUL.md', branch);
    if (rootFile?.html_url) {
      return {
        kind: 'match',
        metadata: createGitHubSoulMetadata({
          branch,
          canonicalName,
          location: 'root',
          htmlUrl: rootFile.html_url,
        }),
      };
    }
  }

  const nestedFile = await fetchGitHubContentsFile(
    owner,
    repo,
    getGitHubSoulContentPath('souls', requestedName),
    branch
  );
  if (nestedFile?.html_url) {
    return {
      kind: 'match',
      metadata: createGitHubSoulMetadata({
        branch,
        canonicalName: requestedName,
        location: 'souls',
        htmlUrl: nestedFile.html_url,
      }),
    };
  }

  const rootFile = await fetchGitHubContentsFile(owner, repo, 'SOUL.md', branch);
  if (rootFile) {
    return {
      kind: 'root-name-mismatch',
      canonicalName,
    };
  }

  return { kind: 'missing' };
}

export async function fetchGitHubSoulContent(
  owner: string,
  repo: string,
  metadata: GitHubSoulMetadata,
  options?: GitHubFetchOptions
): Promise<string | null> {
  assertValidGitHubCoordinates(owner, repo);

  const file = await fetchGitHubContentsFile(
    owner,
    repo,
    metadata.contentPath,
    metadata.branch,
    options
  );
  if (!file?.content) {
    return null;
  }

  return decodeGitHubContent(file.content, file.encoding);
}

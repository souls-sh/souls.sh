import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  assertValidGitHubCoordinates,
  createGitHubSoulMetadata,
  fetchGitHubSoulContent,
  getGitHubSoulContentPath,
  normalizeName,
  parseGitHubSourceId,
  parseGitHubSoulMetadata,
  verifyGitHubSoul,
} from '../lib/github-souls';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function textResponse(status: number, body = '') {
  return new Response(body, { status });
}

describe('normalizeName', () => {
  test('normalizes casing and separators', () => {
    expect(normalizeName('  My__Soul!! ')).toBe('my-soul');
  });
});

describe('validation and metadata parsing', () => {
  test('validates github coordinates', () => {
    expect(() => assertValidGitHubCoordinates('owner-1', 'repo_name')).not.toThrow();
    expect(() => assertValidGitHubCoordinates('-bad-owner', 'repo')).toThrow('Invalid GitHub owner.');
  });

  test('parses GitHub source ids', () => {
    expect(parseGitHubSourceId('owner/repo')).toEqual({ owner: 'owner', repo: 'repo' });
    expect(parseGitHubSourceId('bad/owner/repo')).toBeNull();
  });

  test('builds content path by location', () => {
    expect(getGitHubSoulContentPath('root', 'my-soul')).toBe('SOUL.md');
    expect(getGitHubSoulContentPath('souls', 'my-soul')).toBe('souls/my-soul/SOUL.md');
  });

  test('returns metadata only when canonicalized values are consistent', () => {
    const metadata = createGitHubSoulMetadata({
      branch: 'main',
      canonicalName: 'my-soul',
      location: 'souls',
      htmlUrl: 'https://github.com/owner/repo/blob/main/souls/my-soul/SOUL.md',
    });

    expect(parseGitHubSoulMetadata(metadata)).toEqual(metadata);
    expect(
      parseGitHubSoulMetadata({
        ...metadata,
        canonicalName: 'My-Soul',
      })
    ).toBeNull();
    expect(
      parseGitHubSoulMetadata({
        ...metadata,
        contentPath: 'invalid/path.md',
      })
    ).toBeNull();
  });
});

describe('verifyGitHubSoul', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('resolves nested soul when root request is not canonical', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      const resolved = String(url);
      if (resolved === 'https://api.github.com/repos/owner/repo') {
        return jsonResponse(200, { default_branch: 'main' });
      }

      if (
        resolved === 'https://api.github.com/repos/owner/repo/contents/souls/my-soul/SOUL.md?ref=main'
      ) {
        return jsonResponse(200, {
          type: 'file',
          path: 'souls/my-soul/SOUL.md',
          html_url: 'https://github.com/owner/repo/blob/main/souls/my-soul/SOUL.md',
        });
      }

      return textResponse(404);
    });

    const result = await verifyGitHubSoul('owner', 'repo', 'my-soul');

    expect(result.kind).toBe('match');
    if (result.kind !== 'match') {
      throw new Error('Expected match');
    }
    expect(result.metadata).toEqual({
      version: 1,
      location: 'souls',
      branch: 'main',
      canonicalName: 'my-soul',
      contentPath: 'souls/my-soul/SOUL.md',
      htmlUrl: 'https://github.com/owner/repo/blob/main/souls/my-soul/SOUL.md',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('returns root-name-mismatch when root soul exists but requested name is different', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      const resolved = String(url);
      if (resolved === 'https://api.github.com/repos/owner/my-repo') {
        return jsonResponse(200, { default_branch: 'main' });
      }

      if (
        resolved ===
        'https://api.github.com/repos/owner/my-repo/contents/souls/custom/SOUL.md?ref=main'
      ) {
        return textResponse(404);
      }

      if (
        resolved ===
        'https://api.github.com/repos/owner/my-repo/contents/SOUL.md?ref=main'
      ) {
        return jsonResponse(200, {
          type: 'file',
          path: 'SOUL.md',
          html_url: 'https://github.com/owner/my-repo/blob/main/SOUL.md',
        });
      }

      return textResponse(404);
    });

    const result = await verifyGitHubSoul('owner', 'my-repo', 'custom');

    expect(result).toEqual({
      kind: 'root-name-mismatch',
      canonicalName: 'my-repo',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test('returns missing when neither nested nor root soul exists', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      const resolved = String(url);
      if (resolved === 'https://api.github.com/repos/owner/repo') {
        return jsonResponse(200, { default_branch: 'main' });
      }
      return textResponse(404);
    });

    const result = await verifyGitHubSoul('owner', 'repo', 'missing');

    expect(result).toEqual({ kind: 'missing' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe('fetchGitHubSoulContent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('fetches and decodes base64 content', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const rawMarkdown = '# Test\\ncontent';
    const encoded = Buffer.from(rawMarkdown).toString('base64');

    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        type: 'file',
        path: 'SOUL.md',
        html_url: 'https://github.com/owner/repo/blob/main/SOUL.md',
        content: encoded,
        encoding: 'base64',
      })
    );

    const content = await fetchGitHubSoulContent('owner', 'repo', {
      version: 1,
      location: 'root',
      branch: 'main',
      canonicalName: 'repo',
      contentPath: 'SOUL.md',
      htmlUrl: 'https://github.com/owner/repo/blob/main/SOUL.md',
    });

    expect(content).toBe(rawMarkdown);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('throws for unsupported encoding', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        type: 'file',
        path: 'SOUL.md',
        html_url: 'https://github.com/owner/repo/blob/main/SOUL.md',
        content: 'dGVzdA==',
        encoding: 'utf8',
      })
    );

    await expect(
      fetchGitHubSoulContent('owner', 'repo', {
        version: 1,
        location: 'root',
        branch: 'main',
        canonicalName: 'repo',
        contentPath: 'SOUL.md',
        htmlUrl: 'https://github.com/owner/repo/blob/main/SOUL.md',
      })
    ).rejects.toThrow('Unsupported GitHub content encoding: utf8.');
  });
});

import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  getRepoSoulSelections,
  normalizeName,
  parseInput,
  resolveWorkspacePath,
  validateWorkspacePath,
} from '../src/helpers';

describe('parseInput', () => {
  test('normalizes moltbook identifiers', () => {
    expect(parseInput('moltbook/My Agent')).toEqual({
      source: 'moltbook',
      agentName: 'my-agent',
    });
  });

  test('rejects empty moltbook identifier', () => {
    expect(() => parseInput('moltbook/')).toThrow('Invalid Moltbook identifier.');
  });

  test('supports github owner/repo input', () => {
    expect(parseInput('owner/repo')).toEqual({
      source: 'github',
      owner: 'owner',
      repo: 'repo',
    });
  });

  test('supports github URLs', () => {
    expect(parseInput('https://github.com/owner/repo')).toEqual({
      source: 'github',
      owner: 'owner',
      repo: 'repo',
    });
  });

  test('rejects invalid identifiers', () => {
    expect(() => parseInput('invalid-format')).toThrow('Invalid identifier');
    expect(() => parseInput('https://example.com/owner/repo')).toThrow(
      'Only GitHub URLs are supported.'
    );
  });
});

describe('getRepoSoulSelections', () => {
  test('deduplicates root and nested names', () => {
    const selections = getRepoSoulSelections('My Repo', ['my-repo', 'other'], true);

    expect(selections).toEqual([
      {
        name: 'my-repo',
        label: 'My Repo (root)',
        useRootLevel: true,
      },
      {
        name: 'other',
        label: 'other',
        useRootLevel: false,
      },
    ]);
  });
});

describe('workspace helpers', () => {
  test('normalizes to default workspace when no dir is provided', () => {
    const expected = path.join(os.homedir(), '.openclaw', 'workspace');
    expect(resolveWorkspacePath({})).toBe(expected);
  });

  test('returns provided directory when within home', () => {
    const input = path.join(os.homedir(), 'projects');
    expect(resolveWorkspacePath({ dir: input })).toBe(path.resolve(input));
  });

  test('rejects directories outside the home directory', () => {
    const outsideHome = path.join(path.parse(os.homedir()).root, 'tmp');
    expect(() => resolveWorkspacePath({ dir: outsideHome })).toThrow('Workspace must be within');
    expect(() => validateWorkspacePath(outsideHome)).toThrow('Workspace must be within');
  });
});

describe('normalizeName', () => {
  test('matches existing normalization rules', () => {
    expect(normalizeName('  My__Soul!! ')).toBe('my-soul');
  });
});

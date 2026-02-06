import { Prisma, PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const OWNER = 'souls-sh';
const REPO = 'souls.sh';
const SOULS_DIR = path.join(__dirname, '..', 'souls');

interface BaseSoul {
  name: string;
  description: string;
  content: string;
}

interface SeedSoul {
  name: string;
  description: string;
  content?: string | null;
  downloads: number;
  source: 'github' | 'moltbook';
  sourceId: string;
  sourceUrl: string;
  authorId: string;
  authorName: string;
  authorUrl: string;
  verified: boolean;
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
}

function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseSoulFromDir(dirName: string): BaseSoul | null {
  const soulPath = path.join(SOULS_DIR, dirName, 'SOUL.md');
  if (!fs.existsSync(soulPath)) return null;

  const content = fs.readFileSync(soulPath, 'utf-8');

  // Parse frontmatter summary: supports "..." or '...'
  const summaryMatch = content.match(/^---[\s\S]*?summary:\s*(?:"([^"]+)"|'([^']+)')[\s\S]*?---/);
  if (!summaryMatch) return null;

  const summary = summaryMatch[1] || summaryMatch[2];
  const separatorIndex = summary.indexOf('—');

  const displayName = separatorIndex > 0 ? summary.slice(0, separatorIndex).trim() : dirName;
  const description = separatorIndex > 0 ? summary.slice(separatorIndex + 1).trim() : summary;

  // Name is the normalized directory name
  const name = normalizeName(dirName);

  return {
    name,
    description: `${displayName} — ${description}`,
    content,
  };
}

function buildGitHubSoul(base: BaseSoul): SeedSoul {
  return {
    name: base.name,
    description: base.description,
    content: null,
    downloads: Math.floor(Math.random() * 500),
    source: 'github',
    sourceId: `${OWNER}/${REPO}`,
    sourceUrl: `https://github.com/${OWNER}/${REPO}`,
    authorId: OWNER,
    authorName: OWNER,
    authorUrl: `https://github.com/${OWNER}`,
    verified: true,
    metadata: { repo: REPO, location: 'souls' } as Prisma.InputJsonValue,
  };
}

function buildMoltbookSoul(base: BaseSoul): SeedSoul {
  const karma = Math.floor(Math.random() * 5000) + 50;
  const followers = Math.floor(Math.random() * 2000) + 10;
  return {
    name: base.name,
    description: base.description,
    content: base.content,
    downloads: Math.floor(Math.random() * 500),
    source: 'moltbook',
    sourceId: `moltbook/${base.name}`,
    sourceUrl: `https://moltbook.com/u/${base.name}`,
    authorId: `moltbook-${base.name}`,
    authorName: base.name,
    authorUrl: `https://moltbook.com/u/${base.name}`,
    verified: Math.random() > 0.5,
    metadata: { karma, followers } as Prisma.InputJsonValue,
  };
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function main() {
  console.log('Seeding database...');

  // Read all soul directories
  const dirs = fs.readdirSync(SOULS_DIR).filter((d) => {
    const stat = fs.statSync(path.join(SOULS_DIR, d));
    return stat.isDirectory();
  });

  // Parse all souls
  const allSouls = dirs.map(parseSoulFromDir).filter((s): s is BaseSoul => s !== null);

  // Pick 4 GitHub souls and 4 Moltbook souls
  const shuffled = shuffle(allSouls);
  const githubBases = shuffled.slice(0, 4);
  const moltbookBases = shuffled.slice(4, 8);
  const selectedSouls: SeedSoul[] = [
    ...githubBases.map(buildGitHubSoul),
    ...moltbookBases.map(buildMoltbookSoul),
  ];

  for (const soul of selectedSouls) {
    await prisma.soul.upsert({
      where: {
        source_sourceId_name: {
          source: soul.source,
          sourceId: soul.sourceId,
          name: soul.name,
        },
      },
      update: { description: soul.description },
      create: soul,
    });
    console.log(`Created/updated soul: ${soul.name} (${soul.downloads} downloads)`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

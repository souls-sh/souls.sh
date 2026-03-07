import { prisma } from '@/lib/db';
import { normalizeName, verifyGitHubSoul } from '@/lib/github-souls';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

const MAX_CONTENT_LENGTH = 50000; // 50KB max for SOUL.md
const MAX_DESCRIPTION_LENGTH = 500;
const MOLTBOOK_BOT_API_KEY = process.env.MOLTBOOK_BOT_API_KEY;

interface MoltbookAgent {
  id: string;
  name: string;
  description?: string;
  karma?: number;
  is_claimed?: boolean;
  follower_count?: number;
  following_count?: number;
  avatar_url?: string | null;
  owner?: {
    x_handle?: string;
    x_name?: string;
  };
}

interface MoltbookProfileResponse {
  success: boolean;
  agent?: MoltbookAgent;
  error?: string;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function revalidatePublishedSoulPath(
  source: 'github' | 'moltbook',
  sourceId: string,
  name: string
): void {
  try {
    // Refresh homepage list and soul detail route after a publish.
    revalidatePath('/');
    if (source === 'github') {
      const [owner, repo] = sourceId.split('/');
      if (owner && repo) {
        revalidatePath(`/${owner}/${repo}/${name}`);
      }
    } else {
      revalidatePath(`/moltbook/${name}`);
    }
  } catch (error) {
    console.warn('Failed to revalidate published soul paths:', error);
  }
}

async function lookupMoltbookAgent(name: string): Promise<MoltbookAgent | null> {
  if (!MOLTBOOK_BOT_API_KEY) {
    console.error('MOLTBOOK_BOT_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://www.moltbook.com/api/v1/agents/profile?name=${encodeURIComponent(name)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${MOLTBOOK_BOT_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Moltbook profile lookup failed:', response.status);
      return null;
    }

    const data: MoltbookProfileResponse = await response.json();
    if (!data.success || !data.agent) {
      return null;
    }

    return data.agent;
  } catch (error) {
    console.error('Moltbook profile lookup error:', error);
    return null;
  }
}

function extractDescription(content: string): string | undefined {
  const lines = content.split('\n').filter((line) => line.trim());

  let startIndex = 0;
  if (lines[0]?.startsWith('#')) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#') && !line.startsWith('-') && !line.startsWith('*')) {
      return line.slice(0, 200);
    }
  }

  return undefined;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, name } = body;

    // Validate required fields
    if (!source || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: source, name' },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (source !== 'github' && source !== 'moltbook') {
      return NextResponse.json(
        { error: 'Invalid source. Must be "github" or "moltbook"' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const normalizedName = normalizeName(name);
    if (!normalizedName) {
      return NextResponse.json(
        { error: 'Invalid name: must contain at least one alphanumeric character' },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (source === 'moltbook') {
      return handleMoltbook(body, normalizedName);
    } else {
      return handleGitHub(body, normalizedName);
    }
  } catch (error) {
    console.error('Publish soul error:', error);
    return NextResponse.json(
      { error: 'Failed to publish soul' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

async function handleMoltbook(body: { name: string; content?: string }, normalizedName: string) {
  const { name, content } = body;

  if (!content) {
    return NextResponse.json(
      { error: 'Missing required field: content (SOUL.md content)' },
      { status: 400, headers: corsHeaders() }
    );
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `Content too large. Maximum size is ${MAX_CONTENT_LENGTH} characters.` },
      { status: 400, headers: corsHeaders() }
    );
  }

  // Lookup the agent on moltbook to verify they exist
  const agent = await lookupMoltbookAgent(name);
  if (!agent) {
    return NextResponse.json(
      { error: `Agent "${name}" not found on moltbook` },
      { status: 404, headers: corsHeaders() }
    );
  }

  const description = extractDescription(content);
  const sourceId = `moltbook/${normalizedName}`;

  // Build metadata
  const metadata = {
    karma: agent.karma,
    followers: agent.follower_count,
    following: agent.following_count,
    ownerHandle: agent.owner?.x_handle,
    ownerName: agent.owner?.x_name,
  };

  // Upsert the soul
  const soul = await prisma.soul.upsert({
    where: {
      source_sourceId_name: {
        source: 'moltbook',
        sourceId,
        name: normalizedName,
      },
    },
    update: {
      content,
      description,
      sourceUrl: `https://moltbook.com/u/${agent.name}`,
      authorName: agent.name,
      authorAvatar: agent.avatar_url,
      verified: agent.is_claimed ?? false,
      metadata,
      updatedAt: new Date(),
    },
    create: {
      name: normalizedName,
      content,
      description,
      source: 'moltbook',
      sourceId,
      sourceUrl: `https://moltbook.com/u/${agent.name}`,
      authorId: agent.id,
      authorName: agent.name,
      authorUrl: `https://moltbook.com/u/${agent.name}`,
      authorAvatar: agent.avatar_url,
      verified: agent.is_claimed ?? false,
      metadata,
    },
  });

  revalidatePublishedSoulPath('moltbook', sourceId, normalizedName);

  return NextResponse.json(
    {
      success: true,
      soul: {
        id: soul.id,
        name: soul.name,
        source: soul.source,
        sourceId: soul.sourceId,
      },
      message: `Soul published! Install with: npx souls.sh install moltbook/${normalizedName}`,
    },
    { status: 201, headers: corsHeaders() }
  );
}

async function handleGitHub(
  body: { name: string; owner?: string; repo?: string; description?: string },
  normalizedName: string
) {
  const { owner, repo, description } = body;

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'Missing required fields for GitHub: owner, repo' },
      { status: 400, headers: corsHeaders() }
    );
  }

  let verificationResult: Awaited<ReturnType<typeof verifyGitHubSoul>>;
  try {
    verificationResult = await verifyGitHubSoul(owner, repo, normalizedName);
  } catch (error) {
    const message = (error as Error).message;
    const status = message.startsWith('Invalid GitHub') ? 400 : 502;

    return NextResponse.json(
      {
        error: status === 400 ? message : 'GitHub verification failed. Try again later.',
      },
      { status, headers: corsHeaders() }
    );
  }

  if (verificationResult.kind === 'root-name-mismatch') {
    return NextResponse.json(
      {
        error: `Root-level SOUL.md is canonicalized to "${verificationResult.canonicalName}". Publish it with --name ${verificationResult.canonicalName} or omit --name.`,
      },
      { status: 400, headers: corsHeaders() }
    );
  }

  if (verificationResult.kind === 'missing') {
    return NextResponse.json(
      {
        error: `SOUL.md not found. Expected at souls/${normalizedName}/SOUL.md or SOUL.md in repo root`,
      },
      { status: 404, headers: corsHeaders() }
    );
  }

  const safeDescription = description?.slice(0, MAX_DESCRIPTION_LENGTH);
  const sourceId = `${owner}/${repo}`;
  const canonicalName = verificationResult.metadata.canonicalName;
  const metadata = verificationResult.metadata as unknown as Prisma.InputJsonValue;

  const soul = await prisma.soul.upsert({
    where: {
      source_sourceId_name: {
        source: 'github',
        sourceId,
        name: canonicalName,
      },
    },
    update: {
      description: safeDescription,
      sourceUrl: `https://github.com/${owner}/${repo}`,
      authorId: owner,
      authorName: owner,
      authorUrl: `https://github.com/${owner}`,
      verified: true,
      metadata,
      updatedAt: new Date(),
    },
    create: {
      name: canonicalName,
      description: safeDescription,
      source: 'github',
      sourceId,
      sourceUrl: `https://github.com/${owner}/${repo}`,
      authorId: owner,
      authorName: owner,
      authorUrl: `https://github.com/${owner}`,
      verified: true,
      metadata,
    },
  });

  revalidatePublishedSoulPath('github', sourceId, canonicalName);

  return NextResponse.json(
    {
      success: true,
      soul: {
        id: soul.id,
        name: soul.name,
        source: soul.source,
        sourceId: soul.sourceId,
      },
      message: `Soul published! Install with: npx souls.sh install ${owner}/${repo}`,
    },
    { status: 201, headers: corsHeaders() }
  );
}

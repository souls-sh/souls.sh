import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, sourceId, name } = body;

    if (!source || !sourceId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: source, sourceId, name' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const normalizedName = normalizeName(name);

    const soul = await prisma.soul.findUnique({
      where: {
        source_sourceId_name: {
          source,
          sourceId,
          name: normalizedName,
        },
      },
    });

    if (!soul) {
      return NextResponse.json(
        { error: 'Soul not found' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Record the download and increment counter
    await prisma.$transaction([
      prisma.download.create({
        data: { soulId: soul.id },
      }),
      prisma.soul.update({
        where: { id: soul.id },
        data: { downloads: { increment: 1 } },
      }),
    ]);

    // For moltbook souls, return content directly
    if (soul.source === 'moltbook' && soul.content) {
      return NextResponse.json(
        {
          success: true,
          source: 'moltbook',
          content: soul.content,
          downloads: soul.downloads + 1,
        },
        { headers: corsHeaders() }
      );
    }

    // For GitHub souls, return the raw URL
    const metadata = soul.metadata as { repo?: string; location?: 'souls' | 'root' } | null;
    const location = metadata?.location || 'root';

    // sourceId is "owner/repo"
    const [owner, repo] = sourceId.split('/');

    let soulUrl: string;
    if (location === 'souls') {
      soulUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/souls/${soul.name}/SOUL.md`;
    } else {
      soulUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/SOUL.md`;
    }

    return NextResponse.json(
      {
        success: true,
        source: 'github',
        url: soulUrl,
        downloads: soul.downloads + 1,
      },
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to record download' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

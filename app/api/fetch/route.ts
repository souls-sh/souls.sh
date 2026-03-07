import { prisma } from '@/lib/db';
import {
  fetchGitHubSoulContent,
  normalizeName,
  parseGitHubSourceId,
  parseGitHubSoulMetadata,
} from '@/lib/github-souls';
import { type NextRequest, NextResponse } from 'next/server';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
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

    let content: string;

    if (soul.source === 'moltbook') {
      if (!soul.content) {
        return NextResponse.json(
          { error: 'SOUL.md content unavailable' },
          { status: 500, headers: corsHeaders() }
        );
      }

      content = soul.content;
    } else {
      const source = parseGitHubSourceId(soul.sourceId);
      const metadata = parseGitHubSoulMetadata(soul.metadata);

      if (!source || !metadata) {
        return NextResponse.json(
          { error: 'GitHub soul metadata is invalid. Republish this soul.' },
          { status: 500, headers: corsHeaders() }
        );
      }

      const fetchedContent = await fetchGitHubSoulContent(source.owner, source.repo, metadata);
      if (!fetchedContent) {
        return NextResponse.json(
          { error: 'SOUL.md content unavailable' },
          { status: 404, headers: corsHeaders() }
        );
      }

      content = fetchedContent;
    }

    // Record the download and increment counter after content resolves successfully.
    await prisma.$transaction([
      prisma.download.create({
        data: { soulId: soul.id },
      }),
      prisma.soul.update({
        where: { id: soul.id },
        data: { downloads: { increment: 1 } },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        source: soul.source,
        content,
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

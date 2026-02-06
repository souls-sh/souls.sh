import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const MAX_SEARCH_LENGTH = 100;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sort = searchParams.get('sort') || 'all';
  const search = (searchParams.get('search') || '').slice(0, MAX_SEARCH_LENGTH);
  const source = searchParams.get('source');

  try {
    let orderBy: Record<string, string> = { downloads: 'desc' };

    if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const filters: Prisma.SoulWhereInput[] = [];

    if (source) {
      filters.push({ source });
    }

    if (search) {
      filters.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { authorName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.SoulWhereInput | undefined =
      filters.length > 0 ? { AND: filters } : undefined;

    const souls = await prisma.soul.findMany({
      where,
      orderBy,
      select: {
        id: true,
        name: true,
        description: true,
        downloads: true,
        createdAt: true,
        source: true,
        sourceId: true,
        sourceUrl: true,
        authorId: true,
        authorName: true,
        authorUrl: true,
        authorAvatar: true,
        verified: true,
        metadata: true,
      },
    });

    return NextResponse.json(souls, { headers: corsHeaders() });
  } catch (error) {
    console.error('Fetch souls error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch souls' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

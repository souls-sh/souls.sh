import Header from '@/components/Header';
import Leaderboard, { Soul } from '@/components/Leaderboard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getSouls(): Promise<Soul[]> {
  try {
    const souls = await prisma.soul.findMany({
      orderBy: { downloads: 'desc' },
    });

    return souls.map((soul) => ({
      id: soul.id,
      name: soul.name,
      description: soul.description ?? undefined,
      downloads: soul.downloads,
      createdAt: soul.createdAt.toISOString(),
      source: soul.source,
      sourceId: soul.sourceId,
      sourceUrl: soul.sourceUrl ?? undefined,
      authorId: soul.authorId,
      authorName: soul.authorName,
      authorUrl: soul.authorUrl ?? undefined,
      authorAvatar: soul.authorAvatar ?? undefined,
      verified: soul.verified,
      metadata: soul.metadata as Soul['metadata'],
    }));
  } catch {
    return [];
  }
}

export default async function Home() {
  const souls = await getSouls();

  return (
    <>
      <Header />
      <Leaderboard souls={souls} />
    </>
  );
}

'use client';

import { BookClosed, LogoGithub } from 'geist-icons';
import { BadgeCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import SearchBar from './SearchBar';
import SortTabs, { type SortOption } from './SortTabs';

export interface Soul {
  id: string;
  name: string;
  description?: string;
  downloads: number;
  createdAt: string;
  source: string;
  sourceId: string;
  sourceUrl?: string;
  authorId: string;
  authorName: string;
  authorUrl?: string;
  authorAvatar?: string;
  verified: boolean;
  metadata?: { repo?: string; name?: string; karma?: number; followers?: number };
}

interface LeaderboardProps {
  souls: Soul[];
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return num.toString();
}

function getSoulHref(soul: Soul): string {
  if (soul.source === 'github') {
    // sourceId is "owner/repo", name is the soul name
    return `/${soul.sourceId}/${soul.name}`;
  }
  // For moltbook souls, sourceId is "moltbook/name"
  return `/${soul.sourceId}`;
}

function getSoulIdentifier(soul: Soul): string {
  // sourceId is the identifier for both sources
  // github: "owner/repo", moltbook: "moltbook/agent-name"
  return soul.sourceId;
}

export default function Leaderboard({ souls }: LeaderboardProps) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('all');

  const filteredAndSortedSouls = useMemo(() => {
    let result = souls;

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (soul) =>
          soul.name.toLowerCase().includes(searchLower) ||
          soul.authorName.toLowerCase().includes(searchLower) ||
          soul.sourceId.toLowerCase().includes(searchLower) ||
          soul.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    switch (sort) {
      case 'all':
        result = [...result].sort((a, b) => b.downloads - a.downloads);
        break;
      case 'newest':
        result = [...result].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return result;
  }, [souls, search, sort]);

  return (
    <section>
      <h2 className="text-foreground mb-4 overflow-hidden font-mono text-sm font-medium tracking-normal uppercase">
        Souls Leaderboard
      </h2>

      <SearchBar value={search} onChange={setSearch} />
      <SortTabs activeSort={sort} onSortChange={setSort} totalCount={souls.length} />

      <div className="relative min-h-100">
        <div className="border-border hidden gap-4 border-b py-3 font-mono text-sm font-medium text-(--ds-gray-600) uppercase lg:flex">
          <div className="w-8">#</div>
          <div className="flex-1">Soul</div>
          <div className="w-60">Identifier</div>
          <div className="w-20 text-center">Source</div>
          <div className="w-24 text-right">Downloads</div>
        </div>
        <div className="divide-border divide-y">
          {filteredAndSortedSouls.map((soul, index) => (
            <a
              key={soul.id}
              className="group flex items-center gap-4 py-3 hover:bg-(--ds-gray-100)/30"
              href={getSoulHref(soul)}
            >
              <div className="w-8 text-left">
                <span className="font-mono text-sm text-(--ds-gray-600) lg:text-base">
                  {index + 1}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <h3 className="text-foreground truncate font-semibold">{soul.name}</h3>
                {soul.verified && <BadgeCheck size={14} />}
              </div>
              <div className="hidden w-60 lg:block">
                <code className="inline-block max-w-full truncate rounded bg-zinc-800 px-1.5 py-0.5 align-bottom text-sm">
                  {getSoulIdentifier(soul)}
                </code>
              </div>
              <div className="hidden w-20 justify-center text-(--ds-gray-600) lg:flex">
                {soul.source === 'github' ? <LogoGithub size={16} /> : <BookClosed size={16} />}
              </div>
              <div className="w-24 text-right">
                <span className="text-foreground font-mono text-sm">
                  {formatNumber(soul.downloads)}
                </span>
              </div>
            </a>
          ))}
          {filteredAndSortedSouls.length === 0 && (
            <div className="py-8 text-center text-(--ds-gray-600)">
              No souls found matching your search.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

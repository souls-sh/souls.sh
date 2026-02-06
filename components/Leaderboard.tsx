'use client';

import { BookClosed, LogoGithub } from 'geist-icons';
import { BadgeCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import SearchBar from './SearchBar';
import SortTabs, { SortOption } from './SortTabs';

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
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
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
      <h2 className="text-sm font-mono font-medium tracking-normal text-foreground uppercase overflow-hidden mb-4">
        Souls Leaderboard
      </h2>

      <SearchBar value={search} onChange={setSearch} />
      <SortTabs activeSort={sort} onSortChange={setSort} totalCount={souls.length} />

      <div className="relative min-h-100">
        <div className="hidden lg:flex gap-4 border-b border-border py-3 text-sm font-medium uppercase text-(--ds-gray-600) font-mono">
          <div className="w-8">#</div>
          <div className="flex-1">Soul</div>
          <div className="w-60">Identifier</div>
          <div className="w-20 text-center">Source</div>
          <div className="w-24 text-right">Downloads</div>
        </div>
        <div className="divide-y divide-border">
          {filteredAndSortedSouls.map((soul, index) => (
            <a
              key={soul.id}
              className="group flex items-center gap-4 py-3 hover:bg-(--ds-gray-100)/30"
              href={getSoulHref(soul)}
            >
              <div className="w-8 text-left">
                <span className="text-sm lg:text-base text-(--ds-gray-600) font-mono">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <h3 className="font-semibold text-foreground truncate">{soul.name}</h3>
                {soul.verified && <BadgeCheck size={14} />}
              </div>
              <div className="hidden lg:block w-60">
                <code className="inline-block max-w-full bg-zinc-800 px-1.5 py-0.5 rounded text-sm truncate align-bottom">
                  {getSoulIdentifier(soul)}
                </code>
              </div>
              <div className="hidden lg:flex w-20 justify-center text-(--ds-gray-600)">
                {soul.source === 'github' ? <LogoGithub size={16} /> : <BookClosed size={16} />}
              </div>
              <div className="w-24 text-right">
                <span className="font-mono text-sm text-foreground">
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

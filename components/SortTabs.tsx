'use client';

export type SortOption = 'all' | 'newest';

interface SortTabsProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalCount: number;
}

export default function SortTabs({ activeSort, onSortChange, totalCount }: SortTabsProps) {
  const tabs: { id: SortOption; label: string }[] = [
    { id: 'all', label: `All (${totalCount.toLocaleString()})` },
    { id: 'newest', label: 'Newest' },
  ];

  return (
    <div className="flex gap-4 mb-4 font-mono text-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSortChange(tab.id)}
          className={`pb-1 border-b-2 transition-colors ${
            activeSort === tab.id
              ? 'border-foreground text-foreground'
              : 'border-transparent text-(--ds-gray-600) hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

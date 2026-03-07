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
    <div className="mb-4 flex gap-4 font-mono text-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSortChange(tab.id)}
          className={`border-b-2 pb-1 transition-colors ${
            activeSort === tab.id
              ? 'border-foreground text-foreground'
              : 'hover:text-foreground border-transparent text-(--ds-gray-600)'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

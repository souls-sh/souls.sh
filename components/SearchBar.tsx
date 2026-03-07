'use client';

import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative mb-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-0">
        <Search className="text-muted-foreground h-4 w-4 transition-opacity duration-200" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search souls..."
        className="text-foreground w-full border-b border-(--ds-gray-400) bg-transparent py-3 pr-8 pl-8 font-mono text-base transition-colors duration-100 placeholder:font-mono placeholder:text-(--ds-gray-600) focus:border-(--ds-gray-1000) focus:ring-0 focus:outline-none lg:text-sm"
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-0">
        <kbd className="rounded border border-(--ds-gray-400) px-1.5 py-0.5 font-mono text-xs text-(--ds-gray-600)">
          /
        </kbd>
      </div>
    </div>
  );
}

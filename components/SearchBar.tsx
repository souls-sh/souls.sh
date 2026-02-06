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
      <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground transition-opacity duration-200" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search souls..."
        className="w-full border-b font-mono py-3 text-base lg:text-sm pl-8 pr-8 text-foreground placeholder:text-(--ds-gray-600) placeholder:font-mono focus:border-(--ds-gray-1000) focus:outline-none focus:ring-0 transition-colors duration-100 bg-transparent border-(--ds-gray-400)"
      />
      <div className="absolute inset-y-0 right-0 pr-0 flex items-center pointer-events-none">
        <kbd className="px-1.5 py-0.5 text-xs text-(--ds-gray-600) border border-(--ds-gray-400) rounded font-mono">
          /
        </kbd>
      </div>
    </div>
  );
}

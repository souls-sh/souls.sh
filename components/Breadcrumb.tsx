'use client';

import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="mb-6 flex min-w-0 items-center gap-2 text-sm text-(--ds-gray-600)">
      {items.map((item, index) => (
        <span key={`${item.href ?? 'current'}:${item.label}`} className="contents">
          {index > 0 && <span className="shrink-0">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground min-w-0 truncate">
              {item.label}
            </Link>
          ) : (
            <span className="truncate text-(--ds-gray-600)">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

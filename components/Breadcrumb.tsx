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
    <div className="flex items-center gap-2 text-sm text-(--ds-gray-600) mb-6 min-w-0">
      {items.map((item, index) => (
        <span key={index} className="contents">
          {index > 0 && <span className="shrink-0">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground truncate min-w-0">
              {item.label}
            </Link>
          ) : (
            <span className="text-(--ds-gray-600) truncate">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

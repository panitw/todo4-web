import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: LucideIcon;
  heading: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  heading,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-10 px-6 text-center gap-4">
      {Icon && (
        <Icon
          className="text-muted-foreground"
          size={32}
          aria-hidden="true"
        />
      )}
      <div className="flex flex-col gap-1.5">
        <p className="text-lg font-medium text-muted-foreground">{heading}</p>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">
            {description}
          </p>
        )}
      </div>
      {children}
      {action && (
        <Link
          href={action.href}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

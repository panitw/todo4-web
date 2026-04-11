'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserAvatar } from '@/components/layout/user-avatar';
import { logout } from '@/lib/api/auth';

interface UserMenuProps {
  name: string | null;
  email: string;
  profilePictureUrl: string | null;
  size?: 'sm' | 'default';
}

export function UserMenu({ name, email, profilePictureUrl, size = 'default' }: UserMenuProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      queryClient.clear();
      router.push('/');
    }
  };

  const ariaLabel = `Account menu for ${name ?? email}`;

  return (
    <Popover>
      <PopoverTrigger
        aria-label={ariaLabel}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <UserAvatar
          name={name}
          email={email}
          profilePictureUrl={profilePictureUrl}
          size={size}
        />
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-56">
        <div className="px-1 pb-1 border-b border-border">
          {name && <p className="text-sm font-medium truncate">{name}</p>}
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}

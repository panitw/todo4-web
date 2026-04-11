'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function getInitials(name: string | null, email: string): string {
  const normalizedName = name?.trim() ?? '';

  if (normalizedName) {
    const parts = normalizedName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0][0]) {
      return parts[0][0].toUpperCase();
    }
  }

  const localPartInitial = email.split('@')[0]?.trim()?.[0];
  return localPartInitial ? localPartInitial.toUpperCase() : '?';
}

interface UserAvatarProps {
  name: string | null;
  email: string;
  profilePictureUrl: string | null;
  size?: 'sm' | 'default';
}

export function UserAvatar({ name, email, profilePictureUrl, size = 'default' }: UserAvatarProps) {
  const initials = getInitials(name, email);
  const alt = name?.trim() || 'User avatar';

  return (
    <Avatar size={size}>
      {profilePictureUrl && (
        <AvatarImage src={profilePictureUrl} alt={alt} />
      )}
      <AvatarFallback
        className="text-white font-semibold text-xs"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

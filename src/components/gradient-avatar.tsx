'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface GradientAvatarProps {
  name: string;
  src?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function GradientAvatar({ name, src, className, size = 'md' }: GradientAvatarProps) {
  // Generate a consistent pseudo-random gradient based on the name
  const getGradient = (str: string) => {
    let hash = 0;
    const safeStr = str || 'Unknown User';
    for (let i = 0; i < safeStr.length; i++) {
        hash = safeStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color1 = `hsl(${Math.abs(hash) % 360}, 85%, 65%)`;
    const color2 = `hsl(${(Math.abs(hash) + 40) % 360}, 85%, 55%)`;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  };

  const safeName = name || 'User';
  const initials = safeName
    .split(' ')
    .filter(n => n.length > 0)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-xl'
  };

  if (src) {
    return (
        <Avatar className={cn("border border-black/5 shadow-sm", sizeClasses[size], className)}>
            <AvatarImage src={src} alt={safeName} className="object-cover" />
            <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
    );
  }

  return (
    <div 
        className={cn(
            "flex items-center justify-center rounded-full text-white font-bold shadow-sm border border-black/5 flex-shrink-0",
            sizeClasses[size],
            className
        )}
        style={{ background: getGradient(safeName) }}
    >
      {initials}
    </div>
  );
}

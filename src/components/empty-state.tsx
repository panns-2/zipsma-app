'use client';

import React from 'react';
import Image from 'next/image';

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-card/10 rounded-xl my-4">
      <div className="w-48 h-48 relative mb-4">
        <Image
          src="/empty-desk.png"
          alt="Nothing found"
          fill
          className="object-contain opacity-80 mix-blend-multiply dark:mix-blend-normal"
        />
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">{description}</p>
    </div>
  );
}

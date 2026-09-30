import React from 'react';
import UpdatesTab from '@/components/UpdatesTab';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Malayalam Film Songs Live Updates | Raga Finder AI',
  description: 'Live Spotify updates for brand new Malayalam film songs, trending Mollywood tracks, movie releases, and chartbusters with Raga analysis.',
};

export default function UpdatesPage() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      <UpdatesTab />
    </div>
  );
}

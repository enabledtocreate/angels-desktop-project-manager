'use client';

import { useState } from 'react';

export function StatisticsDisclosure({ children, defaultOpen = false, label = 'Show Statistics...' }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="text-sm font-medium text-ink/70 underline-offset-4 transition hover:text-ink hover:underline"
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? 'Hide Statistics' : label}
      </button>
      {isOpen ? children : null}
    </div>
  );
}

import React from 'react';

export const WomanIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <circle cx="12" cy="5" r="2.5" />
    <path d="M9.5 10.5h5l2 6.5h-9l2-6.5Z" />
    <path d="M9.5 10.5 7 14" />
    <path d="M14.5 10.5 17 14" />
    <path d="M10.5 17v4" />
    <path d="M13.5 17v4" />
  </svg>
);

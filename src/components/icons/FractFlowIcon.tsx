import React from 'react';

export function FractFlowIcon({ className = "h-6 w-6", ...props }: React.SVGProps<SVGSVGElement>) {
  const gTopStem = React.useId();
  const gMid = React.useId();
  const gLeft = React.useId();
  const gRight = React.useId();

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={gTopStem} x1="12" y1="5.5" x2="12" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#14B8A6" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={gMid} x1="12" y1="12" x2="12" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="0.62" stopColor="#A855F7" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id={gLeft} x1="12" y1="12" x2="7.1" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={gRight} x1="12" y1="12" x2="16.9" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>

      <circle cx="12" cy="12" r="3.9" stroke="#93C5FD" strokeWidth="1.1" opacity="0.45" />

      <path d="M12 6.5L12 12" stroke={`url(#${gTopStem})`} strokeWidth="2.1" strokeLinecap="round" />
      <path d="M12 12L12 19" stroke={`url(#${gMid})`} strokeWidth="2.1" strokeLinecap="round" />
      <path d="M12 12L7.1 15L7.1 19" stroke={`url(#${gLeft})`} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12L16.9 15L16.9 19" stroke={`url(#${gRight})`} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />

      <circle cx="12" cy="6.5" r="1.5" fill="#14B8A6" />
      <circle cx="12" cy="12" r="2.03" fill="#2563EB" />
      <circle cx="7.1" cy="19" r="1.5" fill="#F59E0B" />
      <circle cx="12" cy="19" r="1.5" fill="#EC4899" />
      <circle cx="16.9" cy="19" r="1.5" fill="#A855F7" />

      <circle cx="12" cy="12" r="0.81" fill="#DBEAFE" opacity="0.95" />
    </svg>
  );
}

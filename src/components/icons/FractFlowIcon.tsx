import React from 'react';

export function FractFlowIcon({ className = "h-6 w-6", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Main Fractal Trunk */}
      <path d="M4 20V4h16" className="opacity-20" />
      
      {/* Fractal Flow Path */}
      <path 
        d="M4 20C4 12 12 12 12 4" 
        className="text-primary"
        strokeDasharray="1 2"
      />
      <path 
        d="M4 12C8 12 12 8 12 4" 
        className="text-primary"
      />
      <path 
        d="M8 20C8 16 12 16 16 12" 
        className="text-primary opacity-60"
      />
      
      {/* Recursive nodes */}
      <circle cx="12" cy="4" r="1.5" fill="currentColor" />
      <circle cx="16" cy="12" r="1" fill="currentColor" className="opacity-60" />
      <circle cx="20" cy="4" r="1" fill="currentColor" className="opacity-40" />
    </svg>
  );
}

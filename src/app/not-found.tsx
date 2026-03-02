'use client';

import Error from 'next/error';
import { Providers } from '@/components/Providers';

export default function NotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
        <Providers>
          <div className="flex items-center justify-center min-h-screen">
            <Error statusCode={404} />
          </div>
        </Providers>
      </body>
    </html>
  );
}

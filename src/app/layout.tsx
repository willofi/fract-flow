import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/theme-provider";
import { BrainCircuit } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MindMap AI - Map your thoughts",
  description: "A modern, high-performance mind mapping tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <div className="flex flex-col min-h-screen">
              <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center px-4 md:px-8">
                  <Link href="/" className="mr-6 flex items-center space-x-2">
                    <BrainCircuit className="h-6 w-6" />
                    <span className="hidden font-bold sm:inline-block">
                      MindMap AI
                    </span>
                  </Link>
                  <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
                    <Link
                      href="/"
                      className="transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                      Dashboard
                    </Link>
                  </nav>
                  <div className="flex items-center space-x-4">
                    <ModeToggle />
                  </div>
                </div>
              </header>
              <main className="flex-1">
                {children}
              </main>
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

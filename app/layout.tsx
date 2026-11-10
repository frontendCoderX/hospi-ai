import type { Metadata } from "next"
import Link from "next/link"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "HospiAI",
  description: "Doctor notes in, verified staff tasks out.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <ThemeProvider>
          <header className="border-b">
            <nav className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
              <Link href="/" className="font-semibold">
                HospiAI
              </Link>
              <Link href="/doctor" className="text-sm text-muted-foreground hover:text-foreground">
                Doctor
              </Link>
              <Link href="/staff" className="text-sm text-muted-foreground hover:text-foreground">
                Staff
              </Link>
              <div className="ml-auto">
                <ThemeToggle />
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

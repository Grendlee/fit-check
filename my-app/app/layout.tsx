import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import AccountMenu from "@/components/AccountMenu";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Fit Check",
  description: "AI-powered outfit suggestions",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased bg-[#f4eadf] text-zinc-900`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Top navigation bar */}
          <header className="relative border-b border-zinc-900/15 bg-[#f4eadf]">
            {/* subtle paper dot texture */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[radial-gradient(#000_0.8px,transparent_0)] [background-size:22px_22px]" />

            <div className="relative flex items-center justify-between px-6 py-4">
              <div className="text-lg font-black tracking-tight [font-family:ui-serif,Georgia,serif]">
                Fit Check
              </div>

              {/* Shows only when logged in */}
              <AccountMenu />
            </div>
          </header>

          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}

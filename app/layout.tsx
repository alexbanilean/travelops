import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TravelOps — AI-Powered Corporate Travel Planner",
  description:
    "TravelOps is the command center for corporate travel — combining AI-powered planning, booking, and expense tracking into one streamlined system.",
  openGraph: {
    title: "TravelOps",
    description: "AI-Powered Corporate Travel & Event Planner",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground">
        <ThemeProvider>
          {/* Subtle mesh so glass headers have depth (glassmorphism) */}
          <div
            className="pointer-events-none fixed inset-0 -z-10 opacity-40 dark:opacity-25"
            aria-hidden
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,oklch(0.62_0.19_252/0.35),transparent)] dark:bg-[radial-gradient(ellipse_100%_60%_at_80%_0%,oklch(0.76_0.19_152/0.12),transparent)]" />
          </div>
          <div className="relative flex min-h-dvh flex-1 flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}

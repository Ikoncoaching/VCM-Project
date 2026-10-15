import type { Metadata } from "next";
import { Lato, Open_Sans } from "next/font/google";
import Link from "next/link";
import { ProgressProvider } from "@/lib/progress";
import { AuthProvider } from "@/components/AuthProvider";
import AuthGate from "@/components/AuthGate";
import AuthErrorNotice from "@/components/AuthErrorNotice";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const lato = Lato({ variable: "--font-lato", weight: ["700", "900"], subsets: ["latin"] });
const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The VCM Project by Ikon Coaching",
  description:
    "Discover and articulate your Value Creation Mechanism: the distinctive way you create value. A self-paced project from Ikon Coaching.",
};

export const IKON_URL = "https://ikoncoaching.com";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${lato.variable} ${openSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AuthErrorNotice />
        <AuthProvider>
          <ProgressProvider>
            <SiteHeader />
            <main className="relative flex-1">
              <AuthGate>{children}</AuthGate>
            </main>
            <footer className="border-t border-navy/10">
              <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-navy/55">
                <p>
                  The VCM Project is part of{" "}
                  <a href={IKON_URL} className="text-navy/80 underline hover:text-navy">
                    Ikon Coaching
                  </a>
                  .
                </p>
                <div className="flex gap-5">
                  <a href={IKON_URL} className="hover:text-navy">ikoncoaching.com</a>
                  <Link href="/" className="hover:text-navy">About the project</Link>
                </div>
              </div>
            </footer>
          </ProgressProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

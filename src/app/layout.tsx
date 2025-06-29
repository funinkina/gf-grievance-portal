import type { Metadata } from "next";
import AuthProvider from "@/components/providers/SessionProvider";
import Footer from "@/components/Footer";
import "./globals.css";
import { Playfair_Display, Lexend } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "girlfriend grievance portal",
  description: "file your complaints here gurl",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <body className={`${lexend.variable} ${playfair.variable} flex flex-col min-h-screen`}>
        <Analytics />
        <AuthProvider>
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

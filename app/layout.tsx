import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MiniCofePoligon | Web3 Payments",
  description: "Web3 Payment Gateway on Polygon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col text-white">
        {/* Animated background orbs */}
        <div className="bg-glow-container pointer-events-none">
          <div className="bg-glow-1" />
          <div className="bg-glow-2" />
          <div className="bg-glow-3" />
        </div>

        <Navbar />

        {/* Main Content */}
        <main className="flex-1 flex flex-col pt-16 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}

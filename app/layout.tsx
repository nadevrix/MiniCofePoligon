import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pollar Pay | Web3 Payments",
  description: "Premium Web3 Payment Gateway on Polygon",
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
        {/* Animated Background */}
        <div className="bg-glow-container pointer-events-none">
          <div className="bg-glow-1"></div>
          <div className="bg-glow-2"></div>
        </div>

        {/* Premium Navbar */}
        <nav className="fixed top-0 w-full z-50 glass-panel border-b-0 border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)] group-hover:shadow-[0_0_25px_rgba(139,92,246,0.8)] transition-all">
                    <span className="font-bold text-white text-lg leading-none">P</span>
                  </div>
                  <span className="font-bold text-xl tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-fuchsia-400 transition-all duration-300">
                    Pollar Pay
                  </span>
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-8">
                  <Link href="/projects" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Proyectos</Link>
                  <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Crear Orden</Link>
                  <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Dashboard</Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 flex flex-col pt-16 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}

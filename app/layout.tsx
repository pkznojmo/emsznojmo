import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Topbar from "./comp/Topbar";
import Footer from "./comp/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'EMS Express Studio Znojmo | 20minutový efektivní trénink',
  description: 'Zpevněte tělo, zhubněte a zbavte se bolesti zad za pouhých 20 minut týdně. Moderní EMS cvičení ve Znojmě s osobním trenérem.',
  keywords: 'EMS Znojmo, EMS cvičení, hubnutí Znojmo, fitness pro lidi s bolestí zad, osobní trenér Znojmo',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className="scroll-smooth">
      <body className={`${inter.className} flex min-h-screen flex-col bg-white text-zinc-900 antialiased`}>
        {/* Společný Topbar na vrchu */}
        <Topbar />
        
        {/* Hlavní obsah stránky, který roste tak, aby vytlačil footer dolů */}
        <main className="flex-1">
          {children}
        </main>
        
        {/* Společný Footer na spodu */}
        <Footer />
      </body>
    </html>
  );
}
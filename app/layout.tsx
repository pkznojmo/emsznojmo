import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Topbar from "./comp/Topbar";
import Footer from "./comp/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EMS Express | Moderní 20minutový trénink",
  description: "Dostaňte se do formy za pouhých 20 minut týdně díky revoluční technologii EMS. Rychlé, efektivní, s osobním trenérem.",
};

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
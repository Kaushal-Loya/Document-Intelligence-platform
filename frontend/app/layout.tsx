import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "BookMind — AI-Powered Book Intelligence",
  description:
    "Discover books, get AI-generated insights, and ask questions about your library using cutting-edge RAG technology.",
  keywords: ["books", "AI", "RAG", "reading", "book intelligence", "recommendations"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-[#030206] text-gray-100 min-h-screen`}>
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}

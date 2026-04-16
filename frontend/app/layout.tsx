import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
      <body className={`${inter.variable} font-sans bg-gray-950 text-gray-100 min-h-screen`}>
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}

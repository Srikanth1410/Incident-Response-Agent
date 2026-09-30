import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayRecall | Self-Learning Payment Operations Agent",
  description: "Autonomous payment incident triage with Hindsight operational memory.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}

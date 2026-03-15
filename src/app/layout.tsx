import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "QuizMaster — MCQ Practice & Quiz Platform",
  description:
    "Practice and test your knowledge across multiple subjects with 1200+ MCQs. Track your scores and review your answers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}

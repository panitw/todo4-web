import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { SearchProvider } from "@/providers/search-provider";
import { CreateTaskProvider } from "@/providers/create-task-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "todo4",
  description: "AI-native task management",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <SearchProvider>
            <CreateTaskProvider>
              {children}
            </CreateTaskProvider>
          </SearchProvider>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}

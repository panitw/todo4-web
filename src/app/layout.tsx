import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { SearchProvider } from "@/providers/search-provider";
import { CreateTaskProvider } from "@/providers/create-task-provider";
import { Toaster } from "@/components/ui/sonner";
import { AxeDevTools } from "@/components/shared/axe-dev-tools";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "todo4",
  description: "AI-native task management",
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    title: "todo4",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
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
          <AxeDevTools />
        </QueryProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simera Health — Get paid what you earned.",
  description:
    "AI-powered revenue intelligence for independent healthcare practices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
            rel="stylesheet"
          />
        </head>
        <body
          className="min-h-full antialiased"
          style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

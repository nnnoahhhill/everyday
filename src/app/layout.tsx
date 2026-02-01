import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import QueryProvider from "@/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TIDE - Things I Do Every Day",
  description: "Enterprise-grade habit and execution tracking platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkDomain = process.env.NEXT_PUBLIC_CLERK_DOMAIN;
  
  return (
    <ClerkProvider 
      {...(publishableKey ? { publishableKey } : {})}
      {...(clerkDomain ? { domain: clerkDomain } : {})}
    >
      <html lang="en">
        <body className={inter.className}>
          <QueryProvider>
            {children}
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
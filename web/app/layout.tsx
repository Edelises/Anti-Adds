import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anti-Ads Dash",
  description: "Advanced Ad Suppression System",
  icons: {
    icon: "/app-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ overflow: 'clip', height: '100vh' }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${inter.className} bg-black`} style={{ overflow: 'clip', height: '100vh', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}

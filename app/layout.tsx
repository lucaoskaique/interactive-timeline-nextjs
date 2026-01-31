import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2018: Year In Review",
  description: "Interactive 3D timeline showcasing 2018 highlights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="overflow-hidden" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

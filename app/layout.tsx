import React from 'react';
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: 'BRAGMODE • World Cup 2026 Bragging Rights Engine',
  description: 'Lock in your pre-match receipts. Mint them before kickoff and silence the group chat.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

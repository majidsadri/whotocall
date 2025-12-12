import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'whotocall - Smart Contact Memory',
  description: 'Remember who to call when opportunity knocks',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}

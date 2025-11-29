import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'File Integrity System',
  description: 'Secure file upload and integrity verification system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="top-right" />
        <AuthGuard>
          <Navbar />
          <main>{children}</main>
        </AuthGuard>
      </body>
    </html>
  );
}

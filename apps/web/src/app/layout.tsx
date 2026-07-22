import type { Metadata } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PyMEBot — Tu negocio en WhatsApp',
  description:
    'Inventario, pedidos, cobros y borradores fiscales para micro-PyMEs de Latinoamérica, directo en WhatsApp.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body className={`${fraunces.variable} ${dmSans.variable} antialiased`}>{children}</body>
    </html>
  );
}

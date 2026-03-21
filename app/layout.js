import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AppDataProvider } from '@/context/AppDataContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SCI POS - Sudanese Chemical Industries',
  description: 'نظام نقطة البيع - الصناعات الكيميائية السودانية',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <AppDataProvider>
          <Toaster position="top-center" />
          {children}
        </AppDataProvider>
      </body>
    </html>
  );
}

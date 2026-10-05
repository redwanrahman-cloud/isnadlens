import type { Metadata } from 'next';
import './globals.css';
import './workspace.css';

export const metadata: Metadata = { title: 'عدسة الإسناد · IsnadLens', description: 'An evidence desk for tracing claims to their sources.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}

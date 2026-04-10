import './globals.css';
import { AppFrame } from '@/components/app-frame';
import { AppThemeProvider } from '@/components/app-theme-provider';

export const metadata = {
  title: "Angel's Project Manager",
  description: "Next.js migration workspace for Angel's Project Manager.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppThemeProvider>
          <AppFrame>{children}</AppFrame>
        </AppThemeProvider>
      </body>
    </html>
  );
}

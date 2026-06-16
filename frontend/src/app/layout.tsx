import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'CalorieTracker Pro',
  description: 'Track your calories, macros, water, and weight seamlessly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-gray-50 dark:bg-dark-950 text-dark-900 dark:text-dark-100 transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                className: 'dark:bg-dark-800 dark:text-white',
                style: {
                  borderRadius: '10px',
                  background: '#333',
                  color: '#fff',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

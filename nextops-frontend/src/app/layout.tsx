import './globals.css';
import React from 'react';
import Sidebar from '@/components/ui/sidebar';
import { WorkspaceProvider } from '@/context/WorkspaceContext';

export const metadata = {
  title: 'NextOps Studio',
  description: 'Панель керування low-code архітектурою',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body className="bg-gray-50 text-gray-900 min-h-screen ">
        <WorkspaceProvider>
          <div className="flex min-h-screen bg-custom-way ">
            {/* Сайдбар */}
            <Sidebar />
            <main className="flex-1 w-full p-4 md:p-8 md:pl-72 
            min-h-screen overflow-x-hidden pt-16 md:pt-8">
              {children}
            </main>
          </div>
        </WorkspaceProvider>
      </body>
    </html>
  );
}

import './globals.css';
import React from 'react';
import Sidebar from '@/components/ui/sidebar';
import SessionNotice from '@/components/SessionNotice';
import TelegramLiveToast from '@/components/TelegramLiveToast';
import { WorkspaceProvider } from '@/context/WorkspaceContext';

export const metadata = {
  title: 'NextOps Studio',
  description: 'Low-code architecture control panel',
  icons: {
    icon: '/images/favicon.ico',
    shortcut: '/images/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body className="min-h-screen antialiased">
        <WorkspaceProvider>
          <div className="flex min-h-screen bg-custom-way">
            <Sidebar />
            <main className="min-w-0 flex-1 w-full min-h-screen overflow-x-hidden 
            px-4 pb-6 pt-16 sm:px-6 md:px-8 md:pt-16 lg:pl-80 lg:pt-8 xl:pl-[21rem]">
              <div className="mx-auto w-full max-w-[1600px] min-w-0">
                {children}
              </div>
            </main>
          </div>
          <SessionNotice />
          <TelegramLiveToast />
        </WorkspaceProvider>
      </body>
    </html>
  );
}

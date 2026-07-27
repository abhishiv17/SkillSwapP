'use client';

import { useUser } from '@/hooks/useUser';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { ChatbotWidget } from '@/components/shared/ChatbotWidget';
import './dashboard.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();

  // Middleware guarantees we have a session by the time this renders.
  // Show a brief loading state only while the client-side UserProvider hydrates.
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500" />
      </div>
    );
  }

  return (
    <div className="dashboard-shell min-h-screen flex w-full">
      <Sidebar />
      {/* Main content: pushed right on desktop (lg+), full width on mobile */}
      <div className="flex-1 lg:ml-[240px] transition-all duration-300 min-w-0">
        <TopBar />
        <main className="p-6 md:p-8 lg:p-10 pb-24 mx-auto w-full max-w-[1500px]">
          {children}
        </main>
      </div>
      <ChatbotWidget />
    </div>
  );
}

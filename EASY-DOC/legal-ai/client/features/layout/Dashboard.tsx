'use client';

import { ReactNode } from 'react';

interface DashboardProps {
  children: ReactNode;
}

export default function Dashboard({ children }: DashboardProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4">
        <h1 className="text-xl font-bold">Legal AI Dashboard</h1>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}

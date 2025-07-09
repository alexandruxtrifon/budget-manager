'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/ModeToggle"
import { LoadingScreen } from "@/components/ui/spinner"
import { NotificationChecker } from "@/components/notification";

export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const handleUserUpdate = (updatedUser) => {
    console.log('Dashboard handleUserUpdate called with:', updatedUser);
    console.log('Current user state before update:', user);
    setUser({ ...updatedUser }); // Force new object reference to trigger re-render
    console.log('User state should be updated now');
  };
  const fetchData = async () => {
    if (!user || !user.user_id) return;

    try {
      const accountsRes = await fetch(`http://localhost:3001/api/accounts/${user.user_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    if (accountsRes.ok) {
      const accountsData = await accountsRes.json();
      setAccounts(accountsData);
    }
    const transactionsRes = await fetch(`http://localhost:3001/api/transactions/${user.user_id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (transactionsRes.ok) {
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData);
    }
  } catch (error) {
      console.error("Failed to fetch accounts or transactions", error);
  } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.replace('/login');
    } else {
      try {
        const parsedUser = JSON.parse(storedUser);
        // The backend sends `full_name`, but NavUser expects `name`.
        setUser({
          ...parsedUser,
          name: parsedUser.full_name,
          email: parsedUser.email,
          avatar: "/avatars/default.png" // Provide a default avatar
        });
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
        localStorage.clear();
        router.replace('/login');
      }
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (user && user.user_id) {
      console.log("User loaded, fetching data for user ID:", user.user_id);
      fetchData();
    }
  }, [user]);
  
  if (isLoading || !user) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return (
    <SidebarProvider
    style={
      {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      }
    }>
      <NotificationChecker/>
      <AppSidebar user={user} onUserUpdate={handleUserUpdate} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards 
                transactions={transactions} 
                accounts={accounts} 
                userId={user.user_id}
              />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive 
                  transactions={transactions} 
                  currency={accounts[0]?.currency || "EUR"}
                />
              </div>
            <DataTable 
              data={transactions || []} 
              accounts={accounts || []} 
              userId={user.user_id}
              onImportComplete={fetchData}
            />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

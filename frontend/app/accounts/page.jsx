'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { AccountsTable } from "@/components/accounts-table";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/ui/spinner";
import { Avatar } from '@/components/ui/avatar';

export default function AccountsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);

  const fetchAccounts = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/accounts/${user.user_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      } else {
        toast.error("Failed to fetch accounts");
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Error loading accounts");
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
        setUser({
          ...parsedUser,
          name: parsedUser.full_name,
          email: parsedUser.email,
          avatar: "/avatars/default.png"
        });
      } catch (error) {
        console.error("Failed to parse user data", error);
        localStorage.clear();
        router.replace('/login');
      }
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  if (isLoading || !user) {
    //return <div>Loading...</div>;
    return <LoadingScreen message="Loading accounts..." />;
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      }}>
      <AppSidebar user={user} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
              <p className="text-muted-foreground">Manage your bank accounts, cards, and cash.</p>
            </div>
            <AccountsTable 
              accounts={accounts} 
              userId={user.user_id}
              onAccountChange={fetchAccounts}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IconListDetails, IconFileImport, IconFilter, IconSearch } from "@tabler/icons-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { LoadingScreen } from "@/components/ui/spinner";
import { NotificationChecker } from "@/components/notification";
import { DataTable } from "@/components/data-table";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TransactionsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [timeframe, setTimeframe] = useState('month');

  const handleUserUpdate = (updatedUser) => {
    setUser({ ...updatedUser });
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
      } else {
        toast.error("Failed to load accounts");
      }

      const transactionsRes = await fetch(`http://localhost:3001/api/transactions/${user.user_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData);
      } else {
        toast.error("Failed to load transactions");
      }
    } catch (error) {
      console.error("Failed to fetch accounts or transactions", error);
      toast.error("Error loading data");
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
        console.error("Failed to parse user data from localStorage", error);
        localStorage.clear();
        router.replace('/login');
      }
    }
  }, [router]);

  useEffect(() => {
    if (user && user.user_id) {
      fetchData();
    }
  }, [user]);
  
  // Filter transactions based on search term, account, and type
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === '' || 
      (transaction.description && transaction.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAccount = filterAccount === 'all' || 
      transaction.account_id.toString() === filterAccount;
    
    const matchesType = filterType === 'all' || 
      transaction.transaction_type === filterType;
    
    return matchesSearch && matchesAccount && matchesType;
  });

  if (isLoading || !user) {
    return <LoadingScreen message="Loading transactions..." />;
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      }}>
      <NotificationChecker />
      <AppSidebar user={user} onUserUpdate={handleUserUpdate} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
                <p className="text-muted-foreground">Manage and track your financial activities</p>
              </div>
              <div className="flex gap-4 items-center">
                <Button 
                  onClick={fetchData}
                  variant="outline"
                >
                  Refresh Data
                </Button>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Transactions
                  </CardTitle>
                  <IconListDetails className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{transactions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {filteredTransactions.length} showing with current filters
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Income
                  </CardTitle>
                  <div className="rounded-full bg-green-100 p-1">
                    <span className="text-green-700">+</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {transactions
                      .filter(t => t.transaction_type === 'income')
                      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                      .toFixed(2)} {accounts[0]?.currency || ''}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Expenses
                  </CardTitle>
                  <div className="rounded-full bg-red-100 p-1">
                    <span className="text-red-700">-</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {transactions
                      .filter(t => t.transaction_type === 'expense')
                      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                      .toFixed(2)} {accounts[0]?.currency || ''}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Balance
                  </CardTitle>
                  <IconFileImport className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {transactions
                      .reduce((sum, t) => {
                        const amount = parseFloat(t.amount);
                        return t.transaction_type === 'income' ? sum + amount : sum - amount;
                      }, 0)
                      .toFixed(2)} {accounts[0]?.currency || ''}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Transaction Filters */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative">
                  <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[250px]"
                  />
                </div>
                
                <Select 
                  value={filterAccount}
                  onValueChange={setFilterAccount}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts.map(account => (
                      <SelectItem key={account.account_id} value={account.account_id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={filterType}
                  onValueChange={setFilterType}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Transaction Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select 
                  value={timeframe}
                  onValueChange={setTimeframe}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="quarter">Last 90 Days</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>Manage all your transactions in one place</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={filteredTransactions} 
                  accounts={accounts} 
                  userId={user.user_id}
                  onImportComplete={fetchData}
                  isStandalonePage={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
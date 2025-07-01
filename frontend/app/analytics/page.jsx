'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { LoadingScreen } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { IconDownload } from '@tabler/icons-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [timeframe, setTimeframe] = useState('month'); // week, month, year, all
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];
  
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
        fetchAccounts(parsedUser.user_id);
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
        localStorage.clear();
        router.replace('/login');
      }
    }
  }, [router]);

  const fetchAccounts = async (userId) => {
    try {
      const res = await fetch(`http://localhost:3001/api/accounts/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch accounts');
      
      const accountsData = await res.json();
      setAccounts(accountsData);
      
      // Select the first account by default
      if (accountsData.length > 0) {
        setSelectedAccountId(accountsData[0].account_id);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load accounts');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchTransactions();
    }
  }, [selectedAccountId, timeframe]);

  const fetchTransactions = async () => {
    try {
      // Get date range based on timeframe
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date(0); // Beginning of time
          break;
      }
      
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      const res = await fetch(
        `http://localhost:3001/api/transactions/account/${selectedAccountId}?startDate=${formattedStartDate}&endDate=${formattedEndDate}`, 
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!res.ok) throw new Error('Failed to fetch transactions');
      
      const transactionsData = await res.json();
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transaction data');
    }
  };

  // Process data for charts
  const prepareChartData = () => {
    // Return early if no transactions
    if (!transactions.length) return { 
      categoryData: [], 
      timelineData: [],
      monthlyData: []
    };

    // Category spending data for pie chart
    const categoryTotals = {};
    transactions.forEach(t => {
      if (t.transaction_type === 'expense') {
        const category = t.category_name || 'Uncategorized';
        categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(t.amount);
      }
    });

    const categoryData = Object.keys(categoryTotals).map(category => ({
      name: category,
      value: categoryTotals[category]
    }));

    // Timeline data for line/area chart
    const timelineMap = {};
    transactions.forEach(t => {
      const date = t.transaction_date.split('T')[0];
      if (!timelineMap[date]) {
        timelineMap[date] = { date, income: 0, expense: 0 };
      }
      
      if (t.transaction_type === 'income') {
        timelineMap[date].income += parseFloat(t.amount);
      } else if (t.transaction_type === 'expense') {
        timelineMap[date].expense += parseFloat(t.amount);
      }
    });

    const timelineData = Object.values(timelineMap).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Monthly data for bar chart
    const monthlyMap = {};
    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const monthYear = format(date, 'MMM yyyy');
      
      if (!monthlyMap[monthYear]) {
        monthlyMap[monthYear] = { month: monthYear, income: 0, expense: 0 };
      }
      
      if (t.transaction_type === 'income') {
        monthlyMap[monthYear].income += parseFloat(t.amount);
      } else if (t.transaction_type === 'expense') {
        monthlyMap[monthYear].expense += parseFloat(t.amount);
      }
    });

    const monthlyData = Object.values(monthlyMap).sort((a, b) => {
      const [monthA, yearA] = a.month.split(' ');
      const [monthB, yearB] = b.month.split(' ');
      return yearA === yearB 
        ? new Date(Date.parse(`${monthA} 1, 2000`)) - new Date(Date.parse(`${monthB} 1, 2000`)) 
        : yearA - yearB;
    });

    return { categoryData, timelineData, monthlyData };
  };

  const { categoryData, timelineData, monthlyData } = prepareChartData();

  // Format currency
  const formatCurrency = (value) => {
    const account = accounts.find(a => a.account_id === selectedAccountId);
    const currency = account?.currency || "RON";
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Inside your AnalyticsPage component, add this function:
const exportToPDF = async () => {
  try {
    // Show loading toast
    toast.loading('Generating PDF report...');
    
    // Get the currently selected account details
    const account = accounts.find(a => a.account_id === selectedAccountId);
    
    // Get date range based on timeframe for the report title
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }
    
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
    
    // Prepare summary data for the report
    const incomeTotal = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const expenseTotal = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const netBalance = incomeTotal - expenseTotal;
    
    const summary = {
      income: new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2
      }).format(incomeTotal),
      expenses: new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2
      }).format(expenseTotal),
      netBalance: new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2
      }).format(netBalance),
      transactionCount: transactions.length
    };
    
    // Get the chart data
    const { categoryData, timelineData, monthlyData } = prepareChartData();
    
    // Request PDF generation from the server
    const response = await fetch('http://localhost:3001/api/reports/analytics-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        chartData: {
          categoryData,
          timelineData,
          monthlyData
        },
        timeframe: (() => {
          switch(timeframe) {
            case 'week': return 'Weekly';
            case 'month': return 'Monthly';
            case 'year': return 'Yearly';
            default: return 'All-Time';
          }
        })(),
        accountName: account?.name || 'All Accounts',
        currency: account?.currency || 'EUR',
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        summary
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate report');
    }
    
    // Convert response to blob
    const blob = await response.blob();
    
    // Create object URL
    const url = window.URL.createObjectURL(blob);
    
    // Create a link element to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${account?.name || 'all-accounts'}-${timeframe}.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    // Show success message
    toast.dismiss();
    toast.success('PDF report generated successfully');
    
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.dismiss();
    toast.error('Failed to generate PDF report');
  }
};

  if (isLoading || !user) {
    return <LoadingScreen message="Loading analytics..." />;
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
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">Analyze your spending and income patterns.</p>
              </div>
              <div className="flex gap-4">
                <Select 
                  value={selectedAccountId?.toString()}
                  onValueChange={(value) => setSelectedAccountId(parseInt(value))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.account_id} value={account.account_id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={timeframe}
                  onValueChange={setTimeframe}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                    <SelectItem value="year">Last year</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={exportToPDF}
                disabled={transactions.length === 0}
                >
                <IconDownload size={16} />
                Export PDF
                </Button>
              </div>
            </div>
            
            {transactions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
                  <p className="text-muted-foreground text-center">No transaction data available for this account in the selected time period.</p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Income
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(transactions
                            .filter(t => t.transaction_type === 'income')
                            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Expenses
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(transactions
                            .filter(t => t.transaction_type === 'expense')
                            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Net Flow
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(transactions
                            .reduce((sum, t) => sum + (t.transaction_type === 'income' ? 1 : -1) * parseFloat(t.amount), 0)
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Transaction Count
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {transactions.length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Spending by Category</CardTitle>
                      </CardHeader>
                      <CardContent className="px-2">
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {categoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Income vs. Expenses</CardTitle>
                      </CardHeader>
                      <CardContent className="px-2">
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timelineData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                              />
                              <YAxis tickFormatter={(value) => formatCurrency(value)} />
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                              <Legend />
                              <Area type="monotone" dataKey="income" stroke="#4ade80" fill="#4ade80" fillOpacity={0.3} />
                              <Area type="monotone" dataKey="expense" stroke="#f87171" fill="#f87171" fillOpacity={0.3} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="categories">
                  <Card>
                    <CardHeader>
                      <CardTitle>Expense Categories</CardTitle>
                      <CardDescription>Breakdown of your spending by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={120}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                              labelLine={true}
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="timeline">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cash Flow Timeline</CardTitle>
                      <CardDescription>Track your income and expenses over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={timelineData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 10,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                            />
                            <YAxis tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Line type="monotone" dataKey="income" stroke="#4ade80" name="Income" />
                            <Line type="monotone" dataKey="expense" stroke="#f87171" name="Expense" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="monthly">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Comparison</CardTitle>
                      <CardDescription>Compare your monthly income and expenses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={monthlyData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 10,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="income" fill="#4ade80" name="Income" />
                            <Bar dataKey="expense" fill="#f87171" name="Expense" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { IconFileDownload, IconChartPie, IconSearch, IconCalendarEvent } from "@tabler/icons-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { LoadingScreen } from "@/components/ui/spinner";
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
import { Button } from "@/components/ui/button";
//import { DatePickerWithRange } from "@/components/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { 
  LineChart, 
  BarChart, 
  PieChart, 
  Bar, 
  Cell, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Pie,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ReferenceLine
} from 'recharts';

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { CalendarIcon } from "@radix-ui/react-icons";
import { CalendarIcon } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Info, Check } from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [accounts, setAccounts] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [spendingData, setSpendingData] = useState({
    categoryBreakdown: [],
    timelineData: [],
    weekdayAnalysis: [],
    merchantFrequency: [],
    spendingTrends: [],
    anomalies: []
  });

  // Load user data
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
        console.error("Failed to parse user data", error);
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
      if (res.ok) {
        const accountsData = await res.json();
        setAccounts(accountsData);
        fetchSpendingData(userId, 'all', dateRange);
      } else {
        toast.error("Failed to load accounts");
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Could not load account data");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch spending analysis data
  const fetchSpendingData = async (userId, accountId, dateRange) => {
    setIsLoading(true);
    
    try {
      const from = format(dateRange.from, 'yyyy-MM-dd');
      const to = format(dateRange.to, 'yyyy-MM-dd');
      
      const res = await fetch('http://localhost:3001/api/reports/spending-analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          account_id: accountId,
          start_date: from,
          end_date: to
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setSpendingData(data);
        await fetchSpendingProgressionData(userId, accountId, dateRange);
      } else {
        toast.error("Failed to load spending analysis");
      }
    } catch (error) {
      console.error("Error fetching spending data:", error);
      toast.error("Could not analyze spending behavior");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSpendingProgressionData = async (userId, accountId, dateRange) => {
    setIsLoading(true);
    
    try {
        const from = format(dateRange.from, 'yyyy-MM-dd');
        const to = format(dateRange.to, 'yyyy-MM-dd');
        
        const res = await fetch('http://localhost:3001/api/reports/spending-progression', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: userId,
            account_id: accountId,
            start_date: from,
            end_date: to
        })
        });
        
        if (res.ok) {
        const progressionData = await res.json();
        setSpendingData(prevData => ({
            ...prevData,
            cumulativeSpending: progressionData.cumulativeSpending || [],
            spendingStyle: progressionData.spendingStyle || {},
            weeklyVelocity: progressionData.weeklyVelocity || [],
            highestWeek: progressionData.highestWeek || null,
            lowestWeek: progressionData.lowestWeek || null,
            weeklyVariance: progressionData.weeklyVariance || 0,
            paydayImpact: progressionData.paydayImpact || [],
            paydaySummary: progressionData.paydaySummary || {}
        }));
        console.log("Fetching progression data with date range:", {
  from: format(dateRange.from, 'yyyy-MM-dd'),
  to: format(dateRange.to, 'yyyy-MM-dd')
});
        } else {
        toast.error("Failed to load spending progression analysis");
        }
    } catch (error) {
        console.error("Error fetching spending progression data:", error);
        toast.error("Could not analyze spending patterns");
    } finally {
        setIsLoading(false);
    }
    };

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
    
    let newFrom;
    const to = new Date();
    
    switch (timeframe) {
      case 'week':
        newFrom = subDays(to, 7);
        break;
      case 'month':
        newFrom = subDays(to, 30);
        break;
      case 'quarter':
        newFrom = subDays(to, 90);
        break;
      case 'year':
        newFrom = subDays(to, 365);
        break;
      default:
        newFrom = subDays(to, 30);
    }
    
    const newDateRange = { from: newFrom, to };
    setDateRange(newDateRange);
    
    if (user) {
      fetchSpendingData(user.user_id, selectedAccount, newDateRange);
    }
  };

  const handleAccountChange = (accountId) => {
    setSelectedAccount(accountId);
    if (user) {
      fetchSpendingData(user.user_id, accountId, dateRange);
    }
  };

  const handleDateRangeChange = (range) => {
    if (range.from && range.to) {
      setDateRange(range);
      if (user) {
        fetchSpendingData(user.user_id, selectedAccount, range);
      }
    }
  };

  const handleExportPDF = async () => {
    try {
      toast("Generating PDF report...");
      
      const from = format(dateRange.from, 'yyyy-MM-dd');
      const to = format(dateRange.to, 'yyyy-MM-dd');
      
      const res = await fetch('http://localhost:3001/api/reports/analytics-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chartData: {
            categoryData: spendingData.categoryBreakdown,
            timelineData: spendingData.timelineData,
            monthlyData: spendingData.spendingTrends
          },
          timeframe: selectedTimeframe,
          accountName: selectedAccount === 'all' ? 'All Accounts' : 
            accounts.find(acc => acc.account_id.toString() === selectedAccount)?.name || 'Selected Account',
          currency: accounts[0]?.currency || 'RON',
          startDate: format(dateRange.from, 'MMM dd, yyyy'),
          endDate: format(dateRange.to, 'MMM dd, yyyy'),
          summary: {
            income: spendingData.summary?.totalIncome || 0,
            expenses: spendingData.summary?.totalExpenses || 0,
            netBalance: spendingData.summary?.netBalance || 0,
            transactionCount: spendingData.summary?.transactionCount || 0
          }
        })
      });
      
      if (!res.ok) {
        throw new Error('Failed to generate report');
      }
      
      // Create blob from response and download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `spending-analysis-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF report downloaded successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: accounts[0]?.currency || 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  if (isLoading) {
    return <LoadingScreen message="Analyzing spending patterns..." />;
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      }}>
      <AppSidebar user={user} onUserUpdate={setUser} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Spending Analysis</h1>
              <p className="text-muted-foreground">
                Analyze your spending behavior and identify patterns
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF}>
                <IconFileDownload className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select
                value={selectedTimeframe}
                onValueChange={handleTimeframeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                  <SelectItem value="quarter">Last 90 days</SelectItem>
                  <SelectItem value="year">Last 365 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select
                value={selectedAccount}
                onValueChange={handleAccountChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem
                      key={account.account_id}
                      value={account.account_id.toString()}
                    >
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[250px]">
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                >
                    {/* <Calendar className="mr-2 h-4 w-4" /> */}
                    {dateRange?.from ? (
                    dateRange.to ? (
                        <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                    ) : (
                        format(dateRange.from, "LLL dd, y")
                    )
                    ) : (
                    <span>Pick a date range</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                />
                </PopoverContent>
            </Popover>
            </div>
          </div>

          {/* Spending Summary */}
          {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(spendingData.summary?.totalExpenses || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {spendingData.summary?.expenseTrend > 0 
                    ? `+${spendingData.summary?.expenseTrend}% from previous period` 
                    : `${spendingData.summary?.expenseTrend}% from previous period`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Daily Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(spendingData.summary?.avgDailySpend || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {spendingData.summary?.transactionCount || 0} transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {spendingData.summary?.topCategory?.name || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(spendingData.summary?.topCategory?.amount || 0)} 
                  ({spendingData.summary?.topCategory?.percentage || 0}%)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Biggest Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(spendingData.summary?.largestTransaction?.amount || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {spendingData.summary?.largestTransaction?.description || 'No transactions'}
                </p>
              </CardContent>
            </Card>
          </div> */}

          {/* Charts */}
          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
              <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
              <TabsTrigger value="spending-progression">Spending Progression</TabsTrigger>
            </TabsList>
            <>
              <TabsContent value="summary" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(spendingData.summary?.totalExpenses || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {spendingData.summary?.expenseTrend > 0 
                            ? `+${spendingData.summary?.expenseTrend}% from previous period` 
                            : `${spendingData.summary?.expenseTrend}% from previous period`}
                        </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Daily Spend</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(spendingData.summary?.avgDailySpend || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {spendingData.summary?.transactionCount || 0} transactions
                        </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">
                            {spendingData.summary?.topCategory?.name || 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatCurrency(spendingData.summary?.topCategory?.amount || 0)} 
                            ({spendingData.summary?.topCategory?.percentage || 0}%)
                        </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Biggest Expense</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(spendingData.summary?.largestTransaction?.amount || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {spendingData.summary?.largestTransaction?.description || 'No transactions'}
                        </p>
                        </CardContent>
                    </Card>
                    </div>
                    
                    {/* Additional summary content - add more detailed summary here */}
                    <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                        <CardTitle>Income vs Expenses</CardTitle>
                        <CardDescription>Balance overview for this period</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                            <span className="font-medium">Total Income:</span>
                            <span className="text-green-600">
                                {formatCurrency(spendingData.summary?.totalIncome || 0)}
                            </span>
                            </div>
                            <div className="flex justify-between">
                            <span className="font-medium">Total Expenses:</span>
                            <span className="text-red-600">
                                {formatCurrency(spendingData.summary?.totalExpenses || 0)}
                            </span>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between">
                            <span className="font-bold">Net Balance:</span>
                            <span className={`font-bold ${(spendingData.summary?.totalIncome || 0) - (spendingData.summary?.totalExpenses || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency((spendingData.summary?.totalIncome || 0) - (spendingData.summary?.totalExpenses || 0))}
                            </span>
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                        <CardTitle>Period Statistics</CardTitle>
                        <CardDescription>Key metrics for your spending period</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="font-medium">Transactions:</span>
                            <span>{spendingData.summary?.transactionCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Average Transaction:</span>
                            <span>{formatCurrency(spendingData.summary?.avgTransactionAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Most Active Day:</span>
                            <span>{spendingData.summary?.mostActiveDay || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Spending Trend:</span>
                            <span className={`${spendingData.summary?.expenseTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {spendingData.summary?.expenseTrend > 0 
                                ? `+${spendingData.summary?.expenseTrend}%` 
                                : `${spendingData.summary?.expenseTrend}%`}
                            </span>
                        </div>
                        </CardContent>
                    </Card>
                    </div>
                </TabsContent>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Spending Timeline</CardTitle>
                    <CardDescription>Daily spending over selected period</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={spendingData.timelineData}
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="expense" 
                            stroke="#f87171" 
                            activeDot={{ r: 8 }} 
                            name="Expense"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="income" 
                            stroke="#4ade80" 
                            name="Income" 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Category Breakdown</CardTitle>
                    <CardDescription>Where your money is going</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={spendingData.categoryBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {spendingData.categoryBreakdown.map((entry, index) => (
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
              </div>
            </TabsContent>
            
            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Category Analysis</CardTitle>
                  <CardDescription>Detailed spending by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={spendingData.categoryBreakdown}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="value" name="Amount" fill="#8884d8">
                          {spendingData.categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Spending Trends</CardTitle>
                  <CardDescription>How your spending changes over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={spendingData.spendingTrends}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="amount" name="Amount" fill="#82ca9d" />
                        <Bar dataKey="average" name="Average" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="patterns" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekday Analysis</CardTitle>
                    <CardDescription>Your spending patterns by day of week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart outerRadius={90} data={spendingData.weekdayAnalysis}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="day" />
                          <PolarRadiusAxis />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Radar
                            name="Amount"
                            dataKey="amount"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.6}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Merchant Frequency</CardTitle>
                    <CardDescription>Where you shop most frequently</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={spendingData.merchantFrequency}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={100} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" name="Visits" fill="#8884d8" />
                          <Bar dataKey="total" name="Total Spent" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="anomalies" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Spending Anomalies</CardTitle>
                  <CardDescription>Unusual spending patterns detected</CardDescription>
                </CardHeader>
                <CardContent>
                  {spendingData.anomalies && spendingData.anomalies.length > 0 ? (
                    <div className="space-y-4">
                      {spendingData.anomalies.map((anomaly, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-amber-50">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-amber-600 font-medium">{anomaly.type}</div>
                            <div className="text-sm text-muted-foreground">{anomaly.date}</div>
                          </div>
                          <p className="text-sm">{anomaly.description}</p>
                          <div className="mt-2 text-lg font-medium">
                            {formatCurrency(anomaly.amount)}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {anomaly.percentDiff}% {anomaly.comparedTo}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No unusual spending patterns detected in this period.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="spending-progression" className="space-y-4">
              {/* Spending Style Insight Alert */}
              <Alert variant={
                spendingData.spendingStyle?.type === "Front-Loader" ? "destructive" : 
                spendingData.spendingStyle?.type === "Back-Loader" ? "warning" :
                "default"
              }>
                <div className="flex gap-2">
                  {spendingData.spendingStyle?.type === "Front-Loader" ? 
                    <AlertTriangle className="h-5 w-5" /> : 
                    spendingData.spendingStyle?.type === "Back-Loader" ? 
                    <AlertCircle className="h-5 w-5" /> : 
                    <Info className="h-5 w-5" />
                  }
                  <AlertTitle>Your Spending Rhythm: {spendingData.spendingStyle?.type || 'Balanced'}</AlertTitle>
                </div>
                <AlertDescription className="mt-2 ml-7">
                  {spendingData.spendingStyle?.type === "Front-Loader" ? 
                    "You tend to spend more freely at the beginning of the month when you have more money available. Consider pacing your spending more evenly to avoid end-of-month constraints." : 
                    spendingData.spendingStyle?.type === "Back-Loader" ? 
                    "You're notably conservative with spending early in the month but increase spending later. While this shows discipline, consider if delaying needed expenses creates stress." : 
                    "You maintain relatively consistent spending throughout the month, showing good financial discipline and pacing."
                  }
                </AlertDescription>
              </Alert>

              {/* Financial Stress Indicator Alert */}
              {spendingData.weeklyVariance > 50 && (
                <Alert variant="warning">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>High Spending Variance Detected</AlertTitle>
                  </div>
                  <AlertDescription className="mt-2 ml-7">
                    Your week-to-week spending varies by {spendingData.weeklyVariance}%, suggesting feast/famine spending cycles. 
                    More consistent spending throughout the month would help balance your cash flow and reduce financial stress.
                  </AlertDescription>
                </Alert>
              )}

              {/* Payday Dependency Alert */}
              {spendingData.paydaySummary && spendingData.paydaySummary.postPayday > (spendingData.paydaySummary.prePayday * 1.5) && (
                <Alert variant="destructive">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertTitle>Payday Spending Spike</AlertTitle>
                  </div>
                  <AlertDescription className="mt-2 ml-7">
                    Your spending increases by {spendingData.paydaySummary.changePercentage}% immediately after payday. 
                    This pattern can lead to premature depletion of funds. Consider allocating your income to last the entire period.
                  </AlertDescription>
                </Alert>
              )}

              {/* Month-End Cash Flow Alert */}
              {spendingData.cumulativeSpending && spendingData.cumulativeSpending.length > 25 && 
                spendingData.cumulativeSpending[24].current > (spendingData.cumulativeSpending[spendingData.cumulativeSpending.length-1].current * 0.9) && (
                <Alert>
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Month-End Cash Conservation</AlertTitle>
                  </div>
                  <AlertDescription className="mt-2 ml-7">
                    You spend 90% of your monthly budget by day 25, leaving minimal funds for the end of the month.
                    This suggests you may be experiencing financial pressure in the final days of each period.
                  </AlertDescription>
                </Alert>
              )}

              {/* Balanced Spending Alert - show only if none of the above issues */}
              {spendingData.weeklyVariance <= 30 && 
               spendingData.spendingStyle?.type === "Balanced" && 
               (!spendingData.paydaySummary || spendingData.paydaySummary.postPayday <= (spendingData.paydaySummary.prePayday * 1.3)) && (
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <div className="flex gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <AlertTitle className="text-green-800">Healthy Financial Discipline</AlertTitle>
                  </div>
                  <AlertDescription className="mt-2 ml-7 text-green-700">
                    Your spending patterns show good financial discipline with consistent pacing throughout the month.
                    You maintain steady spending without major payday spikes, indicating effective cash flow management.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Cumulative Spending Curve</CardTitle>
                    <CardDescription>See how your spending accumulates throughout the month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={spendingData.cumulativeSpending}
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="day" 
                            label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }} 
                          />
                          <YAxis 
                            label={{ value: 'Cumulative Amount', angle: -90, position: 'insideLeft' }} 
                          />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="current"
                            stroke="#f87171"
                            name="Current Month"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="average"
                            stroke="#8884d8"
                            name="Average Pattern"
                            strokeDasharray="5 5"
                          />
                          <Line
                            type="monotone"
                            dataKey="ideal"
                            stroke="#4ade80"
                            name="Linear Ideal"
                            strokeDasharray="3 3"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Add an explanatory alert below the chart */}
                    <Alert className="mt-4 bg-slate-50 border-slate-200">
                      <Info className="h-5 w-5" />
                      <AlertTitle>What This Shows</AlertTitle>
                      <AlertDescription>
                        This chart compares your actual spending pattern (red line) to an ideal linear pace (green line) and your historical average (purple line). 
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                          <li>If your actual line rises steeply early then flattens, you spend more freely at the beginning of the month.</li>
                          <li>If your actual line is flatter early then rises steeply later, you're more conservative early but spend more toward month-end.</li>
                          <li>The closer your line follows the green ideal line, the more evenly you're pacing your spending.</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card className="lg:row-span-2">
                  <CardHeader>
                    <CardTitle>Daily Spending Velocity</CardTitle>
                    <CardDescription>Average spending by week of month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={spendingData.weeklyVelocity}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis 
                            type="category" 
                            dataKey="week" 
                            width={100}
                          />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="averageDaily" name="Avg Daily Spend" fill="#8884d8" />
                          <Bar dataKey="totalSpent" name="Total Spent" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                        <span>Highest spending week:</span>
                        <span className="font-medium">{spendingData.highestWeek?.week || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                        <span>Lowest spending week:</span>
                        <span className="font-medium">{spendingData.lowestWeek?.week || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                        <span>Week-to-week variance:</span>
                        <span className={`font-medium ${spendingData.weeklyVariance > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {spendingData.weeklyVariance}%
                        </span>
                        </div>
                      </div>
                      {/* Add an explanatory alert for this chart */}
                      <Alert className="bg-slate-50 border-slate-200">
                        <Info className="h-5 w-5" />
                        <AlertTitle>Cash Flow Management</AlertTitle>
                        <AlertDescription>
                          {spendingData.weeklyVariance > 50 ? 
                            "High variance between weeks indicates feast/famine spending cycles, which can create financial stress." : 
                            "Your relatively consistent weekly spending indicates steady cash flow management."}
                          <br />
                          <span className="font-medium mt-1 block">
                            Insight: {spendingData.highestWeek?.week === "Week 1 (1-7)" ? 
                              "You spend most heavily in the first week, which may deplete funds too early." : 
                              spendingData.highestWeek?.week === "Week 4+ (22-31)" ?
                              "You spend most heavily in the last week, suggesting good conservation of funds throughout the month." :
                              "Your heaviest spending in the middle of the month indicates balanced cash flow management."}
                          </span>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Payday Impact Analysis</CardTitle>
                    <CardDescription>How your spending changes around paydays</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={spendingData.paydayImpact}
                          margin={{ top: 5, right: 20, left: 10, bottom: 25 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="day" 
                            label={{ value: 'Days from Payday', position: 'insideBottom', offset: -5 }} 
                          />
                          <YAxis 
                            label={{ value: 'Avg Daily Spend', angle: -90, position: 'insideLeft' }} 
                          />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="spending"
                            stroke="#f87171"
                            name="Daily Spending"
                            dot={{ stroke: '#f87171', strokeWidth: 2, r: 4 }}
                          />
                          <ReferenceLine x="0" stroke="#4ade80" label={{ value: 'Payday', position: 'top' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-sm font-medium">Pre-Payday (5 days before)</p>
                        <p className="text-xl font-bold mt-1">{formatCurrency(spendingData.paydaySummary?.prePayday || 0)}</p>
                        <p className="text-xs text-muted-foreground">avg. daily spending</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-sm font-medium">Post-Payday (5 days after)</p>
                        <p className="text-xl font-bold mt-1">{formatCurrency(spendingData.paydaySummary?.postPayday || 0)}</p>
                        <p className="text-xs text-muted-foreground">avg. daily spending</p>
                      </div>
                    </div>
                    {/* Add an explanatory alert for the payday impact */}
                    <Alert className="mt-4 bg-slate-50 border-slate-200">
                      <Info className="h-5 w-5" />
                      <AlertTitle>Payday Influence</AlertTitle>
                      <AlertDescription>
                        {Math.abs(spendingData.paydaySummary?.changePercentage) > 40 ? 
                          `Your spending changes dramatically (${spendingData.paydaySummary?.changePercentage}%) around payday, indicating your spending is heavily influenced by when you receive income.` : 
                          "Your spending remains relatively consistent regardless of payday timing, showing good budgeting discipline."}
                        <br />
                        <span className="font-medium block mt-1">
                          {spendingData.paydaySummary?.postPayday > spendingData.paydaySummary?.prePayday * 1.5 ?
                            "The spike in spending right after payday could deplete your funds too quickly." :
                            "You maintain healthy spending control even with fresh funds available."}
                        </span>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            </>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
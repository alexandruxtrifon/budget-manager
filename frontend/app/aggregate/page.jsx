'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { 
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { IconUsers, IconArrowUpRight, IconArrowDownRight, IconClock, IconCalendarStats, IconFileImport, IconListCheck } from '@tabler/icons-react';

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
  CardFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AggregatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    todayLogins: 0,
    mostActiveUser: { email: '', count: 0 },
    biggestIncome: { amount: 0, currency: 'RON', description: '' },
    biggestExpense: { amount: 0, currency: 'RON', description: '' },
    newUsersThisMonth: 0,
    importedTransactions: 0,
    totalTransactions: 0,
    avgTransactionAmount: 0,
    successfulLogins: 0,
    failedLogins: 0
  });
  const [timeframe, setTimeframe] = useState('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [chartData, setChartData] = useState({
    activityByDay: [],
    activityByType: [],
    userActivity: []
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.replace('/login');
      return;
    } 
    
    try {
      const parsedUser = JSON.parse(storedUser);
      
      // Check if user has admin role
      if (parsedUser.role !== 'admin') {
        toast.error('You need admin privileges to access this page');
        router.replace('/dashboard');
        return;
      }
      
      setUser({
        ...parsedUser,
        name: parsedUser.full_name,
        email: parsedUser.email,
        avatar: "/avatars/default.png"
      });
      
      fetchLogs();
      fetchStats();
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error);
      localStorage.clear();
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (logs.length > 0) {
      processChartData();
    }
  }, [logs, timeframe]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/logs/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await res.json();
      setLogs(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load activity logs');
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/logs/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load stats');
    }
  };

  const processChartData = () => {
    let startDate;
    const endDate = new Date();
    
    // Determine date range based on selected timeframe
    switch (timeframe) {
      case 'day':
        startDate = subDays(endDate, 1);
        break;
      case 'week':
        startDate = subDays(endDate, 7);
        break;
      case 'month':
        startDate = subDays(endDate, 30);
        break;
      case 'year':
        startDate = subDays(endDate, 365);
        break;
      default:
        startDate = subDays(endDate, 7);
    }
    
    // Filter logs by date
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
    
    // Process activity by day
    const activityByDay = {};
    filteredLogs.forEach(log => {
      const day = format(new Date(log.timestamp), 'yyyy-MM-dd');
      activityByDay[day] = (activityByDay[day] || 0) + 1;
    });
    
    const activityByDayArray = Object.keys(activityByDay).map(day => ({
      date: format(new Date(day), 'MMM dd'),
      count: activityByDay[day]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Process activity by type
    const activityByType = {};
    filteredLogs.forEach(log => {
      const type = log.action || 'Unknown';
      activityByType[type] = (activityByType[type] || 0) + 1;
    });
    
    const activityByTypeArray = Object.keys(activityByType).map(type => ({
      name: type,
      value: activityByType[type]
    })).sort((a, b) => b.value - a.value);
    
    // Process activity by user
    const userActivity = {};
    filteredLogs.forEach(log => {
      if (log.user_id) {
        const userId = log.user_id;
        userActivity[userId] = (userActivity[userId] || 0) + 1;
      }
    });
    
    // Get user details for the most active users
    const userActivityArray = Object.entries(userActivity)
      .map(([userId, count]) => {
        const userLog = logs.find(log => log.user_id === parseInt(userId) && log.details && log.details.user_email);
        return {
          userId,
          email: userLog && userLog.details ? userLog.details.user_email || 'Unknown' : 'Unknown',
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 users
    
    setChartData({
      activityByDay: activityByDayArray,
      activityByType: activityByTypeArray,
      userActivity: userActivityArray
    });
  };

  const getActionColor = (action) => {
    const actionColors = {
      'VIEW_TRANSACTIONS': 'bg-blue-100 text-blue-800',
      'CREATE_TRANSACTION': 'bg-green-100 text-green-800',
      'VIEW_ACCOUNT_TRANSACTIONS': 'bg-blue-100 text-blue-800',
      'REGISTER': 'bg-purple-100 text-purple-800',
      'LOGIN': 'bg-teal-100 text-teal-800',
      'UPDATE_USER_PROFILE': 'bg-amber-100 text-amber-800',
      'UPDATE_OWN_PROFILE': 'bg-amber-100 text-amber-800',
      'CREATE_USER': 'bg-green-100 text-green-800',
      'DELETE_USER': 'bg-red-100 text-red-800',
      'VIEW_USER_DETAILS': 'bg-blue-100 text-blue-800',
      'GENERATE_REPORT': 'bg-indigo-100 text-indigo-800',
    };
    
    return actionColors[action] || 'bg-gray-100 text-gray-800';
  };

  const getEntityTypeColor = (entityType) => {
    const entityColors = {
      'TRANSACTION': 'bg-emerald-100 text-emerald-800',
      'USER': 'bg-violet-100 text-violet-800',
      'ACCOUNT': 'bg-sky-100 text-sky-800',
      'ANALYTICS': 'bg-pink-100 text-pink-800',
    };
    
    return entityColors[entityType] || 'bg-gray-100 text-gray-800';
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    
    return (
      (log.action && log.action.toLowerCase().includes(searchTermLower)) ||
      (log.entity_type && log.entity_type.toLowerCase().includes(searchTermLower)) ||
      (log.entity_name && log.entity_name.toLowerCase().includes(searchTermLower)) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTermLower))
    );
  });

  const formatDateTime = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
  };

  if (isLoading || !user) {
    return <LoadingScreen message="Loading aggregate data..." />;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Aggregate Data</h1>
                <p className="text-muted-foreground">System-wide statistics and activity analysis</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Timeframe:</p>
                  <Select 
                    value={timeframe}
                    onValueChange={setTimeframe}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Last 24 Hours</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => {
                    fetchLogs();
                    fetchStats();
                    toast.success('Data refreshed');
                  }}
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
                    Logins Today
                  </CardTitle>
                  <IconUsers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayLogins}</div>
                  <p className="text-xs text-muted-foreground">
                    Most active: {stats.mostActiveUser.email || 'N/A'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Biggest Income
                  </CardTitle>
                  <IconArrowUpRight className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.biggestIncome.amount} {stats.biggestIncome.currency}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.biggestIncome.description || 'No data'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Biggest Expense
                  </CardTitle>
                  <IconArrowDownRight className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.biggestExpense.amount} {stats.biggestExpense.currency}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.biggestExpense.description || 'No data'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    New Users This Month
                  </CardTitle>
                  <IconUsers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.newUsersThisMonth}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.newUsersThisMonth > 0
                      ? `+${stats.newUsersThisMonth} from last month`
                      : 'No new users this month'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Imported Transactions
                  </CardTitle>
                  <IconFileImport className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.importedTransactions}</div>
                  <p className="text-xs text-muted-foreground">
                    {((stats.importedTransactions / stats.totalTransactions) * 100).toFixed(1)}% of all transactions
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Login Success Rate
                  </CardTitle>
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.successfulLogins + stats.failedLogins > 0 
                      ? ((stats.successfulLogins / (stats.successfulLogins + stats.failedLogins)) * 100).toFixed(1) + '%'
                      : 'N/A'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.failedLogins} failed login attempts
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Transactions
                  </CardTitle>
                  <IconListCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                  <p className="text-xs text-muted-foreground">
                    Avg: {stats.avgTransactionAmount.toFixed(2)} RON
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    System Activity
                  </CardTitle>
                  <IconCalendarStats className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{logs.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Total system events recorded
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="activity" className="space-y-4">
              <TabsList>
                <TabsTrigger value="activity">Activity Trends</TabsTrigger>
                <TabsTrigger value="users">User Activity</TabsTrigger>
                <TabsTrigger value="actions">Action Types</TabsTrigger>
                <TabsTrigger value="logs">Raw Logs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Over Time</CardTitle>
                    <CardDescription>System activity trend for the selected time period</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.activityByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#8884d8" 
                          name="Activity Count"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Most Active Users</CardTitle>
                    <CardDescription>Top users by activity count in the selected time period</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={chartData.userActivity} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="email" 
                          tick={{ fontSize: 12 }}
                          width={140}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#82ca9d" name="Activity Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Action Types Distribution</CardTitle>
                    <CardDescription>Breakdown of system activities by action type</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.activityByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.activityByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} events`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="logs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>System Activity Logs</CardTitle>
                    <CardDescription>Detailed log of all system activities</CardDescription>
                    <div className="pt-2">
                      <Input
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Time</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity Type</TableHead>
                            <TableHead>Entity Name</TableHead>
                            <TableHead className="text-right">Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLogs.slice(0, 100).map((log, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-xs">
                                {log.timestamp ? formatDateTime(log.timestamp) : 'Unknown'}
                              </TableCell>
                              <TableCell>
                                <Badge className={getActionColor(log.action)}>
                                  {log.action || 'Unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getEntityTypeColor(log.entity_type)}>
                                  {log.entity_type || 'Unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {log.entity_name || 'N/A'}
                              </TableCell>
                              <TableCell className="text-right">
                                {log.details ? (
                                  <Button 
                                    variant="ghost" 
                                    onClick={() => {
                                      toast.info(
                                        <pre className="max-h-[300px] overflow-auto">
                                          {JSON.stringify(log.details, null, 2)}
                                        </pre>,
                                        { 
                                          duration: 10000,
                                          description: "Log Details" 
                                        }
                                      );
                                    }}
                                  >
                                    View
                                  </Button>
                                ) : 'No details'}
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredLogs.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="h-24 text-center">
                                No logs found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {filteredLogs.length > 100 && (
                      <div className="text-center mt-4 text-sm text-muted-foreground">
                        Showing 100 of {filteredLogs.length} logs. Refine your search to see more specific results.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DateRangePicker } from "@/components/date-range-picker";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  IconTrendingUp, 
  IconTrendingDown, 
  IconCash, 
  IconCalculator, 
  IconMathAvg,
  IconMathMin,
  IconChartHistogram,
  IconChartDots
} from "@tabler/icons-react";
import { toast } from "sonner";
import { ForecastChart } from "@/components/forecast-chart";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LoadingScreen } from "@/components/ui/spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ForecastPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [forecastData, setForecastData] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    to: new Date(),
  });
  const [periodMode, setPeriodMode] = useState("6m");
  
  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser({
        ...parsedUser,
        name: parsedUser.full_name,
        email: parsedUser.email,
        //avatar: "/avatars/default.png" // Provide a default avatar
      });
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error);
      localStorage.clear();
      router.replace('/login');
    }    //fetchForecastData();
  }, []);
  
  // Fetch data when date range changes
  useEffect(() => {
    if (user) {
      fetchForecastData();
    }
  }, [user, dateRange]);

  const fetchForecastData = async () => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      
      const startDate = dateRange.from.toISOString().split('T')[0];
      const endDate = dateRange.to.toISOString().split('T')[0];
      
      const response = await fetch(
        `http://localhost:3001/api/forecast/${user.user_id}?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch forecast data");
      }
      
      const data = await response.json();
      setForecastData(data);
    } catch (error) {
      console.error("Error fetching forecast data:", error);
      toast.error("Failed to load forecast data");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (value) => {
    setPeriodMode(value);
    
    const today = new Date();
    let fromDate;
    
    switch (value) {
      case "30d":
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 30);
        break;
      case "3m":
        fromDate = new Date(today);
        fromDate.setMonth(today.getMonth() - 3);
        break;
      case "6m":
        fromDate = new Date(today);
        fromDate.setMonth(today.getMonth() - 6);
        break;
      case "1y":
        fromDate = new Date(today);
        fromDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        fromDate = new Date(today);
        fromDate.setMonth(today.getMonth() - 6);
    }
    
    setDateRange({
      from: fromDate,
      to: today
    });
  };

    const getDataQualityBadge = (count) => {
    if (count < 5) {
      return (
        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100">
          <IconAlertTriangle className="h-3 w-3 mr-1" /> Very Limited Data
        </Badge>
      );
    } else if (count < 15) {
      return (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
          <IconAlertTriangle className="h-3 w-3 mr-1" /> Limited Data
        </Badge>
      );
    } else if (count < 30) {
      return (
        <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
          <IconInfoCircle className="h-3 w-3 mr-1" /> Moderate Data
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100">
          <IconInfoCircle className="h-3 w-3 mr-1" /> Good Data Sample
        </Badge>
      );
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "RON",
      minimumFractionDigits: 2,
    }).format(value);
  };
  if (isLoading && !forecastData) {
    return <LoadingScreen message="Loading forecast data..." />;
  }
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      }}
    >
      <AppSidebar user={user} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Financial Forecast</h1>
                      <p className="text-muted-foreground">
                        View trends and predictions based on your transaction history
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                      <Select value={periodMode} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30d">Last 30 days</SelectItem>
                          <SelectItem value="3m">Last 3 months</SelectItem>
                          <SelectItem value="6m">Last 6 months</SelectItem>
                          <SelectItem value="1y">Last year</SelectItem>
                          <SelectItem value="custom">Custom range</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {periodMode === "custom" && (
                        <DateRangePicker
                          date={dateRange}
                          onDateChange={setDateRange}
                        />
                      )}
                      
                      <Button onClick={fetchForecastData} disabled={isLoading}>
                        Update
                      </Button>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="income" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="income">Income</TabsTrigger>
                      <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="income" className="space-y-6">
                      {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {[...Array(4)].map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                              <CardHeader className="p-4">
                                <Skeleton className="h-6 w-1/2" />
                                <Skeleton className="h-4 w-3/4" />
                              </CardHeader>
                              <CardContent>
                                <Skeleton className="h-10 w-3/4" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : forecastData ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <IconMathAvg className="h-5 w-5 text-blue-500" />
                                  <span>Average Income</span>
                                </CardTitle>
                                <CardDescription>Per transaction</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">
                                  {formatCurrency(forecastData.statistics.income.average)}
                                </div>
                              </CardContent>
                              <CardFooter className="pt-0 text-xs text-muted-foreground">
                                Based on {forecastData.statistics.income.count} transactions
                              </CardFooter>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <IconMathMin className="h-5 w-5 text-emerald-500" />
                                  <span>Median Income</span>
                                </CardTitle>
                                <CardDescription>Middle value</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">
                                  {formatCurrency(forecastData.statistics.income.median)}
                                </div>
                              </CardContent>
                              <CardFooter className="pt-0 text-xs text-muted-foreground">
                                Eliminates outliers in your data
                              </CardFooter>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <IconChartHistogram className="h-5 w-5 text-purple-500" />
                                  <span>Most Common</span>
                                </CardTitle>
                                <CardDescription>Mode value</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">
                                  {formatCurrency(forecastData.statistics.income.mode)}
                                </div>
                              </CardContent>
                              <CardFooter className="pt-0 text-xs text-muted-foreground">
                                Your most frequent income amount
                              </CardFooter>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <IconCash className="h-5 w-5 text-green-500" />
                                  <span>Total Income</span>
                                </CardTitle>
                                <CardDescription>For selected period</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">
                                  {formatCurrency(forecastData.statistics.income.total)}
                                </div>
                              </CardContent>
                              <CardFooter className="pt-0 text-xs text-muted-foreground">
                                {new Date(dateRange.from).toLocaleDateString()} to {new Date(dateRange.to).toLocaleDateString()}
                              </CardFooter>
                            </Card>
                          </div>
                          
                          <Card className="overflow-hidden">
                            <CardHeader>
                              <CardTitle>Income Forecast</CardTitle>
                              <CardDescription>
                                Historical data with 3-month projection (dotted)
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="h-96">
                                <ForecastChart 
                                  historicalData={forecastData.chart.income}
                                  forecastData={forecastData.chart.forecast.income}
                                  type="income"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <p>No income data available for the selected period.</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="expenses" className="space-y-6">
                      {/* Expenses tab content - same structure as income tab */}
                      {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {[...Array(4)].map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                              <CardHeader className="p-4">
                                <Skeleton className="h-6 w-1/2" />
                                <Skeleton className="h-4 w-3/4" />
                              </CardHeader>
                              <CardContent>
                                <Skeleton className="h-10 w-3/4" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : forecastData ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <IconMathAvg className="h-5 w-5 text-blue-500" />
                                  <span>Average Expense</span>
                                </CardTitle>
                                <CardDescription>Per transaction</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">
                                  {formatCurrency(forecastData.statistics.expenses.average)}
                                </div>
                              </CardContent>
                              <CardFooter className="pt-0 text-xs text-muted-foreground">
                                Based on {forecastData.statistics.expenses.count} transactions
                              </CardFooter>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <IconMathMin className="h-5 w-5 text-emerald-500" />
                                  <span>Median Expense</span>
                                </CardTitle>
                                <CardDescription>Middle value</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">
                                  {formatCurrency(forecastData.statistics.expenses.median)}
                                </div>
                              </CardContent>
                              <CardFooter className="pt-0 text-xs text-muted-foreground">
                                Eliminates outliers in your data
                              </CardFooter>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <IconChartHistogram className="h-5 w-5 text-purple-500" />
                                  <span>Most Common</span>
                                </CardTitle>
                                <CardDescription>Mode value</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">
                                  {formatCurrency(forecastData.statistics.expenses.mode)}
                                </div>
                              </CardContent>
                              <CardFooter className="pt-0 text-xs text-muted-foreground">
                                Your most frequent expense amount
                              </CardFooter>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <IconCash className="h-5 w-5 text-red-500" />
                                  <span>Total Expenses</span>
                                </CardTitle>
                                <CardDescription>For selected period</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">
                                  {formatCurrency(forecastData.statistics.expenses.total)}
                                </div>
                              </CardContent>
                              <CardFooter className="pt-0 text-xs text-muted-foreground">
                                {new Date(dateRange.from).toLocaleDateString()} to {new Date(dateRange.to).toLocaleDateString()}
                              </CardFooter>
                            </Card>
                          </div>
                          
                          <Card className="overflow-hidden">
                            <CardHeader>
                              <CardTitle>Expense Forecast</CardTitle>
                              <CardDescription>
                                Historical data with 3-month projection (dotted)
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="h-96">
                                <ForecastChart 
                                  historicalData={forecastData.chart.expenses}
                                  forecastData={forecastData.chart.forecast.expenses}
                                  type="expense"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <p>No expense data available for the selected period.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { IconArrowUpRight, IconCreditCard, IconCash, IconReceipt } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useState, useEffect } from 'react';

export function SectionCards({ transactions = [], accounts = [], timeRange = "30d" }) {
  const totalBalance = accounts.reduce((sum, account) => {
    if (!account || typeof account.balance === 'undefined') return sum;
    const balance = typeof account.balance === 'string' ? parseFloat(account.balance) : Number(account.balance);
    return isNaN(balance) ? sum : sum + balance;
  }, 0);

  // Filter transactions based on selected time range
  const filteredTransactions = transactions.filter(transaction => {
    if (!transaction || !transaction.transaction_date) return false;
    try {
      const txDate = new Date(transaction.transaction_date);
      const now = new Date();
      // Use the timeRange prop correctly here
      const daysToFilter = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      
      // Calculate date X days ago
      const startDate = new Date();
      startDate.setDate(now.getDate() - daysToFilter);
      
      return txDate >= startDate;
    } catch (error) {
      console.error("Invalid date format:", transaction.transaction_date);
      return false;
    }
  });
  
  // Calculate totals from the filtered transactions
  const { income, expense } = filteredTransactions.reduce(
    (acc, transaction) => {
      if (!transaction || typeof transaction.amount === 'undefined') return acc;
      
      const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : Number(transaction.amount);
      
      if (isNaN(amount)) return acc;
      
      if (transaction.transaction_type === "income") {
        acc.income += amount;
      } else if (transaction.transaction_type === "expense") {
        acc.expense += amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  // Get time range label for display
  const timeRangeLabel = timeRange === "7d" ? "7 Days" : 
                        timeRange === "30d" ? "30 Days" : 
                        "3 Months";

  const currency = accounts.length > 0 ? 
    (accounts[0]?.currency || "RON") : 
    "RON";

  const formatCurrency = (amount, currencyCode = currency) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode
      }).format(amount);
    } catch (error) {
      console.error("Error formatting currency:", error);
      return `${currencyCode} ${amount.toFixed(2)}`;
    }
  };

  const calculatePercentage = () => {
    if (income <= 0) return "0.0"; // Avoid division by zero
    return ((income - expense) / income * 100).toFixed(1);
  };

  const incomeTransactions = filteredTransactions.filter(t => t?.transaction_type === "income").length;
  const expenseTransactions = filteredTransactions.filter(t => t?.transaction_type === "expense").length;
  const spendingPercent = income > 0 ? ((expense / income) * 100).toFixed(1) : "0.0";

  return (
    <div className="grid gap-4 px-4 md:grid-cols-2 lg:grid-cols-4 lg:px-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Spendings / Income <span className="text-xs text-muted-foreground">({timeRangeLabel})</span>
          </CardTitle>
          <IconTrendingDown className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">{spendingPercent}%</div>
          <p className="text-xs text-muted-foreground">
            {expenseTransactions} expense transaction{expenseTransactions !== 1 ? 's' : ''} in period
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Income <span className="text-xs text-muted-foreground">({timeRangeLabel})</span>
          </CardTitle>
          <IconArrowUpRight className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">{formatCurrency(income)}</div>
          <p className="text-xs text-muted-foreground">
            {incomeTransactions} transaction{incomeTransactions !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Expenses <span className="text-xs text-muted-foreground">({timeRangeLabel})</span>
          </CardTitle>
          <IconCash className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{formatCurrency(expense)}</div>
          <p className="text-xs text-muted-foreground">
            {expenseTransactions} transaction{expenseTransactions !== 1 ? 's' : ''} 
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Balance <span className="text-xs text-muted-foreground">({timeRangeLabel})</span>
          </CardTitle>
          <IconReceipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${income - expense >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(income - expense)}
          </div>
          <p className="text-xs text-muted-foreground">
            {income - expense >= 0 ? '↗ +' : '↘ '}{calculatePercentage()}% 
            compared to income
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

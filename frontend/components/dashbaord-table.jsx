"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export function TransactionsTable({ 
  data, 
  accounts = [],
  onImportComplete
}) {
  const truncateText = (text, maxLength) => {
    if (!text) return "No description";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Calculate pagination details
  const pageCount = Math.ceil(data.length / pagination.pageSize);
  const pageStart = pagination.pageIndex * pagination.pageSize;
  const pageEnd = Math.min(pageStart + pagination.pageSize, data.length);
  const displayedData = data.slice(pageStart, pageEnd);
  
  // Format currency amount
  const formatCurrency = (amount, currency = "RON") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Get account name from account ID
  const getAccountName = (accountId) => {
    const account = accounts.find((acc) => acc.account_id === accountId);
    return account ? account.account_name : "Unknown Account";
  };

  return (
    <div className="px-4 lg:px-6">
            <Alert className="mb-4">
        <AlertTitle>How to read your transactions</AlertTitle>
        <AlertDescription>
          <ul className="list-disc ml-4">
            <li>
              <strong>Date:</strong> When the transaction occurred.
            </li>
            <li>
              <strong>Description:</strong> Short summary of the transaction. Hover for full text.
            </li>
            <li>
              <strong>Category:</strong> Automatically assigned based on keywords. "Uncategorized" means no match was found.
            </li>
            <li>
              <strong>Amount:</strong> <span className="text-emerald-600">Green</span> for income, <span className="text-rose-600">red</span> for expenses.
            </li>
            <li>
              Use the pagination controls below to browse through your transaction history.
            </li>
          </ul>
        </AlertDescription>
      </Alert>
      <div className="rounded-md border">
      <Table>
        <TableCaption>
          Recent transactions - Showing {pageStart + 1} to {pageEnd} of {data.length} transactions
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            {/* <TableHead>Account</TableHead> */}
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedData.length > 0 ? (
            displayedData.map((transaction) => (
              <TableRow key={transaction.transaction_id}>
                <TableCell>
                  {format(new Date(transaction.transaction_date), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="font-medium">
                    <div 
                      className="max-w-[250px] truncate" 
                      title={transaction.description || "No description"}
                    >
                      {truncateText(transaction.description, 50)}
                    </div>                
                    </TableCell>
                <TableCell>
                  {transaction.category_name ? (
                    <Badge variant="outline">{transaction.category_name}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Uncategorized
                    </Badge>
                  )}
                </TableCell>
                {/* <TableCell>{getAccountName(transaction.account_id)}</TableCell> */}
                <TableCell className="text-right">
                  <span
                    className={
                      transaction.transaction_type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }
                  >
                    {transaction.transaction_type === "income" ? "+" : "-"}
                    {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                  </span>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No transactions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-4 border-t">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {pageStart + 1} to {pageEnd} of {data.length} transactions
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => {
                setPagination({ pageIndex: 0, pageSize: Number(value) });
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.pageIndex > 0) {
                      setPagination({
                        ...pagination,
                        pageIndex: pagination.pageIndex - 1,
                      });
                    }
                  }}
                  disabled={pagination.pageIndex === 0}
                />
              </PaginationItem>
              
              {/* First Page */}
              <PaginationItem>
                <PaginationLink 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPagination({ ...pagination, pageIndex: 0 });
                  }}
                  isActive={pagination.pageIndex === 0}
                >
                  1
                </PaginationLink>
              </PaginationItem>
              
              {/* Show ellipsis if many pages and not near start */}
              {pageCount > 3 && pagination.pageIndex > 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              {/* Current page (if not first or last) */}
              {pageCount > 2 && 
               pagination.pageIndex !== 0 && 
               pagination.pageIndex !== pageCount - 1 && (
                <PaginationItem>
                  <PaginationLink href="#" isActive onClick={(e) => e.preventDefault()}>
                    {pagination.pageIndex + 1}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              {/* Show ellipsis if many pages and not near end */}
              {pageCount > 3 && pagination.pageIndex < pageCount - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              {/* Last Page (if more than one page) */}
              {pageCount > 1 && (
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPagination({
                        ...pagination,
                        pageIndex: pageCount - 1,
                      });
                    }}
                    isActive={pagination.pageIndex === pageCount - 1}
                  >
                    {pageCount}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.pageIndex < pageCount - 1) {
                      setPagination({
                        ...pagination,
                        pageIndex: pagination.pageIndex + 1,
                      });
                    }
                  }}
                  disabled={pagination.pageIndex >= pageCount - 1}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
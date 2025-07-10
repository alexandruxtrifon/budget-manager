'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { LoadingScreen } from "@/components/ui/spinner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IconDownload, IconFileExport, IconSearch } from '@tabler/icons-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

export default function LogsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('You need to be logged in to view stats');
        return;
      }
      
      const res = await fetch('http://localhost:3001/api/logs/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load activity statistics');
    }
  };
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
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.replace('/login');
    } else {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("User role:", parsedUser); // Debugging line
        if (parsedUser.role !== 'admin') {
          toast.error('You need admin privileges to access this page');
          setTimeout(() => router.replace('/dashboard'), 1500);
        }
        
        setUser({
          ...parsedUser,
          name: parsedUser.full_name,
          email: parsedUser.email
        });
        fetchLogs();
        fetchStats();

      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
        localStorage.clear();
        router.replace('/login');
      }
    }
  }, [router]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('You need to be logged in to view logs');
        return;
      }
      
      const res = await fetch('http://localhost:3001/api/logs/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      toast.error(error.message || 'Error loading logs');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return timestamp;
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch (error) {
      return dateString;
    }
  };

  // Function to format date for PDF
  const formatDateForPDF = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };

  // Get appropriate color classes for action badges
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

  // Get appropriate color classes for entity type badges
  const getEntityTypeColor = (entityType) => {
    const entityColors = {
      'TRANSACTION': 'bg-emerald-100 text-emerald-800',
      'USER': 'bg-violet-100 text-violet-800',
      'ACCOUNT': 'bg-sky-100 text-sky-800',
      'ANALYTICS': 'bg-pink-100 text-pink-800',
    };
    
    return entityColors[entityType] || 'bg-gray-100 text-gray-800';
  };

  // Filter logs based on search term
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
  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  // Function to export logs as PDF
  const exportToPDF = () => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Activity Logs Report', 14, 15);
      
      // Add user info and date
      doc.setFontSize(10);
      doc.text(`User: ${user.name} (${user.email})`, 14, 25);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      
      // Prepare table data - updated to match the new table structure
      const tableColumn = ["Time", "Action", "Entity Type", "Entity Name"];
      const tableRows = filteredLogs.map(log => [
        formatDateForPDF(log.timestamp),
        log.action || 'Unknown',
        log.entity_type || 'Unknown',
        // Truncate entity name if too long
        log.entity_name && log.entity_name.length > 40 
          ? log.entity_name.substring(0, 40) + '...' 
          : (log.entity_name || '<unnamed>'),
      ]);
      
      // Generate the table
      autoTable(doc, {
        startY: 35,
        head: [tableColumn],
        body: tableRows,
        headStyles: {
          fillColor: [41, 128, 185],
          fontSize: 12,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        margin: { top: 15 },
      });
      
      // Save the PDF
      doc.save(`activity-logs-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  if (isLoading || !user) {
    return <LoadingScreen message="Loading logs..." />;
  }
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
              <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
              <p className="text-muted-foreground">View your recent account activity.</p>
            </div>
            
            {/* Search and export controls */}
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  {filteredLogs.length} {filteredLogs.length === 1 ? 'record' : 'records'} found
                </div>
                <Button onClick={exportToPDF}>
                  <IconFileExport size={16} className="mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
            
            {/* Enhanced Logs Table */}
            <div className="py-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                  No logs found
                </div>
              ) : (
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
                      {paginatedLogs.map((log, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">
                            {log.timestamp ? formatDateTime(log.timestamp) : 'Unknown'}
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(log.timestamp)}
                            </div>
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
                          <TableCell>
                            <span 
                              title={log.entity_name && log.entity_name.length > 50 ? log.entity_name : undefined}
                              className="block max-w-[300px] truncate"
                            >
                              {log.entity_name && log.entity_name.length > 50
                                ? `${log.entity_name.substring(0, 50)}...` 
                                : (log.entity_name || '<unnamed>')}
                            </span>
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
                      {paginatedLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No results found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination Controls - OUTSIDE the Table */}
                  <div className="flex items-center justify-between py-4 px-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} records
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8"
                      >
                        <IconChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm flex items-center gap-1">
                        <span>Page</span>
                        <Select
                          value={currentPage.toString()}
                          onValueChange={(value) => setCurrentPage(Number(value))}
                        >
                          <SelectTrigger className="w-14 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: totalPages}, (_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span>of {totalPages}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="h-8 w-8"
                      >
                        <IconChevronRight className="h-4 w-4" />
                      </Button>
                      <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => {
                          setPageSize(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[110px] h-8">
                          <SelectValue placeholder="10 per page" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 per page</SelectItem>
                          <SelectItem value="20">20 per page</SelectItem>
                          <SelectItem value="50">50 per page</SelectItem>
                          <SelectItem value="100">100 per page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { Button } from '@/components/ui/button';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
// import { toast } from 'sonner';
// import { formatDistanceToNow, parse } from 'date-fns';
// import { LoadingScreen } from "@/components/ui/spinner";
// import { AppSidebar } from "@/components/app-sidebar";
// import { SiteHeader } from "@/components/site-header";
// import {
//   SidebarInset,
//   SidebarProvider,
// } from "@/components/ui/sidebar";
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { IconDownload, IconFileExport } from '@tabler/icons-react';

// export default function LogsPage() {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(true);
//   const [logs, setLogs] = useState([]);
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     const storedUser = localStorage.getItem('user');

//     if (!token || !storedUser) {
//       router.replace('/login');
//     } else {
//       try {
//         const parsedUser = JSON.parse(storedUser);
//         console.log("User role:", parsedUser); // Debugging line
//         if (parsedUser.role !== 'admin') {
//         toast.error('You need admin privileges to access this page');
//         setTimeout(() => router.replace('/dashboard'), 1500);
//         //router.back();
//         }
        
//         setUser({
//           ...parsedUser,
//           name: parsedUser.full_name,
//           email: parsedUser.email
//           //avatar: "/avatars/default.png"
//         });
//         fetchLogs();
//       } catch (error) {
//         console.error("Failed to parse user data from localStorage", error);
//         localStorage.clear();
//         router.replace('/login');
//       }
//     }
//   }, [router]);

//   const fetchLogs = async () => {
//     try {
//       const token = localStorage.getItem('token');
      
//       if (!token) {
//         toast.error('You need to be logged in to view logs');
//         return;
//       }
      
//       const res = await fetch('http://localhost:3001/api/logs', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });
      
//       if (!res.ok) {
//         throw new Error('Failed to fetch logs');
//       }
      
//       const data = await res.json();
//       setLogs(data);
//     } catch (error) {
//       toast.error(error.message || 'Error loading logs');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const formatTimestamp = (timestamp) => {
//     try {
//       return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
//     } catch (error) {
//       return timestamp;
//     }
//   };

//   // Function to format date for PDF
//   const formatDateForPDF = (timestamp) => {
//     try {
//       const date = new Date(timestamp);
//       return date.toLocaleString();
//     } catch (error) {
//       return timestamp;
//     }
//   };

//   // Function to export logs as PDF
//   const exportToPDF = () => {
//     try {
//       // Create a new PDF document
//       const doc = new jsPDF();
      
//       // Add title
//       doc.setFontSize(16);
//       doc.text('Activity Logs Report', 14, 15);
      
//       // Add user info and date
//       doc.setFontSize(10);
//       doc.text(`User: ${user.name} (${user.email})`, 14, 25);
//       doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      
//       // Prepare table data
//       const tableColumn = ["Type", "Action", "Entity", "Time"];
//       const tableRows = logs.map(log => [
//         log.entity_type,
//         log.action,
//         // Truncate entity name if too long
//         log.entity_name && log.entity_name.length > 40 
//           ? log.entity_name.substring(0, 40) + '...' 
//           : (log.entity_name || '<unnamed>'),
//         formatDateForPDF(log.timestamp)
//       ]);
      
//       // Generate the table
//       autoTable(doc, {
//         startY: 35,
//         head: [tableColumn],
//         body: tableRows,
//         headStyles: {
//           fillColor: [41, 128, 185],
//           fontSize: 12,
//           halign: 'center'
//         },
//         alternateRowStyles: {
//           fillColor: [240, 240, 240]
//         },
//         margin: { top: 15 },
//       });
      
//       // Save the PDF
//       doc.save(`activity-logs-${new Date().toISOString().split('T')[0]}.pdf`);
//       toast.success('PDF exported successfully');
//     } catch (error) {
//       console.error('Error exporting PDF:', error);
//       toast.error('Failed to export PDF');
//     }
//   };

//   if (isLoading || !user) {
//     return <LoadingScreen message="Loading logs..." />;
//   }

//   return (
//     <SidebarProvider
//       style={{
//         "--sidebar-width": "calc(var(--spacing) * 72)",
//         "--header-height": "calc(var(--spacing) * 12)"
//       }}>
//       <AppSidebar user={user} variant="inset" />
//       <SidebarInset>
//         <SiteHeader />
//         <div className="flex flex-1 flex-col p-6">
//           <div className="flex flex-col gap-4">
//             <div>
//               <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
//               <p className="text-muted-foreground">View your recent account activity.</p>
//             </div>
//             {/* Add export button above the table */}
//             <div className="flex justify-between items-center">
//               <div className="text-sm text-muted-foreground">
//                 {logs.length} {logs.length === 1 ? 'record' : 'records'} found
//               </div>
//               <Button 
//                 onClick={exportToPDF}
//                 //className="flex items-center gap-2"
//               >
//                 <IconFileExport size={16} />
//                 Export PDF
//               </Button>
//             </div>
//             <div className="py-4">
//               {logs.length === 0 ? (
//                 <div className="text-center text-muted-foreground py-10">
//                   No logs found
//                 </div>
//               ) : (
//                 <ScrollArea className="h-[calc(100vh-250px)]">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Type</TableHead>
//                         <TableHead>Action</TableHead>
//                         <TableHead>Entity</TableHead>
//                         <TableHead>Time</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {logs.map((log, index) => (
//                         <TableRow key={index}>
//                           <TableCell className="font-medium">{log.entity_type}</TableCell>
//                           <TableCell>{log.action}</TableCell>
//                         <TableCell>
//                         <span 
//                             title={log.entity_name && log.entity_name.length > 50 ? log.entity_name : undefined}
//                             className="block max-w-[300px] truncate"
//                         >
//                             {log.entity_name && log.entity_name.length > 50
//                             ? `${log.entity_name.substring(0, 50)}...` 
//                             : (log.entity_name || '<unnamed>')}
//                         </span>
//                         </TableCell>
//                           <TableCell>
//                             {formatTimestamp(log.timestamp)}
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </ScrollArea>
//               )}
//             </div>
//             {/* <div className="flex justify-end">
//               <Button variant="outline" onClick={() => router.back()}>
//                 Back
//               </Button>
//             </div> */}
//           </div>
//         </div>
//       </SidebarInset>
//     </SidebarProvider>
//   );
// }
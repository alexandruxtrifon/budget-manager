'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';
import { formatDistanceToNow, parse } from 'date-fns';
import { LoadingScreen } from "@/components/ui/spinner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IconDownload, IconFileExport } from '@tabler/icons-react';

export default function LogsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);

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
        //router.back();
        }
        
        setUser({
          ...parsedUser,
          name: parsedUser.full_name,
          email: parsedUser.email
          //avatar: "/avatars/default.png"
        });
        fetchLogs();
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
      
      const res = await fetch('http://localhost:3001/api/logs', {
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

  // Function to format date for PDF
  const formatDateForPDF = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };

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
      
      // Prepare table data
      const tableColumn = ["Type", "Action", "Entity", "Time"];
      const tableRows = logs.map(log => [
        log.entity_type,
        log.action,
        // Truncate entity name if too long
        log.entity_name && log.entity_name.length > 40 
          ? log.entity_name.substring(0, 40) + '...' 
          : (log.entity_name || '<unnamed>'),
        formatDateForPDF(log.timestamp)
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
            {/* Add export button above the table */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {logs.length} {logs.length === 1 ? 'record' : 'records'} found
              </div>
              <Button 
                onClick={exportToPDF}
                //className="flex items-center gap-2"
              >
                <IconFileExport size={16} />
                Export PDF
              </Button>
            </div>
            <div className="py-4">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                  No logs found
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-250px)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{log.entity_type}</TableCell>
                          <TableCell>{log.action}</TableCell>
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
                          <TableCell>
                            {formatTimestamp(log.timestamp)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
            {/* <div className="flex justify-end">
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
            </div> */}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
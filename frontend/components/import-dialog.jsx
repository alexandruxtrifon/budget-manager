'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { IconFileImport, IconPlus, IconRefresh } from '@tabler/icons-react';
import { Spinner } from '@/components/ui/spinner';

export function ImportDialog({ accounts = [], onImportComplete, userId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [file, setFile] = useState(null);
  const [open, setOpen] = useState(false);
  const [localAccounts, setLocalAccounts] = useState(accounts);

  const fetchAccounts = async () => {
    const userId = JSON.parse(localStorage.getItem('user'))?.user_id;

    if (!userId) {
        console.error("Cannot fetch accounts: userId is not provided");
        console.log(`userid: ${userId}`);
        return;
    }
    setIsLoadingAccounts(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/accounts/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocalAccounts(data);
        if (data.length === 0) {
          toast.info("No accounts found. Please create an account first.");
        }
      } else {
        throw new Error('Failed to fetch accounts');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error("Could not load accounts");
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      setLocalAccounts(accounts);
    }
  }, [accounts]);

  useEffect(() => {
    if (open && localAccounts.length === 0) {
      fetchAccounts();
    }
  }, [open]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleImport = async () => {
    if (!file || !selectedAccount) {
      toast.error("Please select a file and an account");
      return;
    }

    userId = JSON.parse(localStorage.getItem('user'))?.user_id;

    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('statementFile', file);
    formData.append('accountId', selectedAccount);
    formData.append('userId', userId);
    console.log("userId being sent:", userId);
console.log("accountId being sent:", selectedAccount);
    try {
      const res = await fetch('http://localhost:3001/api/import/bank-statement', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to import statement');
      }
      
      const result = await res.json();
      toast.success(`Successfully imported ${result.count} transactions`);
      
      if (onImportComplete) {
        onImportComplete();
      }
      
      setOpen(false);
      setFile(null);
      setSelectedAccount("");
    } catch (error) {
      toast.error(error.message || 'Error importing statement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconFileImport className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline">Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Bank Statement</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="account">Select Account</Label>
              {isLoadingAccounts ? (
                <Spinner size="sm" />
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchAccounts} 
                  className="h-8 w-8 p-0"
                >
                  <IconRefresh className="h-4 w-4" />
                  <span className="sr-only">Refresh accounts</span>
                </Button>
              )}
            </div>
            <Select
              value={selectedAccount}
              onValueChange={setSelectedAccount}
              disabled={isLoadingAccounts || localAccounts.length === 0}
            >
              <SelectTrigger id="account">
                <SelectValue placeholder={
                  isLoadingAccounts 
                    ? "Loading accounts..." 
                    : localAccounts.length === 0 
                      ? "No accounts available" 
                      : "Select an account"
                } />
              </SelectTrigger>
              <SelectContent>
                {localAccounts.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No accounts found
                  </div>
                ) : (
                  localAccounts.map((account) => (
                    <SelectItem key={account.account_id} value={account.account_id.toString()}>
                      {account.name} ({account.currency})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {localAccounts.length === 0 && !isLoadingAccounts && (
              <p className="text-xs text-muted-foreground">
                You need to create an account before importing statements.
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="statement">Bank Statement (PDF)</Label>
            <Input
              id="statement"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
          </div>
        </div>
        <Button 
          onClick={handleImport} 
          disabled={isLoading || !file || !selectedAccount || localAccounts.length === 0}
          className="w-full"
        >
          {isLoading ? "Importing..." : "Import Statement"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
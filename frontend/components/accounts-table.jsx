'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  IconPlus, 
  IconPencil, 
  IconTrash, 
  IconDotsVertical, 
  IconCurrencyEuro, 
  IconCash, 
  IconCreditCard, 
  IconBuildingBank 
} from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { IbanInput } from "@/components/IbanInput";
import { set } from 'date-fns';

export function AccountsTable({ accounts, userId, onAccountChange }) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ibanValidation, setIbanValidation] = useState({ isValid: true });
  const [formData, setFormData] = useState({
    name: '',
    account_type: 'bank',
    currency: 'RON',
    initial_balance: 0,
  });

  const accountTypes = [
    { value: 'bank', label: 'Bank Account', icon: IconBuildingBank },
    { value: 'card', label: 'Credit/Debit Card', icon: IconCreditCard },
    { value: 'cash', label: 'Cash', icon: IconCash },
    { value: 'other', label: 'Other', icon: IconCurrencyEuro },
  ];

  const currencies = [
    { value: 'RON', label: 'Romanian Leu (RON)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'initial_balance' ? parseFloat(value) || 0 : value,
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      account_type: 'bank',
      currency: 'RON',
      initial_balance: 0,
    });
    setIbanValidation({ isValid: true });
  };
  const handleIbanChange = (value) => {
    setFormData({
      ...formData,
      name: value,
    });
  }

  const handleAddAccount = async () => {
    if (formData.name && !ibanValidation.isValid) {
      toast.error('Invalid IBAN format');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          user_id: userId,
        }),
      });

      if (response.ok) {
        toast.success('Account added successfully');
        setIsAddDialogOpen(false);
        resetForm();
        onAccountChange();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add account');
      }
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (account) => {
    setAccountToEdit(account);
    setFormData({
      name: account.name,
      account_type: account.account_type,
      currency: account.currency,
      initial_balance: parseFloat(account.initial_balance),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAccount = async () => {
    if (!accountToEdit) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3001/api/accounts/${accountToEdit.account_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          user_id: userId,
        }),
      });

      if (response.ok) {
        toast.success('Account updated successfully');
        setIsEditDialogOpen(false);
        setAccountToEdit(null);
        resetForm();
        onAccountChange();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update account');
      }
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (account) => {
    setAccountToDelete(account);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3001/api/accounts/${accountToDelete.account_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success('Account deleted successfully');
        setIsDeleteDialogOpen(false);
        setAccountToDelete(null);
        onAccountChange();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAccountTypeIcon = (type) => {
    const accountType = accountTypes.find(t => t.value === type);
    const Icon = accountType?.icon || IconCurrencyEuro;
    return <Icon size={20} />;
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Your Accounts</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
              <DialogDescription>
                Create a new account to track your finances.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                {/* <Label htmlFor="name">Account Name</Label> */}
                {/* <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="IBAN Account"
                /> */}
                <IbanInput
                  value={formData.name}
                  onChange={handleIbanChange}
                  onValidationChange={setIbanValidation}
                  label="IBAN Account"
                  placeholder="RO49 AAAA 1B31 0075 9384 0000"
                  required
                  />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account_type">Account Type</Label>
                <Select 
                  name="account_type"
                  value={formData.account_type}
                  onValueChange={(value) => handleSelectChange('account_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          <type.icon className="mr-2 h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  name="currency"
                  value={formData.currency}
                  onValueChange={(value) => handleSelectChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="initial_balance">Initial Balance</Label>
                <Input
                  id="initial_balance"
                  name="initial_balance"
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddAccount} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Initial Balance</TableHead>
              <TableHead className="text-right">Current Balance</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No accounts found. Create your first account to get started.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account.account_id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {renderAccountTypeIcon(account.account_type)}
                      <span className="ml-2 capitalize">{account.account_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{account.currency}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(account.initial_balance, account.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(account.current_balance, account.currency)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <IconDotsVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(account)}>
                          <IconPencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(account)}
                          className="text-destructive focus:text-destructive"
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Make changes to your account details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              {/* <Label htmlFor="edit-name">Account Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              /> */}
            <IbanInput
              value={formData.name}
              onChange={handleIbanChange}
              onValidationChange={setIbanValidation}
              label="IBAN Account"
              placeholder="RO49 AAAA 1B31 0075 9384 0000"
              required
            />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-account-type">Account Type</Label>
              <Select 
                name="account_type"
                value={formData.account_type}
                onValueChange={(value) => handleSelectChange('account_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center">
                        <type.icon className="mr-2 h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-currency">Currency</Label>
              <Select 
                name="currency"
                value={formData.currency}
                onValueChange={(value) => handleSelectChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-initial-balance">Initial Balance</Label>
              <Input
                id="edit-initial-balance"
                name="initial_balance"
                type="number"
                step="0.01"
                value={formData.initial_balance}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateAccount} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {accountToDelete && (
              <p>
                You are about to delete: <strong>{accountToDelete.name}</strong>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
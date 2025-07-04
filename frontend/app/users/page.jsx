"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconUsers,
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconShield,
  IconCalendar,
  IconMail,
  IconUser,
  IconBuildingBank,
  IconReceipt,
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingScreen } from "@/components/ui/spinner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const ROLES = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ro", label: "Română" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form states
  const [editingUser, setEditingUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "user",
    language_preference: "en",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        router.push("/dashboard");
        return;
      }
      setCurrentUser(user);
      fetchUsers();
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);
  // Add handleUserUpdate function for sidebar compatibility
  const handleUserUpdate = (updatedUser) => {
    console.log("Users page handleUserUpdate called with:", updatedUser);
    setCurrentUser({ ...updatedUser });
  };
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const details = await response.json();
        setUserDetails(details);
        setShowViewDialog(true);
      } else {
        throw new Error("Failed to fetch user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:3001/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers((prev) => [newUser, ...prev]);
        setShowCreateDialog(false);
        resetForm();
        toast.success("User created successfully");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData = { ...formData };
      //   if (!updateData.password) {
      //     delete updateData.password;
      //   }
      // If password is provided, send it as newPassword for admin updates
      if (updateData.password) {
        updateData.newPassword = updateData.password;
        // For admin updates, we don't require currentPassword
        updateData.currentPassword = "admin-override";
        delete updateData.password; // Remove the original password field
      } else {
        // If no password provided, don't send password fields at all
        delete updateData.password;
      }

      console.log("Sending update data:", updateData); // Debug log

      const response = await fetch(
        `http://localhost:3001/api/users/${editingUser.user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers((prev) =>
          prev.map((user) =>
            user.user_id === editingUser.user_id ? updatedUser : user
          )
        );
        setShowEditDialog(false);
        resetForm();
        toast.success("User updated successfully");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/users/${editingUser.user_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setUsers((prev) =>
          prev.filter((user) => user.user_id !== editingUser.user_id)
        );
        setShowDeleteDialog(false);
        setEditingUser(null);
        toast.success("User deleted successfully");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      full_name: "",
      role: "user",
      language_preference: "en",
    });
    setEditingUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      full_name: user.full_name,
      role: user.role,
      language_preference: user.language_preference,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (user) => {
    setEditingUser(user);
    setShowDeleteDialog(true);
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "user":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading users..." />;
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar user={currentUser} onUserUpdate={handleUserUpdate} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="container mx-auto py-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                      <IconUsers className="h-8 w-8" />
                      User Administration
                    </h1>
                    <p className="text-muted-foreground">
                      Manage user accounts and permissions
                    </p>
                  </div>
                  <Button onClick={openCreateDialog}>
                    <IconPlus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Users ({users.length})</CardTitle>
                    <CardDescription>
                      All registered users in the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Accounts</TableHead>
                          <TableHead>Transactions</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.user_id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <IconUser className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {user.full_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    ID: {user.user_id}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(user.role)}>
                                <IconShield className="h-3 w-3 mr-1" />
                                {user.role.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.account_count || 0}</TableCell>
                            <TableCell>{user.transaction_count || 0}</TableCell>
                            <TableCell>{formatDate(user.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => fetchUserDetails(user.user_id)}
                                >
                                  <IconEye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(user)}
                                >
                                  <IconEdit className="h-4 w-4" />
                                </Button>
                                {user.user_id !== currentUser?.user_id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteDialog(user)}
                                  >
                                    <IconTrash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Create User Dialog */}
                <Dialog
                  open={showCreateDialog}
                  onOpenChange={setShowCreateDialog}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Add a new user to the system
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                full_name: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Role</Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value) =>
                              setFormData((prev) => ({ ...prev, role: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Language</Label>
                          <Select
                            value={formData.language_preference}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                language_preference: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LANGUAGES.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Creating..." : "Create User"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Edit User Dialog */}
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit User</DialogTitle>
                      <DialogDescription>
                        Update user information and permissions
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_full_name">Full Name</Label>
                          <Input
                            id="edit_full_name"
                            value={formData.full_name}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                full_name: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_email">Email</Label>
                          <Input
                            id="edit_email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="edit_password">
                          New Password (leave blank to keep current)
                        </Label>
                        <Input
                          id="edit_password"
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          placeholder="Leave blank to keep current password"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Role</Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value) =>
                              setFormData((prev) => ({ ...prev, role: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Language</Label>
                          <Select
                            value={formData.language_preference}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                language_preference: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LANGUAGES.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowEditDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Updating..." : "Update User"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* View User Details Dialog */}
                <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle>User Details</DialogTitle>
                      <DialogDescription>
                        Complete user information and activity
                      </DialogDescription>
                    </DialogHeader>
                    {userDetails && (
                      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                        {/* User Info */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <IconUser className="h-5 w-5" />
                              User Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Full Name</Label>
                              <div className="font-medium">
                                {userDetails.user.full_name}
                              </div>
                            </div>
                            <div>
                              <Label>Email</Label>
                              <div className="font-medium">
                                {userDetails.user.email}
                              </div>
                            </div>
                            <div>
                              <Label>Role</Label>
                              <Badge
                                variant={getRoleBadgeVariant(
                                  userDetails.user.role
                                )}
                              >
                                {userDetails.user.role.toUpperCase()}
                              </Badge>
                            </div>
                            <div>
                              <Label>Language</Label>
                              <div className="font-medium">
                                {userDetails.user.language_preference}
                              </div>
                            </div>
                            <div>
                              <Label>Created</Label>
                              <div className="font-medium">
                                {formatDate(userDetails.user.created_at)}
                              </div>
                            </div>
                            <div>
                              <Label>Last Updated</Label>
                              <div className="font-medium">
                                {formatDate(userDetails.user.updated_at)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Accounts */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <IconBuildingBank className="h-5 w-5" />
                              Accounts ({userDetails.accounts.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {userDetails.accounts.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Currency</TableHead>
                                    <TableHead>Balance</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {userDetails.accounts.map((account) => (
                                    <TableRow key={account.account_id}>
                                      <TableCell>{account.name}</TableCell>
                                      <TableCell>
                                        {account.account_type}
                                      </TableCell>
                                      <TableCell>{account.currency}</TableCell>
                                      <TableCell>
                                        {account.current_balance}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <p className="text-muted-foreground">
                                No accounts found
                              </p>
                            )}
                          </CardContent>
                        </Card>

                        {/* Recent Transactions */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <IconReceipt className="h-5 w-5" />
                              Recent Transactions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {userDetails.recentTransactions.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Account</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Amount</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {userDetails.recentTransactions.map(
                                    (transaction) => (
                                      <TableRow
                                        key={transaction.transaction_id}
                                      >
                                        <TableCell className="whitespace-nowrap">
                                          {formatDate(
                                            transaction.transaction_date
                                          )}
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                          <div
                                            className="truncate"
                                            title={transaction.description}
                                          >
                                            {transaction.description}
                                          </div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {transaction.account_name}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {transaction.category_name ||
                                            "Uncategorized"}
                                        </TableCell>
                                        <TableCell
                                          className={`whitespace-nowrap ${
                                            transaction.transaction_type ===
                                            "expense"
                                              ? "text-red-600"
                                              : "text-green-600"
                                          }`}
                                        >
                                          {transaction.transaction_type ===
                                          "expense"
                                            ? "-"
                                            : "+"}
                                          {Math.abs(transaction.amount)}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            ) : (
                              <p className="text-muted-foreground">
                                No transactions found
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog
                  open={showDeleteDialog}
                  onOpenChange={setShowDeleteDialog}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete user "
                        {editingUser?.full_name}"? This action cannot be undone
                        and will permanently delete all their data including
                        accounts and transactions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Delete User
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// filepath: c:\Users\Alex\Sources\budget-manager\frontend\app\nomenclator\page.jsx
"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { IconPlus, IconEdit, IconTrash, IconTag } from "@tabler/icons-react"

export default function NomenclatorPage() {
    const [categories, setCategories] = useState([])
    const [isLoading, setIsLoading] = useState(true)
const [ user, setUser ] = useState({
  name: "",
  email: "",
  avatar: null
})  
const [formData, setFormData] = useState({
    name: "",
    match_keywords: []
  })
  const [editingCategory, setEditingCategory] = useState(null)
  const [keywordInput, setKeywordInput] = useState("")

  const handleUserUpdate = (updatedUser) => {
  console.log('Nomenclator handleUserUpdate called with:', updatedUser);
  console.log('Current user state before update:', user);
  setUser({ ...updatedUser }); // Force new object reference to trigger re-render
  console.log('User state should be updated now');
};
useEffect(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser({
        ...parsedUser,
        name: parsedUser.full_name,
        email: parsedUser.email,
        avatar: "avatars/default.png",  // Add this line to prevent the avatar crash
      });
    } catch (error) {
      console.error("Failed to parse user data", error);
    }
  }
}, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch('http://localhost:3001/api/categories', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error("Failed to fetch categories")
        }
        
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast({
          title: "Error",
          description: "Failed to load categories. Please try again."
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCategories()
  }, [])

  const handleAddKeyword = () => {
    if (keywordInput.trim()) {
      setFormData({
        ...formData,
        match_keywords: [...formData.match_keywords, keywordInput.trim()]
      })
      setKeywordInput("")
    }
  }

  const handleRemoveKeyword = (index) => {
    setFormData({
      ...formData,
      match_keywords: formData.match_keywords.filter((_, i) => i !== index)
    })
  }

  const handleCreateCategory = async () => {
    try {
      const token = localStorage.getItem("token")
        const response = await fetch('http://localhost:3001/api/categories', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
        })
      
      if (!response.ok) {
        throw new Error("Failed to create category")
      }
      
      const newCategory = await response.json()
      setCategories([...categories, newCategory])
      
      toast({
        title: "Success",
        description: "Category created successfully"
      })
      
      // Reset form
      setFormData({
        name: "",
        match_keywords: []
      })
    } catch (error) {
      console.error("Error creating category:", error)
      toast({
        title: "Error",
        description: "Failed to create category. Please try again."
      })
    }
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      match_keywords: category.match_keywords || []
    })
  }

  const handleUpdateCategory = async () => {
    try {
      const token = localStorage.getItem("token")
        const response = await fetch(`http://localhost:3001/api/categories/${editingCategory.category_id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
        })
      
      if (!response.ok) {
        throw new Error("Failed to update category")
      }
      
      const updatedCategory = await response.json()
      
      setCategories(categories.map(cat => 
        cat.category_id === updatedCategory.category_id ? updatedCategory : cat
      ))
      
      toast({
        title: "Success",
        description: "Category updated successfully"
      })
      
      setEditingCategory(null)
      
      // Reset form
      setFormData({
        name: "",
        match_keywords: []
      })
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: "Error",
        description: "Failed to update category. Please try again."
      })
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return
    }
    
    try {
      const token = localStorage.getItem("token")
        const response = await fetch(`http://localhost:3001/api/categories/${categoryId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
        })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete category")
      }
      
      setCategories(categories.filter(cat => cat.category_id !== categoryId))
      
      toast({
        title: "Success",
        description: "Category deleted successfully"
      })
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete category. Please try again."
      })
    }
  }

  const isAdmin = user?.role === 'admin';

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      }}>
      <AppSidebar user={user} onUserUpdate={handleUserUpdate} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Category Nomenclator</h1>
              <p className="text-muted-foreground">
                Manage transaction categories and keyword matching
              </p>
            </div>
            {isAdmin && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                      Create a new transaction category with optional keyword matching
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="keywords" className="text-right pt-2">
                        Keywords
                      </Label>
                      <div className="col-span-3 space-y-3">
                        <div className="flex gap-2">
                          <Input
                            id="keywords"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder="Add match keywords"
                            className="flex-1"
                          />
                          <Button type="button" variant="secondary" onClick={handleAddKeyword}>
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.match_keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="px-2 py-1">
                              {keyword}
                              <button 
                                onClick={() => handleRemoveKeyword(index)}
                                className="ml-2 text-muted-foreground hover:text-foreground"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Keywords help automatically categorize transactions
                        </p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleCreateCategory}>Save Category</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Transaction Categories</CardTitle>
              <CardDescription>
                Categories are used to organize and analyze your transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Match Keywords</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 3 : 2} className="text-center py-6">
                        Loading categories...
                      </TableCell>
                    </TableRow>
                  ) : categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 3 : 2} className="text-center py-6">
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.category_id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {category.match_keywords?.map((keyword, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {(!category.match_keywords || category.match_keywords.length === 0) && (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                              onClick={() => onDelete(category.category_id)}

                              >
                                <IconEdit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(category.category_id)}
                              >
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        {/* Edit Category Dialog */}
        {isAdmin && editingCategory && (
          <Dialog open={!!editingCategory} onOpenChange={(isOpen) => !isOpen && setEditingCategory(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Update this transaction category's details
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="edit-keywords" className="text-right pt-2">
                    Keywords
                  </Label>
                  <div className="col-span-3 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        id="edit-keywords"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        placeholder="Add match keywords"
                        className="flex-1"
                      />
                      <Button type="button" variant="secondary" onClick={handleAddKeyword}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.match_keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="px-2 py-1">
                          {keyword}
                          <button 
                            onClick={() => handleRemoveKeyword(index)}
                            className="ml-2 text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingCategory(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateCategory}>
                  Update Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
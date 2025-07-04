"use client"

import { useState, useEffect } from 'react'
import { toast } from "sonner"
import {
  IconUser,
  IconMail,
  IconLock,
  IconWorld,
  IconShield,
  IconCheck,
  IconX
} from "@tabler/icons-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const AVATAR_OPTIONS = [
  "/avatars/default.png",
  "/avatars/avatar-1.png",
  "/avatars/avatar-2.png",
  "/avatars/avatar-3.png",
  "/avatars/avatar-4.png",
  "/avatars/avatar-5.png",
]

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ro", label: "Română" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
]

export function UserAccountDialog({ open, onOpenChange, user, onUserUpdate }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    language_preference: 'en',
    //avatar: '/avatars/default.png',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)

  useEffect(() => {
      console.log('Dialog useEffect triggered:', { user, open });
    if (user && open) {
          console.log('Setting form data with user:', user);

      setFormData({
        full_name: user.full_name || user.name || '',
        email: user.email || '',
        language_preference: user.language_preference || 'en',
        //: user.avatar || '/avatars/default.png',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setShowPasswordFields(false)
    }
  }, [user, open])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate password fields if changing password
      if (showPasswordFields) {
        if (!formData.currentPassword) {
          toast.error('Current password is required')
          return
        }
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('New passwords do not match')
          return
        }
        if (formData.newPassword.length < 6) {
          toast.error('New password must be at least 6 characters')
          return
        }
      }

      const updateData = {
        full_name: formData.full_name,
        email: formData.email,
        language_preference: formData.language_preference,
        //avatar: formData.avatar,
      }

      if (showPasswordFields && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await fetch(`http://localhost:3001/api/users/${user.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }

      const updatedUser = await response.json()
      
      // Update localStorage with new user data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      const newUserData = {
        ...currentUser,
        ...updatedUser,
        name: updatedUser.full_name, // For NavUser component compatibility
      }
      localStorage.setItem('user', JSON.stringify(newUserData))

      toast.success('Account updated successfully')
      onUserUpdate(newUserData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(error.message || 'Failed to update account')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'user':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconUser className="h-5 w-5" />
            Account Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account information and preferences
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User ID and Role Badges */}
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              ID: {user?.user_id}
            </Badge>
            <Badge variant={getRoleBadgeVariant(user?.role)}>
              <IconShield className="h-3 w-3 mr-1" />
              {user?.role?.toUpperCase()}
            </Badge>
          </div>

          {/* Avatar Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Profile Picture</CardTitle>
            </CardHeader>
            {/* <CardContent>
              <div className="flex flex-wrap gap-3">
                {AVATAR_OPTIONS.map((avatarUrl) => (
                  <button
                    key={avatarUrl}
                    type="button"
                    onClick={() => handleInputChange('avatar', avatarUrl)}
                    className={`relative p-1 rounded-full transition-all ${
                      formData.avatar === avatarUrl 
                        ? 'ring-2 ring-primary ring-offset-2' 
                        : 'hover:ring-2 hover:ring-muted-foreground hover:ring-offset-2'
                    }`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={avatarUrl} alt="Avatar option" />
                      <AvatarFallback>
                        {getInitials(formData.full_name, formData.email)}
                      </AvatarFallback>
                    </Avatar>
                    {formData.avatar === avatarUrl && (
                      <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                        <IconCheck className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent> */}
          </Card>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <IconUser className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <IconMail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Language Preference */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <IconWorld className="h-4 w-4" />
              Language Preference
            </Label>
            <Select
              value={formData.language_preference}
              onValueChange={(value) => handleInputChange('language_preference', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Password Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconLock className="h-4 w-4" />
                Password
              </CardTitle>
              <CardDescription>
                Leave blank to keep current password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={showPasswordFields ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                >
                  {showPasswordFields ? 'Cancel Password Change' : 'Change Password'}
                </Button>
              </div>

              {showPasswordFields && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
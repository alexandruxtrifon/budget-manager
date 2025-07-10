'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { NotificationChecker } from "@/components/notification"
import { useNavigation } from "@/components/navigation-provider"
import Link from "next/link"

export function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" })
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { startNavigation, isPending } = useNavigation() // Use the navigation hook

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    toast("Attempting to log in...");

    try { 
    //const res = await fetch("http://localhost:3001/api/users/login", {
    const res = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      if (res.ok) {
      const data = await res.json(); // Expect { message, token, user }
      if (data.token) {
        localStorage.setItem('token', data.token); 
        // Optionally store user info: localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success(data.message || "Login successful");
        startNavigation(() => {
          router.push("/dashboard")
        })
        //router.push("/dashboard");
      } else {
        toast.error("Login successful, but no token received.");
      }
    } else {
      const errorText = await res.text();
      let errorMessage = "Login failed. Please try again.";
      try {
        const errorObject = JSON.parse(errorText);
        if (errorObject && errorObject.error) {
          errorMessage = errorObject.error;
        }
      } catch (parseError) {
        console.error("Failed to parse error response as JSON:", parseError);
        if (errorText) errorMessage = errorText;
      }
      toast.error("Login Failed", { description: errorMessage });
    }
  } catch (error) {
      console.error("Login request failed:", error)
      toast.error("Connection error. Please check your network.")
    } finally {
      setIsLoading(false)
    }
}

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <NotificationChecker />
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center">
          {/* Logo */}
          <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <span className="text-primary-foreground text-xl font-bold">B</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sign in to access your account
          </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6 ">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>            
            <Input 
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder=""
              className="w-full"
              required
              disabled={isLoading || isPending}
              onChange={handleChange}
            />            
            </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link 
                href="/forgot-password" 
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder=""
              className="w-full"
              required
              disabled={isLoading || isPending}
              onChange={handleChange}
            />
          </div>
            <Button type="submit" className="w-full py-2 h-11" disabled={isLoading || isPending}>
              {(isLoading || isPending) ? "Signing in...": "Sign in"}
            </Button>
            
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/register" className="text-primary font-medium hover:underline">
              Create one
            </Link>
          </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
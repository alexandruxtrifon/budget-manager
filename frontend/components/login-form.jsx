'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { NotificationChecker } from "./notification"
export function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" })
  const router = useRouter()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    toast("Attempting to log in...");
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
        router.push("/dashboard");
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <NotificationChecker />
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required onChange={handleChange} />
            </div>
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function RegisterForm() {
  const [form, setForm] = useState({ email: "", password: "", full_name: "" })
  const router = useRouter()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log("Form submitted", form); // DEBUG
    toast("Submitting registration...");
    const res = await fetch("http://localhost:3001/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      console.log("Fetch response status:", res.status); // DEBUG

    if (res.ok) {
      toast("Registration successful")
      router.push("/login")
    } else {
    //   const error = await res.json()
    //   toast.error("Registration failed", { 
    //    description: error.message || "Please try again" 
    //   })
    let errorData;
        try {
          errorData = await res.text(); // Attempt to parse error response as JSON
          console.log("Backend error data:", errorData); // DEBUG
        } catch (parseError) {
          console.error("Failed to parse error response as JSON:", parseError); // DEBUG
          // If parsing fails, use the status text or a generic message
          errorData = { message: res.statusText || "An unexpected error occurred." };
        }
        const errorMessage = errorData || errorData.message || errorData.detail || "Please try again";
        toast.error("Registration failed", {
          description: errorMessage,
        });
    }
  }
  const handleTestToast = () => {
    toast("This is a test toast from Sonner!");
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" type="text" required onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required onChange={handleChange} />
          </div>
          <Button type="submit" className="w-full">Register</Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account? <Link href="/login" className="underline">Login</Link>
        </div>
                <div className="mt-4"> {/* Added a div for spacing */}
          <Button variant="outline" onClick={handleTestToast} className="w-full">
            Test Sonner Toast
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
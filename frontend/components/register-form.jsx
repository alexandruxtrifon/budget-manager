'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"
import { Loader2 } from "lucide-react"
import { useRef } from "react"

// export function RegisterForm() {
//   const [form, setForm] = useState({ email: "", password: "", full_name: "" })
//   const router = useRouter()

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value })
//   }
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [notificationId, setNotificationId] = useState(null);

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setIsSubmitting(true);
//     console.log("Form submitted", form); // DEBUG
//     toast("Submitting registration...");
//     const res = await fetch("http://localhost:3001/api/users/register", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(form),
//     })
//       console.log("Fetch response status:", res.status); // DEBUG
//     const data = await res.json();
//     if (res.ok) {
//       toast("Registration successful")
//       router.push("/login")
//       if (data.notification_id) {
//         //setNotificationId(data.notification_id);
//         localStorage.setItem('notification_id', data.notification_id);
//         console.log(`Set notification_id in localStorage: ${data.notification_id}`);

//       }
//       // setTimeout(() => {
//       //   router.push('/login');
//       // }, 3000);
//       setIsSubmitting(false);

//     } else {
//     //   const error = await res.json()
//     //   toast.error("Registration failed", { 
//     //    description: error.message || "Please try again" 
//     //   })
//     let errorData;
//         try {
//           errorData = await res.text(); // Attempt to parse error response as JSON
//           console.log("Backend error data:", errorData); // DEBUG
//         } catch (parseError) {
//           console.error("Failed to parse error response as JSON:", parseError); // DEBUG ONLY
//           // If parsing fails use the status text or a generic message
//           errorData = { message: res.statusText || "An unexpected error occurred." };
//         }
//         const errorMessage = errorData || errorData.message || errorData.detail || "Please try again";
//         toast.error("Registration failed", {
//           description: errorMessage,
//         });
//     }
//   }

//   // useEffect(() => {
//   //   if (!notificationId) return;
    
//   //   const checkNotification = async () => {
//   //     try {
//   //       console.log(`Checking notification status for ID: ${notificationId}`);

//   //       const response = await fetch(`http://localhost:3001/api/users/notification/${notificationId}`);
        
//   //       if (!response.ok) {
//   //         console.log(`Notification check failed with status: ${response.status}`);
//   //         return;
//   //       }
//   //       const data = await response.json();
//   //       console.log('Notification response:', data);

//   //       if (data.is_sent && data.preview_url) {
//   //         // Show toast with preview URL
//   //       console.log('Email sent with preview URL:', data.preview_url);

//   //         toast(
//   //           <div>
//   //             <p>Welcome email sent!</p>
//   //             <p>
//   //               <a 
//   //                 href={data.preview_url} 
//   //                 target="_blank" 
//   //                 rel="noreferrer"
//   //                 className="underline font-medium"
//   //               >
//   //                 View Preview Email
//   //               </a>
//   //             </p>
//   //           </div>,
//   //           {
//   //             duration: 10000,
//   //             action: {
//   //               label: "Open",
//   //               onClick: () => window.open(data.preview_url, '_blank')
//   //             }
//   //           }
//   //         );
          
//   //         // Stop checking once we have the URL
//   //         setNotificationId(null);
//   //       } else {
//   //       console.log('Email not yet sent or missing preview URL');
//   //     }
//   //     } catch (error) {
//   //       console.error('Error checking notification:', error);
//   //     }
//   //   };
    
//   //   // Check immediately and then every 3 seconds
//   //   checkNotification();
//   //   const interval = setInterval(checkNotification, 3000);
    
//   //   // Clean up interval
//   //   return () => clearInterval(interval);
//   // }, [notificationId]);

//   const handleTestToast = () => {
//     toast("This is a test toast from Sonner!");
//   };
//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="text-2xl">Create an account</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="email">Email</Label>
//             <Input id="email" name="email" type="email" required onChange={handleChange} />
//           </div>
//           <div className="space-y-2">
//             <Label htmlFor="full_name">Full Name</Label>
//             <Input id="full_name" name="full_name" type="text" required onChange={handleChange} />
//           </div>
//           <div className="space-y-2">
//             <Label htmlFor="password">Password</Label>
//             <Input id="password" name="password" type="password" required onChange={handleChange} />
//           </div>
//           {/* <Button type="submit" className="w-full">Register</Button> */}
//           <Button 
//             type="submit" 
//             className="w-full"
//             disabled={isSubmitting}
//           >
//             {isSubmitting ? 'Registering...' : 'Register'}
//           </Button>
//         </form>
//         <div className="mt-4 text-center text-sm">
//           Already have an account? <Link href="/login" className="underline">Login</Link>
//         </div>
//                 <div className="mt-4">
//           <Button variant="outline" onClick={handleTestToast} className="w-full">
//             Test Sonner Toast
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

export function RegisterForm() {
  const [form, setForm] = useState({ email: "", password: "", full_name: "" })
  const [otp, setOtp] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState(null)
  const router = useRouter()
  const carouselRef = useRef(null)
  const [api, setApi] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmitInitialForm = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    console.log("Form submitted", form)
    toast("Submitting registration...")

    try {
      const res = await fetch("http://localhost:3001/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      
      console.log("Fetch response status:", res.status)
      const data = await res.json()
      
      if (res.ok) {
        toast.success("Account created! Please check your email for OTP")
        setUserId(data.user_id)
        
        if (data.notification_id) {
          localStorage.setItem('notification_id', data.notification_id);
        }



        // Move to the email sent confirmation step
        //setCarouselIndex(1)
        if (api) {
          api.scrollTo(1)
          
          // After 3 seconds, move to OTP verification step
          setTimeout(() => {
            api.scrollTo(2)
          }, 3000)
        }
      } else {
        let errorMessage = "Registration failed"
        if (data.error) {
          errorMessage = data.error
        }
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("Registration failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const res = await fetch("http://localhost:3001/api/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          otp: otp
        }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success("Email verified successfully!")
        router.push("/login")
      } else {
        toast.error(data.error || "Invalid OTP. Please try again.")
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      toast.error("Failed to verify OTP. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (!userId) return
    
    try {
      const res = await fetch("http://localhost:3001/api/users/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
        }),
      })

      if (res.ok) {
        const data = await res.json();
        if (data.notification_id) {
          localStorage.setItem('notification_id', data.notification_id);
          console.log("Updated notification_id in localStorage:", data.notification_id);
        }
        toast.success("OTP resent to your email")

      } 
      
      else {
        const data = await res.json()
        toast.error(data.error || "Failed to resend OTP")
      }
    } catch (error) {
      console.error("Failed to resend OTP:", error)
      toast.error("Failed to resend OTP. Please try again.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
      </CardHeader>
      <CardContent>
        {/* <Carousel currentIndex={carouselIndex} setCurrentIndex={setCarouselIndex}> */}
        <Carousel 
          opts={{
            align: "start",
            skipSnaps: true,
            draggable: false, // Disable dragging between slides
          }}
          setApi={setApi}
        >
        <CarouselContent>
          <CarouselItem>
          {/* Step 1: Registration form */}
          <form onSubmit={handleSubmitInitialForm} className="space-y-4">
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
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </Button>
            <div className="mt-4 text-center text-sm">
              Already have an account? <Link href="/login" className="underline">Login</Link>
            </div>
          </form>
        </CarouselItem>

        <CarouselItem>
          {/* Step 2: Email sent confirmation */}
          <div className="py-8 text-center space-y-6">
            <Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" />
            <div className="space-y-2">
              <h3 className="text-xl font-medium">Sending verification code</h3>
              <p className="text-muted-foreground">
                We're sending a one-time verification code to {form.email}
              </p>
            </div>
          </div>
        </CarouselItem>

        <CarouselItem>
          {/* Step 3: OTP verification */}
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter Verification Code</Label>
              <p className="text-sm text-muted-foreground mb-2">
                We've sent a 6-digit code to {form.email}
              </p>
              <Input 
                id="otp" 
                name="otp"
                placeholder="000000" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="text-center text-lg font-mono tracking-wider"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || otp.length !== 6}
            >
              {isSubmitting ? 'Verifying...' : 'Verify Email'}
            </Button>
            <div className="text-center">
              <Button 
                variant="link" 
                type="button"
                onClick={handleResendOtp}
              >
                Didn't receive code? Resend
              </Button>
            </div>
          </form>
        </CarouselItem>
        </CarouselContent>
        </Carousel>
      </CardContent>
    </Card>
  )
}
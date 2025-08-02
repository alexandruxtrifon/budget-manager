'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"
import { Loader2 } from "lucide-react"
import { useRef } from "react"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
} from "@/components/ui/input-otp"
import { Dot } from "lucide-react"

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

  const [timeRemaining, setTimeRemaining] = useState(120)
  const [progress, setProgress] = useState(100)
  const [canResend, setCanResend] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const startTimer = useCallback(() => {
    setTimeRemaining(120)
    setProgress(100)
    setCanResend(false)
    
    const interval = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          clearInterval(interval)
          setCanResend(true)
          return 0
        }
        
        const newTime = prevTime - 1
        const newProgress = (newTime / 120) * 100
        setProgress(newProgress)
        
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let cleanup
    if (currentStep === 2) { // OTP verification step
      cleanup = startTimer()
    }
    return cleanup
  }, [currentStep, startTimer])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }
  
  const handleOtpChange = (value) => {
    setOtp(value)
  }

  const handleSubmitInitialForm = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    //console.log("Form submitted", form)
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
        // Check if this is a new registration (201) or re-registration (200)
        const isReRegistration = res.status === 200
        const successMessage = isReRegistration 
          ? (data.message || "Account updated! Please check your email for the new OTP")
          : "Account created! Please check your email for OTP"
        
        toast.success(successMessage)
        setUserId(data.user_id)
        
        if (data.notification_id) {
          localStorage.setItem('notification_id', data.notification_id);
        }

        // Move to the email sent confirmation step
        if (api) {
          api.scrollTo(1)
          setCurrentStep(1)
          
          // After 3 seconds, move to OTP verification step
          setTimeout(() => {
            api.scrollTo(2)
            setCurrentStep(2)
          }, 3000)
        }
      } else {
        let errorMessage = "Registration failed"
        let errorCode = null
        
        if (data.error) {
          errorMessage = data.error
          errorCode = data.code
        }
        
        if (errorCode === 'EMAIL_ALREADY_VERIFIED') {
          toast.error("Account Already Exists", {
            description: "This email is already registered and verified. Please log in instead.",
            duration: 5000,
            action: {
              label: "Go to Login",
              onClick: () => router.push("/login")
            }
          })
        } else if (errorCode === 'EMAIL_EXISTS_UNVERIFIED') {
          const expiryTime = data.otp_expiry ? new Date(data.otp_expiry).toLocaleTimeString() : 'soon'
          toast.error("Account Not Verified", {
            description: `This email is registered but not verified. Please wait for the verification code to expire (${expiryTime}) or check your email for the verification code.`,
            duration: 8000
          })
        } else {
          toast.error("Registration Failed", { description: errorMessage })
        }
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("Registration failed. Please try again.")
      setCanResend(true)
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
        //router.push('/dashboard')
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

      setCanResend(false)

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
        // Restart the timer
        startTimer()
      } 
      
      else {
        const data = await res.json()
        toast.error(data.error || "Failed to resend OTP")
        setCanResend(true)

      }
    } catch (error) {
      console.error("Failed to resend OTP:", error)
      toast.error("Failed to resend OTP. Please try again.")
      setCanResend(true)

    }
  }

  return (
    <Card>
      <CardHeader>
                <div className="flex flex-col items-center mb-2">
          {/* Logo */}
          <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <span className="text-primary-foreground text-xl font-bold">B</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Get started with Budget Manager
          </p>
        </div>
        {/* <CardTitle className="text-2xl">Create an account</CardTitle> */}
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
          value={currentStep}
          onValueChange={setCurrentStep}
        >
        <CarouselContent>
          <CarouselItem>
          {/* Step 1: Registration form */}
          <form onSubmit={handleSubmitInitialForm} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
              id="email"
              name="email" 
              type="email"
              autoComplete="email"
              placeholder="" 
              className="w-full"
              required
              onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
              <Input 
              id="full_name" 
              name="full_name" 
              type="text" 
              className="w-full" 
              required
              onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    autoComplete="new-password"
                    placeholder=""
                    className="w-full" 
                    required 
                    onChange={handleChange} 
                  />
            </div>
            <Button 
              type="submit" 
              className="w-full py-2 h-11"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary font-medium hover:underline">Login</Link>
            </div>
          </form>
        </CarouselItem>

        <CarouselItem>
          {/* Step 2: Email sent confirmation */}
          {/* <div className="py-8 text-center space-y-6">
            <Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" />
            <div className="space-y-2">
              <h3 className="text-xl font-medium">Sending verification code</h3>
              <p className="text-muted-foreground">
                We're sending a one-time verification code to {form.email}
              </p>
            </div>
          </div> */}
          <div className="py-8 text-center space-y-6">
            <div className="flex justify-center">
              <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Sending verification code</h3>
              <p className="text-muted-foreground">
                We're sending a verification code to:
              </p>
              <p className="font-medium">{form.email}</p>
            </div>
          </div>
        </CarouselItem>

        {/* Step 3: OTP verification */}
        <CarouselItem>
          <div className="py-3">
            <h3 className="text-lg font-semibold mb-2 text-center">Email verification</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              Enter the 6-digit code we sent to {form.email}
            </p>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-4">
              {/* <Label htmlFor="otp" className="text-sm font-medium">Enter Verification Code</Label>
              {/* <p className="text-sm text-muted-foreground mb-2">
                We've sent a 6-digit code to {form.email}
              </p> */}
              {/* <Input 
                id="otp" 
                name="otp"
                placeholder="000000" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="text-center text-lg font-mono tracking-wider py-5"
              /> */}
        <div className="space-y-4 flex flex-col items-center">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(value) => setOtp(value)}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
        </InputOTP>
        </div>
            </div>
                        {/* Progress Bar with Countdown Timer */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Request new code in</span>
                <span className="font-medium">{formatTime(timeRemaining)}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <Button 
              type="submit" 
              className="w-full py-2 h-11"
              disabled={isSubmitting || otp.length !== 6}
            >
              {isSubmitting ? 'Verifying...' : 'Verify and continue'}
            </Button>
            <div className="text-center">
              <Button 
                variant="link" 
                type="button"
                onClick={handleResendOtp}
                disabled={!canResend}
                className={`font-medium ${canResend ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {canResend ? "Resend code" : "Please wait to resend code"}
                {/* Didn't receive the code? Resend */}
              </Button>
            </div>
          </form>
          </div>
        </CarouselItem>
        </CarouselContent>
        </Carousel>
      </CardContent>
    </Card>
  )
}
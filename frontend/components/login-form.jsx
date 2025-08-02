'use client'

import { useState, useEffect, useCallback} from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { NotificationChecker } from "@/components/notification"
import { useNavigation } from "@/components/navigation-provider"
import Link from "next/link"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
} from "@/components/ui/input-otp"

export function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" })
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { startNavigation, isPending } = useNavigation() // Use the navigation hook

  const [forgotEmail, setForgotEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [userId, setUserId] = useState(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [resetToken, setResetToken] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(120)
  const [progress, setProgress] = useState(100)
  const [canResend, setCanResend] = useState(false)
  
  const [api, setApi] = useState(null)
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
    if (currentStep === 3) { // OTP verification step
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
      let errorCode = null;
      
      try {
        const errorObject = JSON.parse(errorText);
        if (errorObject && errorObject.error) {
          errorMessage = errorObject.error;
          errorCode = errorObject.code;
        }
      } catch (parseError) {
        console.error("Failed to parse error response as JSON:", parseError);
        if (errorText) errorMessage = errorText;
      }
      
              if (errorCode === 'ACCOUNT_NOT_VERIFIED') {
          toast.error("Account Not Verified", { 
            description: "Please check your email and verify your account before logging in. If you didn't receive a verification email or the code has expired, you can register again with the same email.",
            duration: 8000,
            action: {
              label: "Register Again",
              onClick: () => router.push("/register")
            }
          });
        } else {
        toast.error("Login Failed", { description: errorMessage });
      }
    }
  } catch (error) {
      console.error("Login request failed:", error)
      toast.error("Connection error. Please check your network.")
    } finally {
      setIsLoading(false)
    }
}
  // Forgot Password Handlers
  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const res = await fetch("http://localhost:3001/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success("If your email is registered, you will receive a reset code shortly.")
        
        if (data.user_id) {
          setUserId(data.user_id)
          
          if (data.notification_id) {
            localStorage.setItem('notification_id', data.notification_id)
          }
          
        }
          setCurrentStep(2)
          api?.scrollTo(2)
          
          setTimeout(() => {
            setCurrentStep(3)
            api?.scrollTo(3)
          }, 3000)
      } else {
        toast.error(data.error || "Failed to request password reset.")
      }
    } catch (error) {
      console.error("Password reset request error:", error)
      toast.error("Failed to send reset code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const res = await fetch("http://localhost:3001/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          otp: otp
        }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success("OTP verified successfully!")
        setResetToken(data.reset_token)
        
        setCurrentStep(4)
        api?.scrollTo(4)
      } else {
        toast.error(data.error || "Invalid OTP. Please try again.")
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      toast.error("Failed to verify OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.")
      return
    }
    
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }
    
    setIsLoading(true)
    
    try {
      const res = await fetch("http://localhost:3001/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reset_token: resetToken,
          new_password: newPassword
        }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success("Password reset successful!")
        
        // Return to login screen after a delay
        setTimeout(() => {
          // Reset the carousel to the login screen
          setCurrentStep(0)
          api?.scrollTo(0)
          
          // Clear all form fields
          setOtp("")
          setNewPassword("")
          setConfirmPassword("")
          setForgotEmail("")
          setResetToken(null)
          setUserId(null)
        }, 2000)
      } else {
        toast.error(data.error || "Failed to reset password.")
      }
    } catch (error) {
      console.error("Password reset error:", error)
      toast.error("Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!forgotEmail) return
    
    try {
      setCanResend(false)
      
      const res = await fetch("http://localhost:3001/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.notification_id) {
          localStorage.setItem('notification_id', data.notification_id)
        }
        
        toast.success("Reset code resent to your email")
        startTimer()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to resend OTP")
        setCanResend(true)
      }
    } catch (error) {
      console.error("Failed to resend OTP:", error)
      toast.error("Failed to resend reset code. Please try again.")
      setCanResend(true)
    }
  }


    return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <NotificationChecker />
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4">
              <span className="text-primary-foreground text-xl font-bold">B</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Sign in to access your account
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <Carousel
            opts={{
              align: "start",
              skipSnaps: true,
              draggable: false,
            }}
            setApi={setApi}
            value={currentStep}
            onValueChange={setCurrentStep}
          >
            <CarouselContent>
              {/* Step 1: Login Form */}
              <CarouselItem>
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
                      <Button
                        variant="link"
                        className="text-xs text-primary hover:underline p-0 h-auto"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentStep(1)
                          api?.scrollTo(1)
                        }}
                      >
                        Forgot password?
                      </Button>
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
                    {(isLoading || isPending) ? "Signing in..." : "Sign in"}
                  </Button>
                  
                  <div className="mt-6 text-center text-sm">
                    <span className="text-muted-foreground">Don't have an account? </span>
                    <Link href="/register" className="text-primary font-medium hover:underline">
                      Create one
                    </Link>
                  </div>
                </form>
              </CarouselItem>

              {/* Step 2: Email input for forgot password */}
              <CarouselItem>
                <form onSubmit={handleRequestOtp} className="space-y-4 py-4">
                  <div className="flex items-center mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 h-8 w-8"
                      type="button"
                      onClick={() => {
                        setCurrentStep(0)
                        api?.scrollTo(0)
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-lg font-semibold ml-2">Reset your password</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-sm font-medium">
                      Email address
                    </Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email address"
                      className="w-full"
                      //required
                      disabled={isLoading}
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter the email address associated with your account.
                      We'll send you a verification code.
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full py-2 h-11"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Code'}
                  </Button>
                </form>
              </CarouselItem>

              {/* Step 3: Sending email animation */}
              <CarouselItem>
                <div className="py-8 text-center space-y-6">
                  <div className="flex justify-center">
                    <Loader2 className="animate-spin h-12 w-12 text-primary" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">Sending reset code</h3>
                    <p className="text-muted-foreground">
                      We're sending a verification code to:
                    </p>
                    <p className="font-medium">{forgotEmail}</p>
                  </div>
                </div>
              </CarouselItem>

              {/* Step 4: OTP verification */}
              <CarouselItem>
                <div className="py-4">
                  <div className="flex items-center mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 h-8 w-8"
                      type="button"
                      onClick={() => {
                        setCurrentStep(1)
                        api?.scrollTo(1)
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-lg font-semibold ml-2">Verify reset code</h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-6">
                    Enter the 6-digit code we sent to {forgotEmail}
                  </p>
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
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
                    
                    {/* Progress Bar with Countdown Timer */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Code expires in</span>
                        <span className="font-medium">{formatTime(timeRemaining)}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full py-2 h-11"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? 'Verifying...' : 'Verify Code'}
                    </Button>
                    
                    <div className="text-center">
                      <Button 
                        variant="link" 
                        type="button"
                        onClick={handleResendOtp}
                        disabled={!canResend}
                        className={`font-medium ${canResend ? 'text-primary' : 'text-muted-foreground'} p-0 h-auto`}
                      >
                        {canResend ? "Resend code" : "Please wait to resend code"}
                      </Button>
                    </div>
                  </form>
                </div>
              </CarouselItem>

              {/* Step 5: Set new password */}
              <CarouselItem>
                <div className="py-4">
                  <div className="flex items-center mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 h-8 w-8"
                      type="button"
                      onClick={() => {
                        setCurrentStep(3)
                        api?.scrollTo(3)
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-lg font-semibold ml-2">Set new password</h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-6">
                    Create a strong password that you'll remember
                  </p>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-sm font-medium">
                        New Password
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder=""
                        className="w-full"
                        required
                        disabled={isLoading}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium">
                        Confirm Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder=""
                        className="w-full"
                        required
                        disabled={isLoading}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full py-2 h-11"
                      disabled={isLoading || !newPassword || !confirmPassword}
                    >
                      {isLoading ? 'Updating...' : 'Reset Password'}
                    </Button>
                  </form>
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </CardContent>
      </Card>
    </div>
  )
  // return (
  //   <div className="min-h-screen flex items-center justify-center p-4">
  //     <NotificationChecker />
  //     <Card className="w-full max-w-md">
  //       <CardHeader>
  //         <div className="flex flex-col items-center">
  //         {/* Logo */}
  //         <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4">
  //           <span className="text-primary-foreground text-xl font-bold">B</span>
  //         </div>
  //         <h1 className="text-2xl font-bold tracking-tight flex">Welcome back</h1>
  //         <p className="text-muted-foreground text-sm mt-1">
  //           Sign in to access your account
  //         </p>
  //         </div>
  //       </CardHeader>
  //       <CardContent className="space-y-4 p-6 ">
  //         <form onSubmit={handleSubmit} className="space-y-6">
  //           <div className="space-y-2">
  //           <Label htmlFor="email" className="text-sm font-medium">
  //             Email address
  //           </Label>            
  //           <Input 
  //             id="email"
  //             name="email"
  //             type="email"
  //             autoComplete="email"
  //             placeholder=""
  //             className="w-full"
  //             required
  //             disabled={isLoading || isPending}
  //             onChange={handleChange}
  //           />            
  //           </div>
  //         <div className="space-y-2">
  //           <div className="flex items-center justify-between">
  //             <Label htmlFor="password" className="text-sm font-medium">
  //               Password
  //             </Label>
  //             <Link 
  //               href="/forgot-password" 
  //               className="text-xs text-primary hover:underline"
  //             >
  //               Forgot password?
  //             </Link>
  //           </div>
  //           <Input
  //             id="password"
  //             name="password"
  //             type="password"
  //             autoComplete="current-password"
  //             placeholder=""
  //             className="w-full"
  //             required
  //             disabled={isLoading || isPending}
  //             onChange={handleChange}
  //           />
  //         </div>
  //           <Button type="submit" className="w-full py-2 h-11" disabled={isLoading || isPending}>
  //             {(isLoading || isPending) ? "Signing in...": "Sign in"}
  //           </Button>
            
  //         <div className="mt-6 text-center text-sm">
  //           <span className="text-muted-foreground">Don't have an account? </span>
  //           <Link href="/register" className="text-primary font-medium hover:underline">
  //             Create one
  //           </Link>
  //         </div>
  //         </form>
  //       </CardContent>
  //     </Card>
  //   </div>
  // )
}
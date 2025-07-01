import React from 'react';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

const spinnerVariants = cva(
  "animate-spin text-muted-foreground", 
  {
    variants: {
      size: {
        default: "h-6 w-6",
        sm: "h-4 w-4",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      variant: {
        default: "text-muted-foreground",
        primary: "text-primary",
        success: "text-success",
        destructive: "text-destructive",
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

const Spinner = React.forwardRef(
  ({ className, size, variant, label = "Loading...", centered = false, ...props }, ref) => {
    const spinner = (
      <div ref={ref} role="status" className={cn(className)} {...props}>
        <Loader2 className={cn(spinnerVariants({ size, variant }))} />
        {label && <span className="sr-only">{label}</span>}
      </div>
    );

    if (centered) {
      return (
        <div className="w-full flex justify-center items-center py-6">
          {spinner}
        </div>
      );
    }

    return spinner;
  }
);

Spinner.displayName = "Spinner";

export const LoadingScreen = ({ 
  message = "Loading content...",
  size = "xl",
  variant = "default"
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Spinner size={size} variant={variant} label={message} />
      {message && <p className="text-muted-foreground text-sm">{message}</p>}
    </div>
  );
};

export { Spinner, spinnerVariants };
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateIbanRealTime, formatIban, cleanIban, validateIban } from '../app/utils/mod-97';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';

export function IbanInput({ 
  value, 
  onChange, 
  onValidationChange,
  label = "IBAN",
  placeholder = "RO49 AAAA 1B31 0075 9384 0000",
  required = false,
  ...props 
}) {
  const [displayValue, setDisplayValue] = useState('');
  const [validation, setValidation] = useState({ isValid: true, error: null });
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value) {
      setDisplayValue(formatIban(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    // Allow only letters, numbers, and spaces
    const sanitized = inputValue.replace(/[^A-Za-z0-9\s]/g, '').toUpperCase();
    
    // Format for display
    const formatted = formatIban(sanitized);
    setDisplayValue(formatted);
    
    // Clean for validation and callback
    const cleaned = cleanIban(sanitized);
    
    // Real-time validation
    const validation = validateIbanRealTime(cleaned);
    setValidation(validation);
    
    // Call onChange with cleaned value
    if (onChange) {
      onChange(cleaned);
    }
    
    // Call validation callback
    if (onValidationChange) {
      // For complete IBAN, do full validation
      const fullValidation = cleaned.length === 24 ? validateIban(cleaned) : validation;
      onValidationChange(fullValidation);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // If we have a complete IBAN, do full validation on blur
    if (cleanIban(displayValue).length === 24) {
      const fullValidation = validateIban(cleanIban(displayValue));
      setValidation(fullValidation);
      
      if (onValidationChange) {
        onValidationChange(fullValidation);
      }
    }
  };

  const getInputClassName = () => {
    let className = "font-mono";
    
    if (!isFocused && displayValue) {
      if (validation.isValid) {
        className += " border-green-500 focus:border-green-600";
      } else {
        className += " border-red-500 focus:border-red-600";
      }
    }
    
    return className;
  };

  const getStatusIcon = () => {
    if (!displayValue || isFocused) return null;
    
    if (validation.isValid && cleanIban(displayValue).length === 24) {
      return validation.warning ? (
        <IconAlertTriangle className="h-4 w-4 text-yellow-500" />
      ) : (
        <IconCheck className="h-4 w-4 text-green-500" />
      );
    } else if (!validation.isValid) {
      return <IconX className="h-4 w-4 text-red-500" />;
    }
    
    return null;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="iban-input">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id="iban-input"
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={getInputClassName()}
          maxLength={29} // 24 characters + 5 spaces
          {...props}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getStatusIcon()}
        </div>
      </div>
      
      {/* Validation messages */}
      {!isFocused && validation.error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <IconX className="h-3 w-3" />
          {validation.error}
        </p>
      )}
      
      {!isFocused && validation.isValid && validation.warning && (
        <p className="text-sm text-yellow-600 flex items-center gap-1">
          <IconAlertTriangle className="h-3 w-3" />
          {validation.warning}
        </p>
      )}
      
      {/* Character counter */}
      <p className="text-xs text-muted-foreground">
        {cleanIban(displayValue).length}/24 characters
      </p>
    </div>
  );
}
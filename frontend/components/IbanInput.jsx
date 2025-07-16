'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function cleanIban(iban) {
  return iban.replace(/[\s-]/g, '').toUpperCase();
}

export function IbanInput({ value, onChange, onValidationChange, ...props }) {
  const [validation, setValidation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimeout = useRef(null);

  const cleaned = cleanIban(value || '');

  useEffect(() => {
    if (cleaned.length === 24) {
      setIsLoading(true);
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch('http://localhost:3001/api/accounts/validate-iban', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ iban: cleaned }),
          });
          const data = await res.json();
          setValidation(data);
          if (onValidationChange) onValidationChange(data);
        } catch (err) {
          setValidation({ isValid: false, error: 'Server error' });
          if (onValidationChange) onValidationChange({ isValid: false, error: 'Server error' });
        } finally {
          setIsLoading(false);
        }
      }, 0);
    } else {
      setValidation(null);
      setIsLoading(false);
      if (onValidationChange) onValidationChange(null);
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    }
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [cleaned]);

  return (
    <div className="grid gap-2">
      <Label htmlFor="iban">IBAN</Label>
      <Input
        id="iban"
        value={value}
        onChange={onChange}
        maxLength={29} // 24 chars + spaces
        {...props}
      />
      <div style={{ fontSize: '0.85em', color: '#888', marginTop: 2 }}>
        {cleaned.length}/24 characters
      </div>
      {isLoading && (
        <div style={{ color: '#888', fontSize: '0.9em' }}>Validating...</div>
      )}
      {validation && validation.isValid === false && (
        <div style={{ color: 'red', fontSize: '0.95em' }}>{validation.error}</div>
      )}
      {validation && validation.isValid === true && (
        <div style={{ color: 'green', fontSize: '0.95em' }}>
          Valid IBAN
          {validation.warning && (
            <div style={{ color: 'orange', fontSize: '0.95em' }}>
              {validation.warning}
            </div>
          )}
          {/* <div>
            <span style={{ color: '#555' }}>Bank code:</span> {validation.bankCode}
          </div>
          <div>
            <span style={{ color: '#555' }}>Formatted:</span> {validation.formatted}
          </div> */}
        </div>
      )}
    </div>
  );
}
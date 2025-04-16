'use client';

import * as React from 'react';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value, onChange, children }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded-md px-3 py-2"
    >
      {children}
    </select>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function SelectItem({ value, children }: SelectItemProps) {
  return <option value={value}>{children}</option>;
}

'use client'

import * as React from 'react'

type DivProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className = '', ...props }: DivProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
      {...props}
    />
  )
}

export function CardHeader({ className = '', ...props }: DivProps) {
  return <div className={`p-4 border-b border-gray-100 ${className}`} {...props} />
}

export function CardTitle({ className = '', ...props }: DivProps) {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props} />
}

export function CardContent({ className = '', ...props }: DivProps) {
  return <div className={`p-4 ${className}`} {...props} />
}

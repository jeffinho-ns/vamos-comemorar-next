import { ReactNode } from "react"

export interface ISelectProps {
    id?: string 
    className: string 
    value?: string 
    children: any
    placeholder?: string
    onChange?: (e: string) => void
}
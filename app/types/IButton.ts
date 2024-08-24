import { ReactNode, MouseEventHandler } from "react"

export interface IButtonProps {
    type: "submit" | "reset" | "button"
    className: string
    children: ReactNode
    onClick?: MouseEventHandler<HTMLButtonElement>
}
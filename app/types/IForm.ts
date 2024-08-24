import { ReactNode, FormEvent } from "react";

export interface IFormProps {
    id: string 
    className: string 
    children: ReactNode
    onSubmit?: FormEvent<HTMLFormElement>
}
import { IButtonProps } from "@/app/types/IButton"

const Button: React.FC<IButtonProps> = ({
    type,
    className,
    children,
    onClick,
    disabled
}) => {
    return (
        <button type={type} onClick={onClick} className={className} disabled={disabled}>
            {children}
        </button>
    )
}

export default Button
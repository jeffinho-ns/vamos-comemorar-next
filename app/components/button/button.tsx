import { IButtonProps } from "@/app/types/IButton"

const Button: React.FC<IButtonProps> = ({
    type,
    className,
    children,
    onClick
}) => {
    return (
        <button type={type} onClick={onClick} className={className}>
            {children}
        </button>
    )
}

export default Button
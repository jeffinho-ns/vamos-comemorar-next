import { IFormProps } from "@/app/types/IForm"

const Form: React.FC<IFormProps> = ({
    id,
    className,
    children,
    onSubmit
}) => {
    return (
        <form
            id={id}
            className={className}
        >
            {children}
        </form>
    )   
}

export default Form
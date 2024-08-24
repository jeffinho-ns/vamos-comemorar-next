import { ISelectProps } from "@/app/types/ISelect"

const Select: React.FC<ISelectProps> = ({
    id,
    className,
    value,
    children,
    onChange
}) => {
    return (
        <select
            id={id}
            className={className}
            value={value}
            onChange={e => onChange && onChange(e.target.value)}
        >
            {children}
        </select>
    )
}

export default Select
import { IBannerProps } from "@/app/models/IBanner"

const Banner: React.FC<IBannerProps> = ({
    children,
    id,
    className
}) => {
    return (
        <div
            id={id}
            className={className}
        >
            {children}
        </div>
   )
}

export default Banner
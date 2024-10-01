import { IBannerProps } from "@/app/types/IBanner";

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
    );
}

export default Banner;

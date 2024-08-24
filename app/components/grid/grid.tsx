import './styles.scss'

export default function Grid({children}: any) {
    return (
        <div className="grid-container">
            {children}
        </div>
    )
}
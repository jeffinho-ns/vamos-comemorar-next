// app/models/IBanner.ts
export interface IBannerProps {
    id: string;
    className: string;
    children?: React.ReactNode; // Incluindo a propriedade children como opcional
  }
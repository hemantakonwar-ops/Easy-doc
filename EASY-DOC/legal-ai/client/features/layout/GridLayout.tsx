import { ReactNode } from 'react';

interface GridLayoutProps {
  children: ReactNode;
  columns?: number;
}

export default function GridLayout({ children, columns = 2 }: GridLayoutProps) {
  return (
    <div 
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {children}
    </div>
  );
}

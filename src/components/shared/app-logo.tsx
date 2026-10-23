import { Volleyball, type LucideProps } from 'lucide-react';

export function AppLogo({ className = "w-6 h-6", ...props }: LucideProps) {
  return <Volleyball className={className} strokeWidth={2} {...props} />;
}

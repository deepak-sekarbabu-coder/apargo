import { cn } from '@/lib/utils';

import { IconName, Icons } from '@/components/icons/icons';

interface CategoryIconProps extends React.HTMLAttributes<HTMLDivElement> {
  name: IconName | string; // Allow both icon names and emoji strings
}

export function CategoryIcon({ name, className, ...props }: CategoryIconProps) {
  const IconComponent = Icons[name as IconName];

  // If it's a valid icon name, render the Lucide icon
  if (IconComponent) {
    return (
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground',
          className
        )}
        {...props}
      >
        <IconComponent className="h-4 w-4" />
      </div>
    );
  }

  // If it's not a valid icon name, treat it as an emoji or text
  return (
    <div
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground',
        className
      )}
      {...props}
    >
      <span className="text-lg">{name}</span>
    </div>
  );
}

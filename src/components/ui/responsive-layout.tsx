'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { useBreakpoint, useDeviceInfo } from '@/hooks/use-mobile';

// Responsive container component
interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  centerContent?: boolean;
  mobileFullWidth?: boolean;
}

export const ResponsiveContainer = React.forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  (
    {
      className,
      maxWidth = 'lg',
      padding = 'md',
      centerContent = true,
      mobileFullWidth = true,
      ...props
    },
    ref
  ) => {
    const { isMobile } = useDeviceInfo();

    const maxWidthClasses = {
      xs: 'max-w-xs',
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      full: 'max-w-full',
    };

    const paddingClasses = {
      none: '',
      xs: 'px-2 py-1',
      sm: 'px-3 py-2',
      md: 'px-4 py-3',
      lg: 'px-6 py-4',
      xl: 'px-8 py-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          !mobileFullWidth || !isMobile ? maxWidthClasses[maxWidth] : '',
          paddingClasses[padding],
          centerContent && 'mx-auto',
          className
        )}
        {...props}
      />
    );
  }
);
ResponsiveContainer.displayName = 'ResponsiveContainer';

// Responsive grid component
interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  autoFit?: boolean;
  minItemWidth?: string;
}

export const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  (
    {
      className,
      cols = { xs: 1, sm: 2, md: 3, lg: 4 },
      gap = 'md',
      autoFit = false,
      minItemWidth = '250px',
      ...props
    },
    ref
  ) => {
    const gapClasses = {
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    };

    const gridColClasses: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          autoFit
            ? `grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))]`
            : [
                cols.xs && gridColClasses[cols.xs],
                cols.sm && `sm:${gridColClasses[cols.sm]}`,
                cols.md && `md:${gridColClasses[cols.md]}`,
                cols.lg && `lg:${gridColClasses[cols.lg]}`,
                cols.xl && `xl:${gridColClasses[cols.xl]}`,
              ]
                .filter(Boolean)
                .join(' '),
          gapClasses[gap],
          className
        )}
        {...props}
      />
    );
  }
);
ResponsiveGrid.displayName = 'ResponsiveGrid';

// Mobile-first flex layout
interface MobileFlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col';
  mobileDirection?: 'row' | 'col';
  wrap?: boolean;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const MobileFlex = React.forwardRef<HTMLDivElement, MobileFlexProps>(
  (
    {
      className,
      direction = 'row',
      mobileDirection,
      wrap = false,
      align = 'start',
      justify = 'start',
      gap = 'md',
      ...props
    },
    ref
  ) => {
    const { isMobile } = useDeviceInfo();

    const directionClasses = {
      row: 'flex-row',
      col: 'flex-col',
    };

    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    };

    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };

    const gapClasses = {
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    };

    const activeDirection = isMobile && mobileDirection ? mobileDirection : direction;

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          directionClasses[activeDirection],
          wrap && 'flex-wrap',
          alignClasses[align],
          justifyClasses[justify],
          gapClasses[gap],
          className
        )}
        {...props}
      />
    );
  }
);
MobileFlex.displayName = 'MobileFlex';

// Responsive text component
interface ResponsiveTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  size?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  mobileAlign?: 'left' | 'center' | 'right';
}

export const ResponsiveText = React.forwardRef<HTMLElement, ResponsiveTextProps>(
  (
    {
      as: Component = 'p',
      className,
      size = { xs: 'text-sm', md: 'text-base' },
      weight = 'normal',
      align = 'left',
      mobileAlign,
      ...props
    },
    ref
  ) => {
    const { isMobile } = useDeviceInfo();

    const weightClasses = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };

    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    const activeAlign = isMobile && mobileAlign ? mobileAlign : align;

    const sizeClasses = [
      size.xs && size.xs,
      size.sm && `sm:${size.sm}`,
      size.md && `md:${size.md}`,
      size.lg && `lg:${size.lg}`,
      size.xl && `xl:${size.xl}`,
    ]
      .filter(Boolean)
      .join(' ');

    return React.createElement(Component, {
      ref,
      className: cn(sizeClasses, weightClasses[weight], alignClasses[activeAlign], className),
      ...props,
    });
  }
);
ResponsiveText.displayName = 'ResponsiveText';

// Responsive visibility hook
export const useResponsiveVisibility = () => {
  const breakpoint = useBreakpoint();
  const { isMobile, isTablet, isDesktop } = useDeviceInfo();

  return {
    showOnMobile: isMobile,
    hideOnMobile: !isMobile,
    showOnTablet: isTablet,
    hideOnTablet: !isTablet,
    showOnDesktop: isDesktop,
    hideOnDesktop: !isDesktop,
    breakpoint,
  };
};

// Responsive spacing utility
export const useResponsiveSpacing = () => {
  const { isMobile, isTablet } = useDeviceInfo();

  const getSpacing = (mobile: string, tablet?: string, desktop?: string) => {
    if (isMobile) return mobile;
    if (isTablet && tablet) return tablet;
    return desktop || tablet || mobile;
  };

  return { getSpacing };
};

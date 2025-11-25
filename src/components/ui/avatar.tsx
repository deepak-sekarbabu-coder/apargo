'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';

import * as React from 'react';

import { getLogger } from '@/lib/core/logger';
import { cn } from '@/lib/utils';

const logger = getLogger('Component');

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props }, ref) => {
  // Import image optimization utilities dynamically
  const [optimizedSrc, setOptimizedSrc] = React.useState<string | undefined>(
    typeof src === 'string' ? src : undefined
  );
  const [srcSet, setSrcSet] = React.useState<string | undefined>();

  React.useEffect(() => {
    const optimizeImage = async () => {
      if (typeof src !== 'string') {
        setOptimizedSrc(undefined);
        setSrcSet(undefined);
        return;
      }

      // Only optimize Google images to avoid unnecessary processing
      if (src.includes('googleusercontent.com')) {
        try {
          const { optimizeGoogleImage, generateGoogleImageSrcSet } = await import(
            '@/lib/utils/image-optimization'
          );

          // Optimize for 64px by default (most common avatar size)
          const optimized = optimizeGoogleImage(src, { size: 64, crop: true });
          setOptimizedSrc(optimized);

          // Generate responsive srcSet for different screen densities
          const responsiveSrcSet = generateGoogleImageSrcSet(src, [32, 64, 96, 128]);
          setSrcSet(responsiveSrcSet);
        } catch (error) {
          logger.error('Error optimizing avatar image:', error);
          setOptimizedSrc(src);
        }
      } else {
        setOptimizedSrc(src);
      }
    };

    optimizeImage();
  }, [src]);

  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn('aspect-square h-full w-full', className)}
      src={optimizedSrc}
      srcSet={srcSet}
      sizes="(max-width: 640px) 40px, (max-width: 1024px) 48px, 64px"
      loading="lazy"
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };

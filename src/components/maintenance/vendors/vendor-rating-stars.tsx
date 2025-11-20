import React from 'react';

interface RatingStarsProps {
  rating?: number | null;
  outOf?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function RatingStars({ rating, outOf = 5, size = 'sm', className = '' }: RatingStarsProps) {
  if (!rating) return <span className="text-muted-foreground">—</span>;
  const full = Math.round(rating); // simple rounding for now
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      aria-label={`Rating ${rating.toFixed(1)} out of ${outOf}`}
    >
      {Array.from({ length: outOf }).map((_, i) => (
        <svg
          key={i}
          className={`${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${i < full ? 'fill-amber-400 text-amber-400' : 'fill-none text-amber-300'} stroke-current`}
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            strokeWidth="1"
            d="m10 1.5 2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 15.98l-5.2 2.72.99-5.78L1.58 7.62l5.82-.85L10 1.5Z"
          />
        </svg>
      ))}
      <span className="ml-1 text-[11px] font-medium text-muted-foreground">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}



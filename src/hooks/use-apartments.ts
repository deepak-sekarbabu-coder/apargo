import type { Apartment } from '@/lib/core/types';

import { useApartments as useRQApartments } from './use-queries';

// Wrapper to preserve the legacy hook shape ({ apartments }) while using
// the react-query based hook internally. This avoids changing callers.
export function useApartments(): {
  apartments: Apartment[];
  isLoading?: boolean;
  isError?: boolean;
  refetch?: () => void;
} {
  const rq = useRQApartments();
  return {
    apartments: rq.data ?? [],
    isLoading: rq.isLoading,
    isError: rq.isError,
    refetch: rq.refetch,
  };
}

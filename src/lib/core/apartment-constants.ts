// src/lib/apartment-constants.ts
import { getLogger } from './logger';

const logger = getLogger('Core');

const APARTMENT_COUNT_ENV = process.env.NEXT_PUBLIC_APP_APARTMENT_COUNT;
const DEFAULT_COUNT = 7;

// Predefined apartment ID arrays
const APARTMENTS_3 = ['G1', 'F1', 'F2'];
const APARTMENTS_7 = ['G1', 'F1', 'F2', 'S1', 'S2', 'T1', 'T2'];
const APARTMENTS_10 = ['G1', 'G2', 'F1', 'F2', 'F3', 'S1', 'S2', 'S3', 'T1', 'T2'];

/**
 * Validates and retrieves the apartment count from environment variables.
 * This function is exported for individual use but `getApartmentIds` is preferred.
 * @returns {number} The configured apartment count.
 */
const getApartmentCount = (): number => {
  if (APARTMENT_COUNT_ENV) {
    const parsedCount = parseInt(APARTMENT_COUNT_ENV, 10);
    if (!isNaN(parsedCount) && parsedCount > 0) {
      return parsedCount;
    }
    logger.warn(
      `Invalid NEXT_PUBLIC_APP_APARTMENT_COUNT value: "${APARTMENT_COUNT_ENV}". Falling back to default count: ${DEFAULT_COUNT}.`
    );
  }
  return DEFAULT_COUNT;
};

/**
 * Generates an array of apartment IDs based on the configured count.
 * - For counts 3, 7, 10, it returns predefined lists.
 * - For other counts, it generates a dynamic list (e.g., A1, A2, ...).
 * @returns {string[]} An array of apartment IDs.
 */
export const getApartmentIds = (): string[] => {
  const count = getApartmentCount();

  switch (count) {
    case 3:
      return APARTMENTS_3;
    case 7:
      return APARTMENTS_7;
    case 10:
      return APARTMENTS_10;
    default:
      if (count > 0) {
        // Dynamically generate apartment IDs
        return Array.from({ length: count }, (_, i) => `A${i + 1}`);
      }
      return [];
  }
};

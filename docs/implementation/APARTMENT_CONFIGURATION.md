# Apartment Configuration Guide

This document provides a comprehensive guide on how to configure and use the dynamic apartment management system.

## 1. Overview

The system allows for dynamic configuration of apartment units through an environment variable, `NEXT_PUBLIC_APP_APARTMENT_COUNT`. This approach eliminates hardcoded apartment arrays, providing flexibility for different building sizes and deployment scenarios.

## 2. Configuration

### Environment Variable

To configure the number of apartments, set the following environment variable in your `.env.local` file:

```
NEXT_PUBLIC_APP_APARTMENT_COUNT=10
```

- If this variable is **not set**, the system defaults to **7** apartments.
- If the value is **invalid** (non-numeric or less than 1), the system will log a warning and fall back to the default of 7.

### Predefined Configurations

The system includes predefined, human-readable apartment IDs for common counts:

- **`3`**: `['G1', 'F1', 'F2']`
- **`7`** (Default): `['G1', 'F1', 'F2', 'S1', 'S2', 'T1', 'T2']`
- **`10`**: `['G1', 'G2', 'F1', 'F2', 'F3', 'S1', 'S2', 'S3', 'T1', 'T2']`

### Dynamic Generation

For any other count greater than 0, the system will dynamically generate a list of apartment IDs in the format `['A1', 'A2', ..., 'A<N>']`, where `<N>` is the configured count.

**Example:** `NEXT_PUBLIC_APP_APARTMENT_COUNT=25` will produce `['A1', 'A2', ..., 'A25']`.

## 3. Usage in Code

A centralized module, `src/lib/apartment-constants.ts`, provides helper functions to access the apartment configuration.

### Core Functions

- `getApartmentCount(): number`
  - Returns the total number of configured apartments.

- `getApartmentIds(): string[]`
  - Returns the array of apartment ID strings.

### Example (TypeScript/JavaScript)

To use the apartment configuration in your code, import the functions from the module:

```typescript
import { getApartmentCount, getApartmentIds } from '@/lib/apartment-constants';

const apartmentIds = getApartmentIds();
console.log('Configured apartments:', apartmentIds);

const apartmentCount = getApartmentCount();
console.log('Total apartments:', apartmentCount);
```

## 4. Scripts and APIs

All relevant scripts and API endpoints have been updated to use this centralized module, ensuring consistent apartment data across the application. This includes user creation scripts, notification endpoints, and administrative tools.

## 5. Testing

Two test scripts are provided to verify the functionality:

- `scripts/test-apartment-constants.ts`: A test suite for the TypeScript module.
- `scripts/test-apartment-simple.js`: A simple JavaScript test to ensure compatibility.

To run the tests, you can use `node` or a TypeScript runner like `ts-node`.

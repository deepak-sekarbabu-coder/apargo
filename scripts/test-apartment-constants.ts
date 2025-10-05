// scripts/test-apartment-constants.ts
import { getApartmentCount, getApartmentIds } from '../src/lib/apartment-constants';

console.log('--- Running Apartment Configuration Test ---');
console.log('This test reads the NEXT_PUBLIC_APP_APARTMENT_COUNT environment variable.');
console.log('To test different scenarios, run this script with the variable set before execution.');
console.log('Example for Unix-like shells:');
console.log('  NEXT_PUBLIC_APP_APARTMENT_COUNT=10 tsx scripts/test-apartment-constants.ts');
console.log('Example for Windows (Command Prompt):');
console.log('  set NEXT_PUBLIC_APP_APARTMENT_COUNT=10 && tsx scripts/test-apartment-constants.ts');
console.log('Running without the variable set should use the default value.');

const configuredCountEnv = process.env.NEXT_PUBLIC_APP_APARTMENT_COUNT;
console.log(
  `\nRunning with NEXT_PUBLIC_APP_APARTMENT_COUNT = ${configuredCountEnv || '(not set)'}`
);

const count = getApartmentCount();
const ids = getApartmentIds();

console.log(`getApartmentCount() returned: ${count}`);
console.log(`getApartmentIds() returned: [${ids.join(', ')}]`);
console.log(`Number of IDs: ${ids.length}`);

if (ids.length !== count) {
  console.error(`❌ FAILED: Mismatch between count (${count}) and number of IDs (${ids.length}).`);
} else {
  console.log('✅ PASSED: Count matches the number of IDs.');
}

// Specific checks for known values
if (!configuredCountEnv) {
  // Default case
  if (count === 7) console.log('✅ PASSED: Default count is 7.');
  else console.error(`❌ FAILED: Expected default count of 7, but got ${count}.`);
} else {
  const expectedCount = parseInt(configuredCountEnv, 10);
  if (!isNaN(expectedCount) && count === expectedCount)
    console.log(`✅ PASSED: Count matches environment variable.`);
  else if (isNaN(expectedCount))
    console.warn(`⚠️ SKIPPED: Cannot parse configured count '${configuredCountEnv}' as a number.`);
  else console.error(`❌ FAILED: Expected count of ${expectedCount}, but got ${count}.`);
}

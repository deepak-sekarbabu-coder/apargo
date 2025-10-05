// scripts/test-apartment-simple.js
console.log('--- Running Simple JS Apartment Test ---');

// This script uses a dynamic import() to load the ES Module from TypeScript.
// This is necessary because a CommonJS .js file cannot statically import an ES module.
// This script should be run with a tool that can resolve and transpile TS, like `tsx`.
// Example: `tsx scripts/test-apartment-simple.js`

async function runTest() {
  try {
    const { getApartmentIds } = await import('../src/lib/apartment-constants.ts');

    const apartmentIds = getApartmentIds();

    console.log('Successfully imported and executed getApartmentIds().');
    console.log(
      `Retrieved ${apartmentIds.length} apartment IDs based on current environment configuration:`
    );
    console.log(apartmentIds.join(', '));

    console.log('\n✅ Test complete.');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(
      'This script likely needs to be run with `tsx` (i.e., `tsx scripts/test-apartment-simple.js`) to handle TypeScript and module formats correctly.'
    );
  }
}

runTest();

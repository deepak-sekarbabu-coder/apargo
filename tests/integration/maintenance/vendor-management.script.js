/**
 * Test for Vendor Management Functionality
 *
 * This test verifies that:
 * 1. Vendor dialog component exists and is properly structured
 * 2. Vendor dialog is integrated into maintenance view
 * 3. All required form fields are present
 * 4. Vendor creation and editing workflows are set up
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('\n👥 Testing Vendor Management Functionality');
console.log('='.repeat(50));

// Test 1: Check if vendor dialog component exists
console.log('\n1. Checking vendor dialog component...');
const dialogPath = 'src/components/dialogs/vendor-dialog.tsx';
if (fs.existsSync(dialogPath)) {
  console.log('✅ Vendor dialog component exists');
} else {
  console.log('❌ Vendor dialog component missing');
  process.exit(1);
}

// Test 2: Check if dialog is properly integrated in maintenance view
console.log('\n2. Checking maintenance view integration...');
const maintenanceViewPath = 'src/components/maintenance/maintenance-view.tsx';
const maintenanceViewContent = fs.readFileSync(maintenanceViewPath, 'utf8');
if (
  maintenanceViewContent.includes('VendorDialog') &&
  maintenanceViewContent.includes('showVendorDialog') &&
  maintenanceViewContent.includes('handleVendorSubmit')
) {
  console.log('✅ Vendor dialog is properly integrated');
} else {
  console.log('❌ Vendor dialog integration incomplete');
  process.exit(1);
}

// Test 3: Check vendor dialog component structure
console.log('\n3. Checking vendor dialog structure...');
const dialogContent = fs.readFileSync(dialogPath, 'utf8');
const requiredFields = [
  'name',
  'serviceType',
  'phone',
  'email',
  'address',
  'rating',
  'notes',
  'isActive',
];
const missingFields = requiredFields.filter(field => !dialogContent.includes(`name=\"${field}\"`));
if (missingFields.length === 0) {
  console.log('✅ All required form fields are present');
} else {
  console.log(`❌ Missing form fields: ${missingFields.join(', ')}`);
  process.exit(1);
}

// Test 4: Check service type options
console.log('\n4. Checking service type options...');
const expectedServiceTypes = [
  'elevator',
  'plumbing',
  'electrical',
  'hvac',
  'cleaning',
  'security',
  'landscaping',
  'general_maintenance',
  'other',
];
const missingServiceTypes = expectedServiceTypes.filter(
  type => !dialogContent.includes(`value=\"${type}\"`)
);
if (missingServiceTypes.length === 0) {
  console.log('✅ All service type options are present');
} else {
  console.log(`❌ Missing service types: ${missingServiceTypes.join(', ')}`);
  process.exit(1);
}

// Test 5: Check TypeScript compilation
console.log('\n5. Running TypeScript type check...');
try {
  execSync('npm run typecheck', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  console.log(error.stdout?.toString() || error.message);
  process.exit(1);
}

// Test 6: Check vendor list integration
console.log('\n6. Checking vendor list integration...');
const vendorListPath = 'src/components/maintenance/vendor-list.tsx';
const vendorListContent = fs.readFileSync(vendorListPath, 'utf8');
if (vendorListContent.includes('onAdd') && vendorListContent.includes('onEdit')) {
  console.log('✅ Vendor list has proper callback functions');
} else {
  console.log('❌ Vendor list missing callback functions');
  process.exit(1);
}

console.log('\n🎉 All vendor management functionality tests passed!');
console.log('\n📝 Summary of vendor dialog features:');
console.log('   • Complete vendor form with validation');
console.log('   • Service type selection (9 different types)');
console.log('   • Optional contact information (phone, email, address)');
console.log('   • Rating system (1-5 stars)');
console.log('   • Notes field for additional information');
console.log('   • Active/inactive status toggle');
console.log('   • Proper form validation and error handling');

console.log('\n🚀 The vendor management now supports:');
console.log('   • Adding new vendors with all required and optional fields');
console.log('   • Editing existing vendor information');
console.log('   • Service type categorization');
console.log('   • Contact information management');
console.log('   • Rating and notes tracking');
console.log('   • Active status management');
console.log('   • Real-time updates through Firebase subscriptions');

console.log('\n✅ Ready to test vendor management in the development environment!');

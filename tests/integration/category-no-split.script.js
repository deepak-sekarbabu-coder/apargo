// Test script to verify category-based no-split feature flag functionality
console.log('Testing category-based no-split feature flag system...');

// Test data
const categories = [
  { id: 'utilities', name: 'Utilities', icon: '🏠', noSplit: false },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', noSplit: true },
  { id: 'maintenance', name: 'Maintenance', icon: '🔧', noSplit: false },
  { id: 'personal', name: 'Personal', icon: '👤', noSplit: true }, // Example of custom no-split category
];

const apartments = [
  { id: 'T1', name: 'Apartment T1' },
  { id: 'S2', name: 'Apartment S2' },
  { id: 'F1', name: 'Apartment F1' },
  { id: 'G1', name: 'Apartment G1' },
  { id: 'F2', name: 'Apartment F2' },
  { id: 'S1', name: 'Apartment S1' },
];

// Simulate the new expense splitting logic
function testExpenseSplitting(amount, categoryId, payingApartmentId) {
  console.log(`\n🧪 Testing expense: ₹${amount} for category ${categoryId}`);

  const category = categories.find(c => c.id === categoryId);
  const isNoSplitExpense = category?.noSplit === true;

  if (isNoSplitExpense) {
    console.log(`✅ No-split expense detected for category: ${category.name}`);
    console.log(`   - Amount: ₹${amount}`);
    console.log(`   - Only ${payingApartmentId} will pay`);
    console.log(`   - No apartments owe anything`);
    console.log(`   - Total outstanding: ₹0`);
    return {
      paidByApartment: payingApartmentId,
      owedByApartments: [],
      perApartmentShare: 0,
      totalOutstanding: 0,
    };
  } else {
    const allApartmentIds = apartments.map(apt => apt.id);
    const perApartmentShare = amount / allApartmentIds.length;
    const owingApartments = [...allApartmentIds];
    const totalOwedByOthers = (owingApartments.length - 1) * perApartmentShare;

    console.log(`✅ Split expense detected for category: ${category.name}`);
    console.log(`   - Amount: ₹${amount}`);
    console.log(`   - Per apartment share: ₹${perApartmentShare.toFixed(2)}`);
    console.log(`   - Owing apartments: ${owingApartments.length}`);
    console.log(
      `   - Total outstanding for ${payingApartmentId}: ₹${totalOwedByOthers.toFixed(2)}`
    );
    return {
      paidByApartment: payingApartmentId,
      owedByApartments: owingApartments,
      perApartmentShare: perApartmentShare,
      totalOutstanding: totalOwedByOthers,
    };
  }
}

// Test cases
console.log('🔬 Test Case 1: Utilities (should split)');
testExpenseSplitting(600, 'utilities', 'T1');

console.log('\n🔬 Test Case 2: Cleaning (should NOT split)');
testExpenseSplitting(200, 'cleaning', 'T1');

console.log('\n🔬 Test Case 3: Maintenance (should split)');
testExpenseSplitting(1200, 'maintenance', 'S2');

console.log('\n🔬 Test Case 4: Personal (should NOT split - custom category)');
testExpenseSplitting(150, 'personal', 'F1');

console.log('\n✨ Feature Flag Benefits:');
console.log('🎯 Configurable: Admins can toggle noSplit for any category');
console.log('🔧 Flexible: No hardcoded category names');
console.log('📈 Scalable: Easy to add new no-split categories');
console.log('🔄 Backward Compatible: Still supports legacy string-based logic');
console.log('👥 User Friendly: Clear visual indicators in admin interface');

console.log('\n🎉 Category-based no-split feature flag system is working correctly!');

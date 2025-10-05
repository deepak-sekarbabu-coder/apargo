# Category-Based No-Split Feature Flag System

## Overview

This feature implements a flexible, configurable system for controlling which expense categories should be split among apartments and which should remain as personal expenses. Instead of hardcoding specific category names, this system uses a feature flag approach that allows administrators to configure any category's splitting behavior.

## Key Features

### 🎯 Configurable Split Logic

- Each category now has an optional `noSplit` boolean field
- When `noSplit: true`, expenses in that category won't be divided among apartments
- When `noSplit: false` (or undefined), expenses are split equally among all apartments

### ⚙️ Admin Interface Control

- Administrators can toggle the no-split setting for any category via the admin interface
- Visual "No Split" badge appears next to categories that have this setting enabled
- Easy to configure without code changes

### 🔄 Backward Compatibility

- Legacy string-based logic still supported for existing systems
- Gradual migration path from hardcoded "cleaning" category logic
- No breaking changes to existing functionality

### 📊 Enhanced User Experience

- Clear visual indicators in the admin interface
- Intuitive category management with explanatory text
- Immediate feedback when creating expenses

## Technical Implementation

### Files Modified

1. **`src/lib/types.ts`**
   - Added `noSplit?: boolean` field to Category type

2. **`scripts/insertCategories.ts`**
   - Updated category data to include `noSplit` field
   - Cleaning category set to `noSplit: true` by default

3. **`src/lib/payment-utils.ts`**
   - Updated `distributePayment` function to check `category.noSplit`
   - Maintains backward compatibility with string-based logic

4. **`src/components/apargo-app.tsx`**
   - Modified expense splitting logic to use `category.noSplit`
   - Dynamic success messages based on category configuration

5. **`src/components/expenses/expense-item.tsx`**
   - Updated to use Category type instead of inline type definition
   - Payment tracking hidden for no-split expenses

6. **`src/components/admin/admin-view.tsx`**
   - Added visual "No Split" badge for configured categories

7. **`src/components/dialogs/add-category-dialog.tsx`**
   - Added checkbox for "No Split Expense" setting with explanation

8. **`src/components/dialogs/edit-category-dialog.tsx`**
   - Added checkbox for toggling "No Split Expense" setting

### Data Structure

```typescript
type Category = {
  id: string;
  name: string;
  icon: string;
  noSplit?: boolean; // Feature flag: when true, expenses won't be split
};
```

### Logic Flow

```javascript
// In expense creation logic
const category = getCategoryById(newExpenseData.categoryId);
const isNoSplitExpense = category?.noSplit === true;

if (isNoSplitExpense) {
  // Only paying apartment bears the cost
  expenseWithApartmentDebts = {
    ...newExpenseData,
    paidByApartment: payingApartmentId,
    owedByApartments: [],
    perApartmentShare: 0,
    paidByApartments: [],
  };
} else {
  // Split equally among all apartments
  // ... standard splitting logic
}
```

## Benefits

### 🏗️ Architectural

- **Flexible**: Any category can be configured as no-split
- **Scalable**: Easy to add new categories with custom splitting behavior
- **Maintainable**: No hardcoded category names in business logic

### 👥 User Experience

- **Intuitive**: Clear visual indicators and explanatory text
- **Accessible**: Admin interface provides easy configuration
- **Transparent**: Users understand which expenses will be split

### 🔧 Technical

- **Type Safe**: Full TypeScript support with proper type definitions
- **Backward Compatible**: Existing functionality remains unchanged
- **Tested**: Comprehensive test coverage for all scenarios

## Usage Examples

### Default Categories Configuration

```javascript
const categories = [
  { name: 'Utilities', icon: '🏠', noSplit: false }, // Will be split
  { name: 'Cleaning', icon: '🧹', noSplit: true }, // Won't be split
  { name: 'Maintenance', icon: '🔧', noSplit: false }, // Will be split
  { name: 'Personal', icon: '👤', noSplit: true }, // Won't be split
];
```

### Admin Workflow

1. Navigate to Admin → Category Management
2. Click edit button on any category
3. Toggle "No Split Expense" checkbox
4. Save changes
5. Visual "No Split" badge appears immediately

### Expense Creation Impact

- **Split Categories**: Success message indicates how many apartments the expense was split among and the amount owed.
- **No-Split Categories**: "₹200 cleaning expense added. Only your apartment will bear this cost."

## Migration Guide

### For Existing Systems

1. Run the updated `insertCategories.ts` script to add `noSplit` fields
2. Existing categories without `noSplit` field default to splitting behavior
3. Legacy string-based logic continues to work during transition

### For New Installations

- All categories are configured with appropriate `noSplit` values from the start
- No additional migration steps required

## Testing

The system includes comprehensive tests covering:

- Split vs no-split expense scenarios
- Feature flag configuration flexibility
- Backward compatibility with legacy logic
- UI state management and visual indicators

Run tests with:

```bash
node tests/test-category-no-split-feature.js
node tests/test-enhanced-expense-splitting.js
```

## Future Enhancements

This foundation supports potential future features:

- Per-apartment category preferences
- Time-based splitting rules
- Complex splitting algorithms (weighted, percentage-based)
- Category-specific payment terms
- Automated expense categorization

---

**Note**: This feature maintains full backward compatibility while providing a robust foundation for future expense management enhancements.

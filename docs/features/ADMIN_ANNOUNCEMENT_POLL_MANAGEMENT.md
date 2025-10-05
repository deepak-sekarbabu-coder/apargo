# Admin Announcement and Poll Management

This document describes the new functionality for admin users to view and manage active announcements and polls.

## Features

### Announcement Management

**Location**: Admin Panel → Community Tab → Announcement Management section

**What you can do**:

- ✅ **View Active Announcements**: See all active announcements in a list format
- ✅ **Create New Announcements**: Use the "Create Announcement" button (existing functionality)
- ✅ **Delete Announcements**: Remove unwanted announcements with confirmation
- ✅ **Real-time Updates**: Lists automatically update when announcements are created/deleted

**Information Displayed**:

- Announcement title and message
- Priority level (High/Medium/Low) with colored badges
- Creation date and time
- Expiry date (if set)
- Number of apartments notified
- List of apartment IDs (for small numbers)

### Poll Management

**Location**: Admin Panel → Community Tab → Poll Management section

**What you can do**:

- ✅ **View Active Polls**: See all active polls with voting results
- ✅ **Create New Polls**: Use the "New Poll" button (existing functionality)
- ✅ **Delete Polls**: Remove polls with all their votes
- ✅ **Real-time Updates**: Lists automatically update when polls are created/deleted/voted on

**Information Displayed**:

- Poll question
- All answer options with vote counts and percentages
- Total number of votes received
- Creation date and time
- Expiry date and status (if applicable)
- Visual progress bars for vote distribution

## How to Use

### Viewing Active Items

1. Navigate to **Admin Panel** (admin users only)
2. Click on the **"Community"** tab
3. Scroll to see both **Announcement Management** and **Poll Management** sections
4. Active announcements and polls will be displayed automatically

### Creating New Items

- **Announcements**: Click "Create Announcement" button → fill in the form → submit
- **Polls**: Click "New Poll" button → add question and options → submit

### Deleting Items

1. Find the announcement or poll you want to delete
2. Click the **trash icon** (🗑️) in the top-right corner of the item
3. Confirm the deletion in the dialog that appears
4. The item will be permanently removed

⚠️ **Warning**: Deleting is permanent and cannot be undone!

## Security

- Only users with `role: 'admin'` can access these management features
- Delete operations require confirmation to prevent accidental removal
- All changes are logged and tracked in Firestore

## Technical Details

- **Real-time Updates**: Uses Firestore listeners for instant updates
- **Data Storage**:
  - Announcements are stored in the `notifications` collection
  - Polls are stored in the `polls` collection
- **Performance**: Optimized queries only fetch active items

## Troubleshooting

### "No active announcements/polls" message

- This is normal if no items have been created yet
- Create some test items using the "Create" buttons

### Delete button not working

- Make sure you are logged in as an admin user
- Check browser console for any error messages
- Refresh the page and try again

### Real-time updates not working

- Check your internet connection
- Make sure Firestore security rules are properly configured
- Try refreshing the browser page

## Support

If you encounter any issues with this functionality, please:

1. Check the browser console for error messages
2. Verify your admin permissions in Firestore
3. Contact the development team with specific error details

# Announcements Feature

The announcements feature has been successfully integrated into your Next.js + Firebase application. Here's how it works:

## Overview

Admins can now create announcements that are instantly delivered to all users as notifications. Announcements can have expiry dates and priority levels.

## Features Implemented

### 1. Data Model

- **Updated Notification Type**: Extended to support announcements with:
  - `toApartmentId` as array for announcements (string array instead of single string)
  - `isRead` as object for announcements (tracks read status per apartment)
  - Priority, expiry, and admin metadata
- **Firestore Collections**:
  - `notifications` - stores all notifications including announcements directly
  - Announcements create single documents with apartment arrays instead of multiple documents

### 2. Backend API

- **Endpoint**: `POST /api/announcements`
- **Authentication**: Requires admin role
- **Functionality**: Creates announcement and generates notifications for all apartments

### 3. Frontend Components

- **AddAnnouncementDialog**: Admin interface for creating announcements
- **Updated NotificationItem**: Displays announcements with priority-based icons
- **Updated NotificationsPanel**: Filters expired announcements
- **Updated AdminView**: Includes announcement management section

### 4. Security

- **Firestore Rules**: Updated to restrict announcement creation to admins
- **API Authentication**: Server-side admin role verification
- **Session Management**: Uses existing Firebase Admin SDK setup

## How to Use

### For Admins

1. Navigate to the Admin panel
2. Find the "Announcement Management" section
3. Click "Create Announcement"
4. Fill in:
   - **Title** (required)
   - **Message** (required)
   - **Priority** (Low/Medium/High)
   - **Expiry Date** (optional)
5. Click "Create Announcement"

### For Users

- Announcements appear automatically in the notifications panel
- High priority announcements have red icons
- Medium priority announcements have blue icons
- Low priority announcements have gray icons
- Expired announcements are automatically filtered out

## Technical Details

### Data Flow

1. Admin creates announcement → API creates a single notification document with `toApartmentId` as an array containing all apartments
2. Users see announcements via real-time listener using `array-contains` query
3. Read status is tracked per apartment using an object structure in `isRead` field
4. Expired announcements are filtered client-side

### Priority System

- **High**: Red megaphone icon - for urgent announcements
- **Medium**: Blue megaphone icon - for general announcements
- **Low**: Gray megaphone icon - for minor updates

### Expiry Handling

- Client-side filtering removes expired announcements from view
- No server-side cleanup needed (optional enhancement)

## Files Modified/Created

### New Files

- `src/app/api/announcements/route.ts` - API endpoint
- `src/components/admin/add-announcement-dialog.tsx` - Admin UI
- `ANNOUNCEMENTS_FEATURE.md` - This documentation

### Modified Files

- `src/lib/types.ts` - Updated Notification type to include announcement fields
- `src/components/notification-item.tsx` - Added announcement support
- `src/components/notifications-panel.tsx` - Added expiry filtering
- `src/components/admin/admin-view.tsx` - Added announcement section
- `firestore.rules` - Updated notification security rules for announcements

## Testing

1. **Admin Access**: Ensure your user has `role: 'admin'` in Firestore
2. **Create Announcement**: Use the admin panel to create a test announcement
3. **Verify Delivery**: Check that all users receive the notification
4. **Test Expiry**: Create an announcement with a short expiry time
5. **Test Priorities**: Create announcements with different priority levels

## Next Steps (Optional Enhancements)

1. **Announcement History**: Add a list of past announcements in admin panel
2. **Rich Text**: Support markdown or rich text in announcement messages
3. **Targeted Announcements**: Send to specific apartments only
4. **Push Notifications**: Integrate with FCM for mobile push notifications
5. **Cleanup Function**: Automated removal of expired announcements

## Troubleshooting

### Common Issues

1. **"Admin access required"**: Ensure user has `role: 'admin'` in Firestore
2. **Session errors**: Check Firebase Admin SDK configuration
3. **Notifications not appearing**: Verify Firestore rules are deployed
4. **TypeScript errors**: Run `npm run typecheck` to verify types

### Firestore Rules Deployment

If you're using Firebase CLI, deploy the updated rules:

```bash
firebase deploy --only firestore:rules
```

The announcements feature is now fully integrated and ready to use!

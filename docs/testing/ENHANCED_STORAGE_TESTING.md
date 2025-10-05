# Enhanced Storage System Testing Guide

## Overview

This guide covers testing the enhanced Firebase Storage configuration with centralized bucket management, 2MB file size limits, and admin file management features.

## Test Coverage

### ✅ Implemented Features

1. **File Upload with Size Validation**
   - 2MB maximum file size enforcement
   - MIME type validation (images and PDFs)
   - Category validation (receipt, fault, avatar, announcement)
   - File metadata storage in Firestore

2. **Admin File Management Interface**
   - Role-based access control (admin only)
   - File listing with filtering by category, age, uploader
   - Bulk file selection and deletion
   - Storage statistics dashboard
   - Files older than 3 months identification

3. **API Endpoints**
   - `POST /api/storage/upload` - Enhanced file upload
   - `GET /api/storage/upload` - Upload configuration
   - `GET /api/admin/files` - List files with filtering
   - `DELETE /api/admin/files` - Bulk delete files
   - `GET /api/admin/storage/stats` - Storage statistics

4. **Enhanced UI Components**
   - Updated fault reporting form with new upload system
   - Drag-and-drop file upload interface
   - Real-time upload progress tracking
   - File validation feedback

## Manual Testing Procedures

### 1. Test File Upload Size Limits

**Prerequisites:**

- Development server running on `http://localhost:3000`
- User with any role (file upload is available to all users)

**Steps:**

1. Navigate to fault reporting page
2. Try uploading files of different sizes:
   - ✅ Small file (< 1MB) - should succeed
   - ✅ Medium file (1-2MB) - should succeed
   - ❌ Large file (> 2MB) - should fail with clear error message
3. Verify error messages are user-friendly
4. Check that valid files show upload progress

### 2. Test File Type Validation

**Steps:**

1. Try uploading different file types:
   - ✅ JPEG images - should succeed
   - ✅ PNG images - should succeed
   - ✅ WebP images - should succeed
   - ✅ PDF documents - should succeed
   - ❌ EXE files - should fail
   - ❌ ZIP files - should fail
   - ❌ Text files - should fail

### 3. Test Admin File Management

**Prerequisites:**

- User with admin role
- Some files already uploaded in the system

**Steps:**

1. Navigate to Admin panel
2. Click on \"Files\" tab
3. Verify file listing shows:
   - File names and metadata
   - Upload dates and uploaders
   - File sizes and categories
   - Category badges with appropriate colors
4. Test filtering options:
   - Filter by category (receipt, fault, avatar, announcement)
   - Filter by age (3+ months, 6+ months, 1+ year)
   - Search by filename or uploader
5. Test bulk operations:
   - Select multiple files
   - Use \"Delete Selected\" button
   - Confirm deletion works
6. Test individual file actions:
   - Download files
   - Delete individual files

### 4. Test Storage Statistics

**Prerequisites:**

- Admin user
- Some files uploaded

**Steps:**

1. Go to Admin → Files tab
2. Verify storage statistics cards show:
   - Total file count
   - Total storage used (formatted correctly)
   - Old files count (3+ months)
   - Old files total size
3. Check that statistics update after file operations

### 5. Test Access Control

**Steps:**

1. **As regular user:**
   - Verify file upload works in fault reporting
   - Verify admin file management is not accessible
2. **As admin user:**
   - Verify all file management features are accessible
   - Verify can see files from all users

## Automated Testing

### Browser Console Test

1. Open browser developer console
2. Navigate to the application
3. Copy and paste the test script from `tests/storage/test-enhanced-storage-system.js`
4. Run: `runAllTests()`
5. Review test results

### Expected Test Results

```
📊 Test Summary
═════════════════════════════════════════════════════
Upload Configuration: 3/3 passed
File Upload Validation: 5/5 passed
Admin File Management: 4/4 passed
Unauthorized Access: 2/2 passed

Overall: 14/14 tests passed
Success rate: 100%

🎉 All tests passed! The enhanced storage system is working correctly.
```

## Common Issues and Troubleshooting

### File Upload Issues

**Problem:** \"Upload failed. Verify Firebase Storage bucket configuration\"
**Solution:**

- Check Firebase Storage rules allow authenticated writes
- Verify bucket name in `storage-enhanced.ts` matches Firebase config
- Ensure Firebase Storage is enabled in Firebase Console

**Problem:** \"File size exceeds maximum allowed size\"
**Solution:**

- This is expected behavior for files > 2MB
- Verify error message is user-friendly
- Check file size calculation is correct

### Admin Interface Issues

**Problem:** \"Access Denied\" for admin features
**Solution:**

- Verify user has `role: 'admin'` in Firestore users collection
- Check authentication context is loading user data correctly
- Verify admin routes are not cached with wrong permissions

**Problem:** Files not loading in admin interface
**Solution:**

- Check Firestore rules allow admin users to read `fileMetadata` collection
- Verify API endpoints are accessible
- Check browser network tab for API errors

### Storage Statistics Issues

**Problem:** Statistics showing incorrect values
**Solution:**

- Verify `fileMetadata` collection has correct data
- Check date parsing for age-based calculations
- Ensure file size calculations are in bytes

## Performance Considerations

### File Upload Performance

- Files are uploaded directly to Firebase Storage (no server processing)
- Progress tracking provides user feedback
- Metadata is stored separately in Firestore for fast querying

### Admin Interface Performance

- File listing is paginated (though not implemented yet)
- Filtering happens client-side for better responsiveness
- Bulk operations are batched to prevent overwhelming the backend

## Security Verification

### Authentication

- ✅ File uploads require user authentication
- ✅ Admin features require admin role
- ✅ API endpoints verify user permissions

### File Validation

- ✅ File size limits enforced
- ✅ MIME type validation prevents malicious uploads
- ✅ File names are sanitized

### Access Control

- ✅ Users can only upload files for their own actions
- ✅ Admins can manage all files
- ✅ File metadata includes uploader tracking

## Next Steps

After successful testing:

1. **Production Deployment**
   - Update Firebase Storage rules for production
   - Configure proper JWT verification in API endpoints
   - Set up monitoring for storage usage

2. **Additional Features** (Future enhancements)
   - File preview functionality
   - Advanced search and filtering
   - File usage analytics
   - Automated cleanup scheduling
   - File versioning

3. **Performance Optimizations**
   - Implement file compression
   - Add client-side caching
   - Optimize thumbnail generation
   - Implement pagination for large file lists

## Monitoring and Maintenance

### Storage Usage Monitoring

- Regularly check Firebase Storage usage in Firebase Console
- Set up alerts when approaching free tier limits
- Monitor file upload success rates

### Regular Cleanup

- Run monthly cleanup of files older than 3 months
- Archive important files before deletion
- Keep usage statistics for capacity planning

### Security Audits

- Regularly review file access logs
- Audit user permissions and roles
- Monitor for unusual upload patterns

---

**Note:** This implementation optimizes Firebase's free tier (5GB storage) by centralizing all uploads in a single bucket and providing tools for admins to manage storage efficiently.

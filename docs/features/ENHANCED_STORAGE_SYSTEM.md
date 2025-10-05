# Enhanced Storage System

## Overview

The Enhanced Storage System provides a comprehensive file management solution for the Apargo application. It handles file uploads, storage, retrieval, and management with support for multiple file types, categories, and integrated security measures.

## Core Features

### 1. File Upload Management

**API Endpoint**: `/api/storage/upload`
**Hook**: `use-file-upload.ts`

- **Multi-Category Support**: Receipt, fault, avatar, announcement, maintenance categories
- **File Validation**: Size, type, and format validation
- **Progressive Upload**: Chunked upload support for large files
- **Mobile Optimization**: Optimized for mobile device uploads

### 2. File Organization

**Categories Supported**:

- **Receipt**: Expense receipts and payment confirmations
- **Fault**: Fault report images and documentation
- **Avatar**: User profile images
- **Announcement**: Community announcement attachments
- **Maintenance**: Maintenance task documentation

### 3. Storage Configuration

**Configuration File**: `storage-enhanced.ts`
**Admin Interface**: `admin-file-manager.tsx`

- **Size Limits**: Configurable file size restrictions (default: 2MB)
- **Type Restrictions**: MIME type validation and filtering
- **Bucket Management**: Firebase Storage bucket configuration
- **Path Organization**: Structured storage path management

## Data Model

### File Metadata Structure

```typescript
export type FileMetadata = {
  id: string; // Unique file identifier
  originalName: string; // Original filename
  fileName: string; // Stored filename with timestamp
  storagePath: string; // Full path in Firebase Storage
  downloadURL: string; // Public download URL
  fileSize: number; // File size in bytes
  mimeType: string; // MIME type
  uploadedBy: string; // User ID who uploaded
  uploadedAt: string; // ISO date string
  category: 'receipt' | 'fault' | 'avatar' | 'announcement' | 'maintenance';
  relatedId?: string; // Related entity ID (expense, fault, etc.)
  apartmentId?: string; // Associated apartment
};
```

### Storage Configuration

```typescript
export type StorageConfig = {
  maxFileSize: number; // 2MB in bytes (2,097,152)
  allowedMimeTypes: string[]; // Permitted MIME types
  bucket: string; // Firebase Storage bucket name
  baseUploadPath: string; // Base path for uploads
};
```

### File Validation Result

```typescript
export type FileValidationResult = {
  isValid: boolean;
  error?: string;
  fileInfo?: {
    size: number;
    type: string;
    name: string;
  };
};
```

## API Endpoints

### File Upload

#### POST /api/storage/upload

**Purpose**: Upload files with category classification
**Authentication**: Required
**Content-Type**: multipart/form-data

**Form Data Parameters**:

- `file`: File to upload (required)
- `category`: File category (required)
- `relatedId`: Related entity ID (optional)

**Response**:

```json
{
  "success": true,
  "downloadURL": "https://firebasestorage.googleapis.com/...",
  "metadata": {
    "id": "file123",
    "originalName": "receipt.jpg",
    "fileSize": 1024000,
    "category": "receipt"
  }
}
```

**Error Responses**:

- **413 Payload Too Large**: File exceeds size limit
- **415 Unsupported Media Type**: Invalid file type
- **502 Bad Gateway**: Storage configuration error

#### GET /api/storage/upload

**Purpose**: Get upload configuration
**Authentication**: Not required

**Response**:

```json
{
  "maxFileSize": 2097152,
  "allowedMimeTypes": ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  "categories": ["receipt", "fault", "avatar", "announcement", "maintenance"]
}
```

### Admin Storage Management

#### GET /api/admin/storage/stats

**Purpose**: Get storage statistics and usage
**Authentication**: Admin required

**Response**:

```json
{
  "totalFiles": 150,
  "totalSize": 104857600,
  "categoryBreakdown": {
    "receipt": { "count": 75, "size": 52428800 },
    "fault": { "count": 45, "size": 31457280 },
    "avatar": { "count": 20, "size": 10485760 },
    "announcement": { "count": 8, "size": 8388608 },
    "maintenance": { "count": 2, "size": 2097152 }
  },
  "storageQuota": {
    "used": 104857600,
    "limit": 1073741824,
    "percentage": 9.77
  }
}
```

#### GET /api/admin/files

**Purpose**: Get admin file management interface
**Authentication**: Admin required

## File Categories and Use Cases

### Receipt Files

- **Purpose**: Expense and payment receipts
- **Integration**: Linked to expense records and payment events
- **Validation**: Images and PDF documents
- **Access**: Users can view their own, admins can view all

### Fault Images

- **Purpose**: Fault report documentation
- **Integration**: Linked to fault reports
- **Validation**: Image files only
- **Access**: Reporter and assigned users can view

### Avatar Images

- **Purpose**: User profile pictures
- **Integration**: User profile management
- **Validation**: Image files, size-optimized
- **Access**: Public within the application

### Announcement Attachments

- **Purpose**: Community announcement media
- **Integration**: Announcement system
- **Validation**: Images and documents
- **Access**: All community members

### Maintenance Documentation

- **Purpose**: Maintenance task documentation
- **Integration**: Maintenance management system
- **Validation**: Images and PDF documents
- **Access**: Maintenance staff and admins

## Technical Implementation

### File Validation

```typescript
const validateFile = (file: File): FileValidationResult => {
  // Size validation
  if (file.size > config.maxFileSize) {
    return { isValid: false, error: 'File size exceeds limit' };
  }

  // Type validation
  if (!config.allowedMimeTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' };
  }

  return { isValid: true, fileInfo: { size: file.size, type: file.type, name: file.name } };
};
```

### Upload Processing

1. **Validation**: File size, type, and format validation
2. **Authentication**: User session verification
3. **Path Generation**: Structured storage path creation
4. **Upload**: Firebase Storage upload with progress tracking
5. **Metadata Storage**: Firestore metadata record creation
6. **URL Generation**: Public download URL creation

### Mobile Optimization

- **Progressive Upload**: Chunked uploads for large files on slow connections
- **Camera Integration**: Direct camera capture for mobile devices
- **Touch Interface**: Touch-optimized upload interface
- **Offline Queue**: Upload queue for offline scenarios

## Security Features

### Access Control

- **User Isolation**: Users can only access their own files (except admins)
- **Category Restrictions**: File access based on category permissions
- **Admin Override**: Admins have full access to all files

### File Validation

- **MIME Type Checking**: Validates actual file content, not just extension
- **Size Limitations**: Prevents large file uploads that could impact performance
- **Malware Prevention**: Basic file content validation

### Storage Security

- **Firebase Rules**: Enforced through Firebase Storage security rules
- **Signed URLs**: Time-limited access URLs for sensitive content
- **Audit Trail**: Complete upload and access logging

## Performance Optimization

### Upload Performance

- **Chunked Uploads**: Large file upload optimization
- **Compression**: Client-side image compression before upload
- **Progress Tracking**: Real-time upload progress feedback

### Storage Efficiency

- **Duplicate Detection**: Prevents duplicate file uploads
- **Cleanup Routines**: Automated cleanup of orphaned files
- **CDN Integration**: Firebase CDN for global file delivery

## Integration Points

### With Expense Management

- Receipt upload and validation
- Expense record linking
- Financial documentation storage

### With Fault Reporting

- Multi-image fault documentation
- Progress photo uploads
- Repair documentation storage

### With User Management

- Profile image management
- User document storage
- Identity verification documents

### With Admin Panel

- File management interface
- Storage analytics and monitoring
- Bulk file operations

## Configuration

### Firebase Storage Setup

```typescript
const storageConfig = {
  maxFileSize: 2 * 1024 * 1024, // 2MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  bucket: 'unicorndev-b532a.firebasestorage.app',
  baseUploadPath: 'uploads',
};
```

### Environment Variables

```env
FIREBASE_STORAGE_BUCKET=unicorndev-b532a.firebasestorage.app
STORAGE_MAX_FILE_SIZE=2097152
STORAGE_ALLOWED_TYPES=image/jpeg,image/png,image/webp,application/pdf
```

## Testing and Debugging

### Test Utilities

- **Mock Uploads**: Test file upload without actual storage
- **Validation Testing**: File validation test suite
- **Performance Testing**: Upload performance benchmarks

### Debug Endpoints

- **Storage Stats**: Real-time storage usage statistics
- **File Listing**: Complete file inventory for debugging
- **Cleanup Tools**: Manual cleanup and maintenance tools

## Related Components

- File Upload Hook (`use-file-upload.ts`)
- Admin File Manager (`admin-file-manager.tsx`)
- Firebase Storage Client (`firebase-client.ts`)
- Storage Configuration (`storage-enhanced.ts`)
- Error Boundary (`error-boundary.tsx`)

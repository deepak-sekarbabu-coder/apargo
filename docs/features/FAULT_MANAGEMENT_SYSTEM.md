# Fault Management System

## Overview

The Fault Management System is a comprehensive facility for reporting, tracking, and managing property faults and maintenance issues within the Apargo application. It provides a complete workflow from initial fault reporting to resolution, with role-based access controls and assignment capabilities.

## Core Features

### 1. Fault Reporting

**User Interface**: `fault-reporting-form.tsx`
**Route**: `/fault-reporting`

- **Image Upload**: Multiple image upload support with drag-and-drop interface
- **Location Specification**: Detailed location description for accurate fault identification
- **Severity Classification**: Critical, Warning, Low priority levels
- **Description**: Detailed fault description with rich text support
- **Auto-metadata**: Automatic timestamp and reporter ID assignment

### 2. Fault Management Dashboard

**User Interface**: `fault-dashboard.tsx`, `fault-management.tsx`
**Route**: `/faults`

- **Fault Listing**: Comprehensive fault display with filtering and sorting
- **Status Management**: Open, In Progress, Resolved, Closed status tracking
- **Assignment System**: Assign faults to specific users or maintenance staff
- **Priority Management**: 1-5 priority scale for fault prioritization
- **Cost Tracking**: Estimated and actual cost tracking for budget management

### 3. Current Faults View

**User Interface**: `current-faults-list.tsx`
**Route**: `/current-faults`

- **Active Faults**: Display of all currently active (non-resolved) faults
- **Quick Actions**: Rapid status updates and basic management actions
- **Mobile Optimized**: Responsive design for mobile fault management

## Data Model

### Fault Object Structure

```typescript
export type Fault = {
  id: string;
  images: string[]; // URLs or base64 encoded images
  location: string; // Detailed location description
  description: string; // Fault description
  reportedBy: string; // User ID of reporter
  reportedAt: string; // ISO date string
  severity: FaultSeverity; // 'critical' | 'warning' | 'low'
  status: FaultStatus; // 'open' | 'in_progress' | 'resolved' | 'closed'
  assignedTo?: string; // User ID of assigned person
  estimatedCost?: number; // Estimated repair cost
  actualCost?: number; // Actual repair cost
  priority: number; // 1-5 priority scale
  fixed: boolean; // Legacy field for backward compatibility
  fixedAt?: string; // ISO date when marked as fixed
  resolvedAt?: string; // ISO date when resolved
  notes?: string; // Additional notes and updates
  updatedAt?: string; // Last update timestamp
};
```

### Fault Severity Levels

- **Critical**: Immediate attention required (safety issues, major system failures)
- **Warning**: Important but not immediate (minor leaks, cosmetic damage)
- **Low**: Non-urgent issues (suggestions, minor aesthetic issues)

### Fault Status Workflow

1. **Open**: Newly reported, awaiting review
2. **In Progress**: Assigned and being worked on
3. **Resolved**: Work completed, awaiting verification
4. **Closed**: Verified and closed

## API Endpoints

### Fault Management APIs

- **POST /api/debug/test-fault**: Create test faults (Development only)
- **GET /api/debug/faults**: Debug fault data (Development only)

### Firestore Operations

All fault operations are handled through the centralized Firestore layer:

```typescript
// Add new fault
const addFault = async (faultData: Omit<Fault, 'id'>): Promise<Fault>

// Update fault status and assignment
const updateFault = async (faultId: string, updates: Partial<Fault>): Promise<void>

// Get all faults with optional filtering
const getFaults = async (filters?: FaultFilters): Promise<Fault[]>
```

## User Permissions

### Regular Users

- Report new faults
- View their own reported faults
- View status updates on their faults

### Admin Users

- View all faults
- Assign faults to users
- Update fault status and priority
- Manage fault resolution workflow
- Access cost tracking and budget information

### Assigned Users

- View assigned faults
- Update status of assigned faults
- Add notes and progress updates

## Technical Implementation

### File Upload Integration

The fault reporting system integrates with the enhanced storage system:

- **Multiple Image Support**: Upload multiple images per fault
- **File Validation**: Automatic validation of file types and sizes
- **Storage Integration**: Seamless integration with Firebase Storage
- **Mobile Camera**: Direct camera integration for mobile devices

### Mobile Responsiveness

- **Touch-Optimized UI**: Finger-friendly interface for mobile devices
- **Responsive Images**: Optimized image display across devices
- **Offline Capability**: Basic offline support for fault viewing

### Integration Points

#### With Payment System

- Fault resolution costs can be tracked and integrated into expense management
- Maintenance budget allocation and tracking

#### With User Management

- User assignment and notification system
- Role-based permission enforcement

#### With Notification System

- Automatic notifications for fault status changes
- Assignment notifications to responsible parties

## Testing and Debugging

### Test Utilities

- **Test Fault Creation**: Automated test fault generation for development
- **Debug Endpoints**: Development-only endpoints for fault data inspection
- **Mobile Testing**: Specialized mobile testing utilities

### Common Use Cases

1. **Emergency Reporting**: Critical fault reporting with immediate notification
2. **Routine Maintenance**: Regular maintenance task tracking and assignment
3. **Cost Management**: Budget tracking and expense allocation
4. **Workflow Tracking**: Complete audit trail from report to resolution

## Future Enhancements

- **Recurring Fault Detection**: Identify patterns in fault reporting
- **Predictive Maintenance**: AI-driven maintenance scheduling
- **Vendor Integration**: Direct vendor assignment and communication
- **Analytics Dashboard**: Fault trends and resolution analytics

## Related Components

- Storage System (`storage-enhanced.ts`)
- User Management (`user-management`)
- Notification System (`push-notifications.ts`)
- File Upload (`use-file-upload.ts`)

# API Reference

This document provides a comprehensive reference for all API endpoints in the Apargo application.

## Base URL

All API endpoints are relative to your application's base URL:

- **Development:** `http://localhost:3000/api`
- **Production:** `https://your-domain.com/api`

## Authentication

Most endpoints require authentication via Firebase session cookies.

- **Admin Authentication:** Requires a valid Firebase session cookie and `role: 'admin'` in the user's document.
- **User Authentication:** Requires a valid Firebase session cookie.

## Response Format

All responses follow a consistent JSON format:

**Success Response:**

```json
{
  "success": true,
  "data": {
    /* response data */
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message description"
}
```

## Endpoints

### Admin

#### `GET /api/admin/files`

Get all uploaded files with metadata (Admin only).

- **Authentication:** Admin

#### `GET /api/admin/storage/stats`

Get storage usage statistics (Admin only).

- **Authentication:** Admin

### Announcements

#### `POST /api/announcements`

Create a new announcement (Admin only).

- **Authentication:** Admin
- **Request Body:**
  ```json
  {
    "title": "Building Maintenance Notice",
    "message": "Water will be shut off tomorrow from 9 AM to 12 PM",
    "priority": "high"
  }
  ```

### Auth

#### `GET /api/auth/session`

Verify the current user session and return user information.

- **Authentication:** User

### Debug

#### `GET /api/debug-data`

Get debug data for troubleshooting (Admin only).

- **Authentication:** Admin

#### `POST /api/debug/test-fault`

Create a test fault for debugging (Development only).

- **Authentication:** None

#### `GET /api/debug/faults`

Get fault reporting debug information (Development only).

- **Authentication:** None

### Expenses

#### `GET /api/expenses`

Retrieve all expenses.

- **Authentication:** User

#### `POST /api/expenses`

Create a new expense.

- **Authentication:** User
- **Request Body:**
  ```json
  {
    "description": "Grocery shopping",
    "amount": 150.5,
    "categoryId": "category123",
    "paidByApartment": "A1",
    "owedByApartments": ["A2", "A3", "A4"]
  }
  ```

### Health

#### `GET /api/health`

Basic health check endpoint to verify API availability.

- **Authentication:** None

### Maintenance

#### `GET /api/maintenance/tasks`

Retrieve all maintenance tasks.

- **Authentication:** User

#### `POST /api/maintenance/tasks`

Create a new maintenance task.

- **Authentication:** User
- **Request Body:**
  ```json
  {
    "title": "Elevator Inspection",
    "description": "Monthly elevator safety check",
    "category": "elevator",
    "scheduledDate": "2024-01-01T00:00:00Z"
  }
  ```

#### `PUT /api/maintenance/tasks`

Update a maintenance task.

- **Authentication:** User

#### `GET /api/maintenance/vendors`

Retrieve all vendors.

- **Authentication:** User

#### `POST /api/maintenance/vendors`

Create a new vendor (Admin only).

- **Authentication:** Admin

#### `PUT /api/maintenance/vendors`

Update a vendor (Admin only).

- **Authentication:** Admin

### Payments

#### `GET /api/payments/[id]`

Get specific payment details.

- **Authentication:** User

#### `PUT /api/payments/[id]`

Update payment status.

- **Authentication:** User

### Payment Events

#### `GET /api/payment-events`

Retrieve all payment events.

- **Authentication:** User

#### `POST /api/payment-events/generate`

Manually trigger payment event generation (Admin only).

- **Authentication:** Admin

### Storage

#### `POST /api/storage/upload`

Upload files (receipts, fault images, etc.).

- **Authentication:** User

#### `GET /api/storage/upload`

Get upload configuration.

- **Authentication:** User

### Testing & Utility

#### `GET /api/test`

Basic API functionality test.

- **Authentication:** None

#### `POST /api/test-fcm`

Test Firebase Cloud Messaging functionality.

- **Authentication:** User

#### `POST /api/test-notification`

Create a test notification to all apartments for debugging the notification system.

- **Authentication:** None

#### `POST /api/test-notifications`

Test notification system.

- **Authentication:** User

#### `GET /api/notification-debug`

Debug notification system (Admin only).

- **Authentication:** Admin

#### `POST /api/fix-notifications`

Fix notification display issues (Admin only).

- **Authentication:** Admin

#### `POST /api/quick-fix-user`

Quick user data fixes (Admin only).

- **Authentication:** Admin

#### `GET /api/netlify-test`

Test Netlify deployment functionality.

- **Authentication:** None

### Webhooks

#### `POST /api/webhooks/payment-approved`

Handle payment approval webhooks.

- **Authentication:** None (webhook)

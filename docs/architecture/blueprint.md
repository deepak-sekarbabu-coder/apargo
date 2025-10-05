# Apargo — Architecture Blueprint & User Guide

## Overview

Apargo is a modern web application designed for multi-apartment communities to manage shared expenses, roles, and notifications. It streamlines financial tracking, user management, and community operations with real-time updates and automated expense splitting.

**Target Users**: Residents (tenants/owners) and property administrators in small residential complexes.

## System Architecture

### Technology Stack

- **Frontend**: Next.js 15.3.3 with React 18.3.1 and TypeScript
- **Backend**: Firebase (Firestore, Auth, Cloud Messaging)
- **UI Framework**: ShadCN UI components built on Radix UI
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context and React Query
- **Deployment**: Netlify with automatic CI/CD

### Core Features

#### Financial Management

- **Advanced Expense Division**: Automatically divides expenses across apartments and tracks payment status
- **Outstanding Balance Tracking**: Prominently displays total outstanding amounts with visual indicators
- **Payment Management**: Mark apartments as paid when they settle their share
- **User Balances**: Clear dashboard view shows who owes money and who is owed money
- **Data Export**: Export all expense data to CSV format
- **Analytics**: Visual spending insights with charts and category breakdowns

#### User & Role Management

- **Dual Role System**: Separate authentication roles (user/admin) and property roles (tenant/owner)
- **Admin Management**: Comprehensive admin panel for managing users, expense categories, and all expenses
- **User Profiles**: Complete profile management with apartment assignment and role selection
- **Onboarding**: Mandatory role selection process for new users

#### Community Features

- **Announcement System**: Users can submit announcements for group approval with admin moderation
- **Push Notifications**: Integrated with Firebase Cloud Messaging for real-time updates
- **Polling System**: Community voting and decision-making capabilities
- **Fault Reporting**: Maintenance issue reporting with file attachments

#### Maintenance Management

- **Task Scheduling**: Recurring maintenance task management
- **Vendor Directory**: Service provider management with ratings
- **Budget Tracking**: Annual maintenance budget allocation and monitoring

## User Guide

### Getting Started

**Login**: Use Google authentication or email/password. New accounts are created by an admin (default password: `password`).

**Onboarding**: On first login, select your apartment and property role (tenant/owner) to complete your profile.

### User Roles

**User Permissions**:

- View balances and recent expenses
- Add new expenses
- Submit announcements for review
- Export data and view analytics
- Update profile information
- Receive notifications
- Vote on community polls
- Report maintenance faults

**Admin Permissions** (includes all user permissions plus):

- Manage users (add/edit/delete, assign roles/apartments)
- Manage expense categories
- Approve/reject announcements
- Access admin analytics
- Manage maintenance tasks and vendors
- Delete polls and manage community features

### Core Workflows

#### Adding an Expense

1. Click **Add Expense** in the header
2. Fill in details (description, amount, payer, category)
3. Optionally attach a receipt image
4. Click **Add Expense** — amount is automatically split among all apartments (payer excluded)

#### Submitting an Announcement

1. On the dashboard, type your message
2. Click **Submit for Review**
3. Admins will review and approve/reject the announcement

#### Updating Your Profile

1. Click your avatar in the header
2. Select **Settings**
3. Edit your information and click **Save Changes**

#### Reporting a Fault

1. Navigate to the fault reporting section
2. Add description, location, and severity level
3. Attach photos if needed
4. Submit for maintenance team review

### Dashboard Features

**Outstanding Balances**: Displayed prominently in red at the top, showing who owes money and amounts

**Recent Expenses**: Latest shared expenses with payment status indicators

**Announcements**: Community messages and important updates

**Quick Actions**: Easy access to add expenses, submit announcements, and view analytics

### Data Management

**Expense Tracking**: View all expenses with search/filter capabilities and receipt viewing (paperclip icon)

**Analytics**: Visualize spending by category and over time with interactive charts

**Export**: Download expense data in CSV format for external analysis

## Design System

### Color Palette

- **Primary**: Soft blue (#A0D2EB) — conveys trust and serenity for financial contexts
- **Background**: Light grey (#F5F5F5) — clean, uncluttered appearance for optimal legibility
- **Accent**: Pale orange (#FFB347) — highlights key interactive elements like 'Add Expense' button
- **Status Colors**: Red for outstanding balances, green for completed payments

### Typography

- **Font Family**: 'Inter' (sans-serif) — modern, neutral, and highly readable
- **Hierarchy**: Clear distinction between headlines, body text, and UI elements
- **Accessibility**: Optimized contrast ratios and font sizes

### Visual Elements

- **Icons**: Simple, flat icons for expense categories and UI actions
- **Layout**: Clean, card-based design for organized information display
- **Animations**: Subtle transitions on data updates and navigation
- **Responsive**: Mobile-first design with touch-optimized interactions

### Component Design

- **Cards**: Primary container for expenses, announcements, and data displays
- **Buttons**: Consistent styling with clear visual hierarchy
- **Forms**: User-friendly input fields with validation feedback
- **Navigation**: Intuitive menu structure with role-based visibility

## Technical Considerations

### Performance

- **Real-time Updates**: Efficient Firestore listeners for live data synchronization
- **Optimized Queries**: Server-side filtering and composite indexes
- **Caching**: Strategic use of React Query for client-side data management

### Security

- **Authentication**: Firebase Auth with role-based access control
- **Data Privacy**: Apartment-based data isolation
- **Admin Controls**: Secure admin operations with proper authorization

### Scalability

- **Modular Architecture**: Component-based design for easy feature additions
- **Database Design**: Optimized for multi-apartment communities
- **Deployment**: Automated CI/CD pipeline with Netlify

---

_This blueprint serves as both a technical reference and user guide for the Apargo application. For detailed implementation information, see the [Firestore Database Components](FIRESTORE_DATABASE_COMPONENTS.md) and other technical documentation._

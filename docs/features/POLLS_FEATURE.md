# Polls Feature

This document describes the polls feature in the Apargo application.

## Overview

Admins can create polls that are displayed to users. Users can vote on polls, and the results are updated in real-time.

## Features Implemented

### 1. Data Model

- **Firestore Collections**:
  - `polls` - stores all poll data, including the question, options, votes, and metadata.

### 2. Backend Logic (Firestore)

- **No REST API**: The backend logic is handled by functions that interact directly with Firestore.
- **`addPoll`**: Creates a new poll document in the `polls` collection.
- **`voteOnPoll`**: Updates a poll document with a user's vote.
- **`deletePoll`**: Deletes a poll document, with permission checks.
- **`listenToPolls`**: Listens for real-time updates to the polls collection.

### 3. Frontend Components

- **`AddPollDialog`**: Admin interface for creating polls.
- **`ActivePolls`**: Displays active polls and their results.
- **`PollCard`**: Renders a single poll, including voting functionality.
- **`AdminCommunityTab`**: Contains the Poll Management section.
- **`AdminView`**: Passes down poll-related props.

### 4. Security

- **Firestore Rules**: Restrict poll creation and deletion to authorized users.
- **`deletePoll` function**: Contains logic to ensure only the creator or an 'incharge' role can delete a poll.

## How to Use

### For Admins

1. Navigate to the Admin panel.
2. Click on the "Community" tab.
3. Find the "Poll Management" section.
4. Click "New Poll".
5. Fill in the poll question and options.
6. Click "Create Poll".

### For Users

- Polls appear in the community section.
- Users can vote on polls.
- Poll results are updated in real-time.

## Technical Details

### Data Flow

1. An admin uses the `AddPollDialog` to create a poll.
2. The `onAddPoll` handler calls the `addPoll` Firestore function.
3. The `addPoll` function creates a new document in the `polls` collection.
4. The `ActivePolls` component uses `listenToPolls` to display active polls in real-time.
5. When a user votes, the `voteOnPoll` function is called to update the poll document in Firestore.

## Files Modified/Created

### New Files

- `src/lib/firestore/polls.ts` - Core Firestore logic for polls.
- `src/components/dialogs/add-poll-dialog.tsx` - Admin UI for creating polls.
- `src/components/admin/active-polls.tsx` - Component to display active polls.
- `src/components/admin/poll-card.tsx` - Component to render a single poll.
- `docs/features/POLLS_FEATURE.md` - This documentation.

### Modified Files

- `src/components/admin/admin-community-tab.tsx` - To include the poll management section.
- `src/components/admin/admin-view.tsx` - To pass down poll-related props.
- `firestore.rules` - To add security rules for the `polls` collection.

## Testing

1. **Admin Access**: Ensure your user has `role: 'admin'` in Firestore.
2. **Create Poll**: Use the admin panel to create a test poll.
3. **Vote**: As a user, vote on the poll.
4. **Verify Results**: Check that the poll results are updated correctly.
5. **Deletion**: Test that only authorized users can delete a poll.


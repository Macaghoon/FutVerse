# Notification System Implementation

This document describes the notification system implemented for the football club platform.

## Overview

The notification system provides real-time indicators for new messages and notifications in the navbar. When users receive new chats or notifications, red dots appear on the respective icons. These indicators disappear when users check the respective pages.

## Features

### 1. Chat Notifications
- **Trigger**: When a user sends a message to another user
- **Indicator**: Red dot on the envelope icon in the navbar
- **Mark as Read**: Automatically when user visits the Chat page
- **Type**: `chat`

### 2. Request Notifications
- **Trigger**: When a team manager sends a recruitment request or a player applies to join a team
- **Indicator**: Red dot on the bell icon in the navbar
- **Mark as Read**: Automatically when user visits the Notifications page
- **Type**: `request`

### 3. Match Request Notifications
- **Trigger**: When a team sends a match request to another team
- **Indicator**: Red dot on the bell icon in the navbar (for team managers only)
- **Mark as Read**: Automatically when user visits the Notifications page
- **Type**: `match_request`

## Technical Implementation

### Database Structure

Notifications are stored in a `notifications` collection with the following structure:

```typescript
interface NotificationData {
  id: string;
  userId: string;
  type: 'chat' | 'request' | 'match_request' | 'team_update';
  title: string;
  message: string;
  relatedId?: string; // ID of related item (chat ID, request ID, etc.)
  isRead: boolean;
  createdAt: any;
  metadata?: any; // Additional data specific to notification type
}
```

### Key Components

1. **GlobalState Context** (`src/context/GlobalState.tsx`)
   - Manages notification counts across the app
   - Provides functions to mark notifications as read
   - Listens for real-time changes in notification counts

2. **Notification Utilities** (`src/utils/firestoreNotifications.ts`)
   - Functions to create, read, and update notifications
   - Real-time listeners for notification counts
   - Batch operations for marking multiple notifications as read

3. **NavBar Component** (`src/components/NavBar.tsx`)
   - Displays notification indicators
   - Handles click events to mark notifications as read
   - Shows red dots when there are unread notifications

### Integration Points

1. **Chat System** (`src/utils/firestoreChat.ts`)
   - Creates notifications when messages are sent
   - Automatically marks chat notifications as read when visiting Chat page

2. **Request System** (`src/utils/firestoreRequests.ts`)
   - Creates notifications for team recruitment and applications
   - Automatically marks request notifications as read when visiting Notifications page

3. **Match System** (`src/utils/firestoreMatches.ts`)
   - Creates notifications for match requests
   - Only creates notifications for team managers

## Usage

### For Users
- Red dots will automatically appear on navbar icons when there are new notifications
- Clicking on the chat or notifications icon will mark those notifications as read
- Visiting the respective pages will also mark notifications as read

### For Developers
- The system automatically creates notifications when relevant actions occur
- No manual intervention required for basic functionality
- Extensible for additional notification types

## Future Enhancements

1. **Push Notifications**: Browser push notifications for real-time alerts
2. **Email Notifications**: Email alerts for important notifications
3. **Notification Preferences**: User settings to control notification types
4. **Notification History**: Page to view all past notifications
5. **Team Update Notifications**: Notifications for team-related updates

## Database Indexes Required

The following Firestore indexes may be required for optimal performance:

```
Collection: notifications
Fields: userId (Ascending), isRead (Ascending)

Collection: notifications  
Fields: userId (Ascending), type (Ascending), isRead (Ascending)

Collection: notifications
Fields: userId (Ascending), createdAt (Descending)
```

## Error Handling

- Notification creation errors are logged but don't prevent the main action
- Failed notification reads are handled gracefully
- Real-time listeners include error callbacks for debugging 
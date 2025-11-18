# Android Permissions Justification

## Overview
This document provides detailed justification for each Android permission requested by the MWS Student App (Independent Project). This information is required for Google Play Console's Data Safety form and app review process.

**Note**: This is an independent project, not affiliated with Mathayomwatsing School. Data retention and management are handled by the app developer.

---

## Permissions List

### 1. `RECORD_AUDIO` / `MICROPHONE`

**Permission Type**: Dangerous Permission  
**Required for**: Speaking tests functionality

**Justification**:
- The app includes a "Speaking Test" feature where students must record audio responses to test questions
- This permission is essential for the core educational functionality of the app
- Audio recordings are used solely for academic assessment purposes
- Recordings are transmitted securely to the server for teacher evaluation
- No audio data is stored locally beyond the test session
- Audio is not used for any other purpose (no voice commands, no background recording)

**Data Safety Declaration**:
- **Data Type**: Audio recordings
- **Purpose**: Academic assessment (speaking test responses)
- **Collection**: Only during active speaking test sessions
- **Storage**: 
  - **Server**: Transmitted to secure server (Supabase) immediately after recording
  - **Local**: Temporarily stored in app cache during upload process, automatically cleared by system
- **Sharing**: Not shared with third parties
- **Retention**: 
  - **Server**: Stored in Supabase until end of semester (for score justification purposes), then deleted
  - **Local**: Temporary cache files, cleared automatically by Android system or when app cache is cleared

**User Control**:
- Permission is requested only when a student attempts to take a speaking test
- Users can deny permission, but speaking tests will not be accessible
- Permission can be revoked at any time through device settings

---

### 2. `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`

**Permission Type**: Dangerous Permission (Android 10 and below) / Scoped Storage (Android 11+)  
**Required for**: Test data storage and offline functionality

**Justification**:
- The app stores test progress and answers locally to enable offline functionality
- Students can continue tests even when internet connection is temporarily unavailable
- Test data is saved locally to prevent data loss if the app is closed unexpectedly
- Progress is synchronized with the server when connection is restored
- Storage is used exclusively for app-specific test data (not user media files)

**Data Safety Declaration**:
- **Data Type**: Test answers, progress data, completion status
- **Purpose**: Offline functionality and data persistence
- **Collection**: Automatically when students take tests
- **Storage**: 
  - Local: Device storage (app-specific directory) for offline functionality
  - Server: Supabase cloud database (synchronized when online)
- **Sharing**: Not shared with third parties
- **Retention**: 
  - Local: Cleared when test is submitted or app is uninstalled
  - Server: Stored in Supabase until end of semester (for score justification purposes), then deleted

**User Control**:
- Permission is requested on first test attempt
- Users can deny permission, but offline functionality will be limited
- Permission can be revoked at any time through device settings
- App uses scoped storage on Android 11+ (more secure, no broad access)

**Technical Details**:
- On Android 11+, the app uses scoped storage (no permission needed)
- On Android 10 and below, permission is required for backward compatibility
- All data is stored in app-specific directories
- No access to user's personal media files (photos, videos, documents)

---

### 3. `RECEIVE_BOOT_COMPLETED`

**Permission Type**: Normal Permission  
**Required for**: Background notification system

**Justification**:
- The app includes a notification system to alert students about new tests and retests
- This permission allows the app to restart background services after device reboot
- Ensures notifications continue to work after device restarts
- Critical for timely delivery of test notifications
- Students rely on notifications to know when new tests are available

**Data Safety Declaration**:
- **Data Type**: None (permission only, no data collection)
- **Purpose**: Enable background notification service after device reboot
- **Collection**: No data collection associated with this permission
- **Storage**: N/A
- **Sharing**: N/A
- **Retention**: N/A

**User Control**:
- This is a normal permission (automatically granted)
- Users can disable notifications through app settings
- Background fetch can be disabled in device battery optimization settings

**Technical Details**:
- Used by `react-native-background-fetch` library
- Allows background task to restart after device reboot
- Only activates if notifications are enabled in app settings
- Respects device battery optimization settings

---

### 4. `VIBRATE`

**Permission Type**: Normal Permission  
**Required for**: Notification feedback

**Justification**:
- Provides haptic feedback when notifications are received
- Enhances user experience by alerting students to important notifications
- Standard Android notification behavior
- Helps students notice test notifications even when device is on silent mode

**Data Safety Declaration**:
- **Data Type**: None (permission only, no data collection)
- **Purpose**: Haptic feedback for notifications
- **Collection**: No data collection associated with this permission
- **Storage**: N/A
- **Sharing**: N/A
- **Retention**: N/A

**User Control**:
- This is a normal permission (automatically granted)
- Users can disable vibration through device settings
- App respects device "Do Not Disturb" settings

**Technical Details**:
- Used by `expo-notifications` library
- Only vibrates when notifications are received
- Respects device vibration settings
- No data access or collection

---

## Quick Reference

Here's what each permission does:

- **Microphone** - Lets students record their voice for speaking tests. We only record during the test, then upload it to the server.
- **Storage (Read/Write)** - Saves test progress so students can finish tests even if their internet cuts out. Everything syncs back when they're online.
- **Boot Completed** - Keeps notifications working after the phone restarts, so students don't miss test alerts.
- **Vibrate** - Makes the phone vibrate when test notifications arrive, so students notice them even on silent mode.

---

## Privacy & Security

### Data Protection
- All permissions are used exclusively for educational purposes
- No data is collected for advertising or commercial purposes
- No data is shared with third parties
- All data transmission is encrypted (HTTPS)
- Local data is stored in app-specific directories
- Server data is stored in Supabase (secure cloud database)
- Data retention: Stored in Supabase until end of semester (for score justification purposes), then automatically deleted

### User Control
- Users can revoke permissions at any time through device settings
- App gracefully handles permission denial
- Clear explanations provided when permissions are requested
- Users can disable features that require permissions

### Compliance
- Complies with COPPA (Children's Online Privacy Protection Act)
- Complies with PDPA (Thailand's Personal Data Protection Act, B.E. 2562)
- Follows Google Play's Families Policy
- Educational data privacy standards

---

## Google Play Console Data Safety Form

### Data Collection
- **Personal Information**: Student ID, name, class, grade (for authentication)
- **App Activity**: Test answers, scores, progress (for academic assessment)
- **Audio**: Speaking test recordings (for academic assessment)
- **Device or Other IDs**: None

### Data Sharing
- **Shared with Third Parties**: No
- **Data Encryption**: Yes (in transit via HTTPS, at rest in Supabase)
- **Data Storage**: Supabase cloud database
- **Data Retention**: Stored until end of semester (for score justification purposes), then automatically deleted
- **Data Deletion**: Users can request deletion via contact email (aleksandr.p@mws.ac.th)

### Permissions Justification
This document serves as the justification for all requested permissions. Each permission is:
1. **Necessary**: Required for core app functionality
2. **Minimal**: Only requested when needed
3. **Educational**: Used exclusively for educational purposes
4. **Secure**: Data is protected and encrypted
5. **User-Controlled**: Users can revoke permissions at any time

---

## Contact

For questions about permissions or data usage:
- Email: aleksandr.p@mws.ac.th
- Website: https://mathayomwatsing.netlify.app

---

## Last Updated
Novemner 9th 2025


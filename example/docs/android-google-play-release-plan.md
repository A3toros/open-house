# Android Google Play Release Plan (Code & Configuration Tasks)

## Overview
This document outlines the **code and configuration tasks** required to prepare the MWS Student App for release on Google Play Store. Manual tasks (testing, Google Play Console setup, asset creation) are excluded.

---

## Phase 1: App Configuration

### 1.1 Version Management
- [x] App version set in `app.json`: `1.0.0` ✓
- [x] **Add `versionCode` to `app.json`** ✓
  - [x] Added `android.versionCode: 1` to `app.json` ✓
  - [x] Documented version code increment process (see below) ✓

**Version Code Management:**
- **Current**: `versionCode: 1` (initial release)
- **Increment Rule**: Always increment `versionCode` for each new release to Google Play
- **Version Name**: `version: "1.0.0"` (semantic versioning - can stay same for patches)
- **Important**: `versionCode` must be higher than previous release (Google Play requirement)
- **Example**: 
  - Release 1: `versionCode: 1`, `version: "1.0.0"`
  - Release 2: `versionCode: 2`, `version: "1.0.1"` (patch)
  - Release 3: `versionCode: 3`, `version: "1.1.0"` (minor update)
  - Release 4: `versionCode: 4`, `version: "2.0.0"` (major update)

- [ ] **App Identity** (Already configured)
  - [x] Package name: `com.mathayomwatsing.student` ✓
  - [x] App name: "MWS Student" ✓
  - [x] App icon configured ✓
  - [x] Splash screen configured ✓

### 1.2 Production Build Configuration
- [ ] **Create EAS Build Configuration**
  - [ ] Create `eas.json` file with production build profile
  - [ ] Configure Android build settings
  - [ ] Set up app signing (Play App Signing recommended)

- [ ] **Environment Configuration**
  - [x] API base URL configured: `https://mathayomwatsing.netlify.app` ✓
  - [ ] Verify no hardcoded secrets or API keys
  - [ ] Ensure production API endpoints are correct

### 1.3 Code Cleanup for Production
- [ ] **Debug Logging**
  - [ ] Review and conditionally disable debug logs in production
  - [ ] Update `useAntiCheatingDetection` hook to respect `__DEV__` flag
  - [ ] Update `notificationService` to use conditional logging
  - [ ] Update `termsOfServiceService` to use conditional logging
  - [ ] Keep error logs (important for debugging production issues)
  - [ ] Remove or guard console.log statements that expose sensitive data

- [ ] **Security Review**
  - [ ] Scan for hardcoded API keys or secrets
  - [ ] Verify authentication tokens are stored securely (using SecureStore)
  - [ ] Verify no sensitive data in logs
  - [ ] Check for exposed debug endpoints or functions

### 1.4 Permissions Documentation
- [x] **Permissions Configured** ✓
  - [x] `RECORD_AUDIO` / `MICROPHONE`: For speaking tests ✓
  - [x] `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`: For test data storage ✓
  - [x] `RECEIVE_BOOT_COMPLETED`: For background notifications ✓
  - [x] `VIBRATE`: For notification feedback ✓

- [x] **Create Permissions Justification Document** ✓
  - [x] Created `docs/android-permissions-justification.md` ✓
  - [x] Documented each permission with use case ✓
  - [x] Included Data Safety form information ✓
  - **Status**: Complete - Ready for Google Play Console Data Safety form

### 1.5 Legal & Compliance (Already Implemented)
- [x] **Privacy & Terms** ✓
  - [x] Privacy Policy hosted at: `https://mathayomwatsing.netlify.app/privacy` ✓
  - [x] Terms of Service implemented in app ✓
  - [x] ToS acceptance flow working ✓
  - [x] Privacy Policy includes COPPA, PDPA compliance ✓
  - [x] Privacy Policy link accessible in app ✓

---

## Phase 2: Production Code Cleanup

### 2.1 Debug Logging Cleanup
- [ ] **Update `useAntiCheatingDetection` hook**
  - [x] Already uses `debug = __DEV__` flag ✓
  - [x] Uses `debugRef` to prevent dependency loops ✓
  - [ ] Verify all debug logs are conditional on `debugRef.current`
  - [ ] Ensure no sensitive data in debug logs

- [ ] **Update `notificationService.ts`**
  - [ ] Wrap console.log statements with `__DEV__` check
  - [ ] Keep error logs (console.error) for production debugging
  - [ ] Remove or conditionally log sensitive data (student IDs, etc.)

- [ ] **Update `termsOfServiceService.ts`**
  - [ ] Wrap console.log with `__DEV__` check
  - [ ] Keep error logs for production

- [ ] **Review other services**
  - [ ] Check `apiClient.ts` for debug logs
  - [ ] Check other service files for console.log statements
  - [ ] Ensure error logs remain for production debugging

### 2.2 Security Hardening
- [x] **Scan for Hardcoded Secrets** ✓
  - [x] Searched codebase for API keys, tokens, passwords ✓
  - [x] Verified all secrets use environment variables or SecureStore ✓
  - [x] Checked for exposed credentials in comments ✓
  - **Result**: No hardcoded secrets found. See `docs/android-security-audit-report.md` for details.

- [x] **Authentication Security** ✓
  - [x] Tokens stored in SecureStore (via SecureToken utility) ✓
  - [x] Refresh tokens stored in SecureStore (via SecureRefreshToken utility) ✓
  - [x] Verified JWT tokens are not logged ✓
  - [x] Ensured no token exposure in error messages ✓
  - **Status**: All tokens (access and refresh) now use SecureStore with hash verification

- [x] **Data Protection** ✓
  - [x] Verified no sensitive student data in logs ✓
  - [x] Checked that error messages don't expose sensitive info ✓
  - [x] Ensured test answers are not logged ✓
  - **Result**: All checks passed. See `docs/android-security-audit-report.md` for details.

### 2.3 Build Configuration
- [ ] **Create `eas.json` for EAS Build**
  ```json
  {
    "build": {
      "production": {
        "android": {
          "buildType": "app-bundle",
          "gradleCommand": ":app:bundleRelease"
        }
      }
    }
  }
  ```

- [x] **Update `app.json` for Production** ✓
  - [x] Added `android.versionCode: 1` ✓
  - [x] Verified `version: "1.0.0"` is correct ✓
  - [x] All required fields are present ✓

---

## Phase 3: Documentation

### 3.1 Permissions Justification
- [ ] **Create `docs/android-permissions-justification.md`**
  - [ ] Document `RECORD_AUDIO` / `MICROPHONE`: For speaking tests
  - [ ] Document `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`: For test data storage
  - [ ] Document `RECEIVE_BOOT_COMPLETED`: For background notifications
  - [ ] Document `VIBRATE`: For notification feedback
  - [ ] This document will be used when filling out Google Play Console Data Safety form

### 3.2 Build Instructions
- [ ] **Create `docs/android-build-instructions.md`**
  - [ ] Document EAS build process
  - [ ] Document version code increment process
  - [ ] Document app signing setup
  - [ ] Document production build commands

---

## Phase 4: Final Verification

### 4.1 Code Review Checklist
- [x] **Configuration** ✓
  - [x] `app.json` has all required fields ✓
  - [x] `android.versionCode` is set (value: 1) ✓
  - [x] Package name is correct ✓
  - [x] Version is set ✓

- [ ] **Code Quality**
  - [ ] Debug logs are conditional on `__DEV__`
  - [ ] No hardcoded secrets
  - [ ] Error handling is robust
  - [ ] No sensitive data in logs

- [ ] **Legal Compliance**
  - [x] Privacy Policy URL accessible ✓
  - [x] Terms of Service implemented ✓
  - [x] Privacy Policy includes required sections ✓

### 4.2 Build Readiness
- [ ] **Pre-Build Checklist**
  - [ ] All code changes committed
  - [ ] `eas.json` created and configured
  - [x] `app.json` has `versionCode` ✓
  - [ ] Debug logs are production-safe
  - [x] No hardcoded secrets ✓
  - [x] Permissions documented ✓

---

## Completed Tasks ✓

### Already Implemented
- [x] App version: `1.0.0` in `app.json` ✓
- [x] Package name: `com.mathayomwatsing.student` ✓
- [x] App name: "MWS Student" ✓
- [x] App icon configured ✓
- [x] Splash screen configured ✓
- [x] Privacy Policy hosted at public URL ✓
- [x] Terms of Service implemented ✓
- [x] ToS acceptance flow working ✓
- [x] Privacy Policy includes COPPA, PDPA compliance ✓
- [x] All Android permissions configured ✓
- [x] API base URL configured ✓
- [x] Anti-cheating hook uses `__DEV__` flag ✓

---

## Remaining Tasks

### High Priority
1. Add `android.versionCode` to `app.json`
2. Create `eas.json` for production builds
3. Update debug logging in `notificationService.ts` and `termsOfServiceService.ts`
4. Create permissions justification document
5. ~~Scan for hardcoded secrets~~ ✅ **COMPLETED** - See `docs/android-security-audit-report.md`

### Medium Priority
1. Create build instructions document
2. Review all console.log statements
3. ~~Verify error handling doesn't expose sensitive data~~ ✅ **COMPLETED** - See `docs/android-security-audit-report.md`

---

## Manual Tasks (Not in this plan)
These tasks must be done manually in Google Play Console:
- Developer account setup
- App creation in Play Console
- Store listing (descriptions, screenshots, graphics)
- Data Safety form completion
- Content rating questionnaire
- Build upload and submission
- Review process monitoring

---

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console](https://play.google.com/console)
- [App Signing Best Practices](https://developer.android.com/studio/publish/app-signing)
- [Data Safety Section Guide](https://support.google.com/googleplay/android-developer/answer/10787469)

---

## Contact

For questions or issues:
- Email: `aleksandr.p@mws.ac.th`
- Website: `https://mathayomwatsing.netlify.app`


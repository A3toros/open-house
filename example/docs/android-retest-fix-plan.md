# Android App Retest Fix Plan

## Problem Statement

Currently, retest logic is scattered across multiple test index files in the Android app, causing:
- Inconsistent retest handling across test types
- Incorrect database writes (missing `test_attempts.attempt_number`, incorrect `retest_targets` updates)
- Duplicate code that's hard to maintain
- Broken retest completion tracking

## Current State Analysis

### ✅ What's Already Working

1. **Retest Assignment ID Passing** (All 8 test types):
   - All test index files already get `retest_assignment_id` from AsyncStorage
   - All test submissions include `retest_assignment_id` in payload
   - Files: `app/tests/*/[testId]/index.tsx` (all 8 test types)
   - Helper: `src/utils/retestUtils.ts::getRetestAssignmentId()`

2. **Retest Key Management**:
   - `processRetestAvailability()` - Sets retest keys from API flags
   - `startRetest()` - Prepares retest before navigation
   - `clearRetestKeys()` - Cleans up after submission
   - Helper: `src/utils/retestUtils.ts`

3. **API Integration**:
   - Tests already submit to correct endpoints (e.g., `/api/submit-multiple-choice-test`)
   - `retest_assignment_id` is included in submission payload

### ❌ What's Broken

1. **AsyncStorage Attempt Tracking** (`src/utils/retestUtils.ts::handleRetestCompletion()`):
   - **Lines 169-255**: Tracks attempts in AsyncStorage (`retest_attempt1_`, `retest_attempt2_`, etc.)
   - **Lines 217-225**: Manually counts attempts from AsyncStorage
   - **Lines 228-229**: Manually calculates if attempts exhausted
   - **Problem**: Backend should be the single source of truth, not AsyncStorage

2. **Missing Backend Dependency**:
   - No verification that backend writes to `test_attempts.attempt_number`
   - No verification that backend updates `retest_targets` correctly
   - Completion logic is duplicated in frontend instead of relying on backend

3. **Inconsistent Completion Logic**:
   - Frontend calculates completion based on AsyncStorage
   - Should use API `retest_is_completed` flag instead

### 📝 Note: Separate Retest System

**Files to IGNORE** (different feature):
- `src/services/retestService.ts` - For student-requested retests (different API: `/api/retests`)
- `src/components/RetestSystem.tsx` - UI for student-requested retests
- These are for a different retest feature and should NOT be modified

## Summary: What Needs to Be Fixed

**Single File to Fix**: `src/utils/retestUtils.ts`
- **Function 1**: `startRetest()` (lines 104-163) - Needs to clear original test completion key
- **Function 2**: `handleRetestCompletion()` (lines 169-255) - Tracks attempts in AsyncStorage instead of relying on backend
- **Solution**: 
  - Update `startRetest()` to clear completion key when starting retest
  - Remove all AsyncStorage attempt tracking from `handleRetestCompletion()`, rely on backend `retest_targets.is_completed` flag

**Key Changes**:
1. Remove AsyncStorage attempt keys (`retest_attempt1_`, `retest_attempt2_`, etc.)
2. Remove manual attempt counting
3. Remove manual completion calculation
4. **Keep completion key** (`test_completed_*`) - **MUST be set immediately after submission** to prevent duplicate starts
5. **Clear completion key** when starting retest (in `startRetest()` function)
6. Backend writes to `test_attempts.attempt_number` and updates `retest_targets`
7. API refresh will confirm completion status (if retest still has attempts, API will clear the key)

**Test Files**: Already correct ✅
- All test files already pass `retest_assignment_id` correctly
- All test files use `getRetestAssignmentId()` and `markTestCompleted()`
- No changes needed to test index files

## Solution Overview

1. **Fix existing `handleRetestCompletion()` function** in `retestUtils.ts` (remove AsyncStorage attempt tracking)
2. **Verify test files** are already correct (they are ✅)
3. **Ensure backend writes correctly** to `test_attempts.attempt_number` and `retest_targets` (verify, not fix)
4. **Update UI components** to use API `retest_is_completed` flag (if not already)

---

## Phase 1: Fix Existing Retest Helper

### File: `MWSExpo/src/utils/retestUtils.ts` (MODIFY)

**Current State**: File already exists with helper functions, but two functions need updates:
1. `startRetest()` - Needs to clear original test completion key
2. `handleRetestCompletion()` - Has broken logic (AsyncStorage attempt tracking)

**Functions to Keep** (already working):
- ✅ `getRetestAssignmentId()` - Gets retest_assignment_id from AsyncStorage
- ✅ `processRetestAvailability()` - Sets retest keys from API flags
- ✅ `startRetest()` - Prepares retest before navigation (**NEEDS UPDATE**: Clear original test completion key)
- ✅ `clearRetestKeys()` - Cleans up after submission
- ✅ `markTestCompleted()` - Marks test as completed

**Functions to FIX**:

#### 1. `startRetest()` (UPDATE lines 104-163)

**Current Issue**: Does not clear original test completion key when starting retest.

**Required Change**: Clear the completion key of the original test when starting a retest.

```typescript
export async function startRetest(
  studentId: string,
  test: {
    test_id: number;
    test_type: string;
    retest_available?: boolean;
    retest_is_completed?: boolean;
    retest_assignment_id?: number;
  }
): Promise<void> {
  // Only start retest if available and not completed (from API)
  if (!test.retest_available || test.retest_is_completed) {
    console.log('🎓 Retest not available or completed - skipping startRetest');
    return;
  }

  const testIdStr = String(test.test_id);
  const retestKey = `retest1_${studentId}_${test.test_type}_${testIdStr}`;

  // Set retest key BEFORE navigation
  await AsyncStorage.setItem(retestKey, 'true');
  console.log('🎓 Set retest key:', retestKey);

  // ⚠️ IMPORTANT: Clear completion key of original test when starting retest
  // This allows student to take retest even if original test was completed
  const completionKey = `test_completed_${studentId}_${test.test_type}_${testIdStr}`;
  await AsyncStorage.removeItem(completionKey);
  console.log('🎓 Cleared original test completion key for retest:', completionKey);

  // Store retest_assignment_id for submission (web app pattern)
  if (test.retest_assignment_id) {
    const retestAssignKey = `retest_assignment_id_${studentId}_${test.test_type}_${testIdStr}`;
    await AsyncStorage.setItem(retestAssignKey, test.retest_assignment_id.toString());
    console.log('🎓 Set retest assignment ID:', retestAssignKey, '=', test.retest_assignment_id);
  }

  // Clear per-test cached data (web app pattern)
  // ... rest of function remains the same
}
```

**Key Change**:
- ✅ **ADD**: Clear `test_completed_*` key when starting retest (after line 125)
- This allows student to take retest even if original test was marked as completed

---

#### 2. `handleRetestCompletion()` (REPLACE lines 169-255)

**CRITICAL**: This function should NOT track attempts in AsyncStorage. The backend is the single source of truth.

**Current Broken Code** (lines 169-255):
- ❌ Tracks attempts in AsyncStorage (`retest_attempt1_`, `retest_attempt2_`, etc.)
- ❌ Manually counts attempts (lines 217-225)
- ❌ Manually calculates completion (lines 228-229)
- ❌ Sets completion based on frontend logic instead of backend

**Fixed Implementation**:

```typescript
/**
 * Handle retest completion after submission - backend is authoritative
 * (REPLACES lines 169-255 in retestUtils.ts)
 */
export async function handleRetestCompletion(
  studentId: string,
  testType: string,
  testId: string | number,
  submissionResult: {
    success: boolean;
    percentage?: number;
    percentage_score?: number;
  }
): Promise<void> {
  const testIdStr = Array.isArray(testId) ? testId[0] : String(testId || '');
  
  // Check if this is a retest
  const retestAssignKey = `retest_assignment_id_${studentId}_${testType}_${testIdStr}`;
  const retestAssignmentId = await AsyncStorage.getItem(retestAssignKey);
  const isRetest = !!retestAssignmentId;
  
  if (!isRetest) {
    // Regular test - mark as completed
    const completionKey = `test_completed_${studentId}_${testType}_${testIdStr}`;
    await AsyncStorage.setItem(completionKey, 'true');
    console.log('🎓 Marked regular test as completed:', completionKey);
    return;
  }
  
  // ⚠️ CRITICAL: Do NOT track attempts in AsyncStorage
  // Backend handles all attempt tracking in retest_targets table
  // Backend writes to test_attempts.attempt_number
  // Backend updates retest_targets.attempt_number, attempt_count, is_completed
  
  // ⚠️ IMPORTANT: Mark retest as completed locally immediately to prevent duplicate starts
  // This is a temporary measure until API refresh returns retest_is_completed = true
  // The completion key prevents students from starting retest again while waiting for API
  const completionKey = `test_completed_${studentId}_${testType}_${testIdStr}`;
  
  if (submissionResult.success) {
    // Set completion key immediately (prevents duplicate starts while waiting for API)
    // This is cleared/overridden on next API refresh when backend returns retest_is_completed = true
    await AsyncStorage.setItem(completionKey, 'true');
    console.log('🎓 Marked retest as completed locally (prevents duplicate starts until API refresh):', completionKey);
    
    // ⚠️ REMOVED: All AsyncStorage attempt tracking (retest_attempt1_, retest_attempt2_, etc.)
    // ⚠️ REMOVED: Manual attempt counting
    // ⚠️ REMOVED: Manual completion calculation based on attempts
    // Backend will return retest_is_completed flag on next API call
    // If backend says retest is NOT completed (e.g., more attempts available), API refresh will clear this key
  }
}
```

**Key Changes**:
- ❌ **REMOVE**: Lines 192-255 (all AsyncStorage attempt tracking)
- ❌ **REMOVE**: `retest_attempt1_`, `retest_attempt2_`, etc. keys
- ❌ **REMOVE**: Manual attempt counting loop (lines 217-225)
- ❌ **REMOVE**: Manual completion calculation (lines 228-229)
- ❌ **REMOVE**: `retest_attempts_` metadata key
- ✅ **KEEP**: Completion key (`test_completed_*`) - **MUST be set immediately after submission**
- ✅ **IMPORTANT**: Mark retest as completed locally to prevent duplicate starts while waiting for API
- ✅ **ADD**: Clear comments explaining backend is authoritative but local key prevents duplicate starts

---

## Phase 2: Update Test Submission Functions

### Files to Modify (All Test Index Files)

**Current State**: All test files already pass `retest_assignment_id` correctly ✅

**Files to Update** (remove calls to broken `handleRetestCompletion`):
1. `app/tests/multiple-choice/[testId]/index.tsx` (line ~399)
2. `app/tests/true-false/[testId]/index.tsx`
3. `app/tests/input/[testId]/index.tsx`
4. `app/tests/matching/[testId]/index.tsx`
5. `app/tests/word-matching/[testId]/index.tsx`
6. `app/tests/drawing/[testId]/index.tsx`
7. `app/tests/fill-blanks/[testId]/index.tsx`
8. `app/tests/speaking/[testId]/index.tsx` (or `src/components/test/SpeakingTestStudent.tsx`)

### Pattern for All Test Submissions

**CURRENT** (already correct for retest_assignment_id):
```typescript
// ✅ KEEP: This is already correct
import { getRetestAssignmentId, markTestCompleted } from '../../utils/retestUtils';

// Get retest_assignment_id from AsyncStorage
const retestAssignmentId = await getRetestAssignmentId(studentId, testType, testId);

// Include in submission payload
const submissionData = {
  // ... test data
  retest_assignment_id: retestAssignmentId,
  parent_test_id: testId
};

// Submit test
const response = await api.post('/api/submit-*-test', submissionData);

if (response.data.success) {
  // ✅ KEEP: Mark test as completed (sets temporary completion key)
  await markTestCompleted(studentId, testType, testId);
}
```

**REMOVE** (if present):
```typescript
// ❌ REMOVE: Any calls to handleRetestCompletion with attempt tracking
// ❌ REMOVE: Any AsyncStorage attempt tracking
// ❌ REMOVE: Any manual completion calculation
```

**Note**: 
- `markTestCompleted()` already exists and sets the completion key ✅
- The fixed `handleRetestCompletion()` should also set the completion key for retests
- **IMPORTANT**: Both regular tests and retests must set completion key immediately after submission
- This prevents students from starting the test/retest again while waiting for API refresh
- API refresh will confirm the actual completion status from backend

---

## Phase 3: Backend Requirements (Verify)

### Critical Backend Operations

The backend MUST handle these operations correctly (verify against web app functions):

#### 1. Write to `test_attempts` Table

**Column**: `attempt_number` (INTEGER) - **CRITICAL**

```sql
INSERT INTO test_attempts (
  student_id,
  test_id,
  attempt_number,  -- ⚠️ MUST BE SET CORRECTLY
  retest_assignment_id,
  score,
  max_score,
  percentage,
  time_taken,
  started_at,
  submitted_at,
  is_completed,
  answers,
  caught_cheating,
  visibility_change_times,
  test_name,
  teacher_id,
  subject_id,
  grade,
  class,
  academic_period_id
) VALUES (...)
```

**Reference**: `docs/retest-recording-and-filtering-analysis.md` lines 181-191

#### 2. Update `retest_targets` Table

**Columns to Update**:
- `attempt_number` (INTEGER) - Current attempt number
- `attempt_count` (INTEGER) - **MUST MATCH attempt_number** (for backwards compatibility)
- `is_completed` (BOOLEAN) - TRUE if exhausted OR passed
- `passed` (BOOLEAN) - TRUE if percentage >= passing_threshold
- `completed_at` (TIMESTAMP) - Set when completed
- `status` (VARCHAR) - 'PASSED', 'FAILED', or 'IN_PROGRESS'
- `last_attempt_at` (TIMESTAMP) - Updated on each attempt

**Completion Logic**:
```sql
UPDATE retest_targets
SET 
  attempt_number = ${nextAttemptNumber},
  attempt_count = ${nextAttemptNumber},  -- ⚠️ MUST MATCH attempt_number
  last_attempt_at = NOW(),
  passed = ${passed},
  is_completed = ${shouldComplete},
  completed_at = CASE
    WHEN ${shouldComplete} AND completed_at IS NULL THEN NOW()
    ELSE completed_at
  END,
  status = CASE
    WHEN ${passed} THEN 'PASSED'
    WHEN ${attemptsExhausted} THEN 'FAILED'
    ELSE 'IN_PROGRESS'
  END,
  updated_at = NOW()
WHERE retest_assignment_id = ${retest_assignment_id}
  AND student_id = ${studentId}
```

**Reference**: `docs/retest-recording-and-filtering-analysis.md` lines 193-214

**Completion Decision Logic**:
- If student **passed** (`percentage >= passing_threshold`):
  - `attempt_number = max_attempts` (jump to max)
  - `passed = TRUE`
  - `is_completed = TRUE`
- If student **failed**:
  - `attempt_number = current_attempt_number + 1`
  - `passed = FALSE`
  - `is_completed = TRUE` if `attempt_number >= max_attempts`, else `FALSE`

**Reference**: `docs/retest-recording-and-filtering-analysis.md` lines 216-224

---

## Phase 3: Remove Retest Logic from Test Files

### Files to Clean Up

**Primary File**: `src/utils/retestUtils.ts`
- **Lines 104-163**: Update `startRetest()` to clear original test completion key (see Phase 1)
- **Lines 169-255**: Replace `handleRetestCompletion()` with fixed version (see Phase 1)

**Test Index Files** (verify no duplicate logic):
1. `app/tests/multiple-choice/[testId]/index.tsx` - Verify only uses `getRetestAssignmentId()` and `markTestCompleted()`
2. `app/tests/true-false/[testId]/index.tsx` - Same
3. `app/tests/input/[testId]/index.tsx` - Same
4. `app/tests/matching/[testId]/index.tsx` - Same
5. `app/tests/word-matching/[testId]/index.tsx` - Same
6. `app/tests/drawing/[testId]/index.tsx` - Same
7. `app/tests/fill-blanks/[testId]/index.tsx` - Same
8. `app/tests/speaking/[testId]/index.tsx` or `src/components/test/SpeakingTestStudent.tsx` - Same

### Search Patterns to Find and Remove

**In `retestUtils.ts` (lines 169-255)**:
```typescript
// ❌ REMOVE: Pattern 1 - AsyncStorage attempt tracking
const lastSlotKey = `retest_attempt${maxAttempts}_${studentId}_${testType}_${testIdStr}`;
await AsyncStorage.setItem(lastSlotKey, 'true');

// ❌ REMOVE: Pattern 2 - Finding next attempt slot
let attemptNumber = 1;
for (let i = 1; i <= maxAttempts; i++) {
  const attemptKey = `retest_attempt${i}_${studentId}_${testType}_${testIdStr}`;
  const attemptExists = await AsyncStorage.getItem(attemptKey);
  if (!attemptExists) {
    attemptNumber = i;
    break;
  }
}

// ❌ REMOVE: Pattern 3 - Manual attempt counting
let usedAttempts = 0;
for (let i = 1; i <= 10; i++) {
  const attemptKey = `retest_attempt${i}_${studentId}_${testType}_${testIdStr}`;
  const attemptExists = await AsyncStorage.getItem(attemptKey);
  if (attemptExists === 'true') {
    usedAttempts++;
  }
}

// ❌ REMOVE: Pattern 4 - Manual completion calculation
const attemptsLeft = maxAttempts - usedAttempts;
const shouldComplete = attemptsLeft <= 0 || passedNow;

// ❌ REMOVE: Pattern 5 - Retest attempts metadata
const attemptsMetaKey = `retest_attempts_${studentId}_${testType}_${testIdStr}`;
await AsyncStorage.setItem(attemptsMetaKey, JSON.stringify({ used: usedAttempts, max: maxAttempts }));
```

**In Test Index Files** (should NOT exist, but verify):
- Any direct AsyncStorage attempt tracking
- Any manual attempt counting
- Any calls to `handleRetestCompletion()` with attempt parameters

---

## Phase 4: Handle API Refresh for Completion Keys

### File: `MWSExpo/src/utils/retestUtils.ts` or `MWSExpo/app/(tabs)/index.tsx`

**IMPORTANT**: When API returns active tests, handle completion keys based on API flags:

```typescript
// After fetching active tests from API
for (const test of activeTests) {
  const completionKey = `test_completed_${studentId}_${test.test_type}_${test.test_id}`;
  
  if (test.retest_is_completed) {
    // Backend confirms retest is completed - keep completion key
    await AsyncStorage.setItem(completionKey, 'true');
  } else if (test.retest_available && !test.retest_is_completed) {
    // Retest available and NOT completed (more attempts available) - clear completion key
    await AsyncStorage.removeItem(completionKey);
    console.log('🎓 Cleared completion key - retest has more attempts available:', completionKey);
  }
  // If retest not available, keep completion key (regular test completed)
}
```

**Logic**:
- If `retest_is_completed = true`: Keep/Set completion key (retest is done)
- If `retest_available = true` AND `retest_is_completed = false`: Clear completion key (more attempts available)
- If `retest_available = false`: Keep completion key (regular test, no retest)

---

## Phase 5: Update UI Components

### File: `MWSExpo/src/components/dashboard/ActiveTestsView.tsx`

**Changes**:
1. **Remove AsyncStorage-based filtering** - Use API `retest_is_completed` flag
2. **Update button logic** - Use API flags instead of localStorage checks

**BEFORE**:
```typescript
// ❌ REMOVE: AsyncStorage-based retest completion check
const completionKey = `test_completed_${studentId}_${testType}_${testId}`;
const isCompleted = await AsyncStorage.getItem(completionKey) === 'true';

// ❌ REMOVE: Manual attempt counting
let attemptsUsed = 0;
for (let i = 1; i <= 10; i++) {
  const key = `retest_attempt${i}_${studentId}_${testType}_${testId}`;
  if (await AsyncStorage.getItem(key) === 'true') {
    attemptsUsed++;
  }
}
const attemptsLeft = maxAttempts - attemptsUsed;
```

**AFTER**:
```typescript
// ✅ USE: API flags
if (test.retest_is_completed) {
  return <Button disabled>✓ Completed</Button>;
}

if (test.retest_available && !test.retest_is_completed) {
  const attemptsLeft = test.retest_attempts_left || 0;
  if (attemptsLeft > 0) {
    return <Button onClick={() => startTest(test)}>Start Retest</Button>;
  }
}
```

### File: `MWSExpo/app/(tabs)/index.tsx`

**Changes**:
1. **Filter completed retests** using API flag
2. **Remove AsyncStorage-based filtering**

**BEFORE**:
```typescript
// ❌ REMOVE: AsyncStorage-based filtering
const filteredTests = tests.filter(async (test) => {
  const completionKey = `test_completed_${studentId}_${test.test_type}_${test.test_id}`;
  const isCompleted = await AsyncStorage.getItem(completionKey) === 'true';
  if (isCompleted && !test.retest_available) {
    return false;
  }
  return true;
});
```

**AFTER**:
```typescript
// ✅ USE: API flags
const filteredTests = tests.filter(test => {
  // Filter out completed tests without retest
  if (test.is_completed && !test.retest_available) {
    return false;
  }
  
  // Filter out completed retests (from API)
  if (test.retest_is_completed) {
    return false;
  }
  
  return true;
});
```

---

## Phase 6: Verify Backend API Response

### Required API Fields

Ensure `get-student-active-tests` API returns these fields:

```typescript
interface ActiveTest {
  // ... existing fields
  retest_available: boolean;
  retest_is_completed: boolean;  // ⚠️ CRITICAL
  retest_passed: boolean;
  retest_attempt_number: number;
  retest_max_attempts: number;
  retest_attempts_left: number;
  retest_assignment_id: number | null;
}
```

**Reference**: `docs/retest-recording-and-filtering-analysis.md` lines 326-337

---

## Phase 7: Testing Checklist

### Database Writes Verification

- [ ] **`test_attempts.attempt_number`** is written correctly (1, 2, 3, etc.)
- [ ] **`retest_targets.attempt_number`** matches `test_attempts.attempt_number`
- [ ] **`retest_targets.attempt_count`** matches `attempt_number` (backwards compatibility)
- [ ] **`retest_targets.is_completed`** is set to `TRUE` when:
  - Student passes (`percentage >= passing_threshold`), OR
  - Attempts exhausted (`attempt_number >= max_attempts`)
- [ ] **`retest_targets.passed`** is set correctly based on percentage
- [ ] **`retest_targets.completed_at`** is set when `is_completed = TRUE`
- [ ] **`retest_targets.status`** is set correctly ('PASSED', 'FAILED', 'IN_PROGRESS')

### Early Pass Logic

- [ ] When student passes before exhausting attempts:
  - `attempt_number` jumps to `max_attempts`
  - `is_completed = TRUE`
  - `passed = TRUE`
  - `status = 'PASSED'`

### Filtering Verification

- [ ] Completed retests are filtered from active tests list
- [ ] API returns `retest_is_completed = true` for completed retests
- [ ] UI shows "Completed" button for completed retests
- [ ] UI shows "Start Retest" button only when `retest_available = true` AND `retest_is_completed = false`

### AsyncStorage Cleanup

- [ ] No `retest_attempt*` keys are created (removed all attempt tracking)
- [ ] `test_completed_` key is set immediately after submission (prevents duplicate starts)
- [ ] Completion key is set for retests (not just regular tests)
- [ ] **Completion key is cleared when starting retest** (allows retest to proceed)
- [ ] Completion key persists until API refresh confirms status
- [ ] If API returns `retest_is_completed = false` (more attempts available), key should be cleared

---

## Implementation Order

1. **Step 1**: Update `startRetest()` in `retestUtils.ts` to clear original test completion key
2. **Step 2**: Fix `handleRetestCompletion()` in `retestUtils.ts` (remove AsyncStorage attempt tracking)
3. **Step 3**: Verify test index files only use `getRetestAssignmentId()` and `markTestCompleted()` (no direct attempt tracking)
4. **Step 4**: Verify backend writes correctly (check database for `test_attempts.attempt_number` and `retest_targets` updates)
5. **Step 5**: Update UI components to use API `retest_is_completed` flag (if not already)
6. **Step 6**: Test all 8 test types end-to-end
7. **Step 7**: Verify no `retest_attempt*` keys are created in AsyncStorage
8. **Step 8**: Verify completion key is cleared when starting retest

---

## Key Principles

1. **Database is Single Source of Truth**: All retest state is in `retest_targets` table
2. **No AsyncStorage Attempt Tracking**: Only use temporary completion keys
3. **Backend Handles Logic**: Completion, attempt counting, and exhaustion logic is in backend
4. **API Flags for UI**: Use `retest_is_completed`, `retest_attempts_left` from API
5. **Consistent Pattern**: All 8 test types use the same helper function
6. **Immediate Local Completion**: Set completion key immediately after submission to prevent duplicate starts while waiting for API refresh
7. **Clear Completion on Retest Start**: Clear original test completion key when starting retest to allow retest to proceed
8. **API Confirms Status**: API refresh will confirm actual completion status; if retest has more attempts available, clear the completion key to allow retest to continue

---

## Related Documentation

- **Analysis Document**: `docs/retest-recording-and-filtering-analysis.md`
- **Web App Pattern**: `functions/submit-multiple-choice-test.js` (lines 200-358)
- **Database Schema**: `database/database_schema_migration.sql` (lines 666-677)
- **View Filtering**: `database/views/student_active_tests_view.sql`

---

## Notes

- The Android app should mirror the web app's backend interaction pattern
- All retest logic should be in the backend; frontend only prepares data and handles UI
- The `test_attempts.attempt_number` column is critical - ensure it's written correctly
- The `retest_targets.attempt_count` must match `attempt_number` for backwards compatibility


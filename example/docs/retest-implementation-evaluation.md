# Retest Implementation Evaluation
## API as Single Source of Truth - Complete Code Review

## Goals
1. **API is single source of truth** - Database tracks all retest state
2. **localStorage/AsyncStorage** - Only used temporarily to prevent duplicate starts before page refresh
3. **Mark retest as completed** - When attempts exhausted OR student passed
4. **If student passed** - Write `attempt_number = max_attempts` and mark as completed

---

## Backend Evaluation

### ✅ Current State

#### 1. Database Schema
- ✅ `retest_targets` table exists with `attempt_count`, `status`
- ✅ Migration SQL ready: adds `max_attempts`, `attempt_number`, `is_completed`, `completed_at`, `passed`
- ✅ All 8 test result tables have `retest_assignment_id` column

#### 2. Retest Creation (`functions/create-retest-assignment.js`)
**Current Issues:**
- ❌ Only sets basic fields in `retest_targets` (line 97-100)
- ❌ Missing: `max_attempts`, `attempt_number`, `is_completed`, `passed` initialization
- ❌ Only updates `speaking_test_results` with `retest_assignment_id` (line 110-113)
- ❌ Missing: Updates to other 7 test result tables

**Required Changes:**
```javascript
// Line 96-100: Update to include new columns
await sql`
  INSERT INTO retest_targets (
    retest_assignment_id, student_id,
    max_attempts, attempt_number, attempt_count,
    is_completed, passed, status
  )
  SELECT 
    ${retestId}, ${sid},
    ra.max_attempts, 0, 0,  -- Copy max_attempts, init attempt_number to 0
    FALSE, FALSE, 'PENDING'  -- Not completed, not passed
  FROM retest_assignments ra
  WHERE ra.id = ${retestId}
  ON CONFLICT (retest_assignment_id, student_id) DO NOTHING
`;

// After line 113: Add updates for ALL 8 test result tables
// (See plan Phase 2 for all 8 UPDATE statements)
```

#### 3. Test Submission Functions (All 8 Types)

**Current State:**
- ✅ All functions write to `test_attempts` for retests
- ✅ All functions update `retest_targets.attempt_count` and `status`
- ❌ **MISSING**: Update new columns (`attempt_number`, `is_completed`, `passed`, `completed_at`)
- ❌ **MISSING**: Write `retest_assignment_id` to original test results table

**Required Changes for ALL 8 submission functions:**

**Files to update:**
1. `functions/submit-multiple-choice-test.js` (lines 272-299)
2. `functions/submit-true-false-test.js` (lines 281-302)
3. `functions/submit-input-test.js` (lines 243-264)
4. `functions/submit-matching-type-test.js` (lines 197-256)
5. `functions/submit-word-matching-test.js` (lines 196-256)
6. `functions/submit-fill-blanks-test.js` (lines 251-272)
7. `functions/submit-drawing-test.js` (similar pattern)
8. `functions/submit-speaking-test-final.js` (lines 371-395)

**New Logic (replace existing retest_targets UPDATE):**

```javascript
// After calculating score and percentage
const percentage = Math.round((score / maxScore) * 100);
const passingThreshold = retestAssignment.passing_threshold || 50;
const passed = percentage >= passingThreshold;

// Determine next attempt number
const currentAttempt = retestTarget.attempt_number || 0;
let nextAttemptNumber;

if (passed) {
  // Early pass: jump to max_attempts slot
  nextAttemptNumber = retestTarget.max_attempts;
} else {
  // Increment attempt
  nextAttemptNumber = currentAttempt + 1;
}

// Check if retest should be marked as completed
const attemptsExhausted = nextAttemptNumber >= retestTarget.max_attempts;
const shouldComplete = attemptsExhausted || passed;

// Update retest_targets with ALL new columns
await sql`
  UPDATE retest_targets
  SET 
    attempt_number = ${nextAttemptNumber},
    attempt_count = ${nextAttemptNumber},  -- Keep in sync
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
  RETURNING *
`;

// CRITICAL: Also update original test results table with retest_assignment_id
await sql`
  UPDATE multiple_choice_test_results  -- Change table name per test type
  SET retest_assignment_id = ${retest_assignment_id}
  WHERE student_id = ${studentId} AND test_id = ${effectiveParentTestId}
  AND retest_assignment_id IS NULL  -- Only update if not already set
`;
```

#### 4. API Function (`functions/get-student-active-tests.js`)

**Current State:**
- ✅ Checks `isCompleted` from view's `result_id` (line 207)
- ✅ Filters completed tests without retest (line 210-212)
- ❌ **MISSING**: Check `retest_targets.is_completed` for retest completion

**Required Changes (lines 206-213):**

```javascript
// Check if test is completed (from results table)
const isCompleted = row.result_id !== null && row.result_id !== undefined;

// Check retest completion from retest_targets
let retestCompleted = false;
let retestPassed = false;
let retestAttemptNumber = 0;
let retestMaxAttempts = null;
let retestAttemptsLeft = null;

if (retestAvailable) {
  const retestTarget = await sql`
    SELECT is_completed, passed, attempt_number, max_attempts
    FROM retest_targets rt
    JOIN retest_assignments ra ON ra.id = rt.retest_assignment_id
    WHERE rt.student_id = ${student_id}
      AND ra.test_type = ${row.test_type}
      AND ra.test_id = ${row.test_id}
      AND NOW() BETWEEN ra.window_start AND ra.window_end
    LIMIT 1
  `;
  
  if (retestTarget.length > 0) {
    retestCompleted = retestTarget[0].is_completed;
    retestPassed = retestTarget[0].passed || false;
    retestAttemptNumber = retestTarget[0].attempt_number || 0;
    retestMaxAttempts = retestTarget[0].max_attempts;
    if (retestMaxAttempts != null) {
      retestAttemptsLeft = Math.max(0, retestMaxAttempts - retestAttemptNumber);
    }
  }
}

// Skip if completed AND (no retest OR retest completed)
if (isCompleted && (!retestAvailable || retestCompleted)) {
  console.log('Filtering out completed test:', row.test_type, row.test_id);
  continue;
}

// Include retest info in response
activeTests.push({
  // ... existing fields
  retest_available: retestAvailable && !retestCompleted,
  retest_attempts_left: retestAttemptsLeft,
  retest_is_completed: retestCompleted,  // NEW
  retest_passed: retestPassed,  // NEW
  retest_attempt_number: retestAttemptNumber,  // NEW
  retest_max_attempts: retestMaxAttempts  // NEW
});
```

---

## Frontend Evaluation

### Web App (`src/`)

#### 1. Test Submission (`src/student/StudentTests.jsx`)

**Current State (lines 848-938):**
- ❌ **PROBLEM**: Complex localStorage logic for retest attempts
- ❌ **PROBLEM**: Tracks attempts in localStorage (should be API only)
- ❌ **PROBLEM**: Sets completion keys based on localStorage calculations
- ✅ Sets completion key when retest completed (good for preventing duplicate starts)

**Required Changes:**

```javascript
// After successful submission (line 850)
if (result.success) {
  const studentId = user?.student_id || user?.id || '';
  const isRetest = !!localStorage.getItem(`retest_assignment_id_${studentId}_${currentTest.test_type}_${currentTest.test_id}`);
  
  if (isRetest) {
    // API is source of truth - backend already updated retest_targets
    // Only set localStorage completion key to prevent duplicate starts before refresh
    const completionKey = `test_completed_${studentId}_${currentTest.test_type}_${currentTest.test_id}`;
    localStorage.setItem(completionKey, 'true');
    logger.debug('🎓 Set completion key (temporary, until API refresh):', completionKey);
    
    // DON'T track attempts in localStorage - API handles this
    // DON'T calculate attempts - API returns this
  } else {
    // Regular test - mark as completed
    const completionKey = `test_completed_${studentId}_${currentTest.test_type}_${currentTest.test_id}`;
    localStorage.setItem(completionKey, 'true');
  }
}
```

**Remove:**
- Lines 860-938: All localStorage attempt tracking logic
- Lines 871-877: Attempt counting from localStorage
- Lines 885-931: Metadata setting based on localStorage

#### 2. Matching Test (`src/components/test/MatchingTestStudent.jsx`)

**Current State (lines 707-732):**
- ❌ Same issues as StudentTests.jsx
- ❌ Tracks attempts in localStorage

**Required Changes:**
- Remove localStorage attempt tracking
- Only set completion key temporarily

#### 3. Fill Blanks Test (`src/components/test/FillBlanksTestStudent.jsx`)

**Current State (lines 485-502):**
- ❌ Same issues
- ❌ Tracks attempts in localStorage

**Required Changes:**
- Remove localStorage attempt tracking
- Only set completion key temporarily

#### 4. Word Matching Test (`src/components/test/WordMatchingStudent.jsx`)

**Current State:**
- ❌ Similar pattern, needs same fix

#### 5. Student Cabinet (`src/student/StudentCabinet.jsx`)

**Current State:**
- ✅ Reads completion keys from localStorage
- ✅ Checks API `retest_available` flag
- ❌ **MISSING**: Check API `retest_is_completed` flag

**Required Changes (lines 900-936):**

```javascript
// Button logic - use API flags
if (test.retest_is_completed) {
  // API says retest is completed - show completed button
  return <Button disabled>✓ Completed</Button>;
}

if (test.retest_available && !test.retest_is_completed) {
  // API says retest available and not completed
  const attemptsLeft = test.retest_attempts_left || 0;
  if (attemptsLeft > 0) {
    return <Button onClick={() => startTest(test)}>Start Retest</Button>;
  }
}

// Regular completed test
if (test.is_completed) {
  return <Button disabled>✓ Completed</Button>;
}

// Regular test
return <Button onClick={() => startTest(test)}>Start Test</Button>;
```

**Remove:**
- Lines 901-925: localStorage metadata checking for retest attempts
- Use API `retest_is_completed`, `retest_attempts_left` directly

---

### Android App (`MWSExpo/`)

#### 1. Retest Utils (`MWSExpo/src/utils/retestUtils.ts`)

**Current State (`handleRetestCompletion` function, lines 206-292):**
- ❌ **PROBLEM**: Tracks attempts in AsyncStorage
- ❌ **PROBLEM**: Calculates completion based on AsyncStorage
- ✅ Sets completion key (good for preventing duplicate starts)

**Required Changes:**

```typescript
export async function handleRetestCompletion(
  studentId: string,
  testType: string,
  testId: string | number,
  maxAttempts: number,
  percentage: number,
  passed: boolean
): Promise<void> {
  const testIdStr = Array.isArray(testId) ? testId[0] : String(testId || '');
  
  // Check if this is a retest
  const retestAssignKey = `retest_assignment_id_${studentId}_${testType}_${testIdStr}`;
  const retestAssignmentId = await AsyncStorage.getItem(retestAssignKey);
  const isRetest = !!retestAssignmentId;
  
  if (!isRetest) {
    // Regular test - mark as completed (temporary, until API refresh)
    const completionKey = `test_completed_${studentId}_${testType}_${testIdStr}`;
    await AsyncStorage.setItem(completionKey, 'true');
    console.log('🎓 Marked regular test as completed (temporary):', completionKey);
    return;
  }
  
  // Retest submission - API is source of truth
  // Backend already updated retest_targets.is_completed
  // Only set completion key temporarily to prevent duplicate starts before refresh
  const completionKey = `test_completed_${studentId}_${testType}_${testIdStr}`;
  await AsyncStorage.setItem(completionKey, 'true');
  console.log('🎓 Set completion key (temporary, until API refresh):', completionKey);
  
  // DON'T track attempts in AsyncStorage - API handles this
  // DON'T calculate completion - API returns retest_is_completed
}
```

**Remove:**
- Lines 229-262: All attempt tracking logic
- Lines 254-291: Attempt counting and metadata setting

#### 2. Dashboard (`MWSExpo/app/(tabs)/index.tsx`)

**Current State:**
- ✅ Calls `processRetestAvailability` (line 277)
- ❌ **MISSING**: Uses API `retest_is_completed` flag

**Required Changes:**
- Filter based on API `retest_is_completed` flag
- Don't rely on localStorage metadata

#### 3. Active Tests View (`MWSExpo/src/components/dashboard/ActiveTestsView.tsx`)

**Current State (lines 113-142):**
- ❌ Filters based on localStorage metadata
- ❌ Checks `retestAttempts` from AsyncStorage

**Required Changes:**

```typescript
.filter(test => {
  // Filter out completed tests without retest (from API)
  if (test.is_completed && !test.retest_available) {
    return false;
  }
  
  // Filter out completed retests (from API)
  if (test.retest_is_completed) {
    return false;
  }
  
  return true;
})
```

**Remove:**
- Lines 118-139: localStorage metadata checking
- Use API `retest_is_completed` directly

#### 4. Button Logic (`MWSExpo/src/components/dashboard/ActiveTestsView.tsx`, lines 196-248)

**Current State:**
- ❌ Checks AsyncStorage metadata for attempts
- ❌ Complex logic mixing API and localStorage

**Required Changes:**

```typescript
// Check retest completion from API
if (test.retest_is_completed) {
  return <ThemedButton disabled title="✓ Completed" />;
}

// Check if retest available and not completed (from API)
if (test.retest_available && !test.retest_is_completed) {
  const attemptsLeft = test.retest_attempts_left || 0;
  if (attemptsLeft > 0) {
    return <ThemedButton title="Start Retest" onPress={() => startRetest(test)} />;
  }
}

// Regular completed test
if (test.is_completed) {
  return <ThemedButton disabled title="✓ Completed" />;
}

// Regular test
return <ThemedButton title="Start Test" onPress={() => startTest(test)} />;
```

**Remove:**
- Lines 198-235: AsyncStorage metadata checking
- Use API flags directly

---

## Summary of Required Changes

### Backend (CRITICAL)

1. **Database Migration** ✅
   - Run `database/retest_targets_schema_update.sql`

2. **Retest Creation** (`functions/create-retest-assignment.js`)
   - Update `retest_targets` INSERT to include new columns
   - Write `retest_assignment_id` to ALL 8 test result tables

3. **All 8 Submission Functions**
   - Update `retest_targets` with new columns (`attempt_number`, `is_completed`, `passed`, `completed_at`)
   - If passed: set `attempt_number = max_attempts`, `is_completed = TRUE`
   - Write `retest_assignment_id` to original test results table

4. **API Function** (`functions/get-student-active-tests.js`)
   - Check `retest_targets.is_completed` for retest completion
   - Return `retest_is_completed`, `retest_passed`, `retest_attempt_number`, `retest_max_attempts`

### Frontend (Web App)

1. **Remove localStorage attempt tracking** from:
   - `src/student/StudentTests.jsx` (lines 860-938)
   - `src/components/test/MatchingTestStudent.jsx` (lines 707-732)
   - `src/components/test/FillBlanksTestStudent.jsx` (lines 485-502)
   - `src/components/test/WordMatchingStudent.jsx` (similar)
   - All other test submission components

2. **Keep only temporary completion key** to prevent duplicate starts

3. **Use API flags** in `src/student/StudentCabinet.jsx`:
   - `test.retest_is_completed` instead of localStorage metadata
   - `test.retest_attempts_left` from API

### Frontend (Android App)

1. **Remove AsyncStorage attempt tracking** from:
   - `MWSExpo/src/utils/retestUtils.ts` (`handleRetestCompletion` function)

2. **Keep only temporary completion key** to prevent duplicate starts

3. **Use API flags** in:
   - `MWSExpo/app/(tabs)/index.tsx` - Filter based on `retest_is_completed`
   - `MWSExpo/src/components/dashboard/ActiveTestsView.tsx` - Use API flags for filtering and button logic

---

## Implementation Priority

1. **Phase 1**: Database migration (run SQL)
2. **Phase 2**: Backend functions (all 8 submission functions + API)
3. **Phase 3**: Frontend cleanup (remove localStorage/AsyncStorage attempt tracking)
4. **Phase 4**: Frontend updates (use API flags)

---

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Retest creation sets all new columns correctly
- [ ] All 8 submission functions update `retest_targets` correctly
- [ ] If student passed: `attempt_number = max_attempts`, `is_completed = TRUE`
- [ ] If attempts exhausted: `is_completed = TRUE`
- [ ] API returns `retest_is_completed` correctly
- [ ] Web app uses API flags (no localStorage attempt tracking)
- [ ] Android app uses API flags (no AsyncStorage attempt tracking)
- [ ] Completion keys only set temporarily (prevent duplicate starts)
- [ ] Page refresh shows correct state from API


# Retest Database-Driven Implementation Plan
## Web App & Android App

## Problem Statement

Current retest system relies heavily on localStorage/AsyncStorage which causes:
- Race conditions between API updates and local state
- Inconsistent state across devices
- Complex key management logic
- Filtering issues when completion keys are deleted

## Solution: Database-Driven Retest System

**Core Principle**: Database is the single source of truth. localStorage/AsyncStorage only used temporarily until API refresh.

---

## Database Schema Changes

### 1. Update `retest_targets` Table

Add columns to track completion state directly in database:

```sql
ALTER TABLE retest_targets
  ADD COLUMN IF NOT EXISTS max_attempts INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS passed BOOLEAN DEFAULT FALSE;

-- Copy max_attempts from retest_assignments on creation
-- This denormalizes for faster queries
```

**New `retest_targets` structure:**
- `id` - Primary key
- `retest_assignment_id` - FK to retest_assignments
- `student_id` - FK to users
- `max_attempts` - Copied from retest_assignments.max_attempts (denormalized)
- `attempt_number` - Current attempt number (0 = not started, 1 = first attempt, etc.)
- `attempt_count` - Keep for backwards compatibility (same as attempt_number)
- `is_completed` - TRUE when attempts exhausted OR student passed
- `completed_at` - Timestamp when retest was completed
- `passed` - TRUE if student passed (percentage >= passing_threshold)
- `status` - Keep existing status field
- `last_attempt_at` - Keep existing timestamp
- `created_at`, `updated_at` - Standard timestamps

**Completion Logic:**
- `is_completed = TRUE` when:
  - `attempt_number >= max_attempts` (attempts exhausted), OR
  - `passed = TRUE` (student passed, even if attempts remain)
- `is_completed = FALSE` when:
  - `attempt_number < max_attempts` AND `passed = FALSE`

---

## Implementation Steps

### Phase 1: Database Migration

**File**: `database/retest_targets_schema_update.sql`

```sql
-- Add new columns
ALTER TABLE retest_targets
  ADD COLUMN IF NOT EXISTS max_attempts INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS passed BOOLEAN DEFAULT FALSE;

-- Migrate existing data
-- Copy max_attempts from retest_assignments
UPDATE retest_targets rt
SET max_attempts = ra.max_attempts
FROM retest_assignments ra
WHERE rt.retest_assignment_id = ra.id
  AND rt.max_attempts IS NULL;

-- Set attempt_number = attempt_count for existing records
UPDATE retest_targets
SET attempt_number = attempt_count
WHERE attempt_number = 0 AND attempt_count > 0;

-- Set is_completed for existing completed retests
UPDATE retest_targets
SET is_completed = TRUE,
    completed_at = last_attempt_at
WHERE (attempt_count >= max_attempts OR status = 'PASSED')
  AND is_completed = FALSE;

-- Set passed flag
UPDATE retest_targets
SET passed = TRUE
WHERE status = 'PASSED'
  AND passed = FALSE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_retest_targets_is_completed 
  ON retest_targets(is_completed);
CREATE INDEX IF NOT EXISTS idx_retest_targets_passed 
  ON retest_targets(passed);
CREATE INDEX IF NOT EXISTS idx_retest_targets_completed_at 
  ON retest_targets(completed_at);
```

---

### Phase 2: Update Retest Creation

**File**: `functions/create-retest-assignment.js`

**Changes:**
1. When creating `retest_targets` row, copy `max_attempts` from `retest_assignments`
2. Initialize `attempt_number = 0`, `is_completed = FALSE`, `passed = FALSE`
3. **CRITICAL**: Write `retest_assignment_id` to ALL 8 test result tables (not just speaking!)

```javascript
// When creating retest_targets - UPDATE EXISTING CODE (lines 96-101)
await sql`
  INSERT INTO retest_targets (
    retest_assignment_id,
    student_id,
    max_attempts,  -- NEW: Copy from retest_assignments
    attempt_number,  -- NEW: Initialize to 0
    attempt_count,  -- Keep for backwards compatibility
    is_completed,  -- NEW: Initialize to FALSE
    passed,  -- NEW: Initialize to FALSE
    status
  )
  SELECT 
    ${retestId},
    ${sid},
    ra.max_attempts,  -- Copy from retest_assignments
    0,  -- Start at 0
    0,  -- Keep attempt_count in sync
    FALSE,  -- Not completed yet
    FALSE,  -- Not passed yet
    'PENDING'
  FROM retest_assignments ra
  WHERE ra.id = ${retestId}
  ON CONFLICT (retest_assignment_id, student_id) DO NOTHING
`;

// CRITICAL: Write retest_assignment_id to ALL 8 test result tables
// Currently only speaking_test_results is updated (line 110-113)
// Need to update ALL 8 tables:

// 1. Multiple Choice
await sql`
  UPDATE multiple_choice_test_results
  SET retest_assignment_id = ${retestId}
  WHERE student_id = ${sid} AND test_id = ${test_id}
`;

// 2. True/False
await sql`
  UPDATE true_false_test_results
  SET retest_assignment_id = ${retestId}
  WHERE student_id = ${sid} AND test_id = ${test_id}
`;

// 3. Input
await sql`
  UPDATE input_test_results
  SET retest_assignment_id = ${retestId}
  WHERE student_id = ${sid} AND test_id = ${test_id}
`;

// 4. Matching Type
await sql`
  UPDATE matching_type_test_results
  SET retest_assignment_id = ${retestId}
  WHERE student_id = ${sid} AND test_id = ${test_id}
`;

// 5. Word Matching
await sql`
  UPDATE word_matching_test_results
  SET retest_assignment_id = ${retestId}
  WHERE student_id = ${sid} AND test_id = ${test_id}
`;

// 6. Drawing
await sql`
  UPDATE drawing_test_results
  SET retest_assignment_id = ${retestId}
  WHERE student_id = ${sid} AND test_id = ${test_id}
`;

// 7. Fill Blanks
await sql`
  UPDATE fill_blanks_test_results
  SET retest_assignment_id = ${retestId}
  WHERE student_id = ${sid} AND test_id = ${test_id}
`;

// 8. Speaking (already exists, but keep it)
await sql`
  UPDATE speaking_test_results
  SET retest_assignment_id = ${retestId}
  WHERE student_id = ${sid} AND test_id = ${test_id}
`;
```

---

### Phase 3: Update Test Submission Functions

**Files to update:**
- `functions/submit-multiple-choice-test.js`
- `functions/submit-true-false-test.js`
- `functions/submit-input-test.js`
- `functions/submit-matching-type-test.js`
- `functions/submit-word-matching-test.js`
- `functions/submit-fill-blanks-test.js`
- `functions/submit-drawing-test.js`
- `functions/submit-speaking-test-final.js`

**New Logic:**

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

// Update retest_targets in single transaction
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
```

**Key Points:**
- Single row update (no multiple rows)
- `attempt_number` tracks current attempt
- `is_completed` set when attempts exhausted OR passed
- `completed_at` set once when first completed
- `passed` flag tracks if student passed

**CRITICAL: Also update original test results table with retest_assignment_id**

When submitting a retest, we write to `test_attempts`, but we ALSO need to update the original test results table to link it to the retest assignment:

```javascript
// After updating retest_targets, also update original test results table
// This allows queries to find which retest assignment a result belongs to

if (retest_assignment_id) {
  // Update the appropriate test results table based on test_type
  // This should be done AFTER writing to test_attempts
  
  switch (test_type) {
    case 'multiple_choice':
      await sql`
        UPDATE multiple_choice_test_results
        SET retest_assignment_id = ${retest_assignment_id}
        WHERE student_id = ${studentId} AND test_id = ${effectiveParentTestId}
        AND retest_assignment_id IS NULL  -- Only update if not already set
      `;
      break;
    case 'true_false':
      await sql`
        UPDATE true_false_test_results
        SET retest_assignment_id = ${retest_assignment_id}
        WHERE student_id = ${studentId} AND test_id = ${effectiveParentTestId}
        AND retest_assignment_id IS NULL
      `;
      break;
    // ... repeat for all 8 test types
  }
}
```

**Note**: The original test results table already has `retest_assignment_id` column (from schema), we just need to populate it during retest submission.

---

### Phase 4: Update API Functions

**⚠️ VIEW UPDATE**: `student_active_tests_view.sql` has been updated to exclude completed retests at the SQL level. This means:
- Tests where original is completed AND retest is completed are filtered out in the view
- The JavaScript function no longer needs to filter these out
- The view joins `retest_assignments` and `retest_targets` to check `is_completed` status

#### 4.1 Update `get-student-active-tests.js`

**⚠️ IMPORTANT**: The `student_active_tests_view` now filters out completed retests at the SQL level. The JavaScript filter below is **redundant** and should be **removed**.

**Current logic** (lines 206-213) - **REMOVE THIS**:
```javascript
const isCompleted = row.result_id !== null && row.result_id !== undefined;
if (isCompleted && !retestAvailable) {
  continue; // Skip this test
}
```

**New logic** - Check `retest_targets.is_completed` and return flags (but don't filter, view handles it):

```javascript
// Check if test is completed (from results table)
const isCompleted = row.result_id !== null && row.result_id !== undefined;

// Check retest completion from retest_targets
let retestCompleted = false;
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
    // Include retest info in response
    retestAttemptsLeft = retestTarget[0].max_attempts - retestTarget[0].attempt_number;
  }
}

// ⚠️ REMOVE THIS FILTER - view already excludes completed retests
// if (isCompleted && (!retestAvailable || retestCompleted)) {
//   console.log('Filtering out completed test:', row.test_type, row.test_id);
//   continue;
// }
```

**Response includes:**
```javascript
{
  // ... existing fields
  retest_available: retestAvailable && !retestCompleted,
  retest_attempts_left: retestAttemptsLeft,
  retest_is_completed: retestCompleted,  // NEW
  retest_passed: retestTarget?.passed || false,  // NEW
  retest_attempt_number: retestTarget?.attempt_number || 0,  // NEW
  retest_max_attempts: retestTarget?.max_attempts || null  // NEW
}
```

---

### Phase 5: Web App Changes

#### 5.1 Remove localStorage Key Deletion

**File**: `src/student/StudentCabinet.jsx`

**Changes:**
- Remove all `localStorage.removeItem(completionKey)` calls
- Only use localStorage temporarily until API refresh
- Rely on API `retest_is_completed` flag for filtering

**Filtering logic:**
```javascript
// Filter active tests
const filteredTests = activeTests.filter(test => {
  // Filter out completed tests without retest
  if (test.is_completed && !test.retest_available) {
    return false;
  }
  
  // Filter out completed retests
  if (test.retest_is_completed) {
    return false;
  }
  
  return true;
});
```

#### 5.2 Update `processRetestAvailability` (if still needed)

**File**: `src/utils/retestUtils.ts` (if exists) or remove entirely

**New approach**: Don't delete keys, just set retest keys when needed:
```javascript
// Only set retest key, never delete completion key
if (test.retest_available && !test.retest_is_completed) {
  localStorage.setItem(retestKey, 'true');
  // DON'T delete completionKey - API will handle filtering
}
```

#### 5.3 Update Button Logic

**File**: `src/student/StudentCabinet.jsx` (lines 900-936)

```javascript
// Check retest completion from API
if (test.retest_is_completed) {
  return <Button disabled>✓ Completed</Button>;
}

// Check if retest available and not completed
if (test.retest_available && !test.retest_is_completed) {
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

---

### Phase 6: Android App Changes

#### 6.1 Update Dashboard Fetch

**File**: `MWSExpo/app/(tabs)/index.tsx`

**Changes:**
- Remove `processRetestAvailability` calls that delete keys
- Use API `retest_is_completed` flag directly
- Only use AsyncStorage temporarily until API refresh

```typescript
// After fetching tests from API
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

#### 6.2 Update `processRetestAvailability`

**File**: `MWSExpo/src/utils/retestUtils.ts`

**New logic** - Don't delete keys:
```typescript
export async function processRetestAvailability(
  test: ActiveTest,
  studentId: string
): Promise<void> {
  // Only process if retest available and not completed (from API)
  if (!test.retest_available || test.retest_is_completed) {
    return;
  }

  const retestKey = `retest1_${studentId}_${test.test_type}_${test.test_id}`;
  
  // Only set retest key, never delete completion key
  await AsyncStorage.setItem(retestKey, 'true');
  
  // Store retest_assignment_id for submission
  if (test.retest_assignment_id) {
    const retestAssignKey = `retest_assignment_id_${studentId}_${test.test_type}_${test.test_id}`;
    await AsyncStorage.setItem(retestAssignKey, test.retest_assignment_id.toString());
  }
  
  // DON'T delete completionKey - API handles filtering
}
```

#### 6.3 Update `ActiveTestsView` Filter

**File**: `MWSExpo/src/components/dashboard/ActiveTestsView.tsx`

**New filter logic:**
```typescript
.filter(test => {
  // Filter out completed tests without retest
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

#### 6.4 Update Button Logic

**File**: `MWSExpo/src/components/dashboard/ActiveTestsView.tsx`

```typescript
// Check retest completion from API
if (test.retest_is_completed) {
  return <ThemedButton disabled title="✓ Completed" />;
}

// Check if retest available and not completed
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

---

## Benefits

1. **Single Source of Truth**: Database tracks all retest state
2. **No Race Conditions**: API always returns current state
3. **Simpler Logic**: No complex localStorage/AsyncStorage key management
4. **Consistent Across Devices**: Same state everywhere
5. **Accurate Filtering**: Based on database `is_completed` flag
6. **Early Pass Support**: Student passes → `is_completed = TRUE` immediately
7. **Attempt Tracking**: `attempt_number` clearly tracks current attempt

---

## Migration Strategy

1. **Deploy database migration** (Phase 1)
2. **Update submission functions** (Phase 3) - Deploy all at once
3. **Update API functions** (Phase 4) - Deploy `get-student-active-tests.js`
4. **Update web app** (Phase 5) - Deploy frontend changes
5. **Update Android app** (Phase 6) - Deploy mobile changes

**Rollback Plan:**
- Keep `attempt_count` column for backwards compatibility
- Old code will still work (just won't use new `is_completed` flag)
- Can rollback frontend changes independently

---

## Testing Checklist

### Retest Creation
- [ ] Retest creation sets `max_attempts` correctly in `retest_targets`
- [ ] Retest creation writes `retest_assignment_id` to ALL 8 test result tables:
  - [ ] `multiple_choice_test_results`
  - [ ] `true_false_test_results`
  - [ ] `input_test_results`
  - [ ] `matching_type_test_results`
  - [ ] `word_matching_test_results`
  - [ ] `drawing_test_results`
  - [ ] `fill_blanks_test_results`
  - [ ] `speaking_test_results`

### Retest Submission (All 8 Test Types)
- [ ] First submission sets `attempt_number = 1` in `retest_targets`
- [ ] Failed submission increments `attempt_number` in `retest_targets`
- [ ] Passing submission sets `is_completed = TRUE` and `passed = TRUE` in `retest_targets`
- [ ] Exhausting attempts sets `is_completed = TRUE` in `retest_targets`
- [ ] Retest submission writes `retest_assignment_id` to original test results table (for all 8 types)
- [ ] Retest submission writes to `test_attempts` table
- [ ] Early pass works correctly (jumps to max_attempts slot)
- [ ] Multiple attempts tracked correctly

### API & Frontend
- [ ] API returns `retest_is_completed` correctly
- [ ] API returns `retest_passed`, `retest_attempt_number`, `retest_max_attempts`
- [ ] Web app filters completed retests
- [ ] Android app filters completed retests
- [ ] No localStorage/AsyncStorage key deletion

---

## Files to Modify

### Database
- `database/retest_targets_schema_update.sql` (NEW)

### Backend Functions
- `functions/create-retest-assignment.js` ⚠️ **CRITICAL**: Update to write retest_assignment_id to ALL 8 test result tables
- `functions/submit-multiple-choice-test.js` ⚠️ **CRITICAL**: Update retest_targets AND write retest_assignment_id to multiple_choice_test_results
- `functions/submit-true-false-test.js` ⚠️ **CRITICAL**: Update retest_targets AND write retest_assignment_id to true_false_test_results
- `functions/submit-input-test.js` ⚠️ **CRITICAL**: Update retest_targets AND write retest_assignment_id to input_test_results
- `functions/submit-matching-type-test.js` ⚠️ **CRITICAL**: Update retest_targets AND write retest_assignment_id to matching_type_test_results
- `functions/submit-word-matching-test.js` ⚠️ **CRITICAL**: Update retest_targets AND write retest_assignment_id to word_matching_test_results
- `functions/submit-fill-blanks-test.js` ⚠️ **CRITICAL**: Update retest_targets AND write retest_assignment_id to fill_blanks_test_results
- `functions/submit-drawing-test.js` ⚠️ **CRITICAL**: Update retest_targets AND write retest_assignment_id to drawing_test_results
- `functions/submit-speaking-test-final.js` ⚠️ **CRITICAL**: Update retest_targets AND write retest_assignment_id to speaking_test_results
- `functions/get-student-active-tests.js` ⚠️ **CRITICAL**: Check retest_targets.is_completed for filtering

### Web App
- `src/student/StudentCabinet.jsx`
- `src/utils/retestUtils.ts` (if exists, or remove)

### Android App
- `MWSExpo/app/(tabs)/index.tsx`
- `MWSExpo/src/utils/retestUtils.ts`
- `MWSExpo/src/components/dashboard/ActiveTestsView.tsx`

---

## Notes

- **localStorage/AsyncStorage**: Only used temporarily until API refresh (for retest keys during navigation)
- **Backwards Compatibility**: Keep `attempt_count` column in sync with `attempt_number`
- **Performance**: `is_completed` indexed for fast filtering queries
- **Early Pass**: When student passes, `attempt_number` jumps to `max_attempts` and `is_completed = TRUE`


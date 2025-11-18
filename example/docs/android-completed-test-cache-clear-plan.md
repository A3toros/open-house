# Android Completed Test Cache Clear - Analysis and Plan

## Problem Statement

When regular tests are completed and no longer appear in the API response (filtered out by `student_active_tests_view`), all related cache and AsyncStorage keys must be cleared. Currently, tests are marked as completed locally, but when the API refresh shows they're no longer active, the cache cleanup is not working properly.

## Current State Analysis

### 1. How Tests Are Filtered Out

**Database View Logic (`student_active_tests_view.sql`):**
- Tests are excluded when:
  - `result_id IS NOT NULL` (test has been completed) AND
  - No retest assignment exists OR retest is completed
- The view filters at SQL level, so completed tests simply don't appear in API response

**API Function (`functions/get-student-active-tests.js`):**
- Additional runtime check: `if (row.retest_is_completed === true) continue;`
- Returns only tests that pass both view and runtime filters

### 2. Current Cache Key Patterns

Based on codebase analysis, the following cache keys are used:

#### Completion Keys
- `test_completed_${studentId}_${testType}_${testId}` - Marks test as completed

#### Progress Keys
- `test_progress_${studentId}_${testType}_${testId}` - General test progress
- `test_progress_${studentId}_${testType}_${testId}_${questionId}` - Per-question progress (all question types)

#### Test-Specific Cache Keys

**Drawing Tests:**
- `drawing_${studentId}_${testId}` - Drawing paths array
- `drawing_${studentId}_${testId}_${questionIndex}` - Per-question drawing data (0-99)

**Speaking Tests:**
- `speaking_test_result_${testId}` - Speaking test results

**All Test Types:**
- `student_results_table_${studentId}` - Cached test results (shared across tests)
- `${testType}_test_result_${testId}` - Test-specific result cache

#### Retest Keys
- `retest1_${studentId}_${testType}_${testId}` - Retest availability flag
- `retest_assignment_id_${studentId}_${testType}_${testId}` - Retest assignment ID

#### Other Progress Keys
- `testProgress_${testId}` - Alternative progress key format (used in some components)
- `testProgress` - Global test progress (used in TestContext)

### 3. Current Implementation Issues

**Previous Attempt (`MWSExpo/app/(tabs)/index.tsx`):**
- Tried to compare `previousTestIds` vs `currentTestIds` from state
- **Problem**: State comparison happens AFTER `setTests(testsData)`, so previous state is already overwritten
- **Problem**: State might be empty on first load, so comparison fails
- **Problem**: Doesn't account for tests that were never loaded but have cache

## Solution Approach

### Strategy: Track Active Tests in AsyncStorage

Instead of comparing React state (which is unreliable), we should:

1. **Store active test IDs in AsyncStorage** when fetching from API
2. **Compare stored active tests with new API response**
3. **Clear cache for tests that disappeared from active list**

### Implementation Plan

#### Phase 1: Create Cache Clear Helper Function

**File:** `MWSExpo/src/utils/cacheClearUtils.ts` (NEW)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clears all cache related to a specific test
 */
export async function clearTestCache(
  studentId: string,
  testType: string,
  testId: string | number
): Promise<void> {
  const testIdStr = String(testId);
  const cacheClearPromises: Promise<void>[] = [];

  // 1. Clear completion key
  cacheClearPromises.push(
    AsyncStorage.removeItem(`test_completed_${studentId}_${testType}_${testIdStr}`)
      .catch(() => {})
  );

  // 2. Clear progress keys
  cacheClearPromises.push(
    AsyncStorage.removeItem(`test_progress_${studentId}_${testType}_${testIdStr}`)
      .catch(() => {})
  );

  // 3. Clear all question-specific progress keys
  // Get all keys and filter for this test's questions
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const questionProgressKeys = allKeys.filter(key =>
      key.startsWith(`test_progress_${studentId}_${testType}_${testIdStr}_`)
    );
    questionProgressKeys.forEach(key => {
      cacheClearPromises.push(AsyncStorage.removeItem(key).catch(() => {}));
    });
  } catch (e) {
    console.warn('Error getting keys for question progress:', e);
  }

  // 4. Clear test-specific cache based on test type
  if (testType === 'drawing') {
    cacheClearPromises.push(
      AsyncStorage.removeItem(`drawing_${studentId}_${testIdStr}`).catch(() => {})
    );
    // Clear all question-specific drawing keys (0-99)
    for (let i = 0; i < 100; i++) {
      cacheClearPromises.push(
        AsyncStorage.removeItem(`drawing_${studentId}_${testIdStr}_${i}`).catch(() => {})
      );
    }
  }

  if (testType === 'speaking') {
    cacheClearPromises.push(
      AsyncStorage.removeItem(`speaking_test_result_${testIdStr}`).catch(() => {})
    );
  }

  // 5. Clear retest-related keys
  cacheClearPromises.push(
    AsyncStorage.removeItem(`retest1_${studentId}_${testType}_${testIdStr}`).catch(() => {})
  );
  cacheClearPromises.push(
    AsyncStorage.removeItem(`retest_assignment_id_${studentId}_${testType}_${testIdStr}`)
      .catch(() => {})
  );

  // 6. Clear test result cache
  cacheClearPromises.push(
    AsyncStorage.removeItem(`${testType}_test_result_${testIdStr}`).catch(() => {})
  );

  // 7. Clear alternative progress keys
  cacheClearPromises.push(
    AsyncStorage.removeItem(`testProgress_${testIdStr}`).catch(() => {})
  );

  await Promise.all(cacheClearPromises);
  console.log(`🎓 Cleared all cache for test: ${testType}_${testIdStr}`);
}

/**
 * Stores active test IDs in AsyncStorage for comparison on next fetch
 */
export async function storeActiveTestIds(
  studentId: string,
  tests: Array<{ test_type: string; test_id: number | string }>
): Promise<void> {
  const testIds = tests.map(t => `${t.test_type}_${t.test_id}`);
  const key = `active_tests_${studentId}`;
  await AsyncStorage.setItem(key, JSON.stringify(testIds));
  console.log(`🎓 Stored ${testIds.length} active test IDs`);
}

/**
 * Gets previously stored active test IDs
 */
export async function getStoredActiveTestIds(
  studentId: string
): Promise<Set<string>> {
  try {
    const key = `active_tests_${studentId}`;
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const testIds = JSON.parse(stored) as string[];
      return new Set(testIds);
    }
  } catch (e) {
    console.warn('Error getting stored active test IDs:', e);
  }
  return new Set<string>();
}

/**
 * Clears cache for tests that are no longer active
 */
export async function clearCacheForInactiveTests(
  studentId: string,
  currentActiveTests: Array<{ test_type: string; test_id: number | string }>
): Promise<void> {
  // Get previously stored active tests
  const previousActiveTestIds = await getStoredActiveTestIds(studentId);
  
  // Get current active test IDs
  const currentActiveTestIds = new Set(
    currentActiveTests.map(t => `${t.test_type}_${t.test_id}`)
  );

  // Find tests that were active before but are no longer active
  const inactiveTestIds = Array.from(previousActiveTestIds).filter(
    id => !currentActiveTestIds.has(id)
  );

  if (inactiveTestIds.length === 0) {
    console.log('🎓 No inactive tests to clear cache for');
    return;
  }

  console.log(`🎓 Clearing cache for ${inactiveTestIds.length} inactive tests:`, inactiveTestIds);

  // Clear cache for each inactive test
  const clearPromises = inactiveTestIds.map(testKey => {
    const [testType, ...testIdParts] = testKey.split('_');
    const testId = testIdParts.join('_');
    return clearTestCache(studentId, testType, testId);
  });

  await Promise.all(clearPromises);
  console.log(`🎓 Finished clearing cache for ${inactiveTestIds.length} inactive tests`);

  // Update stored active test IDs
  await storeActiveTestIds(studentId, currentActiveTests);
}
```

#### Phase 2: Integrate into Dashboard

**File:** `MWSExpo/app/(tabs)/index.tsx`

**Changes:**
1. Import the helper functions
2. Call `clearCacheForInactiveTests()` BEFORE setting new tests state
3. Call `storeActiveTestIds()` AFTER setting new tests state

**Location:** In `fetchData()` function, after getting `testsData` from API:

```typescript
let testsData: ActiveTest[] = testsRes.data?.tests ?? testsRes.data?.data ?? [];

// Clear cache for tests that are no longer active (completed tests)
await clearCacheForInactiveTests(studentId, testsData);

// ... rest of existing code ...

setTests(testsData);

// Store active test IDs for next comparison
await storeActiveTestIds(studentId, testsData);
```

#### Phase 3: Handle Edge Cases

1. **First Load**: If no stored active tests exist, skip comparison (nothing to clear)
2. **Empty Active Tests**: If API returns empty array, clear all previously stored active tests
3. **Test ID Format**: Ensure consistent string conversion (`String(testId)`)
4. **Error Handling**: All cache operations should be wrapped in try-catch to prevent failures

#### Phase 4: Testing Checklist

- [ ] Complete a regular test (no retest)
- [ ] Verify test disappears from active list on API refresh
- [ ] Verify all cache keys are cleared:
  - [ ] `test_completed_*` key
  - [ ] `test_progress_*` keys (general and per-question)
  - [ ] Test-specific cache (drawing, speaking, etc.)
  - [ ] Retest keys
  - [ ] Result cache
- [ ] Verify test still appears in results view
- [ ] Verify completion key is NOT cleared if test has retest available
- [ ] Test with multiple completed tests
- [ ] Test with mixed active/completed tests
- [ ] Test first load (no previous active tests stored)

## Key Principles

1. **AsyncStorage as Source of Truth**: Store active test IDs in AsyncStorage, not React state
2. **Clear Before Set**: Clear cache before updating state to avoid race conditions
3. **Comprehensive Clearing**: Clear ALL related keys, not just completion keys
4. **Question-Level Clearing**: Clear per-question progress keys dynamically (don't hardcode 0-99)
5. **Error Resilience**: All cache operations should fail gracefully
6. **Logging**: Log all cache clear operations for debugging

## Alternative Approach (If AsyncStorage Tracking Fails)

If storing active test IDs in AsyncStorage proves unreliable, alternative:

1. **Scan All Completion Keys**: On each fetch, get all `test_completed_*` keys
2. **Compare with API Response**: For each completion key, check if test is in API response
3. **Clear if Missing**: If test is marked completed but not in API, clear all related cache

This approach is more expensive but doesn't require tracking state.

## Files to Modify

1. **NEW:** `MWSExpo/src/utils/cacheClearUtils.ts` - Helper functions
2. **MODIFY:** `MWSExpo/app/(tabs)/index.tsx` - Integrate cache clearing
3. **OPTIONAL:** `MWSExpo/src/utils/index.ts` - Export new utilities

## Implementation Order

1. Create `cacheClearUtils.ts` with all helper functions
2. Test helper functions in isolation
3. Integrate into dashboard `fetchData()`
4. Test end-to-end with real API
5. Add comprehensive logging
6. Handle edge cases


# Retest Recording and Filtering Analysis

## Overview

This document provides a comprehensive analysis of how retests are recorded in the database, which tables and columns are involved, and how completed retests are filtered from the student's active test list.

---

## Database Schema

### 1. `retest_assignments` Table

**Purpose**: Stores the retest assignment configuration created by teachers.

**Location**: `database/database_schema_migration.sql` (lines 645-664)

**Columns**:
- `id` (SERIAL PRIMARY KEY) - Unique identifier for the retest assignment
- `test_type` (VARCHAR(20)) - Type of test (multiple_choice, true_false, input, matching_type, word_matching, drawing, fill_blanks, speaking)
- `test_id` (INTEGER) - Reference to the original test
- `teacher_id` (VARCHAR(50)) - FK to `teachers(teacher_id)`
- `subject_id` (INTEGER) - FK to `subjects(subject_id)`
- `grade` (INTEGER) - Grade level
- `class` (INTEGER) - Class number
- `passing_threshold` (DECIMAL(5,2)) - Minimum score to pass (default: 50.00)
- `scoring_policy` (VARCHAR(10)) - Policy for scoring multiple attempts: 'BEST', 'LATEST', or 'AVERAGE' (default: 'BEST')
- `max_attempts` (INTEGER) - Maximum number of attempts allowed (default: 1)
- `window_start` (TIMESTAMP) - Start of retest availability window
- `window_end` (TIMESTAMP) - End of retest availability window
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Constraints**:
- `window_end > window_start`
- `grade > 0`
- `class > 0`
- `scoring_policy IN ('BEST','LATEST','AVERAGE')`

---

### 2. `retest_targets` Table

**Purpose**: Tracks per-student retest progress and completion status.

**Location**: `database/database_schema_migration.sql` (lines 666-677)

**Columns**:
- `id` (SERIAL PRIMARY KEY) - Unique identifier
- `retest_assignment_id` (INTEGER) - FK to `retest_assignments(id)` ON DELETE CASCADE
- `student_id` (VARCHAR(10)) - FK to `users(student_id)`
- `max_attempts` (INTEGER) - **Denormalized** copy from `retest_assignments.max_attempts` for faster queries
- `attempt_number` (INTEGER DEFAULT 0) - Current attempt number (0 = not started, 1 = first attempt, etc.)
- `attempt_count` (INTEGER DEFAULT 0) - **Legacy field** kept for backwards compatibility (same as `attempt_number`)
- `is_completed` (BOOLEAN DEFAULT FALSE) - **Completion flag**: TRUE when attempts exhausted OR student passed
- `completed_at` (TIMESTAMP) - Timestamp when retest was completed (NULL if not completed)
- `passed` (BOOLEAN DEFAULT FALSE) - TRUE if student passed (percentage >= passing_threshold)
- `status` (VARCHAR(12) DEFAULT 'PENDING') - Status: 'PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'EXPIRED'
- `last_attempt_at` (TIMESTAMP) - Timestamp of last attempt
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Unique Constraint**: `(retest_assignment_id, student_id)` - One retest target per student per assignment

**Completion Logic**:
- `is_completed = TRUE` when:
  - `attempt_number >= max_attempts` (attempts exhausted), OR
  - `passed = TRUE` (student passed, even if attempts remain)
- `is_completed = FALSE` when:
  - `attempt_number < max_attempts` AND `passed = FALSE`

---

### 3. `test_attempts` Table

**Purpose**: Stores detailed attempt data for retests (and optionally regular tests).

**Location**: `database/database_schema_migration.sql` (lines 683-717)

**Key Columns for Retests**:
- `id` (SERIAL PRIMARY KEY)
- `student_id` (VARCHAR(10)) - FK to `users(student_id)`
- `test_id` (INTEGER) - Reference to the test
- `attempt_number` (INTEGER) - Attempt number (1, 2, 3, etc.)
- `retest_assignment_id` (INTEGER) - FK to `retest_assignments(id)` - **Links attempt to retest assignment**
- `score` (INTEGER) - Score achieved
- `max_score` (INTEGER) - Maximum possible score
- `percentage` (DECIMAL(5,2)) - Percentage score
- `time_taken` (INTEGER) - Time taken in seconds
- `started_at` (TIMESTAMP) - When attempt started
- `submitted_at` (TIMESTAMP) - When attempt submitted
- `is_completed` (BOOLEAN) - Whether attempt was completed
- `answers` (JSONB) - Student answers
- `caught_cheating` (BOOLEAN) - Anti-cheating flag
- `visibility_change_times` (INTEGER) - Tab switch count
- Additional metadata: `test_name`, `teacher_id`, `subject_id`, `grade`, `class`, `academic_period_id`

**Unique Constraint**: `(student_id, test_id, attempt_number)` - One attempt per student per test per attempt number

**Note**: For retests, detailed data is written to `test_attempts` only. For regular tests, data is written to both the specific test results table (e.g., `multiple_choice_test_results`) and optionally to `test_attempts`.

---

### 4. Test Results Tables (8 Types)

**Purpose**: Store final results for regular tests. For retests, these tables are updated with `retest_assignment_id` to link back to the retest assignment.

**Tables**:
1. `multiple_choice_test_results`
2. `true_false_test_results`
3. `input_test_results`
4. `matching_type_test_results`
5. `word_matching_test_results`
6. `drawing_test_results`
7. `fill_blanks_test_results`
8. `speaking_test_results`

**Key Column for Retests**:
- `retest_assignment_id` (INTEGER) - FK to `retest_assignments(id)` - **Links result to retest assignment**

**Location**: Updated in `functions/create-retest-assignment.js` (lines 130-195) when retest is created, and in submission functions when retest is submitted.

---

## Retest Creation Flow

### Step 1: Teacher Creates Retest Assignment

**Function**: `functions/create-retest-assignment.js`

**Process**:

1. **Insert into `retest_assignments`** (lines 77-83):
   ```javascript
   INSERT INTO retest_assignments(
     test_type, test_id, teacher_id, subject_id, grade, class,
     passing_threshold, scoring_policy, max_attempts,
     window_start, window_end
   ) VALUES (...)
   RETURNING id
   ```

2. **Insert into `retest_targets` for each student** (lines 97-120):
   ```javascript
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
   ```

3. **Update test results tables with `retest_assignment_id`** (lines 130-195):
   - Updates all 8 test result tables for each student
   - Links existing results to the retest assignment
   - Example for multiple choice (lines 131-135):
     ```javascript
     UPDATE multiple_choice_test_results
     SET retest_assignment_id = ${retestId}
     WHERE student_id = ${sid} AND test_id = ${test_id}
     ```

---

## Retest Submission Flow

### Step 1: Student Submits Retest

**Function**: Test-specific submission functions (e.g., `functions/submit-multiple-choice-test.js`)

**Process** (using multiple choice as example):

1. **Check if retest** (line 200):
   - Checks for `retest_assignment_id` in request body
   - If present, this is a retest submission

2. **Write to `test_attempts`** (lines 226-263):
   ```javascript
   INSERT INTO test_attempts (
     student_id, test_id, attempt_number, retest_assignment_id,
     score, max_score, percentage, time_taken,
     started_at, submitted_at, is_completed, answers,
     caught_cheating, visibility_change_times,
     test_name, teacher_id, subject_id, grade, class,
     academic_period_id
   ) VALUES (...)
   ```

3. **Update `retest_targets`** (lines 321-342):
   ```javascript
   UPDATE retest_targets
   SET 
     attempt_number = ${nextAttemptNumber},
     attempt_count = ${nextAttemptNumber},
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

   **Completion Logic** (lines 283-318):
   - If student **passed** (`percentage >= passing_threshold`):
     - `attempt_number = max_attempts` (jump to max, marking as final attempt)
     - `passed = TRUE`
     - `is_completed = TRUE`
   - If student **failed**:
     - `attempt_number = current_attempt_number + 1`
     - `passed = FALSE`
     - `is_completed = TRUE` if `attempt_number >= max_attempts`, else `FALSE`

4. **Update test results table** (if needed):
   - Some submission functions update the specific test results table with `retest_assignment_id`
   - This links the result back to the retest assignment

---

## Filtering Completed Retests

### Level 1: Database View Filtering

**View**: `database/views/student_active_tests_view.sql`

**Purpose**: SQL-level filtering to exclude completed retests from the active tests view.

**Filtering Logic** (example for multiple choice, lines 86-94):

```sql
WHERE (
  mcr.id IS NULL  -- Original test not completed
  OR ra_mc.id IS NOT NULL  -- OR retest exists
)
AND (
  rt_mc.id IS NULL  -- No retest target
  OR rt_mc.is_completed = FALSE  -- OR retest not completed
)
AND NOT (
  mcr.id IS NOT NULL  -- Original completed
  AND rt_mc.id IS NOT NULL  -- AND retest exists
  AND rt_mc.is_completed = TRUE  -- AND retest completed
)
```

**Applied to all 8 test types**:
- Multiple Choice (lines 86-94)
- True/False (lines 150-158)
- Input (lines 214-222)
- Matching Type (lines 278-286)
- Word Matching (lines 342-350)
- Drawing (lines 406-414)
- Fill Blanks (lines 470-478)
- Speaking (lines 534-542)

**Key Columns Used**:
- `rt_mc.is_completed` - From `retest_targets` table (LEFT JOIN)
- `mcr.id` - From test results table (NULL = not completed)

**Result**: The view excludes tests where:
- Original test is completed AND retest is completed

---

### Level 2: API Function Filtering

**Function**: `functions/get-student-active-tests.js`

**Process**:

1. **Query the view** (line 140):
   ```javascript
   const viewRows = await sql`
     SELECT * FROM student_active_tests_view
     WHERE student_id = ${student_id}
   `;
   ```

2. **First filter check** (lines 158-166):
   ```javascript
   if (row.retest_is_completed === true) {
     console.log('Skipping row because retest is already completed (from view flag)');
     continue;
   }
   ```
   - Uses `retest_is_completed` flag from the view
   - This is a redundant check (view already filters), but provides safety

3. **Runtime retest check** (lines 190-252):
   ```javascript
   // Query retest_targets directly
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
     // ... set other retest flags
   }
   
   if (retestCompleted) {
     console.log('Skipping row because retest is already completed (runtime check)');
     continue;
   }
   ```

4. **Include retest info in response** (lines 260-280):
   ```javascript
   activeTests.push({
     // ... other fields
     retest_available: retestAvailable && !retestCompleted,
     retest_is_completed: retestCompleted,
     retest_passed: retestPassed,
     retest_attempt_number: retestAttemptNumber,
     retest_max_attempts: retestMaxAttempts,
     retest_attempts_left: retestAttemptsLeft
   });
   ```

---

### Level 3: Frontend Filtering

**Component**: `src/student/StudentCabinet.jsx` and related components

**Process**:

1. **Receive active tests from API** with `retest_is_completed` flag

2. **Filter in UI** (if needed):
   ```javascript
   const filteredTests = activeTests.filter(test => {
     // Filter out completed retests
     if (test.retest_is_completed) {
       return false;
     }
     return true;
   });
   ```

**Note**: Most filtering happens at the database view level, so frontend filtering is typically redundant but provides additional safety.

---

## Summary: Key Columns for Completion Status

### Primary Completion Flag

**Table**: `retest_targets`
**Column**: `is_completed` (BOOLEAN)
- `TRUE` = Retest is completed (attempts exhausted OR student passed)
- `FALSE` = Retest is still active

### Supporting Columns

**Table**: `retest_targets`
- `attempt_number` (INTEGER) - Current attempt number
- `max_attempts` (INTEGER) - Maximum attempts allowed
- `passed` (BOOLEAN) - Whether student passed
- `completed_at` (TIMESTAMP) - When retest was completed
- `status` (VARCHAR) - Status: 'PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'EXPIRED'

### Filtering Columns

**View**: `student_active_tests_view`
- `retest_is_completed` (BOOLEAN) - Computed flag from `retest_targets.is_completed`
- `retest_target_id` (INTEGER) - Reference to `retest_targets.id`
- `retest_assignment_id` (INTEGER) - Reference to `retest_assignments.id`

---

## Data Flow Diagram

```
1. Teacher Creates Retest
   └─> retest_assignments (insert)
   └─> retest_targets (insert for each student)
       └─> is_completed = FALSE
       └─> attempt_number = 0
   └─> test_results tables (update retest_assignment_id)

2. Student Takes Retest
   └─> test_attempts (insert attempt data)
   └─> retest_targets (update)
       └─> attempt_number += 1
       └─> Check: passed? OR attempts_exhausted?
       └─> If yes: is_completed = TRUE, completed_at = NOW()

3. Student Views Active Tests
   └─> student_active_tests_view (SQL query)
       └─> Filters: WHERE retest_targets.is_completed = FALSE
   └─> get-student-active-tests.js (API)
       └─> Double-check: if retest_is_completed, skip
   └─> Frontend (React)
       └─> Display tests with retest_is_completed = FALSE
```

---

## Important Notes

1. **Database is Single Source of Truth**: Completion status is stored in `retest_targets.is_completed`. localStorage/AsyncStorage is only used temporarily to prevent duplicate starts before page refresh.

2. **Denormalization**: `retest_targets.max_attempts` is denormalized from `retest_assignments.max_attempts` for faster queries without joins.

3. **Early Pass Logic**: If a student passes before exhausting attempts, `attempt_number` is set to `max_attempts` and `is_completed = TRUE` immediately.

4. **Multiple Filtering Layers**: Filtering occurs at three levels (SQL view, API function, frontend) for robustness, though the SQL view is the primary filter.

5. **Test Results Linkage**: All 8 test result tables have `retest_assignment_id` to link results back to retest assignments, enabling analytics and reporting.

---

## Related Files

- **Schema**: `database/database_schema_migration.sql`
- **View**: `database/views/student_active_tests_view.sql`
- **Creation**: `functions/create-retest-assignment.js`
- **Submission**: `functions/submit-*-test.js` (8 files)
- **Active Tests API**: `functions/get-student-active-tests.js`
- **Frontend**: `src/student/StudentCabinet.jsx`, `src/student/StudentTests.jsx`
- **Documentation**: `docs/retest-database-driven-implementation-plan.md`


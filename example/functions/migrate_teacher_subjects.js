const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function runMigration() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    
    console.log('🔄 Starting teacher_subjects migration...');
    
    // First, remove any existing duplicates (if any)
    console.log('🧹 Cleaning up any existing duplicates...');
    await sql`
      DELETE FROM teacher_subjects 
      WHERE id NOT IN (
          SELECT MIN(id) 
          FROM teacher_subjects 
          GROUP BY teacher_id, subject_id, grade, class
      )
    `;
    
    // Add the unique constraint
    console.log('🔧 Adding unique constraint...');
    await sql`
      ALTER TABLE teacher_subjects 
      ADD CONSTRAINT unique_teacher_subject_grade_class 
      UNIQUE (teacher_id, subject_id, grade, class)
    `;
    
    // Create an index for better performance
    console.log('📊 Creating performance index...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_teacher_subjects_unique_lookup 
      ON teacher_subjects (teacher_id, subject_id, grade, class)
    `;
    
    console.log('✅ Migration completed successfully');
    console.log('✅ Unique constraint added to teacher_subjects table');
    console.log('✅ Index created for better performance');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();

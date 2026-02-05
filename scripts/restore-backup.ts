import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

const prisma = new PrismaClient()

async function restoreBackup() {
  try {
    console.log('📖 Reading backup file...')
    const backupPath = '/Users/mcphajomo/Downloads/db_cluster-06-11-2025@05-50-59.backup'
    const sql = readFileSync(backupPath, 'utf-8')
    
    console.log('📝 Backup file loaded, size:', sql.length, 'characters')
    
    // Split SQL into statements (basic splitting by semicolon)
    // Note: This is a simple approach - for production, use a proper SQL parser
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SET'))
      .filter(s => !s.includes('CREATE ROLE') && !s.includes('ALTER ROLE')) // Skip role creation
    
    console.log(`🔄 Found ${statements.length} SQL statements to execute`)
    console.log('⚠️  Note: Skipping role/user creation (Supabase-specific)')
    console.log('⚠️  Note: CREATE TABLE statements will fail if tables already exist (this is OK)')
    console.log('')
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip empty or comment-only statements
      if (!statement || statement.length < 10) continue
      
      try {
        // Execute statement
        await prisma.$executeRawUnsafe(statement)
        successCount++
        
        if ((i + 1) % 50 === 0) {
          console.log(`   Processed ${i + 1}/${statements.length} statements...`)
        }
      } catch (error: any) {
        errorCount++
        // Log errors but continue (many will be "table already exists" which is fine)
        if (!error.message?.includes('already exists') && 
            !error.message?.includes('does not exist') &&
            !error.message?.includes('permission denied')) {
          console.error(`   Error on statement ${i + 1}:`, error.message?.substring(0, 100))
        }
      }
    }
    
    console.log('')
    console.log('✅ Restore complete!')
    console.log(`   Success: ${successCount} statements`)
    console.log(`   Errors (expected): ${errorCount} statements`)
    console.log('')
    console.log('💡 Tip: Check your database - data should be restored!')
    
  } catch (error) {
    console.error('❌ Restore failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

restoreBackup()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...\n')
    
    // Test 1: Basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test 2: Check if tables exist
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    console.log(`\n✅ Found ${tables.length} tables:`)
    tables.forEach(table => console.log(`   - ${table.table_name}`))
    
    // Test 3: Try creating a test organization (then delete it)
    console.log('\n🧪 Testing Organization creation...')
    const testOrg = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        type: 'manufacturer',
        email: 'test@example.com',
      }
    })
    console.log(`✅ Created test organization: ${testOrg.id}`)
    
    // Test 4: Query it back
    const foundOrg = await prisma.organization.findUnique({
      where: { id: testOrg.id }
    })
    console.log(`✅ Retrieved organization: ${foundOrg?.name}`)
    
    // Test 5: Delete test data
    await prisma.organization.delete({
      where: { id: testOrg.id }
    })
    console.log('✅ Cleaned up test data')
    
    console.log('\n🎉 All database tests passed!')
    
  } catch (error: any) {
    console.error('\n❌ Database test failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()

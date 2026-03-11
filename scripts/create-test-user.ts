import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    const email = 'test@example.com'
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      console.log(`✅ User ${email} already exists`)
      console.log(`   User ID: ${existing.id}`)
      return
    }

    // Create test user
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test User',
        role: null, // Regular user
      },
    })

    console.log(`✅ Created test user:`)
    console.log(`   Email: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Name: ${user.name}`)
    console.log('')
    console.log('⚠️  Note: You\'ll need to sign in with email magic link')
    console.log('   But since Resend isn\'t configured, you can use Prisma Studio')
    console.log('   to manually create a session, or we can set up a dev bypass')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()

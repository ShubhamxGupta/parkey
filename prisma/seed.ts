import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  // Create admin operator
  const hashedPassword = await hashPassword('admin123')
  await prisma.operator.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Admin Operator'
    }
  })

  // Create parking slots
  const slotTypes = ['Regular', 'Compact', 'EV', 'Handicap']
  const slotNumbers = []

  // Generate slot numbers
  for (let floor = 1; floor <= 3; floor++) {
    for (let section = 1; section <= 4; section++) {
      const sectionLetter = String.fromCharCode(64 + section) // A, B, C, D
      for (let slot = 1; slot <= 20; slot++) {
        slotNumbers.push(`${sectionLetter}${floor}-${slot.toString().padStart(2, '0')}`)
      }
    }
  }

  // Create slots with different types
  for (let i = 0; i < slotNumbers.length; i++) {
    const slotNumber = slotNumbers[i]
    let slotType = 'Regular'
    
    // Assign slot types based on position
    if (i % 10 === 0) slotType = 'Handicap' // Every 10th slot is handicap
    else if (i % 5 === 0) slotType = 'EV' // Every 5th slot is EV
    else if (i % 3 === 0) slotType = 'Compact' // Every 3rd slot is compact
    
    await prisma.parkingSlot.upsert({
      where: { slotNumber },
      update: {},
      create: {
        slotNumber,
        slotType: slotType as any,
        status: 'Available'
      }
    })
  }

  console.log('Database seeded successfully!')
  console.log('Admin credentials:')
  console.log('Username: admin')
  console.log('Password: admin123')
  console.log(`Created ${slotNumbers.length} parking slots`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { formatISTTime } from '@/lib/time-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slotType = searchParams.get('slotType')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let whereClause: any = {}

    if (slotType) {
      whereClause.slotType = slotType
    }

    if (status) {
      whereClause.status = status
    }

    const slots = await prisma.parkingSlot.findMany({
      where: whereClause,
      include: {
        parkingSessions: {
          where: {
            status: 'Active'
          },
          include: {
            vehicle: true
          }
        }
      },
      orderBy: {
        slotNumber: 'asc'
      }
    })

    // Filter by search if provided
    let filteredSlots = slots
    if (search) {
      filteredSlots = slots.filter(slot =>
        slot.slotNumber.toLowerCase().includes(search.toLowerCase()) ||
        slot.parkingSessions.some(session =>
          session.vehicle.numberPlate.toLowerCase().includes(search.toLowerCase())
        )
      )
    }

    // Convert times to IST for display
    const slotsWithIST = filteredSlots.map(slot => ({
      ...slot,
      parkingSessions: slot.parkingSessions.map(session => ({
        ...session,
        entryTime: formatISTTime(new Date(session.entryTime)),
        exitTime: session.exitTime ? formatISTTime(new Date(session.exitTime)) : null
      }))
    }))

    return NextResponse.json({ slots: slotsWithIST })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { slotId, status } = await request.json()

    if (!slotId || !status) {
      return NextResponse.json({ error: 'Slot ID and status are required' }, { status: 400 })
    }

    const updatedSlot = await prisma.parkingSlot.update({
      where: { id: slotId },
      data: { status },
      include: {
        parkingSessions: {
          where: {
            status: 'Active'
          },
          include: {
            vehicle: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      slot: {
        ...updatedSlot,
        parkingSessions: updatedSlot.parkingSessions.map(session => ({
          ...session,
          entryTime: formatISTTime(new Date(session.entryTime)),
          exitTime: session.exitTime ? formatISTTime(new Date(session.exitTime)) : null
        }))
      }
    })
  } catch (error) {
    console.error('Error updating slot status:', error)
    return NextResponse.json({ error: 'Failed to update slot status' }, { status: 500 })
  }
} 
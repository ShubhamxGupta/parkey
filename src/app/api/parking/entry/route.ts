import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { getDayPassAmount } from '@/lib/pricing'

export async function POST(request: NextRequest) {
  try {
    const { numberPlate, vehicleType, billingType, slotId, manualSlotSelection } = await request.json()

    if (!numberPlate || !vehicleType || !billingType) {
      return NextResponse.json({ error: 'Number plate, vehicle type, and billing type are required' }, { status: 400 })
    }

    // Check if vehicle already has an active session
    const existingSession = await prisma.parkingSession.findFirst({
      where: {
        vehicleNumberPlate: numberPlate,
        status: 'Active'
      }
    })

    if (existingSession) {
      return NextResponse.json({ error: 'Vehicle already has an active parking session' }, { status: 400 })
    }

    // Create or update vehicle
    await prisma.vehicle.upsert({
      where: { numberPlate },
      update: { vehicleType },
      create: {
        numberPlate,
        vehicleType
      }
    })

    let selectedSlotId = slotId

    // If manual slot selection is enabled, validate the selected slot
    if (manualSlotSelection && slotId) {
      const selectedSlot = await prisma.parkingSlot.findUnique({
        where: { id: slotId }
      })

      if (!selectedSlot) {
        return NextResponse.json({ error: 'Selected slot not found' }, { status: 404 })
      }

      if (selectedSlot.status !== 'Available') {
        return NextResponse.json({ error: 'Selected slot is not available' }, { status: 400 })
      }

      // Check vehicle-slot compatibility
      const isCompatible = checkVehicleSlotCompatibility(vehicleType, selectedSlot.slotType)
      if (!isCompatible) {
        return NextResponse.json({ 
          error: `${vehicleType} cannot be parked in ${selectedSlot.slotType} slot` 
        }, { status: 400 })
      }
    } else {
      // Automatic slot assignment
      selectedSlotId = await findBestAvailableSlot(vehicleType)
      
      if (!selectedSlotId) {
        return NextResponse.json({ error: 'No suitable parking slot available' }, { status: 400 })
      }
    }

    // Create parking session
    const session = await prisma.parkingSession.create({
      data: {
        vehicleNumberPlate: numberPlate,
        slotId: selectedSlotId,
        billingType,
        billingAmount: billingType === 'DayPass' ? 150 : null
      },
      include: {
        vehicle: true,
        slot: true
      }
    })

    // Update slot status to occupied
    await prisma.parkingSlot.update({
      where: { id: selectedSlotId },
      data: { status: 'Occupied' }
    })

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        entryTime: session.entryTime.toISOString()
      }
    })

  } catch (error) {
    console.error('Entry error:', error)
    return NextResponse.json({ error: 'Failed to record entry' }, { status: 500 })
  }
}

function checkVehicleSlotCompatibility(vehicleType: string, slotType: string): boolean {
  switch (vehicleType) {
    case 'Car':
      return slotType === 'Regular' || slotType === 'Compact'
    case 'Bike':
      return slotType === 'Compact'
    case 'EV':
      return slotType === 'EV'
    case 'Handicap':
      return slotType === 'Handicap'
    default:
      return false
  }
}

async function findBestAvailableSlot(vehicleType: string): Promise<string | null> {
  let slotTypes: string[] = []

  // Determine compatible slot types for the vehicle
  switch (vehicleType) {
    case 'Car':
      slotTypes = ['Regular', 'Compact']
      break
    case 'Bike':
      slotTypes = ['Compact']
      break
    case 'EV':
      slotTypes = ['EV']
      break
    case 'Handicap':
      slotTypes = ['Handicap']
      break
    default:
      return null
  }

  // Find the best available slot (prioritize by slot type order)
  for (const slotType of slotTypes) {
    const availableSlot = await prisma.parkingSlot.findFirst({
      where: {
        slotType,
        status: 'Available'
      },
      orderBy: {
        slotNumber: 'asc'
      }
    })

    if (availableSlot) {
      return availableSlot.id
    }
  }

  return null
} 
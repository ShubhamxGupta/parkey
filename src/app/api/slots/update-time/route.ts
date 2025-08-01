import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateHourlyBilling } from '@/lib/pricing'

export async function PATCH(request: NextRequest) {
  try {
    const { slotId, newEntryTime, newExitTime } = await request.json()

    if (!slotId) {
      return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 })
    }

    // Find the active session for this slot
    const activeSession = await prisma.parkingSession.findFirst({
      where: {
        slotId: slotId,
        status: 'Active'
      },
      include: {
        vehicle: true,
        slot: true
      }
    })

    if (!activeSession) {
      return NextResponse.json({ error: 'No active session found for this slot' }, { status: 404 })
    }

    // Convert times to IST if they're provided
    let entryTime = activeSession.entryTime
    let exitTime = activeSession.exitTime

    if (newEntryTime) {
      // Convert to IST (UTC+5:30)
      const entryDate = new Date(newEntryTime)
      entryDate.setHours(entryDate.getHours() + 5)
      entryDate.setMinutes(entryDate.getMinutes() + 30)
      entryTime = entryDate
    }

    if (newExitTime) {
      // Convert to IST (UTC+5:30)
      const exitDate = new Date(newExitTime)
      exitDate.setHours(exitDate.getHours() + 5)
      exitDate.setMinutes(exitDate.getMinutes() + 30)
      exitTime = exitDate
    }

    // Calculate new billing amount if exit time is provided
    let billingAmount = activeSession.billingAmount
    if (newExitTime && activeSession.billingType === 'Hourly') {
      billingAmount = calculateHourlyBilling(entryTime, exitTime)
    }

    // Update the session
    const updatedSession = await prisma.parkingSession.update({
      where: {
        id: activeSession.id
      },
      data: {
        entryTime: entryTime,
        exitTime: exitTime,
        billingAmount: billingAmount,
        status: exitTime ? 'Completed' : 'Active'
      },
      include: {
        vehicle: true,
        slot: true
      }
    })

    // Update slot status if session is completed
    if (exitTime) {
      await prisma.parkingSlot.update({
        where: {
          id: slotId
        },
        data: {
          status: 'Available'
        }
      })
    }

    return NextResponse.json({
      success: true,
      session: {
        ...updatedSession,
        entryTime: updatedSession.entryTime.toISOString(),
        exitTime: updatedSession.exitTime?.toISOString() || null
      }
    })

  } catch (error) {
    console.error('Error updating slot time:', error)
    return NextResponse.json({ error: 'Failed to update slot time' }, { status: 500 })
  }
} 
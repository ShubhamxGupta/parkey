-- CreateEnum
CREATE TYPE "public"."VehicleType" AS ENUM ('Car', 'Bike', 'EV', 'Handicap');

-- CreateEnum
CREATE TYPE "public"."SlotType" AS ENUM ('Regular', 'Compact', 'EV', 'Handicap');

-- CreateEnum
CREATE TYPE "public"."SlotStatus" AS ENUM ('Available', 'Occupied', 'Maintenance');

-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('Active', 'Completed');

-- CreateEnum
CREATE TYPE "public"."BillingType" AS ENUM ('Hourly', 'DayPass');

-- CreateTable
CREATE TABLE "public"."vehicles" (
    "id" TEXT NOT NULL,
    "numberPlate" TEXT NOT NULL,
    "vehicleType" "public"."VehicleType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parking_slots" (
    "id" TEXT NOT NULL,
    "slotNumber" TEXT NOT NULL,
    "slotType" "public"."SlotType" NOT NULL,
    "status" "public"."SlotStatus" NOT NULL DEFAULT 'Available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parking_sessions" (
    "id" TEXT NOT NULL,
    "vehicleNumberPlate" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitTime" TIMESTAMP(3),
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'Active',
    "billingType" "public"."BillingType" NOT NULL,
    "billingAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."operators" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_numberPlate_key" ON "public"."vehicles"("numberPlate");

-- CreateIndex
CREATE UNIQUE INDEX "parking_slots_slotNumber_key" ON "public"."parking_slots"("slotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "operators_username_key" ON "public"."operators"("username");

-- AddForeignKey
ALTER TABLE "public"."parking_sessions" ADD CONSTRAINT "parking_sessions_vehicleNumberPlate_fkey" FOREIGN KEY ("vehicleNumberPlate") REFERENCES "public"."vehicles"("numberPlate") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parking_sessions" ADD CONSTRAINT "parking_sessions_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "public"."parking_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

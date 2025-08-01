import { differenceInHours, differenceInMinutes } from "date-fns";

export enum BillingType {
    Hourly = "Hourly",
    DayPass = "DayPass",
}

export function calculateHourlyBilling(
    entryTime: Date,
    exitTime: Date
): number {
    const totalMinutes = differenceInMinutes(exitTime, entryTime);
    const totalHours = Math.ceil(totalMinutes / 60);

    if (totalHours <= 1) return 50;
    if (totalHours <= 3) return 100;
    if (totalHours <= 6) return 150;
    return 200; // Cap at 6+ hours
}

export function getDayPassAmount(): number {
    return 150;
}

export function isOverstay(entryTime: Date, exitTime: Date): boolean {
    const hours = differenceInHours(exitTime, entryTime);
    return hours > 6;
}

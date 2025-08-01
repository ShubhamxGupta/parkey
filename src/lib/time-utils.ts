export function convertToIST(date: Date): Date {
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    return new Date(date.getTime() + istOffset);
}

export function convertFromIST(date: Date): Date {
    // Convert from IST to UTC
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(date.getTime() - istOffset);
}

export function formatISTTime(date: Date): string {
    return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}

export function formatISTDate(date: Date): string {
    return date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}

export function getCurrentIST(): Date {
    return convertToIST(new Date());
}

export function parseISTDateTime(dateTimeString: string): Date {
    // Parse date time string in IST format
    const date = new Date(dateTimeString);
    return convertToIST(date);
}

export function parseISTTimeString(timeString: string): Date {
    // Parse IST time string in format "DD/MM/YYYY, HH:MM:SS"
    const parts = timeString.split(", ");
    if (parts.length !== 2) {
        throw new Error("Invalid IST time format");
    }

    const datePart = parts[0]; // "DD/MM/YYYY"
    const timePart = parts[1]; // "HH:MM:SS"

    const dateParts = datePart.split("/");
    const timeParts = timePart.split(":");

    if (dateParts.length !== 3 || timeParts.length !== 3) {
        throw new Error("Invalid IST time format");
    }

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(dateParts[2], 10);
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    const second = parseInt(timeParts[2], 10);

    // Create date in IST timezone
    const date = new Date(year, month, day, hour, minute, second);

    // Convert to UTC (subtract IST offset)
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(date.getTime() - istOffset);
}

export function getCurrentISTTime(): Date {
    return new Date();
}

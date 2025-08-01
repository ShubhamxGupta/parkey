"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Car,
    Clock1,
    Bike,
    Zap,
    Accessibility,
    LogOut,
    Plus,
    Minus,
    Settings,
    TrendingUp,
    Clock,
    AlertTriangle,
    CheckCircle,
    Edit,
    Calendar,
    X,
    MapPin,
    Activity,
    Users,
    DollarSign,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
    Gauge,
} from "lucide-react";
import {
    formatISTTime,
    parseISTTimeString,
    getCurrentISTTime,
} from "@/lib/time-utils";
import {
    getOvertimeVehicles,
    showOvertimeNotification,
    addOvertimeStyles,
    type OvertimeVehicle,
} from "@/lib/overtime-monitor";

interface DashboardStats {
    totalSlots: number;
    availableSlots: number;
    occupiedSlots: number;
    maintenanceSlots: number;
    activeSessions: number;
}

interface Revenue {
    today: number;
    hourly: number;
    dayPass: number;
}

interface ParkingSlot {
    id: string;
    slotNumber: string;
    slotType: string;
    status: string;
    parkingSessions: Array<{
        id: string;
        entryTime: string;
        exitTime?: string;
        billingAmount?: number;
        billingType: string;
        vehicle: {
            numberPlate: string;
            type: string;
        };
    }>;
}

export default function Dashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [revenue, setRevenue] = useState<Revenue | null>(null);
    const [slots, setSlots] = useState<ParkingSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [operatorName, setOperatorName] = useState("Operator");

    // Entry form state
    const [entryForm, setEntryForm] = useState({
        numberPlate: "",
        vehicleType: "Car",
        billingType: "Hourly",
        slotId: "",
        manualSlotSelection: false,
    });

    // Exit form state
    const [exitForm, setExitForm] = useState({
        numberPlate: "",
    });

    // Filters
    const [filters, setFilters] = useState({
        slotType: "",
        status: "",
        search: "",
    });

    // Time editing modal state
    const [timeEditModal, setTimeEditModal] = useState({
        isOpen: false,
        slotId: "",
        slotNumber: "",
        currentEntryTime: "",
        currentExitTime: "",
        newEntryTime: "",
        newExitTime: "",
        vehicleInfo: null as any,
    });

    // Overtime monitoring state
    const [overtimeVehicles, setOvertimeVehicles] = useState<OvertimeVehicle[]>(
        []
    );
    const [lastOvertimeCheck, setLastOvertimeCheck] = useState<Date>(
        new Date()
    );

    useEffect(() => {
        loadDashboardData();
        checkAuth();
        addOvertimeStyles();
    }, []);

    // Overtime monitoring effect
    useEffect(() => {
        const checkOvertimeVehicles = async () => {
            try {
                const response = await fetch("/api/slots");
                if (response.ok) {
                    const data = await response.json();
                    const currentOvertimeVehicles = getOvertimeVehicles(
                        data.slots
                    );

                    // Check for new overtime vehicles
                    const newOvertimeVehicles = currentOvertimeVehicles.filter(
                        (current) =>
                            !overtimeVehicles.some(
                                (existing) => existing.slotId === current.slotId
                            )
                    );

                    if (newOvertimeVehicles.length > 0) {
                        showOvertimeNotification(newOvertimeVehicles);
                    }

                    setOvertimeVehicles(currentOvertimeVehicles);
                    setLastOvertimeCheck(new Date());
                }
            } catch (error) {
                console.error("Error checking overtime vehicles:", error);
            }
        };

        // Initial check
        checkOvertimeVehicles();

        // Set up interval to check every 5 minutes (300000ms)
        const interval = setInterval(checkOvertimeVehicles, 300000);

        return () => clearInterval(interval);
    }, [overtimeVehicles]);

    // Update overtime vehicles when slots change
    useEffect(() => {
        if (slots.length > 0) {
            const currentOvertimeVehicles = getOvertimeVehicles(slots);
            setOvertimeVehicles(currentOvertimeVehicles);
        }
    }, [slots]);

    const checkAuth = async () => {
        try {
            const response = await fetch("/api/auth/check");
            if (!response.ok) {
                router.push("/");
            }
        } catch (error) {
            router.push("/");
        }
    };

    const loadDashboardData = async () => {
        try {
            const [statsResponse, slotsResponse] = await Promise.all([
                fetch("/api/dashboard/stats"),
                fetch("/api/slots"),
            ]);

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData.stats);
                setRevenue(statsData.revenue);
            }

            if (slotsResponse.ok) {
                const slotsData = await slotsResponse.json();
                setSlots(slotsData.slots);
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/parking/entry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(entryForm),
            });

            if (response.ok) {
                setEntryForm({
                    numberPlate: "",
                    vehicleType: "Car",
                    billingType: "Hourly",
                    slotId: "",
                    manualSlotSelection: false,
                });
                loadDashboardData();
                showNotification(
                    "Vehicle entry recorded successfully!",
                    "success"
                );
            } else {
                const data = await response.json();
                showNotification(data.error || "Entry failed", "error");
            }
        } catch (error) {
            showNotification("Network error", "error");
        }
    };

    const handleExit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/parking/exit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(exitForm),
            });

            if (response.ok) {
                const data = await response.json();
                setExitForm({ numberPlate: "" });
                loadDashboardData();
                showNotification(
                    `Exit processed! Amount: ₹${data.receipt.amount}`,
                    "success"
                );
            } else {
                const data = await response.json();
                showNotification(data.error || "Exit failed", "error");
            }
        } catch (error) {
            showNotification("Network error", "error");
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const updateSlotStatus = async (slotId: string, status: string) => {
        try {
            const response = await fetch("/api/slots", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slotId, status }),
            });

            if (response.ok) {
                loadDashboardData();
                showNotification(
                    "Slot status updated successfully!",
                    "success"
                );
            }
        } catch (error) {
            console.error("Error updating slot status:", error);
            showNotification("Failed to update slot status", "error");
        }
    };

    const openTimeEditModal = (slot: ParkingSlot) => {
        const activeSession = slot.parkingSessions[0];
        if (activeSession) {
            setTimeEditModal({
                isOpen: true,
                slotId: slot.id,
                slotNumber: slot.slotNumber,
                currentEntryTime: formatISTTime(
                    new Date(activeSession.entryTime)
                ),
                currentExitTime: activeSession.exitTime
                    ? formatISTTime(new Date(activeSession.exitTime))
                    : "",
                newEntryTime: formatISTTime(new Date(activeSession.entryTime)),
                newExitTime: activeSession.exitTime
                    ? formatISTTime(new Date(activeSession.exitTime))
                    : "",
                vehicleInfo: activeSession.vehicle,
            });
        }
    };

    function convertISTToGMT(istTimeStr: string): string {
        const istDate = new Date(istTimeStr);
        istDate.setHours(istDate.getHours() - 5);
        istDate.setMinutes(istDate.getMinutes() - 30);
        return istDate.toISOString(); // returns UTC string
    }

    const handleTimeUpdate = async () => {
        try {
            const entryTimeGMT = convertISTToGMT(timeEditModal.newEntryTime);
            const exitTimeGMT = timeEditModal.newExitTime
                ? convertISTToGMT(timeEditModal.newExitTime)
                : null;

            const response = await fetch("/api/slots/update-time", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slotId: timeEditModal.slotId,
                    newEntryTime: entryTimeGMT,
                    newExitTime: exitTimeGMT,
                }),
            });

            if (response.ok) {
                setTimeEditModal({ ...timeEditModal, isOpen: false });
                loadDashboardData();
                showNotification("Slot time updated successfully!", "success");
            } else {
                const data = await response.json();
                showNotification(
                    data.error || "Failed to update time",
                    "error"
                );
            }
        } catch (error) {
            showNotification("Network error", "error");
        }
    };

    const showNotification = (message: string, type: "success" | "error") => {
        // Create notification element
        const notification = document.createElement("div");
        notification.className = `fixed top-6 right-6 p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 max-w-sm ${
            type === "success"
                ? "bg-white border-l-4 border-emerald-500 text-gray-900"
                : "bg-white border-l-4 border-red-500 text-gray-900"
        }`;
        notification.innerHTML = `
      <div class="flex items-center">
        <div class="flex-shrink-0">
          ${
              type === "success"
                  ? '<div class="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center"><svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg></div>'
                  : '<div class="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center"><svg class="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg></div>'
          }
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">${message}</p>
        </div>
      </div>
    `;
        document.body.appendChild(notification);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.remove();
        }, 4000);
    };

    const getVehicleIcon = (type: string) => {
        switch (type) {
            case "Car":
                return <Car className="h-4 w-4" />;
            case "Bike":
                return <Bike className="h-4 w-4" />;
            case "EV":
                return <Zap className="h-4 w-4" />;
            case "Handicap":
                return <Accessibility className="h-4 w-4" />;
            default:
                return <Car className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Available":
                return "bg-emerald-50 text-emerald-700 border border-emerald-200";
            case "Occupied":
                return "bg-red-50 text-red-700 border border-red-200";
            case "Maintenance":
                return "bg-amber-50 text-amber-700 border border-amber-200";
            default:
                return "bg-gray-50 text-gray-700 border border-gray-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Available":
                return <CheckCircle className="h-4 w-4" />;
            case "Occupied":
                return <Clock className="h-4 w-4" />;
            case "Maintenance":
                return <AlertTriangle className="h-4 w-4" />;
            default:
                return <Settings className="h-4 w-4" />;
        }
    };

    // Get available slots for manual selection
    const getAvailableSlots = () => {
        return slots.filter((slot) => slot.status === "Available");
    };

    // Get compatible slots based on vehicle type
    const getCompatibleSlots = (vehicleType: string) => {
        const availableSlots = getAvailableSlots();

        switch (vehicleType) {
            case "Car":
                return availableSlots.filter(
                    (slot) =>
                        slot.slotType === "Regular" ||
                        slot.slotType === "Compact"
                );
            case "Bike":
                return availableSlots.filter(
                    (slot) => slot.slotType === "Compact"
                );
            case "EV":
                return availableSlots.filter((slot) => slot.slotType === "EV");
            case "Handicap":
                return availableSlots.filter(
                    (slot) => slot.slotType === "Handicap"
                );
            default:
                return availableSlots;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600 font-medium">
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                <Building2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    Parkey
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Welcome back, {operatorName}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Overtime monitoring status */}
                            <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                                <Activity className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    {overtimeVehicles.length} overtime
                                </span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                    Total Slots
                                </p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {stats?.totalSlots}
                                </p>
                                <div className="flex items-center mt-2 text-gray-500">
                                    <Gauge className="h-4 w-4 mr-1" />
                                    <span className="text-sm">Capacity</span>
                                </div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                    Available
                                </p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {stats?.availableSlots}
                                </p>
                                <div className="flex items-center mt-2 text-emerald-600">
                                    <ArrowUpRight className="h-4 w-4 mr-1" />
                                    <span className="text-sm font-medium">
                                        Ready
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                    Occupied
                                </p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {stats?.occupiedSlots}
                                </p>
                                <div className="flex items-center mt-2 text-red-600">
                                    <ArrowDownRight className="h-4 w-4 mr-1" />
                                    <span className="text-sm font-medium">
                                        In Use
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                                <Clock className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                    Maintenance
                                </p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {stats?.maintenanceSlots}
                                </p>
                                <div className="flex items-center mt-2 text-amber-600">
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    <span className="text-sm font-medium">
                                        Under Repair
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-lg">
                                <Settings className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Card */}
                {revenue && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                        <div className="flex items-center mb-6">
                            <div className="p-3 bg-emerald-50 rounded-lg mr-4">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Today's Revenue
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Real-time financial overview
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                <DollarSign className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 mb-1">
                                    Total Revenue
                                </p>
                                <p className="text-2xl font-semibold text-emerald-600">
                                    ₹{revenue.today}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <Activity className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 mb-1">
                                    Hourly Revenue
                                </p>
                                <p className="text-2xl font-semibold text-blue-600">
                                    ₹{revenue.hourly}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                <Users className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 mb-1">
                                    Day Pass Revenue
                                </p>
                                <p className="text-2xl font-semibold text-indigo-600">
                                    ₹{revenue.dayPass}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            {[
                                {
                                    id: "overview",
                                    name: "Overview",
                                    icon: <BarChart3 className="h-4 w-4" />,
                                },
                                {
                                    id: "entry",
                                    name: "Vehicle Entry",
                                    icon: <Plus className="h-4 w-4" />,
                                },
                                {
                                    id: "exit",
                                    name: "Vehicle Exit",
                                    icon: <Minus className="h-4 w-4" />,
                                },
                                {
                                    id: "slots",
                                    name: "Slot Management",
                                    icon: <Settings className="h-4 w-4" />,
                                },
                                {
                                    id: "overtime",
                                    name: "OverTime",
                                    icon: <Clock1 className="h-4 w-4" />,
                                },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                                        activeTab === tab.id
                                            ? "border-blue-500 text-blue-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}>
                                    {tab.icon}
                                    <span>{tab.name}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Active Sessions
                                    </h3>
                                    <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                                        <Activity className="h-4 w-4" />
                                        <span className="text-sm font-medium">
                                            {
                                                slots.filter(
                                                    (slot) =>
                                                        slot.status ===
                                                        "Occupied"
                                                ).length
                                            }{" "}
                                            active vehicles
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {slots
                                        .filter(
                                            (slot) => slot.status === "Occupied"
                                        )
                                        .map((slot) => (
                                            <div
                                                key={slot.id}
                                                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-gray-900">
                                                            {slot.slotNumber}
                                                        </h4>
                                                        <p className="text-sm text-gray-500">
                                                            {slot.slotType}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`px-3 py-1 text-xs font-medium rounded-full flex items-center ${getStatusColor(
                                                            slot.status
                                                        )}`}>
                                                        {getStatusIcon(
                                                            slot.status
                                                        )}
                                                        <span className="ml-1">
                                                            {slot.status}
                                                        </span>
                                                    </span>
                                                </div>

                                                {slot.parkingSessions[0] && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                                                {getVehicleIcon(
                                                                    slot
                                                                        .parkingSessions[0]
                                                                        .vehicle
                                                                        .type
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {
                                                                        slot
                                                                            .parkingSessions[0]
                                                                            .vehicle
                                                                            .numberPlate
                                                                    }
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    {
                                                                        slot
                                                                            .parkingSessions[0]
                                                                            .vehicle
                                                                            .type
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="text-sm text-gray-600 space-y-2">
                                                            <div className="flex items-center">
                                                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                                                <span className="font-medium">
                                                                    Entry:
                                                                </span>
                                                                <span className="ml-2">
                                                                    {formatISTTime(
                                                                        new Date(
                                                                            slot.parkingSessions[0].entryTime
                                                                        )
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {slot
                                                                .parkingSessions[0]
                                                                .exitTime && (
                                                                <div className="flex items-center">
                                                                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                                                    <span className="font-medium">
                                                                        Exit:
                                                                    </span>
                                                                    <span className="ml-2">
                                                                        {formatISTTime(
                                                                            new Date(
                                                                                slot.parkingSessions[0].exitTime
                                                                            )
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button
                                                            onClick={() =>
                                                                openTimeEditModal(
                                                                    slot
                                                                )
                                                            }
                                                            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit Time
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Entry Tab */}
                        {activeTab === "entry" && (
                            <div className="max-w-2xl">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                                    Vehicle Entry
                                </h3>
                                <form
                                    onSubmit={handleEntry}
                                    className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Number Plate
                                        </label>
                                        <input
                                            type="text"
                                            value={entryForm.numberPlate}
                                            onChange={(e) =>
                                                setEntryForm({
                                                    ...entryForm,
                                                    numberPlate: e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                                            placeholder="Enter vehicle number plate"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Vehicle Type
                                        </label>
                                        <select
                                            value={entryForm.vehicleType}
                                            onChange={(e) =>
                                                setEntryForm({
                                                    ...entryForm,
                                                    vehicleType: e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                                            <option value="Car">Car</option>
                                            <option value="Bike">Bike</option>
                                            <option value="EV">EV</option>
                                            <option value="Handicap">
                                                Handicap
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Billing Type
                                        </label>
                                        <select
                                            value={entryForm.billingType}
                                            onChange={(e) =>
                                                setEntryForm({
                                                    ...entryForm,
                                                    billingType: e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                                            <option value="Hourly">
                                                Hourly
                                            </option>
                                            <option value="DayPass">
                                                Day Pass (₹150)
                                            </option>
                                        </select>
                                    </div>

                                    {/* Manual Slot Selection */}
                                    <div className="space-y-4">
                                        <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <input
                                                type="checkbox"
                                                id="manualSlotSelection"
                                                checked={
                                                    entryForm.manualSlotSelection
                                                }
                                                onChange={(e) =>
                                                    setEntryForm({
                                                        ...entryForm,
                                                        manualSlotSelection:
                                                            e.target.checked,
                                                        slotId: "",
                                                    })
                                                }
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label
                                                htmlFor="manualSlotSelection"
                                                className="ml-3 block text-sm font-medium text-gray-700">
                                                Manually select parking slot
                                            </label>
                                        </div>

                                        {entryForm.manualSlotSelection && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Select Parking Slot
                                                </label>
                                                <select
                                                    value={entryForm.slotId}
                                                    onChange={(e) =>
                                                        setEntryForm({
                                                            ...entryForm,
                                                            slotId: e.target
                                                                .value,
                                                        })
                                                    }
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                                    required={
                                                        entryForm.manualSlotSelection
                                                    }>
                                                    <option value="">
                                                        Choose a slot...
                                                    </option>
                                                    {getCompatibleSlots(
                                                        entryForm.vehicleType
                                                    ).map((slot) => (
                                                        <option
                                                            key={slot.id}
                                                            value={slot.id}>
                                                            {slot.slotNumber} (
                                                            {slot.slotType})
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="mt-2 text-sm text-blue-600">
                                                    Available compatible slots
                                                    for {entryForm.vehicleType}:{" "}
                                                    {
                                                        getCompatibleSlots(
                                                            entryForm.vehicleType
                                                        ).length
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        {!entryForm.manualSlotSelection && (
                                            <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <MapPin className="h-4 w-4 text-gray-500 mr-3" />
                                                <span className="text-sm text-gray-600">
                                                    Automatic slot assignment
                                                    will be used
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Record Entry
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Exit Tab */}
                        {activeTab === "exit" && (
                            <div className="max-w-2xl">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                                    Vehicle Exit
                                </h3>
                                <form
                                    onSubmit={handleExit}
                                    className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Number Plate
                                        </label>
                                        <input
                                            type="text"
                                            value={exitForm.numberPlate}
                                            onChange={(e) =>
                                                setExitForm({
                                                    ...exitForm,
                                                    numberPlate: e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-500"
                                            placeholder="Enter vehicle number plate"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200">
                                        <Minus className="h-4 w-4 mr-2" />
                                        Process Exit
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Slots Tab */}
                        {activeTab === "slots" && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Slot Management
                                    </h3>
                                    <div className="flex space-x-3">
                                        <select
                                            value={filters.slotType}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    slotType: e.target.value,
                                                })
                                            }
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">All Types</option>
                                            <option value="Regular">
                                                Regular
                                            </option>
                                            <option value="Compact">
                                                Compact
                                            </option>
                                            <option value="EV">EV</option>
                                            <option value="Handicap">
                                                Handicap
                                            </option>
                                        </select>
                                        <select
                                            value={filters.status}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    status: e.target.value,
                                                })
                                            }
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">All Status</option>
                                            <option value="Available">
                                                Available
                                            </option>
                                            <option value="Occupied">
                                                Occupied
                                            </option>
                                            <option value="Maintenance">
                                                Maintenance
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {slots
                                        .filter(
                                            (slot) =>
                                                (!filters.slotType ||
                                                    slot.slotType ===
                                                        filters.slotType) &&
                                                (!filters.status ||
                                                    slot.status ===
                                                        filters.status)
                                        )
                                        .map((slot) => (
                                            <div
                                                key={slot.id}
                                                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-lg font-semibold text-gray-900">
                                                        {slot.slotNumber}
                                                    </h4>
                                                    <span
                                                        className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${getStatusColor(
                                                            slot.status
                                                        )}`}>
                                                        {getStatusIcon(
                                                            slot.status
                                                        )}
                                                        <span className="ml-1">
                                                            {slot.status}
                                                        </span>
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-4">
                                                    {slot.slotType}
                                                </p>

                                                {slot.parkingSessions[0] && (
                                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                        <div className="flex items-center">
                                                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                                                {getVehicleIcon(
                                                                    slot
                                                                        .parkingSessions[0]
                                                                        .vehicle
                                                                        .type
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {
                                                                        slot
                                                                            .parkingSessions[0]
                                                                            .vehicle
                                                                            .numberPlate
                                                                    }
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    {
                                                                        slot
                                                                            .parkingSessions[0]
                                                                            .vehicle
                                                                            .type
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                                                            <p>
                                                                Entry:{" "}
                                                                {formatISTTime(
                                                                    new Date(
                                                                        slot.parkingSessions[0].entryTime
                                                                    )
                                                                )}
                                                            </p>
                                                            {slot
                                                                .parkingSessions[0]
                                                                .exitTime && (
                                                                <p>
                                                                    Exit:{" "}
                                                                    {formatISTTime(
                                                                        new Date(
                                                                            slot.parkingSessions[0].exitTime
                                                                        )
                                                                    )}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex space-x-2">
                                                    {slot.status ===
                                                        "Available" && (
                                                        <button
                                                            onClick={() =>
                                                                updateSlotStatus(
                                                                    slot.id,
                                                                    "Maintenance"
                                                                )
                                                            }
                                                            className="flex-1 px-3 py-2 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200">
                                                            Maintenance
                                                        </button>
                                                    )}
                                                    {slot.status ===
                                                        "Maintenance" && (
                                                        <button
                                                            onClick={() =>
                                                                updateSlotStatus(
                                                                    slot.id,
                                                                    "Available"
                                                                )
                                                            }
                                                            className="flex-1 px-3 py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200">
                                                            Available
                                                        </button>
                                                    )}
                                                    {slot.status ===
                                                        "Occupied" && (
                                                        <button
                                                            onClick={() =>
                                                                openTimeEditModal(
                                                                    slot
                                                                )
                                                            }
                                                            className="flex-1 px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                                                            Edit Time
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                        {/* Overtime Tab */}
                        {activeTab === "overtime" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Overtime Vehicles
                                    </h3>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                                {overtimeVehicles.length}{" "}
                                                overtime vehicles
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const currentOvertimeVehicles =
                                                    getOvertimeVehicles(slots);
                                                if (
                                                    currentOvertimeVehicles.length >
                                                    0
                                                ) {
                                                    showOvertimeNotification(
                                                        currentOvertimeVehicles
                                                    );
                                                }
                                                setOvertimeVehicles(
                                                    currentOvertimeVehicles
                                                );
                                            }}
                                            className="flex items-center px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                                            <Activity className="h-4 w-4 mr-2" />
                                            Check Now
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {overtimeVehicles.map((overtimeVehicle) => {
                                        const slot = slots.find(
                                            (s) =>
                                                s.id === overtimeVehicle.slotId
                                        );
                                        if (!slot) return null;

                                        const session = slot.parkingSessions[0];

                                        return (
                                            <div
                                                key={slot.id}
                                                className="bg-white rounded-lg border border-amber-200 p-6 hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-gray-900">
                                                            {slot.slotNumber}
                                                        </h4>
                                                        <p className="text-sm text-gray-500">
                                                            {slot.slotType}
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 text-xs font-medium rounded-full flex items-center bg-amber-50 text-amber-700 border border-amber-200">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        <span className="ml-1">
                                                            Overtime
                                                        </span>
                                                    </span>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                                                        <div className="p-2 bg-amber-100 rounded-lg mr-3">
                                                            {getVehicleIcon(
                                                                session.vehicle
                                                                    .type
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {
                                                                    session
                                                                        .vehicle
                                                                        .numberPlate
                                                                }
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {
                                                                    session
                                                                        .vehicle
                                                                        .type
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="text-sm text-gray-600 space-y-2">
                                                        <div className="flex items-center">
                                                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                                            <span className="font-medium">
                                                                Entry:
                                                            </span>
                                                            <span className="ml-2">
                                                                {formatISTTime(
                                                                    new Date(
                                                                        session.entryTime
                                                                    )
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Clock1 className="h-4 w-4 mr-2 text-amber-500" />
                                                            <span className="font-medium">
                                                                Hours Parked:
                                                            </span>
                                                            <span className="ml-2 text-amber-600 font-semibold">
                                                                {overtimeVehicle.hoursParked.toFixed(
                                                                    1
                                                                )}{" "}
                                                                hours
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                                                            <span className="font-medium">
                                                                Overtime:
                                                            </span>
                                                            <span className="ml-2 text-red-600 font-semibold">
                                                                {overtimeVehicle.overtimeHours.toFixed(
                                                                    1
                                                                )}{" "}
                                                                hours
                                                            </span>
                                                        </div>
                                                        {session.billingType ===
                                                            "Hourly" && (
                                                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                                                <p className="text-sm text-red-700 font-medium">
                                                                    ⚠️ Vehicle
                                                                    has exceeded
                                                                    6-hour limit
                                                                </p>
                                                                <p className="text-xs text-red-600 mt-1">
                                                                    Standard
                                                                    hourly
                                                                    billing
                                                                    applies
                                                                </p>
                                                            </div>
                                                        )}
                                                        {session.billingType ===
                                                            "DayPass" && (
                                                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                                                <p className="text-sm text-red-700 font-medium">
                                                                    ⚠️ Day pass
                                                                    expired
                                                                    (next day)
                                                                </p>
                                                                <p className="text-xs text-red-600 mt-1">
                                                                    Additional
                                                                    charges may
                                                                    apply
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() =>
                                                            openTimeEditModal(
                                                                slot
                                                            )
                                                        }
                                                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200">
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit Time
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Time Edit Modal */}
            {timeEditModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Edit Slot Time
                            </h3>
                            <button
                                onClick={() =>
                                    setTimeEditModal({
                                        ...timeEditModal,
                                        isOpen: false,
                                    })
                                }
                                className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                    Slot: {timeEditModal.slotNumber}
                                </p>
                                {timeEditModal.vehicleInfo && (
                                    <p className="text-sm text-gray-600">
                                        Vehicle:{" "}
                                        {timeEditModal.vehicleInfo.numberPlate}{" "}
                                        ({timeEditModal.vehicleInfo.type})
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Entry Time (IST)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={timeEditModal.newEntryTime.replace(
                                        " ",
                                        "T"
                                    )}
                                    onChange={(e) =>
                                        setTimeEditModal({
                                            ...timeEditModal,
                                            newEntryTime:
                                                e.target.value.replace(
                                                    "T",
                                                    " "
                                                ),
                                        })
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Exit Time (IST) - Optional
                                </label>
                                <input
                                    type="datetime-local"
                                    value={
                                        timeEditModal.newExitTime
                                            ? timeEditModal.newExitTime.replace(
                                                  " ",
                                                  "T"
                                              )
                                            : ""
                                    }
                                    onChange={(e) =>
                                        setTimeEditModal({
                                            ...timeEditModal,
                                            newExitTime: e.target.value
                                                ? e.target.value.replace(
                                                      "T",
                                                      " "
                                                  )
                                                : "",
                                        })
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={() =>
                                        setTimeEditModal({
                                            ...timeEditModal,
                                            isOpen: false,
                                        })
                                    }
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleTimeUpdate}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                                    Update Time
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Car,
    Bike,
    Zap,
    Accessibility,
    LogOut,
    Plus,
    Minus,
    Settings,
    TrendingUp,
} from "lucide-react";

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

    // Entry form state
    const [entryForm, setEntryForm] = useState({
        numberPlate: "",
        vehicleType: "Car",
        billingType: "Hourly",
        slotId: "",
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

    useEffect(() => {
        loadDashboardData();
    }, []);

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
                });
                loadDashboardData();
                alert("Vehicle entry recorded successfully!");
            } else {
                const data = await response.json();
                alert(data.error || "Entry failed");
            }
        } catch (error) {
            alert("Network error");
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
                alert(`Exit processed! Amount: ₹${data.receipt.amount}`);
            } else {
                const data = await response.json();
                alert(data.error || "Exit failed");
            }
        } catch (error) {
            alert("Network error");
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
            }
        } catch (error) {
            console.error("Error updating slot status:", error);
        }
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
                return "bg-green-100 text-green-800";
            case "Occupied":
                return "bg-red-100 text-red-800";
            case "Maintenance":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Mall Parking System
                        </h1>
                        <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Car className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">
                                    Total Slots
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats?.totalSlots}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Plus className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">
                                    Available
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats?.availableSlots}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Minus className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">
                                    Occupied
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats?.occupiedSlots}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Settings className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">
                                    Maintenance
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats?.maintenanceSlots}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Card */}
                {revenue && (
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <div className="flex items-center mb-4">
                            <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Today's Revenue
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Revenue
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    ₹{revenue.today}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Hourly Revenue
                                </p>
                                <p className="text-xl font-semibold text-blue-600">
                                    ₹{revenue.hourly}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Day Pass Revenue
                                </p>
                                <p className="text-xl font-semibold text-purple-600">
                                    ₹{revenue.dayPass}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            {[
                                { id: "overview", name: "Overview" },
                                { id: "entry", name: "Vehicle Entry" },
                                { id: "exit", name: "Vehicle Exit" },
                                { id: "slots", name: "Slot Management" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === tab.id
                                            ? "border-blue-500 text-blue-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}>
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Active Sessions
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {slots
                                        .filter(
                                            (slot) => slot.status === "Occupied"
                                        )
                                        .map((slot) => (
                                            <div
                                                key={slot.id}
                                                className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {slot.slotNumber}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {slot.slotType}
                                                        </p>
                                                        {slot
                                                            .parkingSessions[0] && (
                                                            <div className="flex items-center mt-2">
                                                                {getVehicleIcon(
                                                                    slot
                                                                        .parkingSessions[0]
                                                                        .vehicle
                                                                        .type
                                                                )}
                                                                <span className="ml-1 text-sm text-gray-600">
                                                                    {
                                                                        slot
                                                                            .parkingSessions[0]
                                                                            .vehicle
                                                                            .numberPlate
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                                            slot.status
                                                        )}`}>
                                                        {slot.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Entry Tab */}
                        {activeTab === "entry" && (
                            <div className="max-w-md">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Vehicle Entry
                                </h3>
                                <form
                                    onSubmit={handleEntry}
                                    className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
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
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
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
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                            <option value="Car">Car</option>
                                            <option value="Bike">Bike</option>
                                            <option value="EV">EV</option>
                                            <option value="Handicap">
                                                Handicap
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
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
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                            <option value="Hourly">
                                                Hourly
                                            </option>
                                            <option value="DayPass">
                                                Day Pass (₹150)
                                            </option>
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                        Record Entry
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Exit Tab */}
                        {activeTab === "exit" && (
                            <div className="max-w-md">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Vehicle Exit
                                </h3>
                                <form
                                    onSubmit={handleExit}
                                    className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
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
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                        Process Exit
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Slots Tab */}
                        {activeTab === "slots" && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Slot Management
                                    </h3>
                                    <div className="flex space-x-2">
                                        <select
                                            value={filters.slotType}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    slotType: e.target.value,
                                                })
                                            }
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm">
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
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm">
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

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                                                className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-medium text-gray-900">
                                                        {slot.slotNumber}
                                                    </h4>
                                                    <span
                                                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                                            slot.status
                                                        )}`}>
                                                        {slot.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-3">
                                                    {slot.slotType}
                                                </p>

                                                {slot.parkingSessions[0] && (
                                                    <div className="mb-3">
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            {getVehicleIcon(
                                                                slot
                                                                    .parkingSessions[0]
                                                                    .vehicle
                                                                    .type
                                                            )}
                                                            <span className="ml-1">
                                                                {
                                                                    slot
                                                                        .parkingSessions[0]
                                                                        .vehicle
                                                                        .numberPlate
                                                                }
                                                            </span>
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
                                                            className="flex-1 px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600">
                                                            Mark Maintenance
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
                                                            className="flex-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                                                            Mark Available
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

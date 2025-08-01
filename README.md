# Mall Parking Management System

A full-stack Next.js application for managing mall parking operations with real-time slot tracking, billing, and analytics.

## 🏢 Features

### Core Parking Operations

-   **Vehicle Entry/Exit**: Record vehicle entry and exit with automatic slot assignment
-   **Smart Slot Assignment**: Auto-assign slots based on vehicle type (Car, Bike, EV, Handicap)
-   **Real-time Dashboard**: Live statistics of available, occupied, and maintenance slots
-   **Slot Management**: Mark slots as available, occupied, or under maintenance

### Billing System

-   **Hourly Billing**: Dynamic pricing based on duration
    -   0-1 hour: ₹50
    -   1-3 hours: ₹100
    -   3-6 hours: ₹150
    -   6+ hours: ₹200 (daily cap)
-   **Day Pass**: Flat ₹150 rate charged at entry
-   **Receipt Generation**: Automatic bill calculation and receipt display

### Analytics & Reporting

-   **Revenue Tracking**: Daily revenue with hourly vs day pass breakdown
-   **Slot Utilization**: Real-time occupancy statistics
-   **Overstay Detection**: Flag vehicles parked for more than 6 hours

### Security

-   **Operator Authentication**: Secure login system for parking staff
-   **Session Management**: JWT-based authentication with secure cookies

## 🛠️ Tech Stack

-   **Frontend**: Next.js 15 with TypeScript and TailwindCSS
-   **Backend**: Next.js API Routes
-   **Database**: SQLite with Prisma ORM
-   **Authentication**: JWT with bcrypt password hashing
-   **UI Components**: Lucide React icons

## 🚀 Quick Start

### Prerequisites

-   Node.js 18+
-   npm or yarn

### Installation

1. **Clone and install dependencies**

    ```bash
    cd mall-parking-system
    npm install
    ```

2. **Set up environment variables**

    ```bash
    # .env file is already created with:
    DATABASE_URL="file:./dev.db"
    JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
    ```

3. **Set up the database**

    ```bash
    npx prisma generate
    npx prisma migrate dev
    npm run seed
    ```

4. **Start the development server**

    ```bash
    npm run dev
    ```

5. **Access the application**
    - Open [http://localhost:3000](http://localhost:3000)
    - Login with demo credentials:
        - Username: `admin`
        - Password: `admin123`

## 📊 System Overview

### Database Schema

#### Vehicle

-   `id`: Auto-generated unique identifier
-   `numberPlate`: Unique vehicle registration number
-   `vehicleType`: Car, Bike, EV, or Handicap
-   `createdAt/updatedAt`: Timestamps

#### ParkingSlot

-   `id`: Auto-generated unique identifier
-   `slotNumber`: Human-readable slot identifier (e.g., "A1-12")
-   `slotType`: Regular, Compact, EV, or Handicap
-   `status`: Available, Occupied, or Maintenance

#### ParkingSession

-   `id`: Auto-generated unique identifier
-   `vehicleNumberPlate`: Foreign key to Vehicle
-   `slotId`: Foreign key to ParkingSlot
-   `entryTime`: Automatic timestamp on entry
-   `exitTime`: Timestamp on exit
-   `status`: Active or Completed
-   `billingType`: Hourly or DayPass
-   `billingAmount`: Calculated amount

#### Operator

-   `id`: Auto-generated unique identifier
-   `username`: Unique login username
-   `password`: Hashed password
-   `name`: Operator's full name

### Slot Assignment Logic

-   **Car**: Assigned to Regular or Compact slots
-   **Bike**: Assigned to Compact slots only
-   **EV**: Assigned to EV slots (with charging support)
-   **Handicap**: Assigned to reserved Handicap slots

### Billing Logic

#### Hourly Billing

-   Calculated on exit based on duration
-   Slab-based pricing with daily cap
-   No additional charges for overstay beyond 6 hours

#### Day Pass

-   Flat ₹150 charged at entry
-   No additional billing on exit
-   Valid for entire day

## 🎯 Usage Guide

### Vehicle Entry Process

1. Navigate to "Vehicle Entry" tab
2. Enter vehicle number plate
3. Select vehicle type
4. Choose billing type (Hourly/Day Pass)
5. Submit to record entry

### Vehicle Exit Process

1. Navigate to "Vehicle Exit" tab
2. Enter vehicle number plate
3. Submit to process exit
4. View generated receipt with billing details

### Slot Management

1. Navigate to "Slot Management" tab
2. Filter slots by type or status
3. Mark slots as maintenance or available
4. View real-time occupancy status

### Dashboard Overview

-   **Statistics Cards**: Total, available, occupied, and maintenance slots
-   **Revenue Tracking**: Today's revenue with breakdown
-   **Active Sessions**: Real-time view of occupied slots

## 🔧 Development

### Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── dashboard/     # Dashboard page
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Login page
├── lib/
│   ├── auth.ts        # Authentication utilities
│   ├── db.ts          # Database client
│   └── pricing.ts     # Billing calculations
prisma/
├── schema.prisma      # Database schema
└── seed.ts           # Database seeding
```

### API Endpoints

#### Authentication

-   `POST /api/auth/login` - Operator login
-   `POST /api/auth/logout` - Operator logout

#### Parking Operations

-   `POST /api/parking/entry` - Record vehicle entry
-   `POST /api/parking/exit` - Process vehicle exit

#### Dashboard

-   `GET /api/dashboard/stats` - Get parking statistics
-   `GET /api/slots` - Get parking slots with filters
-   `PATCH /api/slots` - Update slot status

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run seed

# Open Prisma Studio
npx prisma studio
```

## 🚀 Deployment

### Production Setup

1. Update environment variables for production
2. Use a production database (PostgreSQL recommended)
3. Set secure JWT secret
4. Configure proper CORS and security headers

### Environment Variables

```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-secure-jwt-secret"
```

## 📈 Future Enhancements

-   **Payment Integration**: Support for digital payments
-   **Mobile App**: React Native app for operators
-   **Advanced Analytics**: Detailed reports and insights
-   **Multi-location Support**: Manage multiple parking facilities
-   **QR Code Integration**: QR-based entry/exit
-   **SMS Notifications**: Alert customers about overstay

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using Next.js, TypeScript, and TailwindCSS**

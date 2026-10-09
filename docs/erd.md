# FleetFlow — Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLEETFLOW DATABASE SCHEMA                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│      users       │     │  customer_profiles   │     │   driver_profiles    │
├──────────────────┤     ├──────────────────────┤     ├──────────────────────┤
│ id (PK)          │─┬──▶│ id (PK)              │     │ id (PK)              │
│ email (UNIQUE)   │ │   │ userId (FK→users) UK │     │ userId (FK→users) UK │
│ passwordHash     │ │   │ dateOfBirth          │     │ licenceNumber (UK)   │
│ role             │ │   │ address, city...     │◀────┤ licenceExpiryDate    │
│ status           │ │   │ drivingLicenceNumber │     │ availability         │
│ firstName        │ └───┤ licenceExpiryDate    │     └──────────┬───────────┘
│ lastName         │     │ isVerified           │                │
│ phone            │     └──────────┬───────────┘                │
│ createdAt        │                │                            │
│ lastLoginAt      │                │                            │
└───────┬──────────┘                │                            │
        │                           │ 1:N                        │ 1:N
        │                   ┌───────▼──────────┐                 │
        │    ┌──────────────▶│    bookings      │◀────────────────┘
        │    │               ├──────────────────┤      (driver_assignments)
        │    │               │ id (PK)          │
        │    │               │ bookingReference │
        │    │               │  (UNIQUE)        │
        │    │               │ customerProfileId│
        │    │               │ vehicleId (FK)   │
        │    │               │ agentId (FK→user)│
        │    │               │ status           │
        │    │               │ pickupDate       │
        │    │               │ returnDate       │
        │    │               │ dailyRate        │
        │    │               │ rentalDays       │
        │    │               │ subtotal         │
        │    │               │ taxAmount        │
        │    │               │ securityDeposit  │
        │    │               │ totalAmount      │
        │    │               │ includeDriver    │
        │    │               └────────┬─────────┘
        │    │                        │ 1:1              1:N
        │    │                ┌───────▼──────────┐   ┌──────────────────┐
        │    │                │ rental_contracts  │   │    payments       │
        │    │                ├──────────────────┤   ├──────────────────┤
        │    │                │ id (PK)           │   │ id (PK)          │
        │    │                │ contractNumber UK │   │ paymentReference │
        │    │                │ bookingId (FK) UK │   │ bookingId (FK)   │
        │    │                │ status            │   │ amount           │
        │    │                │ signedAt          │   │ paymentMethod    │
        │    │                └──────────────────┘   │ status           │
        │    │                                        │ isSimulated      │
        │    │                                        └────────┬─────────┘
        │    │                                                 │ 1:N
        │    │                                        ┌────────▼─────────┐
        │    │                                        │     refunds       │
        │    │                                        ├──────────────────┤
        │    │                                        │ id (PK)          │
        │    │                                        │ paymentId (FK)   │
        │    │                                        │ amount           │
        │    │                                        │ reason           │
        │    │                                        └──────────────────┘
        │    │
        │    │  ┌──────────────────────┐
        │    │  │  vehicle_categories  │
        │    │  ├──────────────────────┤
        │    │  │ id (PK)              │
        │    │  │ name (UNIQUE)        │
        │    │  └─────────┬────────────┘
        │    │            │ 1:N
        │    │  ┌─────────▼────────────┐     ┌──────────────────────┐
        │    │  │      vehicles        │     │   vehicle_images      │
        │    │  ├──────────────────────┤     ├──────────────────────┤
        │    │  │ id (PK)              │─┬──▶│ vehicleId (FK)       │
        │    │  │ registrationNumber UK│ │   │ url                  │
        │    │  │ make, model, year    │ │   │ isPrimary            │
        │    │  │ categoryId (FK)      │ │   └──────────────────────┘
        │    │  │ transmission         │ │
        │    │  │ fuelType             │ │   ┌──────────────────────┐
        │    │  │ seatingCapacity      │ │   │ maintenance_records  │
        │    │  │ dailyRate            │ └──▶├──────────────────────┤
        │    │  │ mileage              │     │ vehicleId (FK)       │
        │    │  │ status               │     │ maintenanceType      │
        │    │  │ insuranceExpiry      │     │ status               │
        │    │  │ registrationExpiry   │     │ title, description   │
        │    └──┤ (bookings FK)        │     │ scheduledDate        │
        │       └──────────────────────┘     │ cost                 │
        │                                    └──────────────────────┘
        │
        │  ┌──────────────────────┐     ┌──────────────────────┐
        └─▶│    notifications     │     │     audit_logs       │
           ├──────────────────────┤     ├──────────────────────┤
           │ userId (FK)          │     │ action               │
           │ type                 │     │ userId (FK)          │
           │ title, message       │     │ actorId (FK)         │
           │ isRead               │     │ resourceType         │
           │ bookingId (FK)       │     │ resourceId           │
           └──────────────────────┘     │ description          │
                                        │ ipAddress            │
                                        │ createdAt            │
                                        └──────────────────────┘
```

## Key Relationships

| Relationship | Cardinality | Notes |
|---|---|---|
| users → customer_profiles | 1:1 | All customers have a profile |
| users → driver_profiles | 1:1 | Optional — staff managed |
| vehicle_categories → vehicles | 1:N | Required category |
| vehicles → bookings | 1:N | One vehicle, many bookings over time |
| customer_profiles → bookings | 1:N | One customer, many bookings |
| bookings → rental_contracts | 1:1 | One contract per booking |
| bookings → payments | 1:N | Multiple payment records |
| payments → refunds | 1:N | Multiple partial refunds |
| bookings → vehicle_inspections | 1:N | Pre and post rental |
| bookings → driver_assignments | 1:1 | Optional driver |
| vehicles → maintenance_records | 1:N | Full service history |
| users → notifications | 1:N | Per-user inbox |
| users → audit_logs | 1:N | As subject and as actor |

## Indexes

All foreign keys are indexed. Additional indexes on:
- `users.email` (unique lookup)
- `vehicles.status`, `vehicles.registrationNumber`
- `bookings.status`, `bookings.pickupDate`, `bookings.returnDate`, `bookings.bookingReference`
- `payments.status`, `payments.paymentReference`
- `notifications.userId`, `notifications.isRead`
- `audit_logs.action`, `audit_logs.createdAt`, `audit_logs.resourceType + resourceId`

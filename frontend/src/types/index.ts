// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────
export type Role = 'CUSTOMER' | 'RENTAL_AGENT' | 'FLEET_MANAGER' | 'ADMINISTRATOR';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'PENDING_VERIFICATION';
export type VehicleStatus = 'AVAILABLE' | 'RESERVED' | 'RENTED' | 'UNDER_MAINTENANCE' | 'INACTIVE';
export type TransmissionType = 'AUTOMATIC' | 'MANUAL' | 'CVT';
export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'PLUG_IN_HYBRID';
export type BookingStatus =
  | 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'ACTIVE'
  | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'OVERDUE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentMethod = 'SIMULATED_CARD' | 'SIMULATED_CASH' | 'SIMULATED_BANK_TRANSFER';
export type MaintenanceStatus = 'REPORTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type MaintenanceType =
  | 'ROUTINE_SERVICE' | 'REPAIR' | 'INSPECTION' | 'TIRE_CHANGE'
  | 'OIL_CHANGE' | 'BRAKE_SERVICE' | 'ENGINE_REPAIR' | 'BODYWORK' | 'OTHER';

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  role: Role;
  status: AccountStatus;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ─────────────────────────────────────────────
// Vehicles
// ─────────────────────────────────────────────
export interface VehicleCategory {
  id: string;
  name: string;
  description?: string;
}

export interface VehicleImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  categoryId: string;
  category: VehicleCategory;
  transmission: TransmissionType;
  fuelType: FuelType;
  seatingCapacity: number;
  dailyRate: number;
  mileage: number;
  description?: string;
  status: VehicleStatus;
  color?: string;
  vin?: string;
  insuranceExpiryDate?: string;
  registrationExpiryDate?: string;
  createdAt: string;
  updatedAt: string;
  images: VehicleImage[];
}

// ─────────────────────────────────────────────
// Customer
// ─────────────────────────────────────────────
export interface CustomerProfile {
  id: string;
  userId: string;
  user: Partial<User>;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  drivingLicenceNumber?: string;
  licenceExpiryDate?: string;
  licenceCountry?: string;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Bookings
// ─────────────────────────────────────────────
export interface Booking {
  id: string;
  bookingReference: string;
  customerProfileId: string;
  customerProfile: Partial<CustomerProfile>;
  vehicleId: string;
  vehicle: Partial<Vehicle>;
  status: BookingStatus;
  pickupDate: string;
  returnDate: string;
  actualPickupDate?: string;
  actualReturnDate?: string;
  pickupLocation?: string;
  returnLocation?: string;
  dailyRate: number;
  rentalDays: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  securityDeposit: number;
  discountAmount: number;
  totalAmount: number;
  includeDriver: boolean;
  specialRequests?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Payments
// ─────────────────────────────────────────────
export interface Payment {
  id: string;
  paymentReference: string;
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  isSimulated: boolean;
  description?: string;
  paidAt?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Maintenance
// ─────────────────────────────────────────────
export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicle?: Partial<Vehicle>;
  maintenanceType: MaintenanceType;
  status: MaintenanceStatus;
  title: string;
  description?: string;
  scheduledDate?: string;
  completedAt?: string;
  cost?: number;
  mileageAtService?: number;
  assignedTechnicianName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  bookingId?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalVehicles?: number;
  availableVehicles?: number;
  totalBookings?: number;
  pendingBookings?: number;
  activeRentals?: number;
  overdueRentals?: number;
  totalRevenue?: number;
  totalCustomers?: number;
  maintenanceDue?: number;
  upcomingReturns?: number;
  upcomingBookings?: number;
  completedRentals?: number;
}

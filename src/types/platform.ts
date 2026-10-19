export type UserRole = 'RESELLER' | 'SUPPLIER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export type AccountStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'EXPIRED';

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  mobile: string; // Normalized: 01XXXXXXXXX or +8801XXXXXXXXX
  email: string;
  role: UserRole;
  designation?: string;
  status: AccountStatus;
  businessName?: string;
  storeName?: string;
  storeLogo?: string;
  district?: string;
  upazila?: string;
  address?: string;
  verificationDoc?: string;
  expiresAt?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface SessionData {
  user: UserAccount;
  token: string;
  loginTimestamp: string;
}

// 17 Specific Order Statuses required by Super Admin Order Tracker
export type OrderStatus =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'ORDER_VERIFICATION'
  | 'AWAITING_SUPPLIER'
  | 'SUPPLIER_CONFIRMED'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'COURIER_ASSIGNED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUND_PENDING'
  | 'REFUND_COMPLETED'
  | 'FRAUD_REVIEW'
  // Legacy compatibility aliases
  | 'PENDING'
  | 'CONFIRMED'
  | 'DISPATCHED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'SETTLED' | 'PENDING';

export interface OrderItem {
  id: string;
  invoiceNumber: string;
  orderDate: string;
  status: OrderStatus;
  
  // Product Details
  productId: string;
  productName: string;
  sku: string;
  variant?: string;
  quantity: number;
  
  // Financial & Pricing Details (role-segmented visibility)
  supplierResellerPrice: number; // In BDT
  resellerSellPrice: number;     // In BDT
  orderSalesValue: number;       // In BDT
  deliveryCharge: number;        // In BDT
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  transactionRef?: string;
  settlementStatus: 'PENDING' | 'SETTLED' | 'HELD';
  
  // Stakeholder details
  supplierId: string;
  supplierName: string;
  resellerId: string;
  resellerName: string;
  resellerStoreName: string;
  
  // Customer & Shipping Details
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  customerDistrict: string;
  customerUpazila: string;
  deliveryAddress: string;
  
  // Courier & Tracking
  courierName?: string;
  courierId?: string;
  trackingNumber?: string;
  trackingHistory: Array<{
    status: string;
    location: string;
    timestamp: string;
    note?: string;
  }>;
  
  // Returns / Cancellation / Fraud
  returnReason?: string;
  cancellationReason?: string;
  fraudReviewNotes?: string;
  refundAmount?: number;
  resellerProfit?: number;
  customerAddress?: string;
  
  // Audit Trail
  statusHistory: Array<{
    status: OrderStatus;
    changedBy: string;
    role: UserRole;
    timestamp: string;
    reason?: string;
  }>;
}

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  supplierId: string;
  supplierName: string;
  category: string;
  basePrice: number;      // Supplier Reseller Price (BDT)
  suggestedRetailPrice: number; // Suggested BDT
  stockQuantity: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  description: string;
  specifications: Record<string, string>;
  createdAt: string;
}

export interface InternalMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderMobile: string;
  recipientId: string;
  recipientName: string;
  recipientRole: UserRole;
  recipientMobile: string;
  subject: string;
  body: string;
  wordCount: number;
  images?: string[]; // Max 3 images, up to 4MB each
  createdAt: string;
  timestamp?: string;
  isRead: boolean;
}

export interface AuditRecord {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface DashboardTab {
  id: string;
  title: string;
  iconName?: string;
  viewId: string;
  submodule?: string;
  params?: Record<string, any>;
  isClosable: boolean;
  refreshKey: number; // incremented on tab refresh
}

/* ==========================================================
   SUPER ADMIN EXTENDED MODULE TYPES
========================================================== */

// 3. Business Information
export interface CompanyInfo {
  companyName: string;
  officialMobile: string;
  supportMobile: string;
  officialEmail: string;
  whatsappNumber: string;
  websiteUrl?: string;
  companyAddress: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface HomepageCMS {
  logoUrl: string;
  websiteName: string;
  tagline: string;
  homeTitle: string;
  homeDescription: string;
  bannerImageUrl: string;
  bannerHeadline: string;
  bannerButtonText: string;
  bannerButtonLink: string;
  featuredProductIds: string[];
  promotionalOfferText: string;
  announcementText: string;
  footerAbout: string;
  footerCopyright: string;
  contactEmail: string;
  contactPhone: string;
  status: 'PUBLISHED' | 'DRAFT';
  updatedAt: string;
}

export interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  category: 'Reseller Guides' | 'Supplier Manuals' | 'Order Fulfillment' | 'Financial Settlement';
  orderPosition: number;
  isPublished: boolean;
  createdAt: string;
}

export interface LandingPageSection {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  content: Record<string, any>;
}

// 4. Financial Ledger & Account
export interface FinancialSummary {
  superAdminBalance: number;
  totalPlatformBalance: number;
  availableBalance: number;
  pendingBalance: number;
  reservedBalance: number;
  totalCredit: number;
  totalDebit: number;
  currency: string;
}

export interface LedgerTransaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  category: 'DEPOSIT' | 'WITHDRAWAL' | 'MANUAL_ADJUSTMENT' | 'ORDER_PAYMENT' | 'SUPPLIER_PAYOUT' | 'COMMISSION';
  purpose: string;
  recipientOrSource: string;
  userRole?: UserRole;
  userId?: string;
  paymentMethod: string;
  referenceNumber: string;
  processedBy: string;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED' | 'REVERSED';
  timestamp: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  requestedAmount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Bank Transfer';
  accountDetails: string;
  requestDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  rejectionReason?: string;
  paymentReference?: string;
  processedAt?: string;
  processedBy?: string;
}

// 5. All API Settings
export type ApiCategory =
  | 'COURIER'
  | 'PAYMENT'
  | 'SMS'
  | 'EMAIL'
  | 'WHATSAPP'
  | 'PRODUCT_IMPORT'
  | 'DOMAIN_DNS';

export interface ApiServiceItem {
  id: string;
  name: string;
  category: ApiCategory;
  provider: string;
  baseUrl: string;
  apiKeyMasked: string;
  apiSecretMasked?: string;
  senderId?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  isEnabled: boolean;
  isTestMode: boolean;
  lastConnection: string;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  errorLogs: Array<{ timestamp: string; message: string }>;
  connectedModule: string;
}

// 6. Courier Management
export interface CourierAreaItem {
  id: string;
  district: string;
  upazila: string;
  areaName: string;
  isServiceable: boolean;
  deliveryCharge: number;
  isCodAvailable: boolean;
  estimatedDeliveryHours: number;
  availableCouriers: string[];
}

export interface CourierChangeRecord {
  id: string;
  orderId: string;
  oldCourier: string;
  newCourier: string;
  reason: string;
  changedBy: string;
  timestamp: string;
}

// 7. SMS Service
export interface SmsTemplateItem {
  id: string;
  templateType: 'OTP' | 'ORDER_CONFIRM' | 'PAYMENT_RECEIVED' | 'DELIVERY_DISPATCH' | 'SECURITY_ALERT';
  title: string;
  content: string;
  costPerSms: number;
  characterLimit: number;
  isActive: boolean;
}

export interface SmsLogRecord {
  id: string;
  recipientMobile: string;
  recipientName?: string;
  templateType?: string;
  templateName?: string;
  messageContent?: string;
  messageBody?: string;
  segmentCount?: number;
  cost?: number;
  costBDT?: number;
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
  provider?: string;
  gatewayUsed?: string;
  timestamp?: string;
  sentAt?: string;
  failureReason?: string;
}

// 8. User Management & Designations
export interface DesignationItem {
  id: string;
  name: string;
  description: string;
  allowedPanels: string[];
  permissions: Record<string, boolean>;
  isActive: boolean;
  assignedUsersCount: number;
  createdAt: string;
}

export interface ModeratorRequestItem {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  requestedDesignation: string;
  experienceSummary: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  rejectionReason?: string;
}

export interface ModeratorPermissionsMatrix {
  orderManagement: { read: boolean; write: boolean; edit: boolean; approve: boolean; delete: boolean };
  userManagement: { read: boolean; write: boolean; edit: boolean; approve: boolean; delete: boolean };
  financialManagement: { read: boolean; write: boolean; edit: boolean; approve: boolean; delete: boolean };
  balanceApproval: { read: boolean; write: boolean; edit: boolean; approve: boolean; delete: boolean };
  transactionApproval: { read: boolean; write: boolean; edit: boolean; approve: boolean; delete: boolean };
  courierManagement: { read: boolean; write: boolean; edit: boolean; approve: boolean; delete: boolean };
  productManagement: { read: boolean; write: boolean; edit: boolean; approve: boolean; delete: boolean };
  reportAccess: { read: boolean; write: boolean; edit: boolean; approve: boolean; delete: boolean };
  messagingPermission: { read: boolean; write: boolean; edit: boolean; approve: boolean; delete: boolean };
}

// 9. Login Security & Sessions
export interface UserLoginActivity {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  designation?: string;
  loginTime: string;
  logoutTime?: string;
  result: 'SUCCESS' | 'FAILED';
  ipAddress: string;
  deviceBrowser: string;
  isSuspicious: boolean;
  suspiciousReason?: string;
}

export interface ActiveSessionItem {
  id: string;
  userId: string;
  userName: string;
  deviceInfo: string;
  ipAddress: string;
  startedAt: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface PasswordResetLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  resetType: 'OTP' | 'SECURE_LINK' | 'ADMIN_OVERRIDE';
  initiatedBy: string;
  forceChangeAtNextLogin: boolean;
  timestamp: string;
}

// 10. Customer Directory
export interface CustomerRecord {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  district: string;
  upazila: string;
  address: string;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  lastOrderDate: string;
  status: 'ACTIVE' | 'HIGH_RETURN_RISK' | 'BLOCKED';
  totalSpentBDT: number;
}

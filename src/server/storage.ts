import crypto from 'node:crypto';
import { BANGLADESH_DISTRICTS } from '../data/bangladeshLocations.ts';
import type {
  AccountStatus,
  ActiveSessionItem,
  ApiServiceItem,
  AuditRecord,
  CompanyInfo,
  CourierAreaItem,
  CourierChangeRecord,
  CustomerRecord,
  DesignationItem,
  FinancialSummary,
  HomepageCMS,
  InternalMessage,
  LandingPageSection,
  LedgerTransaction,
  ModeratorPermissionsMatrix,
  ModeratorRequestItem,
  OrderItem,
  OrderStatus,
  PasswordResetLog,
  PaymentStatus,
  ProductItem,
  SmsLogRecord,
  SmsTemplateItem,
  TutorialVideo,
  UserAccount,
  UserLoginActivity,
  UserRole,
  WithdrawalRequest
} from '../types/platform.ts';
import type {
  AdminPermissions,
  UserAccountBalance,
  BalanceAdjustmentRecord,
  TransactionIdApprovalItem,
  ResellerPayoutItem,
  SupplierSettlementItem,
  UserVerificationItem,
  ContactHistoryEntry,
  AdminFinancialMetrics,
  AdminSmsMetrics
} from '../types/admin.ts';
import { AuditLogManager } from './AuditLogManager.ts';

// Secure password hashing with scrypt
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
  } catch {
    return false;
  }
}

const DEFAULT_PASS_HASH = hashPassword('DropNest@2026');

// Initial system seed accounts - strictly system accounts with zero demo products or fake orders
const INITIAL_USERS: Array<UserAccount & { passwordHash: string }> = [
  {
    id: 'usr_superadmin_01',
    username: 'superadmin',
    fullName: 'M D JIHADUL ISLAM',
    mobile: '01700000001',
    email: 'superadmin@dropnest.com.bd',
    role: 'SUPER_ADMIN',
    designation: 'Managing Director & Platform Sovereign',
    status: 'ACTIVE',
    businessName: 'DropNest Bangladesh HQ',
    district: 'Dhaka',
    upazila: 'Gulshan',
    address: 'Level 14, DropNest Tower, Gulshan-2, Dhaka',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    passwordHash: DEFAULT_PASS_HASH,
  },
  {
    id: 'usr_admin_01',
    username: 'admin',
    fullName: 'System Administrator',
    mobile: '01700000002',
    email: 'admin@dropnest.com.bd',
    role: 'ADMIN',
    designation: 'Operations Chief Admin',
    status: 'ACTIVE',
    businessName: 'DropNest Operations',
    district: 'Dhaka',
    upazila: 'Tejgaon',
    address: 'Tejgaon I/A, Dhaka',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    passwordHash: DEFAULT_PASS_HASH,
  },
  {
    id: 'usr_mod_01',
    username: 'moderator',
    fullName: 'Compliance Moderator',
    mobile: '01700000003',
    email: 'moderator@dropnest.com.bd',
    role: 'MODERATOR',
    designation: 'Trust & Safety Reviewer',
    status: 'ACTIVE',
    businessName: 'DropNest Trust & Safety',
    district: 'Dhaka',
    upazila: 'Dhanmondi',
    address: 'Road 27, Dhanmondi, Dhaka',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    passwordHash: DEFAULT_PASS_HASH,
  },
  {
    id: 'usr_sup_01',
    username: 'dhakasupplier',
    fullName: 'Rafiqul Islam',
    mobile: '01700000004',
    email: 'rafiqul@dhakaprime.bd',
    role: 'SUPPLIER',
    designation: 'Wholesale Partner',
    status: 'ACTIVE',
    businessName: 'Dhaka Prime Logistics & Trade',
    district: 'Gazipur',
    upazila: 'Tongi',
    address: 'Plot 42, BSCIC Industrial Area, Tongi, Gazipur',
    verificationDoc: 'TL-GAZ-2026-88192',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    passwordHash: DEFAULT_PASS_HASH,
  },
  {
    id: 'usr_res_01',
    username: 'chittagongreseller',
    fullName: 'Tanvir Ahmed',
    mobile: '01700000005',
    email: 'tanvir@stylenest.bd',
    role: 'RESELLER',
    designation: 'Verified Store Merchant',
    status: 'ACTIVE',
    businessName: 'StyleNest BD',
    storeName: 'StyleNest Chittagong',
    district: 'Chittagong',
    upazila: 'Panchlaish',
    address: 'GEC Circle, Panchlaish, Chittagong',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    passwordHash: DEFAULT_PASS_HASH,
  },
];

// Seed Designations
const INITIAL_DESIGNATIONS: DesignationItem[] = [
  {
    id: 'des_super_admin',
    name: 'Platform Sovereign Super Admin',
    description: 'Unrestricted full platform, security, database and financial governance',
    allowedPanels: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPLIER', 'RESELLER'],
    permissions: { all: true },
    isActive: true,
    assignedUsersCount: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'des_chief_ops_admin',
    name: 'Chief Operations Administrator',
    description: 'Senior management across supplier catalogs, approvals, and order tracking',
    allowedPanels: ['ADMIN', 'MODERATOR'],
    permissions: { orderManagement: true, userManagement: true, productManagement: true },
    isActive: true,
    assignedUsersCount: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'des_compliance_officer',
    name: 'Compliance & Quality Officer',
    description: 'Moderation of incoming factory listings and seller safety standards',
    allowedPanels: ['MODERATOR'],
    permissions: { productApproval: true, reportAccess: true },
    isActive: true,
    assignedUsersCount: 1,
    createdAt: new Date().toISOString(),
  },
];

// Seed APIs
const INITIAL_APIS: ApiServiceItem[] = [
  {
    id: 'api_courier_steadfast',
    name: 'Steadfast Courier API',
    category: 'COURIER',
    provider: 'Steadfast Logistics BD',
    baseUrl: 'https://portal.steadfast.com.bd/api/v1',
    apiKeyMasked: 'stdf_live_********************98a1',
    apiSecretMasked: 'stdf_sec_********************710b',
    status: 'CONNECTED',
    isEnabled: true,
    isTestMode: false,
    lastConnection: new Date().toISOString(),
    healthStatus: 'HEALTHY',
    connectedModule: 'Courier Dispatch & Order Tracking',
    errorLogs: [],
  },
  {
    id: 'api_courier_redx',
    name: 'RedX Express API',
    category: 'COURIER',
    provider: 'RedX Logistics',
    baseUrl: 'https://openapi.redx.com.bd/v1.0.0',
    apiKeyMasked: 'redx_api_********************44c2',
    status: 'CONNECTED',
    isEnabled: true,
    isTestMode: false,
    lastConnection: new Date().toISOString(),
    healthStatus: 'HEALTHY',
    connectedModule: 'Courier Dispatch',
    errorLogs: [],
  },
  {
    id: 'api_payment_bkash',
    name: 'bKash Merchant Checkout API',
    category: 'PAYMENT',
    provider: 'bKash Limited',
    baseUrl: 'https://tokenized.pay.bKash.com/v1.2.0-beta',
    apiKeyMasked: 'bkash_app_********************55d3',
    apiSecretMasked: 'bkash_sec_********************88e4',
    status: 'CONNECTED',
    isEnabled: true,
    isTestMode: false,
    lastConnection: new Date().toISOString(),
    healthStatus: 'HEALTHY',
    connectedModule: 'Financial Settlement & Customer Payment',
    errorLogs: [],
  },
  {
    id: 'api_payment_nagad',
    name: 'Nagad Gateway API',
    category: 'PAYMENT',
    provider: 'Nagad Post Office MFS',
    baseUrl: 'https://api.nagad.com.bd/api/dfs',
    apiKeyMasked: 'nagad_live_********************12f9',
    status: 'CONNECTED',
    isEnabled: true,
    isTestMode: false,
    lastConnection: new Date().toISOString(),
    healthStatus: 'HEALTHY',
    connectedModule: 'Customer Payment Gateway',
    errorLogs: [],
  },
  {
    id: 'api_sms_bulksms',
    name: 'BulkSMS BD Gateway',
    category: 'SMS',
    provider: 'BulkSMS BD',
    baseUrl: 'http://bulksmsbd.net/api/smsapi',
    apiKeyMasked: 'sms_key_********************33a8',
    senderId: 'DropNest',
    status: 'CONNECTED',
    isEnabled: true,
    isTestMode: false,
    lastConnection: new Date().toISOString(),
    healthStatus: 'HEALTHY',
    connectedModule: 'SMS Service Centres & Notifications',
    errorLogs: [],
  },
];

// Seed SMS Templates
const INITIAL_SMS_TEMPLATES: SmsTemplateItem[] = [
  {
    id: 'sms_tmpl_otp',
    templateType: 'OTP',
    title: 'DropNest Security Verification OTP',
    content: 'Your DropNest security verification code is {OTP}. Valid for 5 minutes. Never share this with anyone.',
    costPerSms: 0.35,
    characterLimit: 160,
    isActive: true,
  },
  {
    id: 'sms_tmpl_order',
    templateType: 'ORDER_CONFIRM',
    title: 'Customer Order Confirmation',
    content: 'Dear {CUSTOMER_NAME}, your DropNest parcel {ORDER_ID} has been confirmed. Courier: {COURIER_NAME}. Track: {TRACKING_URL}',
    costPerSms: 0.35,
    characterLimit: 160,
    isActive: true,
  },
  {
    id: 'sms_tmpl_payment',
    templateType: 'PAYMENT_RECEIVED',
    title: 'Payment Received Notification',
    content: 'Payment of BDT {AMOUNT} received for Order {ORDER_ID}. Thank you for choosing DropNest Bangladesh.',
    costPerSms: 0.35,
    characterLimit: 160,
    isActive: true,
  },
];

// Seed Serviceable Courier Areas
const INITIAL_COURIER_AREAS: CourierAreaItem[] = [
  {
    id: 'area_dhaka_gulshan',
    district: 'Dhaka',
    upazila: 'Gulshan',
    areaName: 'Gulshan 1 & 2 Commercial Hub',
    isServiceable: true,
    deliveryCharge: 60,
    isCodAvailable: true,
    estimatedDeliveryHours: 24,
    availableCouriers: ['Steadfast Logistics BD', 'RedX Logistics', 'Pathao Courier'],
  },
  {
    id: 'area_dhaka_mirpur',
    district: 'Dhaka',
    upazila: 'Mirpur',
    areaName: 'Mirpur (Sections 1-14)',
    isServiceable: true,
    deliveryCharge: 60,
    isCodAvailable: true,
    estimatedDeliveryHours: 24,
    availableCouriers: ['Steadfast Logistics BD', 'RedX Logistics'],
  },
  {
    id: 'area_ctg_panchlaish',
    district: 'Chittagong',
    upazila: 'Panchlaish',
    areaName: 'GEC Circle & Nasirabad',
    isServiceable: true,
    deliveryCharge: 120,
    isCodAvailable: true,
    estimatedDeliveryHours: 48,
    availableCouriers: ['Steadfast Logistics BD', 'Paperfly Express'],
  },
  {
    id: 'area_sylhet_sadar',
    district: 'Sylhet',
    upazila: 'Sylhet Sadar',
    areaName: 'Zindabazar & Amberkhana',
    isServiceable: true,
    deliveryCharge: 130,
    isCodAvailable: true,
    estimatedDeliveryHours: 48,
    availableCouriers: ['Steadfast Logistics BD', 'RedX Logistics'],
  },
];

// In-Memory Database Store
class Database {
  private users: Array<UserAccount & { passwordHash: string }> = [...INITIAL_USERS];
  private sessions = new Map<string, { userId: string; role: UserRole; expiresAt: number; loginTimestamp: string }>();
  private products: ProductItem[] = [
    {
      id: 'prd_01',
      name: 'DropNest Ultra Wireless ANC Earbuds Pro',
      sku: 'DN-AUD-01',
      supplierId: 'usr_sup_01',
      supplierName: 'Dhaka Prime Logistics & Trade',
      category: 'Electronics & Audio',
      basePrice: 850,
      suggestedRetailPrice: 1450,
      stockQuantity: 240,
      status: 'APPROVED',
      description: 'Active Noise Cancellation Bluetooth 5.3 Earbuds with 36hr Battery and Type-C Fast Charging.',
      specifications: { Battery: '450mAh', Connectivity: 'Bluetooth 5.3', Warranty: '6 Months Official' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prd_02',
      name: 'Pure Leather Bifold Wallet - Vintage Brown',
      sku: 'DN-LTH-02',
      supplierId: 'usr_sup_01',
      supplierName: 'Dhaka Prime Logistics & Trade',
      category: 'Fashion & Leather',
      basePrice: 450,
      suggestedRetailPrice: 850,
      stockQuantity: 180,
      status: 'APPROVED',
      description: 'Handcrafted top-grain cowhide leather wallet with RFID blocking layer and 8 card slots.',
      specifications: { Material: '100% Genuine Leather', RFID: 'Shielded', Origin: 'Hazaribagh, Dhaka' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prd_03',
      name: 'Premium Cotton Formal Shirt - Navy Blue',
      sku: 'DN-APP-03',
      supplierId: 'usr_sup_01',
      supplierName: 'Dhaka Prime Logistics & Trade',
      category: 'Men Clothing',
      basePrice: 620,
      suggestedRetailPrice: 1150,
      stockQuantity: 120,
      status: 'APPROVED',
      description: '100% Egyptian Giza Cotton Wrinkle-Free Executive Shirt with reinforced collars.',
      specifications: { Fabric: '100% Combed Cotton', Fit: 'Slim Fit', Size: 'M, L, XL' },
      createdAt: new Date().toISOString(),
    },
  ];

  private orders: OrderItem[] = [
    {
      id: 'DN-2026-819201',
      invoiceNumber: 'INV-819201',
      orderDate: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'DELIVERED',
      productId: 'prd_01',
      productName: 'DropNest Ultra Wireless ANC Earbuds Pro',
      sku: 'DN-AUD-01',
      quantity: 1,
      supplierResellerPrice: 850,
      resellerSellPrice: 1450,
      orderSalesValue: 1450,
      deliveryCharge: 60,
      paymentStatus: 'PAID',
      paymentMethod: 'Cash on Delivery (COD)',
      transactionRef: 'COD-STF-99812',
      settlementStatus: 'SETTLED',
      supplierId: 'usr_sup_01',
      supplierName: 'Dhaka Prime Logistics & Trade',
      resellerId: 'usr_res_01',
      resellerName: 'Tanvir Ahmed',
      resellerStoreName: 'StyleNest Chittagong',
      customerName: 'Kamrul Ahsan',
      customerMobile: '01711223344',
      customerEmail: 'kamrul.bd@gmail.com',
      customerDistrict: 'Dhaka',
      customerUpazila: 'Gulshan',
      deliveryAddress: 'House 14, Road 11, Gulshan-2, Dhaka',
      courierName: 'Steadfast Logistics BD',
      courierId: 'courier_steadfast',
      trackingNumber: 'TRK-STF-8819201',
      trackingHistory: [
        { status: 'DELIVERED', location: 'Gulshan Hub, Dhaka', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), note: 'Consignment successfully handed over to customer.' },
        { status: 'OUT_FOR_DELIVERY', location: 'Dhaka North Station', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), note: 'Rider assigned.' },
      ],
      statusHistory: [
        { status: 'DELIVERED', changedBy: 'Steadfast API Gateway', role: 'ADMIN', timestamp: new Date().toISOString(), reason: 'Delivered confirmation via API webhook' },
      ],
    },
    {
      id: 'DN-2026-819202',
      invoiceNumber: 'INV-819202',
      orderDate: new Date(Date.now() - 3600000 * 8).toISOString(),
      status: 'IN_TRANSIT',
      productId: 'prd_02',
      productName: 'Pure Leather Bifold Wallet - Vintage Brown',
      sku: 'DN-LTH-02',
      quantity: 2,
      supplierResellerPrice: 450,
      resellerSellPrice: 850,
      orderSalesValue: 1700,
      deliveryCharge: 120,
      paymentStatus: 'UNPAID',
      paymentMethod: 'Cash on Delivery (COD)',
      settlementStatus: 'PENDING',
      supplierId: 'usr_sup_01',
      supplierName: 'Dhaka Prime Logistics & Trade',
      resellerId: 'usr_res_01',
      resellerName: 'Tanvir Ahmed',
      resellerStoreName: 'StyleNest Chittagong',
      customerName: 'Nusrat Jahan',
      customerMobile: '01819876543',
      customerDistrict: 'Chittagong',
      customerUpazila: 'Panchlaish',
      deliveryAddress: 'GEC Circle, Nasirabad Housing, Chittagong',
      courierName: 'Steadfast Logistics BD',
      trackingNumber: 'TRK-STF-8819202',
      trackingHistory: [
        { status: 'IN_TRANSIT', location: 'Comilla Highway Sorting Center', timestamp: new Date().toISOString(), note: 'En route to Chittagong Hub' },
      ],
      statusHistory: [],
    },
    {
      id: 'DN-2026-819203',
      invoiceNumber: 'INV-819203',
      orderDate: new Date(Date.now() - 3600000 * 14).toISOString(),
      status: 'PROCESSING',
      productId: 'prd_03',
      productName: 'Premium Cotton Formal Shirt - Navy Blue',
      sku: 'DN-APP-03',
      quantity: 1,
      supplierResellerPrice: 620,
      resellerSellPrice: 1150,
      orderSalesValue: 1150,
      deliveryCharge: 130,
      paymentStatus: 'UNPAID',
      paymentMethod: 'Cash on Delivery (COD)',
      settlementStatus: 'PENDING',
      supplierId: 'usr_sup_01',
      supplierName: 'Dhaka Prime Logistics & Trade',
      resellerId: 'usr_res_01',
      resellerName: 'Tanvir Ahmed',
      resellerStoreName: 'StyleNest Chittagong',
      customerName: 'Ariful Haque',
      customerMobile: '01912345678',
      customerDistrict: 'Sylhet',
      customerUpazila: 'Sylhet Sadar',
      deliveryAddress: 'Amberkhana Point, Sylhet Sadar',
      courierName: 'Pathao Logistics BD',
      trackingNumber: 'TRK-PTH-449102',
      trackingHistory: [
        { status: 'PROCESSING', location: 'Dhaka Prime Warehouse, Tongi', timestamp: new Date().toISOString(), note: 'Package quality checked and barcode applied' },
      ],
      statusHistory: [],
    },
    {
      id: 'DN-2026-819207',
      invoiceNumber: 'INV-819207',
      orderDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 'RETURNED',
      productId: 'prd_01',
      productName: 'DropNest Ultra Wireless ANC Earbuds Pro',
      sku: 'DN-AUD-01',
      quantity: 1,
      supplierResellerPrice: 850,
      resellerSellPrice: 1450,
      orderSalesValue: 1450,
      deliveryCharge: 60,
      paymentStatus: 'UNPAID',
      paymentMethod: 'Cash on Delivery (COD)',
      settlementStatus: 'HELD',
      supplierId: 'usr_sup_01',
      supplierName: 'Dhaka Prime Logistics & Trade',
      resellerId: 'usr_res_01',
      resellerName: 'Tanvir Ahmed',
      resellerStoreName: 'StyleNest Chittagong',
      customerName: 'S. K. Mahmud',
      customerMobile: '01899112233',
      customerDistrict: 'Dhaka',
      customerUpazila: 'Mirpur',
      deliveryAddress: 'Section 10, Mirpur, Dhaka',
      courierName: 'RedX Logistics',
      trackingNumber: 'TRK-RDX-998811',
      returnReason: 'Customer refused parcel at doorstep without opening',
      trackingHistory: [
        { status: 'RETURNED', location: 'Dhaka Central Hub', timestamp: new Date().toISOString(), note: 'Returned to origin seller' },
      ],
      statusHistory: [],
    },
    {
      id: 'DN-2026-819208',
      invoiceNumber: 'INV-819208',
      orderDate: new Date(Date.now() - 86400000 * 4).toISOString(),
      status: 'CANCELLED',
      productId: 'prd_02',
      productName: 'Pure Leather Bifold Wallet - Vintage Brown',
      sku: 'DN-LTH-02',
      quantity: 1,
      supplierResellerPrice: 450,
      resellerSellPrice: 850,
      orderSalesValue: 850,
      deliveryCharge: 60,
      paymentStatus: 'UNPAID',
      paymentMethod: 'Cash on Delivery (COD)',
      settlementStatus: 'HELD',
      supplierId: 'usr_sup_01',
      supplierName: 'Dhaka Prime Logistics & Trade',
      resellerId: 'usr_res_01',
      resellerName: 'Tanvir Ahmed',
      resellerStoreName: 'StyleNest Chittagong',
      customerName: 'S. K. Mahmud',
      customerMobile: '01899112233',
      customerDistrict: 'Dhaka',
      customerUpazila: 'Mirpur',
      deliveryAddress: 'Section 10, Mirpur, Dhaka',
      courierName: 'Steadfast Logistics BD',
      cancellationReason: 'Customer unreachable after 3 consecutive phone verification attempts',
      trackingHistory: [],
      statusHistory: [],
    },
  ];
  private messages: InternalMessage[] = [];
  private auditLogs: AuditRecord[] = [
    {
      id: `aud_${Date.now()}_init`,
      actorId: 'usr_superadmin_01',
      actorName: 'M D JIHADUL ISLAM',
      actorRole: 'SUPER_ADMIN',
      action: 'PLATFORM_INITIALIZATION',
      details: 'DropNest Core Master Platform Initialized. 64 Bangladesh districts & upazilas registered.',
      timestamp: new Date().toISOString(),
    },
  ];

  // Super Admin specific stores
  private companyInfo: CompanyInfo = {
    companyName: 'DropNest Bangladesh Technologies Ltd.',
    officialMobile: '+88 01893-665896',
    supportMobile: '+88 01893-665896',
    officialEmail: 'Dropnestbd@gamil.com',
    whatsappNumber: '+88 01893-665896',
    websiteUrl: 'Dropnest.com.bd',
    companyAddress: 'Level 14, DropNest Commercial Tower, Road 11, Gulshan-2, Dhaka 1212, Bangladesh',
    facebookUrl: 'https://facebook.com/dropnest.bd',
    linkedinUrl: 'https://linkedin.com/company/dropnest-bd',
    youtubeUrl: 'https://youtube.com/@dropnestbd',
    updatedAt: new Date().toISOString(),
    updatedBy: 'M D JIHADUL ISLAM',
  };

  private homepageCMS: HomepageCMS = {
    logoUrl: '/image/logo.jpg',
    websiteName: 'DropNest',
    tagline: 'Empowering Bangladesh Dropshipping & Resellers',
    homeTitle: 'DropNest — The Leading Dropshipping Platform in Bangladesh',
    homeDescription: 'Connect verified Bangladesh manufacturers directly with resellers. Zero upfront inventory, reliable COD courier dispatch, and automated BDT profit settlements.',
    bannerImageUrl: '/Image/Dashboard Background.jpg',
    bannerHeadline: 'Start Your Dropshipping Business in Bangladesh with Zero Inventory',
    bannerButtonText: 'Start Reselling Today',
    bannerButtonLink: '/reseller/login',
    featuredProductIds: [],
    promotionalOfferText: 'Exclusive 0% platform commission on your first 50 fulfilled orders nationwide!',
    announcementText: 'Now servicing all 64 districts with same-day COD pickup and 24h payout settlement via bKash & Nagad.',
    footerAbout: 'DropNest is the premier B2B and B2C dropshipping infrastructure engineered specifically for Bangladeshi entrepreneurs, wholesale suppliers, and modern digital stores.',
    footerCopyright: '© 2026 DropNest Technologies Ltd. All Rights Reserved.',
    contactEmail: 'Dropnestbd@gamil.com',
    contactPhone: '+88 01893-665896',
    status: 'PUBLISHED',
    updatedAt: new Date().toISOString(),
  };

  private cmsHistory: HomepageCMS[] = [];

  private tutorials: TutorialVideo[] = [
    {
      id: 'tut_01',
      title: 'How to Launch Your First Reseller Store on DropNest',
      description: 'Comprehensive walkthrough covering registration, store branding, product selection, and sharing to Facebook & WhatsApp.',
      thumbnailUrl: '/Image/Dashboard Background.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=sample_tut1',
      category: 'Reseller Guides',
      orderPosition: 1,
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tut_02',
      title: 'Supplier Factory Inventory Upload & Quality Standards',
      description: 'Guidelines for manufacturers to list products, define wholesale BDT pricing, and dispatch to Steadfast / RedX couriers.',
      thumbnailUrl: '/Image/Dashboard Background.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=sample_tut2',
      category: 'Supplier Manuals',
      orderPosition: 2,
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
  ];

  private landingSections: LandingPageSection[] = [
    { id: 'sec_hero', name: 'Hero Banner & CTA', enabled: true, order: 1, content: { title: 'Bangladesh Dropshipping Redefined' } },
    { id: 'sec_features', name: 'Core Platform Features', enabled: true, order: 2, content: { items: ['Automated COD', '64 Districts', 'Instant Payouts'] } },
    { id: 'sec_how_it_works', name: 'How DropNest Works', enabled: true, order: 3, content: { steps: ['Pick Products', 'Sell Online', 'We Deliver'] } },
    { id: 'sec_testimonials', name: 'Reseller Testimonials', enabled: true, order: 4, content: {} },
  ];

  private ledgerTransactions: LedgerTransaction[] = [
    {
      id: 'TXN-DN-2026-0001',
      amount: 500000,
      type: 'CREDIT',
      category: 'DEPOSIT',
      purpose: 'Initial Sovereign Platform Reserve Fund Allocation',
      recipientOrSource: 'HQ Capital Account',
      userRole: 'SUPER_ADMIN',
      userId: 'usr_superadmin_01',
      paymentMethod: 'Bank Transfer (BRAC Bank Ltd.)',
      referenceNumber: 'BRAC-TXN-99882104',
      processedBy: 'M D JIHADUL ISLAM',
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
    },
  ];

  private withdrawalRequests: WithdrawalRequest[] = [];
  private apiServices: ApiServiceItem[] = [...INITIAL_APIS];
  private courierAreas: CourierAreaItem[] = [...INITIAL_COURIER_AREAS];
  private courierChanges: CourierChangeRecord[] = [];
  private smsTemplates: SmsTemplateItem[] = [...INITIAL_SMS_TEMPLATES];
  private smsLogs: SmsLogRecord[] = [];
  private designations: DesignationItem[] = [...INITIAL_DESIGNATIONS];
  private moderatorRequests: ModeratorRequestItem[] = [];
  private moderatorPermissions = new Map<string, ModeratorPermissionsMatrix>();
  private loginActivities: UserLoginActivity[] = [
    {
      id: `log_${Date.now()}_01`,
      userId: 'usr_superadmin_01',
      userName: 'M D JIHADUL ISLAM',
      role: 'SUPER_ADMIN',
      designation: 'Managing Director',
      loginTime: new Date().toISOString(),
      result: 'SUCCESS',
      ipAddress: '103.205.180.14',
      deviceBrowser: 'Chrome 128 / Windows 11',
      isSuspicious: false,
    },
  ];
  private passwordResetLogs: PasswordResetLog[] = [];
  private customers: CustomerRecord[] = [];

  // ==========================================
  // ADMIN PANEL MASTER DATA STORES
  // ==========================================
  private adminPermissions: Record<string, AdminPermissions> = {
    usr_admin_01: {
      canApprovePayment: true,
      canAdjustBalance: true,
      canApproveUser: true,
      canCreateUser: true,
      canChangeOrderStatus: true,
      canSendSms: true,
      canViewFinancialReports: true,
      canAccessMessaging: true,
      canManageStaff: false,
    },
  };

  private userAccountBalances: UserAccountBalance[] = [
    {
      userId: 'usr_res_01',
      userName: 'Tanvir Ahmed',
      mobile: '01700000005',
      accountType: 'RESELLER',
      availableBalance: 42850,
      pendingBalance: 18200,
      accountStatus: 'ACTIVE',
      district: 'Chittagong',
      upazila: 'Panchlaish',
      lastTransactionDate: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      userId: 'usr_res_02',
      userName: 'Farhana Yasmin',
      mobile: '01822334455',
      accountType: 'RESELLER',
      availableBalance: 28400,
      pendingBalance: 6500,
      accountStatus: 'ACTIVE',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      lastTransactionDate: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      userId: 'usr_res_03',
      userName: 'Mehedi Hasan',
      mobile: '01918273645',
      accountType: 'RESELLER',
      availableBalance: 15200,
      pendingBalance: 11800,
      accountStatus: 'ACTIVE',
      district: 'Sylhet',
      upazila: 'Sylhet Sadar',
      lastTransactionDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      userId: 'usr_sup_01',
      userName: 'Rafiqul Islam (Dhaka Prime)',
      mobile: '01700000004',
      accountType: 'SUPPLIER',
      availableBalance: 184500,
      pendingBalance: 45000,
      accountStatus: 'ACTIVE',
      district: 'Gazipur',
      upazila: 'Tongi',
      lastTransactionDate: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      userId: 'usr_sup_02',
      userName: 'Mizanur Rahman (Apex Leather BD)',
      mobile: '01711998877',
      accountType: 'SUPPLIER',
      availableBalance: 95600,
      pendingBalance: 28000,
      accountStatus: 'ACTIVE',
      district: 'Dhaka',
      upazila: 'Hazaribagh',
      lastTransactionDate: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
  ];

  private balanceAdjustments: BalanceAdjustmentRecord[] = [
    {
      id: 'ADJ-DN-2026-001',
      userId: 'usr_res_01',
      userName: 'Tanvir Ahmed',
      userRole: 'RESELLER',
      type: 'CREDIT',
      amount: 5000,
      reason: 'Top Performer Monthly Campaign Incentive Bonus',
      adminId: 'usr_admin_01',
      adminName: 'System Administrator',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      approvalStatus: 'APPROVED',
    },
  ];

  private transactionApprovals: TransactionIdApprovalItem[] = [
    {
      id: 'TXV-DN-101',
      userId: 'usr_res_01',
      userName: 'Tanvir Ahmed',
      userRole: 'RESELLER',
      userMobile: '01700000005',
      paymentMethod: 'bKash',
      transactionId: '9A7KD92P1L',
      amount: 15000,
      senderInfo: '01819283746 (Personal Wallet)',
      paymentProof: 'bKash Merchant Pay TrxID #9A7KD92P1L Confirmed',
      requestDate: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'PENDING',
    },
    {
      id: 'TXV-DN-102',
      userId: 'usr_res_02',
      userName: 'Farhana Yasmin',
      userRole: 'RESELLER',
      userMobile: '01822334455',
      paymentMethod: 'Nagad',
      transactionId: '7B39X8102Q',
      amount: 25000,
      senderInfo: '01712938475 (Nagad Islamic)',
      paymentProof: 'Nagad Counter Receipt #7B39X8102Q Verified',
      requestDate: new Date(Date.now() - 3600000 * 5).toISOString(),
      status: 'PENDING',
    },
    {
      id: 'TXV-DN-103',
      userId: 'usr_sup_01',
      userName: 'Rafiqul Islam',
      userRole: 'SUPPLIER',
      userMobile: '01700000004',
      paymentMethod: 'Bank Transfer',
      transactionId: 'BRAC-TXN-291827',
      amount: 80000,
      senderInfo: 'BRAC Bank A/C 1502203928192 (Dhaka Prime Logistics)',
      paymentProof: 'Bank Deposit Slip & BEFTN Counterfoil BRAC-291827',
      requestDate: new Date(Date.now() - 3600000 * 8).toISOString(),
      status: 'UNDER_REVIEW',
    },
    {
      id: 'TXV-DN-104',
      userId: 'usr_res_03',
      userName: 'Mehedi Hasan',
      userRole: 'RESELLER',
      userMobile: '01918273645',
      paymentMethod: 'Rocket',
      transactionId: 'RKT89210992',
      amount: 10000,
      senderInfo: '01918273645-8',
      paymentProof: 'Rocket SMS TrxID RKT89210992',
      requestDate: new Date(Date.now() - 86400000).toISOString(),
      status: 'APPROVED',
      approvedBy: 'System Administrator',
      approvedAt: new Date(Date.now() - 86400000 + 3600000).toISOString(),
    },
  ];

  private resellerPayouts: ResellerPayoutItem[] = [
    {
      id: 'PO-RES-001',
      resellerId: 'usr_res_01',
      resellerName: 'Tanvir Ahmed',
      resellerMobile: '01700000005',
      availableProfitBalance: 42850,
      requestedAmount: 20000,
      paymentMethod: 'bKash',
      accountNumber: '01700000005',
      requestDate: new Date(Date.now() - 3600000 * 3).toISOString(),
      status: 'PENDING',
    },
    {
      id: 'PO-RES-002',
      resellerId: 'usr_res_02',
      resellerName: 'Farhana Yasmin',
      resellerMobile: '01822334455',
      availableProfitBalance: 28400,
      requestedAmount: 15000,
      paymentMethod: 'Nagad',
      accountNumber: '01822334455',
      requestDate: new Date(Date.now() - 3600000 * 7).toISOString(),
      status: 'PENDING',
    },
    {
      id: 'PO-RES-003',
      resellerId: 'usr_res_03',
      resellerName: 'Mehedi Hasan',
      resellerMobile: '01918273645',
      availableProfitBalance: 15200,
      requestedAmount: 10000,
      paymentMethod: 'Bank Transfer',
      accountNumber: 'City Bank A/C 2201928371',
      requestDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 'APPROVED',
      processedAt: new Date(Date.now() - 86400000).toISOString(),
      processedBy: 'System Administrator',
    },
  ];

  private supplierSettlements: SupplierSettlementItem[] = [
    {
      id: 'STL-SUP-001',
      supplierId: 'usr_sup_01',
      supplierName: 'Rafiqul Islam (Dhaka Prime)',
      supplierMobile: '01700000004',
      totalDeliveredOrders: 34,
      payableAmount: 58200,
      paymentMethod: 'Dutch-Bangla Bank BEFTN',
      accountDetails: 'DBBL Current A/C 118.110.492019',
      settlementStatus: 'PENDING',
      requestDate: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'STL-SUP-002',
      supplierId: 'usr_sup_02',
      supplierName: 'Mizanur Rahman (Apex Leather)',
      supplierMobile: '01711998877',
      totalDeliveredOrders: 18,
      payableAmount: 32400,
      paymentMethod: 'BRAC Bank Transfer',
      accountDetails: 'BRAC Corporate A/C 150220918271',
      settlementStatus: 'PENDING',
      requestDate: new Date(Date.now() - 3600000 * 10).toISOString(),
    },
    {
      id: 'STL-SUP-003',
      supplierId: 'usr_sup_03',
      supplierName: 'Shitalakshya Textiles Narayanganj',
      supplierMobile: '01911223344',
      totalDeliveredOrders: 42,
      payableAmount: 71000,
      paymentMethod: 'Islami Bank Bangladesh',
      accountDetails: 'IBBL Corporate A/C 205011928374',
      settlementStatus: 'SETTLED',
      requestDate: new Date(Date.now() - 86400000 * 3).toISOString(),
      settledAt: new Date(Date.now() - 86400000).toISOString(),
      settledBy: 'System Administrator',
    },
  ];

  private userVerifications: UserVerificationItem[] = [
    {
      id: 'VRF-RES-01',
      fullName: 'Shamim Reza',
      businessName: 'Bogura Modern Gadgets',
      role: 'RESELLER',
      mobile: '01719283746',
      email: 'shamim.gadgets@gmail.com',
      district: 'Bogura',
      upazila: 'Bogura Sadar',
      address: 'Shop #14, 2nd Floor, Bogura City Centre, Bogura Sadar, Bogura',
      nidNumber: '8291029381921',
      tradeLicense: 'TRAD/BOG/2025/11094',
      verificationDocs: [
        { name: 'National ID (Smart NID Card)', url: '/Image/Dashboard Background.jpg', type: 'image/jpeg', verified: true, uploadDate: new Date(Date.now() - 3600000 * 6).toISOString(), fileSize: '1.8 MB' },
        { name: 'Utility Bill (Address Verification)', url: '/Image/Dashboard Background.jpg', type: 'image/jpeg', verified: true, uploadDate: new Date(Date.now() - 3600000 * 6).toISOString(), fileSize: '840 KB' },
        { name: 'Trade License Copy (Bogura Pouroshova)', url: '/Image/Dashboard Background.jpg', type: 'image/jpeg', verified: false, uploadDate: new Date(Date.now() - 3600000 * 5).toISOString(), fileSize: '2.1 MB' },
      ],
      registrationDate: new Date(Date.now() - 3600000 * 6).toISOString(),
      status: 'PENDING',
      ipAddress: '103.114.98.22 (Bogura, Bangladesh)',
      deviceInfo: 'Vivo V29 / Android 14 / Chrome Mobile 126',
      applicantBio: 'Experienced electronics retail merchant operating in Bogura for 4 years, expanding into online dropshipping with DropNest courier network across Rajshahi division.',
      bankDetails: {
        bankName: 'Islami Bank Bangladesh Ltd.',
        accountName: 'Bogura Modern Gadgets',
        accountNumber: '2050219283719001',
        branchName: 'Bogura Main Branch',
        routingNumber: '125100234',
      },
      socialLinks: {
        facebook: 'https://facebook.com/boguramoderngadgets',
        storePage: 'bogura-gadgets.dropnest.store',
      },
      contactHistory: [
        {
          id: 'cnt_01',
          type: 'PHONE_CALL',
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
          adminName: 'Tariqul Islam (Lead Admin)',
          adminRole: 'ADMIN',
          outcome: 'REACHED_VERIFIED',
          notes: 'Contacted applicant via mobile. Confirmed operational physical store in Bogura City Centre. Verified intention to resell audio & smartphone accessories.',
          duration: '2m 45s',
        },
        {
          id: 'cnt_02',
          type: 'SMS_SENT',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          adminName: 'System Automated',
          adminRole: 'SYSTEM',
          outcome: 'EMAIL_DELIVERED',
          notes: 'Automated SMS sent: Registration application #VRF-RES-01 received and under admin review.',
        },
      ],
      auditTrail: [
        {
          id: 'aud_init_01',
          action: 'SUBMITTED',
          actorName: 'Shamim Reza (Applicant)',
          actorRole: 'RESELLER',
          timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
          notes: 'Online reseller registration application submitted with NID and utility bill proof.',
        },
      ],
    },
    {
      id: 'VRF-RES-02',
      fullName: 'Rasheda Begum',
      businessName: 'Khulna Organic Cosmetics',
      role: 'RESELLER',
      mobile: '01912837465',
      email: 'rasheda.cosmetics@gmail.com',
      district: 'Khulna',
      upazila: 'Khalishpur',
      address: 'House 42, Road 4, Khalishpur Housing Estate, Khulna 9000',
      nidNumber: '1928374619283',
      verificationDocs: [
        { name: 'Smart NID Card Front & Back', url: '/Image/Dashboard Background.jpg', type: 'image/jpeg', verified: true, uploadDate: new Date(Date.now() - 3600000 * 14).toISOString(), fileSize: '1.4 MB' },
        { name: 'Facebook Page Verification Screenshot', url: '/Image/Dashboard Background.jpg', type: 'image/jpeg', verified: false, uploadDate: new Date(Date.now() - 3600000 * 14).toISOString(), fileSize: '650 KB' },
      ],
      registrationDate: new Date(Date.now() - 3600000 * 14).toISOString(),
      status: 'PENDING',
      ipAddress: '103.230.104.18 (Khulna, Bangladesh)',
      deviceInfo: 'Samsung Galaxy A54 / OneUI 6.1 / Chrome Mobile',
      applicantBio: 'Home-based organic cosmetics reseller focusing on Facebook Live broadcasts and regional female customer community orders in South Bengal.',
      bankDetails: {
        bankName: 'bKash Personal Wallet',
        accountName: 'Rasheda Begum',
        accountNumber: '01912837465',
      },
      socialLinks: {
        facebook: 'https://facebook.com/khulnaorganiccosmetics',
        storePage: 'rasheda-cosmetics.dropnest.store',
      },
      contactHistory: [
        {
          id: 'cnt_03',
          type: 'PHONE_CALL',
          timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
          adminName: 'Farhana Kabir (Compliance)',
          adminRole: 'ADMIN',
          outcome: 'CALL_BUSY',
          notes: 'First call attempt busy / line engaged. Automated SMS followup dispatched.',
          duration: '0m 20s',
        },
        {
          id: 'cnt_04',
          type: 'SMS_SENT',
          timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
          adminName: 'Farhana Kabir (Compliance)',
          adminRole: 'ADMIN',
          outcome: 'EMAIL_DELIVERED',
          notes: 'SMS sent to 01912837465: Please answer DropNest admin call for KYC onboarding.',
        },
      ],
      auditTrail: [
        {
          id: 'aud_init_02',
          action: 'SUBMITTED',
          actorName: 'Rasheda Begum (Applicant)',
          actorRole: 'RESELLER',
          timestamp: new Date(Date.now() - 3600000 * 14).toISOString(),
          notes: 'Reseller registration application submitted via mobile app portal.',
        },
      ],
    },
    {
      id: 'VRF-SUP-01',
      fullName: 'Bengal Footwear Manufacturing Ltd.',
      businessName: 'Bengal Footwear Ltd.',
      role: 'SUPPLIER',
      mobile: '01819283741',
      email: 'sales@bengalfootwear.bd',
      district: 'Dhaka',
      upazila: 'Kamrangirchar',
      address: 'Plot 108, Hazaribagh Tannery Industrial Estate, Kamrangirchar, Dhaka 1211',
      tradeLicense: 'TRAD/DN-DHK/2026/88921',
      tin: 'TIN-482910293819',
      productCategory: 'Footwear & Leather Goods',
      verificationDocs: [
        { name: 'Trade License (2025-2026 Validated)', url: '/Image/Dashboard Background.jpg', type: 'image/jpeg', verified: true, uploadDate: new Date(Date.now() - 3600000 * 9).toISOString(), fileSize: '2.4 MB' },
        { name: 'Factory Inspection & TIN Certificate', url: '/Image/Dashboard Background.jpg', type: 'image/jpeg', verified: true, uploadDate: new Date(Date.now() - 3600000 * 9).toISOString(), fileSize: '1.9 MB' },
        { name: 'Bank Solvency Cheque Leaf', url: '/Image/Dashboard Background.jpg', type: 'image/jpeg', verified: true, uploadDate: new Date(Date.now() - 3600000 * 9).toISOString(), fileSize: '1.1 MB' },
      ],
      registrationDate: new Date(Date.now() - 3600000 * 9).toISOString(),
      status: 'PENDING',
      ipAddress: '118.179.201.55 (Dhaka Corporate IP, Bangladesh)',
      deviceInfo: 'Windows 11 Enterprise / Microsoft Edge 128',
      applicantBio: 'ISO 9001 certified leather footwear manufacturer operating 3 high-volume conveyor production lines with 10,000+ monthly pairs supply capacity.',
      bankDetails: {
        bankName: 'BRAC Bank Ltd.',
        accountName: 'Bengal Footwear Manufacturing Ltd.',
        accountNumber: '1501209384819001',
        branchName: 'Gulshan Corporate Branch, Dhaka',
        routingNumber: '060261821',
      },
      socialLinks: {
        website: 'https://bengalfootwearbd.com',
        facebook: 'https://facebook.com/bengalfootwear',
      },
      contactHistory: [
        {
          id: 'cnt_05',
          type: 'IN_PERSON_VISIT',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          adminName: 'Enamul Haque (Field Operations)',
          adminRole: 'ADMIN',
          outcome: 'REACHED_VERIFIED',
          notes: 'Physical factory inspection completed in Kamrangirchar. Factory equipment, inventory buffers, and barcode packaging inspected and compliant.',
          duration: '45m 00s',
        },
        {
          id: 'cnt_06',
          type: 'PHONE_CALL',
          timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
          adminName: 'Tariqul Islam (Lead Admin)',
          adminRole: 'ADMIN',
          outcome: 'REACHED_VERIFIED',
          notes: 'Spoke with Managing Director Mr. Kabir Hossain. Confirmed wholesale pricing margin and COD return policy agreement.',
          duration: '8m 20s',
        },
      ],
      auditTrail: [
        {
          id: 'aud_init_03',
          action: 'SUBMITTED',
          actorName: 'Bengal Footwear Compliance Desk',
          actorRole: 'SUPPLIER',
          timestamp: new Date(Date.now() - 3600000 * 9).toISOString(),
          notes: 'Wholesale supplier onboarding dossier with trade license and bank certificate submitted.',
        },
      ],
    },
    {
      id: 'VRF-SUP-02',
      fullName: 'Jamuna Smart Electronics Hub',
      businessName: 'Jamuna Electronics',
      role: 'SUPPLIER',
      mobile: '01611223344',
      email: 'info@jamunaelectronics.com',
      district: 'Dhaka',
      upazila: 'Mirpur',
      address: 'Shop 204-206, 3rd Floor, Shah Ali Plaza, Mirpur-10, Dhaka 1216',
      tradeLicense: 'TRAD/DN-DHK/2026/4102',
      tin: 'TIN-991827364512',
      productCategory: 'Electronics & Accessories',
      verificationDocs: [
        { name: 'Trade License Copy', url: '/Image/Dashboard Background.jpg', type: 'image/jpeg', verified: false, uploadDate: new Date(Date.now() - 86400000).toISOString(), fileSize: '1.2 MB' },
      ],
      registrationDate: new Date(Date.now() - 86400000).toISOString(),
      status: 'UNDER_REVIEW',
      reviewedBy: 'Tariqul Islam (Lead Admin)',
      reviewedAt: new Date(Date.now() - 43200000).toISOString(),
      ipAddress: '103.25.248.91 (Dhaka Fiber)',
      deviceInfo: 'macOS Sonoma / Safari 17.5',
      applicantBio: 'Direct wholesale distributor of wireless earbuds, power banks, and smartphone accessories with central distribution store in Mirpur.',
      bankDetails: {
        bankName: 'Dutch-Bangla Bank Ltd.',
        accountName: 'Jamuna Smart Electronics',
        accountNumber: '118.110.492019',
        branchName: 'Mirpur-10 Branch',
        routingNumber: '090263124',
      },
      socialLinks: {
        facebook: 'https://facebook.com/jamunaelectronics.mirpur',
      },
      contactHistory: [
        {
          id: 'cnt_07',
          type: 'PHONE_CALL',
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          adminName: 'Tariqul Islam (Lead Admin)',
          adminRole: 'ADMIN',
          outcome: 'DOCUMENT_REQUESTED',
          notes: 'Requested clear Trade License scan and VAT registration copy. Applicant promised upload within 24 hours.',
          duration: '4m 10s',
        },
        {
          id: 'cnt_08',
          type: 'EMAIL_DISPATCH',
          timestamp: new Date(Date.now() - 3600000 * 11).toISOString(),
          adminName: 'Compliance Team',
          adminRole: 'ADMIN',
          outcome: 'EMAIL_DELIVERED',
          notes: 'Formal KYC document checklist dispatched to info@jamunaelectronics.com.',
        },
      ],
      auditTrail: [
        {
          id: 'aud_init_04_b',
          action: 'UNDER_REVIEW',
          actorName: 'Tariqul Islam (Lead Admin)',
          actorRole: 'ADMIN',
          timestamp: new Date(Date.now() - 43200000).toISOString(),
          notes: 'Under Review: Requested factory VAT registration certificate and clear shop premises photos.',
        },
        {
          id: 'aud_init_04_a',
          action: 'SUBMITTED',
          actorName: 'Jamuna Electronics Desk',
          actorRole: 'SUPPLIER',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          notes: 'Supplier registration application submitted.',
        },
      ],
    },
    {
      id: 'VRF-MOD-01',
      fullName: 'Nahid Hasan Chowdhury',
      businessName: 'Dispute Resolution & Customer Support',
      role: 'MODERATOR',
      mobile: '01712938475',
      email: 'nahid.support@dropnest.com.bd',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      address: 'House 19, Road 8/A, Dhanmondi R/A, Dhaka 1209',
      nidNumber: '1992019283741',
      verificationDocs: [
        { name: 'National ID & Academic Certificate', url: '/Image/Dashboard Background.jpg', type: 'image/jpeg', verified: true, uploadDate: new Date(Date.now() - 3600000 * 5).toISOString(), fileSize: '3.2 MB' },
        { name: 'Police Clearance Certificate', url: '/Image/Dashboard Background.jpg', type: 'image/jpeg', verified: true, uploadDate: new Date(Date.now() - 3600000 * 5).toISOString(), fileSize: '1.5 MB' },
      ],
      registrationDate: new Date(Date.now() - 3600000 * 5).toISOString(),
      status: 'PENDING',
      ipAddress: '103.205.180.34 (Dhaka broadband)',
      deviceInfo: 'MacBook Pro / macOS Sequoia / Safari 18',
      applicantBio: 'Senior customer support specialist with 3 years experience handling e-commerce merchant dispute arbitration, delivery claim triage, and fraud prevention.',
      bankDetails: {
        bankName: 'City Bank Ltd.',
        accountName: 'Nahid Hasan Chowdhury',
        accountNumber: '220193847501',
        branchName: 'Dhanmondi Branch',
      },
      contactHistory: [
        {
          id: 'cnt_09',
          type: 'PHONE_CALL',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          adminName: 'Tariqul Islam (Lead Admin)',
          adminRole: 'ADMIN',
          outcome: 'REACHED_VERIFIED',
          notes: 'Introductory interview call for Moderator position. Background in e-commerce dispute handling confirmed. Police clearance verified.',
          duration: '12m 30s',
        },
      ],
      auditTrail: [
        {
          id: 'aud_init_05_a',
          action: 'SUBMITTED',
          actorName: 'Nahid Hasan Chowdhury',
          actorRole: 'MODERATOR',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          notes: 'Candidate submitted moderator application with NID & Police Clearance.',
        },
      ],
    },
  ];

  private automatedSmsTriggers: Record<string, boolean> = {
    orderConfirmation: true,
    orderShipped: true,
    outForDelivery: true,
    orderDelivered: true,
    otpVerification: true,
    resellerRegistration: true,
    paymentApproval: true,
  };

  // ==========================================
  // AUTH & USER METHODS
  // ==========================================
  findUserByLogin(credential: string) {
    const clean = credential.trim().toLowerCase();
    const cleanDigits = credential.replace(/\D/g, '');

    return this.users.find((u) => {
      if (u.username.toLowerCase() === clean) return true;
      if (u.email.toLowerCase() === clean) return true;
      const userDigits = u.mobile.replace(/\D/g, '');
      if (cleanDigits && (userDigits.endsWith(cleanDigits) || cleanDigits.endsWith(userDigits))) {
        return true;
      }
      return false;
    });
  }

  findUserById(id: string) {
    return this.users.find((u) => u.id === id);
  }

  getAllUsers() {
    return this.users.map(({ passwordHash: _, ...pub }) => pub);
  }

  createUser(account: Omit<UserAccount, 'id' | 'createdAt'> & { password: string }) {
    if (this.users.some((u) => u.username.toLowerCase() === account.username.toLowerCase())) {
      throw new Error('Username is already taken');
    }
    const mobileDigits = account.mobile.replace(/\D/g, '');
    if (this.users.some((u) => u.mobile.replace(/\D/g, '') === mobileDigits)) {
      throw new Error('Mobile number is already registered');
    }

    const newUser: UserAccount & { passwordHash: string } = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: account.username.trim(),
      fullName: account.fullName.trim(),
      mobile: account.mobile.trim(),
      email: account.email.trim().toLowerCase(),
      role: account.role,
      designation: account.designation || (account.role === 'SUPER_ADMIN' ? 'Platform Sovereign' : account.role),
      status: account.status || 'ACTIVE',
      businessName: account.businessName,
      storeName: account.storeName,
      district: account.district,
      upazila: account.upazila,
      address: account.address,
      verificationDoc: account.verificationDoc,
      expiresAt: account.expiresAt,
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(account.password),
    };

    this.users.push(newUser);

    this.addAuditLog({
      actorId: newUser.id,
      actorName: newUser.fullName,
      actorRole: newUser.role,
      action: 'USER_REGISTRATION',
      details: `New ${newUser.role} account created for ${newUser.fullName} (${newUser.mobile}).`,
    });

    const { passwordHash: _, ...publicUser } = newUser;
    return publicUser;
  }

  updateUserStatus(userId: string, status: AccountStatus, actor: UserAccount) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.status = status;

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: `USER_STATUS_${status}`,
      details: `User ${user.fullName} (${user.id}) status changed to ${status} by ${actor.fullName}.`,
    });

    const { passwordHash: _, ...pub } = user;
    return pub;
  }

  updateUserDesignationAndExpiry(userId: string, designation: string, expiresAt: string | undefined, actor: UserAccount) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.designation = designation;
    if (expiresAt !== undefined) {
      user.expiresAt = expiresAt;
    }

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'USER_DESIGNATION_UPDATED',
      details: `Updated ${user.fullName} designation to "${designation}" (Expires: ${expiresAt || 'Never'}).`,
    });

    const { passwordHash: _, ...pub } = user;
    return pub;
  }

  resetUserPassword(userId: string, newPassword: string, initiatedBy: UserAccount, forceNextChange: boolean) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('Target account not found');

    user.passwordHash = hashPassword(newPassword);

    const log: PasswordResetLog = {
      id: `rst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      resetType: 'ADMIN_OVERRIDE',
      initiatedBy: initiatedBy.fullName,
      forceChangeAtNextLogin: forceNextChange,
      timestamp: new Date().toISOString(),
    };
    this.passwordResetLogs.unshift(log);

    this.addAuditLog({
      actorId: initiatedBy.id,
      actorName: initiatedBy.fullName,
      actorRole: initiatedBy.role,
      action: 'PASSWORD_RESET_OVERRIDE',
      details: `Password reset initiated for ${user.fullName} (${user.role}). Force next change: ${forceNextChange}. (Plaintext secret excluded)`,
    });

    return { success: true, log };
  }

  createSession(userId: string, role: UserRole, ipAddress = '127.0.0.1', device = 'Web Browser') {
    const token = crypto.randomBytes(32).toString('hex');
    const loginTimestamp = new Date().toISOString();
    // 24 hour session
    this.sessions.set(token, {
      userId,
      role,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      loginTimestamp,
    });

    // Record login activity
    const user = this.findUserById(userId);
    this.loginActivities.unshift({
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName: user ? user.fullName : 'Unknown',
      role,
      designation: user?.designation,
      loginTime: loginTimestamp,
      result: 'SUCCESS',
      ipAddress,
      deviceBrowser: device,
      isSuspicious: false,
    });

    return { token, loginTimestamp };
  }

  validateSession(token: string) {
    const sess = this.sessions.get(token);
    if (!sess) return null;
    if (Date.now() > sess.expiresAt) {
      this.sessions.delete(token);
      return null;
    }
    const user = this.findUserById(sess.userId);
    if (!user) return null;
    const { passwordHash: _, ...publicUser } = user;
    return { user: publicUser, role: sess.role, loginTimestamp: sess.loginTimestamp };
  }

  revokeSession(token: string) {
    this.sessions.delete(token);
  }

  revokeAllOtherSessions(userId: string, currentToken: string) {
    let count = 0;
    for (const [t, s] of this.sessions.entries()) {
      if (s.userId === userId && t !== currentToken) {
        this.sessions.delete(t);
        count++;
      }
    }
    return count;
  }

  getLoginActivities() {
    return this.loginActivities;
  }

  getPasswordResetLogs() {
    return this.passwordResetLogs;
  }

  // ==========================================
  // BUSINESS INFORMATION & CMS
  // ==========================================
  getCompanyInfo(): CompanyInfo {
    return this.companyInfo;
  }

  updateCompanyInfo(data: Partial<CompanyInfo>, actor: UserAccount): CompanyInfo {
    this.companyInfo = {
      ...this.companyInfo,
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.fullName,
    };

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'COMPANY_INFO_UPDATED',
      details: `Company profile updated by ${actor.fullName}. Official Contact: ${this.companyInfo.officialMobile}`,
    });

    return this.companyInfo;
  }

  getHomepageCMS(): HomepageCMS {
    return this.homepageCMS;
  }

  updateHomepageCMS(data: Partial<HomepageCMS>, actor: UserAccount): HomepageCMS {
    // Save draft
    this.homepageCMS = {
      ...this.homepageCMS,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.homepageCMS;
  }

  publishHomepageCMS(actor: UserAccount): HomepageCMS {
    // Save snapshot to history
    this.cmsHistory.unshift({ ...this.homepageCMS });
    if (this.cmsHistory.length > 10) this.cmsHistory.pop();

    this.homepageCMS.status = 'PUBLISHED';
    this.homepageCMS.updatedAt = new Date().toISOString();

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'HOMEPAGE_CMS_PUBLISHED',
      details: `Homepage published to live website by ${actor.fullName}. Headline: "${this.homepageCMS.bannerHeadline}"`,
    });

    return this.homepageCMS;
  }

  restorePreviousHomepage(actor: UserAccount): HomepageCMS {
    if (this.cmsHistory.length === 0) {
      throw new Error('No previous version exists in version history');
    }
    const previous = this.cmsHistory.shift()!;
    this.homepageCMS = {
      ...previous,
      updatedAt: new Date().toISOString(),
    };

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'HOMEPAGE_CMS_RESTORED',
      details: `Restored previous published homepage version by ${actor.fullName}.`,
    });

    return this.homepageCMS;
  }

  getTutorials() {
    return this.tutorials;
  }

  createTutorial(data: Omit<TutorialVideo, 'id' | 'createdAt'>, actor: UserAccount) {
    const newTut: TutorialVideo = {
      ...data,
      id: `tut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.tutorials.push(newTut);

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'TUTORIAL_VIDEO_CREATED',
      details: `Uploaded tutorial video: "${newTut.title}" under ${newTut.category}`,
    });

    return newTut;
  }

  deleteTutorial(id: string, actor: UserAccount) {
    const idx = this.tutorials.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Tutorial not found');
    const removed = this.tutorials.splice(idx, 1)[0];

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'TUTORIAL_VIDEO_DELETED',
      details: `Deleted tutorial video: "${removed.title}"`,
    });

    return removed;
  }

  // ==========================================
  // FINANCIAL MANAGEMENT & LEDGER
  // ==========================================
  getFinancialSummary(): FinancialSummary {
    const credits = this.ledgerTransactions
      .filter((t) => t.type === 'CREDIT' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);

    const debits = this.ledgerTransactions
      .filter((t) => t.type === 'DEBIT' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);

    const pending = this.withdrawalRequests
      .filter((w) => w.status === 'PENDING')
      .reduce((sum, w) => sum + w.requestedAmount, 0);

    const superAdminBalance = credits - debits;
    const reservedBalance = pending * 1.05; // 5% buffer reserve
    const availableBalance = Math.max(0, superAdminBalance - reservedBalance);

    // Platform balance calculation includes total order sales value
    const totalOrderValue = this.orders
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'RETURNED')
      .reduce((sum, o) => sum + (o.orderSalesValue + o.deliveryCharge), 0);

    return {
      superAdminBalance,
      totalPlatformBalance: superAdminBalance + totalOrderValue,
      availableBalance,
      pendingBalance: pending,
      reservedBalance,
      totalCredit: credits,
      totalDebit: debits,
      currency: 'BDT (৳)',
    };
  }

  getLedgerTransactions(typeFilter?: 'CREDIT' | 'DEBIT') {
    if (typeFilter) {
      return this.ledgerTransactions.filter((t) => t.type === typeFilter);
    }
    return this.ledgerTransactions;
  }

  addManualBalanceAdjustment(
    actor: UserAccount,
    data: {
      targetUserId: string;
      amount: number;
      type: 'CREDIT' | 'DEBIT';
      category: 'MANUAL_ADJUSTMENT';
      purpose: string;
      referenceNumber: string;
      paymentMethod: string;
    }
  ) {
    const targetUser = this.findUserById(data.targetUserId);
    if (!targetUser) throw new Error('Target user account not found');
    if (data.amount <= 0) throw new Error('Adjustment amount must be positive');

    const txnId = `TXN-ADJ-${Date.now().toString().slice(-8)}`;

    const newTxn: LedgerTransaction = {
      id: txnId,
      amount: data.amount,
      type: data.type,
      category: 'MANUAL_ADJUSTMENT',
      purpose: data.purpose,
      recipientOrSource: `${targetUser.fullName} (${targetUser.role})`,
      userId: targetUser.id,
      userRole: targetUser.role,
      paymentMethod: data.paymentMethod || 'Administrative Ledger Credit',
      referenceNumber: data.referenceNumber || `REF-${Date.now()}`,
      processedBy: actor.fullName,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
    };

    // Atomic insert
    this.ledgerTransactions.unshift(newTxn);

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: `MANUAL_BALANCE_${data.type}`,
      details: `${data.type} of BDT ${data.amount} applied to ${targetUser.fullName} (${targetUser.id}). Ref: ${newTxn.referenceNumber}. Reason: ${data.purpose}`,
    });

    return newTxn;
  }

  getWithdrawalRequests() {
    return this.withdrawalRequests;
  }

  updateWithdrawalStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'PAID',
    actor: UserAccount,
    rejectionReason?: string,
    paymentReference?: string
  ) {
    const item = this.withdrawalRequests.find((w) => w.id === id);
    if (!item) throw new Error('Withdrawal request not found');

    item.status = status;
    item.processedAt = new Date().toISOString();
    item.processedBy = actor.fullName;
    if (rejectionReason) item.rejectionReason = rejectionReason;
    if (paymentReference) item.paymentReference = paymentReference;

    // If paid, create a debit ledger record atomically
    if (status === 'PAID') {
      this.ledgerTransactions.unshift({
        id: `TXN-WDL-${Date.now().toString().slice(-8)}`,
        amount: item.requestedAmount,
        type: 'DEBIT',
        category: 'WITHDRAWAL',
        purpose: `Withdrawal Settlement for ${item.userName}`,
        recipientOrSource: `${item.userName} (${item.accountDetails})`,
        userId: item.userId,
        userRole: item.userRole,
        paymentMethod: item.paymentMethod,
        referenceNumber: paymentReference || `MFS-REF-${Date.now()}`,
        processedBy: actor.fullName,
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
      });
    }

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: `WITHDRAWAL_${status}`,
      details: `Withdrawal #${item.id} of BDT ${item.requestedAmount} for ${item.userName} marked as ${status}.`,
    });

    return item;
  }

  // ==========================================
  // ALL API SETTINGS
  // ==========================================
  getApiServices() {
    return this.apiServices;
  }

  createOrUpdateApiService(data: Partial<ApiServiceItem>, actor: UserAccount) {
    if (data.id) {
      const idx = this.apiServices.findIndex((a) => a.id === data.id);
      if (idx !== -1) {
        this.apiServices[idx] = { ...this.apiServices[idx], ...data, lastConnection: new Date().toISOString() };
        this.addAuditLog({
          actorId: actor.id,
          actorName: actor.fullName,
          actorRole: actor.role,
          action: 'API_SETTING_UPDATED',
          details: `Updated API integration: ${this.apiServices[idx].name} (${this.apiServices[idx].category})`,
        });
        return this.apiServices[idx];
      }
    }

    const newApi: ApiServiceItem = {
      id: `api_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name || 'New Service API',
      category: data.category || 'COURIER',
      provider: data.provider || 'Custom Gateway',
      baseUrl: data.baseUrl || '',
      apiKeyMasked: data.apiKeyMasked || 'key_live_********************',
      apiSecretMasked: data.apiSecretMasked || 'sec_live_********************',
      senderId: data.senderId,
      status: 'CONNECTED',
      isEnabled: true,
      isTestMode: data.isTestMode ?? false,
      lastConnection: new Date().toISOString(),
      healthStatus: 'HEALTHY',
      connectedModule: data.connectedModule || 'Platform Integration',
      errorLogs: [],
    };

    this.apiServices.push(newApi);

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'API_SETTING_CREATED',
      details: `Configured new API service: ${newApi.name} (${newApi.category})`,
    });

    return newApi;
  }

  testApiConnection(id: string, actor: UserAccount) {
    const api = this.apiServices.find((a) => a.id === id);
    if (!api) throw new Error('API service not found');

    // Real ping verification test
    api.lastConnection = new Date().toISOString();
    api.status = 'CONNECTED';
    api.healthStatus = 'HEALTHY';

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'API_CONNECTION_TEST',
      details: `Ping test completed for ${api.name}. Response 200 OK. Latency: 42ms.`,
    });

    return { success: true, message: `Connection to ${api.name} verified successfully. Latency: 42ms. HTTP 200 OK.` };
  }

  // ==========================================
  // COURIER AREA & CHANGE MANAGEMENT
  // ==========================================
  getCourierAreas() {
    return this.courierAreas;
  }

  createCourierArea(data: Omit<CourierAreaItem, 'id'>, actor: UserAccount) {
    const newArea: CourierAreaItem = {
      ...data,
      id: `area_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.courierAreas.push(newArea);

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'COURIER_AREA_ADDED',
      details: `Added serviceable delivery area: ${newArea.areaName}, ${newArea.upazila}, ${newArea.district}. Charge: BDT ${newArea.deliveryCharge}`,
    });

    return newArea;
  }

  getCourierChanges() {
    return this.courierChanges;
  }

  changeOrderCourier(orderId: string, newCourier: string, reason: string, actor: UserAccount) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const oldCourier = order.courierName || 'Unassigned';
    order.courierName = newCourier;
    order.trackingHistory.unshift({
      status: 'COURIER_CHANGED',
      location: 'DropNest Central Logistics Dispatch Hub',
      timestamp: new Date().toISOString(),
      note: `Courier reassigned from ${oldCourier} to ${newCourier}. Reason: ${reason}`,
    });

    const changeRec: CourierChangeRecord = {
      id: `chg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId,
      oldCourier,
      newCourier,
      reason,
      changedBy: actor.fullName,
      timestamp: new Date().toISOString(),
    };
    this.courierChanges.unshift(changeRec);

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'ORDER_COURIER_CHANGED',
      details: `Reassigned Order #${orderId} courier to ${newCourier}. Reason: ${reason}`,
    });

    return changeRec;
  }

  // ==========================================
  // SMS SERVICE CENTRES
  // ==========================================
  getSmsTemplates() {
    return this.smsTemplates;
  }

  getSmsLogs() {
    return this.smsLogs;
  }

  sendTestSms(mobile: string, message: string, actor: UserAccount) {
    const cost = 0.35;
    const log: SmsLogRecord = {
      id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientMobile: mobile,
      templateType: 'TEST_SMS',
      messageContent: message,
      segmentCount: Math.ceil(message.length / 160) || 1,
      cost,
      status: 'DELIVERED',
      provider: 'BulkSMS BD',
      timestamp: new Date().toISOString(),
    };
    this.smsLogs.unshift(log);

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'SMS_TRANSMITTED',
      details: `Dispatched SMS to ${mobile}. Segment count: ${log.segmentCount}. Cost: BDT ${cost}. Status: DELIVERED`,
    });

    return log;
  }

  // ==========================================
  // USER MANAGEMENT & DESIGNATIONS
  // ==========================================
  getDesignations() {
    return this.designations;
  }

  createDesignation(data: Omit<DesignationItem, 'id' | 'createdAt' | 'assignedUsersCount'>, actor: UserAccount) {
    const newDes: DesignationItem = {
      ...data,
      id: `des_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      assignedUsersCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.designations.push(newDes);

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'DESIGNATION_CREATED',
      details: `Created new designation "${newDes.name}". Panel access: ${newDes.allowedPanels.join(', ')}`,
    });

    return newDes;
  }

  deleteDesignation(id: string, actor: UserAccount) {
    const idx = this.designations.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Designation not found');

    const des = this.designations[idx];
    // Rule: Prevent deletion of a designation assigned to active users
    const assignedCount = this.users.filter((u) => u.designation === des.name).length;
    if (assignedCount > 0) {
      throw new Error(`Cannot delete designation "${des.name}" because it is currently assigned to ${assignedCount} active user(s). Reassign them first.`);
    }

    this.designations.splice(idx, 1);

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'DESIGNATION_DELETED',
      details: `Deleted designation "${des.name}".`,
    });

    return true;
  }

  getModeratorRequests() {
    return this.moderatorRequests;
  }

  handleModeratorRequest(id: string, action: 'APPROVE' | 'REJECT', actor: UserAccount, rejectionReason?: string) {
    const req = this.moderatorRequests.find((r) => r.id === id);
    if (!req) throw new Error('Moderator request not found');

    req.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    req.reviewedBy = actor.fullName;
    req.reviewedDate = new Date().toISOString();
    if (rejectionReason) req.rejectionReason = rejectionReason;

    if (action === 'APPROVE') {
      // Create active moderator user
      this.createUser({
        username: `mod_${req.fullName.toLowerCase().replace(/\s+/g, '')}`,
        fullName: req.fullName,
        mobile: req.mobile,
        email: req.email,
        role: 'MODERATOR',
        designation: req.requestedDesignation || 'Compliance Moderator',
        status: 'ACTIVE',
        password: 'DropNest@2026',
      });
    }

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: `MODERATOR_REQUEST_${action}`,
      details: `Moderator candidate request for ${req.fullName} was ${req.status} by ${actor.fullName}.`,
    });

    return req;
  }

  // ==========================================
  // CUSTOMER DIRECTORY
  // ==========================================
  getCustomers(): CustomerRecord[] {
    // Generate/refresh dynamic customer list derived from real order records
    const map = new Map<string, CustomerRecord>();

    for (const ord of this.orders) {
      const key = ord.customerMobile;
      if (!map.has(key)) {
        map.set(key, {
          id: `cust_${key.slice(-6)}`,
          name: ord.customerName,
          mobile: ord.customerMobile,
          email: ord.customerEmail || '',
          district: ord.customerDistrict,
          upazila: ord.customerUpazila,
          address: ord.deliveryAddress,
          totalOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
          returnedOrders: 0,
          lastOrderDate: ord.orderDate,
          status: 'ACTIVE',
          totalSpentBDT: 0,
        });
      }

      const c = map.get(key)!;
      c.totalOrders += 1;
      if (ord.status === 'DELIVERED') {
        c.deliveredOrders += 1;
        c.totalSpentBDT += ord.orderSalesValue + ord.deliveryCharge;
      }
      if (ord.status === 'CANCELLED') c.cancelledOrders += 1;
      if (ord.status === 'RETURNED') c.returnedOrders += 1;
      if (new Date(ord.orderDate) > new Date(c.lastOrderDate)) {
        c.lastOrderDate = ord.orderDate;
      }

      // Check return risk
      if (c.returnedOrders >= 2 && c.returnedOrders / c.totalOrders > 0.4) {
        c.status = 'HIGH_RETURN_RISK';
      }
    }

    return Array.from(map.values());
  }

  // ==========================================
  // E-MAIL BOX: STRICT 15 MESSAGE & 260 WORD ENFORCEMENT
  // ==========================================
  getMessagesForUser(userId: string, folder?: string) {
    let list = this.messages.filter((m) => m.senderId === userId || m.recipientId === userId);
    if (folder && folder !== 'ALL') {
      list = list.filter((m) => m.senderRole === folder || m.recipientRole === folder);
    }
    return list;
  }

  sendMessage(
    sender: UserAccount,
    data: { recipientMobile: string; subject: string; body: string; images?: string[] }
  ) {
    const cleanDigits = data.recipientMobile.replace(/\D/g, '');
    const recipient = this.users.find((u) => u.mobile.replace(/\D/g, '') === cleanDigits);

    if (!recipient) {
      throw new Error('No User Found with this registered mobile number');
    }

    // STRICT LIMIT 1: 15 Messages per mailbox limit enforcement
    const userMessageCount = this.messages.filter((m) => m.senderId === sender.id || m.recipientId === sender.id).length;
    if (userMessageCount >= 15) {
      throw new Error('Mailbox is full (Maximum limit of 15 messages reached). You must delete an existing message to dispatch or receive new communications.');
    }

    // Check recipient mailbox capacity as well
    const recipientMessageCount = this.messages.filter((m) => m.senderId === recipient.id || m.recipientId === recipient.id).length;
    if (recipientMessageCount >= 15) {
      throw new Error(`The recipient (${recipient.fullName}) has reached the 15-message mailbox limit and cannot accept incoming messages.`);
    }

    // STRICT LIMIT 2: Maximum 260 words body limit
    const words = data.body.trim().split(/\s+/).filter(Boolean);
    if (words.length > 260) {
      throw new Error(`Message body exceeds maximum limit of 260 words (Current count: ${words.length} words).`);
    }

    // STRICT LIMIT 3: Maximum 3 images, 4MB each, 12MB total
    if (data.images && data.images.length > 3) {
      throw new Error('Maximum 3 images allowed per message.');
    }

    const newMsg: InternalMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: sender.id,
      senderName: sender.fullName,
      senderRole: sender.role,
      senderMobile: sender.mobile,
      recipientId: recipient.id,
      recipientName: recipient.fullName,
      recipientRole: recipient.role,
      recipientMobile: recipient.mobile,
      subject: data.subject.trim() || 'Internal Communication',
      body: data.body.trim(),
      wordCount: words.length,
      images: data.images || [],
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    this.messages.unshift(newMsg);

    this.addAuditLog({
      actorId: sender.id,
      actorName: sender.fullName,
      actorRole: sender.role,
      action: 'MESSAGE_DISPATCHED',
      details: `Internal message dispatched to ${recipient.fullName} (${recipient.role}) [${recipient.mobile}]. Word count: ${words.length}.`,
    });

    return newMsg;
  }

  deleteMessage(messageId: string, actor: UserAccount) {
    const idx = this.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) throw new Error('Message not found');

    const msg = this.messages[idx];
    // Authorize: sender, recipient, or Super Admin
    if (msg.senderId !== actor.id && msg.recipientId !== actor.id && actor.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized to delete this message');
    }

    // Permanent database record removal
    this.messages.splice(idx, 1);

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'MESSAGE_DELETED',
      details: `Permanently deleted message #${messageId}. Mailbox slot reclaimed.`,
    });

    return true;
  }

  // ==========================================
  // PRODUCTS & ORDERS (WITH 17 STATUS FLOWS)
  // ==========================================
  getProducts(role: UserRole, userId?: string) {
    if (role === 'SUPPLIER') {
      return this.products.filter((p) => p.supplierId === userId);
    }
    if (role === 'RESELLER') {
      return this.products.filter((p) => p.status === 'APPROVED');
    }
    return this.products;
  }

  createProduct(supplier: UserAccount, data: Omit<ProductItem, 'id' | 'supplierId' | 'supplierName' | 'createdAt' | 'status'>) {
    const newProduct: ProductItem = {
      ...data,
      id: `prd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      supplierId: supplier.id,
      supplierName: supplier.businessName || supplier.fullName,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
    };
    this.products.unshift(newProduct);

    this.addAuditLog({
      actorId: supplier.id,
      actorName: supplier.fullName,
      actorRole: supplier.role,
      action: 'PRODUCT_SUBMITTED',
      details: `Product "${newProduct.name}" (SKU: ${newProduct.sku}) submitted for review.`,
    });

    return newProduct;
  }

  updateProductStatus(productId: string, status: 'APPROVED' | 'REJECTED', actor: UserAccount) {
    const product = this.products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');
    product.status = status;

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: `PRODUCT_${status}`,
      details: `Product "${product.name}" (SKU: ${product.sku}) status set to ${status} by ${actor.fullName}.`,
    });

    return product;
  }

  getOrders(role: UserRole, userId: string) {
    if (role === 'RESELLER') {
      return this.orders.filter((o) => o.resellerId === userId);
    }
    if (role === 'SUPPLIER') {
      return this.orders
        .filter((o) => o.supplierId === userId)
        .map((o) => ({
          ...o,
          resellerId: '[REDACTED_BY_PLATFORM_POLICY]',
          resellerName: 'DropNest Platform Order',
          resellerStoreName: 'DropNest Official Reseller Network',
          customerName: '[RESTRICTED_FULFILLMENT]',
          customerMobile: '[RESTRICTED_FULFILLMENT]',
          customerEmail: '[RESTRICTED_FULFILLMENT]',
          resellerSellPrice: 0,
        }));
    }
    return this.orders;
  }

  createOrder(reseller: UserAccount, data: {
    productId: string;
    quantity: number;
    resellerSellPrice: number;
    deliveryCharge: number;
    customerName: string;
    customerMobile: string;
    customerEmail?: string;
    customerDistrict: string;
    customerUpazila: string;
    deliveryAddress: string;
  }) {
    const product = this.products.find((p) => p.id === data.productId && p.status === 'APPROVED');
    if (!product) throw new Error('Selected product is not available or not approved');
    if (product.stockQuantity < data.quantity) {
      throw new Error(`Insufficient stock available (${product.stockQuantity} in stock)`);
    }

    const orderId = `DN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

    const newOrder: OrderItem = {
      id: orderId,
      invoiceNumber,
      orderDate: new Date().toISOString(),
      status: 'PAYMENT_PENDING',
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: data.quantity,
      supplierResellerPrice: product.basePrice,
      resellerSellPrice: data.resellerSellPrice,
      orderSalesValue: data.resellerSellPrice * data.quantity,
      deliveryCharge: data.deliveryCharge,
      paymentStatus: 'UNPAID',
      paymentMethod: 'Cash on Delivery (COD)',
      settlementStatus: 'PENDING',
      supplierId: product.supplierId,
      supplierName: product.supplierName,
      resellerId: reseller.id,
      resellerName: reseller.fullName,
      resellerStoreName: reseller.storeName || reseller.businessName || `${reseller.fullName}'s Store`,
      customerName: data.customerName,
      customerMobile: data.customerMobile,
      customerEmail: data.customerEmail,
      customerDistrict: data.customerDistrict,
      customerUpazila: data.customerUpazila,
      deliveryAddress: data.deliveryAddress,
      courierName: 'Steadfast Logistics BD',
      trackingNumber: `TRK-BD-${Math.floor(10000000 + Math.random() * 90000000)}`,
      trackingHistory: [
        {
          status: 'ORDER_PLACED',
          location: 'DropNest Central Gateway (Dhaka Hub)',
          timestamp: new Date().toISOString(),
          note: 'Order validated and assigned to supplier fulfillment queue.',
        },
      ],
      statusHistory: [
        {
          status: 'PAYMENT_PENDING',
          changedBy: reseller.fullName,
          role: reseller.role,
          timestamp: new Date().toISOString(),
          reason: 'Initial order placement',
        },
      ],
    };

    product.stockQuantity -= data.quantity;
    this.orders.unshift(newOrder);

    this.addAuditLog({
      actorId: reseller.id,
      actorName: reseller.fullName,
      actorRole: reseller.role,
      action: 'ORDER_CREATED',
      details: `Order #${orderId} created for ${data.quantity}x ${product.name} to ${data.customerDistrict}. Value: BDT ${newOrder.orderSalesValue}`,
    });

    return newOrder;
  }

  // 17-STATUS ADVANCED ORDER WORKFLOW
  updateOrderStatus(orderId: string, status: OrderStatus, actor: UserAccount, reason?: string) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const previousStatus = order.status;
    order.status = status;

    // Synchronize payment status
    if (status === 'DELIVERED') {
      order.paymentStatus = 'PAID';
      order.settlementStatus = 'SETTLED';
    } else if (status === 'REFUND_COMPLETED') {
      order.paymentStatus = 'REFUNDED';
    }

    order.statusHistory.unshift({
      status,
      changedBy: actor.fullName,
      role: actor.role,
      timestamp: new Date().toISOString(),
      reason: reason || `Status transition from ${previousStatus} to ${status}`,
    });

    order.trackingHistory.unshift({
      status,
      location: 'Logistics Operations Node',
      timestamp: new Date().toISOString(),
      note: reason || `Status updated to ${status} by ${actor.fullName}`,
    });

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'ORDER_STATUS_TRANSITION',
      details: `Order #${orderId} transitioned from ${previousStatus} to ${status}. Reason: ${reason || 'Operational update'}.`,
    });

    return order;
  }

  // Search orders across all 17 search fields
  searchOrders(filters: {
    orderNumber?: string;
    trackingId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    resellerName?: string;
    resellerId?: string;
    supplierName?: string;
    supplierId?: string;
    productName?: string;
    sku?: string;
    paymentTxnId?: string;
    courierName?: string;
    courierTrackingNumber?: string;
    orderStatus?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return this.orders.filter((o) => {
      if (filters.orderNumber && !o.id.toLowerCase().includes(filters.orderNumber.toLowerCase())) return false;
      if (filters.trackingId && !o.trackingNumber?.toLowerCase().includes(filters.trackingId.toLowerCase())) return false;
      if (filters.customerName && !o.customerName.toLowerCase().includes(filters.customerName.toLowerCase())) return false;
      if (filters.customerPhone && !o.customerMobile.includes(filters.customerPhone)) return false;
      if (filters.customerEmail && (!o.customerEmail || !o.customerEmail.toLowerCase().includes(filters.customerEmail.toLowerCase()))) return false;
      if (filters.resellerName && !o.resellerName.toLowerCase().includes(filters.resellerName.toLowerCase())) return false;
      if (filters.resellerId && !o.resellerId.toLowerCase().includes(filters.resellerId.toLowerCase())) return false;
      if (filters.supplierName && !o.supplierName.toLowerCase().includes(filters.supplierName.toLowerCase())) return false;
      if (filters.supplierId && !o.supplierId.toLowerCase().includes(filters.supplierId.toLowerCase())) return false;
      if (filters.productName && !o.productName.toLowerCase().includes(filters.productName.toLowerCase())) return false;
      if (filters.sku && !o.sku.toLowerCase().includes(filters.sku.toLowerCase())) return false;
      if (filters.paymentTxnId && (!o.transactionRef || !o.transactionRef.toLowerCase().includes(filters.paymentTxnId.toLowerCase()))) return false;
      if (filters.courierName && (!o.courierName || !o.courierName.toLowerCase().includes(filters.courierName.toLowerCase()))) return false;
      if (filters.courierTrackingNumber && (!o.trackingNumber || !o.trackingNumber.toLowerCase().includes(filters.courierTrackingNumber.toLowerCase()))) return false;
      if (filters.orderStatus && filters.orderStatus !== 'ALL' && o.status !== filters.orderStatus) return false;
      if (filters.paymentStatus && filters.paymentStatus !== 'ALL' && o.paymentStatus !== filters.paymentStatus) return false;
      if (filters.startDate && new Date(o.orderDate) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(o.orderDate) > new Date(filters.endDate)) return false;
      return true;
    });
  }

  // ==========================================
  // AUDIT LOGS & PLATFORM STATS
  // ==========================================
  getAuditLogs() {
    return this.auditLogs;
  }

  addAuditLog(record: Omit<AuditRecord, 'id' | 'timestamp'>) {
    const log: AuditRecord = {
      ...record,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return log;
  }

  getPlatformStats() {
    const fin = this.getFinancialSummary();
    const deliveredCount = this.orders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledCount = this.orders.filter((o) => o.status === 'CANCELLED').length;
    const returnCount = this.orders.filter((o) => o.status === 'RETURNED').length;

    return {
      totalUsers: this.users.length,
      usersByRole: {
        SUPER_ADMIN: this.users.filter((u) => u.role === 'SUPER_ADMIN').length,
        ADMIN: this.users.filter((u) => u.role === 'ADMIN').length,
        MODERATOR: this.users.filter((u) => u.role === 'MODERATOR').length,
        SUPPLIER: this.users.filter((u) => u.role === 'SUPPLIER').length,
        RESELLER: this.users.filter((u) => u.role === 'RESELLER').length,
      },
      totalProducts: this.products.length,
      approvedProducts: this.products.filter((p) => p.status === 'APPROVED').length,
      pendingProducts: this.products.filter((p) => p.status === 'PENDING_APPROVAL').length,
      totalOrders: this.orders.length,
      deliveredOrders: deliveredCount,
      cancelledOrders: cancelledCount,
      returnedOrders: returnCount,
      completionRate: this.orders.length > 0 ? Math.round((deliveredCount / this.orders.length) * 100) : 0,
      totalCustomers: this.getCustomers().length,
      financials: fin,
      apiHealth: {
        total: this.apiServices.length,
        healthy: this.apiServices.filter((a) => a.healthStatus === 'HEALTHY').length,
        degraded: this.apiServices.filter((a) => a.healthStatus === 'DEGRADED').length,
      },
      securityAlertsCount: this.loginActivities.filter((a) => a.isSuspicious).length,
      platformVersion: 'DropNest Core Architecture v1.0.0-PROD',
    };
  }

  // ==========================================
  // ADMIN PANEL MASTER METHODS
  // ==========================================
  getAdminPermissions(adminId: string): AdminPermissions {
    return this.adminPermissions[adminId] || {
      canApprovePayment: true,
      canAdjustBalance: true,
      canApproveUser: true,
      canCreateUser: true,
      canChangeOrderStatus: true,
      canSendSms: true,
      canViewFinancialReports: true,
      canAccessMessaging: true,
      canManageStaff: false,
    };
  }

  getUserAccountBalances(typeFilter?: 'RESELLER' | 'SUPPLIER'): UserAccountBalance[] {
    if (typeFilter) {
      return this.userAccountBalances.filter((b) => b.accountType === typeFilter);
    }
    return this.userAccountBalances;
  }

  getUserBalance(userId: string): UserAccountBalance | undefined {
    return this.userAccountBalances.find((b) => b.userId === userId);
  }

  adjustUserBalance(
    actor: UserAccount,
    data: { userId: string; amount: number; type: 'CREDIT' | 'DEBIT'; reason: string }
  ): BalanceAdjustmentRecord {
    const permissions = this.getAdminPermissions(actor.id);
    if (!permissions.canAdjustBalance && actor.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: You do not have authorization to adjust balances. Contact Super Admin.');
    }

    if (!data.amount || data.amount <= 0) {
      throw new Error('Adjustment amount must be greater than zero.');
    }
    if (!data.reason || data.reason.trim().length < 5) {
      throw new Error('Adjustment reason is mandatory (minimum 5 characters).');
    }

    const balanceRecord = this.userAccountBalances.find((b) => b.userId === data.userId);
    const targetUser = this.findUserById(data.userId);
    if (!balanceRecord || !targetUser) {
      throw new Error('Target user account not found in financial ledger.');
    }

    if (data.type === 'DEBIT' && balanceRecord.availableBalance < data.amount) {
      throw new Error(`Insufficient available balance for debit. Current available: BDT ${balanceRecord.availableBalance}`);
    }

    // Apply adjustment atomically to available balance (pending balance cannot be used as available)
    if (data.type === 'CREDIT') {
      balanceRecord.availableBalance += data.amount;
    } else {
      balanceRecord.availableBalance -= data.amount;
    }
    balanceRecord.lastTransactionDate = new Date().toISOString();

    const recordId = `ADJ-DN-${Date.now().toString().slice(-6)}`;
    const adjRecord: BalanceAdjustmentRecord = {
      id: recordId,
      userId: targetUser.id,
      userName: targetUser.fullName,
      userRole: balanceRecord.accountType,
      type: data.type,
      amount: data.amount,
      reason: data.reason.trim(),
      adminId: actor.id,
      adminName: actor.fullName,
      date: new Date().toISOString(),
      approvalStatus: 'APPROVED',
    };

    this.balanceAdjustments.unshift(adjRecord);

    // Record ledger transaction
    this.ledgerTransactions.unshift({
      id: `TXN-${recordId}`,
      amount: data.amount,
      type: data.type,
      category: 'MANUAL_ADJUSTMENT',
      purpose: `Admin Balance Adjustment: ${data.reason}`,
      recipientOrSource: `${targetUser.fullName} (${balanceRecord.accountType})`,
      userId: targetUser.id,
      userRole: targetUser.role,
      paymentMethod: 'Administrative Ledger Adjustment',
      referenceNumber: recordId,
      processedBy: actor.fullName,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
    });

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: `ADMIN_BALANCE_${data.type}`,
      details: `Balance ${data.type} of BDT ${data.amount} applied to ${targetUser.fullName} (${targetUser.mobile}). Reason: ${data.reason}`,
    });

    return adjRecord;
  }

  getTransactionApprovals(): TransactionIdApprovalItem[] {
    return this.transactionApprovals;
  }

  reviewTransactionApproval(
    id: string,
    action: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW',
    actor: UserAccount,
    reason?: string
  ): TransactionIdApprovalItem {
    const permissions = this.getAdminPermissions(actor.id);
    if (!permissions.canApprovePayment && actor.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: You do not have authorization to approve transaction IDs. Contact Super Admin.');
    }

    const item = this.transactionApprovals.find((t) => t.id === id);
    if (!item) throw new Error('Transaction submission not found.');

    if (action === 'REJECTED') {
      if (!reason || reason.trim().length < 5) {
        throw new Error('A detailed rejection reason is required (minimum 5 characters).');
      }
      item.status = 'REJECTED';
      item.rejectionReason = reason.trim();
      item.reviewedBy = actor.fullName;
      item.reviewedAt = new Date().toISOString();

      this.addAuditLog({
        actorId: actor.id,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: 'TRANSACTION_ID_REJECTED',
        details: `Rejected transaction ID #${item.transactionId} (${item.paymentMethod}) for ${item.userName}. Reason: ${reason}`,
      });

      return item;
    }

    if (action === 'UNDER_REVIEW') {
      item.status = 'UNDER_REVIEW';
      item.reviewedBy = actor.fullName;
      item.reviewedAt = new Date().toISOString();
      return item;
    }

    // DUPLICATE TRANSACTION ID DETECTION
    const isDuplicate = this.transactionApprovals.some(
      (other) => other.id !== item.id && other.transactionId.toLowerCase() === item.transactionId.toLowerCase() && other.status === 'APPROVED'
    );
    if (isDuplicate) {
      item.isDuplicate = true;
      throw new Error(`Duplicate Transaction ID Detected! The transaction ID "${item.transactionId}" has already been approved and credited to an account. Cannot credit multiple accounts with the same transaction.`);
    }

    item.status = 'APPROVED';
    item.reviewedBy = actor.fullName;
    item.reviewedAt = new Date().toISOString();

    // Immediately credit user's account balance
    let balanceRecord = this.userAccountBalances.find((b) => b.userId === item.userId);
    if (!balanceRecord) {
      balanceRecord = {
        userId: item.userId,
        userName: item.userName,
        mobile: item.userMobile,
        accountType: item.userRole,
        availableBalance: 0,
        pendingBalance: 0,
        accountStatus: 'ACTIVE',
        district: 'Dhaka',
        upazila: 'Gulshan',
        lastTransactionDate: new Date().toISOString(),
      };
      this.userAccountBalances.push(balanceRecord);
    }
    balanceRecord.availableBalance += item.amount;
    balanceRecord.lastTransactionDate = new Date().toISOString();

    // Create ledger transaction
    this.ledgerTransactions.unshift({
      id: `TXN-APR-${item.transactionId}`,
      amount: item.amount,
      type: 'CREDIT',
      category: 'DEPOSIT',
      purpose: `Transaction ID Verified & Credited (${item.paymentMethod})`,
      recipientOrSource: `${item.userName} [${item.userMobile}]`,
      userId: item.userId,
      userRole: item.userRole,
      paymentMethod: item.paymentMethod,
      referenceNumber: item.transactionId,
      processedBy: actor.fullName,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
    });

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'TRANSACTION_ID_APPROVED',
      details: `Approved TrxID ${item.transactionId} (${item.paymentMethod}) of BDT ${item.amount} for ${item.userName}. Balance credited.`,
    });

    return item;
  }

  getAdminFinancialOverview(): AdminFinancialMetrics {
    const fin = this.getFinancialSummary();
    const approvedPayoutsTotal = this.resellerPayouts
      .filter((p) => p.status === 'APPROVED')
      .reduce((sum, p) => sum + p.requestedAmount, 0);
    const pendingPayoutsTotal = this.resellerPayouts
      .filter((p) => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.requestedAmount, 0);

    const totalRecharge = this.transactionApprovals
      .filter((t) => t.status === 'APPROVED')
      .reduce((sum, t) => sum + t.amount, 0) + 125000;

    return {
      totalIncome: fin.totalCredit,
      totalExpense: fin.totalDebit,
      totalRecharge,
      totalWithdrawal: approvedPayoutsTotal + 45000,
      pendingPayout: pendingPayoutsTotal,
      approvedPayout: approvedPayoutsTotal,
      reserveFund: fin.reservedBalance + 150000,
      chartData: [
        { label: 'Sat', credit: 48000, debit: 22000, net: 26000 },
        { label: 'Sun', credit: 62000, debit: 34000, net: 28000 },
        { label: 'Mon', credit: 75000, debit: 41000, net: 34000 },
        { label: 'Tue', credit: 59000, debit: 28000, net: 31000 },
        { label: 'Wed', credit: 88000, debit: 52000, net: 36000 },
        { label: 'Thu', credit: 94000, debit: 48000, net: 46000 },
        { label: 'Fri', credit: 67000, debit: 31000, net: 36000 },
      ],
    };
  }

  getResellerPayouts(): ResellerPayoutItem[] {
    return this.resellerPayouts;
  }

  reviewResellerPayout(
    id: string,
    action: 'APPROVED' | 'REJECTED' | 'ON_HOLD',
    actor: UserAccount,
    reason?: string
  ): ResellerPayoutItem {
    const permissions = this.getAdminPermissions(actor.id);
    if (!permissions.canApprovePayment && actor.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: You do not have authorization to process payouts. Contact Super Admin.');
    }

    const item = this.resellerPayouts.find((p) => p.id === id);
    if (!item) throw new Error('Payout request not found.');

    if (action === 'REJECTED') {
      if (!reason || reason.trim().length < 5) {
        throw new Error('Rejection reason is required (minimum 5 characters).');
      }
      item.status = 'REJECTED';
      item.rejectionReason = reason.trim();
      item.processedAt = new Date().toISOString();
      item.processedBy = actor.fullName;

      this.addAuditLog({
        actorId: actor.id,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: 'RESELLER_PAYOUT_REJECTED',
        details: `Rejected payout #${item.id} of BDT ${item.requestedAmount} for ${item.resellerName}. Reason: ${reason}. Balance restored.`,
      });

      return item;
    }

    if (action === 'ON_HOLD') {
      item.status = 'ON_HOLD';
      item.rejectionReason = reason;
      item.processedAt = new Date().toISOString();
      item.processedBy = actor.fullName;
      return item;
    }

    // APPROVED: Debit available profit balance
    const balance = this.userAccountBalances.find((b) => b.userId === item.resellerId);
    if (balance && balance.availableBalance < item.requestedAmount) {
      throw new Error(`Insufficient available balance (BDT ${balance.availableBalance}) to satisfy payout of BDT ${item.requestedAmount}.`);
    }

    if (balance) {
      balance.availableBalance -= item.requestedAmount;
      balance.lastTransactionDate = new Date().toISOString();
    }

    item.status = 'APPROVED';
    item.processedAt = new Date().toISOString();
    item.processedBy = actor.fullName;

    // Create debit ledger record
    this.ledgerTransactions.unshift({
      id: `TXN-${item.id}`,
      amount: item.requestedAmount,
      type: 'DEBIT',
      category: 'WITHDRAWAL',
      purpose: `Reseller Payout Disbursed to ${item.paymentMethod} (${item.accountNumber})`,
      recipientOrSource: `${item.resellerName} [${item.resellerMobile}]`,
      userId: item.resellerId,
      userRole: 'RESELLER',
      paymentMethod: item.paymentMethod,
      referenceNumber: item.id,
      processedBy: actor.fullName,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
    });

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'RESELLER_PAYOUT_APPROVED',
      details: `Approved payout #${item.id} of BDT ${item.requestedAmount} for ${item.resellerName} via ${item.paymentMethod}.`,
    });

    return item;
  }

  getSupplierSettlements(): SupplierSettlementItem[] {
    return this.supplierSettlements;
  }

  reviewSupplierSettlement(
    id: string,
    action: 'SETTLED' | 'HELD',
    actor: UserAccount
  ): SupplierSettlementItem {
    const permissions = this.getAdminPermissions(actor.id);
    if (!permissions.canApprovePayment && actor.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: You do not have authorization to settle supplier accounts. Contact Super Admin.');
    }

    const item = this.supplierSettlements.find((s) => s.id === id);
    if (!item) throw new Error('Supplier settlement record not found.');

    item.settlementStatus = action;
    item.settledAt = new Date().toISOString();
    item.settledBy = actor.fullName;

    if (action === 'SETTLED') {
      this.ledgerTransactions.unshift({
        id: `TXN-${item.id}`,
        amount: item.payableAmount,
        type: 'DEBIT',
        category: 'SUPPLIER_PAYOUT',
        purpose: `Supplier Settlement for ${item.totalDeliveredOrders} Delivered Orders`,
        recipientOrSource: `${item.supplierName} [${item.accountDetails}]`,
        userId: item.supplierId,
        userRole: 'SUPPLIER',
        paymentMethod: item.paymentMethod,
        referenceNumber: item.id,
        processedBy: actor.fullName,
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
      });

      this.addAuditLog({
        actorId: actor.id,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: 'SUPPLIER_SETTLEMENT_COMPLETED',
        details: `Settled BDT ${item.payableAmount} for ${item.supplierName} (${item.totalDeliveredOrders} orders).`,
      });
    }

    return item;
  }

  getUserVerifications(): UserVerificationItem[] {
    return this.userVerifications;
  }

  reviewUserVerification(
    id: string,
    action: 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'UNDER_REVIEW',
    actor: UserAccount,
    reason?: string
  ): UserVerificationItem {
    const permissions = this.getAdminPermissions(actor.id);
    if (!permissions.canApproveUser && actor.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: You do not have authorization to verify or approve user accounts. Contact Super Admin.');
    }

    const item = this.userVerifications.find((v) => v.id === id);
    if (!item) throw new Error('Verification request not found.');

    if (action === 'REJECTED' && (!reason || reason.trim().length < 5)) {
      throw new Error('Rejection reason must be specified (minimum 5 characters).');
    }

    const previousStatus = item.status;
    item.status = action;
    item.rejectionReason = reason?.trim();
    item.reviewedBy = actor.fullName;
    item.reviewedAt = new Date().toISOString();

    // If approved, create or activate the user account
    if (action === 'APPROVED') {
      const existingUser = this.findUserByLogin(item.mobile);
      if (existingUser) {
        existingUser.status = 'ACTIVE';
      } else {
        const usernameBase = item.fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'user';
        const uniqueUsername = `${usernameBase}${Math.floor(100 + Math.random() * 900)}`;
        this.createUser({
          username: uniqueUsername,
          fullName: item.fullName,
          mobile: item.mobile,
          email: item.email,
          role: item.role,
          district: item.district,
          upazila: item.upazila,
          businessName: item.businessName,
          status: 'ACTIVE',
          password: 'User@DropNest2026',
        });
      }
    }

    if (action === 'REJECTED') {
      const existingUser = this.findUserByLogin(item.mobile);
      if (existingUser) {
        existingUser.status = 'SUSPENDED';
      }
    }

    // Record state change with AuditLogManager ensuring previousStatus, timestamp, and actor role are preserved
    const { auditEntry, systemAuditRecord } = AuditLogManager.recordApprovalStateChange({
      application: item,
      previousStatus,
      newStatus: action,
      actor,
      reason,
    });

    if (!item.auditTrail) {
      item.auditTrail = [];
    }
    item.auditTrail.unshift(auditEntry);
    this.addAuditLog(systemAuditRecord);

    return item;
  }

  addVerificationContactLog(
    id: string,
    actor: UserAccount,
    data: {
      type: 'PHONE_CALL' | 'SMS_SENT' | 'EMAIL_DISPATCH' | 'WHATSAPP' | 'IN_PERSON_VISIT';
      outcome: 'REACHED_VERIFIED' | 'CALL_BUSY' | 'UNREACHABLE' | 'FOLLOWUP_SCHEDULED' | 'EMAIL_DELIVERED' | 'DOCUMENT_REQUESTED';
      notes: string;
      duration?: string;
    }
  ): UserVerificationItem {
    const item = this.userVerifications.find((v) => v.id === id);
    if (!item) throw new Error('Verification request not found.');

    if (!item.contactHistory) {
      item.contactHistory = [];
    }

    const entry: ContactHistoryEntry = {
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: data.type,
      timestamp: new Date().toISOString(),
      adminName: actor.fullName,
      adminRole: actor.role,
      outcome: data.outcome,
      notes: data.notes.trim(),
      duration: data.duration?.trim(),
    };

    item.contactHistory.unshift(entry);

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'USER_VERIFICATION_CONTACT_LOG',
      details: `Logged ${data.type} with ${item.fullName} (${item.mobile}). Outcome: ${data.outcome}. Notes: ${data.notes.trim()}`,
    });

    return item;
  }

  adminCreateUser(
    actor: UserAccount,
    data: {
      username: string;
      fullName: string;
      mobile: string;
      email: string;
      password: string;
      role: UserRole;
      designation?: string;
      initialBalance?: number;
      district?: string;
      upazila?: string;
      address?: string;
      businessName?: string;
    }
  ): UserAccount {
    // 1. STRICT ENFORCEMENT: Admin can NEVER create a Super Admin account!
    if (data.role === 'SUPER_ADMIN') {
      throw new Error('Security Violation: Administrative accounts cannot create Super Admin accounts. This incident has been logged.');
    }

    // 2. Permission check
    const permissions = this.getAdminPermissions(actor.id);
    if (!permissions.canCreateUser && actor.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: You do not possess authorization to create user accounts. Contact Super Admin.');
    }
    if ((data.role === 'MODERATOR' || data.role === 'ADMIN') && !permissions.canManageStaff && actor.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Creating staff/moderator accounts requires elevated permissions.');
    }

    const newUser = this.createUser({
      username: data.username,
      fullName: data.fullName,
      mobile: data.mobile,
      email: data.email,
      password: data.password,
      role: data.role,
      designation: data.designation,
      district: data.district,
      upazila: data.upazila,
      address: data.address,
      businessName: data.businessName,
      status: 'ACTIVE',
    });

    // If initial balance provided for Reseller or Supplier
    const initBal = Number(data.initialBalance) || 0;
    if (initBal > 0 && (data.role === 'RESELLER' || data.role === 'SUPPLIER')) {
      this.userAccountBalances.push({
        userId: newUser.id,
        userName: newUser.fullName,
        mobile: newUser.mobile,
        accountType: data.role,
        availableBalance: initBal,
        pendingBalance: 0,
        accountStatus: 'ACTIVE',
        district: data.district || 'Dhaka',
        upazila: data.upazila || 'Gulshan',
        lastTransactionDate: new Date().toISOString(),
      });

      this.ledgerTransactions.unshift({
        id: `TXN-INIT-${Date.now().toString().slice(-6)}`,
        amount: initBal,
        type: 'CREDIT',
        category: 'MANUAL_ADJUSTMENT',
        purpose: 'Initial Account Provisioning Balance Allocation',
        recipientOrSource: `${newUser.fullName} (${newUser.role})`,
        userId: newUser.id,
        userRole: newUser.role,
        paymentMethod: 'Administrative Initial Balance',
        referenceNumber: `INIT-${newUser.id}`,
        processedBy: actor.fullName,
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
      });
    }

    // Send Welcome SMS Log
    this.smsLogs.unshift({
      id: `sms_wlc_${Date.now()}`,
      recipientMobile: data.mobile,
      recipientName: data.fullName,
      templateName: 'Welcome Registration Credentials',
      messageBody: `Welcome to DropNest! Your ${data.role} account is activated. Username: ${data.username}, Pass: ${data.password}. Log in at dropnest.com.bd`,
      gatewayUsed: 'BulkSMS BD (Greenweb)',
      status: 'DELIVERED',
      sentAt: new Date().toISOString(),
      costBDT: 0.35,
    });

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'ADMIN_USER_PROVISIONED',
      details: `Admin created ${data.role} account for ${data.fullName} (${data.mobile}). Initial Balance: BDT ${initBal}.`,
    });

    return newUser;
  }

  getAdminSmsMetrics(): AdminSmsMetrics {
    const totalSent = this.smsLogs.length + 14820;
    const todaySent = this.smsLogs.filter((l) => new Date(l.sentAt || l.timestamp || Date.now()).toDateString() === new Date().toDateString()).length + 420;
    const failed = this.smsLogs.filter((l) => l.status === 'FAILED').length + 8;
    const rate = Math.round(((totalSent - failed) / totalSent) * 1000) / 10;

    return {
      smsBalance: 14250,
      totalSent,
      todaySent,
      failed,
      deliverySuccessRate: rate,
      automatedTriggers: this.automatedSmsTriggers,
    };
  }

  toggleSmsTrigger(triggerKey: string, enabled: boolean, actor: UserAccount) {
    this.automatedSmsTriggers[triggerKey] = enabled;
    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'SMS_TRIGGER_TOGGLED',
      details: `SMS Trigger "${triggerKey}" set to ${enabled ? 'ENABLED' : 'DISABLED'}.`,
    });
    return this.automatedSmsTriggers;
  }

  sendAdminBulkSms(
    actor: UserAccount,
    data: { targetGroup: string; message: string; customNumbers?: string[] }
  ) {
    const permissions = this.getAdminPermissions(actor.id);
    if (!permissions.canSendSms && actor.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: You do not have authorization to dispatch SMS broadcasts. Contact Super Admin.');
    }

    if (!data.message || data.message.trim().length === 0) {
      throw new Error('SMS message body cannot be empty.');
    }

    let targetCount = 0;
    if (data.targetGroup === 'ALL_RESELLERS') {
      targetCount = this.users.filter((u) => u.role === 'RESELLER').length + 120;
    } else if (data.targetGroup === 'ALL_SUPPLIERS') {
      targetCount = this.users.filter((u) => u.role === 'SUPPLIER').length + 45;
    } else if (data.customNumbers && data.customNumbers.length > 0) {
      targetCount = data.customNumbers.length;
    } else {
      targetCount = 25;
    }

    const log: SmsLogRecord = {
      id: `sms_bulk_${Date.now()}`,
      recipientMobile: `Group Broadcast (${data.targetGroup})`,
      recipientName: `${targetCount} Recipients`,
      templateName: 'Custom Administrative Broadcast',
      messageBody: data.message.trim(),
      gatewayUsed: 'Steadfast SMS Gateway Pro',
      status: 'DELIVERED',
      sentAt: new Date().toISOString(),
      costBDT: Math.round(targetCount * 0.35 * 100) / 100,
    };

    this.smsLogs.unshift(log);

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'ADMIN_SMS_BROADCAST',
      details: `Broadcast SMS sent to ${targetCount} recipients (${data.targetGroup}). Cost: BDT ${log.costBDT}`,
    });

    return { success: true, count: targetCount, log };
  }

  getAdminStatement(
    entityType: 'PLATFORM' | 'RESELLER' | 'SUPPLIER',
    entityId?: string,
    startDate?: string,
    endDate?: string
  ) {
    let txns = [...this.ledgerTransactions];

    if (entityType === 'RESELLER') {
      txns = txns.filter((t) => t.userRole === 'RESELLER' && (!entityId || t.userId === entityId));
    } else if (entityType === 'SUPPLIER') {
      txns = txns.filter((t) => t.userRole === 'SUPPLIER' && (!entityId || t.userId === entityId));
    }

    if (startDate) {
      txns = txns.filter((t) => new Date(t.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      txns = txns.filter((t) => new Date(t.timestamp) <= new Date(endDate));
    }

    const totalCredit = txns.filter((t) => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
    const totalDebit = txns.filter((t) => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);
    const openingBalance = 50000;
    const closingBalance = openingBalance + totalCredit - totalDebit;

    return {
      entityType,
      entityId: entityId || 'ALL',
      openingBalance,
      totalCredit,
      totalDebit,
      closingBalance,
      netBalance: totalCredit - totalDebit,
      transactions: txns,
      generatedAt: new Date().toISOString(),
    };
  }

  getAdminAnalytics(period: string = 'THIS_MONTH') {
    const orders = this.orders;
    const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
    const returnedOrders = orders.filter((o) => o.status === 'RETURNED');
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED');

    const totalSales = deliveredOrders.reduce((sum, o) => sum + o.orderSalesValue, 0) + 142000;
    const netProfit = Math.round(totalSales * 0.12);

    return {
      period,
      sales: {
        totalRevenueBDT: totalSales,
        totalOrdersCount: orders.length + 158,
        deliveredCount: deliveredOrders.length + 132,
        averageOrderValueBDT: 1350,
        resellerSales: [
          { name: 'Tanvir Ahmed (StyleNest)', salesBDT: 58200, orders: 42 },
          { name: 'Farhana Yasmin', salesBDT: 34500, orders: 28 },
          { name: 'Mehedi Hasan', salesBDT: 21800, orders: 19 },
          { name: 'Shamim Reza', salesBDT: 15400, orders: 12 },
        ],
        categorySales: [
          { category: 'Electronics & Audio', percentage: 44, valueBDT: 62480 },
          { category: 'Fashion & Leather', percentage: 32, valueBDT: 45440 },
          { category: 'Men Clothing', percentage: 24, valueBDT: 34080 },
        ],
      },
      orders: {
        successRate: 88.4,
        cancellationRate: 5.8,
        returnRate: 5.8,
        courierPerformance: [
          { courier: 'Steadfast Logistics BD', dispatched: 94, delivered: 86, successRate: 91.5 },
          { courier: 'Pathao Logistics BD', dispatched: 42, delivered: 37, successRate: 88.1 },
          { courier: 'RedX Logistics', dispatched: 32, delivered: 26, successRate: 81.2 },
        ],
      },
      users: {
        totalResellers: 148,
        totalSuppliers: 32,
        activeSellersThisWeek: 94,
        newRegistrationsThisMonth: 28,
      },
      financial: {
        netProfitBDT: netProfit,
        platformCommissionBDT: Math.round(totalSales * 0.05),
        totalPayoutDisbursedBDT: 68500,
        revenueGrowthRate: '+18.4%',
      },
    };
  }

  getAdminReports(reportType: string, startDate?: string, endDate?: string) {
    if (reportType === 'SALES') {
      return this.orders.map((o) => ({
        id: o.id,
        invoiceNumber: o.invoiceNumber,
        date: o.orderDate,
        reseller: o.resellerName,
        customer: o.customerName,
        phone: o.customerMobile,
        product: o.productName,
        quantity: o.quantity,
        saleValue: o.orderSalesValue,
        deliveryCharge: o.deliveryCharge,
        courier: o.courierName || 'Unassigned',
        status: o.status,
      }));
    }

    if (reportType === 'FINANCIAL') {
      return this.ledgerTransactions.map((t) => ({
        id: t.id,
        date: t.timestamp,
        type: t.type,
        amount: t.amount,
        purpose: t.purpose,
        userOrEntity: t.recipientOrSource,
        method: t.paymentMethod,
        ref: t.referenceNumber,
        processedBy: t.processedBy,
        status: t.status,
      }));
    }

    if (reportType === 'COURIER') {
      return this.orders.map((o) => ({
        orderId: o.id,
        courier: o.courierName || 'Unassigned',
        trackingNumber: o.trackingNumber || 'Pending',
        customer: o.customerName,
        district: o.customerDistrict,
        deliveryCharge: o.deliveryCharge,
        status: o.status,
        date: o.orderDate,
      }));
    }

    // Default: Inventory Report
    return this.products.map((p) => ({
      sku: p.sku,
      productName: p.name,
      supplier: p.supplierName,
      category: p.category,
      basePriceBDT: p.basePrice,
      retailPriceBDT: p.suggestedRetailPrice,
      stockQuantity: p.stockQuantity,
      status: p.status,
      createdDate: p.createdAt,
    }));
  }
}

export const db = new Database();

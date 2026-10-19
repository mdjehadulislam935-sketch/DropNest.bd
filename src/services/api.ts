import type {
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
  LedgerTransaction,
  ModeratorRequestItem,
  OrderItem,
  OrderStatus,
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
  UserVerificationAuditEntry,
  AdminFinancialMetrics,
  AdminSmsMetrics
} from '../types/admin.ts';

const TOKEN_KEY = 'dropnest_auth_token';
const USER_KEY = 'dropnest_auth_user';
const LOGIN_TIME_KEY = 'dropnest_auth_time';

export class ApiService {
  private static getHeaders() {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  static getSavedAuth() {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const loginTime = localStorage.getItem(LOGIN_TIME_KEY) || new Date().toISOString();
    if (!token || !userStr) return null;
    try {
      const user = JSON.parse(userStr) as UserAccount;
      return { token, user, loginTimestamp: loginTime };
    } catch {
      return null;
    }
  }

  static saveAuth(token: string, user: UserAccount, loginTime: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(LOGIN_TIME_KEY, loginTime);
  }

  static clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LOGIN_TIME_KEY);
  }

  static async login(credential: string, password: string, expectedRole?: UserRole) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, password, expectedRole }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Sign in failed');
    }

    this.saveAuth(data.token, data.user, data.loginTimestamp);
    return data;
  }

  static async register(payload: any) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    this.saveAuth(data.token, data.user, data.loginTimestamp);
    return data;
  }

  static async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch {
      // ignore
    } finally {
      this.clearAuth();
    }
  }

  static async getMe() {
    const res = await fetch('/api/auth/me', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  }

  static async lookupRecipients(mobileQuery: string) {
    const res = await fetch(`/api/users/lookup?mobile=${encodeURIComponent(mobileQuery)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  }

  static async getProducts(): Promise<ProductItem[]> {
    const res = await fetch('/api/products', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load products');
    const data = await res.json();
    return data.products || [];
  }

  static async createProduct(productData: any): Promise<ProductItem> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit product');
    return data.product;
  }

  static async updateProductStatus(productId: string, status: 'APPROVED' | 'REJECTED') {
    const res = await fetch(`/api/products/${productId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update product status');
    return data.product;
  }

  static async getOrders(): Promise<OrderItem[]> {
    const res = await fetch('/api/orders', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load orders');
    const data = await res.json();
    return data.orders || [];
  }

  static async createOrder(orderData: any): Promise<OrderItem> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create order');
    return data.order;
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus, reason?: string): Promise<OrderItem> {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update order status');
    return data.order;
  }

  // Search orders with 17 fields
  static async searchOrdersAdvanced(filters: Record<string, any>): Promise<OrderItem[]> {
    const res = await fetch('/api/superadmin/orders/search', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(filters),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to search orders');
    return data.orders || [];
  }

  // Internal E-mail Box
  static async getMessages(folder?: string): Promise<InternalMessage[]> {
    const url = folder ? `/api/messages?folder=${encodeURIComponent(folder)}` : '/api/messages';
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load messages');
    const data = await res.json();
    return data.messages || [];
  }

  static async sendMessage(recipientMobile: string, subject: string, body: string, images?: string[]): Promise<InternalMessage> {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ recipientMobile, subject, body, images }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send message');
    return data.message;
  }

  static async deleteMessage(messageId: string): Promise<boolean> {
    const res = await fetch(`/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete message');
    return true;
  }

  static async getAuditLogs(): Promise<AuditRecord[]> {
    const res = await fetch('/api/audit-logs', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load audit logs');
    const data = await res.json();
    return data.auditLogs || [];
  }

  static async getPlatformStats() {
    const res = await fetch('/api/stats', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load stats');
    const data = await res.json();
    return data.stats;
  }

  /* ========================================================
     SUPER ADMIN SPECIFIC SERVICES
  ======================================================== */

  // 1. Business Info & CMS
  static async getCompanyInfo(): Promise<CompanyInfo> {
    const res = await fetch('/api/superadmin/company', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch company info');
    return data.company;
  }

  static async updateCompanyInfo(info: Partial<CompanyInfo>): Promise<CompanyInfo> {
    const res = await fetch('/api/superadmin/company', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(info),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update company info');
    return data.company;
  }

  static async getHomepageCMS(): Promise<HomepageCMS> {
    const res = await fetch('/api/superadmin/cms', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch homepage CMS');
    return data.cms;
  }

  static async updateHomepageCMS(cms: Partial<HomepageCMS>): Promise<HomepageCMS> {
    const res = await fetch('/api/superadmin/cms', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(cms),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update homepage CMS');
    return data.cms;
  }

  static async publishHomepageCMS(): Promise<HomepageCMS> {
    const res = await fetch('/api/superadmin/cms/publish', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to publish homepage CMS');
    return data.cms;
  }

  static async restoreHomepageCMS(): Promise<HomepageCMS> {
    const res = await fetch('/api/superadmin/cms/restore', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to restore homepage CMS');
    return data.cms;
  }

  static async getTutorials(): Promise<TutorialVideo[]> {
    const res = await fetch('/api/superadmin/tutorials', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load tutorials');
    return data.tutorials || [];
  }

  static async createTutorial(tut: Partial<TutorialVideo>): Promise<TutorialVideo> {
    const res = await fetch('/api/superadmin/tutorials', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(tut),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create tutorial');
    return data.tutorial;
  }

  static async deleteTutorial(id: string): Promise<boolean> {
    const res = await fetch(`/api/superadmin/tutorials/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete tutorial');
    return true;
  }

  // 2. Financial Management & Ledger
  static async getFinancialSummary(): Promise<FinancialSummary> {
    const res = await fetch('/api/superadmin/finances/summary', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load financial summary');
    return data.summary;
  }

  static async getLedgerTransactions(type?: 'CREDIT' | 'DEBIT'): Promise<LedgerTransaction[]> {
    const url = type ? `/api/superadmin/finances/transactions?type=${type}` : '/api/superadmin/finances/transactions';
    const res = await fetch(url, { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load ledger transactions');
    return data.transactions || [];
  }

  static async getFinancialTransactions(type?: 'CREDIT' | 'DEBIT'): Promise<LedgerTransaction[]> {
    return this.getLedgerTransactions(type);
  }

  static async addManualBalanceAdjustment(payload: any): Promise<LedgerTransaction> {
    const res = await fetch('/api/superadmin/finances/manual-adjust', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to apply manual balance adjustment');
    return data.transaction;
  }

  static async getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    const res = await fetch('/api/superadmin/finances/withdrawals', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load withdrawals');
    return data.withdrawals || [];
  }

  static async updateWithdrawalStatus(id: string, status: string, rejectionReason?: string, paymentReference?: string): Promise<WithdrawalRequest> {
    const res = await fetch(`/api/superadmin/finances/withdrawals/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, rejectionReason, paymentReference }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update withdrawal status');
    return data.withdrawal;
  }

  // 3. All API Settings
  static async getApiServices(): Promise<ApiServiceItem[]> {
    const res = await fetch('/api/superadmin/apis', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load API services');
    return data.apis || [];
  }

  static async saveApiService(api: Partial<ApiServiceItem>): Promise<ApiServiceItem> {
    const res = await fetch('/api/superadmin/apis', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(api),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save API service');
    return data.api;
  }

  static async testApiService(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/superadmin/apis/${id}/test`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to test connection');
    return data;
  }

  // 4. Courier Management
  static async getCourierAreas(): Promise<CourierAreaItem[]> {
    const res = await fetch('/api/superadmin/courier/areas', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load courier areas');
    return data.areas || [];
  }

  static async createCourierArea(area: Partial<CourierAreaItem>): Promise<CourierAreaItem> {
    const res = await fetch('/api/superadmin/courier/areas', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(area),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add courier area');
    return data.area;
  }

  static async getCourierChanges(): Promise<CourierChangeRecord[]> {
    const res = await fetch('/api/superadmin/courier/changes', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load courier change records');
    return data.changes || [];
  }

  static async changeOrderCourier(orderId: string, newCourier: string, reason: string): Promise<CourierChangeRecord> {
    const res = await fetch('/api/superadmin/courier/change-order', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ orderId, newCourier, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change order courier');
    return data.record;
  }

  // 5. SMS Service
  static async getSmsTemplates(): Promise<SmsTemplateItem[]> {
    const res = await fetch('/api/superadmin/sms/templates', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load SMS templates');
    return data.templates || [];
  }

  static async getSmsLogs(): Promise<SmsLogRecord[]> {
    const res = await fetch('/api/superadmin/sms/logs', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load SMS logs');
    return data.logs || [];
  }

  static async sendTestSms(mobile: string, message: string): Promise<SmsLogRecord> {
    const res = await fetch('/api/superadmin/sms/test', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ mobile, message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to transmit test SMS');
    return data.log;
  }

  // 6. User Management
  static async getAllUsers(): Promise<UserAccount[]> {
    const res = await fetch('/api/superadmin/users/all', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load users');
    return data.users || [];
  }

  static async createAdmin(adminData: any): Promise<UserAccount> {
    const res = await fetch('/api/superadmin/users/create-admin', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(adminData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to provision admin');
    return data.user;
  }

  static async updateUserStatus(userId: string, status: string): Promise<UserAccount> {
    const res = await fetch(`/api/superadmin/users/${userId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user status');
    return data.user;
  }

  static async updateUserDesignation(userId: string, designation: string, expiresAt?: string): Promise<UserAccount> {
    const res = await fetch(`/api/superadmin/users/${userId}/designation`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ designation, expiresAt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update designation');
    return data.user;
  }

  static async getDesignations(): Promise<DesignationItem[]> {
    const res = await fetch('/api/superadmin/users/designations', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load designations');
    return data.designations || [];
  }

  static async createDesignation(payload: any): Promise<DesignationItem> {
    const res = await fetch('/api/superadmin/users/designations', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create designation');
    return data.designation;
  }

  static async deleteDesignation(id: string): Promise<boolean> {
    const res = await fetch(`/api/superadmin/users/designations/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete designation');
    return true;
  }

  static async getModeratorRequests(): Promise<ModeratorRequestItem[]> {
    const res = await fetch('/api/superadmin/users/moderator-requests', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load moderator requests');
    return data.requests || [];
  }

  static async handleModeratorRequest(id: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string): Promise<ModeratorRequestItem> {
    const res = await fetch(`/api/superadmin/users/moderator-requests/${id}/action`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action, rejectionReason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to handle moderator request');
    return data.request;
  }

  // 7. Security & Passwords
  static async resetUserPassword(userId: string, newPassword?: string, forceNextChange?: boolean) {
    const res = await fetch('/api/superadmin/security/reset-password', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ userId, newPassword, forceNextChange }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset password');
    return data;
  }

  static async getLoginActivities(): Promise<UserLoginActivity[]> {
    const res = await fetch('/api/superadmin/security/login-activities', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load login activities');
    return data.activities || [];
  }

  static async logoutAllDevices(): Promise<{ message: string }> {
    const res = await fetch('/api/superadmin/security/logout-all-devices', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to logout devices');
    return data;
  }

  // 8. Customers Directory
  static async getCustomers(): Promise<CustomerRecord[]> {
    const res = await fetch('/api/superadmin/customers', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load customer directory');
    return data.customers || [];
  }

  // 9. Public Homepage & CMS Data
  static async getPublicHomeData(): Promise<{
    cms: HomepageCMS;
    company: CompanyInfo;
    tutorials: TutorialVideo[];
    stats: any;
  }> {
    const res = await fetch('/api/public/home');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load public home data');
    return data;
  }

  static async submitContactForm(payload: {
    name: string;
    mobile: string;
    email?: string;
    subject?: string;
    message: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/public/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit contact message');
    return data;
  }

  /* ========================================================
     ADMIN PANEL MASTER API METHODS
  ======================================================== */
  static async getAdminPermissions(): Promise<AdminPermissions> {
    const res = await fetch('/api/admin/permissions', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin permissions');
    return data.permissions;
  }

  static async getAdminBalances(typeFilter?: 'RESELLER' | 'SUPPLIER'): Promise<UserAccountBalance[]> {
    const url = typeFilter ? `/api/admin/accounts/balances?type=${typeFilter}` : '/api/admin/accounts/balances';
    const res = await fetch(url, { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch account balances');
    return data.balances || [];
  }

  static async adjustAdminBalance(payload: {
    userId: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    reason: string;
  }): Promise<{ record: BalanceAdjustmentRecord; message: string }> {
    const res = await fetch('/api/admin/accounts/adjust-balance', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to adjust balance');
    return data;
  }

  static async getTransactionApprovals(): Promise<TransactionIdApprovalItem[]> {
    const res = await fetch('/api/admin/accounts/transaction-approvals', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch transaction approvals');
    return data.transactions || [];
  }

  static async reviewTransactionApproval(
    id: string,
    action: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW',
    reason?: string
  ): Promise<{ item: TransactionIdApprovalItem; message: string }> {
    const res = await fetch(`/api/admin/accounts/transaction-approvals/${id}/review`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to review transaction');
    return data;
  }

  static async getAdminStatement(
    entityType: 'PLATFORM' | 'RESELLER' | 'SUPPLIER',
    entityId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const params = new URLSearchParams();
    params.set('entityType', entityType);
    if (entityId) params.set('entityId', entityId);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const res = await fetch(`/api/admin/accounts/statement?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch financial statement');
    return data.statement;
  }

  static async getAdminFinancesOverview(): Promise<AdminFinancialMetrics> {
    const res = await fetch('/api/admin/finances/overview', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch financial overview');
    return data.overview;
  }

  static async getResellerPayouts(): Promise<ResellerPayoutItem[]> {
    const res = await fetch('/api/admin/finances/payouts', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch payouts');
    return data.payouts || [];
  }

  static async reviewResellerPayout(
    id: string,
    action: 'APPROVED' | 'REJECTED' | 'ON_HOLD',
    reason?: string
  ): Promise<{ payout: ResellerPayoutItem; message: string }> {
    const res = await fetch(`/api/admin/finances/payouts/${id}/action`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to review payout');
    return data;
  }

  static async getSupplierSettlements(): Promise<SupplierSettlementItem[]> {
    const res = await fetch('/api/admin/finances/supplier-settlements', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch supplier settlements');
    return data.settlements || [];
  }

  static async reviewSupplierSettlement(
    id: string,
    action: 'SETTLED' | 'HELD'
  ): Promise<{ settlement: SupplierSettlementItem; message: string }> {
    const res = await fetch(`/api/admin/finances/supplier-settlements/${id}/action`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update settlement');
    return data;
  }

  static async getUserVerifications(): Promise<UserVerificationItem[]> {
    const res = await fetch('/api/admin/users/verifications', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user verifications');
    return data.verifications || [];
  }

  static async reviewUserVerification(
    id: string,
    action: 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'UNDER_REVIEW',
    reason?: string
  ): Promise<{ item: UserVerificationItem; message: string }> {
    const res = await fetch(`/api/admin/users/verifications/${id}/review`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to process verification');
    return data;
  }

  static async addVerificationContactLog(
    id: string,
    payload: {
      type: 'PHONE_CALL' | 'SMS_SENT' | 'EMAIL_DISPATCH' | 'WHATSAPP' | 'IN_PERSON_VISIT';
      outcome: 'REACHED_VERIFIED' | 'CALL_BUSY' | 'UNREACHABLE' | 'FOLLOWUP_SCHEDULED' | 'EMAIL_DELIVERED' | 'DOCUMENT_REQUESTED';
      notes: string;
      duration?: string;
    }
  ): Promise<{ item: UserVerificationItem; message: string }> {
    const res = await fetch(`/api/admin/users/verifications/${id}/contact-log`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to log contact interaction');
    return data;
  }

  static async getApplicationAuditTrail(id: string): Promise<UserVerificationAuditEntry[]> {
    const res = await fetch(`/api/admin/users/verifications/${id}/audit-trail`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch audit trail');
    return data.auditTrail || [];
  }

  static async adminCreateUser(payload: {
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
  }): Promise<{ user: UserAccount; message: string }> {
    const res = await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create user');
    return data;
  }

  static async getAdminSmsDashboard(): Promise<{ sms: AdminSmsMetrics; logs: SmsLogRecord[] }> {
    const res = await fetch('/api/admin/sms/dashboard', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch SMS dashboard');
    return data;
  }

  static async toggleSmsTrigger(key: string, enabled: boolean): Promise<Record<string, boolean>> {
    const res = await fetch('/api/admin/sms/toggle-trigger', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ key, enabled }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle SMS trigger');
    return data.triggers;
  }

  static async sendAdminBulkSms(payload: {
    targetGroup: string;
    message: string;
    customNumbers?: string[];
  }): Promise<{ success: boolean; count: number; log: SmsLogRecord }> {
    const res = await fetch('/api/admin/sms/send-bulk', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send bulk SMS');
    return data;
  }

  static async updateAdminOrderStatus(
    orderId: string,
    status: OrderStatus,
    reason?: string
  ): Promise<{ order: OrderItem; message: string }> {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update order status');
    return data;
  }

  static async getAdminAnalytics(period: string = 'THIS_MONTH'): Promise<any> {
    const res = await fetch(`/api/admin/analytics?period=${period}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics');
    return data.analytics;
  }

  static async getAdminReports(type: string = 'SALES', start?: string, end?: string): Promise<any[]> {
    const params = new URLSearchParams();
    params.set('type', type);
    if (start) params.set('start', start);
    if (end) params.set('end', end);

    const res = await fetch(`/api/admin/reports?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch reports');
    return data.reports || [];
  }
}

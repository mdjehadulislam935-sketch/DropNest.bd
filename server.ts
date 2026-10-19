import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { BANGLADESH_DISTRICTS, getUpazilasForDistrict, isValidDistrictUpazila } from './src/data/bangladeshLocations.ts';
import { db, verifyPassword } from './src/server/storage.ts';
import type { OrderStatus, UserRole } from './src/types/platform.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Security headers & basic rate limiting tracking
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const rate = requestCounts.get(clientIp);

    if (rate) {
      if (now > rate.resetTime) {
        requestCounts.set(clientIp, { count: 1, resetTime: now + 60000 });
      } else {
        rate.count += 1;
        if (rate.count > 400) {
          return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }
      }
    } else {
      requestCounts.set(clientIp, { count: 1, resetTime: now + 60000 });
    }
    next();
  });

  // Auth Middleware
  function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Session token missing or invalid' });
    }
    const token = authHeader.split(' ')[1];
    const session = db.validateSession(token);
    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    }
    (req as any).user = session.user;
    (req as any).role = session.role;
    (req as any).token = token;
    (req as any).loginTimestamp = session.loginTimestamp;
    next();
  }

  // Permission Guard
  function requireRole(allowedRoles: UserRole[]) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const user = (req as any).user;
      if (!user || !allowedRoles.includes(user.role)) {
        db.addAuditLog({
          actorId: user?.id || 'anonymous',
          actorName: user?.fullName || 'Anonymous',
          actorRole: user?.role || 'RESELLER',
          action: 'ACCESS_DENIED',
          details: `Unauthorized attempt to access protected endpoint: ${req.originalUrl}`,
        });
        return res.status(403).json({ error: 'Access forbidden: Insufficient permissions' });
      }
      next();
    };
  }

  /* ========================================================
     AUTHENTICATION ENDPOINTS
  ======================================================== */
  app.post('/api/auth/login', (req, res) => {
    try {
      const { credential, password, expectedRole } = req.body;

      if (!credential || !password) {
        return res.status(400).json({ error: 'Please enter your username/mobile and password.' });
      }

      const user = db.findUserByLogin(credential);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        db.addAuditLog({
          actorId: 'system',
          actorName: 'Security Monitor',
          actorRole: 'SUPER_ADMIN',
          action: 'FAILED_LOGIN_ATTEMPT',
          details: `Failed sign in attempt for credential: ${credential}`,
        });
        return res.status(401).json({ error: 'Invalid username/mobile or password.' });
      }

      if (expectedRole && user.role !== expectedRole) {
        db.addAuditLog({
          actorId: user.id,
          actorName: user.fullName,
          actorRole: user.role,
          action: 'ROLE_MISMATCH_LOGIN',
          details: `User with role ${user.role} attempted to sign in via ${expectedRole} portal.`,
        });
        return res.status(403).json({
          error: `Access denied. Your account is registered as ${user.role}. Please use the authorized portal.`,
        });
      }

      if (user.status === 'SUSPENDED') {
        return res.status(403).json({ error: 'Your account is suspended. Contact DropNest compliance.' });
      }

      const { token, loginTimestamp } = db.createSession(user.id, user.role, req.ip || '127.0.0.1', req.headers['user-agent'] || 'Web Browser');
      const { passwordHash: _, ...publicUser } = user;

      db.addAuditLog({
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.role,
        action: 'SUCCESSFUL_LOGIN',
        details: `${user.fullName} signed in as ${user.role}.`,
      });

      return res.json({
        token,
        user: publicUser,
        loginTimestamp,
        platformVersion: 'DropNest Core v1.0.0-PROD',
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  app.post('/api/auth/register', (req, res) => {
    try {
      const { role, username, fullName, mobile, email, password, businessName, storeName, district, upazila, address, verificationDoc } = req.body;

      if (role !== 'RESELLER' && role !== 'SUPPLIER') {
        db.addAuditLog({
          actorId: 'anonymous',
          actorName: 'Anonymous Registration',
          actorRole: 'RESELLER',
          action: 'PRIVILEGE_ESCALATION_ATTEMPT',
          details: `Attempted self-registration with unauthorized privileged role: ${role}`,
        });
        return res.status(403).json({ error: 'Public registration is restricted to Resellers and Suppliers only.' });
      }

      if (!username || !fullName || !mobile || !password) {
        return res.status(400).json({ error: 'Please provide all required fields.' });
      }

      if (district && upazila && !isValidDistrictUpazila(district, upazila)) {
        return res.status(400).json({ error: `Selected upazila "${upazila}" does not belong to district "${district}".` });
      }

      const newUser = db.createUser({
        username,
        fullName,
        mobile,
        email: email || '',
        role,
        status: 'ACTIVE',
        businessName,
        storeName,
        district,
        upazila,
        address,
        verificationDoc,
        password,
      });

      const { token, loginTimestamp } = db.createSession(newUser.id, newUser.role);

      return res.status(201).json({
        message: 'Account successfully registered and verified.',
        user: newUser,
        token,
        loginTimestamp,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/logout', authenticate, (req, res) => {
    const token = (req as any).token;
    if (token) {
      db.revokeSession(token);
    }
    return res.json({ message: 'Signed out successfully' });
  });

  app.get('/api/auth/me', authenticate, (req, res) => {
    const user = (req as any).user;
    const loginTimestamp = (req as any).loginTimestamp;
    return res.json({ user, loginTimestamp, platformVersion: 'DropNest Core v1.0.0-PROD' });
  });

  /* ========================================================
     RECIPIENT AUTOCOMPLETE (INTERNAL E-MAIL BOX)
  ======================================================== */
  app.get('/api/users/lookup', authenticate, (req, res) => {
    const mobileQuery = String(req.query.mobile || '');
    if (!mobileQuery || mobileQuery.length < 3) {
      return res.json({ results: [] });
    }

    const clean = mobileQuery.replace(/\D/g, '');
    const users = db.getAllUsers();
    const matches = users
      .filter((u) => u.mobile.replace(/\D/g, '').includes(clean))
      .map((u) => ({
        id: u.id,
        fullName: u.fullName,
        role: u.role,
        mobile: u.mobile,
      }));

    return res.json({ results: matches });
  });

  /* ========================================================
     PRODUCTS
  ======================================================== */
  app.get('/api/products', authenticate, (req, res) => {
    const user = (req as any).user;
    const products = db.getProducts(user.role, user.id);
    return res.json({ products });
  });

  app.post('/api/products', authenticate, requireRole(['SUPPLIER', 'ADMIN', 'SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { name, sku, category, basePrice, suggestedRetailPrice, stockQuantity, description, specifications } = req.body;

      if (!name || !sku || !basePrice) {
        return res.status(400).json({ error: 'Name, SKU, and Base Price are required.' });
      }

      const product = db.createProduct(user, {
        name,
        sku,
        category: category || 'General Merchandise',
        basePrice: Number(basePrice),
        suggestedRetailPrice: Number(suggestedRetailPrice || basePrice * 1.25),
        stockQuantity: Number(stockQuantity || 0),
        description: description || '',
        specifications: specifications || {},
      });

      return res.status(201).json({ product });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/products/:id/status', authenticate, requireRole(['MODERATOR', 'ADMIN', 'SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { status } = req.body;
      if (status !== 'APPROVED' && status !== 'REJECTED') {
        return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
      }
      const updated = db.updateProductStatus(req.params.id, status, user);
      return res.json({ product: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /* ========================================================
     ORDERS & ORDER TRACKER
  ======================================================== */
  app.get('/api/orders', authenticate, (req, res) => {
    const user = (req as any).user;
    const orders = db.getOrders(user.role, user.id);
    return res.json({ orders });
  });

  app.post('/api/orders', authenticate, requireRole(['RESELLER', 'ADMIN', 'SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { productId, quantity, resellerSellPrice, deliveryCharge, customerName, customerMobile, customerEmail, customerDistrict, customerUpazila, deliveryAddress } = req.body;

      if (!productId || !quantity || !customerName || !customerMobile || !customerDistrict || !customerUpazila) {
        return res.status(400).json({ error: 'Missing mandatory order details' });
      }

      if (!isValidDistrictUpazila(customerDistrict, customerUpazila)) {
        return res.status(400).json({ error: `Invalid District/Upazila combination: ${customerDistrict} - ${customerUpazila}` });
      }

      const order = db.createOrder(user, {
        productId,
        quantity: Number(quantity),
        resellerSellPrice: Number(resellerSellPrice),
        deliveryCharge: Number(deliveryCharge || 120),
        customerName,
        customerMobile,
        customerEmail,
        customerDistrict,
        customerUpazila,
        deliveryAddress,
      });

      return res.status(201).json({ order });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/orders/:id/status', authenticate, (req, res) => {
    try {
      const user = (req as any).user;
      const { status, reason } = req.body;
      const updated = db.updateOrderStatus(req.params.id, status as OrderStatus, user, reason);
      return res.json({ order: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /* ========================================================
     INTERNAL E-MAIL BOX (WITH 15-MESSAGE AND 260-WORD LIMIT)
  ======================================================== */
  app.get('/api/messages', authenticate, (req, res) => {
    const user = (req as any).user;
    const folder = req.query.folder ? String(req.query.folder) : undefined;
    const messages = db.getMessagesForUser(user.id, folder);
    return res.json({ messages });
  });

  app.post('/api/messages', authenticate, (req, res) => {
    try {
      const user = (req as any).user;
      const { recipientMobile, subject, body, images } = req.body;
      if (!recipientMobile || !body) {
        return res.status(400).json({ error: 'Recipient mobile number and message content are required.' });
      }
      const message = db.sendMessage(user, { recipientMobile, subject, body, images });
      return res.status(201).json({ message });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/messages/:id', authenticate, (req, res) => {
    try {
      const user = (req as any).user;
      db.deleteMessage(req.params.id, user);
      return res.json({ success: true, message: 'Message permanently deleted. Mailbox quota reclaimed.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /* ========================================================
     SUPER ADMIN MASTER MODULE ENDPOINTS
  ======================================================== */

  /* ========================================================
     PUBLIC HOMEPAGE & CMS ENDPOINTS
  ======================================================== */
  app.get('/api/public/home', (_req, res) => {
    return res.json({
      cms: db.getHomepageCMS(),
      company: db.getCompanyInfo(),
      tutorials: db.getTutorials(),
      stats: db.getPlatformStats(),
    });
  });

  app.post('/api/public/contact', (req, res) => {
    try {
      const { name, mobile, email, subject, message } = req.body;
      if (!name || !mobile || !message) {
        return res.status(400).json({ error: 'Name, mobile number, and message are required.' });
      }

      db.addAuditLog({
        actorId: 'public_visitor',
        actorName: name,
        actorRole: 'RESELLER',
        action: 'PUBLIC_CONTACT_INQUIRY',
        details: `Public contact form inquiry from ${name} (${mobile}, ${email || 'No email'}): ${subject || 'General Inquiry'} - ${message.slice(0, 80)}...`,
      });

      return res.status(201).json({
        success: true,
        message: 'Thank you for contacting DropNest Bangladesh. Our support team will follow up with you within 24 hours.',
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to submit contact message.' });
    }
  });

  // 1. Business Info & CMS
  app.get('/api/superadmin/company', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    return res.json({ company: db.getCompanyInfo() });
  });

  app.put('/api/superadmin/company', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const updated = db.updateCompanyInfo(req.body, user);
      return res.json({ company: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/superadmin/cms', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    return res.json({ cms: db.getHomepageCMS() });
  });

  app.put('/api/superadmin/cms', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const updated = db.updateHomepageCMS(req.body, user);
      return res.json({ cms: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/superadmin/cms/publish', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const published = db.publishHomepageCMS(user);
      return res.json({ cms: published, message: 'Homepage successfully published to live website.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/superadmin/cms/restore', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const restored = db.restorePreviousHomepage(user);
      return res.json({ cms: restored, message: 'Previous homepage version successfully restored.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/superadmin/tutorials', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    return res.json({ tutorials: db.getTutorials() });
  });

  app.post('/api/superadmin/tutorials', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const tut = db.createTutorial(req.body, user);
      return res.status(201).json({ tutorial: tut });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/superadmin/tutorials/:id', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      db.deleteTutorial(req.params.id, user);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 2. Financial Management & Ledger
  app.get('/api/superadmin/finances/summary', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    return res.json({ summary: db.getFinancialSummary() });
  });

  app.get('/api/superadmin/finances/transactions', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const type = req.query.type as 'CREDIT' | 'DEBIT' | undefined;
    return res.json({ transactions: db.getLedgerTransactions(type) });
  });

  app.post('/api/superadmin/finances/manual-adjust', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const txn = db.addManualBalanceAdjustment(user, req.body);
      return res.status(201).json({ transaction: txn, message: 'Ledger transaction completed and confirmed.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/superadmin/finances/withdrawals', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    return res.json({ withdrawals: db.getWithdrawalRequests() });
  });

  app.patch('/api/superadmin/finances/withdrawals/:id/status', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { status, rejectionReason, paymentReference } = req.body;
      const updated = db.updateWithdrawalStatus(req.params.id, status, user, rejectionReason, paymentReference);
      return res.json({ withdrawal: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 3. All API Settings
  app.get('/api/superadmin/apis', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    return res.json({ apis: db.getApiServices() });
  });

  app.post('/api/superadmin/apis', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const api = db.createOrUpdateApiService(req.body, user);
      return res.json({ api });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/superadmin/apis/:id/test', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const result = db.testApiConnection(req.params.id, user);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 4. Courier Management
  app.get('/api/superadmin/courier/areas', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    return res.json({ areas: db.getCourierAreas() });
  });

  app.post('/api/superadmin/courier/areas', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const area = db.createCourierArea(req.body, user);
      return res.status(201).json({ area });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/superadmin/courier/changes', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    return res.json({ changes: db.getCourierChanges() });
  });

  app.post('/api/superadmin/courier/change-order', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { orderId, newCourier, reason } = req.body;
      const rec = db.changeOrderCourier(orderId, newCourier, reason, user);
      return res.json({ record: rec, message: 'Courier successfully reassigned.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 5. Order Tracker with 17 Search Fields
  app.post('/api/superadmin/orders/search', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']), (req, res) => {
    const orders = db.searchOrders(req.body);
    return res.json({ orders });
  });

  // 6. SMS Service
  app.get('/api/superadmin/sms/templates', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    return res.json({ templates: db.getSmsTemplates() });
  });

  app.get('/api/superadmin/sms/logs', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    return res.json({ logs: db.getSmsLogs() });
  });

  app.post('/api/superadmin/sms/test', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { mobile, message } = req.body;
      const log = db.sendTestSms(mobile, message, user);
      return res.json({ log, message: 'Test SMS successfully transmitted to provider queue.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 7. User Management, Designations, Moderator Requests
  app.get('/api/superadmin/users/all', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    return res.json({ users: db.getAllUsers() });
  });

  app.post('/api/superadmin/users/create-admin', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const { username, fullName, mobile, email, password, designation, expiresAt } = req.body;
      const admin = db.createUser({
        username,
        fullName,
        mobile,
        email,
        password,
        role: 'ADMIN',
        designation: designation || 'Operations Admin',
        expiresAt,
        status: 'ACTIVE',
      });
      return res.status(201).json({ user: admin, message: 'New Admin account provisioned.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/superadmin/users/:id/status', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const updated = db.updateUserStatus(req.params.id, req.body.status, user);
      return res.json({ user: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/superadmin/users/:id/designation', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { designation, expiresAt } = req.body;
      const updated = db.updateUserDesignationAndExpiry(req.params.id, designation, expiresAt, user);
      return res.json({ user: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/superadmin/users/designations', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    return res.json({ designations: db.getDesignations() });
  });

  app.post('/api/superadmin/users/designations', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const des = db.createDesignation(req.body, user);
      return res.status(201).json({ designation: des });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/superadmin/users/designations/:id', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      db.deleteDesignation(req.params.id, user);
      return res.json({ success: true, message: 'Designation safely deleted.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/superadmin/users/moderator-requests', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    return res.json({ requests: db.getModeratorRequests() });
  });

  app.post('/api/superadmin/users/moderator-requests/:id/action', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { action, rejectionReason } = req.body;
      const updated = db.handleModeratorRequest(req.params.id, action, user, rejectionReason);
      return res.json({ request: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 8. User Login Security & Password Resets
  app.post('/api/superadmin/security/reset-password', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { userId, newPassword, forceNextChange } = req.body;
      const result = db.resetUserPassword(userId, newPassword || 'DropNest@2026', user, forceNextChange ?? true);
      return res.json({ message: 'Password securely updated and reset audit recorded.', ...result });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/superadmin/security/login-activities', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    return res.json({ activities: db.getLoginActivities() });
  });

  app.get('/api/superadmin/security/reset-logs', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    return res.json({ logs: db.getPasswordResetLogs() });
  });

  app.post('/api/superadmin/security/logout-all-devices', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
    const user = (req as any).user;
    const token = (req as any).token;
    const count = db.revokeAllOtherSessions(user.id, token);
    return res.json({ message: `Successfully revoked ${count} other active device session(s).` });
  });

  // 9. Customers Directory
  app.get('/api/superadmin/customers', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    return res.json({ customers: db.getCustomers() });
  });

  // 10. Audit Logs & System Health
  app.get('/api/audit-logs', authenticate, requireRole(['MODERATOR', 'ADMIN', 'SUPER_ADMIN']), (req, res) => {
    return res.json({ auditLogs: db.getAuditLogs() });
  });

  app.get('/api/stats', authenticate, (req, res) => {
    return res.json({ stats: db.getPlatformStats() });
  });

  /* ========================================================
     BANGLADESH LOCATIONS API
  ======================================================== */
  app.get('/api/locations/districts', (req, res) => {
    return res.json({ districts: BANGLADESH_DISTRICTS.map((d) => ({ id: d.id, name: d.name, division: d.division })) });
  });

  app.get('/api/locations/districts/:district/upazilas', (req, res) => {
    const upazilas = getUpazilasForDistrict(req.params.district);
    return res.json({ upazilas });
  });

  /* ========================================================
     ADMIN PANEL MASTER ENDPOINTS
  ======================================================== */
  // 1. Admin Permissions
  app.get('/api/admin/permissions', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    const user = (req as any).user;
    return res.json({ permissions: db.getAdminPermissions(user.id) });
  });

  // 2. Account & Balances
  app.get('/api/admin/accounts/balances', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    const typeFilter = req.query.type as 'RESELLER' | 'SUPPLIER' | undefined;
    return res.json({ balances: db.getUserAccountBalances(typeFilter) });
  });

  app.post('/api/admin/accounts/adjust-balance', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const record = db.adjustUserBalance(user, req.body);
      return res.status(201).json({ record, message: 'Balance adjusted successfully.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 3. Transaction ID Approvals
  app.get('/api/admin/accounts/transaction-approvals', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (_req, res) => {
    return res.json({ transactions: db.getTransactionApprovals() });
  });

  app.post('/api/admin/accounts/transaction-approvals/:id/review', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { action, reason } = req.body;
      const item = db.reviewTransactionApproval(req.params.id, action, user, reason);
      return res.json({ item, message: `Transaction submission marked as ${action}.` });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 4. Financial Statements
  app.get('/api/admin/accounts/statement', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    const entityType = (req.query.entityType as any) || 'PLATFORM';
    const entityId = req.query.entityId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const statement = db.getAdminStatement(entityType, entityId, startDate, endDate);
    return res.json({ statement });
  });

  // 5. Financial Overview & Trends
  app.get('/api/admin/finances/overview', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (_req, res) => {
    return res.json({ overview: db.getAdminFinancialOverview() });
  });

  // 6. Reseller Payout Requests
  app.get('/api/admin/finances/payouts', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (_req, res) => {
    return res.json({ payouts: db.getResellerPayouts() });
  });

  app.post('/api/admin/finances/payouts/:id/action', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { action, reason } = req.body;
      const payout = db.reviewResellerPayout(req.params.id, action, user, reason);
      return res.json({ payout, message: `Payout request marked as ${action}.` });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 7. Supplier Settlements
  app.get('/api/admin/finances/supplier-settlements', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (_req, res) => {
    return res.json({ settlements: db.getSupplierSettlements() });
  });

  app.post('/api/admin/finances/supplier-settlements/:id/action', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { action } = req.body;
      const settlement = db.reviewSupplierSettlement(req.params.id, action, user);
      return res.json({ settlement, message: `Supplier settlement updated to ${action}.` });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 8. User Verification & Approvals (Resellers & Suppliers)
  app.get('/api/admin/users/verifications', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (_req, res) => {
    return res.json({ verifications: db.getUserVerifications() });
  });

  app.post('/api/admin/users/verifications/:id/review', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { action, reason } = req.body;
      const item = db.reviewUserVerification(req.params.id, action, user, reason);
      return res.json({ item, message: `Verification application marked as ${action}.` });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/verifications/:id/contact-log', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const item = db.addVerificationContactLog(req.params.id, user, req.body);
      return res.status(201).json({ item, message: 'Contact interaction logged successfully.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/admin/users/verifications/:id/audit-trail', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    try {
      const verifications = db.getUserVerifications();
      const item = verifications.find((v) => v.id === req.params.id);
      if (!item) return res.status(404).json({ error: 'Verification record not found' });
      return res.json({ auditTrail: item.auditTrail || [] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 9. New User Creation (Enforces: Cannot create SUPER_ADMIN!)
  app.post('/api/admin/users/create', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const created = db.adminCreateUser(user, req.body);
      return res.status(201).json({ user: created, message: `Account for ${created.fullName} created successfully.` });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 10. SMS Centre & Automated Triggers
  app.get('/api/admin/sms/dashboard', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (_req, res) => {
    return res.json({ sms: db.getAdminSmsMetrics(), logs: db.getSmsLogs() });
  });

  app.post('/api/admin/sms/toggle-trigger', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { key, enabled } = req.body;
      const triggers = db.toggleSmsTrigger(key, Boolean(enabled), user);
      return res.json({ triggers });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/sms/send-bulk', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const result = db.sendAdminBulkSms(user, req.body);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 11. Order Status Transition by Admin
  app.patch('/api/admin/orders/:id/status', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    try {
      const user = (req as any).user;
      const { status, reason } = req.body;
      const permissions = db.getAdminPermissions(user.id);
      if (!permissions.canChangeOrderStatus && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Permission Denied: You cannot update order statuses.' });
      }
      const updated = db.updateOrderStatus(req.params.id, status, user, reason);
      return res.json({ order: updated, message: 'Order status updated successfully.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 12. Analytics
  app.get('/api/admin/analytics', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    const period = (req.query.period as string) || 'THIS_MONTH';
    return res.json({ analytics: db.getAdminAnalytics(period) });
  });

  // 13. Reports
  app.get('/api/admin/reports', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
    const type = (req.query.type as string) || 'SALES';
    const start = req.query.start as string | undefined;
    const end = req.query.end as string | undefined;
    return res.json({ reports: db.getAdminReports(type, start, end) });
  });

  /* ========================================================
     VITE DEV / PRODUCTION MIDDLEWARE
  ======================================================== */
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`DropNest Master Platform server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start DropNest server:', err);
  process.exit(1);
});

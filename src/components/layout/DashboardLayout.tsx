import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTabs } from '../../context/TabContext.tsx';
import { Header } from '../common/Header.tsx';
import { Sidebar } from '../common/Sidebar.tsx';
import { TabBar } from '../common/TabBar.tsx';
import { TopInfoBar } from '../common/TopInfoBar.tsx';

// General & Role Modules
import { AuditLogsView } from '../modules/AuditLogsView.tsx';
import { BangladeshLocationsView } from '../modules/BangladeshLocationsView.tsx';
import { CreateOrderView } from '../modules/CreateOrderView.tsx';
import { DashboardHome } from '../modules/DashboardHome.tsx';
import { GovernanceView } from '../modules/GovernanceView.tsx';
import { InternalMailbox } from '../modules/InternalMailbox.tsx';
import { OrderTrackingView } from '../modules/OrderTrackingView.tsx';
import { ProductManagementView } from '../modules/ProductManagementView.tsx';
import { ResellerStoreView } from '../modules/ResellerStoreView.tsx';

// Super Admin Sovereign Modules
import { SuperAdminSidebar } from '../superadmin/SuperAdminSidebar.tsx';
import { SuperAdminDashboardOverview } from '../superadmin/SuperAdminDashboardOverview.tsx';
import { BusinessInfoModule } from '../superadmin/modules/BusinessInfoModule.tsx';
import { AccountModule } from '../superadmin/modules/AccountModule.tsx';
import { AllApiSettingModule } from '../superadmin/modules/AllApiSettingModule.tsx';
import { CourierModule } from '../superadmin/modules/CourierModule.tsx';
import { OrderTrackerModule } from '../superadmin/modules/OrderTrackerModule.tsx';
import { SmsServiceCentreModule } from '../superadmin/modules/SmsServiceCentreModule.tsx';
import { UserManagementModule } from '../superadmin/modules/UserManagementModule.tsx';
import { LoginSecurityModule } from '../superadmin/modules/LoginSecurityModule.tsx';
import { FinancialManagementModule } from '../superadmin/modules/FinancialManagementModule.tsx';
import { AnalyticsModule } from '../superadmin/modules/AnalyticsModule.tsx';
import { CustomerModule } from '../superadmin/modules/CustomerModule.tsx';
import { ReportsModule } from '../superadmin/modules/ReportsModule.tsx';
import { SecurityConsoleModule } from '../superadmin/modules/SecurityConsoleModule.tsx';
import { SuperAdminMailboxModule } from '../superadmin/modules/SuperAdminMailboxModule.tsx';

// Admin Operational Authority Modules
import { AdminSidebar } from '../admin/AdminSidebar.tsx';
import { AdminDashboardOverview } from '../admin/AdminDashboardOverview.tsx';
import { AdminAccountModule } from '../admin/modules/AdminAccountModule.tsx';
import { AdminFinancialModule } from '../admin/modules/AdminFinancialModule.tsx';
import { AdminUserApprovalModule } from '../admin/modules/AdminUserApprovalModule.tsx';
import { AdminNewUserModule } from '../admin/modules/AdminNewUserModule.tsx';
import { AdminOrderTrackingModule } from '../admin/modules/AdminOrderTrackingModule.tsx';
import { AdminSmsModule } from '../admin/modules/AdminSmsModule.tsx';
import { AdminAnalyticsModule } from '../admin/modules/AdminAnalyticsModule.tsx';
import { AdminReportsModule } from '../admin/modules/AdminReportsModule.tsx';
import { AdminPermissionsModule } from '../admin/modules/AdminPermissionsModule.tsx';
import { AdminMailboxModule } from '../admin/modules/AdminMailboxModule.tsx';

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const { tabs, activeTabId, openTab } = useTabs();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const adminTitles: Record<string, string> = {
    dashboard: 'Admin Dashboard',
    accounts: 'Account & Ledger',
    finances: 'Financial Transactions',
    'user-approvals': 'Approval Management',
    'create-user': 'New User Creation',
    'order-tracking': 'Order Tracking',
    'sms-centre': 'SMS Service Centre',
    analytics: 'Analytics',
    reports: 'Reports',
    mailbox: 'E-mail Box',
    permissions: 'Role Permissions',
  };

  const handleAdminNavigate = (mod: string, sub?: string) => {
    const modId = mod.startsWith('admin-') ? mod : `admin-${mod}`;
    const rawKey = mod.replace('admin-', '');
    openTab({
      id: modId,
      title: adminTitles[rawKey] || 'Admin Module',
      viewId: modId,
      submodule: sub,
      isClosable: rawKey !== 'dashboard',
    });
  };

  const renderTabView = () => {
    if (!activeTab) {
      if (isSuperAdmin) return <SuperAdminDashboardOverview key="sa-home-fallback" />;
      if (isAdmin) return <AdminDashboardOverview key="admin-home-fallback" onNavigate={handleAdminNavigate} />;
      return <DashboardHome key="fallback-home" />;
    }

    // Key includes tab.id and tab.refreshKey so refreshing acts ONLY on this tab!
    const key = `${activeTab.id}-${activeTab.refreshKey}`;

    switch (activeTab.viewId) {
      case 'dashboard':
        if (isSuperAdmin) return <SuperAdminDashboardOverview key={key} />;
        if (isAdmin) return <AdminDashboardOverview key={key} onNavigate={handleAdminNavigate} />;
        return <DashboardHome key={key} />;

      // Admin Operational Modules
      case 'admin-dashboard':
        return <AdminDashboardOverview key={key} onNavigate={handleAdminNavigate} />;

      case 'admin-accounts':
        return <AdminAccountModule key={key} initialSubmodule={activeTab.submodule} />;

      case 'admin-finances':
        return <AdminFinancialModule key={key} initialSubmodule={activeTab.submodule} />;

      case 'admin-user-approvals':
        return <AdminUserApprovalModule key={key} initialSubmodule={activeTab.submodule} />;

      case 'admin-create-user':
        return <AdminNewUserModule key={key} initialSubmodule={activeTab.submodule} />;

      case 'admin-order-tracking':
        return <AdminOrderTrackingModule key={key} initialSubmodule={activeTab.submodule} />;

      case 'admin-sms-centre':
        return <AdminSmsModule key={key} initialSubmodule={activeTab.submodule} />;

      case 'admin-analytics':
        return <AdminAnalyticsModule key={key} initialSubmodule={activeTab.submodule} />;

      case 'admin-reports':
        return <AdminReportsModule key={key} initialSubmodule={activeTab.submodule} />;

      case 'admin-mailbox':
        return <AdminMailboxModule key={key} />;

      case 'admin-permissions':
        return <AdminPermissionsModule key={key} />;

      // Super Admin Modules
      case 'business-info':
        return <BusinessInfoModule key={key} initialSubmodule={activeTab.submodule as any} />;

      case 'account-mgmt':
        return <AccountModule key={key} initialSubmodule={activeTab.submodule as any} />;

      case 'all-api-setting':
        return <AllApiSettingModule key={key} initialSubmodule={activeTab.submodule as any} />;

      case 'courier-mgmt':
        return <CourierModule key={key} initialSubmodule={activeTab.submodule as any} />;

      case 'superadmin-order-tracker':
        return <OrderTrackerModule key={key} />;

      case 'sms-centre':
        return <SmsServiceCentreModule key={key} initialSubmodule={activeTab.submodule as any} />;

      case 'user-management':
        return <UserManagementModule key={key} initialSubmodule={activeTab.submodule as any} />;

      case 'login-security':
        return <LoginSecurityModule key={key} initialSubmodule={activeTab.submodule as any} />;

      case 'financial-mgmt':
        return <FinancialManagementModule key={key} initialSubmodule={activeTab.submodule as any} />;

      case 'analytics-mgmt':
        return <AnalyticsModule key={key} initialSubmodule={activeTab.submodule as any} />;

      case 'customer-mgmt':
        return <CustomerModule key={key} />;

      case 'reports-mgmt':
        return <ReportsModule key={key} initialSubmodule={activeTab.submodule as any} />;

      case 'security-console':
        return <SecurityConsoleModule key={key} initialSubmodule={activeTab.submodule as any} />;

      case 'superadmin-email-box':
        return <SuperAdminMailboxModule key={key} />;

      // Role Shared & Reseller/Supplier/Moderator Views
      case 'catalog':
        return <ProductManagementView key={key} filterStatus="APPROVED" />;

      case 'supplier-products':
      case 'submit-product':
        return <ProductManagementView key={key} filterStatus="ALL" />;

      case 'product-approvals':
        return <ProductManagementView key={key} filterStatus="PENDING_APPROVAL" />;

      case 'create-order':
        return <CreateOrderView key={key} initialProductId={activeTab.params?.productId} />;

      case 'orders':
        return <OrderTrackingView key={key} />;

      case 'mailbox':
        if (isSuperAdmin) return <SuperAdminMailboxModule key={key} />;
        if (isAdmin) return <AdminMailboxModule key={key} />;
        return <InternalMailbox key={key} />;

      case 'store':
        return <ResellerStoreView key={key} />;

      case 'locations':
        return <BangladeshLocationsView key={key} />;

      case 'audit-logs':
        return <AuditLogsView key={key} />;

      case 'governance':
      case 'platform-stats':
      case 'users-directory':
        return <GovernanceView key={key} />;

      case 'profile':
        return (
          <div key={key} className="max-w-2xl mx-auto bg-[#171226] border border-[#302741] p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Account Profile & Security</h3>
            <div className="p-4 rounded-xl bg-[#100D1B] border border-[#302741] space-y-2 text-xs text-[#C9C4D6]">
              <div className="flex justify-between">
                <span>Account Holder:</span>
                <span className="font-semibold text-white">{user?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span>Registered Role:</span>
                <span className="font-bold text-[#A855F7]">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span>DropNest Mobile ID:</span>
                <span className="font-mono text-[#22D3EE]">{user?.mobile}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-[#34D399] font-semibold">{user?.status}</span>
              </div>
              {user?.businessName && (
                <div className="flex justify-between">
                  <span>Business Entity:</span>
                  <span className="text-white">{user.businessName}</span>
                </div>
              )}
              {user?.district && (
                <div className="flex justify-between">
                  <span>Operating District:</span>
                  <span className="text-white">{user.upazila}, {user.district}</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        if (isSuperAdmin) return <SuperAdminDashboardOverview key={key} />;
        if (isAdmin) return <AdminDashboardOverview key={key} onNavigate={handleAdminNavigate} />;
        return <DashboardHome key={key} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080611] text-white flex flex-col selection:bg-[#7C3AED]/30">
      {/* 1. Persistent Main Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* 2. Top Information Bar (Shown only for Moderator, Admin, Super Admin) */}
      <TopInfoBar />

      {/* 3. Main Workspace with Sidebar & Tabbed Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Render SuperAdminSidebar for Super Admin, AdminSidebar for Admin, or regular Sidebar for other roles */}
        {isSuperAdmin ? (
          <SuperAdminSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        ) : isAdmin ? (
          <AdminSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            activeModule={
              (activeTab.viewId.startsWith('admin-')
                ? (activeTab.viewId.replace('admin-', '') as any)
                : 'dashboard')
            }
            onSelectModule={handleAdminNavigate}
          />
        ) : (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Workspace Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#100D1B]">
          {/* Multi-Tab Bar with Refresh & Close Icons */}
          <TabBar />

          {/* Main Content Area with Dashboard Background Image & Overlay */}
          <main
            className="flex-1 overflow-y-auto p-4 sm:p-6 relative bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/Image/Dashboard Background.jpg')",
              backgroundColor: '#100D1B', // Solid fallback
            }}
          >
            {/* Dark Overlay ensuring high readability and WCAG AA contrast */}
            <div className="absolute inset-0 bg-[#100D1B]/85 backdrop-blur-xs pointer-events-none" />

            {/* Tab Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto">
              {renderTabView()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

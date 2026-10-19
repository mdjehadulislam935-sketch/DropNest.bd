import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileBarChart,
  Globe2,
  KeyRound,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Truck,
  UserCheck,
  Users,
  Video,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTabs } from '../../context/TabContext.tsx';

interface SuperAdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { openTab, activeTabId, tabs } = useTabs();

  // Collapsible parent sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    business: true,
    account: true,
    apis: true,
    courier: false,
    orderTracker: false,
    sms: false,
    userMgmt: false,
    loginSecurity: false,
    financial: true,
    analytics: false,
    customer: false,
    reports: false,
    security: false,
    emailBox: false,
  });

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleOpenModule = (id: string, title: string, viewId: string, submodule?: string) => {
    openTab({
      id,
      title,
      viewId,
      submodule,
      isClosable: viewId !== 'dashboard',
    });
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 w-72 bg-[#0D0A17] border-r border-[#302741] flex flex-col z-50 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Super Admin Sovereign Banner */}
        <div className="p-3.5 border-b border-[#302741] bg-[#100D1B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#EC4899]/15 border border-[#EC4899]/30 text-[#EC4899]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#EC4899]">
                Sovereign Console
              </div>
              <h2 className="text-xs font-bold text-white">Super Admin Master Panel</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1 text-[#C9C4D6] hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
          {/* Dashboard Home */}
          <button
            type="button"
            onClick={() => handleOpenModule('superadmin-dashboard', 'Dashboard', 'dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-colors text-left ${
              activeTab?.viewId === 'dashboard'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-[#C9C4D6] hover:bg-[#171226] hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#22D3EE]" />
            <span>Dashboard Overview</span>
          </button>

          {/* 1. Business Information */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleSection('business')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#FFFFFF] font-bold hover:bg-[#171226]/80 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-[#A855F7]" />
                <span>1. Business Information</span>
              </div>
              {openSections.business ? <ChevronDown className="w-3.5 h-3.5 text-[#C9C4D6]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#C9C4D6]" />}
            </button>

            {openSections.business && (
              <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[#302741] ml-4 mt-0.5">
                <button
                  onClick={() => handleOpenModule('sa-bus-contact', 'Company Contact', 'business-info', 'contact')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  3.1 Company Update Contact Info
                </button>
                <button
                  onClick={() => handleOpenModule('sa-bus-cms', 'Homepage CMS', 'business-info', 'cms')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  3.2 Home Page Information Editor
                </button>
                <button
                  onClick={() => handleOpenModule('sa-bus-tut', 'Tutorial Videos', 'business-info', 'tutorials')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  3.3 Home Tutorial Upload Video
                </button>
                <button
                  onClick={() => handleOpenModule('sa-bus-landing', 'Landing Page', 'business-info', 'landing')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  3.4 Home Landing Page Update
                </button>
              </div>
            )}
          </div>

          {/* 2. Account */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleSection('account')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#FFFFFF] font-bold hover:bg-[#171226]/80 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4 text-[#34D399]" />
                <span>2. Account</span>
              </div>
              {openSections.account ? <ChevronDown className="w-3.5 h-3.5 text-[#C9C4D6]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#C9C4D6]" />}
            </button>

            {openSections.account && (
              <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[#302741] ml-4 mt-0.5">
                <button
                  onClick={() => handleOpenModule('sa-acc-balance', 'Balance', 'account-mgmt', 'balance')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  4.1 Balance
                </button>
                <button
                  onClick={() => handleOpenModule('sa-acc-debit', 'Debit History', 'account-mgmt', 'debit')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  4.2 Debit History
                </button>
                <button
                  onClick={() => handleOpenModule('sa-acc-credit', 'Credit History', 'account-mgmt', 'credit')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  4.3 Credit History
                </button>
                <button
                  onClick={() => handleOpenModule('sa-acc-statement', 'Statement', 'account-mgmt', 'statement')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  4.4 Statement (PDF/CSV)
                </button>
                <button
                  onClick={() => handleOpenModule('sa-acc-api', 'API Setting', 'account-mgmt', 'apis')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  4.5 API Setting
                </button>
              </div>
            )}
          </div>

          {/* 3. All API Setting */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleSection('apis')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#FFFFFF] font-bold hover:bg-[#171226]/80 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-[#22D3EE]" />
                <span>3. All API Setting</span>
              </div>
              {openSections.apis ? <ChevronDown className="w-3.5 h-3.5 text-[#C9C4D6]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#C9C4D6]" />}
            </button>

            {openSections.apis && (
              <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[#302741] ml-4 mt-0.5">
                <button
                  onClick={() => handleOpenModule('sa-api-courier', 'Courier API', 'all-api-setting', 'courier')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  5.1 Courier API
                </button>
                <button
                  onClick={() => handleOpenModule('sa-api-payment', 'Payment API', 'all-api-setting', 'payment')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  5.2 Payment API (bKash/Nagad)
                </button>
                <button
                  onClick={() => handleOpenModule('sa-api-all', 'Shop All API', 'all-api-setting', 'all')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  5.3 Shop All API List
                </button>
                <button
                  onClick={() => handleOpenModule('sa-api-sms', 'SMS API Service', 'all-api-setting', 'sms')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  5.4 SMS API Service
                </button>
                <button
                  onClick={() => handleOpenModule('sa-api-extra', 'Additional APIs', 'all-api-setting', 'extra')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  5.5 Additional API Categories
                </button>
              </div>
            )}
          </div>

          {/* 4. Courier */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleSection('courier')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#FFFFFF] font-bold hover:bg-[#171226]/80 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#FBBF24]" />
                <span>4. Courier</span>
              </div>
              {openSections.courier ? <ChevronDown className="w-3.5 h-3.5 text-[#C9C4D6]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#C9C4D6]" />}
            </button>

            {openSections.courier && (
              <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[#302741] ml-4 mt-0.5">
                <button
                  onClick={() => handleOpenModule('sa-cr-area', 'Courier Area', 'courier-mgmt', 'areas')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  6.1 Courier Area Management
                </button>
                <button
                  onClick={() => handleOpenModule('sa-cr-change', 'Courier Change', 'courier-mgmt', 'changes')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  6.2 Courier Change Management
                </button>
                <button
                  onClick={() => handleOpenModule('sa-cr-api', 'Courier API Setting', 'courier-mgmt', 'api')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  6.3 API Setting
                </button>
              </div>
            )}
          </div>

          {/* 5. Order Tracker */}
          <button
            type="button"
            onClick={() => handleOpenModule('sa-order-tracker', 'Order Tracker', 'superadmin-order-tracker')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-colors text-left ${
              activeTab?.viewId === 'superadmin-order-tracker'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-[#FFFFFF] hover:bg-[#171226]'
            }`}
          >
            <Search className="w-4 h-4 text-[#EC4899]" />
            <span>5. Order Tracker (17 Statuses)</span>
          </button>

          {/* 6. SMS Service Centres */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleSection('sms')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#FFFFFF] font-bold hover:bg-[#171226]/80 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-[#22D3EE]" />
                <span>6. SMS Service Centres</span>
              </div>
              {openSections.sms ? <ChevronDown className="w-3.5 h-3.5 text-[#C9C4D6]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#C9C4D6]" />}
            </button>

            {openSections.sms && (
              <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[#302741] ml-4 mt-0.5">
                <button
                  onClick={() => handleOpenModule('sa-sms-email', 'E-mail SMS API', 'sms-centre', 'emailsms')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  8.1 E-mail SMS API Setting
                </button>
                <button
                  onClick={() => handleOpenModule('sa-sms-mobile', 'Mobile SMS Setting', 'sms-centre', 'mobile')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  8.2 Mobile Number SMS API
                </button>
              </div>
            )}
          </div>

          {/* 7. User Management */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleSection('userMgmt')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#FFFFFF] font-bold hover:bg-[#171226]/80 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#A855F7]" />
                <span>7. User Management</span>
              </div>
              {openSections.userMgmt ? <ChevronDown className="w-3.5 h-3.5 text-[#C9C4D6]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#C9C4D6]" />}
            </button>

            {openSections.userMgmt && (
              <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[#302741] ml-4 mt-0.5">
                <button
                  onClick={() => handleOpenModule('sa-user-admin', 'Admin List', 'user-management', 'admins')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  9.1 Admin List & New Access
                </button>
                <button
                  onClick={() => handleOpenModule('sa-user-mod', 'Moderator Requests', 'user-management', 'moderators')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  9.2 Moderator List & Requests
                </button>
                <button
                  onClick={() => handleOpenModule('sa-user-mod-perm', 'Moderator Permissions', 'user-management', 'modPerms')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  9.3 Moderator Permission Matrix
                </button>
                <button
                  onClick={() => handleOpenModule('sa-user-desig', 'Custom Designations', 'user-management', 'designations')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  9.4 Custom Designation
                </button>
              </div>
            )}
          </div>

          {/* 8. User Login Security */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleSection('loginSecurity')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#FFFFFF] font-bold hover:bg-[#171226]/80 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-[#F87171]" />
                <span>8. User Login Security</span>
              </div>
              {openSections.loginSecurity ? <ChevronDown className="w-3.5 h-3.5 text-[#C9C4D6]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#C9C4D6]" />}
            </button>

            {openSections.loginSecurity && (
              <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[#302741] ml-4 mt-0.5">
                <button
                  onClick={() => handleOpenModule('sa-sec-desig-list', 'Designation Users', 'login-security', 'desig-list')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  10.1 User Designation List
                </button>
                <button
                  onClick={() => handleOpenModule('sa-sec-admin-rst', 'Admin Password Reset', 'login-security', 'admin-rst')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  10.2 Admin Password Reset
                </button>
                <button
                  onClick={() => handleOpenModule('sa-sec-mod-rst', 'Mod Password Reset', 'login-security', 'mod-rst')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  10.3 Moderator Password Reset
                </button>
                <button
                  onClick={() => handleOpenModule('sa-sec-res-rst', 'Reseller Password Reset', 'login-security', 'res-rst')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  10.4 Reseller Password Reset
                </button>
                <button
                  onClick={() => handleOpenModule('sa-sec-admin-exp', 'Admin Expiry Renewal', 'login-security', 'admin-exp')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  10.6 Admin Expiration Renewal
                </button>
                <button
                  onClick={() => handleOpenModule('sa-sec-act', 'Login Activity', 'login-security', 'activity')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  10.7 All User Login Activity
                </button>
              </div>
            )}
          </div>

          {/* 9. Financial Management */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleSection('financial')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#FFFFFF] font-bold hover:bg-[#171226]/80 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-[#34D399]" />
                <span>9. Financial Management</span>
              </div>
              {openSections.financial ? <ChevronDown className="w-3.5 h-3.5 text-[#C9C4D6]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#C9C4D6]" />}
            </button>

            {openSections.financial && (
              <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[#302741] ml-4 mt-0.5">
                <button
                  onClick={() => handleOpenModule('sa-fin-txn', 'Transactions', 'financial-mgmt', 'transactions')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  11.1 Transaction List
                </button>
                <button
                  onClick={() => handleOpenModule('sa-fin-adjust', 'Add Balance', 'financial-mgmt', 'adjust')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  11.2 Manually Add Balance
                </button>
                <button
                  onClick={() => handleOpenModule('sa-fin-withdrawals', 'Withdrawal Report', 'financial-mgmt', 'withdrawals')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  11.3 Withdrawal Report
                </button>
                <button
                  onClick={() => handleOpenModule('sa-fin-reports', 'Payment Reports', 'financial-mgmt', 'payments')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  11.4 Payment Reports
                </button>
              </div>
            )}
          </div>

          {/* 10. Analytics */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleSection('analytics')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#FFFFFF] font-bold hover:bg-[#171226]/80 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-[#22D3EE]" />
                <span>10. Analytics</span>
              </div>
              {openSections.analytics ? <ChevronDown className="w-3.5 h-3.5 text-[#C9C4D6]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#C9C4D6]" />}
            </button>

            {openSections.analytics && (
              <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[#302741] ml-4 mt-0.5">
                <button
                  onClick={() => handleOpenModule('sa-ana-sales', 'Sales Analytics', 'analytics-mgmt', 'sales')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  12.1 Total Sales
                </button>
                <button
                  onClick={() => handleOpenModule('sa-ana-orders', 'Orders Analytics', 'analytics-mgmt', 'orders')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  12.2 Total Orders
                </button>
                <button
                  onClick={() => handleOpenModule('sa-ana-cust', 'Customer Analytics', 'analytics-mgmt', 'customers')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  12.3 Total Customers
                </button>
                <button
                  onClick={() => handleOpenModule('sa-ana-perf', 'Performance Stats', 'analytics-mgmt', 'performance')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  12.4-7 Stakeholder Performance
                </button>
              </div>
            )}
          </div>

          {/* 11. Customer */}
          <button
            type="button"
            onClick={() => handleOpenModule('sa-customers', 'Customer Directory', 'customer-mgmt')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-colors text-left ${
              activeTab?.viewId === 'customer-mgmt'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-[#FFFFFF] hover:bg-[#171226]'
            }`}
          >
            <Users className="w-4 h-4 text-[#34D399]" />
            <span>11. Customer Directory</span>
          </button>

          {/* 12. Reports */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleSection('reports')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#FFFFFF] font-bold hover:bg-[#171226]/80 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileBarChart className="w-4 h-4 text-[#A855F7]" />
                <span>12. Reports</span>
              </div>
              {openSections.reports ? <ChevronDown className="w-3.5 h-3.5 text-[#C9C4D6]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#C9C4D6]" />}
            </button>

            {openSections.reports && (
              <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[#302741] ml-4 mt-0.5">
                <button
                  onClick={() => handleOpenModule('sa-rep-cash', 'Cash Report', 'reports-mgmt', 'cash')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  14.1 Cash Transaction Report
                </button>
                <button
                  onClick={() => handleOpenModule('sa-rep-reseller', 'Reseller Report', 'reports-mgmt', 'resellers')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  14.2 Reseller List Report
                </button>
                <button
                  onClick={() => handleOpenModule('sa-rep-monthly', 'Monthly Sell', 'reports-mgmt', 'monthly')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  14.3 Monthly Sell Report
                </button>
                <button
                  onClick={() => handleOpenModule('sa-rep-yearly', 'Yearly Report', 'reports-mgmt', 'yearly')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  14.4 Yearly Report (PDF/CSV)
                </button>
              </div>
            )}
          </div>

          {/* 13. Security */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleSection('security')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#FFFFFF] font-bold hover:bg-[#171226]/80 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#EC4899]" />
                <span>13. Security Console</span>
              </div>
              {openSections.security ? <ChevronDown className="w-3.5 h-3.5 text-[#C9C4D6]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#C9C4D6]" />}
            </button>

            {openSections.security && (
              <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[#302741] ml-4 mt-0.5">
                <button
                  onClick={() => handleOpenModule('sa-sec-login', 'Login Security', 'security-console', 'login')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  15.1 Login Security & Policies
                </button>
                <button
                  onClick={() => handleOpenModule('sa-sec-pwd', 'Change Password', 'security-console', 'password')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  15.2 Change Password
                </button>
                <button
                  onClick={() => handleOpenModule('sa-sec-2fa', 'Two-Factor Auth', 'security-console', '2fa')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  15.3 Two-Factor Auth (2FA)
                </button>
                <button
                  onClick={() => handleOpenModule('sa-sec-sessions', 'Active Sessions', 'security-console', 'sessions')}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-[#C9C4D6] hover:text-white hover:bg-[#171226]"
                >
                  15.4-7 Session & Device Governance
                </button>
              </div>
            )}
          </div>

          {/* 14. E-mail Box */}
          <button
            type="button"
            onClick={() => handleOpenModule('superadmin-email-box', 'E-mail Box', 'superadmin-email-box')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-colors text-left ${
              activeTab?.viewId === 'superadmin-email-box'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-[#FFFFFF] hover:bg-[#171226]'
            }`}
          >
            <Mail className="w-4 h-4 text-[#22D3EE]" />
            <span>14. E-mail Box (15 Limit / 260w)</span>
          </button>

          {/* 15. Log Out */}
          <div className="pt-2 border-t border-[#302741] mt-2">
            <button
              type="button"
              onClick={() => logout()}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold text-[#F87171] hover:bg-[#F87171]/15 text-left transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>15. Secure Log Out</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#302741] bg-[#080611] text-[11px] text-[#C9C4D6]/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
            <span>HQ Secure Channel</span>
          </div>
          <span className="font-mono text-[#22D3EE]">v1.0.0-PROD</span>
        </div>
      </aside>
    </>
  );
};

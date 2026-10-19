import React from 'react';
import {
  Activity,
  AlertOctagon,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Home,
  Layers,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Package,
  PlusCircle,
  Receipt,
  Send,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Smartphone,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTabs } from '../../context/TabContext.tsx';
import type { AdminViewModule } from '../../types/admin.ts';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: AdminViewModule;
  onSelectModule: (module: AdminViewModule, submodule?: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  activeModule,
  onSelectModule,
}) => {
  const { user, logout } = useAuth();
  const { openTab } = useTabs();

  const handleNav = (mod: AdminViewModule, submodule?: string) => {
    onSelectModule(mod, submodule);
    // Also sync with multi-tab workspace
    const titles: Record<AdminViewModule, string> = {
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
    openTab({
      id: `admin-${mod}`,
      title: titles[mod] || 'Admin Module',
      viewId: `admin-${mod}`,
      submodule,
      isClosable: mod !== 'dashboard',
    });
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const navItems = [
    {
      id: 'dashboard' as AdminViewModule,
      title: 'Dashboard',
      icon: Home,
      badge: 'Overview',
      badgeColor: 'text-[#22D3EE]',
    },
    {
      id: 'accounts' as AdminViewModule,
      title: 'Account',
      icon: Wallet,
      badge: 'Balances',
      badgeColor: 'text-[#34D399]',
      submodules: ['Balances', 'Transaction ID Approval', 'Debit & Credit History', 'Statement'],
    },
    {
      id: 'finances' as AdminViewModule,
      title: 'Financial Management',
      icon: DollarSign,
      badge: 'Payouts',
      badgeColor: 'text-[#FBBF24]',
      submodules: ['Financial Dashboard', 'Reseller Payouts', 'Supplier Settlements', 'Manual Entry'],
    },
    {
      id: 'user-approvals' as AdminViewModule,
      title: 'Approval Management',
      icon: UserCheck,
      badge: 'Pending Queue',
      badgeColor: 'text-[#F87171]',
      submodules: ['Pending Requests', 'Reseller Approvals', 'Supplier Approvals', 'Approval Audit Trail'],
    },
    {
      id: 'create-user' as AdminViewModule,
      title: 'New User Creation',
      icon: UserPlus,
      submodules: ['Create Reseller', 'Create Supplier', 'Create Staff/Moderator'],
    },
    {
      id: 'order-tracking' as AdminViewModule,
      title: 'Order Tracking',
      icon: Truck,
      badge: 'Courier Live',
      badgeColor: 'text-[#22D3EE]',
      submodules: ['Order Dashboard', 'Advanced Filter', 'Courier Integration', 'Fraud Alert'],
    },
    {
      id: 'sms-centre' as AdminViewModule,
      title: 'SMS Service Centre',
      icon: Smartphone,
      badge: '14,250 SMS',
      badgeColor: 'text-[#34D399]',
      submodules: ['SMS Dashboard', 'Automated Triggers', 'Bulk Broadcast', 'SMS History'],
    },
    {
      id: 'analytics' as AdminViewModule,
      title: 'Analytics',
      icon: BarChart3,
      submodules: ['Sales Analytics', 'Order Analytics', 'User Growth', 'Financial Trends'],
    },
    {
      id: 'reports' as AdminViewModule,
      title: 'Reports & Export',
      icon: FileSpreadsheet,
      badge: 'CSV / PDF',
      badgeColor: 'text-[#C9C4D6]',
      submodules: ['Sales Report', 'Financial Report', 'Courier Performance', 'Inventory Stock'],
    },
    {
      id: 'mailbox' as AdminViewModule,
      title: 'E-mail Box',
      icon: Mail,
      badge: 'Internal',
      badgeColor: 'text-[#A855F7]',
    },
    {
      id: 'permissions' as AdminViewModule,
      title: 'Permissions & Security',
      icon: ShieldCheck,
      badge: 'Access Control',
      badgeColor: 'text-[#34D399]',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 w-64 bg-[#0D0A17] border-r border-[#302741] flex flex-col z-50 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-[#302741] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-[#C9C4D6]/70 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
              Operational Authority
            </span>
            <span className="text-sm font-bold text-[#FFFFFF] tracking-tight mt-0.5">
              DROPNEST ADMIN PANEL
            </span>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-[#C9C4D6] hover:text-[#FFFFFF] hover:bg-[#171226]"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* User Identity Mini Banner */}
        <div className="px-4 py-3 bg-[#130E20] border-b border-[#302741] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#A855F7] font-bold text-xs">
            {user?.fullName.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user?.fullName}</div>
            <div className="text-[10px] text-[#22D3EE] font-mono truncate">
              {user?.designation || 'Operations Admin'}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <div key={item.id} className="space-y-0.5">
                <button
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#7C3AED] text-white font-semibold shadow-md shadow-[#7C3AED]/20'
                      : 'text-[#C9C4D6] hover:bg-[#171226] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#A855F7]'}`} />
                    <span className="truncate">{item.title}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : `${item.badgeColor} bg-white/5`
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Submodules list if active */}
                {isActive && item.submodules && (
                  <div className="pl-6 pr-2 py-1 space-y-1">
                    {item.submodules.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => handleNav(item.id, sub)}
                        className="w-full text-left px-2 py-1 rounded text-[11px] text-[#C9C4D6]/80 hover:text-white hover:bg-[#1C1630] transition-colors flex items-center gap-1.5"
                      >
                        <ChevronRight className="w-3 h-3 text-[#A855F7]" />
                        <span>{sub}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Super Admin Protected Barrier Indicator */}
        <div className="p-3 mx-3 mb-2 rounded-xl bg-[#171226]/80 border border-[#302741] text-[11px] text-[#C9C4D6]">
          <div className="flex items-center gap-1.5 text-[#FBBF24] font-semibold text-[10px] mb-1">
            <Lock className="w-3 h-3" />
            <span>Super Admin Reserved</span>
          </div>
          <p className="text-[10px] text-[#C9C4D6]/70 leading-relaxed">
            API Keys, DNS, and Global Security restricted to Sovereign Super Admin.
          </p>
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-[#302741]">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#F87171] hover:bg-[#F87171]/10 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out Admin Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};

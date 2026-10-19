import React from 'react';
import {
  Activity,
  Box,
  CheckSquare,
  FileText,
  Home,
  Layers,
  LogOut,
  Mail,
  MapPin,
  Package,
  PlusCircle,
  Shield,
  ShieldAlert,
  ShoppingBag,
  Store,
  Truck,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTabs } from '../../context/TabContext.tsx';
import type { UserRole } from '../../types/platform.ts';

interface SidebarItem {
  id: string;
  title: string;
  viewId: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { tabs, activeTabId, openTab } = useTabs();

  if (!user) return null;

  const getMenuItems = (role: UserRole): SidebarItem[] => {
    switch (role) {
      case 'RESELLER':
        return [
          { id: 'reseller-dashboard', title: 'Dashboard', viewId: 'dashboard', icon: Home },
          { id: 'reseller-catalog', title: 'Product Catalog', viewId: 'catalog', icon: Package },
          { id: 'reseller-create-order', title: 'Create Order', viewId: 'create-order', icon: PlusCircle },
          { id: 'reseller-orders', title: 'Order Tracking', viewId: 'orders', icon: Truck },
          { id: 'reseller-store', title: 'My Store', viewId: 'store', icon: Store },
          { id: 'reseller-mailbox', title: 'E-mail Box', viewId: 'mailbox', icon: Mail },
          { id: 'reseller-locations', title: 'BD Locations', viewId: 'locations', icon: MapPin },
        ];
      case 'SUPPLIER':
        return [
          { id: 'supplier-dashboard', title: 'Dashboard', viewId: 'dashboard', icon: Home },
          { id: 'supplier-products', title: 'Product Catalog', viewId: 'supplier-products', icon: Package },
          { id: 'supplier-submit-product', title: 'Submit Product', viewId: 'submit-product', icon: PlusCircle },
          { id: 'supplier-orders', title: 'Company Orders', viewId: 'orders', icon: ShoppingBag },
          { id: 'supplier-mailbox', title: 'E-mail Box', viewId: 'mailbox', icon: Mail },
          { id: 'supplier-profile', title: 'Business Profile', viewId: 'profile', icon: Store },
        ];
      case 'MODERATOR':
        return [
          { id: 'moderator-dashboard', title: 'Dashboard', viewId: 'dashboard', icon: Home },
          { id: 'moderator-approvals', title: 'Product Approvals', viewId: 'product-approvals', icon: CheckSquare },
          { id: 'moderator-orders', title: 'Order Tracking', viewId: 'orders', icon: Truck },
          { id: 'moderator-mailbox', title: 'E-mail Box', viewId: 'mailbox', icon: Mail },
          { id: 'moderator-audit', title: 'Audit Logs', viewId: 'audit-logs', icon: FileText },
        ];
      case 'ADMIN':
        return [
          { id: 'admin-dashboard', title: 'Dashboard', viewId: 'dashboard', icon: Home },
          { id: 'admin-products', title: 'Product Management', viewId: 'product-approvals', icon: Package },
          { id: 'admin-orders', title: 'Master Orders', viewId: 'orders', icon: Truck },
          { id: 'admin-users', title: 'Accounts Directory', viewId: 'users-directory', icon: Users },
          { id: 'admin-mailbox', title: 'E-mail Box', viewId: 'mailbox', icon: Mail },
          { id: 'admin-audit', title: 'Platform Audit Logs', viewId: 'audit-logs', icon: Shield },
        ];
      case 'SUPER_ADMIN':
      default:
        return [
          { id: 'superadmin-dashboard', title: 'Dashboard', viewId: 'dashboard', icon: Home },
          { id: 'superadmin-governance', title: 'RBAC & Security', viewId: 'governance', icon: ShieldAlert },
          { id: 'superadmin-products', title: 'Master Catalog', viewId: 'product-approvals', icon: Package },
          { id: 'superadmin-orders', title: 'Full Order Tracking', viewId: 'orders', icon: Truck },
          { id: 'superadmin-stats', title: 'System Analytics', viewId: 'platform-stats', icon: Activity },
          { id: 'superadmin-users', title: 'Accounts Directory', viewId: 'users-directory', icon: Users },
          { id: 'superadmin-mailbox', title: 'E-mail Box', viewId: 'mailbox', icon: Mail },
          { id: 'superadmin-audit', title: 'Master Audit Trail', viewId: 'audit-logs', icon: FileText },
        ];
    }
  };

  const menuItems = getMenuItems(user.role);

  const handleItemClick = (item: SidebarItem) => {
    openTab({
      id: item.id,
      title: item.title,
      viewId: item.viewId,
      isClosable: item.viewId !== 'dashboard',
    });
    // On mobile, close sidebar after clicking
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
            <span className="text-[11px] uppercase tracking-wider text-[#C9C4D6]/70 font-semibold">
              Authorized Panel
            </span>
            <span className="text-sm font-bold text-[#FFFFFF] flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
              {user.role.replace('_', ' ')} PANEL
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

        {/* Dynamic Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          <div className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-[#C9C4D6]/50 uppercase">
            Navigation Menu
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            // Check if current tab is showing this view
            const isItemActive = activeTab?.viewId === item.viewId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                  isItemActive
                    ? 'bg-[#7C3AED] text-[#FFFFFF] shadow-sm font-semibold'
                    : 'text-[#C9C4D6] hover:bg-[#171226] hover:text-[#FFFFFF]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isItemActive ? 'text-[#FFFFFF]' : 'text-[#A855F7]'
                  }`}
                />
                <span className="truncate">{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* User Account / Footer Area */}
        <div className="p-3 border-t border-[#302741] bg-[#080611]/60">
          <div className="px-2 py-1.5 rounded-lg bg-[#171226] border border-[#302741] flex items-center justify-between">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-semibold text-[#FFFFFF] truncate">
                {user.fullName}
              </span>
              <span className="text-[11px] text-[#22D3EE] font-mono tabular-nums truncate">
                {user.mobile}
              </span>
            </div>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-md text-[#C9C4D6] hover:text-[#F87171] hover:bg-[#302741]/40 transition-colors shrink-0"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  Clock,
  Globe,
  LogOut,
  Mail,
  Menu,
  Shield,
  Store,
  User,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTabs } from '../../context/TabContext.tsx';
import { DropNestLogo } from './DropNestLogo.tsx';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { openTab } = useTabs();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'text-[#EC4899] bg-[#EC4899]/10 border-[#EC4899]/30';
      case 'ADMIN':
        return 'text-[#A855F7] bg-[#A855F7]/10 border-[#A855F7]/30';
      case 'MODERATOR':
        return 'text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/30';
      case 'SUPPLIER':
        return 'text-[#FBBF24] bg-[#FBBF24]/10 border-[#FBBF24]/30';
      case 'RESELLER':
      default:
        return 'text-[#34D399] bg-[#34D399]/10 border-[#34D399]/30';
    }
  };

  return (
    <header className="w-full bg-[#080611] border-b border-[#302741] px-4 py-2.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
      {/* Left: Mobile Sidebar Toggle + Persistent DropNest Branding */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-[#C9C4D6] hover:text-[#FFFFFF] hover:bg-[#171226] border border-[#302741] transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Persistent Brand Presentation */}
        <DropNestLogo size="md" showSubtitle={true} />
      </div>

      {/* Right Controls: Role Badge, Quick Actions, Profile & Sign Out */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* View Public Website */}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="p-2 rounded-lg text-[#C9C4D6] hover:text-[#FFFFFF] hover:bg-[#171226] border border-[#302741] transition-colors"
              title="View Public DropNest Home Website"
              aria-label="View Public Website"
            >
              <Globe className="w-4 h-4 text-[#A855F7]" />
            </button>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() =>
                  openTab({
                    id: 'internal-mailbox',
                    title: 'E-mail Box',
                    viewId: 'mailbox',
                    isClosable: true,
                  })
                }
                className="relative p-2 rounded-lg text-[#C9C4D6] hover:text-[#FFFFFF] hover:bg-[#171226] border border-[#302741] transition-colors"
                title="Notifications & Alerts"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-[#FBBF24]" />
                {/* Notification Badge */}
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EC4899] opacity-75" />
                  <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-[#EC4899] text-[9px] font-bold text-white">
                    3
                  </span>
                </span>
              </button>
            </div>

            {/* Quick Access to Internal Mailbox */}
            <button
              onClick={() =>
                openTab({
                  id: 'internal-mailbox',
                  title: 'E-mail Box',
                  viewId: 'mailbox',
                  isClosable: true,
                })
              }
              className="relative p-2 rounded-lg text-[#C9C4D6] hover:text-[#FFFFFF] hover:bg-[#171226] border border-[#302741] transition-colors"
              title="Internal DropNest E-mail Box"
              aria-label="Internal E-mail Box"
            >
              <Mail className="w-4 h-4 text-[#22D3EE]" />
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full h-3.5 w-3.5 bg-[#22D3EE] text-[8px] font-bold text-[#0D0A17]">
                2
              </span>
            </button>

            {/* Role Indicator Badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getRoleBadgeStyle(user.role)}`}>
              <Shield className="w-3.5 h-3.5" />
              <span>{user.role.replace('_', ' ')}</span>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg text-[#C9C4D6] hover:text-[#FFFFFF] hover:bg-[#171226] border border-[#302741] transition-colors"
                aria-expanded={showProfileMenu}
              >
                <div className="w-7 h-7 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/50 flex items-center justify-center text-xs font-bold text-[#A855F7]">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-[#FFFFFF] max-w-[120px] truncate leading-tight">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] text-[#C9C4D6]/70 truncate leading-tight">
                    {user.mobile}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-[#171226] border border-[#302741] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setShowProfileMenu(false)}
                >
                  <div className="px-4 py-3 border-b border-[#302741]">
                    <p className="text-xs text-[#C9C4D6]/70">Signed in as</p>
                    <p className="text-sm font-semibold text-[#FFFFFF] truncate">{user.fullName}</p>
                    <p className="text-xs text-[#22D3EE] font-mono tabular-nums">{user.mobile}</p>
                    {user.businessName && (
                      <p className="text-xs text-[#A855F7] truncate mt-0.5">{user.businessName}</p>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        openTab({
                          id: 'account-profile',
                          title: 'My Profile',
                          viewId: 'profile',
                          isClosable: true,
                        });
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[#C9C4D6] hover:text-[#FFFFFF] hover:bg-[#302741]/40 flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-[#A855F7]" />
                      <span>Account Profile & Security</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        openTab({
                          id: 'internal-mailbox',
                          title: 'E-mail Box',
                          viewId: 'mailbox',
                          isClosable: true,
                        });
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[#C9C4D6] hover:text-[#FFFFFF] hover:bg-[#302741]/40 flex items-center gap-2.5 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-[#22D3EE]" />
                      <span>Internal E-mail Box</span>
                    </button>

                    {user.role === 'RESELLER' && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          openTab({
                            id: 'reseller-store',
                            title: 'My Store',
                            viewId: 'store',
                            isClosable: true,
                          });
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-[#C9C4D6] hover:text-[#FFFFFF] hover:bg-[#302741]/40 flex items-center gap-2.5 transition-colors"
                      >
                        <Store className="w-4 h-4 text-[#34D399]" />
                        <span>Reseller Store Configuration</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-[#302741]">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[#F87171] hover:bg-[#F87171]/10 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out from DropNest</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <a
            href="/login"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg transition-colors whitespace-nowrap"
          >
            Sign In
          </a>
        )}
      </div>
    </header>
  );
};

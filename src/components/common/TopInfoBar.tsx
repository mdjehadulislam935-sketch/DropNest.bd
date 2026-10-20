import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatBangladeshDateTime } from '../../utils/formatters.ts';

export const TopInfoBar: React.FC = () => {
  const { user, loginTimestamp, platformVersion } = useAuth();

  if (!user) return null;

  // STRICT REQUIREMENT: Show this bar ONLY for Moderator, Admin, and Super Admin.
  // Do NOT show to Resellers or Suppliers.
  const isPrivileged = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
  if (!isPrivileged) {
    return null;
  }

  const formattedLoginTime = loginTimestamp
    ? formatBangladeshDateTime(loginTimestamp)
    : formatBangladeshDateTime(new Date());

  return (
    <div className="w-full max-w-full bg-[#0D0A17] border-b border-[#302741] px-4 py-1.5 text-xs text-[#C9C4D6] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 overflow-x-hidden shadow-sm z-20">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mx-auto sm:mx-0 text-[11px] sm:text-xs">
        <span className="font-medium text-[#FFFFFF]">User:</span>
        <span className="text-[#A855F7] font-semibold">{user.fullName}</span>
        <span className="text-[#302741]">|</span>
        <span className="font-medium text-[#FFFFFF]">Login Date & Time:</span>
        <span className="text-[#22D3EE] font-mono tabular-nums">{formattedLoginTime}</span>
        <span className="text-[#302741]">|</span>
        <span className="font-medium text-[#FFFFFF]">Platform Version:</span>
        <span className="text-[#34D399] font-mono">{platformVersion}</span>
      </div>

      <div className="hidden lg:flex items-center gap-2 text-[11px] text-[#C9C4D6]/70">
        <span className="inline-block w-2 h-2 rounded-full bg-[#34D399]" />
        <span>Role: <strong className="text-[#FFFFFF]">{user.role}</strong></span>
      </div>
    </div>
  );
};

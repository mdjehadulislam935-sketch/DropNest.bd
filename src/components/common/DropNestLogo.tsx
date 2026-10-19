import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface DropNestLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const DropNestLogo: React.FC<DropNestLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const logoDims = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size];

  const textDims = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Logo Image with Graceful SVG Fallback */}
      <div className={`relative ${logoDims} rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-[#171226] border border-[#302741]`}>
        {!imageError ? (
          <img
            src="/image/logo.jpg"
            alt="DropNest Logo"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7C3AED] to-[#22D3EE] text-white">
            <Package className="w-4/5 h-4/5" />
          </div>
        )}
      </div>

      {/* Styled Brand Name: Drop and Nest in complementary colors */}
      <div className="flex flex-col">
        <span className={`font-bold tracking-tight ${textDims} leading-none`}>
          <span className="text-[#A855F7]">Drop</span>
          <span className="text-[#22D3EE]">Nest</span>
        </span>
        {showSubtitle && (
          <span className="text-[10px] tracking-wider text-[#C9C4D6]/70 uppercase font-medium mt-0.5">
            Bangladesh Dropshipping
          </span>
        )}
      </div>
    </div>
  );
};

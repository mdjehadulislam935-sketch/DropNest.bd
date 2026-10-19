import React, { useMemo, useState } from 'react';
import { BANGLADESH_DISTRICTS, getUpazilasForDistrict } from '../../data/bangladeshLocations.ts';
import { Search } from 'lucide-react';

interface BangladeshLocationSelectProps {
  selectedDistrict: string;
  selectedUpazila: string;
  onDistrictChange: (district: string) => void;
  onUpazilaChange: (upazila: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const BangladeshLocationSelect: React.FC<BangladeshLocationSelectProps> = ({
  selectedDistrict,
  selectedUpazila,
  onDistrictChange,
  onUpazilaChange,
  required = false,
  disabled = false,
  className = '',
}) => {
  const [districtSearch, setDistrictSearch] = useState('');
  const [upazilaSearch, setUpazilaSearch] = useState('');

  // Available Upazilas for selected district
  const availableUpazilas = useMemo(() => {
    if (!selectedDistrict) return [];
    return getUpazilasForDistrict(selectedDistrict);
  }, [selectedDistrict]);

  // Handle District Change: Must clear incompatible previously selected upazila
  const handleDistrictSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value;
    onDistrictChange(newDistrict);
    // Clear upazila on district change
    onUpazilaChange('');
  };

  const handleUpazilaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpazilaChange(e.target.value);
  };

  // Group districts by division for clean scanning
  const filteredDistricts = useMemo(() => {
    if (!districtSearch) return BANGLADESH_DISTRICTS;
    const q = districtSearch.toLowerCase();
    return BANGLADESH_DISTRICTS.filter(
      (d) => d.name.toLowerCase().includes(q) || d.division.toLowerCase().includes(q)
    );
  }, [districtSearch]);

  const filteredUpazilas = useMemo(() => {
    if (!upazilaSearch) return availableUpazilas;
    const q = upazilaSearch.toLowerCase();
    return availableUpazilas.filter((u) => u.toLowerCase().includes(q));
  }, [availableUpazilas, upazilaSearch]);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {/* District Dropdown */}
      <div>
        <label className="block text-xs font-semibold text-[#FFFFFF] mb-1">
          District <span className="text-[#A855F7]">({BANGLADESH_DISTRICTS.length} BD Districts)</span>{' '}
          {required && <span className="text-[#F87171]">*</span>}
        </label>
        <select
          value={selectedDistrict}
          onChange={handleDistrictSelect}
          disabled={disabled}
          required={required}
          className="w-full bg-[#100D1B] border border-[#302741] focus:border-[#7C3AED] rounded-lg px-3 py-2 text-xs text-[#FFFFFF] focus:outline-none transition-colors"
        >
          <option value="">-- Select Bangladesh District --</option>
          {filteredDistricts.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name} ({d.division} Division)
            </option>
          ))}
        </select>
      </div>

      {/* Upazila / Thana Dropdown */}
      <div>
        <label className="block text-xs font-semibold text-[#FFFFFF] mb-1">
          Upazila / Thana{' '}
          {selectedDistrict ? (
            <span className="text-[#22D3EE]">({availableUpazilas.length} Upazilas)</span>
          ) : (
            <span className="text-[#C9C4D6]/60">(Select District First)</span>
          )}
          {required && <span className="text-[#F87171]">*</span>}
        </label>
        <select
          value={selectedUpazila}
          onChange={handleUpazilaSelect}
          disabled={disabled || !selectedDistrict}
          required={required}
          className={`w-full bg-[#100D1B] border border-[#302741] focus:border-[#7C3AED] rounded-lg px-3 py-2 text-xs text-[#FFFFFF] focus:outline-none transition-colors ${
            !selectedDistrict ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <option value="">
            {selectedDistrict ? '-- Select Upazila --' : '-- Please choose district first --'}
          </option>
          {filteredUpazilas.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

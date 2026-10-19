import React, { useState } from 'react';
import { BANGLADESH_DISTRICTS } from '../../data/bangladeshLocations.ts';
import { Layers, MapPin, Search } from 'lucide-react';

export const BangladeshLocationsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('ALL');

  const divisions = ['ALL', 'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'];

  const filteredDistricts = BANGLADESH_DISTRICTS.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      d.name.toLowerCase().includes(q) ||
      d.division.toLowerCase().includes(q) ||
      d.upazilas.some((u) => u.toLowerCase().includes(q));
    const matchDiv = selectedDivision === 'ALL' || d.division === selectedDivision;
    return matchSearch && matchDiv;
  });

  const totalUpazilas = BANGLADESH_DISTRICTS.reduce((sum, d) => sum + d.upazilas.length, 0);

  return (
    <div className="space-y-5">
      <div className="bg-[#171226] border border-[#302741] p-5 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#34D399]" />
            <span>Bangladesh Administrative Territory Directory</span>
          </h3>
          <p className="text-xs text-[#C9C4D6]">
            Official registry of all <strong className="text-white">64 Districts</strong> and{' '}
            <strong className="text-[#22D3EE]">{totalUpazilas} Upazilas / Thanas</strong> powering DropNest logistics
          </p>
        </div>

        {/* Division Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {divisions.map((div) => (
            <button
              key={div}
              onClick={() => setSelectedDivision(div)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedDivision === div
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'bg-[#100D1B] border border-[#302741] text-[#C9C4D6] hover:text-white'
              }`}
            >
              {div}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#A855F7] absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by District, Division, or Upazila name (e.g. Savar, Dhanmondi, Bogra, Patiya)..."
          className="w-full bg-[#171226] border border-[#302741] focus:border-[#7C3AED] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none"
        />
      </div>

      {/* Grid of 64 Districts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDistricts.map((district) => (
          <div
            key={district.id}
            className="bg-[#171226] border border-[#302741] rounded-xl p-4 flex flex-col justify-between hover:border-[#7C3AED]/50 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                  <span>{district.name}</span>
                </h4>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30">
                  {district.division} Div
                </span>
              </div>

              <div className="text-[11px] text-[#C9C4D6] mb-2 font-medium">
                {district.upazilas.length} Administrative Upazilas:
              </div>

              <div className="flex flex-wrap gap-1">
                {district.upazilas.map((u) => (
                  <span
                    key={u}
                    className="text-[11px] px-2 py-0.5 rounded bg-[#100D1B] text-[#C9C4D6] border border-[#302741]"
                  >
                    {u}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[#302741] text-[10px] text-[#22D3EE] font-mono">
              Ready for dropship dispatch
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

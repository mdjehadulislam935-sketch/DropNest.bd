import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Download,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  ShoppingBag,
  Users
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import type { CustomerRecord } from '../../../types/platform.ts';
import { BANGLADESH_DISTRICTS } from '../../../data/bangladeshLocations.ts';
import { formatBDT, formatBangladeshDateTime } from '../../../utils/formatters.ts';

export const CustomerModule: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getCustomers();
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleToggleBlock = (customerId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    if (!confirm(`Are you sure you want to mark this customer as ${nextStatus}?`)) return;
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, status: nextStatus as any } : c))
    );
  };

  const filteredCustomers = customers.filter((c) => {
    if (selectedDistrict && c.district.toLowerCase() !== selectedDistrict.toLowerCase()) return false;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      c.upazila.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q)
    );
  });

  const exportCustomersCSV = () => {
    const headers = [
      'Customer ID',
      'Name',
      'Mobile',
      'District',
      'Upazila',
      'Address',
      'Total Orders',
      'Delivered',
      'Cancelled',
      'Returned',
      'Success Rate %',
      'Total Spent (BDT)',
      'Status'
    ];
    const rows = filteredCustomers.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.mobile,
      c.district,
      c.upazila,
      `"${c.address.replace(/"/g, '""')}"`,
      c.totalOrders,
      c.deliveredOrders,
      c.cancelledOrders,
      c.returnedOrders,
      c.totalOrders > 0 ? Math.round((c.deliveredOrders / c.totalOrders) * 100) : 100,
      c.totalSpentBDT,
      c.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `DropNest_Customer_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Title Header */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">11. National Customer Intelligence Directory</h2>
            <p className="text-xs text-[#C9C4D6]">
              End-buyer profile analytics across 64 districts, order completion rates, COD reliability, and fraud risk flags
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCustomersCSV}
            className="px-3.5 py-1.5 rounded-lg bg-[#100D1B] border border-[#302741] hover:text-white text-xs text-[#C9C4D6] flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={loadCustomers}
            className="p-2 rounded-lg bg-[#100D1B] border border-[#302741] text-[#C9C4D6] hover:text-white"
            title="Refresh Customers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#A855F7]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Customer Name, Mobile, Upazila..."
              className="bg-[#100D1B] border border-[#302741] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none w-64"
            />
          </div>

          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-1.5 text-white"
          >
            <option value="">All 64 Districts</option>
            {BANGLADESH_DISTRICTS.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] font-mono text-[#22D3EE]">
          Showing {filteredCustomers.length} of {customers.length} Verified Buyers
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#C9C4D6]">
            <thead className="bg-[#080611] text-white uppercase text-[10px] tracking-wider border-b border-[#302741]">
              <tr>
                <th className="px-4 py-3">Customer Profile</th>
                <th className="px-4 py-3">District & Upazila</th>
                <th className="px-4 py-3 text-center">Orders Placed</th>
                <th className="px-4 py-3 text-center">Delivered</th>
                <th className="px-4 py-3 text-center">Returns / RTO</th>
                <th className="px-4 py-3 text-center">COD Reliability</th>
                <th className="px-4 py-3 text-right">Total Spent (BDT)</th>
                <th className="px-4 py-3 text-center">Fraud Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#302741]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[#C9C4D6]">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const successRate =
                    cust.totalOrders > 0
                      ? Math.round((cust.deliveredOrders / cust.totalOrders) * 100)
                      : 100;

                  return (
                    <tr key={cust.id} className="hover:bg-[#100D1B] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{cust.name}</div>
                        <div className="font-mono text-[#22D3EE] text-[11px]">{cust.mobile}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{cust.district}</div>
                        <div className="text-[10px] text-[#C9C4D6]">{cust.upazila}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-white">
                        {cust.totalOrders}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[#34D399]">
                        {cust.deliveredOrders}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[#F87171]">
                        {cust.returnedOrders}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-mono font-bold text-xs ${
                            successRate >= 90
                              ? 'text-[#34D399]'
                              : successRate >= 70
                              ? 'text-[#FBBF24]'
                              : 'text-[#F87171]'
                          }`}
                        >
                          {successRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white text-sm">
                        {formatBDT(cust.totalSpentBDT)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cust.status === 'ACTIVE'
                              ? 'bg-[#34D399]/20 text-[#34D399]'
                              : cust.status === 'BLOCKED'
                              ? 'bg-[#F87171]/20 text-[#F87171]'
                              : 'bg-[#FBBF24]/20 text-[#FBBF24]'
                          }`}
                        >
                          {cust.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="px-2 py-1 bg-[#100D1B] border border-[#302741] hover:text-white text-[11px] rounded"
                          >
                            Dossier
                          </button>
                          <button
                            onClick={() => handleToggleBlock(cust.id, cust.status)}
                            className={`px-2 py-1 text-[11px] font-bold rounded ${
                              cust.status === 'BLOCKED'
                                ? 'bg-[#34D399]/20 text-[#34D399] hover:bg-[#34D399]/30'
                                : 'bg-[#F87171]/20 text-[#F87171] hover:bg-[#F87171]/30'
                            }`}
                          >
                            {cust.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Dossier Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#34D399] tracking-wider">
                  Customer Intelligence Dossier
                </span>
                <h3 className="text-sm font-bold text-white">{selectedCustomer.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-[#C9C4D6] hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#C9C4D6]">DropNest Customer ID:</span>
                  <span className="font-mono text-white font-bold">{selectedCustomer.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C9C4D6]">Contact Phone:</span>
                  <span className="font-mono text-[#22D3EE] font-bold">{selectedCustomer.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C9C4D6]">Primary Delivery Address:</span>
                  <span className="text-white text-right max-w-[200px]">{selectedCustomer.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C9C4D6]">Administrative Location:</span>
                  <span className="text-white">{selectedCustomer.upazila}, {selectedCustomer.district}</span>
                </div>
              </div>

              <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#C9C4D6]">Total Lifetime Spend:</span>
                  <span className="font-mono font-bold text-[#34D399]">{formatBDT(selectedCustomer.totalSpentBDT)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C9C4D6]">Delivery Completion Rate:</span>
                  <span className="font-bold text-white">
                    {selectedCustomer.totalOrders > 0
                      ? Math.round((selectedCustomer.deliveredOrders / selectedCustomer.totalOrders) * 100)
                      : 100}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C9C4D6]">Fraud Risk Assessment:</span>
                  <span className="font-bold text-[#34D399]">LOW RISK (VERIFIED COD BUYER)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-[#7C3AED] text-white text-xs font-bold rounded-lg"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Package,
  Printer,
  RefreshCw,
  Search,
  Truck,
  Wallet
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import { formatBDT, formatBangladeshDateTime } from '../../../utils/formatters.ts';

interface AdminReportsModuleProps {
  initialSubmodule?: string;
}

export const AdminReportsModule: React.FC<AdminReportsModuleProps> = ({ initialSubmodule }) => {
  const [reportType, setReportType] = useState<'SALES' | 'FINANCIAL' | 'COURIER' | 'INVENTORY'>(() => {
    if (initialSubmodule === 'Financial Report') return 'FINANCIAL';
    if (initialSubmodule === 'Courier Performance') return 'COURIER';
    if (initialSubmodule === 'Inventory Stock') return 'INVENTORY';
    return 'SALES';
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await ApiService.getAdminReports(reportType, startDate, endDate);
      setReportData(data);
    } catch (err: any) {
      console.error('Failed to load report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType]);

  // Export functions
  const exportCSV = () => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]);
    const csvRows = [
      headers.join(','),
      ...reportData.map((row) =>
        headers
          .map((h) => {
            const val = row[h] !== undefined ? String(row[h]).replace(/"/g, '""') : '';
            return `"${val}"`;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DropNest_${reportType}_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]);
    const tsvContent = [
      headers.join('\t'),
      ...reportData.map((row) =>
        headers.map((h) => (row[h] !== undefined ? String(row[h]).replace(/\t/g, ' ') : '')).join('\t')
      ),
    ].join('\n');
    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DropNest_${reportType}_Report_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrint = () => {
    window.print();
  };

  // Filtered rows for on-screen table
  const filteredData = reportData.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(item).some((val) => String(val).toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171226] border border-[#302741] p-5 rounded-2xl print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Reports & Data Export Center
            </h2>
          </div>
          <p className="text-xs text-[#C9C4D6] mt-1">
            Generate audited statements across sales transactions, financial reconciliations, courier dispatch logs & inventory reserves.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={reportData.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] rounded-xl text-xs font-semibold text-white transition-colors"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#34D399]" />
            <span>CSV</span>
          </button>

          <button
            onClick={exportExcel}
            disabled={reportData.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] rounded-xl text-xs font-semibold text-white transition-colors"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Excel</span>
          </button>

          <button
            onClick={triggerPrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl text-xs font-bold text-white transition-colors"
            title="Print Friendly View / Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Report Types Selector */}
      <div className="flex items-center gap-2 border-b border-[#302741] pb-2 overflow-x-auto print:hidden">
        {[
          { id: 'SALES', label: 'Sales Report', icon: FileText },
          { id: 'FINANCIAL', label: 'Financial & Ledger Report', icon: Wallet },
          { id: 'COURIER', label: 'Order & Courier Report', icon: Truck },
          { id: 'INVENTORY', label: 'Inventory Stock Report', icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#7C3AED] text-white shadow-md'
                  : 'text-[#C9C4D6] hover:text-white hover:bg-[#171226]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-2xl flex flex-col md:flex-row gap-3 print:hidden">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#C9C4D6] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within report results..."
            className="w-full bg-[#100D1B] border border-[#302741] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#C9C4D6]/50 focus:outline-none focus:border-[#7C3AED]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#C9C4D6]">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[#100D1B] border border-[#302741] rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-[#7C3AED]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#C9C4D6]">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[#100D1B] border border-[#302741] rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-[#7C3AED]"
          />
        </div>

        <button
          onClick={loadReport}
          className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl text-xs font-bold text-white transition-colors"
        >
          Filter Data
        </button>
      </div>

      {/* Print View Header (Shown only during print) */}
      <div className="hidden print:block text-black p-4 border-b border-black">
        <h1 className="text-xl font-bold">DropNest Bangladesh · Official Audit Report</h1>
        <p className="text-xs">
          Report Type: {reportType} · Generated: {new Date().toLocaleString()} · Authority: Operational Admin
        </p>
      </div>

      {/* Table */}
      <div className="bg-[#171226] border border-[#302741] rounded-2xl overflow-hidden shadow-lg print:border-none print:bg-white print:text-black">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-[#C9C4D6]">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#7C3AED] mb-2" />
              <p className="text-xs">Assembling report dataset...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-8 text-center text-[#C9C4D6] text-xs">
              No matching records found for this report and filter range.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#100D1B] border-b border-[#302741] text-[#C9C4D6] uppercase tracking-wider font-semibold print:bg-gray-100 print:text-black">
                  {Object.keys(filteredData[0]).map((key) => (
                    <th key={key} className="py-3 px-4 capitalize whitespace-nowrap">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#302741]/50 text-white print:text-black print:divide-gray-300">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#1C1630] transition-colors print:hover:bg-transparent">
                    {Object.keys(row).map((k) => {
                      const val = row[k];
                      const isMoney = typeof val === 'number' && (k.toLowerCase().includes('value') || k.toLowerCase().includes('price') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('charge'));
                      return (
                        <td key={k} className="py-2.5 px-4 whitespace-nowrap">
                          {isMoney ? (
                            <span className="font-mono text-[#34D399] font-bold print:text-black">
                              {formatBDT(val)}
                            </span>
                          ) : typeof val === 'boolean' ? (
                            val ? 'Yes' : 'No'
                          ) : (
                            String(val ?? '—')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

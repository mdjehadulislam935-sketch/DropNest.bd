import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building,
  CheckCircle,
  Clock,
  Download,
  Filter,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Truck
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import type { CourierAreaItem, CourierChangeRecord, OrderItem } from '../../../types/platform.ts';
import { formatBDT, formatBangladeshDateTime } from '../../../utils/formatters.ts';

interface CourierModuleProps {
  initialSubmodule?: 'areas' | 'changes' | 'api';
}

export const CourierModule: React.FC<CourierModuleProps> = ({
  initialSubmodule = 'areas',
}) => {
  const [submodule, setSubmodule] = useState<'areas' | 'changes' | 'api'>(initialSubmodule);
  const [areas, setAreas] = useState<CourierAreaItem[]>([]);
  const [changes, setChanges] = useState<CourierChangeRecord[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Change Courier Modal State
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [newCourier, setNewCourier] = useState('RedX Logistics');
  const [changeReason, setChangeReason] = useState('');
  const [changing, setChanging] = useState(false);
  const [changeMsg, setChangeMsg] = useState<string | null>(null);

  // New Area Modal State
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [areaDistrict, setAreaDistrict] = useState('Dhaka');
  const [areaUpazila, setAreaUpazila] = useState('Dhanmondi');
  const [areaName, setAreaName] = useState('');
  const [areaCharge, setAreaCharge] = useState('60');
  const [areaHours, setAreaHours] = useState('24');

  const loadData = async () => {
    setLoading(true);
    try {
      const [areaList, changeList, orderList] = await Promise.all([
        ApiService.getCourierAreas().catch(() => []),
        ApiService.getCourierChanges().catch(() => []),
        ApiService.getOrders().catch(() => []),
      ]);
      setAreas(areaList);
      setChanges(changeList);
      setOrders(orderList);
      if (orderList.length > 0 && !selectedOrderId) {
        setSelectedOrderId(orderList[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChangeCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !changeReason) return;
    setChanging(true);
    try {
      const rec = await ApiService.changeOrderCourier(selectedOrderId, newCourier, changeReason);
      setChanges([rec, ...changes]);
      setChangeMsg(`Order #${selectedOrderId} courier successfully reassigned to ${newCourier}.`);
      setShowChangeModal(false);
      setChangeReason('');
      await loadData();
      setTimeout(() => setChangeMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to change courier');
    } finally {
      setChanging(false);
    }
  };

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName) return;
    try {
      const area = await ApiService.createCourierArea({
        district: areaDistrict,
        upazila: areaUpazila,
        areaName,
        deliveryCharge: parseFloat(areaCharge) || 60,
        isCodAvailable: true,
        isServiceable: true,
        estimatedDeliveryHours: parseInt(areaHours, 10) || 24,
        availableCouriers: ['Steadfast Logistics BD', 'RedX Logistics'],
      });
      setAreas([...areas, area]);
      setShowAddAreaModal(false);
      setAreaName('');
    } catch (err: any) {
      alert(err.message || 'Failed to add area');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#FBBF24]/15 border border-[#FBBF24]/30 text-[#FBBF24]">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">4. Courier Operations & Dispatch Network</h2>
            <p className="text-xs text-[#C9C4D6]">
              Serviceable delivery coverage, order-wise courier change management, and gateway webhooks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {submodule === 'areas' && (
            <button
              onClick={() => setShowAddAreaModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Serviceable Area</span>
            </button>
          )}

          {submodule === 'changes' && (
            <button
              onClick={() => setShowChangeModal(true)}
              disabled={orders.length === 0}
              className="px-3.5 py-1.5 rounded-lg bg-[#FBBF24] hover:bg-[#F59E0B] text-black text-xs font-bold flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Reassign Order Courier</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-[#100D1B] border border-[#302741] text-[#C9C4D6] hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {changeMsg && (
        <div className="p-3 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{changeMsg}</span>
        </div>
      )}

      {/* Submodule tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#100D1B] rounded-lg border border-[#302741] w-fit">
        <button
          onClick={() => setSubmodule('areas')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'areas' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          6.1 Courier Areas ({areas.length})
        </button>
        <button
          onClick={() => setSubmodule('changes')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'changes' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          6.2 Courier Changes ({changes.length})
        </button>
        <button
          onClick={() => setSubmodule('api')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'api' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          6.3 API Credentials
        </button>
      </div>

      {/* 6.1 Courier Area Management */}
      {submodule === 'areas' && (
        <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
          <div className="p-3 bg-[#100D1B] border-b border-[#302741] flex items-center justify-between text-xs font-semibold text-white">
            <span>Bangladesh Serviceable Hub Registry</span>
            <span className="text-[#34D399] text-[11px]">Same-Day COD Pickup Active</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#C9C4D6]">
              <thead className="bg-[#080611] text-white uppercase text-[10px] tracking-wider border-b border-[#302741]">
                <tr>
                  <th className="px-4 py-3">District & Upazila</th>
                  <th className="px-4 py-3">Area Name</th>
                  <th className="px-4 py-3">Delivery Fee (BDT)</th>
                  <th className="px-4 py-3">COD Status</th>
                  <th className="px-4 py-3">Est. Delivery Time</th>
                  <th className="px-4 py-3">Supported Couriers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#302741]">
                {areas.map((area) => (
                  <tr key={area.id} className="hover:bg-[#100D1B] transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">
                      {area.district} · <span className="text-[#22D3EE]">{area.upazila}</span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{area.areaName}</td>
                    <td className="px-4 py-3 font-mono font-bold text-white tabular-nums">
                      {formatBDT(area.deliveryCharge)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-[#34D399]/20 text-[#34D399] text-[10px] font-bold">
                        COD AVAILABLE
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#22D3EE]">{area.estimatedDeliveryHours} Hours</td>
                    <td className="px-4 py-3 text-[11px] text-[#C9C4D6]">
                      {area.availableCouriers.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6.2 Courier Change Management */}
      {submodule === 'changes' && (
        <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
          <div className="p-3 bg-[#100D1B] border-b border-[#302741] flex items-center justify-between text-xs font-semibold text-white">
            <span>Order-Wise Courier Reassignment Audit Trail</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#C9C4D6]">
              <thead className="bg-[#080611] text-white uppercase text-[10px] tracking-wider border-b border-[#302741]">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Previous Courier</th>
                  <th className="px-4 py-3">New Reassigned Courier</th>
                  <th className="px-4 py-3">Reason For Change</th>
                  <th className="px-4 py-3 text-right">Changed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#302741]">
                {changes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#C9C4D6]">
                      No courier reassignment events recorded yet.
                    </td>
                  </tr>
                ) : (
                  changes.map((chg) => (
                    <tr key={chg.id} className="hover:bg-[#100D1B] transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-[#22D3EE]">
                        {formatBangladeshDateTime(chg.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-white">{chg.orderId}</td>
                      <td className="px-4 py-3 text-[#F87171] line-through">{chg.oldCourier}</td>
                      <td className="px-4 py-3 text-[#34D399] font-bold">{chg.newCourier}</td>
                      <td className="px-4 py-3 text-white max-w-xs">{chg.reason}</td>
                      <td className="px-4 py-3 text-right font-semibold text-white">{chg.changedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6.3 API Credentials */}
      {submodule === 'api' && (
        <div className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-3xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#FBBF24]">
            Courier Partner Gateways
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Steadfast Courier API', key: 'stdf_live_********************98a1', endpoint: 'https://portal.steadfast.com.bd/api/v1', status: 'ACTIVE' },
              { name: 'RedX Express API', key: 'redx_api_********************44c2', endpoint: 'https://openapi.redx.com.bd/v1.0.0', status: 'ACTIVE' },
              { name: 'Paperfly Express API', key: 'ppfly_live_********************19a7', endpoint: 'https://api.paperfly.com.bd', status: 'STANDBY' },
            ].map((c) => (
              <div key={c.name} className="p-4 bg-[#100D1B] border border-[#302741] rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{c.name}</h4>
                  <div className="text-[11px] font-mono text-[#22D3EE] mt-0.5">{c.key}</div>
                  <div className="text-[10px] text-[#C9C4D6]/70 mt-0.5">{c.endpoint}</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#34D399]/20 text-[#34D399] text-[10px] font-bold">
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reassign Courier Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Reassign Shipment Courier
            </h3>

            <form onSubmit={handleChangeCourier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Target Order</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} ({o.customerName} - {o.customerDistrict}) - Courier: {o.courierName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">New Designated Courier</label>
                <select
                  value={newCourier}
                  onChange={(e) => setNewCourier(e.target.value)}
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="Steadfast Logistics BD">Steadfast Logistics BD</option>
                  <option value="RedX Logistics">RedX Logistics</option>
                  <option value="Pathao Courier">Pathao Courier</option>
                  <option value="Paperfly Express">Paperfly Express</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Reason for Reassignment</label>
                <textarea
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Remote upazila coverage, faster 24h COD delivery route..."
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangeModal(false)}
                  className="px-4 py-2 text-xs text-[#C9C4D6] hover:bg-[#302741] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changing}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg"
                >
                  {changing ? 'Reassigning...' : 'Confirm Courier Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Area Modal */}
      {showAddAreaModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Add Serviceable Delivery Area
            </h3>

            <form onSubmit={handleAddArea} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">District</label>
                  <input
                    type="text"
                    value={areaDistrict}
                    onChange={(e) => setAreaDistrict(e.target.value)}
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Upazila / Thana</label>
                  <input
                    type="text"
                    value={areaUpazila}
                    onChange={(e) => setAreaUpazila(e.target.value)}
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Area / Ward / Neighborhood Name</label>
                <input
                  type="text"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="e.g. Uttara Sector 1 to 14"
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Delivery Charge (BDT)</label>
                  <input
                    type="number"
                    value={areaCharge}
                    onChange={(e) => setAreaCharge(e.target.value)}
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Est. Transit (Hours)</label>
                  <input
                    type="number"
                    value={areaHours}
                    onChange={(e) => setAreaHours(e.target.value)}
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAreaModal(false)}
                  className="px-4 py-2 text-xs text-[#C9C4D6] hover:bg-[#302741] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg"
                >
                  Save Delivery Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

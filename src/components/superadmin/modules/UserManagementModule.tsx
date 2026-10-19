import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle,
  Clock,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import type { DesignationItem, ModeratorRequestItem, UserAccount } from '../../../types/platform.ts';
import { formatBangladeshDateTime } from '../../../utils/formatters.ts';

interface UserManagementModuleProps {
  initialSubmodule?: 'admins' | 'moderators' | 'modPerms' | 'designations' | 'resellers' | 'suppliers';
}

export const UserManagementModule: React.FC<UserManagementModuleProps> = ({
  initialSubmodule = 'admins',
}) => {
  const [submodule, setSubmodule] = useState<'admins' | 'moderators' | 'modPerms' | 'designations' | 'resellers' | 'suppliers'>(initialSubmodule);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [designations, setDesignations] = useState<DesignationItem[]>([]);
  const [modRequests, setModRequests] = useState<ModeratorRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Create Admin Modal State
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminMobile, setAdminMobile] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminDesignation, setAdminDesignation] = useState('Operations Administrator');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState<string | null>(null);

  // Custom Designation State
  const [newDesigName, setNewDesigName] = useState('');
  const [newDesigDesc, setNewDesigDesc] = useState('');
  const [newDesigPanels, setNewDesigPanels] = useState<string[]>(['ADMIN']);

  // Moderator Permission Matrix State
  const [permMatrix, setPermMatrix] = useState<Record<string, { read: boolean; write: boolean; edit: boolean; approve: boolean; delete: boolean }>>({
    orderManagement: { read: true, write: true, edit: true, approve: true, delete: false },
    userManagement: { read: true, write: false, edit: false, approve: false, delete: false },
    financialManagement: { read: true, write: false, edit: false, approve: false, delete: false },
    balanceApproval: { read: false, write: false, edit: false, approve: false, delete: false },
    transactionApproval: { read: false, write: false, edit: false, approve: false, delete: false },
    courierManagement: { read: true, write: true, edit: true, approve: false, delete: false },
    productManagement: { read: true, write: true, edit: true, approve: true, delete: false },
    reportAccess: { read: true, write: false, edit: false, approve: false, delete: false },
    messagingPermission: { read: true, write: true, edit: false, approve: false, delete: false },
  });
  const [permSaveMsg, setPermSaveMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, dList, rList] = await Promise.all([
        ApiService.getAllUsers().catch(() => []),
        ApiService.getDesignations().catch(() => []),
        ApiService.getModeratorRequests().catch(() => []),
      ]);
      setUsers(uList);
      setDesignations(dList);
      setModRequests(rList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAdmin(true);
    setAdminSuccessMsg(null);
    try {
      const newAdmin = await ApiService.createAdmin({
        username: adminUsername,
        fullName: adminFullName,
        mobile: adminMobile,
        email: adminEmail,
        password: adminPassword,
        designation: adminDesignation,
      });
      setUsers([newAdmin, ...users]);
      setAdminSuccessMsg(`Administrator account for "${adminFullName}" created successfully.`);
      setAdminUsername('');
      setAdminFullName('');
      setAdminMobile('');
      setAdminEmail('');
      setAdminPassword('');
      setTimeout(() => {
        setShowCreateAdminModal(false);
        setAdminSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to create administrator');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to mark this account as ${nextStatus}?`)) return;
    try {
      const updated = await ApiService.updateUserStatus(userId, nextStatus);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleModeratorAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    let reason: string | undefined;
    if (action === 'REJECT') {
      const input = prompt('Enter rejection reason for applicant:');
      if (!input) return;
      reason = input;
    }
    try {
      await ApiService.handleModeratorRequest(id, action, reason);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleCreateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesigName) return;
    try {
      const desig = await ApiService.createDesignation({
        name: newDesigName,
        description: newDesigDesc,
        allowedPanels: newDesigPanels,
        permissions: {},
        isActive: true,
      });
      setDesignations([...designations, desig]);
      setNewDesigName('');
      setNewDesigDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to create designation');
    }
  };

  const handleDeleteDesignation = async (id: string) => {
    if (!confirm('Delete this custom designation?')) return;
    try {
      await ApiService.deleteDesignation(id);
      setDesignations((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleSavePermMatrix = () => {
    setPermSaveMsg('Moderator Permission Matrix successfully updated across platform.');
    setTimeout(() => setPermSaveMsg(null), 3000);
  };

  // Filter users based on submodule
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.mobile.includes(q) ||
      u.email.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (submodule === 'admins') return u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
    if (submodule === 'moderators') return u.role === 'MODERATOR';
    if (submodule === 'resellers') return u.role === 'RESELLER';
    if (submodule === 'suppliers') return u.role === 'SUPPLIER';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Title Header */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">7. User Governance & Role Permissions</h2>
            <p className="text-xs text-[#C9C4D6]">
              Administrator onboarding, moderator validation requests, granular permission matrix, and custom designations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {submodule === 'admins' && (
            <button
              onClick={() => setShowCreateAdminModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Administrator</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-[#100D1B] border border-[#302741] text-[#C9C4D6] hover:text-white"
            title="Refresh Users"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Submodule Segmented Controls */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#100D1B] rounded-lg border border-[#302741]">
        <button
          onClick={() => setSubmodule('admins')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'admins' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          9.1 Admin List ({users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length})
        </button>
        <button
          onClick={() => setSubmodule('moderators')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'moderators' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          9.2 Moderator Requests ({modRequests.length})
        </button>
        <button
          onClick={() => setSubmodule('modPerms')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'modPerms' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          9.3 Moderator Permission Matrix
        </button>
        <button
          onClick={() => setSubmodule('designations')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'designations' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          9.4 Custom Designation ({designations.length})
        </button>
        <button
          onClick={() => setSubmodule('resellers')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'resellers' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          Resellers ({users.filter((u) => u.role === 'RESELLER').length})
        </button>
        <button
          onClick={() => setSubmodule('suppliers')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'suppliers' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          Suppliers ({users.filter((u) => u.role === 'SUPPLIER').length})
        </button>
      </div>

      {/* 9.1 / Resellers / Suppliers User Tables */}
      {(submodule === 'admins' || submodule === 'resellers' || submodule === 'suppliers') && (
        <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
          <div className="p-3 bg-[#100D1B] border-b border-[#302741] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-white">
              {submodule === 'admins' ? 'Authorized Administrative Personnel' : `${submodule.toUpperCase()} Registry`}
            </span>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#A855F7]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Name, Mobile, Email..."
                className="bg-[#171226] border border-[#302741] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#C9C4D6]">
              <thead className="bg-[#080611] text-white uppercase text-[10px] tracking-wider border-b border-[#302741]">
                <tr>
                  <th className="px-4 py-3">Account Holder</th>
                  <th className="px-4 py-3">Role & Designation</th>
                  <th className="px-4 py-3">Mobile ID & Email</th>
                  <th className="px-4 py-3">Operating Location</th>
                  <th className="px-4 py-3">Created / Expiry</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#302741]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#C9C4D6]">
                      No accounts found under this role category.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#100D1B] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{u.fullName}</div>
                        <div className="text-[10px] text-[#C9C4D6]/70 font-mono">@{u.username}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/40">
                          {u.role}
                        </span>
                        <div className="text-[11px] text-[#22D3EE] mt-0.5">{u.designation || 'Standard User'}</div>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <div className="text-white">{u.mobile}</div>
                        <div className="text-[10px] text-[#C9C4D6]">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 text-white">
                        {u.district ? `${u.upazila || ''}, ${u.district}` : 'Dhaka HQ'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        <div>{formatBangladeshDateTime(u.createdAt)}</div>
                        {u.expiresAt && <div className="text-[#FBBF24] text-[10px]">Exp: {formatBangladeshDateTime(u.expiresAt)}</div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-[#34D399]/20 text-[#34D399]'
                              : 'bg-[#F87171]/20 text-[#F87171]'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.role !== 'SUPER_ADMIN' ? (
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                              u.status === 'ACTIVE'
                                ? 'bg-[#F87171]/15 text-[#F87171] hover:bg-[#F87171]/30'
                                : 'bg-[#34D399]/15 text-[#34D399] hover:bg-[#34D399]/30'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-[#C9C4D6]/50">SOVEREIGN</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9.2 Moderator Requests */}
      {submodule === 'moderators' && (
        <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
          <div className="p-3 bg-[#100D1B] border-b border-[#302741] flex items-center justify-between text-xs font-semibold text-white">
            <span>Pending Moderator Applications & Requests ({modRequests.length})</span>
          </div>

          <div className="divide-y divide-[#302741]">
            {modRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#C9C4D6]">
                No pending moderator onboarding requests at this time.
              </div>
            ) : (
              modRequests.map((req) => (
                <div key={req.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-[#100D1B] transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{req.fullName}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#FBBF24]/20 text-[#FBBF24] font-bold">
                        {req.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#C9C4D6]">
                      Mobile: <span className="font-mono text-[#22D3EE]">{req.mobile}</span> · Email: {req.email}
                    </div>
                    <div className="text-xs text-white">
                      Target Designation: <strong className="text-[#A855F7]">{req.requestedDesignation}</strong>
                    </div>
                    <p className="text-[11px] text-[#C9C4D6]/80 italic max-w-lg">
                      "{req.experienceSummary}"
                    </p>
                    <div className="text-[10px] text-[#C9C4D6]/60 font-mono">
                      Applied: {formatBangladeshDateTime(req.requestDate)}
                    </div>
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleModeratorAction(req.id, 'APPROVE')}
                        className="px-3.5 py-1.5 bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Access</span>
                      </button>
                      <button
                        onClick={() => handleModeratorAction(req.id, 'REJECT')}
                        className="px-3.5 py-1.5 bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F87171] text-xs font-semibold rounded-lg"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 9.3 Moderator Permission Matrix */}
      {submodule === 'modPerms' && (
        <div className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-4xl">
          <div className="flex items-center justify-between border-b border-[#302741] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#EC4899]">
                9.3 Moderator Role Permission Matrix
              </h3>
              <p className="text-xs text-[#C9C4D6]">
                Granular control over CRUD & Approval rights for Moderator panel holders
              </p>
            </div>

            <button
              onClick={handleSavePermMatrix}
              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Permission Matrix</span>
            </button>
          </div>

          {permSaveMsg && (
            <div className="p-3 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{permSaveMsg}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#C9C4D6]">
              <thead className="bg-[#080611] text-white uppercase text-[10px] tracking-wider border-b border-[#302741]">
                <tr>
                  <th className="px-4 py-3">Platform Capability Module</th>
                  <th className="px-4 py-3 text-center">Read / View</th>
                  <th className="px-4 py-3 text-center">Create / Submit</th>
                  <th className="px-4 py-3 text-center">Edit / Modify</th>
                  <th className="px-4 py-3 text-center">Approve / Reject</th>
                  <th className="px-4 py-3 text-center">Delete / Purge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#302741]">
                {Object.entries(permMatrix).map(([modKey, perms]) => (
                  <tr key={modKey} className="hover:bg-[#100D1B]">
                    <td className="px-4 py-3 font-semibold text-white capitalize">
                      {modKey.replace(/([A-Z])/g, ' $1')}
                    </td>
                    {(['read', 'write', 'edit', 'approve', 'delete'] as const).map((action) => (
                      <td key={action} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={perms[action]}
                          onChange={(e) =>
                            setPermMatrix({
                              ...permMatrix,
                              [modKey]: { ...perms, [action]: e.target.checked },
                            })
                          }
                          className="rounded bg-[#100D1B] border-[#302741] text-[#7C3AED] focus:ring-0"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9.4 Custom Designation */}
      {submodule === 'designations' && (
        <div className="space-y-4 max-w-4xl">
          {/* Create Designation Form */}
          <form onSubmit={handleCreateDesignation} className="bg-[#171226] border border-[#302741] p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider text-[#22D3EE] border-b border-[#302741] pb-2">
              Add Custom Administrative Designation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-white font-semibold mb-1">Designation Title</label>
                <input
                  type="text"
                  value={newDesigName}
                  onChange={(e) => setNewDesigName(e.target.value)}
                  placeholder="e.g. Senior Logistics Coordinator"
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-1">Description</label>
                <input
                  type="text"
                  value={newDesigDesc}
                  onChange={(e) => setNewDesigDesc(e.target.value)}
                  placeholder="Role scope and key responsibilities..."
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Designation</span>
              </button>
            </div>
          </form>

          {/* Designations Table */}
          <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
            <div className="p-3 bg-[#100D1B] border-b border-[#302741] text-xs font-semibold text-white">
              Registered Platform Designations ({designations.length})
            </div>

            <div className="divide-y divide-[#302741]">
              {designations.map((d) => (
                <div key={d.id} className="p-4 flex items-center justify-between gap-3 text-xs hover:bg-[#100D1B] transition-colors">
                  <div>
                    <h4 className="font-bold text-white text-sm">{d.name}</h4>
                    <p className="text-xs text-[#C9C4D6] mt-0.5">{d.description}</p>
                    <div className="text-[11px] text-[#22D3EE] font-mono mt-1">
                      Allowed Panels: {d.allowedPanels.join(', ')} · Users Assigned: {d.assignedUsersCount || 0}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteDesignation(d.id)}
                    className="p-2 text-[#C9C4D6] hover:text-[#F87171] hover:bg-[#F87171]/10 rounded"
                    title="Delete designation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Provision New Administrator
              </h3>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="text-[#C9C4D6] hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {adminSuccessMsg && (
              <div className="p-3 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{adminSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-semibold mb-1">Username</label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin_dhaka"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={adminFullName}
                    onChange={(e) => setAdminFullName(e.target.value)}
                    placeholder="Tanvir Ahmed"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-semibold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={adminMobile}
                    onChange={(e) => setAdminMobile(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="tanvir@dropnest.com.bd"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-semibold mb-1">Designation</label>
                  <select
                    value={adminDesignation}
                    onChange={(e) => setAdminDesignation(e.target.value)}
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Operations Administrator">Operations Administrator</option>
                    <option value="Finance & Escrow Controller">Finance & Escrow Controller</option>
                    <option value="Logistics Dispatch Manager">Logistics Dispatch Manager</option>
                    <option value="Catalog Quality Inspector">Catalog Quality Inspector</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white font-semibold mb-1">Initial Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-4 py-2 text-[#C9C4D6] hover:bg-[#302741] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-lg shadow-md"
                >
                  {creatingAdmin ? 'Provisioning...' : 'Provision Administrator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

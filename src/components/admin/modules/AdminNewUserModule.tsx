import React, { useState } from 'react';
import {
  AlertOctagon,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  Smartphone,
  Store,
  UserCheck,
  UserPlus,
  Users,
  Wallet
} from 'lucide-react';
import { BANGLADESH_DISTRICTS, getUpazilasForDistrict } from '../../../data/bangladeshLocations.ts';
import { ApiService } from '../../../services/api.ts';
import type { UserAccount, UserRole } from '../../../types/platform.ts';

interface AdminNewUserModuleProps {
  initialSubmodule?: string;
}

export const AdminNewUserModule: React.FC<AdminNewUserModuleProps> = ({ initialSubmodule }) => {
  const [selectedRole, setSelectedRole] = useState<'RESELLER' | 'SUPPLIER' | 'MODERATOR'>(() => {
    if (initialSubmodule === 'Create Supplier') return 'SUPPLIER';
    if (initialSubmodule === 'Create Staff/Moderator') return 'MODERATOR';
    return 'RESELLER';
  });

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('User@DropNest2026');
  const [showPassword, setShowPassword] = useState(false);
  const [designation, setDesignation] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [businessName, setBusinessName] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Dhaka');
  const [selectedUpazila, setSelectedUpazila] = useState('Gulshan');
  const [address, setAddress] = useState('');
  const [sendWelcomeSms, setSendWelcomeSms] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdUserResult, setCreatedUserResult] = useState<{ user: UserAccount; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableUpazilas = getUpazilasForDistrict(selectedDistrict);

  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    const upazilas = getUpazilasForDistrict(dist);
    setSelectedUpazila(upazilas[0] || '');
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'DN@';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatedUserResult(null);

    // Security Guard: Admin CANNOT create Super Admin!
    if ((selectedRole as string) === 'SUPER_ADMIN') {
      setError('Security Violation: Administrative staff are strictly barred from provisioning Super Admin sovereign accounts.');
      return;
    }

    if (!fullName || !username || !mobile || !email || !password) {
      setError('Please fill out all required account fields.');
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 11) {
      setError('Please enter a valid 11-digit Bangladeshi mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await ApiService.adminCreateUser({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: selectedRole,
        designation: designation || (selectedRole === 'RESELLER' ? 'Verified Reseller Merchant' : selectedRole === 'SUPPLIER' ? 'Wholesale Partner' : 'Platform Staff'),
        initialBalance: Number(initialBalance) || 0,
        district: selectedDistrict,
        upazila: selectedUpazila,
        address: address.trim(),
        businessName: businessName.trim() || `${fullName}'s Store`,
      });

      setCreatedUserResult(res);
      // Reset form
      setFullName('');
      setUsername('');
      setMobile('');
      setEmail('');
      setBusinessName('');
      setAddress('');
      setInitialBalance('0');
    } catch (err: any) {
      setError(err.message || 'Failed to provision account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Strict Security Warning */}
      <div className="bg-[#171226] border border-[#302741] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30">
              USER PROVISIONING ENGINE
            </span>
            <span className="text-xs text-[#34D399] font-mono">Immediate Live Database Access</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Provision New Merchant or Staff Account
          </h2>
          <p className="text-xs text-[#C9C4D6]">
            Create verified Reseller, Supplier, or Moderator accounts with initial balance allocations and auto-generated credentials.
          </p>
        </div>

        {/* Security Wall Badge */}
        <div className="px-3 py-2 bg-[#100D1B] border border-[#F87171]/40 rounded-xl flex items-center gap-2 text-xs text-[#F87171] shrink-0">
          <Lock className="w-4 h-4 shrink-0" />
          <span className="font-semibold text-[11px]">Super Admin Creation Restricted</span>
        </div>
      </div>

      {/* Success Notification */}
      {createdUserResult && (
        <div className="p-4 bg-[#34D399]/10 border border-[#34D399]/40 rounded-2xl space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-[#34D399]">
            <CheckCircle2 className="w-4 h-4" />
            <span>{createdUserResult.message}</span>
          </div>
          <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-[#C9C4D6]/70">Full Name:</span>
              <div className="font-bold text-white">{createdUserResult.user.fullName}</div>
            </div>
            <div>
              <span className="text-[#C9C4D6]/70">Username:</span>
              <div className="font-mono text-[#22D3EE]">{createdUserResult.user.username}</div>
            </div>
            <div>
              <span className="text-[#C9C4D6]/70">Mobile ID:</span>
              <div className="font-mono text-white">{createdUserResult.user.mobile}</div>
            </div>
            <div>
              <span className="text-[#C9C4D6]/70">Assigned Role:</span>
              <div className="font-bold text-[#A855F7]">{createdUserResult.user.role}</div>
            </div>
          </div>
          <p className="text-[10px] text-[#C9C4D6] leading-relaxed">
            Welcome credentials have been logged to the SMS Service Centre queue for automatic delivery to <strong className="text-white">{createdUserResult.user.mobile}</strong>.
          </p>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 bg-[#F87171]/10 border border-[#F87171]/40 rounded-2xl flex items-center gap-2 text-xs font-semibold text-[#F87171]">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-[#171226] border border-[#302741] p-6 rounded-2xl shadow-xl max-w-3xl mx-auto space-y-6">
        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-white mb-2">Select Account Role to Provision</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole('RESELLER')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedRole === 'RESELLER'
                  ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-white shadow-md'
                  : 'bg-[#100D1B] border-[#302741] text-[#C9C4D6] hover:text-white'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-[#7C3AED]/30 text-[#A855F7] flex items-center justify-center mb-1">
                <Store className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold">Reseller Account</div>
                <div className="text-[10px] text-[#C9C4D6]/70">Store merchant with COD ordering</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('SUPPLIER')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedRole === 'SUPPLIER'
                  ? 'bg-[#22D3EE]/20 border-[#22D3EE] text-white shadow-md'
                  : 'bg-[#100D1B] border-[#302741] text-[#C9C4D6] hover:text-white'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-[#22D3EE]/30 text-[#22D3EE] flex items-center justify-center mb-1">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold">Supplier Account</div>
                <div className="text-[10px] text-[#C9C4D6]/70">Wholesale manufacturer inventory</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('MODERATOR')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedRole === 'MODERATOR'
                  ? 'bg-[#34D399]/20 border-[#34D399] text-white shadow-md'
                  : 'bg-[#100D1B] border-[#302741] text-[#C9C4D6] hover:text-white'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-[#34D399]/30 text-[#34D399] flex items-center justify-center mb-1">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold">Staff / Moderator</div>
                <div className="text-[10px] text-[#C9C4D6]/70">Compliance & catalog review</div>
              </div>
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mahbubur Rahman"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Unique Username *</label>
              <input
                type="text"
                required
                placeholder="e.g. mahbub_seller"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">Mobile Number (Login ID) *</label>
              <input
                type="tel"
                required
                placeholder="017XXXXXXXX"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Official Email Address *</label>
              <input
                type="email"
                required
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-white">Temporary Password *</label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[10px] text-[#A855F7] hover:underline"
                >
                  Generate Strong
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#7C3AED]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#C9C4D6] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Initial Account Balance (BDT ৳)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Business / Store Entity Name
              </label>
              <input
                type="text"
                placeholder="e.g. Dhaka Gadget House"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Designation / Job Title
              </label>
              <input
                type="text"
                placeholder={selectedRole === 'MODERATOR' ? 'Catalog Reviewer' : 'Proprietor'}
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>
          </div>

          {/* Bangladesh Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">Operating District *</label>
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              >
                {BANGLADESH_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.division})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Upazila / Thana *</label>
              <select
                value={selectedUpazila}
                onChange={(e) => setSelectedUpazila(e.target.value)}
                className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              >
                {availableUpazilas.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">Physical Dispatch / Office Address</label>
            <input
              type="text"
              placeholder="e.g. Level 3, House 42, Road 11, Gulshan-2, Dhaka"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          {/* Auto Welcome SMS Dispatch Checkbox */}
          <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#22D3EE]" />
              <div className="text-xs">
                <span className="font-semibold text-white">Transmit Welcome SMS with Login Credentials</span>
                <span className="text-[10px] text-[#C9C4D6] block">
                  Automatically dispatches username and password to recipient's mobile number via Greenweb Gateway.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendWelcomeSms}
              onChange={(e) => setSendWelcomeSms(e.target.checked)}
              className="w-4 h-4 text-[#7C3AED] rounded border-[#302741] focus:ring-0"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#7C3AED]/20 flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>Provision {selectedRole} Account Now</span>
          </button>
        </form>
      </div>
    </div>
  );
};

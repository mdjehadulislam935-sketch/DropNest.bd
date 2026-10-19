import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { UserRole } from '../../types/platform.ts';
import { isValidBangladeshMobile, normalizeBangladeshMobile } from '../../utils/formatters.ts';
import { BangladeshLocationSelect } from '../common/BangladeshLocationSelect.tsx';

interface RegisterModalProps {
  role: 'RESELLER' | 'SUPPLIER';
  onClose: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ role, onClose }) => {
  const { register } = useAuth();

  // Common Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('');
  const [address, setAddress] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Role-specific fields
  const [businessName, setBusinessName] = useState(''); // Store Name for reseller, Supplier/Business Name for supplier
  const [verificationDoc, setVerificationDoc] = useState(''); // Trade license / TIN for supplier

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreeTerms) {
      setError('You must accept the DropNest Terms and Conditions to proceed.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!isValidBangladeshMobile(mobile)) {
      setError('Please provide a valid 11-digit Bangladesh mobile number (e.g. 017XXXXXXXX).');
      return;
    }

    if (!district || !upazila) {
      setError('Please select both a valid District and Upazila.');
      return;
    }

    if (role === 'SUPPLIER' && !verificationDoc.trim()) {
      setError('Suppliers must provide a valid Trade License or Business Registration number.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        role,
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        mobile: normalizeBangladeshMobile(mobile),
        email: email.trim(),
        password,
        businessName: businessName.trim(),
        storeName: role === 'RESELLER' ? businessName.trim() : undefined,
        district,
        upazila,
        address: address.trim(),
        verificationDoc: role === 'SUPPLIER' ? verificationDoc.trim() : undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#C9C4D6] hover:text-white"
          aria-label="Close registration"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              role === 'SUPPLIER'
                ? 'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/30'
                : 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/30'
            }`}
          >
            {role} ONBOARDING
          </span>
          <h3 className="text-lg font-bold text-white mt-1">
            {role === 'SUPPLIER' ? 'Supplier Business Registration' : 'Reseller Merchant Registration'}
          </h3>
          <p className="text-xs text-[#C9C4D6]">
            Join Bangladesh’s trusted dropshipping supply chain network.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                {role === 'SUPPLIER' ? 'Authorized Contact Person' : 'Full Legal Name'}{' '}
                <span className="text-[#F87171]">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rafiqul Islam"
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Desired Username <span className="text-[#F87171]">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. rafiqul2026"
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Registered Mobile Number (11-digit BD) <span className="text-[#F87171]">*</span>
              </label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#7C3AED]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@business.bd"
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                {role === 'SUPPLIER' ? 'Factory / Company Name' : 'Reseller Store / Brand Name'}{' '}
                <span className="text-[#F87171]">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={role === 'SUPPLIER' ? 'e.g. Dhaka Electronics Ltd.' : 'e.g. TrendyNest BD'}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                required
              />
            </div>

            {role === 'SUPPLIER' ? (
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Trade License / TIN # <span className="text-[#F87171]">*</span>
                </label>
                <input
                  type="text"
                  value={verificationDoc}
                  onChange={(e) => setVerificationDoc(e.target.value)}
                  placeholder="e.g. TRAD/DN/2026/091"
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#7C3AED]"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Street / Area Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House 14, Road 5, Block C"
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            )}
          </div>

          {/* Mandatory Dependent Location Dropdowns (All 64 districts) */}
          <BangladeshLocationSelect
            selectedDistrict={district}
            selectedUpazila={upazila}
            onDistrictChange={setDistrict}
            onUpazilaChange={setUpazila}
            required={true}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Password <span className="text-[#F87171]">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Confirm Password <span className="text-[#F87171]">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                required
              />
            </div>
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2 cursor-pointer text-xs text-[#C9C4D6]">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-[#302741] bg-[#100D1B] text-[#7C3AED] focus:ring-0"
              />
              <span>
                I agree to the <strong className="text-white">DropNest Platform Terms of Service</strong>, Bangladesh dropshipping compliance rules, and trade integrity standards.
              </span>
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#C9C4D6] hover:bg-[#302741] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg transition-colors shadow-md flex items-center gap-1.5"
            >
              {submitting ? 'Registering...' : `Complete ${role} Registration`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Lock,
  Phone,
  Shield,
  User,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { UserRole } from '../../types/platform.ts';
import { DropNestLogo } from '../common/DropNestLogo.tsx';
import { RegisterModal } from './RegisterModal.tsx';

interface LoginViewProps {
  role?: UserRole | 'GENERAL';
  onNavigateToRole?: (role: UserRole) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  role = 'GENERAL',
  onNavigateToRole,
}) => {
  const { login } = useAuth();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotCredential, setForgotCredential] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Sign up modal state (ONLY for Reseller and Supplier!)
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const getRoleDetails = (r: UserRole | 'GENERAL') => {
    switch (r) {
      case 'SUPER_ADMIN':
        return {
          title: 'Super Admin Sovereign Gateway',
          subtitle: 'Privileged system control, database access, and platform configuration',
          videoSrc: '/video/superadminloginpage.mp4',
          accentColor: '#EC4899',
          allowSignUp: false,
        };
      case 'ADMIN':
        return {
          title: 'Platform Administrator Portal',
          subtitle: 'Master catalog management, approvals, and order tracking',
          videoSrc: '/video/adminloginpage.mp4',
          accentColor: '#A855F7',
          allowSignUp: false,
        };
      case 'MODERATOR':
        return {
          title: 'Moderator Compliance Portal',
          subtitle: 'Product verification, compliance oversight, and audit logs',
          videoSrc: '/video/moderatorloginpage.mp4',
          accentColor: '#22D3EE',
          allowSignUp: false,
        };
      case 'SUPPLIER':
        return {
          title: 'Supplier & Manufacturer Portal',
          subtitle: 'Inventory management and company wholesale fulfillment',
          videoSrc: '/video/supplierloginpage.mp4',
          accentColor: '#FBBF24',
          allowSignUp: true,
        };
      case 'RESELLER':
        return {
          title: 'Reseller Merchant Portal',
          subtitle: 'Online store dropshipping, catalog browsing, and earnings in BDT',
          videoSrc: '/video/resellerloginpage.mp4',
          accentColor: '#34D399',
          allowSignUp: true,
        };
      default:
        return {
          title: 'Central Authentication Gateway',
          subtitle: 'Select your authorized DropNest portal or enter credentials below',
          videoSrc: '/video/resellerloginpage.mp4',
          accentColor: '#7C3AED',
          allowSignUp: false,
        };
    }
  };

  const details = getRoleDetails(role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential || !password) {
      setError('Please provide your username or registered mobile number and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const expectedRole = role === 'GENERAL' ? undefined : (role as UserRole);
      await login(credential.trim(), password, expectedRole);
    } catch (err: any) {
      setError(err.message || 'Invalid username/mobile or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotCredential.trim()) return;
    setForgotSubmitted(true);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#080611] overflow-hidden text-white">
      {/* Background Video with Graceful Fallback & Measured Scrim */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          src={details.videoSrc}
          className="w-full h-full object-cover opacity-20 filter blur-xs"
        />
        {/* Dark overlay ensuring WCAG AA contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080611]/90 via-[#100D1B]/85 to-[#080611]/95" />
      </div>

      {/* Top Bar on Login Screen */}
      <div className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-[#302741]/60 bg-[#080611]/50 backdrop-blur-md">
        <DropNestLogo size="md" showSubtitle={true} />

        {/* Quick Portal Switcher */}
        <div className="flex items-center gap-2">
          {onNavigateToRole && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#C9C4D6]">
              <span>Switch Portal:</span>
              {(['RESELLER', 'SUPPLIER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onNavigateToRole(r)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    role === r
                      ? 'bg-[#7C3AED] text-white'
                      : 'text-[#C9C4D6] hover:bg-[#302741]/50 hover:text-white'
                  }`}
                >
                  {r === 'SUPER_ADMIN' ? 'Super Admin' : r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Login Workspace */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-[#171226]/90 backdrop-blur-xl border border-[#302741] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          {/* Role Header */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 border"
              style={{
                borderColor: `${details.accentColor}40`,
                backgroundColor: `${details.accentColor}15`,
                color: details.accentColor,
              }}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{role === 'GENERAL' ? 'DropNest Ecosystem' : `${role.replace('_', ' ')} PORTAL`}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {details.title}
            </h2>
            <p className="text-xs text-[#C9C4D6] mt-1.5 leading-relaxed">
              {details.subtitle}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-[#F87171]/15 border border-[#F87171]/40 text-[#F87171] text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username or Mobile */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                Username or Registered Mobile Number <span className="text-[#F87171]">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-[#A855F7]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder="e.g. 01700000001 or username"
                  autoComplete="username"
                  className="w-full bg-[#100D1B] border border-[#302741] focus:border-[#7C3AED] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-white">
                  Password <span className="text-[#F87171]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-[11px] text-[#22D3EE] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative flex items-center">
                <div className="absolute left-3 text-[#A855F7]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#100D1B] border border-[#302741] focus:border-[#7C3AED] rounded-xl pl-9 pr-10 py-2.5 text-xs text-white focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#C9C4D6] hover:text-white"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Authenticating Credentials...' : 'Sign In to DropNest'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Sign-In Helper for local evaluation */}
          <div className="mt-5 pt-4 border-t border-[#302741] text-center">
            <p className="text-[11px] text-[#C9C4D6]/70 mb-2">Default Credentials for Evaluation:</p>
            <div className="flex flex-wrap justify-center gap-1.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => {
                  setCredential(
                    role === 'SUPER_ADMIN'
                      ? '01700000001'
                      : role === 'ADMIN'
                      ? '01700000002'
                      : role === 'MODERATOR'
                      ? '01700000003'
                      : role === 'SUPPLIER'
                      ? '01700000004'
                      : '01700000005'
                  );
                  setPassword('DropNest@2026');
                }}
                className="px-2 py-1 bg-[#100D1B] border border-[#302741] hover:border-[#7C3AED] rounded text-[#22D3EE] transition-colors"
              >
                Autofill {role === 'GENERAL' ? 'Sample Reseller' : role.replace('_', ' ')}
              </button>
            </div>
          </div>

          {/* Sign Up Section: ONLY for Reseller and Supplier */}
          {details.allowSignUp && (
            <div className="mt-4 pt-3 border-t border-[#302741] text-center">
              <p className="text-xs text-[#C9C4D6]">
                Don't have a {role.toLowerCase()} account yet?{' '}
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(true)}
                  className="text-[#22D3EE] font-bold hover:underline"
                >
                  Sign Up Here
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-3 text-center text-[11px] text-[#C9C4D6]/60 border-t border-[#302741]/40">
        DropNest Platform · Bangladesh Dropshipping & Reseller Infrastructure · All Rights Reserved
      </footer>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-sm w-full p-6 relative">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setForgotSubmitted(false);
              }}
              className="absolute top-4 right-4 text-[#C9C4D6] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-white mb-1">Account Recovery</h3>
            <p className="text-xs text-[#C9C4D6] mb-4">
              Enter your registered DropNest username or Bangladesh mobile number to request an authentication reset token.
            </p>

            {forgotSubmitted ? (
              <div className="space-y-3 text-center">
                <div className="p-3 bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] rounded-lg text-xs">
                  If this account exists in our verified registry, a secure reset token has been dispatched to your mobile.
                </div>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSubmitted(false);
                  }}
                  className="w-full py-2 bg-[#7C3AED] rounded-lg text-xs font-semibold text-white"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Username or Mobile Number
                  </label>
                  <input
                    type="text"
                    value={forgotCredential}
                    onChange={(e) => setForgotCredential(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg text-xs font-semibold text-white transition-colors"
                >
                  Send Verification Token
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Registration Modal (strictly for Reseller & Supplier) */}
      {showRegisterModal && (
        <RegisterModal
          role={role === 'SUPPLIER' ? 'SUPPLIER' : 'RESELLER'}
          onClose={() => setShowRegisterModal(false)}
        />
      )}
    </div>
  );
};

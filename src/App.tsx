import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { TabProvider } from './context/TabContext.tsx';
import type { UserRole } from './types/platform.ts';

import { LoginView } from './components/auth/LoginView.tsx';
import { DashboardLayout } from './components/layout/DashboardLayout.tsx';
import { HomePage } from './components/home/HomePage.tsx';

function MainRouter() {
  const { user, role, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  // Sync state with popstate (back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080611] flex items-center justify-center text-white text-xs font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
          <span className="text-[#C9C4D6]">Initializing DropNest Platform Kernel...</span>
        </div>
      </div>
    );
  }

  // Handle Login Routes
  const isResellerLogin = currentPath.startsWith('/reseller/login');
  const isSupplierLogin = currentPath.startsWith('/supplier/login');
  const isModeratorLogin = currentPath.startsWith('/moderator/login');
  const isAdminLogin = currentPath.startsWith('/admin/login');
  const isSuperAdminLogin = currentPath.startsWith('/superadmin/login');
  const isGeneralLogin = currentPath === '/login';

  // Handle Home Page Route (Root / or /home)
  const isHomeRoute = currentPath === '/' || currentPath === '/home';

  // If visiting Home Page, render HomePage regardless of auth state
  if (isHomeRoute) {
    const userRolePrefix = role?.toLowerCase().replace('_', '') || 'reseller';
    return (
      <HomePage
        currentUser={user}
        onNavigateToDashboard={() => navigate(`/${userRolePrefix}`)}
        onNavigateToLogin={(targetRole) => {
          if (!targetRole || targetRole === 'GENERAL') {
            navigate('/login');
            return;
          }
          const pathMap: Record<UserRole, string> = {
            RESELLER: '/reseller/login',
            SUPPLIER: '/supplier/login',
            MODERATOR: '/moderator/login',
            ADMIN: '/admin/login',
            SUPER_ADMIN: '/superadmin/login',
          };
          navigate(pathMap[targetRole] || '/login');
        }}
      />
    );
  }

  // If user is NOT logged in: check specific login routes or fallback to general login
  if (!user) {
    if (isResellerLogin) {
      return (
        <LoginView
          role="RESELLER"
          onNavigateToRole={(r) => navigate(`/${r.toLowerCase().replace('_', '')}/login`)}
        />
      );
    }
    if (isSupplierLogin) {
      return (
        <LoginView
          role="SUPPLIER"
          onNavigateToRole={(r) => navigate(`/${r.toLowerCase().replace('_', '')}/login`)}
        />
      );
    }
    if (isModeratorLogin) {
      return (
        <LoginView
          role="MODERATOR"
          onNavigateToRole={(r) => navigate(`/${r.toLowerCase().replace('_', '')}/login`)}
        />
      );
    }
    if (isAdminLogin) {
      return (
        <LoginView
          role="ADMIN"
          onNavigateToRole={(r) => navigate(`/${r.toLowerCase().replace('_', '')}/login`)}
        />
      );
    }
    if (isSuperAdminLogin) {
      return (
        <LoginView
          role="SUPER_ADMIN"
          onNavigateToRole={(r) => navigate(`/${r.toLowerCase().replace('_', '')}/login`)}
        />
      );
    }

    if (isGeneralLogin) {
      return (
        <LoginView
          role="GENERAL"
          onNavigateToRole={(r) => {
            const pathMap: Record<UserRole, string> = {
              RESELLER: '/reseller/login',
              SUPPLIER: '/supplier/login',
              MODERATOR: '/moderator/login',
              ADMIN: '/admin/login',
              SUPER_ADMIN: '/superadmin/login',
            };
            navigate(pathMap[r]);
          }}
        />
      );
    }

    // Default when visiting any unauthenticated route
    const userRolePrefix = role?.toLowerCase().replace('_', '') || 'reseller';
    return (
      <HomePage
        currentUser={null}
        onNavigateToDashboard={() => navigate(`/${userRolePrefix}`)}
        onNavigateToLogin={(targetRole) => {
          if (!targetRole || targetRole === 'GENERAL') {
            navigate('/login');
            return;
          }
          const pathMap: Record<UserRole, string> = {
            RESELLER: '/reseller/login',
            SUPPLIER: '/supplier/login',
            MODERATOR: '/moderator/login',
            ADMIN: '/admin/login',
            SUPER_ADMIN: '/superadmin/login',
          };
          navigate(pathMap[targetRole] || '/login');
        }}
      />
    );
  }

  // When Authenticated: Check for Role Protection & Unauthorized URL Hijacking
  const userRolePrefix = role?.toLowerCase().replace('_', '') || 'reseller';

  // If user navigates to an unauthorized panel URL (e.g. Reseller visits /superadmin or /admin)
  const isVisitingUnauthorizedPanel =
    (currentPath.startsWith('/superadmin') && role !== 'SUPER_ADMIN') ||
    (currentPath.startsWith('/admin') && role !== 'ADMIN' && role !== 'SUPER_ADMIN') ||
    (currentPath.startsWith('/moderator') && role !== 'MODERATOR' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') ||
    (currentPath.startsWith('/supplier') && role !== 'SUPPLIER' && role !== 'SUPER_ADMIN') ||
    (currentPath.startsWith('/reseller') && role !== 'RESELLER' && role !== 'SUPER_ADMIN');

  if (isVisitingUnauthorizedPanel) {
    return (
      <div className="min-h-screen bg-[#080611] flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-[#171226] border border-[#F87171]/40 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-[#F87171]/20 text-[#F87171] flex items-center justify-center mx-auto">
            ✕
          </div>
          <h3 className="text-base font-bold text-white">Access Denied: Insufficient Permissions</h3>
          <p className="text-xs text-[#C9C4D6] leading-relaxed">
            Your authenticated role is <strong className="text-[#A855F7]">{role}</strong>. You do not possess authorization to access this panel. This security event has been logged.
          </p>
          <button
            onClick={() => navigate(`/${userRolePrefix}`)}
            className="w-full py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-colors"
          >
            Return to Authorized {role?.replace('_', ' ')} Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <TabProvider role={role}>
      <DashboardLayout />
    </TabProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}

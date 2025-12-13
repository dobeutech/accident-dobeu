import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { socketService } from '../../lib/socket';
import { useI18n } from '../../lib/i18n';
import { ThemeSelector } from '../ui/ThemeSelector';
import { LanguageSelector } from '../ui/LanguageSelector';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Palette,
  Download,
  Truck,
} from 'lucide-react';
import { clsx } from 'clsx';

export function DashboardLayout() {
  const { user, logout, token } = useAuthStore();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('nav.reports'), href: '/reports', icon: FileText },
    { name: t('nav.users'), href: '/users', icon: Users },
    { name: t('nav.formBuilder'), href: '/form-builder', icon: Palette },
    { name: t('nav.exports'), href: '/exports', icon: Download },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  useEffect(() => {
    if (token) {
      socketService.connect(token);

      const unsubReport = socketService.subscribe('report:new', (data: any) => {
        setNotifications((prev) => [
          { id: Date.now(), type: 'new_report', ...data },
          ...prev.slice(0, 9),
        ]);
      });

      const unsubPhoto = socketService.subscribe('report:photo:new', (data: any) => {
        setNotifications((prev) => [
          { id: Date.now(), type: 'new_photo', ...data },
          ...prev.slice(0, 9),
        ]);
      });

      return () => {
        unsubReport();
        unsubPhoto();
        socketService.disconnect();
      };
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'super_admin': return t('role.superAdmin');
      case 'fleet_admin': return t('role.fleetAdmin');
      case 'fleet_manager': return t('role.fleetManager');
      case 'fleet_viewer': return t('role.fleetViewer');
      case 'driver': return t('role.driver');
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="skip-link"
        tabIndex={0}
      >
        {t('a11y.skipToContent')}
      </a>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transform transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">{t('app.name').split(' ')[0]}</span>
          </div>
          <button
            className="lg:hidden p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setSidebarOpen(false)}
            aria-label={t('a11y.closeMenu')}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1" aria-label="Sidebar navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-200'
                )
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer with theme toggle */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-slate-700">
          <ThemeSelector compact />
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6">
          <button
            className="lg:hidden p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
            aria-label={t('a11y.openMenu')}
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2 md:gap-4">
            {/* Language selector */}
            <LanguageSelector compact />

            {/* Notifications */}
            <button 
              className="relative p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Notifications ${notifications.length > 0 ? `(${notifications.length} unread)` : ''}`}
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
              )}
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">
                    {getRoleName(user?.role || '')}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-slate-400" aria-hidden="true" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.email}
                      </div>
                    </div>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      {t('nav.signOut')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="p-4 lg:p-6" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

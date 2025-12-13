import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useI18n } from '../lib/i18n';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import {
  Building2,
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  Save,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

type SettingsTab = 'fleet' | 'profile' | 'notifications' | 'security' | 'appearance';

export function SettingsPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: 'fleet' as const, name: t('settings.fleet'), icon: Building2 },
    { id: 'profile' as const, name: t('settings.profile'), icon: User },
    { id: 'notifications' as const, name: t('settings.notifications'), icon: Bell },
    { id: 'security' as const, name: t('settings.security'), icon: Shield },
    { id: 'appearance' as const, name: 'Appearance', icon: Palette },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success('Settings saved successfully');
  };

  const renderFleetSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.fleet')}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Configure your fleet's general settings
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="fleetName" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Fleet Name
          </label>
          <input
            type="text"
            id="fleetName"
            className="input mt-1"
            defaultValue={user?.fleetName || 'My Fleet'}
          />
        </div>

        <div>
          <label htmlFor="fleetCode" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Fleet Code
          </label>
          <input
            type="text"
            id="fleetCode"
            className="input mt-1"
            defaultValue="FLT-001"
            readOnly
          />
        </div>

        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Contact Email
          </label>
          <input
            type="email"
            id="contactEmail"
            className="input mt-1"
            defaultValue="admin@myfleet.com"
          />
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Timezone
          </label>
          <select id="timezone" className="input mt-1">
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.profile')}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Update your personal information
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
          <span className="text-2xl font-medium text-blue-700 dark:text-blue-300">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
        </div>
        <div>
          <button className="btn-secondary text-sm">Change Photo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            className="input mt-1"
            defaultValue={user?.firstName}
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            className="input mt-1"
            defaultValue={user?.lastName}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="input mt-1"
            defaultValue={user?.email}
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.notifications')}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Configure how you receive notifications
        </p>
      </div>

      <div className="space-y-4">
        {[
          { id: 'newReports', label: 'New report submissions', description: 'Get notified when drivers submit new reports' },
          { id: 'photoUploads', label: 'Photo uploads', description: 'Get notified when new photos are added to reports' },
          { id: 'statusChanges', label: 'Status changes', description: 'Get notified when report statuses change' },
          { id: 'weeklyDigest', label: 'Weekly digest', description: 'Receive a weekly summary of fleet activity' },
        ].map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
              <div className="text-sm text-gray-500 dark:text-slate-400">{item.description}</div>
            </div>
            <button
              role="switch"
              aria-checked="true"
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.security')}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Manage your account security
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Change Password</div>
              <div className="text-sm text-gray-500 dark:text-slate-400">Update your password regularly for security</div>
            </div>
            <button className="btn-secondary text-sm">Update</button>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</div>
              <div className="text-sm text-gray-500 dark:text-slate-400">Add an extra layer of security to your account</div>
            </div>
            <span className="badge badge-success flex items-center gap-1">
              <CheckCircle className="w-3 h-3" aria-hidden="true" />
              Enabled
            </span>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Active Sessions</div>
              <div className="text-sm text-gray-500 dark:text-slate-400">Manage devices where you're logged in</div>
            </div>
            <button className="btn-secondary text-sm">Manage</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Customize the look and feel of the application
        </p>
      </div>

      {/* Theme Selection */}
      <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
        <ThemeSelector />
      </div>

      {/* Language Selection */}
      <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
        <LanguageSelector />
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
          Select your preferred language. The interface will update immediately.
        </p>
      </div>

      {/* Accessibility */}
      <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-lg space-y-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Globe className="w-4 h-4" aria-hidden="true" />
          Accessibility
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-700 dark:text-slate-300">Reduce Motion</div>
              <div className="text-xs text-gray-500 dark:text-slate-400">Minimize animations</div>
            </div>
            <button
              role="switch"
              aria-checked="false"
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-700 dark:text-slate-300">Large Text</div>
              <div className="text-xs text-gray-500 dark:text-slate-400">Increase font size</div>
            </div>
            <button
              role="switch"
              aria-checked="false"
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'fleet':
        return renderFleetSettings();
      case 'profile':
        return renderProfileSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'appearance':
        return renderAppearanceSettings();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <p className="mt-1 text-gray-500 dark:text-slate-400">{t('settings.subtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <nav 
          className="lg:w-64 flex-shrink-0" 
          aria-label="Settings navigation"
        >
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }
                  `}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <tab.icon className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1">
          <div className="card p-6">
            {renderContent()}

            {/* Save Button - show for non-appearance tabs */}
            {activeTab !== 'appearance' && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" aria-hidden="true" />
                  )}
                  {t('settings.saveChanges')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

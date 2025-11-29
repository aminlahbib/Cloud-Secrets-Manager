import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Key, 
  User,
  Moon,
  Sun,
  Globe,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePreferences } from '../hooks/usePreferences';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'preferences';

export const SettingsPage: React.FC = () => {
  const { user, isPlatformAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const { projectView, setProjectView } = usePreferences();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'preferences' as const, label: 'Preferences', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-neutral-400 mt-1">Manage your account and application preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                  className={`
                  w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-300
                  ${isActive 
                    ? 'bg-neutral-100 dark:bg-[rgba(255,255,255,0.08)] text-neutral-900 dark:text-white' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[rgba(255,255,255,0.08)]'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card className="p-6 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-[rgba(255,255,255,0.05)]">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">Profile Settings</h2>
              
              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.displayName || user.email}
                      className="w-20 h-20 rounded-full"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                      <span className="text-3xl font-bold text-neutral-700 dark:text-neutral-300">
                        {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <Button variant="secondary" size="sm">Change Avatar</Button>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid gap-6 max-w-xl">
                  <Input
                    label="Display Name"
                    defaultValue={user?.displayName || ''}
                    placeholder="Your name"
                  />
                  
                  <Input
                    label="Email Address"
                    type="email"
                    defaultValue={user?.email || ''}
                    disabled
                    helperText="Email cannot be changed. Contact support if needed."
                  />

                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                        Account Type
                      </label>
                      <Badge variant={isPlatformAdmin ? 'danger' : 'default'}>
                        {user?.platformRole || 'USER'}
                      </Badge>
                    </div>
                    {user?.createdAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                          Member Since
                        </label>
                        <span className="text-sm text-gray-600 dark:text-neutral-400 flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-400 dark:text-neutral-500" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-[rgba(255,255,255,0.05)]">
                  <Button>Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-6 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-[rgba(255,255,255,0.05)]">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Security Settings</h2>
              
              <div className="space-y-6 max-w-xl">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="font-medium text-green-800 dark:text-green-300">Firebase Authentication</h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your account is secured with Firebase Authentication.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
                  <p className="text-gray-500 dark:text-neutral-400 text-sm mb-4">
                    Add an extra layer of security to your account by enabling 2FA.
                  </p>
                  <Button variant="secondary">
                    <Key className="h-4 w-4 mr-2" />
                    Enable 2FA
                  </Button>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-[rgba(255,255,255,0.05)]">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Active Sessions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-gray-400 dark:text-neutral-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Current Session</p>
                          <p className="text-xs text-gray-500 dark:text-neutral-400">Last active: Just now</p>
                        </div>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="p-6 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-[rgba(255,255,255,0.05)]">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">Notification Preferences</h2>
              
              <div className="space-y-6 max-w-xl">
                <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-white">Email Notifications</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive email updates about your projects</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neutral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-white">Secret Expiration Alerts</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Get notified before secrets expire</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neutral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-white">Project Invitations</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Notify when invited to new projects</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neutral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-white">Security Alerts</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Important security notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked disabled />
                    <div className="w-11 h-6 bg-neutral-900 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:translate-x-full"></div>
                  </label>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-[rgba(255,255,255,0.05)]">
                  <Button>Save Preferences</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card className="p-6 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-[rgba(255,255,255,0.05)]">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">Application Preferences</h2>
              
              <div className="space-y-6 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-2 px-4 py-2 border-2 rounded-2xl transition-colors ${
                        theme === 'light'
                          ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                          : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                      }`}
                    >
                      <Sun className="h-4 w-4" />
                      Light
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-2 px-4 py-2 border-2 rounded-2xl transition-colors ${
                        theme === 'dark'
                          ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                          : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                      }`}
                    >
                      <Moon className="h-4 w-4" />
                      Dark
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Default Project View
                  </label>
                  <select 
                    value={projectView}
                    onChange={(e) => setProjectView(e.target.value as 'grid' | 'list')}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-[rgba(255,255,255,0.05)] rounded-lg focus:ring-2 focus:ring-neutral-900 dark:focus:ring-orange-500 focus:border-neutral-900 dark:focus:border-orange-500/30 bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white transition-colors"
                  >
                    <option value="grid">Grid View</option>
                    <option value="list">List View</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Timezone
                  </label>
                  <select className="w-full px-4 py-2 border border-neutral-300 dark:border-[rgba(255,255,255,0.05)] rounded-lg focus:ring-2 focus:ring-neutral-900 dark:focus:ring-orange-500 focus:border-neutral-900 dark:focus:border-orange-500/30 bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white transition-colors">
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>America/New_York (Eastern Time)</option>
                    <option>America/Los_Angeles (Pacific Time)</option>
                    <option>Europe/London (GMT)</option>
                    <option>Europe/Paris (Central European Time)</option>
                    <option>Asia/Tokyo (Japan Standard Time)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Date Format
                  </label>
                  <select className="w-full px-4 py-2 border border-neutral-300 dark:border-[rgba(255,255,255,0.05)] rounded-lg focus:ring-2 focus:ring-neutral-900 dark:focus:ring-orange-500 focus:border-neutral-900 dark:focus:border-orange-500/30 bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white transition-colors">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="pt-6 border-t border-neutral-200 dark:border-[rgba(255,255,255,0.05)]">
                  <Button>Save Preferences</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

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
  Clock,
  Palette,
  Check
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
  const { theme, themeInfo, setTheme, availableThemes } = useTheme();
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
        <h1 className="text-h1 font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-body-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage your account and application preferences</p>
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
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-150"
                style={{
                  backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon 
                  className="w-5 h-5" 
                  style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-h3 font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Profile Settings</h2>
              
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
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--elevation-1)' }}
                    >
                      <span 
                        className="text-3xl font-bold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <Button variant="secondary" size="sm">Change Avatar</Button>
                    <p className="text-caption mt-2" style={{ color: 'var(--text-secondary)' }}>JPG, PNG or GIF. Max 2MB.</p>
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
                      <label className="block text-body-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        Account Type
                      </label>
                      <Badge variant={isPlatformAdmin ? 'owner-admin' : 'default'}>
                        {user?.platformRole || 'USER'}
                      </Badge>
                    </div>
                    {user?.createdAt && (
                      <div>
                        <label className="block text-body-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          Member Since
                        </label>
                        <span className="text-body-sm flex items-center" style={{ color: 'var(--text-secondary)' }}>
                          <Clock className="h-4 w-4 mr-1" style={{ color: 'var(--text-tertiary)' }} />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div 
                  className="pt-6 border-t"
                  style={{ borderTopColor: 'var(--border-subtle)' }}
                >
                  <Button>Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-6">
              <h2 className="text-h3 font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Security Settings</h2>
              
              <div className="space-y-6 max-w-xl">
                <div 
                  className="p-4 border rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--status-success-bg)',
                    borderColor: 'var(--status-success)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5" style={{ color: 'var(--status-success)' }} />
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--status-success)' }}>Firebase Authentication</h3>
                      <p className="text-body-sm" style={{ color: 'var(--status-success)' }}>
                        Your account is secured with Firebase Authentication.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-h3 font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication</h3>
                  <p className="text-body-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Add an extra layer of security to your account by enabling 2FA.
                  </p>
                  <Button variant="secondary">
                    <Key className="h-4 w-4 mr-2" />
                    Enable 2FA
                  </Button>
                </div>

                <div 
                  className="pt-6 border-t"
                  style={{ borderTopColor: 'var(--border-subtle)' }}
                >
                  <h3 className="text-h3 font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Active Sessions</h3>
                  <div className="space-y-3">
                    <div 
                      className="flex items-center justify-between p-3 rounded-lg transition-colors"
                      style={{ backgroundColor: 'var(--elevation-1)' }}
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
                        <div>
                          <p className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>Current Session</p>
                          <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>Last active: Just now</p>
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
            <Card className="p-6">
              <h2 className="text-h3 font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Notification Preferences</h2>
              
              <div className="space-y-6 max-w-xl">
                <div 
                  className="flex items-center justify-between py-4 border-b"
                  style={{ borderBottomColor: 'var(--border-subtle)' }}
                >
                  <div>
                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Email Notifications</h3>
                    <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Receive email updates about your projects</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div 
                  className="flex items-center justify-between py-4 border-b"
                  style={{ borderBottomColor: 'var(--border-subtle)' }}
                >
                  <div>
                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Secret Expiration Alerts</h3>
                    <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Get notified before secrets expire</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div 
                  className="flex items-center justify-between py-4 border-b"
                  style={{ borderBottomColor: 'var(--border-subtle)' }}
                >
                  <div>
                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Project Invitations</h3>
                    <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Notify when invited to new projects</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Security Alerts</h3>
                    <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Important security notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked disabled />
                    <div className="toggle-switch w-11 h-6 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:translate-x-full" style={{ backgroundColor: 'var(--accent-primary)' }}></div>
                  </label>
                </div>

                <div 
                  className="pt-6 border-t"
                  style={{ borderTopColor: 'var(--border-subtle)' }}
                >
                  <Button>Save Preferences</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Theme Selection - Compact Visual Grid */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-h3 font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Palette className="h-5 w-5" />
                      Theme
                    </h2>
                    <p className="text-body-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Choose your preferred color scheme and mode
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Current</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{themeInfo.name}</div>
                  </div>
                </div>
                
                {/* Compact theme grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableThemes.map((t) => {
                    const isActive = theme === t.id;
                    const schemeName = t.colorScheme.charAt(0).toUpperCase() + t.colorScheme.slice(1).replace(/-/g, ' ');
                    
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className="relative p-3 rounded-lg border-2 transition-all duration-200 group"
                        style={{
                          borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          backgroundColor: isActive ? 'var(--accent-primary-glow)' : 'var(--elevation-1)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = 'var(--border-default)';
                            e.currentTarget.style.backgroundColor = 'var(--elevation-2)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
                          }
                        }}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            {t.mode === 'light' ? (
                              <Sun className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                            ) : (
                              <Moon className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                            )}
                            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                              {t.mode === 'light' ? 'Light' : 'Dark'}
                            </span>
                          </div>
                          <div className="text-xs truncate w-full text-center" style={{ color: 'var(--text-tertiary)' }}>
                            {schemeName}
                          </div>
                        </div>
                        {isActive && (
                          <div 
                            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center border-2"
                            style={{ 
                              borderColor: 'var(--accent-primary)',
                              backgroundColor: 'var(--accent-primary-glow)',
                            }}
                          >
                            <Check className="h-2.5 w-2.5" style={{ color: 'var(--accent-primary)' }} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Display & View Settings */}
              <Card className="p-6">
                <h2 className="text-h3 font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Display & View</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div>
                    <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Default Project View
                    </label>
                    <select 
                      value={projectView}
                      onChange={(e) => setProjectView(e.target.value as 'grid' | 'list')}
                      className="input-theme w-full px-4 py-2"
                    >
                      <option value="grid">Grid View</option>
                      <option value="list">List View</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Date Format
                    </label>
                    <select className="input-theme w-full px-4 py-2">
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Regional Settings */}
              <Card className="p-6">
                <h2 className="text-h3 font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Regional Settings</h2>
                
                <div className="max-w-md">
                  <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Timezone
                  </label>
                  <select className="input-theme w-full px-4 py-2">
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>America/New_York (Eastern Time)</option>
                    <option>America/Los_Angeles (Pacific Time)</option>
                    <option>Europe/London (GMT)</option>
                    <option>Europe/Paris (Central European Time)</option>
                    <option>Asia/Tokyo (Japan Standard Time)</option>
                  </select>
                </div>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button>Save Preferences</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

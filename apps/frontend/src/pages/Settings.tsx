import React, { useState, useCallback } from 'react';
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
  Check,
  Mail,
  AlertTriangle,
  UserPlus,
  RotateCcw,
  Info,
  LayoutGrid,
  List
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { usePreferences } from '../hooks/usePreferences';
import { useNotifications } from '../contexts/NotificationContext';
import { firebaseAuthService } from '../services/firebase-auth';
import { preferencesService } from '../services/preferences';
import { notificationsService } from '../services/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { TwoFactorSetupModal } from '../components/twofactor/TwoFactorSetupModal';
import { TwoFactorDisableModal } from '../components/twofactor/TwoFactorDisableModal';
import { RecoveryCodesModal } from '../components/twofactor/RecoveryCodesModal';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'preferences' | 'analytics';

export const SettingsPage: React.FC = () => {
  const { user, isPlatformAdmin, isFirebaseEnabled, refreshUser } = useAuth();
  const { theme, themeInfo, setTheme, availableThemes } = useTheme();
  const { t } = useI18n();
  const { projectView, setProjectView } = usePreferences();
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  
  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  
  // 2FA modals state
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState(false);
  const [showRecoveryCodesModal, setShowRecoveryCodesModal] = useState(false);
  
  // Fetch preferences from backend
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => preferencesService.getPreferences(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Notification preferences state (initialized from backend)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [secretExpirationAlerts, setSecretExpirationAlerts] = useState(true);
  const [secretExpirationInApp, setSecretExpirationInApp] = useState(true);
  const [secretExpirationEmail, setSecretExpirationEmail] = useState(true);
  const [projectInvitations, setProjectInvitations] = useState(true);
  const [projectInvitationsInApp, setProjectInvitationsInApp] = useState(true);
  const [projectInvitationsEmail, setProjectInvitationsEmail] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [securityAlertsInApp, setSecurityAlertsInApp] = useState(true);
  const [securityAlertsEmail, setSecurityAlertsEmail] = useState(true);
  const [roleChangedInApp, setRoleChangedInApp] = useState(true);
  const [roleChangedEmail, setRoleChangedEmail] = useState(true);
  
  // Regional preferences state (initialized from backend)
  const [timezone, setTimezone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  
  // Update display name when user changes
  React.useEffect(() => {
    setDisplayName(user?.displayName || '');
  }, [user?.displayName]);
  
  // Initialize preferences from backend when loaded
  React.useEffect(() => {
    if (preferences) {
      setEmailNotifications(preferences.notifications.email ?? true);
      setSecretExpirationAlerts(preferences.notifications.secretExpiration ?? true);
      setSecretExpirationInApp(preferences.notifications.secretExpirationInApp ?? preferences.notifications.secretExpiration ?? true);
      setSecretExpirationEmail(preferences.notifications.secretExpirationEmail ?? preferences.notifications.secretExpiration ?? true);
      setProjectInvitations(preferences.notifications.projectInvitations ?? true);
      setProjectInvitationsInApp(preferences.notifications.projectInvitationsInApp ?? preferences.notifications.projectInvitations ?? true);
      setProjectInvitationsEmail(preferences.notifications.projectInvitationsEmail ?? preferences.notifications.projectInvitations ?? true);
      setSecurityAlerts(preferences.notifications.securityAlerts ?? true);
      setSecurityAlertsInApp(preferences.notifications.securityAlertsInApp ?? preferences.notifications.securityAlerts ?? true);
      setSecurityAlertsEmail(preferences.notifications.securityAlertsEmail ?? preferences.notifications.securityAlerts ?? true);
      setRoleChangedInApp(preferences.notifications.roleChangedInApp ?? true);
      setRoleChangedEmail(preferences.notifications.roleChangedEmail ?? true);
      setTimezone(preferences.timezone);
      setDateFormat(preferences.dateFormat);
    }
  }, [preferences]);

  const tabs = [
    { id: 'profile' as const, label: t('settings.profile'), icon: User },
    { id: 'security' as const, label: t('settings.security'), icon: Shield },
    { id: 'notifications' as const, label: t('settings.notifications'), icon: Bell },
    { id: 'preferences' as const, label: t('settings.preferences'), icon: SettingsIcon },
  ];

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (isFirebaseEnabled) {
        await firebaseAuthService.updateUserProfile({ displayName: displayName.trim() });
        await refreshUser();
      }
    },
    onSuccess: () => {
      showNotification({
        type: 'success',
        title: t('settings.profileUpdated'),
        message: t('settings.profileUpdatedMessage'),
      });
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Update failed',
        message: error?.message || t('settings.profileUpdateFailed'),
      });
    },
  });

  const handleSaveProfile = useCallback(async () => {
    if (!displayName.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: t('settings.displayNameEmpty'),
      });
      return;
    }

    saveProfileMutation.mutate();
  }, [displayName, showNotification, saveProfileMutation]);

  const handleChangeAvatar = useCallback(() => {
    showNotification({
      type: 'info',
      title: 'Avatar Upload - Coming Soon',
      message: 'We\'re working on secure avatar upload functionality. This feature will allow you to upload and manage your profile picture with support for JPG, PNG, and GIF formats (max 2MB). Expected in a future release.',
      duration: 6000,
    });
  }, [showNotification]);

  const handleEnable2FA = useCallback(() => {
    setShow2FASetupModal(true);
  }, []);

  const handleDisable2FA = useCallback(() => {
    setShow2FADisableModal(true);
  }, []);

  const handle2FASuccess = useCallback(async () => {
    // Refresh user data to get updated 2FA status
    await refreshUser();
    queryClient.invalidateQueries({ queryKey: ['user'] });
  }, [refreshUser, queryClient]);

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: (prefs: { notifications?: any; timezone?: string; dateFormat?: string }) => 
      preferencesService.updatePreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      showNotification({
        type: 'success',
        title: 'Preferences saved',
        message: 'Your preferences have been saved successfully',
      });
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Save failed',
        message: error?.response?.data?.message || 'Failed to save preferences. Please try again.',
      });
    },
  });

  const handleSaveNotifications = useCallback(async () => {
    savePreferencesMutation.mutate({
      notifications: {
        email: emailNotifications,
        secretExpiration: secretExpirationAlerts,
        secretExpirationInApp,
        secretExpirationEmail,
        projectInvitations,
        projectInvitationsInApp,
        projectInvitationsEmail,
        securityAlerts,
        securityAlertsInApp,
        securityAlertsEmail,
        roleChangedInApp,
        roleChangedEmail,
      },
    });
  }, [emailNotifications, secretExpirationAlerts, secretExpirationInApp, secretExpirationEmail, projectInvitations, projectInvitationsInApp, projectInvitationsEmail, securityAlerts, securityAlertsInApp, securityAlertsEmail, roleChangedInApp, roleChangedEmail, savePreferencesMutation]);

  const handleSavePreferences = useCallback(async () => {
    savePreferencesMutation.mutate({
      timezone,
      dateFormat,
    });
  }, [timezone, dateFormat, savePreferencesMutation]);

  const testNotificationMutation = useMutation({
    mutationFn: (type: string) => notificationsService.sendTestNotification(type),
    onSuccess: () => {
      showNotification({
        type: 'success',
        title: 'Test notification sent',
        message: 'Check your notifications to see the test notification',
      });
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Test failed',
        message: error?.response?.data?.message || 'Failed to send test notification',
      });
    },
  });
  

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-primary">{t('settings.title')}</h1>
        <p className="text-body-sm text-theme-secondary mt-1">{t('settings.description')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full lg:w-72 space-y-2">
          <div className="hidden lg:block mb-4">
            <p className="text-xs uppercase tracking-wider text-theme-tertiary font-medium">
              Settings
            </p>
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-150"
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
          <div className="pt-4 mt-4 border-t" style={{ borderTopColor: 'var(--border-subtle)' }}>
            <LanguageSelector compact={true} />
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-theme-primary">{t('settings.profileSettings')}</h2>
              
              <div className="space-y-6">
                {/* Avatar */}
                <div className="space-y-4">
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
                      <Button variant="secondary" size="sm" onClick={handleChangeAvatar}>{t('settings.changeAvatar')}</Button>
                      <p className="text-caption mt-2" style={{ color: 'var(--text-secondary)' }}>{t('settings.avatarRequirements')}</p>
                    </div>
                  </div>
                  <div 
                    className="p-3 rounded-lg text-xs"
                    style={{ 
                      backgroundColor: 'var(--elevation-1)', 
                      borderColor: 'var(--border-subtle)',
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                  >
                    <p className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('settings.comingSoon')}</p>
                    <ul className="space-y-1 ml-4 list-disc" style={{ color: 'var(--text-tertiary)' }}>
                      {t('settings.comingSoonFeatures').split('\n').map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid gap-6 max-w-xl">
                  <Input
                    label={t('settings.displayName')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('settings.displayNamePlaceholder')}
                  />
                  
                  <Input
                    label={t('settings.emailAddress')}
                    type="email"
                    defaultValue={user?.email || ''}
                    disabled
                    helperText={t('settings.emailCannotChange')}
                  />

                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-body-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {t('settings.accountType')}
                      </label>
                      <Badge variant={isPlatformAdmin ? 'owner-admin' : 'default'}>
                        {user?.platformRole || 'USER'}
                      </Badge>
                    </div>
                    {user?.createdAt && (
                      <div>
                        <label className="block text-body-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          {t('settings.memberSince')}
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
                  <Button onClick={handleSaveProfile} isLoading={saveProfileMutation.isPending}>{t('settings.saveChanges')}</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-theme-primary">{t('settings.securitySettings')}</h2>
              
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
                      <h3 className="font-medium" style={{ color: 'var(--status-success)' }}>{t('settings.firebaseAuth')}</h3>
                      <p className="text-body-sm" style={{ color: 'var(--status-success)' }}>
                        {t('settings.firebaseAuthDescription')}
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className="p-4 border rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--elevation-1)', 
                    borderColor: 'var(--border-subtle)' 
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-medium text-theme-primary">{t('settings.twoFactorAuth')}</h3>
                      <p className="text-body-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {user?.twoFactorEnabled 
                          ? t('settings.twoFactorEnabled')
                          : t('settings.twoFactorDisabled')}
                      </p>
                    </div>
                    {user?.twoFactorEnabled && (
                      <Badge variant="success">{t('settings.enabled')}</Badge>
                    )}
                  </div>

                  {user?.twoFactorEnabled ? (
                    <div className="space-y-3">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: 'var(--elevation-2)' }}
                      >
                        <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                          {t('settings.twoFactorDescription')}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setShowRecoveryCodesModal(true)}>
                          {t('settings.viewRecoveryCodes')}
                        </Button>
                        <Button variant="danger" onClick={handleDisable2FA}>
                          {t('settings.disable2FA')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div 
                        className="p-3 rounded-lg text-xs"
                        style={{ backgroundColor: 'var(--elevation-2)' }}
                      >
                        <p className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Features:</p>
                        <ul className="space-y-1 ml-4 list-disc" style={{ color: 'var(--text-tertiary)' }}>
                          <li>Time-based one-time passwords (TOTP) via authenticator apps</li>
                          <li>Support for Google Authenticator, Authy, 1Password, and similar apps</li>
                          <li>Backup codes for account recovery</li>
                        </ul>
                      </div>
                      <Button variant="secondary" onClick={handleEnable2FA}>
                        <Key className="h-4 w-4 mr-2" />
                        {t('settings.enable2FA')}
                      </Button>
                    </div>
                  )}
                </div>

                <div 
                  className="pt-6 border-t"
                  style={{ borderTopColor: 'var(--border-subtle)' }}
                >
                  <h3 className="text-lg font-medium mb-4 text-theme-primary">Active Sessions</h3>
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
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2 text-theme-primary">Notification Preferences</h2>
                <p className="text-body-sm text-theme-secondary">Manage how and when you receive notifications</p>
              </div>
              
              {isLoadingPreferences ? (
                <Card className="p-6">
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
                  </div>
                </Card>
              ) : (
              <div className="space-y-6 max-w-3xl">
                {/* Summary Card */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--elevation-1)' }}>
                      <Bell className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-theme-primary">Notification Summary</h3>
                      <p className="text-body-sm text-theme-secondary">Overview of your notification settings</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--elevation-1)' }}>
                      <p className="text-xs text-theme-tertiary mb-1">Email Enabled</p>
                      <p className="text-lg font-semibold text-theme-primary">{emailNotifications ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--elevation-1)' }}>
                      <p className="text-xs text-theme-tertiary mb-1">Active Types</p>
                      <p className="text-lg font-semibold text-theme-primary">
                        {[secretExpirationAlerts, projectInvitations, securityAlerts].filter(Boolean).length} / 3
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--elevation-1)' }}>
                      <p className="text-xs text-theme-tertiary mb-1">In-App</p>
                      <p className="text-lg font-semibold text-theme-primary">
                        {[secretExpirationInApp, projectInvitationsInApp, securityAlertsInApp, roleChangedInApp].filter(Boolean).length} / 4
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--elevation-1)' }}>
                      <p className="text-xs text-theme-tertiary mb-1">Email</p>
                      <p className="text-lg font-semibold text-theme-primary">
                        {[secretExpirationEmail, projectInvitationsEmail, securityAlertsEmail, roleChangedEmail].filter(Boolean).length} / 4
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Global Email Toggle */}
                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--elevation-1)' }}>
                        <Mail className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-theme-primary mb-1">Email Notifications (Global)</h3>
                        <p className="text-body-sm text-theme-secondary mb-2">
                          Master toggle for all email notifications. When disabled, no emails will be sent regardless of individual settings.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Info className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-xs text-theme-tertiary">This affects all notification types below</span>
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                      />
                      <div className="toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </Card>

                {/* Notification Type Cards */}
                <div className="space-y-4">
                <div 
                  className="flex items-center justify-between py-4 border-b"
                  style={{ borderBottomColor: 'var(--border-subtle)' }}
                >
                  <div>
                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Email Notifications (Global)</h3>
                    <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Master toggle for all email notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                    <div className="toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                  {/* Secret Expiration Alerts */}
                  <Card className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--status-warning-bg)' }}>
                        <Key className="h-5 w-5" style={{ color: 'var(--status-warning)' }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-theme-primary">Secret Expiration Alerts</h3>
                          <Badge variant={secretExpirationAlerts ? 'success' : 'default'}>
                            {secretExpirationAlerts ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-body-sm text-theme-secondary mb-1">
                          Get notified before secrets expire to ensure timely rotation
                        </p>
                        <p className="text-xs text-theme-tertiary">
                          Example: You'll receive a notification 7 days before a secret expires
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 pl-12">
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <span className="text-body-sm font-medium text-theme-primary">In-app notifications</span>
                          <p className="text-xs text-theme-tertiary">Show notifications in the app</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={secretExpirationInApp}
                            onChange={(e) => setSecretExpirationInApp(e.target.checked)}
                            disabled={!secretExpirationAlerts}
                          />
                          <div className={`toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${!secretExpirationAlerts ? 'opacity-50' : ''}`}></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <span className="text-body-sm font-medium text-theme-primary">Email notifications</span>
                          <p className="text-xs text-theme-tertiary">Receive email alerts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={secretExpirationEmail}
                            onChange={(e) => setSecretExpirationEmail(e.target.checked)}
                            disabled={!secretExpirationAlerts || !emailNotifications}
                          />
                          <div className={`toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${!secretExpirationAlerts || !emailNotifications ? 'opacity-50' : ''}`}></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-2 border-t pt-3" style={{ borderTopColor: 'var(--border-subtle)' }}>
                        <div>
                          <span className="text-body-sm font-medium text-theme-primary">Enable this notification type</span>
                          <p className="text-xs text-theme-tertiary">Master toggle for secret expiration alerts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={secretExpirationAlerts}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              setSecretExpirationAlerts(enabled);
                              if (!enabled) {
                                setSecretExpirationInApp(false);
                                setSecretExpirationEmail(false);
                              } else {
                                setSecretExpirationInApp(true);
                                setSecretExpirationEmail(true);
                              }
                            }}
                          />
                          <div className="toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      </div>
                      <div className="pt-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => testNotificationMutation.mutate('SECRET_EXPIRING_SOON')}
                          disabled={testNotificationMutation.isPending || !secretExpirationAlerts}
                        >
                          {testNotificationMutation.isPending ? 'Sending...' : 'Send Test Notification'}
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Project Invitations */}
                  <Card className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--status-info-bg)' }}>
                        <UserPlus className="h-5 w-5" style={{ color: 'var(--status-info)' }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-theme-primary">Project Invitations</h3>
                          <Badge variant={projectInvitations ? 'success' : 'default'}>
                            {projectInvitations ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-body-sm text-theme-secondary mb-1">
                          Get notified when you're invited to join new projects
                        </p>
                        <p className="text-xs text-theme-tertiary">
                          Example: Receive a notification when a team member invites you to collaborate
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 pl-12">
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <span className="text-body-sm font-medium text-theme-primary">In-app notifications</span>
                          <p className="text-xs text-theme-tertiary">Show notifications in the app</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={projectInvitationsInApp}
                            onChange={(e) => setProjectInvitationsInApp(e.target.checked)}
                            disabled={!projectInvitations}
                          />
                          <div className={`toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${!projectInvitations ? 'opacity-50' : ''}`}></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <span className="text-body-sm font-medium text-theme-primary">Email notifications</span>
                          <p className="text-xs text-theme-tertiary">Receive email alerts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={projectInvitationsEmail}
                            onChange={(e) => setProjectInvitationsEmail(e.target.checked)}
                            disabled={!projectInvitations || !emailNotifications}
                          />
                          <div className={`toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${!projectInvitations || !emailNotifications ? 'opacity-50' : ''}`}></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-2 border-t pt-3" style={{ borderTopColor: 'var(--border-subtle)' }}>
                        <div>
                          <span className="text-body-sm font-medium text-theme-primary">Enable this notification type</span>
                          <p className="text-xs text-theme-tertiary">Master toggle for project invitations</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={projectInvitations}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              setProjectInvitations(enabled);
                              if (!enabled) {
                                setProjectInvitationsInApp(false);
                                setProjectInvitationsEmail(false);
                              } else {
                                setProjectInvitationsInApp(true);
                                setProjectInvitationsEmail(true);
                              }
                            }}
                          />
                          <div className="toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      </div>
                      <div className="pt-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => testNotificationMutation.mutate('PROJECT_INVITATION')}
                          disabled={testNotificationMutation.isPending || !projectInvitations}
                        >
                          {testNotificationMutation.isPending ? 'Sending...' : 'Send Test Notification'}
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Security Alerts */}
                  <Card className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--status-danger-bg)' }}>
                        <AlertTriangle className="h-5 w-5" style={{ color: 'var(--status-danger)' }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-theme-primary">Security Alerts</h3>
                          <Badge variant={securityAlerts ? 'success' : 'default'}>
                            {securityAlerts ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-body-sm text-theme-secondary mb-1">
                          Critical security notifications that require immediate attention
                        </p>
                        <p className="text-xs text-theme-tertiary">
                          Example: Unusual access patterns, failed authentication attempts, or security policy violations
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 pl-12">
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <span className="text-body-sm font-medium text-theme-primary">In-app notifications</span>
                          <p className="text-xs text-theme-tertiary">Show notifications in the app</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={securityAlertsInApp}
                            onChange={(e) => setSecurityAlertsInApp(e.target.checked)}
                            disabled={!securityAlerts}
                          />
                          <div className={`toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${!securityAlerts ? 'opacity-50' : ''}`}></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <span className="text-body-sm font-medium text-theme-primary">Email notifications</span>
                          <p className="text-xs text-theme-tertiary">Receive email alerts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={securityAlertsEmail}
                            onChange={(e) => setSecurityAlertsEmail(e.target.checked)}
                            disabled={!securityAlerts || !emailNotifications}
                          />
                          <div className={`toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${!securityAlerts || !emailNotifications ? 'opacity-50' : ''}`}></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-2 border-t pt-3" style={{ borderTopColor: 'var(--border-subtle)' }}>
                        <div>
                          <span className="text-body-sm font-medium text-theme-primary">Enable this notification type</span>
                          <p className="text-xs text-theme-tertiary">Master toggle for security alerts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={securityAlerts}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              setSecurityAlerts(enabled);
                              if (!enabled) {
                                setSecurityAlertsInApp(false);
                                setSecurityAlertsEmail(false);
                              } else {
                                setSecurityAlertsInApp(true);
                                setSecurityAlertsEmail(true);
                              }
                            }}
                          />
                          <div className="toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      </div>
                      <div className="pt-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => testNotificationMutation.mutate('SECURITY_ALERT')}
                          disabled={testNotificationMutation.isPending || !securityAlerts}
                        >
                          {testNotificationMutation.isPending ? 'Sending...' : 'Send Test Notification'}
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Role Changes */}
                  <Card className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--status-info-bg)' }}>
                        <User className="h-5 w-5" style={{ color: 'var(--status-info)' }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-theme-primary mb-2">Role Changes</h3>
                        <p className="text-body-sm text-theme-secondary mb-1">
                          Get notified when your role changes in projects or teams
                        </p>
                        <p className="text-xs text-theme-tertiary">
                          Example: You'll be notified when promoted to Admin or when your permissions change
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 pl-12">
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <span className="text-body-sm font-medium text-theme-primary">In-app notifications</span>
                          <p className="text-xs text-theme-tertiary">Show notifications in the app</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={roleChangedInApp}
                            onChange={(e) => setRoleChangedInApp(e.target.checked)}
                          />
                          <div className="toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <span className="text-body-sm font-medium text-theme-primary">Email notifications</span>
                          <p className="text-xs text-theme-tertiary">Receive email alerts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={roleChangedEmail}
                            onChange={(e) => setRoleChangedEmail(e.target.checked)}
                            disabled={!emailNotifications}
                          />
                          <div className={`toggle-switch w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${!emailNotifications ? 'opacity-50' : ''}`}></div>
                        </label>
                      </div>
                      <div className="pt-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => testNotificationMutation.mutate('ROLE_CHANGED')}
                          disabled={testNotificationMutation.isPending}
                        >
                          {testNotificationMutation.isPending ? 'Sending...' : 'Send Test Notification'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Action Buttons */}
                <Card className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-theme-primary mb-1">Save Changes</h3>
                      <p className="text-body-sm text-theme-secondary">Apply your notification preferences</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          // Reset to defaults
                          setEmailNotifications(true);
                          setSecretExpirationAlerts(true);
                          setSecretExpirationInApp(true);
                          setSecretExpirationEmail(true);
                          setProjectInvitations(true);
                          setProjectInvitationsInApp(true);
                          setProjectInvitationsEmail(true);
                          setSecurityAlerts(true);
                          setSecurityAlertsInApp(true);
                          setSecurityAlertsEmail(true);
                          setRoleChangedInApp(true);
                          setRoleChangedEmail(true);
                        }}
                        disabled={isLoadingPreferences}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset to Defaults
                      </Button>
                      <Button 
                        onClick={handleSaveNotifications} 
                        isLoading={savePreferencesMutation.isPending} 
                        disabled={isLoadingPreferences}
                      >
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
              )}
            </Card>
          )}

          {activeTab === 'analytics' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-theme-primary">Notification Analytics</h2>
              <div className="space-y-4">
                <p className="text-body-sm text-theme-secondary">
                  Track your notification engagement and email delivery rates.
                </p>
                <div className="text-body-sm text-theme-secondary">
                  Analytics coming soon...
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Theme Selection - Enhanced */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--elevation-1)' }}>
                      <Palette className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-theme-primary">Theme</h2>
                      <p className="text-body-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Choose your preferred color scheme and mode
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="info">{themeInfo.name}</Badge>
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--elevation-1)' }}>
                    <LayoutGrid className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-theme-primary">Display & View</h2>
                    <p className="text-body-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Customize how content is displayed
                    </p>
                  </div>
                </div>
                
                {isLoadingPreferences ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
                  </div>
                ) : (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Default Project View
                    </label>
                    <p className="text-xs text-theme-tertiary mb-3">Choose how projects are displayed by default</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setProjectView('grid')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          projectView === 'grid' ? 'border-accent-primary bg-accent-primary-glow' : 'border-theme-subtle bg-elevation-1'
                        }`}
                        style={{
                          borderColor: projectView === 'grid' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          backgroundColor: projectView === 'grid' ? 'var(--accent-primary-glow)' : 'var(--elevation-1)',
                        }}
                      >
                        <LayoutGrid className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--text-primary)' }} />
                        <p className="text-sm font-medium text-theme-primary">Grid View</p>
                        <p className="text-xs text-theme-tertiary mt-1">Card-based layout</p>
                      </button>
                      <button
                        onClick={() => setProjectView('list')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          projectView === 'list' ? 'border-accent-primary bg-accent-primary-glow' : 'border-theme-subtle bg-elevation-1'
                        }`}
                        style={{
                          borderColor: projectView === 'list' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          backgroundColor: projectView === 'list' ? 'var(--accent-primary-glow)' : 'var(--elevation-1)',
                        }}
                      >
                        <List className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--text-primary)' }} />
                        <p className="text-sm font-medium text-theme-primary">List View</p>
                        <p className="text-xs text-theme-tertiary mt-1">Table-based layout</p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Date Format
                    </label>
                    <p className="text-xs text-theme-tertiary mb-3">Choose how dates are displayed throughout the app</p>
                    <select 
                      className="input-theme w-full px-4 py-2"
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY (e.g., {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })})</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (e.g., {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })})</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (e.g., {new Date().toISOString().split('T')[0]})</option>
                    </select>
                  </div>
                </div>
                )}
              </Card>

              {/* Regional Settings */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--elevation-1)' }}>
                    <Globe className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-theme-primary">Regional Settings</h2>
                    <p className="text-body-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Configure timezone and locale preferences
                    </p>
                  </div>
                </div>
                
                {isLoadingPreferences ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
                  </div>
                ) : (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Timezone
                    </label>
                    <p className="text-xs text-theme-tertiary mb-3">
                      All timestamps will be displayed in your selected timezone
                    </p>
                    <select 
                      className="input-theme w-full px-4 py-2"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">America/New_York (Eastern Time, UTC-5)</option>
                      <option value="America/Chicago">America/Chicago (Central Time, UTC-6)</option>
                      <option value="America/Denver">America/Denver (Mountain Time, UTC-7)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (Pacific Time, UTC-8)</option>
                      <option value="Europe/London">Europe/London (GMT, UTC+0)</option>
                      <option value="Europe/Paris">Europe/Paris (Central European Time, UTC+1)</option>
                      <option value="Europe/Berlin">Europe/Berlin (Central European Time, UTC+1)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (Japan Standard Time, UTC+9)</option>
                      <option value="Asia/Shanghai">Asia/Shanghai (China Standard Time, UTC+8)</option>
                      <option value="Asia/Dubai">Asia/Dubai (Gulf Standard Time, UTC+4)</option>
                      <option value="Australia/Sydney">Australia/Sydney (Australian Eastern Time, UTC+10)</option>
                    </select>
                    <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--elevation-1)' }}>
                      <p className="text-xs text-theme-tertiary mb-1">Current time in selected timezone:</p>
                      <p className="text-sm font-medium text-theme-primary">
                        {new Date().toLocaleString('en-US', { 
                          timeZone: timezone,
                          dateStyle: 'full',
                          timeStyle: 'long'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                )}
              </Card>

              {/* Save Button */}
              <Card className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-theme-primary mb-1">Save Changes</h3>
                    <p className="text-body-sm text-theme-secondary">Apply your preference settings</p>
                  </div>
                  <Button 
                    onClick={handleSavePreferences} 
                    isLoading={savePreferencesMutation.isPending} 
                    disabled={isLoadingPreferences}
                  >
                    Save Preferences
                  </Button>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* 2FA Modals */}
      <TwoFactorSetupModal
        isOpen={show2FASetupModal}
        onClose={() => setShow2FASetupModal(false)}
        onSuccess={handle2FASuccess}
      />
      <TwoFactorDisableModal
        isOpen={show2FADisableModal}
        onClose={() => setShow2FADisableModal(false)}
        onSuccess={handle2FASuccess}
      />
      <RecoveryCodesModal
        isOpen={showRecoveryCodesModal}
        onClose={() => setShowRecoveryCodesModal(false)}
      />
    </div>
  );
};

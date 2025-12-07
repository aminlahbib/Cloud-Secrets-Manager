import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Bell, 
  HelpCircle,
  Key,
  Sun,
  Moon,
  Zap,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { Logo } from '@/components/ui/Logo';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { mode, toggleMode } = useTheme();
  const { t } = useI18n();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg)', color: 'var(--text-primary)' }}>
      {/* Top Navigation Bar */}
      <nav 
        className="fixed top-0 w-full z-50 border-b backdrop-blur-md"
        style={{ 
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--elevation-1)',
          opacity: 0.95
        }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Left: Logo & Nav Links */}
          <div className="flex items-center gap-4 sm:gap-8 lg:gap-12">
            {/* Logo with text */}
            <Logo size="md" onClick={handleGetStarted} showText={true} />

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              <button 
                className="transition-colors flex items-center gap-1"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                {t('nav.features')} <ChevronDown className="w-3 h-3" />
              </button>
              <button 
                className="transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                {t('nav.security')}
              </button>
              <button 
                className="transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                {t('nav.pricing')}
              </button>
              <button 
                className="transition-colors flex items-center gap-1"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                {t('nav.resources')} <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right: Actions & Icons */}
          <div className="flex items-center gap-5">
            {/* Search */}
            <div className="hidden md:flex relative group mr-1">
                <Search 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" 
                  style={{ color: 'var(--text-tertiary)' }}
                />
                <input 
                    type="text" 
                    placeholder={t('nav.search.placeholder')} 
                    className="rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none w-48 transition-all"
                    style={{
                      backgroundColor: 'var(--elevation-2)',
                      border: '1px solid transparent',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--border-default)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'transparent';
                    }}
                />
            </div>
            
            {/* Divider */}
            <div className="h-5 w-px hidden lg:block mx-1" style={{ backgroundColor: 'var(--border-subtle)' }}></div>

            {/* Theme Selector - Hidden on mobile, compact on tablet */}
            <div className="hidden md:block lg:hidden">
              <ThemeSelector compact={true} />
            </div>
            <div className="hidden lg:block">
              <ThemeSelector compact={false} />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleMode}
              className="flex items-center justify-center p-2 rounded-lg transition-all duration-200"
              style={{ 
                backgroundColor: 'var(--elevation-2)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
              title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--elevation-3)';
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--elevation-2)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              {mode === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Utility Icons */}
            <div className="flex items-center gap-4 xl:gap-5" style={{ color: 'var(--text-secondary)' }}>
                 <button 
                   onClick={handleLogin}
                   className="transition-colors flex items-center justify-center" 
                   aria-label="Login / Sign up"
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                   onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                 >
                    <User className="w-5 h-5" />
                 </button>
                 <button 
                   className="hidden lg:block transition-colors flex items-center justify-center" 
                   aria-label="Notifications"
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                   onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                 >
                    <Bell className="w-5 h-5" />
                 </button>
                 <button 
                   className="hidden lg:block transition-colors flex items-center justify-center" 
                   aria-label="Support"
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                   onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                 >
                    <HelpCircle className="w-5 h-5" />
                 </button>
                 {/* Language Selector - Icon only, rightmost position */}
                 <div className="hidden md:block">
                   <LanguageSelector iconOnly={true} />
                 </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex flex-col pt-20 sm:pt-24 md:pt-28 lg:pt-32 px-4 sm:px-6 max-w-[1440px] mx-auto w-full">
        
        {/* Hero Section - Grows to fill space and center content */}
        <main className="flex-1 flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 lg:gap-16 xl:gap-24 mb-8 sm:mb-12 lg:mb-16">
          
          {/* Left Content */}
          <div className="flex-1 max-w-2xl space-y-6 sm:space-y-8 animate-fade-in-up text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]" style={{ color: 'var(--text-primary)' }}>
              {t('landing.hero.title')} <br />
              <span style={{ 
                background: 'linear-gradient(to right, var(--accent-primary), var(--accent-primary-light))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {t('landing.hero.titleHighlight')}
              </span> <br />
              {t('landing.hero.titleEnd')}
            </h1>
            
            <p className="text-base sm:text-lg max-w-lg leading-relaxed mx-auto lg:mx-0" style={{ color: 'var(--text-secondary)' }}>
              {t('landing.hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4 justify-center lg:justify-start">
              <button 
                onClick={handleGetStarted}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--text-inverse)',
                  boxShadow: '0 0 20px var(--accent-primary-glow)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                }}
              >
                {t('landing.hero.getStarted')}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button 
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base transition-all flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--elevation-2)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--elevation-3)';
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--elevation-2)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                {t('landing.hero.viewDemo')}
              </button>
            </div>

            {/* Trust badges */}
            <div className="pt-6 sm:pt-8 flex items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm font-medium flex-wrap" style={{ color: 'var(--text-tertiary)' }}>
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    <span>{t('landing.trust.encrypted')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    <span>{t('landing.trust.2fa')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    <span>{t('landing.trust.uptime')}</span>
                </div>
            </div>
          </div>

          {/* Right Visual (Mock App Interface) */}
          <div className="flex-1 w-full max-w-[500px] lg:max-w-none relative mt-8 lg:mt-0">
            {/* Glow Effect - More subtle */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[500px] lg:w-[600px] h-[400px] sm:h-[500px] lg:h-[600px] blur-[120px] rounded-full pointer-events-none"
              style={{ 
                backgroundColor: 'var(--accent-primary-glow)',
                opacity: 0.15
              }}
            ></div>
            
            {/* Mobile/Card Mockup - More subtle borders */}
            <div 
              className="relative z-10 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] lg:rounded-[2.5rem] p-4 sm:p-5 lg:p-6 shadow-2xl transform rotate-[-1deg] sm:rotate-[-2deg] hover:rotate-0 transition-transform duration-500 ease-out"
              style={{
                backgroundColor: 'var(--elevation-2)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-xl)'
              }}
            >
                {/* Mock Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'var(--elevation-3)' }}
                        >
                             <div 
                               className="w-6 h-6 rounded"
                               style={{ backgroundColor: 'var(--accent-primary)' }}
                             ></div>
                        </div>
                        <div>
                            <div 
                              className="h-2 w-24 rounded mb-1.5"
                              style={{ backgroundColor: 'var(--elevation-3)' }}
                            ></div>
                            <div 
                              className="h-2 w-16 rounded"
                              style={{ backgroundColor: 'var(--elevation-4)' }}
                            ></div>
                        </div>
                    </div>
                    <div 
                      className="w-8 h-8 rounded-full border"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    ></div>
                </div>

                {/* Mock Chart/Stats */}
                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Total Secrets</div>
                            <div className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>1,248</div>
                        </div>
                        <div 
                          className="h-12 w-24 relative overflow-hidden"
                          style={{ 
                            background: 'linear-gradient(to top, var(--accent-primary-glow), transparent)',
                            borderBottom: '2px solid var(--accent-primary)'
                          }}
                        >
                             {/* Decorative chart line */}
                             <svg className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none" style={{ color: 'var(--accent-primary)' }}>
                                 <path d="M0 40 Q 10 30, 20 35 T 40 20 T 60 25 T 80 10 L 100 0 V 50 H 0 Z" fill="currentColor" opacity="0.2" />
                                 <path d="M0 40 Q 10 30, 20 35 T 40 20 T 60 25 T 80 10" fill="none" stroke="currentColor" strokeWidth="2" />
                             </svg>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <span 
                           className="px-2 py-1 rounded text-xs font-medium"
                           style={{
                             backgroundColor: 'var(--accent-primary-glow)',
                             color: 'var(--accent-primary)'
                           }}
                         >
                           +12.5% this week
                         </span>
                    </div>
                </div>

                {/* Mock List Items - More subtle borders */}
                <div className="space-y-3">
                    <div 
                      className="p-4 rounded-xl flex items-center justify-between"
                      style={{
                        backgroundColor: 'var(--elevation-3)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                        <div className="flex items-center gap-3">
                            <div 
                              className="p-2 rounded-lg"
                              style={{ 
                                backgroundColor: 'var(--status-success)',
                                color: 'var(--status-success)',
                                opacity: 0.1
                              }}
                            >
                                <Lock className="w-4 h-4" style={{ color: 'var(--status-success)' }} />
                            </div>
                            <div className="text-sm">
                                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>AWS_PROD_KEY</div>
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Updated 2m ago</div>
                            </div>
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>View</div>
                    </div>
                    
                    <div 
                      className="p-4 rounded-xl flex items-center justify-between"
                      style={{
                        backgroundColor: 'var(--elevation-3)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                        <div className="flex items-center gap-3">
                            <div 
                              className="p-2 rounded-lg"
                              style={{ 
                                backgroundColor: 'var(--status-info)',
                                color: 'var(--status-info)',
                                opacity: 0.1
                              }}
                            >
                                <Key className="w-4 h-4" style={{ color: 'var(--status-info)' }} />
                            </div>
                            <div className="text-sm">
                                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>STRIPE_SECRET</div>
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Viewed by Sarah</div>
                            </div>
                        </div>
                         <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>View</div>
                    </div>

                    <div 
                      className="p-4 rounded-xl flex items-center justify-between"
                      style={{
                        backgroundColor: 'var(--elevation-3)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                        <div className="flex items-center gap-3">
                            <div 
                              className="p-2 rounded-lg"
                              style={{ 
                                backgroundColor: 'var(--status-warning)',
                                color: 'var(--status-warning)',
                                opacity: 0.1
                              }}
                            >
                                <Zap className="w-4 h-4" style={{ color: 'var(--status-warning)' }} />
                            </div>
                            <div className="text-sm">
                                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>DB_PASSWORD</div>
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Expires in 2 days</div>
                            </div>
                        </div>
                         <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>View</div>
                    </div>
                </div>

                {/* Floating "Approved" Toast - More subtle, hidden on mobile */}
                <div 
                  className="hidden sm:flex absolute -right-4 sm:-right-8 top-8 sm:top-12 p-2 sm:p-3 rounded-lg sm:rounded-xl items-center gap-2 sm:gap-3"
                  style={{
                    backgroundColor: 'var(--elevation-4)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-lg)',
                    color: 'var(--text-primary)'
                  }}
                >
                     <div 
                       className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
                       style={{ 
                         backgroundColor: 'var(--status-success)',
                         color: 'var(--text-inverse)',
                         opacity: 0.2
                       }}
                     >
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--status-success)', opacity: 1 }} />
                     </div>
                     <div>
                        <div className="text-[10px] sm:text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Access Granted</div>
                        <div className="text-[8px] sm:text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Just now</div>
                     </div>
                </div>
            </div>
          </div>
        </main>

        {/* Feature Ticker / Footer Strip - Pushed to bottom, full width */}
        <footer 
          className="mt-auto py-6 sm:py-8 lg:py-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8"
          style={{
            borderTop: '1px solid var(--border-subtle)',
            width: '100vw',
            marginLeft: 'calc(-50vw + 50%)',
            paddingLeft: 'max(16px, calc((100vw - 1440px) / 2 + 16px))',
            paddingRight: 'max(16px, calc((100vw - 1440px) / 2 + 16px))'
          }}
        >
            <div className="text-center md:text-left">
                <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>200+</div>
                <div className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>{t('landing.stats.integrations')}</div>
            </div>
             <div className="text-center md:text-left">
                <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>$50B</div>
                <div className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>{t('landing.stats.assets')}</div>
            </div>
             <div className="text-center md:text-left">
                <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>0.05ms</div>
                <div className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>{t('landing.stats.latency')}</div>
            </div>
             <div className="text-center md:text-left">
                <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>24/7</div>
                <div className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>{t('landing.stats.support')}</div>
            </div>
        </footer>
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};


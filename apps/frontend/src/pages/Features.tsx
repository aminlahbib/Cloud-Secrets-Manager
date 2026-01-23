import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Lock, Zap, Database, Cloud, CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';

export const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  const features = [
    {
      icon: Shield,
      title: 'Enterprise-Grade Security',
      description: 'AES-256 encryption, zero-knowledge architecture, and compliance with SOC 2, GDPR, and HIPAA standards.',
    },
    {
      icon: Key,
      title: 'Centralized Secret Management',
      description: 'Manage all your API keys, tokens, certificates, and credentials from a single, secure platform.',
    },
    {
      icon: Lock,
      title: 'Access Control & Permissions',
      description: 'Granular role-based access control (RBAC) with team and project-level permissions.',
    },
    {
      icon: Zap,
      title: 'High Performance',
      description: 'Sub-millisecond latency with 99.99% uptime SLA. Built for scale with global CDN distribution.',
    },
    {
      icon: Database,
      title: 'Audit Logging',
      description: 'Comprehensive audit trails for all secret access, modifications, and user activities.',
    },
    {
      icon: Cloud,
      title: 'Multi-Cloud Support',
      description: 'Seamlessly integrate with AWS, Azure, GCP, and other cloud providers.',
    },
  ];

  const securityFeatures = [
    'AES-256-GCM encryption at rest',
    'End-to-end encryption in transit',
    'Zero-knowledge architecture',
    'Hardware Security Modules (HSM)',
    'Regular security audits',
    'Penetration testing',
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg)', color: 'var(--text-primary)' }}>
      {/* Navigation Bar */}
      <nav 
        className="fixed top-0 w-full z-50 border-b backdrop-blur-md"
        style={{ 
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--elevation-1)',
          opacity: 0.95
        }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Logo size="md" onClick={() => navigate('/')} showText={true} />
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="primary" onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Powerful Features for{' '}
            <span style={{ color: 'var(--accent-primary)' }}>Secure Secret Management</span>
          </h1>
          <p className="text-lg sm:text-xl mb-8" style={{ color: 'var(--text-secondary)' }}>
            Everything you need to manage secrets securely at scale
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-xl border transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: 'var(--elevation-1)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="mb-4" style={{ color: 'var(--accent-primary)' }}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4 sm:px-6" style={{ backgroundColor: 'var(--elevation-1)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Security First</h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Built with security as the foundation, not an afterthought
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
            Start managing your secrets securely today
          </p>
          <Button variant="primary" size="lg" onClick={handleGetStarted}>
            Get Started Free
          </Button>
        </div>
      </section>
    </div>
  );
};

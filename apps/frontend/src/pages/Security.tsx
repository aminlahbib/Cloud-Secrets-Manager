import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, FileCheck, Server, KeyRound } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';

export const SecurityPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  const securityPrinciples = [
    {
      icon: Shield,
      title: 'Zero-Knowledge Architecture',
      description: 'We never see your secrets. All encryption and decryption happens client-side, ensuring only you have access to your data.',
    },
    {
      icon: Lock,
      title: 'AES-256-GCM Encryption',
      description: 'Industry-standard encryption at rest and in transit. Your secrets are protected with military-grade encryption.',
    },
    {
      icon: Eye,
      title: 'Comprehensive Audit Logs',
      description: 'Track every access, modification, and action with detailed audit trails. Know who accessed what and when.',
    },
    {
      icon: FileCheck,
      title: 'Compliance & Certifications',
      description: 'SOC 2 Type II, GDPR, HIPAA compliant. Regular security audits and penetration testing ensure ongoing protection.',
    },
    {
      icon: Server,
      title: 'Hardware Security Modules',
      description: 'Optional HSM support for organizations requiring the highest level of security for key management.',
    },
    {
      icon: KeyRound,
      title: 'Role-Based Access Control',
      description: 'Granular permissions at team, project, and secret levels. Principle of least privilege enforced.',
    },
  ];

  const complianceStandards = [
    'SOC 2 Type II',
    'GDPR Compliant',
    'HIPAA Ready',
    'ISO 27001',
    'PCI DSS',
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
          <div className="mb-6 inline-block p-4 rounded-full" style={{ backgroundColor: 'var(--accent-primary-glow)' }}>
            <Shield className="w-12 h-12" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Security You Can{' '}
            <span style={{ color: 'var(--accent-primary)' }}>Trust</span>
          </h1>
          <p className="text-lg sm:text-xl mb-8" style={{ color: 'var(--text-secondary)' }}>
            Enterprise-grade security built into every layer of our platform
          </p>
        </div>
      </section>

      {/* Security Principles */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityPrinciples.map((principle, index) => {
              const Icon = principle.icon;
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
                  <h3 className="text-xl font-semibold mb-2">{principle.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {principle.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-20 px-4 sm:px-6" style={{ backgroundColor: 'var(--elevation-1)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Compliance & Certifications</h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Meeting the highest standards for security and compliance
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {complianceStandards.map((standard, index) => (
              <div
                key={index}
                className="px-6 py-3 rounded-lg border"
                style={{
                  backgroundColor: 'var(--elevation-2)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span className="font-medium">{standard}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Secure Your Secrets Today</h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
            Join thousands of teams trusting us with their most sensitive data
          </p>
          <Button variant="primary" size="lg" onClick={handleGetStarted}>
            Get Started Free
          </Button>
        </div>
      </section>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, FileText, Video, Code, MessageSquare, Github, ExternalLink } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';

export const ResourcesPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  const resourceCategories = [
    {
      icon: Book,
      title: 'Documentation',
      description: 'Comprehensive guides and API references',
      items: [
        { name: 'Getting Started Guide', href: '#' },
        { name: 'API Reference', href: '#' },
        { name: 'Integration Guides', href: '#' },
        { name: 'Best Practices', href: '#' },
      ],
    },
    {
      icon: FileText,
      title: 'Blog & Articles',
      description: 'Latest updates, tutorials, and insights',
      items: [
        { name: 'Security Best Practices', href: '#' },
        { name: 'Secret Management Guide', href: '#' },
        { name: 'Compliance & Regulations', href: '#' },
        { name: 'Product Updates', href: '#' },
      ],
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      items: [
        { name: 'Quick Start Tutorial', href: '#' },
        { name: 'Advanced Features', href: '#' },
        { name: 'API Integration', href: '#' },
        { name: 'Team Management', href: '#' },
      ],
    },
    {
      icon: Code,
      title: 'Code Examples',
      description: 'Sample code and SDKs',
      items: [
        { name: 'JavaScript SDK', href: '#' },
        { name: 'Python SDK', href: '#' },
        { name: 'REST API Examples', href: '#' },
        { name: 'CLI Tools', href: '#' },
      ],
    },
    {
      icon: MessageSquare,
      title: 'Community',
      description: 'Connect with other users',
      items: [
        { name: 'Discord Community', href: '#' },
        { name: 'Stack Overflow', href: '#' },
        { name: 'GitHub Discussions', href: '#' },
        { name: 'User Forum', href: '#' },
      ],
    },
    {
      icon: Github,
      title: 'Open Source',
      description: 'Contribute and explore',
      items: [
        { name: 'GitHub Repository', href: '#' },
        { name: 'Contributing Guide', href: '#' },
        { name: 'Issue Tracker', href: '#' },
        { name: 'Changelog', href: '#' },
      ],
    },
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
            Resources &{' '}
            <span style={{ color: 'var(--accent-primary)' }}>Documentation</span>
          </h1>
          <p className="text-lg sm:text-xl mb-8" style={{ color: 'var(--text-secondary)' }}>
            Everything you need to get started and make the most of Cloud Secrets Manager
          </p>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resourceCategories.map((category, index) => {
              const Icon = category.icon;
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
                  <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {category.description}
                  </p>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <a
                          href={item.href}
                          className="flex items-center gap-2 text-sm transition-colors hover:underline"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--accent-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                        >
                          <span>{item.name}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-20 px-4 sm:px-6" style={{ backgroundColor: 'var(--elevation-1)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'Getting Started', href: '#' },
              { name: 'API Documentation', href: '#' },
              { name: 'Security Guide', href: '#' },
              { name: 'Migration Guide', href: '#' },
              { name: 'Troubleshooting', href: '#' },
              { name: 'Contact Support', href: '#' },
            ].map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="p-4 rounded-lg border transition-all hover:shadow-md flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--elevation-2)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <span className="font-medium">{link.name}</span>
                <ExternalLink className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
            Explore our documentation and start building securely
          </p>
          <Button variant="primary" size="lg" onClick={handleGetStarted}>
            Get Started Free
          </Button>
        </div>
      </section>
    </div>
  );
};

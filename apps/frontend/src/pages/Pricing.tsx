import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for individuals and small projects',
      features: [
        'Up to 100 secrets',
        '1 project',
        'Basic encryption',
        'Community support',
        'Audit logs (30 days)',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Professional',
      price: '$29',
      period: 'per month',
      description: 'For growing teams and businesses',
      features: [
        'Unlimited secrets',
        'Unlimited projects',
        'Advanced encryption',
        'Priority support',
        'Audit logs (1 year)',
        'Team collaboration',
        'SSO integration',
        'Custom integrations',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      description: 'For large organizations with advanced needs',
      features: [
        'Everything in Professional',
        'Dedicated support',
        'Custom SLA',
        'On-premise deployment',
        'HSM support',
        'Advanced compliance',
        'Custom integrations',
        'Dedicated account manager',
      ],
      cta: 'Contact Sales',
      popular: false,
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
            Simple, Transparent{' '}
            <span style={{ color: 'var(--accent-primary)' }}>Pricing</span>
          </h1>
          <p className="text-lg sm:text-xl mb-8" style={{ color: 'var(--text-secondary)' }}>
            Choose the plan that fits your needs. Upgrade or downgrade at any time.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-xl border transition-all ${
                  plan.popular ? 'shadow-lg scale-105' : 'hover:shadow-lg'
                }`}
                style={{
                  backgroundColor: plan.popular ? 'var(--elevation-1)' : 'var(--elevation-1)',
                  borderColor: plan.popular ? 'var(--accent-primary)' : 'var(--border-subtle)',
                }}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--text-on-accent)',
                    }}
                  >
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period !== 'forever' && plan.period !== 'pricing' && (
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        /{plan.period}
                      </span>
                    )}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? 'primary' : 'secondary'}
                  className="w-full"
                  onClick={handleGetStarted}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6" style={{ backgroundColor: 'var(--elevation-1)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I change plans later?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes, Professional plan includes a 14-day free trial. No credit card required.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes, we offer a 30-day money-back guarantee for all paid plans.',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: 'var(--elevation-2)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {faq.a}
                </p>
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
            Start with our free plan and upgrade when you're ready
          </p>
          <Button variant="primary" size="lg" onClick={handleGetStarted}>
            Get Started Free
          </Button>
        </div>
      </section>
    </div>
  );
};

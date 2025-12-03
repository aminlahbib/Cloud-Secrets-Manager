import React, { useState, useEffect } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { twoFactorService, type TotpStartResponse } from '../../services/twoFactor';
import { useNotifications } from '../../contexts/NotificationContext';
import { useI18n } from '../../contexts/I18nContext';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showNotification } = useNotifications();
  const { t } = useI18n();
  const [step, setStep] = useState<'qr' | 'verify'>('qr');
  const [setupData, setSetupData] = useState<TotpStartResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && step === 'qr') {
      startSetup();
    }
  }, [isOpen, step]);

  const startSetup = async () => {
    setIsLoading(true);
    try {
      const data = await twoFactorService.startSetup();
      setSetupData(data);
    } catch (error: any) {
      const backendMessage: string | undefined =
        error?.response?.data?.error || error?.response?.data?.message;

      // If 2FA is already enabled, treat this as an info case and sync UI state
      if (backendMessage && backendMessage.toLowerCase().includes('already enabled')) {
        showNotification({
          type: 'info',
          title: t('twoFactor.alreadyEnabled'),
          message: t('twoFactor.alreadyEnabledDescription'),
        });
        // Let parent refresh the user state so the Security tab reflects 2FA correctly
        // Wait for refresh to complete before closing modal
        await onSuccess();
        onClose();
      } else {
        showNotification({
          type: 'error',
          title: t('twoFactor.setupFailed'),
          message: backendMessage || t('twoFactor.setupFailedDescription'),
        });
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.match(/^\d{6}$/)) {
      showNotification({
        type: 'error',
        title: t('twoFactor.invalidCode'),
        message: t('twoFactor.invalidCodeDescription'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await twoFactorService.confirmSetup(verificationCode);
      setRecoveryCodes(response.recoveryCodes);
      setStep('verify');
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: t('twoFactor.verificationFailed'),
        message: error?.response?.data?.error || t('twoFactor.verificationFailedDescription'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (setupData?.manualSecret) {
      navigator.clipboard.writeText(setupData.manualSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
    // Reset state
    setStep('qr');
    setVerificationCode('');
    setRecoveryCodes([]);
    setSetupData(null);
  };

  const handleClose = () => {
    if (step === 'verify' && recoveryCodes.length > 0) {
      // User has completed setup, just close
      handleComplete();
    } else {
      // Reset and close
      setStep('qr');
      setVerificationCode('');
      setRecoveryCodes([]);
      setSetupData(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('twoFactor.title')}>
      <div className="space-y-6">
        {step === 'qr' && (
          <>
            <div>
              <p className="text-body-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {t('twoFactor.scanQR')}
              </p>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
                </div>
              ) : setupData?.qrCodeDataUrl ? (
                <div className="flex flex-col items-center space-y-4">
                  <div 
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: 'white' }}
                  >
                    <img 
                      src={setupData.qrCodeDataUrl} 
                      alt="QR Code" 
                      className="w-64 h-64"
                    />
                  </div>
                  
                  <div className="w-full">
                    <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      {t('twoFactor.enterManually')}
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={setupData.manualSecret}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopySecret}
                        className="flex-shrink-0"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('twoFactor.verificationCode')}
              </label>
              <Input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('twoFactor.verificationCodePlaceholder')}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-caption mt-2" style={{ color: 'var(--text-tertiary)' }}>
                {t('twoFactor.verificationCodeHint')}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleClose} className="flex-1">
                {t('twoFactor.cancel')}
              </Button>
              <Button 
                onClick={handleVerify} 
                isLoading={isLoading}
                disabled={verificationCode.length !== 6}
                className="flex-1"
              >
                {t('twoFactor.verifyAndEnable')}
              </Button>
            </div>
          </>
        )}

        {step === 'verify' && recoveryCodes.length > 0 && (
          <>
            <div 
              className="p-4 rounded-lg flex items-start gap-3"
              style={{ 
                backgroundColor: 'var(--status-success-bg)',
                borderColor: 'var(--status-success)',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              <Check className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--status-success)' }} />
              <div>
                <h3 className="font-medium mb-1" style={{ color: 'var(--status-success)' }}>
                  {t('twoFactor.enabled')}
                </h3>
                <p className="text-body-sm" style={{ color: 'var(--status-success)' }}>
                  {t('twoFactor.enabledDescription')}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('twoFactor.recoveryCodes')}
                </label>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const codesText = recoveryCodes.join('\n');
                    navigator.clipboard.writeText(codesText);
                    showNotification({
                      type: 'success',
                      title: t('twoFactor.copied'),
                      message: t('twoFactor.recoveryCodesCopied'),
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {t('twoFactor.copyAll')}
                </Button>
              </div>
              
              <div 
                className="p-4 rounded-lg space-y-2 font-mono text-sm"
                style={{ 
                  backgroundColor: 'var(--elevation-1)',
                  borderColor: 'var(--border-subtle)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                {recoveryCodes.map((code, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-primary)' }}>{code}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(code);
                        showNotification({
                          type: 'success',
                          title: t('twoFactor.copied'),
                          message: t('twoFactor.recoveryCodeCopied'),
                        });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div 
                className="mt-3 p-3 rounded-lg flex items-start gap-2"
                style={{ 
                  backgroundColor: 'var(--status-warning-bg)',
                  borderColor: 'var(--status-warning)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--status-warning)' }} />
                <p className="text-caption" style={{ color: 'var(--status-warning)' }}>
                  <strong>{t('common.important') || 'Important:'}</strong> {t('twoFactor.recoveryCodesImportant')}
                </p>
              </div>
            </div>

            <Button onClick={handleComplete} className="w-full">
              {t('twoFactor.done')}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};


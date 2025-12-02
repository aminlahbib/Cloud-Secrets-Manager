import React, { useState } from 'react';
import { Copy, Download, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { twoFactorService } from '../../services/twoFactor';
import { useNotifications } from '../../contexts/NotificationContext';
import { useMutation } from '@tanstack/react-query';

interface RecoveryCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCodes?: string[];
}

export const RecoveryCodesModal: React.FC<RecoveryCodesModalProps> = ({
  isOpen,
  onClose,
  initialCodes,
}) => {
  const { showNotification } = useNotifications();
  const [codes, setCodes] = useState<string[]>(initialCodes || []);

  const regenerateMutation = useMutation({
    mutationFn: () => twoFactorService.regenerateRecoveryCodes(),
    onSuccess: (data) => {
      setCodes(data.recoveryCodes);
      showNotification({
        type: 'success',
        title: 'Recovery codes regenerated',
        message: 'New recovery codes have been generated. Save them in a safe place.',
      });
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Regeneration failed',
        message: error?.response?.data?.error || 'Failed to regenerate recovery codes. Please try again.',
      });
    },
  });

  const handleCopyAll = () => {
    const codesText = codes.join('\n');
    navigator.clipboard.writeText(codesText);
    showNotification({
      type: 'success',
      title: 'Copied',
      message: 'All recovery codes copied to clipboard',
    });
  };

  const handleDownload = () => {
    const codesText = codes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification({
      type: 'success',
      title: 'Downloaded',
      message: 'Recovery codes downloaded',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recovery Codes" size="lg">
      <div className="space-y-6">
        <div 
          className="p-4 rounded-lg flex items-start gap-3"
          style={{ 
            backgroundColor: 'var(--status-warning-bg)',
            borderColor: 'var(--status-warning)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--status-warning)' }} />
          <div>
            <h3 className="font-medium mb-1" style={{ color: 'var(--status-warning)' }}>
              Keep these codes safe
            </h3>
            <p className="text-body-sm" style={{ color: 'var(--status-warning)' }}>
              If you lose access to your authenticator app, you can use these codes to sign in. Each code can only be used once.
            </p>
          </div>
        </div>

        {codes.length > 0 ? (
          <>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Your Recovery Codes
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyAll}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
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
                {codes.map((code, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span style={{ color: 'var(--text-primary)' }}>{code}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(code);
                        showNotification({
                          type: 'success',
                          title: 'Copied',
                          message: 'Recovery code copied',
                        });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => regenerateMutation.mutate()}
                isLoading={regenerateMutation.isPending}
                className="flex-1"
              >
                Regenerate Codes
              </Button>
              <Button onClick={onClose} className="flex-1">
                Done
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-body-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              No recovery codes available. You can regenerate them below.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => regenerateMutation.mutate()}
                isLoading={regenerateMutation.isPending}
                className="flex-1"
              >
                Generate Recovery Codes
              </Button>
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};


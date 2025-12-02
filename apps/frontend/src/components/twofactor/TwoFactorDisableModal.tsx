import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { twoFactorService } from '../../services/twoFactor';
import { useNotifications } from '../../contexts/NotificationContext';

interface TwoFactorDisableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TwoFactorDisableModal: React.FC<TwoFactorDisableModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showNotification } = useNotifications();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDisable = async () => {
    if (!code.trim()) {
      showNotification({
        type: 'error',
        title: 'Code required',
        message: 'Please enter a verification code or recovery code.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await twoFactorService.disable(code);
      showNotification({
        type: 'success',
        title: '2FA disabled',
        message: 'Two-factor authentication has been disabled for your account.',
      });
      onSuccess();
      onClose();
      setCode('');
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Disable failed',
        message: error?.response?.data?.error || 'Invalid code. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Disable Two-Factor Authentication">
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
              Are you sure?
            </h3>
            <p className="text-body-sm" style={{ color: 'var(--status-warning)' }}>
              Disabling 2FA will reduce the security of your account. You'll need to enter a verification code or recovery code to confirm.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Enter verification code or recovery code
          </label>
          <Input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="000000 or XXXX-XXXX"
            className="font-mono"
          />
          <p className="text-caption mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Enter a 6-digit code from your authenticator app or a recovery code
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleClose} className="flex-1" disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="danger"
            onClick={handleDisable} 
            isLoading={isLoading}
            disabled={!code.trim()}
            className="flex-1"
          >
            Disable 2FA
          </Button>
        </div>
      </div>
    </Modal>
  );
};


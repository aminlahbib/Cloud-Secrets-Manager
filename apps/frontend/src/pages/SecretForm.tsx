import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useProjectSecret, useSaveSecret } from '../hooks/useSecrets';
import { useNotifications } from '../contexts/NotificationContext';
import { useI18n } from '../contexts/I18nContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import type { SecretFormValues } from '../types';

export const SecretFormPage: React.FC = () => {
  const { projectId, key: keyParam } = useParams<{ projectId: string; key: string }>();
  const secretKey = keyParam ? decodeURIComponent(keyParam) : '';
  const navigate = useNavigate();
  const { showNotification } = useNotifications();
  const { t } = useI18n();
  const isEditMode = !!secretKey;
  const isProjectScoped = !!projectId;

  // Redirect if not in project context
  useEffect(() => {
    if (!isProjectScoped) {
      navigate('/home');
    }
  }, [isProjectScoped, navigate]);

  // Fetch existing secret for editing
  const { data: existingSecret, isLoading } = useProjectSecret(projectId!, secretKey, isEditMode && !!projectId);

  const mutation = useSaveSecret(projectId!, isEditMode);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload: SecretFormValues = {
      key: formData.get('key') as string,
      value: formData.get('value') as string,
      description: (formData.get('description') as string) || '', // Send empty string if empty
      expiresAt: formData.get('expiresAt') ? new Date(formData.get('expiresAt') as string) : undefined,
    };

    if (isEditMode) {
      payload.key = secretKey;
    }

    if (!payload.key || !payload.value) {
      showNotification({
        type: 'error',
        title: t('common.error'),
        message: t('secrets.form.validationRequired'),
      });
      return;
    }

    mutation.mutate(payload, {
      onSuccess: (result) => {
        const targetKey = result.key || result.secretKey || payload.key;
        showNotification({
          type: 'success',
          title: isEditMode ? t('secrets.form.updatedTitle') : t('secrets.form.createdTitle'),
          message: isEditMode
            ? t('secrets.form.updatedMessage', { key: targetKey })
            : t('secrets.form.createdMessage', { key: targetKey }),
        });
        navigate(`/projects/${projectId}/secrets/${encodeURIComponent(targetKey)}`);
      },
      onError: (error: any) => {
        showNotification({
          type: 'error',
          title: isEditMode ? t('secrets.form.updateFailedTitle') : t('secrets.form.createFailedTitle'),
          message:
            error?.response?.data?.message ||
            error?.message ||
            (isEditMode ? t('secrets.form.updateFailedFallback') : t('secrets.form.createFailedFallback')),
        });
      },
    });
  };

  if (!isProjectScoped) {
    return null; // Will redirect
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-10 px-4 transition-colors relative"
      style={{ backgroundColor: 'var(--page-bg)' }}
    >
      <div className="absolute top-4 right-4">
        <LanguageSelector iconOnly={true} />
      </div>
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="inline-flex items-center text-body-sm font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('secrets.form.backToProject')}
        </button>

        <div 
          className="border rounded-[24px] shadow-sm p-8 space-y-6 transition-colors card"
          style={{
            borderColor: 'var(--card-border)',
          }}
        >
          <div>
            <h1 className="text-h1 font-semibold" style={{ color: 'var(--text-primary)' }}>
              {isEditMode ? t('secrets.form.editTitle') : t('secrets.form.createTitle')}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="key" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t('secrets.form.keyLabel')}
              </label>
              <Input
                id="key"
                name="key"
                defaultValue={isEditMode ? secretKey : ''}
                placeholder={t('secrets.form.keyPlaceholder')}
                disabled={isEditMode}
                required={!isEditMode}
              />
              {isEditMode && (
                <p className="text-body-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {t('secrets.form.keyEditHint')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="value" className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t('secrets.form.valueLabel')}
              </label>
              <Textarea
                id="value"
                name="value"
                defaultValue={existingSecret?.value || ''}
                placeholder={t('secrets.form.valuePlaceholder')}
                rows={4}
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t('secrets.form.descriptionLabel')}
              </label>
              <Textarea
                id="description"
                name="description"
                defaultValue={existingSecret?.description || ''}
                placeholder={t('secrets.form.descriptionPlaceholder')}
                rows={2}
              />
            </div>

            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t('secrets.form.expiresAtLabel')}
              </label>
              <Input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                defaultValue={existingSecret?.expiresAt ? new Date(existingSecret.expiresAt).toISOString().slice(0, 16) : ''}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/projects/${projectId}`)}
                className="px-6"
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="px-6">
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? t('secrets.form.updating') : t('secrets.form.creating')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? t('secrets.form.updateCta') : t('secrets.form.createCta')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

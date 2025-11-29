import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-body-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            {label}
            {props.required && <span className="ml-1" style={{ color: 'var(--status-danger)' }}>*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--text-tertiary)' }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'input-theme',
              icon ? 'pl-10 pr-3' : 'px-3',
              error ? 'border-red-500 focus:ring-red-500' : '',
              className
            )}
            style={{
              borderColor: error ? 'var(--status-danger)' : undefined,
            }}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-body-sm" style={{ color: 'var(--status-danger)' }}>{error}</p>}
        {helperText && !error && <p className="mt-1 text-body-sm" style={{ color: 'var(--text-secondary)' }}>{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';


import { forwardRef } from 'react';
import { type LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, iconPosition = 'left', className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-navy-700">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Icon className="h-5 w-5 text-navy-400" />
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-navy-900
              placeholder:text-navy-400
              transition-colors duration-200
              focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20
              disabled:cursor-not-allowed disabled:bg-navy-50 disabled:text-navy-500
              ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' : 'border-navy-200'}
              ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          {Icon && iconPosition === 'right' && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <Icon className="h-5 w-5 text-navy-400" />
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-error-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down';
  };
  icon: LucideIcon;
  iconColor?: 'navy' | 'success' | 'warning' | 'error';
}

const iconColorClasses = {
  navy: 'bg-navy-100 text-navy-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-error-50 text-error-600',
};

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'navy',
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-navy-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">
            {value}
          </p>
          {change && (
            <p
              className={`mt-2 flex items-center text-sm font-medium ${
                change.trend === 'up' ? 'text-success-600' : 'text-error-600'
              }`}
            >
              <span
                className={`mr-1 ${change.trend === 'up' ? 'rotate-0' : 'rotate-180'}`}
              >
                ↑
              </span>
              {change.value}%
              <span className="ml-1 font-normal text-navy-400">vs mois dernier</span>
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${iconColorClasses[iconColor]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

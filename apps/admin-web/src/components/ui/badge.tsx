type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-navy-100 text-navy-700',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-error-50 text-error-600',
  info: 'bg-navy-100 text-navy-600',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
}

// Status-specific badges for common use cases
export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
    // Documents
    pending: { label: 'En attente', variant: 'warning' },
    approved: { label: 'Approuvé', variant: 'success' },
    rejected: { label: 'Refusé', variant: 'error' },
    incomplete: { label: 'Incomplet', variant: 'default' },
    complete: { label: 'Complet', variant: 'success' },
    // Orders
    completed: { label: 'Complété', variant: 'success' },
    failed: { label: 'Échoué', variant: 'error' },
    // Sessions / Enrollments
    assigned: { label: 'Confirmé', variant: 'success' },
    confirmed: { label: 'Confirmé', variant: 'success' },
    cancelled: { label: 'Annulé', variant: 'error' },
    noshow: { label: 'Absent', variant: 'error' },
    // Sites
    active: { label: 'Actif', variant: 'success' },
    inactive: { label: 'Inactif', variant: 'default' },
  };

  const config = statusMap[status] || { label: status, variant: 'default' as BadgeVariant };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';
import type { Profile } from '@/lib/supabase/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile with role - explicitly typed
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, primary_site_id')
    .eq('user_id', user.id)
    .single<Pick<Profile, 'full_name' | 'role' | 'primary_site_id'>>();

  // Check if user has admin/manager/instructor role
  const allowedRoles = ['admin', 'manager', 'instructor'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/login?error=unauthorized');
  }

  const userInfo = {
    email: user.email || '',
    name: profile.full_name || user.email || 'Utilisateur',
    role: profile.role as 'admin' | 'manager' | 'instructor',
  };

  return (
    <div className="flex h-screen bg-navy-50">
      <AdminSidebar userRole={userInfo.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={userInfo} />
        <main className="flex-1 overflow-y-auto bg-navy-50/50 p-6">{children}</main>
      </div>
    </div>
  );
}

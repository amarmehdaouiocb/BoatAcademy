import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

type Stats = {
  documentsApproved: number;
  documentsTotal: number;
  upcomingEnrollments: number;
  unreadMessages: number;
};

export default function HomeScreen() {
  const { user, profile, student } = useAuth();
  const [stats, setStats] = useState<Stats>({
    documentsApproved: 0,
    documentsTotal: 4,
    upcomingEnrollments: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch documents count
      const { data: docs } = await supabase
        .from('documents')
        .select('status')
        .eq('user_id', user.id);

      const approvedDocs = docs?.filter((d) => d.status === 'approved').length || 0;

      // Fetch upcoming enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          id,
          session:sessions!inner(starts_at)
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .gte('session.starts_at', new Date().toISOString());

      // Fetch unread messages
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .neq('sender_id', user.id)
        .eq('is_read', false)
        .in(
          'thread_id',
          student?.site_id
            ? (
                await supabase
                  .from('message_threads')
                  .select('id')
                  .eq('student_user_id', user.id)
              ).data?.map((t) => t.id) || []
            : []
        );

      setStats({
        documentsApproved: approvedDocs,
        documentsTotal: 4,
        upcomingEnrollments: enrollments?.length || 0,
        unreadMessages: unreadCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, student?.site_id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon apres-midi';
    return 'Bonsoir';
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Stagiaire';

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0f172a" />
      </SafeAreaView>
    );
  }

  // Determine next step message
  const getNextStep = () => {
    if (stats.documentsApproved < stats.documentsTotal) {
      return {
        title: 'Completez votre dossier',
        description: `Il vous reste ${stats.documentsTotal - stats.documentsApproved} document(s) a valider pour finaliser votre inscription.`,
        icon: '📄',
        href: '/documents',
      };
    }
    if (stats.upcomingEnrollments === 0) {
      return {
        title: 'Inscrivez-vous a une session',
        description: 'Votre dossier est complet ! Vous pouvez maintenant vous inscrire aux sessions de formation.',
        icon: '📅',
        href: '/sessions',
      };
    }
    return {
      title: 'Vous etes pret !',
      description: `Vous avez ${stats.upcomingEnrollments} session(s) a venir. Consultez votre planning.`,
      icon: '✅',
      href: '/sessions',
    };
  };

  const nextStep = getNextStep();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {firstName} 👋
          </Text>
          <Text className="mt-1 text-gray-600">Bienvenue sur Boat Academy</Text>
        </View>

        {/* Quick Stats */}
        <View className="mb-6 flex-row space-x-4">
          <StatCard
            title="Documents"
            value={`${stats.documentsApproved}/${stats.documentsTotal}`}
            color={stats.documentsApproved === stats.documentsTotal ? 'green' : 'blue'}
          />
          <StatCard title="Sessions" value={String(stats.upcomingEnrollments)} color="green" />
        </View>

        {/* Next Step Card */}
        <Link href={nextStep.href as any} asChild>
          <Pressable className="mb-6 rounded-xl bg-navy-900 p-4 active:bg-navy-800">
            <View className="flex-row items-start">
              <Text className="mr-4 text-3xl">{nextStep.icon}</Text>
              <View className="flex-1">
                <Text className="font-semibold text-white">{nextStep.title}</Text>
                <Text className="mt-1 text-sm text-navy-200">{nextStep.description}</Text>
              </View>
            </View>
          </Pressable>
        </Link>

        {/* Actions */}
        <View className="mb-6">
          <Text className="mb-4 text-lg font-semibold text-gray-900">Actions rapides</Text>
          <View className="space-y-3">
            <ActionCard
              icon="📄"
              title="Mes documents"
              description="Gerez vos documents administratifs"
              href="/documents"
              badge={
                stats.documentsApproved < stats.documentsTotal
                  ? `${stats.documentsTotal - stats.documentsApproved} manquant(s)`
                  : undefined
              }
            />
            <ActionCard
              icon="📅"
              title="Sessions de formation"
              description="Inscrivez-vous aux prochaines sessions"
              href="/sessions"
            />
            <ActionCard
              icon="💬"
              title="Messages"
              description="Echangez avec l'ecole"
              href="/messages"
              badge={stats.unreadMessages > 0 ? `${stats.unreadMessages} nouveau(x)` : undefined}
            />
          </View>
        </View>

        {/* Site info */}
        {student?.site?.name && (
          <View className="rounded-xl bg-navy-50 p-4">
            <Text className="text-sm font-medium text-navy-600">Votre site de formation</Text>
            <Text className="mt-1 text-lg font-semibold text-navy-900">{student.site.name}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: 'blue' | 'green' }) {
  const bgColor = color === 'blue' ? 'bg-blue-50' : 'bg-green-50';
  const textColor = color === 'blue' ? 'text-blue-600' : 'text-green-600';

  return (
    <View className={`flex-1 rounded-xl ${bgColor} p-4`}>
      <Text className="text-sm text-gray-600">{title}</Text>
      <Text className={`mt-1 text-2xl font-bold ${textColor}`}>{value}</Text>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  description,
  href,
  badge,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
}) {
  return (
    <Link href={href as any} asChild>
      <Pressable className="flex-row items-center rounded-xl bg-white p-4 active:bg-gray-50">
        <Text className="mr-4 text-3xl">{icon}</Text>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="font-semibold text-gray-900">{title}</Text>
            {badge && (
              <View className="ml-2 rounded-full bg-red-100 px-2 py-0.5">
                <Text className="text-xs font-medium text-red-600">{badge}</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-gray-600">{description}</Text>
        </View>
        <Text className="text-gray-400">›</Text>
      </Pressable>
    </Link>
  );
}

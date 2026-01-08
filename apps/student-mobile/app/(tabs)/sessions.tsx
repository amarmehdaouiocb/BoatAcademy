import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

type Session = {
  id: string;
  type: 'theory' | 'practice';
  starts_at: string;
  ends_at: string;
  capacity: number;
  location: string | null;
  site: {
    name: string;
  } | null;
  instructor: {
    full_name: string | null;
  } | null;
  enrollments: { id: string }[];
};

type Enrollment = {
  id: string;
  session_id: string;
  status: 'assigned' | 'cancelled' | 'noshow' | 'completed';
  session: Session;
};

type Tab = 'available' | 'enrolled';

export default function SessionsScreen() {
  const { user, student } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('available');
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user?.id || !student?.site_id) return;

    try {
      // Fetch available sessions for the student's site
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          type,
          starts_at,
          ends_at,
          capacity,
          location,
          site:sites(name),
          instructor:profiles!sessions_instructor_user_id_fkey(full_name),
          enrollments(id)
        `)
        .eq('site_id', student.site_id)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
      } else {
        setAvailableSessions(sessionsData as unknown as Session[]);
      }

      // Fetch student's enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          session_id,
          status,
          session:sessions(
            id,
            type,
            starts_at,
            ends_at,
            capacity,
            location,
            site:sites(name),
            instructor:profiles!sessions_instructor_user_id_fkey(full_name),
            enrollments(id)
          )
        `)
        .eq('student_user_id', user.id)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
      } else {
        setEnrollments(enrollmentsData as unknown as Enrollment[]);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, student?.site_id]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSessions();
  }, [fetchSessions]);

  const isEnrolled = (sessionId: string): boolean => {
    return enrollments.some((e) => e.session_id === sessionId && e.status !== 'cancelled');
  };

  const handleEnroll = async (session: Session) => {
    if (!user?.id || !student?.site_id) return;

    const enrolled = session.enrollments?.length || 0;
    const remaining = session.capacity - enrolled;

    if (remaining <= 0) {
      Alert.alert('Session complète', 'Cette session est déjà complète.');
      return;
    }

    // Vérifier si le numéro OEDIPP est requis pour les sessions pratiques
    if (session.type === 'practice' && !student.oedipp_number) {
      Alert.alert(
        'Numéro OEDIPP requis',
        'Pour vous inscrire à une session de pratique, vous devez d\'abord renseigner votre numéro OEDIPP dans votre profil.',
        [
          { text: 'Plus tard', style: 'cancel' },
          {
            text: 'Aller au profil',
            onPress: () => {
              // Navigation vers le profil gérée par les tabs
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      "S'inscrire à la session",
      `Voulez-vous vous inscrire à la session de ${session.type === 'theory' ? 'théorie' : 'pratique'} du ${formatDate(session.starts_at)} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: "S'inscrire",
          onPress: async () => {
            setEnrollingId(session.id);
            try {
              const { error } = await supabase.from('enrollments').insert({
                site_id: student.site_id,
                session_id: session.id,
                student_user_id: user.id,
                status: 'assigned',
              });

              if (error) {
                if (error.message.includes('unique')) {
                  Alert.alert('Erreur', 'Vous êtes déjà inscrit à cette session.');
                } else {
                  throw error;
                }
              } else {
                Alert.alert('Succès', 'Vous êtes inscrit à la session.');
                await fetchSessions();
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message || "Impossible de s'inscrire.");
            } finally {
              setEnrollingId(null);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async (enrollment: Enrollment) => {
    Alert.alert(
      'Annuler inscription',
      'Voulez-vous vraiment annuler votre inscription à cette session ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('enrollments')
                .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
                .eq('id', enrollment.id);

              if (error) throw error;

              Alert.alert('Succès', 'Votre inscription a été annulée.');
              await fetchSessions();
            } catch (error: any) {
              Alert.alert('Erreur', error.message || "Impossible d'annuler l'inscription.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0f172a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 pb-4 pt-6">
          <Text className="text-2xl font-bold text-gray-900">Sessions</Text>
          <Text className="mt-1 text-gray-600">
            Consultez et inscrivez-vous aux sessions de formation
          </Text>
        </View>

        {/* Tabs */}
        <View className="mx-6 my-4 flex-row rounded-xl bg-white p-1">
          <Pressable
            onPress={() => setActiveTab('available')}
            className={`flex-1 rounded-lg py-3 ${activeTab === 'available' ? 'bg-navy-600' : ''}`}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === 'available' ? 'text-white' : 'text-gray-600'
              }`}
            >
              À venir ({availableSessions.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('enrolled')}
            className={`flex-1 rounded-lg py-3 ${activeTab === 'enrolled' ? 'bg-navy-600' : ''}`}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === 'enrolled' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Mes inscriptions ({enrollments.length})
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1 px-6"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {activeTab === 'available' ? (
            availableSessions.length === 0 ? (
              <EmptyState
                icon="📅"
                title="Aucune session"
                description="Les prochaines sessions de formation apparaîtront ici"
              />
            ) : (
              <View className="space-y-3 pb-6">
                {availableSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isEnrolled={isEnrolled(session.id)}
                    enrolling={enrollingId === session.id}
                    onEnroll={() => handleEnroll(session)}
                    needsOedipp={session.type === 'practice' && !student?.oedipp_number}
                  />
                ))}
              </View>
            )
          ) : enrollments.length === 0 ? (
            <EmptyState
              icon="📝"
              title="Aucune inscription"
              description="Inscrivez-vous à une session pour la voir apparaître ici"
            />
          ) : (
            <View className="space-y-3 pb-6">
              {enrollments.map((enrollment) => (
                <EnrollmentCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  onCancel={() => handleCancel(enrollment)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SessionCard({
  session,
  isEnrolled,
  enrolling,
  onEnroll,
  needsOedipp,
}: {
  session: Session;
  isEnrolled: boolean;
  enrolling: boolean;
  onEnroll: () => void;
  needsOedipp?: boolean;
}) {
  const enrolled = session.enrollments?.length || 0;
  const remaining = session.capacity - enrolled;
  const isFull = remaining <= 0;

  return (
    <View className="rounded-xl bg-white p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row flex-wrap items-center">
            <View
              className={`rounded-full px-3 py-1 ${
                session.type === 'theory' ? 'bg-blue-100' : 'bg-green-100'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  session.type === 'theory' ? 'text-blue-700' : 'text-green-700'
                }`}
              >
                {session.type === 'theory' ? 'Théorie' : 'Pratique'}
              </Text>
            </View>
            {isFull && (
              <View className="ml-2 rounded-full bg-red-100 px-3 py-1">
                <Text className="text-xs font-medium text-red-700">Complet</Text>
              </View>
            )}
            {needsOedipp && !isFull && !isEnrolled && (
              <View className="ml-2 rounded-full bg-orange-100 px-3 py-1">
                <Text className="text-xs font-medium text-orange-700">OEDIPP requis</Text>
              </View>
            )}
          </View>

          <Text className="mt-3 text-lg font-semibold text-gray-900">{formatDate(session.starts_at)}</Text>
          <Text className="text-gray-600">
            {formatTime(session.starts_at)} - {formatTime(session.ends_at)}
          </Text>

          <View className="mt-3 space-y-1">
            {session.location && (
              <Text className="text-sm text-gray-500">📍 {session.location}</Text>
            )}
            {session.instructor?.full_name && (
              <Text className="text-sm text-gray-500">👤 {session.instructor.full_name}</Text>
            )}
            <Text className="text-sm text-gray-500">
              👥 {enrolled}/{session.capacity} inscrits
            </Text>
          </View>
        </View>

        {!isEnrolled && !isFull && (
          <Pressable
            onPress={onEnroll}
            disabled={enrolling}
            className={`rounded-lg px-4 py-2 ${enrolling ? 'bg-navy-300' : 'bg-navy-600'}`}
          >
            {enrolling ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="font-medium text-white">S'inscrire</Text>
            )}
          </Pressable>
        )}

        {isEnrolled && (
          <View className="rounded-lg bg-green-100 px-4 py-2">
            <Text className="font-medium text-green-700">Inscrit</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function EnrollmentCard({
  enrollment,
  onCancel,
}: {
  enrollment: Enrollment;
  onCancel: () => void;
}) {
  const session = enrollment.session;
  const isPast = new Date(session.starts_at) < new Date();

  const statusConfig = {
    assigned: { label: 'Confirmé', color: 'bg-green-100 text-green-700' },
    completed: { label: 'Terminé', color: 'bg-blue-100 text-blue-700' },
    noshow: { label: 'Absent', color: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-600' },
  };

  const statusInfo = statusConfig[enrollment.status];

  return (
    <View className="rounded-xl bg-white p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center">
            <View
              className={`rounded-full px-3 py-1 ${
                session.type === 'theory' ? 'bg-blue-100' : 'bg-green-100'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  session.type === 'theory' ? 'text-blue-700' : 'text-green-700'
                }`}
              >
                {session.type === 'theory' ? 'Théorie' : 'Pratique'}
              </Text>
            </View>
            <View className={`ml-2 rounded-full px-3 py-1 ${statusInfo.color}`}>
              <Text className="text-xs font-medium">{statusInfo.label}</Text>
            </View>
          </View>

          <Text className="mt-3 text-lg font-semibold text-gray-900">{formatDate(session.starts_at)}</Text>
          <Text className="text-gray-600">
            {formatTime(session.starts_at)} - {formatTime(session.ends_at)}
          </Text>

          <View className="mt-3 space-y-1">
            {session.location && (
              <Text className="text-sm text-gray-500">📍 {session.location}</Text>
            )}
            {session.instructor?.full_name && (
              <Text className="text-sm text-gray-500">👤 {session.instructor.full_name}</Text>
            )}
          </View>
        </View>

        {!isPast && enrollment.status === 'assigned' && (
          <Pressable onPress={onCancel} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <Text className="text-sm font-medium text-red-600">Annuler</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-1 items-center justify-center py-12">
      <Text className="text-5xl">{icon}</Text>
      <Text className="mt-4 text-lg font-semibold text-gray-900">{title}</Text>
      <Text className="mt-2 text-center text-gray-600">{description}</Text>
    </View>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

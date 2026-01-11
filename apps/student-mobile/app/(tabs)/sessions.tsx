import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AnimatedPressable } from '../../src/components/ui';

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Succès', 'Vous êtes inscrit à la session.');
                await fetchSessions();
              }
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            try {
              const { error } = await supabase
                .from('enrollments')
                .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
                .eq('id', enrollment.id);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Succès', 'Votre inscription a été annulée.');
              await fetchSessions();
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Erreur', error.message || "Impossible d'annuler l'inscription.");
            }
          },
        },
      ]
    );
  };

  const handleTabChange = (tab: Tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#020617', '#0a1628', '#0f1f35']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Chargement des sessions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0a1628', '#0f1f35']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient glow effects */}
      <View style={styles.glowContainer}>
        <View style={[styles.glow, styles.glowTopRight]} />
        <View style={[styles.glow, styles.glowBottomLeft]} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.headerTitle}>Sessions</Text>
          <Text style={styles.headerSubtitle}>
            Inscrivez-vous aux formations
          </Text>
        </Animated.View>

        {/* Glass Tab Bar */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.tabBarContainer}>
          <BlurView intensity={40} tint="dark" style={styles.tabBar}>
            <Pressable
              onPress={() => handleTabChange('available')}
              style={[
                styles.tab,
                activeTab === 'available' && styles.activeTab,
              ]}
            >
              <Text style={[styles.tabIcon, activeTab === 'available' && styles.activeTabIcon]}>📅</Text>
              <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
                À venir
              </Text>
              <View style={[styles.tabBadge, activeTab === 'available' && styles.activeTabBadge]}>
                <Text style={[styles.tabBadgeText, activeTab === 'available' && styles.activeTabBadgeText]}>
                  {availableSessions.length}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => handleTabChange('enrolled')}
              style={[
                styles.tab,
                activeTab === 'enrolled' && styles.activeTab,
              ]}
            >
              <Text style={[styles.tabIcon, activeTab === 'enrolled' && styles.activeTabIcon]}>✅</Text>
              <Text style={[styles.tabText, activeTab === 'enrolled' && styles.activeTabText]}>
                Mes inscriptions
              </Text>
              <View style={[styles.tabBadge, activeTab === 'enrolled' && styles.activeTabBadge]}>
                <Text style={[styles.tabBadgeText, activeTab === 'enrolled' && styles.activeTabBadgeText]}>
                  {enrollments.length}
                </Text>
              </View>
            </Pressable>
          </BlurView>
        </Animated.View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0ea5e9"
            />
          }
        >
          {activeTab === 'available' ? (
            availableSessions.length === 0 ? (
              <EmptyState
                icon="📅"
                title="Aucune session"
                description="Les prochaines sessions de formation apparaîtront ici"
              />
            ) : (
              <View style={styles.cardList}>
                {availableSessions.map((session, index) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isEnrolled={isEnrolled(session.id)}
                    enrolling={enrollingId === session.id}
                    onEnroll={() => handleEnroll(session)}
                    needsOedipp={session.type === 'practice' && !student?.oedipp_number}
                    delay={index * 80}
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
            <View style={styles.cardList}>
              {enrollments.map((enrollment, index) => (
                <EnrollmentCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  onCancel={() => handleCancel(enrollment)}
                  delay={index * 80}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SessionCard({
  session,
  isEnrolled,
  enrolling,
  onEnroll,
  needsOedipp,
  delay = 0,
}: {
  session: Session;
  isEnrolled: boolean;
  enrolling: boolean;
  onEnroll: () => void;
  needsOedipp?: boolean;
  delay?: number;
}) {
  const enrolled = session.enrollments?.length || 0;
  const remaining = session.capacity - enrolled;
  const isFull = remaining <= 0;
  const progress = enrolled / session.capacity;

  const isTheory = session.type === 'theory';
  const gradientColors = isTheory
    ? ['#0ea5e9', '#0284c7'] // Ocean blue for theory
    : ['#10b981', '#059669']; // Emerald for practice

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <AnimatedPressable onPress={onEnroll} haptic={!isEnrolled && !isFull}>
        <BlurView intensity={25} tint="dark" style={styles.sessionCard}>
          {/* Top section with type badge and capacity */}
          <View style={styles.sessionHeader}>
            <LinearGradient
              colors={gradientColors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.typeBadge}
            >
              <Text style={styles.typeBadgeIcon}>{isTheory ? '📚' : '⛵'}</Text>
              <Text style={styles.typeBadgeText}>
                {isTheory ? 'Théorie' : 'Pratique'}
              </Text>
            </LinearGradient>

            <View style={styles.statusBadges}>
              {isFull && (
                <View style={styles.fullBadge}>
                  <Text style={styles.fullBadgeText}>Complet</Text>
                </View>
              )}
              {needsOedipp && !isFull && !isEnrolled && (
                <View style={styles.oedippBadge}>
                  <Text style={styles.oedippBadgeText}>OEDIPP requis</Text>
                </View>
              )}
              {isEnrolled && (
                <View style={styles.enrolledBadge}>
                  <Text style={styles.enrolledBadgeIcon}>✓</Text>
                  <Text style={styles.enrolledBadgeText}>Inscrit</Text>
                </View>
              )}
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.dateTimeSection}>
            <Text style={styles.sessionDate}>{formatDate(session.starts_at)}</Text>
            <Text style={styles.sessionTime}>
              {formatTime(session.starts_at)} → {formatTime(session.ends_at)}
            </Text>
          </View>

          {/* Details */}
          <View style={styles.detailsSection}>
            {session.location && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.detailText}>{session.location}</Text>
              </View>
            )}
            {session.instructor?.full_name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>👨‍🏫</Text>
                <Text style={styles.detailText}>{session.instructor.full_name}</Text>
              </View>
            )}
          </View>

          {/* Capacity indicator */}
          <View style={styles.capacitySection}>
            <View style={styles.capacityHeader}>
              <Text style={styles.capacityLabel}>Places</Text>
              <Text style={styles.capacityValue}>{enrolled}/{session.capacity}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={progress >= 1 ? ['#ef4444', '#dc2626'] : gradientColors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${Math.min(progress * 100, 100)}%` }]}
              />
            </View>
          </View>

          {/* Action button */}
          {!isEnrolled && !isFull && (
            <AnimatedPressable onPress={onEnroll} disabled={enrolling} hapticStyle="medium">
              <LinearGradient
                colors={gradientColors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.enrollButton}
              >
                {enrolling ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.enrollButtonText}>S'inscrire</Text>
                )}
              </LinearGradient>
            </AnimatedPressable>
          )}
        </BlurView>
      </AnimatedPressable>
    </Animated.View>
  );
}

function EnrollmentCard({
  enrollment,
  onCancel,
  delay = 0,
}: {
  enrollment: Enrollment;
  onCancel: () => void;
  delay?: number;
}) {
  const session = enrollment.session;
  const isPast = new Date(session.starts_at) < new Date();
  const isTheory = session.type === 'theory';

  const statusConfig = {
    assigned: {
      label: 'Confirmé',
      icon: '✅',
      colors: ['#10b981', '#059669'],
    },
    completed: {
      label: 'Terminé',
      icon: '🎉',
      colors: ['#0ea5e9', '#0284c7'],
    },
    noshow: {
      label: 'Absent',
      icon: '❌',
      colors: ['#ef4444', '#dc2626'],
    },
    cancelled: {
      label: 'Annulé',
      icon: '🚫',
      colors: ['#6b7280', '#4b5563'],
    },
  };

  const statusInfo = statusConfig[enrollment.status];
  const gradientColors = isTheory
    ? ['#0ea5e9', '#0284c7']
    : ['#10b981', '#059669'];

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <BlurView intensity={25} tint="dark" style={styles.sessionCard}>
        {/* Header with type and status */}
        <View style={styles.sessionHeader}>
          <LinearGradient
            colors={gradientColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.typeBadge}
          >
            <Text style={styles.typeBadgeIcon}>{isTheory ? '📚' : '⛵'}</Text>
            <Text style={styles.typeBadgeText}>
              {isTheory ? 'Théorie' : 'Pratique'}
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={statusInfo.colors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusBadge}
          >
            <Text style={styles.statusBadgeIcon}>{statusInfo.icon}</Text>
            <Text style={styles.statusBadgeText}>{statusInfo.label}</Text>
          </LinearGradient>
        </View>

        {/* Date & Time */}
        <View style={styles.dateTimeSection}>
          <Text style={styles.sessionDate}>{formatDate(session.starts_at)}</Text>
          <Text style={styles.sessionTime}>
            {formatTime(session.starts_at)} → {formatTime(session.ends_at)}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.detailsSection}>
          {session.location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>{session.location}</Text>
            </View>
          )}
          {session.instructor?.full_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>👨‍🏫</Text>
              <Text style={styles.detailText}>{session.instructor.full_name}</Text>
            </View>
          )}
        </View>

        {/* Cancel button for future sessions */}
        {!isPast && enrollment.status === 'assigned' && (
          <AnimatedPressable onPress={onCancel} hapticStyle="heavy">
            <View style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Annuler l'inscription</Text>
            </View>
          </AnimatedPressable>
        )}
      </BlurView>
    </Animated.View>
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
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.emptyState}>
      <BlurView intensity={20} tint="dark" style={styles.emptyStateCard}>
        <Text style={styles.emptyStateIcon}>{icon}</Text>
        <Text style={styles.emptyStateTitle}>{title}</Text>
        <Text style={styles.emptyStateDescription}>{description}</Text>
      </BlurView>
    </Animated.View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  safeArea: {
    flex: 1,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  glowTopRight: {
    top: -100,
    right: -100,
    width: 350,
    height: 350,
    backgroundColor: '#0ea5e9',
  },
  glowBottomLeft: {
    bottom: 100,
    left: -150,
    width: 300,
    height: 300,
    backgroundColor: '#10b981',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  tabBarContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(14,165,233,0.3)',
  },
  tabIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeTabBadge: {
    backgroundColor: 'rgba(14,165,233,0.5)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  activeTabBadgeText: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 100,
  },
  cardList: {
    gap: 16,
  },
  sessionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  typeBadgeIcon: {
    fontSize: 14,
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  fullBadge: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  fullBadgeText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
  },
  oedippBadge: {
    backgroundColor: 'rgba(251,146,60,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.3)',
  },
  oedippBadgeText: {
    color: '#fdba74',
    fontSize: 12,
    fontWeight: '600',
  },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    gap: 4,
  },
  enrolledBadgeIcon: {
    fontSize: 12,
    color: '#6ee7b7',
  },
  enrolledBadgeText: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  statusBadgeIcon: {
    fontSize: 12,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  dateTimeSection: {
    marginBottom: 16,
  },
  sessionDate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  sessionTime: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  detailsSection: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    fontSize: 14,
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  capacitySection: {
    marginBottom: 16,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capacityLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  capacityValue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  enrollButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  enrollButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  cancelButtonText: {
    color: '#fca5a5',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    paddingTop: 60,
  },
  emptyStateCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyStateIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
});

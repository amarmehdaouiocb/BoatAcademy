import { View, Text, ScrollView, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Link, Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AnimatedPressable } from '../../src/components/ui';

const { width } = Dimensions.get('window');

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

  // Animation values
  const waveRotation = useSharedValue(0);

  useEffect(() => {
    // Subtle wave animation for greeting
    waveRotation.value = withRepeat(
      withSequence(
        withSpring(15, { damping: 3 }),
        withSpring(-15, { damping: 3 }),
        withSpring(0, { damping: 3 })
      ),
      -1,
      false
    );
  }, []);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${waveRotation.value}deg` }],
  }));

  const fetchStats = useCallback(async () => {
    if (!user?.id || !student?.site_id) return;

    try {
      const { count: totalDocTypes } = await supabase
        .from('document_types')
        .select('id', { count: 'exact', head: true });

      const { data: docs } = await supabase
        .from('student_documents')
        .select('status')
        .eq('student_user_id', user.id)
        .eq('site_id', student.site_id);

      const approvedDocs = docs?.filter((d) => d.status === 'approved').length || 0;
      const documentsTotal = totalDocTypes || 4;

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`id, session:sessions!inner(starts_at)`)
        .eq('student_user_id', user.id)
        .eq('status', 'assigned')
        .gte('session.starts_at', new Date().toISOString());

      let unreadCount = 0;
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('student_user_id', user.id)
        .eq('site_id', student.site_id);

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map((c) => c.id);
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .neq('sender_user_id', user.id)
          .in('conversation_id', conversationIds);
        unreadCount = count || 0;
      }

      setStats({
        documentsApproved: approvedDocs,
        documentsTotal,
        upcomingEnrollments: enrollments?.length || 0,
        unreadMessages: unreadCount,
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Matelot';
  const progress = stats.documentsTotal > 0 ? (stats.documentsApproved / stats.documentsTotal) * 100 : 0;

  const getNextStep = () => {
    if (stats.documentsApproved < stats.documentsTotal) {
      return {
        title: 'Complétez votre dossier',
        description: `${stats.documentsTotal - stats.documentsApproved} document(s) restant(s)`,
        icon: '📋',
        href: '/documents' as Href,
        colors: ['#f97316', '#ea580c'],
      };
    }
    if (stats.upcomingEnrollments === 0) {
      return {
        title: 'Réservez une session',
        description: 'Votre dossier est prêt !',
        icon: '📅',
        href: '/sessions' as Href,
        colors: ['#0ea5e9', '#0284c7'],
      };
    }
    return {
      title: 'Prêt pour la navigation',
      description: `${stats.upcomingEnrollments} session(s) prévue(s)`,
      icon: '⛵',
      href: '/sessions' as Href,
      colors: ['#10b981', '#059669'],
    };
  };

  const nextStep = getNextStep();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#020617', '#0a1628', '#0f1f35']} style={StyleSheet.absoluteFill} />
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.loadingEmoji}>⚓</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0a1628', '#0f1f35']} style={StyleSheet.absoluteFill} />

      {/* Ambient glow effects */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{firstName}</Text>
              <Animated.Text style={[styles.wave, waveStyle]}>👋</Animated.Text>
            </View>
          </View>
          <Link href="/profile" asChild>
            <AnimatedPressable style={styles.avatar}>
              <LinearGradient
                colors={['#0ea5e9', '#8b5cf6']}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>
                  {profile?.full_name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </LinearGradient>
            </AnimatedPressable>
          </Link>
        </Animated.View>

        {/* Progress Card */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={styles.progressCard}>
            <BlurView intensity={20} tint="dark" style={styles.blur}>
              <View style={styles.progressContent}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Votre progression</Text>
                  <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <Animated.View
                    style={[styles.progressBarFill, { width: `${progress}%` }]}
                    entering={FadeInRight.delay(400).springify()}
                  />
                </View>
                <Text style={styles.progressSubtitle}>
                  {stats.documentsApproved}/{stats.documentsTotal} documents validés
                </Text>
              </View>
            </BlurView>
          </View>
        </Animated.View>

        {/* Next Step CTA */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Link href={nextStep.href} asChild>
            <AnimatedPressable hapticStyle="medium">
              <LinearGradient
                colors={nextStep.colors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaCard}
              >
                <View style={styles.ctaContent}>
                  <Text style={styles.ctaIcon}>{nextStep.icon}</Text>
                  <View style={styles.ctaText}>
                    <Text style={styles.ctaTitle}>{nextStep.title}</Text>
                    <Text style={styles.ctaDescription}>{nextStep.description}</Text>
                  </View>
                  <Text style={styles.ctaArrow}>→</Text>
                </View>
              </LinearGradient>
            </AnimatedPressable>
          </Link>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <Animated.View entering={FadeInDown.delay(400)} style={styles.statCard}>
            <BlurView intensity={15} tint="dark" style={styles.blur}>
              <View style={styles.statContent}>
                <Text style={styles.statEmoji}>📅</Text>
                <Text style={styles.statValue}>{stats.upcomingEnrollments}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
            </BlurView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500)} style={styles.statCard}>
            <BlurView intensity={15} tint="dark" style={styles.blur}>
              <View style={styles.statContent}>
                <Text style={styles.statEmoji}>💬</Text>
                <Text style={styles.statValue}>{stats.unreadMessages}</Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>
            </BlurView>
          </Animated.View>
        </View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(600)}>
          <Text style={styles.sectionTitle}>Accès rapide</Text>
        </Animated.View>

        <View style={styles.actionsGrid}>
          <ActionCard
            icon="📄"
            title="Documents"
            subtitle="Gérer mon dossier"
            href="/documents"
            delay={700}
            badge={stats.documentsApproved < stats.documentsTotal ? `${stats.documentsTotal - stats.documentsApproved}` : undefined}
          />
          <ActionCard
            icon="📅"
            title="Sessions"
            subtitle="Réserver une place"
            href="/sessions"
            delay={800}
          />
          <ActionCard
            icon="💬"
            title="Messages"
            subtitle="Contacter l'école"
            href="/messages"
            delay={900}
            badge={stats.unreadMessages > 0 ? `${stats.unreadMessages}` : undefined}
          />
          <ActionCard
            icon="👤"
            title="Profil"
            subtitle="Mes informations"
            href="/profile"
            delay={1000}
          />
        </View>

        {/* Site Info */}
        {student?.site?.name && (
          <Animated.View entering={FadeInDown.delay(1100)} style={styles.siteCard}>
            <BlurView intensity={15} tint="dark" style={styles.blur}>
              <View style={styles.siteContent}>
                <Text style={styles.siteIcon}>📍</Text>
                <View>
                  <Text style={styles.siteLabel}>Votre école</Text>
                  <Text style={styles.siteName}>{student.site.name}</Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  href,
  delay,
  badge,
}: {
  icon: string;
  title: string;
  subtitle: string;
  href: string;
  delay: number;
  badge?: string;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay)} style={styles.actionCard}>
      <Link href={href as Href} asChild>
        <AnimatedPressable style={styles.actionCardInner}>
          <BlurView intensity={15} tint="dark" style={styles.blur}>
            <View style={styles.actionContent}>
              <View style={styles.actionIconRow}>
                <Text style={styles.actionIcon}>{icon}</Text>
                {badge && (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.actionTitle}>{title}</Text>
              <Text style={styles.actionSubtitle}>{subtitle}</Text>
            </View>
          </BlurView>
        </AnimatedPressable>
      </Link>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
  },
  loadingEmoji: {
    fontSize: 64,
  },
  glowTop: {
    position: 'absolute',
    top: -150,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#0ea5e9',
    opacity: 0.12,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 100,
    left: -150,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: '#8b5cf6',
    opacity: 0.08,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  greeting: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  wave: {
    fontSize: 28,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  progressCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  blur: {
    flex: 1,
  },
  progressContent: {
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 4,
  },
  progressSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  ctaCard: {
    borderRadius: 24,
    marginBottom: 24,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  ctaIcon: {
    fontSize: 36,
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  ctaDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  ctaArrow: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statContent: {
    padding: 16,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionCardInner: {
    flex: 1,
  },
  actionContent: {
    padding: 16,
  },
  actionIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 32,
  },
  actionBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  siteCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  siteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  siteIcon: {
    fontSize: 24,
  },
  siteLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacer: {
    height: 100,
  },
});

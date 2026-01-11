import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AnimatedPressable } from '../../src/components/ui';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, student, signOut, loading, refreshProfile } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [oedippModalVisible, setOedippModalVisible] = useState(false);
  const [oedippNumber, setOedippNumber] = useState(student?.oedipp_number || '');
  const [savingOedipp, setSavingOedipp] = useState(false);

  const handleSaveOedipp = async () => {
    if (!user?.id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSavingOedipp(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ oedipp_number: oedippNumber.trim() || null })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      setOedippModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Numéro OEDIPP mis à jour.');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le numéro OEDIPP.');
    } finally {
      setSavingOedipp(false);
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await signOut();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter.');
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getInitials = (name: string | null): string => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#020617', '#0a1628', '#0f1f35']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Chargement...</Text>
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
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile header */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.profileHeader}>
            <LinearGradient
              colors={['#0ea5e9', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {getInitials(profile?.full_name ?? null)}
              </Text>
            </LinearGradient>
            <Text style={styles.profileName}>
              {profile?.full_name || 'Stagiaire'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {profile?.phone && (
              <View style={styles.phoneContainer}>
                <Text style={styles.phoneIcon}>📱</Text>
                <Text style={styles.phoneText}>{profile.phone}</Text>
              </View>
            )}
          </Animated.View>

          {/* Student info card */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <BlurView intensity={25} tint="dark" style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🎓</Text>
                <Text style={styles.cardTitle}>Informations stagiaire</Text>
              </View>

              <View style={styles.infoList}>
                <InfoRow
                  icon="📍"
                  label="Site de formation"
                  value={student?.site?.name || 'Non attribué'}
                />

                <AnimatedPressable
                  onPress={() => {
                    setOedippNumber(student?.oedipp_number || '');
                    setOedippModalVisible(true);
                  }}
                >
                  <View style={styles.infoRow}>
                    <View style={styles.infoLeft}>
                      <Text style={styles.infoIcon}>🆔</Text>
                      <Text style={styles.infoLabel}>Numéro OEDIPP</Text>
                    </View>
                    <View style={styles.infoRight}>
                      <Text
                        style={[
                          styles.infoValue,
                          !student?.oedipp_number && styles.infoValueWarning,
                        ]}
                      >
                        {student?.oedipp_number || 'À renseigner'}
                      </Text>
                      <Text style={styles.editIcon}>✎</Text>
                    </View>
                  </View>
                </AnimatedPressable>

                <InfoRow
                  icon="⏰"
                  label="Accès expire le"
                  value={formatDate(student?.access_expires_at || null)}
                  highlight={
                    student?.access_expires_at
                      ? new Date(student.access_expires_at) < new Date()
                      : false
                  }
                />
              </View>
            </BlurView>
          </Animated.View>

          {/* Account info card */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <BlurView intensity={25} tint="dark" style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>👤</Text>
                <Text style={styles.cardTitle}>Compte</Text>
              </View>

              <View style={styles.infoList}>
                <InfoRow icon="✉️" label="Email" value={user?.email || '-'} />
                <InfoRow icon="🎖️" label="Rôle" value="Stagiaire" />
                <InfoRow
                  icon="📅"
                  label="Compte créé le"
                  value={formatDate(user?.created_at || null)}
                />
              </View>
            </BlurView>
          </Animated.View>

          {/* Menu buttons */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.menuSection}>
            <MenuButton
              icon="📋"
              label="Conditions d'utilisation"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            />
            <MenuButton
              icon="🔒"
              label="Politique de confidentialité"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            />
            <MenuButton
              icon="❓"
              label="Aide et support"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            />
          </Animated.View>

          {/* Logout */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <AnimatedPressable onPress={handleLogout} disabled={loggingOut} hapticStyle="heavy">
              <View style={styles.logoutButton}>
                {loggingOut ? (
                  <ActivityIndicator size="small" color="#fca5a5" />
                ) : (
                  <>
                    <Text style={styles.logoutIcon}>🚪</Text>
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                  </>
                )}
              </View>
            </AnimatedPressable>
          </Animated.View>

          {/* Version */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <Text style={styles.versionText}>
              Boat Academy v1.0.0 - MVP
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Modal édition OEDIPP */}
      <Modal
        visible={oedippModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOedippModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Numéro OEDIPP</Text>
              <Pressable onPress={() => setOedippModalVisible(false)}>
                <Text style={styles.modalClose}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.modalDescription}>
              Votre numéro OEDIPP est nécessaire pour vous inscrire aux sessions de pratique.
              Vous pouvez l'obtenir auprès de votre école.
            </Text>

            <TextInput
              value={oedippNumber}
              onChangeText={setOedippNumber}
              placeholder="Ex: 123456789"
              keyboardType="numeric"
              maxLength={20}
              editable={!savingOedipp}
              style={styles.modalInput}
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setOedippModalVisible(false)}
                disabled={savingOedipp}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>
              <AnimatedPressable
                onPress={handleSaveOedipp}
                disabled={savingOedipp}
                hapticStyle="medium"
              >
                <LinearGradient
                  colors={['#0ea5e9', '#0284c7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSaveButton}
                >
                  {savingOedipp ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.modalSaveText}>Enregistrer</Text>
                  )}
                </LinearGradient>
              </AnimatedPressable>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Text style={styles.infoIcon}>{icon}</Text>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text
        style={[
          styles.infoValue,
          highlight && styles.infoValueHighlight,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function MenuButton({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable onPress={onPress}>
      <BlurView intensity={20} tint="dark" style={styles.menuButton}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text style={styles.menuLabel}>{label}</Text>
        <Text style={styles.menuArrow}>›</Text>
      </BlurView>
    </AnimatedPressable>
  );
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
  glowTop: {
    top: -150,
    left: '50%',
    marginLeft: -175,
    width: 350,
    height: 350,
    backgroundColor: '#8b5cf6',
  },
  glowBottom: {
    bottom: 100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: '#0ea5e9',
  },
  loadingText: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileName: {
    marginTop: 16,
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileEmail: {
    marginTop: 4,
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  phoneIcon: {
    fontSize: 14,
  },
  phoneText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  infoList: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoValueWarning: {
    color: '#fdba74',
  },
  infoValueHighlight: {
    color: '#fca5a5',
  },
  editIcon: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  menuSection: {
    gap: 12,
    marginBottom: 24,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  menuArrow: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.4)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    gap: 10,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fca5a5',
  },
  versionText: {
    marginTop: 32,
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalClose: {
    fontSize: 32,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 32,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24,
  },
  modalInput: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});

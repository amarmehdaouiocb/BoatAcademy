import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AnimatedPressable } from '../../src/components/ui';

type Site = {
  id: string;
  name: string;
  city: string | null;
};

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Site selection
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [siteModalVisible, setSiteModalVisible] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);

  // Fetch available sites on mount
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const { data, error } = await supabase
          .from('sites')
          .select('id, name, city')
          .order('name', { ascending: true });

        if (error) throw error;
        setSites(data || []);
      } catch (err) {
        console.error('Erreur lors du chargement des sites:', err);
      } finally {
        setLoadingSites(false);
      }
    };

    fetchSites();
  }, []);

  const handleRegister = async () => {
    // Validation
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!selectedSite) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setError('Veuillez sélectionner votre site de formation');
      return;
    }

    if (password.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setError(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { error: authError } = await signUp(
        email.trim().toLowerCase(),
        password,
        fullName.trim(),
        phone.trim() || undefined,
        selectedSite.id
      );

      if (authError) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (authError.message.includes('already registered')) {
          setError('Un compte existe déjà avec cet email');
        } else {
          setError(authError.message);
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(true);
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#020617', '#0a1628', '#0f1f35', '#0c4a6e']}
          locations={[0, 0.3, 0.6, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Ambient glow effects */}
        <View style={styles.glowContainer}>
          <View style={[styles.glow, styles.glowTop]} />
          <View style={[styles.glow, styles.glowBottom]} />
        </View>

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.successContent}>
            <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.successIconContainer}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.successIconGradient}
              >
                <Text style={styles.successIcon}>✓</Text>
              </LinearGradient>
            </Animated.View>

            <Animated.Text entering={FadeInUp.delay(400).duration(600)} style={styles.successTitle}>
              Inscription réussie !
            </Animated.Text>

            <Animated.View entering={FadeInUp.delay(500).duration(600)}>
              <BlurView intensity={20} tint="dark" style={styles.successMessageContainer}>
                <Text style={styles.successIcon2}>✉️</Text>
                <Text style={styles.successMessage}>
                  Un email de confirmation a été envoyé à{' '}
                  <Text style={styles.successEmail}>{email}</Text>
                  {'\n\n'}Veuillez cliquer sur le lien pour activer votre compte.
                </Text>
              </BlurView>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.successButtonContainer}>
              <AnimatedPressable
                onPress={() => router.replace('/login')}
                hapticStyle="medium"
              >
                <LinearGradient
                  colors={['#0ea5e9', '#0284c7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.successButton}
                >
                  <Text style={styles.successButtonText}>Retour à la connexion</Text>
                </LinearGradient>
              </AnimatedPressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0a1628', '#0f1f35', '#0c4a6e']}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient glow effects */}
      <View style={styles.glowContainer}>
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <Animated.View entering={FadeInDown.duration(800)} style={styles.logoContainer}>
              <LinearGradient
                colors={['#0ea5e9', '#0284c7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Text style={styles.logoEmoji}>⚓</Text>
              </LinearGradient>
              <Text style={styles.logoText}>Boat Academy</Text>
              <Text style={styles.logoSubtext}>Espace Stagiaire</Text>
            </Animated.View>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.header}>
              <Text style={styles.headerTitle}>Inscription</Text>
              <Text style={styles.headerSubtitle}>
                Créez votre compte stagiaire
              </Text>
            </Animated.View>

            {/* Error */}
            {error && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <BlurView intensity={20} tint="dark" style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </BlurView>
              </Animated.View>
            )}

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.form}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Nom complet <Text style={styles.required}>*</Text>
                </Text>
                <BlurView intensity={20} tint="dark" style={styles.inputWrapper}>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Jean Dupont"
                    autoCapitalize="words"
                    autoComplete="name"
                    editable={!loading}
                    style={styles.input}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </BlurView>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
                <BlurView intensity={20} tint="dark" style={styles.inputWrapper}>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="votre@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    editable={!loading}
                    style={styles.input}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </BlurView>
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Téléphone</Text>
                <BlurView intensity={20} tint="dark" style={styles.inputWrapper}>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="06 12 34 56 78"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    editable={!loading}
                    style={styles.input}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </BlurView>
              </View>

              {/* Site Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Site de formation <Text style={styles.required}>*</Text>
                </Text>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSiteModalVisible(true);
                  }}
                  disabled={loading || loadingSites}
                >
                  <BlurView intensity={20} tint="dark" style={styles.siteSelector}>
                    {loadingSites ? (
                      <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
                    ) : selectedSite ? (
                      <Text style={styles.siteSelectedText}>{selectedSite.name}</Text>
                    ) : (
                      <Text style={styles.sitePlaceholder}>Sélectionnez votre site</Text>
                    )}
                    <Text style={styles.siteArrow}>▼</Text>
                  </BlurView>
                </Pressable>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Mot de passe <Text style={styles.required}>*</Text>
                </Text>
                <BlurView intensity={20} tint="dark" style={styles.inputWrapper}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Minimum 6 caractères"
                    secureTextEntry
                    autoComplete="password-new"
                    editable={!loading}
                    style={styles.input}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </BlurView>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Confirmer le mot de passe <Text style={styles.required}>*</Text>
                </Text>
                <BlurView intensity={20} tint="dark" style={styles.inputWrapper}>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Retapez le mot de passe"
                    secureTextEntry
                    editable={!loading}
                    style={styles.input}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </BlurView>
              </View>

              {/* Submit Button */}
              <AnimatedPressable
                onPress={handleRegister}
                disabled={loading}
                hapticStyle="medium"
              >
                <LinearGradient
                  colors={loading ? ['#475569', '#334155'] : ['#0ea5e9', '#0284c7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButton}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.submitButtonText}>S'inscrire</Text>
                  )}
                </LinearGradient>
              </AnimatedPressable>
            </Animated.View>

            {/* Login link */}
            <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.loginContainer}>
              <Text style={styles.loginText}>Déjà un compte ? </Text>
              <Link href="/login" asChild>
                <Pressable disabled={loading}>
                  <Text style={styles.loginLink}>Se connecter</Text>
                </Pressable>
              </Link>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Site Selection Modal */}
      <Modal
        visible={siteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSiteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSiteModalVisible(false)}
          />
          <BlurView intensity={80} tint="dark" style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choisir un site</Text>
                <Text style={styles.modalSubtitle}>
                  Sélectionnez le site où vous suivrez votre formation
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSiteModalVisible(false);
                }}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {sites.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📍</Text>
                  <Text style={styles.emptyText}>Aucun site disponible</Text>
                </View>
              ) : (
                <View style={styles.siteList}>
                  {sites.map((site, index) => (
                    <Animated.View
                      key={site.id}
                      entering={FadeInDown.delay(index * 50).duration(400)}
                    >
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setSelectedSite(site);
                          setSiteModalVisible(false);
                        }}
                        style={styles.siteItem}
                      >
                        {selectedSite?.id === site.id ? (
                          <LinearGradient
                            colors={['rgba(14,165,233,0.2)', 'rgba(14,165,233,0.1)']}
                            style={[styles.siteItemInner, styles.siteItemSelected]}
                          >
                            <View style={styles.siteInfo}>
                              <Text style={[styles.siteName, styles.siteNameSelected]}>
                                {site.name}
                              </Text>
                              {site.city && (
                                <Text style={styles.siteCity}>📍 {site.city}</Text>
                              )}
                            </View>
                            <View style={styles.checkmark}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          </LinearGradient>
                        ) : (
                          <BlurView intensity={15} tint="dark" style={styles.siteItemInner}>
                            <View style={styles.siteInfo}>
                              <Text style={styles.siteName}>{site.name}</Text>
                              {site.city && (
                                <Text style={styles.siteCity}>📍 {site.city}</Text>
                              )}
                            </View>
                          </BlurView>
                        )}
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              )}
            </ScrollView>
          </BlurView>
        </View>
      </Modal>
    </View>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.2,
  },
  glowTop: {
    top: -150,
    right: -100,
    width: 400,
    height: 400,
    backgroundColor: '#0ea5e9',
  },
  glowBottom: {
    bottom: -100,
    left: -150,
    width: 350,
    height: 350,
    backgroundColor: '#8b5cf6',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 36,
  },
  logoText: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  logoSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.1)',
    gap: 12,
  },
  errorIcon: {
    fontSize: 20,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#fca5a5',
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  required: {
    color: '#f87171',
  },
  inputWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  siteSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  siteSelectedText: {
    fontSize: 16,
    color: '#ffffff',
  },
  sitePlaceholder: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.4)',
  },
  siteArrow: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  // Success Screen
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    fontSize: 48,
    color: '#ffffff',
  },
  successIcon2: {
    fontSize: 24,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  successMessageContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    maxWidth: 320,
  },
  successMessage: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  successEmail: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  successButtonContainer: {
    width: '100%',
    marginTop: 32,
  },
  successButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    maxHeight: '75%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    maxWidth: 260,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  modalScroll: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  siteList: {
    gap: 12,
  },
  siteItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  siteItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  siteItemSelected: {
    borderColor: 'rgba(14,165,233,0.4)',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  siteNameSelected: {
    color: '#38bdf8',
  },
  siteCity: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});

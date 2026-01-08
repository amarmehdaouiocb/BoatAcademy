import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

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
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!selectedSite) {
      setError('Veuillez sélectionner votre site de formation');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await signUp(
        email.trim().toLowerCase(),
        password,
        fullName.trim(),
        phone.trim() || undefined,
        selectedSite.id
      );

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Un compte existe déjà avec cet email');
        } else {
          setError(authError.message);
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-success-100">
            <Text className="text-5xl">✓</Text>
          </View>
          <Text className="mt-6 text-2xl font-bold text-gray-900">Inscription réussie !</Text>
          <Text className="mt-4 text-center text-gray-600">
            Un email de confirmation a été envoyé à {email}. Veuillez cliquer sur le lien pour activer votre compte.
          </Text>
          <Pressable
            onPress={() => router.replace('/login')}
            className="mt-8 w-full rounded-xl bg-navy-900 py-4"
          >
            <Text className="text-center text-lg font-semibold text-white">
              Retour à la connexion
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View className="mb-6 items-center">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-navy-900">
              <Text className="text-3xl">⚓</Text>
            </View>
          </View>

          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-900">Inscription</Text>
            <Text className="mt-2 text-gray-600">
              Créez votre compte stagiaire Boat Academy
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View className="mb-4 rounded-xl bg-red-50 p-4">
              <Text className="text-red-600">{error}</Text>
            </View>
          )}

          {/* Form */}
          <View className="space-y-4">
            <View>
              <Text className="mb-2 font-medium text-gray-700">
                Nom complet <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Jean Dupont"
                autoCapitalize="words"
                autoComplete="name"
                editable={!loading}
                className="rounded-xl border border-gray-300 bg-white px-4 py-4 text-lg text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View>
              <Text className="mb-2 font-medium text-gray-700">
                Email <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!loading}
                className="rounded-xl border border-gray-300 bg-white px-4 py-4 text-lg text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View>
              <Text className="mb-2 font-medium text-gray-700">Téléphone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="06 12 34 56 78"
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!loading}
                className="rounded-xl border border-gray-300 bg-white px-4 py-4 text-lg text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View>
              <Text className="mb-2 font-medium text-gray-700">
                Site de formation <Text className="text-red-500">*</Text>
              </Text>
              <Pressable
                onPress={() => setSiteModalVisible(true)}
                disabled={loading || loadingSites}
                className="flex-row items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-4"
              >
                {loadingSites ? (
                  <ActivityIndicator size="small" color="#6b7280" />
                ) : selectedSite ? (
                  <Text className="text-lg text-gray-900">{selectedSite.name}</Text>
                ) : (
                  <Text className="text-lg text-gray-400">Sélectionnez votre site</Text>
                )}
                <Text className="text-gray-400">▼</Text>
              </Pressable>
            </View>

            <View>
              <Text className="mb-2 font-medium text-gray-700">
                Mot de passe <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 6 caractères"
                secureTextEntry
                autoComplete="password-new"
                editable={!loading}
                className="rounded-xl border border-gray-300 bg-white px-4 py-4 text-lg text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View>
              <Text className="mb-2 font-medium text-gray-700">
                Confirmer le mot de passe <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Retapez le mot de passe"
                secureTextEntry
                editable={!loading}
                className="rounded-xl border border-gray-300 bg-white px-4 py-4 text-lg text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <Pressable
              onPress={handleRegister}
              disabled={loading}
              className={`mt-6 rounded-xl py-4 ${
                loading ? 'bg-navy-400' : 'bg-navy-900 active:bg-navy-800'
              }`}
            >
              <Text className="text-center text-lg font-semibold text-white">
                {loading ? 'Inscription...' : "S'inscrire"}
              </Text>
            </Pressable>
          </View>

          {/* Login link */}
          <View className="mt-6 flex-row justify-center">
            <Text className="text-gray-600">Déjà un compte ? </Text>
            <Link href="/login" asChild>
              <Pressable disabled={loading}>
                <Text className="font-semibold text-navy-600">Se connecter</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal sélection de site */}
      <Modal
        visible={siteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSiteModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[70%] rounded-t-3xl bg-white">
            <View className="border-b border-gray-200 p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">Choisir un site</Text>
                <Pressable onPress={() => setSiteModalVisible(false)}>
                  <Text className="text-2xl text-gray-400">×</Text>
                </Pressable>
              </View>
              <Text className="mt-1 text-gray-600">
                Sélectionnez le site où vous suivrez votre formation
              </Text>
            </View>

            <ScrollView className="p-4">
              {sites.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-gray-500">Aucun site disponible</Text>
                </View>
              ) : (
                <View className="space-y-2">
                  {sites.map((site) => (
                    <Pressable
                      key={site.id}
                      onPress={() => {
                        setSelectedSite(site);
                        setSiteModalVisible(false);
                      }}
                      className={`rounded-xl border p-4 ${
                        selectedSite?.id === site.id
                          ? 'border-navy-600 bg-navy-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <Text
                        className={`text-lg font-medium ${
                          selectedSite?.id === site.id ? 'text-navy-600' : 'text-gray-900'
                        }`}
                      >
                        {site.name}
                      </Text>
                      {site.city && (
                        <Text className="mt-1 text-gray-500">📍 {site.city}</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

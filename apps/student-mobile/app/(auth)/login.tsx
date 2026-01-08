import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ error?: string }>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gérer les erreurs passées via query params
  useEffect(() => {
    if (params.error === 'not_student') {
      setError('Cette application est réservée aux stagiaires. Les instructeurs et managers doivent utiliser l\'application web.');
    }
  }, [params.error]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await signIn(email.trim().toLowerCase(), password);

      if (authError) {
        if (authError.message.includes('Invalid login')) {
          setError('Email ou mot de passe incorrect');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Veuillez confirmer votre email avant de vous connecter');
        } else {
          setError(authError.message);
        }
      } else {
        // Auth state change will trigger redirect via index.tsx
        router.replace('/');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Logo */}
          <View className="mb-8 items-center">
            <View className="h-20 w-20 items-center justify-center rounded-2xl bg-navy-900">
              <Text className="text-4xl">⚓</Text>
            </View>
            <Text className="mt-4 text-2xl font-bold text-navy-900">Boat Academy</Text>
          </View>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900">Connexion</Text>
            <Text className="mt-2 text-gray-600">
              Connectez-vous à votre compte stagiaire
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
              <Text className="mb-2 font-medium text-gray-700">Email</Text>
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
              <Text className="mb-2 font-medium text-gray-700">Mot de passe</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                editable={!loading}
                className="rounded-xl border border-gray-300 bg-white px-4 py-4 text-lg text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              className={`mt-6 rounded-xl py-4 ${
                loading ? 'bg-navy-400' : 'bg-navy-900 active:bg-navy-800'
              }`}
            >
              <Text className="text-center text-lg font-semibold text-white">
                {loading ? 'Connexion...' : 'Se connecter'}
              </Text>
            </Pressable>
          </View>

          {/* Register link */}
          <View className="mt-8 flex-row justify-center">
            <Text className="text-gray-600">Pas encore de compte ? </Text>
            <Link href="/register" asChild>
              <Pressable disabled={loading}>
                <Text className="font-semibold text-navy-600">S'inscrire</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

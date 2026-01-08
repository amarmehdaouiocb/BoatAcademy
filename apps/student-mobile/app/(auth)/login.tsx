import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      // TODO: Implement Supabase auth
      console.log('Login:', { email });
      router.replace('/(tabs)');
    } catch (err) {
      setError('Email ou mot de passe incorrect');
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
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900">Connexion</Text>
            <Text className="mt-2 text-gray-600">
              Connectez-vous a votre compte Boat Academy
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
                className="rounded-xl border border-gray-300 px-4 py-4 text-lg"
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
                className="rounded-xl border border-gray-300 px-4 py-4 text-lg"
              />
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              className="mt-6 rounded-xl bg-primary-600 py-4 active:bg-primary-700 disabled:opacity-50"
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
              <Pressable>
                <Text className="font-semibold text-primary-600">S'inscrire</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

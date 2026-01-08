import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement Supabase auth
      console.log('Register:', { fullName, email });
      router.replace('/(tabs)');
    } catch (err) {
      setError("Erreur lors de l'inscription");
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
        <ScrollView className="flex-1" contentContainerClassName="p-6">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900">Inscription</Text>
            <Text className="mt-2 text-gray-600">
              Creez votre compte pour acceder a vos formations
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
              <Text className="mb-2 font-medium text-gray-700">Nom complet</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Jean Dupont"
                autoComplete="name"
                className="rounded-xl border border-gray-300 px-4 py-4 text-lg"
              />
            </View>

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
                autoComplete="new-password"
                className="rounded-xl border border-gray-300 px-4 py-4 text-lg"
              />
            </View>

            <View>
              <Text className="mb-2 font-medium text-gray-700">Confirmer le mot de passe</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="new-password"
                className="rounded-xl border border-gray-300 px-4 py-4 text-lg"
              />
            </View>

            <Pressable
              onPress={handleRegister}
              disabled={loading}
              className="mt-6 rounded-xl bg-primary-600 py-4 active:bg-primary-700 disabled:opacity-50"
            >
              <Text className="text-center text-lg font-semibold text-white">
                {loading ? 'Inscription...' : "S'inscrire"}
              </Text>
            </Pressable>
          </View>

          {/* Login link */}
          <View className="mt-8 flex-row justify-center">
            <Text className="text-gray-600">Deja un compte ? </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text className="font-semibold text-primary-600">Se connecter</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

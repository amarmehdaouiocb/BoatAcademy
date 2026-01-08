import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';

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

  const handleRegister = async () => {
    // Validation
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres');
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
        phone.trim() || undefined
      );

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Un compte existe deja avec cet email');
        } else {
          setError(authError.message);
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez reessayer.');
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
          <Text className="mt-6 text-2xl font-bold text-gray-900">Inscription reussie !</Text>
          <Text className="mt-4 text-center text-gray-600">
            Un email de confirmation a ete envoye a {email}. Veuillez cliquer sur le lien pour activer votre compte.
          </Text>
          <Pressable
            onPress={() => router.replace('/login')}
            className="mt-8 w-full rounded-xl bg-navy-900 py-4"
          >
            <Text className="text-center text-lg font-semibold text-white">
              Retour a la connexion
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
              Creez votre compte stagiaire Boat Academy
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
              <Text className="mb-2 font-medium text-gray-700">Telephone</Text>
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
                Mot de passe <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 6 caracteres"
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
            <Text className="text-gray-600">Deja un compte ? </Text>
            <Link href="/login" asChild>
              <Pressable disabled={loading}>
                <Text className="font-semibold text-navy-600">Se connecter</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

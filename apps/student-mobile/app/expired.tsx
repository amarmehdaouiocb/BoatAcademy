import { View, Text, Pressable, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../src/contexts/AuthContext';

export default function ExpiredScreen() {
  const router = useRouter();
  const { student, signOut, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleContactSchool = () => {
    // Ouvrir l'email vers l'école (à personnaliser selon le site)
    Linking.openURL('mailto:contact@boatacademy.fr?subject=Renouvellement%20acc%C3%A8s%20stagiaire');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      // Si l'accès a été renouvelé, la redirection se fera automatiquement
      // via le guard dans _layout.tsx
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center px-6">
        {/* Icône */}
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-red-100">
          <Text className="text-5xl">⏰</Text>
        </View>

        {/* Titre */}
        <Text className="text-center text-2xl font-bold text-gray-900">
          Accès expiré
        </Text>

        {/* Description */}
        <Text className="mt-4 text-center text-base text-gray-600">
          Votre accès à l'application a expiré le{' '}
          <Text className="font-semibold text-red-600">
            {formatDate(student?.access_expires_at ?? null)}
          </Text>
          .
        </Text>

        <Text className="mt-2 text-center text-base text-gray-600">
          Pour continuer à utiliser l'application et accéder à vos sessions de formation,
          veuillez contacter votre école pour renouveler votre accès.
        </Text>

        {/* Info site */}
        {student?.site?.name && (
          <View className="mt-6 rounded-xl bg-white p-4">
            <Text className="text-center text-sm text-gray-500">Site de formation</Text>
            <Text className="text-center text-lg font-semibold text-gray-900">
              {student.site.name}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View className="mt-8 w-full space-y-3">
          <Pressable
            onPress={handleContactSchool}
            className="w-full rounded-xl bg-navy-600 py-4"
          >
            <Text className="text-center font-semibold text-white">
              Contacter l'école
            </Text>
          </Pressable>

          <Pressable
            onPress={handleRefresh}
            disabled={refreshing}
            className="w-full rounded-xl border border-gray-200 bg-white py-4"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#0f172a" />
            ) : (
              <Text className="text-center font-semibold text-gray-900">
                Vérifier mon accès
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleLogout}
            disabled={loading}
            className="w-full rounded-xl border border-red-200 bg-red-50 py-4"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <Text className="text-center font-semibold text-red-600">
                Se déconnecter
              </Text>
            )}
          </Pressable>
        </View>

        {/* Note */}
        <Text className="mt-6 text-center text-sm text-gray-400">
          Si vous avez déjà renouvelé votre accès, appuyez sur "Vérifier mon accès"
          pour actualiser vos informations.
        </Text>
      </View>
    </SafeAreaView>
  );
}

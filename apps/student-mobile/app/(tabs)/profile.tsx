import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, student, signOut, loading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Deconnexion',
      'Voulez-vous vraiment vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se deconnecter',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await signOut();
              router.replace('/');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Erreur', 'Impossible de se deconnecter.');
            } finally {
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
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0f172a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        {/* Profile header */}
        <View className="mb-6 items-center">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-navy-100">
            <Text className="text-3xl font-bold text-navy-600">
              {getInitials(profile?.full_name)}
            </Text>
          </View>
          <Text className="mt-4 text-xl font-bold text-gray-900">
            {profile?.full_name || 'Stagiaire'}
          </Text>
          <Text className="text-gray-600">{user?.email}</Text>
          {profile?.phone && (
            <Text className="mt-1 text-sm text-gray-500">{profile.phone}</Text>
          )}
        </View>

        {/* Student info card */}
        <View className="mb-6 rounded-xl bg-white p-4">
          <Text className="mb-4 font-semibold text-gray-900">Informations stagiaire</Text>

          <View className="space-y-4">
            <InfoRow
              label="Site de formation"
              value={student?.site?.name || 'Non attribue'}
            />
            <InfoRow
              label="Numero OEDIPP"
              value={student?.oedipp_number || 'Non renseigne'}
            />
            <InfoRow
              label="Acces expire le"
              value={formatDate(student?.access_expires_at || null)}
              highlight={
                student?.access_expires_at
                  ? new Date(student.access_expires_at) < new Date()
                  : false
              }
            />
          </View>
        </View>

        {/* Account info card */}
        <View className="mb-6 rounded-xl bg-white p-4">
          <Text className="mb-4 font-semibold text-gray-900">Compte</Text>

          <View className="space-y-4">
            <InfoRow label="Email" value={user?.email || '-'} />
            <InfoRow label="Role" value="Stagiaire" />
            <InfoRow
              label="Compte cree le"
              value={formatDate(user?.created_at || null)}
            />
          </View>
        </View>

        {/* Menu buttons */}
        <View className="space-y-3">
          <MenuButton
            icon="📋"
            label="Conditions d'utilisation"
            onPress={() => {
              // TODO: Navigate to terms
            }}
          />
          <MenuButton
            icon="🔒"
            label="Politique de confidentialite"
            onPress={() => {
              // TODO: Navigate to privacy
            }}
          />
          <MenuButton
            icon="❓"
            label="Aide et support"
            onPress={() => {
              // TODO: Navigate to help
            }}
          />
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          disabled={loggingOut}
          className="mt-6 rounded-xl border border-red-200 bg-red-50 py-4"
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#dc2626" />
          ) : (
            <Text className="text-center font-semibold text-red-600">Se deconnecter</Text>
          )}
        </Pressable>

        {/* Version */}
        <Text className="mt-8 text-center text-sm text-gray-400">
          Boat Academy v1.0.0 - MVP
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-gray-600">{label}</Text>
      <Text
        className={`font-medium ${highlight ? 'text-red-600' : 'text-gray-900'}`}
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
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-xl bg-white p-4 active:bg-gray-50"
    >
      <Text className="mr-4 text-xl">{icon}</Text>
      <Text className="flex-1 font-medium text-gray-900">{label}</Text>
      <Text className="text-gray-400">›</Text>
    </Pressable>
  );
}

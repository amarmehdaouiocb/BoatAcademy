import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    // TODO: Implement logout
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        {/* Profile header */}
        <View className="mb-6 items-center">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary-100">
            <Text className="text-4xl">👤</Text>
          </View>
          <Text className="mt-4 text-xl font-bold text-gray-900">Stagiaire</Text>
          <Text className="text-gray-600">stagiaire@example.com</Text>
        </View>

        {/* Info cards */}
        <View className="mb-6 rounded-xl bg-white p-4">
          <Text className="mb-4 font-semibold text-gray-900">Informations</Text>

          <View className="space-y-4">
            <InfoRow label="Numero OEDIPP" value="Non renseigne" />
            <InfoRow label="Site" value="Non renseigne" />
            <InfoRow label="Acces expire le" value="-" />
          </View>
        </View>

        {/* Actions */}
        <View className="space-y-3">
          <MenuButton icon="⚙️" label="Parametres" />
          <MenuButton icon="🔔" label="Notifications" />
          <MenuButton icon="❓" label="Aide" />
          <MenuButton icon="📋" label="Conditions d'utilisation" />
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          className="mt-6 rounded-xl border border-red-200 bg-red-50 py-4"
        >
          <Text className="text-center font-semibold text-red-600">Se deconnecter</Text>
        </Pressable>

        {/* Version */}
        <Text className="mt-8 text-center text-sm text-gray-400">Version 0.1.0 - MVP</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-gray-600">{label}</Text>
      <Text className="font-medium text-gray-900">{value}</Text>
    </View>
  );
}

function MenuButton({ icon, label }: { icon: string; label: string }) {
  return (
    <Pressable className="flex-row items-center rounded-xl bg-white p-4 active:bg-gray-50">
      <Text className="mr-4 text-xl">{icon}</Text>
      <Text className="flex-1 font-medium text-gray-900">{label}</Text>
      <Text className="text-gray-400">›</Text>
    </Pressable>
  );
}

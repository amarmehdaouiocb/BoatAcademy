import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">Bonjour 👋</Text>
          <Text className="mt-1 text-gray-600">Bienvenue sur Boat Academy</Text>
        </View>

        {/* Quick Stats */}
        <View className="mb-6 flex-row space-x-4">
          <StatCard title="Documents" value="0/4" color="blue" />
          <StatCard title="Sessions" value="0" color="green" />
        </View>

        {/* Actions */}
        <View className="mb-6">
          <Text className="mb-4 text-lg font-semibold text-gray-900">Actions rapides</Text>
          <View className="space-y-3">
            <ActionCard
              icon="📄"
              title="Completer mon dossier"
              description="Telechargez vos documents obligatoires"
              href="/documents"
            />
            <ActionCard
              icon="📅"
              title="Voir les sessions"
              description="Consultez les prochaines formations"
              href="/sessions"
            />
            <ActionCard
              icon="💬"
              title="Contacter l'ecole"
              description="Envoyez un message au gestionnaire"
              href="/messages"
            />
          </View>
        </View>

        {/* Info */}
        <View className="rounded-xl bg-primary-50 p-4">
          <Text className="font-semibold text-primary-800">Prochaine etape</Text>
          <Text className="mt-1 text-primary-700">
            Completez votre dossier administratif pour pouvoir vous inscrire aux sessions de formation.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  const bgColor = color === 'blue' ? 'bg-blue-50' : 'bg-green-50';
  const textColor = color === 'blue' ? 'text-blue-600' : 'text-green-600';

  return (
    <View className={`flex-1 rounded-xl ${bgColor} p-4`}>
      <Text className="text-sm text-gray-600">{title}</Text>
      <Text className={`mt-1 text-2xl font-bold ${textColor}`}>{value}</Text>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href as any} asChild>
      <Pressable className="flex-row items-center rounded-xl bg-white p-4 active:bg-gray-50">
        <Text className="mr-4 text-3xl">{icon}</Text>
        <View className="flex-1">
          <Text className="font-semibold text-gray-900">{title}</Text>
          <Text className="text-sm text-gray-600">{description}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

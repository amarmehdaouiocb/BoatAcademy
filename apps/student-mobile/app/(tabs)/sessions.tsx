import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SessionsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">Sessions</Text>
          <Text className="mt-1 text-gray-600">
            Consultez et inscrivez-vous aux sessions de formation
          </Text>
        </View>

        {/* Tabs */}
        <View className="mb-6 flex-row rounded-xl bg-white p-1">
          <View className="flex-1 rounded-lg bg-primary-600 py-3">
            <Text className="text-center font-medium text-white">A venir</Text>
          </View>
          <View className="flex-1 py-3">
            <Text className="text-center font-medium text-gray-600">Mes inscriptions</Text>
          </View>
        </View>

        {/* Empty state */}
        <View className="flex-1 items-center justify-center py-12">
          <Text className="text-5xl">📅</Text>
          <Text className="mt-4 text-lg font-semibold text-gray-900">Aucune session</Text>
          <Text className="mt-2 text-center text-gray-600">
            Les prochaines sessions de formation apparaitront ici
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

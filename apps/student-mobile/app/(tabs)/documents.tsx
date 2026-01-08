import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DocumentsScreen() {
  const documents = [
    { id: '1', name: "Piece d'identite", status: 'missing' as const },
    { id: '2', name: "Photo d'identite", status: 'missing' as const },
    { id: '3', name: 'Certificat medical', status: 'missing' as const },
    { id: '4', name: 'Justificatif de domicile', status: 'missing' as const },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">Mes documents</Text>
          <Text className="mt-1 text-gray-600">
            Telechargez les documents obligatoires pour votre dossier
          </Text>
        </View>

        {/* Progress */}
        <View className="mb-6 rounded-xl bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-gray-900">Progression</Text>
            <Text className="text-primary-600">0/4 documents</Text>
          </View>
          <View className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
            <View className="h-full w-0 rounded-full bg-primary-600" />
          </View>
        </View>

        {/* Documents list */}
        <View className="space-y-3">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} name={doc.name} status={doc.status} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DocumentCard({
  name,
  status,
}: {
  name: string;
  status: 'missing' | 'pending' | 'approved' | 'rejected';
}) {
  const statusConfig = {
    missing: { label: 'Manquant', color: 'bg-gray-100 text-gray-600' },
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Valide', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'Refuse', color: 'bg-red-100 text-red-700' },
  };

  const config = statusConfig[status];

  return (
    <Pressable className="flex-row items-center justify-between rounded-xl bg-white p-4 active:bg-gray-50">
      <View className="flex-1">
        <Text className="font-medium text-gray-900">{name}</Text>
        <View className={`mt-2 self-start rounded-full px-3 py-1 ${config.color}`}>
          <Text className="text-xs font-medium">{config.label}</Text>
        </View>
      </View>
      {status === 'missing' && (
        <Pressable className="rounded-lg bg-primary-600 px-4 py-2">
          <Text className="font-medium text-white">Ajouter</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

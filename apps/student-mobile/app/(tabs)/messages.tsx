import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function MessagesScreen() {
  const [message, setMessage] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="border-b border-gray-200 bg-white px-6 py-4">
          <Text className="text-2xl font-bold text-gray-900">Messages</Text>
          <Text className="mt-1 text-gray-600">Echangez avec l'ecole</Text>
        </View>

        {/* Messages list */}
        <ScrollView className="flex-1 p-6">
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-5xl">💬</Text>
            <Text className="mt-4 text-lg font-semibold text-gray-900">Aucun message</Text>
            <Text className="mt-2 text-center text-gray-600">
              Envoyez un message pour commencer la conversation
            </Text>
          </View>
        </ScrollView>

        {/* Input */}
        <View className="border-t border-gray-200 bg-white p-4">
          <View className="flex-row items-end space-x-3">
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Votre message..."
              multiline
              className="max-h-24 flex-1 rounded-2xl bg-gray-100 px-4 py-3"
            />
            <Pressable
              disabled={!message.trim()}
              className="rounded-full bg-primary-600 p-3 disabled:opacity-50"
            >
              <Text className="text-lg text-white">➤</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-primary-600">
      <View className="flex-1 items-center justify-center px-6">
        {/* Logo */}
        <View className="mb-8">
          <Text className="text-6xl">⛵</Text>
        </View>

        {/* Title */}
        <Text className="text-4xl font-bold text-white">Boat Academy</Text>
        <Text className="mt-4 text-center text-lg text-primary-100">
          Votre parcours vers le permis bateau commence ici
        </Text>

        {/* Features */}
        <View className="mt-12 w-full space-y-4">
          <FeatureItem icon="📄" text="Gerez vos documents" />
          <FeatureItem icon="📅" text="Inscrivez-vous aux sessions" />
          <FeatureItem icon="💬" text="Echangez avec l'ecole" />
        </View>

        {/* CTA */}
        <View className="mt-12 w-full space-y-4">
          <Link href="/login" asChild>
            <Pressable className="w-full rounded-xl bg-white py-4 active:bg-gray-100">
              <Text className="text-center text-lg font-semibold text-primary-600">
                Se connecter
              </Text>
            </Pressable>
          </Link>

          <Link href="/register" asChild>
            <Pressable className="w-full rounded-xl border-2 border-white py-4 active:bg-primary-700">
              <Text className="text-center text-lg font-semibold text-white">
                Creer un compte
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-center rounded-xl bg-primary-500/50 p-4">
      <Text className="mr-4 text-2xl">{icon}</Text>
      <Text className="text-lg text-white">{text}</Text>
    </View>
  );
}

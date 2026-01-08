import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

type DocumentType = 'id_card' | 'photo' | 'medical_certificate' | 'proof_of_address';

type Document = {
  id: string;
  type: DocumentType;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  file_url: string | null;
};

const DOCUMENT_CONFIG: Record<DocumentType, { name: string; icon: string; required: boolean }> = {
  id_card: { name: "Piece d'identite", icon: '🪪', required: true },
  photo: { name: "Photo d'identite", icon: '📷', required: true },
  medical_certificate: { name: 'Certificat medical', icon: '🏥', required: true },
  proof_of_address: { name: 'Justificatif de domicile', icon: '🏠', required: true },
};

export default function DocumentsScreen() {
  const { user, student } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState<DocumentType | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
      } else {
        setDocuments(data as Document[]);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDocuments();
  }, [fetchDocuments]);

  const getDocumentByType = (type: DocumentType): Document | undefined => {
    return documents.find((doc) => doc.type === type);
  };

  const getDocumentStatus = (type: DocumentType): 'missing' | 'pending' | 'approved' | 'rejected' => {
    const doc = getDocumentByType(type);
    if (!doc) return 'missing';
    return doc.status;
  };

  const handleUpload = async (type: DocumentType) => {
    Alert.alert(
      'Ajouter un document',
      'Comment souhaitez-vous ajouter ce document ?',
      [
        {
          text: 'Prendre une photo',
          onPress: () => pickFromCamera(type),
        },
        {
          text: 'Choisir une image',
          onPress: () => pickFromGallery(type),
        },
        {
          text: 'Choisir un fichier',
          onPress: () => pickFile(type),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const pickFromCamera = async (type: DocumentType) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusee', 'Nous avons besoin de votre permission pour acceder a la camera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadDocument(type, result.assets[0].uri);
    }
  };

  const pickFromGallery = async (type: DocumentType) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusee', 'Nous avons besoin de votre permission pour acceder a la galerie.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadDocument(type, result.assets[0].uri);
    }
  };

  const pickFile = async (type: DocumentType) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadDocument(type, result.assets[0].uri);
    }
  };

  const uploadDocument = async (type: DocumentType, uri: string) => {
    if (!user?.id || !student?.site_id) {
      Alert.alert('Erreur', 'Vous devez etre connecte pour telecharger un document.');
      return;
    }

    setUploading(type);

    try {
      // Get file extension
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${type}_${Date.now()}.${ext}`;

      // Read file and upload
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

      // Check if document already exists
      const existingDoc = getDocumentByType(type);

      if (existingDoc) {
        // Update existing document
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            file_url: urlData.publicUrl,
            status: 'pending',
            rejection_reason: null,
          })
          .eq('id', existingDoc.id);

        if (updateError) throw updateError;
      } else {
        // Create new document
        const { error: insertError } = await supabase.from('documents').insert({
          user_id: user.id,
          site_id: student.site_id,
          type,
          file_url: urlData.publicUrl,
          status: 'pending',
        });

        if (insertError) throw insertError;
      }

      // Refresh documents list
      await fetchDocuments();
      Alert.alert('Succes', 'Document telecharge avec succes. Il sera valide par un gestionnaire.');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Erreur', error.message || 'Impossible de telecharger le document.');
    } finally {
      setUploading(null);
    }
  };

  // Calculate progress
  const requiredDocs = Object.keys(DOCUMENT_CONFIG).filter(
    (type) => DOCUMENT_CONFIG[type as DocumentType].required
  );
  const approvedCount = requiredDocs.filter(
    (type) => getDocumentStatus(type as DocumentType) === 'approved'
  ).length;
  const progressPercent = Math.round((approvedCount / requiredDocs.length) * 100);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0f172a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
            <Text className="text-navy-600 font-medium">
              {approvedCount}/{requiredDocs.length} valides
            </Text>
          </View>
          <View className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
            <View
              className="h-full rounded-full bg-navy-600"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>

        {/* Documents list */}
        <View className="space-y-3">
          {(Object.keys(DOCUMENT_CONFIG) as DocumentType[]).map((type) => (
            <DocumentCard
              key={type}
              type={type}
              config={DOCUMENT_CONFIG[type]}
              document={getDocumentByType(type)}
              status={getDocumentStatus(type)}
              uploading={uploading === type}
              onUpload={() => handleUpload(type)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DocumentCard({
  type,
  config,
  document,
  status,
  uploading,
  onUpload,
}: {
  type: DocumentType;
  config: { name: string; icon: string; required: boolean };
  document?: Document;
  status: 'missing' | 'pending' | 'approved' | 'rejected';
  uploading: boolean;
  onUpload: () => void;
}) {
  const statusConfig = {
    missing: { label: 'Manquant', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
    pending: { label: 'En attente', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
    approved: { label: 'Valide', bgColor: 'bg-green-100', textColor: 'text-green-700' },
    rejected: { label: 'Refuse', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  };

  const statusInfo = statusConfig[status];

  return (
    <View className="rounded-xl bg-white p-4">
      <View className="flex-row items-start">
        <Text className="mr-4 text-3xl">{config.icon}</Text>
        <View className="flex-1">
          <Text className="font-medium text-gray-900">{config.name}</Text>
          <View className="mt-2 flex-row items-center">
            <View className={`rounded-full px-3 py-1 ${statusInfo.bgColor}`}>
              <Text className={`text-xs font-medium ${statusInfo.textColor}`}>{statusInfo.label}</Text>
            </View>
            {config.required && status === 'missing' && (
              <Text className="ml-2 text-xs text-red-500">Obligatoire</Text>
            )}
          </View>
          {status === 'rejected' && document?.rejection_reason && (
            <View className="mt-2 rounded-lg bg-red-50 p-2">
              <Text className="text-xs text-red-600">{document.rejection_reason}</Text>
            </View>
          )}
        </View>
        {(status === 'missing' || status === 'rejected') && (
          <Pressable
            onPress={onUpload}
            disabled={uploading}
            className={`rounded-lg px-4 py-2 ${uploading ? 'bg-navy-300' : 'bg-navy-600'}`}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="font-medium text-white">{status === 'rejected' ? 'Renvoyer' : 'Ajouter'}</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

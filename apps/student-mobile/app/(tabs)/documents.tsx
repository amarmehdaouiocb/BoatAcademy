import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

type DocumentTypeKey = 'id_card' | 'photo' | 'medical_certificate' | 'proof_of_address';

type StudentDocument = {
  id: string;
  document_type_id: string;
  status: 'missing' | 'pending' | 'approved' | 'rejected';
  rejected_reason: string | null;
  uploaded_at: string;
  storage_path: string | null;
};

const DOCUMENT_CONFIG: Record<DocumentTypeKey, { name: string; icon: string; required: boolean }> = {
  id_card: { name: "Pièce d'identité", icon: '🪪', required: true },
  photo: { name: "Photo d'identité", icon: '📷', required: true },
  medical_certificate: { name: 'Certificat médical', icon: '🏥', required: true },
  proof_of_address: { name: 'Justificatif de domicile', icon: '🏠', required: true },
};

export default function DocumentsScreen() {
  const { user, student } = useAuth();
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<{ id: string; key: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState<DocumentTypeKey | null>(null);

  const fetchDocumentTypes = useCallback(async () => {
    const { data, error } = await supabase
      .from('document_types')
      .select('id, key');

    if (!error && data) {
      setDocumentTypes(data);
    }
    return data || [];
  }, []);

  const fetchDocuments = useCallback(async () => {
    if (!user?.id || !student?.site_id) return;

    try {
      const types = await fetchDocumentTypes();

      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_user_id', user.id)
        .eq('site_id', student.site_id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
      } else {
        setDocuments(data as StudentDocument[]);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, student?.site_id, fetchDocumentTypes]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDocuments();
  }, [fetchDocuments]);

  const getDocumentTypeId = (typeKey: DocumentTypeKey): string | undefined => {
    return documentTypes.find((dt) => dt.key === typeKey)?.id;
  };

  const getDocumentByType = (typeKey: DocumentTypeKey): StudentDocument | undefined => {
    const typeId = getDocumentTypeId(typeKey);
    if (!typeId) return undefined;
    return documents.find((doc) => doc.document_type_id === typeId);
  };

  const getDocumentStatus = (typeKey: DocumentTypeKey): 'missing' | 'pending' | 'approved' | 'rejected' => {
    const doc = getDocumentByType(typeKey);
    if (!doc) return 'missing';
    return doc.status;
  };

  const handleUpload = async (typeKey: DocumentTypeKey) => {
    Alert.alert(
      'Ajouter un document',
      'Comment souhaitez-vous ajouter ce document ?',
      [
        {
          text: 'Prendre une photo',
          onPress: () => pickFromCamera(typeKey),
        },
        {
          text: 'Choisir une image',
          onPress: () => pickFromGallery(typeKey),
        },
        {
          text: 'Choisir un fichier',
          onPress: () => pickFile(typeKey),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const pickFromCamera = async (typeKey: DocumentTypeKey) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la caméra.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadDocument(typeKey, result.assets[0].uri);
    }
  };

  const pickFromGallery = async (typeKey: DocumentTypeKey) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la galerie.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadDocument(typeKey, result.assets[0].uri);
    }
  };

  const pickFile = async (typeKey: DocumentTypeKey) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadDocument(typeKey, result.assets[0].uri);
    }
  };

  const uploadDocument = async (typeKey: DocumentTypeKey, uri: string) => {
    if (!user?.id || !student?.site_id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour télécharger un document.');
      return;
    }

    const documentTypeId = getDocumentTypeId(typeKey);
    if (!documentTypeId) {
      Alert.alert('Erreur', 'Type de document non trouvé.');
      return;
    }

    setUploading(typeKey);

    try {
      // Get file extension
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${student.site_id}/${user.id}/${typeKey}_${Date.now()}.${ext}`;

      // Read file and upload
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Check if document already exists
      const existingDoc = getDocumentByType(typeKey);

      if (existingDoc) {
        // Update existing document
        const { error: updateError } = await supabase
          .from('student_documents')
          .update({
            storage_path: fileName,
            status: 'pending',
            rejected_reason: null,
          })
          .eq('id', existingDoc.id);

        if (updateError) throw updateError;
      } else {
        // Create new document
        const { error: insertError } = await supabase.from('student_documents').insert({
          student_user_id: user.id,
          site_id: student.site_id,
          document_type_id: documentTypeId,
          storage_path: fileName,
          status: 'pending',
        });

        if (insertError) throw insertError;
      }

      // Refresh documents list
      await fetchDocuments();
      Alert.alert('Succès', 'Document téléchargé avec succès. Il sera validé par un gestionnaire.');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Erreur', error.message || 'Impossible de télécharger le document.');
    } finally {
      setUploading(null);
    }
  };

  // Calculate progress
  const requiredDocs = Object.keys(DOCUMENT_CONFIG).filter(
    (typeKey) => DOCUMENT_CONFIG[typeKey as DocumentTypeKey].required
  );
  const approvedCount = requiredDocs.filter(
    (typeKey) => getDocumentStatus(typeKey as DocumentTypeKey) === 'approved'
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
            Téléchargez les documents obligatoires pour votre dossier
          </Text>
        </View>

        {/* Progress */}
        <View className="mb-6 rounded-xl bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-gray-900">Progression</Text>
            <Text className="text-navy-600 font-medium">
              {approvedCount}/{requiredDocs.length} validés
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
          {(Object.keys(DOCUMENT_CONFIG) as DocumentTypeKey[]).map((typeKey) => (
            <DocumentCard
              key={typeKey}
              typeKey={typeKey}
              config={DOCUMENT_CONFIG[typeKey]}
              document={getDocumentByType(typeKey)}
              status={getDocumentStatus(typeKey)}
              uploading={uploading === typeKey}
              onUpload={() => handleUpload(typeKey)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DocumentCard({
  typeKey,
  config,
  document,
  status,
  uploading,
  onUpload,
}: {
  typeKey: DocumentTypeKey;
  config: { name: string; icon: string; required: boolean };
  document?: StudentDocument;
  status: 'missing' | 'pending' | 'approved' | 'rejected';
  uploading: boolean;
  onUpload: () => void;
}) {
  const statusConfig = {
    missing: { label: 'Manquant', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
    pending: { label: 'En attente', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
    approved: { label: 'Validé', bgColor: 'bg-green-100', textColor: 'text-green-700' },
    rejected: { label: 'Refusé', bgColor: 'bg-red-100', textColor: 'text-red-700' },
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
          {status === 'rejected' && document?.rejected_reason && (
            <View className="mt-2 rounded-lg bg-red-50 p-2">
              <Text className="text-xs text-red-600">{document.rejected_reason}</Text>
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

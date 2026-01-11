import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AnimatedPressable } from '../../src/components/ui';

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${student.site_id}/${user.id}/${typeKey}_${Date.now()}.${ext}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const existingDoc = getDocumentByType(typeKey);

      if (existingDoc) {
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
        const { error: insertError } = await supabase.from('student_documents').insert({
          student_user_id: user.id,
          site_id: student.site_id,
          document_type_id: documentTypeId,
          storage_path: fileName,
          status: 'pending',
        });

        if (insertError) throw insertError;
      }

      await fetchDocuments();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Document téléchargé avec succès. Il sera validé par un gestionnaire.');
    } catch (error: any) {
      console.error('Upload error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      <View style={styles.container}>
        <LinearGradient
          colors={['#020617', '#0a1628', '#0f1f35']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Chargement des documents...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0a1628', '#0f1f35']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient glow effects */}
      <View style={styles.glowContainer}>
        <View style={[styles.glow, styles.glowTopLeft]} />
        <View style={[styles.glow, styles.glowBottomRight]} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.headerTitle}>Documents</Text>
          <Text style={styles.headerSubtitle}>
            Téléchargez vos pièces obligatoires
          </Text>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0ea5e9"
            />
          }
        >
          {/* Progress Card */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <BlurView intensity={25} tint="dark" style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressTitle}>Progression</Text>
                  <Text style={styles.progressSubtitle}>
                    {approvedCount}/{requiredDocs.length} documents validés
                  </Text>
                </View>
                <View style={styles.progressBadge}>
                  <Text style={styles.progressPercent}>{progressPercent}%</Text>
                </View>
              </View>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={progressPercent === 100 ? ['#10b981', '#059669'] : ['#0ea5e9', '#0284c7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                />
              </View>
              {progressPercent === 100 && (
                <View style={styles.completeMessage}>
                  <Text style={styles.completeIcon}>🎉</Text>
                  <Text style={styles.completeText}>Dossier complet !</Text>
                </View>
              )}
            </BlurView>
          </Animated.View>

          {/* Documents list */}
          <View style={styles.documentsList}>
            {(Object.keys(DOCUMENT_CONFIG) as DocumentTypeKey[]).map((typeKey, index) => (
              <DocumentCard
                key={typeKey}
                typeKey={typeKey}
                config={DOCUMENT_CONFIG[typeKey]}
                document={getDocumentByType(typeKey)}
                status={getDocumentStatus(typeKey)}
                uploading={uploading === typeKey}
                onUpload={() => handleUpload(typeKey)}
                delay={150 + index * 80}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function DocumentCard({
  typeKey,
  config,
  document,
  status,
  uploading,
  onUpload,
  delay = 0,
}: {
  typeKey: DocumentTypeKey;
  config: { name: string; icon: string; required: boolean };
  document?: StudentDocument;
  status: 'missing' | 'pending' | 'approved' | 'rejected';
  uploading: boolean;
  onUpload: () => void;
  delay?: number;
}) {
  const statusConfig = {
    missing: {
      label: 'Manquant',
      icon: '⚪',
      colors: ['rgba(107,114,128,0.3)', 'rgba(75,85,99,0.3)'],
      textColor: 'rgba(255,255,255,0.5)',
    },
    pending: {
      label: 'En attente',
      icon: '⏳',
      colors: ['rgba(251,191,36,0.3)', 'rgba(245,158,11,0.3)'],
      textColor: '#fbbf24',
    },
    approved: {
      label: 'Validé',
      icon: '✅',
      colors: ['rgba(16,185,129,0.3)', 'rgba(5,150,105,0.3)'],
      textColor: '#10b981',
    },
    rejected: {
      label: 'Refusé',
      icon: '❌',
      colors: ['rgba(239,68,68,0.3)', 'rgba(220,38,38,0.3)'],
      textColor: '#ef4444',
    },
  };

  const statusInfo = statusConfig[status];

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <BlurView intensity={25} tint="dark" style={styles.documentCard}>
        <View style={styles.documentContent}>
          <View style={styles.documentIconContainer}>
            <Text style={styles.documentIcon}>{config.icon}</Text>
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>{config.name}</Text>
            <View style={styles.documentStatus}>
              <LinearGradient
                colors={statusInfo.colors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statusBadge}
              >
                <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
                <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
                  {statusInfo.label}
                </Text>
              </LinearGradient>
              {config.required && status === 'missing' && (
                <Text style={styles.requiredTag}>Obligatoire</Text>
              )}
            </View>
          </View>
        </View>

        {status === 'rejected' && document?.rejected_reason && (
          <View style={styles.rejectedReason}>
            <Text style={styles.rejectedReasonText}>{document.rejected_reason}</Text>
          </View>
        )}

        {(status === 'missing' || status === 'rejected') && (
          <AnimatedPressable onPress={onUpload} disabled={uploading} hapticStyle="medium">
            <LinearGradient
              colors={['#0ea5e9', '#0284c7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.uploadButton}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Text style={styles.uploadIcon}>📤</Text>
                  <Text style={styles.uploadText}>
                    {status === 'rejected' ? 'Renvoyer' : 'Ajouter'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </AnimatedPressable>
        )}
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  safeArea: {
    flex: 1,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  glowTopLeft: {
    top: -100,
    left: -100,
    width: 350,
    height: 350,
    backgroundColor: '#f97316',
  },
  glowBottomRight: {
    bottom: 150,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: '#0ea5e9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
  },
  progressCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: 'rgba(14,165,233,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  completeMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  completeIcon: {
    fontSize: 20,
  },
  completeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
  },
  documentsList: {
    gap: 12,
  },
  documentCard: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  documentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  documentIcon: {
    fontSize: 28,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  documentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requiredTag: {
    fontSize: 11,
    color: '#fca5a5',
    fontWeight: '500',
  },
  rejectedReason: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  rejectedReasonText: {
    fontSize: 13,
    color: '#fca5a5',
    lineHeight: 18,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  uploadIcon: {
    fontSize: 16,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});

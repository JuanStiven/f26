import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { colors } from '../theme/colors';

interface OfflineDocsScreenProps {
  paginatedOffline: any[];
  offlineSearchTerm: string;
  setOfflineSearchTerm: (term: string) => void;
  offlinePage: number;
  setOfflinePage: React.Dispatch<React.SetStateAction<number>>;
  totalOfflinePages: number;
  isOnline: boolean;
  loadOfflineDocs: () => void;
  syncOfflineDocs: () => void;
  onBack: () => void;
  styles: any;
}

export const OfflineDocsScreen: React.FC<OfflineDocsScreenProps> = ({
  paginatedOffline,
  offlineSearchTerm,
  setOfflineSearchTerm,
  offlinePage,
  setOfflinePage,
  totalOfflinePages,
  isOnline,
  loadOfflineDocs,
  syncOfflineDocs,
  onBack,
  styles,
}) => {
  return (
    <View style={styles.subView}>
      <View style={styles.subViewHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>⬅️ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.subViewTitle}>Documentos Locales</Text>
        <TouchableOpacity onPress={loadOfflineDocs} style={{ padding: 8, backgroundColor: '#E0F2FE', borderRadius: 8 }}>
          <Text style={{ fontSize: 16 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 15 }}>
        <TextInput
          style={[styles.fieldInput, { backgroundColor: '#F9FAFB', marginBottom: 0 }]}
          placeholder="Buscar documento local..."
          value={offlineSearchTerm}
          onChangeText={(t) => {
            setOfflineSearchTerm(t);
            setOfflinePage(1);
          }}
        />
      </View>

      {paginatedOffline.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#6B7280' }}>No hay documentos locales encontrados.</Text>
      ) : (
        <View>
          {paginatedOffline.map(doc => (
            <View key={doc.id} style={styles.offlineDocItem}>
              <View>
                <Text style={styles.offlineDocName}>{doc.template?.name || 'Documento sin nombre'}</Text>
                <Text style={styles.offlineDocMeta}>Fecha: {new Date(doc.createdAt).toLocaleDateString()} | Operario: {doc.operator}</Text>
              </View>
              <Text style={styles.docPendingText}>{doc.status || '⏳ Guardado Local'}</Text>
            </View>
          ))}
          
          {/* Paginación */}
          {totalOfflinePages > 1 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingHorizontal: 10 }}>
              <TouchableOpacity onPress={() => setOfflinePage(p => Math.max(1, p - 1))} disabled={offlinePage === 1} style={{ padding: 10, opacity: offlinePage === 1 ? 0.5 : 1 }}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Anterior</Text>
              </TouchableOpacity>
              <Text style={{ color: '#4B5563' }}>{offlinePage} / {totalOfflinePages}</Text>
              <TouchableOpacity onPress={() => setOfflinePage(p => Math.min(totalOfflinePages, p + 1))} disabled={offlinePage === totalOfflinePages} style={{ padding: 10, opacity: offlinePage === totalOfflinePages ? 0.5 : 1 }}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity 
        style={[styles.syncButton, !isOnline && styles.buttonDisabled, { marginTop: 15 }]}
        disabled={!isOnline}
        onPress={syncOfflineDocs}
      >
        <Text style={styles.syncButtonText}>
          {isOnline ? '🔄 Sincronizar Cambios Ahora' : '🚫 Conéctate a Internet para Sincronizar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Image, Linking, Alert } from 'react-native';
import { colors } from '../theme/colors';

interface HistoryScreenProps {
  currentScreen: 'history' | 'view_document';
  loadingHistory: boolean;
  paginatedHistory: any[];
  historySearchTerm: string;
  setHistorySearchTerm: (term: string) => void;
  historyPage: number;
  setHistoryPage: React.Dispatch<React.SetStateAction<number>>;
  totalHistoryPages: number;
  fetchHistory: () => void;
  selectedDocument: any;
  onSelectDocument: (doc: any) => void;
  renderRichDescription: (description: string, data: any, fields?: any[]) => React.ReactNode;
  onBackToDashboard: () => void;
  onBackToHistory: () => void;
  styles: any;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  currentScreen,
  loadingHistory,
  paginatedHistory,
  historySearchTerm,
  setHistorySearchTerm,
  historyPage,
  setHistoryPage,
  totalHistoryPages,
  fetchHistory,
  selectedDocument,
  onSelectDocument,
  renderRichDescription,
  onBackToDashboard,
  onBackToHistory,
  styles,
}) => {
  if (currentScreen === 'view_document' && selectedDocument) {
    return (
      <View style={styles.subView}>
        <View style={styles.subViewHeader}>
          <TouchableOpacity onPress={onBackToHistory} style={styles.backBtn}>
            <Text style={styles.backBtnText}>⬅️ Volver</Text>
          </TouchableOpacity>
          <Text style={styles.subViewTitle} numberOfLines={1}>{selectedDocument.template?.name}</Text>
        </View>
        <View style={[styles.formContainer, { backgroundColor: 'white', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }]}>
          
          {/* Header (Datos Empresa) */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 16, marginBottom: 16 }}>
            <View style={{ width: 50, height: 50, backgroundColor: '#004F9F', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 10, textAlign: 'center' }}>ESE{'\n'}Norte 3</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>ESE Norte 3</Text>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>NIT: 800.123.456-7 | Dir: Sede Principal</Text>
            </View>
          </View>

          {/* Título y Descripción con variables reemplazadas */}
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#004F9F', marginBottom: 8 }}>
            {selectedDocument.template?.name || 'Documento'}
          </Text>
          
          {renderRichDescription(selectedDocument.template?.description, selectedDocument.data || {}, selectedDocument.template?.fields || [])}

          <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 }} />

          {/* Renderizar los campos restantes que no son reemplazables fácilmente en el texto, como firmas o fotos */}
          {Object.keys(selectedDocument.data || {}).map((key: string) => {
            const val = selectedDocument.data[key];
            
            // Intentar encontrar el label del campo
            const fieldDef = (selectedDocument.template?.fields || []).find((f: any) => f.id === key);
            const fieldLabel = fieldDef ? fieldDef.label : key;
            
            const isMedia = typeof val === 'string' && (val.startsWith('file://') || val.startsWith('data:image/'));
            
            return (
              <View key={key} style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { fontSize: 12, color: '#9CA3AF' }]}>{fieldLabel}</Text>
                {isMedia ? (
                  <Image source={{ uri: val }} style={{ width: '100%', height: 150, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }} resizeMode="contain" />
                ) : (
                  <Text style={{ fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#F3F4F6' }}>
                    {val?.toString() || 'Sin respuesta'}
                  </Text>
                )}
              </View>
            );
          })}

          {selectedDocument.template?.footer ? (
            <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginBottom: 12 }}>
              {renderRichDescription(selectedDocument.template.footer, selectedDocument.data || {}, selectedDocument.template.fields || [])}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.subView}>
      <View style={styles.subViewHeader}>
        <TouchableOpacity onPress={onBackToDashboard} style={styles.backBtn}>
          <Text style={styles.backBtnText}>⬅️ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.subViewTitle}>Histórico</Text>
        <TouchableOpacity onPress={fetchHistory} style={{ padding: 8, backgroundColor: '#E0F2FE', borderRadius: 8 }}>
          <Text style={{ fontSize: 16 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 15 }}>
        <TextInput
          style={[styles.fieldInput, { backgroundColor: '#F9FAFB', marginBottom: 0 }]}
          placeholder="Buscar histórico..."
          value={historySearchTerm}
          onChangeText={(t) => {
            setHistorySearchTerm(t);
            setHistoryPage(1);
          }}
        />
      </View>

      {loadingHistory ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : paginatedHistory.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#6B7280' }}>No tienes documentos encontrados.</Text>
      ) : (
        <View>
          {paginatedHistory.map((doc: any) => (
            <View key={doc.id} style={styles.templateCard}>
              <Text style={styles.templateCardTitle}>{doc.template?.name || 'Documento sin nombre'}</Text>
              <Text style={styles.templateCardDesc}>Fecha: {new Date(doc.createdAt).toLocaleDateString()}</Text>
              <Text style={styles.templateCardDesc}>Estado: {doc.syncStatus}</Text>
              <TouchableOpacity 
                style={[styles.fillBtn, { backgroundColor: colors.accent }]} 
                onPress={() => onSelectDocument(doc)}
              >
                <Text style={styles.fillBtnText}>Ver Contenido</Text>
              </TouchableOpacity>
              {doc.filePath && (
                <TouchableOpacity 
                  style={[styles.fillBtn, { backgroundColor: '#10B981', marginTop: 10 }]} 
                  onPress={() => {
                    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.110.160:3000/api';
                    const baseUrl = API_URL.replace('/api', '');
                    const url = `${baseUrl}/uploads/${doc.filePath}`;
                    Linking.openURL(url).catch(() => {
                      Alert.alert('Error', 'No se pudo abrir el PDF');
                    });
                  }}
                >
                  <Text style={styles.fillBtnText}>Descargar PDF</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          {/* Paginación */}
          {totalHistoryPages > 1 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingHorizontal: 10 }}>
              <TouchableOpacity onPress={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} style={{ padding: 10, opacity: historyPage === 1 ? 0.5 : 1 }}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Anterior</Text>
              </TouchableOpacity>
              <Text style={{ color: '#4B5563' }}>{historyPage} / {totalHistoryPages}</Text>
              <TouchableOpacity onPress={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))} disabled={historyPage === totalHistoryPages} style={{ padding: 10, opacity: historyPage === totalHistoryPages ? 0.5 : 1 }}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

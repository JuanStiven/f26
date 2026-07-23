import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { colors } from '../theme/colors';

interface DraftsScreenProps {
  paginatedDrafts: any[];
  draftSearchTerm: string;
  setDraftSearchTerm: (term: string) => void;
  draftPage: number;
  setDraftPage: React.Dispatch<React.SetStateAction<number>>;
  totalDraftPages: number;
  loadDrafts: () => void;
  onSelectDraft: (draft: any) => void;
  onDeleteDraft: (draftId: string) => void;
  onBack: () => void;
  styles: any;
}

export const DraftsScreen: React.FC<DraftsScreenProps> = ({
  paginatedDrafts,
  draftSearchTerm,
  setDraftSearchTerm,
  draftPage,
  setDraftPage,
  totalDraftPages,
  loadDrafts,
  onSelectDraft,
  onDeleteDraft,
  onBack,
  styles,
}) => {
  return (
    <View style={styles.subView}>
      <View style={styles.subViewHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>⬅️ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.subViewTitle}>Borradores</Text>
        <TouchableOpacity onPress={loadDrafts} style={{ padding: 8, backgroundColor: '#E0F2FE', borderRadius: 8 }}>
          <Text style={{ fontSize: 16 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 15 }}>
        <TextInput
          style={[styles.fieldInput, { backgroundColor: '#F9FAFB', marginBottom: 0 }]}
          placeholder="Buscar borrador..."
          value={draftSearchTerm}
          onChangeText={(t) => {
            setDraftSearchTerm(t);
            setDraftPage(1);
          }}
        />
      </View>

      {paginatedDrafts.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#6B7280' }}>No tienes borradores encontrados.</Text>
      ) : (
        <View>
          {paginatedDrafts.map((draft: any) => (
            <View key={draft.id} style={styles.templateCard}>
              <Text style={styles.templateCardTitle}>{draft.template?.name || 'Documento sin nombre'}</Text>
              <Text style={styles.templateCardDesc}>Guardado: {new Date(draft.savedAt).toLocaleString()}</Text>
              <Text style={styles.templateCardDesc}>Campos llenos: {Object.keys(draft.data || {}).length}</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity 
                  style={[styles.fillBtn, { backgroundColor: '#F59E0B', flex: 1, marginRight: 8 }]} 
                  onPress={() => onSelectDraft(draft)}
                >
                  <Text style={styles.fillBtnText}>Completar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.fillBtn, { backgroundColor: '#EF4444', flex: 1, marginLeft: 8 }]} 
                  onPress={() => {
                    Alert.alert(
                      'Descartar',
                      '¿Seguro que deseas eliminar este borrador permanentemente?',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Eliminar', style: 'destructive', onPress: () => onDeleteDraft(draft.id) }
                      ]
                    );
                  }}
                >
                  <Text style={styles.fillBtnText}>Descartar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          {/* Paginación */}
          {totalDraftPages > 1 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingHorizontal: 10 }}>
              <TouchableOpacity onPress={() => setDraftPage(p => Math.max(1, p - 1))} disabled={draftPage === 1} style={{ padding: 10, opacity: draftPage === 1 ? 0.5 : 1 }}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Anterior</Text>
              </TouchableOpacity>
              <Text style={{ color: '#4B5563' }}>{draftPage} / {totalDraftPages}</Text>
              <TouchableOpacity onPress={() => setDraftPage(p => Math.min(totalDraftPages, p + 1))} disabled={draftPage === totalDraftPages} style={{ padding: 10, opacity: draftPage === totalDraftPages ? 0.5 : 1 }}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

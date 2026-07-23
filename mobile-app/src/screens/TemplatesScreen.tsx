import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

interface TemplatesScreenProps {
  loadingTemplates: boolean;
  paginatedTemplates: any[];
  templateSearchTerm: string;
  setTemplateSearchTerm: (term: string) => void;
  templatePage: number;
  setTemplatePage: React.Dispatch<React.SetStateAction<number>>;
  totalTemplatePages: number;
  fetchTemplates: () => void;
  onSelectTemplate: (template: any) => void;
  onBack: () => void;
  styles: any;
}

export const TemplatesScreen: React.FC<TemplatesScreenProps> = ({
  loadingTemplates,
  paginatedTemplates,
  templateSearchTerm,
  setTemplateSearchTerm,
  templatePage,
  setTemplatePage,
  totalTemplatePages,
  fetchTemplates,
  onSelectTemplate,
  onBack,
  styles,
}) => {
  return (
    <View style={styles.subView}>
      <View style={styles.subViewHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>⬅️ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.subViewTitle}>Plantillas Asignadas</Text>
        <TouchableOpacity onPress={fetchTemplates} style={{ padding: 8, backgroundColor: '#E0F2FE', borderRadius: 8 }}>
          <Text style={{ fontSize: 16 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 15 }}>
        <TextInput
          style={[styles.fieldInput, { backgroundColor: '#F9FAFB', marginBottom: 0 }]}
          placeholder="Buscar plantilla..."
          value={templateSearchTerm}
          onChangeText={(t) => {
            setTemplateSearchTerm(t);
            setTemplatePage(1);
          }}
        />
      </View>

      {loadingTemplates ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : paginatedTemplates.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#6B7280' }}>No hay plantillas disponibles.</Text>
      ) : (
        <View>
          {paginatedTemplates.map((template) => (
            <View key={template.id} style={styles.templateCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.templateCardTitle, { flex: 1, marginRight: 8 }]}>{template.name}</Text>
                {template.isDocxTemplate && (
                  <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, color: '#1D4ED8', fontWeight: 'bold' }}>
                      📄 DOCX
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.templateCardDesc} numberOfLines={2}>{template.description || 'Modelo de plantilla importado .docx'}</Text>
              <TouchableOpacity 
                style={styles.fillBtn} 
                onPress={() => onSelectTemplate(template)}
              >
                <Text style={styles.fillBtnText}>Diligenciar Formulario</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          {/* Paginación */}
          {totalTemplatePages > 1 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingHorizontal: 10 }}>
              <TouchableOpacity 
                onPress={() => setTemplatePage(p => Math.max(1, p - 1))}
                disabled={templatePage === 1}
                style={{ padding: 10, opacity: templatePage === 1 ? 0.5 : 1 }}
              >
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Anterior</Text>
              </TouchableOpacity>
              <Text style={{ color: '#4B5563' }}>{templatePage} / {totalTemplatePages}</Text>
              <TouchableOpacity 
                onPress={() => setTemplatePage(p => Math.min(totalTemplatePages, p + 1))}
                disabled={templatePage === totalTemplatePages}
                style={{ padding: 10, opacity: templatePage === totalTemplatePages ? 0.5 : 1 }}
              >
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

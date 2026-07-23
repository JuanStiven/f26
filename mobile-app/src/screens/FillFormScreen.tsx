import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../theme/colors';

const getImageUri = (uri: string) => {
  if (!uri || typeof uri !== 'string') return uri;
  if (uri.startsWith('data:image/') || uri.startsWith('file://') || uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.110.160:3000/api';
  const baseUrl = API_URL.replace('/api', '');
  const cleanPath = uri.startsWith('/') ? uri : `/${uri}`;
  return `${baseUrl}${cleanPath}`;
};

interface FillFormScreenProps {
  selectedTemplate: any;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  showDocumentPreview: boolean;
  setShowDocumentPreview: (show: boolean) => void;
  renderRichDescription: (description: string, data: any, fields?: any[]) => React.ReactNode;
  showDatePicker: { visible: boolean; fieldId: string | null; mode?: 'date' | 'time' | 'datetime' };
  setShowDatePicker: React.Dispatch<React.SetStateAction<{ visible: boolean; fieldId: string | null; mode?: 'date' | 'time' | 'datetime' }>>;
  parseDateString: (str: string) => Date;
  formatDate: (date: Date) => string;
  handleTakePhoto: (fieldId: string) => void;
  setActiveSignatureFieldId: (id: string | null) => void;
  setSignatureModalVisible: (visible: boolean) => void;
  setActiveRichTextFieldId: (id: string | null) => void;
  setActiveRichTextLabel: (label: string) => void;
  setTempRichTextHtml: (html: string) => void;
  setInitialRichTextHtml: (html: string) => void;
  setRichTextModalVisible: (visible: boolean) => void;
  handleSaveDocument: () => void;
  saveDraft: () => void;
  onBack: () => void;
  styles: any;
}

export const FillFormScreen: React.FC<FillFormScreenProps> = ({
  selectedTemplate,
  formData,
  setFormData,
  showDocumentPreview,
  setShowDocumentPreview,
  renderRichDescription,
  showDatePicker,
  setShowDatePicker,
  parseDateString,
  formatDate,
  handleTakePhoto,
  setActiveSignatureFieldId,
  setSignatureModalVisible,
  setActiveRichTextFieldId,
  setActiveRichTextLabel,
  setTempRichTextHtml,
  setInitialRichTextHtml,
  setRichTextModalVisible,
  handleSaveDocument,
  saveDraft,
  onBack,
  styles,
}) => {
  return (
    <View style={styles.subView}>
      <View style={styles.subViewHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>⬅️ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.subViewTitle} numberOfLines={1}>{selectedTemplate.name}</Text>
      </View>

      <View style={styles.formContainer}>
        {selectedTemplate.description ? (
          <View style={{ marginBottom: 16, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' }}>
            <TouchableOpacity 
              onPress={() => setShowDocumentPreview(!showDocumentPreview)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.primary }}>
                  📄 Vista Previa del Documento {selectedTemplate.isDocxTemplate ? '(.docx)' : ''}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: 'bold' }}>
                {showDocumentPreview ? 'Ocultar ▲' : 'Mostrar ▼'}
              </Text>
            </TouchableOpacity>
            {showDocumentPreview && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                {renderRichDescription(selectedTemplate.description, formData || {}, selectedTemplate.fields || [])}
              </View>
            )}
          </View>
        ) : null}
        
        {selectedTemplate.fields?.map((field: any, index: number) => {
          const showCategory = index === 0 || field.category !== selectedTemplate.fields[index - 1].category;
          return (
            <View key={field.id}>
              {showCategory && field.category && (
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryHeaderText}>{field.category}</Text>
                </View>
              )}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{field.label} {field.required ? '*' : ''}</Text>
                
                {field.type === 'text' && (
                  <TextInput 
                    style={styles.fieldInput} 
                    placeholder="Escribe aquí..."
                    value={formData[field.id] || ''}
                    onChangeText={(t) => setFormData((prev: any) => ({...prev, [field.id]: t}))}
                  />
                )}
                
                {field.type === 'number' && (
                  <TextInput 
                    style={styles.fieldInput} 
                    placeholder="Ej. 123"
                    keyboardType="numeric"
                    value={formData[field.id] || ''}
                    onChangeText={(t) => setFormData((prev: any) => ({...prev, [field.id]: t}))}
                  />
                )}

                {field.type === 'date' && (
                  <View>
                    <TouchableOpacity onPress={() => setShowDatePicker({ visible: true, fieldId: field.id, mode: 'date' })} style={[styles.fieldInput, { justifyContent: 'center' }]}>
                      <Text style={{ color: formData[field.id] ? colors.text : '#A1A1AA' }}>
                        {formData[field.id] || 'DD/MM/AAAA'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {field.type === 'time' && (
                  <View>
                    <TouchableOpacity onPress={() => setShowDatePicker({ visible: true, fieldId: field.id, mode: 'time' })} style={[styles.fieldInput, { justifyContent: 'center' }]}>
                      <Text style={{ color: formData[field.id] ? colors.text : '#A1A1AA' }}>
                        {formData[field.id] || 'HH:MM'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {field.type === 'datetime' && (
                  <View>
                    <TouchableOpacity onPress={() => setShowDatePicker({ visible: true, fieldId: field.id, mode: 'datetime' })} style={[styles.fieldInput, { justifyContent: 'center' }]}>
                      <Text style={{ color: formData[field.id] ? colors.text : '#A1A1AA' }}>
                        {formData[field.id] || 'DD/MM/AAAA HH:MM'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {field.type === 'textarea' && (
                  <View>
                    {formData[field.id] ? (
                      <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, backgroundColor: 'white', minHeight: 60, marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, color: '#374151' }}>
                          {formData[field.id].replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim() || '(Texto vacío)'}
                        </Text>
                      </View>
                    ) : null}
                    <TouchableOpacity 
                      style={styles.signatureBtn} 
                      onPress={() => {
                        const initialVal = formData[field.id] || '';
                        setActiveRichTextFieldId(field.id);
                        setActiveRichTextLabel(field.label);
                        setTempRichTextHtml(initialVal);
                        setInitialRichTextHtml(initialVal);
                        setRichTextModalVisible(true);
                      }}
                    >
                      <Text style={styles.signatureBtnText}>✍️ Editar Texto Enriquecido</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {showDatePicker.visible && showDatePicker.fieldId === field.id && (
                  <DateTimePicker
                    value={(() => {
                      try {
                        if (showDatePicker.mode === 'time') {
                          if (formData[field.id]) {
                            const [h, m] = formData[field.id].split(':');
                            const d = new Date();
                            d.setHours(parseInt(h, 10), parseInt(m, 10));
                            return d;
                          }
                          return new Date();
                        } else {
                          return parseDateString(formData[field.id]);
                        }
                      } catch (e) {
                        return new Date();
                      }
                    })()}
                    mode={showDatePicker.mode || 'date'}
                    is24Hour={true}
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker({ visible: false, fieldId: null, mode: 'date' });
                      if (selectedDate && event.type !== 'dismissed') {
                        if (showDatePicker.mode === 'time') {
                          const hours = String(selectedDate.getHours()).padStart(2, '0');
                          const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
                          setFormData((prev: any) => ({...prev, [field.id]: `${hours}:${minutes}`}));
                        } else if (showDatePicker.mode === 'datetime') {
                          const formattedDate = formatDate(selectedDate);
                          const hours = String(selectedDate.getHours()).padStart(2, '0');
                          const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
                          setFormData((prev: any) => ({...prev, [field.id]: `${formattedDate} ${hours}:${minutes}`}));
                        } else {
                          const formattedDate = formatDate(selectedDate);
                          setFormData((prev: any) => ({...prev, [field.id]: formattedDate}));
                        }
                      }
                    }}
                  />
                )}
                
                {field.type === 'photo' && (
                  <View>
                    {formData[field.id] ? (
                      <View style={{ position: 'relative' }}>
                        <Image source={{ uri: getImageUri(formData[field.id]) }} style={{ width: '100%', height: 200, borderRadius: 8 }} resizeMode="cover" />
                        <TouchableOpacity 
                          style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 }}
                          onPress={() => handleTakePhoto(field.id)}
                        >
                          <Text style={{ color: 'white', fontSize: 12 }}>🔄 Retomar</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.photoBtn} onPress={() => handleTakePhoto(field.id)}>
                        <Text style={styles.photoBtnText}>📸 Tomar Foto</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                
                {field.type === 'signature' && (
                  <View>
                    {formData[field.id] ? (
                      <View style={{ position: 'relative', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, overflow: 'hidden', backgroundColor: 'white' }}>
                        <Image source={{ uri: getImageUri(formData[field.id]) }} style={{ width: '100%', height: 150 }} resizeMode="contain" />
                        <TouchableOpacity 
                          style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 }}
                          onPress={() => {
                            setActiveSignatureFieldId(field.id);
                            setSignatureModalVisible(true);
                          }}
                        >
                          <Text style={{ color: 'white', fontSize: 12 }}>🔄 Firmar de nuevo</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.signatureBtn} onPress={() => {
                        setActiveSignatureFieldId(field.id);
                        setSignatureModalVisible(true);
                      }}>
                        <Text style={styles.signatureBtnText}>✍️ Firmar Documento</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {field.type === 'dropdown' && (
                  <View style={[styles.fieldInput, { padding: 0, justifyContent: 'center' }]}>
                    <Picker
                      selectedValue={formData[field.id] || ''}
                      onValueChange={(itemValue) => setFormData((prev: any) => ({...prev, [field.id]: itemValue}))}
                      style={{ width: '100%', color: formData[field.id] ? colors.text : '#A1A1AA' }}
                    >
                      <Picker.Item label="Seleccionar opción..." value="" color="#A1A1AA" />
                      {(field.options || []).map((opt: string, i: number) => (
                        <Picker.Item key={i} label={opt} value={opt} color={colors.text} />
                      ))}
                    </Picker>
                  </View>
                )}

                {field.type === 'table' && (
                  <View style={{ marginTop: 8 }}>
                    <ScrollView horizontal style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginBottom: 8, backgroundColor: 'white' }}>
                      <View>
                        <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 8, borderBottomWidth: 1, borderColor: '#E5E7EB' }}>
                          {(field.columns || []).map((col: string, i: number) => (
                            <Text key={i} style={{ width: 120, fontWeight: 'bold', fontSize: 12, color: '#4B5563', marginRight: 8 }} numberOfLines={1}>{col}</Text>
                          ))}
                          <Text style={{ width: 40 }}></Text>
                        </View>
                        {Array.isArray(formData[field.id]) && formData[field.id].map((row: any, rowIndex: number) => (
                          <View key={rowIndex} style={{ flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderColor: '#F3F4F6' }}>
                            {(field.columns || []).map((col: string, colIndex: number) => (
                              <TextInput
                                key={colIndex}
                                style={{ width: 120, height: 35, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 4, paddingHorizontal: 8, marginRight: 8, fontSize: 12, backgroundColor: '#F9FAFB' }}
                                value={row[col] || ''}
                                onChangeText={(t) => {
                                  const newData = [...(formData[field.id] || [])];
                                  newData[rowIndex] = { ...newData[rowIndex], [col]: t };
                                  setFormData((prev: any) => ({ ...prev, [field.id]: newData }));
                                }}
                                placeholder={col}
                              />
                            ))}
                            <TouchableOpacity 
                              style={{ width: 40, height: 35, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 4 }}
                              onPress={() => {
                                const newData = [...(formData[field.id] || [])];
                                newData.splice(rowIndex, 1);
                                setFormData((prev: any) => ({ ...prev, [field.id]: newData }));
                              }}
                            >
                              <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: 'bold' }}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                    <TouchableOpacity 
                      style={{ backgroundColor: '#EFF6FF', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' }}
                      onPress={() => {
                        const newRow: any = {};
                        (field.columns || []).forEach((c: string) => newRow[c] = '');
                        setFormData((prev: any) => ({ ...prev, [field.id]: [...(prev[field.id] || []), newRow] }));
                      }}
                    >
                      <Text style={{ color: '#004F9F', fontWeight: 'bold', fontSize: 12 }}>+ Agregar Fila</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {selectedTemplate.footer ? (
          <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginBottom: 12 }}>
            {renderRichDescription(selectedTemplate.footer, formData || {}, selectedTemplate.fields || [])}
          </View>
        ) : null}

        <TouchableOpacity 
          style={[styles.button, styles.buttonPrimary, { marginTop: 20 }]}
          onPress={handleSaveDocument}
        >
          <Text style={styles.buttonText}>Guardar Documento</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { marginTop: 10, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#004F9F' }]}
          onPress={saveDraft}
        >
          <Text style={[styles.buttonText, { color: '#004F9F' }]}>Guardar como Borrador</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

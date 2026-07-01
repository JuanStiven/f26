import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert,
  Modal,
  Image,
  Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import SignatureScreen from 'react-native-signature-canvas';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './src/theme/colors';

// Datos de simulación para los empleados de la ESE Norte 3
const EMPLOYEES_DB = [
  { id: '1', name: 'Carlos Mario Torres', doc: '1098765432', pin: '1234', role: 'Operario de Campo', status: 'Activo' },
  { id: '2', name: 'Laura Camila Ortiz', doc: '1087654321', pin: '5678', role: 'Enfermera Jefa', status: 'Activo' },
  { id: '3', name: 'Andrés Felipe Restrepo', doc: '1076543210', pin: '0000', role: 'Técnico Domiciliario', status: 'Inactivo' }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  
  // Login Form States
  const [docNumber, setDocNumber] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // App Navigation States
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'templates' | 'offline_docs' | 'fill_form' | 'history' | 'view_document' | 'drafts'>('dashboard');
  const [isOnline, setIsOnline] = useState(true);

  // Formulario Dinámico (Simulado para llenar en la tablet)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [showDatePicker, setShowDatePicker] = useState<{ visible: boolean, fieldId: string | null }>({ visible: false, fieldId: null });
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [activeSignatureFieldId, setActiveSignatureFieldId] = useState<string | null>(null);
  const signatureRef = useRef<any>(null);

  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [templatePage, setTemplatePage] = useState(1);
  const TEMPLATES_PER_PAGE = 5;

  const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(templateSearchTerm.toLowerCase()));
  const totalTemplatePages = Math.ceil(filteredTemplates.length / TEMPLATES_PER_PAGE);
  const paginatedTemplates = filteredTemplates.slice((templatePage - 1) * TEMPLATES_PER_PAGE, templatePage * TEMPLATES_PER_PAGE);

  // Historial
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PER_PAGE = 5;

  const filteredHistory = history.filter(d => (d.template?.name || '').toLowerCase().includes(historySearchTerm.toLowerCase()));
  const totalHistoryPages = Math.ceil(filteredHistory.length / HISTORY_PER_PAGE);
  const paginatedHistory = filteredHistory.slice((historyPage - 1) * HISTORY_PER_PAGE, historyPage * HISTORY_PER_PAGE);

  // Borradores
  const [drafts, setDrafts] = useState<any[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [draftSearchTerm, setDraftSearchTerm] = useState('');
  const [draftPage, setDraftPage] = useState(1);
  const DRAFTS_PER_PAGE = 5;

  const filteredDrafts = drafts.filter(d => (d.template?.name || '').toLowerCase().includes(draftSearchTerm.toLowerCase()));
  const totalDraftPages = Math.ceil(filteredDrafts.length / DRAFTS_PER_PAGE);
  const paginatedDrafts = filteredDrafts.slice((draftPage - 1) * DRAFTS_PER_PAGE, draftPage * DRAFTS_PER_PAGE);

  // Offline Docs
  const [offlineDocs, setOfflineDocs] = useState<any[]>([]);
  const [offlineSearchTerm, setOfflineSearchTerm] = useState('');
  const [offlinePage, setOfflinePage] = useState(1);
  const OFFLINE_PER_PAGE = 5;

  const filteredOffline = offlineDocs.filter(d => (d.template?.name || '').toLowerCase().includes(offlineSearchTerm.toLowerCase()));
  const totalOfflinePages = Math.ceil(filteredOffline.length / OFFLINE_PER_PAGE);
  const paginatedOffline = filteredOffline.slice((offlinePage - 1) * OFFLINE_PER_PAGE, offlinePage * OFFLINE_PER_PAGE);

  React.useEffect(() => {
    if (isAuthenticated && userToken) {
      fetchTemplates();
      loadDrafts();
      loadOfflineDocs();
    }
  }, [isAuthenticated, userToken]);

  const loadDrafts = async () => {
    try {
      const storedDrafts = await AsyncStorage.getItem('@drafts_' + currentUser?.id);
      if (storedDrafts) {
        setDrafts(JSON.parse(storedDrafts));
      } else {
        setDrafts([]);
      }
    } catch (e) {
      console.error('Error loading drafts', e);
    }
  };

  const loadOfflineDocs = async () => {
    try {
      const stored = await AsyncStorage.getItem('@offline_docs_' + currentUser?.id);
      if (stored) {
        setOfflineDocs(JSON.parse(stored));
      } else {
        setOfflineDocs([]);
      }
    } catch (e) {
      console.error('Error loading offline docs', e);
    }
  };

  const saveOfflineDoc = async (doc: any) => {
    try {
      const newDocs = [doc, ...offlineDocs];
      await AsyncStorage.setItem('@offline_docs_' + currentUser?.id, JSON.stringify(newDocs));
      setOfflineDocs(newDocs);
    } catch (e) {
      console.error('Error saving offline doc', e);
    }
  };

  const syncOfflineDocs = async () => {
    if (offlineDocs.length === 0) {
      Alert.alert('Info', 'No hay documentos pendientes por sincronizar.');
      return;
    }
    
    let successCount = 0;
    const remainingDocs = [];
    
    for (const doc of offlineDocs) {
      try {
        const userToken = await AsyncStorage.getItem('@userToken');
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.110.160:3000/api';
        
        const response = await fetch(`${API_URL}/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({
            templateId: doc.template.id,
            formData: doc.data
          })
        });
        
        const resData = await response.json();
        if (resData.success) {
          successCount++;
        } else {
          remainingDocs.push(doc);
        }
      } catch (e) {
        remainingDocs.push(doc);
      }
    }
    
    await AsyncStorage.setItem('@offline_docs_' + currentUser?.id, JSON.stringify(remainingDocs));
    setOfflineDocs(remainingDocs);
    
    if (successCount > 0) {
      Alert.alert('Sincronización', `Se sincronizaron ${successCount} documento(s) correctamente.`);
      fetchHistory();
    } else {
      Alert.alert('Error', 'No se pudieron sincronizar los documentos. Verifica tu conexión.');
    }
  };

  const saveDraft = async () => {
    if (!selectedTemplate) return;
    try {
      let newDrafts = [...drafts];
      
      if (activeDraftId) {
        // Update existing draft
        newDrafts = newDrafts.map(d => 
          d.id === activeDraftId 
            ? { ...d, data: formData, savedAt: new Date().toISOString() } 
            : d
        );
      } else {
        // Create new draft
        const newDraft = {
          id: Date.now().toString(),
          template: selectedTemplate,
          data: formData,
          savedAt: new Date().toISOString()
        };
        newDrafts = [newDraft, ...drafts];
      }

      await AsyncStorage.setItem('@drafts_' + currentUser?.id, JSON.stringify(newDrafts));
      setDrafts(newDrafts);
      Alert.alert('Guardado', 'El borrador ha sido guardado exitosamente.');
      setFormData({});
      setSelectedTemplate(null);
      setActiveDraftId(null);
      setCurrentScreen('dashboard');
    } catch (e) {
      console.log('Error saving draft', e);
      Alert.alert('Error', 'No se pudo guardar el borrador.');
    }
  };

  const deleteDraft = async (draftId: string) => {
    try {
      const updatedDrafts = drafts.filter(d => d.id !== draftId);
      await AsyncStorage.setItem('@drafts_' + currentUser?.id, JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
      Alert.alert('Borrador eliminado', 'El borrador ha sido descartado.');
    } catch (e) {
      console.log('Error deleting draft', e);
    }
  };



  const fetchHistory = async () => {
    if (!userToken) return;
    setLoadingHistory(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.110.160:3000/api';
      const response = await fetch(`${API_URL}/documents/history`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchTemplates = async () => {
    if (!userToken) return;
    setLoadingTemplates(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.110.160:3000/api';
      const response = await fetch(`${API_URL}/templates`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTemplates(data.data);
      }
    } catch (e) {
      console.log('Error fetching templates', e);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Manejar Login
  const handleLogin = async () => {
    setErrorMessage('');
    if (!docNumber.trim() || !pinCode.trim()) {
      setErrorMessage('Por favor ingresa tu número de cédula y PIN de seguridad.');
      return;
    }

    setIsLoading(true);

    try {
      // Determinar la URL correcta dependiendo del entorno (Emulador Android vs Web/iOS)
      // Usamos la IP de la máquina de desarrollo porque un celular físico no entiende "localhost"
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.110.160:3000/api';
      
      const response = await fetch(`${API_URL}/auth/login/employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document: docNumber.trim(), pin: pinCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setIsLoading(false);
        setErrorMessage(data.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        return;
      }

      // Login exitoso
      setIsLoading(false);
      setCurrentUser(data.user); // El backend devuelve el usuario en data.user
      setUserToken(data.token);
      setIsAuthenticated(true);
      setDocNumber('');
      setPinCode('');
    } catch (error) {
      setIsLoading(false);
      setErrorMessage('Error de conexión con el servidor. Verifica que el backend esté en ejecución.');
      console.error('Login error:', error);
    }
  };

  const quickFill = (doc: string, pin: string) => {
    setDocNumber(doc);
    setPinCode(pin);
    setErrorMessage('');
  };

  const renderRichDescription = (description: string, data: any, fields: any[] = []) => {
    if (!description) return <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 16 }}>Sin descripción</Text>;

    const mappedData: Record<string, any> = {};
    Object.keys(data || {}).forEach(key => {
      const fieldDef = fields.find((f: any) => f.id === key);
      if (fieldDef && fieldDef.label) {
        let val = data[key];
        if (fieldDef.type === 'select') {
          const option = fieldDef.options?.find((o: any) => String(o.id) === String(val) || String(o.value) === String(val));
          if (option) val = option.label || option.value;
        }
        mappedData[fieldDef.label] = val;
      }
    });

    // Replace {{variable}} tokens with data values, handling images/tables as placeholders
    let processed = description;
    const blockTokens: { placeholder: string; type: 'image' | 'table'; value: any }[] = [];

    Object.keys(mappedData).forEach(label => {
      const value = mappedData[label];
      const regex = new RegExp(`{{\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*}}`, 'gi');
      
      if (typeof value === 'string' && (value.startsWith('data:image/') || value.startsWith('file://'))) {
        const placeholder = `__IMG_${label.replace(/\s+/g, '_')}__`;
        processed = processed.replace(regex, placeholder);
        blockTokens.push({ placeholder, type: 'image', value });
      } else if (Array.isArray(value)) {
        const placeholder = `__TBL_${label.replace(/\s+/g, '_')}__`;
        processed = processed.replace(regex, placeholder);
        blockTokens.push({ placeholder, type: 'table', value });
      } else if (value !== undefined) {
        processed = processed.replace(regex, String(value));
      }
    });

    // Decode HTML entities
    const decodeEntities = (str: string) => str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ');

    // Strip all HTML tags from a string
    const stripHtml = (str: string) => decodeEntities(str.replace(/<[^>]*>/g, ''));

    // Parse inline HTML formatting into styled Text elements
    const renderInlineHtml = (html: string, baseKey: string): React.ReactNode[] => {
      const elements: React.ReactNode[] = [];
      let cleaned = html.replace(/<\/?(?:p|div|br)[^>]*>/gi, ' ');
      
      // Check for block placeholders (images/tables)
      for (const bt of blockTokens) {
        if (cleaned.includes(bt.placeholder)) {
          const parts = cleaned.split(bt.placeholder);
          parts.forEach((part, idx) => {
            const trimmedPart = stripHtml(part).trim();
            if (trimmedPart) {
              elements.push(<Text key={`${baseKey}-part-${idx}`} style={{ fontSize: 14, color: '#4B5563' }}>{trimmedPart}</Text>);
            }
            if (idx < parts.length - 1) {
              if (bt.type === 'image') {
                elements.push(
                  <Image
                    key={`${baseKey}-img-${idx}`}
                    source={{ uri: bt.value }}
                    style={{ width: '100%', height: 150, resizeMode: 'contain', marginVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}
                  />
                );
              } else if (bt.type === 'table' && bt.value.length > 0) {
                const cols = Object.keys(bt.value[0]);
                elements.push(
                  <View key={`${baseKey}-tbl-${idx}`} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginVertical: 8, overflow: 'hidden' }}>
                    <ScrollView horizontal>
                      <View>
                        <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 8, borderBottomWidth: 1, borderColor: '#E5E7EB' }}>
                          {cols.map(c => <Text key={`th-${c}`} style={{ width: 100, fontWeight: 'bold', fontSize: 12, color: '#4B5563', marginRight: 8 }} numberOfLines={1}>{c}</Text>)}
                        </View>
                        {bt.value.map((r: any, rIdx: number) => (
                          <View key={`tr-${rIdx}`} style={{ flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderColor: '#F3F4F6' }}>
                            {cols.map(c => <Text key={`td-${c}`} style={{ width: 100, fontSize: 12, color: '#374151', marginRight: 8 }} numberOfLines={2}>{String(r[c] || '')}</Text>)}
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                );
              }
            }
          });
          return elements;
        }
      }

      // Parse inline formatting tags
      const tokens: { text: string; bold: boolean; italic: boolean; underline: boolean; strike: boolean }[] = [];
      let currentText = '';
      let bold = false, italic = false, underline = false, strike = false;
      let i = 0;

      while (i < cleaned.length) {
        if (cleaned[i] === '<') {
          const tagEnd = cleaned.indexOf('>', i);
          if (tagEnd === -1) {
            currentText += cleaned[i];
            i++;
            continue;
          }
          const tagStr = cleaned.substring(i, tagEnd + 1);
          if (currentText) {
            tokens.push({ text: decodeEntities(currentText), bold, italic, underline, strike });
            currentText = '';
          }
          if (/<strong[^>]*>/i.test(tagStr)) bold = true;
          else if (/<\/strong>/i.test(tagStr)) bold = false;
          else if (/<em[^>]*>/i.test(tagStr)) italic = true;
          else if (/<\/em>/i.test(tagStr)) italic = false;
          else if (/<u[^>]*>/i.test(tagStr)) underline = true;
          else if (/<\/u>/i.test(tagStr)) underline = false;
          else if (/<s[^>]*>/i.test(tagStr)) strike = true;
          else if (/<\/s>/i.test(tagStr)) strike = false;
          i = tagEnd + 1;
        } else {
          currentText += cleaned[i];
          i++;
        }
      }
      if (currentText) {
        tokens.push({ text: decodeEntities(currentText), bold, italic, underline, strike });
      }

      return tokens.map((t, idx) => {
        const st: any = {};
        if (t.bold) st.fontWeight = 'bold';
        if (t.italic) st.fontStyle = 'italic';
        if (t.underline) st.textDecorationLine = 'underline';
        if (t.strike) st.textDecorationLine = 'line-through';
        return <Text key={`${baseKey}-t-${idx}`} style={st}>{t.text}</Text>;
      });
    };

    // Parse HTML block elements
    const blocks: React.ReactNode[] = [];
    
    // Remove list wrappers, normalize
    let htmlContent = processed
      .replace(/<\/?ul[^>]*>/gi, '')
      .replace(/<\/?ol[^>]*>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n');

    const blockPattern = /<(h[1-3]|p|li|blockquote|hr)((?:\s+[^>]*)?)>([\s\S]*?)<\/\1>/gi;
    let blockIndex = 0;
    let match;
    let foundBlocks = false;

    while ((match = blockPattern.exec(htmlContent)) !== null) {
      foundBlocks = true;
      const tag = match[1].toLowerCase();
      const attrs = match[2] || '';
      const content = match[3];

      // Get alignment from style attribute
      let align: 'left' | 'right' | 'center' | 'justify' = 'left';
      const styleMatch = attrs.match(/style="[^"]*text-align:\s*(left|center|right|justify)/i);
      if (styleMatch) {
        align = styleMatch[1].toLowerCase() as typeof align;
      }

      const key = `block-${blockIndex++}`;

      if (tag === 'hr') {
        blocks.push(<View key={key} style={{ borderBottomWidth: 1, borderColor: '#E5E7EB', marginVertical: 12 }} />);
      } else if (tag === 'h1') {
        blocks.push(
          <Text key={key} style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 14, marginBottom: 6, textAlign: align }}>
            {renderInlineHtml(content, key)}
          </Text>
        );
      } else if (tag === 'h2') {
        blocks.push(
          <Text key={key} style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 12, marginBottom: 4, textAlign: align }}>
            {renderInlineHtml(content, key)}
          </Text>
        );
      } else if (tag === 'h3') {
        blocks.push(
          <Text key={key} style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 10, marginBottom: 4, textAlign: align }}>
            {renderInlineHtml(content, key)}
          </Text>
        );
      } else if (tag === 'li') {
        blocks.push(
          <View key={key} style={{ flexDirection: 'row', marginBottom: 4, paddingLeft: 8 }}>
            <Text style={{ fontSize: 14, color: '#4B5563', marginRight: 6 }}>•</Text>
            <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22, flex: 1, textAlign: align }}>
              {renderInlineHtml(content, key)}
            </Text>
          </View>
        );
      } else if (tag === 'blockquote') {
        blocks.push(
          <View key={key} style={{ borderLeftWidth: 3, borderLeftColor: '#E5E7EB', paddingLeft: 12, marginVertical: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280', fontStyle: 'italic', lineHeight: 22, textAlign: align }}>
              {renderInlineHtml(content, key)}
            </Text>
          </View>
        );
      } else {
        // Default: <p> tag
        const inlineElements = renderInlineHtml(content, key);
        // Check if it contains block elements (images/tables)
        const hasBlockElements = inlineElements.some((el: any) => 
          el?.type === View || el?.type === Image
        );
        if (hasBlockElements) {
          blocks.push(
            <View key={key} style={{ marginBottom: 4 }}>
              {inlineElements}
            </View>
          );
        } else {
          const plainText = stripHtml(content).trim();
          if (!plainText) {
            blocks.push(<View key={key} style={{ height: 8 }} />);
          } else {
            blocks.push(
              <Text key={key} style={{ fontSize: 14, color: '#4B5563', lineHeight: 22, marginBottom: 4, textAlign: align }}>
                {inlineElements}
              </Text>
            );
          }
        }
      }
    }

    // If no HTML blocks found, fall back to rendering plain text
    if (!foundBlocks) {
      const plainText = stripHtml(processed).trim();
      if (plainText) {
        blocks.push(
          <Text key="fallback" style={{ fontSize: 14, color: '#4B5563', lineHeight: 22 }}>
            {plainText}
          </Text>
        );
      }
    }

    return <View>{blocks}</View>;
  };

  const handleSaveDocument = async () => {
    if (!selectedTemplate) return;
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.110.160:3000/api';
      const response = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          formData: formData
        })
      });
      
      const data = await response.json();
      if (data.success) {
        Alert.alert('¡Éxito!', 'Documento guardado y sincronizado exitosamente.');
        
        // Si venía de un borrador, lo eliminamos porque ya se completó y guardó
        if (activeDraftId) {
          deleteDraft(activeDraftId);
        }

        setFormData({});
        setSelectedTemplate(null);
        setActiveDraftId(null);
        setCurrentScreen('dashboard');
        fetchHistory(); // Actualizar el historial
      } else {
        Alert.alert('Error', data.message || 'No se pudo guardar el documento.');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      Alert.alert('Modo Offline', 'No se pudo conectar con el servidor. El documento se ha guardado localmente y podrás sincronizarlo luego.');
      
      saveOfflineDoc({
        id: Date.now().toString(),
        template: selectedTemplate,
        data: formData,
        createdAt: new Date().toISOString(),
        operator: currentUser?.name || 'Operario',
        status: '⏳ Guardado Local'
      });

      if (activeDraftId) {
        deleteDraft(activeDraftId);
      }

      setFormData({});
      setSelectedTemplate(null);
      setActiveDraftId(null);
      setCurrentScreen('dashboard');
    }
  };

  const handleTakePhoto = async (fieldId: string) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permiso Denegado", "Se requieren permisos de cámara para tomar fotos.");
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setFormData((prev: any) => ({...prev, [fieldId]: base64Image}));
    }
  };

  const handleSignatureOK = (signature: string) => {
    if (activeSignatureFieldId) {
      setFormData((prev: any) => ({...prev, [activeSignatureFieldId]: signature}));
    }
    setSignatureModalVisible(false);
    setActiveSignatureFieldId(null);
  };

  // Cierre de Sesión
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir del sistema?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, Salir', 
          style: 'destructive',
          onPress: () => {
            setIsAuthenticated(false);
            setCurrentUser(null);
            setUserToken(null);
            setCurrentScreen('dashboard');
          } 
        }
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom', 'left', 'right']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardContainer}
          >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            {/* Header / Logo */}
            <View style={styles.logoContainer}>
              <View style={[styles.logoBadge, { backgroundColor: '#ffffff', overflow: 'hidden', padding: 5, width: 90, height: 90, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }]}>
                <Image source={require('./assets/logo_es.png')} style={{ width: '90%', height: '90%', resizeMode: 'contain' }} />
              </View>
              <Text style={styles.logoTitle}>ESE NORTE 3</Text>
              <Text style={styles.logoSubtitle}>Servicio humanizado y de calidad</Text>
              <Text style={styles.logoSlogan}>"Le ponemos Corazón"</Text>
            </View>

            {/* Login Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ingreso para Empleados</Text>
              <Text style={styles.cardInstruction}>Introduce tu cédula y PIN de acceso operacional.</Text>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Input Cédula */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cédula de Ciudadanía</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 1098765432"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={docNumber}
                  onChangeText={(txt) => {
                    setDocNumber(txt);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
              </View>

              {/* Input PIN */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PIN de Acceso (4 dígitos)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 1234"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  secureTextEntry={true}
                  maxLength={4}
                  value={pinCode}
                  onChangeText={(txt) => {
                    setPinCode(txt);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
              </View>

              {/* Botón Ingresar */}
              <TouchableOpacity 
                style={[styles.button, styles.buttonPrimary, isLoading && styles.buttonDisabled]} 
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>

              {/* Indicador de estado offline */}
              <View style={styles.offlineAlert}>
                <Text style={styles.offlineAlertText}>
                  🛡️ Login Offline habilitado si ya iniciaste sesión anteriormente.
                </Text>
              </View>
            </View>

            {/* Quick Access Credentials Box */}
            <View style={styles.quickAccessBox}>
              <Text style={styles.quickAccessTitle}>ACCESO RÁPIDO (DEMO)</Text>
              <Text style={styles.quickAccessSubtitle}>Toca a un operario para completar sus datos:</Text>
              
              <View style={styles.quickAccessButtons}>
                <TouchableOpacity 
                  style={styles.quickAccessBtn} 
                  onPress={() => quickFill('1098765432', '1234')}
                >
                  <Text style={styles.quickAccessName}>Carlos Mario</Text>
                  <Text style={styles.quickAccessRole}>Operario | Pin: 1234</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.quickAccessBtn} 
                  onPress={() => quickFill('1087654321', '5678')}
                >
                  <Text style={styles.quickAccessName}>Laura Camila</Text>
                  <Text style={styles.quickAccessRole}>Enfermera | Pin: 5678</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 'bold' }}>
                © {new Date().getFullYear()} Stiven Gonzalez - Gloria al nombre de Jesucristo{"\n"}
              </Text>
            </View>
            
            </ScrollView>
          </KeyboardAvoidingView>
          <StatusBar style="light" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Dashboard del Empleado
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.mainContainer}>
          {/* Header App */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>ESE Norte 3</Text>
            <Text style={styles.headerSubtitle}>Portal de Operaciones</Text>
          </View>
          {/* Status de Red Interactivo */}
          <TouchableOpacity 
            style={[styles.networkBadge, isOnline ? styles.networkBadgeOnline : styles.networkBadgeOffline]}
            onPress={() => setIsOnline(!isOnline)}
          >
            <Text style={styles.networkBadgeText}>
              {isOnline ? '🟢 Online' : '🔴 Offline Mode'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{currentUser?.name.substring(0,2).toUpperCase()}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{currentUser?.name}</Text>
            <Text style={styles.userRole}>{currentUser?.position || currentUser?.role}</Text>
            <Text style={styles.userDoc}>C.C. {currentUser?.document || currentUser?.doc}</Text>
          </View>
        </View>

        {/* Content Screens */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
        <ScrollView style={styles.mainContent} contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          {currentScreen === 'dashboard' && (
            <View style={styles.dashboardView}>
              <Text style={styles.sectionTitle}>Acciones Principales</Text>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => setCurrentScreen('templates')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: colors.primary }]}>
                  <Text style={styles.menuIcon}>📝</Text>
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>Ver Plantillas</Text>
                  <Text style={styles.menuDesc}>Generar actas, registros y firmas</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => setCurrentScreen('offline_docs')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: colors.accent }]}>
                  <Text style={styles.menuIcon}>💾</Text>
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>Documentos Locales</Text>
                  <Text style={styles.menuDesc}>Ver archivos guardados offline</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => setCurrentScreen('drafts')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.menuIcon}>📝</Text>
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>Borradores</Text>
                  <Text style={styles.menuDesc}>Continuar diligenciando documentos</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => setCurrentScreen('history')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.menuIcon}>🕒</Text>
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>Histórico</Text>
                  <Text style={styles.menuDesc}>Ver mis documentos diligenciados</Text>
                </View>
              </TouchableOpacity>

              {/* Status Box */}
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxTitle}>Sincronización Local</Text>
                <Text style={styles.statusBoxText}>
                  La aplicación almacena automáticamente tus firmas localmente en la tablet cuando no tienes internet. Al detectar conexión, sincroniza en segundo plano.
                </Text>
              </View>

              {/* Botón Salir */}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          )}

              {/* Screen: Templates List */}
          {currentScreen === 'templates' && (
            <View style={styles.subView}>
              <View style={styles.subViewHeader}>
                <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.backBtn}>
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
                      <Text style={styles.templateCardTitle}>{template.name}</Text>
                      <Text style={styles.templateCardDesc} numberOfLines={2}>{template.description || 'Sin descripción'}</Text>
                      <TouchableOpacity 
                        style={styles.fillBtn} 
                        onPress={() => {
                          setSelectedTemplate(template);
                          setFormData({});
                          setActiveDraftId(null);
                          setCurrentScreen('fill_form');
                        }}
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
          )}

          {/* Screen: Fill Form */}
          {currentScreen === 'fill_form' && selectedTemplate && (
            <View style={styles.subView}>
              <View style={styles.subViewHeader}>
                <TouchableOpacity onPress={() => setCurrentScreen('templates')} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>⬅️ Volver</Text>
                </TouchableOpacity>
                <Text style={styles.subViewTitle} numberOfLines={1}>{selectedTemplate.name}</Text>
              </View>

              <View style={styles.formContainer}>
                    {selectedTemplate.description ? (
                      <View style={{ marginBottom: 16 }}>
                        {renderRichDescription(selectedTemplate.description, formData || {}, selectedTemplate.fields || [])}
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
                            <TouchableOpacity onPress={() => setShowDatePicker({ visible: true, fieldId: field.id })} style={[styles.fieldInput, { justifyContent: 'center' }]}>
                              <Text style={{ color: formData[field.id] ? colors.text : '#A1A1AA' }}>
                                {formData[field.id] || 'DD/MM/AAAA'}
                              </Text>
                            </TouchableOpacity>
                            {showDatePicker.visible && showDatePicker.fieldId === field.id && (
                              <DateTimePicker
                                value={formData[field.id] ? new Date(formData[field.id]) : new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                  setShowDatePicker({ visible: false, fieldId: null });
                                  if (selectedDate && event.type !== 'dismissed') {
                                    const dateStr = selectedDate.toISOString().split('T')[0];
                                    setFormData((prev: any) => ({...prev, [field.id]: dateStr}));
                                  }
                                }}
                              />
                            )}
                          </View>
                        )}
                        
                        {field.type === 'photo' && (
                          <View>
                            {formData[field.id] ? (
                              <View style={{ position: 'relative' }}>
                                <Image source={{ uri: formData[field.id] }} style={{ width: '100%', height: 200, borderRadius: 8 }} resizeMode="cover" />
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
                                <Image source={{ uri: formData[field.id] }} style={{ width: '100%', height: 150 }} resizeMode="contain" />
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
          )}

              {/* Screen: Offline Docs */}
          {currentScreen === 'offline_docs' && (
            <View style={styles.subView}>
              <View style={styles.subViewHeader}>
                <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.backBtn}>
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
          )}

          {/* Screen: Drafts */}
          {currentScreen === 'drafts' && (
            <View style={styles.subView}>
              <View style={styles.subViewHeader}>
                <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.backBtn}>
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
                          onPress={() => {
                            setSelectedTemplate(draft.template);
                            setFormData(draft.data || {});
                            setActiveDraftId(draft.id);
                            setCurrentScreen('fill_form');
                          }}
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
                                { text: 'Eliminar', style: 'destructive', onPress: () => deleteDraft(draft.id) }
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
          )}

          {/* Screen: History */}
          {currentScreen === 'history' && (
            <View style={styles.subView}>
              <View style={styles.subViewHeader}>
                <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.backBtn}>
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
                        onPress={() => {
                          setSelectedDocument(doc);
                          setCurrentScreen('view_document');
                        }}
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
          )}

          {/* Screen: View Document */}
          {currentScreen === 'view_document' && selectedDocument && (
            <View style={styles.subView}>
              <View style={styles.subViewHeader}>
                <TouchableOpacity onPress={() => setCurrentScreen('history')} style={styles.backBtn}>
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
                  
                  // Solo mostrar campos largos, firmas o fotos abajo, 
                  // o mostrar todos en modo lectura
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
              </View>
            </View>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <Modal visible={signatureModalVisible} animationType="slide" transparent={true} onRequestClose={() => setSignatureModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '95%', height: 450, backgroundColor: 'white', borderRadius: 12, overflow: 'hidden' }}>
            <View style={{ padding: 16, backgroundColor: '#004F9F', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => {
                setSignatureModalVisible(false);
                setActiveSignatureFieldId(null);
              }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => signatureRef.current?.clearSignature()}>
                <Text style={{ color: '#FCD34D', fontWeight: 'bold' }}>Limpiar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => {
                signatureRef.current?.readSignature();
              }}>
                <Text style={{ color: '#10B981', fontWeight: 'bold' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
            <SignatureScreen
              ref={signatureRef}
              onOK={handleSignatureOK}
              onEmpty={() => Alert.alert('Error', 'Por favor, dibuja una firma antes de guardar.')}
              descriptionText="Dibuja tu firma arriba"
              webStyle={`
                .m-signature-pad {
                  box-shadow: none; border: none;
                }
                .m-signature-pad--body {
                  border: 1px solid #e8e8e8;
                }
                .m-signature-pad--footer {
                  display: none;
                  margin: 0px;
                }
              `}
            />
          </View>
        </View>
      </Modal>

      <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#004F9F', // Fondo institucional Azul Principal
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoBadgeText: {
    color: '#004F9F',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  logoTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
    letterSpacing: 2,
  },
  logoSubtitle: {
    color: '#E0E7FF',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  logoSlogan: {
    color: '#93C5FD',
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: 'bold',
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardInstruction: {
    color: colors.secondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonPrimary: {
    backgroundColor: '#004F9F',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  offlineAlert: {
    marginTop: 16,
    alignItems: 'center',
  },
  offlineAlertText: {
    color: colors.secondary,
    fontSize: 11,
    textAlign: 'center',
  },
  quickAccessBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    marginTop: 24,
  },
  quickAccessTitle: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  quickAccessSubtitle: {
    color: '#E0E7FF',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  quickAccessButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickAccessBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  quickAccessName: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  quickAccessRole: {
    color: '#D1FAFF',
    fontSize: 9,
    marginTop: 2,
  },

  // STYLES FOR MAIN APP
  mainContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerInfo: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004F9F',
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.secondary,
  },
  networkBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  networkBadgeOnline: {
    backgroundColor: '#D1FAE5',
  },
  networkBadgeOffline: {
    backgroundColor: '#FEE2E2',
  },
  networkBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
  },
  userCard: {
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004F9F',
  },
  userDetails: {
    marginLeft: 14,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  userRole: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 2,
  },
  userDoc: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dashboardView: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  menuItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 18,
  },
  menuText: {
    marginLeft: 14,
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  menuDesc: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 2,
  },
  statusBox: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  statusBoxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  statusBoxText: {
    fontSize: 11,
    color: '#1E3A8A',
    lineHeight: 16,
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: 'bold',
  },

  // STYLES FOR SUB-VIEWS
  subView: {
    paddingBottom: 24,
  },
  subViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryHeader: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
    marginTop: 4,
  },
  categoryHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backBtnText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  subViewTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 12,
  },
  templateCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  templateCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },
  templateCardDesc: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 4,
    lineHeight: 16,
  },
  fillBtn: {
    backgroundColor: '#004F9F',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  fillBtnText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  offlineDocItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  offlineDocName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },
  offlineDocMeta: {
    fontSize: 10,
    color: colors.secondary,
    marginTop: 3,
  },
  docSyncedText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: 'bold',
  },
  docPendingText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: 'bold',
  },
  syncButton: {
    backgroundColor: '#004F9F',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  syncButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  formContainer: {
    paddingBottom: 40,
  },
  formDescription: {
    fontSize: 14,
    color: '#4B5563', // gray-600
    marginBottom: 20,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937', // gray-800
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: '#F3F4F6', // gray-100
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937', // gray-800
  },
  photoBtn: {
    backgroundColor: '#E5E7EB', // gray-200
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9CA3AF', // gray-400
  },
  photoBtnText: {
    color: '#4B5563', // gray-600
    fontWeight: '500',
  },
  signatureBtn: {
    backgroundColor: '#F3F4F6', // gray-100
    padding: 30,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9CA3AF', // gray-400
  },
  signatureBtnText: {
    color: '#4B5563', // gray-600
    fontWeight: '500',
  },
  dropdownSim: {
    backgroundColor: '#F3F4F6', // gray-100
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    borderRadius: 8,
    padding: 12,
  },
  dropdownSimText: {
    color: '#6B7280', // gray-500
  }
});

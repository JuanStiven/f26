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
import { WebView } from 'react-native-webview';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './src/theme/colors';
import { HomeScreen } from './src/screens/HomeScreen';
import { TemplatesScreen } from './src/screens/TemplatesScreen';
import { FillFormScreen } from './src/screens/FillFormScreen';
import { OfflineDocsScreen } from './src/screens/OfflineDocsScreen';
import { DraftsScreen } from './src/screens/DraftsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';

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

// Datos de simulación para los empleados de la ESE Norte 3
const EMPLOYEES_DB = [
  { id: '1', name: 'Carlos Mario Torres', doc: '1098765432', pin: '1234', role: 'Operario de Campo', status: 'Activo' },
  { id: '2', name: 'Laura Camila Ortiz', doc: '1087654321', pin: '5678', role: 'Enfermera Jefa', status: 'Activo' },
  { id: '3', name: 'Andrés Felipe Restrepo', doc: '1076543210', pin: '0000', role: 'Técnico Domiciliario', status: 'Inactivo' }
];

const formatDate = (date: Date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const parseDateString = (str: string) => {
  if (!str) return new Date();
  if (str.includes('/')) {
    const parts = str.split(' ');
    const dateParts = parts[0].split('/');
    const d = parseInt(dateParts[0], 10);
    const m = parseInt(dateParts[1], 10) - 1;
    const y = parseInt(dateParts[2], 10);
    const date = new Date(y, m, d);
    if (parts[1]) {
      const timeParts = parts[1].split(':');
      date.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
    }
    return date;
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

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
  const [showDatePicker, setShowDatePicker] = useState<{ visible: boolean, fieldId: string | null, mode?: 'date' | 'time' | 'datetime' }>({ visible: false, fieldId: null, mode: 'date' });
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [activeSignatureFieldId, setActiveSignatureFieldId] = useState<string | null>(null);
  const signatureRef = useRef<any>(null);

  // States for Rich Text Area editor modal
  const [richTextModalVisible, setRichTextModalVisible] = useState(false);
  const [activeRichTextFieldId, setActiveRichTextFieldId] = useState<string | null>(null);
  const [activeRichTextLabel, setActiveRichTextLabel] = useState('');
  const [tempRichTextHtml, setTempRichTextHtml] = useState('');
  const [initialRichTextHtml, setInitialRichTextHtml] = useState('');
  const [showDocumentPreview, setShowDocumentPreview] = useState(true);

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

  const getRichEditorHtml = (initialValue: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 10px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8FAFC;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    #toolbar {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 10px;
      background-color: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px 12px 0 0;
      border-bottom: none;
    }
    .toolbar-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .btn {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 14px;
      font-weight: bold;
      color: #475569;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 38px;
      height: 36px;
      transition: all 0.2s;
    }
    .btn:active, .btn.active {
      background: #004F9F;
      color: #FFFFFF;
      border-color: #004F9F;
    }
    #editor-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    #editor {
      flex: 1;
      border: 1px solid #E2E8F0;
      border-radius: 0 0 12px 12px;
      background-color: #FFFFFF;
      padding: 16px;
      font-size: 16px;
      line-height: 1.6;
      outline: none;
      overflow-y: auto;
      -webkit-user-select: text;
      color: #000000;
    }
    #editor:focus {
      border-color: #004F9F;
    }
  </style>
</head>
<body>
  <div id="toolbar">
    <div class="toolbar-row">
      <button class="btn" id="btn-bold" onclick="format('bold', 'btn-bold')"><b>B</b></button>
      <button class="btn" id="btn-italic" onclick="format('italic', 'btn-italic')"><i>I</i></button>
      <button class="btn" id="btn-underline" onclick="format('underline', 'btn-underline')"><u>U</u></button>
      <button class="btn" id="btn-strike" onclick="format('strikeThrough', 'btn-strike')"><s>S</s></button>
      <button class="btn" id="btn-ul" onclick="format('insertUnorderedList', 'btn-ul')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="20" y2="6"></line><line x1="9" y1="12" x2="20" y2="12"></line><line x1="9" y1="18" x2="20" y2="18"></line><circle cx="4" cy="6" r="1.5" fill="currentColor"></circle><circle cx="4" cy="12" r="1.5" fill="currentColor"></circle><circle cx="4" cy="18" r="1.5" fill="currentColor"></circle></svg>
      </button>
      <button class="btn" id="btn-ol" onclick="format('insertOrderedList', 'btn-ol')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
      </button>
    </div>
    <div class="toolbar-row" style="margin-top: 4px;">
      <button class="btn" id="btn-left" onclick="format('justifyLeft', 'btn-left')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="15" y1="18" x2="3" y2="18"></line></svg>
      </button>
      <button class="btn" id="btn-center" onclick="format('justifyCenter', 'btn-center')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>
      </button>
      <button class="btn" id="btn-right" onclick="format('justifyRight', 'btn-right')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="9" y2="18"></line></svg>
      </button>
      <button class="btn" id="btn-justify" onclick="format('justifyFull', 'btn-justify')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
      </button>
      <button class="btn" id="btn-clear" onclick="format('removeFormat', 'btn-clear')" style="margin-left: auto;">🧹 Limpiar</button>
    </div>
  </div>
  <div id="editor-container">
    <div id="editor" contenteditable="true"></div>
  </div>

  <script>
    const editor = document.getElementById('editor');
    
    // Inject initial content
    editor.innerHTML = ${JSON.stringify(initialValue || '')};

    function format(command, btnId) {
      document.execCommand(command, false, null);
      editor.focus();
      updateButtonStates();
      sendContent();
    }

    function updateButtonStates() {
      const formats = {
        'bold': 'btn-bold',
        'italic': 'btn-italic',
        'underline': 'btn-underline',
        'strikeThrough': 'btn-strike',
        'insertUnorderedList': 'btn-ul',
        'insertOrderedList': 'btn-ol',
        'justifyLeft': 'btn-left',
        'justifyCenter': 'btn-center',
        'justifyRight': 'btn-right',
        'justifyFull': 'btn-justify'
      };

      for (const [cmd, id] of Object.entries(formats)) {
        const el = document.getElementById(id);
        if (el) {
          try {
            const state = document.queryCommandState(cmd);
            el.classList.toggle('active', !!state);
          } catch(e) {}
        }
      }
    }

    function sendContent() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(editor.innerHTML);
      }
    }

    editor.addEventListener('input', sendContent);
    editor.addEventListener('blur', sendContent);
    editor.addEventListener('keyup', updateButtonStates);
    editor.addEventListener('mouseup', updateButtonStates);
  </script>
</body>
</html>
  `;

  const renderRichDescription = (description: string, data: any, fields: any[] = []) => {
    if (!description) return <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 16 }}>Sin descripción</Text>;

    const getFieldTagName = (field: any, allFields: any[]) => {
      const hasDuplicate = allFields.some(
        (f: any) => f.id !== field.id && f.label.trim().toLowerCase() === field.label.trim().toLowerCase()
      );
      if (hasDuplicate) {
        return `${field.category || 'General'}: ${field.label}`;
      }
      return field.label;
    };

    const mappedData: Record<string, any> = {};
    fields.forEach((fieldDef: any) => {
      let val = data[fieldDef.id] !== undefined ? data[fieldDef.id] : data[fieldDef.label];
      if (val !== undefined && val !== null) {
        if (fieldDef.type === 'select' && fieldDef.options) {
          const option = fieldDef.options.find((o: any) => String(o.id) === String(val) || String(o.value) === String(val));
          if (option) val = option.label || option.value;
        }
        mappedData[fieldDef.id] = val;
        if (fieldDef.tag) {
          const cleanTag = String(fieldDef.tag).replace(/[{}]/g, '').trim();
          mappedData[fieldDef.tag] = val;
          mappedData[cleanTag] = val;
        }
        if (fieldDef.label) {
          mappedData[fieldDef.label] = val;
          mappedData[getFieldTagName(fieldDef, fields)] = val;
        }
      }
    });

    Object.entries(data || {}).forEach(([k, v]) => {
      if (mappedData[k] === undefined) mappedData[k] = v;
    });

    // Replace {{variable}}, {variable}, or <<variable>> tokens with data values
    let processed = description;
    const blockTokens: { placeholder: string; type: 'image' | 'table'; value: any }[] = [];

    Object.keys(mappedData).forEach(label => {
      const value = mappedData[label];
      if (value === undefined || value === null || value === '') return;

      const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:{{\\s*${escapedLabel}\\s*}}|{\\s*${escapedLabel}\\s*}|<<\\s*${escapedLabel}\\s*>>)`, 'gi');

      const isImgVal = typeof value === 'string' && (
        value.startsWith('data:image/') ||
        value.startsWith('file://') ||
        value.startsWith('/uploads/') ||
        value.includes('/uploads/') ||
        /\.(png|jpe?g|gif|webp)$/i.test(value)
      );
      if (isImgVal) {
        const placeholder = `__IMG_${label.replace(/\s+/g, '_')}__`;
        processed = processed.replace(regex, placeholder);
        blockTokens.push({ placeholder, type: 'image', value });
      } else if (Array.isArray(value)) {
        const placeholder = `__TBL_${label.replace(/\s+/g, '_')}__`;
        processed = processed.replace(regex, placeholder);
        blockTokens.push({ placeholder, type: 'table', value });
      } else {
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
                    source={{ uri: getImageUri(bt.value) }}
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

    const blockPattern = /<(h[1-3]|p|li|blockquote|hr|table)((?:\s+[^>]*)?)>([\s\S]*?)<\/\1>/gi;
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
      } else if (tag === 'table') {
        const rows: React.ReactNode[] = [];
        const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;
        let rowIdx = 0;
        while ((rowMatch = rowPattern.exec(content)) !== null) {
          const rowContent = rowMatch[1];
          const cells: React.ReactNode[] = [];
          const cellPattern = /<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi;
          let cellMatch;
          let cellIdx = 0;
          while ((cellMatch = cellPattern.exec(rowContent)) !== null) {
            const isHeader = cellMatch[1].toLowerCase() === 'th';
            const cellContent = cellMatch[2];
            cells.push(
              <View
                key={`cell-${rowIdx}-${cellIdx}`}
                style={{
                  flex: 1,
                  padding: 6,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  backgroundColor: isHeader ? '#F3F4F6' : undefined,
                  justifyContent: 'center',
                  minWidth: 80,
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: isHeader ? 'bold' : 'normal',
                  color: '#374151',
                }}>
                  {renderInlineHtml(cellContent, `cell-text-${rowIdx}-${cellIdx}`)}
                </Text>
              </View>
            );
            cellIdx++;
          }
          rows.push(
            <View key={`row-${rowIdx}`} style={{ flexDirection: 'row' }}>
              {cells}
            </View>
          );
          rowIdx++;
        }
        blocks.push(
          <View key={key} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4, marginVertical: 12, overflow: 'hidden' }}>
            <ScrollView horizontal nestedScrollEnabled>
              <View style={{ minWidth: 300 }}>
                {rows}
              </View>
            </ScrollView>
          </View>
        );
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

    // Validar campos obligatorios
    const missingFields: string[] = [];
    if (selectedTemplate.fields && Array.isArray(selectedTemplate.fields)) {
      selectedTemplate.fields.forEach((field: any) => {
        if (field.required) {
          const value = formData[field.id];
          let isEmpty = false;

          if (value === undefined || value === null) {
            isEmpty = true;
          } else if (field.type === 'table') {
            if (!Array.isArray(value) || value.length === 0) {
              isEmpty = true;
            } else {
              const allRowsEmpty = value.every((row: any) =>
                Object.values(row).every((cellVal: any) => String(cellVal || '').trim() === '')
              );
              if (allRowsEmpty) {
                isEmpty = true;
              }
            }
          } else if (field.type === 'textarea') {
            const strippedText = String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
            if (strippedText === '') {
              isEmpty = true;
            }
          } else {
            if (String(value).trim() === '') {
              isEmpty = true;
            }
          }

          if (isEmpty) {
            missingFields.push(field.label);
          }
        }
      });
    }

    if (missingFields.length > 0) {
      Alert.alert(
        'Campos Obligatorios',
        `Por favor, complete los siguientes campos obligatorios antes de guardar el documento:\n\n${missingFields.map(f => `• ${f}`).join('\n')}`
      );
      return;
    }

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
      setFormData((prev: any) => ({ ...prev, [fieldId]: base64Image }));
    }
  };

  const handleSignatureOK = (signature: string) => {
    if (activeSignatureFieldId) {
      setFormData((prev: any) => ({ ...prev, [activeSignatureFieldId]: signature }));
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
              {/* <View style={styles.quickAccessBox}>
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
            </View> */}

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
              <Text style={styles.avatarText}>{currentUser?.name.substring(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{currentUser?.name}</Text>
              <Text style={styles.userRole}>{currentUser?.position || currentUser?.role}</Text>
              <Text style={styles.userDoc}>C.C. {currentUser?.document || currentUser?.doc}</Text>
            </View>
          </View>

          {/* Content Screens */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 200 : 120}
          >
            <ScrollView style={styles.mainContent} contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
              {currentScreen === 'dashboard' && (
                <HomeScreen
                  onNavigate={(screen) => setCurrentScreen(screen)}
                  onLogout={handleLogout}
                  styles={styles}
                />
              )}

              {currentScreen === 'templates' && (
                <TemplatesScreen
                  loadingTemplates={loadingTemplates}
                  paginatedTemplates={paginatedTemplates}
                  templateSearchTerm={templateSearchTerm}
                  setTemplateSearchTerm={setTemplateSearchTerm}
                  templatePage={templatePage}
                  setTemplatePage={setTemplatePage}
                  totalTemplatePages={totalTemplatePages}
                  fetchTemplates={fetchTemplates}
                  onSelectTemplate={(template) => {
                    setSelectedTemplate(template);
                    setFormData({});
                    setActiveDraftId(null);
                    setCurrentScreen('fill_form');
                  }}
                  onBack={() => setCurrentScreen('dashboard')}
                  styles={styles}
                />
              )}

              {currentScreen === 'fill_form' && selectedTemplate && (
                <FillFormScreen
                  selectedTemplate={selectedTemplate}
                  formData={formData}
                  setFormData={setFormData}
                  showDocumentPreview={showDocumentPreview}
                  setShowDocumentPreview={setShowDocumentPreview}
                  renderRichDescription={renderRichDescription}
                  showDatePicker={showDatePicker}
                  setShowDatePicker={setShowDatePicker}
                  parseDateString={parseDateString}
                  formatDate={formatDate}
                  handleTakePhoto={handleTakePhoto}
                  setActiveSignatureFieldId={setActiveSignatureFieldId}
                  setSignatureModalVisible={setSignatureModalVisible}
                  setActiveRichTextFieldId={setActiveRichTextFieldId}
                  setActiveRichTextLabel={setActiveRichTextLabel}
                  setTempRichTextHtml={setTempRichTextHtml}
                  setInitialRichTextHtml={setInitialRichTextHtml}
                  setRichTextModalVisible={setRichTextModalVisible}
                  handleSaveDocument={handleSaveDocument}
                  saveDraft={saveDraft}
                  onBack={() => setCurrentScreen('templates')}
                  styles={styles}
                />
              )}

              {currentScreen === 'offline_docs' && (
                <OfflineDocsScreen
                  paginatedOffline={paginatedOffline}
                  offlineSearchTerm={offlineSearchTerm}
                  setOfflineSearchTerm={setOfflineSearchTerm}
                  offlinePage={offlinePage}
                  setOfflinePage={setOfflinePage}
                  totalOfflinePages={totalOfflinePages}
                  isOnline={isOnline}
                  loadOfflineDocs={loadOfflineDocs}
                  syncOfflineDocs={syncOfflineDocs}
                  onBack={() => setCurrentScreen('dashboard')}
                  styles={styles}
                />
              )}

              {currentScreen === 'drafts' && (
                <DraftsScreen
                  paginatedDrafts={paginatedDrafts}
                  draftSearchTerm={draftSearchTerm}
                  setDraftSearchTerm={setDraftSearchTerm}
                  draftPage={draftPage}
                  setDraftPage={setDraftPage}
                  totalDraftPages={totalDraftPages}
                  loadDrafts={loadDrafts}
                  onSelectDraft={(draft) => {
                    setSelectedTemplate(draft.template);
                    setFormData(draft.data || {});
                    setActiveDraftId(draft.id);
                    setCurrentScreen('fill_form');
                  }}
                  onDeleteDraft={deleteDraft}
                  onBack={() => setCurrentScreen('dashboard')}
                  styles={styles}
                />
              )}

              {(currentScreen === 'history' || currentScreen === 'view_document') && (
                <HistoryScreen
                  currentScreen={currentScreen}
                  loadingHistory={loadingHistory}
                  paginatedHistory={paginatedHistory}
                  historySearchTerm={historySearchTerm}
                  setHistorySearchTerm={setHistorySearchTerm}
                  historyPage={historyPage}
                  setHistoryPage={setHistoryPage}
                  totalHistoryPages={totalHistoryPages}
                  fetchHistory={fetchHistory}
                  selectedDocument={selectedDocument}
                  onSelectDocument={(doc) => {
                    setSelectedDocument(doc);
                    setCurrentScreen('view_document');
                  }}
                  renderRichDescription={renderRichDescription}
                  onBackToDashboard={() => setCurrentScreen('dashboard')}
                  onBackToHistory={() => setCurrentScreen('history')}
                  styles={styles}
                />
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>

        <Modal visible={richTextModalVisible} animationType="slide" transparent={true} onRequestClose={() => setRichTextModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '95%', height: '85%', backgroundColor: 'white', borderRadius: 12, overflow: 'hidden' }}>
              <View style={{ padding: 16, backgroundColor: '#004F9F', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => {
                  setRichTextModalVisible(false);
                  setActiveRichTextFieldId(null);
                  setTempRichTextHtml('');
                  setInitialRichTextHtml('');
                }}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancelar</Text>
                </TouchableOpacity>

                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{activeRichTextLabel}</Text>

                <TouchableOpacity onPress={() => {
                  if (activeRichTextFieldId) {
                    setFormData((prev: any) => ({ ...prev, [activeRichTextFieldId]: tempRichTextHtml }));
                  }
                  setRichTextModalVisible(false);
                  setActiveRichTextFieldId(null);
                  setTempRichTextHtml('');
                  setInitialRichTextHtml('');
                }}>
                  <Text style={{ color: '#10B981', fontWeight: 'bold' }}>Listo</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <WebView
                  source={{ html: getRichEditorHtml(initialRichTextHtml) }}
                  onMessage={(event) => {
                    setTempRichTextHtml(event.nativeEvent.data);
                  }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  originWhitelist={['*']}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>

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

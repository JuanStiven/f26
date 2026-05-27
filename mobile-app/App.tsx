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
  SafeAreaView,
  Alert,
  Modal,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import SignatureScreen from 'react-native-signature-canvas';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'templates' | 'offline_docs' | 'fill_form' | 'history' | 'view_document'>('dashboard');
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

  // Historial
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  React.useEffect(() => {
    if (isAuthenticated && userToken) {
      fetchTemplates();
      fetchHistory();
    }
  }, [isAuthenticated, userToken]);

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

  // Autorelleno de Demo
  const quickFill = (doc: string, pin: string) => {
    setDocNumber(doc);
    setPinCode(pin);
    setErrorMessage('');
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
        setFormData({});
        setSelectedTemplate(null);
        setCurrentScreen('dashboard');
        fetchHistory(); // Actualizar el historial
      } else {
        Alert.alert('Error', data.message || 'No se pudo guardar el documento.');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    }
  };

  const handleTakePhoto = async (fieldId: string) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permiso Denegado", "Se requieren permisos de cámara para tomar fotos.");
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFormData((prev: any) => ({...prev, [fieldId]: result.assets[0].uri}));
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
      <SafeAreaView style={styles.safeContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            {/* Header / Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>ESE</Text>
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
            
          </ScrollView>
        </KeyboardAvoidingView>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // Dashboard del Empleado
  return (
    <SafeAreaView style={styles.safeContainer}>
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
              </View>

              {loadingTemplates ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
              ) : templates.length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: 20, color: '#6B7280' }}>No hay plantillas disponibles.</Text>
              ) : (
                templates.map((template) => (
                  <View key={template.id} style={styles.templateCard}>
                    <Text style={styles.templateCardTitle}>{template.name}</Text>
                    <Text style={styles.templateCardDesc} numberOfLines={2}>{template.description || 'Sin descripción'}</Text>
                    <TouchableOpacity 
                      style={styles.fillBtn} 
                      onPress={() => {
                        setSelectedTemplate(template);
                        setFormData({});
                        setCurrentScreen('fill_form');
                      }}
                    >
                      <Text style={styles.fillBtnText}>Diligenciar Formulario</Text>
                    </TouchableOpacity>
                  </View>
                ))
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
                      <Text style={styles.formDescription}>{selectedTemplate.description}</Text>
                    ) : null}
                    
                    {selectedTemplate.fields?.map((field: any) => (
                      <View key={field.id} style={styles.fieldGroup}>
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
                      </View>
                    ))}

                    <TouchableOpacity 
                      style={[styles.button, styles.buttonPrimary, { marginTop: 20 }]}
                      onPress={handleSaveDocument}
                    >
                      <Text style={styles.buttonText}>Guardar Documento</Text>
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
                <Text style={styles.subViewTitle}>Documentos Guardados</Text>
              </View>

              <View style={styles.offlineDocItem}>
                <View>
                  <Text style={styles.offlineDocName}>Insumos Rurales - Sede Norte</Text>
                  <Text style={styles.offlineDocMeta}>Fecha: 26/05/2026 | Operario: Carlos Mario</Text>
                </View>
                <Text style={styles.docSyncedText}>✓ Sincronizado</Text>
              </View>

              <View style={styles.offlineDocItem}>
                <View>
                  <Text style={styles.offlineDocName}>Mantenimiento Incubadora #3</Text>
                  <Text style={styles.offlineDocMeta}>Fecha: 25/05/2026 | Operario: Carlos Mario</Text>
                </View>
                <Text style={styles.docPendingText}>⏳ Guardado Local</Text>
              </View>

              <TouchableOpacity 
                style={[styles.syncButton, !isOnline && styles.buttonDisabled]}
                disabled={!isOnline}
                onPress={() => Alert.alert('Sincronización', 'Sincronizando base de datos local con el servidor... ¡Completado!')}
              >
                <Text style={styles.syncButtonText}>
                  {isOnline ? '🔄 Sincronizar Cambios Ahora' : '🚫 Conéctate a Internet para Sincronizar'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Screen: History */}
          {currentScreen === 'history' && (
            <View style={styles.subView}>
              <View style={styles.subViewHeader}>
                <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>⬅️ Volver</Text>
                </TouchableOpacity>
                <Text style={styles.subViewTitle}>Histórico de Documentos</Text>
              </View>

              {loadingHistory ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
              ) : history.length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: 20, color: '#6B7280' }}>No tienes documentos en tu historial.</Text>
              ) : (
                history.map((doc: any) => (
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
                  </View>
                ))
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
              
              <View style={styles.formContainer}>
                {Object.keys(selectedDocument.data || {}).map((key: string) => {
                  const val = selectedDocument.data[key];
                  return (
                    <View key={key} style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>ID de campo: {key}</Text>
                      {typeof val === 'string' && val.startsWith('file://') ? (
                        <Image source={{ uri: val }} style={{ width: '100%', height: 200, borderRadius: 8 }} resizeMode="contain" />
                      ) : (
                        <TextInput 
                          style={[styles.fieldInput, { backgroundColor: '#E5E7EB', color: '#6B7280' }]} 
                          value={val?.toString() || 'Sin respuesta'}
                          editable={false}
                        />
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

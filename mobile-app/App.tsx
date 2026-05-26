import React, { useState } from 'react';
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
  Alert
} from 'react-native';
import { colors } from './src/theme/colors';

// Datos de simulación para los empleados de la ESE Norte 3
const EMPLOYEES_DB = [
  { id: '1', name: 'Carlos Mario Torres', doc: '1098765432', pin: '1234', role: 'Operario de Campo', status: 'Activo' },
  { id: '2', name: 'Laura Camila Ortiz', doc: '1087654321', pin: '5678', role: 'Enfermera Jefa', status: 'Activo' },
  { id: '3', name: 'Andrés Felipe Restrepo', doc: '1076543210', pin: '0000', role: 'Técnico Domiciliario', status: 'Inactivo' }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<typeof EMPLOYEES_DB[0] | null>(null);
  
  // Login Form States
  const [docNumber, setDocNumber] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // App Navigation States
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'templates' | 'offline_docs'>('dashboard');
  const [isOnline, setIsOnline] = useState(true);

  // Formulario Dinámico (Simulado para llenar en la tablet)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Manejar Login
  const handleLogin = () => {
    setErrorMessage('');
    if (!docNumber.trim() || !pinCode.trim()) {
      setErrorMessage('Por favor ingresa tu número de cédula y PIN de seguridad.');
      return;
    }

    setIsLoading(true);

    // Simular latencia de red / verificación local
    setTimeout(() => {
      const user = EMPLOYEES_DB.find(emp => emp.doc === docNumber.trim());

      if (!user) {
        setIsLoading(false);
        setErrorMessage('El número de documento ingresado no está registrado.');
        return;
      }

      if (user.status === 'Inactivo') {
        setIsLoading(false);
        setErrorMessage('Este usuario se encuentra Inactivo en el sistema.');
        return;
      }

      if (user.pin !== pinCode.trim()) {
        setIsLoading(false);
        setErrorMessage('PIN de seguridad incorrecto.');
        return;
      }

      // Login exitoso
      setIsLoading(false);
      setCurrentUser(user);
      setIsAuthenticated(true);
      setDocNumber('');
      setPinCode('');
    }, 1200);
  };

  // Autorelleno de Demo
  const quickFill = (doc: string, pin: string) => {
    setDocNumber(doc);
    setPinCode(pin);
    setErrorMessage('');
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
            <Text style={styles.userRole}>{currentUser?.role}</Text>
            <Text style={styles.userDoc}>C.C. {currentUser?.doc}</Text>
          </View>
        </View>

        {/* Content Screens */}
        <ScrollView style={styles.mainContent}>
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

              <View style={styles.templateCard}>
                <Text style={styles.templateCardTitle}>Acta de Entrega de Insumos Médicos</Text>
                <Text style={styles.templateCardDesc}>Constancia de insumos entregados en puestos de salud rurales.</Text>
                <TouchableOpacity style={styles.fillBtn} onPress={() => Alert.alert('Simulador', 'Generador de documentos en tablet está listo para desarrollo.')}>
                  <Text style={styles.fillBtnText}>Diligenciar Formulario</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.templateCard}>
                <Text style={styles.templateCardTitle}>Registro de Mantenimiento de Equipos</Text>
                <Text style={styles.templateCardDesc}>Reporte técnico del estado de equipos médicos en campo.</Text>
                <TouchableOpacity style={styles.fillBtn} onPress={() => Alert.alert('Simulador', 'Generador de documentos en tablet está listo para desarrollo.')}>
                  <Text style={styles.fillBtnText}>Diligenciar Formulario</Text>
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
        </ScrollView>
      </View>
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
    fontSize: 12,
    fontWeight: 'bold',
  }
});

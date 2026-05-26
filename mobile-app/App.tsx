import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { colors } from './src/theme/colors';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ESE Norte 3</Text>
        <Text style={styles.subtitle}>App Operativa</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Selecciona una acción:</Text>
        
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={styles.buttonText}>Ver Plantillas Disponibles</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent, marginTop: 15 }]}>
          <Text style={styles.buttonText}>Documentos Guardados (Offline)</Text>
        </TouchableOpacity>
      </View>
      
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.lightBlue,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.lightGray,
    fontSize: 16,
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: colors.secondary,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3, // sombra en android
    shadowColor: '#000', // sombra en ios
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

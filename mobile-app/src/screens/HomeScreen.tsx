import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

interface HomeScreenProps {
  onNavigate: (screen: 'templates' | 'offline_docs' | 'drafts' | 'history') => void;
  onLogout: () => void;
  styles: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onLogout,
  styles,
}) => {
  return (
    <View style={styles.dashboardView}>
      <Text style={styles.sectionTitle}>Acciones Principales</Text>

      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => onNavigate('templates')}
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
        onPress={() => onNavigate('offline_docs')}
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
        onPress={() => onNavigate('drafts')}
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
        onPress={() => onNavigate('history')}
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
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

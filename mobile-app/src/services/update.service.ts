import { Alert, Platform } from 'react-native';
import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://formatos.esenorte3.lat/api';
const baseUrl = API_URL.replace(/\/api\/?$/, '');

let alertShownThisSession = false;

export interface AppVersionInfo {
  id: string;
  versionCode: number;
  versionName: string;
  apkPath: string;
  apkSize: number | null;
  changelog: string | null;
  isActive: boolean;
}

/**
 * Consulta la última versión publicada y, si es más nueva que la instalada,
 * muestra la alerta de actualización. Se ejecuta una sola vez por sesión.
 */
export async function checkForAppUpdates(): Promise<void> {
  if (Platform.OS !== 'android' || alertShownThisSession) return;

  try {
    const currentVersionCode = parseInt(Application.nativeBuildVersion || '0', 10);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${API_URL}/app-versions/latest`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    clearTimeout(timeout);

    if (!response.ok) return;
    const payload = await response.json();
    if (!payload.success || !payload.data) return;

    const latest: AppVersionInfo = payload.data;
    if (!latest.isActive || latest.versionCode <= currentVersionCode) return;

    alertShownThisSession = true;

    Alert.alert(
      'Nueva versión disponible',
      `Hay una nueva versión (${latest.versionName}) de ESE Norte 3.\n\n${latest.changelog || 'Mejoras y correcciones.'}\n\n¿Desea descargarla e instalarla ahora?`,
      [
        { text: 'Más tarde', style: 'cancel' },
        { text: 'Actualizar ahora', onPress: () => downloadAndInstall(latest) },
      ]
    );
  } catch (error) {
    // Silencioso: si no hay conexión o el servicio falla, no interrumpir la app
    console.log('Update check skipped:', error);
  }
}

/**
 * Descarga el APK y abre el instalador de Android.
 */
async function downloadAndInstall(version: AppVersionInfo): Promise<void> {
  const apkUrl = version.apkPath.startsWith('http')
    ? version.apkPath
    : `${baseUrl}${version.apkPath.startsWith('/') ? '' : '/'}${version.apkPath}`;

  const fileUri = `${FileSystem.cacheDirectory}esenorte3-${version.versionCode}.apk`;

  try {
    const downloadResumable = FileSystem.createDownloadResumable(apkUrl, fileUri);
    const result = await downloadResumable.downloadAsync();

    if (!result || !result.uri) {
      Alert.alert('Error', 'No se pudo descargar la actualización. Intente nuevamente.');
      return;
    }

    // Convertir a content:// URI (FileProvider) y lanzar el instalador
    const contentUri = await FileSystem.getContentUriAsync(result.uri);
    await IntentLauncher.startActivityAsync('android.intent.action.INSTALL_PACKAGE', {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    });
  } catch (error: any) {
    Alert.alert(
      'Error al actualizar',
      'No se pudo instalar la actualización. Verifique que la app tenga permiso para instalar aplicaciones desconocidas.'
    );
    console.log('Install error:', error);
  }
}

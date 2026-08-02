import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, UploadCloud, Trash2, CheckCircle2, XCircle, Smartphone } from 'lucide-react';

interface AppVersion {
  id: string;
  versionCode: number;
  versionName: string;
  apkPath: string;
  apkSize: number | null;
  changelog: string | null;
  isActive: boolean;
  createdAt: string;
}

const formatSize = (bytes: number | null) => {
  if (!bytes) return '-';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

export function AppVersionsView() {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [versionName, setVersionName] = useState('');
  const [versionCode, setVersionCode] = useState('');
  const [changelog, setChangelog] = useState('');

  const loadVersions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { default: api } = await import('../utils/api');
      const response = await api.get('/app-versions');
      if (response.data.success) {
        setVersions(response.data.data);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error cargando versiones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apkFile) {
      alert('Seleccione el archivo APK.');
      return;
    }
    if (!versionName.trim() || !versionCode.trim()) {
      alert('Indique el nombre de versión (ej: 1.0.1) y el código numérico (ej: 2).');
      return;
    }

    setIsUploading(true);
    try {
      const { default: api } = await import('../utils/api');
      const formData = new FormData();
      formData.append('apkFile', apkFile);
      formData.append('versionName', versionName.trim());
      formData.append('versionCode', versionCode.trim());
      formData.append('changelog', changelog.trim());

      const response = await api.post('/app-versions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 min (APK grande)
      });

      if (response.data.success) {
        alert('Versión publicada correctamente. La app móvil avisará a los usuarios.');
        setApkFile(null);
        setVersionName('');
        setVersionCode('');
        setChangelog('');
        await loadVersions();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error subiendo la versión.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleActive = async (version: AppVersion) => {
    try {
      const { default: api } = await import('../utils/api');
      const response = await api.patch(`/app-versions/${version.id}`, {
        isActive: !version.isActive,
      });
      if (response.data.success) {
        await loadVersions();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error actualizando versión');
    }
  };

  const handleDelete = async (version: AppVersion) => {
    if (!window.confirm(`¿Eliminar la versión ${version.versionName} (código ${version.versionCode})? Esta acción no se puede deshacer.`)) return;
    try {
      const { default: api } = await import('../utils/api');
      const response = await api.delete(`/app-versions/${version.id}`);
      if (response.data.success) {
        await loadVersions();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error eliminando versión');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" />
            Versiones de la App Móvil
          </h2>
          <p className="text-sm text-muted-foreground">
            Publique una nueva versión del APK. Los dispositivos con la app instalada detectarán la actualización automáticamente.
          </p>
        </div>
        <button
          onClick={loadVersions}
          disabled={isLoading}
          className="px-3 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Formulario de subida */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-primary" />
          Publicar nueva versión
        </h3>
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Archivo APK *</label>
            <input
              type="file"
              accept=".apk,application/vnd.android.package-archive,application/octet-stream"
              onChange={(e) => setApkFile(e.target.files?.[0] || null)}
              className="w-full text-xs p-2 rounded-lg border border-border bg-background file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary file:text-white file:text-xs file:font-medium hover:file:bg-primary/90"
            />
            {apkFile && (
              <p className="text-[10px] text-muted-foreground">
                {apkFile.name} — {(apkFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Versión visible *</label>
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="ej: 1.0.1"
              className="w-full text-sm p-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Código numérico * (debe ser mayor al anterior)</label>
            <input
              type="number"
              value={versionCode}
              onChange={(e) => setVersionCode(e.target.value)}
              placeholder="ej: 2"
              min={1}
              className="w-full text-sm p-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5 md:col-span-3">
            <label className="text-xs font-semibold text-muted-foreground">Notas de la versión (changelog)</label>
            <textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="ej: Corrección de errores, nuevas plantillas disponibles..."
              rows={3}
              className="w-full text-sm p-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Subiendo APK...
                </>
              ) : (
                <>
                  <UploadCloud className="h-3.5 w-3.5" />
                  Publicar versión
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de versiones */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Historial de versiones</h3>
          <span className="text-xs text-muted-foreground">{versions.length} publicada(s)</span>
        </div>
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Cargando versiones...</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No hay versiones publicadas aún. Suba la primera versión arriba.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b border-border">
                <tr>
                  <th className="px-6 py-3">Versión</th>
                  <th className="px-6 py-3">Código</th>
                  <th className="px-6 py-3">Tamaño</th>
                  <th className="px-6 py-3">Notas</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {versions.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 font-semibold text-foreground">{v.versionName}</td>
                    <td className="px-6 py-3 text-muted-foreground">{v.versionCode}</td>
                    <td className="px-6 py-3 text-muted-foreground">{formatSize(v.apkSize)}</td>
                    <td className="px-6 py-3 text-muted-foreground max-w-[240px] truncate" title={v.changelog || ''}>
                      {v.changelog || '-'}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{formatDate(v.createdAt)}</td>
                    <td className="px-6 py-3">
                      {v.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                          <XCircle className="h-3 w-3" />
                          Inactiva
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(v)}
                          className="px-2 py-1 text-[10px] font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
                        >
                          {v.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDelete(v)}
                          className="p-1.5 rounded-lg border border-border hover:bg-red-50 dark:hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Eliminar versión"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

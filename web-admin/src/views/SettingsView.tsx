import React from 'react';
import { Save } from 'lucide-react';

interface SettingsViewProps {
  companySettings: any;
  setCompanySettings: React.Dispatch<React.SetStateAction<any>>;
}

export function SettingsView({ companySettings, setCompanySettings }: SettingsViewProps) {
  const handleSaveSettings = async () => {
    try {
      const { default: api } = await import('../utils/api');
      await api.put('/company', companySettings);
      alert('Configuración guardada exitosamente.');
    } catch (e: any) {
      alert('Error guardando configuración');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Configuración de la Empresa</h1>
        <p className="text-muted-foreground">Establece el logo institucional y los datos oficiales que aparecerán en la cabecera de los documentos.</p>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-xs p-6 space-y-6">
        <h3 className="font-semibold text-foreground border-b border-border pb-3">Información Corporativa</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Razón Social</label>
              <input
                type="text"
                value={companySettings.name || ''}
                onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, name: e.target.value }))}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">NIT / Identificación Fiscal</label>
              <input
                type="text"
                value={companySettings.nit || ''}
                onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, nit: e.target.value }))}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Representante Legal / Gerente</label>
              <input
                type="text"
                value={companySettings.manager || ''}
                onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, manager: e.target.value }))}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">País</label>
                <input
                  type="text"
                  value={companySettings.country || ''}
                  onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, country: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Departamento</label>
                <input
                  type="text"
                  value={companySettings.department || ''}
                  onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, department: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sede</label>
              <input
                type="text"
                value={companySettings.branch || ''}
                onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, branch: e.target.value }))}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Dirección Física</label>
              <input
                type="text"
                value={companySettings.address || ''}
                onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, address: e.target.value }))}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
                <input
                  type="text"
                  value={companySettings.phone || ''}
                  onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, phone: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Correo de Soporte</label>
                <input
                  type="text"
                  value={companySettings.email || ''}
                  onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, email: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            </div>

            {/* Logo Uploader */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Logotipo de la Empresa</label>
              <label className="border border-dashed border-border rounded-lg p-4 bg-muted/10 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors">
                {companySettings.logoUrl ? (
                  <img src={companySettings.logoUrl} alt="Logo" className="max-h-16 object-contain" />
                ) : (
                  <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg shadow-xs border border-primary/20">
                    <span className="font-bold text-xs">ESE</span>
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground mt-2">
                  <span className="text-primary font-semibold">Sube un archivo</span> o haz clic (PNG, JPG)
                </div>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCompanySettings((prev: any) => ({ ...prev, logoUrl: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-foreground border-b border-border pb-3 mt-8">Formato de PDF</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Color de Títulos (Hexadecimal)</label>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-lg border border-border shrink-0"
                  style={{ backgroundColor: companySettings.pdfTitleColor || '#004F9F' }}
                />
                <input
                  type="text"
                  value={companySettings.pdfTitleColor || '#004F9F'}
                  onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, pdfTitleColor: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs"
                  placeholder="#004F9F"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Color de Subtítulos (Hexadecimal)</label>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-lg border border-border shrink-0"
                  style={{ backgroundColor: companySettings.pdfSubtitleColor || '#004F9F' }}
                />
                <input
                  type="text"
                  value={companySettings.pdfSubtitleColor || '#004F9F'}
                  onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, pdfSubtitleColor: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs"
                  placeholder="#004F9F"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Ancho del Logo en PDF (px)</label>
              <input
                type="number"
                value={companySettings.pdfLogoWidth || ''}
                onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, pdfLogoWidth: parseInt(e.target.value) || 100 }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs"
                placeholder="Ej. 100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Alto del Logo en PDF (px)</label>
              <input
                type="number"
                value={companySettings.pdfLogoHeight || ''}
                onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, pdfLogoHeight: parseInt(e.target.value) || 100 }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs"
                placeholder="Ej. 100"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tamaño de Fuente (Títulos)</label>
              <input
                type="number"
                value={companySettings.pdfTitleFontSize || 16}
                onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, pdfTitleFontSize: parseInt(e.target.value) || 16 }))}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tamaño de Fuente (Subtítulos)</label>
              <input
                type="number"
                value={companySettings.pdfSubtitleFontSize || 12}
                onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, pdfSubtitleFontSize: parseInt(e.target.value) || 12 }))}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tamaño de Fuente (Párrafos)</label>
              <input
                type="number"
                value={companySettings.pdfParagraphFontSize || 11}
                onChange={(e) => setCompanySettings((prev: any) => ({ ...prev, pdfParagraphFontSize: parseInt(e.target.value) || 11 }))}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="bg-primary text-white text-xs px-6 py-2.5 rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <Save className="h-4 w-4" />
            Guardar Ajustes
          </button>
        </div>
      </div>
    </div>
  );
}

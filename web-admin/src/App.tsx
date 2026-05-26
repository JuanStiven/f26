import { useState, useEffect } from 'react';
import { MainLayout } from './components/layout/main-layout';
import { LoginPage } from './components/auth/login';
import { FileExplorer } from './components/explorer/file-explorer';
import { 
  FileText, 
  Users, 
  Plus, 
  Settings as SettingsIcon,
  Trash2,
  Edit2,
  Eye,
  Camera,
  CheckCircle,
  ArrowRight,
  FileDown,
  Building,
  Save,
  Grid
} from 'lucide-react';

interface TemplateField {
  id: string;
  type: 'text' | 'number' | 'date' | 'photo' | 'signature' | 'table';
  label: string;
  placeholder?: string;
  required: boolean;
  columns?: string[]; // Para campos tipo tabla
}

interface Template {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  createdAt: string;
  storagePath?: string;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Estado de base de datos conectado al API
  const [companySettings, setCompanySettings] = useState({
    name: 'ESE Norte 3',
    nit: '800.123.456-7',
    address: 'Calle 10 # 5-20, Sede Principal',
    phone: '320 123 4567',
    manager: 'Dra. María Helena Castro',
    email: 'contacto@esenorte3.gov.co',
    logo: null as string | null
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [senders, setSenders] = useState<any[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [signedDocuments, setSignedDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        const { default: api } = await import('./utils/api');
        
        const [compRes, empRes, senRes, tplRes, docRes] = await Promise.all([
          api.get('/company'),
          api.get('/employees'),
          api.get('/senders'),
          api.get('/templates'),
          api.get('/documents')
        ]);

        if (compRes.data.success && compRes.data.data) {
          setCompanySettings(prev => ({ ...prev, ...compRes.data.data }));
        }
        if (empRes.data.success) setEmployees(empRes.data.data);
        if (senRes.data.success) setSenders(senRes.data.data);
        if (tplRes.data.success) setTemplates(tplRes.data.data);
        if (docRes.data.success) setSignedDocuments(docRes.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Creador de Plantillas (DocBuilder State)
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    name: '',
    description: '',
    storagePath: '',
    fields: []
  });

  const [selectedFieldType, setSelectedFieldType] = useState<'text' | 'number' | 'date' | 'photo' | 'signature' | 'table'>('text');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldRequired, setFieldRequired] = useState(true);
  const [tableCols, setTableCols] = useState('');

  const addFieldToTemplate = () => {
    if (!fieldLabel.trim()) return;

    const newField: TemplateField = {
      id: Math.random().toString(36).substr(2, 9),
      type: selectedFieldType,
      label: fieldLabel,
      required: fieldRequired,
      columns: selectedFieldType === 'table' ? tableCols.split(',').map(c => c.trim()).filter(Boolean) : undefined
    };

    setNewTemplate(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));

    setFieldLabel('');
    setTableCols('');
  };

  const removeFieldFromTemplate = (id: string) => {
    setNewTemplate(prev => ({
      ...prev,
      fields: (prev.fields || []).filter(f => f.id !== id)
    }));
  };

  const saveTemplate = () => {
    if (!newTemplate.name) return;
    const template: Template = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTemplate.name,
      description: newTemplate.description || '',
      fields: newTemplate.fields || [],
      storagePath: newTemplate.storagePath || 'Raíz',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTemplates(prev => [...prev, template]);
    setNewTemplate({ name: '', description: '', fields: [], storagePath: '' });
    alert('Plantilla guardada con éxito.');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <LoginPage 
        onLogin={() => setIsAuthenticated(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <MainLayout 
      currentTab={currentTab} 
      setCurrentTab={setCurrentTab}
      theme={theme}
      toggleTheme={toggleTheme}
      onLogout={handleLogout}
    >
      
      {/* RENDER DASHBOARD TAB */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Dashboard General</h1>
            <p className="text-muted-foreground">Monitoreo y resumen de la operación de ESE Norte 3.</p>
          </div>

          {/* Stats Cards (Copied the clean tech look from ispgo) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border p-6 rounded-lg shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documentos Guardados</p>
                <h3 className="text-3xl font-bold text-foreground">{signedDocuments.length}</h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <FileText className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-lg shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empleados Activos</p>
                <h3 className="text-3xl font-bold text-foreground">{employees.filter(e => e.status === 'Activo').length}</h3>
              </div>
              <div className="p-3 bg-brand-light-blue/15 rounded-full text-brand-light-blue">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-lg shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plantillas Creadas</p>
                <h3 className="text-3xl font-bold text-foreground">{templates.length}</h3>
              </div>
              <div className="p-3 bg-brand-accent/10 rounded-full text-brand-accent">
                <Grid className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-lg shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tasa Sincronización</p>
                <h3 className="text-3xl font-bold text-green-500">100%</h3>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full text-green-500">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Docs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Signed Documents */}
            <div className="lg:col-span-2 bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                <h3 className="font-semibold text-foreground">Documentos Firmados Recientemente</h3>
                <span className="text-xs text-muted-foreground font-mono">En tiempo real</span>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 text-xs font-semibold text-muted-foreground bg-muted/10">
                      <th className="px-6 py-3">Plantilla</th>
                      <th className="px-6 py-3">Diligenciado por</th>
                      <th className="px-6 py-3">Fecha y Hora</th>
                      <th className="px-6 py-3">Estado Sync</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs">
                    {signedDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{doc.templateName}</td>
                        <td className="px-6 py-4 text-muted-foreground">{doc.filledBy}</td>
                        <td className="px-6 py-4 text-muted-foreground">{doc.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            doc.syncStatus === 'Sincronizado' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {doc.syncStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1 rounded hover:bg-muted text-primary hover:text-accent mr-1">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                            <FileDown className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions (Dashboard Shortcut look) */}
            <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-6">
              <h3 className="font-semibold text-foreground border-b border-border pb-3">Accesos Directos</h3>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setCurrentTab('templates')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md text-primary group-hover:scale-110 transition-transform">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">Crear Nueva Plantilla</h4>
                      <p className="text-[10px] text-muted-foreground">Abrir el DocBuilder</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>

                <button 
                  onClick={() => setCurrentTab('users')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand-light-blue/50 hover:bg-brand-light-blue/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-light-blue/10 rounded-md text-brand-light-blue group-hover:scale-110 transition-transform">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">Registrar Empleado</h4>
                      <p className="text-[10px] text-muted-foreground">Agregar nuevo operario</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-brand-light-blue transition-colors" />
                </button>

                <button 
                  onClick={() => setCurrentTab('settings')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand-secondary/50 hover:bg-brand-secondary/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-secondary/10 rounded-md text-brand-secondary group-hover:scale-110 transition-transform">
                      <SettingsIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">Ajustes Institucionales</h4>
                      <p className="text-[10px] text-muted-foreground">Logo, NIT, Direcciones</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-brand-secondary transition-colors" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RENDER TEMPLATES TAB (DOCBUILDER) */}
      {currentTab === 'templates' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">DocBuilder - Creador de Plantillas</h1>
              <p className="text-muted-foreground">Diseña formularios dinámicos que tus trabajadores diligenciarán en las tablets.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            
            {/* Editor Canvas */}
            <div className="xl:col-span-3 bg-card border border-border rounded-lg shadow-sm p-6 space-y-6">
              <h3 className="font-semibold text-foreground border-b border-border pb-3">Detalles de la Plantilla</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Nombre de la Plantilla</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Acta de Entrega de Computadores"
                    value={newTemplate.name || ''}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                  <input 
                    type="text" 
                    placeholder="Escribe una breve descripción del documento..."
                    value={newTemplate.description || ''}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Ruta de Almacenamiento (Servidor)</label>
                  <input 
                    type="text" 
                    placeholder="Ej. RRHH/empleados o CALIDAD/AUDITORIAS"
                    value={newTemplate.storagePath || ''}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, storagePath: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>

              {/* Agregar nuevo campo */}
              <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-4">
                <h4 className="text-xs font-bold text-foreground">Añadir Campo al Documento</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Etiqueta del Campo</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Kilometraje inicial"
                      value={fieldLabel}
                      onChange={(e) => setFieldLabel(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Input</label>
                    <select
                      value={selectedFieldType}
                      onChange={(e) => setSelectedFieldType(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    >
                      <option value="text">Texto Corto</option>
                      <option value="number">Número</option>
                      <option value="date">Fecha</option>
                      <option value="photo">Fotografía (Cámara)</option>
                      <option value="signature">Firma Táctil</option>
                      <option value="table">Tabla de Contenidos</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Configuración</label>
                    <div className="flex items-center h-9">
                      <input 
                        type="checkbox" 
                        id="req"
                        checked={fieldRequired}
                        onChange={(e) => setFieldRequired(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <label htmlFor="req" className="ml-2 text-xs text-muted-foreground cursor-pointer select-none">¿Es Obligatorio?</label>
                    </div>
                  </div>
                </div>

                {selectedFieldType === 'table' && (
                  <div className="space-y-1 animate-in fade-in duration-200">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Columnas de la Tabla (Separadas por comas)</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Nombre del Insumo, Cantidad Entregada, Observación"
                      value={tableCols}
                      onChange={(e) => setTableCols(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                )}

                <button 
                  onClick={addFieldToTemplate}
                  className="bg-primary text-white text-xs px-4 py-2 rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Campo
                </button>
              </div>

              {/* Lista de campos actuales */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground">Campos del Documento</h4>
                
                {(!newTemplate.fields || newTemplate.fields.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic bg-muted/10 p-4 rounded border border-border text-center">No has agregado ningún campo todavía. Utiliza el constructor de arriba.</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {newTemplate.fields.map((field, index) => (
                      <div key={field.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/20 transition-all">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}</span>
                          <div>
                            <span className="text-xs font-semibold text-foreground">{field.label}</span>
                            <span className="ml-2 text-[10px] bg-secondary/10 text-muted-foreground border border-border/80 px-2 py-0.5 rounded-full capitalize">{field.type}</span>
                            {field.required && <span className="ml-1 text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full">Requerido</span>}
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFieldFromTemplate(field.id)}
                          className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Guardar Todo */}
              <div className="border-t border-border pt-4 flex justify-end gap-3">
                <button 
                  onClick={saveTemplate}
                  disabled={!newTemplate.name || !newTemplate.fields?.length}
                  className="bg-accent hover:bg-primary text-white text-xs px-6 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  Guardar Plantilla
                </button>
              </div>

            </div>

            {/* Live Preview Emulator */}
            <div className="xl:col-span-2 bg-background border border-border rounded-lg p-6 space-y-6 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 bg-primary h-1.5" />
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">{companySettings.name}</h3>
                    <p className="text-[10px] text-muted-foreground leading-tight">NIT: {companySettings.nit} | Dir: {companySettings.address}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-primary">{newTemplate.name || 'Sin Título de Plantilla'}</h4>
                  <p className="text-xs text-muted-foreground">{newTemplate.description || 'Sin descripción'}</p>
                </div>

                <div className="h-px bg-border/80 my-4" />

                {/* Render inputs list dynamic preview */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {(newTemplate.fields || []).map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        {field.label}
                        {field.required && <span className="text-destructive">*</span>}
                      </label>

                      {field.type === 'text' && (
                        <input type="text" placeholder="Ejemplo de respuesta..." disabled className="w-full text-xs p-2 rounded border border-border bg-muted/10 opacity-70 cursor-not-allowed" />
                      )}

                      {field.type === 'number' && (
                        <input type="number" placeholder="Ej. 12345" disabled className="w-full text-xs p-2 rounded border border-border bg-muted/10 opacity-70 cursor-not-allowed" />
                      )}

                      {field.type === 'date' && (
                        <input type="date" disabled className="w-full text-xs p-2 rounded border border-border bg-muted/10 opacity-70 cursor-not-allowed" />
                      )}

                      {field.type === 'photo' && (
                        <div className="border border-dashed border-border rounded-lg p-3 bg-muted/20 text-center flex flex-col items-center justify-center gap-1 opacity-70">
                          <Camera className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Botón de captura (Cámara del dispositivo)</span>
                        </div>
                      )}

                      {field.type === 'signature' && (
                        <div className="border border-dashed border-border rounded-lg p-4 bg-muted/10 text-center flex flex-col items-center justify-center gap-1 h-20 opacity-70">
                          <span className="text-[10px] text-muted-foreground">Área para firmar con el dedo / lápiz táctil</span>
                        </div>
                      )}

                      {field.type === 'table' && (
                        <div className="border border-border rounded-lg overflow-hidden bg-card opacity-70">
                          <div className="grid grid-cols-3 bg-muted/50 border-b border-border text-[9px] font-bold text-muted-foreground p-1 px-2">
                            {(field.columns || ['Columna 1', 'Columna 2']).map((c, i) => (
                              <span key={i} className="truncate">{c}</span>
                            ))}
                          </div>
                          <div className="p-2 border-b border-border/40 text-[10px] text-muted-foreground italic text-center">
                            Cuadrícula de tabla interactiva
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {(!newTemplate.fields || newTemplate.fields.length === 0) && (
                    <div className="text-center py-8 text-xs text-muted-foreground italic">
                      Aquí aparecerán los inputs del formulario en tiempo real
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Plantillas Actuales */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Plantillas Existentes</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(t => (
                <div key={t.id} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors flex justify-between items-start bg-muted/10">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground">{t.name}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{t.description}</p>
                    <div className="pt-2 flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                        {t.fields.length} campos
                      </span>
                      {t.storagePath && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full font-mono font-medium">
                          📁 {t.storagePath}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">Creado: {t.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button className="p-1.5 rounded hover:bg-muted text-primary">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-muted text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentTab === 'explorer' && (
        <FileExplorer templates={templates} signedDocuments={signedDocuments} />
      )}

      {/* RENDER EMPLOYEES TAB */}
      {currentTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Gestión de Empleados</h1>
              <p className="text-muted-foreground">Administra los usuarios con rol de empleado que acceden desde las tablets.</p>
            </div>
            <button className="bg-primary text-white text-xs px-4 py-2 rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Nuevo Empleado
            </button>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-xs font-semibold text-muted-foreground bg-muted/30">
                  <th className="px-6 py-3.5">Nombre Completo</th>
                  <th className="px-6 py-3.5">Cédula / Documento</th>
                  <th className="px-6 py-3.5">Cargo / Rol</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{emp.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{emp.doc}</td>
                    <td className="px-6 py-4 text-muted-foreground">{emp.role}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        emp.status === 'Activo' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 rounded hover:bg-muted text-primary mr-1"><Edit2 className="h-4 w-4" /></button>
                      <button className="p-1 rounded hover:bg-muted text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER SENDERS TAB */}
      {currentTab === 'senders' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Gestión de Remitentes</h1>
              <p className="text-muted-foreground">Empresas o entidades asociadas que solicitan o despachan los documentos.</p>
            </div>
            <button className="bg-primary text-white text-xs px-4 py-2 rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Nuevo Remitente
            </button>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-xs font-semibold text-muted-foreground bg-muted/30">
                  <th className="px-6 py-3.5">Nombre / Razón Social</th>
                  <th className="px-6 py-3.5">NIT</th>
                  <th className="px-6 py-3.5">Contacto / Teléfono</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {senders.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{s.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{s.nit}</td>
                    <td className="px-6 py-4 text-muted-foreground">{s.phone}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 rounded hover:bg-muted text-primary mr-1"><Edit2 className="h-4 w-4" /></button>
                      <button className="p-1 rounded hover:bg-muted text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER DOCUMENTS TAB */}
      {currentTab === 'documents' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Documentos Diligenciados</h1>
            <p className="text-muted-foreground">Historial y firma digital de todos los documentos llenados por los empleados.</p>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-xs font-semibold text-muted-foreground bg-muted/30">
                  <th className="px-6 py-3.5">Documento</th>
                  <th className="px-6 py-3.5">Empleado Responsable</th>
                  <th className="px-6 py-3.5">Fecha de Envío</th>
                  <th className="px-6 py-3.5">Estado en Servidor</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {signedDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{doc.templateName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{doc.filledBy}</td>
                    <td className="px-6 py-4 text-muted-foreground">{doc.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        doc.syncStatus === 'Sincronizado' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-600'
                      }`}>
                        {doc.syncStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 rounded hover:bg-muted text-primary hover:text-accent mr-1">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                        <FileDown className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER SETTINGS TAB */}
      {currentTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Configuración de la Empresa</h1>
            <p className="text-muted-foreground">Establece el logo institucional y los datos oficiales que aparecerán en la cabecera de los documentos.</p>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-6">
            <h3 className="font-semibold text-foreground border-b border-border pb-3">Información Corporativa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Razón Social</label>
                  <input 
                    type="text" 
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">NIT / Identificación Fiscal</label>
                  <input 
                    type="text" 
                    value={companySettings.nit}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, nit: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Representante Legal / Gerente</label>
                  <input 
                    type="text" 
                    value={companySettings.manager}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, manager: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Dirección Física</label>
                  <input 
                    type="text" 
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
                    <input 
                      type="text" 
                      value={companySettings.phone}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Correo de Soporte</label>
                    <input 
                      type="text" 
                      value={companySettings.email}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                </div>

                {/* Logo Simulator */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Logotipo de la Empresa</label>
                  <div className="border border-dashed border-border rounded-lg p-4 bg-muted/10 text-center flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg shadow-sm border border-primary/20">
                      <span className="font-bold text-xs">ESE</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      <span className="text-primary font-semibold cursor-pointer">Sube un archivo</span> o arrástralo aquí (PNG, JPG de 500x500px)
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <div className="border-t border-border pt-4 flex justify-end">
              <button 
                onClick={() => alert('Configuración guardada exitosamente.')}
                className="bg-primary text-white text-xs px-6 py-2.5 rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                Guardar Ajustes
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}

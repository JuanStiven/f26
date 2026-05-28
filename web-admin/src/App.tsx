import React, { useState, useEffect, useRef } from 'react';
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
  Grid,
  X,
  TextSelect,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface TemplateField {
  id: string;
  type: 'text' | 'number' | 'date' | 'photo' | 'signature' | 'table' | 'dropdown';
  label: string;
  placeholder?: string;
  required: boolean;
  columns?: string[]; // Para campos tipo tabla
  options?: string[]; // Para campos tipo dropdown
  category?: string; // Para agrupar por categoría
  hideInPdf?: boolean; // Para ocultar en PDF
}

interface Template {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  createdAt: string;
  storagePath?: string;
  assignedUsers?: any[];
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token) {
      setIsAuthenticated(true);
      if (userStr) {
        try {
          setCurrentUser(JSON.parse(userStr));
        } catch (e) {}
      }
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
    country: 'Colombia',
    department: 'Antioquia',
    branch: 'Sede Principal',
    logoUrl: null as string | null
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [senders, setSenders] = useState<any[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [signedDocuments, setSignedDocuments] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const { default: api } = await import('./utils/api');
      
      const [compRes, empRes, senRes, tplRes, docRes, foldRes] = await Promise.all([
        api.get('/company'),
        api.get('/employees'),
        api.get('/senders'),
        api.get('/templates'),
        api.get('/documents'),
        api.get('/folders')
      ]);

      if (compRes.data.success && compRes.data.data) {
        setCompanySettings(prev => ({ ...prev, ...compRes.data.data }));
      }
      if (empRes.data.success) setEmployees(empRes.data.data);
      if (senRes.data.success) setSenders(senRes.data.data);
      if (tplRes.data.success) setTemplates(tplRes.data.data);
      if (docRes.data.success) setSignedDocuments(docRes.data.data);
      if (foldRes.data.success) setFolders(foldRes.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchData();
  }, [isAuthenticated]);

  const RefreshButton = () => (
    <button 
      onClick={fetchData} 
      disabled={isRefreshing}
      className="p-2 border border-border rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50" 
      title="Refrescar datos"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
      <span className="hidden sm:inline text-[10px] font-medium uppercase tracking-wider">Refrescar</span>
    </button>
  );

  // Creador de Plantillas (DocBuilder State)
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    name: '',
    description: '',
    storagePath: '',
    fields: [],
    assignedUsers: []
  });

  const [selectedFieldType, setSelectedFieldType] = useState<'text' | 'number' | 'date' | 'photo' | 'signature' | 'table' | 'dropdown'>('text');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldCategory, setFieldCategory] = useState('General');
  const [fieldRequired, setFieldRequired] = useState(true);
  const [fieldHideInPdf, setFieldHideInPdf] = useState(false);
  const [tableCols, setTableCols] = useState('');
  const [dropdownOptions, setDropdownOptions] = useState('');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [documentModal, setDocumentModal] = useState<any>(null);

  // Pagination, Sorting and Filtering for Documents
  const [docSearchTerm, setDocSearchTerm] = useState('');
  const [docSortConfig, setDocSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [docCurrentPage, setDocCurrentPage] = useState(1);
  const [docItemsPerPage] = useState(10);

  // Pagination and Filtering for Employees
  const [empSearchTerm, setEmpSearchTerm] = useState('');
  const [empCurrentPage, setEmpCurrentPage] = useState(1);
  const empItemsPerPage = 10;

  // Pagination and Filtering for Admins
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminCurrentPage, setAdminCurrentPage] = useState(1);
  const adminItemsPerPage = 10;

  const handleDocSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (docSortConfig && docSortConfig.key === key && docSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setDocSortConfig({ key, direction });
  };

  const filteredAndSortedDocs = React.useMemo(() => {
    let result = [...signedDocuments];
    
    if (docSearchTerm) {
      const lowerSearch = docSearchTerm.toLowerCase();
      result = result.filter(doc => 
        (doc.template?.name || 'Documento').toLowerCase().includes(lowerSearch) ||
        (doc.filledBy?.name || doc.filledBy || 'Empleado').toLowerCase().includes(lowerSearch)
      );
    }
    
    if (docSortConfig) {
      result.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';
        
        switch (docSortConfig.key) {
          case 'templateName':
            valA = (a.template?.name || 'Documento').toLowerCase();
            valB = (b.template?.name || 'Documento').toLowerCase();
            break;
          case 'filledBy':
            valA = (a.filledBy?.name || a.filledBy || 'Empleado').toLowerCase();
            valB = (b.filledBy?.name || b.filledBy || 'Empleado').toLowerCase();
            break;
          case 'createdAt':
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
            break;
          case 'syncStatus':
            valA = a.syncStatus === 'SYNCED' ? 'sincronizado' : 'pendiente';
            valB = b.syncStatus === 'SYNCED' ? 'sincronizado' : 'pendiente';
            break;
        }
        
        if (valA < valB) return docSortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return docSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [signedDocuments, docSearchTerm, docSortConfig]);

  const docTotalPages = Math.ceil(filteredAndSortedDocs.length / docItemsPerPage);
  const docCurrentData = filteredAndSortedDocs.slice((docCurrentPage - 1) * docItemsPerPage, docCurrentPage * docItemsPerPage);

  const filteredEmployees = React.useMemo(() => {
    let result = employees.filter(e => e.role !== 'ADMIN');
    if (empSearchTerm) {
      const lowerSearch = empSearchTerm.toLowerCase();
      result = result.filter(emp => 
        (emp.name || '').toLowerCase().includes(lowerSearch) ||
        (emp.document || emp.doc || '').toLowerCase().includes(lowerSearch) ||
        (emp.position || emp.role || '').toLowerCase().includes(lowerSearch)
      );
    }
    return result;
  }, [employees, empSearchTerm]);

  const empTotalPages = Math.ceil(filteredEmployees.length / empItemsPerPage);
  const empCurrentData = filteredEmployees.slice((empCurrentPage - 1) * empItemsPerPage, empCurrentPage * empItemsPerPage);

  const filteredAdmins = React.useMemo(() => {
    let result = employees.filter(e => e.role === 'ADMIN');
    if (adminSearchTerm) {
      const lowerSearch = adminSearchTerm.toLowerCase();
      result = result.filter(emp => 
        (emp.name || '').toLowerCase().includes(lowerSearch) ||
        (emp.document || emp.doc || '').toLowerCase().includes(lowerSearch) ||
        (emp.position || emp.role || '').toLowerCase().includes(lowerSearch)
      );
    }
    return result;
  }, [employees, adminSearchTerm]);

  const adminTotalPages = Math.ceil(filteredAdmins.length / adminItemsPerPage);
  const adminCurrentData = filteredAdmins.slice((adminCurrentPage - 1) * adminItemsPerPage, adminCurrentPage * adminItemsPerPage);

  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const insertTagToDescription = (tag: string) => {
    const textarea = descriptionRef.current;
    const currentDesc = newTemplate.description || '';
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const insert = ` {{${tag}}} `;
      
      const newDesc = currentDesc.substring(0, start) + insert + currentDesc.substring(end);
      setNewTemplate(prev => ({ ...prev, description: newDesc }));
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + insert.length, start + insert.length);
      }, 0);
    } else {
      setNewTemplate(prev => ({ ...prev, description: currentDesc + ` {{${tag}}} ` }));
    }
  };

  // Empleados Modal State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);

  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  
  // Template Preview Modal State
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    id: undefined as string | undefined,
    name: '',
    document: '',
    pin: '',
    position: '',
    status: 'Activo',
    role: 'EMPLOYEE' as 'EMPLOYEE' | 'ADMIN'
  });

  // Profile & Security Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', position: '' });
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityForm, setSecurityForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const addFieldToTemplate = () => {
    if (!fieldLabel.trim()) return;

    const fieldData = {
      type: selectedFieldType,
      label: fieldLabel,
      required: fieldRequired,
      hideInPdf: fieldHideInPdf,
      columns: selectedFieldType === 'table' ? tableCols.split(',').map(c => c.trim()).filter(Boolean) : undefined,
      options: selectedFieldType === 'dropdown' ? dropdownOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined,
      category: fieldCategory.trim() || 'General'
    };

    if (editingFieldId) {
      setNewTemplate(prev => ({
        ...prev,
        fields: prev.fields?.map(f => f.id === editingFieldId ? { ...f, ...fieldData } : f)
      }));
      setEditingFieldId(null);
    } else {
      setNewTemplate(prev => ({
        ...prev,
        fields: [...(prev.fields || []), { id: Math.random().toString(36).substr(2, 9), ...fieldData }]
      }));
    }

    setFieldLabel('');
    setTableCols('');
    setDropdownOptions('');
    setFieldHideInPdf(false);
  };

  const editField = (field: TemplateField) => {
    setEditingFieldId(field.id);
    setFieldLabel(field.label);
    setSelectedFieldType(field.type);
    setFieldRequired(field.required);
    setFieldHideInPdf(field.hideInPdf || false);
    setFieldCategory(field.category || 'General');
    setTableCols(field.columns?.join(', ') || '');
    setDropdownOptions(field.options?.join(', ') || '');
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedFieldId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedFieldId || draggedFieldId === targetId) return;

    const newFields = [...(newTemplate.fields || [])];
    const draggedIndex = newFields.findIndex(f => f.id === draggedFieldId);
    const targetIndex = newFields.findIndex(f => f.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedField] = newFields.splice(draggedIndex, 1);
      draggedField.category = newFields[targetIndex].category;
      newFields.splice(targetIndex, 0, draggedField);
      setNewTemplate(prev => ({ ...prev, fields: newFields }));
    }
    setDraggedFieldId(null);
  };

  const removeFieldFromTemplate = (id: string) => {
    setNewTemplate(prev => ({
      ...prev,
      fields: (prev.fields || []).filter(f => f.id !== id)
    }));
  };

  const saveTemplate = async () => {
    if (!newTemplate.name) return;
    try {
      const { default: api } = await import('./utils/api');
      const payload = {
        name: newTemplate.name,
        description: newTemplate.description || '',
        storagePath: newTemplate.storagePath || 'Raíz',
        fields: newTemplate.fields || [],
        assignedUsers: newTemplate.assignedUsers?.map((u: any) => u.id) || []
      };

      if (newTemplate.id) {
        const response = await api.put(`/templates/${newTemplate.id}`, payload);
        if (response.data.success) {
          setTemplates(prev => prev.map(t => t.id === newTemplate.id ? response.data.data : t));
          setNewTemplate({ name: '', description: '', fields: [], storagePath: '', assignedUsers: [] });
          alert('Plantilla actualizada con éxito.');
        }
      } else {
        const response = await api.post('/templates', payload);
        if (response.data.success) {
          setTemplates(prev => [...prev, response.data.data]);
          setNewTemplate({ name: '', description: '', fields: [], storagePath: '', assignedUsers: [] });
          alert('Plantilla guardada con éxito.');
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error guardando plantilla');
    }
  };

  const deleteTemplate = async () => {
    if (!templateToDelete) return;
    try {
      const { default: api } = await import('./utils/api');
      const response = await api.delete(`/templates/${templateToDelete.id}`);
      if (response.data.success) {
        setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
        setIsTemplateModalOpen(false);
        setTemplateToDelete(null);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar plantilla');
    }
  };

  const saveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.document) return;
    try {
      const { default: api } = await import('./utils/api');
      if (newEmployee.id) {
        // Edit mode
        const response = await api.put(`/employees/${newEmployee.id}`, newEmployee);
        if (response.data.success) {
          setEmployees(prev => prev.map(emp => emp.id === newEmployee.id ? response.data.data : emp));
          setNewEmployee({ id: undefined, name: '', document: '', pin: '', position: '', status: 'Activo', role: 'EMPLOYEE' });
          setIsEmployeeModalOpen(false);
        }
      } else {
        // Create mode
        if (!newEmployee.pin) return;
        const response = await api.post('/employees', newEmployee);
        if (response.data.success) {
          setEmployees(prev => [...prev, response.data.data]);
          setNewEmployee({ id: undefined, name: '', document: '', pin: '', position: '', status: 'Activo', role: 'EMPLOYEE' });
          setIsEmployeeModalOpen(false);
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error guardando empleado');
    }
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    try {
      const { default: api } = await import('./utils/api');
      await api.delete(`/employees/${employeeToDelete.id}`);
      setEmployees(prev => prev.filter(emp => emp.id !== employeeToDelete.id));
      setEmployeeToDelete(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error eliminando empleado');
      setEmployeeToDelete(null);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { default: api } = await import('./utils/api');
      const response = await api.put(`/employees/${currentUser.id}`, profileForm);
      if (response.data.success) {
        const updatedUser = { ...currentUser, ...response.data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        setIsProfileModalOpen(false);
        alert('Perfil actualizado con éxito');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al actualizar perfil');
    }
  };

  const saveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    try {
      const { default: api } = await import('./utils/api');
      const response = await api.put(`/employees/${currentUser.id}`, { pin: securityForm.newPassword });
      if (response.data.success) {
        setIsSecurityModalOpen(false);
        setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        alert('Contraseña actualizada con éxito');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al actualizar contraseña');
    }
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
      companySettings={companySettings}
      currentUser={currentUser}
      onProfileClick={() => {
        setProfileForm({ 
          name: currentUser?.name || '', 
          email: currentUser?.email || '', 
          position: currentUser?.position || '' 
        });
        setIsProfileModalOpen(true);
      }}
      onSecurityClick={() => {
        setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsSecurityModalOpen(true);
      }}
      notificationsData={signedDocuments.slice(0, 5).map(doc => ({
        id: doc.id,
        text: `Nuevo documento (${doc.template?.name || 'Plantilla'}) diligenciado por ${doc.filledBy?.name || doc.filledBy || 'Empleado'}`,
        time: new Date(doc.createdAt).toLocaleDateString(),
        read: false
      }))}
    >
      
      {/* RENDER DASHBOARD TAB */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Dashboard General</h1>
              <p className="text-muted-foreground">Monitoreo y resumen de la operación de ESE Norte 3.</p>
            </div>
            <RefreshButton />
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
                    {signedDocuments.slice(0, 5).map((doc) => (
                      <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{doc.template?.name || 'Documento'}</td>
                        <td className="px-6 py-4 text-muted-foreground">{doc.filledBy?.name || doc.filledBy || 'Empleado'}</td>
                        <td className="px-6 py-4 text-muted-foreground">{new Date(doc.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            doc.syncStatus === 'SYNCED' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {doc.syncStatus === 'SYNCED' ? 'Sincronizado' : (doc.syncStatus === 'PENDING' || doc.syncStatus?.toLowerCase() === 'pending' ? 'Pendiente' : doc.syncStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setDocumentModal(doc)}
                            className="p-1 rounded hover:bg-muted text-primary hover:text-accent mr-1"
                            title="Ver Contenido"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
                              window.open(`${baseUrl}/uploads/${doc.filePath}`, '_blank');
                            }}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Descargar PDF"
                          >
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
            <RefreshButton />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            
            {/* Editor Canvas */}
            <div className="xl:col-span-3 bg-card border border-border rounded-lg shadow-sm p-6 space-y-6">
              <h3 className="font-semibold text-foreground border-b border-border pb-3">Detalles de la Plantilla</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="text-xs font-medium text-muted-foreground">Ruta de Almacenamiento (Servidor)</label>
                  <select 
                    value={newTemplate.storagePath || ''}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, storagePath: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                  >
                    <option value="">Raíz (Directorio Principal)</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.path}>{folder.path}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-medium text-muted-foreground">Cuerpo del Documento (Descripción)</label>
                  <span className="text-[10px] text-muted-foreground italic">Usa el botón "Insertar" en tus campos para agregarlos aquí</span>
                </div>
                <textarea 
                  ref={descriptionRef}
                  placeholder="Ej. Yo {{Nombre Empleado}} identificado con número de documento {{Cédula}} certifico que..."
                  value={newTemplate.description || ''}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full text-xs p-3 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none min-h-[120px] resize-y"
                />
              </div>

              {/* Agregar nuevo campo */}
              <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-4">
                <h4 className="text-xs font-bold text-foreground">Añadir Campo al Documento</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Categoría</label>
                    <input 
                      type="text" 
                      list="field-categories"
                      placeholder="Ej. Datos del paciente"
                      value={fieldCategory}
                      onChange={(e) => setFieldCategory(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                    <datalist id="field-categories">
                      <option value="General" />
                      <option value="Datos del paciente" />
                      <option value="Información Clínica" />
                      <option value="Firmas" />
                    </datalist>
                  </div>

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
                      <option value="dropdown">Lista Desplegable (Dropdown)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Configuración</label>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="req"
                          checked={fieldRequired}
                          onChange={(e) => setFieldRequired(e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        />
                        <label htmlFor="req" className="ml-2 text-xs text-muted-foreground cursor-pointer select-none">¿Obligatorio?</label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="hidePdf"
                          checked={fieldHideInPdf}
                          onChange={(e) => setFieldHideInPdf(e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        />
                        <label htmlFor="hidePdf" className="ml-2 text-xs text-muted-foreground cursor-pointer select-none" title="Si se marca, este dato no se listará en la parte inferior del PDF, útil si solo se usa como variable en el texto superior">Ocultar datos en PDF</label>
                      </div>
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

                {selectedFieldType === 'dropdown' && (
                  <div className="space-y-1 animate-in fade-in duration-200">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Opciones (Separadas por comas)</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Opción 1, Opción 2, Opción 3"
                      value={dropdownOptions}
                      onChange={(e) => setDropdownOptions(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button 
                    onClick={addFieldToTemplate}
                    className="bg-primary text-white text-xs px-4 py-2 rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1.5"
                  >
                    {editingFieldId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {editingFieldId ? 'Guardar Cambios' : 'Agregar Campo'}
                  </button>
                  {editingFieldId && (
                    <button 
                      onClick={() => {
                        setEditingFieldId(null);
                        setFieldLabel('');
                        setTableCols('');
                        setDropdownOptions('');
                      }}
                      className="bg-muted text-muted-foreground text-xs px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-1.5"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de campos actuales */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground">Campos del Documento</h4>
                
                {(!newTemplate.fields || newTemplate.fields.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic bg-muted/10 p-4 rounded border border-border text-center">No has agregado ningún campo todavía. Utiliza el constructor de arriba.</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {Object.entries((newTemplate.fields || []).reduce((acc, field) => {
                      const cat = field.category || 'General';
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(field);
                      return acc;
                    }, {} as Record<string, TemplateField[]>)).map(([category, fields]) => (
                      <div key={category} className="space-y-2 mb-4">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/20 py-1 px-2 rounded">{category}</div>
                        {fields.map((field, index) => (
                          <div 
                            key={field.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, field.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, field.id)}
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/20 transition-all cursor-move"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}</span>
                              <div>
                                <span className="text-xs font-semibold text-foreground">{field.label}</span>
                                <span className="ml-2 text-[10px] bg-secondary/10 text-muted-foreground border border-border/80 px-2 py-0.5 rounded-full capitalize">{field.type}</span>
                                {field.required && <span className="ml-1 text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full">Requerido</span>}
                                {field.hideInPdf && <span className="ml-1 text-[10px] bg-muted/50 text-muted-foreground border border-border/80 px-2 py-0.5 rounded-full" title="No se mostrará en los datos del PDF">Oculto PDF</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => insertTagToDescription(field.label)}
                                className="text-primary hover:bg-primary/10 p-1.5 rounded transition-colors flex items-center gap-1"
                                title="Insertar en el texto"
                              >
                                <TextSelect className="h-4 w-4" />
                                <span className="text-[10px] font-medium hidden sm:inline">Insertar</span>
                              </button>
                              <button 
                                onClick={() => editField(field)}
                                className="text-brand-secondary hover:bg-brand-secondary/10 p-1.5 rounded transition-colors"
                                title="Editar campo"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => removeFieldFromTemplate(field.id)}
                                className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors"
                                title="Eliminar campo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Empleados Asignados */}
              <div className="border-t border-border pt-6 mt-4">
                <label className="text-xs font-bold text-foreground mb-3 flex justify-between items-center">
                  <span>Empleados Asignados</span>
                  <span className="text-[10px] text-primary font-normal bg-primary/10 px-2 py-0.5 rounded-full">{newTemplate.assignedUsers?.length || 0} seleccionados</span>
                </label>
                <div className="w-full text-xs p-3 rounded-lg border border-border bg-background h-48 overflow-y-auto space-y-1">
                  {employees.map(emp => {
                    const isSelected = (newTemplate.assignedUsers || []).some((u: any) => u.id === emp.id);
                    return (
                      <label key={emp.id} className={`flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-colors ${isSelected ? 'border-primary/50 bg-primary/5' : 'border-transparent hover:bg-muted'}`}>
                        <input 
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          checked={isSelected}
                          onChange={(e) => {
                            const current = newTemplate.assignedUsers || [];
                            if (e.target.checked) {
                              setNewTemplate(prev => ({ ...prev, assignedUsers: [...current, { id: emp.id, name: emp.name }] }));
                            } else {
                              setNewTemplate(prev => ({ ...prev, assignedUsers: current.filter((u: any) => u.id !== emp.id) }));
                            }
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground text-xs">{emp.name}</span>
                          <span className="text-[10px] text-muted-foreground">{emp.document} - {emp.position || 'Empleado'}</span>
                        </div>
                      </label>
                    );
                  })}
                  {employees.length === 0 && (
                    <div className="text-center p-4 text-muted-foreground">No hay empleados registrados.</div>
                  )}
                </div>
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
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{newTemplate.description || 'Sin descripción'}</p>
                </div>

                <div className="h-px bg-border/80 my-4" />

                {/* Render inputs list dynamic preview */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {Object.entries((newTemplate.fields || []).reduce((acc, field) => {
                    const cat = field.category || 'General';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(field);
                    return acc;
                  }, {} as Record<string, TemplateField[]>)).map(([category, fields]) => (
                    <div key={category} className="space-y-3 mb-4">
                      <h5 className="text-[11px] font-bold text-primary uppercase border-b border-border/50 pb-1">{category}</h5>
                      {fields.map((field) => (
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

                          {field.type === 'dropdown' && (
                            <select disabled className="w-full text-xs p-2 rounded border border-border bg-muted/10 opacity-70 cursor-not-allowed">
                              <option>Selecciona una opción...</option>
                              {(field.options || []).map((o, i) => (
                                <option key={i} value={o}>{o}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
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
                    <button 
                      onClick={() => setPreviewTemplate(t)}
                      className="p-1.5 rounded hover:bg-muted text-accent"
                      title="Ver vista previa"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setNewTemplate({
                          id: t.id,
                          name: t.name,
                          description: t.description,
                          storagePath: t.storagePath,
                          fields: t.fields || [],
                          assignedUsers: t.assignedUsers || []
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-1.5 rounded hover:bg-muted text-primary"
                      title="Editar plantilla"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setTemplateToDelete(t);
                        setIsTemplateModalOpen(true);
                      }}
                      className="p-1.5 rounded hover:bg-muted text-destructive"
                      title="Eliminar plantilla"
                    >
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
        <FileExplorer 
          templates={templates} 
          signedDocuments={signedDocuments} 
          folders={folders} 
          onRefresh={fetchData}
          isRefreshing={isRefreshing}
        />
      )}

      {/* RENDER EMPLOYEES TAB */}
      {currentTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Gestión de Empleados</h1>
              <p className="text-muted-foreground">Administra los usuarios con rol de empleado que acceden desde las tablets.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <RefreshButton />
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Buscar empleado..." 
                  value={empSearchTerm}
                  onChange={(e) => {
                    setEmpSearchTerm(e.target.value);
                    setEmpCurrentPage(1);
                  }}
                  className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <button 
                onClick={() => {
                  setNewEmployee({ id: undefined, name: '', document: '', pin: '', position: '', status: 'Activo', role: 'EMPLOYEE' });
                  setIsEmployeeModalOpen(true);
                }}
                className="bg-primary text-white text-xs px-4 py-2 rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1.5 w-full sm:w-auto justify-center"
              >
                <Plus className="h-4 w-4" />
                Nuevo Empleado
              </button>
            </div>
          </div>

          {isEmployeeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                  <h3 className="font-semibold text-foreground">Crear Nuevo Empleado</h3>
                  <button onClick={() => setIsEmployeeModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={saveEmployee}>
                  <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Nombre Completo</label>
                      <input 
                        type="text" 
                        required
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                        className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Cédula / Documento</label>
                      <input 
                        type="text" 
                        required
                        value={newEmployee.document}
                        onChange={(e) => setNewEmployee({...newEmployee, document: e.target.value})}
                        className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Contraseña (PIN) {newEmployee.id ? '(Dejar vacío para no cambiar)' : ''}</label>
                      <input 
                        type="password" 
                        required={!newEmployee.id}
                        value={newEmployee.pin}
                        onChange={(e) => setNewEmployee({...newEmployee, pin: e.target.value})}
                        className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Cargo</label>
                      <input 
                        type="text" 
                        value={newEmployee.position}
                        onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                        className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Estado</label>
                      <select 
                        value={newEmployee.status}
                        onChange={(e) => setNewEmployee({...newEmployee, status: e.target.value})}
                        className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsEmployeeModalOpen(false)}
                      className="px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 text-xs font-medium bg-primary text-white hover:bg-primary/95 rounded-lg"
                    >
                      Guardar Empleado
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
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
                  {empCurrentData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No se encontraron empleados
                      </td>
                    </tr>
                  ) : empCurrentData.map((emp) => (
                    <tr key={emp.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{emp.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{emp.document || emp.doc}</td>
                      <td className="px-6 py-4 text-muted-foreground">{emp.position || emp.role}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          emp.status === 'Activo' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            setNewEmployee({
                              id: emp.id,
                              name: emp.name,
                              document: emp.document || emp.doc || '',
                              pin: '',
                              position: emp.position || '',
                              status: emp.status || 'Activo',
                              role: emp.role || 'EMPLOYEE'
                            });
                            setIsEmployeeModalOpen(true);
                          }}
                          className="p-1 rounded hover:bg-muted text-primary mr-1"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setEmployeeToDelete(emp)}
                          className="p-1 rounded hover:bg-muted text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredEmployees.length > 0 && (
              <div className="border-t border-border p-4 flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  Mostrando {(empCurrentPage - 1) * empItemsPerPage + 1} a {Math.min(empCurrentPage * empItemsPerPage, filteredEmployees.length)} de {filteredEmployees.length}
                </div>
                <div className="flex gap-1 items-center">
                  <span className="mr-2">Página {empCurrentPage} de {Math.max(1, empTotalPages)}</span>
                  <button 
                    disabled={empCurrentPage <= 1}
                    onClick={() => setEmpCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button 
                    disabled={empCurrentPage >= empTotalPages}
                    onClick={() => setEmpCurrentPage(prev => Math.min(empTotalPages, prev + 1))}
                    className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {employeeToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-card w-full max-w-sm rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 p-6">
                <h3 className="font-semibold text-lg text-foreground mb-2">Eliminar Empleado</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  ¿Estás seguro de que deseas eliminar a <strong>{employeeToDelete.name}</strong>? Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setEmployeeToDelete(null)}
                    className="px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmDeleteEmployee}
                    className="px-4 py-2 text-xs font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg"
                  >
                    Sí, Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}
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
            <div className="flex items-center gap-3">
              <RefreshButton />
              <button className="bg-primary text-white text-xs px-4 py-2 rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                Nuevo Remitente
              </button>
            </div>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Documentos Diligenciados</h1>
              <p className="text-muted-foreground">Historial y firma digital de todos los documentos llenados por los empleados.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <RefreshButton />
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Buscar documento..." 
                  value={docSearchTerm}
                  onChange={(e) => {
                    setDocSearchTerm(e.target.value);
                    setDocCurrentPage(1);
                  }}
                  className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-xs font-semibold text-muted-foreground bg-muted/30">
                    <th className="px-6 py-3.5 cursor-pointer hover:bg-muted/50" onClick={() => handleDocSort('templateName')}>
                      <div className="flex items-center gap-1">Documento {docSortConfig?.key === 'templateName' && (docSortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>)}</div>
                    </th>
                    <th className="px-6 py-3.5 cursor-pointer hover:bg-muted/50" onClick={() => handleDocSort('filledBy')}>
                      <div className="flex items-center gap-1">Empleado Responsable {docSortConfig?.key === 'filledBy' && (docSortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>)}</div>
                    </th>
                    <th className="px-6 py-3.5 cursor-pointer hover:bg-muted/50" onClick={() => handleDocSort('createdAt')}>
                      <div className="flex items-center gap-1">Fecha de Envío {docSortConfig?.key === 'createdAt' && (docSortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>)}</div>
                    </th>
                    <th className="px-6 py-3.5 cursor-pointer hover:bg-muted/50" onClick={() => handleDocSort('syncStatus')}>
                      <div className="flex items-center gap-1">Estado en Servidor {docSortConfig?.key === 'syncStatus' && (docSortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>)}</div>
                    </th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs">
                  {docCurrentData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No se encontraron documentos
                      </td>
                    </tr>
                  ) : docCurrentData.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{doc.template?.name || 'Documento'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{doc.filledBy?.name || doc.filledBy || 'Empleado'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(doc.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          doc.syncStatus === 'SYNCED' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-600'
                        }`}>
                          {doc.syncStatus === 'SYNCED' ? 'Sincronizado' : (doc.syncStatus === 'PENDING' || doc.syncStatus?.toLowerCase() === 'pending' ? 'Pendiente' : doc.syncStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setDocumentModal(doc)}
                          className="p-1.5 rounded hover:bg-muted text-primary hover:text-accent mr-1"
                          title="Ver Contenido"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
                            window.open(`${baseUrl}/uploads/${doc.filePath}`, '_blank');
                          }}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Descargar PDF"
                        >
                          <FileDown className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredAndSortedDocs.length > 0 && (
              <div className="border-t border-border p-4 flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  Mostrando {(docCurrentPage - 1) * docItemsPerPage + 1} a {Math.min(docCurrentPage * docItemsPerPage, filteredAndSortedDocs.length)} de {filteredAndSortedDocs.length}
                </div>
                <div className="flex gap-1 items-center">
                  <span className="mr-2">Página {docCurrentPage} de {Math.max(1, docTotalPages)}</span>
                  <button 
                    disabled={docCurrentPage <= 1}
                    onClick={() => setDocCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button 
                    disabled={docCurrentPage >= docTotalPages}
                    onClick={() => setDocCurrentPage(prev => Math.min(docTotalPages, prev + 1))}
                    className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER ADMINS TAB */}
      {currentTab === 'admins' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Usuarios (Admins)</h1>
              <p className="text-muted-foreground">Administra los usuarios con rol de administrador que acceden a este panel web.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <RefreshButton />
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Buscar administrador..." 
                  value={adminSearchTerm}
                  onChange={(e) => {
                    setAdminSearchTerm(e.target.value);
                    setAdminCurrentPage(1);
                  }}
                  className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <button 
                onClick={() => {
                  setNewEmployee({ id: undefined, name: '', document: '', pin: '', position: 'Administrador', status: 'Activo', role: 'ADMIN' });
                  setIsEmployeeModalOpen(true);
                }}
                className="bg-primary text-white text-xs px-4 py-2 rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1.5 w-full sm:w-auto justify-center"
              >
                <Plus className="h-4 w-4" />
                Nuevo Administrador
              </button>
            </div>
          </div>

          {/* Se reutiliza el isEmployeeModalOpen pero se configuran los textos si el role es ADMIN */}
          {isEmployeeModalOpen && newEmployee.role === 'ADMIN' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                  <h3 className="font-semibold text-foreground">{newEmployee.id ? 'Editar' : 'Crear Nuevo'} Administrador</h3>
                  <button onClick={() => setIsEmployeeModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={saveEmployee}>
                  <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Nombre Completo</label>
                      <input 
                        type="text" 
                        required
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                        className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Cédula / Documento</label>
                      <input 
                        type="text" 
                        required
                        value={newEmployee.document}
                        onChange={(e) => setNewEmployee({...newEmployee, document: e.target.value})}
                        className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Contraseña (PIN) {newEmployee.id ? '(Dejar vacío para no cambiar)' : ''}</label>
                      <input 
                        type="password" 
                        required={!newEmployee.id}
                        value={newEmployee.pin}
                        onChange={(e) => setNewEmployee({...newEmployee, pin: e.target.value})}
                        className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Cargo</label>
                      <input 
                        type="text" 
                        value={newEmployee.position}
                        onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                        className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Estado</label>
                      <select 
                        value={newEmployee.status}
                        onChange={(e) => setNewEmployee({...newEmployee, status: e.target.value})}
                        className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsEmployeeModalOpen(false)}
                      className="px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 text-xs font-medium bg-primary text-white hover:bg-primary/95 rounded-lg"
                    >
                      Guardar Administrador
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
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
                  {adminCurrentData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No se encontraron administradores
                      </td>
                    </tr>
                  ) : adminCurrentData.map((emp) => (
                    <tr key={emp.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{emp.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{emp.document || emp.doc}</td>
                      <td className="px-6 py-4 text-muted-foreground">{emp.position || emp.role}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          emp.status === 'Activo' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            setNewEmployee({
                              id: emp.id,
                              name: emp.name,
                              document: emp.document || emp.doc || '',
                              pin: '',
                              position: emp.position || '',
                              status: emp.status || 'Activo',
                              role: emp.role || 'ADMIN'
                            });
                            setIsEmployeeModalOpen(true);
                          }}
                          className="p-1 rounded hover:bg-muted text-primary mr-1"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setEmployeeToDelete(emp)}
                          className="p-1 rounded hover:bg-muted text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredAdmins.length > 0 && (
              <div className="border-t border-border p-4 flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  Mostrando {(adminCurrentPage - 1) * adminItemsPerPage + 1} a {Math.min(adminCurrentPage * adminItemsPerPage, filteredAdmins.length)} de {filteredAdmins.length}
                </div>
                <div className="flex gap-1 items-center">
                  <span className="mr-2">Página {adminCurrentPage} de {Math.max(1, adminTotalPages)}</span>
                  <button 
                    disabled={adminCurrentPage <= 1}
                    onClick={() => setAdminCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button 
                    disabled={adminCurrentPage >= adminTotalPages}
                    onClick={() => setAdminCurrentPage(prev => Math.min(adminTotalPages, prev + 1))}
                    className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {employeeToDelete && employeeToDelete.role === 'ADMIN' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-card w-full max-w-sm rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 p-6">
                <h3 className="font-semibold text-lg text-foreground mb-2">Eliminar Administrador</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  ¿Estás seguro de que deseas eliminar a <strong>{employeeToDelete.name}</strong>? Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setEmployeeToDelete(null)}
                    className="px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmDeleteEmployee}
                    className="px-4 py-2 text-xs font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg"
                  >
                    Sí, Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">País</label>
                    <input 
                      type="text" 
                      value={companySettings.country}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Departamento</label>
                    <input 
                      type="text" 
                      value={companySettings.department}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Sede</label>
                  <input 
                    type="text" 
                    value={companySettings.branch}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, branch: e.target.value }))}
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

                {/* Logo Uploader */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Logotipo de la Empresa</label>
                  <label className="border border-dashed border-border rounded-lg p-4 bg-muted/10 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors">
                    {companySettings.logoUrl ? (
                      <img src={companySettings.logoUrl} alt="Logo" className="max-h-16 object-contain" />
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg shadow-sm border border-primary/20">
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
                            setCompanySettings(prev => ({ ...prev, logoUrl: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </label>
                </div>

              </div>

            </div>

            <div className="border-t border-border pt-4 flex justify-end">
              <button 
                onClick={async () => {
                  try {
                    const { default: api } = await import('./utils/api');
                    await api.put('/company', companySettings);
                    alert('Configuración guardada exitosamente.');
                  } catch (e: any) {
                    alert('Error guardando configuración');
                  }
                }}
                className="bg-primary text-white text-xs px-6 py-2.5 rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                Guardar Ajustes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Eliminar Plantilla */}
      {isTemplateModalOpen && templateToDelete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">¿Eliminar Plantilla?</h3>
                <p className="text-sm text-muted-foreground">Estás a punto de eliminar la plantilla <strong className="text-foreground">{templateToDelete.name}</strong>. Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="p-4 border-t border-border bg-muted/30 flex gap-3">
              <button 
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setTemplateToDelete(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={deleteTemplate}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Vista Previa: {previewTemplate.name}
              </h3>
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="p-1.5 hover:bg-muted text-muted-foreground rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-background flex-1 relative space-y-6">
              
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
                <h4 className="text-sm font-bold text-primary">{previewTemplate.name || 'Sin Título de Plantilla'}</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{previewTemplate.description || 'Sin descripción'}</p>
              </div>

              <div className="h-px bg-border/80 my-4" />

              <div className="space-y-4 pr-1">
                {Object.entries((previewTemplate.fields || []).reduce((acc, field) => {
                  const cat = field.category || 'General';
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(field);
                  return acc;
                }, {} as Record<string, TemplateField[]>)).map(([category, fields]) => (
                  <div key={category} className="space-y-3 mb-4">
                    <h5 className="text-[11px] font-bold text-primary uppercase border-b border-border/50 pb-1">{category}</h5>
                    {fields.map((field) => (
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

                        {field.type === 'dropdown' && (
                          <select disabled className="w-full text-xs p-2 rounded border border-border bg-muted/10 opacity-70 cursor-not-allowed">
                            <option>Selecciona una opción...</option>
                            {(field.options || []).map((o, i) => (
                              <option key={i} value={o}>{o}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Mi Perfil</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveProfile} className="p-6 space-y-4">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-semibold shadow-inner">
                  {currentUser?.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Correo / Cédula</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.document || currentUser?.email || ''}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground focus:outline-none opacity-70 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Cargo / Posición</label>
                <input
                  type="text"
                  required
                  value={profileForm.position}
                  onChange={(e) => setProfileForm({...profileForm, position: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/95 transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Modal */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Seguridad (Cambio de Contraseña)</h3>
              <button onClick={() => setIsSecurityModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveSecurity} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Contraseña Actual</label>
                <input
                  type="password"
                  value={securityForm.currentPassword}
                  onChange={(e) => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm({...securityForm, newPassword: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/95 transition-colors"
                >
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content Modal (Global para todas las vistas) */}
      {documentModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-card w-full max-w-3xl rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="font-bold text-foreground truncate max-w-[80%]">{documentModal.template?.name || 'Documento'}</h3>
              <button onClick={() => setDocumentModal(null)} className="p-1 hover:bg-muted text-muted-foreground rounded-md transition-colors hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Header (Datos Empresa similar a mobile app) */}
              <div className="flex border-b border-border pb-4 mb-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex justify-center items-center mr-3 shadow-md shadow-primary/20">
                  <span className="text-white font-bold text-[10px] text-center leading-tight">ESE<br/>Norte 3</span>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="font-bold text-foreground leading-tight text-lg">ESE Norte 3</span>
                  <span className="text-xs text-muted-foreground">Documento Histórico Diligenciado</span>
                </div>
              </div>
              
              {/* Descripción con Variables Reemplazadas */}
              {(() => {
                const description = documentModal.template?.description;
                if (!description) return null;
                const data = { ...documentModal.data };
                const fields = documentModal.template?.fields || [];
                
                // 1. Resolve select labels
                Object.keys(data).forEach(key => {
                  const fieldDef = fields.find((f: any) => f.id === key);
                  if (fieldDef && fieldDef.type === 'select') {
                    const option = fieldDef.options?.find((o: any) => String(o.id) === String(data[key]) || String(o.value) === String(data[key]));
                    if (option) {
                      data[key] = option.label || option.value;
                    }
                  }
                });

                // 2. Build blocks
                let formattedDescription = description;
                const blockTokens: any[] = [];
                Object.keys(data).forEach(key => {
                  const fieldDef = fields.find((f: any) => f.id === key);
                  if (fieldDef && fieldDef.label) {
                    const regex = new RegExp(`{{\\s*${fieldDef.label}\\s*}}`, 'gi');
                    const value = data[key];
                    if (typeof value === 'string' && value.startsWith('data:image/')) {
                       const placeholder = `__IMAGE_BLOCK_${key}__`;
                       if (regex.test(formattedDescription)) {
                         formattedDescription = formattedDescription.replace(regex, placeholder);
                         blockTokens.push({ placeholder, type: 'image', value });
                       }
                    } else if (Array.isArray(value)) {
                       const placeholder = `__TABLE_BLOCK_${key}__`;
                       if (regex.test(formattedDescription)) {
                         formattedDescription = formattedDescription.replace(regex, placeholder);
                         blockTokens.push({ placeholder, type: 'table', value });
                       }
                    } else {
                       formattedDescription = formattedDescription.replace(regex, String(value));
                    }
                  }
                });

                let finalBlocks: any[] = [{ type: 'text', content: formattedDescription }];
                blockTokens.forEach(block => {
                  let newFinalBlocks: any[] = [];
                  finalBlocks.forEach(fb => {
                    if (fb.type === 'text') {
                       const parts = fb.content.split(block.placeholder);
                       parts.forEach((part: string, idx: number) => {
                         if (part) newFinalBlocks.push({ type: 'text', content: part });
                         if (idx < parts.length - 1) newFinalBlocks.push(block);
                       });
                    } else {
                       newFinalBlocks.push(fb);
                    }
                  });
                  finalBlocks = newFinalBlocks;
                });

                return (
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <div className="text-sm text-primary/80 font-medium leading-relaxed text-justify space-y-4">
                      {finalBlocks.map((block, i) => {
                        if (block.type === 'text') {
                          return <span key={i} className="whitespace-pre-wrap">{block.content}</span>;
                        } else if (block.type === 'image') {
                          return <img key={i} src={block.value} alt="Variable Image" className="max-w-full h-auto rounded border border-border/40 block my-2" style={{ maxHeight: '200px' }} />;
                        } else if (block.type === 'table') {
                           if (block.value.length === 0) return <span key={i} className="italic text-muted-foreground block my-2">Tabla sin datos</span>;
                           const cols = Object.keys(block.value[0]);
                           return (
                             <div key={i} className="overflow-x-auto my-2 border border-border/40 rounded-md bg-white">
                               <table className="w-full text-sm text-left">
                                 <thead className="bg-muted text-muted-foreground uppercase text-xs">
                                   <tr>
                                     {cols.map(c => <th key={c} className="px-4 py-2 border-b border-border/40">{c}</th>)}
                                   </tr>
                                 </thead>
                                 <tbody>
                                   {block.value.map((r: any, rIdx: number) => (
                                     <tr key={rIdx} className="border-b border-border/20 last:border-0 hover:bg-muted/50">
                                       {cols.map(c => <td key={c} className="px-4 py-2">{String(r[c] || '')}</td>)}
                                     </tr>
                                   ))}
                                 </tbody>
                               </table>
                             </div>
                           );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Renderizar campos iterando la data */}
              <div className="space-y-4">
                {Object.keys(documentModal.data || {}).map((key: string) => {
                  const val = documentModal.data[key];
                  const fieldDef = (documentModal.template?.fields || []).find((f: any) => f.id === key);
                  const fieldLabel = fieldDef ? fieldDef.label : key;
                  
                  const isMedia = typeof val === 'string' && (val.startsWith('file://') || val.startsWith('data:image/'));

                  return (
                    <div key={key} className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground">{fieldLabel}</span>
                      {isMedia ? (
                        <div className="border border-border rounded-lg overflow-hidden flex justify-center bg-muted/20 p-2">
                           <img src={val} alt="media" className="max-h-40 object-contain rounded-md" />
                        </div>
                      ) : Array.isArray(val) ? (
                        <div className="overflow-x-auto border border-border rounded-lg mt-1">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                              <tr>
                                {Object.keys(val[0] || {}).map((col, i) => (
                                  <th key={i} className="p-2">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {val.map((row, i) => (
                                <tr key={i} className="bg-card">
                                  {Object.values(row).map((cell: any, j) => (
                                    <td key={j} className="p-2">{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg border border-border bg-muted/10 text-sm text-foreground">
                          {val?.toString() || 'Sin respuesta'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t border-border flex justify-end">
              <button 
                onClick={() => setDocumentModal(null)}
                className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/95 transition-colors"
              >
                Cerrar Visualizador
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}

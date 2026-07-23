import React, { useState, useEffect } from 'react';
import { MainLayout } from './components/layout/main-layout';
import { LoginPage } from './components/auth/login';
import { DashboardView } from './views/DashboardView';
import { TemplatesView } from './views/TemplatesView';
import { EmployeesView } from './views/EmployeesView';
import { FileExplorerView } from './views/FileExplorerView';
import { SettingsView } from './views/SettingsView';
import { TemplatePreview } from './components/TemplatePreview';
import { 
  Trash2,
  Eye,
  Building,
  X,
  RefreshCw,
  Camera,
  FileDown
} from 'lucide-react';

export interface TemplateField {
  id: string;
  type: 'text' | 'number' | 'date' | 'photo' | 'signature' | 'table' | 'dropdown' | 'textarea' | 'time' | 'datetime';
  label: string;
  tag?: string; // Variable en documento Word (ej: {{fecha}})
  placeholder?: string;
  required: boolean;
  columns?: string[]; // Para campos tipo tabla
  options?: string[]; // Para campos tipo dropdown
  category?: string; // Para agrupar por categoría
  hideInPdf?: boolean; // Para ocultar en PDF
}

export interface Template {
  id: string;
  name: string;
  description: string;
  descriptionStyles?: string;
  footer?: string;
  fields: TemplateField[];
  createdAt: string;
  storagePath?: string;
  assignedUsers?: any[];
  isQualityDocument?: boolean;
  qualityCode?: string;
  qualityVersion?: string;
  qualityDate?: string;
  isDocxTemplate?: boolean;
  docxFilePath?: string;
  docxOriginalName?: string;
}

const getFieldTagName = (field: TemplateField, allFields: TemplateField[]) => {
  if (field.tag) {
    return field.tag.replace(/[{}]/g, '').trim();
  }
  const hasDuplicate = allFields.some(
    f => f.id !== field.id && f.label.trim().toLowerCase() === field.label.trim().toLowerCase()
  );
  if (hasDuplicate) {
    return `${field.category || 'General'}: ${field.label}`;
  }
  return field.label;
};

const updateDescriptionTags = (
  oldFields: TemplateField[],
  newFields: TemplateField[],
  description: string
): string => {
  let newDescription = description || '';
  oldFields.forEach(oldField => {
    const newField = newFields.find(f => f.id === oldField.id);
    if (newField) {
      const oldTag = getFieldTagName(oldField, oldFields);
      const newTag = getFieldTagName(newField, newFields);
      if (oldTag !== newTag) {
        const escapedOldTag = oldTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`{{\\s*${escapedOldTag}\\s*}}`, 'gi');
        newDescription = newDescription.replace(regex, `{{${newTag}}}`);
      }
    }
  });
  return newDescription;
};

export function MarkdownRenderer({ text, data = {} }: { text: string, data?: Record<string, any> }) {
  if (!text) return null;

  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentBoxContent: React.ReactNode[] = [];
  let inBox = false;

  const renderTextContent = (textContent: string) => {
    const regex = /({{\s*[^}]+\s*}})/g;
    const parts = textContent.split(regex);
    
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
         const label = part.replace(/^{{\s*/, '').replace(/\s*}}$/, '');
         const value = data[label];
         if (value !== undefined) {
           if (typeof value === 'string' && (value.startsWith('data:image/') || value.startsWith('file://'))) {
             return <img key={i} src={value} alt={label} className="max-w-full h-auto rounded border border-border/40 block my-2" style={{ maxHeight: '200px' }} />;
           } else if (Array.isArray(value)) {
             if (value.length === 0) return <span key={i} className="italic text-muted-foreground block my-2">Tabla sin datos</span>;
             const cols = Object.keys(value[0]);
             return (
               <div key={i} className="overflow-x-auto my-2 border border-border/40 rounded-md bg-white">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-muted text-muted-foreground uppercase text-xs">
                     <tr>
                       {cols.map(c => <th key={c} className="px-4 py-2 border-b border-border/40">{c}</th>)}
                     </tr>
                   </thead>
                   <tbody>
                     {value.map((r: any, rIdx: number) => (
                       <tr key={rIdx} className="border-b border-border/20 last:border-0 hover:bg-muted/50">
                         {cols.map(c => <td key={c} className="px-4 py-2">{String(r[c] || '')}</td>)}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             );
           }
           return <span key={i} className="font-semibold text-primary">{String(value)}</span>;
         }
         return <span key={i} className="text-muted-foreground">{part}</span>;
      }

      const parseInline = (text: string) => {
        const tokens = [];
        let currentText = '';
        let b = false, it = false, s = false;
        for (let idx = 0; idx < text.length; idx++) {
          if (text.startsWith('**', idx)) {
            if (currentText) tokens.push({ text: currentText, b, it, s });
            currentText = '';
            b = !b;
            idx += 1;
          } else if (text.startsWith('_', idx)) {
            if (currentText) tokens.push({ text: currentText, b, it, s });
            currentText = '';
            it = !it;
          } else if (text.startsWith('~', idx)) {
            if (currentText) tokens.push({ text: currentText, b, it, s });
            currentText = '';
            s = !s;
          } else {
            currentText += text[idx];
          }
        }
        if (currentText) tokens.push({ text: currentText, b, it, s });
        return tokens.map((t, idx) => {
          let className = '';
          if (t.b) className += 'font-bold ';
          if (t.it) className += 'italic ';
          if (t.s) className += 'line-through ';
          if (!className) return <span key={idx}>{t.text}</span>;
          return <span key={idx} className={className}>{t.text}</span>;
        });
      };

      return <span key={`chunk-${i}`}>{parseInline(part)}</span>;
    });
  };

  lines.forEach((line, index) => {
    if (line.trim() === '/==') {
      inBox = true;
      return;
    }
    if (line.trim() === '==/') {
      inBox = false;
      blocks.push(
        <div key={`box-${index}`} className="border-2 border-foreground p-4 rounded-md my-4">
          {currentBoxContent}
        </div>
      );
      currentBoxContent = [];
      return;
    }

    let isH1 = false, isH2 = false, isH3 = false, isH4 = false;
    let align = 'text-justify';
    let textToRender = line.trim();

    const h1Match = textToRender.match(/\(\s*h1\s*\)(.*?)\(\s*\/h1\s*\)/i);
    if (h1Match) { isH1 = true; textToRender = textToRender.replace(h1Match[0], h1Match[1]).trim(); }
    const h2Match = textToRender.match(/\(\s*h2\s*\)(.*?)\(\s*\/h2\s*\)/i);
    if (h2Match) { isH2 = true; textToRender = textToRender.replace(h2Match[0], h2Match[1]).trim(); }
    const h3Match = textToRender.match(/\(\s*h3\s*\)(.*?)\(\s*\/h3\s*\)/i);
    if (h3Match) { isH3 = true; textToRender = textToRender.replace(h3Match[0], h3Match[1]).trim(); }
    const h4Match = textToRender.match(/\(\s*h4\s*\)(.*?)\(\s*\/h4\s*\)/i);
    if (h4Match) { isH4 = true; textToRender = textToRender.replace(h4Match[0], h4Match[1]).trim(); }

    const jMatch = textToRender.match(/\(\s*j\s*\)(.*?)\(\s*\/j\s*\)/i);
    if (jMatch) { align = 'text-justify'; textToRender = textToRender.replace(jMatch[0], jMatch[1]).trim(); }
    const rMatch = textToRender.match(/\(\s*r\s*\)(.*?)\(\s*\/r\s*\)/i);
    if (rMatch) { align = 'text-right'; textToRender = textToRender.replace(rMatch[0], rMatch[1]).trim(); }
    const lMatch = textToRender.match(/\(\s*l\s*\)(.*?)\(\s*\/l\s*\)/i);
    if (lMatch) { align = 'text-left'; textToRender = textToRender.replace(lMatch[0], lMatch[1]).trim(); }

    const content = renderTextContent(textToRender);

    let element;
    if (isH1) element = <h1 key={`line-${index}`} className={`text-2xl font-bold mt-3 mb-2 ${align}`}>{content}</h1>;
    else if (isH2) element = <h2 key={`line-${index}`} className={`text-xl font-bold mt-2 mb-1 ${align}`}>{content}</h2>;
    else if (isH3) element = <h3 key={`line-${index}`} className={`text-lg font-bold mt-2 mb-1 ${align}`}>{content}</h3>;
    else if (isH4) element = <h4 key={`line-${index}`} className={`text-base font-bold mt-1 mb-1 ${align}`}>{content}</h4>;
    else if (line.trim() === '') {
      element = <div key={`line-${index}`} className="h-4" />;
    } else {
      element = <div key={`line-${index}`} className={`mb-1 ${align}`}>{content}</div>;
    }

    if (inBox) {
      currentBoxContent.push(element);
    } else {
      blocks.push(element);
    }
  });

  if (currentBoxContent.length > 0) {
    blocks.push(
      <div key={`box-end`} className="border-2 border-foreground p-4 rounded-md my-4">
        {currentBoxContent}
      </div>
    );
  }

  return <div className="text-sm">{blocks}</div>;
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

    const handleUnauthorized = (e: any) => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      alert(e.detail?.message || 'Tu sesión ha expirado o el token es inválido. Por favor inicia sesión de nuevo.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
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
    logoUrl: null as string | null,
    pdfTitleColor: '#004F9F',
    pdfSubtitleColor: '#004F9F',
    pdfTitleFontSize: 16,
    pdfSubtitleFontSize: 12,
    pdfParagraphFontSize: 11,
    pdfLogoWidth: 100,
    pdfLogoHeight: 100
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

  // Creador de Plantillas (DocBuilder State)
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    name: '',
    description: '',
    storagePath: '',
    fields: [],
    assignedUsers: [],
    isQualityDocument: false,
    qualityCode: '',
    qualityVersion: '',
    qualityDate: ''
  });

  const [storagePathSearch, setStoragePathSearch] = useState('');
  const [isStoragePathOpen, setIsStoragePathOpen] = useState(false);

  useEffect(() => {
    if (newTemplate.storagePath !== undefined) {
      setStoragePathSearch(newTemplate.storagePath === '' ? 'Raíz (Directorio Principal)' : newTemplate.storagePath);
    } else {
      setStoragePathSearch('');
    }
  }, [newTemplate.storagePath]);

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [documentModal, setDocumentModal] = useState<any>(null);
  const [descriptionStyles, setDescriptionStyles] = useState('');
  const [activeEditorTab, setActiveEditorTab] = useState<'editor' | 'footer' | 'css' | 'preview'>('editor');

  // DOCX Model Template State
  const [isDocxTemplate, setIsDocxTemplate] = useState(false);
  const [docxFilePath, setDocxFilePath] = useState('');
  const [docxOriginalName, setDocxOriginalName] = useState('');
  const [docxHtmlPreview, setDocxHtmlPreview] = useState('');
  const [docxDetectedTags, setDocxDetectedTags] = useState<string[]>([]);
  const [isUploadingDocx, setIsUploadingDocx] = useState(false);



  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTemplate, setExportTemplate] = useState<any>(null);
  const [templateVersions, setTemplateVersions] = useState<any[]>([]);
  const [selectedExportVersion, setSelectedExportVersion] = useState<string>('');
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Template Preview Modal State
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Profile & Security Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', position: '' });
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityForm, setSecurityForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });



  const saveTemplate = async () => {
    if (!newTemplate.name) return;
    try {
      const { default: api } = await import('./utils/api');
      const payload = {
        name: newTemplate.name,
        description: newTemplate.description || '',
        descriptionStyles: descriptionStyles || '',
        footer: newTemplate.footer || '',
        storagePath: newTemplate.storagePath || 'Raíz',
        fields: newTemplate.fields || [],
        assignedUsers: newTemplate.assignedUsers?.map((u: any) => u.id) || [],
        isQualityDocument: newTemplate.isQualityDocument || false,
        qualityCode: newTemplate.qualityCode || '',
        qualityVersion: newTemplate.qualityVersion || '',
        qualityDate: newTemplate.qualityDate || '',
        isDocxTemplate: isDocxTemplate,
        docxFilePath: isDocxTemplate ? docxFilePath : null,
        docxOriginalName: isDocxTemplate ? docxOriginalName : null,
      };

      const resetDocxState = () => {
        setIsDocxTemplate(false);
        setDocxFilePath('');
        setDocxOriginalName('');
        setDocxHtmlPreview('');
        setDocxDetectedTags([]);
      };

      if (newTemplate.id) {
        const response = await api.put(`/templates/${newTemplate.id}`, payload);
        if (response.data.success) {
          setTemplates(prev => prev.map(t => t.id === newTemplate.id ? response.data.data : t));
          setNewTemplate({ name: '', description: '', footer: '', fields: [], storagePath: '', assignedUsers: [], isQualityDocument: false, qualityCode: '', qualityVersion: '', qualityDate: '' });
          setDescriptionStyles('');
          resetDocxState();
          alert('Plantilla actualizada con éxito.');
        }
      } else {
        const response = await api.post('/templates', payload);
        if (response.data.success) {
          setTemplates(prev => [...prev, response.data.data]);
          setNewTemplate({ name: '', description: '', footer: '', fields: [], storagePath: '', assignedUsers: [], isQualityDocument: false, qualityCode: '', qualityVersion: '', qualityDate: '' });
          setDescriptionStyles('');
          resetDocxState();
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

  const handleOpenExportModal = async (template: any) => {
    setExportTemplate(template);
    setIsExportModalOpen(true);
    setIsLoadingVersions(true);
    try {
      const { default: api } = await import('./utils/api');
      const response = await api.get(`/templates/${template.id}/versions`);
      if (response.data.success) {
        setTemplateVersions(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedExportVersion(response.data.data[0].version);
        }
      }
    } catch (err) {
      console.error("Error loading template versions:", err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleExportRecords = async () => {
    if (!exportTemplate || !selectedExportVersion) return;
    setIsExporting(true);
    try {
      const { default: api } = await import('./utils/api');
      const response = await api.get(`/templates/${exportTemplate.id}/export`, {
        params: { version: selectedExportVersion },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `registros_${exportTemplate.name.replace(/\s+/g, '_')}_${selectedExportVersion}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExportModalOpen(false);
    } catch (err) {
      console.error("Error exporting template records:", err);
      alert("Error al exportar los registros de la plantilla.");
    } finally {
      setIsExporting(false);
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
      
      {currentTab === 'dashboard' && (
        <DashboardView
          signedDocuments={signedDocuments}
          employees={employees}
          templates={templates}
          onRefresh={fetchData}
          isRefreshing={isRefreshing}
          onSelectTab={setCurrentTab}
          onViewDocument={(doc) => setDocumentModal(doc)}
        />
      )}

      {currentTab === 'templates' && (
        <TemplatesView
          newTemplate={newTemplate}
          setNewTemplate={setNewTemplate}
          isDocxTemplate={isDocxTemplate}
          setIsDocxTemplate={setIsDocxTemplate}
          docxFilePath={docxFilePath}
          setDocxFilePath={setDocxFilePath}
          docxOriginalName={docxOriginalName}
          setDocxOriginalName={setDocxOriginalName}
          docxHtmlPreview={docxHtmlPreview}
          setDocxHtmlPreview={setDocxHtmlPreview}
          docxDetectedTags={docxDetectedTags}
          setDocxDetectedTags={setDocxDetectedTags}
          isUploadingDocx={isUploadingDocx}
          setIsUploadingDocx={setIsUploadingDocx}
          descriptionStyles={descriptionStyles}
          setDescriptionStyles={setDescriptionStyles}
          activeEditorTab={activeEditorTab}
          setActiveEditorTab={setActiveEditorTab}
          storagePathSearch={storagePathSearch}
          setStoragePathSearch={setStoragePathSearch}
          isStoragePathOpen={isStoragePathOpen}
          setIsStoragePathOpen={setIsStoragePathOpen}
          editingFieldId={editingFieldId}
          setEditingFieldId={setEditingFieldId}
          templates={templates}
          employees={employees}
          folders={folders}
          onRefresh={fetchData}
          isRefreshing={isRefreshing}
          onSaveTemplate={saveTemplate}
          onDeleteTemplate={async (t) => {
            setTemplateToDelete(t);
            setIsTemplateModalOpen(true);
          }}
          onExportTemplate={handleOpenExportModal}
          getFieldTagName={getFieldTagName}
          updateDescriptionTags={updateDescriptionTags}
        />
      )}
      {(currentTab === 'explorer' || currentTab === 'documents') && (
        <FileExplorerView
          currentTab={currentTab}
          templates={templates}
          signedDocuments={signedDocuments}
          folders={folders}
          onRefresh={fetchData}
          isRefreshing={isRefreshing}
          onViewDocument={(doc) => setDocumentModal(doc)}
        />
      )}

      {(currentTab === 'users' || currentTab === 'admins' || currentTab === 'senders') && (
        <EmployeesView
          currentTab={currentTab}
          employees={employees}
          senders={senders}
          onRefresh={fetchData}
          isRefreshing={isRefreshing}
          onSaveUser={async (userData) => {
            const { default: api } = await import('./utils/api');
            if (userData.id) {
              await api.put(`/employees/${userData.id}`, userData);
            } else {
              await api.post('/employees', userData);
            }
            await fetchData();
          }}
          onDeleteUser={async (userId) => {
            const { default: api } = await import('./utils/api');
            await api.delete(`/employees/${userId}`);
            await fetchData();
          }}
        />
      )}

      {currentTab === 'settings' && (
        <SettingsView
          companySettings={companySettings}
          setCompanySettings={setCompanySettings}
        />
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

      {/* Modal para Exportar Registros de Plantilla */}
      {isExportModalOpen && exportTemplate && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">Exportar Registros</h3>
                  <p className="text-xs text-muted-foreground">
                    Plantilla: <strong className="text-foreground">{exportTemplate.name}</strong>
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsExportModalOpen(false);
                    setExportTemplate(null);
                    setTemplateVersions([]);
                  }}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {isLoadingVersions ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Cargando versiones disponibles...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Seleccione la versión del formulario</label>
                    {templateVersions.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No se encontraron versiones.</p>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {templateVersions.map((v) => {
                          const isSelected = selectedExportVersion === v.version;
                          return (
                            <button
                              key={v.version}
                              type="button"
                              onClick={() => setSelectedExportVersion(v.version)}
                              className={`w-full text-left p-3 rounded-lg border text-xs flex justify-between items-center transition-all ${
                                isSelected 
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                                  : 'border-border hover:border-muted-foreground/35 hover:bg-muted/10'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <span className="font-semibold text-foreground">
                                  {v.version === 'Sin versión' ? 'Sin versión (v0)' : `Versión: ${v.version}`}
                                </span>
                                <span className="block text-[10px] text-muted-foreground">
                                  Último uso: {new Date(v.lastUsed).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className={`inline-block px-2 py-0.5 rounded-full font-medium text-[10px] ${
                                  v.documentCount > 0 
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-muted text-muted-foreground border border-border'
                                }`}>
                                  {v.documentCount} {v.documentCount === 1 ? 'registro' : 'registros'}
                                </span>
                                <span className="block text-[9px] text-muted-foreground mt-0.5">
                                  {v.fieldsCount} campos
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-muted/30 flex gap-3 justify-end">
              <button 
                onClick={() => {
                  setIsExportModalOpen(false);
                  setExportTemplate(null);
                  setTemplateVersions([]);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleExportRecords}
                disabled={isLoadingVersions || isExporting || templateVersions.length === 0}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <FileDown className="h-3 w-3" />
                    Exportar Registros (Excel)
                  </>
                )}
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
                <div className="max-h-[300px] overflow-y-auto">
                  <TemplatePreview
                    body={previewTemplate.description || '<p style="color:#9ca3af">Sin descripción</p>'}
                    styles={(previewTemplate as any).descriptionStyles || ''}
                    className="!shadow-none [&>div]:!px-4 [&>div]:!py-4 [&>div]:!rounded-none"
                  />
                </div>
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

                        {field.type === 'time' && (
                          <input type="time" disabled className="w-full text-xs p-2 rounded border border-border bg-muted/10 opacity-70 cursor-not-allowed" />
                        )}

                        {field.type === 'datetime' && (
                          <input type="datetime-local" disabled className="w-full text-xs p-2 rounded border border-border bg-muted/10 opacity-70 cursor-not-allowed" />
                        )}

                        {field.type === 'textarea' && (
                          <textarea placeholder="Área de texto enriquecido (Negrita, alineación)..." disabled className="w-full text-xs p-2 rounded border border-border bg-muted/10 opacity-70 cursor-not-allowed min-h-[60px]" />
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

                const mappedData: Record<string, any> = {};
                const fields = documentModal.template?.fields || [];
                
                Object.keys(documentModal.data || {}).forEach(key => {
                  const fieldDef = fields.find((f: any) => f.id === key);
                  if (fieldDef && fieldDef.label) {
                    let val = documentModal.data[key];
                    if (fieldDef.type === 'select') {
                      const option = fieldDef.options?.find((o: any) => String(o.id) === String(val) || String(o.value) === String(val));
                      if (option) val = option.label || option.value;
                    }
                    mappedData[fieldDef.label] = val;
                    mappedData[getFieldTagName(fieldDef, fields)] = val;
                  }
                });

                return (
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <TemplatePreview
                      body={description}
                      styles={(documentModal.template as any)?.descriptionStyles || ''}
                      data={mappedData}
                      className="!shadow-none [&>div]:!px-4 [&>div]:!py-4 [&>div]:!rounded-none [&>div]:!bg-transparent"
                    />
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

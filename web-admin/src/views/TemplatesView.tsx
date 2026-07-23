import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileCode,
  FileUp,
  Loader2,
  Eye,
  CheckCircle,
  FileDown,
  Pencil,
  Layout,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { TemplatePreview } from '../components/TemplatePreview';
import { RichTextEditor } from '../components/RichTextEditor';
import type { RichTextEditorRef } from '../components/RichTextEditor';
import type { TemplateField, Template } from '../App';

interface FieldEditorFormProps {
  editingField: TemplateField | null;
  isDocxTemplate: boolean;
  onSaveField: (fieldData: {
    type: any;
    label: string;
    tag?: string;
    required: boolean;
    hideInPdf: boolean;
    category: string;
    columns?: string[];
    options?: string[];
  }) => void;
  onCancelEdit: () => void;
}

function FieldEditorForm({ editingField, isDocxTemplate, onSaveField, onCancelEdit }: FieldEditorFormProps) {
  const [category, setCategory] = useState('General');
  const [label, setLabel] = useState('');
  const [tag, setTag] = useState('');
  const [type, setType] = useState<TemplateField['type']>('text');
  const [required, setRequired] = useState(true);
  const [hideInPdf, setHideInPdf] = useState(false);
  const [tableCols, setTableCols] = useState('');
  const [dropdownOptions, setDropdownOptions] = useState('');

  React.useEffect(() => {
    if (editingField) {
      setCategory(editingField.category || 'General');
      setLabel(editingField.label || '');
      setTag(editingField.tag || '');
      setType(editingField.type || 'text');
      setRequired(editingField.required ?? true);
      setHideInPdf(editingField.hideInPdf || false);
      setTableCols(editingField.columns ? editingField.columns.join(', ') : '');
      setDropdownOptions(editingField.options ? editingField.options.join(', ') : '');
    } else {
      setLabel('');
      setTag('');
      setTableCols('');
      setDropdownOptions('');
      setHideInPdf(false);
    }
  }, [editingField]);

  const handleSubmit = () => {
    if (!label.trim()) return;
    const cleanTag = tag.trim().replace(/[{}]/g, '');
    onSaveField({
      type,
      label: label.trim(),
      tag: cleanTag || undefined,
      required,
      hideInPdf,
      category: category.trim() || 'General',
      columns: type === 'table' ? tableCols.split(',').map((c) => c.trim()).filter(Boolean) : undefined,
      options: type === 'dropdown' ? dropdownOptions.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
    });

    if (!editingField) {
      setLabel('');
      setTag('');
      setTableCols('');
      setDropdownOptions('');
      setHideInPdf(false);
    }
  };

  return (
    <div className="bg-card p-5 rounded-xl border border-border space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          {editingField ? 'Editar Campo del Documento' : 'Añadir Campo al Documento'}
        </h4>
        {editingField && (
          <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
            Modificando Campo
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Columna Izquierda: Identificación */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Categoría del Campo</label>
            <input
              type="text"
              list="field-categories"
              placeholder="Ej. Datos del paciente"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
            <datalist id="field-categories">
              <option value="General" />
              <option value="Datos del paciente" />
              <option value="Información Clínica" />
              <option value="Firmas" />
            </datalist>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">
              Etiqueta / Pregunta <span className="text-muted-foreground font-normal text-[10px]">(Visible en App Móvil)</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Coloca la fecha de diligenciamiento"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">
              Variable Word <span className="text-primary font-mono text-[10px]">(Tag en documento)</span>
            </label>
            <input
              type="text"
              placeholder="Ej. fecha (corresponde a {{fecha}})"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono text-primary font-medium"
            />
          </div>
        </div>

        {/* Columna Derecha: Configuración del Input */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Tipo de Entrada (Input)</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="text">Texto Corto</option>
              <option value="number">Número</option>
              <option value="date">Fecha (DD/MM/AAAA)</option>
              <option value="time">Hora (HH:MM)</option>
              <option value="datetime">Fecha y Hora</option>
              <option value="textarea">Área de Texto (Enriquecido)</option>
              <option value="photo">Fotografía (Cámara)</option>
              <option value="signature">Firma Táctil</option>
              <option value="table">Tabla de Contenidos</option>
              <option value="dropdown">Lista Desplegable (Dropdown)</option>
            </select>
          </div>

          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-semibold text-foreground">Restricciones y Opciones</label>
            <div className="flex flex-col gap-2 bg-muted/20 p-3 rounded-lg border border-border/80">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="req"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
                <label htmlFor="req" className="ml-2 text-xs text-foreground cursor-pointer select-none font-medium">
                  ¿Campo Obligatorio?
                </label>
              </div>
              {!isDocxTemplate && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hidePdf"
                    checked={hideInPdf}
                    onChange={(e) => setHideInPdf(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="hidePdf" className="ml-2 text-xs text-muted-foreground cursor-pointer select-none" title="Si se marca, este dato no se listará en la parte inferior del PDF">
                    Ocultar datos en PDF final
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {type === 'table' && (
        <div className="space-y-1 animate-in fade-in duration-200 pt-2 border-t border-border/60">
          <label className="text-[11px] font-semibold text-foreground">Columnas de la Tabla (Separadas por comas)</label>
          <input
            type="text"
            placeholder="Ej. Nombre del Insumo, Cantidad Entregada, Observación"
            value={tableCols}
            onChange={(e) => setTableCols(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      )}

      {type === 'dropdown' && (
        <div className="space-y-1 animate-in fade-in duration-200 pt-2 border-t border-border/60">
          <label className="text-[11px] font-semibold text-foreground">Opciones (Separadas por comas)</label>
          <input
            type="text"
            placeholder="Ej. Opción 1, Opción 2, Opción 3"
            value={dropdownOptions}
            onChange={(e) => setDropdownOptions(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <button
          onClick={handleSubmit}
          className="bg-primary text-white text-xs px-5 py-2.5 rounded-lg hover:bg-primary/95 transition-all flex items-center gap-2 font-semibold shadow-xs cursor-pointer"
        >
          {editingField ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editingField ? 'Guardar Cambios del Campo' : 'Agregar Campo al Formulario'}
        </button>
        {editingField && (
          <button
            onClick={onCancelEdit}
            className="bg-muted text-muted-foreground text-xs px-4 py-2.5 rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

interface TemplatesViewProps {
  newTemplate: Partial<Template>;
  setNewTemplate: React.Dispatch<React.SetStateAction<Partial<Template>>>;
  isDocxTemplate: boolean;
  setIsDocxTemplate: (val: boolean) => void;
  docxFilePath: string;
  setDocxFilePath: (path: string) => void;
  docxOriginalName: string;
  setDocxOriginalName: (name: string) => void;
  docxHtmlPreview: string;
  setDocxHtmlPreview: (preview: string) => void;
  docxDetectedTags: string[];
  setDocxDetectedTags: (tags: string[]) => void;
  isUploadingDocx: boolean;
  setIsUploadingDocx: (val: boolean) => void;
  descriptionStyles: string;
  setDescriptionStyles: (styles: string) => void;
  activeEditorTab: 'editor' | 'footer' | 'css' | 'preview';
  setActiveEditorTab: (tab: 'editor' | 'footer' | 'css' | 'preview') => void;
  storagePathSearch: string;
  setStoragePathSearch: (val: string) => void;
  isStoragePathOpen: boolean;
  setIsStoragePathOpen: (val: boolean) => void;
  editingFieldId: string | null;
  setEditingFieldId: (id: string | null) => void;
  templates: Template[];
  employees: any[];
  folders: any[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onSaveTemplate: () => Promise<void>;
  onDeleteTemplate: (template: Template) => Promise<void>;
  onExportTemplate: (template: Template) => void;
  getFieldTagName: (field: TemplateField, fieldsList: TemplateField[]) => string;
  updateDescriptionTags: (oldFields: TemplateField[], newFields: TemplateField[], htmlContent: string) => string;
}

export function TemplatesView({
  newTemplate,
  setNewTemplate,
  isDocxTemplate,
  setIsDocxTemplate,
  docxFilePath: _docxFilePath,
  setDocxFilePath,
  docxOriginalName,
  setDocxOriginalName,
  docxHtmlPreview,
  setDocxHtmlPreview,
  docxDetectedTags,
  setDocxDetectedTags,
  isUploadingDocx,
  setIsUploadingDocx,
  descriptionStyles,
  setDescriptionStyles,
  activeEditorTab,
  setActiveEditorTab,
  storagePathSearch,
  setStoragePathSearch,
  isStoragePathOpen,
  setIsStoragePathOpen,
  editingFieldId,
  setEditingFieldId,
  templates,
  employees,
  folders,
  onRefresh,
  isRefreshing,
  onSaveTemplate,
  onDeleteTemplate,
  onExportTemplate,
  getFieldTagName,
  updateDescriptionTags,
}: TemplatesViewProps) {
  const richEditorRef = React.useRef<RichTextEditorRef>(null);
  const richFooterRef = React.useRef<RichTextEditorRef>(null);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [templateCurrentPage, setTemplateCurrentPage] = useState(1);
  const [_activeMenuId, _setActiveMenuId] = useState<string | null>(null);
  const templatesPerPage = 9;

  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDocx(true);
    try {
      const formData = new FormData();
      formData.append('docxFile', file);
      const { default: api } = await import('../utils/api');
      const res = await api.post('/templates/upload-docx', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const responseData = res.data.data || res.data;
      setDocxFilePath(responseData.docxFilePath || responseData.filePath || '');
      setDocxOriginalName(responseData.docxOriginalName || responseData.originalName || '');
      setDocxHtmlPreview(responseData.htmlPreview || '');
      setDocxDetectedTags(responseData.detectedTags || []);
      setNewTemplate((prev) => ({
        ...prev,
        description: responseData.htmlPreview || '',
      }));
    } catch (err: any) {
      alert('Error subiendo plantilla Word (.docx): ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploadingDocx(false);
    }
  };

  const handleImportTagsAsFields = () => {
    if (!docxDetectedTags.length) return;
    const existingFields = newTemplate.fields || [];
    const existingTags = new Set(existingFields.map((f) => f.tag || f.id));
    const newFieldsToCreate: TemplateField[] = [];

    docxDetectedTags.forEach((t) => {
      if (!existingTags.has(t)) {
        newFieldsToCreate.push({
          id: t,
          label: t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, ' '),
          tag: t,
          type: 'text',
          required: true,
          category: 'General',
        });
      }
    });

    if (newFieldsToCreate.length === 0) {
      alert('Todas las variables ya han sido importadas al formulario.');
      return;
    }

    setNewTemplate((prev) => ({
      ...prev,
      fields: [...(prev.fields || []), ...newFieldsToCreate],
    }));
  };

  const handleSaveFieldFromForm = (fieldData: any) => {
    const oldFields = newTemplate.fields || [];
    let updatedFields: TemplateField[] = [];

    if (editingFieldId) {
      updatedFields = oldFields.map((f) => (f.id === editingFieldId ? { ...f, ...fieldData } : f));
      setEditingFieldId(null);
    } else {
      updatedFields = [...oldFields, { id: fieldData.tag || Math.random().toString(36).substr(2, 9), ...fieldData }];
    }

    const newDescription = updateDescriptionTags(oldFields, updatedFields, newTemplate.description || '');
    const newStyles = updateDescriptionTags(oldFields, updatedFields, descriptionStyles || '');

    setNewTemplate((prev) => ({
      ...prev,
      fields: updatedFields,
      description: newDescription,
      descriptionStyles: newStyles,
    }));
  };

  const editField = (field: TemplateField) => {
    setEditingFieldId(field.id);
  };

  const filteredTemplates = useMemo(() => {
    if (!templateSearchTerm.trim()) return templates;
    const term = templateSearchTerm.toLowerCase();
    return templates.filter(
      (t) => (t.name || '').toLowerCase().includes(term) || (t.storagePath || '').toLowerCase().includes(term)
    );
  }, [templates, templateSearchTerm]);

  const totalTemplatePages = Math.ceil(filteredTemplates.length / templatesPerPage) || 1;
  const currentTemplates = useMemo(() => {
    return filteredTemplates.slice(
      (templateCurrentPage - 1) * templatesPerPage,
      templateCurrentPage * templatesPerPage
    );
  }, [filteredTemplates, templateCurrentPage, templatesPerPage]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">DocBuilder - Creador de Plantillas</h1>
          <p className="text-muted-foreground">Diseña formularios dinámicos que tus trabajadores diligenciarán en las tablets.</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-border shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          {isRefreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Editor Canvas */}
        <div className="xl:col-span-3 bg-card border border-border rounded-lg shadow-xs p-6 space-y-6">
          <h3 className="font-semibold text-foreground border-b border-border pb-3">Detalles de la Plantilla</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nombre de la Plantilla</label>
              <input
                type="text"
                placeholder="Ej. Acta de Entrega de Computadores"
                value={newTemplate.name || ''}
                onChange={(e) => setNewTemplate((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Ruta de Almacenamiento (Servidor)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar o escribir ruta..."
                  value={storagePathSearch}
                  onFocus={() => {
                    setIsStoragePathOpen(true);
                    setStoragePathSearch('');
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setIsStoragePathOpen(false);
                      setStoragePathSearch(newTemplate.storagePath === '' ? 'Raíz (Directorio Principal)' : newTemplate.storagePath || '');
                    }, 150);
                  }}
                  onChange={(e) => {
                    setStoragePathSearch(e.target.value);
                    setNewTemplate((prev) => ({ ...prev, storagePath: e.target.value }));
                  }}
                  className="w-full text-xs p-2.5 pr-8 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <Search className="h-4 w-4" />
                </div>

                {isStoragePathOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-lg z-50 py-1 animate-in fade-in duration-150">
                    <div
                      onMouseDown={() => {
                        setNewTemplate((prev) => ({ ...prev, storagePath: '' }));
                        setStoragePathSearch('Raíz (Directorio Principal)');
                        setIsStoragePathOpen(false);
                      }}
                      className={`px-3 py-2 text-xs cursor-pointer transition-colors hover:bg-muted flex items-center gap-2 ${
                        newTemplate.storagePath === '' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                      }`}
                    >
                      🏠 Raíz (Directorio Principal)
                    </div>
                    {folders
                      .filter((folder: any) => folder.path && folder.path.toLowerCase().includes((storagePathSearch || '').toLowerCase()))
                      .map((folder: any) => (
                        <div
                          key={folder.id || folder.path}
                          onMouseDown={() => {
                            setNewTemplate((prev) => ({ ...prev, storagePath: folder.path }));
                            setStoragePathSearch(folder.path);
                            setIsStoragePathOpen(false);
                          }}
                          className={`px-3 py-2 text-xs cursor-pointer transition-colors hover:bg-muted flex items-center gap-2 ${
                            newTemplate.storagePath === folder.path ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                          }`}
                        >
                          📁 {folder.path}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modalidad de Plantilla */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-semibold text-foreground">Tipo de Constructor</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsDocxTemplate(false)}
                className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${
                  !isDocxTemplate
                    ? 'border-primary bg-primary/5 text-foreground font-semibold shadow-xs'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <FileCode className={`h-5 w-5 ${!isDocxTemplate ? 'text-primary' : ''}`} />
                <div>
                  <div className="text-xs font-bold">DocBuilder HTML / PDF</div>
                  <div className="text-[10px] font-normal opacity-80">Diseño directo con editor rico y firmas</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsDocxTemplate(true)}
                className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${
                  isDocxTemplate
                    ? 'border-primary bg-primary/5 text-foreground font-semibold shadow-xs'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <FileUp className={`h-5 w-5 ${isDocxTemplate ? 'text-primary' : ''}`} />
                <div>
                  <div className="text-xs font-bold">Modelo Precargado (.docx Importado)</div>
                  <div className="text-[10px] font-normal opacity-80">Rellena plantilla de Microsoft Word</div>
                </div>
              </button>
            </div>
          </div>

          {/* Carga de archivo .docx si está en modo Word */}
          {isDocxTemplate && (
            <div className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
              <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                <FileUp className="h-4 w-4 text-primary" />
                Seleccionar Plantilla de Word (.docx)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleDocxUpload}
                  disabled={isUploadingDocx}
                  className="text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer disabled:opacity-50"
                />
                {isUploadingDocx && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              </div>

              {docxOriginalName && (
                <div className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5 pt-1">
                  <CheckCircle className="h-4 w-4" />
                  Archivo subido: {docxOriginalName}
                </div>
              )}

              {docxDetectedTags.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Se detectaron <strong>{docxDetectedTags.length}</strong> variables en el documento:
                    </span>
                    <button
                      type="button"
                      onClick={handleImportTagsAsFields}
                      className="text-[11px] bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 rounded font-medium transition-colors"
                    >
                      Importar variables como campos
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {docxDetectedTags.map((tag) => (
                      <span key={tag} className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md">
                        {`{{${tag}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Opciones de Encabezado de Calidad y Contenido del Documento (HTML / PDF) */}
          {!isDocxTemplate && (
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Tipo de Encabezado</label>
                  <select
                    value={newTemplate.isQualityDocument ? 'calidad' : 'libre'}
                    onChange={(e) => setNewTemplate((prev) => ({ ...prev, isQualityDocument: e.target.value === 'calidad' }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                  >
                    <option value="libre">Libre</option>
                    <option value="calidad">Aprobado por Calidad</option>
                  </select>
                </div>
              </div>

              {newTemplate.isQualityDocument && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-lg border border-border">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Código</label>
                    <input
                      type="text"
                      placeholder="Ej. REG-01"
                      value={newTemplate.qualityCode || ''}
                      onChange={(e) => setNewTemplate((prev) => ({ ...prev, qualityCode: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Versión</label>
                    <input
                      type="text"
                      placeholder="Ej. 01"
                      value={newTemplate.qualityVersion || ''}
                      onChange={(e) => setNewTemplate((prev) => ({ ...prev, qualityVersion: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Fecha</label>
                    <input
                      type="text"
                      placeholder="Ej. 01/01/2022"
                      value={newTemplate.qualityDate || ''}
                      onChange={(e) => setNewTemplate((prev) => ({ ...prev, qualityDate: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Contenido del Documento</label>
                <p className="text-[10px] text-muted-foreground">Edita visualmente o ajusta los estilos CSS y previsualiza el resultado</p>

                {/* Tabs: Editor | Pie de Página | Estilos CSS | Vista Previa */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="flex border-b border-border bg-muted/30">
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('editor')}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        activeEditorTab === 'editor'
                          ? 'bg-card text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Contenido
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('footer')}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        activeEditorTab === 'footer'
                          ? 'bg-card text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Layout className="h-3.5 w-3.5" />
                      Pie de página
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('css')}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        activeEditorTab === 'css'
                          ? 'bg-card text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <FileCode className="h-3.5 w-3.5" />
                      Estilos CSS
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('preview')}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        activeEditorTab === 'preview'
                          ? 'bg-card text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Vista Previa
                    </button>
                  </div>

                  <div className="bg-card">
                    {activeEditorTab === 'editor' && (
                      <RichTextEditor
                        ref={richEditorRef}
                        value={newTemplate.description || ''}
                        onChange={(html) => setNewTemplate((prev) => ({ ...prev, description: html }))}
                        placeholder="Escribe el contenido del documento..."
                        fieldLabels={(newTemplate.fields || []).map((f) => getFieldTagName(f, newTemplate.fields || []))}
                      />
                    )}

                    {activeEditorTab === 'footer' && (
                      <RichTextEditor
                        ref={richFooterRef}
                        value={newTemplate.footer || ''}
                        onChange={(html) => setNewTemplate((prev) => ({ ...prev, footer: html }))}
                        placeholder="Escribe el contenido del pie de página (se repetirá en todas las hojas)..."
                        fieldLabels={(newTemplate.fields || []).map((f) => getFieldTagName(f, newTemplate.fields || []))}
                      />
                    )}

                    {activeEditorTab === 'css' && (
                      <div className="p-4 space-y-2">
                        <textarea
                          value={descriptionStyles}
                          onChange={(e) => setDescriptionStyles(e.target.value)}
                          placeholder=".template-preview-content h1 { color: #1d4ed8; }\n.template-preview-content p { line-height: 1.8; }"
                          className="w-full text-xs p-3 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none min-h-[360px] resize-y font-mono"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          CSS aplicado al renderizar el documento. Usa selectores dentro de{' '}
                          <code className="font-mono bg-muted px-1 rounded">.template-preview-content</code>.
                        </p>
                      </div>
                    )}

                    {activeEditorTab === 'preview' && (
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <TemplatePreview
                          body={newTemplate.description || ''}
                          styles={descriptionStyles}
                          footer={newTemplate.footer || ''}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulario de Adición / Edición de Campos */}
          <FieldEditorForm
            editingField={(newTemplate.fields || []).find((f) => f.id === editingFieldId) || null}
            isDocxTemplate={isDocxTemplate}
            onSaveField={handleSaveFieldFromForm}
            onCancelEdit={() => setEditingFieldId(null)}
          />

          {/* Lista de campos agregados */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground">Variables del Documento</h4>
            {(!newTemplate.fields || newTemplate.fields.length === 0) ? (
              <p className="text-xs text-muted-foreground italic bg-muted/10 p-4 rounded border border-border text-center">
                No has agregado ningún campo todavía.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(newTemplate.fields || []).map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-primary font-bold">{`{{${field.tag || field.id}}}`}</span>
                      <span className="text-muted-foreground text-[11px]">({field.type})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => editField(field)}
                        className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-muted"
                        title="Editar Campo"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const updated = (newTemplate.fields || []).filter((f) => f.id !== field.id);
                          setNewTemplate((prev) => ({ ...prev, fields: updated }));
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-muted"
                        title="Eliminar Campo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Asignación de Empleados */}
          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-foreground">Empleados Asignados</label>
              <span className="text-[10px] text-primary font-semibold bg-primary/10 px-2.5 py-0.5 rounded-full">
                {newTemplate.assignedUsers?.length || 0} seleccionados
              </span>
            </div>
            <div className="w-full text-xs p-3 rounded-lg border border-border bg-background max-h-48 overflow-y-auto space-y-1">
              {employees.length === 0 ? (
                <p className="text-xs text-muted-foreground italic p-2 text-center">No hay empleados registrados para asignar.</p>
              ) : (
                employees.map((emp: any) => {
                  const isSelected = (newTemplate.assignedUsers || []).some((u: any) => u.id === emp.id);
                  return (
                    <label
                      key={emp.id}
                      className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                        isSelected ? 'border-primary/50 bg-primary/5 font-medium text-foreground' : 'border-transparent hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                          checked={isSelected}
                          onChange={(e) => {
                            const current = newTemplate.assignedUsers || [];
                            if (e.target.checked) {
                              setNewTemplate((prev) => ({ ...prev, assignedUsers: [...current, { id: emp.id, name: emp.name }] }));
                            } else {
                              setNewTemplate((prev) => ({ ...prev, assignedUsers: current.filter((u: any) => u.id !== emp.id) }));
                            }
                          }}
                        />
                        <span className="text-xs font-medium">{emp.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">
                        {emp.role || emp.documentId || 'Empleado'}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              onClick={onSaveTemplate}
              className="bg-primary text-white text-xs px-6 py-2.5 rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-2 font-semibold shadow-xs cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              {newTemplate.id ? 'Guardar Cambios de Plantilla' : 'Crear Plantilla'}
            </button>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 shadow-xs space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Vista Previa en Vivo
            </h3>
            {isDocxTemplate ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  Previsualización del texto extraído de la plantilla Microsoft Word (`.docx`):
                </p>
                <div className="max-h-[380px] overflow-y-auto p-4 bg-muted/20 border border-border rounded-lg text-xs leading-relaxed font-sans text-foreground">
                  {docxHtmlPreview ? (
                    <div dangerouslySetInnerHTML={{ __html: docxHtmlPreview }} />
                  ) : (
                    <span className="italic text-muted-foreground">Sube un archivo .docx para previsualizar su contenido aquí.</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  Previsualización del documento final (HTML / PDF):
                </p>
                <div className="max-h-[420px] overflow-y-auto p-4 bg-muted/20 border border-border rounded-lg">
                  <TemplatePreview
                    body={newTemplate.description || ''}
                    styles={descriptionStyles}
                    footer={newTemplate.footer || ''}
                  />
                </div>
              </div>
            )}

            {/* Vista Previa del Formulario en App Móvil */}
            {newTemplate.fields && newTemplate.fields.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Vista Previa del Formulario en App Móvil
                  </span>
                  <span className="text-[10px] text-muted-foreground">Muestra los Labels al Diligenciador</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 max-h-[320px] overflow-y-auto p-2 bg-muted/10 border border-border rounded-lg">
                  {newTemplate.fields.map((f, i) => (
                    <div key={f.id || i} className="p-3 bg-card rounded-lg border border-border space-y-1.5 text-xs shadow-2xs">
                      <div className="flex justify-between items-center font-semibold text-foreground">
                        <span className="truncate pr-2">{f.label}</span>
                        <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full shrink-0">
                          {`{{${f.tag || f.id}}}`}
                        </span>
                      </div>
                      <div className="p-2 bg-muted/30 border border-border/50 rounded text-[11px] text-muted-foreground flex justify-between items-center">
                        <span className="capitalize font-mono">{f.type}</span>
                        {f.required && <span className="text-red-500 font-semibold text-[10px]">* Requerido</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Plantillas Creadas */}
      <div className="bg-card border border-border rounded-lg shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h3 className="font-semibold text-foreground">Plantillas Existentes ({templates.length})</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar plantilla..."
              value={templateSearchTerm}
              onChange={(e) => {
                setTemplateSearchTerm(e.target.value);
                setTemplateCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentTemplates.map((t) => (
            <div key={t.id} className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-foreground">{t.name}</h4>
                  <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full shrink-0">
                    {t.fields?.length || 0} campos
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.storagePath || 'Raíz'}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60">
                <span className="text-[11px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onExportTemplate(t)}
                    className="p-1.5 rounded hover:bg-muted text-emerald-600 dark:text-emerald-400"
                    title="Exportar Registros"
                  >
                    <FileDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setNewTemplate({
                        id: t.id,
                        name: t.name,
                        description: t.description,
                        footer: (t as any).footer || '',
                        storagePath: t.storagePath,
                        fields: t.fields || [],
                        assignedUsers: t.assignedUsers || [],
                        isQualityDocument: t.isQualityDocument || false,
                        qualityCode: t.qualityCode || '',
                        qualityVersion: t.qualityVersion || '',
                        qualityDate: t.qualityDate || '',
                      });
                      setIsDocxTemplate(!!(t as any).isDocxTemplate);
                      setDocxFilePath((t as any).docxFilePath || '');
                      setDocxOriginalName((t as any).docxOriginalName || '');
                      setDocxHtmlPreview((t as any).description || '');
                      setDocxDetectedTags([]);
                      setDescriptionStyles((t as any).descriptionStyles || '');
                      setActiveEditorTab('editor');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-1.5 rounded hover:bg-muted text-primary"
                    title="Editar Plantilla"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteTemplate(t)}
                    className="p-1.5 rounded hover:bg-muted text-destructive"
                    title="Eliminar Plantilla"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalTemplatePages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-4 mt-4 text-xs">
            <span className="text-muted-foreground">
              Página {templateCurrentPage} de {totalTemplatePages} (Total: {filteredTemplates.length} plantillas)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setTemplateCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={templateCurrentPage === 1}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTemplateCurrentPage((prev) => Math.min(prev + 1, totalTemplatePages))}
                disabled={templateCurrentPage === totalTemplatePages}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

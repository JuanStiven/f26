import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FolderPlus, 
  FilePlus, 
  FileText, 
  FileCode, 
  Trash2, 
  Edit2, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Move, 
  Plus, 
  X, 
  Download, 
  Check,
  ChevronLeft,
  RefreshCw
} from 'lucide-react';

function getFieldTagName(field: any, allFields: any[]) {
  const hasDuplicate = allFields.some(
    (f: any) => f.id !== field.id && f.label.trim().toLowerCase() === field.label.trim().toLowerCase()
  );
  if (hasDuplicate) {
    return `${field.category || 'General'}: ${field.label}`;
  }
  return field.label;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  fileType?: 'template' | 'document';
  size?: string;
  createdAt: string;
  author?: string;
  fields?: any[];
  content?: string;
  rawDoc?: any;
}

interface FileExplorerProps {
  templates: any[];
  signedDocuments: any[];
  folders: any[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function FileExplorer({ templates, signedDocuments, folders, onRefresh, isRefreshing }: FileExplorerProps) {
  // Estado de los nodos
  const [nodes, setNodes] = useState<FileNode[]>([]);
  const [contentModalNode, setContentModalNode] = useState<FileNode | null>(null);
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);

  React.useEffect(() => {
    // Map backend folders to FileNode format
    const baseNodes: FileNode[] = folders.map(f => ({
      id: f.id,
      name: f.name,
      type: 'folder',
      path: f.path,
      createdAt: f.createdAt
    }));

    // Integrar plantillas pasadas por props de forma dinámica
    templates.forEach(t => {
      const folderPath = t.storagePath && t.storagePath !== 'Raíz' ? t.storagePath : '';
      const fileName = `${t.name.replace(/\s+/g, '_')}.json`;
      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
      
      // Si la carpeta contenedora no existe, la creamos recursivamente
      if (folderPath && !baseNodes.some(n => n.path === folderPath)) {
        const parts = folderPath.split('/');
        let currentBuild = '';
        parts.forEach((part: string) => {
          currentBuild = currentBuild ? `${currentBuild}/${part}` : part;
          if (!baseNodes.some(n => n.path === currentBuild)) {
            baseNodes.push({
              id: `fol_auto_${Math.random().toString(36).substr(2, 9)}`,
              name: part,
              type: 'folder',
              path: currentBuild,
              createdAt: t.createdAt
            });
          }
        });
      }

      baseNodes.push({
        id: `fil_tpl_${t.id}`,
        name: fileName,
        type: 'file',
        fileType: 'template',
        path: filePath,
        size: '15 KB',
        createdAt: t.createdAt,
        author: 'Admin',
        fields: t.fields
      });
    });

    // Integrar documentos firmados pasados por props
    signedDocuments.forEach((doc) => {
      // Usar filePath físico de la BD o una ruta inferida si no tiene
      const docTemplateName = doc.templateName || (doc.template ? doc.template.name : 'Documento');
      const docFilledByName = doc.filledBy?.name || doc.filledBy || 'Empleado';
      
      const filePath = doc.filePath || `RRHH/empleados/${docTemplateName.replace(/\s+/g, '_')}_${docFilledByName.replace(/\s+/g, '')}.pdf`;
      const fileName = filePath.split('/').pop() || filePath;

      baseNodes.push({
        id: `fil_doc_${doc.id}`,
        name: fileName,
        type: 'file',
        fileType: 'document',
        path: filePath,
        size: '1.1 MB',
        createdAt: doc.date || doc.createdAt,
        author: docFilledByName,
        content: `Documento firmado. Estado sinc: ${doc.syncStatus}`,
        rawDoc: doc
      });
    });

    setNodes(baseNodes);
  }, [templates, signedDocuments, folders]);

  // UI States
  const [selectedPath, setSelectedPath] = useState<string>('Raíz');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'RRHH': true,
    'CALIDAD': true,
    'SOPORTE': true
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [folderCurrentPage, setFolderCurrentPage] = useState(1);
  const folderItemsPerPage = 10;

  React.useEffect(() => {
    setFolderCurrentPage(1);
  }, [selectedPath]);

  // Modals / Edit states
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [newNameText, setNewNameText] = useState('');
  const [creatingInFolder, setCreatingInFolder] = useState<{ path: string; type: 'folder' | 'file' } | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'template' | 'document'>('document');
  const [movingNode, setMovingNode] = useState<FileNode | null>(null);
  const [moveDestinationPath, setMoveDestinationPath] = useState('');

  // Sincronizar con datos pasados por props
  // Si hay nuevas plantillas con rutas creadas en el builder, podríamos agregarlas dinámicamente
  // Por ahora manejamos el estado interno robusto que simula el servidor.

  // Helper: Extraer carpetas y archivos en un nivel
  const getChildrenOfPath = (path: string) => {
    return nodes.filter(node => {
      if (path === 'Raíz') {
        // Carpeta raíz: no tiene "/" en su ruta
        return !node.path.includes('/');
      } else {
        // Hijos directos: la ruta empieza por "path/", y no tiene más "/" después
        if (!node.path.startsWith(path + '/')) return false;
        const relativePart = node.path.substring(path.length + 1);
        return !relativePart.includes('/');
      }
    });
  };

  // Obtener todas las carpetas únicas disponibles
  const getAllFolders = () => {
    return nodes.filter(n => n.type === 'folder');
  };

  // Alternar expandir carpeta en el árbol
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Crear Carpeta
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const parentPath = creatingInFolder?.path && creatingInFolder.path !== 'Raíz' ? creatingInFolder.path : null;
    const name = newFolderName.trim();

    try {
      const { default: api } = await import('../../utils/api');
      const response = await api.post('/folders', { name, parentPath });

      if (response.data.success) {
        const f = response.data.data;
        const newNode: FileNode = {
          id: f.id,
          name: f.name,
          type: 'folder',
          path: f.path,
          createdAt: f.createdAt
        };
        setNodes(prev => [...prev, newNode]);
        setNewFolderName('');
        setCreatingInFolder(null);
        setSelectedPath(f.path);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error creando carpeta');
    }
  };

  // Crear Archivo
  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    let finalName = newFileName.trim();
    const ext = newFileType === 'template' ? '.json' : '.pdf';
    if (!finalName.endsWith(ext)) {
      finalName += ext;
    }

    const parentPath = creatingInFolder?.path || '';
    const newPath = parentPath 
      ? `${parentPath}/${finalName}`
      : finalName;

    // Validar duplicado
    if (nodes.some(n => n.path.toLowerCase() === newPath.toLowerCase())) {
      alert('Ya existe un archivo o carpeta con ese nombre en esta ruta.');
      return;
    }

    const newNode: FileNode = {
      id: `fil_${Math.random().toString(36).substr(2, 9)}`,
      name: finalName,
      type: 'file',
      fileType: newFileType,
      path: newPath,
      size: '0 KB',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      author: 'Admin',
      content: newFileType === 'document' ? 'Documento operativo firmado digitalmente.' : undefined,
      fields: newFileType === 'template' ? [] : undefined
    };

    setNodes(prev => [...prev, newNode]);
    setNewFileName('');
    setCreatingInFolder(null);
    setSelectedPath(newPath);
  };

  // Eliminar Carpeta o Archivo
  const handleDeleteNode = async (node: FileNode) => {
    const confirmation = window.confirm(`¿Estás seguro de que deseas eliminar "${node.name}"? ${node.type === 'folder' ? 'Esto eliminará recursivamente todo su contenido.' : ''}`);
    if (!confirmation) return;

    try {
      const { default: api } = await import('../../utils/api');
      
      if (node.type === 'folder') {
        await api.delete(`/folders/${node.id}`);
        // Eliminar carpeta y todos sus descendientes
        setNodes(prev => prev.filter(n => n.path !== node.path && !n.path.startsWith(node.path + '/')));
      } else {
        if (node.fileType === 'document' && node.id.startsWith('fil_doc_')) {
          await api.delete(`/documents/${node.id.replace('fil_doc_', '')}`);
        } else if (node.fileType === 'template' && node.id.startsWith('fil_tpl_')) {
          await api.delete(`/templates/${node.id.replace('fil_tpl_', '')}`);
        }
        setNodes(prev => prev.filter(n => n.id !== node.id));
      }

      if (selectedPath === node.path || selectedPath.startsWith(node.path + '/')) {
        setSelectedPath('Raíz');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error eliminando el elemento');
    }
  };

  // Iniciar renombrado
  const startRename = (node: FileNode) => {
    setRenamingNodeId(node.id);
    setNewNameText(node.name);
  };

  // Guardar Renombrado
  const saveRename = async (node: FileNode) => {
    if (!newNameText.trim() || newNameText.trim() === node.name) {
      setRenamingNodeId(null);
      return;
    }

    const parentPath = node.path.includes('/') 
      ? node.path.substring(0, node.path.lastIndexOf('/')) 
      : '';
    const newPath = parentPath 
      ? `${parentPath}/${newNameText.trim()}`
      : newNameText.trim();

    try {
      const { default: api } = await import('../../utils/api');

      if (node.type === 'folder') {
        await api.patch(`/folders/${node.id}/rename`, { newName: newNameText.trim() });
      }

      // Actualizar nodo actual y todos los descendientes en caso de que sea carpeta
      setNodes(prev => prev.map(n => {
        if (n.id === node.id) {
          return { ...n, name: newNameText.trim(), path: newPath };
        }
        if (node.type === 'folder' && n.path.startsWith(node.path + '/')) {
          const remainingPart = n.path.substring(node.path.length);
          return { ...n, path: newPath + remainingPart };
        }
        return n;
      }));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al renombrar el elemento');
    } finally {
      setRenamingNodeId(null);
    }
    if (selectedPath === node.path) {
      setSelectedPath(newPath);
    }
  };

  // Mover Nodo (Cambiar ruta)
  const handleMoveNode = () => {
    if (!movingNode) return;
    const dest = moveDestinationPath === 'Raíz' ? '' : moveDestinationPath;
    
    // Validar que no se mueva dentro de sí mismo si es carpeta
    if (movingNode.type === 'folder' && dest.startsWith(movingNode.path)) {
      alert('No puedes mover una carpeta dentro de sus propios subdirectorios.');
      return;
    }

    const newPath = dest 
      ? `${dest}/${movingNode.name}`
      : movingNode.name;

    // Validar duplicado
    if (nodes.some(n => n.path.toLowerCase() === newPath.toLowerCase())) {
      alert('Ya existe un elemento con el mismo nombre en la ruta de destino.');
      return;
    }

    // Actualizar nodo y descendientes
    setNodes(prev => prev.map(n => {
      if (n.id === movingNode.id) {
        return { ...n, path: newPath };
      }
      if (movingNode.type === 'folder' && n.path.startsWith(movingNode.path + '/')) {
        const remainingPart = n.path.substring(movingNode.path.length);
        return { ...n, path: newPath + remainingPart };
      }
      return n;
    }));

    setSelectedPath(newPath);
    setMovingNode(null);
  };

  // Nodo seleccionado actual
  const currentNode = nodes.find(n => n.path === selectedPath) || { name: 'Raíz', path: 'Raíz', type: 'folder' } as any;

  // Filtrado de nodos basado en búsqueda global
  const filteredNodes = searchQuery 
    ? nodes.filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Renderizador Recursivo del Árbol de Directorios (Left Panel)
  const renderTreeNodes = (parentPath: string, depth = 0) => {
    const directChildren = nodes.filter(node => {
      if (parentPath === '') {
        return !node.path.includes('/');
      } else {
        if (!node.path.startsWith(parentPath + '/')) return false;
        const relativePart = node.path.substring(parentPath.length + 1);
        return !relativePart.includes('/');
      }
    });

    // Ordenar carpetas primero, luego archivos
    const sorted = [...directChildren].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return sorted.map(node => {
      const isFolder = node.type === 'folder';
      const isOpen = expandedFolders[node.path];
      const isSelected = selectedPath === node.path;

      return (
        <div key={node.id} style={{ marginLeft: `${depth * 10}px` }} className="space-y-0.5">
          <div 
            className={`group flex items-center justify-between py-1.5 px-2 rounded-lg text-xs cursor-pointer select-none transition-all ${
              isSelected 
                ? 'bg-primary/10 text-primary font-semibold' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPath(node.path);
              if (isFolder) toggleFolder(node.path);
            }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {isFolder ? (
                <>
                  {isOpen ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                  {isOpen ? <FolderOpen className="h-3.5 w-3.5 text-primary/80 shrink-0" /> : <Folder className="h-3.5 w-3.5 text-primary/75 shrink-0" />}
                </>
              ) : (
                <>
                  <div className="w-3 shrink-0" /> {/* indent spacing */}
                  {node.fileType === 'template' ? (
                    <FileCode className="h-3.5 w-3.5 text-brand-accent shrink-0" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  )}
                </>
              )}
              <span className="truncate">{node.name}</span>
            </div>

            {/* Quick Hover Actions */}
            <div className="hidden group-hover:flex items-center gap-1 shrink-0 bg-transparent pl-2">
              {isFolder && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreatingInFolder({ path: node.path, type: 'folder' });
                    }}
                    title="Nueva Subcarpeta"
                    className="p-0.5 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
                  >
                    <FolderPlus className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreatingInFolder({ path: node.path, type: 'file' });
                    }}
                    title="Nuevo Archivo"
                    className="p-0.5 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
                  >
                    <FilePlus className="h-3 w-3" />
                  </button>
                </>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  startRename(node);
                }}
                title="Renombrar"
                className="p-0.5 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNode(node);
                }}
                title="Eliminar"
                className="p-0.5 rounded hover:bg-muted-foreground/20 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Render descendants if folder is open */}
          {isFolder && isOpen && (
            <div className="border-l border-border/80 ml-2.5 pl-1">
              {renderTreeNodes(node.path, 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Gestión y Árbol de Archivos</h1>
          <p className="text-muted-foreground">Administra y anida las plantillas o los documentos firmados en directorios estructurados en el servidor.</p>
        </div>
        {onRefresh && (
          <button 
            onClick={onRefresh} 
            disabled={isRefreshing}
            className="p-2 border border-border rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50" 
            title="Refrescar datos"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline text-[10px] font-medium uppercase tracking-wider">Refrescar</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side: Directory Tree View */}
        <div className="xl:col-span-1 bg-card border border-border rounded-lg shadow-sm p-4 flex flex-col space-y-4 max-h-[600px] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">Estructura Servidor</h3>
            <button 
              onClick={() => setCreatingInFolder({ path: '', type: 'folder' })}
              className="p-1 rounded bg-primary/10 hover:bg-primary/20 text-primary text-xs flex items-center gap-1 font-semibold transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Raíz
            </button>
          </div>

          {/* Search bar inside tree */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar en el árbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>

          {/* Tree list */}
          <div className="flex-1 space-y-1 pr-1">
            {/* Root item representation */}
            <div 
              className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs cursor-pointer select-none font-medium transition-all ${
                selectedPath === 'Raíz' 
                  ? 'bg-primary/15 text-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              onClick={() => setSelectedPath('Raíz')}
            >
              <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Directorio Raíz</span>
            </div>

            {/* Tree nodes starting from root */}
            <div className="border-l border-border/60 ml-2.5 pl-1.5 pt-1 space-y-1">
              {renderTreeNodes('')}
            </div>
          </div>
        </div>

        {/* Right Side: Explorer Panel / File Inspector */}
        <div className="xl:col-span-3 bg-card border border-border rounded-lg shadow-sm p-6 flex flex-col min-h-[500px]">
          
          {/* Breadcrumbs Navigation */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-b border-border pb-4 mb-4 overflow-x-auto whitespace-nowrap">
            <span className="cursor-pointer hover:text-primary" onClick={() => setSelectedPath('Raíz')}>Raíz</span>
            {selectedPath !== 'Raíz' && selectedPath.split('/').map((seg, idx, arr) => {
              const currentSegmentPath = arr.slice(0, idx + 1).join('/');
              return (
                <React.Fragment key={idx}>
                  <span>/</span>
                  <span 
                    className={`cursor-pointer hover:text-primary ${idx === arr.length - 1 ? 'text-foreground font-semibold' : ''}`}
                    onClick={() => setSelectedPath(currentSegmentPath)}
                  >
                    {seg}
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          {/* Global search results handler */}
          {searchQuery ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Resultados de búsqueda para "{searchQuery}":</h3>
              {filteredNodes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No se encontraron archivos o carpetas.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredNodes.map(node => (
                    <div 
                      key={node.id} 
                      onClick={() => { setSelectedPath(node.path); setSearchQuery(''); }}
                      className="p-3 border border-border rounded-lg bg-muted/10 hover:bg-primary/5 hover:border-primary/40 cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {node.type === 'folder' ? (
                          <Folder className="h-5 w-5 text-primary" />
                        ) : node.fileType === 'template' ? (
                          <FileCode className="h-5 w-5 text-brand-accent" />
                        ) : (
                          <FileText className="h-5 w-5 text-red-500" />
                        )}
                        <div className="text-left min-w-0">
                          <h4 className="text-xs font-semibold text-foreground truncate">{node.name}</h4>
                          <p className="text-[10px] text-muted-foreground truncate">{node.path}</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-secondary/15 px-2 py-0.5 rounded-full capitalize">{node.type}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="h-px bg-border my-6" />
            </div>
          ) : null}

          {/* Inline node renamer input bar */}
          {renamingNodeId === currentNode.id ? (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-center justify-between gap-3 animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-muted-foreground">Nuevo nombre:</span>
                <input 
                  type="text"
                  value={newNameText}
                  onChange={(e) => setNewNameText(e.target.value)}
                  className="flex-1 text-xs p-1.5 border border-border rounded bg-background outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => saveRename(currentNode)}
                  className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => setRenamingNodeId(null)}
                  className="p-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : null}

          {/* VIEW CONTROLLER */}
          {currentNode.type === 'folder' ? (
            // FOLDER VIEW: List files & subfolders in a grid/table
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              
              {/* Folder Actions header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    {currentNode.name === 'Raíz' ? 'Directorio Raíz' : currentNode.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Contenido del directorio actual en el servidor.</p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setCreatingInFolder({ path: currentNode.path === 'Raíz' ? '' : currentNode.path, type: 'folder' })}
                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs rounded-lg flex items-center gap-1 font-semibold transition-all"
                  >
                    <FolderPlus className="h-4 w-4" />
                    Nueva Carpeta
                  </button>
                  <button 
                    onClick={() => setCreatingInFolder({ path: currentNode.path === 'Raíz' ? '' : currentNode.path, type: 'file' })}
                    className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-white bg-accent rounded-lg flex items-center gap-1 font-semibold transition-all"
                  >
                    <FilePlus className="h-4 w-4" />
                    Nuevo Archivo
                  </button>
                </div>
              </div>

              {/* Grid of items in this folder */}
              <div className="border border-border/80 rounded-lg overflow-hidden mt-4 flex-1 flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-xs font-semibold text-muted-foreground bg-muted/40">
                        <th className="px-4 py-3">Nombre</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Tamaño</th>
                        <th className="px-4 py-3">Fecha de Creación</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      {(() => {
                        const folderChildren = getChildrenOfPath(currentNode.path === 'Raíz' ? '' : currentNode.path);
                        const folderCurrentData = folderChildren.slice((folderCurrentPage - 1) * folderItemsPerPage, folderCurrentPage * folderItemsPerPage);

                        if (folderChildren.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="text-center py-12 text-muted-foreground italic bg-muted/5">
                                Este directorio está vacío.
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <>
                            {folderCurrentData.map((node) => (
                              <tr key={node.id} className="hover:bg-muted/20 transition-colors">
                                <td 
                                  className="px-4 py-3 font-medium text-foreground flex items-center gap-2 cursor-pointer"
                                  onClick={() => setSelectedPath(node.path)}
                                >
                                  {node.type === 'folder' ? (
                                    <Folder className="h-4 w-4 text-primary" />
                                  ) : node.fileType === 'template' ? (
                                    <FileCode className="h-4 w-4 text-brand-accent" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="hover:underline break-all max-w-[260px] sm:max-w-md inline-block" title={node.name}>{node.name}</span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground capitalize">
                                  {node.type === 'folder' ? 'Carpeta' : `${node.fileType}`}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{node.size || '--'}</td>
                                <td className="px-4 py-3 text-muted-foreground">{node.createdAt}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-1">
                                    <button 
                                      onClick={() => startRename(node)}
                                      className="p-1 rounded hover:bg-muted text-primary"
                                      title="Renombrar"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setMovingNode(node);
                                        setMoveDestinationPath(node.path.includes('/') ? node.path.substring(0, node.path.lastIndexOf('/')) : 'Raíz');
                                      }}
                                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                                      title="Mover / Cambiar Ruta"
                                    >
                                      <Move className="h-3.5 w-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteNode(node)}
                                      className="p-1 rounded hover:bg-muted text-destructive"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {(() => {
                  const folderChildren = getChildrenOfPath(currentNode.path === 'Raíz' ? '' : currentNode.path);
                  const folderTotalPages = Math.max(1, Math.ceil(folderChildren.length / folderItemsPerPage));
                  
                  if (folderChildren.length === 0) return null;
                  
                  return (
                    <div className="border-t border-border p-4 flex items-center justify-between text-xs text-muted-foreground mt-auto bg-card">
                      <div>
                        Mostrando {(folderCurrentPage - 1) * folderItemsPerPage + 1} a {Math.min(folderCurrentPage * folderItemsPerPage, folderChildren.length)} de {folderChildren.length}
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className="mr-2">Página {folderCurrentPage} de {folderTotalPages}</span>
                        <button 
                          disabled={folderCurrentPage <= 1}
                          onClick={() => setFolderCurrentPage(prev => Math.max(1, prev - 1))}
                          className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button 
                          disabled={folderCurrentPage >= folderTotalPages}
                          onClick={() => setFolderCurrentPage(prev => Math.min(folderTotalPages, prev + 1))}
                          className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            // FILE VIEW: Preview details & interactive contents
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                {/* File Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 gap-4 w-full">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {currentNode.fileType === 'template' ? (
                      <div className="p-3 bg-brand-accent/15 text-brand-accent rounded-lg shrink-0">
                        <FileCode className="h-6 w-6" />
                      </div>
                    ) : (
                      <div className="p-3 bg-red-500/15 text-red-500 rounded-lg shrink-0">
                        <FileText className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base text-foreground break-all">{currentNode.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 break-all">
                        Ruta Servidor: <span className="font-mono text-primary bg-primary/5 px-1 py-0.5 rounded break-all inline-block max-w-full">{currentNode.path}</span>
                      </p>
                    </div>
                  </div>

                  <div className="relative shrink-0 self-start sm:self-center">
                    <button
                      onClick={() => setActionsDropdownOpen(!actionsDropdownOpen)}
                      className="px-4 py-2 bg-primary text-white text-xs rounded-lg flex items-center gap-2 font-semibold transition-all hover:bg-primary/95"
                    >
                      Acciones
                      <ChevronDown className={`h-4 w-4 transition-transform ${actionsDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {actionsDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setActionsDropdownOpen(false)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-20 flex flex-col p-1">
                          <button 
                            onClick={() => {
                              setActionsDropdownOpen(false);
                              setMovingNode(currentNode);
                              setMoveDestinationPath(currentNode.path.includes('/') ? currentNode.path.substring(0, currentNode.path.lastIndexOf('/')) : 'Raíz');
                            }}
                            className="px-3 py-2 hover:bg-muted text-muted-foreground hover:text-foreground text-xs rounded-md flex items-center gap-2 font-medium transition-all text-left"
                          >
                            <Move className="h-4 w-4" />
                            Mover Archivo
                          </button>
                          
                          {currentNode.fileType === 'document' && currentNode.rawDoc && (
                            <button 
                              onClick={() => {
                                setActionsDropdownOpen(false);
                                setContentModalNode(currentNode);
                              }}
                              className="px-3 py-2 text-primary hover:bg-primary/10 text-xs rounded-md flex items-center gap-2 font-medium transition-all text-left"
                            >
                              <FileText className="h-4 w-4" />
                              Ver Contenido
                            </button>
                          )}
                          
                          <button 
                            onClick={() => {
                              setActionsDropdownOpen(false);
                              const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
                              window.open(`${baseUrl}/uploads/${currentNode.path}`, '_blank');
                            }}
                            className="px-3 py-2 hover:bg-muted text-foreground text-xs rounded-md flex items-center gap-2 font-medium transition-all text-left"
                          >
                            <Download className="h-4 w-4" />
                            Descargar
                          </button>
                          
                          <div className="h-px bg-border my-1" />
                          
                          <button 
                            onClick={() => {
                              setActionsDropdownOpen(false);
                              handleDeleteNode(currentNode);
                            }}
                            className="px-3 py-2 hover:bg-destructive/10 text-destructive text-xs rounded-md flex items-center gap-2 font-medium transition-all text-left"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Metadata & Preview Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                  
                  {/* File Metadata Card */}
                  <div className="lg:col-span-1 bg-muted/20 border border-border p-4 rounded-lg space-y-4">
                    <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider border-b border-border pb-2">Información del Archivo</h4>
                    
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Tipo de Archivo:</span>
                        <span className="font-medium text-foreground capitalize">{currentNode.fileType === 'template' ? 'Plantilla Dinámica (JSON)' : 'Documento Diligenciado (PDF)'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Tamaño en Disco:</span>
                        <span className="font-medium text-foreground">{currentNode.size || '0 KB'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Fecha Registro:</span>
                        <span className="font-medium text-foreground">{currentNode.createdAt}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Autor / Operador:</span>
                        <span className="font-medium text-foreground">{currentNode.author || 'Sistema'}</span>
                      </div>
                    </div>
                  </div>

                  {/* High fidelity File Content Preview Card */}
                  <div className="lg:col-span-2 border border-border rounded-lg overflow-hidden flex flex-col min-h-[250px]">
                    <div className="px-4 py-2.5 bg-muted/40 border-b border-border text-xs font-semibold text-foreground flex justify-between items-center">
                      <span>Previsualizador de Servidor</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{currentNode.name.split('.').pop()?.toUpperCase()} viewer</span>
                    </div>

                    <div className="p-6 bg-background/50 flex-1 flex flex-col justify-center">
                      {currentNode.fileType === 'template' ? (
                        // Template JSON Preview Layout
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-primary">Esquema de Formulario Dinámico:</span>
                            <p className="text-[11px] text-muted-foreground">Esta plantilla está anidada en la base de datos para generar los siguientes inputs en las tablets de los empleados.</p>
                          </div>

                          <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/10 max-h-40 overflow-y-auto">
                            {currentNode.fields && currentNode.fields.length > 0 ? (
                              currentNode.fields.map((f: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-1 border-b border-border/40 last:border-b-0 text-xs">
                                  <span className="font-medium text-foreground">{f.label}</span>
                                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">{f.type}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground italic text-center py-4">No se han definido campos en este esquema.</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        // PDF Document Preview Layout
                        <div className="space-y-4">
                          <div className="border-l-4 border-primary pl-3 py-1">
                            <h5 className="text-xs font-bold text-foreground">Acta de Registro Operacional - ESE Norte 3</h5>
                            <p className="text-[10px] text-muted-foreground">Generado y validado mediante firma digital biométrica.</p>
                          </div>

                          <div className="bg-card border border-border/80 p-4 rounded-lg text-xs space-y-3">
                            <p className="text-muted-foreground leading-relaxed italic">
                              "{currentNode.content || 'Contenido del documento cargado en el servidor.'}"
                            </p>

                            <div className="h-px bg-border/60 my-2" />

                            <div className="flex justify-between items-center pt-2">
                              <div className="text-[10px] text-muted-foreground">
                                <p>Cargado por: {currentNode.author}</p>
                                <p>Fecha: {currentNode.createdAt}</p>
                              </div>
                              <div className="border border-green-500/30 bg-green-500/5 px-3 py-1 rounded text-center shrink-0">
                                <span className="text-[10px] text-green-500 font-bold tracking-wider">✓ FIRMADO DIGITALMENTE</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* CREATE NODE MODAL (POPUP / DRAWER LOOK) */}
      {creatingInFolder !== null && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                {creatingInFolder.type === 'folder' ? <FolderPlus className="h-5 w-5 text-primary" /> : <FilePlus className="h-5 w-5 text-accent" />}
                Crear {creatingInFolder.type === 'folder' ? 'Carpeta' : 'Archivo'}
              </h3>
              <button 
                onClick={() => setCreatingInFolder(null)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded border border-border/80">
              Ruta destino: <span className="font-mono text-primary font-bold">{creatingInFolder.path || 'Raíz (Principal)'}</span>
            </div>

            {creatingInFolder.type === 'folder' ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Nombre de la Carpeta</label>
                <input 
                  type="text" 
                  placeholder="Ej. AUDITORIAS"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Nombre del Archivo (Sin extensión)</label>
                  <input 
                    type="text" 
                    placeholder="Ej. contrato_operador"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tipo de Archivo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setNewFileType('document')}
                      className={`py-2 px-3 text-xs rounded-lg font-medium border transition-all ${
                        newFileType === 'document'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border bg-muted/10 text-muted-foreground hover:bg-muted/20'
                      }`}
                    >
                      Documento Diligenciado (.pdf)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewFileType('template')}
                      className={`py-2 px-3 text-xs rounded-lg font-medium border transition-all ${
                        newFileType === 'template'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border bg-muted/10 text-muted-foreground hover:bg-muted/20'
                      }`}
                    >
                      Plantilla / Esquema (.json)
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button 
                onClick={() => setCreatingInFolder(null)}
                className="px-4 py-2 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button 
                onClick={creatingInFolder.type === 'folder' ? handleCreateFolder : handleCreateFile}
                className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/95"
              >
                Crear Elemento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOVE NODE MODAL */}
      {movingNode !== null && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Move className="h-5 w-5 text-primary" />
                Mover Elemento / Cambiar Ruta
              </h3>
              <button 
                onClick={() => setMovingNode(null)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded border border-border/80 space-y-1">
              <div>Elemento a mover: <strong className="text-foreground">{movingNode.name}</strong></div>
              <div>Ruta actual: <span className="font-mono text-destructive">{movingNode.path}</span></div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Selecciona Carpeta de Destino</label>
              <select
                value={moveDestinationPath}
                onChange={(e) => setMoveDestinationPath(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Raíz">Raíz (Directorio Principal)</option>
                {getAllFolders().map(folder => (
                  <option key={folder.id} value={folder.path}>
                    {folder.path}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button 
                onClick={() => setMovingNode(null)}
                className="px-4 py-2 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button 
                onClick={handleMoveNode}
                className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/95"
              >
                Mover Elemento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Modal */}
      {contentModalNode && contentModalNode.rawDoc && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-3xl rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="font-bold text-foreground truncate max-w-[80%]">{contentModalNode.rawDoc.template?.name || 'Documento'}</h3>
              <button onClick={() => setContentModalNode(null)} className="p-1 hover:bg-muted text-muted-foreground rounded-md transition-colors hover:text-foreground"><X className="h-5 w-5" /></button>
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
                const description = contentModalNode.rawDoc.template?.description;
                if (!description) return null;
                const data = { ...contentModalNode.rawDoc.data };
                const fields = contentModalNode.rawDoc.template?.fields || [];
                
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
                    const tagName = getFieldTagName(fieldDef, fields);
                    const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const escapedLabel = fieldDef.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`{{\\s*(?:${escapedTagName}|${escapedLabel})\\s*}}`, 'gi');
                    const value = data[key];
                    const isImgVal = typeof value === 'string' && (
                      value.startsWith('data:image/') ||
                      value.startsWith('file://') ||
                      value.startsWith('/uploads/') ||
                      value.includes('/uploads/') ||
                      /\.(png|jpe?g|gif|webp)$/i.test(value)
                    );
                    if (isImgVal) {
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
                {Object.keys(contentModalNode.rawDoc.data || {}).map((key: string) => {
                  const val = contentModalNode.rawDoc.data[key];
                  const fieldDef = (contentModalNode.rawDoc.template?.fields || []).find((f: any) => f.id === key);
                  const fieldLabel = fieldDef ? fieldDef.label : key;
                  
                  const isMedia = typeof val === 'string' && (
                    val.startsWith('file://') ||
                    val.startsWith('data:image/') ||
                    val.startsWith('/uploads/') ||
                    val.includes('/uploads/') ||
                    /\.(png|jpe?g|gif|webp)$/i.test(val)
                  );

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
                onClick={() => setContentModalNode(null)}
                className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/95 transition-colors"
              >
                Cerrar Visualizador
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

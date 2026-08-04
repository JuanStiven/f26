import { useState, useMemo } from 'react';
import { FileExplorer } from '../components/explorer/file-explorer';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, FileDown, RefreshCw, Trash2 } from 'lucide-react';
import { getApiBaseUrl } from '../utils/imageUrl';

interface FileExplorerViewProps {
  currentTab: 'explorer' | 'documents' | string;
  templates: any[];
  signedDocuments: any[];
  folders: any[];
  onRefresh: () => void;
  isRefreshing: boolean;
  currentRole?: string;
  onViewDocument: (doc: any) => void;
}

export function FileExplorerView({
  currentTab,
  templates,
  signedDocuments,
  folders,
  onRefresh,
  isRefreshing,
  currentRole,
  onViewDocument,
}: FileExplorerViewProps) {
  const canDelete = currentRole === 'SUPER_ADMIN';
  const [docSearchTerm, setDocSearchTerm] = useState('');
  const [docCurrentPage, setDocCurrentPage] = useState(1);
  const [docSortConfig, setDocSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const docItemsPerPage = 10;

  const handleDocSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (docSortConfig && docSortConfig.key === key && docSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setDocSortConfig({ key, direction });
  };

  const filteredAndSortedDocs = useMemo(() => {
    let result = [...signedDocuments];
    if (docSearchTerm.trim()) {
      const term = docSearchTerm.toLowerCase();
      result = result.filter(
        (doc) =>
          (doc.template?.name || '').toLowerCase().includes(term) ||
          (doc.filledBy?.name || doc.filledBy || '').toLowerCase().includes(term)
      );
    }
    if (docSortConfig) {
      result.sort((a, b) => {
        let aVal = a[docSortConfig.key] || '';
        let bVal = b[docSortConfig.key] || '';
        if (docSortConfig.key === 'templateName') {
          aVal = a.template?.name || '';
          bVal = b.template?.name || '';
        } else if (docSortConfig.key === 'filledBy') {
          aVal = a.filledBy?.name || a.filledBy || '';
          bVal = b.filledBy?.name || b.filledBy || '';
        }
        if (aVal < bVal) return docSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return docSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [signedDocuments, docSearchTerm, docSortConfig]);

  const docTotalPages = Math.ceil(filteredAndSortedDocs.length / docItemsPerPage) || 1;
  const docCurrentData = useMemo(() => {
    return filteredAndSortedDocs.slice((docCurrentPage - 1) * docItemsPerPage, docCurrentPage * docItemsPerPage);
  }, [filteredAndSortedDocs, docCurrentPage, docItemsPerPage]);

  if (currentTab === 'explorer') {
    return (
      <FileExplorer
        templates={templates}
        signedDocuments={signedDocuments}
        folders={folders}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        currentRole={currentRole}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Documentos Diligenciados</h1>
          <p className="text-muted-foreground">Historial y firma digital de todos los documentos llenados por los empleados.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-border shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
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

      <div className="bg-card border border-border rounded-lg shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-xs font-semibold text-muted-foreground bg-muted/30">
                <th className="px-6 py-3.5 cursor-pointer hover:bg-muted/50" onClick={() => handleDocSort('templateName')}>
                  <div className="flex items-center gap-1">
                    Documento{' '}
                    {docSortConfig?.key === 'templateName' &&
                      (docSortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-6 py-3.5 cursor-pointer hover:bg-muted/50" onClick={() => handleDocSort('filledBy')}>
                  <div className="flex items-center gap-1">
                    Empleado Responsable{' '}
                    {docSortConfig?.key === 'filledBy' &&
                      (docSortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-6 py-3.5 cursor-pointer hover:bg-muted/50" onClick={() => handleDocSort('createdAt')}>
                  <div className="flex items-center gap-1">
                    Fecha de Envío{' '}
                    {docSortConfig?.key === 'createdAt' &&
                      (docSortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-6 py-3.5 cursor-pointer hover:bg-muted/50" onClick={() => handleDocSort('syncStatus')}>
                  <div className="flex items-center gap-1">
                    Estado en Servidor{' '}
                    {docSortConfig?.key === 'syncStatus' &&
                      (docSortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {docCurrentData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">
                    No se encontraron documentos diligenciados.
                  </td>
                </tr>
              ) : (
                docCurrentData.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{doc.template?.name || 'Documento sin título'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{doc.filledBy?.name || doc.filledBy || 'Empleado'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(doc.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          doc.syncStatus === 'SYNCED' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                        }`}
                      >
                        {doc.syncStatus === 'SYNCED' ? 'Sincronizado' : doc.syncStatus === 'PENDING' || doc.syncStatus?.toLowerCase() === 'pending' ? 'Pendiente' : doc.syncStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onViewDocument(doc)}
                        className="p-1 rounded hover:bg-muted text-primary hover:text-accent mr-1"
                        title="Ver Contenido"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          window.open(`${getApiBaseUrl()}/uploads/${doc.filePath}`, '_blank');
                        }}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Descargar PDF"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                      {canDelete && (
                        <button
                          onClick={async () => {
                            if (!window.confirm(`¿Eliminar el documento "${doc.template?.name || 'Documento'}"? Esta acción no se puede deshacer.`)) return;
                            try {
                              const { default: api } = await import('../utils/api');
                              await api.delete(`/documents/${doc.id}`);
                              onRefresh();
                            } catch (error: any) {
                              alert(error.response?.data?.message || 'Error eliminando el documento');
                            }
                          }}
                          className="p-1 rounded hover:bg-muted text-destructive"
                          title="Eliminar documento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-muted/20 text-xs">
          <span className="text-muted-foreground">
            Mostrando{' '}
            {filteredAndSortedDocs.length > 0 ? (docCurrentPage - 1) * docItemsPerPage + 1 : 0} a{' '}
            {Math.min(docCurrentPage * docItemsPerPage, filteredAndSortedDocs.length)} de {filteredAndSortedDocs.length} registros
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDocCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={docCurrentPage === 1}
              className="p-1 rounded border border-border bg-background disabled:opacity-50 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium text-foreground">
              Página {docCurrentPage} de {docTotalPages}
            </span>
            <button
              onClick={() => setDocCurrentPage((p) => Math.min(p + 1, docTotalPages))}
              disabled={docCurrentPage === docTotalPages}
              className="p-1 rounded border border-border bg-background disabled:opacity-50 hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { FileText, Users, Grid, CheckCircle, Eye, FileDown, Plus, ArrowRight, Settings as SettingsIcon, RefreshCw } from 'lucide-react';

interface DashboardViewProps {
  signedDocuments: any[];
  employees: any[];
  templates: any[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onSelectTab: (tab: string) => void;
  onViewDocument: (doc: any) => void;
}

export function DashboardView({
  signedDocuments,
  employees,
  templates,
  onRefresh,
  isRefreshing,
  onSelectTab,
  onViewDocument,
}: DashboardViewProps) {
  const activeEmployees = employees.filter((e) => e.status === 'Activo');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Dashboard General</h1>
          <p className="text-muted-foreground">Monitoreo y resumen de la operación de ESE Norte 3.</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-border shadow-xs disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          {isRefreshing ? 'Actualizando...' : 'Actualizar Datos'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border p-6 rounded-lg shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documentos Guardados</p>
            <h3 className="text-3xl font-bold text-foreground">{signedDocuments.length}</h3>
          </div>
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-lg shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empleados Activos</p>
            <h3 className="text-3xl font-bold text-foreground">{activeEmployees.length}</h3>
          </div>
          <div className="p-3 bg-brand-light-blue/15 rounded-full text-brand-light-blue">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-lg shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plantillas Creadas</p>
            <h3 className="text-3xl font-bold text-foreground">{templates.length}</h3>
          </div>
          <div className="p-3 bg-brand-accent/10 rounded-full text-brand-accent">
            <Grid className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-lg shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
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
        <div className="lg:col-span-2 bg-card border border-border rounded-lg shadow-xs overflow-hidden flex flex-col">
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
                {signedDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">
                      No hay documentos firmados registrados aún.
                    </td>
                  </tr>
                ) : (
                  signedDocuments.slice(0, 5).map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{doc.template?.name || 'Documento'}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-lg shadow-xs p-6 space-y-6">
          <h3 className="font-semibold text-foreground border-b border-border pb-3">Accesos Directos</h3>

          <div className="space-y-3">
            <button
              onClick={() => onSelectTab('templates')}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group cursor-pointer"
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
              onClick={() => onSelectTab('users')}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand-light-blue/50 hover:bg-brand-light-blue/5 transition-all text-left group cursor-pointer"
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
              onClick={() => onSelectTab('settings')}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand-secondary/50 hover:bg-brand-secondary/5 transition-all text-left group cursor-pointer"
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
  );
}

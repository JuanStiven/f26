import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  UserCheck, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList,
  FolderOpen
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function Sidebar({ collapsed, setCollapsed, currentTab, setCurrentTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'templates', label: 'DocBuilder (Plantillas)', icon: ClipboardList },
    { id: 'explorer', label: 'Explorador de Archivos', icon: FolderOpen },
    { id: 'users', label: 'Gestión de Empleados', icon: Users },
    { id: 'senders', label: 'Gestión de Remitentes', icon: UserCheck },
    { id: 'documents', label: 'Documentos Diligenciados', icon: FileText },
  ];

  const bottomItems = [
    { id: 'settings', label: 'Configuración Empresa', icon: Settings },
    { id: 'help', label: 'Ayuda / Soporte', icon: HelpCircle },
  ];

  return (
    <aside 
      className={`h-screen bg-card border-r border-border flex flex-col transition-all duration-300 z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
            <span className="text-white font-bold text-sm">ESE</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-foreground leading-tight tracking-tight">ESE NORTE 3</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Gestión Documental</span>
            </div>
          )}
        </div>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Menu */}
      <div className="border-t border-border py-4 px-3 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

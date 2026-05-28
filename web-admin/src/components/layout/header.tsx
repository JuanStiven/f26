import { useState } from 'react';
import { 
  Bell, 
  Menu, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  ChevronDown,
  Shield
} from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout?: () => void;
  currentUser?: any;
  onProfileClick?: () => void;
  onSecurityClick?: () => void;
  notificationsData?: any[];
}

export function Header({ onMenuToggle, theme, toggleTheme, onLogout, currentUser, onProfileClick, onSecurityClick, notificationsData = [] }: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Generate initials
  const initials = currentUser?.name 
    ? currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 relative z-20">
      {/* Left side: Hamburger menu for mobile & title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider hidden sm:block">F26</h2>
        </div>
      </div>

      {/* Right side: Options */}
      <div className="flex items-center gap-3">
        
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-card animate-pulse" />
          </button>

          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-border font-semibold text-sm flex justify-between items-center">
                  <span>Notificaciones</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">{notificationsData.length} Recientes</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notificationsData.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      No tienes notificaciones
                    </div>
                  ) : (
                    notificationsData.map((n) => (
                      <div 
                        key={n.id} 
                        className={`px-4 py-3 hover:bg-muted/50 border-b border-border/50 cursor-pointer flex flex-col gap-0.5 transition-colors ${
                          !n.read ? 'bg-primary/5' : ''
                        }`}
                      >
                        <span className="text-xs font-medium text-foreground">{n.text}</span>
                        <span className="text-[10px] text-muted-foreground">{n.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* User Profile Menu */}
        <div className="relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-semibold shadow-inner">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold leading-tight">{currentUser?.name || 'Admin'}</span>
              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{currentUser?.role || 'Administrador'}</span>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-1.5 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-foreground">{currentUser?.name || 'Administrador'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{currentUser?.email || 'admin@esenorte3.gov.co'}</p>
                </div>
                <button 
                  onClick={() => { setProfileOpen(false); onProfileClick?.(); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Mi Perfil
                </button>
                <button 
                  onClick={() => { setProfileOpen(false); onSecurityClick?.(); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left"
                >
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Seguridad
                </button>
                <div className="h-px bg-border my-1" />
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
}

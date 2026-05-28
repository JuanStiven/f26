import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Zap, 
  UserCheck, 
  ArrowRight,
  ShieldAlert,
  Sun,
  Moon,
  Camera,
  ClipboardList
} from 'lucide-react';
import api from '../../utils/api';

interface LoginProps {
  onLogin: (role: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function LoginPage({ onLogin, theme, toggleTheme }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login/admin', { email, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onLogin('admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
      
      {/* Left Panel - Branding & Features (Replicando el diseño de ispgo) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5 border-r border-border">
        
        {/* Animated Network Grid Background */}
        <div className="absolute inset-0 opacity-10 dark:opacity-25">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-primary"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Pulse elements to match ispgo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary rounded-full animate-pulse" />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-brand-light-blue rounded-full animate-pulse delay-300" />
          <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-primary/60 rounded-full animate-pulse delay-500" />
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-brand-light-blue/80 rounded-full animate-pulse delay-700" />
        </div>

        {/* Branding Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          
          {/* Logo & Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-primary/20 shadow-md overflow-hidden p-1">
              <img src="/logo_es.png" alt="ESE Norte 3 Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ESE NORTE 3</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Documentación Digital</p>
            </div>
          </div>

          {/* Core Feature Text */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold text-foreground mb-4 text-balance leading-tight">
                Gestiona y firma documentos sin usar papel
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed max-w-lg">
                Plataforma integral para crear plantillas dinámicas, registrar firmas en campo, recolectar consentimiento biométrico y controlar las entregas en tiempo real.
              </p>
            </div>

            {/* Feature Cards Grid (Inspired by ispgo layout) */}
            <div className="grid grid-cols-2 gap-4">
              <FeatureCard 
                icon={<ClipboardList className="w-5 h-5 text-primary" />}
                title="DocBuilder Dinámico"
                description="Diseña tus propios campos e inputs fácilmente."
              />
              <FeatureCard 
                icon={<Camera className="w-5 h-5 text-brand-light-blue" />}
                title="Consentimiento"
                description="Captura fotográfica y de firmas digitalizadas."
              />
              <FeatureCard 
                icon={<Zap className="w-5 h-5 text-accent" />}
                title="Offline-First"
                description="Los operarios trabajan aun sin señal de internet."
              />
              <FeatureCard 
                icon={<UserCheck className="w-5 h-5 text-brand-secondary" />}
                title="Control de Operaciones"
                description="Monitorea las descargas y firmas desde el mapa."
              />
            </div>
          </div>

          {/* Footer stats in branding panel */}
          <div className="flex items-center gap-8 border-t border-border/80 pt-6">
            <div>
              <p className="text-2xl font-bold text-primary">100%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Cero Papelería</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-2xl font-bold text-brand-light-blue">Encriptado</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Firmas Biométricas</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-2xl font-bold text-foreground">Offline</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Almacenamiento Local</p>
            </div>
          </div>

        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 bg-background relative">
        
        {/* Theme Toggle in top right */}
        <div className="absolute top-6 right-6">
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400 animate-in spin-in-12 duration-200" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        <div className="my-auto w-full max-w-md mx-auto space-y-8">
          
          {/* Logo on mobile view only */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-primary/20 overflow-hidden p-1">
              <img src="/logo_es.png" alt="ESE Norte 3 Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-foreground">ESE NORTE 3</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Documentación Digital</p>
            </div>
          </div>

          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Ingreso Administrativo</h2>
            <p className="text-sm text-muted-foreground">Accede para gestionar plantillas, verificar documentos y configurar la organización.</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2 animate-in fade-in duration-200">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Usuario / Correo Electrónico
              </label>
              <input 
                id="email"
                type="email"
                placeholder="admin@esenorte3.gov.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full text-xs p-3 rounded-lg border border-border bg-card focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contraseña
                </label>
                <a href="#forgot" className="text-xs text-primary hover:text-accent font-medium transition-colors">¿Olvidaste tu contraseña?</a>
              </div>
              <div className="relative">
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full text-xs p-3 pr-10 rounded-lg border border-border bg-card focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
              <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer select-none">
                Recordar mi sesión en este navegador
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/95 text-white text-xs font-semibold p-3.5 rounded-lg shadow-md shadow-primary/10 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Credenciales de Demo */}
            <div className="p-3 rounded-lg border border-border bg-muted/40 text-center space-y-1 select-none animate-in fade-in duration-300">
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Credenciales de Demo</p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2 text-[11px] text-foreground font-mono">
                <div>
                  <span className="text-muted-foreground">User:</span>{' '}
                  <strong className="text-foreground hover:text-primary transition-colors cursor-pointer select-all" onClick={() => setEmail('admin@esenorte3.gov.co')}>
                    admin@esenorte3.gov.co
                  </strong>
                </div>
                <span className="hidden sm:inline text-muted-foreground/30">|</span>
                <div>
                  <span className="text-muted-foreground">Pass:</span>{' '}
                  <strong className="text-foreground hover:text-primary transition-colors cursor-pointer select-all" onClick={() => setPassword('admin123')}>
                    admin123
                  </strong>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground/80 italic font-sans">(Haz clic en ellas para autorellenar)</p>
            </div>
          </form>

        </div>

        {/* Footer info to match latency metrics in ispgo */}
        <div className="text-center text-[10px] text-muted-foreground border-t border-border/60 pt-4 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Servidor Operativo</span>
            </div>
            <span>•</span>
            <span>Versión 1.0.0</span>
            <span>•</span>
            <span>Latencia DB: 8ms</span>
          </div>
          <div className="mt-1 font-medium text-[10px] text-muted-foreground/80">
            © {new Date().getFullYear()} Stiven Gonzalez - Gloria al nombre de Jesucristo
          </div>
        </div>

      </div>

    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border/80 shadow-sm flex flex-col gap-2 hover:border-primary/35 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-xs font-bold text-foreground leading-snug">{title}</h4>
        <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">{description}</p>
      </div>
    </div>
  );
}

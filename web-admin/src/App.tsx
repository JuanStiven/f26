import { useState } from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header / Navbar */}
      <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Logo placeholder - En un futuro cargado desde config */}
          <div className="bg-white p-2 rounded-full">
            <span className="text-primary font-bold">ESE</span>
          </div>
          <h1 className="text-xl font-bold">Norte 3 - Panel Administrativo</h1>
        </div>
        <div className="text-sm font-medium">Administrador</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-secondary mb-6">Bienvenido al Gestor de Documentos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card: DocBuilder */}
            <div className="bg-white p-6 rounded-lg shadow border-t-4 border-accent hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold text-primary mb-2">DocBuilder</h3>
              <p className="text-secondary mb-4">Crea y edita las plantillas de documentos operativos.</p>
              <button className="bg-accent text-white px-4 py-2 rounded hover:bg-primary transition-colors">
                Ir a Plantillas
              </button>
            </div>

            {/* Card: Usuarios */}
            <div className="bg-white p-6 rounded-lg shadow border-t-4 border-light-blue hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold text-primary mb-2">Empleados</h3>
              <p className="text-secondary mb-4">Gestiona los accesos de los operarios.</p>
              <button className="bg-light-blue text-white px-4 py-2 rounded hover:bg-primary transition-colors">
                Ver Empleados
              </button>
            </div>

            {/* Card: Configuración */}
            <div className="bg-white p-6 rounded-lg shadow border-t-4 border-light-gray hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold text-primary mb-2">Configuración</h3>
              <p className="text-secondary mb-4">Actualiza logo, NIT y datos de la empresa.</p>
              <button className="bg-secondary text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors">
                Ajustes
              </button>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

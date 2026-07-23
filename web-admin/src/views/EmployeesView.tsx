import React, { useState, useMemo } from 'react';
import { Search, Plus, X, Edit2, Trash2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface EmployeesViewProps {
  currentTab: 'users' | 'admins' | 'senders' | string;
  employees: any[];
  senders: any[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onSaveUser: (userData: any) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
}

export function EmployeesView({
  currentTab,
  employees,
  senders,
  onRefresh,
  isRefreshing,
  onSaveUser,
  onDeleteUser,
}: EmployeesViewProps) {
  const [empSearchTerm, setEmpSearchTerm] = useState('');
  const [empCurrentPage, setEmpCurrentPage] = useState(1);
  const empItemsPerPage = 10;

  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminCurrentPage, setAdminCurrentPage] = useState(1);
  const adminItemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  const [userForm, setUserForm] = useState({
    id: undefined as string | undefined,
    name: '',
    document: '',
    pin: '',
    position: '',
    status: 'Activo',
    role: 'EMPLOYEE',
    email: '',
  });

  const filteredEmployees = useMemo(() => {
    const list = employees.filter((e) => e.role === 'EMPLOYEE');
    if (!empSearchTerm.trim()) return list;
    const term = empSearchTerm.toLowerCase();
    return list.filter(
      (e) =>
        (e.name || '').toLowerCase().includes(term) ||
        (e.document || '').toLowerCase().includes(term) ||
        (e.position || '').toLowerCase().includes(term)
    );
  }, [employees, empSearchTerm]);

  const empTotalPages = Math.ceil(filteredEmployees.length / empItemsPerPage) || 1;
  const empCurrentData = useMemo(() => {
    return filteredEmployees.slice((empCurrentPage - 1) * empItemsPerPage, empCurrentPage * empItemsPerPage);
  }, [filteredEmployees, empCurrentPage, empItemsPerPage]);

  const filteredAdmins = useMemo(() => {
    const list = employees.filter((e) => e.role === 'ADMIN');
    if (!adminSearchTerm.trim()) return list;
    const term = adminSearchTerm.toLowerCase();
    return list.filter(
      (e) =>
        (e.name || '').toLowerCase().includes(term) ||
        (e.email || '').toLowerCase().includes(term) ||
        (e.document || '').toLowerCase().includes(term)
    );
  }, [employees, adminSearchTerm]);

  const adminTotalPages = Math.ceil(filteredAdmins.length / adminItemsPerPage) || 1;
  const adminCurrentData = useMemo(() => {
    return filteredAdmins.slice((adminCurrentPage - 1) * adminItemsPerPage, adminCurrentPage * adminItemsPerPage);
  }, [filteredAdmins, adminCurrentPage, adminItemsPerPage]);

  const handleOpenCreateModal = (role: 'EMPLOYEE' | 'ADMIN') => {
    setUserForm({
      id: undefined,
      name: '',
      document: '',
      pin: '',
      position: role === 'ADMIN' ? 'Administrador' : '',
      status: 'Activo',
      role,
      email: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: any) => {
    setUserForm({
      id: user.id,
      name: user.name || '',
      document: user.document || '',
      pin: user.pin || '',
      position: user.position || '',
      status: user.status || 'Activo',
      role: user.role || 'EMPLOYEE',
      email: user.email || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveUser(userForm);
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      await onDeleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  if (currentTab === 'senders') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Gestión de Remitentes</h1>
            <p className="text-muted-foreground">Empresas o entidades asociadas que solicitan o despachan los documentos.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-border shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              {isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-xs overflow-hidden">
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
              {senders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground italic">
                    No hay remitentes registrados.
                  </td>
                </tr>
              ) : (
                senders.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{s.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{s.nit}</td>
                    <td className="px-6 py-4 text-muted-foreground">{s.phone}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 rounded hover:bg-muted text-primary mr-1">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const isAdminsTab = currentTab === 'admins';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            {isAdminsTab ? 'Usuarios Administradores' : 'Gestión de Empleados'}
          </h1>
          <p className="text-muted-foreground">
            {isAdminsTab
              ? 'Administra los usuarios con rol de administrador que acceden a este panel web.'
              : 'Administra los usuarios con rol de empleado que acceden desde las tablets.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
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
              placeholder={isAdminsTab ? 'Buscar administrador...' : 'Buscar empleado...'}
              value={isAdminsTab ? adminSearchTerm : empSearchTerm}
              onChange={(e) => {
                if (isAdminsTab) {
                  setAdminSearchTerm(e.target.value);
                  setAdminCurrentPage(1);
                } else {
                  setEmpSearchTerm(e.target.value);
                  setEmpCurrentPage(1);
                }
              }}
              className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
          <button
            onClick={() => handleOpenCreateModal(isAdminsTab ? 'ADMIN' : 'EMPLOYEE')}
            className="bg-primary text-white text-xs px-4 py-2 rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1.5 w-full sm:w-auto justify-center cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {isAdminsTab ? 'Nuevo Administrador' : 'Nuevo Empleado'}
          </button>
        </div>
      </div>

      {/* Modal Formulario Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="font-semibold text-foreground">
                {userForm.id ? 'Editar' : 'Crear Nuevo'} {userForm.role === 'ADMIN' ? 'Administrador' : 'Empleado'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitUser}>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Cédula / Documento</label>
                  <input
                    type="text"
                    required
                    value={userForm.document}
                    onChange={(e) => setUserForm({ ...userForm, document: e.target.value })}
                    className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                {userForm.role === 'ADMIN' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Correo Electrónico (Login Admin)</label>
                    <input
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">PIN de Acceso</label>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder={userForm.id ? 'Dejar en blanco' : '1234'}
                      required={!userForm.id}
                      value={userForm.pin}
                      onChange={(e) => setUserForm({ ...userForm, pin: e.target.value })}
                      className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Cargo / Función</label>
                    <input
                      type="text"
                      required
                      value={userForm.position}
                      onChange={(e) => setUserForm({ ...userForm, position: e.target.value })}
                      className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Estado</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                    className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-muted/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/95"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-card w-full max-w-sm rounded-xl shadow-xl p-6 space-y-4 text-center">
            <h3 className="font-bold text-foreground">¿Eliminar Usuario?</h3>
            <p className="text-xs text-muted-foreground">
              ¿Estás seguro de eliminar a <strong className="text-foreground">{userToDelete.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-destructive text-white text-xs font-medium hover:bg-destructive/95"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="bg-card border border-border rounded-lg shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-xs font-semibold text-muted-foreground bg-muted/30">
                <th className="px-6 py-3.5">Nombre Completo</th>
                <th className="px-6 py-3.5">Cédula</th>
                {isAdminsTab && <th className="px-6 py-3.5">Correo</th>}
                <th className="px-6 py-3.5">Cargo</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {(isAdminsTab ? adminCurrentData : empCurrentData).length === 0 ? (
                <tr>
                  <td colSpan={isAdminsTab ? 6 : 5} className="px-6 py-8 text-center text-muted-foreground italic">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                (isAdminsTab ? adminCurrentData : empCurrentData).map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{user.name}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">{user.document}</td>
                    {isAdminsTab && <td className="px-6 py-4 text-muted-foreground">{user.email || '--'}</td>}
                    <td className="px-6 py-4 text-muted-foreground">{user.position}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          user.status === 'Activo' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="p-1 rounded hover:bg-muted text-primary mr-1"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setUserToDelete(user)}
                        className="p-1 rounded hover:bg-muted text-destructive"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
            {(isAdminsTab ? filteredAdmins : filteredEmployees).length > 0
              ? ((isAdminsTab ? adminCurrentPage : empCurrentPage) - 1) * (isAdminsTab ? adminItemsPerPage : empItemsPerPage) + 1
              : 0}{' '}
            a{' '}
            {Math.min(
              (isAdminsTab ? adminCurrentPage : empCurrentPage) * (isAdminsTab ? adminItemsPerPage : empItemsPerPage),
              (isAdminsTab ? filteredAdmins : filteredEmployees).length
            )}{' '}
            de {(isAdminsTab ? filteredAdmins : filteredEmployees).length} usuarios
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isAdminsTab) setAdminCurrentPage((p) => Math.max(p - 1, 1));
                else setEmpCurrentPage((p) => Math.max(p - 1, 1));
              }}
              disabled={(isAdminsTab ? adminCurrentPage : empCurrentPage) === 1}
              className="p-1 rounded border border-border bg-background disabled:opacity-50 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium text-foreground">
              Página {isAdminsTab ? adminCurrentPage : empCurrentPage} de {isAdminsTab ? adminTotalPages : empTotalPages}
            </span>
            <button
              onClick={() => {
                if (isAdminsTab) setAdminCurrentPage((p) => Math.min(p + 1, adminTotalPages));
                else setEmpCurrentPage((p) => Math.min(p + 1, empTotalPages));
              }}
              disabled={(isAdminsTab ? adminCurrentPage : empCurrentPage) === (isAdminsTab ? adminTotalPages : empTotalPages)}
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

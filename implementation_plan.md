# Plan de Implementación: Sistema de Gestión de Documentos Operativos

## Arquitectura del Proyecto

Para garantizar orden, escalabilidad y las mejores prácticas, dividiremos el proyecto en tres módulos principales dentro de un mismo repositorio (Monorepo).

### 1. `backend/` (API REST - Node.js + Express + TypeScript)
El cerebro del sistema. Estará dockerizado y se encargará de la lógica de negocio y la persistencia de datos.
*   **Arquitectura de Capas (Modular):** 
    *   `routes/`: Definición de endpoints.
    *   `controllers/`: Manejo de las peticiones HTTP.
    *   `services/`: Lógica de negocio (donde ocurre la magia).
    *   `repositories/`: Interacción directa con la base de datos (PostgreSQL).
    *   `models/`: Esquemas de la base de datos.
    *   `middlewares/`: Autenticación, validación de roles y manejo de errores.
*   **Tecnologías:** Node.js, Express, TypeScript, Prisma (ORM para la base de datos PostgreSQL), JWT (Autenticación).

### 2. `web-admin/` (Panel Administrativo Web - React + Vite)
Una aplicación web diseñada para ser usada desde un computador de escritorio.
*   **Roles permitidos:** Administrador.
*   **Funcionalidades:**
    *   **DocBuilder (Creador de Plantillas):** Interfaz visual para crear las plantillas, definir campos editables, agregar textos fijos y tablas.
    *   **Configuración de Empresa:** Subir el logo, NIT, teléfono, gerente y dirección.
    *   **Gestión de Usuarios:** Crear cuentas para los operarios y asignarles el rol de `empleado`.
    *   **Gestión de Remitentes.**
    *   **Historial de Documentos:** Ver los documentos ya diligenciados por los empleados en formato PDF.

### 3. `mobile-app/` (Aplicación Móvil - React Native + Expo)
La herramienta de trabajo de campo para las tablets y teléfonos.
*   **Roles permitidos:** Empleado (Operarios).
*   **Funcionalidades:**
    *   **Visualización:** Listado de plantillas disponibles (solo lectura de la estructura).
    *   **Diligenciamiento:** Formularios generados automáticamente basados en la plantilla seleccionada.
    *   **Consentimiento y Cámara:** Alerta de consentimiento y captura de foto facial.
    *   **Firma Digital:** Panel de firma táctil.
    *   **Modo Offline-First:** Los datos se guardan en el dispositivo localmente y se sincronizan al recuperar internet.

## Mejores Prácticas (Best Practices)
1.  **Tipado Estricto:** Uso de TypeScript en todo el ecosistema.
2.  **Linting y Formateo:** Uso de ESLint y Prettier.
3.  **Variables de Entorno:** Separación de credenciales.
4.  **Dockerización:** Archivo `docker-compose.yml`.
5.  **Autenticación y Roles:** Sistema basado en JWT y RBAC.

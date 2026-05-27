"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParam = getParam;
/**
 * Helper para obtener un parámetro de ruta como string de forma segura.
 * Express 5 tipifica req.params[key] como string | string[].
 */
function getParam(req, key) {
    const val = req.params[key];
    if (Array.isArray(val))
        return val[0] || '';
    return val || '';
}
//# sourceMappingURL=helpers.js.map
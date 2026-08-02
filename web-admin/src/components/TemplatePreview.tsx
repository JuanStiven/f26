

import { resolveImageUrl } from '../utils/imageUrl';

interface TemplatePreviewProps {
  body: string;
  styles?: string;
  footer?: string;
  className?: string;
  /** Optional data to replace {{variable}} tokens in the preview */
  data?: Record<string, any>;
}

/**
 * Renders an HTML template body with optional custom CSS styles,
 * replacing {{variable}} tokens with sample or provided data.
 */
export function TemplatePreview({ body, styles, footer, className, data }: TemplatePreviewProps) {
  let renderedBody = body || '';
  let renderedFooter = footer || '';

  // Helper function to replace tokens
  const replaceTokens = (text: string) => {
    if (!data) return text;
    return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, label) => {
      const trimmedLabel = label.trim();
      if (data[trimmedLabel] !== undefined) {
        const value = data[trimmedLabel];
        const isImg = typeof value === 'string' && (
          value.startsWith('data:image/') ||
          value.startsWith('file://') ||
          value.startsWith('/uploads/') ||
          value.includes('/uploads/') ||
          /\.(png|jpe?g|gif|webp)$/i.test(value)
        );
        if (isImg) {
          const imgSrc = resolveImageUrl(value);
          return `<img src="${imgSrc}" alt="${trimmedLabel}" style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid #e5e7eb;margin:8px 0;" />`;
        }
        if (typeof value === 'string' && (value.startsWith('<') || value.includes('</') || value.includes('<br'))) {
          return value;
        }
        if (Array.isArray(value)) {
          if (value.length === 0) return '<em style="color:#9ca3af">Tabla sin datos</em>';
          const cols = Object.keys(value[0]);
          let tableHtml = '<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:12px;">';
          tableHtml += '<thead><tr style="background:#f3f4f6;border-bottom:2px solid #e5e7eb;">';
          cols.forEach(c => { tableHtml += `<th style="padding:6px 10px;text-align:left;font-weight:bold;color:#4b5563;">${c}</th>`; });
          tableHtml += '</tr></thead><tbody>';
          value.forEach((row: any) => {
            tableHtml += '<tr style="border-bottom:1px solid #f3f4f6;">';
            cols.forEach(c => { tableHtml += `<td style="padding:6px 10px;color:#374151;">${String(row[c] || '')}</td>`; });
            tableHtml += '</tr>';
          });
          tableHtml += '</tbody></table>';
          return tableHtml;
        }
        return `<strong style="color:#004F9F">${String(value)}</strong>`;
      }
      return `<span style="color:#9ca3af">${match}</span>`;
    });
  };

  renderedBody = replaceTokens(renderedBody);
  renderedFooter = replaceTokens(renderedFooter);

  return (
    <div className={`flex justify-center ${className || ''}`}>
      <div className="w-full max-w-[820px] bg-white text-[#1a1a1a] shadow-sm rounded-md px-12 py-14 flex flex-col justify-between min-h-[500px]">
        <div>
          <style>{styles || ''}</style>
          <div
            className="template-preview-content prose prose-sm max-w-none"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: renderedBody || "<p style='color:#9ca3af'>Vista previa vacía…</p>" }}
          />
        </div>
        
        {renderedFooter && (
          <div className="mt-8 pt-4 border-t border-gray-200">
            <div
              className="text-xs text-gray-500 text-center"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: renderedFooter }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

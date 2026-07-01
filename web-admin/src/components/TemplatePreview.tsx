

interface TemplatePreviewProps {
  body: string;
  styles?: string;
  className?: string;
  /** Optional data to replace {{variable}} tokens in the preview */
  data?: Record<string, any>;
}

/**
 * Renders an HTML template body with optional custom CSS styles,
 * replacing {{variable}} tokens with sample or provided data.
 */
export function TemplatePreview({ body, styles, className, data }: TemplatePreviewProps) {
  let renderedBody = body || '';

  // Replace variable tokens with data if provided
  if (data) {
    renderedBody = renderedBody.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, label) => {
      const trimmedLabel = label.trim();
      if (data[trimmedLabel] !== undefined) {
        const value = data[trimmedLabel];
        if (typeof value === 'string' && (value.startsWith('data:image/') || value.startsWith('file://'))) {
          return `<img src="${value}" alt="${trimmedLabel}" style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid #e5e7eb;margin:8px 0;" />`;
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
  }

  return (
    <div className={`flex justify-center ${className || ''}`}>
      <div className="w-full max-w-[820px] bg-white text-[#1a1a1a] shadow-sm rounded-md px-12 py-14">
        <style>{styles || ''}</style>
        <div
          className="template-preview-content prose prose-sm max-w-none"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: renderedBody || "<p style='color:#9ca3af'>Vista previa vacía…</p>" }}
        />
      </div>
    </div>
  );
}

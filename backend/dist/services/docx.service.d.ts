export declare function parseDocxTemplate(filePath: string): Promise<{
    html: string;
    rawText: string;
    detectedTags: string[];
}>;
export declare function generateDocxFromTemplate(templatePath: string, formData: Record<string, any>, fields?: any[]): Buffer;

import html2pdf from 'html2pdf.js';
import type { InvoiceData } from './types';

export interface PDFGenerationOptions {
  filename?: string;
  download?: boolean;
  returnBlob?: boolean;
}

export async function generateInvoicePDF(
  element: HTMLElement,
  invoiceData: InvoiceData,
  options: PDFGenerationOptions = {}
): Promise<Blob | null> {
  try {
    const invoiceNumber = invoiceData.invoice.number || 'DRAFT';
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = options.filename || `Invoice_${invoiceNumber}_${dateStr}.pdf`;

    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true,
        imageTimeout: 15000,
        allowTaint: false,
        windowWidth: 794,
        onclone: (doc: Document) => {
          doc.querySelectorAll('[data-pdf-hide]').forEach(el => (el as HTMLElement).style.display = 'none');
        },
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    } as const;

    const worker = html2pdf().set(opt).from(element);

    if (options.returnBlob) {
      const blob = await worker.outputPdf('blob');
      return blob as Blob;
    }

    if (options.download !== false) {
      await worker.save();
    }

    return null;
  } catch (error) {
    console.error('[PDF Generator] Error generating PDF:', error);
    throw error;
  }
}

export async function generatePDFBlob(
  element: HTMLElement,
  invoiceData: InvoiceData
): Promise<Blob> {
  const blob = await generateInvoicePDF(element, invoiceData, {
    download: false,
    returnBlob: true
  });

  if (!blob) {
    throw new Error('Failed to generate PDF blob');
  }

  return blob;
}

export function getInvoiceFilename(invoiceNumber: string): string {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `Invoice_${invoiceNumber}_${dateStr}.pdf`;
}

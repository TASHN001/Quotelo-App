import type { InvoiceData } from './types';
import { formatCurrency, type Currency } from './currency';

export interface ShareData {
  title: string;
  text: string;
  url?: string;
  files?: File[];
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

export function canShareFiles(): boolean {
  return canUseNativeShare() && navigator.canShare !== undefined;
}

export async function shareNatively(data: ShareData): Promise<boolean> {
  if (!canUseNativeShare()) {
    return false;
  }

  try {
    if (data.files && data.files.length > 0) {
      if (!navigator.canShare || !navigator.canShare({ files: data.files })) {
        console.log('[Share] Device does not support file sharing');
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url
        });
        return true;
      }
    }

    await navigator.share(data);
    return true;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.log('[Share] User cancelled share');
      return false;
    }
    console.error('[Share] Error sharing:', error);
    return false;
  }
}

export function createInvoiceShareMessage(
  invoiceData: InvoiceData,
  businessName?: string,
  currencyCode: Currency = 'ZAR'
): string {
  const clientName = invoiceData.client.name || 'Client';
  const total = invoiceData.totals.total;
  const invoiceNumber = invoiceData.invoice.number;
  const businessDisplayName = businessName || invoiceData.business.name;
  const formattedTotal = formatCurrency(total, currencyCode);

  return `Invoice ${invoiceNumber} from ${businessDisplayName} for ${clientName}. Total: ${formattedTotal}`;
}

export function openWhatsApp(message: string, phoneNumber?: string): void {
  const encodedMessage = encodeURIComponent(message);
  let url: string;

  if (phoneNumber) {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  } else {
    url = `https://wa.me/?text=${encodedMessage}`;
  }

  window.location.href = url;
}

export async function blobToFile(blob: Blob, filename: string): Promise<File> {
  return new File([blob], filename, { type: blob.type });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

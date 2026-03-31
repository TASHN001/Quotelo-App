import type { InvoiceDraft } from './types';

export async function generateDocumentFromAI(
  documentType: string,
  prompt: string,
  userProfile?: {
    businessName?: string;
    email?: string;
    currency?: string;
  }
): Promise<InvoiceDraft> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-document-from-ai`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      documentType,
      prompt,
      userProfile,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to generate document');
  }

  const data = await response.json();

  if (data.error === true) {
    throw new Error(data.message || 'Failed to generate document');
  }

  return data;
}

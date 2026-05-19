import { supabase } from './supabase';
import type { UserProfile, Business, Client, Document, DocumentTemplate, ChatThread, ChatMessage, DocumentLineItem, InvoiceReminder, UserReminderSettings, SavedLineItem, DocumentVersion, DocumentSnapshot } from './types';

export const db = {
  async checkDatabaseAvailable(): Promise<boolean> {
    try {
      const { error } = await supabase.from('user_profiles').select('id').limit(1);
      if (error) {
        console.error('[DB] Database check failed:', error);
        return false;
      }
      console.log('[DB] Database available');
      return true;
    } catch (error) {
      console.error('[DB] Database check error:', error);
      return false;
    }
  },

  async createUserProfile(userId: string, fullName: string, email: string): Promise<UserProfile | null> {
    console.log('[DB] Creating user profile:', { userId, fullName, email });

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ id: userId, full_name: fullName, email, plan_tier: 'free', onboarding_complete: false })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[DB] Error creating user profile:', error);
      return null;
    }

    console.log('[DB] User profile created successfully:', data);
    return data;
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
    return data;
  },

  async updateUserProfileTheme(userId: string, theme: 'light' | 'dark' | 'system'): Promise<UserProfile | null> {
    return await this.updateUserProfile(userId, { theme_preference: theme });
  },

  async updateUserProfileLanguage(userId: string, language: string): Promise<UserProfile | null> {
    return await this.updateUserProfile(userId, { language });
  },

  async upsertUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> {
    console.log('[DB] Upserting user profile:', { userId, profileData });

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ id: userId, ...profileData }, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[DB] Error upserting user profile:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    console.log('[DB] User profile upserted successfully:', data);
    return data;
  },

  async createBusiness(userId: string, businessData: Omit<Business, 'id' | 'user_id' | 'created_at'>): Promise<Business | null> {
    const { data, error } = await supabase
      .from('businesses')
      .insert({ ...businessData, user_id: userId })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating business:', error);
      return null;
    }
    return data;
  },

  async getUserBusinesses(userId: string): Promise<Business[]> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching businesses:', error);
      return [];
    }
    return data || [];
  },

  async updateBusiness(businessId: string, updates: Partial<Business>): Promise<Business | null> {
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', businessId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating business:', error);
      return null;
    }
    return data;
  },

  async updateBusinessCurrency(businessId: string, currency: string): Promise<Business | null> {
    return await this.updateBusiness(businessId, { default_currency: currency });
  },

  async upsertBusiness(userId: string, businessData: Partial<Business>): Promise<Business | null> {
    console.log('[DB] Upserting business:', { userId, businessData });

    const businesses = await this.getUserBusinesses(userId);

    if (businesses.length > 0) {
      const existingBusiness = businesses[0];
      console.log('[DB] Updating existing business:', existingBusiness.id);

      const { data, error } = await supabase
        .from('businesses')
        .update(businessData)
        .eq('id', existingBusiness.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('[DB] Error updating business:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      console.log('[DB] Business updated successfully:', data);
      return data;
    } else {
      console.log('[DB] Creating new business for user:', userId);

      const { data, error } = await supabase
        .from('businesses')
        .insert({ ...businessData, user_id: userId })
        .select()
        .maybeSingle();

      if (error) {
        console.error('[DB] Error creating business:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      console.log('[DB] Business created successfully:', data);
      return data;
    }
  },

  async getTemplates(planTier: 'free' | 'pro', documentType: string): Promise<DocumentTemplate[]> {
    let query = supabase
      .from('document_templates')
      .select('*')
      .eq('document_type', documentType);

    if (planTier === 'free') {
      query = query.eq('is_free', true);
    }

    const { data, error } = await query.order('is_default', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
    return data || [];
  },

  async createDocument(userId: string, documentData: Omit<Document, 'id' | 'user_id' | 'created_at'>): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .insert({ ...documentData, user_id: userId })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating document:', error);
      return null;
    }
    return data;
  },

  async getUserDocuments(userId: string, limit?: number): Promise<Document[]> {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
    return data || [];
  },

  async getDocument(documentId: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching document:', error);
      return null;
    }
    return data;
  },

  async updateDocument(documentId: string, updates: Partial<Document>): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating document:', error);
      return null;
    }
    return data;
  },

  async createLineItem(lineItemData: Omit<DocumentLineItem, 'id'>): Promise<DocumentLineItem | null> {
    const { data, error } = await supabase
      .from('document_line_items')
      .insert(lineItemData)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating line item:', error);
      return null;
    }
    return data;
  },

  async getDocumentLineItems(documentId: string): Promise<DocumentLineItem[]> {
    const { data, error } = await supabase
      .from('document_line_items')
      .select('*')
      .eq('document_id', documentId);

    if (error) {
      console.error('Error fetching line items:', error);
      return [];
    }
    return data || [];
  },

  async deleteDocumentLineItems(documentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('document_line_items')
      .delete()
      .eq('document_id', documentId);

    if (error) {
      console.error('Error deleting line items:', error);
      return false;
    }
    return true;
  },

  async addDocumentLineItem(documentId: string, lineItem: { name: string; quantity: number; unit_price: number; line_total: number }): Promise<DocumentLineItem | null> {
    return this.createLineItem({
      document_id: documentId,
      ...lineItem
    });
  },

  async createChatThread(userId: string, documentType: string): Promise<ChatThread | null> {
    const { data, error } = await supabase
      .from('chat_threads')
      .insert({ user_id: userId, document_type: documentType })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating chat thread:', error);
      return null;
    }
    return data;
  },

  async getUserChatThreads(userId: string, documentType?: string): Promise<ChatThread[]> {
    let query = supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', userId);

    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat threads:', error);
      return [];
    }
    return data || [];
  },

  async createChatMessage(threadId: string, role: ChatMessage['role'], content: string): Promise<ChatMessage | null> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ thread_id: threadId, role, content })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating chat message:', error);
      return null;
    }
    return data;
  },

  async getThreadMessages(threadId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
    return data || [];
  },

  async saveInvoiceWithLineItems(
    userId: string,
    businessId: string,
    invoiceData: {
      documentType: string;
      documentNumber: string;
      status: 'draft' | 'sent' | 'paid' | 'cancelled';
      clientName: string;
      clientEmail: string;
      clientPhone?: string;
      clientAddress?: string;
      issueDate: string;
      dueDate: string;
      subtotal: number;
      taxTotal: number;
      total: number;
      notes?: string;
      reference?: string;
      paymentDetails?: string;
      paymentTerms?: string;
      footerMessage?: string;
      templateKey?: string;
      clientId?: string;
    },
    lineItems: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      lineTotal: number;
    }>
  ): Promise<{ document: Document | null; success: boolean; error?: string }> {
    console.log('[DB] Saving invoice with line items:', { userId, businessId, invoiceData, lineItems });

    const clientId = invoiceData.clientId || await this.upsertClientFromInvoice(
      userId,
      businessId,
      invoiceData.clientName,
      invoiceData.clientEmail
    );

    console.log('[DB] Client ID for invoice:', clientId);

    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        business_id: businessId,
        client_id: clientId,
        document_type: invoiceData.documentType,
        document_number: invoiceData.documentNumber,
        status: invoiceData.status,
        client_name: invoiceData.clientName,
        client_email: invoiceData.clientEmail,
        client_phone: invoiceData.clientPhone,
        client_address: invoiceData.clientAddress,
        issue_date: invoiceData.issueDate,
        due_date: invoiceData.dueDate,
        subtotal: invoiceData.subtotal,
        tax_total: invoiceData.taxTotal,
        total: invoiceData.total,
        notes: invoiceData.notes,
        reference: invoiceData.reference,
        payment_details: invoiceData.paymentDetails,
        payment_terms: invoiceData.paymentTerms,
        footer_message: invoiceData.footerMessage,
        template_key: invoiceData.templateKey
      })
      .select()
      .maybeSingle();

    if (docError || !document) {
      console.error('[DB] Error creating document:', docError);
      return { document: null, success: false, error: docError?.message || 'Failed to create document' };
    }

    console.log('[DB] Document created successfully:', document.id);

    const lineItemsToInsert = lineItems.map(item => ({
      document_id: document.id,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate,
      line_total: item.lineTotal
    }));

    const { error: lineItemsError } = await supabase
      .from('document_line_items')
      .insert(lineItemsToInsert);

    if (lineItemsError) {
      console.error('[DB] Error creating line items:', lineItemsError);

      await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      console.log('[DB] Rolled back document creation due to line items error');
      return { document: null, success: false, error: lineItemsError.message || 'Failed to create line items' };
    }

    console.log('[DB] Line items created successfully');
    return { document, success: true };
  },

  async upsertClientFromInvoice(
    userId: string,
    businessId: string | undefined,
    billToName: string,
    billToEmail?: string,
    billToPhone?: string,
    billToAddress?: string
  ): Promise<string | null> {
    console.log('[DB] Upserting client from invoice:', { userId, billToName });

    const normalizedName = billToName.trim();
    if (!normalizedName) {
      console.log('[DB] Client name is empty, skipping upsert');
      return null;
    }

    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .eq('name', normalizedName)
      .maybeSingle();

    if (fetchError) {
      console.error('[DB] Error fetching client:', fetchError);
      return null;
    }

    if (existingClient) {
      console.log('[DB] Client exists, updating fields:', existingClient.id);

      const updates: Partial<Client> = {
        updated_at: new Date().toISOString()
      };

      if (billToEmail && !existingClient.email) {
        updates.email = billToEmail;
      }
      if (billToPhone && !existingClient.phone) {
        updates.phone = billToPhone;
      }
      if (billToAddress && !existingClient.billing_address) {
        updates.billing_address = billToAddress;
      }

      const { error: updateError } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', existingClient.id);

      if (updateError) {
        console.error('[DB] Error updating client:', updateError);
      }

      return existingClient.id;
    } else {
      console.log('[DB] Creating new client:', normalizedName);

      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          business_id: businessId,
          name: normalizedName,
          email: billToEmail,
          phone: billToPhone,
          billing_address: billToAddress
        })
        .select()
        .maybeSingle();

      if (createError || !newClient) {
        console.error('[DB] Error creating client:', createError);
        return null;
      }

      console.log('[DB] Client created successfully:', newClient.id);
      return newClient.id;
    }
  },

  async getUserClients(userId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      console.error('[DB] Error fetching clients:', error);
      return [];
    }
    return data || [];
  },

  async getClient(clientId: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();

    if (error) {
      console.error('[DB] Error fetching client:', error);
      return null;
    }
    return data;
  },

  async getClientDocuments(clientId: string, userId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DB] Error fetching client documents:', error);
      return [];
    }
    return data || [];
  },

  async getUserDocumentCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('[DB] Error counting user documents:', error);
      return 0;
    }
    return count || 0;
  },

  async getClientInvoiceCount(clientId: string, userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('user_id', userId);

    if (error) {
      console.error('[DB] Error counting client invoices:', error);
      return 0;
    }
    return count || 0;
  },

  async getNextDocumentNumber(userId: string, clientId?: string | null): Promise<string> {
    let query = supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('[DB] Error counting documents for number generation:', error);
      return `INV-${Date.now().toString().slice(-6)}`;
    }

    return `INV-${String((count || 0) + 1).padStart(3, '0')}`;
  },

  async createClient(
    userId: string,
    businessId: string | undefined,
    clientData: {
      name: string;
      email?: string;
      phone?: string;
      client_currency?: string;
      billing_address?: string;
      tax_number?: string;
      notes?: string;
    }
  ): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: userId,
        business_id: businessId,
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        client_currency: clientData.client_currency,
        billing_address: clientData.billing_address,
        tax_number: clientData.tax_number,
        notes: clientData.notes
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[DB] Error creating client:', error);
      return null;
    }
    return data;
  },

  async updateClient(clientId: string, updates: Partial<Client>): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[DB] Error updating client:', error);
      return null;
    }
    return data;
  },

  async deleteClient(clientId: string): Promise<boolean> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) {
      console.error('[DB] Error deleting client:', error);
      return false;
    }
    return true;
  },

  async getClientOutstandingBalance(clientId: string, userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('documents')
      .select('total')
      .eq('client_id', clientId)
      .eq('user_id', userId)
      .in('status', ['draft', 'sent']);

    if (error) {
      console.error('[DB] Error calculating outstanding balance:', error);
      return 0;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    return data.reduce((sum, doc) => sum + doc.total, 0);
  },

  async getUserTemplatePreferences(userId: string): Promise<Array<{
    template_key: string;
    is_favorite: boolean;
    is_default: boolean;
  }>> {
    const { data, error } = await supabase
      .from('user_template_preferences')
      .select('template_key, is_favorite, is_default')
      .eq('user_id', userId);

    if (error) {
      console.error('[DB] Error fetching template preferences:', error);
      return [];
    }
    return data || [];
  },

  async toggleTemplateFavorite(userId: string, templateKey: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('user_template_preferences')
      .select('id, is_favorite')
      .eq('user_id', userId)
      .eq('template_key', templateKey)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('user_template_preferences')
        .update({
          is_favorite: !existing.is_favorite,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error('[DB] Error toggling favorite:', error);
        return false;
      }
      return true;
    } else {
      const { error } = await supabase
        .from('user_template_preferences')
        .insert({
          user_id: userId,
          template_key: templateKey,
          is_favorite: true,
          is_default: false
        });

      if (error) {
        console.error('[DB] Error creating favorite:', error);
        return false;
      }
      return true;
    }
  },

  async setDefaultTemplate(userId: string, templateKey: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('user_template_preferences')
      .select('id')
      .eq('user_id', userId)
      .eq('template_key', templateKey)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('user_template_preferences')
        .update({
          is_default: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error('[DB] Error setting default:', error);
        return false;
      }
      return true;
    } else {
      const { error } = await supabase
        .from('user_template_preferences')
        .insert({
          user_id: userId,
          template_key: templateKey,
          is_favorite: false,
          is_default: true
        });

      if (error) {
        console.error('[DB] Error creating default:', error);
        return false;
      }
      return true;
    }
  },

  async getDefaultTemplate(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('user_template_preferences')
      .select('template_key')
      .eq('user_id', userId)
      .eq('is_default', true)
      .maybeSingle();

    if (error) {
      console.error('[DB] Error fetching default template:', error);
      return null;
    }
    return data?.template_key || null;
  },

  async updateDocumentStatus(documentId: string, status: Document['status'], paidDate?: string): Promise<Document | null> {
    const updates: Partial<Document> = { status };

    if (status === 'paid' && paidDate) {
      updates.paid_date = paidDate;
    }

    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[DB] Error updating document status:', error);
      return null;
    }
    return data;
  },

  async duplicateDocument(documentId: string, newDocumentNumber: string): Promise<{ document: Document | null; success: boolean; error?: string }> {
    const originalDoc = await this.getDocument(documentId);
    if (!originalDoc) {
      return { document: null, success: false, error: 'Original document not found' };
    }

    const lineItems = await this.getDocumentLineItems(documentId);

    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const { data: newDoc, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: originalDoc.user_id,
        business_id: originalDoc.business_id,
        client_id: originalDoc.client_id,
        document_type: originalDoc.document_type,
        document_number: newDocumentNumber,
        status: 'draft',
        client_name: originalDoc.client_name,
        client_email: originalDoc.client_email,
        client_phone: originalDoc.client_phone,
        client_address: originalDoc.client_address,
        issue_date: today,
        due_date: dueDateStr,
        subtotal: originalDoc.subtotal,
        tax_total: originalDoc.tax_total,
        total: originalDoc.total,
        currency: originalDoc.currency,
        notes: originalDoc.notes,
        reference: originalDoc.reference,
        payment_details: originalDoc.payment_details,
        payment_terms: originalDoc.payment_terms,
        footer_message: originalDoc.footer_message,
        template_key: originalDoc.template_key
      })
      .select()
      .maybeSingle();

    if (docError || !newDoc) {
      console.error('[DB] Error duplicating document:', docError);
      return { document: null, success: false, error: docError?.message || 'Failed to duplicate document' };
    }

    const lineItemsToInsert = lineItems.map(item => ({
      document_id: newDoc.id,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      line_total: item.line_total
    }));

    const { error: lineItemsError } = await supabase
      .from('document_line_items')
      .insert(lineItemsToInsert);

    if (lineItemsError) {
      console.error('[DB] Error duplicating line items:', lineItemsError);
      await supabase.from('documents').delete().eq('id', newDoc.id);
      return { document: null, success: false, error: lineItemsError.message || 'Failed to duplicate line items' };
    }

    return { document: newDoc, success: true };
  },

  async getUserReminderSettings(userId: string): Promise<UserReminderSettings | null> {
    const { data, error } = await supabase
      .from('user_reminder_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[DB] Error fetching reminder settings:', error);
      return null;
    }
    return data;
  },

  async upsertUserReminderSettings(userId: string, settings: Partial<UserReminderSettings>): Promise<UserReminderSettings | null> {
    const { data, error } = await supabase
      .from('user_reminder_settings')
      .upsert(
        {
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error('[DB] Error upserting reminder settings:', error);
      return null;
    }
    return data;
  },

  async createReminder(documentId: string, reminderType: InvoiceReminder['reminder_type']): Promise<InvoiceReminder | null> {
    const { data, error } = await supabase
      .from('invoice_reminders')
      .insert({
        document_id: documentId,
        reminder_type: reminderType
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[DB] Error creating reminder:', error);
      return null;
    }

    await this.updateDocument(documentId, {
      last_reminder_sent_at: new Date().toISOString()
    });

    return data;
  },

  async dismissReminder(reminderId: string): Promise<boolean> {
    const { error } = await supabase
      .from('invoice_reminders')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', reminderId);

    if (error) {
      console.error('[DB] Error dismissing reminder:', error);
      return false;
    }
    return true;
  },

  async getDocumentReminders(documentId: string): Promise<InvoiceReminder[]> {
    const { data, error } = await supabase
      .from('invoice_reminders')
      .select('*')
      .eq('document_id', documentId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('[DB] Error fetching document reminders:', error);
      return [];
    }
    return data || [];
  },

  async getUserReminders(userId: string): Promise<InvoiceReminder[]> {
    const { data, error } = await supabase
      .from('invoice_reminders')
      .select(`
        *,
        documents!inner(user_id)
      `)
      .eq('documents.user_id', userId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('[DB] Error fetching user reminders:', error);
      return [];
    }
    return data || [];
  },

  async getSavedLineItems(userId: string, includeArchived = false): Promise<SavedLineItem[]> {
    let query = supabase
      .from('saved_line_items')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[DB] Error fetching saved line items:', error);
      return [];
    }
    return data || [];
  },

  async createSavedLineItem(userId: string, item: {
    name: string;
    default_quantity?: number;
    default_unit_price?: number;
    default_tax_rate?: number;
    category?: string;
  }): Promise<SavedLineItem | null> {
    const { data, error } = await supabase
      .from('saved_line_items')
      .insert({
        user_id: userId,
        name: item.name,
        default_quantity: item.default_quantity || 1,
        default_unit_price: item.default_unit_price || 0,
        default_tax_rate: item.default_tax_rate || 0,
        category: item.category
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[DB] Error creating saved line item:', error);
      return null;
    }
    return data;
  },

  async updateSavedLineItem(itemId: string, updates: Partial<SavedLineItem>): Promise<SavedLineItem | null> {
    const { data, error } = await supabase
      .from('saved_line_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[DB] Error updating saved line item:', error);
      return null;
    }
    return data;
  },

  async archiveSavedLineItem(itemId: string): Promise<boolean> {
    const { error } = await supabase
      .from('saved_line_items')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', itemId);

    if (error) {
      console.error('[DB] Error archiving saved line item:', error);
      return false;
    }
    return true;
  },

  async restoreSavedLineItem(itemId: string): Promise<boolean> {
    const { error } = await supabase
      .from('saved_line_items')
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq('id', itemId);

    if (error) {
      console.error('[DB] Error restoring saved line item:', error);
      return false;
    }
    return true;
  },

  async deleteSavedLineItem(itemId: string): Promise<boolean> {
    const { error } = await supabase
      .from('saved_line_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('[DB] Error deleting saved line item:', error);
      return false;
    }
    return true;
  },

  async createDocumentVersion(documentId: string, userId: string, snapshot: DocumentSnapshot): Promise<DocumentVersion | null> {
    const { data: latestVersion } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersionNumber = (latestVersion?.version_number || 0) + 1;

    const { data, error } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        version_number: nextVersionNumber,
        snapshot: snapshot as unknown as Record<string, unknown>,
        created_by: userId
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[DB] Error creating document version:', error);
      return null;
    }

    const { error: deleteOldError } = await supabase
      .from('document_versions')
      .delete()
      .eq('document_id', documentId)
      .lt('version_number', nextVersionNumber - 4);

    if (deleteOldError) {
      console.error('[DB] Error cleaning old versions:', deleteOldError);
    }

    return data ? { ...data, snapshot: data.snapshot as unknown as DocumentSnapshot } : null;
  },

  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .limit(5);

    if (error) {
      console.error('[DB] Error fetching document versions:', error);
      return [];
    }
    return (data || []).map(v => ({ ...v, snapshot: v.snapshot as unknown as DocumentSnapshot }));
  },

  async restoreDocumentVersion(documentId: string, versionId: string): Promise<boolean> {
    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .select('snapshot')
      .eq('id', versionId)
      .maybeSingle();

    if (versionError || !version) {
      console.error('[DB] Error fetching version to restore:', versionError);
      return false;
    }

    const snapshot = version.snapshot as unknown as DocumentSnapshot;

    const { error: updateError } = await supabase
      .from('documents')
      .update(snapshot.document)
      .eq('id', documentId);

    if (updateError) {
      console.error('[DB] Error restoring document:', updateError);
      return false;
    }

    await this.deleteDocumentLineItems(documentId);

    for (const item of snapshot.line_items) {
      await supabase
        .from('document_line_items')
        .insert({
          document_id: documentId,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          line_total: item.line_total,
          sort_order: item.sort_order || 0
        });
    }

    return true;
  },

  async updateDocumentLineItem(itemId: string, updates: Partial<DocumentLineItem>): Promise<DocumentLineItem | null> {
    const { data, error } = await supabase
      .from('document_line_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[DB] Error updating line item:', error);
      return null;
    }
    return data;
  },

  async archiveDocumentLineItem(itemId: string): Promise<boolean> {
    const { error } = await supabase
      .from('document_line_items')
      .update({ is_archived: true })
      .eq('id', itemId);

    if (error) {
      console.error('[DB] Error archiving line item:', error);
      return false;
    }
    return true;
  },

  async restoreDocumentLineItem(itemId: string): Promise<boolean> {
    const { error } = await supabase
      .from('document_line_items')
      .update({ is_archived: false })
      .eq('id', itemId);

    if (error) {
      console.error('[DB] Error restoring line item:', error);
      return false;
    }
    return true;
  },

  async reorderDocumentLineItems(items: { id: string; sort_order: number }[]): Promise<boolean> {
    for (const item of items) {
      const { error } = await supabase
        .from('document_line_items')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id);

      if (error) {
        console.error('[DB] Error reordering line item:', error);
        return false;
      }
    }
    return true;
  }
};

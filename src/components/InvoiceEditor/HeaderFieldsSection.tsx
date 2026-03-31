import { useState, useRef } from 'react';
import { Building2, User, MapPin, Calendar, Hash, Upload, X, ChevronDown, ChevronUp, Truck, Image, PenTool } from 'lucide-react';
import { DatePickerModal } from '../DatePickerModal';
import CurrencySelect from '../CurrencySelect';
import { supabase } from '../../lib/supabase';
import type { Document, Business } from '../../lib/types';

interface HeaderFieldsSectionProps {
  document: Document;
  business: Business | null;
  onUpdate: (updates: Partial<Document>) => void;
  onUpdateBusinessLogo?: (logoUrl: string) => void;
}

export function HeaderFieldsSection({ document, business, onUpdate, onUpdateBusinessLogo }: HeaderFieldsSectionProps) {
  const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showShipTo, setShowShipTo] = useState(document.show_ship_to || false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [showLogoSyncPrompt, setShowLogoSyncPrompt] = useState(false);
  const [pendingLogoUrl, setPendingLogoUrl] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    onUpdate({ custom_logo_url: localPreviewUrl });

    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${document.user_id}/logos/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      onUpdate({ custom_logo_url: publicUrl });
      setPendingLogoUrl(publicUrl);
      setShowLogoSyncPrompt(true);
    } catch (error) {
      console.error('Error uploading logo:', error);
      onUpdate({ custom_logo_url: undefined });
    } finally {
      setIsUploadingLogo(false);
      URL.revokeObjectURL(localPreviewUrl);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSignature(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${document.user_id}/signatures/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      onUpdate({ custom_signature_url: publicUrl });
    } catch (error) {
      console.error('Error uploading signature:', error);
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const confirmLogoUpload = (syncToProfile: boolean) => {
    if (pendingLogoUrl && syncToProfile && onUpdateBusinessLogo) {
      onUpdateBusinessLogo(pendingLogoUrl);
    }
    setShowLogoSyncPrompt(false);
    setPendingLogoUrl(null);
  };

  const toggleShipTo = () => {
    const newValue = !showShipTo;
    setShowShipTo(newValue);
    onUpdate({ show_ship_to: newValue });
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Logo</label>
          <div className="relative w-20 h-20">
            <div
              onClick={() => logoInputRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors overflow-hidden"
            >
              {isUploadingLogo ? (
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              ) : document.custom_logo_url || business?.logo_url ? (
                <img
                  src={document.custom_logo_url || business?.logo_url}
                  alt="Logo"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="text-center">
                  <Image className="w-6 h-6 text-gray-400 mx-auto" />
                  <span className="text-[10px] text-gray-400">Upload</span>
                </div>
              )}
            </div>
            {document.custom_logo_url && !isUploadingLogo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ custom_logo_url: undefined });
                }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
              Invoice Number
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={document.document_number}
                onChange={(e) => onUpdate({ document_number: e.target.value })}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                Issue Date
              </label>
              <button
                onClick={() => setShowIssueDatePicker(true)}
                className="w-full flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{document.issue_date}</span>
              </button>
            </div>

            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                Due Date
              </label>
              <button
                onClick={() => setShowDueDatePicker(true)}
                className="w-full flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{document.due_date}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Building2 className="w-4 h-4" />
            From (Your Business)
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Business Name</label>
            <input
              type="text"
              value={business?.business_name || ''}
              disabled
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input
              type="email"
              value={business?.email || ''}
              disabled
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Phone</label>
            <input
              type="tel"
              value={business?.phone || ''}
              disabled
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600"
            />
          </div>

          {business?.vat_number && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">VAT Number</label>
              <input
                type="text"
                value={business.vat_number}
                disabled
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600"
              />
            </div>
          )}
        </div>

        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <User className="w-4 h-4" />
            Bill To (Client)
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Client Name</label>
            <input
              type="text"
              value={document.client_name}
              onChange={(e) => onUpdate({ client_name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input
              type="email"
              value={document.client_email}
              onChange={(e) => onUpdate({ client_email: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Phone</label>
            <input
              type="tel"
              value={document.client_phone || ''}
              onChange={(e) => onUpdate({ client_phone: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Address</label>
            <textarea
              value={document.client_address || ''}
              onChange={(e) => onUpdate({ client_address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={toggleShipTo}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Truck className="w-4 h-4" />
            Ship To (Different Address)
          </div>
          {showShipTo ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showShipTo && (
          <div className="p-4 space-y-3 bg-white">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Recipient Name</label>
              <input
                type="text"
                value={document.ship_to_name || ''}
                onChange={(e) => onUpdate({ ship_to_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Shipping Address</label>
              <textarea
                value={document.ship_to_address || ''}
                onChange={(e) => onUpdate({ ship_to_address: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Phone</label>
              <input
                type="tel"
                value={document.ship_to_phone || ''}
                onChange={(e) => onUpdate({ ship_to_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
            PO Number (Optional)
          </label>
          <input
            type="text"
            value={document.po_number || ''}
            onChange={(e) => onUpdate({ po_number: e.target.value })}
            placeholder="Purchase Order Number"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
            Reference (Optional)
          </label>
          <input
            type="text"
            value={document.reference || ''}
            onChange={(e) => onUpdate({ reference: e.target.value })}
            placeholder="Reference number"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
            Currency
          </label>
          <CurrencySelect
            value={(document.currency || 'USD') as any}
            onChange={(currency) => onUpdate({ currency })}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
            Currency Format
          </label>
          <select
            value={document.currency_display_format || 'symbol_first'}
            onChange={(e) => onUpdate({ currency_display_format: e.target.value as 'symbol_first' | 'code_first' })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
          >
            <option value="symbol_first">$100.00 (Symbol First)</option>
            <option value="code_first">100.00 USD (Code After)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Signature</label>
        <div className="flex gap-4">
          <div
            onClick={() => signatureInputRef.current?.click()}
            className="flex-1 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors overflow-hidden"
          >
            {isUploadingSignature ? (
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            ) : document.custom_signature_url ? (
              <img
                src={document.custom_signature_url}
                alt="Signature"
                className="max-h-20 object-contain"
              />
            ) : (
              <div className="text-center">
                <PenTool className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <span className="text-xs text-gray-400">Upload Signature</span>
              </div>
            )}
          </div>
          {document.custom_signature_url && (
            <button
              onClick={() => onUpdate({ custom_signature_url: undefined })}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors self-start"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <input
          ref={signatureInputRef}
          type="file"
          accept="image/*"
          onChange={handleSignatureUpload}
          className="hidden"
        />
      </div>

      {showIssueDatePicker && (
        <DatePickerModal
          value={document.issue_date}
          onSelect={(date) => {
            onUpdate({ issue_date: date });
            setShowIssueDatePicker(false);
          }}
          onClose={() => setShowIssueDatePicker(false)}
        />
      )}

      {showDueDatePicker && (
        <DatePickerModal
          value={document.due_date}
          onSelect={(date) => {
            onUpdate({ due_date: date });
            setShowDueDatePicker(false);
          }}
          onClose={() => setShowDueDatePicker(false)}
        />
      )}

      {showLogoSyncPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Update Profile Logo?</h3>
            <p className="text-gray-600 mb-6">
              Would you like to update your business profile logo to match this one?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => confirmLogoUpload(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                No, Just This Invoice
              </button>
              <button
                onClick={() => confirmLogoUpload(true)}
                className="flex-1 py-2 px-4 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 text-white rounded-lg font-medium"
              >
                Yes, Update Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

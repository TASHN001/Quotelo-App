import { useState, useRef } from 'react';
import { Building2, User, Calendar, Hash, X, ChevronDown, ChevronUp, Truck, Image, PenTool } from 'lucide-react';
import { DatePickerModal } from '../DatePickerModal';
import CurrencySelect from '../CurrencySelect';
import { supabase } from '../../lib/supabase';
import { ds } from '../../lib/designSystem';
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
    <div className="space-y-5 pt-4">
      {/* Logo + Document Number + Dates */}
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>Logo</p>
          <div className="relative w-20 h-20">
            <div
              onClick={() => logoInputRef.current?.click()}
              className={`w-20 h-20 border-2 border-dashed border-[#c7c7cc] rounded-xl flex items-center justify-center cursor-pointer ${ds.transition} hover:border-[#f97316] hover:bg-[#fff3e8] overflow-hidden`}
            >
              {isUploadingLogo ? (
                <div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
              ) : document.custom_logo_url || business?.logo_url ? (
                <img
                  src={document.custom_logo_url || business?.logo_url}
                  alt="Logo"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="text-center">
                  <Image className="w-6 h-6 text-[#c7c7cc] mx-auto" />
                  <span className="text-[10px] text-[#c7c7cc]">Upload</span>
                </div>
              )}
            </div>
            {document.custom_logo_url && !isUploadingLogo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ custom_logo_url: undefined });
                }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-[#ff3b30] text-white rounded-full flex items-center justify-center shadow-sm"
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
            <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>
              Invoice Number
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
              <input
                type="text"
                value={document.document_number}
                onChange={(e) => onUpdate({ document_number: e.target.value })}
                className={`${ds.input} pl-10`}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>
                Issue Date
              </label>
              <button
                onClick={() => setShowIssueDatePicker(true)}
                className={`${ds.input} flex items-center gap-2 text-left`}
              >
                <Calendar className="w-4 h-4 text-[#8e8e93] flex-shrink-0" />
                <span className="text-black">{document.issue_date}</span>
              </button>
            </div>

            <div className="flex-1">
              <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>
                Due Date
              </label>
              <button
                onClick={() => setShowDueDatePicker(true)}
                className={`${ds.input} flex items-center gap-2 text-left`}
              >
                <Calendar className="w-4 h-4 text-[#8e8e93] flex-shrink-0" />
                <span className="text-black">{document.due_date}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* From / Bill To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3 p-4 bg-white rounded-xl border border-[#f2f2f7]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#8e8e93]" />
            <p className={`${ds.caption} text-[#8e8e93]`}>From (Your Business)</p>
          </div>

          <div>
            <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>Business Name</label>
            <input
              type="text"
              value={business?.business_name || ''}
              disabled
              className={`${ds.input} opacity-50 cursor-not-allowed`}
            />
          </div>

          <div>
            <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>Email</label>
            <input
              type="email"
              value={business?.email || ''}
              disabled
              className={`${ds.input} opacity-50 cursor-not-allowed`}
            />
          </div>

          <div>
            <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>Phone</label>
            <input
              type="tel"
              value={business?.phone || ''}
              disabled
              className={`${ds.input} opacity-50 cursor-not-allowed`}
            />
          </div>

          {business?.vat_number && (
            <div>
              <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>VAT Number</label>
              <input
                type="text"
                value={business.vat_number}
                disabled
                className={`${ds.input} opacity-50 cursor-not-allowed`}
              />
            </div>
          )}
        </div>

        <div className="space-y-3 p-4 bg-white rounded-xl border border-[#f2f2f7]">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#8e8e93]" />
            <p className={`${ds.caption} text-[#8e8e93]`}>Bill To (Client)</p>
          </div>

          <div>
            <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>Client Name</label>
            <input
              type="text"
              value={document.client_name}
              onChange={(e) => onUpdate({ client_name: e.target.value })}
              className={ds.input}
            />
          </div>

          <div>
            <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>Email</label>
            <input
              type="email"
              value={document.client_email}
              onChange={(e) => onUpdate({ client_email: e.target.value })}
              className={ds.input}
            />
          </div>

          <div>
            <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>Phone</label>
            <input
              type="tel"
              value={document.client_phone || ''}
              onChange={(e) => onUpdate({ client_phone: e.target.value })}
              className={ds.input}
            />
          </div>

          <div>
            <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>Address</label>
            <textarea
              value={document.client_address || ''}
              onChange={(e) => onUpdate({ client_address: e.target.value })}
              rows={2}
              className={`${ds.input} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Ship To */}
      <div className="bg-white rounded-xl border border-[#f2f2f7] overflow-hidden">
        <button
          onClick={toggleShipTo}
          className={`w-full flex items-center justify-between px-4 py-3 ${ds.transition}`}
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#8e8e93]" />
            <span className={`${ds.callout} text-black font-medium`}>Ship To (Different Address)</span>
          </div>
          {showShipTo ? (
            <ChevronUp className="w-4 h-4 text-[#8e8e93]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8e8e93]" />
          )}
        </button>

        {showShipTo && (
          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#f2f2f7]">
            <div>
              <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>Recipient Name</label>
              <input
                type="text"
                value={document.ship_to_name || ''}
                onChange={(e) => onUpdate({ ship_to_name: e.target.value })}
                className={ds.input}
              />
            </div>

            <div>
              <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>Shipping Address</label>
              <textarea
                value={document.ship_to_address || ''}
                onChange={(e) => onUpdate({ ship_to_address: e.target.value })}
                rows={2}
                className={`${ds.input} resize-none`}
              />
            </div>

            <div>
              <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>Phone</label>
              <input
                type="tel"
                value={document.ship_to_phone || ''}
                onChange={(e) => onUpdate({ ship_to_phone: e.target.value })}
                className={ds.input}
              />
            </div>
          </div>
        )}
      </div>

      {/* PO + Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>
            PO Number (Optional)
          </label>
          <input
            type="text"
            value={document.po_number || ''}
            onChange={(e) => onUpdate({ po_number: e.target.value })}
            placeholder="Purchase Order Number"
            className={ds.input}
          />
        </div>

        <div>
          <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>
            Reference (Optional)
          </label>
          <input
            type="text"
            value={document.reference || ''}
            onChange={(e) => onUpdate({ reference: e.target.value })}
            placeholder="Reference number"
            className={ds.input}
          />
        </div>
      </div>

      {/* Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>
            Currency
          </label>
          <CurrencySelect
            value={(document.currency || 'USD') as any}
            onChange={(currency) => onUpdate({ currency })}
          />
        </div>

        <div>
          <label className={`${ds.caption} text-[#8e8e93] mb-1 block`}>
            Currency Format
          </label>
          <select
            value={document.currency_display_format || 'symbol_first'}
            onChange={(e) => onUpdate({ currency_display_format: e.target.value as 'symbol_first' | 'code_first' })}
            className={ds.input}
          >
            <option value="symbol_first">$100.00 (Symbol First)</option>
            <option value="code_first">100.00 USD (Code After)</option>
          </select>
        </div>
      </div>

      {/* Signature */}
      <div>
        <label className={`${ds.caption} text-[#8e8e93] mb-2 block`}>Signature</label>
        <div className="flex gap-4">
          <div
            onClick={() => signatureInputRef.current?.click()}
            className={`flex-1 h-24 border-2 border-dashed border-[#c7c7cc] rounded-xl flex items-center justify-center cursor-pointer ${ds.transition} hover:border-[#f97316] hover:bg-[#fff3e8] overflow-hidden`}
          >
            {isUploadingSignature ? (
              <div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
            ) : document.custom_signature_url ? (
              <img
                src={document.custom_signature_url}
                alt="Signature"
                className="max-h-20 object-contain"
              />
            ) : (
              <div className="text-center">
                <PenTool className="w-6 h-6 text-[#c7c7cc] mx-auto mb-1" />
                <span className={`${ds.footnote} text-[#c7c7cc]`}>Upload Signature</span>
              </div>
            )}
          </div>
          {document.custom_signature_url && (
            <button
              onClick={() => onUpdate({ custom_signature_url: undefined })}
              className={`p-2 text-[#8e8e93] hover:text-[#ff3b30] ${ds.transition} self-start`}
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
            <h3 className={`${ds.title3} text-black mb-2`}>Update Profile Logo?</h3>
            <p className={`${ds.callout} text-[#8e8e93] mb-6`}>
              Would you like to update your business profile logo to match this one?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => confirmLogoUpload(false)}
                className={`flex-1 ${ds.btnSecondary} py-3 text-[15px]`}
              >
                No, Just This Invoice
              </button>
              <button
                onClick={() => confirmLogoUpload(true)}
                className={`flex-1 ${ds.btnPrimary} py-3 text-[15px]`}
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

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import { ds } from '../lib/designSystem';
import { Business } from '../lib/types';
import { storage } from '../lib/storage';
import { INDUSTRY_CATEGORIES, IndustryGroup, getIndustryTypes } from '../lib/industryData';
import CountrySelect from './CountrySelect';
import { CountryData } from '../lib/countryData';
import { getCurrentDate } from '../lib/dateUtils';

interface EditBusinessModalProps {
  business: Business | null;
  onClose: () => void;
  onSave: (businessData: Partial<Business>) => Promise<void>;
  userId: string;
}

export function EditBusinessModal({ business, onClose, onSave, userId }: EditBusinessModalProps) {
  const [formData, setFormData] = useState({
    business_name: business?.business_name || '',
    country: business?.country || '',
    country_code: business?.country_code || '',
    country_flag: business?.country_flag || '',
    address_line1: business?.address_line1 || '',
    address_line2: business?.address_line2 || '',
    city: business?.city || '',
    state: business?.state || '',
    postal_code: business?.postal_code || '',
    industry_group: business?.industry_group || 'Other',
    industry_type: business?.industry_type || 'General',
    business_registration_number: business?.business_registration_number || '',
    vat_tax_number: business?.vat_tax_number || business?.tax_number || business?.vat_number || '',
    bank_name: business?.bank_name || '',
    bank_account_number: business?.bank_account_number || '',
    bank_swift_code: business?.bank_swift_code || '',
    payment_instructions: business?.payment_instructions || '',
    logo_url: business?.logo_url || ''
  });

  const [industryTypes, setIndustryTypes] = useState<string[]>(
    getIndustryTypes(formData.industry_group as IndustryGroup)
  );

  useEffect(() => {
    setIndustryTypes(getIndustryTypes(formData.industry_group as IndustryGroup));
  }, [formData.industry_group]);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(business?.logo_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleIndustryGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGroup = e.target.value as IndustryGroup;
    setFormData(prev => ({
      ...prev,
      industry_group: newGroup,
      industry_type: 'General'
    }));
  };

  const handleCountryChange = (country: CountryData) => {
    setFormData(prev => ({
      ...prev,
      country: country.name,
      country_code: country.code,
      country_flag: country.flag
    }));
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, or WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploadingLogo(true);

    const result = await storage.uploadLogo(file, userId);

    if (result.error || !result.url) {
      alert(result.error || 'Failed to upload logo');
      setIsUploadingLogo(false);
      return;
    }

    setLogoPreview(result.url);
    setFormData(prev => ({ ...prev, logo_url: result.url || '' }));
    setIsUploadingLogo(false);
  };

  const handleSave = async () => {
    if (!formData.business_name.trim()) {
      alert('Business name is required');
      return;
    }

    if (!formData.address_line1.trim()) {
      alert('Address line 1 is required');
      return;
    }

    if (!formData.city.trim()) {
      alert('City is required');
      return;
    }

    if (!formData.postal_code.trim()) {
      alert('Postal code is required');
      return;
    }

    setIsSaving(true);

    try {
      const dataToSave: Partial<Business> = {
        business_name: formData.business_name.trim(),
        country: formData.country.trim() || undefined,
        address_line1: formData.address_line1.trim(),
        address_line2: formData.address_line2.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim() || undefined,
        postal_code: formData.postal_code.trim(),
        industry_group: formData.industry_group,
        industry_type: formData.industry_type && formData.industry_type !== 'General' ? formData.industry_type : undefined,
        business_registration_number: formData.business_registration_number.trim() || undefined,
        vat_tax_number: formData.vat_tax_number.trim() || undefined,
        bank_name: formData.bank_name.trim() || undefined,
        bank_account_number: formData.bank_account_number.trim() || undefined,
        bank_swift_code: formData.bank_swift_code.trim() || undefined,
        payment_instructions: formData.payment_instructions.trim() || undefined,
        logo_url: formData.logo_url || undefined,
        updated_at: getCurrentDate().toISOString()
      };

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error saving business:', error);
      alert('Failed to save business information');
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = formData.business_name.trim() &&
                  formData.address_line1.trim() &&
                  formData.city.trim() &&
                  formData.postal_code.trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {business ? 'Edit Business Identity' : 'Add Business Identity'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Business Logo
            </label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-[#f97316] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {formData.business_name.charAt(0) || 'B'}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogoClick}
                disabled={isUploadingLogo || isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-semibold hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                {isUploadingLogo ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG, or WEBP (max 5MB)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleInputChange}
              disabled={isSaving}
              placeholder="Your Business Name"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleInputChange}
              disabled={isSaving}
              placeholder="Street address"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address Line 2
            </label>
            <input
              type="text"
              name="address_line2"
              value={formData.address_line2}
              onChange={handleInputChange}
              disabled={isSaving}
              placeholder="Suite, unit, building (optional)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                disabled={isSaving}
                placeholder="City"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                State/Province
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                disabled={isSaving}
                placeholder="State"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Postal Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              disabled={isSaving}
              placeholder="Postal code"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <CountrySelect
              value={formData.country_code}
              onChange={handleCountryChange}
              label="Country"
            />
          </div>

          <div className="border-t-2 border-gray-100 pt-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Industry</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Industry Group <span className="text-red-500">*</span>
                </label>
                <select
                  name="industry_group"
                  value={formData.industry_group}
                  onChange={handleIndustryGroupChange}
                  disabled={isSaving}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none disabled:opacity-50"
                >
                  {INDUSTRY_CATEGORIES.map(cat => (
                    <option key={cat.group} value={cat.group}>
                      {cat.group}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Select the broad category that best describes your business
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Industry Type
                </label>
                <select
                  name="industry_type"
                  value={formData.industry_type}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none disabled:opacity-50"
                >
                  {industryTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Leave as General if none of the specific types apply
                </p>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-gray-100 pt-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tax & Registration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Registration Number
                </label>
                <input
                  type="text"
                  name="business_registration_number"
                  value={formData.business_registration_number}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  placeholder="Company registration number (optional)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  VAT / Tax Number
                </label>
                <input
                  type="text"
                  name="vat_tax_number"
                  value={formData.vat_tax_number}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  placeholder="VAT or Tax ID (optional)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="border-t-2 border-gray-100 pt-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Bank Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  placeholder="Name of your bank (optional)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  name="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  placeholder="Your account number (optional)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SWIFT / BIC Code
                </label>
                <input
                  type="text"
                  name="bank_swift_code"
                  value={formData.bank_swift_code}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  placeholder="SWIFT or BIC code (optional)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="border-t-2 border-gray-100 pt-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Instructions</h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Instructions for Clients
              </label>
              <textarea
                name="payment_instructions"
                value={formData.payment_instructions}
                onChange={handleInputChange}
                disabled={isSaving}
                placeholder="Add any special instructions for clients about payment (optional)"
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none disabled:opacity-50 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                This will appear on invoices to help clients understand how to pay you
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || isSaving || isUploadingLogo}
            className={`flex-1 ${ds.btnPrimary} py-3 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

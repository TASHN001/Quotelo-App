import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { CURRENCIES } from '../lib/currency';
import type { Client } from '../lib/types';

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
  onSave: () => void;
}

export function ClientForm({ isOpen, onClose, client, onSave }: ClientFormProps) {
  const { authUser, business, showToast } = useApp();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    client_currency: business?.default_currency || 'ZAR',
    billing_address: '',
    tax_number: '',
    notes: ''
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        client_currency: client.client_currency || business?.default_currency || 'ZAR',
        billing_address: client.billing_address || '',
        tax_number: client.tax_number || '',
        notes: client.notes || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        client_currency: business?.default_currency || 'ZAR',
        billing_address: '',
        tax_number: '',
        notes: ''
      });
    }
  }, [client, isOpen, business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Client name is required', 'error');
      return;
    }

    if (!authUser) {
      showToast('You must be logged in', 'error');
      return;
    }

    setIsSaving(true);

    try {
      if (client) {
        const result = await db.updateClient(client.id, {
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          client_currency: formData.client_currency,
          billing_address: formData.billing_address.trim() || undefined,
          tax_number: formData.tax_number.trim() || undefined,
          notes: formData.notes.trim() || undefined
        });

        if (result) {
          showToast('Client updated successfully', 'success');
          onSave();
          onClose();
        } else {
          showToast('Failed to update client', 'error');
        }
      } else {
        const result = await db.createClient(authUser.id, business?.id, {
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          client_currency: formData.client_currency,
          billing_address: formData.billing_address.trim() || undefined,
          tax_number: formData.tax_number.trim() || undefined,
          notes: formData.notes.trim() || undefined
        });

        if (result) {
          showToast('Client added successfully', 'success');
          onSave();
          onClose();
        } else {
          showToast('Failed to add client', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving client:', error);
      showToast('An error occurred', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {client ? 'Edit Client' : 'Add Client'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name or Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter client name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="client@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Invoice Currency
              </label>
              <select
                value={formData.client_currency}
                onChange={(e) => setFormData({ ...formData, client_currency: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                This client will receive invoices in this currency. Your account currency stays the same.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Billing Address
              </label>
              <textarea
                value={formData.billing_address}
                onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                placeholder="Street, City, Postal Code, Country"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                VAT or Tax Number
              </label>
              <input
                type="text"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="VAT12345678"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                placeholder="Additional notes about this client"
                rows={3}
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
          >
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              client ? 'Save Changes' : 'Add Client'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

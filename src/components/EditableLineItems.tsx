import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { formatCurrency as formatCurrencyUtil, type Currency } from '../lib/currency';

export interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface EditableLineItemsProps {
  items: LineItem[];
  currency: Currency;
  onUpdate: (items: LineItem[]) => Promise<void>;
  styles?: {
    tableContainer?: string;
    tableHeader?: string;
    tableHeaderCell?: string;
    tableRow?: string;
    tableCell?: string;
  };
}

export function EditableLineItems({ items, currency, onUpdate, styles = {} }: EditableLineItemsProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>(items);
  const [editingCell, setEditingCell] = useState<{ index: number; field: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currency);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? Number(value) : updated[index].quantity;
      const price = field === 'unitPrice' ? Number(value) : updated[index].unitPrice;
      updated[index].total = qty * price;
    }

    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }]);
  };

  const deleteLineItem = (index: number) => {
    const updated = lineItems.filter((_, i) => i !== index);
    setLineItems(updated);
    saveChanges(updated);
  };

  const saveChanges = async (items: LineItem[] = lineItems) => {
    setIsSaving(true);
    try {
      await onUpdate(items);
      setEditingCell(null);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save line items:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'description') {
        addLineItem();
      } else {
        saveChanges();
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setLineItems(items);
    }
  };

  return (
    <div className={styles.tableContainer || 'w-full overflow-x-auto mb-6 sm:mb-8 -mx-4 sm:mx-0'}>
      <div className="min-w-full inline-block px-4 sm:px-0">
        <table className="w-full min-w-full">
          <thead>
            <tr className={styles.tableHeader || 'border-b-2 border-gray-300'}>
              <th className={styles.tableHeaderCell || 'text-left py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-gray-900'}>
                Description
              </th>
              <th className={styles.tableHeaderCell || 'text-right py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-gray-900 w-12 sm:w-16'}>
                Qty
              </th>
              <th className={styles.tableHeaderCell || 'text-right py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-gray-900 w-20 sm:w-24'}>
                Price
              </th>
              <th className={styles.tableHeaderCell || 'text-right py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-gray-900 w-20 sm:w-28'}>
                Amount
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => (
              <tr key={index} className={styles.tableRow || 'border-b border-gray-200 group'}>
                <td className={styles.tableCell || 'py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm text-gray-900'}>
                  {editingCell?.index === index && editingCell?.field === 'description' ? (
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      onBlur={() => saveChanges()}
                      onKeyDown={(e) => handleKeyDown(e, index, 'description')}
                      className="w-full bg-orange-50 border-2 border-orange-500 rounded px-2 py-1 focus:outline-none"
                      autoFocus
                      disabled={isSaving}
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ index, field: 'description' })}
                      className="cursor-text hover:bg-orange-50 rounded px-2 py-1 min-h-[32px] flex items-center"
                    >
                      {item.description || <span className="text-gray-400">Enter description...</span>}
                    </div>
                  )}
                </td>
                <td className={styles.tableCell || 'py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm text-gray-900 text-right'}>
                  {editingCell?.index === index && editingCell?.field === 'quantity' ? (
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      onBlur={() => saveChanges()}
                      onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                      className="w-full bg-orange-50 border-2 border-orange-500 rounded px-2 py-1 focus:outline-none text-right"
                      autoFocus
                      disabled={isSaving}
                      min="0"
                      step="1"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ index, field: 'quantity' })}
                      className="cursor-text hover:bg-orange-50 rounded px-2 py-1 min-h-[32px] flex items-center justify-end"
                    >
                      {item.quantity}
                    </div>
                  )}
                </td>
                <td className={styles.tableCell || 'py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm text-gray-900 text-right'}>
                  {editingCell?.index === index && editingCell?.field === 'unitPrice' ? (
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                      onBlur={() => saveChanges()}
                      onKeyDown={(e) => handleKeyDown(e, index, 'unitPrice')}
                      className="w-full bg-orange-50 border-2 border-orange-500 rounded px-2 py-1 focus:outline-none text-right"
                      autoFocus
                      disabled={isSaving}
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ index, field: 'unitPrice' })}
                      className="cursor-text hover:bg-orange-50 rounded px-2 py-1 min-h-[32px] flex items-center justify-end"
                    >
                      {formatCurrency(item.unitPrice)}
                    </div>
                  )}
                </td>
                <td className={styles.tableCell || 'py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-medium text-gray-900 text-right'}>
                  {formatCurrency(item.total)}
                </td>
                <td className="py-2 sm:py-3 px-1">
                  <button
                    onClick={() => deleteLineItem(index)}
                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Delete line item"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={addLineItem}
          className="mt-2 flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-semibold px-2 py-1 hover:bg-orange-50 rounded transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Add Line Item
        </button>

        {showSaved && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
            <Check className="w-4 h-4" strokeWidth={2.5} />
            <span className="text-sm font-semibold">Saved</span>
          </div>
        )}
      </div>
    </div>
  );
}

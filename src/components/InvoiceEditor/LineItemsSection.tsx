import { useState, useRef } from 'react';
import { Plus, Trash2, GripVertical, Bookmark, Archive, RotateCcw, ChevronDown, X } from 'lucide-react';
import type { DocumentLineItem, SavedLineItem } from '../../lib/types';

interface LineItemsSectionProps {
  lineItems: DocumentLineItem[];
  savedItems: SavedLineItem[];
  onUpdate: (items: DocumentLineItem[]) => void;
  onSaveItem: (item: DocumentLineItem) => void;
  formatCurrency: (amount: number) => string;
}

export function LineItemsSection({
  lineItems,
  savedItems,
  onUpdate,
  onSaveItem,
  formatCurrency
}: LineItemsSectionProps) {
  const [archivedItems, setArchivedItems] = useState<DocumentLineItem[]>([]);
  const [showSavedItems, setShowSavedItems] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleAddItem = () => {
    const newItem: DocumentLineItem = {
      id: `temp-${Date.now()}`,
      document_id: '',
      name: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
      line_total: 0,
      sort_order: lineItems.length
    };
    onUpdate([...lineItems, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof DocumentLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      updated[index].line_total = updated[index].quantity * updated[index].unit_price;
    }

    onUpdate(updated);
  };

  const handleDeleteItem = (index: number) => {
    const item = lineItems[index];
    setArchivedItems(prev => [...prev, item]);
    onUpdate(lineItems.filter((_, i) => i !== index));
  };

  const handleRestoreItem = (index: number) => {
    const item = archivedItems[index];
    setArchivedItems(prev => prev.filter((_, i) => i !== index));
    onUpdate([...lineItems, item]);
  };

  const handleAddSavedItem = (savedItem: SavedLineItem) => {
    const newItem: DocumentLineItem = {
      id: `temp-${Date.now()}`,
      document_id: '',
      name: savedItem.name,
      quantity: savedItem.default_quantity,
      unit_price: savedItem.default_unit_price,
      tax_rate: savedItem.default_tax_rate,
      line_total: savedItem.default_quantity * savedItem.default_unit_price,
      sort_order: lineItems.length
    };
    onUpdate([...lineItems, newItem]);
    setShowSavedItems(false);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const updated = [...lineItems];
      const [draggedItem] = updated.splice(draggedIndex, 1);
      updated.splice(dragOverIndex, 0, draggedItem);
      onUpdate(updated.map((item, i) => ({ ...item, sort_order: i })));
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="pt-4 space-y-4">
      <div className="hidden sm:grid grid-cols-12 gap-2 px-2 text-xs font-medium text-gray-500 uppercase">
        <div className="col-span-1"></div>
        <div className="col-span-4">Description</div>
        <div className="col-span-2 text-right">Qty</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-2 text-right">Total</div>
        <div className="col-span-1"></div>
      </div>

      <div className="space-y-2">
        {lineItems.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`group bg-white border rounded-lg p-3 transition-all ${
              dragOverIndex === index ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
            } ${draggedIndex === index ? 'opacity-50' : ''}`}
          >
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1 flex items-center justify-center cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>

              <div className="col-span-12 sm:col-span-4">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                  placeholder="Item description"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                />
              </div>

              <div className="col-span-4 sm:col-span-2">
                <label className="text-xs text-gray-500 sm:hidden mb-1 block">Qty</label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm text-right"
                />
              </div>

              <div className="col-span-4 sm:col-span-2">
                <label className="text-xs text-gray-500 sm:hidden mb-1 block">Price</label>
                <input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => handleUpdateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm text-right"
                />
              </div>

              <div className="col-span-3 sm:col-span-2 flex items-center justify-end">
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.line_total)}
                </span>
              </div>

              <div className="col-span-1 flex items-center justify-end gap-1">
                <button
                  onClick={() => onSaveItem(item)}
                  className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Save for reuse"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteItem(index)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-100 sm:hidden flex justify-between">
              <span className="text-xs text-gray-500">Tax Rate:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={item.tax_rate}
                  onChange={(e) => handleUpdateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.5"
                  className="w-16 px-2 py-1 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs text-right"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAddItem}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Line Item</span>
        </button>

        {savedItems.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowSavedItems(!showSavedItems)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Bookmark className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Saved</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showSavedItems && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSavedItems(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  <div className="p-3 border-b border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900">Saved Items</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {savedItems.map((saved) => (
                      <button
                        key={saved.id}
                        onClick={() => handleAddSavedItem(saved)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">{saved.name}</p>
                        <p className="text-xs text-gray-500">
                          {saved.default_quantity} x {formatCurrency(saved.default_unit_price)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {archivedItems.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Archive className="w-4 h-4" />
              <span>Archived Items ({archivedItems.length})</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showArchived ? 'rotate-180' : ''}`} />
          </button>

          {showArchived && (
            <div className="p-2 space-y-1 bg-white">
              {archivedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.quantity} x {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestoreItem(index)}
                    className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                    title="Restore item"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from 'react';
import { Plus, Trash2, GripVertical, Bookmark, Archive, RotateCcw, ChevronDown } from 'lucide-react';
import { ds } from '../../lib/designSystem';
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
    <div className="pt-4 space-y-3">
      {/* Column headers */}
      <div className="hidden sm:grid grid-cols-12 gap-2 px-2">
        <div className="col-span-1"></div>
        <div className={`col-span-4 ${ds.caption} text-[#8e8e93]`}>Description</div>
        <div className={`col-span-2 text-right ${ds.caption} text-[#8e8e93]`}>Qty</div>
        <div className={`col-span-2 text-right ${ds.caption} text-[#8e8e93]`}>Price</div>
        <div className={`col-span-2 text-right ${ds.caption} text-[#8e8e93]`}>Total</div>
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
            className={`group bg-white rounded-xl border ${ds.transition} ${
              dragOverIndex === index ? 'border-[#f97316] bg-[#fff3e8]' : 'border-[#f2f2f7]'
            } ${draggedIndex === index ? 'opacity-50' : ''} p-3`}
          >
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1 flex items-center justify-center cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-[#c7c7cc]" />
              </div>

              <div className="col-span-12 sm:col-span-4">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                  placeholder="Item description"
                  className={`${ds.input} py-2 text-[15px]`}
                />
              </div>

              <div className="col-span-4 sm:col-span-2">
                <label className={`${ds.caption} text-[#8e8e93] sm:hidden mb-1 block`}>Qty</label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className={`${ds.input} py-2 text-[15px] text-right`}
                />
              </div>

              <div className="col-span-4 sm:col-span-2">
                <label className={`${ds.caption} text-[#8e8e93] sm:hidden mb-1 block`}>Price</label>
                <input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => handleUpdateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className={`${ds.input} py-2 text-[15px] text-right`}
                />
              </div>

              <div className="col-span-3 sm:col-span-2 flex items-center justify-end">
                <span className={`${ds.callout} font-semibold text-black`}>
                  {formatCurrency(item.line_total)}
                </span>
              </div>

              <div className="col-span-1 flex items-center justify-end gap-1">
                <button
                  onClick={() => onSaveItem(item)}
                  className={`p-1.5 text-[#8e8e93] hover:text-[#f97316] ${ds.transition} opacity-0 group-hover:opacity-100`}
                  title="Save for reuse"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteItem(index)}
                  className={`p-1.5 text-[#8e8e93] hover:text-[#ff3b30] ${ds.transition}`}
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-[#f2f2f7] sm:hidden flex justify-between items-center">
              <span className={`${ds.caption} text-[#8e8e93]`}>Tax Rate:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={item.tax_rate}
                  onChange={(e) => handleUpdateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.5"
                  className={`${ds.input} w-16 py-1.5 text-[13px] text-right`}
                />
                <span className={`${ds.caption} text-[#8e8e93]`}>%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Saved buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleAddItem}
          className={`flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#c7c7cc] rounded-xl ${ds.callout} text-[#8e8e93] hover:border-[#f97316] hover:text-[#f97316] hover:bg-[#fff3e8] ${ds.transition}`}
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">Add Line Item</span>
        </button>

        {savedItems.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowSavedItems(!showSavedItems)}
              className={`flex items-center gap-2 px-4 py-3 bg-[#f2f2f7] rounded-xl ${ds.callout} text-black font-medium ${ds.transition}`}
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Saved</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showSavedItems && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSavedItems(false)}
                />
                <div className={`absolute right-0 top-full mt-2 w-64 bg-white rounded-xl ${ds.shadow3} z-20 overflow-hidden border border-[#f2f2f7]`}>
                  <div className="p-3 border-b border-[#f2f2f7]">
                    <h4 className={`${ds.callout} font-semibold text-black`}>Saved Items</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {savedItems.map((saved) => (
                      <button
                        key={saved.id}
                        onClick={() => handleAddSavedItem(saved)}
                        className={`w-full px-4 py-3 text-left ${ds.transition} hover:bg-[#f2f2f7] border-b border-[#f2f2f7] last:border-b-0`}
                      >
                        <p className={`${ds.callout} font-medium text-black truncate`}>{saved.name}</p>
                        <p className={`${ds.footnote} text-[#8e8e93]`}>
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

      {/* Archived items */}
      {archivedItems.length > 0 && (
        <div className="bg-white rounded-xl border border-[#f2f2f7] overflow-hidden">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`w-full flex items-center justify-between px-4 py-3 ${ds.transition}`}
          >
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-[#8e8e93]" />
              <span className={`${ds.callout} text-[#8e8e93]`}>Archived Items ({archivedItems.length})</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#8e8e93] ${ds.transition} ${showArchived ? 'rotate-180' : ''}`} />
          </button>

          {showArchived && (
            <div className="p-2 space-y-1 border-t border-[#f2f2f7]">
              {archivedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 bg-[#f2f2f7] rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className={`${ds.callout} text-[#8e8e93] truncate`}>{item.name}</p>
                    <p className={`${ds.footnote} text-[#c7c7cc]`}>
                      {item.quantity} x {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestoreItem(index)}
                    className={`p-1.5 text-[#8e8e93] hover:text-[#34c759] ${ds.transition}`}
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

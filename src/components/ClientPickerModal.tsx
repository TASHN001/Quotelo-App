import { useState, useEffect } from 'react';
import { Client } from '../lib/types';
import { db } from '../lib/database';
import { ds } from '../lib/designSystem';

interface ClientPickerModalProps {
  onClose: () => void;
  onSelectClient: (client: Client | null) => void;
  onAddClient: () => void;
  userId: string;
}

export function ClientPickerModal({ onClose, onSelectClient, onAddClient, userId }: ClientPickerModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, [userId]);

  useEffect(() => {
    filterClients();
  }, [search, clients]);

  const loadClients = async () => {
    setIsLoading(true);
    const result = await db.getUserClients(userId);
    if (result) {
      setClients(result);
      setFilteredClients(result);
    }
    setIsLoading(false);
  };

  const filterClients = () => {
    if (!search.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = search.toLowerCase();
    const filtered = clients.filter(client => {
      return (
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query)
      );
    });
    setFilteredClients(filtered);
  };

  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    onClose();
  };

  const handleContinueWithoutClient = () => {
    onSelectClient(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-t-[20px] shadow-[0_-4px_16px_rgba(0,0,0,0.10)] max-h-[80vh] flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 bg-[#e5e5ea] rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-[#f2f2f7]">
          <button onClick={onClose} className={`${ds.callout} text-[#8e8e93]`}>Cancel</button>
          <h2 className={`${ds.headline} text-black`}>Select Client</h2>
          <button onClick={onAddClient} className={`${ds.callout} text-[#f97316] font-semibold`}>New</button>
        </div>
        {/* Search */}
        <div className="px-4 py-3 border-b border-[#f2f2f7]">
          <input
            type="text"
            placeholder="Search clients"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={ds.input}
          />
        </div>
        {/* Client list */}
        <div className="flex-1 overflow-y-auto">
          {/* Continue without client option */}
          <button
            onClick={handleContinueWithoutClient}
            className={`w-full flex items-center gap-3 px-4 py-3 ${ds.transition} ${ds.press} border-b border-[#f2f2f7]`}
          >
            <div className="w-9 h-9 rounded-full bg-[#f2f2f7] flex items-center justify-center flex-shrink-0">
              <span className={`${ds.callout} font-semibold text-[#8e8e93]`}>—</span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className={`${ds.callout} font-semibold text-[#8e8e93] truncate`}>Continue without client</p>
              <p className={`${ds.footnote} text-[#8e8e93] truncate`}>Add client details manually</p>
            </div>
          </button>

          {isLoading ? (
            <div className={`text-center py-8 ${ds.callout} text-[#8e8e93]`}>Loading clients...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className={`${ds.callout} text-[#8e8e93] mb-4`}>
                {search ? 'No clients match your search' : 'No clients yet'}
              </p>
              {!search && (
                <button
                  onClick={onAddClient}
                  className={ds.btnPrimary}
                >
                  Add Your First Client
                </button>
              )}
            </div>
          ) : (
            filteredClients.map((client, idx) => (
              <button
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className={`w-full flex items-center gap-3 px-4 py-3 ${ds.transition} ${ds.press} ${
                  idx < filteredClients.length - 1 ? 'border-b border-[#f2f2f7]' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-[#f2f2f7] flex items-center justify-center flex-shrink-0">
                  <span className={`${ds.callout} font-semibold text-[#3c3c43]`}>
                    {(client.name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`${ds.callout} font-semibold text-black truncate`}>{client.name}</p>
                  {client.email && <p className={`${ds.footnote} text-[#8e8e93] truncate`}>{client.email}</p>}
                  {!client.email && client.phone && <p className={`${ds.footnote} text-[#8e8e93] truncate`}>{client.phone}</p>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

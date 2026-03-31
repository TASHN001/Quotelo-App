import { useState, useEffect } from 'react';
import { X, Search, Plus, User } from 'lucide-react';
import { Client } from '../lib/types';
import { db } from '../lib/database';

interface ClientPickerModalProps {
  onClose: () => void;
  onSelectClient: (client: Client | null) => void;
  onAddClient: () => void;
  userId: string;
}

export function ClientPickerModal({ onClose, onSelectClient, onAddClient, userId }: ClientPickerModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, [userId]);

  useEffect(() => {
    filterClients();
  }, [searchQuery, clients]);

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
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Select a Client</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddClient}
              className="px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Add Client
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <button
            onClick={handleContinueWithoutClient}
            className="w-full p-4 mb-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
          >
            <p className="font-semibold text-gray-700">Continue without selecting a client</p>
            <p className="text-sm text-gray-500 mt-1">You can add client details manually</p>
          </button>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading clients...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'No clients match your search' : 'No clients yet'}
              </p>
              {!searchQuery && (
                <button
                  onClick={onAddClient}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow"
                >
                  Add Your First Client
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                      {client.email && (
                        <p className="text-sm text-gray-600 truncate mt-1">{client.email}</p>
                      )}
                      {client.phone && (
                        <p className="text-sm text-gray-500 mt-1">{client.phone}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Users, Search, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { ClientForm } from './ClientForm';
import { ds } from '../lib/designSystem';
import type { Client } from '../lib/types';

interface ClientWithCount extends Client {
  invoiceCount: number;
  outstandingBalance: number;
}

export function Clients() {
  const { setCurrentScreen, authUser, setSelectedClientId } = useApp();
  const [clients, setClients] = useState<ClientWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredClients = search.trim()
    ? clients.filter(c =>
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.company_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  useEffect(() => {
    loadClients();
  }, [authUser]);

  const loadClients = async () => {
    if (!authUser) {
      setIsLoading(false);
      return;
    }

    const clientList = await db.getUserClients(authUser.id);

    const clientsWithCounts = await Promise.all(
      clientList.map(async (client) => {
        const count = await db.getClientInvoiceCount(client.id, authUser.id);
        const balance = await db.getClientOutstandingBalance(client.id, authUser.id);
        return { ...client, invoiceCount: count, outstandingBalance: balance };
      })
    );

    setClients(clientsWithCounts);
    setIsLoading(false);
  };

  const handleClientClick = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentScreen('client-details');
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${ds.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8e8e93]">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${ds.bg} pb-28`}>
      <div className="px-4 pt-14">
        <div className="flex items-end justify-between mb-5">
          <h1 className={`${ds.title1} text-black`}>Clients</h1>
          <button
            onClick={() => setIsClientFormOpen(true)}
            className={`w-9 h-9 bg-[#f97316] rounded-full flex items-center justify-center ${ds.shadowOrange} ${ds.press} ${ds.transition} mb-1`}
          >
            <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
          <input
            type="text"
            placeholder="Search clients"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`${ds.input} pl-10`}
          />
        </div>

        {filteredClients.length === 0 ? (
          <div className={`${ds.card} p-10 text-center`}>
            <Users className="w-10 h-10 text-[#c7c7cc] mx-auto mb-3" />
            <p className={`${ds.callout} text-[#8e8e93]`}>No clients yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {filteredClients.map((client, idx) => (
              <button
                key={client.id}
                onClick={() => handleClientClick(client.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 ${ds.transition} ${ds.press} ${
                  idx < filteredClients.length - 1 ? 'border-b border-[#f2f2f7]' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#f2f2f7] flex items-center justify-center flex-shrink-0">
                  <span className={`${ds.headline} text-[#3c3c43]`}>
                    {(client.name || client.company_name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`${ds.headline} text-black truncate`}>{client.name}</p>
                  <p className={`${ds.footnote} text-[#8e8e93] truncate`}>{client.company_name}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#c7c7cc] flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <ClientForm
        isOpen={isClientFormOpen}
        onClose={() => setIsClientFormOpen(false)}
        onSave={loadClients}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ArrowLeft, Users as UsersIcon, Mail, Plus, Home as HomeIcon, User, UserPlus, DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { ClientForm } from './ClientForm';
import type { Client } from '../lib/types';

interface ClientWithCount extends Client {
  invoiceCount: number;
  outstandingBalance: number;
}

export function Clients() {
  const { setCurrentScreen, authUser, setSelectedClientId, formatCurrency } = useApp();
  const [clients, setClients] = useState<ClientWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);

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
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col pb-24 transition-colors">
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setCurrentScreen('home')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">Clients</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Manage your clients</p>
          </div>
          <button
            onClick={() => setIsClientFormOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">Add Client</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {clients.length > 0 ? (
          <div className="space-y-3">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => handleClientClick(client.id)}
                className="w-full bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <UsersIcon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{client.name}</h3>
                    {client.email && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <Mail className="w-3 h-3" strokeWidth={2} />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <span className="inline-block bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold px-3 py-1 rounded-full">
                        {client.invoiceCount} {client.invoiceCount === 1 ? 'invoice' : 'invoices'}
                      </span>
                      {client.outstandingBalance > 0 && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                          <DollarSign className="w-3 h-3" strokeWidth={2} />
                          <span>{formatCurrency(client.outstandingBalance)} due</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No clients yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-center px-4">
              Add clients manually or create invoices to automatically build your client list
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsClientFormOpen(true)}
                className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-orange-500 text-orange-500 rounded-xl font-semibold hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors"
              >
                Add Client
              </button>
              <button
                onClick={() => setCurrentScreen('ai-generator')}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
              >
                Create Invoice
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-around relative">
          <button
            onClick={() => setCurrentScreen('home')}
            className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500"
          >
            <HomeIcon className="w-6 h-6" strokeWidth={2} />
            <span className="text-xs font-medium">Home</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setCurrentScreen('ai-generator')}
              className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg absolute -top-8 left-1/2 -translate-x-1/2"
            >
              <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
            </button>
          </div>

          <button
            onClick={() => setCurrentScreen('profile')}
            className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500"
          >
            <User className="w-6 h-6" strokeWidth={2} />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>

      <ClientForm
        isOpen={isClientFormOpen}
        onClose={() => setIsClientFormOpen(false)}
        onSave={loadClients}
      />
    </div>
  );
}

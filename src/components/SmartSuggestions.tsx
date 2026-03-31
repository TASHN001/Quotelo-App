import { useState, useEffect } from 'react';
import { Repeat, AlertCircle, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { isOverdue } from '../lib/statusManager';
import type { Document, Client } from '../lib/types';

interface Suggestion {
  id: string;
  type: 'repeat-invoice' | 'overdue-alert';
  title: string;
  subtitle?: string;
  icon: 'repeat' | 'alert';
  onClick: () => void;
}

export function SmartSuggestions() {
  const { authUser, setCurrentScreen, setSelectedClient, setSavedDocumentId, formatCurrency } = useApp();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    loadSuggestions();
  }, [authUser]);

  const loadSuggestions = async () => {
    if (!authUser) return;

    try {
      const userId = authUser.id;
      const recentDocs = await db.getUserDocuments(userId, 10);

      const newSuggestions: Suggestion[] = [];

      if (recentDocs.length > 0) {
        const overdueCount = recentDocs.filter(doc =>
          doc.status !== 'paid' &&
          doc.status !== 'cancelled' &&
          isOverdue(doc)
        ).length;

        if (overdueCount > 0) {
          const overdueDoc = recentDocs.find(doc =>
            doc.status !== 'paid' &&
            doc.status !== 'cancelled' &&
            isOverdue(doc)
          );

          if (overdueDoc) {
            newSuggestions.push({
              id: 'overdue-alert',
              type: 'overdue-alert',
              title: overdueCount === 1
                ? '1 invoice overdue – send reminder?'
                : `${overdueCount} invoices overdue – send reminders?`,
              subtitle: overdueDoc.client_name,
              icon: 'alert',
              onClick: () => {
                setSavedDocumentId(overdueDoc.id);
                setCurrentScreen('invoice-detail');
              }
            });
          }
        }

        const recentClients = new Map<string, { client: Client | null; doc: Document; count: number }>();

        for (const doc of recentDocs) {
          if (doc.client_id && doc.status !== 'cancelled') {
            const existing = recentClients.get(doc.client_id);
            if (existing) {
              existing.count++;
            } else {
              const client = doc.client_id ? await db.getClient(doc.client_id) : null;
              recentClients.set(doc.client_id, { client, doc, count: 1 });
            }
          }
        }

        const sortedClients = Array.from(recentClients.values())
          .filter(item => item.client !== null)
          .sort((a, b) => b.count - a.count)
          .slice(0, 2);

        for (const { client, doc, count } of sortedClients) {
          if (client) {
            const firstName = client.name.split(' ')[0];
            const title = count === 1
              ? `Invoice ${firstName} again?`
              : `Repeat invoice to ${firstName}?`;

            newSuggestions.push({
              id: `repeat-${client.id}`,
              type: 'repeat-invoice',
              title,
              subtitle: count > 1 ? `${count} previous invoices` : undefined,
              icon: 'repeat',
              onClick: () => {
                setSelectedClient(client);
                setCurrentScreen('ai-generator');
              }
            });
          }
        }
      }

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('[SmartSuggestions] Error loading suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-6">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={suggestion.onClick}
          className={`w-full rounded-2xl p-4 flex items-center gap-3 transition-all hover:shadow-md ${
            suggestion.type === 'overdue-alert'
              ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800/50'
              : 'bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 border border-blue-200 dark:border-blue-800/50'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            suggestion.type === 'overdue-alert'
              ? 'bg-red-500'
              : 'bg-blue-500'
          }`}>
            {suggestion.icon === 'alert' ? (
              <AlertCircle className="w-5 h-5 text-white" strokeWidth={2} />
            ) : (
              <Repeat className="w-5 h-5 text-white" strokeWidth={2} />
            )}
          </div>

          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {suggestion.title}
            </p>
            {suggestion.subtitle && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {suggestion.subtitle}
              </p>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}

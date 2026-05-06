import { useState, useEffect } from 'react';
import { Repeat, AlertCircle, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { isOverdue } from '../lib/statusManager';
import { ds } from '../lib/designSystem';
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
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-4">
      <p className={`${ds.caption} text-[#8e8e93] px-4 pt-3 pb-1`}>Suggestions</p>
      {suggestions.map((suggestion, idx) => (
        <button
          key={suggestion.id}
          onClick={suggestion.onClick}
          className={`w-full flex items-start gap-3 px-4 py-2.5 ${ds.transition} ${ds.press} ${
            idx < suggestions.length - 1 ? 'border-b border-[#f2f2f7]' : ''
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
            suggestion.type === 'overdue-alert' ? 'bg-[#fee2e2]' : 'bg-[#fff7ed]'
          }`}>
            {suggestion.icon === 'alert' ? (
              <AlertCircle className="w-4 h-4 text-[#f97316]" strokeWidth={2} />
            ) : (
              <Repeat className="w-4 h-4 text-[#f97316]" strokeWidth={2} />
            )}
          </div>

          <div className="flex-1 text-left min-w-0">
            <p className={`${ds.callout} text-[#3c3c43]`}>
              {suggestion.title}
            </p>
            {suggestion.subtitle && (
              <p className={`${ds.footnote} text-[#8e8e93] mt-0.5`}>
                {suggestion.subtitle}
              </p>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-[#c7c7cc] flex-shrink-0 mt-0.5" />
        </button>
      ))}
    </div>
  );
}

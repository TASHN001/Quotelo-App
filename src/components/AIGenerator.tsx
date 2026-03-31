import { ArrowLeft, Mic, Send, Loader2, User, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateDocumentFromAI } from '../lib/ai';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { db } from '../lib/database';
import { ClientPickerModal } from './ClientPickerModal';
import { Client } from '../lib/types';
import { getCurrentTimestamp, getCurrentDate } from '../lib/dateUtils';

const DOCUMENT_TYPES = ['Invoice', 'Tax Invoice', 'Proforma Invoice'];
const DOCUMENT_TYPE_KEYS = ['documentType.invoice', 'documentType.taxInvoice', 'documentType.proformaInvoice'] as const;

export function AIGenerator() {
  const { selectedDocumentType, setSelectedDocumentType, setCurrentScreen, business, setInvoiceDraft, setSelectedTemplateKey, t, authUser, selectedClient, setSelectedClient } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultTemplate, setDefaultTemplate] = useState<string>('invoice-minimal');
  const [showClientPicker, setShowClientPicker] = useState(false);

  useEffect(() => {
    const loadDefaultTemplate = async () => {
      if (authUser) {
        const template = await db.getDefaultTemplate(authUser.id);
        if (template) {
          setDefaultTemplate(template);
        }
      }
    };
    loadDefaultTemplate();
  }, [authUser]);

  const { isListening, isTranscribing, isSupported, recordingTime, startListening, stopListening } = useVoiceInput({
    onResult: (transcript) => {
      setInputValue(transcript);
      setTimeout(() => {
        handleSendWithTranscript(transcript);
      }, 100);
    },
    onError: (errorMessage) => {
      setError(errorMessage);
    },
  });

  const formatRecordingTime = (seconds: number) => {
    return `${seconds}s`;
  };

  const handleSendWithTranscript = async (transcript: string) => {
    if (!transcript.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    setInvoiceDraft(null);

    const requestStartTime = getCurrentTimestamp();
    console.log('[AI Request] Starting generation', {
      documentType: selectedDocumentType,
      prompt: transcript,
      timestamp: getCurrentDate().toISOString(),
    });

    try {
      const invoiceDraft = await generateDocumentFromAI(
        selectedDocumentType,
        transcript,
        {
          businessName: business?.business_name,
          email: business?.email,
          currency: selectedClient?.client_currency || business?.default_currency,
          selectedClientId: selectedClient?.id,
          selectedClientSummary: selectedClient ? {
            name: selectedClient.name,
            email: selectedClient.email,
            phone: selectedClient.phone,
            billing_address: selectedClient.billing_address,
          } : undefined,
        }
      );

      const requestDuration = getCurrentTimestamp() - requestStartTime;
      console.log('[AI Response] Received draft', {
        requestId: invoiceDraft.requestId,
        documentType: invoiceDraft.documentType,
        complete: invoiceDraft.complete,
        followUpQuestion: invoiceDraft.followUpQuestion,
        itemCount: invoiceDraft.items.length,
        total: invoiceDraft.total,
        duration: `${requestDuration}ms`,
        fullResponse: invoiceDraft,
      });

      if (!invoiceDraft.complete && invoiceDraft.followUpQuestion) {
        setError(invoiceDraft.followUpQuestion);
        return;
      }

      setInvoiceDraft(invoiceDraft);
      setSelectedTemplateKey(defaultTemplate);
      setCurrentScreen('data-preview');
    } catch (err) {
      console.error('[AI Error] Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    await handleSendWithTranscript(inputValue);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setError(null);
      setInputValue('');
      startListening();
    }
  };

  const handleClientSelected = (client: Client | null) => {
    if (client) {
      localStorage.setItem('quotelo_last_selected_client_id', client.id);
    }
    setSelectedClient(client);
  };

  const handleAddClient = () => {
    setShowClientPicker(false);
    setCurrentScreen('clients');
  };

  const isBusy = isLoading || isListening || isTranscribing;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setCurrentScreen('home')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('ai.title')}</h1>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('ai.description')}
        </p>

        {selectedClient && (
          <div className="mb-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {selectedClient.name}
                  </p>
                  {selectedClient.email && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {selectedClient.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowClientPicker(true)}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Change
                </button>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider mb-3">
            {t('ai.switchDocument')}
          </p>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {DOCUMENT_TYPES.map((type, index) => (
              <button
                key={type}
                onClick={() => setSelectedDocumentType(type)}
                className={`px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all ${
                  selectedDocumentType === type
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t(DOCUMENT_TYPE_KEYS[index])}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl p-5 border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            {t('ai.examplePrompt')}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl max-w-md w-full">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        )}

        <div className="text-center mb-12">
          {isLoading ? (
            <div className="animate-slide-up">
              <Loader2 className="w-8 h-8 text-orange-500 mx-auto mb-3 animate-spin" strokeWidth={2.5} />
              <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">Processing your invoice...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Our AI is extracting the details</p>
            </div>
          ) : isTranscribing ? (
            <div className="animate-slide-up">
              <div className="flex items-center justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-8 bg-orange-500 rounded-full"
                    style={{
                      animation: `wave 1s ease-in-out infinite`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">Processing...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Converting speech to text</p>
            </div>
          ) : isListening ? (
            <div className="animate-slide-up">
              <div className="flex items-center justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-12 bg-red-500 rounded-full"
                    style={{
                      animation: `wave 0.8s ease-in-out infinite`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">Listening...</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Recording</p>
                <div className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {formatRecordingTime(recordingTime)} / 30s
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-slide-up">
              <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">Tap to speak</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Describe your invoice naturally</p>
            </div>
          )}
        </div>

        <div className="relative mb-12">
          {isListening && (
            <>
              <div className="absolute inset-0 bg-red-400 rounded-full" style={{ animation: 'ripple 2s ease-out infinite' }} />
              <div className="absolute inset-0 bg-red-400 rounded-full" style={{ animation: 'ripple 2s ease-out infinite 0.5s' }} />
              <div className="absolute inset-0 bg-red-400 rounded-full" style={{ animation: 'ripple 2s ease-out infinite 1s' }} />
            </>
          )}

          {!isListening && !isLoading && !isTranscribing && (
            <div className="absolute inset-0 bg-orange-300 rounded-full opacity-30" style={{ animation: 'mic-pulse 2s ease-in-out infinite' }} />
          )}

          <button
            onClick={handleMicClick}
            disabled={isLoading || isTranscribing || !isSupported}
            className={`relative w-24 h-24 flex items-center justify-center rounded-full transition-all disabled:opacity-50 transform hover:scale-105 active:scale-95 ${
              isListening
                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-2xl shadow-red-500/50'
                : isLoading || isTranscribing
                ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-lg cursor-not-allowed'
                : 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-2xl shadow-orange-500/30'
            }`}
            aria-label={isListening ? t('ai.stopRecording') : t('ai.startVoiceInput')}
          >
            {isLoading || isTranscribing ? (
              <Loader2 className="w-10 h-10 animate-spin" strokeWidth={2.5} />
            ) : (
              <Mic className="w-10 h-10" strokeWidth={2.5} />
            )}
          </button>
        </div>

        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">or type</p>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isBusy && handleSend()}
              placeholder={t('ai.placeholder')}
              disabled={isBusy}
              className="flex-1 h-12 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-all"
            />

            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isBusy}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all transform hover:scale-105 active:scale-95 ${
                inputValue.trim() && !isBusy
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
              }`}
              aria-label={t('ai.sendMessage')}
            >
              <Send className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {showClientPicker && (
        <ClientPickerModal
          onClose={() => setShowClientPicker(false)}
          onSelectClient={handleClientSelected}
          onAddClient={handleAddClient}
          userId={localStorage.getItem('quotelo_user_id') || ''}
        />
      )}
    </div>
  );
}

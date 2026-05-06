import { ChevronLeft, Mic, Send, Loader2, User, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateDocumentFromAI } from '../lib/ai';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { db } from '../lib/database';
import { ClientPickerModal } from './ClientPickerModal';
import { Client } from '../lib/types';
import { getCurrentTimestamp, getCurrentDate } from '../lib/dateUtils';
import { ds } from '../lib/designSystem';

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
    <div className={`min-h-screen ${ds.bg} flex flex-col`}>
      {/* Sub-screen header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 bg-[#f2f2f7]">
        <button onClick={() => setCurrentScreen('home')} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <h1 className={`${ds.headline} text-black flex-1 text-center`}>{t('ai.title')}</h1>
        <div className="w-8" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

        {/* Description */}
        <p className={`${ds.callout} text-[#8e8e93]`}>{t('ai.description')}</p>

        {/* Client card */}
        {selectedClient && (
          <div className={`bg-white rounded-xl p-4 ${ds.shadow1}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-[#f97316] rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`${ds.callout} font-semibold text-black truncate`}>{selectedClient.name}</p>
                  {selectedClient.email && (
                    <p className={`${ds.footnote} text-[#8e8e93] truncate`}>{selectedClient.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowClientPicker(true)}
                  className={`px-3 py-1.5 bg-[#f2f2f7] text-[#f97316] rounded-lg ${ds.footnote} font-semibold ${ds.transition} ${ds.press}`}
                >
                  Change
                </button>
                <button
                  onClick={() => setSelectedClient(null)}
                  className={`w-8 h-8 bg-[#f2f2f7] rounded-full flex items-center justify-center ${ds.transition} ${ds.press}`}
                >
                  <X className="w-4 h-4 text-[#8e8e93]" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document type selector */}
        <div>
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>{t('ai.switchDocument')}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DOCUMENT_TYPES.map((type, index) => (
              <button
                key={type}
                onClick={() => setSelectedDocumentType(type)}
                className={`px-5 py-2 rounded-full font-semibold whitespace-nowrap ${ds.transition} ${ds.press} ${ds.footnote} ${
                  selectedDocumentType === type
                    ? 'bg-[#f97316] text-white shadow-[0_4px_12px_rgba(249,115,22,0.25)]'
                    : 'bg-white text-[#8e8e93] shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                }`}
              >
                {t(DOCUMENT_TYPE_KEYS[index])}
              </button>
            ))}
          </div>
        </div>

        {/* Example prompt hint */}
        <div className="bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <p className={`${ds.callout} text-[#8e8e93] italic`}>{t('ai.examplePrompt')}</p>
        </div>

        {/* Error / follow-up */}
        {error && (
          <div className="bg-[#fee2e2] rounded-xl px-4 py-3">
            <p className={`${ds.callout} text-[#991b1b] text-center`}>{error}</p>
          </div>
        )}

        {/* State display */}
        <div className="flex flex-col items-center py-8 gap-6">
          {isLoading ? (
            <div className="text-center animate-slide-up">
              <Loader2 className="w-8 h-8 text-[#f97316] mx-auto mb-3 animate-spin" strokeWidth={2.5} />
              <p className={`${ds.headline} text-black mb-1`}>Processing your invoice...</p>
              <p className={`${ds.callout} text-[#8e8e93]`}>Our AI is extracting the details</p>
            </div>
          ) : isTranscribing ? (
            <div className="text-center animate-slide-up">
              <div className="flex items-center justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-8 bg-[#f97316] rounded-full"
                    style={{ animation: `wave 1s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <p className={`${ds.headline} text-black mb-1`}>Processing...</p>
              <p className={`${ds.callout} text-[#8e8e93]`}>Converting speech to text</p>
            </div>
          ) : isListening ? (
            <div className="text-center animate-slide-up">
              <div className="flex items-center justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-12 bg-[#ef4444] rounded-full"
                    style={{ animation: `wave 0.8s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <p className={`${ds.headline} text-black mb-1`}>Listening...</p>
              <div className="flex items-center justify-center gap-2">
                <p className={`${ds.callout} text-[#8e8e93]`}>Recording</p>
                <span className="bg-[#ef4444] text-white text-[11px] font-bold rounded-full px-2 py-0.5">
                  {formatRecordingTime(recordingTime)} / 30s
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center animate-slide-up">
              <p className={`${ds.headline} text-black mb-1`}>Tap to speak</p>
              <p className={`${ds.callout} text-[#8e8e93]`}>Describe your invoice naturally</p>
            </div>
          )}

          {/* Mic button */}
          <div className="relative">
            {isListening && (
              <>
                <div className="absolute inset-0 bg-[#ef4444] rounded-full opacity-30" style={{ animation: 'ripple 2s ease-out infinite' }} />
                <div className="absolute inset-0 bg-[#ef4444] rounded-full opacity-20" style={{ animation: 'ripple 2s ease-out infinite 0.5s' }} />
                <div className="absolute inset-0 bg-[#ef4444] rounded-full opacity-10" style={{ animation: 'ripple 2s ease-out infinite 1s' }} />
              </>
            )}
            {!isListening && !isLoading && !isTranscribing && (
              <div className="absolute inset-0 bg-[#f97316] rounded-full opacity-20" style={{ animation: 'mic-pulse 2s ease-in-out infinite' }} />
            )}
            <button
              onClick={handleMicClick}
              disabled={isLoading || isTranscribing || !isSupported}
              className={`relative w-24 h-24 flex items-center justify-center rounded-full ${ds.transition} ${ds.press} disabled:opacity-50 ${
                isListening
                  ? 'bg-[#ef4444] shadow-[0_8px_24px_rgba(239,68,68,0.4)]'
                  : isLoading || isTranscribing
                  ? 'bg-[#8e8e93] cursor-not-allowed'
                  : `bg-[#f97316] ${ds.shadowOrange}`
              }`}
              aria-label={isListening ? t('ai.stopRecording') : t('ai.startVoiceInput')}
            >
              {isLoading || isTranscribing ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" strokeWidth={2.5} />
              ) : (
                <Mic className="w-10 h-10 text-white" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        {/* Divider + text input */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-[#e5e5ea]" />
            <p className={`${ds.caption} text-[#c7c7cc]`}>or type</p>
            <div className="flex-1 h-px bg-[#e5e5ea]" />
          </div>
          <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center gap-3 px-4 py-2.5">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isBusy && handleSend()}
              placeholder={t('ai.placeholder')}
              disabled={isBusy}
              className="flex-1 text-[15px] text-black placeholder:text-[#c7c7cc] focus:outline-none bg-transparent disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isBusy}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${ds.press} ${ds.transition} flex-shrink-0 ${
                inputValue.trim() && !isBusy
                  ? `bg-[#f97316] ${ds.shadowOrange}`
                  : 'bg-[#e5e5ea]'
              }`}
              aria-label={t('ai.sendMessage')}
            >
              <Send className={`w-4 h-4 ${inputValue.trim() && !isBusy ? 'text-white' : 'text-[#c7c7cc]'}`} />
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

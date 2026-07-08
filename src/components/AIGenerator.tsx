import { ChevronLeft, Mic, Loader2, User, X, Check } from 'lucide-react';
import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { generateDocumentFromAI } from '../lib/ai';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { db } from '../lib/database';
import { ClientPickerModal } from './ClientPickerModal';
import { Client } from '../lib/types';
import { getCurrentTimestamp, getCurrentDate } from '../lib/dateUtils';
import { ds } from '../lib/designSystem';
import { useEffect } from 'react';

const DOCUMENT_TYPES = ['Quote', 'Invoice', 'Receipt'];
const DOCUMENT_TYPE_KEYS = ['documentType.quote', 'documentType.invoice', 'documentType.receipt'] as const;

export function AIGenerator() {
  const { selectedDocumentType, setSelectedDocumentType, setCurrentScreen, business, setInvoiceDraft, setSelectedTemplateKey, t, authUser, selectedClient, setSelectedClient } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultTemplate, setDefaultTemplate] = useState<string>('invoice-minimal');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');

  const shouldSendRef = useRef(false);

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
      if (shouldSendRef.current) {
        handleSendWithTranscript(transcript);
      }
    },
    onError: (errorMessage) => {
      if (shouldSendRef.current) {
        setError(errorMessage);
      }
    },
  });

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

  const handleMicClick = () => {
    if (!isListening && !isTranscribing && !isLoading) {
      shouldSendRef.current = false;
      setError(null);
      startListening();
    }
  };

  const handleVoiceConfirm = () => {
    shouldSendRef.current = true;
    stopListening();
  };

  const handleVoiceCancel = () => {
    shouldSendRef.current = false;
    stopListening();
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
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 pb-32">

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
          <p className={`${ds.callout} text-[#8e8e93] italic`}>
            {selectedDocumentType === 'Quote'
              ? '"Quote for John, 10 boxes at R50 each, valid 30 days"'
              : selectedDocumentType === 'Receipt'
              ? '"Receipt for Sarah, 3 sessions R800 each, paid today"'
              : '"Invoice for John, consulting 5hrs at R500/hr, due Friday"'}
          </p>
        </div>

        {/* Error / follow-up */}
        {error && (
          <div className="bg-[#fee2e2] rounded-xl px-4 py-3">
            <p className={`${ds.callout} text-[#991b1b] text-center`}>{error}</p>
          </div>
        )}

        {/* Center state display */}
        <div className="flex flex-col items-center py-8 gap-6">
          {isLoading ? (
            <div className="text-center animate-slide-up">
              <Loader2 className="w-8 h-8 text-[#f97316] mx-auto mb-3 animate-spin" strokeWidth={2.5} />
              <p className={`${ds.headline} text-black mb-1`}>Processing your {selectedDocumentType.toLowerCase()}...</p>
              <p className={`${ds.callout} text-[#8e8e93]`}>Our AI is extracting the details</p>
            </div>
          ) : isTranscribing ? (
            <div className="text-center animate-slide-up">
              <Loader2 className="w-8 h-8 text-[#f97316] mx-auto mb-3 animate-spin" strokeWidth={2.5} />
              <p className={`${ds.headline} text-black mb-1`}>Converting speech...</p>
              <p className={`${ds.callout} text-[#8e8e93]`}>Processing your recording</p>
            </div>
          ) : inputMode === 'text' ? (
            <div className="w-full animate-slide-up">
              <p className={`${ds.headline} text-black mb-3 text-center`}>Describe your {selectedDocumentType.toLowerCase()}</p>
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                rows={5}
                placeholder={`e.g. ${selectedDocumentType} for Acme Corp, web design R5000, due in 14 days`}
                className={`${ds.input} resize-none`}
                disabled={isLoading}
                autoFocus
              />
              <button
                onClick={() => { if (textInput.trim()) handleSendWithTranscript(textInput); }}
                disabled={isLoading || !textInput.trim()}
                className={`${ds.btnPrimary} w-full mt-3 disabled:opacity-50`}
              >
                Generate {selectedDocumentType}
              </button>
              <button
                onClick={() => { setInputMode('voice'); setTextInput(''); }}
                className={`${ds.callout} text-[#f97316] font-semibold mt-3 w-full text-center`}
              >
                Use voice instead
              </button>
            </div>
          ) : (
            <>
              <div className="text-center animate-slide-up">
                <p className={`${ds.headline} text-black mb-1`}>Tap to speak</p>
                <p className={`${ds.callout} text-[#8e8e93]`}>Describe your invoice naturally</p>
              </div>

              {/* Mic button — hidden while recording (pill takes over) */}
              {!isListening && (
                <button
                  onClick={handleMicClick}
                  disabled={isLoading || isTranscribing || !isSupported}
                  className={`relative w-24 h-24 flex items-center justify-center rounded-full ${ds.transition} ${ds.press} disabled:opacity-50 bg-[#f97316] ${ds.shadowOrange}`}
                  aria-label={t('ai.startVoiceInput')}
                >
                  {isLoading || isTranscribing ? (
                    <Loader2 className="w-10 h-10 text-white animate-spin" strokeWidth={2.5} />
                  ) : (
                    <Mic className="w-10 h-10 text-white" strokeWidth={2.5} />
                  )}
                </button>
              )}

              {/* "Prefer to type?" toggle */}
              {!isListening && !isLoading && !isTranscribing && (
                <button
                  onClick={() => setInputMode('text')}
                  className={`${ds.footnote} text-[#8e8e93] underline underline-offset-2`}
                >
                  Prefer to type?
                </button>
              )}
            </>
          )}
        </div>

      </div>

      {/* Voice recording pill overlay — Claude-style */}
      {isListening && (
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <div className="bg-[#f97316] rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_8px_32px_rgba(249,115,22,0.45)]">
            {/* Cancel */}
            <button
              onClick={handleVoiceCancel}
              className={`w-12 h-12 bg-[rgba(0,0,0,0.18)] rounded-full flex items-center justify-center flex-shrink-0 ${ds.press} ${ds.transition}`}
              aria-label="Cancel recording"
            >
              <X className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>

            {/* Waveform + timer */}
            <div className="flex-1 flex items-center gap-2">
              <div className="flex items-end gap-[3px] flex-1 h-8">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[3px] bg-white rounded-full"
                    style={{
                      height: '4px',
                      animation: `voiceWave 1.1s ease-in-out infinite`,
                      animationDelay: `${i * 0.045}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-white font-semibold text-sm tabular-nums flex-shrink-0">
                {formatRecordingTime(recordingTime)}
              </span>
            </div>

            {/* Confirm */}
            <button
              onClick={handleVoiceConfirm}
              className={`w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 ${ds.press} ${ds.transition}`}
              aria-label="Confirm recording"
            >
              <Check className="w-5 h-5 text-[#f97316]" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

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

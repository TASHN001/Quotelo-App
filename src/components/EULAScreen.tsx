import { useState, useRef } from 'react';
import { Shield, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { designSystem as ds } from '../lib/designSystem';

interface EULAScreenProps {
  viewOnly?: boolean;
}

export function EULAScreen({ viewOnly = false }: EULAScreenProps) {
  const { acceptEula, handleSignOut, setCurrentScreen } = useApp();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (atBottom) setHasScrolledToBottom(true);
  };

  const handleAccept = async () => {
    if (!agreed || isSubmitting) return;
    setIsSubmitting(true);
    await acceptEula();
    setIsSubmitting(false);
  };

  const handleDecline = async () => {
    await handleSignOut();
  };

  const scrollHint = !hasScrolledToBottom;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        {viewOnly && (
          <button
            onClick={() => setCurrentScreen('profile')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-gray-600 dark:text-gray-300 text-xl font-light">←</span>
          </button>
        )}
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 ${ds.radius.md} flex items-center justify-center shadow-[0_3px_8px_rgba(249,115,22,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] flex-shrink-0`}>
            <Shield className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              End User License Agreement
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Quotelo — Last updated: March 2025</p>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-5 py-6 relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-2xl mx-auto space-y-6 pb-4">

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              Please read this agreement carefully before using Quotelo. By creating an account or using the platform, you agree to the terms below.
            </p>
          </div>

          <Section title="1. Introduction">
            <p>This End User License Agreement ("Agreement") is a binding legal contract between you ("User," "you," or "your") and Quotelo ("we," "us," or "our"), governing your access to and use of the Quotelo platform, including all features, AI-powered tools, mobile and web applications, and related services (collectively, the "Service").</p>
            <p className="mt-3">By accepting this Agreement, creating an account, or using any part of the Service, you confirm that you have read, understood, and agree to be bound by these terms.</p>
            <p className="mt-3">If you do not agree to this Agreement, you must not use the Service. Your continued use of the Service following any amendments constitutes acceptance of the revised terms.</p>
          </Section>

          <Section title="2. User Responsibilities">
            <Subsection title="2.1 Accurate Information">
              You agree to provide accurate, complete, and current information when creating an account and when creating invoices or other documents through the Service. You are solely responsible for the accuracy of all business information, client details, invoice amounts, tax rates, and any other data you input into the platform.
            </Subsection>
            <Subsection title="2.2 Lawful Use">
              You agree to use the Service only for lawful business purposes and in compliance with all applicable laws and regulations, including but not limited to tax laws, consumer protection legislation, and anti-fraud regulations applicable in your jurisdiction. You must not use the Service to:
              <ul className="mt-2 ml-4 space-y-1 list-none">
                <Li>Issue fraudulent, fictitious, or misleading invoices</Li>
                <Li>Facilitate money laundering, tax evasion, or financial fraud</Li>
                <Li>Infringe upon the intellectual property rights of third parties</Li>
                <Li>Harass, impersonate, or harm other individuals or businesses</Li>
                <Li>Violate any applicable local, national, or international law</Li>
              </ul>
            </Subsection>
            <Subsection title="2.3 Account Security">
              You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use or suspected breach of security. Quotelo will not be liable for any loss or damage resulting from your failure to safeguard your account credentials.
            </Subsection>
            <Subsection title="2.4 Business Eligibility">
              By using the Service, you represent that you are at least 18 years of age, that you have the legal authority to bind yourself or the business entity you represent to this Agreement, and that you are using the Service for legitimate commercial purposes.
            </Subsection>
          </Section>

          <Section title="3. AI-Generated Content Disclaimer">
            <Subsection title="3.1 Nature of AI Tools">
              Quotelo includes AI-powered features that assist with invoice generation, content suggestions, auto-completion, and other document creation tasks. These features use machine learning models that process your inputs and generate outputs based on patterns and probabilities.
            </Subsection>
            <Subsection title="3.2 No Guarantee of Accuracy">
              AI-generated content is provided as a convenience tool and may contain errors, inaccuracies, omissions, or inappropriate suggestions. The AI does not have knowledge of your specific legal obligations, tax requirements, or business context beyond what you provide.
            </Subsection>
            <Subsection title="3.3 User Responsibility for Review">
              You acknowledge and agree that you are solely responsible for reviewing, verifying, and approving all AI-generated content before sending it to clients, submitting it to tax authorities, or using it for any official purpose. Quotelo expressly disclaims any liability arising from errors in AI-generated invoices, tax calculations, payment terms, or other content that you fail to review or correct.
            </Subsection>
            <Subsection title="3.4 Not Professional Advice">
              Nothing in the Service constitutes accounting advice, legal advice, tax advice, or any other form of professional advice. You should consult qualified professionals for guidance on your specific financial, legal, and tax obligations.
            </Subsection>
          </Section>

          <Section title="4. Limitation of Liability">
            <Subsection title="4.1 No Liability for Financial Loss">
              To the maximum extent permitted by applicable law, Quotelo and its directors, employees, partners, agents, suppliers, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
              <ul className="mt-2 ml-4 space-y-1 list-none">
                <Li>Financial losses arising from invoice errors or inaccuracies</Li>
                <Li>Lost revenue, lost profits, or missed business opportunities</Li>
                <Li>Incorrect tax filings or regulatory non-compliance</Li>
                <Li>Disputes with clients arising from invoices sent via the Service</Li>
                <Li>Loss of data due to technical failures or service interruptions</Li>
              </ul>
            </Subsection>
            <Subsection title="4.2 Cap on Liability">
              Our total liability to you for any claim arising under or in connection with this Agreement shall not exceed the total amount you paid to Quotelo in the three (3) months preceding the event giving rise to the claim.
            </Subsection>
            <Subsection title="4.3 Service Availability">
              Quotelo does not guarantee uninterrupted or error-free availability of the Service. We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time with or without notice. We shall not be liable to you or any third party for any such modification, suspension, or discontinuation.
            </Subsection>
            <Subsection title="4.4 Third-Party Integrations">
              The Service may connect to or integrate with third-party services (including payment processors, email providers, and AI infrastructure providers). Quotelo is not responsible for the availability, accuracy, or practices of any third-party services.
            </Subsection>
          </Section>

          <Section title="5. Intellectual Property">
            <Subsection title="5.1 Quotelo's Ownership">
              The Quotelo platform, including its design, code, features, trademarks, logos, templates, and AI models, is owned exclusively by Quotelo and is protected by applicable intellectual property laws. This Agreement does not grant you any ownership rights in the Service.
            </Subsection>
            <Subsection title="5.2 License to Use">
              Subject to your compliance with this Agreement, Quotelo grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service solely for your internal business purposes.
            </Subsection>
            <Subsection title="5.3 User Data Ownership">
              You retain full ownership of all data you input into the Service, including your business information, client data, invoice content, and financial records ("User Data"). You grant Quotelo a limited license to store, process, and transmit your User Data solely for the purpose of providing the Service to you.
            </Subsection>
            <Subsection title="5.4 Data Portability">
              You may export your invoice data and client information at any time using the tools provided within the Service. Upon termination of your account, you may request a copy of your User Data subject to our data retention policies.
            </Subsection>
            <Subsection title="5.5 Restrictions">
              You must not reproduce, distribute, modify, reverse engineer, decompile, or create derivative works based on the Quotelo platform without prior written consent.
            </Subsection>
          </Section>

          <Section title="6. Subscription and Billing Terms">
            <Subsection title="6.1 Free and Paid Plans">
              The Service is offered on a free tier and optional paid subscription tiers ("Pro Plan"). Features available on each plan are described on our pricing page and within the application. Quotelo reserves the right to modify plan features and pricing with reasonable advance notice.
            </Subsection>
            <Subsection title="6.2 Recurring Charges">
              Paid subscriptions are billed on a recurring basis (monthly or annually, depending on your selected plan). By subscribing to a paid plan, you authorize Quotelo to charge your designated payment method at the then-current subscription price at the start of each billing cycle.
            </Subsection>
            <Subsection title="6.3 Auto-Renewal">
              Your subscription will automatically renew at the end of each billing period unless you cancel before the renewal date. Auto-renewal may be disabled by cancelling your subscription through the Account Settings within the application or by contacting our support team.
            </Subsection>
            <Subsection title="6.4 Cancellation Policy">
              You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period; you will retain access to paid features until that date. Quotelo does not provide pro-rated refunds for partial billing periods unless required by applicable law.
            </Subsection>
            <Subsection title="6.5 Price Changes">
              We may change subscription pricing by giving you at least 30 days' advance notice. Your continued use of a paid subscription after the price change takes effect constitutes acceptance of the new pricing.
            </Subsection>
            <Subsection title="6.6 Taxes">
              Subscription prices do not include applicable taxes unless stated otherwise. You are responsible for all taxes, duties, and levies applicable to your subscription in your jurisdiction.
            </Subsection>
          </Section>

          <Section title="7. Termination">
            <Subsection title="7.1 Termination by You">
              You may terminate this Agreement at any time by deleting your account and discontinuing use of the Service. Account deletion can be requested through the application settings or by contacting support.
            </Subsection>
            <Subsection title="7.2 Termination by Quotelo">
              Quotelo reserves the right to suspend or permanently terminate your access to the Service at any time, with or without notice, if:
              <ul className="mt-2 ml-4 space-y-1 list-none">
                <Li>You breach any provision of this Agreement</Li>
                <Li>Your use of the Service is suspected to be fraudulent or unlawful</Li>
                <Li>Your account has been inactive for an extended period</Li>
                <Li>Quotelo ceases to operate the Service</Li>
                <Li>Required to do so by applicable law or regulatory authority</Li>
              </ul>
            </Subsection>
            <Subsection title="7.3 Effect of Termination">
              Upon termination, your right to access the Service immediately ceases. Provisions of this Agreement that by their nature should survive termination shall continue to apply, including sections on intellectual property, limitation of liability, and governing law.
            </Subsection>
          </Section>

          <Section title="8. Privacy and Data Protection">
            <p>Your use of the Service is also governed by our Privacy Policy, which is incorporated into this Agreement by reference. By using the Service, you consent to the collection and use of your personal data as described in our Privacy Policy. We comply with applicable data protection laws, including the Protection of Personal Information Act (POPIA) in South Africa.</p>
          </Section>

          <Section title="9. Governing Law and Dispute Resolution">
            <Subsection title="9.1 Governing Law">
              This Agreement shall be governed by and construed in accordance with the laws of the Republic of South Africa, without regard to its conflict of law provisions.
            </Subsection>
            <Subsection title="9.2 Jurisdiction">
              You agree that any dispute arising from or relating to this Agreement or the Service shall be subject to the exclusive jurisdiction of the courts located in South Africa. If you are using the Service from outside South Africa, you acknowledge that you are doing so voluntarily and that South African law will govern any disputes.
            </Subsection>
            <Subsection title="9.3 International Users">
              If you are accessing the Service from outside South Africa, you are responsible for compliance with your local laws. You acknowledge that the data processing and storage infrastructure may be located in South Africa or other jurisdictions, and you consent to such transfer and processing.
            </Subsection>
            <Subsection title="9.4 Dispute Resolution">
              Before initiating formal legal proceedings, both parties agree to attempt to resolve disputes through good-faith negotiation. If negotiations fail, disputes shall be referred to mediation before being escalated to arbitration or litigation.
            </Subsection>
          </Section>

          <Section title="10. Amendments">
            <p>Quotelo reserves the right to amend this Agreement at any time. We will notify you of material changes via email or in-app notification at least 14 days before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the revised Agreement.</p>
          </Section>

          <Section title="11. Entire Agreement">
            <p>This Agreement, together with our Privacy Policy and any additional terms applicable to specific features you use, constitutes the entire agreement between you and Quotelo regarding the Service and supersedes all prior agreements, understandings, and representations relating to the same subject matter.</p>
            <p className="mt-3">If any provision of this Agreement is found to be unenforceable, the remaining provisions shall continue in full force and effect.</p>
          </Section>

          <Section title="12. Contact Information">
            <p>If you have any questions about this Agreement, please contact us at:</p>
            <div className="mt-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm">
              <p className="font-semibold text-gray-900 dark:text-white">Quotelo Legal</p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">legal@quotelo.com</p>
              <p className="text-gray-600 dark:text-gray-400">Republic of South Africa</p>
            </div>
          </Section>

        </div>

        {scrollHint && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-md pointer-events-none">
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 animate-bounce" />
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Scroll to read</span>
          </div>
        )}
      </div>

      {!viewOnly && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-5 py-5 space-y-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="sr-only"
              />
              <div
                onClick={() => setAgreed(prev => !prev)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  agreed
                    ? 'bg-orange-500 border-orange-500 shadow-[0_2px_6px_rgba(249,115,22,0.4)]'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-orange-400'
                }`}
              >
                {agreed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              I have read and agree to the{' '}
              <span className="font-semibold text-gray-900 dark:text-white">End User License Agreement</span>
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!agreed || isSubmitting}
            className={`w-full py-4 px-6 rounded-2xl font-semibold text-base transition-all duration-200 ${
              agreed && !isSubmitting
                ? `${ds.button.primary.base} ${ds.button.primary.shadow} ${ds.button.primary.hoverShadow} text-white active:scale-[0.98]`
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Processing...' : 'Accept & Continue'}
          </button>

          <button
            onClick={handleDecline}
            className="w-full py-3 text-center text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium"
          >
            Decline — Sign out
          </button>
        </div>
      )}

      {viewOnly && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-5 py-4">
          <button
            onClick={() => setCurrentScreen('profile')}
            className={`w-full py-3 px-6 rounded-2xl font-semibold text-base ${ds.button.primary.base} ${ds.button.primary.shadow} text-white active:scale-[0.98] transition-all duration-200`}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-3">{title}</h2>
      <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{children}</div>
    </div>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">{title}</h3>
      <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{children}</div>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

import { ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ds } from '../lib/designSystem';

export function TermsScreen() {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Sub-screen header */}
      <div className="flex items-center gap-4 px-4 pt-12 pb-4">
        <button onClick={() => setCurrentScreen('profile')} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <h1 className={`${ds.title2} text-black flex-1`}>Terms &amp; Conditions</h1>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className={`${ds.body} text-[#3c3c43] leading-relaxed`}>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 font-medium">
              These Terms &amp; Conditions govern your use of the Quotelo platform. Please read them carefully before using the Service.
            </p>
          </div>

          <Section title="1. Acceptance of Terms">
            <p>By accessing or using Quotelo ("Service," "platform," "we," "us," or "our"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not access or use the Service.</p>
            <p className="mt-3">These Terms apply to all users of the Service, including visitors, registered users, and contributors of content.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>Quotelo is an AI-powered invoicing and document management platform designed to help businesses and freelancers create, manage, and send professional invoices, quotes, and related financial documents. The Service includes:</p>
            <ul className="mt-3 space-y-1.5 list-none">
              <Li>AI-assisted invoice and quote generation</Li>
              <Li>Client management tools</Li>
              <Li>Document templates and customization</Li>
              <Li>Payment tracking and reminders</Li>
              <Li>Business profile and branding management</Li>
            </ul>
          </Section>

          <Section title="3. User Accounts">
            <Subsection title="3.1 Registration">
              To use the Service, you must create an account using a valid email address and password. You agree to provide accurate and complete information during registration and to keep your account information updated.
            </Subsection>
            <Subsection title="3.2 Account Security">
              You are solely responsible for maintaining the confidentiality of your account credentials. You must notify us immediately at support@quotelo.com if you suspect unauthorized access to your account. We are not liable for any losses arising from unauthorized use of your account.
            </Subsection>
            <Subsection title="3.3 One Account Per User">
              Each user may maintain only one account. Creating multiple accounts to circumvent plan restrictions or for fraudulent purposes is prohibited.
            </Subsection>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree to use the Service only for lawful purposes. You must not use the Service to:</p>
            <ul className="mt-3 space-y-1.5 list-none">
              <Li>Issue fraudulent, fictitious, or misleading invoices or financial documents</Li>
              <Li>Violate any applicable laws, regulations, or third-party rights</Li>
              <Li>Transmit harmful, offensive, defamatory, or illegal content</Li>
              <Li>Attempt to gain unauthorized access to the Service or its infrastructure</Li>
              <Li>Introduce malware, viruses, or other malicious code</Li>
              <Li>Scrape, crawl, or harvest data from the Service without authorization</Li>
              <Li>Use the Service in any way that could damage, disable, or impair it</Li>
              <Li>Impersonate any person or entity or misrepresent your affiliation</Li>
            </ul>
            <p className="mt-3">Violation of these acceptable use requirements may result in immediate termination of your account.</p>
          </Section>

          <Section title="5. Content and Data">
            <Subsection title="5.1 Your Content">
              You retain ownership of all data, content, and information you submit to the Service ("Your Content"), including business details, client information, and invoice data. By using the Service, you grant Quotelo a limited, non-exclusive license to store and process Your Content solely to provide the Service.
            </Subsection>
            <Subsection title="5.2 Accuracy of Content">
              You are solely responsible for the accuracy, legality, and appropriateness of Your Content. Quotelo does not verify, review, or endorse any content you create using the Service.
            </Subsection>
            <Subsection title="5.3 Data Backup">
              While we implement reasonable data protection measures, you are responsible for maintaining independent backups of critical business data. Quotelo is not liable for loss of data due to technical failures, user error, or service discontinuation.
            </Subsection>
          </Section>

          <Section title="6. AI-Powered Features">
            <p>Quotelo uses artificial intelligence to assist with invoice creation, content generation, and smart suggestions. You acknowledge that:</p>
            <ul className="mt-3 space-y-1.5 list-none">
              <Li>AI-generated outputs are automated suggestions and may contain errors</Li>
              <Li>You must review all AI-generated content before use</Li>
              <Li>Quotelo does not guarantee the accuracy of AI-generated content</Li>
              <Li>AI features are provided as-is and may change or be discontinued</Li>
            </ul>
          </Section>

          <Section title="7. Subscriptions and Payment">
            <Subsection title="7.1 Free Tier">
              Quotelo offers a free tier with limited features. Free tier users are subject to usage limits that may change at any time with notice.
            </Subsection>
            <Subsection title="7.2 Paid Subscriptions">
              Paid subscription plans provide access to additional features and higher usage limits. Subscription fees are charged in advance on a monthly or annual basis as selected during sign-up.
            </Subsection>
            <Subsection title="7.3 Payment Processing">
              Payments are processed through third-party payment processors. By subscribing, you agree to the payment processor's terms of service. Quotelo does not store your payment card information.
            </Subsection>
            <Subsection title="7.4 Refund Policy">
              Subscription fees are non-refundable except where required by applicable law. If you cancel a paid subscription, you will retain access until the end of the current billing period.
            </Subsection>
          </Section>

          <Section title="8. Intellectual Property">
            <Subsection title="8.1 Our Property">
              The Quotelo platform, including all software, designs, logos, trademarks, templates, and AI models, is owned by Quotelo and protected by intellectual property laws. Nothing in these Terms transfers ownership of any Quotelo intellectual property to you.
            </Subsection>
            <Subsection title="8.2 License Grant">
              Subject to these Terms, we grant you a limited, non-exclusive, non-sublicensable, revocable license to use the Service for your personal or internal business purposes.
            </Subsection>
            <Subsection title="8.3 Restrictions">
              You may not copy, modify, distribute, sell, sublicense, reverse engineer, or create derivative works from any part of the Service without our prior written consent.
            </Subsection>
          </Section>

          <Section title="9. Privacy">
            <p>Your use of the Service is governed by our Privacy Policy, which describes how we collect, use, and protect your personal information. By using the Service, you consent to our data practices as described in the Privacy Policy.</p>
            <p className="mt-3">We comply with applicable data protection laws, including the Protection of Personal Information Act (POPIA) in South Africa.</p>
          </Section>

          <Section title="10. Third-Party Services">
            <p>The Service may integrate with third-party services such as payment processors, email providers, and AI infrastructure. Quotelo is not responsible for the availability, accuracy, or practices of third-party services. Your use of any third-party service is subject to that service's terms and privacy policy.</p>
          </Section>

          <Section title="11. Disclaimers">
            <Subsection title="11.1 As-Is Service">
              The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.
            </Subsection>
            <Subsection title="11.2 Not Professional Advice">
              Content generated through the Service does not constitute accounting, legal, tax, or financial advice. You should consult qualified professionals for advice specific to your situation.
            </Subsection>
          </Section>

          <Section title="12. Limitation of Liability">
            <p>To the maximum extent permitted by law, Quotelo and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service, regardless of whether we have been advised of the possibility of such damages.</p>
            <p className="mt-3">Our total cumulative liability to you shall not exceed the greater of (a) the fees you paid to us in the three months preceding the claim, or (b) ZAR 500.</p>
          </Section>

          <Section title="13. Indemnification">
            <p>You agree to indemnify, defend, and hold harmless Quotelo and its affiliates, directors, employees, and agents from and against any claims, liabilities, damages, losses, or expenses (including reasonable legal fees) arising from:</p>
            <ul className="mt-3 space-y-1.5 list-none">
              <Li>Your use of the Service</Li>
              <Li>Your violation of these Terms</Li>
              <Li>Your Content or your use of Your Content</Li>
              <Li>Your violation of any third-party rights</Li>
            </ul>
          </Section>

          <Section title="14. Termination">
            <p>We reserve the right to suspend or terminate your access to the Service at any time, with or without cause, with or without notice. You may terminate your account at any time through the application settings.</p>
            <p className="mt-3">Upon termination, your right to use the Service ceases immediately. Sections that by their nature should survive termination — including intellectual property, disclaimers, limitation of liability, and governing law — will remain in effect.</p>
          </Section>

          <Section title="15. Changes to Terms">
            <p>We reserve the right to update these Terms at any time. We will notify you of material changes via email or in-app notification at least 14 days before they take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated Terms.</p>
          </Section>

          <Section title="16. Governing Law">
            <p>These Terms are governed by and construed in accordance with the laws of the Republic of South Africa. Any dispute arising from these Terms shall be subject to the exclusive jurisdiction of South African courts.</p>
            <p className="mt-3">If you access the Service from outside South Africa, you are responsible for compliance with local laws applicable to your use of the Service.</p>
          </Section>

          <Section title="17. Contact">
            <p>For questions about these Terms, please contact us:</p>
            <div className="mt-3 bg-[#f2f2f7] rounded-lg p-4 text-sm">
              <p className="font-semibold text-black">Quotelo Legal</p>
              <p className="text-[#3c3c43] mt-1">legal@quotelo.com</p>
              <p className="text-[#3c3c43]">Republic of South Africa</p>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#f2f2f7] rounded-xl p-5 mb-4">
      <h2 className="text-sm font-bold text-black uppercase tracking-wide mb-3">{title}</h2>
      <div className="text-sm text-[#3c3c43] leading-relaxed">{children}</div>
    </div>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-black mb-1.5">{title}</h3>
      <div className="text-sm text-[#3c3c43] leading-relaxed">{children}</div>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-[#3c3c43]">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#f97316] flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

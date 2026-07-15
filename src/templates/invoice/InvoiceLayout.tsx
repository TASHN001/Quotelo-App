import type { InvoiceData } from '../../lib/types';
import { useApp } from '../../context/AppContext';
import { formatCurrency as formatCurrencyUtil, type Currency } from '../../lib/currency';

const AI_BADGE_LOGO = '/Quotelo_Logo.png';

interface InvoiceLayoutProps {
  data: InvoiceData;
  styles: {
    container?: string;
    header?: string;
    logoContainer?: string;
    logo?: string;
    invoiceTitle?: string;
    invoiceNumber?: string;
    invoiceNumberLabel?: string;
    metaRow?: string;
    infoBlock?: string;
    infoLabel?: string;
    infoText?: string;
    dateRow?: string;
    dateLabel?: string;
    dateValue?: string;
    tableContainer?: string;
    tableHeader?: string;
    tableHeaderCell?: string;
    tableRow?: string;
    tableCell?: string;
    totalsContainer?: string;
    totalRow?: string;
    totalLabel?: string;
    totalValue?: string;
    grandTotalRow?: string;
    grandTotalLabel?: string;
    grandTotalValue?: string;
    footer?: string;
    footerLabel?: string;
    footerText?: string;
  };
}

export function InvoiceLayout({ data, styles }: InvoiceLayoutProps) {
  const { t } = useApp();

  const formatCurrencyWithSymbol = (amount: number) => {
    return formatCurrencyUtil(amount, (data.currency || 'ZAR') as Currency);
  };

  const documentType = data.documentType || 'Invoice';
  const documentTitle = documentType.toUpperCase();

  const getDocumentNumberPrefix = () => {
    switch (documentType) {
      case 'Quote':
        return 'QUO';
      case 'Receipt':
        return 'REC';
      default:
        return 'INV';
    }
  };

  const formatDocumentNumber = (number: string) => {
    const prefix = getDocumentNumberPrefix();
    if (number.startsWith('INV-') || number.startsWith('QUO-') || number.startsWith('REC-')) {
      return `${prefix}-${number.substring(4)}`;
    }
    if (number.includes('-')) {
      return number;
    }
    return `${prefix}-${number}`;
  };

  return (
    <div className={styles.container || 'bg-white p-8 w-full'}>
      <div className={styles.header || 'mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-gray-900'}>
        {/* Three-column header: logo | title | doc-number — all vertically centred */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>

          {/* Left: Logo */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div className={styles.logoContainer || 'flex-shrink-0'} style={styles.logoContainer ? undefined : { width: 80, height: 80 }}>
              {data.business.logoUrl ? (
                <img
                  src={data.business.logoUrl}
                  alt={data.business.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span className="text-xs text-gray-400 uppercase tracking-wider">Your Logo</span>
              )}
            </div>
          </div>

          {/* Centre: Document Title */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h1 className={styles.invoiceTitle || 'text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-none'} style={{ margin: 0 }}>
              {documentTitle}
            </h1>
          </div>

          {/* Right: Document Number */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'right' }}>
              <p className={styles.invoiceNumberLabel || 'text-xs font-semibold text-gray-500 uppercase tracking-widest'}>
                NO.
              </p>
              <p className={styles.invoiceNumber || 'text-sm text-gray-800 font-medium'}>
                {formatDocumentNumber(data.invoice.number)}
              </p>
            </div>
          </div>

        </div>
      </div>

      <div className={styles.metaRow || 'grid grid-cols-2 gap-8 mb-6'}>
        <div className={styles.infoBlock || ''}>
          <p className={styles.infoLabel || 'text-xs font-semibold text-gray-500 uppercase mb-2'}>
            {t('invoice.from')}
          </p>
          <p className={styles.infoText || 'text-sm font-semibold text-gray-900'}>{data.business.name}</p>
          {data.business.address && (
            <>
              {data.business.address.street && (
                <p className={styles.infoText || 'text-sm text-gray-700'}>{data.business.address.street}</p>
              )}
              {data.business.address.city && (
                <p className={styles.infoText || 'text-sm text-gray-700'}>{data.business.address.city}</p>
              )}
              {data.business.address.postalCode && (
                <p className={styles.infoText || 'text-sm text-gray-700'}>{data.business.address.postalCode}</p>
              )}
              {data.business.address.country && (
                <p className={styles.infoText || 'text-sm text-gray-700'}>{data.business.address.country}</p>
              )}
            </>
          )}
          {data.business.email && (
            <p className={styles.infoText || 'text-sm text-gray-700'}>{data.business.email}</p>
          )}
          {data.business.phone && (
            <p className={styles.infoText || 'text-sm text-gray-700'}>{data.business.phone}</p>
          )}
          {data.business.registrationNumber && (
            <p className={styles.infoText || 'text-sm text-gray-700'}>
              Reg. No: {data.business.registrationNumber}
            </p>
          )}
          {data.business.taxNumber && (
            <p className={styles.infoText || 'text-sm text-gray-700'}>
              Tax No: {data.business.taxNumber}
            </p>
          )}
          {data.business.vatNumber && (
            <p className={styles.infoText || 'text-sm text-gray-700'}>
              VAT No: {data.business.vatNumber}
            </p>
          )}
        </div>

        <div className={styles.infoBlock || ''}>
          <p className={styles.infoLabel || 'text-xs font-semibold text-gray-500 uppercase mb-2'}>
            {t('invoice.billTo')}
          </p>
          <p className={styles.infoText || 'text-sm font-semibold text-gray-900'}>{data.client.name}</p>
          {data.client.address && (
            <>
              {data.client.address.street && (
                <p className={styles.infoText || 'text-sm text-gray-700'}>{data.client.address.street}</p>
              )}
              {data.client.address.city && (
                <p className={styles.infoText || 'text-sm text-gray-700'}>{data.client.address.city}</p>
              )}
              {data.client.address.postalCode && (
                <p className={styles.infoText || 'text-sm text-gray-700'}>{data.client.address.postalCode}</p>
              )}
              {data.client.address.country && (
                <p className={styles.infoText || 'text-sm text-gray-700'}>{data.client.address.country}</p>
              )}
            </>
          )}
          {data.client.email && (
            <p className={styles.infoText || 'text-sm text-gray-700'}>{data.client.email}</p>
          )}
          {data.client.phone && (
            <p className={styles.infoText || 'text-sm text-gray-700'}>{data.client.phone}</p>
          )}
          {data.client.taxNumber && (
            <p className={styles.infoText || 'text-sm text-gray-700'}>
              Tax No: {data.client.taxNumber}
            </p>
          )}
        </div>
      </div>

      <div className={styles.dateRow || 'mb-6 sm:mb-8'}>
        <div className="flex gap-6 sm:gap-8">
          <div>
            <p className={styles.dateLabel || 'text-xs font-semibold text-gray-500 uppercase'}>
              {t('invoice.issueDate')}
            </p>
            <p className={styles.dateValue || 'text-sm text-gray-900 mt-1'}>
              {data.invoice.issueDate}
            </p>
          </div>
          <div>
            <p className={styles.dateLabel || 'text-xs font-semibold text-gray-500 uppercase'}>
              {t('invoice.dueDate')}
            </p>
            <p className={styles.dateValue || 'text-sm text-gray-900 mt-1'}>
              {data.invoice.dueDate}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer || 'w-full overflow-x-auto mb-6 sm:mb-8 -mx-4 sm:mx-0'}>
        <div className="min-w-full inline-block px-4 sm:px-0">
          <table className="w-full min-w-full">
            <thead>
              <tr className={styles.tableHeader || 'border-b-2 border-gray-300'}>
                <th className={styles.tableHeaderCell || 'text-left py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-gray-700'}>
                  {t('invoice.description')}
                </th>
                <th className={styles.tableHeaderCell || 'text-right py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-gray-700 w-12 sm:w-16'}>
                  {t('invoice.quantity')}
                </th>
                <th className={styles.tableHeaderCell || 'text-right py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-gray-700 w-20 sm:w-24'}>
                  Price
                </th>
                <th className={styles.tableHeaderCell || 'text-right py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-gray-700 w-20 sm:w-28'}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className={styles.tableRow || 'border-b border-gray-200'}>
                  <td className={styles.tableCell || 'py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm text-gray-900 break-words'}>
                    {item.description}
                  </td>
                  <td className={styles.tableCell || 'py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm text-gray-700 text-right whitespace-nowrap'}>
                    {item.quantity}
                  </td>
                  <td className={styles.tableCell || 'py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm text-gray-700 text-right whitespace-nowrap'}>
                    {formatCurrencyWithSymbol(item.unitPrice)}
                  </td>
                  <td className={styles.tableCell || 'py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-medium text-gray-900 text-right whitespace-nowrap'}>
                    {formatCurrencyWithSymbol(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.totalsContainer || 'flex justify-end mb-6 sm:mb-8'}>
        <div className="w-full sm:w-80 space-y-1 sm:space-y-2">
          <div className={styles.totalRow || 'flex justify-between py-1.5 sm:py-2'}>
            <span className={styles.totalLabel || 'text-xs sm:text-sm text-gray-600'}>{t('invoice.subtotal')}</span>
            <span className={styles.totalValue || 'text-xs sm:text-sm text-gray-900'}>
              {formatCurrencyWithSymbol(data.totals.subtotal)}
            </span>
          </div>
          <div className={styles.totalRow || 'flex justify-between py-1.5 sm:py-2'}>
            <span className={styles.totalLabel || 'text-xs sm:text-sm text-gray-600'}>{t('invoice.tax')}</span>
            <span className={styles.totalValue || 'text-xs sm:text-sm text-gray-900'}>
              {formatCurrencyWithSymbol(data.totals.tax)}
            </span>
          </div>
          <div className={styles.grandTotalRow || 'flex justify-between py-2 sm:py-3 border-t-2 border-gray-900'}>
            <span className={styles.grandTotalLabel || 'text-base sm:text-lg font-bold text-gray-900'}>
              {t('invoice.total')}
            </span>
            <span className={styles.grandTotalValue || 'text-lg sm:text-xl font-bold text-gray-900'}>
              {formatCurrencyWithSymbol(data.totals.total)}
            </span>
          </div>
        </div>
      </div>

      {(data.paymentDetails || data.paymentInstructions || data.paymentTerms || data.notes || data.invoice.reference) && (
        <div className={styles.footer || 'space-y-4 mt-6'}>
          {data.invoice.reference && (
            <div>
              <p className={styles.footerLabel || 'text-xs font-semibold text-gray-500 uppercase mb-1'}>
                Reference
              </p>
              <p className={styles.footerText || 'text-sm text-gray-700'}>{data.invoice.reference}</p>
            </div>
          )}

          {data.paymentDetails && (
            <div>
              <p className={styles.footerLabel || 'text-xs font-semibold text-gray-500 uppercase mb-2'}>
                Payment Details
              </p>
              <div className="space-y-1">
                {data.paymentDetails.bankName && (
                  <p className={styles.footerText || 'text-sm text-gray-700'}>
                    <span className="font-medium">Bank:</span> {data.paymentDetails.bankName}
                  </p>
                )}
                {data.paymentDetails.accountHolder && (
                  <p className={styles.footerText || 'text-sm text-gray-700'}>
                    <span className="font-medium">Account Holder:</span> {data.paymentDetails.accountHolder}
                  </p>
                )}
                {data.paymentDetails.accountNumber && (
                  <p className={styles.footerText || 'text-sm text-gray-700'}>
                    <span className="font-medium">Account Number:</span> {data.paymentDetails.accountNumber}
                  </p>
                )}
                {data.paymentDetails.routingNumber && (
                  <p className={styles.footerText || 'text-sm text-gray-700'}>
                    <span className="font-medium">Routing Number:</span> {data.paymentDetails.routingNumber}
                  </p>
                )}
                {data.paymentDetails.swiftCode && (
                  <p className={styles.footerText || 'text-sm text-gray-700'}>
                    <span className="font-medium">SWIFT Code:</span> {data.paymentDetails.swiftCode}
                  </p>
                )}
                {data.paymentDetails.paymentLink && (
                  <p className={styles.footerText || 'text-sm text-gray-700'}>
                    <span className="font-medium">Online Payment:</span>{' '}
                    <a href={data.paymentDetails.paymentLink} className="text-blue-600 hover:underline">
                      {data.paymentDetails.paymentLink}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {data.paymentInstructions && (
            <div>
              <p className={styles.footerLabel || 'text-xs font-semibold text-gray-500 uppercase mb-2'}>
                Payment Instructions
              </p>
              <p className={styles.footerText || 'text-sm text-gray-700 whitespace-pre-line'}>
                {data.paymentInstructions}
              </p>
            </div>
          )}

          {data.paymentTerms && (
            <div>
              <p className={styles.footerLabel || 'text-xs font-semibold text-gray-500 uppercase mb-2'}>
                Payment Terms
              </p>
              <p className={`${styles.footerText || 'text-sm text-gray-700'} whitespace-pre-line`}>
                {data.paymentTerms}
              </p>
            </div>
          )}

          {data.notes && (
            <div>
              <p className={styles.footerLabel || 'text-xs font-semibold text-gray-500 uppercase mb-1'}>
                {t('invoice.notes')}
              </p>
              <p className={styles.footerText || 'text-sm text-gray-700'}>{data.notes}</p>
            </div>
          )}
        </div>
      )}

      {data.signatureDataUrl && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('invoice.signature')}</p>
          <img
            src={data.signatureDataUrl}
            alt="Signature"
            className="h-16 object-contain"
          />
        </div>
      )}

      {data.footer && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">{data.footer}</p>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-2 opacity-70">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Generated by
        </span>
        <img
          src={AI_BADGE_LOGO}
          alt="Logo"
          className="h-5 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}

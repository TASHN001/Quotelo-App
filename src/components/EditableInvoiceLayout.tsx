import type { InvoiceData, Document, DocumentLineItem } from '../lib/types';
import { useApp } from '../context/AppContext';
import { formatCurrency as formatCurrencyUtil, type Currency } from '../lib/currency';
import { EditableField } from './EditableField';
import { EditableDateField } from './EditableDateField';
import { EditableLineItems, type LineItem } from './EditableLineItems';

interface EditableInvoiceLayoutProps {
  data: InvoiceData;
  document: Document;
  lineItems: DocumentLineItem[];
  onUpdate: (field: string, value: any) => Promise<void>;
  onUpdateLineItems: (items: LineItem[]) => Promise<void>;
  styles: {
    container?: string;
    header?: string;
    logoContainer?: string;
    logo?: string;
    invoiceTitle?: string;
    invoiceNumber?: string;
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

export function EditableInvoiceLayout({
  data,
  document,
  lineItems,
  onUpdate,
  onUpdateLineItems,
  styles
}: EditableInvoiceLayoutProps) {
  const { t } = useApp();

  const formatCurrencyWithSymbol = (amount: number) => {
    return formatCurrencyUtil(amount, (data.currency || 'ZAR') as Currency);
  };

  const convertLineItemsToEditable = (): LineItem[] => {
    return lineItems.map(item => ({
      id: item.id,
      description: item.name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      total: item.line_total
    }));
  };

  const calculateTotals = (items: LineItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * (document.tax_total / document.subtotal || 0);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  return (
    <div className={styles.container || 'bg-white p-8 w-full'}>
      <div className={styles.header || 'flex flex-col sm:flex-row items-start justify-between mb-6 sm:mb-8 gap-4'}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={styles.logoContainer || 'w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0'}>
            {data.business.logoUrl ? (
              <img
                src={data.business.logoUrl}
                alt={data.business.name}
                className={styles.logo || 'w-full h-full object-contain'}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-xs text-gray-400 uppercase tracking-wider">Your Logo</span>
            )}
          </div>
          <h1 className={styles.invoiceTitle || 'text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900'}>
            {t('invoice.title')}
          </h1>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">NO.</p>
          <EditableField
            value={document.document_number}
            onSave={async (value) => onUpdate('document_number', value)}
            className={styles.invoiceNumber || 'text-sm text-gray-600 font-medium'}
          />
        </div>
      </div>

      <div className={styles.metaRow || 'grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'}>
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
              {(data.business.address.city || data.business.address.postalCode) && (
                <p className={styles.infoText || 'text-sm text-gray-700'}>
                  {[data.business.address.city, data.business.address.postalCode].filter(Boolean).join(', ')}
                </p>
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

          <div className={styles.dateRow || 'mt-4 sm:mt-6 space-y-2'}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <p className={styles.dateLabel || 'text-xs font-semibold text-gray-500 uppercase mb-1'}>
                  {t('invoice.issueDate')}
                </p>
                <EditableDateField
                  value={document.issue_date}
                  onSave={async (value) => onUpdate('issue_date', value)}
                  className={styles.dateValue || 'text-sm text-gray-900'}
                  title="Issue Date"
                  maxDate={document.due_date}
                />
              </div>
              <div className="flex-1">
                <p className={styles.dateLabel || 'text-xs font-semibold text-gray-500 uppercase mb-1'}>
                  {t('invoice.dueDate')}
                </p>
                <EditableDateField
                  value={document.due_date}
                  onSave={async (value) => onUpdate('due_date', value)}
                  className={styles.dateValue || 'text-sm text-gray-900'}
                  title="Due Date"
                  minDate={document.issue_date}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.infoBlock || ''}>
          <p className={styles.infoLabel || 'text-xs font-semibold text-gray-500 uppercase mb-2'}>
            {t('invoice.billTo')}
          </p>
          <EditableField
            value={document.client_name}
            onSave={async (value) => onUpdate('client_name', value)}
            className={styles.infoText || 'text-sm font-semibold text-gray-900'}
          />
          {document.client_address && (
            <EditableField
              value={document.client_address}
              onSave={async (value) => onUpdate('client_address', value)}
              className={styles.infoText || 'text-sm text-gray-700'}
              multiline
            />
          )}
          {document.client_email && (
            <EditableField
              value={document.client_email}
              onSave={async (value) => onUpdate('client_email', value)}
              className={styles.infoText || 'text-sm text-gray-700'}
            />
          )}
          {document.client_phone && (
            <EditableField
              value={document.client_phone}
              onSave={async (value) => onUpdate('client_phone', value)}
              className={styles.infoText || 'text-sm text-gray-700'}
            />
          )}
        </div>
      </div>

      <EditableLineItems
        items={convertLineItemsToEditable()}
        currency={(data.currency || 'ZAR') as Currency}
        onUpdate={onUpdateLineItems}
        styles={{
          tableContainer: styles.tableContainer,
          tableHeader: styles.tableHeader,
          tableHeaderCell: styles.tableHeaderCell,
          tableRow: styles.tableRow,
          tableCell: styles.tableCell
        }}
      />

      <div className={styles.totalsContainer || 'flex justify-end mb-6 sm:mb-8'}>
        <div className="w-full sm:w-80 space-y-1 sm:space-y-2">
          <div className={styles.totalRow || 'flex justify-between py-1.5 sm:py-2'}>
            <span className={styles.totalLabel || 'text-xs sm:text-sm text-gray-600'}>{t('invoice.subtotal')}</span>
            <span className={styles.totalValue || 'text-xs sm:text-sm text-gray-900'}>
              {formatCurrencyWithSymbol(document.subtotal)}
            </span>
          </div>
          <div className={styles.totalRow || 'flex justify-between py-1.5 sm:py-2'}>
            <span className={styles.totalLabel || 'text-xs sm:text-sm text-gray-600'}>{t('invoice.tax')}</span>
            <span className={styles.totalValue || 'text-xs sm:text-sm text-gray-900'}>
              {formatCurrencyWithSymbol(document.tax_total)}
            </span>
          </div>
          <div className={styles.grandTotalRow || 'flex justify-between py-2 sm:py-3 border-t-2 border-gray-900'}>
            <span className={styles.grandTotalLabel || 'text-base sm:text-lg font-bold text-gray-900'}>
              {t('invoice.total')}
            </span>
            <span className={styles.grandTotalValue || 'text-lg sm:text-xl font-bold text-gray-900'}>
              {formatCurrencyWithSymbol(document.total)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.footer || 'space-y-6 mt-8'}>
          {document.reference && (
            <div>
              <p className={styles.footerLabel || 'text-xs font-semibold text-gray-500 uppercase mb-1'}>
                Reference
              </p>
              <EditableField
                value={document.reference}
                onSave={async (value) => onUpdate('reference', value)}
                className={styles.footerText || 'text-sm text-gray-700'}
              />
            </div>
          )}

          <div>
            <p className={styles.footerLabel || 'text-xs font-semibold text-gray-500 uppercase mb-2'}>
              Payment Terms
            </p>
            {document.payment_terms ? (
              <EditableField
                value={document.payment_terms}
                onSave={async (value) => onUpdate('payment_terms', value)}
                className={styles.footerText || 'text-sm text-gray-700'}
                placeholder="Type any payment details here..."
                multiline
              />
            ) : (
              <p
                data-pdf-hide
                className="text-sm text-[#c7c7cc] cursor-text"
                onClick={() => onUpdate('payment_terms', '')}
              >
                Type any payment details here...
              </p>
            )}
          </div>

          {document.notes && (
            <div>
              <p className={styles.footerLabel || 'text-xs font-semibold text-gray-500 uppercase mb-1'}>
                {t('invoice.notes')}
              </p>
              <EditableField
                value={document.notes}
                onSave={async (value) => onUpdate('notes', value)}
                className={styles.footerText || 'text-sm text-gray-700'}
                multiline
              />
            </div>
          )}
      </div>

      {data.footer && (
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <EditableField
            value={data.footer}
            onSave={async (value) => onUpdate('footer_message', value)}
            className="text-sm text-gray-600"
            multiline
          />
        </div>
      )}

      {data.signatureDataUrl && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('invoice.signature')}</p>
          <img
            src={data.signatureDataUrl}
            alt="Signature"
            className="h-16 object-contain"
          />
        </div>
      )}
    </div>
  );
}

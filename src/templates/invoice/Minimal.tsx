import type { InvoiceData } from '../../lib/types';
import { InvoiceLayout } from './InvoiceLayout';

interface MinimalInvoiceProps {
  data: InvoiceData;
  pdfMode?: boolean;
}

export function MinimalInvoice({ data, pdfMode }: MinimalInvoiceProps) {
  return (
    <InvoiceLayout
      data={data}
      pdfMode={pdfMode}
      styles={{
        container: 'bg-white p-4 sm:p-6 md:p-8 w-full max-w-full box-border',
        header: 'flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-gray-900 gap-4',
        logoContainer: 'flex-shrink-0 w-16 h-16 overflow-hidden rounded-lg',
        invoiceTitle: 'text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900',
        invoiceNumber: 'text-xs sm:text-sm text-gray-600 font-medium',
        metaRow: 'grid grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8',
        infoLabel: 'text-xs font-semibold text-gray-500 uppercase mb-2',
        infoText: 'text-xs sm:text-sm text-gray-900',
        dateRow: 'mt-4 sm:mt-6 space-y-2',
        dateLabel: 'text-xs font-semibold text-gray-500 uppercase',
        dateValue: 'text-xs sm:text-sm text-gray-900 mt-1',
        tableContainer: 'w-full overflow-x-auto mb-6 sm:mb-8 -mx-4 sm:mx-0',
        tableHeader: 'border-b-2 border-gray-900',
        tableHeaderCell: 'text-left py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-gray-900',
        tableRow: 'border-b border-gray-200',
        tableCell: 'py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm text-gray-900',
        totalsContainer: 'flex justify-end mb-6 sm:mb-8',
        totalRow: 'flex justify-between py-1.5 sm:py-2 text-xs sm:text-sm',
        totalLabel: 'text-gray-600',
        totalValue: 'text-gray-900',
        grandTotalRow: 'flex justify-between py-2 sm:py-3 border-t-2 border-gray-900',
        grandTotalLabel: 'text-base sm:text-lg font-bold text-gray-900',
        grandTotalValue: 'text-lg sm:text-xl font-bold text-gray-900',
        footer: 'space-y-3 sm:space-y-4 mt-6 sm:mt-8',
        footerLabel: 'text-xs font-semibold text-gray-500 uppercase mb-1',
        footerText: 'text-xs sm:text-sm text-gray-700'
      }}
    />
  );
}

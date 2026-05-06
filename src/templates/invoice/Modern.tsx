import type { InvoiceData } from '../../lib/types';
import { InvoiceLayout } from './InvoiceLayout';

interface ModernInvoiceProps {
  data: InvoiceData;
}

export function ModernInvoice({ data }: ModernInvoiceProps) {
  return (
    <InvoiceLayout
      data={data}
      styles={{
        container: 'bg-white p-4 sm:p-6 md:p-8 w-full max-w-full box-border',
        header: 'flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 pb-4 sm:pb-6 gap-4',
        logoContainer: 'flex items-center justify-center flex-shrink-0',
        invoiceTitle: 'text-3xl sm:text-5xl md:text-6xl font-bold text-orange-600',
        invoiceNumber: 'text-xs sm:text-sm text-gray-600 font-medium',
        metaRow: 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8',
        infoBlock: 'bg-orange-50 p-3 sm:p-4 rounded-xl',
        infoLabel: 'text-xs font-semibold text-orange-700 uppercase mb-2',
        infoText: 'text-xs sm:text-sm text-gray-900',
        dateRow: 'mt-3 sm:mt-4 space-y-2',
        dateLabel: 'text-xs font-semibold text-orange-700 uppercase',
        dateValue: 'text-xs sm:text-sm text-gray-900 mt-1',
        tableContainer: 'w-full overflow-x-auto mb-6 sm:mb-8 rounded-xl overflow-hidden shadow-sm -mx-4 sm:mx-0',
        tableHeader: 'bg-gradient-to-r from-orange-500 to-orange-600',
        tableHeaderCell: 'text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-white',
        tableRow: 'border-b border-gray-200 hover:bg-orange-50 transition-colors',
        tableCell: 'py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900',
        totalsContainer: 'flex justify-end mb-6 sm:mb-8',
        totalRow: 'flex justify-between py-1.5 sm:py-2 text-xs sm:text-sm border-b border-gray-200',
        totalLabel: 'text-gray-600',
        totalValue: 'text-gray-900 font-medium',
        grandTotalRow: 'flex justify-between py-2 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg mt-2',
        grandTotalLabel: 'text-base sm:text-lg font-bold',
        grandTotalValue: 'text-lg sm:text-xl font-bold',
        footer: 'space-y-3 sm:space-y-4 mt-6 sm:mt-8',
        footerLabel: 'text-xs font-semibold text-orange-700 uppercase mb-1',
        footerText: 'text-xs sm:text-sm text-gray-700'
      }}
    />
  );
}

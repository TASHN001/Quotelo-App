import type { InvoiceData } from '../../lib/types';
import { InvoiceLayout } from './InvoiceLayout';

interface ProfessionalInvoiceProps {
  data: InvoiceData;
}

export function ProfessionalInvoice({ data }: ProfessionalInvoiceProps) {
  return (
    <InvoiceLayout
      data={data}
      styles={{
        container: 'bg-white p-4 sm:p-6 md:p-8 w-full max-w-full box-border',
        header: 'flex flex-col sm:flex-row items-start justify-between mb-6 sm:mb-8 pb-4 sm:pb-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 rounded-xl -mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 gap-4',
        logoContainer: 'w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg bg-white flex-shrink-0',
        invoiceTitle: 'text-3xl sm:text-5xl md:text-6xl font-bold text-white',
        invoiceNumber: 'text-xs sm:text-sm text-blue-100 font-medium',
        metaRow: 'grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8',
        infoBlock: 'border-l-4 border-blue-600 pl-3 sm:pl-4',
        infoLabel: 'text-xs font-bold text-blue-600 uppercase mb-2',
        infoText: 'text-xs sm:text-sm text-gray-900',
        dateRow: 'mt-3 sm:mt-4 space-y-2',
        dateLabel: 'text-xs font-bold text-blue-600 uppercase',
        dateValue: 'text-xs sm:text-sm text-gray-900 mt-1',
        tableContainer: 'w-full overflow-x-auto mb-6 sm:mb-8 rounded-lg border border-gray-200 overflow-hidden -mx-4 sm:mx-0',
        tableHeader: 'bg-blue-50',
        tableHeaderCell: 'text-left py-2 sm:py-3 md:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-blue-900',
        tableRow: 'border-b border-gray-200 even:bg-gray-50',
        tableCell: 'py-2 sm:py-3 md:py-4 px-2 sm:px-4 text-xs sm:text-sm text-gray-900',
        totalsContainer: 'flex justify-end mb-6 sm:mb-8',
        totalRow: 'flex justify-between py-1.5 sm:py-2 text-xs sm:text-sm border-b border-gray-200',
        totalLabel: 'text-gray-600',
        totalValue: 'text-gray-900 font-medium',
        grandTotalRow: 'flex justify-between py-3 sm:py-4 px-3 sm:px-4 bg-blue-600 text-white rounded-lg',
        grandTotalLabel: 'text-base sm:text-lg font-bold',
        grandTotalValue: 'text-xl sm:text-2xl font-bold',
        footer: 'space-y-3 sm:space-y-4 mt-6 sm:mt-8',
        footerLabel: 'text-xs font-bold text-blue-600 uppercase mb-1',
        footerText: 'text-xs sm:text-sm text-gray-700'
      }}
    />
  );
}

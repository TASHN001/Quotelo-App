import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Settings, ChevronDown, ChevronUp, FileText, Clock, AlertCircle, CheckCircle, Send, TrendingUp, User, Calendar, DollarSign, Percent, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { isOverdue } from '../lib/statusManager';
import { getCurrentDate } from '../lib/dateUtils';
import type { Document } from '../lib/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend
} from 'recharts';

type DateRange = 'last7days' | 'last30days' | 'thisMonth' | 'thisYear' | 'custom';

interface DateRangeOption {
  key: DateRange;
  label: string;
}

const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { key: 'last7days', label: 'Last 7 days' },
  { key: 'last30days', label: 'Last 30 days' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'thisYear', label: 'This year' }
];

const STATUS_COLORS = {
  paid: '#10b981',
  sent: '#3b82f6',
  draft: '#9ca3af',
  overdue: '#ef4444'
};

export function DashboardOverview() {
  const { setCurrentScreen, authUser, formatCurrency, setSavedDocumentId } = useApp();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('last30days');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [authUser]);

  const loadDashboardData = async () => {
    if (!authUser) {
      setIsLoading(false);
      return;
    }
    const docs = await db.getUserDocuments(authUser.id);
    setDocuments(docs);
    setIsLoading(false);
  };

  const getDateRangeBounds = (range: DateRange): { start: Date; end: Date } => {
    const now = getCurrentDate();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    let start = new Date(now);

    switch (range) {
      case 'last7days':
        start.setDate(start.getDate() - 7);
        break;
      case 'last30days':
        start.setDate(start.getDate() - 30);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }
    start.setHours(0, 0, 0, 0);
    return { start, end };
  };

  const filteredDocuments = useMemo(() => {
    const { start, end } = getDateRangeBounds(dateRange);
    return documents.filter(doc => {
      const createdDate = new Date(doc.created_at);
      return createdDate >= start && createdDate <= end;
    });
  }, [documents, dateRange]);

  const metrics = useMemo(() => {
    const now = getCurrentDate();
    let invoicesSent = 0;
    let outstandingInvoices = 0;
    let totalRevenue = 0;
    let outstandingAmount = 0;
    let paidCount = 0;
    let totalPaymentTime = 0;
    let paymentTimeCount = 0;

    filteredDocuments.forEach(doc => {
      if (doc.status === 'sent' || doc.status === 'paid') {
        invoicesSent++;
      }
      if (doc.status === 'sent' || doc.status === 'draft') {
        outstandingInvoices++;
        outstandingAmount += doc.total;
      }
      if (doc.status === 'sent' && isOverdue(doc)) {
        outstandingAmount += 0;
      }
      if (doc.status === 'paid') {
        totalRevenue += doc.total;
        paidCount++;
        if (doc.paid_date && doc.issue_date) {
          const issueDate = new Date(doc.issue_date);
          const paidDate = new Date(doc.paid_date);
          const daysDiff = Math.floor((paidDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 0) {
            totalPaymentTime += daysDiff;
            paymentTimeCount++;
          }
        }
      }
    });

    const overdueCount = filteredDocuments.filter(doc => doc.status === 'sent' && isOverdue(doc)).length;
    const averageInvoiceValue = paidCount > 0 ? totalRevenue / paidCount : 0;
    const collectionRate = invoicesSent > 0 ? (paidCount / invoicesSent) * 100 : 0;
    const averagePaymentTime = paymentTimeCount > 0 ? Math.round(totalPaymentTime / paymentTimeCount) : 0;
    const overdueRate = filteredDocuments.length > 0 ? (overdueCount / filteredDocuments.length) * 100 : 0;

    return {
      invoicesSent,
      outstandingInvoices,
      totalRevenue,
      outstandingAmount,
      averageInvoiceValue,
      collectionRate,
      averagePaymentTime,
      overdueRate,
      overdueCount
    };
  }, [filteredDocuments]);

  const revenueChartData = useMemo(() => {
    const { start, end } = getDateRangeBounds(dateRange);
    const paidDocs = filteredDocuments.filter(doc => doc.status === 'paid' && doc.paid_date);

    const isYearlyRange = dateRange === 'thisYear';
    const dataMap: Record<string, number> = {};

    if (isYearlyRange) {
      for (let m = 0; m < 12; m++) {
        const key = new Date(start.getFullYear(), m, 1).toLocaleDateString('en-US', { month: 'short' });
        dataMap[key] = 0;
      }
    } else {
      const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      for (let i = 0; i <= dayCount; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dataMap[key] = 0;
      }
    }

    paidDocs.forEach(doc => {
      if (!doc.paid_date) return;
      const paidDate = new Date(doc.paid_date);
      let key: string;
      if (isYearlyRange) {
        key = paidDate.toLocaleDateString('en-US', { month: 'short' });
      } else {
        key = paidDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      if (dataMap[key] !== undefined) {
        dataMap[key] += doc.total;
      }
    });

    return Object.entries(dataMap).map(([date, revenue]) => ({ date, revenue }));
  }, [filteredDocuments, dateRange]);

  const statusDistribution = useMemo(() => {
    const counts = { paid: 0, sent: 0, draft: 0, overdue: 0 };
    filteredDocuments.forEach(doc => {
      if (doc.status === 'paid') counts.paid++;
      else if (doc.status === 'sent') {
        if (isOverdue(doc)) counts.overdue++;
        else counts.sent++;
      }
      else if (doc.status === 'draft') counts.draft++;
    });
    return [
      { name: 'Paid', value: counts.paid, color: STATUS_COLORS.paid },
      { name: 'Sent', value: counts.sent, color: STATUS_COLORS.sent },
      { name: 'Draft', value: counts.draft, color: STATUS_COLORS.draft },
      { name: 'Overdue', value: counts.overdue, color: STATUS_COLORS.overdue }
    ].filter(item => item.value > 0);
  }, [filteredDocuments]);

  const clientRevenueData = useMemo(() => {
    const clientRevenue: Record<string, number> = {};
    filteredDocuments.filter(doc => doc.status === 'paid').forEach(doc => {
      const clientName = doc.client_name || 'Unknown';
      clientRevenue[clientName] = (clientRevenue[clientName] || 0) + doc.total;
    });
    return Object.entries(clientRevenue)
      .map(([name, revenue]) => ({ name: name.length > 12 ? name.slice(0, 12) + '...' : name, revenue, fullName: name }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredDocuments]);

  const recentActivity = useMemo(() => {
    const activities: Array<{ id: string; type: string; clientName: string; amount: number; status: string; date: string }> = [];
    const sortedDocs = [...documents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const lastCreated = sortedDocs[0];
    if (lastCreated) {
      activities.push({
        id: lastCreated.id,
        type: 'created',
        clientName: lastCreated.client_name,
        amount: lastCreated.total,
        status: lastCreated.status,
        date: lastCreated.created_at
      });
    }
    const paidDocs = documents.filter(d => d.status === 'paid' && d.paid_date)
      .sort((a, b) => new Date(b.paid_date!).getTime() - new Date(a.paid_date!).getTime());
    const lastPaid = paidDocs[0];
    if (lastPaid) {
      activities.push({
        id: lastPaid.id,
        type: 'paid',
        clientName: lastPaid.client_name,
        amount: lastPaid.total,
        status: 'paid',
        date: lastPaid.paid_date!
      });
    }
    const overdueDocs = documents.filter(d => d.status === 'sent' && isOverdue(d))
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    const firstOverdue = overdueDocs[0];
    if (firstOverdue) {
      activities.push({
        id: firstOverdue.id,
        type: 'overdue',
        clientName: firstOverdue.client_name,
        amount: firstOverdue.total,
        status: 'overdue',
        date: firstOverdue.due_date
      });
    }
    return activities;
  }, [documents]);

  const monthlyRevenueData = useMemo(() => {
    const now = getCurrentDate();
    const currentYear = now.getFullYear();
    const monthlyData: Record<string, number> = {};
    for (let m = 0; m < 12; m++) {
      const key = new Date(currentYear, m, 1).toLocaleDateString('en-US', { month: 'short' });
      monthlyData[key] = 0;
    }
    documents.filter(doc => doc.status === 'paid' && doc.paid_date).forEach(doc => {
      const paidDate = new Date(doc.paid_date!);
      if (paidDate.getFullYear() === currentYear) {
        const key = paidDate.toLocaleDateString('en-US', { month: 'short' });
        monthlyData[key] = (monthlyData[key] || 0) + doc.total;
      }
    });
    return Object.entries(monthlyData).map(([month, revenue]) => ({ month, revenue }));
  }, [documents]);

  const createdVsPaidData = useMemo(() => {
    const now = getCurrentDate();
    const currentYear = now.getFullYear();
    const monthlyCreated: Record<string, number> = {};
    const monthlyPaid: Record<string, number> = {};
    for (let m = 0; m < 12; m++) {
      const key = new Date(currentYear, m, 1).toLocaleDateString('en-US', { month: 'short' });
      monthlyCreated[key] = 0;
      monthlyPaid[key] = 0;
    }
    documents.forEach(doc => {
      const createdDate = new Date(doc.created_at);
      if (createdDate.getFullYear() === currentYear) {
        const key = createdDate.toLocaleDateString('en-US', { month: 'short' });
        monthlyCreated[key] = (monthlyCreated[key] || 0) + 1;
      }
      if (doc.status === 'paid' && doc.paid_date) {
        const paidDate = new Date(doc.paid_date);
        if (paidDate.getFullYear() === currentYear) {
          const key = paidDate.toLocaleDateString('en-US', { month: 'short' });
          monthlyPaid[key] = (monthlyPaid[key] || 0) + 1;
        }
      }
    });
    return Object.keys(monthlyCreated).map(month => ({
      month,
      created: monthlyCreated[month],
      paid: monthlyPaid[month]
    }));
  }, [documents]);

  const projectedRevenue = useMemo(() => {
    const now = getCurrentDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    let revenueThisMonth = 0;
    documents.filter(doc => doc.status === 'paid' && doc.paid_date).forEach(doc => {
      const paidDate = new Date(doc.paid_date!);
      if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
        revenueThisMonth += doc.total;
      }
    });
    if (dayOfMonth < 5) return null;
    const dailyAverage = revenueThisMonth / dayOfMonth;
    const projected = dailyAverage * daysInMonth;
    return { current: revenueThisMonth, projected, dailyAverage };
  }, [documents]);

  const handleActivityClick = (activityId: string) => {
    setSavedDocumentId(activityId);
    setCurrentScreen('invoice-detail');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatShortCurrency = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentScreen('home')}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {DATE_RANGE_OPTIONS.find(o => o.key === dateRange)?.label}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showDatePicker && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDatePicker(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    {DATE_RANGE_OPTIONS.map(option => (
                      <button
                        key={option.key}
                        onClick={() => { setDateRange(option.key); setShowDatePicker(false); }}
                        className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                          dateRange === option.key
                            ? 'bg-orange-50 text-orange-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setCurrentScreen('app-settings')}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 pb-8">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <KPICard
            icon={<Send className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-100"
            label="Invoices Sent"
            value={metrics.invoicesSent.toString()}
          />
          <KPICard
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-100"
            label="Outstanding"
            value={metrics.outstandingInvoices.toString()}
          />
          <KPICard
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
            iconBg="bg-green-100"
            label="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            isLarge
          />
          <KPICard
            icon={<AlertCircle className="w-5 h-5 text-red-600" />}
            iconBg="bg-red-100"
            label="Outstanding Amount"
            value={formatCurrency(metrics.outstandingAmount)}
            isLarge
          />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
          {revenueChartData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" tickLine={false} axisLine={false} tickFormatter={formatShortCurrency} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No revenue data for this period
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Invoice Status</h3>
            {statusDistribution.length > 0 ? (
              <div className="h-40 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: number, name: string) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                No data available
              </div>
            )}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {statusDistribution.map(item => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Clients by Revenue</h3>
            {clientRevenueData.length > 0 ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientRevenueData} layout="vertical" margin={{ top: 0, right: 5, left: -10, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" width={70} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      labelFormatter={(label: string, payload: any[]) => payload[0]?.payload?.fullName || label}
                    />
                    <Bar dataKey="revenue" fill="#f97316" radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                No revenue data
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Performance</h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={<DollarSign className="w-4 h-4 text-green-600" />}
              label="Avg Invoice Value"
              value={formatCurrency(metrics.averageInvoiceValue)}
            />
            <MetricCard
              icon={<Percent className="w-4 h-4 text-blue-600" />}
              label="Collection Rate"
              value={`${metrics.collectionRate.toFixed(1)}%`}
            />
            <MetricCard
              icon={<Calendar className="w-4 h-4 text-purple-600" />}
              label="Avg Payment Time"
              value={`${metrics.averagePaymentTime} days`}
            />
            <MetricCard
              icon={<AlertCircle className="w-4 h-4 text-red-600" />}
              label="Overdue Rate"
              value={`${metrics.overdueRate.toFixed(1)}%`}
            />
          </div>
        </div>

        {recentActivity.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <button
                  key={`${activity.id}-${activity.type}`}
                  onClick={() => handleActivityClick(activity.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'paid' ? 'bg-green-100' :
                    activity.type === 'overdue' ? 'bg-red-100' :
                    'bg-blue-100'
                  }`}>
                    {activity.type === 'paid' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                     activity.type === 'overdue' ? <AlertCircle className="w-4 h-4 text-red-600" /> :
                     <FileText className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.clientName}</p>
                    <p className="text-xs text-gray-500">
                      {activity.type === 'paid' ? 'Payment received' : activity.type === 'overdue' ? 'Invoice overdue' : 'Invoice created'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(activity.amount)}</p>
                    <p className="text-xs text-gray-400">{formatDate(activity.date)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Advanced Analytics</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showAdvanced && (
            <div className="p-4 pt-0 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Revenue by Month ({new Date().getFullYear()})</h4>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenueData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#9ca3af" tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" tickLine={false} axisLine={false} tickFormatter={formatShortCurrency} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Invoices Created vs Paid</h4>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={createdVsPaidData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#9ca3af" tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="created" name="Created" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="paid" name="Paid" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {projectedRevenue && (
                <div className="bg-[#fff7ed] rounded-xl p-4 border border-orange-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <h4 className="text-sm font-medium text-gray-900">Projected Revenue This Month</h4>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(projectedRevenue.projected)}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Based on {formatCurrency(projectedRevenue.dailyAverage)}/day average ({formatCurrency(projectedRevenue.current)} earned so far)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, iconBg, label, value, subtext, isLarge }: { icon: React.ReactNode; iconBg: string; label: string; value: string; subtext?: string; isLarge?: boolean }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className={`font-bold text-gray-900 ${isLarge ? 'text-lg' : 'text-2xl'} truncate`}>{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

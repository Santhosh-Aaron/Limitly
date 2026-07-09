import { useState, useEffect } from 'react';
import { IndianRupee, PieChart as PieIcon, BarChart3, TrendingUp, Calendar, Tag, FileText, FileSpreadsheet } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../api/axios';
import Layout from '../components/Layout';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { getLocalDateString } from '../utils/dateUtils';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const Analytics = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'yearly' | 'fiveYear'>('monthly');

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const response = await api.get(`/expenses/user/${userId}`);
        setExpenses(response.data || []);
      } catch (error) {
        console.error('Failed to load expenses for analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [userId]);

  const today = new Date();

  // --- 1. Weekly Calculations ---
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyExpenses = expenses.filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d >= sevenDaysAgo && d <= today;
  });

  const totalSpentThisWeek = weeklyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Daily trend for past 7 days
  const weeklyDailyData: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const daySum = expenses
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    weeklyDailyData.push({ day: dayLabel, date: dateStr, amount: daySum });
  }

  // --- 2. Monthly Calculations ---
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthlyExpenses = expenses.filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpentThisMonth = monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Category breakdown for pie chart
  const categoryMap: { [key: string]: number } = {};
  monthlyExpenses.forEach((e) => {
    const catName = e.category?.name || 'Others';
    categoryMap[catName] = (categoryMap[catName] || 0) + (Number(e.amount) || 0);
  });

  const monthlyCategoryData = Object.keys(categoryMap).map((catName) => {
    const amt = categoryMap[catName];
    const percentage = totalSpentThisMonth > 0 ? Math.round((amt / totalSpentThisMonth) * 100) : 0;
    return { name: catName, value: amt, percentage };
  });

  // Daily trend across current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthlyDailyData: any[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daySum = expenses
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    monthlyDailyData.push({ day: `${day}`, amount: daySum });
  }

  // --- 3. Yearly Calculations ---
  const yearlyExpenses = expenses.filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d.getFullYear() === currentYear;
  });

  const totalSpentThisYear = yearlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const yearlyMonthlyData = months.map((mLabel, idx) => {
    const monthSum = expenses
      .filter((e) => {
        if (!e.date) return false;
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() === idx;
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { month: mLabel, amount: monthSum };
  });

  // --- 4. Five-Year Analytics ---
  const fiveYears = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
  const fiveYearData = fiveYears.map((yr) => {
    const yrSum = expenses
      .filter((e) => {
        if (!e.date) return false;
        return new Date(e.date).getFullYear() === yr;
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { year: String(yr), amount: yrSum };
  });

  const getActiveTabExpenses = () => {
    if (activeTab === 'weekly') return weeklyExpenses;
    if (activeTab === 'monthly') return monthlyExpenses;
    if (activeTab === 'yearly') return yearlyExpenses;
    return expenses.filter(e => {
      if (!e.date) return false;
      const yr = new Date(e.date).getFullYear();
      return yr >= currentYear - 4 && yr <= currentYear;
    });
  };

  const handleExportPDF = () => {
    const tabData = getActiveTabExpenses();
    if (tabData.length === 0) {
      alert('No data recorded for this analytics period yet.');
      return;
    }
    const total = tabData.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const count = tabData.length;
    const average = count > 0 ? total / count : 0;
    const tabLabel = activeTab === 'weekly' ? 'Weekly Analytics' : activeTab === 'monthly' ? 'Monthly Analytics' : activeTab === 'yearly' ? 'Yearly Analytics' : '5-Year Growth Analytics';

    exportToPDF(
      `${tabLabel} Report`,
      tabData.map(e => ({
        date: e.date,
        description: e.description || 'Expense',
        category: e.category?.name || 'General',
        amount: e.amount
      })),
      `Limitly_Analytics_${activeTab}`,
      { total, count, average }
    );
  };

  const handleExportExcel = () => {
    const tabData = getActiveTabExpenses();
    if (tabData.length === 0) {
      alert('No data recorded for this analytics period yet.');
      return;
    }
    const total = tabData.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const count = tabData.length;
    const average = count > 0 ? total / count : 0;
    const tabLabel = activeTab === 'weekly' ? 'Weekly Analytics' : activeTab === 'monthly' ? 'Monthly Analytics' : activeTab === 'yearly' ? 'Yearly Analytics' : '5-Year Growth Analytics';

    exportToExcel(
      `${tabLabel} Report`,
      tabData.map(e => ({
        date: e.date,
        description: e.description || 'Expense',
        category: e.category?.name || 'General',
        amount: e.amount
      })),
      `Limitly_Analytics_${activeTab}`,
      { total, count, average }
    );
  };

  return (
    <Layout>
      <div className="space-y-8">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>Analytics & Insights</span>
              <span className="text-sm bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-semibold">Visual Trends</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Deep-dive into your weekly, monthly, yearly, and five-year financial progress with interactive charts.
            </p>
          </div>

          {/* Tab Navigation & Export Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-gray-200/80 p-1.5 rounded-2xl gap-1 overflow-x-auto">
              {(['weekly', 'monthly', 'yearly', 'fiveYear'] as const).map((tabKey) => {
                const label =
                  tabKey === 'weekly'
                    ? 'Weekly'
                    : tabKey === 'monthly'
                    ? 'Monthly'
                    : tabKey === 'yearly'
                    ? 'Yearly'
                    : '5-Year';
                return (
                  <button
                    key={tabKey}
                    onClick={() => setActiveTab(tabKey)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
                      activeTab === tabKey
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition border border-red-200"
              title="Export current tab insights as PDF"
            >
              <FileText className="h-4 w-4 text-red-600" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition border border-green-200"
              title="Export current tab insights as Excel"
            >
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-gray-500 font-medium">Analyzing transaction data and preparing charts...</div>
        ) : (
          <>
            {/* TAB 1: WEEKLY EXPENSES */}
            {activeTab === 'weekly' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Total Spent This Week</span>
                      <div className="text-3xl font-extrabold text-gray-900 mt-1 flex items-center">
                        <IndianRupee className="h-6 w-6 mr-0.5" />
                        <span>{totalSpentThisWeek.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Weekly Daily Average</span>
                      <div className="text-3xl font-extrabold text-gray-900 mt-1 flex items-center">
                        <IndianRupee className="h-6 w-6 mr-0.5" />
                        <span>{(totalSpentThisWeek / 7).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Transactions Count</span>
                      <div className="text-3xl font-extrabold text-gray-900 mt-1">{weeklyExpenses.length}</div>
                    </div>
                    <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                      <Calendar className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                {/* Weekly Bar Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Daily Spending Trend (Last 7 Days)</span>
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyDailyData}>
                        <XAxis dataKey="day" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Spent']}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="amount" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MONTHLY EXPENSES */}
            {activeTab === 'monthly' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Total Spent This Month</span>
                      <div className="text-3xl font-extrabold text-gray-900 mt-1 flex items-center">
                        <IndianRupee className="h-6 w-6 mr-0.5" />
                        <span>{totalSpentThisMonth.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                      <PieIcon className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Active Categories Used</span>
                      <div className="text-3xl font-extrabold text-gray-900 mt-1">{monthlyCategoryData.length}</div>
                    </div>
                    <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                      <Tag className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category Pie Chart */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <PieIcon className="h-5 w-5 text-purple-600" />
                        <span>Category Breakdown</span>
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">Percentage share across categories this month</p>
                    </div>

                    {monthlyCategoryData.length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                        No expenses recorded for this month yet.
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="h-64 w-full sm:w-1/2">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={monthlyCategoryData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                innerRadius={45}
                                paddingAngle={4}
                              >
                                {monthlyCategoryData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Amount']}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Legend list */}
                        <div className="w-full sm:w-1/2 space-y-2 max-h-64 overflow-y-auto pr-2">
                          {monthlyCategoryData.map((cat, idx) => (
                            <div key={cat.name} className="flex items-center justify-between text-sm p-2 rounded-xl bg-gray-50">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                />
                                <span className="font-semibold text-gray-800">{cat.name}</span>
                              </div>
                              <div className="font-bold text-gray-900">
                                {cat.percentage}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Monthly Daily Trend Line Chart */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span>Daily Spending Trend (Day 1 - {daysInMonth})</span>
                    </h3>
                    <div className="h-64 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyDailyData}>
                          <XAxis dataKey="day" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip
                            formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Spent']}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: YEARLY EXPENSES */}
            {activeTab === 'yearly' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Total Spent in {currentYear}</span>
                    <div className="text-3xl font-extrabold text-gray-900 mt-1 flex items-center">
                      <IndianRupee className="h-6 w-6 mr-0.5" />
                      <span>{totalSpentThisYear.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                </div>

                {/* Yearly Month-wise Comparison Bar Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Month-wise Comparison ({currentYear})</span>
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yearlyMonthlyData}>
                        <XAxis dataKey="month" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Spent']}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="amount" fill="#10B981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: FIVE-YEAR ANALYTICS */}
            {activeTab === 'fiveYear' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Five-Year Horizon ({currentYear - 4} - {currentYear})</span>
                    <div className="text-3xl font-extrabold text-gray-900 mt-1 flex items-center">
                      <IndianRupee className="h-6 w-6 mr-0.5" />
                      <span>{fiveYearData.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>

                {/* Five-Year Bar / Line Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span>Year-wise Expense Growth</span>
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fiveYearData}>
                        <XAxis dataKey="year" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Spent']}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="amount" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </Layout>
  );
};

export default Analytics;

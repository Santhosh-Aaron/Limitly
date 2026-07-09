import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, IndianRupee, TrendingUp, Tag, Calendar, ArrowRight, List, PlusCircle, Edit3, Check, X, Wallet } from 'lucide-react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { getLocalDateString } from '../utils/dateUtils';

const Dashboard = () => {
  const [limitProgress, setLimitProgress] = useState<string>('Loading budget status...');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  
  // Inline Limit Editing State
  const [currentLimitAmount, setCurrentLimitAmount] = useState<number | null>(null);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [newLimitValue, setNewLimitValue] = useState('');
  const [limitSaving, setLimitSaving] = useState(false);

  const userId = localStorage.getItem('userId');

  const fetchDashboardData = async () => {
    if (!userId) return;
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    try {
      // 1. Fetch exact limit status string
      const progressRes = await api.get(`/limits/progress/user/${userId}?month=${month}&year=${year}`);
      setLimitProgress(progressRes.data || 'No limit set for this month.');
    } catch (error) {
      console.error('Error fetching limit progress:', error);
      setLimitProgress('Unable to load budget status.');
    }

    try {
      // 2. Fetch current limit amount object
      const limitRes = await api.get(`/limits/current/user/${userId}?month=${month}&year=${year}`);
      if (limitRes.data && limitRes.data.limitAmount) {
        setCurrentLimitAmount(Number(limitRes.data.limitAmount));
        setNewLimitValue(String(limitRes.data.limitAmount));
      } else {
        setCurrentLimitAmount(null);
        setNewLimitValue('');
      }
    } catch (error) {
      console.error('Error fetching limit object:', error);
    }

    try {
      // 3. Fetch all expenses
      const expensesRes = await api.get(`/expenses/user/${userId}`);
      setExpenses(expensesRes.data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const todayStr = getLocalDateString();
  const totalSpentToday = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const totalSpentThisMonth = expenses
    .filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return (d.getMonth() + 1) === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleSaveInlineLimit = async () => {
    if (!newLimitValue || isNaN(Number(newLimitValue)) || Number(newLimitValue) <= 0) {
      alert('Please enter a valid monthly limit amount greater than 0.');
      return;
    }

    setLimitSaving(true);
    try {
      await api.put(`/limits/user/${userId}?amount=${newLimitValue}&month=${currentMonth}&year=${currentYear}`);
      setCurrentLimitAmount(Number(newLimitValue));
      setIsEditingLimit(false);
      // Refresh progress text
      const progressRes = await api.get(`/limits/progress/user/${userId}?month=${currentMonth}&year=${currentYear}`);
      setLimitProgress(progressRes.data || 'Updated limit.');
    } catch (error) {
      console.error('Failed to update inline limit:', error);
      alert('Could not update limit. Please try again.');
    } finally {
      setLimitSaving(false);
    }
  };

  const isAlert = limitProgress.includes('ALERT');
  const isWarning = limitProgress.includes('WARNING');

  const remainingBalance = currentLimitAmount ? currentLimitAmount - totalSpentThisMonth : null;
  const progressPercent = currentLimitAmount && currentLimitAmount > 0 
    ? Math.min(Math.round((totalSpentThisMonth / currentLimitAmount) * 100), 100) 
    : 0;

  return (
    <Layout>
      <div className="space-y-8">
        
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
            <p className="text-sm text-gray-500 mt-0.5">Real-time budget tracking, spending breakdown, and quick actions.</p>
          </div>
          <Link
            to="/add-expense"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition font-semibold shadow-sm"
          >
            <PlusCircle className="h-4 w-4" /> Record New Expense
          </Link>
        </div>

        {/* 3-Column Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Limit Status & Inline Edit Card (2 columns wide) */}
          <div className={`md:col-span-2 p-6 rounded-2xl shadow-sm border transition-all flex flex-col justify-between ${
            isAlert ? 'bg-red-50/80 border-red-200 text-red-900' : 
            isWarning ? 'bg-yellow-50/80 border-yellow-200 text-yellow-900' : 
            'bg-white border-gray-200 text-gray-800'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className={`h-6 w-6 ${isAlert ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-blue-500'}`} />
                  <h2 className="text-lg font-bold">Monthly Budget & Limit Status</h2>
                </div>
                
                {!isEditingLimit && (
                  <button
                    onClick={() => {
                      setNewLimitValue(currentLimitAmount ? String(currentLimitAmount) : '');
                      setIsEditingLimit(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-2xs transition"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                    <span>{currentLimitAmount ? 'Edit Limit Inline' : 'Set Limit'}</span>
                  </button>
                )}
              </div>

              {/* Inline Editing Form */}
              {isEditingLimit ? (
                <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm mb-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Update Monthly Limit (INR)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={newLimitValue}
                        onChange={(e) => setNewLimitValue(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <button
                      onClick={handleSaveInlineLimit}
                      disabled={limitSaving}
                      className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>{limitSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      onClick={() => setIsEditingLimit(false)}
                      disabled={limitSaving}
                      className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-semibold text-sm transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-base font-semibold mb-4 opacity-90">{limitProgress}</p>
              )}

              {/* Visual Progress Bar & Stats Grid */}
              {currentLimitAmount && currentLimitAmount > 0 ? (
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-75 mb-1.5">
                      <span>Budget Utilized: {progressPercent}%</span>
                      <span>{progressPercent >= 100 ? 'Over Budget' : `${100 - progressPercent}% Remaining`}</span>
                    </div>
                    <div className="w-full bg-gray-200/80 rounded-full h-3.5 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progressPercent >= 100
                            ? 'bg-red-600'
                            : progressPercent >= 80
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 3-Mini KPI Bar inside Card */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-xs font-semibold text-gray-500 block mb-0.5">Budget Limit</span>
                      <span className="text-base font-bold text-gray-900 flex items-center">
                        <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                        {currentLimitAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-xs font-semibold text-gray-500 block mb-0.5">Spent Month</span>
                      <span className="text-base font-bold text-gray-900 flex items-center">
                        <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                        {totalSpentThisMonth.toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-xs font-semibold text-gray-500 block mb-0.5">Remaining Balance</span>
                      <span className={`text-base font-bold flex items-center ${
                        remainingBalance !== null && remainingBalance < 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                        {remainingBalance !== null ? remainingBalance.toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-6 w-6 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-blue-900">No Monthly Budget Set Yet</p>
                      <p className="text-xs text-blue-700 mt-0.5">Click "Set Limit" above or manage categories via Set Limit tab.</p>
                    </div>
                  </div>
                  <Link
                    to="/set-limit"
                    className="bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-blue-700 transition shrink-0"
                  >
                    Configure
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Column */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center transition hover:shadow-md">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Spent Today</span>
              </div>
              <div className="flex items-center text-2xl font-bold text-gray-900">
                <IndianRupee className="h-5 w-5 mr-0.5" />
                <span>{totalSpentToday.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center transition hover:shadow-md">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Spent This Month</span>
              </div>
              <div className="flex items-center text-2xl font-bold text-gray-900">
                <IndianRupee className="h-5 w-5 mr-0.5" />
                <span>{totalSpentThisMonth.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Recent Transactions Section on Dashboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
            </div>
            <Link
              to="/transactions"
              className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              View All Transactions <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {loadingExpenses ? (
              <div className="p-8 text-center text-gray-500">Loading recent transactions...</div>
            ) : expenses.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <p className="text-gray-500 font-medium mb-3">No transactions recorded yet.</p>
                <Link
                  to="/add-expense"
                  className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition"
                >
                  <PlusCircle className="h-4 w-4" /> Add Your First Expense
                </Link>
              </div>
            ) : (
              expenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-900 text-base">
                      {expense.description || 'Unnamed Expense'}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-700">
                        <Tag className="h-3 w-3 text-gray-500" /> {expense.category?.name || 'Uncategorized'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {expense.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="font-bold text-gray-900 text-lg flex items-center">
                      <IndianRupee className="h-4 w-4 mr-0.5" />
                      {Number(expense.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
import { useState, useEffect } from 'react';
import { IndianRupee, Trash2, Calendar, Tag, Search, FileText, FileSpreadsheet, Filter } from 'lucide-react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Transactions = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'weekly' | 'monthly' | 'yearly' | 'fiveYear'>('all');
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await api.get(`/expenses/user/${userId}`);
        setExpenses(response.data || []);
      } catch (error) {
        console.error('Failed to fetch expenses', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchExpenses();
  }, [userId]);

  const handleDelete = async (expenseId: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await api.delete(`/expenses/${expenseId}`);
      setExpenses(expenses.filter((expense) => expense.id !== expenseId));
    } catch (error) {
      console.error('Failed to delete expense', error);
    }
  };

  const today = new Date();

  // Filter expenses by selected horizon AND search term
  const getFilteredByHorizon = () => {
    return expenses.filter(e => {
      if (!e.date) return dateRange === 'all';
      const d = new Date(e.date);
      
      if (dateRange === 'weekly') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return d >= sevenDaysAgo && d <= today;
      }
      if (dateRange === 'monthly') {
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      }
      if (dateRange === 'yearly') {
        return d.getFullYear() === today.getFullYear();
      }
      if (dateRange === 'fiveYear') {
        return d.getFullYear() >= today.getFullYear() - 4 && d.getFullYear() <= today.getFullYear();
      }
      return true; // 'all'
    });
  };

  const horizonFiltered = getFilteredByHorizon();

  const filteredExpenses = horizonFiltered.filter(expense => 
    expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportPDF = () => {
    if (filteredExpenses.length === 0) {
      alert('No transactions available for the selected range to export.');
      return;
    }
    const total = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const count = filteredExpenses.length;
    const average = count > 0 ? total / count : 0;

    const rangeLabel =
      dateRange === 'all' ? 'All Time' :
      dateRange === 'weekly' ? 'Past 7 Days' :
      dateRange === 'monthly' ? `Month of ${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}` :
      dateRange === 'yearly' ? `Year ${today.getFullYear()}` : 'Past 5 Years';

    exportToPDF(
      `Transaction History (${rangeLabel})`,
      filteredExpenses.map(e => ({
        date: e.date,
        description: e.description,
        category: e.category?.name || 'General',
        amount: e.amount
      })),
      `Limitly_Transactions_${dateRange}`,
      { total, count, average }
    );
  };

  const handleExportExcel = () => {
    if (filteredExpenses.length === 0) {
      alert('No transactions available for the selected range to export.');
      return;
    }
    const total = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const count = filteredExpenses.length;
    const average = count > 0 ? total / count : 0;

    const rangeLabel =
      dateRange === 'all' ? 'All Time' :
      dateRange === 'weekly' ? 'Past 7 Days' :
      dateRange === 'monthly' ? `Month of ${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}` :
      dateRange === 'yearly' ? `Year ${today.getFullYear()}` : 'Past 5 Years';

    exportToExcel(
      `Transaction History (${rangeLabel})`,
      filteredExpenses.map(e => ({
        date: e.date,
        description: e.description,
        category: e.category?.name || 'General',
        amount: e.amount
      })),
      `Limitly_Transactions_${dateRange}`,
      { total, count, average }
    );
  };

  return (
    <Layout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header, Export Toolbar & Search Bar */}
        <div className="p-6 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage, search, and export your transaction reports across any date range.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Dropdown */}
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium text-gray-700">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e: any) => setDateRange(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer font-semibold text-gray-800"
              >
                <option value="all">All Time</option>
                <option value="weekly">Weekly (Last 7 Days)</option>
                <option value="monthly">This Month</option>
                <option value="yearly">This Year</option>
                <option value="fiveYear">Last 5 Years</option>
              </select>
            </div>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 px-3.5 py-2 rounded-lg text-sm font-semibold transition shadow-sm border border-red-200"
              title="Export filtered list as PDF"
            >
              <FileText className="h-4 w-4 text-red-600" />
              <span>PDF Report</span>
            </button>

            {/* Export Excel Button */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 px-3.5 py-2 rounded-lg text-sm font-semibold transition shadow-sm border border-green-200"
              title="Export filtered list as Excel (.xlsx)"
            >
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <span>Excel Export</span>
            </button>

            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading transactions...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <p className="text-gray-500 font-medium mb-4">No transactions found for this selection.</p>
              <a
                href="/add-expense"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition text-sm"
              >
                + Add New Expense
              </a>
            </div>
          ) : (
            filteredExpenses.map((expense) => (
              <div key={expense.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                
                {/* Left Side: Details */}
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-900 text-lg">
                    {expense.description || 'Unnamed Expense'}
                  </span>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-md font-medium text-gray-700">
                      <Tag className="h-3 w-3 text-gray-500" /> {expense.category?.name || 'Uncategorized'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {expense.date}
                    </span>
                  </div>
                </div>

                {/* Right Side: Amount & Delete Button */}
                <div className="flex items-center gap-6">
                  <span className="font-bold text-gray-900 text-xl flex items-center">
                    <IndianRupee className="h-5 w-5 mr-1" />
                    {Number(expense.amount).toFixed(2)}
                  </span>
                  
                  <button 
                    onClick={() => handleDelete(expense.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                    title="Delete Expense"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Transactions;
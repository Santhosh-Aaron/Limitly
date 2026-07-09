import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import Layout from '../components/Layout';

const SetLimit = () => {
  const [limitAmount, setLimitAmount] = useState('');
  const [currentLimit, setCurrentLimit] = useState<number | null>(null);
  const [spentThisMonth, setSpentThisMonth] = useState(0);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();

      try {
        const limitRes = await api.get(`/limits/current/user/${userId}?month=${month}&year=${year}`);
        if (limitRes.data && limitRes.data.limitAmount) {
          setCurrentLimit(Number(limitRes.data.limitAmount));
          setLimitAmount(String(limitRes.data.limitAmount));
        }
      } catch (error) {
        console.error('Error fetching limit:', error);
      }

      try {
        const expensesRes = await api.get(`/expenses/user/${userId}`);
        const list = expensesRes.data || [];
        const monthSpent = list
          .filter((e: any) => {
            if (!e.date) return false;
            const d = new Date(e.date);
            return (d.getMonth() + 1) === month && d.getFullYear() === year;
          })
          .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
        setSpentThisMonth(monthSpent);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const today = new Date();
      
      await api.post('/limits', {
        user: { id: userId },
        limitAmount: parseFloat(limitAmount),
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        alertThreshold: 80
      });
      
      setCurrentLimit(parseFloat(limitAmount));
      setSuccess('Monthly budget limit updated successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error('Failed to set limit', error);
    }
  };

  const previewLimit = Number(limitAmount) || 0;
  const previewRemaining = previewLimit - spentThisMonth;

  return (
    <Layout>
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mt-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <span>Manage Monthly Budget Limit</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure your global spending threshold to receive real-time warnings when you approach your limit.
          </p>
        </div>

        {/* Current Budget Summary Card */}
        {!loading && (
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 grid grid-cols-3 gap-4">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Current Limit</span>
              <span className="text-lg font-bold text-gray-900 flex items-center">
                <IndianRupee className="h-4 w-4 mr-0.5" />
                {currentLimit !== null ? currentLimit.toFixed(2) : 'Not Set'}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Spent Month</span>
              <span className="text-lg font-bold text-gray-900 flex items-center">
                <IndianRupee className="h-4 w-4 mr-0.5" />
                {spentThisMonth.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Preview Balance</span>
              <span className={`text-lg font-bold flex items-center ${previewRemaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                <IndianRupee className="h-4 w-4 mr-0.5" />
                {previewLimit > 0 ? previewRemaining.toFixed(2) : '---'}
              </span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-2.5 font-medium">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Monthly Limit Amount (INR)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                step="0.01"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl font-bold text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="e.g., 50000"
                required
              />
            </div>
            {previewLimit > 0 && previewRemaining < 0 && (
              <p className="text-xs font-semibold text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Note: This limit is lower than what you have already spent ({spentThisMonth.toFixed(2)} INR).
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition font-bold text-base shadow-sm"
            >
              Save Budget Limit
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl transition font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default SetLimit;
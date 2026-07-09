import { useState, useEffect } from 'react';
import { IndianRupee, Trash2, Calendar, Tag, PlusCircle, RefreshCw, Edit2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { getLocalDateString } from '../utils/dateUtils';

const RecurringPayments = () => {
  const [recurringList, setRecurringList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Form / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [nextPaymentDate, setNextPaymentDate] = useState(getLocalDateString());

  const userId = localStorage.getItem('userId');

  const fetchData = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [recRes, catRes] = await Promise.all([
        api.get(`/recurring/user/${userId}`),
        api.get(`/categories/user/${userId}`)
      ]);
      setRecurringList(recRes.data || []);
      setCategories(catRes.data || []);
      if (catRes.data && catRes.data.length > 0 && !categoryId) {
        setCategoryId(catRes.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load recurring payments data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setName(item.name || '');
      setAmount(item.amount ? String(item.amount) : '');
      setCategoryId(item.category?.id || (categories.length > 0 ? categories[0].id : ''));
      setFrequency(item.frequency || 'Monthly');
      setNextPaymentDate(item.nextPaymentDate || getLocalDateString());
    } else {
      setEditingId(null);
      setName('');
      setAmount('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setFrequency('Monthly');
      setNextPaymentDate(getLocalDateString());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !userId) return;

    const payload = {
      name,
      amount: parseFloat(amount),
      frequency,
      nextPaymentDate,
      category: categoryId ? { id: categoryId } : null
    };

    try {
      if (editingId) {
        await api.put(`/recurring/${editingId}/user/${userId}`, payload);
        setAlertMsg({ text: 'Recurring payment updated successfully!', type: 'success' });
      } else {
        await api.post(`/recurring/user/${userId}`, payload);
        setAlertMsg({ text: 'New recurring payment created and scheduled!', type: 'success' });
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving recurring payment', error);
      alert('Failed to save recurring payment.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel and remove this recurring payment?')) return;
    try {
      await api.delete(`/recurring/${id}/user/${userId}`);
      setAlertMsg({ text: 'Recurring payment cancelled.', type: 'info' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete recurring payment', error);
    }
  };

  const handleRunProcess = async () => {
    try {
      setProcessing(true);
      const res = await api.post('/recurring/process');
      const count = res.data?.processedCount || 0;
      if (count > 0) {
        setAlertMsg({ text: `Automatic check completed! Generated ${count} new expense(s) from due renewals.`, type: 'success' });
      } else {
        setAlertMsg({ text: 'Automatic check completed! No payments are due today.', type: 'info' });
      }
      fetchData();
    } catch (error) {
      console.error('Failed to process due recurring payments', error);
      alert('Failed to run automatic renewal check.');
    } finally {
      setProcessing(false);
    }
  };

  // Calculate estimated monthly commitment across all subscriptions
  const estimatedMonthlySum = recurringList.reduce((sum, item) => {
    const amt = Number(item.amount) || 0;
    const freq = (item.frequency || 'monthly').toLowerCase();
    if (freq === 'daily') return sum + amt * 30;
    if (freq === 'weekly') return sum + amt * 4.33;
    if (freq === 'yearly') return sum + amt / 12;
    return sum + amt; // monthly
  }, 0);

  const todayStr = getLocalDateString();

  return (
    <Layout>
      <div className="space-y-8">
        
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>Recurring Payments</span>
              <span className="text-sm bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-semibold">Auto-Scheduled</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage automatic renewals for Rent, Gym Membership, Internet Bills, Tuition Fees, and subscriptions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunProcess}
              disabled={processing}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl font-medium shadow-sm transition disabled:opacity-50"
              title="Instantly check and generate expenses for bills due today"
            >
              <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{processing ? 'Checking...' : 'Run Auto-Renewal Check'}</span>
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition"
            >
              <PlusCircle className="h-4 w-4" /> Add Recurring Bill
            </button>
          </div>
        </div>

        {/* Alert Notification */}
        {alertMsg && (
          <div className={`p-4 rounded-xl flex items-center justify-between shadow-sm border ${
            alertMsg.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center gap-3">
              {alertMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-blue-600" />}
              <span className="font-medium text-sm">{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg(null)} className="text-xs font-bold underline opacity-80 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-500">Active Subscriptions / Bills</span>
              <div className="text-3xl font-bold text-gray-900 mt-1">{recurringList.length}</div>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-500">Estimated Monthly Commitment</span>
              <div className="text-3xl font-bold text-gray-900 mt-1 flex items-center">
                <IndianRupee className="h-6 w-6 mr-0.5" />
                <span>{estimatedMonthlySum.toFixed(2)}</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Upcoming Renewals Table / Card List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Upcoming Renewals Schedule</span>
            </h2>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Sorted by nearest due date
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading recurring payment schedule...</div>
            ) : recurringList.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <div className="h-14 w-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                  <Clock className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg mb-1">No Recurring Payments Scheduled</h3>
                <p className="text-gray-500 text-sm max-w-sm mb-6">
                  Automate your budget by adding monthly Rent, Gym memberships, Internet bills, or Tuition fees.
                </p>
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition"
                >
                  <PlusCircle className="h-4 w-4" /> Add First Recurring Bill
                </button>
              </div>
            ) : (
              recurringList.map((item) => {
                const isDueTodayOrPast = item.nextPaymentDate <= todayStr;
                return (
                  <div
                    key={item.id}
                    className={`p-6 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isDueTodayOrPast ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Left details */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-gray-900 text-lg">
                          {item.name}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md border border-blue-200">
                          {item.frequency}
                        </span>
                        {isDueTodayOrPast && (
                          <span className="text-xs font-bold bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                            <Clock className="h-3 w-3" /> Due Today / Ready
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-md font-medium text-gray-700">
                          <Tag className="h-3.5 w-3.5 text-gray-500" /> {item.category?.name || 'Uncategorized'}
                        </span>
                        <span className={`flex items-center gap-1 font-medium ${isDueTodayOrPast ? 'text-amber-700 font-semibold' : 'text-gray-600'}`}>
                          <Calendar className="h-3.5 w-3.5" /> Next Due: {item.nextPaymentDate}
                        </span>
                      </div>
                    </div>

                    {/* Right Amount & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                      <span className="font-extrabold text-gray-900 text-2xl flex items-center">
                        <IndianRupee className="h-5 w-5 mr-0.5" />
                        {Number(item.amount).toFixed(2)}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-xl hover:bg-blue-50"
                          title="Edit Recurring Payment"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-red-50"
                          title="Cancel / Delete Recurring Payment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal for Add / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 max-w-lg w-full overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Recurring Bill' : 'Schedule New Recurring Bill'}
                </h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Bill / Subscription Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rent, Gym Membership, Internet Bill, Tuition Fee"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Frequency
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium bg-white"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Category
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium bg-white"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Next Payment Date
                    </label>
                    <input
                      type="date"
                      required
                      value={nextPaymentDate}
                      onChange={(e) => setNextPaymentDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
                  >
                    {editingId ? 'Save Changes' : 'Schedule Recurring Bill'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default RecurringPayments;

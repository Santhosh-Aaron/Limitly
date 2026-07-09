import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

import { getLocalDateString } from '../utils/dateUtils';

const AddExpense = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getLocalDateString()); // Defaults to today

  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  // Fetch categories when the page loads
  useEffect(() => {
    console.log("===== AddExpense mounted =====");
    console.log("userId =", userId);

    const fetchCategories = async () => {
      console.log("Calling categories API...");

      try {
        const response = await api.get(`/categories/user/${userId}`);

        console.log("SUCCESS", response);

        setCategories(response.data);

        if (response.data.length > 0) {
          setCategoryId(response.data[0].id.toString());
        }
      } catch (e) {
        console.error("CATEGORY ERROR", e);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        amount: parseFloat(amount),
        description,
        date,
        user: { id: userId },
        category: { id: categoryId }
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to add expense', error);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mt-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Record an Expense</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Netflix subscription"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition font-medium mt-2"
          >
            Add Expense
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default AddExpense;
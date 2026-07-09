import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Wallet, PlusCircle, Target, LayoutDashboard, List, Repeat, PieChart } from 'lucide-react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Helper to highlight the active tab
  const isActive = (path: string) => location.pathname === path ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Navigation Links */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2 text-blue-600">
              <Wallet className="h-8 w-8" />
              <span className="text-xl font-bold tracking-tight">Limitly</span>
            </Link>

            <div className="hidden md:flex flex-wrap items-center gap-5 text-sm">
              <Link to="/dashboard" className={`flex items-center gap-1 transition-colors ${isActive('/dashboard')}`}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <Link to="/transactions" className={`flex items-center gap-1 transition-colors ${isActive('/transactions')}`}>
                <List className="h-4 w-4" /> Transactions
              </Link>
              <Link to="/recurring" className={`flex items-center gap-1 transition-colors ${isActive('/recurring')}`}>
                <Repeat className="h-4 w-4" /> Recurring
              </Link>
              <Link to="/analytics" className={`flex items-center gap-1 transition-colors ${isActive('/analytics')}`}>
                <PieChart className="h-4 w-4" /> Analytics
              </Link>
              <Link to="/add-expense" className={`flex items-center gap-1 transition-colors ${isActive('/add-expense')}`}>
                <PlusCircle className="h-4 w-4" /> Add Expense
              </Link>
              <Link to="/set-limit" className={`flex items-center gap-1 transition-colors ${isActive('/set-limit')}`}>
                <Target className="h-4 w-4" /> Set Limit
              </Link>
            </div>
          </div>
          
          {/* User & Logout */}
          <div className="flex items-center gap-6">
            <span className="text-gray-600 font-medium hidden sm:block">Hello, {userName}</span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;
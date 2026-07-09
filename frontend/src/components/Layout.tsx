import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Wallet, PlusCircle, Target, LayoutDashboard, List, Repeat, PieChart, Menu, X } from 'lucide-react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = localStorage.getItem('userName') || 'User';
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  // Helper to highlight the active tab
  const isActive = (path: string) => location.pathname === path ? 'text-blue-600 font-semibold bg-blue-50/50 lg:bg-transparent' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50 lg:hover:bg-transparent';

  const NavLinks = () => (
    <>
      <Link to="/dashboard" onClick={closeDrawer} className={`flex items-center gap-2 p-3 lg:p-0 rounded-lg lg:rounded-none transition-colors ${isActive('/dashboard')}`}>
        <LayoutDashboard className="h-5 w-5 lg:h-4 lg:w-4" /> Dashboard
      </Link>
      <Link to="/transactions" onClick={closeDrawer} className={`flex items-center gap-2 p-3 lg:p-0 rounded-lg lg:rounded-none transition-colors ${isActive('/transactions')}`}>
        <List className="h-5 w-5 lg:h-4 lg:w-4" /> Transactions
      </Link>
      <Link to="/recurring" onClick={closeDrawer} className={`flex items-center gap-2 p-3 lg:p-0 rounded-lg lg:rounded-none transition-colors ${isActive('/recurring')}`}>
        <Repeat className="h-5 w-5 lg:h-4 lg:w-4" /> Recurring
      </Link>
      <Link to="/analytics" onClick={closeDrawer} className={`flex items-center gap-2 p-3 lg:p-0 rounded-lg lg:rounded-none transition-colors ${isActive('/analytics')}`}>
        <PieChart className="h-5 w-5 lg:h-4 lg:w-4" /> Analytics
      </Link>
      <Link to="/add-expense" onClick={closeDrawer} className={`flex items-center gap-2 p-3 lg:p-0 rounded-lg lg:rounded-none transition-colors ${isActive('/add-expense')}`}>
        <PlusCircle className="h-5 w-5 lg:h-4 lg:w-4" /> Add Expense
      </Link>
      <Link to="/set-limit" onClick={closeDrawer} className={`flex items-center gap-2 p-3 lg:p-0 rounded-lg lg:rounded-none transition-colors ${isActive('/set-limit')}`}>
        <Target className="h-5 w-5 lg:h-4 lg:w-4" /> Set Limit
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-4 lg:gap-8">
            <button 
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/dashboard" className="flex items-center gap-2 text-blue-600">
              <Wallet className="h-8 w-8" />
              <span className="text-xl font-bold tracking-tight">Limitly</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex flex-wrap items-center gap-5 text-sm font-medium">
              <NavLinks />
            </div>
          </div>
          
          {/* User & Desktop Logout */}
          <div className="flex items-center gap-4 lg:gap-6">
            <span className="text-gray-600 font-medium">Hello, {userName}</span>
            <button 
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 lg:hidden transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Mobile Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Link to="/dashboard" onClick={closeDrawer} className="flex items-center gap-2 text-blue-600">
            <Wallet className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight">Limitly</span>
          </Link>
          <button 
            onClick={closeDrawer}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 font-medium">
          <NavLinks />
          <hr className="my-2 border-gray-100" />
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 p-3 w-full text-left rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import SetLimit from './pages/SetLimit';
import Transactions from './pages/Transactions';
import RecurringPayments from './pages/RecurringPayments';
import Analytics from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-expense" element={<AddExpense />} />
        <Route path="/set-limit" element={<SetLimit />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/recurring" element={<RecurringPayments />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
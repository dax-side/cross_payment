import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import ToastProvider from './components/ToastProvider';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -8 },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.2 }}><Landing /></motion.div>} />
        <Route path="/login" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.2 }}><Login /></motion.div>} />
        <Route path="/register" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.2 }}><Register /></motion.div>} />
        <Route path="/forgot-password" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.2 }}><ForgotPassword /></motion.div>} />
        <Route path="/reset-password" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.2 }}><ResetPassword /></motion.div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider />
        <AnimatedRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

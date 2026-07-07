import { Routes, Route, Navigate } from 'react-router-dom';
import useMetaMask from './hooks/useMetaMask';
import Navbar from './components/Common/Navbar';
import Footer from './components/Common/Footer';
import Home from './pages/Home';
import VoterDashboard from './pages/VoterDashboard';
import Results from './pages/Results';
import './App.css';

/*
 * ProtectedRoute Component
 * Prevents unauthorized access to dashboard and results pages.
 * Synchronously checks localStorage to prevent flash-redirect on refresh.
 */
function ProtectedRoute({ isConnected, children }) {
  const wasConnected = localStorage.getItem('cipherballot_wallet_connected') === 'true';
  
  if (!isConnected && !wasConnected) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const {
    account,
    isConnected,
    connectWallet,
    disconnectWallet,
  } = useMetaMask();

  return (
    <div className="app-layout">
      {/* ─── Top Navigation ─── */}
      <Navbar
        account={account}
        isConnected={isConnected}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
      />

      {/* ─── Page Content ─── */}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isConnected={isConnected}>
                <VoterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute isConnected={isConnected}>
                <Results />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {/* ─── Bottom Footer ─── */}
      <Footer />
    </div>
  );
}

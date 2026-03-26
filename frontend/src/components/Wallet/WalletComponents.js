import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Plus, CreditCard, History, ArrowUpRight, 
  ArrowDownLeft, Loader2, X, Gift, Clock, Phone
} from 'lucide-react';
import api from '../../lib/api';
import { usePayment } from '../../contexts/PaymentContext';
import { SmartPayment } from '../PaymentComponents';
import { Toaster, toast } from 'sonner';

// Wallet Balance Card Component
export function WalletCard({ onRecharge }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const res = await api.get('/api/wallet');
      setWallet(res.data);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-6 h-6" />
          <span className="font-medium">My Wallet</span>
        </div>
        <button 
          onClick={onRecharge}
          className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors"
          data-testid="recharge-wallet-btn"
        >
          <Plus className="w-4 h-4" />
          Add Money
        </button>
      </div>

      <div className="mb-4">
        <p className="text-white/70 text-sm mb-1">Available Balance</p>
        <p className="text-4xl font-bold">₹{wallet?.balance || 0}</p>
      </div>

      {wallet?.free_minutes > 0 && (
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 mb-4">
          <Gift className="w-5 h-5 text-yellow-300" />
          <span className="text-sm">
            <strong>{wallet.free_minutes}</strong> free minutes available!
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white/10 rounded-lg px-3 py-2">
          <p className="text-white/70 text-xs">Total Recharged</p>
          <p className="font-semibold">₹{wallet?.total_recharged || 0}</p>
        </div>
        <div className="bg-white/10 rounded-lg px-3 py-2">
          <p className="text-white/70 text-xs">Total Spent</p>
          <p className="font-semibold">₹{wallet?.total_spent || 0}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Recharge Modal Component
export function RechargeModal({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState(100);
  const [minAmount, setMinAmount] = useState(100);
  const [showPayment, setShowPayment] = useState(false);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const { paymentMethod } = usePayment();

  const presetAmounts = [100, 200, 500, 1000];

  useEffect(() => {
    api.get('/api/consultation/settings').then(res => {
      setMinAmount(res.data.min_recharge_amount);
      if (amount < res.data.min_recharge_amount) {
        setAmount(res.data.min_recharge_amount);
      }
    }).catch(() => {});
  }, []);

  const handleProceedToPayment = async () => {
    if (amount < minAmount) {
      toast.error(`Minimum recharge amount is ₹${minAmount}`);
      return;
    }
    setCreatingIntent(true);
    try {
      const res = await api.post('/api/wallet/create-recharge-intent', { amount });
      setPaymentData(res.data);
      setShowPayment(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initiate payment');
    } finally {
      setCreatingIntent(false);
    }
  };

  const handlePaymentSuccess = async (paymentResult) => {
    try {
      const res = await api.post('/api/wallet/recharge', {
        amount: amount,
        payment_id: paymentResult.id || paymentResult.razorpay_payment_id,
        payment_method: paymentMethod,
        payment_intent_id: paymentData?.payment_intent_id,
      });
      toast.success(`₹${amount} added to wallet!`);
      onSuccess?.(res.data.wallet);
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add balance');
    }
  };

  const handleClose = () => {
    setShowPayment(false);
    setPaymentData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {showPayment ? 'Complete Payment' : 'Recharge Wallet'}
            </h2>
            <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {!showPayment ? (
            <>
              {/* Preset Amounts */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {presetAmounts.map(preset => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      amount === preset
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="mb-6">
                <label className="text-sm text-gray-600 mb-1 block">Or enter custom amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Math.max(minAmount, parseInt(e.target.value) || 0))}
                    min={minAmount}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    data-testid="recharge-amount-input"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum recharge: ₹{minAmount}</p>
              </div>

              {/* Proceed Button */}
              <button
                onClick={handleProceedToPayment}
                disabled={creatingIntent || amount < minAmount}
                data-testid="recharge-proceed-btn"
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creatingIntent ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <><CreditCard className="w-5 h-5" /> Pay ₹{amount}</>
                )}
              </button>
            </>
          ) : (
            /* Real Payment Gateway */
            <SmartPayment
              amount={amount}
              clientSecret={paymentData?.client_secret}
              razorpayOrderId={paymentData?.razorpay_order_id}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPayment(false)}
              metadata={{ type: 'wallet_recharge' }}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            data-testid="confirm-recharge-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add ₹{amount}
              </>
            )}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Transaction History Component
export function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const res = await api.get('/api/wallet/transactions');
      setTransactions(res.data.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map(tx => (
        <div key={tx.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {tx.type === 'credit' ? (
              <ArrowDownLeft className="w-5 h-5 text-green-600" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-800 text-sm">{tx.description}</p>
            <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
          </div>
          <div className="text-right">
            <p className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
              {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
            </p>
            <p className="text-xs text-gray-500">Bal: ₹{tx.balance_after}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Low Balance Warning Popup
export function LowBalanceWarning({ balance, minutesLeft, onRecharge, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-x-4 bottom-24 md:bottom-4 md:right-4 md:left-auto md:w-96 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 shadow-xl z-50"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Wallet className="w-5 h-5 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-800">Low Balance Warning!</h4>
          <p className="text-sm text-yellow-700 mt-1">
            Only ~{minutesLeft} minute{minutesLeft !== 1 ? 's' : ''} left. Recharge now to continue your call.
          </p>
          <p className="text-xs text-yellow-600 mt-1">Current balance: ₹{balance}</p>
        </div>
        <button onClick={onDismiss} className="text-yellow-600 hover:text-yellow-800">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onRecharge}
          className="flex-1 bg-yellow-500 text-white py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
        >
          Recharge Now
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2 text-yellow-700 hover:bg-yellow-100 rounded-lg transition-colors"
        >
          Later
        </button>
      </div>
    </motion.div>
  );
}

// Grace Period Warning (Full Screen Overlay)
export function GracePeriodWarning({ secondsRemaining, onRecharge }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-red-600/90 z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl p-8 max-w-md text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Balance Exhausted!</h2>
        <p className="text-gray-600 mb-4">
          Your call will end in <strong className="text-red-600">{secondsRemaining}</strong> seconds.
          Recharge now to continue!
        </p>
        <div className="text-5xl font-bold text-red-600 mb-6">
          {secondsRemaining}s
        </div>
        <button
          onClick={onRecharge}
          className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-6 h-6" />
          Recharge Now - Keep Call Active
        </button>
      </div>
    </motion.div>
  );
}

export default WalletCard;

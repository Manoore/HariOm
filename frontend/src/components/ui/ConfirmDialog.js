import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, X } from 'lucide-react';

/**
 * Reusable in-app confirmation modal to replace window.confirm()
 * Usage:
 *   const { confirm, ConfirmDialog } = useConfirmDialog();
 *   const ok = await confirm({ title: 'End Stream?', message: '...', confirmLabel: 'End', variant: 'danger' });
 *   if (ok) { ... }
 *   // Render <ConfirmDialog /> in JSX
 */
export function useConfirmDialog() {
  const [state, setState] = useState({ open: false, config: {}, resolve: null });

  const confirm = (config = {}) => {
    return new Promise((resolve) => {
      setState({ open: true, config, resolve });
    });
  };

  const handleConfirm = () => {
    state.resolve?.(true);
    setState({ open: false, config: {}, resolve: null });
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState({ open: false, config: {}, resolve: null });
  };

  const ConfirmDialog = () => (
    <AnimatePresence>
      {state.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
              state.config.variant === 'danger' ? 'bg-red-100' : 'bg-saffron/10'
            }`}>
              {state.config.icon || (
                <AlertTriangle className={`w-7 h-7 ${
                  state.config.variant === 'danger' ? 'text-red-500' : 'text-saffron'
                }`} />
              )}
            </div>

            {/* Title */}
            <h3 className="font-cinzel text-lg font-bold text-center text-gray-900 mb-2">
              {state.config.title || 'Are you sure?'}
            </h3>

            {/* Message */}
            <p className="text-gray-500 text-sm text-center mb-6">
              {state.config.message || 'This action cannot be undone.'}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                {state.config.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                  state.config.variant === 'danger'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-saffron text-white hover:bg-orange-600'
                }`}
              >
                {state.config.confirmLabel || 'Confirm'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { confirm, ConfirmDialog };
}

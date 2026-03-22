import React, { useState } from 'react';
import { Wallet, Video } from 'lucide-react';
import { toast } from 'sonner';
import { WalletCard, RechargeModal } from '../../../../components/Wallet/WalletComponents';
import { AstrologerList, PreCallCheck, VideoCallScreen } from '../../../../components/VideoConsultation/VideoConsultation';

// Consultation Tab - Video Call with Astrologers
export function ConsultationTab({ isDesktop }) {
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [showPreCall, setShowPreCall] = useState(false);
  const [callData, setCallData] = useState(null);
  const [showRecharge, setShowRecharge] = useState(false);

  const handleSelectAstrologer = (astrologer) => {
    setSelectedAstrologer(astrologer);
    setShowPreCall(true);
  };

  const handleStartCall = (data) => {
    setCallData(data);
    setShowPreCall(false);
  };

  const handleEndCall = (reason) => {
    setCallData(null);
    setSelectedAstrologer(null);
    if (reason === 'insufficient_balance') {
      toast.error('Call ended due to insufficient balance');
    } else {
      toast.success('Call ended');
    }
  };

  // If in a call, show full-screen video
  if (callData) {
    return (
      <VideoCallScreen
        callData={callData}
        onEndCall={handleEndCall}
        astrologerInfo={selectedAstrologer}
      />
    );
  }

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8 ${isDesktop ? 'max-w-6xl mx-auto' : ''}`}>
      {/* Pre-Call Check Modal */}
      {showPreCall && selectedAstrologer && (
        <PreCallCheck
          astrologer={selectedAstrologer}
          onStartCall={handleStartCall}
          onCancel={() => {
            setShowPreCall(false);
            setSelectedAstrologer(null);
          }}
        />
      )}

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={showRecharge}
        onClose={() => setShowRecharge(false)}
        onSuccess={() => setShowRecharge(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-maroon mb-1">Video Consultation</h1>
          <p className="text-gray-500 text-sm">Connect with expert astrologers via video call</p>
        </div>
        <button
          onClick={() => setShowRecharge(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-700 transition-colors"
          data-testid="wallet-recharge-btn"
        >
          <Wallet className="w-4 h-4" />
          Recharge Wallet
        </button>
      </div>

      {/* Wallet Card */}
      <div className="mb-8">
        <WalletCard onRecharge={() => setShowRecharge(true)} />
      </div>

      {/* Available Astrologers */}
      <div className="mb-4">
        <h2 className="font-semibold text-lg text-gray-800 mb-1">Available Astrologers</h2>
        <p className="text-gray-500 text-sm">Select an astrologer to start a consultation</p>
      </div>

      <AstrologerList onSelectAstrologer={handleSelectAstrologer} />
    </div>
  );
}

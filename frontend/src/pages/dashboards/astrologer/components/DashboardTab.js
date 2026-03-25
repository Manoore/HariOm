import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, TrendingUp, Calendar, BarChart3, Wallet, 
  Loader2, IndianRupee 
} from 'lucide-react';

export function DashboardTab({ stats, isDesktop }) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const statCards = [
    { label: "Today's Earnings", value: `₹${stats.today_earnings}`, icon: IndianRupee, color: 'green', subtext: `${stats.today_calls} calls` },
    { label: "Today's Minutes", value: `${stats.today_minutes}m`, icon: Clock, color: 'blue', subtext: `Avg ${stats.avg_call_duration}m/call` },
    { label: "This Week", value: `₹${stats.week_earnings}`, icon: TrendingUp, color: 'purple', subtext: `${stats.week_calls} calls` },
    { label: "This Month", value: `₹${stats.month_earnings}`, icon: Calendar, color: 'orange', subtext: `${stats.month_calls} calls` },
  ];

  const colorClasses = {
    green: 'from-green-400 to-emerald-500',
    blue: 'from-blue-400 to-indigo-500',
    purple: 'from-purple-400 to-violet-500',
    orange: 'from-orange-400 to-amber-500'
  };

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back!</h1>
        <p className="text-gray-500">Here's your performance overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[stat.color]} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
          </motion.div>
        ))}
      </div>

      {/* Total Earnings Card */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-purple-200 text-sm">Total Earnings</p>
            <p className="text-4xl font-bold">₹{stats.total_earnings}</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-purple-200 text-xs">Total Consultations</p>
            <p className="text-xl font-semibold">{stats.total_calls}</p>
          </div>
          <div>
            <p className="text-purple-200 text-xs">Total Minutes</p>
            <p className="text-xl font-semibold">{stats.total_minutes}m</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:border-purple-200 transition-colors">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800">View Reports</p>
            <p className="text-xs text-gray-500">Detailed analytics</p>
          </div>
        </button>
        <button className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:border-purple-200 transition-colors">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <IndianRupee className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800">Withdraw</p>
            <p className="text-xs text-gray-500">₹{stats.pending_balance} available</p>
          </div>
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { UserCheck, CheckCircle, Star } from 'lucide-react';

export function PriestsTab({ priests, isDesktop, loading }) {
  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4">
        <h2 className="font-cinzel text-xl font-semibold text-gray-800 mb-4">Manage Priests</h2>
        {priests.length === 0 ? (
          <div className="bg-white shadow-sm border border-orange-100 rounded-xl p-8 text-center">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No priests registered yet</p>
          </div>
        ) : (
          <div className={`${isDesktop ? 'grid grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}`}>
            {priests.map((priest) => (
              <div key={priest.id} className="bg-white shadow-sm border border-orange-100 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-gray-800 font-semibold text-xl">
                    {priest.user_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-800 font-medium">{priest.user_name}</p>
                      {priest.is_verified && <CheckCircle className="w-4 h-4 text-green-400" />}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {priest.rating} ({priest.total_reviews} reviews)
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {priest.specializations?.slice(0, 2).map((s, i) => (
                    <span key={i} className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {!priest.is_verified && (
                    <button className="flex-1 bg-green-500/20 text-green-400 rounded-lg py-2 text-sm hover:bg-green-500/30 transition-colors">
                      Verify
                    </button>
                  )}
                  <button className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-2 text-sm hover:bg-orange-100 transition-colors">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

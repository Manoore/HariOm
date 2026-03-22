import React from 'react';
import { Package } from 'lucide-react';

export function ProductsTab({ products, isDesktop, loading }) {
  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4">
        <h2 className="font-cinzel text-xl font-semibold text-gray-800 mb-4">All Products</h2>
        {products.length === 0 ? (
          <div className="bg-white shadow-sm border border-orange-100 rounded-xl p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No products available</p>
          </div>
        ) : (
          <div className={`grid ${isDesktop ? 'grid-cols-3 xl:grid-cols-4' : 'grid-cols-2'} gap-4`}>
            {products.map((product) => (
              <div key={product.id} className="bg-white shadow-sm border border-orange-100 rounded-xl p-3 lg:p-4">
                <div className="aspect-square bg-gray-100 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Package className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <p className="text-gray-800 font-medium text-sm line-clamp-2 mb-1">{product.name}</p>
                <div className="flex items-center justify-between">
                  <p className="text-green-400 font-bold">₹{product.price}</p>
                  <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

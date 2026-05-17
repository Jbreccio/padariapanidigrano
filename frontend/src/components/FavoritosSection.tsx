// frontend/src/components/FavoritosSection.tsx
import React, { useState, useEffect } from 'react';
import { Star, Heart } from 'lucide-react';
import ProductCard from './ProductCard';
import { products, getFavoritos, Product } from '../data/products';

const FavoritosSection: React.FC = () => {
  const [favoritos, setFavoritos] = useState<Product[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const favoritosList = getFavoritos();
    setFavoritos(favoritosList);
  }, [refresh]);

  const handleFavoriteChange = () => {
    setRefresh(prev => prev + 1);
  };

  if (favoritos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <Heart size={48} className="mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-600">Nenhum favorito ainda</h3>
        <p className="text-gray-400 text-sm mt-1">
          Clique na estrela ⭐ dos produtos que você mais gosta para aparecerem aqui
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Star size={24} className="text-yellow-500 fill-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-800">Meus Favoritos</h2>
        <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded-full text-xs">
          {favoritos.length} produtos
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {favoritos.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onFavoriteChange={handleFavoriteChange}
          />
        ))}
      </div>
    </div>
  );
};

export default FavoritosSection;
// frontend/src/components/CardapioSection.tsx
import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { getProdutos, ProdutoItem, useRealtimeData } from '../data/products';

const CardapioSection: React.FC = () => {
  const { produtos, loading } = useRealtimeData();
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todos');

  const categorias = ['todos', 'pães', 'bolos', 'salgados', 'doces', 'bebidas'];

  const produtosFiltrados = produtos.filter(p => 
    categoriaSelecionada === 'todos' || p.categoria === categoriaSelecionada
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-500">Carregando cardápio...</p>
      </div>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Nosso Cardápio</h2>
        <p className="text-center text-gray-500 mb-8">Pães e bolos feitos com amor e ingredientes de qualidade</p>

        {/* Filtros */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaSelecionada(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                categoriaSelecionada === cat
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat === 'todos' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Grid de produtos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {produtosFiltrados.map(produto => (
            <div key={produto.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 overflow-hidden">
                <img 
                  src={produto.imagem} 
                  alt={produto.titulo} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 text-lg">{produto.titulo}</h3>
                <p className="text-gray-500 text-sm mt-1">{produto.descricao}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-primary font-bold text-xl">R$ {produto.preco.toFixed(2)}</span>
                  <button className="p-2 bg-primary/10 rounded-full text-primary hover:bg-primary hover:text-white transition-colors">
                    <ShoppingBag size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {produtosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum produto encontrado nesta categoria.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CardapioSection;
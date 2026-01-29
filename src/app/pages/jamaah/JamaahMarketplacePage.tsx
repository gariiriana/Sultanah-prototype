import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { ShoppingBag, Plus, Minus, ShoppingCart, X, Send, Search, Package as PackageIcon, ArrowLeft } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';
import { MarketplaceItem } from '../../../types/marketplace';
import { useAuth } from '../../../contexts/AuthContext';

const JamaahMarketplacePage = () => {
  const { userProfile } = useAuth();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [showCart, setShowCart] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, selectedCategory, searchQuery]);

  const fetchItems = async () => {
    try {
      const q = query(collection(db, 'marketplaceItems'), where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);
      const itemsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MarketplaceItem[];
      setItems(itemsData);
    } catch (error) {
      toast.error('Failed to load marketplace items');
    }
  };

  const filterItems = () => {
    let filtered = items;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredItems(filtered);
  };

  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
    toast.success('Item ditambahkan ke keranjang');
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getTotalAmount = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = items.find(i => i.id === itemId);
      return total + (item?.price || 0) * quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const handleCheckout = () => {
    // Prepare cart items with full item data
    const cartItems = Object.entries(cart).map(([itemId, quantity]) => {
      const item = items.find(i => i.id === itemId);
      return {
        item: item!,
        quantity
      };
    });

    const totalAmount = getTotalAmount();

    // Navigate to checkout page with cart data
    navigate('/marketplace/checkout', {
      state: {
        cartItems,
        totalAmount
      }
    });
    
    setShowCart(false);
  };

  const categories = [
    { id: 'all', label: '🛍️ Semua', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
    { id: 'perlengkapan', label: '🧳 Perlengkapan', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200' },
    { id: 'souvenir', label: '🎁 Souvenir', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' },
    { id: 'makanan', label: '🍽️ Makanan', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200' },
    { id: 'lainnya', label: '📦 Lainnya', color: 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 pb-24">
      {/* Clean Header with Subtle Islamic Design */}
      <div className="relative bg-white border-b-2 border-emerald-100 overflow-hidden">
        {/* Subtle Islamic Pattern Background */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230F766E' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Gold Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* Header Top Row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/current-jamaah/dashboard')}
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0 border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                  <ShoppingBag className="w-8 h-8 text-emerald-600" />
                  Marketplace Sultanah
                </h1>
                <p className="text-gray-600 text-sm md:text-base mt-1 font-medium">
                  Perlengkapan Umroh & Perjalanan Ibadah
                </p>
              </div>
            </div>

            {/* Cart Button - Emerald Theme */}
            <Button
              onClick={() => setShowCart(!showCart)}
              className="relative bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all h-12 px-5 gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold">Keranjang</span>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[28px] h-7 bg-gradient-to-br from-amber-400 to-amber-500 text-emerald-900 rounded-full text-sm font-bold flex items-center justify-center shadow-lg px-2">
                  {getTotalItems()}
                </span>
              )}
            </Button>
          </div>

          {/* Search Bar - Full Width Clean Design */}
          <div className="relative max-w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari perlengkapan umroh, souvenir, makanan..."
              className="pl-14 pr-5 h-14 bg-white border-2 border-emerald-100 focus:border-emerald-400 shadow-sm hover:shadow-md transition-shadow text-base rounded-lg text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Categories - Clean Pill Design */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all border-2 ${
                  selectedCategory === cat.id 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                    : cat.color
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Items Grid - 4 columns on XL screens */}
      <div className="max-w-7xl mx-auto p-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
            <PackageIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold text-lg">Tidak ada item ditemukan</p>
            <p className="text-sm text-gray-400 mt-2">Coba ubah kategori atau pencarian</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => {
              const inCart = cart[item.id] || 0;
              // Determine if item is "Best Seller" or "Recommended" (mock logic)
              const isBestSeller = index % 5 === 0; // Every 5th item
              const isRecommended = index % 7 === 0; // Every 7th item
              
              return (
                <div 
                  key={item.id} 
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-emerald-200 group"
                >
                  {/* Image Container with Badge Overlay */}
                  <div className="relative overflow-hidden bg-gray-50">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-56 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                        <PackageIcon className="w-16 h-16 text-emerald-300" />
                      </div>
                    )}
                    
                    {/* Subtle Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>

                    {/* Best Seller / Recommended Badge */}
                    {(isBestSeller || isRecommended) && (
                      <div className="absolute top-3 left-3">
                        {isBestSeller && (
                          <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 font-bold shadow-lg border-0 px-3 py-1">
                            ⭐ Best Seller
                          </Badge>
                        )}
                        {isRecommended && !isBestSeller && (
                          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg border-0 px-3 py-1">
                            ✨ Recommended
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Stock Badge - Smaller and Cleaner */}
                    <div className="absolute bottom-3 right-3">
                      <Badge 
                        className={`${
                          item.stock > 10 
                            ? 'bg-emerald-600 text-white' 
                            : item.stock > 5
                              ? 'bg-amber-500 text-white' 
                              : item.stock > 0 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-red-600 text-white'
                        } font-semibold shadow-md border-0 px-2.5 py-1 text-xs`}
                      >
                        Stok: {item.stock}
                      </Badge>
                    </div>
                  </div>

                  {/* Card Content - Clean & Spacious */}
                  <div className="p-4 space-y-2">
                    {/* Category Label - Small */}
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                      {item.category}
                    </p>

                    {/* Product Name */}
                    <h3 className="font-bold text-base text-gray-900 line-clamp-2 leading-snug">
                      {item.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Price */}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-2xl font-bold text-emerald-700">
                        Rp {item.price.toLocaleString('id-ID')}
                      </p>
                    </div>

                    {/* Add to Cart Section */}
                    {inCart > 0 ? (
                      <div className="flex items-center justify-between bg-emerald-50 rounded-lg p-2.5 border-2 border-emerald-200">
                        <Button 
                          size="sm" 
                          onClick={() => removeFromCart(item.id)}
                          className="h-8 w-8 p-0 bg-white hover:bg-gray-50 text-emerald-700 border border-emerald-300 shadow-sm"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-bold text-emerald-800 text-sm px-2">
                          {inCart} item
                        </span>
                        <Button 
                          size="sm" 
                          onClick={() => addToCart(item.id)} 
                          disabled={inCart >= item.stock}
                          className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-300 shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => addToCart(item.id)} 
                        disabled={item.stock === 0}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all font-semibold disabled:bg-gray-300 disabled:text-gray-500"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {item.stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCart(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-white shadow-2xl z-50 overflow-y-auto">
            {/* Cart Header */}
            <div className="bg-emerald-600 text-white p-6 border-b-2 border-emerald-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Keranjang Belanja
                </h2>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowCart(false)}
                  className="text-white hover:bg-emerald-700 h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {getTotalItems() > 0 && (
                <p className="text-emerald-100 text-sm mt-2">
                  {getTotalItems()} item dalam keranjang
                </p>
              )}
            </div>

            <div className="p-6">
              {Object.keys(cart).length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-semibold">Keranjang Kosong</p>
                  <p className="text-sm text-gray-400 mt-1">Mulai belanja sekarang</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {Object.entries(cart).map(([itemId, quantity]) => {
                      const item = items.find(i => i.id === itemId);
                      if (!item) return null;
                      return (
                        <div key={itemId} className="flex gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                          ) : (
                            <div className="w-16 h-16 bg-emerald-50 rounded-md flex items-center justify-center">
                              <PackageIcon className="w-8 h-8 text-emerald-300" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{item.name}</h4>
                            <p className="text-emerald-700 font-bold text-sm mt-0.5">
                              Rp {item.price.toLocaleString('id-ID')}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => removeFromCart(itemId)} 
                                className="h-7 w-7 p-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-sm font-semibold text-gray-700 min-w-[24px] text-center">
                                {quantity}
                              </span>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => addToCart(itemId)} 
                                disabled={quantity >= item.stock} 
                                className="h-7 w-7 p-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total Section */}
                  <div className="border-t-2 border-gray-200 pt-4 mb-4 space-y-2">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Subtotal ({getTotalItems()} item)</span>
                      <span className="font-semibold">
                        Rp {getTotalAmount().toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-emerald-700">
                        Rp {getTotalAmount().toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button 
                    onClick={handleCheckout}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl font-semibold text-base"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Checkout Sekarang
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default JamaahMarketplacePage;
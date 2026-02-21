
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Product, Order, OrderItem, Variation, PriceTier, Debt } from '../types';
import { Search, ShoppingCart, Plus, Minus, X, Tag, Camera, LogOut, Wallet, User as UserIcon, Check, ChevronDown } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

const COUNTRIES = [
  { name: 'Côte d\'Ivoire', code: '225', flag: '🇨🇮' },
  { name: 'Togo', code: '228', flag: '🇹🇬' },
  { name: 'Bénin', code: '229', flag: '🇧🇯' },
  { name: 'Sénégal', code: '221', flag: '🇸🇳' },
  { name: 'Mali', code: '223', flag: '🇲🇱' },
  { name: 'Burkina Faso', code: '226', flag: '🇧🇫' },
  { name: 'Niger', code: '227', flag: '🇳🇪' },
];

const POSView: React.FC = () => {
  const navigate = useNavigate();
  const user = db.getUser();
  const [products, setProducts] = useState<Product[]>(db.getProducts());
  const [cart, setCart] = useState<{ productId: string, variationLabel?: string, quantity: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductForVariation, setSelectedProductForVariation] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Customer selection
  const [customerName, setCustomerName] = useState('');
  const [phoneBody, setPhoneBody] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const allCustomers = db.getUniqueCustomers();

  // Debt fields
  const [isDebt, setIsDebt] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode === searchTerm
  );

  const filteredCustomers = allCustomers.filter(c => 
    c.name.toLowerCase().includes(customerName.toLowerCase()) || 
    c.phone.includes(customerName)
  );

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isScannerOpen) {
      scanner = new Html5QrcodeScanner("pos-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render((decodedText) => {
        const found = products.find(p => p.barcode === decodedText);
        if (found) {
          if (found.hasVariations) setSelectedProductForVariation(found);
          else addToCart(found);
          setIsScannerOpen(false);
          scanner?.clear();
        } else {
          alert("Produit inconnu: " + decodedText);
        }
      }, (err) => {});
    }
    return () => { scanner?.clear(); };
  }, [isScannerOpen, products]);

  const calculateTieredTotal = (qty: number, unitFallback: number, tiers: PriceTier[] = []) => {
    if (qty <= 0) return 0;
    if (!tiers || tiers.length === 0) return qty * unitFallback;
    const sortedTiers = [...tiers].sort((a, b) => b.quantity - a.quantity);
    let remaining = qty;
    let total = 0;
    for (const tier of sortedTiers) {
      if (tier.quantity <= 0) continue;
      const numLots = Math.floor(remaining / tier.quantity);
      if (numLots > 0) {
        total += numLots * tier.totalPrice;
        remaining = remaining % tier.quantity;
      }
    }
    if (remaining > 0) {
      const baseTier = tiers.find(t => t.quantity === 1);
      const unitPrice = baseTier ? baseTier.totalPrice : unitFallback;
      total += remaining * unitPrice;
    }
    return total;
  };

  const addToCart = (product: Product, variation?: Variation) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id && item.variationLabel === variation?.label);
      if (existing) return prev.map(item => (item.productId === product.id && item.variationLabel === variation?.label) ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { productId: product.id, variationLabel: variation?.label, quantity: 1 }];
    });
    setSelectedProductForVariation(null);
  };

  const removeFromCart = (productId: string, variationLabel?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId && item.variationLabel === variationLabel);
      if (existing && existing.quantity > 1) return prev.map(item => (item.productId === productId && item.variationLabel === variationLabel) ? { ...item, quantity: item.quantity - 1 } : item);
      return prev.filter(item => !(item.productId === productId && item.variationLabel === variationLabel));
    });
  };

  const handleLogout = () => {
    db.setUser(null);
    navigate('/login');
    window.location.reload();
  };

  const cartDetails = cart.map(item => {
    const product = products.find(p => p.id === item.productId)!;
    const basePrice = product.priceTiers?.find(t => t.quantity === 1)?.totalPrice || product.price || 0;
    const baseCost = product.costTiers?.find(t => t.quantity === 1)?.totalPrice || product.costPrice || 0;
    
    return {
      ...item, name: product.name,
      totalPrice: calculateTieredTotal(item.quantity, basePrice, product.priceTiers),
      totalCost: calculateTieredTotal(item.quantity, baseCost, product.costTiers),
      hasTiers: product.priceTiers?.some(t => t.quantity > 1 && item.quantity >= t.quantity)
    };
  });

  const cartTotal = cartDetails.reduce((sum, item) => sum + item.totalPrice, 0);

  const fullCustomerPhone = selectedCountry.code + phoneBody.replace(/\D/g, '');

  const handleCheckout = () => {
    if (cart.length === 0 || !customerName || !phoneBody || !user?.shopName) return;
    
    const paid = isDebt ? (parseFloat(amountPaid) || 0) : cartTotal;
    const isFullDebt = paid < cartTotal;

    const order: Order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      shopName: user.shopName, customerName, customerPhone: fullCustomerPhone,
      items: cartDetails.map(d => ({
        productId: d.productId, name: d.name, price: d.totalPrice, costPrice: d.totalCost, quantity: d.quantity, variationLabel: d.variationLabel
      })),
      total: cartTotal, 
      timestamp: Date.now(),
      isDebt: isFullDebt
    };

    db.saveOrder(order);

    if (isFullDebt) {
      const debt: Debt = {
        id: 'DBT_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        orderId: order.id,
        customerName,
        customerPhone: fullCustomerPhone,
        totalAmount: cartTotal,
        totalPaid: paid,
        status: 'pending',
        timestamp: Date.now(),
        lastPaymentDate: paid > 0 ? Date.now() : undefined
      };
      db.addDebt(debt);
    }

    db.saveProducts(products.map(p => {
       const cartItem = cart.find(ci => ci.productId === p.id);
       if (cartItem) return { ...p, stock: p.stock - cartItem.quantity };
       return p;
    }));

    window.open(`https://wa.me/${fullCustomerPhone}?text=${encodeURIComponent("Reçu digital : " + window.location.origin + "/#/receipt/" + order.id)}`, '_blank');
    setCart([]); setCustomerName(''); setPhoneBody(''); setIsCartOpen(false); setIsDebt(false); setAmountPaid('');
  };

  const selectCustomer = (c: {name: string, phone: string}) => {
    setCustomerName(c.name);
    // On essaye de trouver le pays correspondant à l'indicatif enregistré
    const foundCountry = COUNTRIES.find(count => c.phone.startsWith(count.code));
    if (foundCountry) {
      setSelectedCountry(foundCountry);
      setPhoneBody(c.phone.substring(foundCountry.code.length));
    } else {
      setPhoneBody(c.phone);
    }
    setShowCustomerList(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 md:mt-20">
      <div className="sticky top-0 bg-white border-b p-4 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><ShoppingCart size={20} /></div>
           <div className="flex flex-col"><span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter leading-none">{user?.shopName}</span><h2 className="text-xl font-bold leading-tight">Caisse</h2></div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setIsCartOpen(true)} className="relative p-3 bg-slate-100 rounded-2xl md:hidden"><ShoppingCart size={22} className="text-indigo-600" />{cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}</button>
           <button onClick={handleLogout} className="p-3 bg-red-50 text-red-500 rounded-2xl active:scale-95 transition-transform"><LogOut size={22} /></button>
        </div>
      </div>

      <div className="p-4 md:max-w-4xl md:mx-auto w-full flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Recherche produit..." className="w-full pl-11 pr-4 py-4 bg-white border-2 border-slate-100 rounded-3xl font-medium outline-none focus:border-indigo-400 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setIsScannerOpen(true)} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg active:scale-95"><Camera size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10 grid grid-cols-2 sm:grid-cols-4 gap-4 md:max-w-4xl md:mx-auto w-full">
        {filteredProducts.map(product => (
          <button 
            key={product.id} 
            onClick={() => product.hasVariations ? setSelectedProductForVariation(product) : addToCart(product)} 
            className="bg-white rounded-[1.8rem] p-5 shadow-sm border border-slate-100 active:scale-95 active:bg-indigo-600 active:text-white transition-all flex flex-col justify-center min-h-[100px] text-left group relative"
          >
            <h3 className="text-sm font-bold group-active:text-white text-slate-800 line-clamp-2 leading-snug">{product.name}</h3>
            <div className="mt-auto pt-2 flex justify-between items-center">
              <p className="text-[11px] font-black text-indigo-500 group-active:text-indigo-100">
                {(product.priceTiers?.find(t => t.quantity === 1)?.totalPrice || product.price || 0).toLocaleString()} F
              </p>
              {product.priceTiers && product.priceTiers.length > 1 && <Tag size={12} className="text-slate-300 group-active:text-white/50" />}
            </div>
            {product.stock <= 5 && <span className="absolute top-2 right-3 text-[8px] font-black text-red-400 uppercase">Stock: {product.stock}</span>}
          </button>
        ))}
      </div>

      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex flex-col md:items-end">
          <div className="flex-1 md:w-full" onClick={() => setIsCartOpen(false)}></div>
          <div className="bg-white rounded-t-[3.5rem] md:rounded-none md:w-[450px] w-full h-[95vh] md:h-full flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-8 border-b flex justify-between items-center"><h2 className="text-2xl font-black">Panier</h2><button onClick={() => setIsCartOpen(false)} className="p-3 bg-slate-100 rounded-full"><X size={20} /></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cartDetails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-50">
                   <ShoppingCart size={64} strokeWidth={1} />
                   <p className="font-bold mt-4">Le panier est vide</p>
                </div>
              ) : (
                <>
                  {cartDetails.map((item, idx) => (
                    <div key={`${idx}`} className="flex flex-col p-5 bg-slate-50 rounded-[2rem] gap-2 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 flex-1 text-sm">{item.name}</h4>
                        <div className="flex items-center gap-3 bg-white border rounded-2xl px-3 py-1.5 shadow-sm">
                          <button onClick={() => removeFromCart(item.productId, item.variationLabel)} className="p-1"><Minus size={14} /></button>
                          <span className="font-black text-xs min-w-[1rem] text-center">{item.quantity}</span>
                          <button onClick={() => { const p = products.find(x => x.id === item.productId); if(p) addToCart(p); }} className="p-1"><Plus size={14} /></button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 border-dashed">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Total {item.hasTiers && "lot appliqué"}</span>
                        <p className="font-black text-indigo-600">{item.totalPrice.toLocaleString()} F</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-6 space-y-4">
                     {/* BOUTON DETTE EN PREMIER */}
                     <div className={`flex flex-col gap-3 p-5 rounded-3xl border transition-all ${isDebt ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <Wallet size={18} className={isDebt ? 'text-orange-600' : 'text-slate-400'} />
                             <span className={`text-xs font-black uppercase tracking-tight ${isDebt ? 'text-orange-600' : 'text-slate-400'}`}>Vente à crédit / Dette</span>
                           </div>
                           <button 
                             onClick={() => setIsDebt(!isDebt)} 
                             className={`w-12 h-6 rounded-full relative transition-all ${isDebt ? 'bg-orange-500 shadow-md' : 'bg-slate-200'}`}
                           >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDebt ? 'left-7' : 'left-1'}`}></div>
                           </button>
                        </div>
                        {isDebt && (
                          <div className="animate-in slide-in-from-top-2 duration-200">
                            <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest ml-1 mb-1 block">Montant déjà versé par le client</label>
                            <input type="number" className="w-full p-4 bg-white rounded-2xl border-2 border-orange-200 font-black outline-none focus:border-orange-500 shadow-inner" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0 FCFA" />
                            <p className="text-[10px] text-orange-700 font-bold mt-2 italic text-right">Reste à payer : {(cartTotal - (parseFloat(amountPaid) || 0)).toLocaleString()} F</p>
                          </div>
                        )}
                     </div>

                     {/* CHAMPS CLIENTS ENSUITE */}
                     <div className="relative">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nom du client</label>
                        <input 
                          type="text" 
                          className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none" 
                          value={customerName} 
                          onChange={(e) => { setCustomerName(e.target.value); setShowCustomerList(true); }}
                          onFocus={() => setShowCustomerList(true)}
                          placeholder="Rechercher ou saisir nom" 
                        />
                        {showCustomerList && filteredCustomers.length > 0 && (
                          <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[160] max-h-48 overflow-y-auto p-2">
                             <div className="p-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b mb-1">Choisir un client existant</div>
                             {filteredCustomers.map((c, i) => (
                               <button key={i} onClick={() => selectCustomer(c)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl text-left transition-colors group">
                                  <div><p className="font-bold text-sm text-slate-800">{c.name}</p><p className="text-[10px] text-slate-400">{c.phone}</p></div>
                                  <UserIcon size={16} className="text-slate-300 group-hover:text-indigo-500" />
                               </button>
                             ))}
                          </div>
                        )}
                     </div>

                     <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Numéro WhatsApp (Sélectionner pays)</label>
                        <div className="flex gap-2">
                          <div className="relative">
                            <select 
                              className="appearance-none bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl pl-4 pr-10 py-5 font-black text-sm outline-none"
                              value={selectedCountry.code}
                              onChange={(e) => {
                                const country = COUNTRIES.find(c => c.code === e.target.value);
                                if (country) setSelectedCountry(country);
                              }}
                            >
                              {COUNTRIES.map(c => (
                                <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                          </div>
                          <input 
                            type="tel" 
                            className="flex-1 p-5 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none" 
                            value={phoneBody} 
                            onChange={(e) => setPhoneBody(e.target.value)} 
                            placeholder="Ex: 01020304" 
                          />
                        </div>
                     </div>
                  </div>
                </>
              )}
            </div>
            <div className="p-8 border-t bg-slate-50">
              <div className="flex justify-between mb-6">
                 <span className="font-black text-slate-400 uppercase text-[10px]">Net à payer</span>
                 <span className="text-3xl font-black text-indigo-600">{cartTotal.toLocaleString()} F</span>
              </div>
              <button disabled={cart.length === 0 || !customerName || !phoneBody} onClick={handleCheckout} className={`w-full ${isDebt ? 'bg-orange-600 shadow-orange-100' : 'bg-indigo-600 shadow-indigo-100'} text-white py-6 rounded-[2.5rem] font-black shadow-xl active:scale-95 disabled:opacity-30 disabled:grayscale transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3`}>
                {isDebt ? <><Wallet size={20} /> ENREGISTRER LA DETTE</> : <><Check size={20} /> VALIDER ET ENVOYER</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {isScannerOpen && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center">
          <div id="pos-reader" className="w-full max-w-sm overflow-hidden rounded-3xl"></div>
          <button onClick={() => setIsScannerOpen(false)} className="mt-10 p-5 bg-white text-black font-black rounded-full shadow-2xl flex items-center gap-2"><X size={24} /> FERMER</button>
        </div>
      )}

      {selectedProductForVariation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[210] flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] p-8 animate-in slide-in-from-bottom">
             <div className="flex justify-between items-center mb-6"><div><h3 className="text-xl font-black">{selectedProductForVariation.name}</h3></div><button onClick={() => setSelectedProductForVariation(null)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button></div>
             <div className="grid grid-cols-2 gap-3">
               {selectedProductForVariation.variations.map(v => (
                 <button key={v.id} disabled={v.stock <= 0} onClick={() => addToCart(selectedProductForVariation, v)} className="p-5 rounded-[2rem] border-2 font-black transition-all text-sm border-slate-100 bg-slate-50 active:bg-indigo-600 active:text-white disabled:opacity-30">{v.label}</button>
               ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSView;

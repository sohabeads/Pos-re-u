
import React, { useState, useRef, useEffect } from 'react';
import { db } from '../db';
import { Product, Variation, PriceTier } from '../types';
import { Plus, Trash2, Edit2, X, Tag, ShoppingBag, Camera, Package } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(db.getProducts());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [name, setName] = useState('');
  const [stock, setStock] = useState('');
  const [barcode, setBarcode] = useState('');
  const [hasVariations, setHasVariations] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [costTiers, setCostTiers] = useState<PriceTier[]>([]);

  // Scanner Logic
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isScannerOpen) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render((decodedText) => {
        setBarcode(decodedText);
        setIsScannerOpen(false);
        scanner?.clear();
      }, (err) => {});
    }
    return () => { scanner?.clear(); };
  }, [isScannerOpen]);

  const openAddModal = () => {
    setEditingProduct(null); setName(''); setStock('');
    setBarcode(''); setHasVariations(false); setVariations([]);
    setPriceTiers([{ quantity: 1, totalPrice: 0 }]); 
    setCostTiers([{ quantity: 1, totalPrice: 0 }]);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p); setName(p.name); setStock(p.stock.toString());
    setBarcode(p.barcode || ''); setHasVariations(p.hasVariations);
    setVariations(p.variations || []); 
    setPriceTiers(p.priceTiers?.length ? p.priceTiers : [{ quantity: 1, totalPrice: 0 }]); 
    setCostTiers(p.costTiers?.length ? p.costTiers : [{ quantity: 1, totalPrice: 0 }]);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name || priceTiers.length === 0) {
      alert("Veuillez donner un nom et au moins un prix de vente.");
      return;
    }
    const basePrice = priceTiers.find(t => t.quantity === 1)?.totalPrice || 0;
    const baseCost = costTiers.find(t => t.quantity === 1)?.totalPrice || 0;
    const totalStock = hasVariations ? variations.reduce((s, v) => s + v.stock, 0) : parseInt(stock) || 0;
    
    const newProduct: Product = {
      id: editingProduct?.id || 'PRD_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      name, price: basePrice, costPrice: baseCost,
      stock: totalStock, imageUrl: '', // Image désactivée
      barcode, hasVariations, variations: hasVariations ? variations : [],
      priceTiers: [...priceTiers].sort((a,b) => a.quantity - b.quantity), 
      costTiers: [...costTiers].sort((a,b) => a.quantity - b.quantity)
    };
    const updated = editingProduct ? products.map(p => p.id === editingProduct.id ? newProduct : p) : [newProduct, ...products];
    db.saveProducts(updated); setProducts(updated); setIsModalOpen(false);
  };

  const updateTier = (index: number, type: 'price' | 'cost', field: 'quantity' | 'totalPrice', value: number) => {
    if (type === 'price') {
      const n = [...priceTiers]; n[index] = { ...n[index], [field]: value };
      setPriceTiers(n);
    } else {
      const n = [...costTiers]; n[index] = { ...n[index], [field]: value };
      setCostTiers(n);
    }
  };

  return (
    <div className="p-4 md:mt-20 max-w-4xl mx-auto w-full pb-20">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-black text-slate-800 tracking-tighter">Catalogue</h1><p className="text-slate-500 text-sm">{products.length} articles enregistrés</p></div>
        <button onClick={openAddModal} className="bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all"><Plus size={28} /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white p-5 rounded-[2.5rem] flex items-center gap-4 shadow-sm border border-slate-100 group">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
               <Package size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 text-sm truncate">{product.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] text-indigo-600 font-black">{product.price.toLocaleString()} F</p>
                <span className="text-[10px] text-slate-300">|</span>
                <p className="text-[10px] text-slate-400 font-bold">Stock: {product.stock}</p>
              </div>
            </div>
            <button onClick={() => openEditModal(product)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center">
          <div className="bg-white w-full max-w-xl rounded-t-[3rem] md:rounded-[2.5rem] p-8 shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2">
              <h2 className="text-2xl font-black">Produit</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du produit</label>
                <input type="text" className="w-full p-5 bg-slate-50 rounded-3xl font-bold outline-none border-2 border-transparent focus:border-indigo-500" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              {/* GRILLE D'ACHAT EN PREMIER */}
              <div className="p-6 bg-slate-100 rounded-[2.5rem] space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-700"><ShoppingBag size={18} /><h3 className="font-black text-sm uppercase">Grille d'Achat (Coût)</h3></div>
                  <button onClick={() => setCostTiers([...costTiers, {quantity:1, totalPrice:0}])} className="bg-slate-700 text-white p-2 rounded-xl"><Plus size={16} /></button>
                </div>
                <div className="space-y-3">
                  {costTiers.map((t, i) => (
                    <div key={i} className="flex gap-2 items-center bg-white p-3 rounded-2xl border border-slate-200">
                      <input type="number" className="w-16 p-2 bg-slate-50 rounded-lg font-black text-center text-xs" value={t.quantity} onChange={(e) => updateTier(i, 'cost', 'quantity', parseInt(e.target.value)||0)} />
                      <span className="text-[8px] font-black text-slate-300 uppercase">Unité(s)</span>
                      <input type="number" className="flex-1 p-2 bg-slate-50 rounded-lg font-black text-slate-700 text-sm" value={t.totalPrice} onChange={(e) => updateTier(i, 'cost', 'totalPrice', parseInt(e.target.value)||0)} />
                      <button onClick={() => setCostTiers(costTiers.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* GRILLE DE VENTE EN SECOND */}
              <div className="p-6 bg-indigo-50 rounded-[2.5rem] space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-indigo-600"><Tag size={18} /><h3 className="font-black text-sm uppercase">Grille de Vente</h3></div>
                  <button onClick={() => setPriceTiers([...priceTiers, {quantity:1, totalPrice:0}])} className="bg-indigo-600 text-white p-2 rounded-xl"><Plus size={16} /></button>
                </div>
                <div className="space-y-3">
                  {priceTiers.map((t, i) => (
                    <div key={i} className="flex gap-2 items-center bg-white p-3 rounded-2xl shadow-sm">
                      <input type="number" className="w-16 p-2 bg-slate-50 rounded-lg font-black text-center text-xs" value={t.quantity} onChange={(e) => updateTier(i, 'price', 'quantity', parseInt(e.target.value)||0)} />
                      <span className="text-[8px] font-black text-slate-300 uppercase">Unité(s)</span>
                      <input type="number" className="flex-1 p-2 bg-slate-50 rounded-lg font-black text-indigo-600 text-sm" value={t.totalPrice} onChange={(e) => updateTier(i, 'price', 'totalPrice', parseInt(e.target.value)||0)} />
                      <button onClick={() => setPriceTiers(priceTiers.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock actuel</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={stock} onChange={(e) => setStock(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Code Barre</label>
                  <div className="relative">
                    <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                    <button onClick={() => setIsScannerOpen(true)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg"><Camera size={16} /></button>
                  </div>
                </div>
              </div>

              <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black shadow-xl shadow-indigo-100 active:scale-95 transition-all">ENREGISTRER LE PRODUIT</button>
            </div>
          </div>
        </div>
      )}

      {isScannerOpen && (
        <div className="fixed inset-0 bg-black z-[120] flex flex-col items-center justify-center">
          <div id="reader" className="w-full max-w-sm overflow-hidden rounded-3xl"></div>
          <button onClick={() => setIsScannerOpen(false)} className="mt-10 p-5 bg-white text-black font-black rounded-full shadow-2xl flex items-center gap-2"><X size={24} /> FERMER LE SCANNER</button>
        </div>
      )}
    </div>
  );
};

export default ProductsView;

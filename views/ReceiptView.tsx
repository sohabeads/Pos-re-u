
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../db';
import { Order, Debt } from '../types';
import { Download, ChevronLeft, Wallet } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

const ReceiptView: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (orderId) {
      setOrder(db.getOrderById(orderId));
    }
  }, [orderId]);

  // Récupérer les infos de dette liées à cette commande
  const debtInfo = useMemo(() => {
    if (!order) return null;
    return db.getDebts().find(d => d.orderId === order.id);
  }, [order]);

  const downloadJPG = async () => {
    if (receiptRef.current) {
      setIsGenerating(true);
      try {
        const dataUrl = await htmlToImage.toJpeg(receiptRef.current, { 
          quality: 0.95, 
          backgroundColor: '#ffffff',
          pixelRatio: 3 // Higher resolution
        });
        const link = document.createElement('a');
        link.download = `recu-${order?.id || 'commande'}.jpg`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Download failed', err);
        alert('Erreur lors de la génération de l\'image.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <h2 className="text-xl font-bold mb-4">Reçu non trouvé</h2>
        <Link to="/" className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black">Retour</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center">
      <div className="w-full max-w-md flex items-center justify-between p-4 sticky top-0 bg-slate-100/90 backdrop-blur-md z-10 no-print">
        <Link to="/" className="p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-transform">
          <ChevronLeft size={24} className="text-slate-600" />
        </Link>
        <button 
          onClick={downloadJPG} 
          disabled={isGenerating}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50"
        >
          <Download size={20} />
          {isGenerating ? 'Génération...' : 'ENREGISTRER JPG'}
        </button>
      </div>

      <div className="p-4 w-full max-w-md mb-20 animate-in zoom-in-95 duration-500">
        <div ref={receiptRef} className="bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden relative border border-slate-100">
          <div className="text-center mb-10 border-b-2 border-dashed border-slate-100 pb-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-100">
               <svg xmlns="http://www.w3.org/2000/svg" className="text-white" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{order.shopName}</h1>
            <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-[0.3em]">Reçu de vente {order.isDebt && 'à crédit'}</p>
          </div>

          <div className="space-y-8 mb-10">
            <div className="flex justify-between items-start">
              <div className="max-w-[60%]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Client</p>
                <h2 className="text-xl font-black text-slate-800 leading-tight">{order.customerName}</h2>
                <p className="text-slate-500 font-bold text-xs mt-1">{order.customerPhone}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">N° Commande</p>
                <p className="text-slate-800 font-black text-sm">#{order.id}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">
                  {new Date(order.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 mb-10">
             <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest pb-3 border-b border-slate-50">
               <span>Article</span>
               <span>Total</span>
             </div>
             {order.items.map((item, idx) => (
               <div key={idx} className="flex justify-between items-center">
                 <div className="flex-1">
                   <h4 className="font-black text-slate-800 text-sm">{item.name}</h4>
                   <div className="flex gap-2 items-center mt-0.5">
                    {item.variationLabel && <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{item.variationLabel}</span>}
                    <p className="text-[11px] text-slate-400 font-bold">{item.quantity} x {item.price.toLocaleString()} FCFA</p>
                   </div>
                 </div>
                 <span className="font-black text-slate-800 text-sm">{(item.quantity * item.price).toLocaleString()}</span>
               </div>
             ))}
          </div>

          <div className={`${order.isDebt ? 'bg-orange-600 shadow-orange-100' : 'bg-indigo-600 shadow-indigo-100'} rounded-[2rem] p-8 mb-8 shadow-xl relative overflow-hidden`}>
             <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center border-b border-white/20 pb-4">
                   <span className="font-black text-white/60 uppercase text-[10px] tracking-[0.2em]">Montant Total</span>
                   <span className="text-2xl font-black text-white">{order.total.toLocaleString()} FCFA</span>
                </div>
                {order.isDebt && debtInfo && (
                  <>
                    <div className="flex justify-between items-center">
                       <span className="font-black text-white/60 uppercase text-[10px] tracking-[0.2em]">Versé ce jour</span>
                       <span className="text-lg font-black text-white">{debtInfo.totalPaid.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                       <span className="font-black text-orange-200 uppercase text-[10px] tracking-[0.2em]">Reste à payer</span>
                       <span className="text-xl font-black text-white">{(order.total - debtInfo.totalPaid).toLocaleString()} FCFA</span>
                    </div>
                  </>
                )}
             </div>
             {order.isDebt && <Wallet className="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-10 -rotate-12" />}
          </div>

          <div className="text-center pt-8 border-t-2 border-dashed border-slate-50">
             <p className="text-xs font-bold text-slate-800 mb-2">Merci pour votre achat !</p>
             <p className="text-[10px] text-slate-400 font-medium">Document numérique généré par QuickPOS.</p>
          </div>
          
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-10 rounded-full bg-slate-100"></div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-10 rounded-full bg-slate-100"></div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptView;

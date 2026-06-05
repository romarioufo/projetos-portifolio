import { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import HeaderDemo from "./HeaderDemo";
import {
  ShoppingBag, Package, CreditCard, BarChart3, Clock, Building2,
  UtensilsCrossed, Truck, Heart, Users, Star, Settings, Link2,
  ChevronRight, Plus, Search, Filter, Edit, Trash2, Eye, X,
  ArrowLeft, MapPin, Phone, Mail, CheckCircle, AlertCircle,
  TrendingUp, DollarSign, ShoppingCart, Bike, ChefHat, Bell,
  Home, Menu, Minus, Send, Clipboard, LayoutGrid, List,
  Calendar, Download, MoreVertical, RefreshCw, Award, Globe,
  User, LogOut, Moon, Sun, Flame, Zap, Target, Gift, Printer, FileText, Copy, Ticket, Crown, CheckCircle2, Smartphone, Navigation, Radio
} from "lucide-react";
import { auth, googleProvider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { collection, onSnapshot, doc, getDoc, getDocs, updateDoc, setDoc, addDoc, deleteDoc, query, orderBy, serverTimestamp, runTransaction, writeBatch } from "firebase/firestore";
import L from "leaflet";

// Fix Leaflet default icon paths (needed for bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// UFO Burguers brand coordinates (Rua Dias Macêdo, Fortaleza)
const UFO_RESTAURANT_COORDS = { lat: -3.7510, lng: -38.5282 };


// ==================== DATA ====================

const INITIAL_MENU = [
  // === Hamburguers Especiais ===
  { id: 1, name: "Burguer Rover Pro", price: 14.90, category: "Hamburguers Especiais", image: "🍔", photo: null, description: "Pão, carne e queijo. The Rover básico e saboroso", active: true, popular: false, tag: "" },
  { id: 2, name: "Hambúrguer Simples Nave", price: 16.00, category: "Hamburguers Especiais", image: "🛸", photo: null, description: "Porque simplicidade é magia! O Simples Nave chega direto da galáxia do sabor com pão e carne que fazem qualquer um decolar", active: true, popular: true, tag: "RECOMENDADO" },
  { id: 3, name: "Hambúrguer Rover Bacon", price: 17.90, category: "Hamburguers Especiais", image: "🥓", photo: null, description: "Especial direto com puro gourmet! Rover com carne saborosa e Bacon crocante", active: true, popular: true, tag: "MAIS PEDIDO" },
  { id: 4, name: "Burguer Alienado", price: 24.00, category: "Hamburguers Especiais", image: "👽", photo: null, description: "Para aqui interstelar até a última colher! O Alienado traz carne com mix de salada e um hambúrguer com tudo para 170g de carne suculenta", active: true, popular: true, tag: "MAIS PEDIDO" },
  { id: 5, name: "Burguer Cheddar Marciano", price: 24.00, category: "Hamburguers Especiais", image: "🧀", photo: null, description: "Cheddar marciano é uma explosão de sabor que vem direto de Marte. Carne 170g, molho especial, cheddar cremoso", active: true, popular: true, tag: "RECOMENDADO" },
  { id: 6, name: "Burguer Explosão Solar", price: 32.00, category: "Hamburguers Especiais", image: "☀️", photo: null, description: "O burrito do chef de lua é o Explosão Solar. Tudo começa com carne suculenta, queijo, molho bacon, muçarela, alface, tomate", active: true, popular: false, tag: "" },
  { id: 7, name: "Burguer Visage Nordestina", price: 22.90, category: "Hamburguers Especiais", image: "🌵", photo: null, description: "Uma viagem de sabor que mistura o espaço sideral com as raízes do Nordeste. O Visage Nordestino traz 170g de carne suculenta", active: true, popular: false, tag: "" },
  { id: 8, name: "Burguer Asteroide", price: 32.00, category: "Hamburguers Especiais", image: "☄️", photo: null, description: "Impacto intergaláctico! The Asteroide traz: 2 carnes suculentas, queijo prato, cheddar, bacon crocante e molho especial", active: true, popular: true, tag: "MAIS PEDIDO" },

  // === Promoções da Galáxia ===
  { id: 9, name: "Combo Asteroide", price: 44.50, category: "Promoções da Galáxia", image: "☄️", photo: null, description: "Hambúrguer Asteroide + Maionese, Batata e Cheddar + Coca Lata 350ml - porque não existe um combo mais astronômico!", active: true, popular: true, tag: "PROMO", originalPrice: 69.00 },
  { id: 10, name: "Burguer Rover Pro (pão, carne e queijo)", price: 14.90, category: "Promoções da Galáxia", image: "🍔", photo: null, description: "Bolo artesanal feito na hora! Pão, carne e queijo - simples e delicioso", active: true, popular: false, tag: "PROMO" },
  { id: 11, name: "Combo Rovers Triple + Coca 1L", price: 40.90, category: "Promoções da Galáxia", image: "🪐", photo: null, description: "3 Deliciosos hambúrgueres Rover Pro, pão carne e queijo + 1 Coca-Cola 1L", active: true, popular: false, tag: "PROMO", originalPrice: 44.90 },
  { id: 25, name: "Combo Amor Cósmico Especial p/ 2", price: 92.00, category: "Promoções da Galáxia", image: "💫", photo: null, description: "Um combo feito para casal que se ama ao infinito! Burguer Cheddar Marciano + acompanhamentos especiais para 2", active: true, popular: false, tag: "PROMO" },
  { id: 26, name: "Burguer Visage Nordestina (Promo)", price: 26.00, category: "Promoções da Galáxia", image: "🌵", photo: null, description: "Uma viagem de sabor que mistura o espaço sideral com os sabores do Nordeste. O Visage Nordestina traz 170g de carne suculenta", active: true, popular: false, tag: "PROMO" },

  // === Combos ===
  { id: 12, name: "Combo Simples Nave", price: 25.90, category: "Combos", image: "🛸", photo: null, description: "Hambúrguer Simples Nave 170g de carne suculenta + refri + batata. Completo e delicioso!", active: true, popular: false },
  { id: 13, name: "Combo Alienado", price: 34.00, category: "Combos", image: "👽", photo: null, description: "Burguer Alienado + Refri + Batata. 170g de carne suculenta, cream cheese, bacon crocante, queijo prato, batata frita com Ketchup e gasta documento. Sabor de...", active: true, popular: true },
  { id: 14, name: "Combo Cheddar Marciano", price: 34.00, category: "Combos", image: "🧀", photo: null, description: "Burguer Cheddar Marciano + Refri + Batata. 170g de carne caramelizada, cream cheese, molho da casa, cheddar cremoso", active: true, popular: false },
  { id: 15, name: "Combo Visage Nordestina", price: 39.00, category: "Combos", image: "🌵", photo: null, description: "Burguer Visage Nordestina + Refri + Batata. 170g de carne, cream cheese, queijo coalho, cebola e bacon crocante", active: true, popular: false },
  { id: 16, name: "Combo Explosão Solar", price: 42.00, category: "Combos", image: "☀️", photo: null, description: "Burguer Explosão Solar + Refri + Batata. 170g de carne, queijo prato, bacon, muçarela, alface, tomate e molho especial", active: true, popular: false },
  { id: 17, name: "Combo Asteroide", price: 42.00, category: "Combos", image: "☄️", photo: null, description: "Burguer Asteroide + Refri + Batata. O impacto mais saboroso da galáxia com 2 carnes 170g cada", active: true, popular: true },

  // === Extras ===
  { id: 18, name: "Batata Frita", price: 9.99, category: "Extras", image: "🍟", photo: null, description: "Crocante, douradinha e sem parem com nada! Nossa batata frita artesanal vai ter aquela magia por dentro e perfeição por fora", active: true, popular: false },
  { id: 19, name: "Batata com Cheddar e Bacon", price: 24.99, category: "Extras", image: "🍟", photo: null, description: "Batata frita coberta com cheddar cremoso e bacon crocante", active: true, popular: true },

  // === Bebidas ===
  { id: 20, name: "Coca-Cola Lata 350ml", price: 6.50, category: "Bebidas", image: "🥤", photo: null, description: "Lata 350ml gelada", active: true, popular: true },
  { id: 21, name: "Coca-Cola Zero Lata 350ml", price: 6.50, category: "Bebidas", image: "🥤", photo: null, description: "Lata 350ml gelada - zero açúcar", active: true, popular: false },
  { id: 22, name: "Coca-Cola 1L", price: 12.99, category: "Bebidas", image: "🥤", photo: null, description: "Garrafa 1 litro", active: true, popular: false },
  { id: 23, name: "Guaraná 350ml", price: 6.50, category: "Bebidas", image: "🧃", photo: null, description: "Guaraná Antarctica lata 350ml", active: true, popular: true, tag: "RECOMENDADO" },
  { id: 24, name: "Sprite 350ml", price: 6.50, category: "Bebidas", image: "🫧", photo: null, description: "Sprite lata 350ml gelada", active: true, popular: false },
];

// "Aguardando Pagamento" must come first so online-payment orders are visible
// in the Kanban before the payment is confirmed.
const STATUS_FLOW = ["Aguardando Pagamento", "Novo", "Confirmado", "Preparando", "Saiu p/ Entrega", "Entregue"];
const STATUS_COLORS = {
  "Aguardando Pagamento": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-400" },
  "Novo": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  "Confirmado": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500" },
  "Preparando": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  "Saiu p/ Entrega": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  "Entregue": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  "Cancelado": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  "Recusado": { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", dot: "bg-red-600" },
};

export const getDisplayOrderId = (o) => {
  if (!o) return "";
  if (o.dailyId) return `#${String(o.dailyId).padStart(2, '0')}`;
  return `#${(o.id || '').toString().slice(-4).toUpperCase()}`;
};

const INITIAL_ORDERS = [
  { id: 1001, customer: "Maria Silva", phone: "(85) 99901-1234", address: "Rua A, 100 - Meireles", items: [{ name: "Burguer Alienado", qty: 2, price: 24.00 }, { name: "Batata Frita", qty: 1, price: 9.99 }], status: "Novo", time: "14:32", date: "09/03/2026", payment: "PIX", deliveryFee: 5.00, note: "Sem cebola" },
  { id: 1002, customer: "João Oliveira", phone: "(85) 99902-5678", address: "Av B, 250 - Aldeota", items: [{ name: "Burguer Asteroide", qty: 1, price: 32.00 }, { name: "Coca-Cola Lata 350ml", qty: 2, price: 6.50 }, { name: "Batata com Cheddar e Bacon", qty: 1, price: 24.99 }], status: "Confirmado", time: "14:15", date: "09/03/2026", payment: "Cartão", deliveryFee: 7.00, note: "" },
  { id: 1003, customer: "Ana Costa", phone: "(85) 99903-9012", address: "Rua C, 45 - Varjota", items: [{ name: "Combo Alienado", qty: 1, price: 34.00 }, { name: "Guaraná 350ml", qty: 1, price: 6.50 }], status: "Preparando", time: "13:50", date: "09/03/2026", payment: "Dinheiro", deliveryFee: 4.00, note: "Troco p/ 50" },
  { id: 1004, customer: "Carlos Lima", phone: "(85) 99904-3456", address: "Rua D, 800 - Cocó", items: [{ name: "Combo Asteroide", qty: 2, price: 42.00 }, { name: "Burguer Cheddar Marciano", qty: 1, price: 24.00 }, { name: "Coca-Cola 1L", qty: 1, price: 12.99 }], status: "Saiu p/ Entrega", time: "13:20", date: "09/03/2026", payment: "PIX", deliveryFee: 8.00, note: "" },
  { id: 1005, customer: "Fernanda Souza", phone: "(85) 99905-7890", address: "Av E, 1200 - Papicu", items: [{ name: "Combo Astronauta", qty: 1, price: 44.50 }, { name: "Sprite 350ml", qty: 1, price: 6.50 }], status: "Entregue", time: "12:45", date: "09/03/2026", payment: "Cartão", deliveryFee: 6.00, note: "" },
  { id: 1006, customer: "Pedro Santos", phone: "(85) 99906-2345", address: "Rua F, 33 - Benfica", items: [{ name: "Burguer Explosão Solar", qty: 1, price: 32.00 }, { name: "Burguer Visage Nordestina", qty: 1, price: 22.90 }, { name: "Coca-Cola Lata 350ml", qty: 2, price: 6.50 }], status: "Novo", time: "14:40", date: "09/03/2026", payment: "PIX", deliveryFee: 9.00, note: "Apartamento 302" },
];

const INITIAL_CUSTOMERS = [
  { id: 1, name: "Maria Silva", phone: "(85) 99901-1234", email: "maria@email.com", orders: 12, total: 456.80, points: 230, lastOrder: "09/03/2026" },
  { id: 2, name: "João Oliveira", phone: "(85) 99902-5678", email: "joao@email.com", orders: 8, total: 312.50, points: 156, lastOrder: "09/03/2026" },
  { id: 3, name: "Ana Costa", phone: "(85) 99903-9012", email: "ana@email.com", orders: 15, total: 589.90, points: 295, lastOrder: "09/03/2026" },
  { id: 4, name: "Carlos Lima", phone: "(85) 99904-3456", email: "carlos@email.com", orders: 5, total: 198.70, points: 99, lastOrder: "09/03/2026" },
  { id: 5, name: "Fernanda Souza", phone: "(85) 99905-7890", email: "fernanda@email.com", orders: 20, total: 845.30, points: 423, lastOrder: "09/03/2026" },
];

const REVIEWS = [
  { id: 1, customer: "Maria Silva", rating: 5, comment: "Melhor hambúrguer da cidade! O Cheddar Marciano é incrível, cheddar super cremoso!", date: "08/03/2026", order: 998 },
  { id: 2, customer: "João Oliveira", rating: 4, comment: "Muito bom, o Asteroide é gigante! Mas a entrega demorou um pouco.", date: "07/03/2026", order: 995 },
  { id: 3, customer: "Fernanda Souza", rating: 5, comment: "O Combo Astronauta é excelente custo benefício! Amei a batata com cheddar e bacon.", date: "06/03/2026", order: 990 },
  { id: 4, customer: "Pedro Santos", rating: 3, comment: "O Rover Bacon é bom, mas veio sem o bacon extra que pedi.", date: "05/03/2026", order: 985 },
  { id: 5, customer: "Ana Costa", rating: 5, comment: "Burguer Visage Nordestina é uma delícia! Sabor regional incrível, parabéns!", date: "04/03/2026", order: 980 },
];

const DRIVERS = [
  { id: 1, name: "Lucas Ferreira", phone: "(85) 99910-1111", vehicle: "Moto", status: "Disponível", deliveries: 145, rating: 4.8 },
  { id: 2, name: "Rafael Mendes", phone: "(85) 99910-2222", vehicle: "Moto", status: "Em entrega", deliveries: 203, rating: 4.9 },
  { id: 3, name: "Thiago Alves", phone: "(85) 99910-3333", vehicle: "Bicicleta", status: "Offline", deliveries: 87, rating: 4.6 },
];

const INITIAL_USERS = [
  { id: 1, name: "Romário Alves", email: "oliver.romario@gmail.com", password: "Rompopufo51@", role: "ADMIN", phone: "85986142172" }
];

const INITIAL_COMPANY = {
  name: "Ufo Burguers", slug: "ufo_burguers", phone: "(85) 3333-4444",
  whatsapp: "5585999999999",
  address: "Rua Dias Macêdo - Fortaleza/CE", hours: "Qui-Dom: 19:00 - 23:00",
  description: "Hambúrgueres artesanais de outro mundo! 🛸🍔", logo: "🛸",
  banner: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop",
  prepTime: "35-45 min",
  deliveryFeeMin: 4,
  deliveryRadius: 8,
};

// ==================== PIX EMV PAYLOAD GENERATOR ====================
const generatePixPayload = (pixKey, pixKeyType, holderName, amount, city = 'FORTALEZA') => {
  const pad = (id, val) => id + String(val.length).padStart(2, '0') + val;
  const keyType = { email: 'br.gov.bcb.pix', cpf: 'br.gov.bcb.pix', phone: 'br.gov.bcb.pix', random: 'br.gov.bcb.pix' };
  const gui = pad('00', keyType[pixKeyType] || 'br.gov.bcb.pix');
  const key = pad('01', pixKey);
  const merchantAcct = pad('26', gui + key);
  const mcc = pad('52', '0000');
  const currency = pad('53', '986'); // BRL
  const amountStr = amount > 0 ? pad('54', amount.toFixed(2)) : '';
  const countryCode = pad('58', 'BR');
  const merchantName = pad('59', (holderName || 'UFO BURGUERS').substring(0, 25).toUpperCase());
  const merchantCity = pad('60', city.substring(0, 15).toUpperCase());
  const txId = pad('05', '***');
  const additionalData = pad('62', txId);
  const payload = pad('00', '01') + merchantAcct + mcc + currency + amountStr + countryCode + merchantName + merchantCity + additionalData + '6304';
  // CRC16-CCITT
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xFFFF;
  }
  return payload + crc.toString(16).toUpperCase().padStart(4, '0');
};

// ==================== HELPER COMPONENTS ====================
const Badge = ({ children, variant = "default", className = "" }) => {
  const styles = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-sky-50 text-sky-700",
    purple: "bg-violet-50 text-violet-700",
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]} ${className}`}>{children}</span>;
};

const GRADIENT_MAP = {
  "🍔": "from-amber-800 to-yellow-700", "🥓": "from-red-800 to-rose-600", "🧀": "from-yellow-600 to-amber-500",
  "👽": "from-emerald-700 to-green-500", "☄️": "from-orange-700 to-red-500", "☀️": "from-yellow-500 to-orange-500",
  "🌵": "from-green-700 to-emerald-500", "🛸": "from-slate-700 to-gray-500", "🚀": "from-indigo-700 to-blue-500",
  "🪐": "from-violet-700 to-purple-500", "💫": "from-pink-600 to-rose-400", "🍟": "from-yellow-600 to-amber-400",
  "🥤": "from-red-700 to-red-500", "🧃": "from-green-600 to-emerald-400", "🫧": "from-emerald-500 to-teal-400",
};

const ProductImage = ({ photo, emoji, size = "md", className = "" }) => {
  const sizes = { xs: "w-10 h-10", sm: "w-12 h-12", md: "w-16 h-16", lg: "w-20 h-20", xl: "w-24 h-24", full: "w-full h-full", card: "w-full aspect-square", colossal: "w-full aspect-square" };
  const emojiSizes = { xs: "text-lg", sm: "text-xl", md: "text-2xl", lg: "text-3xl", xl: "text-4xl", full: "text-5xl", card: "text-5xl", colossal: "text-7xl sm:text-8xl" };
  const grad = GRADIENT_MAP[emoji] || "from-gray-700 to-gray-500";

  if (photo) {
    return (
      <div className={`${sizes[size]} rounded-xl overflow-hidden flex-shrink-0 ${className}`}>
        <img src={photo} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${sizes[size]} rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 ${className}`}>
      <span className={`${emojiSizes[size]} drop-shadow-md`}>{emoji}</span>
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const StatCard = ({ icon: Icon, label, value, change, color = "text-gray-900", bg = "bg-white" }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50`}>
        <Icon size={20} className={color} />
      </div>
      {change && (
        <span className={`text-xs font-medium ${change > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-1">{label}</p>
  </div>
);

const Modal = ({ isOpen, onClose, title, children, wide }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(50px)', WebkitBackdropFilter: 'blur(50px)' }} onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-lg'} w-full max-h-[85vh] overflow-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const SaveButton = ({ onClick, label = "Salvar Alterações", icon: Icon = CheckCircle, className = "", fullWidth = false }) => {
  const [saved, setSaved] = useState(false);
  const handleClick = async () => {
    try {
      await onClick();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <button onClick={handleClick}
      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] ${
        saved
          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
          : 'bg-gray-900 text-white hover:bg-gray-800'
      } ${fullWidth ? 'w-full' : ''} ${className}`}>
      {saved ? <><CheckCircle size={16} /> Alteração Salva</> : <><Icon size={16} /> {label}</>}
    </button>
  );
};

// ==================== LIVE TRACKING MAP ====================

// geocodeCache is used by LiveTrackingMap to cache address→coords lookups.
// The actual geocodeAddress function is declared further below (near DeliveryConfig).
const geocodeCache = {};


const haversineKm = (a, b) => {
  if (!a || !b) return null;
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
};

const LiveTrackingMap = ({ variant = 'admin', driverLocation, customerAddress, customerCoords: customerCoordsProp, driverName = 'Entregador', orderId = '', height = 360 }) => {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const [customerCoords, setCustomerCoords] = useState(customerCoordsProp || null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [distKm, setDistKm] = useState(null);
  const isAdmin = variant === 'admin';

  const makeDriverIcon = useCallback(() => L.divIcon({
    className: '',
    html: `<div style="position:relative;width:48px;height:48px">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(239,68,68,0.25);animation:ufo-ping 1.4s cubic-bezier(0,0,0.2,1) infinite"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:#EF4444;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(239,68,68,0.6);border:2px solid #fff">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M19 7c0-1.1-.9-2-2-2h-3v2h3v2.65L13.52 14H10V9H6c-2.21 0-4 1.79-4 4v3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4.48L19 10.35V7zM7 17c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/><path d="M5 6h5v2H5zM19 13c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>
      </div>
    </div>`,
    iconSize: [48, 48], iconAnchor: [24, 24], popupAnchor: [0, -28],
  }), []);

  const makeRestaurantIcon = useCallback(() => L.divIcon({
    className: '',
    html: `<div style="width:44px;height:44px;border-radius:12px;background:#111827;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.5);border:2px solid rgba(255,255,255,0.15);font-size:22px">🛸</div>`,
    iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -26],
  }), []);

  const makeCustomerIcon = useCallback(() => L.divIcon({
    className: '',
    html: `<div style="position:relative;width:44px;height:54px">
      <div style="width:44px;height:44px;border-radius:12px;background:#7C3AED;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(124,58,237,0.5);border:2px solid #fff;font-size:22px">🏠</div>
      <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid #7C3AED;margin:0 auto"></div>
    </div>`,
    iconSize: [44, 54], iconAnchor: [22, 54], popupAnchor: [0, -58],
  }), []);

  useEffect(() => {
    if (customerCoordsProp) { setCustomerCoords(customerCoordsProp); return; }
    if (!customerAddress) return;
    const key = customerAddress.toLowerCase().trim();
    if (geocodeCache[key]) { setCustomerCoords(geocodeCache[key]); return; }
    const q = encodeURIComponent(`${customerAddress}, Fortaleza, CE, Brasil`);
    fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, { headers: { 'Accept-Language': 'pt-BR' } })
      .then(r => r.json())
      .then(data => {
        if (data && data[0]) {
          const c = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          geocodeCache[key] = c;
          setCustomerCoords(c);
        }
      })
      .catch(e => console.warn('Map geocode failed:', e));
  }, [customerAddress, customerCoordsProp]);


  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    const tileUrl = isAdmin
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const center = driverLocation || customerCoords || UFO_RESTAURANT_COORDS;
    const map = L.map(mapRef.current, { center: [center.lat, center.lng], zoom: 14, zoomControl: false, scrollWheelZoom: true });
    L.tileLayer(tileUrl, { attribution: '© <a href="https://carto.com">CARTO</a> © <a href="https://openstreetmap.org">OSM</a>', maxZoom: 19, subdomains: 'abcd' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    leafletRef.current = map;
    const restMarker = L.marker([UFO_RESTAURANT_COORDS.lat, UFO_RESTAURANT_COORDS.lng], { icon: makeRestaurantIcon() }).addTo(map);
    restMarker.bindPopup('<b style="font-size:13px">🛸 UFO Burguers</b><br><span style="color:#9ca3af;font-size:11px">Rua Dias Macêdo, Fortaleza</span>');
    return () => { map.remove(); leafletRef.current = null; driverMarkerRef.current = null; customerMarkerRef.current = null; routeLineRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;
    if (driverLocation) {
      setLastUpdated(new Date());
      setDistKm(haversineKm(driverLocation, customerCoords));
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
      } else {
        const m = L.marker([driverLocation.lat, driverLocation.lng], { icon: makeDriverIcon(), zIndexOffset: 1000 }).addTo(map);
        m.bindPopup(`<b style="font-size:13px">🛵 ${driverName}</b><br><span style="color:#9ca3af;font-size:11px">Pedido ${orderId}</span>`);
        driverMarkerRef.current = m;
      }
      const dest = customerCoords || UFO_RESTAURANT_COORDS;
      const latlngs = [[driverLocation.lat, driverLocation.lng], [dest.lat, dest.lng]];
      if (routeLineRef.current) { routeLineRef.current.setLatLngs(latlngs); }
      else { routeLineRef.current = L.polyline(latlngs, { color: isAdmin ? '#EF4444' : '#7C3AED', weight: 3, opacity: 0.85, dashArray: '8, 6' }).addTo(map); }
      if (customerCoords) {
        map.fitBounds([[driverLocation.lat, driverLocation.lng], [customerCoords.lat, customerCoords.lng]], { padding: [52, 52], maxZoom: 16, animate: true });
      } else {
        map.setView([driverLocation.lat, driverLocation.lng], 15, { animate: true });
      }
    } else {
      if (driverMarkerRef.current) { driverMarkerRef.current.remove(); driverMarkerRef.current = null; }
      if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null; }
    }
  }, [driverLocation, customerCoords, isAdmin, driverName, orderId, makeDriverIcon]);

  useEffect(() => {
    const map = leafletRef.current;
    if (!map || !customerCoords) return;
    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng([customerCoords.lat, customerCoords.lng]);
    } else {
      const m = L.marker([customerCoords.lat, customerCoords.lng], { icon: makeCustomerIcon() }).addTo(map);
      m.bindPopup(`<b style="font-size:13px">🏠 Destino</b><br><span style="color:#9ca3af;font-size:11px">${customerAddress || ''}</span>`);
      customerMarkerRef.current = m;
    }
  }, [customerCoords, customerAddress, makeCustomerIcon]);

  const secSinceUpdate = lastUpdated ? Math.round((Date.now() - lastUpdated.getTime()) / 1000) : null;
  const etaMin = distKm ? Math.max(1, Math.round(distKm / 0.4)) : null;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 900, display: 'flex', alignItems: 'center', gap: 6 }}
        className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border ${isAdmin ? 'bg-gray-900/80 text-white border-white/10' : 'bg-white/90 text-gray-800 border-gray-200 shadow-md'}`}>
        <span className={`w-2 h-2 rounded-full ufo-live-dot ${driverLocation ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
        {driverLocation ? 'Ao Vivo' : 'GPS Offline'}
      </div>
      {variant === 'customer' && driverLocation && etaMin && (
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 900 }}
          className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-md rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800">
          🕐 ~{etaMin} min
        </div>
      )}
      <div ref={mapRef} style={{ height, width: '100%' }} className={isAdmin ? 'ufo-map-admin' : 'ufo-map-customer'} />
      <div className={`flex items-center gap-2 mt-1.5 text-[10px] ${isAdmin ? 'text-gray-500' : 'text-gray-400'}`}>
        {lastUpdated
          ? <><MapPin size={9} />Atualizado há {secSinceUpdate}s {distKm && `· ${distKm.toFixed(1)} km restantes`}</>
          : <><Radio size={9} />Aguardando GPS do entregador...</>}
      </div>
    </div>
  );
};

// ==================== ADMIN PAGES ====================

// --- Login Screen ---
const Login = ({ onLogin, users }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isForgot, setIsForgot] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (isForgot) {
      if (!email || !password) return setError("Preencha o email e a nova senha.");
      const foundUser = users.find(u => u.email === email);
      if (foundUser) {
        try {
          const updatedUsers = users.map(u => u.email === email ? { ...u, password } : u);
          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "settings", "company"), { adminUsers: updatedUsers }, { merge: true });
          setSuccessMsg("Senha alterada com sucesso! Você já pode entrar.");
          setIsForgot(false);
          setPassword("");
        } catch (err) {
          setError("Erro ao alterar a senha. Tente novamente.");
        }
      } else {
        setError("Email não encontrado.");
      }
      return;
    }

    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError("Email ou senha incorretos.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-lg shadow-red-200">
            🛸
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">UFO BURGUERS</h1>
          <p className="text-sm text-gray-500 mt-1">{isForgot ? 'Recuperação de Senha' : 'Acesso Restrito - Painel Administrativo'}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-6 flex items-center gap-2 border border-red-100 font-medium">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-600 text-sm p-3 rounded-xl mb-6 flex items-center gap-2 border border-emerald-100 font-medium">
            <CheckCircle size={16} />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                autoFocus
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all font-medium"
                placeholder="admin@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 ml-1 pr-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">{isForgot ? 'Nova Senha' : 'Senha'}</label>
              {!isForgot && (
                <button type="button" onClick={() => { setIsForgot(true); setError(""); setSuccessMsg(""); setPassword(""); }} className="text-xs text-red-600 font-bold hover:underline">
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative">
              <LogOut size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-180" />
              <input
                type="password"
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all font-medium"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); setSuccessMsg(""); }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-gray-800 hover:shadow-lg transition-all active:scale-[0.98] mt-2 flex justify-center items-center gap-2"
          >
            {isForgot ? 'Salvar Nova Senha' : 'Entrar no Sistema'} <ChevronRight size={16} />
          </button>

          {isForgot && (
            <button type="button" onClick={() => { setIsForgot(false); setError(""); setSuccessMsg(""); }} className="w-full py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition mt-2">
              Voltar para o Login
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

const OrderCard = ({ order, setSelected, moveOrder, getTotal }) => {
  const sc = STATUS_COLORS[order.status];
  const nextIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = nextIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[nextIdx + 1] : null;
  return (
    <div className={`bg-white rounded-xl border ${sc.border} p-4 cursor-pointer hover:shadow-md transition-all group`} onClick={() => setSelected(order)}>
      <div className="flex justify-between items-start mb-3">
        <span className="font-bold text-gray-900">{getDisplayOrderId(order)}</span>
        <span className="text-[10px] text-gray-400 border border-gray-100 px-2 py-0.5 rounded bg-white">{order.time}</span>
      </div>
      <p className="font-medium text-gray-800 text-sm">{order.customer}</p>
      <p className="text-xs text-gray-400 mt-1 truncate">{order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="font-bold text-gray-900">R$ {getTotal(order).toFixed(2)}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{order.payment}</span>
      </div>
      {nextStatus && (
        <button
          onClick={(e) => { e.stopPropagation(); moveOrder(order.id, nextStatus); }}
          className="mt-3 w-full py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition opacity-0 group-hover:opacity-100"
        >
          Mover → {nextStatus}
        </button>
      )}
    </div>
  );
};

// ─── Automatic Inventory Deduction ───────────────────────────────────────────
/**
 * Reads the recipe of each order item from Firestore and deducts the
 * corresponding supply quantities. Safe to call multiple times — checks
 * `inventoryDeducted` flag to prevent double-deductions.
 *
 * @param {string} orderId  - Firestore document ID of the order
 * @param {Array}  items    - order items array: [{ name, qty }, ...]
 */
const deductInventoryForOrder = async (orderId, items) => {
  try {
    // Fetch menu and supplies in parallel
    const [menuSnap, suppliesSnap] = await Promise.all([
      getDocs(collection(db, "menu")),
      getDocs(collection(db, "supplies")),
    ]);
    const menuItems   = menuSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const suppliesMap = {};
    suppliesSnap.docs.forEach(d => { suppliesMap[d.id] = { id: d.id, ...d.data() }; });

    // Accumulate deductions per supplyId
    const deductions  = {}; // { supplyId: totalQty }
    const usageRows   = []; // audit records

    for (const orderItem of items) {
      const menuItem = menuItems.find(m => m.name === orderItem.name);
      if (!menuItem?.recipe?.length) continue;

      for (const ingredient of menuItem.recipe) {
        const used = Number(ingredient.quantity) * Number(orderItem.qty);
        deductions[ingredient.supplyId] = (deductions[ingredient.supplyId] || 0) + used;
        usageRows.push({
          supplyId:   ingredient.supplyId,
          supplyName: ingredient.supplyName,
          quantity:   used,
          unit:       ingredient.unit || '',
          note:       `Auto — Pedido #${orderId}: ${orderItem.qty}× ${orderItem.name}`,
          date:       serverTimestamp(),
          auto:       true,
          orderId,
        });
      }
    }

    if (!Object.keys(deductions).length) return; // nothing to deduct

    const batch = writeBatch(db);

    // Decrement each supply's currentStock
    for (const [supplyId, qty] of Object.entries(deductions)) {
      const supply = suppliesMap[supplyId];
      if (!supply) continue;
      const newStock = Math.max(0, (supply.currentStock || 0) - qty);
      batch.update(doc(db, "supplies", supplyId), { currentStock: newStock });
    }

    // Add usage audit records
    for (const row of usageRows) {
      batch.set(doc(collection(db, "supply_usage")), row);
    }

    // Mark order so we never deduct twice
    batch.update(doc(db, "orders", orderId), { inventoryDeducted: true });

    await batch.commit();
    console.log(`[Estoque] Dedução automática aplicada ao pedido ${orderId}.`);
  } catch (e) {
    // Non-blocking — log but don't break the order flow
    console.warn("[Estoque] Erro na dedução automática:", e);
  }
};

// --- Order Management (Kanban) ---
// eslint-disable-next-line no-unused-vars
const OrderManagement = ({ orders, setOrders, caixa, setCaixa }) => {
  const [viewMode, setViewMode] = useState("kanban");
  const [selected, setSelected] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptType, setReceiptType] = useState("both");
  const [refuseReason, setRefuseReason] = useState("");
  const [showRefuseArea, setShowRefuseArea] = useState(false);
  const [receiptSettings, setReceiptSettings] = useState({ width: 80, fontSize: 12, fontWeight: 700, showLogo: true, showAddress: true });
  const [showReceiptEditor, setShowReceiptEditor] = useState(false);

  // --- Daily filter: only today's orders in Kanban ---
  const todayStr = new Date().toLocaleDateString('pt-BR');
  const todayOrders = orders.filter(o => o.date === todayStr);
  const pendingPastOrders = orders.filter(o => o.date !== todayStr && !["Entregue", "Cancelado", "Recusado"].includes(o.status));

  const moveOrder = async (orderId, newStatus, reason = null) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Auto add delivery receipts to cash drawer
    if (newStatus === "Entregue" && order.payment === "Dinheiro" && order.customer !== "Cliente Balcão" && caixa.isOpen) {
      const total = order.items.reduce((s, i) => s + i.price * i.qty, 0) + order.deliveryFee;
      setCaixa(prev => ({
        ...prev,
        currentCash: prev.currentCash + total,
        events: [{ id: Date.now().toString(), type: 'Venda', amount: total, method: 'Dinheiro', note: `Delivery #${order.id}`, timestamp: new Date() }, ...prev.events]
      }));
    }

    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      // UI locally updates as the onSnapshot handles array modification upstream.

      // Auto-deduct inventory when a pending-payment order is confirmed
      if (newStatus === "Confirmado" && order.status === "Aguardando Pagamento" && !order.inventoryDeducted) {
        deductInventoryForOrder(orderId, order.items);
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao alterar o status no banco.");
    }
  };

  const getTotal = (order) => order.items.reduce((s, i) => s + i.price * i.qty, 0) + order.deliveryFee;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) return;
    const order = selected;
    const now = new Date().toLocaleString('pt-BR');
    const rs = receiptSettings;
    const baseFontSize = rs.fontSize;
    const fw = rs.fontWeight || 700;

    const buildReceipt = (type) => {
      const isKitchen = type === "kitchen";
      const title = isKitchen ? "COZINHA" : "PEDIDO";
      return `
        <div style="page-break-after: always; padding: 8px 0;">
          <div style="text-align:center; border-bottom: 2px dashed #999; padding-bottom: 10px; margin-bottom: 10px;">
            ${rs.showLogo ? `<img src="/logo-round.png" alt="Ufo Burguers Logo" style="width: 70px; height: 70px; object-fit: contain; margin: 0 auto 6px; display: block;" />` : ''}
            <div style="font-size: ${baseFontSize + 4}px; font-weight: 900; letter-spacing: 1px;">UFO BURGUERS</div>
            ${rs.showAddress ? `<div style="font-size: ${baseFontSize - 2}px; color: #777; font-weight: ${fw};">Rua Dias Macêdo - Fortaleza/CE</div>` : ''}
            <div style="margin-top: 6px; background: #000; color: #fff; display: inline-block; padding: 2px 12px; border-radius: 4px; font-size: ${baseFontSize - 1}px; font-weight: 900; letter-spacing: 2px;">${title}</div>
          </div>
          <div style="font-size: ${baseFontSize}px; font-weight: ${fw}; margin-bottom: 10px;">
            <div style="display:flex; justify-content:space-between;"><strong>Pedido</strong><strong>${getDisplayOrderId(order)}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span>Data</span><span>${order.date} ${order.time}</span></div>
            ${!isKitchen ? `
              <div style="display:flex; justify-content:space-between;"><span>Cliente</span><span>${order.customer}</span></div>
              <div style="display:flex; justify-content:space-between;"><span>Tel</span><span>${order.phone}</span></div>
              <div style="display:flex; justify-content:space-between;"><span>End.</span><span style="max-width:180px; text-align:right;">${order.address}</span></div>
              <div style="display:flex; justify-content:space-between;"><span>Pagamento</span><span><strong>${order.payment}</strong></span></div>
            ` : ''}
          </div>
          <div style="border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 8px 0; margin-bottom: 8px;">
            <div style="font-size: ${baseFontSize - 1}px; font-weight: 900; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; color: #555;">Itens</div>
            ${order.items.map(item => {
              const complements = item.selectedComplements ? Object.entries(item.selectedComplements).map(([groupName, opts]) => {
                const names = (Array.isArray(opts) ? opts : [opts]).map(o => o?.name || o).filter(Boolean);
                return names.length ? names.join(', ') : null;
              }).filter(Boolean).join(' | ') : '';
              const obs = item.observation || '';
              return `
              <div style="padding: 4px 0; border-bottom: 1px dashed #eee; font-weight: ${isKitchen ? 900 : fw};">
                <div style="display:flex; justify-content:space-between; font-size: ${isKitchen ? (baseFontSize + 2) : baseFontSize}px;">
                  <span>${item.qty}x ${item.name}</span>
                  ${!isKitchen ? `<span>R$ ${(item.price * item.qty).toFixed(2)}</span>` : ''}
                </div>
                ${complements ? `<div style="font-size: ${baseFontSize - 1}px; color: #555; padding-left: 14px; margin-top: 2px;">↳ ${complements}</div>` : ''}
                ${obs ? `<div style="font-size: ${baseFontSize - 1}px; color: #c0392b; padding-left: 14px; margin-top: 1px;">✏ ${obs}</div>` : ''}
              </div>
            `}).join('')}
          </div>
          ${order.note ? `
            <div style="background: #fff8e1; border: 1px solid #ffe082; border-radius: 6px; padding: 8px; margin-bottom: 8px; font-size: ${baseFontSize}px; font-weight: ${fw};">
              <div style="font-weight: 900; font-size: ${baseFontSize - 1}px; color: #f57c00;">⚠ OBSERVAÇÃO</div>
              <div style="margin-top: 2px; ${isKitchen ? `font-size:${baseFontSize + 2}px; font-weight:900;` : ''}">${order.note}</div>
            </div>
          ` : ''}
          ${!isKitchen ? `
            <div style="font-size: ${baseFontSize}px; font-weight: ${fw};">
              <div style="display:flex; justify-content:space-between;"><span>Subtotal</span><span>R$ ${(getTotal(order) - order.deliveryFee).toFixed(2)}</span></div>
              <div style="display:flex; justify-content:space-between;"><span>Taxa entrega</span><span>R$ ${order.deliveryFee.toFixed(2)}</span></div>
              <div style="display:flex; justify-content:space-between; font-size: ${baseFontSize + 4}px; font-weight: 900; border-top: 2px solid #000; margin-top: 6px; padding-top: 6px;">
                <span>TOTAL</span><span>R$ ${getTotal(order).toFixed(2)}</span>
              </div>
            </div>
          ` : ''}
          <div style="text-align:center; margin-top: 12px; border-top: 1px dashed #ccc; padding-top: 8px; font-size: ${baseFontSize - 2}px; color: #aaa; font-weight: ${fw};">
            ${isKitchen ? 'VIA DA COZINHA' : 'VIA DO CLIENTE'} • Impresso em ${now}
          </div>
        </div>
      `;
    };

    let receipts = '';
    if (receiptType === 'kitchen' || receiptType === 'both') receipts += buildReceipt('kitchen');
    if (receiptType === 'order' || receiptType === 'both') receipts += buildReceipt('order');

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Nota ${getDisplayOrderId(order)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; width: ${rs.width}mm; margin: 0 auto; padding: 12px; background: #fff; font-size: ${baseFontSize}px; font-weight: ${fw}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          body { width: ${rs.width}mm; padding: 4mm; }
          @page { size: ${rs.width}mm auto; margin: 0; }
          div[style*='page-break-after: always'] { page-break-after: always; }
        }
      </style></head><body>${receipts}
      <script>window.onload = function() { window.print(); }</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  // OrderCard moved out of component to prevent re-mounts

  // Kanban uses todayOrders, list uses all orders
  const kanbanOrders = todayOrders;

  return (
    <div className="flex gap-6 items-start">
      <div className="flex-1 w-full min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Pedidos</h1>
            <p className="text-sm text-gray-500 mt-1">{kanbanOrders.filter(o => o.status !== "Entregue" && o.status !== "Recusado").length} pedidos ativos hoje</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode("kanban")} className={`p-2 rounded-lg transition ${viewMode === 'kanban' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}><List size={18} /></button>
          </div>
        </div>

        {/* Pending Past Orders Banner */}
        {pendingPastOrders.length > 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800">⚠ {pendingPastOrders.length} pedido(s) de dias anteriores ainda não foram concluídos!</p>
              <p className="text-xs text-amber-600 mt-0.5">Resolva esses pedidos (Entregue, Cancelado ou Recusado) para limpar a esteira.</p>
            </div>
            <div className="flex gap-1 flex-shrink-0 flex-wrap">
              {pendingPastOrders.slice(0, 5).map(o => (
                <button key={o.id} onClick={() => setSelected(o)}
                  className="px-2 py-1 bg-amber-200 text-amber-900 rounded-lg text-xs font-bold hover:bg-amber-300 transition">
                  {getDisplayOrderId(o)}
                </button>
              ))}
              {pendingPastOrders.length > 5 && <span className="text-xs text-amber-700 self-center">+{pendingPastOrders.length - 5}</span>}
            </div>
          </div>
        )}

        {viewMode === "kanban" ? (
          <div className="grid grid-cols-6 gap-3 pb-4" style={{ minHeight: 500 }}>
            {STATUS_FLOW.map(status => {
              const sc = STATUS_COLORS[status];
              const filtered = kanbanOrders.filter(o => o.status === status);
              return (
                <div key={status} className="min-w-0">
                  <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${sc.bg}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${sc.dot} flex-shrink-0`} />
                    <span className={`font-semibold text-sm ${sc.text} truncate`}>{status}</span>
                    <span className={`ml-auto text-xs font-bold ${sc.text} flex-shrink-0`}>{filtered.length}</span>
                  </div>
                  <div className="space-y-3">
                    {filtered.map(o => <OrderCard key={o.id} order={o} setSelected={setSelected} moveOrder={moveOrder} getTotal={getTotal} />)}
                    {filtered.length === 0 && (
                      <div className="text-center py-8 text-gray-300 text-sm">Nenhum pedido</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-600">Pedido</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Cliente</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Itens</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Total</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Ação</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const sc = STATUS_COLORS[o.status] || STATUS_COLORS["Novo"];
                  const nextIdx = STATUS_FLOW.indexOf(o.status);
                  const nextStatus = nextIdx >= 0 && nextIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[nextIdx + 1] : null;
                  return (
                    <tr key={o.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(o)}>
                      <td className="p-3 font-bold text-gray-900">{getDisplayOrderId(o)}</td>
                      <td className="p-3">{o.customer}</td>
                      <td className="p-3 text-gray-500">{o.items.length} itens</td>
                      <td className="p-3 font-bold">R$ {getTotal(o).toFixed(2)}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>{o.status}</span></td>
                      <td className="p-3">
                        {nextStatus && <button onClick={e => { e.stopPropagation(); moveOrder(o.id, nextStatus); }} className="text-xs bg-gray-900 text-white px-3 py-1 rounded-lg">→ {nextStatus}</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Split View - Order Details */}
      {selected && !showReceipt && (
        <div className="w-[340px] flex-shrink-0 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 max-h-[calc(100vh-48px)] overflow-y-auto sticky top-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Pedido {getDisplayOrderId(selected)}</h2>
            <button onClick={() => { setSelected(null); setShowRefuseArea(false); }} className="p-2 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"><X size={18} /></button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Cliente</p>
                <p className="font-semibold">{selected.customer}</p>
                <p className="text-sm text-gray-500">{selected.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Endereço</p>
                <p className="text-sm">{selected.address}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Pagamento</p>
                <p className="text-sm font-medium">{selected.payment}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Horário</p>
                <p className="text-sm">{selected.time} - {selected.date}</p>
              </div>
            </div>
            {selected.note && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-600 font-semibold">Observação</p>
                <p className="text-sm text-amber-800">{selected.note}</p>
              </div>
            )}
            {selected.refuseReason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs text-red-600 font-semibold">Motivo da Recusa</p>
                <p className="text-sm text-red-800">{selected.refuseReason}</p>
              </div>
            )}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Itens</p>
              {selected.items.map((item, i) => (
                <div key={i} className="flex justify-between py-1.5 text-sm">
                  <span>{item.qty}x {item.name}</span>
                  <span className="font-medium">R$ ${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1.5 text-sm text-gray-500 border-t border-gray-200 mt-2">
                <span>Taxa de entrega</span>
                <span>R$ {selected.deliveryFee?.toFixed(2) || "0.00"}</span>
              </div>
              {selected.discountGiven > 0 && (
                <div className="flex justify-between py-1.5 text-sm text-emerald-600">
                  <span>Descontos (Tier/Cupom)</span>
                  <span>- R$ {(selected.discountGiven).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 font-bold text-lg border-t border-gray-200 mt-1">
                <span>Total</span>
                <span>R$ {getTotal(selected).toFixed(2)}</span>
              </div>
            </div>

            {/* Status buttons */}
            <div className="flex gap-2 flex-wrap">
              {STATUS_FLOW.map(s => {
                const sc = STATUS_COLORS[s];
                return (
                  <button key={s} onClick={() => { moveOrder(selected.id, s); setSelected({ ...selected, status: s }); setShowRefuseArea(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selected.status === s ? `${sc.bg} ${sc.text} ring-2 ring-offset-1 ring-current` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {s}
                  </button>
                );
              })}
              <button onClick={() => setShowRefuseArea(!showRefuseArea)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${showRefuseArea || selected.status === "Recusado" ? 'bg-red-100 text-red-700 ring-2 ring-offset-1 ring-red-300' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                Recusado
              </button>
            </div>

            {showRefuseArea && selected.status !== "Recusado" && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 mt-2 space-y-3">
                <label className="text-xs font-semibold text-red-700 block">Motivo da Recusa</label>
                <textarea className="w-full text-sm p-3 rounded-lg border border-red-200 bg-white" rows="2" placeholder="Ex: Item em falta, área de risco..."
                  value={refuseReason} onChange={e => setRefuseReason(e.target.value)} />
                <button onClick={() => {
                  if (!refuseReason.trim()) return alert("Digite um motivo.");
                  // Custom update logic here just for refuse reason
                  updateDoc(doc(db, "orders", selected.id), { status: "Recusado", refuseReason: refuseReason.trim() })
                    .then(() => {
                      setSelected({ ...selected, status: "Recusado", refuseReason: refuseReason.trim() });
                      setShowRefuseArea(false);
                      setRefuseReason("");
                    });
                }} className="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">Confirmar Recusa</button>
              </div>
            )}

            {/* Receipt Actions */}
            <div className="border-t border-gray-100 pt-4 mt-6">
              <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  checked={receiptType === "both"}
                  onChange={e => setReceiptType(e.target.checked ? "both" : "order")} />
                <span className="text-xs font-medium text-gray-600">Imprimir 2 Vias (Cozinha + Pedido)</span>
              </label>
              <div className="flex gap-2">
                <button onClick={() => setShowReceipt(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                  <FileText size={16} /> Preview da Nota
                </button>
                <button onClick={() => { setShowReceipt(false); handlePrint(); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition">
                  <Printer size={16} /> Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      <Modal isOpen={showReceipt && !!selected} onClose={() => setShowReceipt(false)} title="Preview da Nota" wide>
        {selected && (
          <div className="space-y-4">
            {/* Via Selector */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Selecione as vias para impressão</p>
              <div className="flex gap-2">
                {[
                  { key: "both", label: "2 Vias (Cozinha + Pedido)", icon: Copy },
                  { key: "kitchen", label: "Via da Cozinha", icon: ChefHat },
                  { key: "order", label: "Via do Pedido", icon: FileText },
                ].map(opt => (
                  <button key={opt.key} onClick={() => setReceiptType(opt.key)}
                    className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium transition border ${receiptType === opt.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    <opt.icon size={18} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Receipt Appearance Editor */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setShowReceiptEditor(!showReceiptEditor)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-sm font-semibold text-gray-700">
                <span className="flex items-center gap-2"><Settings size={16} /> Configurar Aparência da Nota</span>
                <ChevronRight size={16} className={`transition-transform ${showReceiptEditor ? 'rotate-90' : ''}`} />
              </button>
              {showReceiptEditor && (
                <div className="p-4 border-t border-gray-200 space-y-4 bg-white">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Largura (mm)</label>
                      <input type="number" min="40" max="120" step="1"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        value={receiptSettings.width}
                        onChange={e => setReceiptSettings(p => ({ ...p, width: parseInt(e.target.value) || 80 }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Fonte (px)</label>
                      <input type="number" min="8" max="20" step="1"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        value={receiptSettings.fontSize}
                        onChange={e => setReceiptSettings(p => ({ ...p, fontSize: parseInt(e.target.value) || 12 }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Peso da Fonte</label>
                      <select
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        value={receiptSettings.fontWeight}
                        onChange={e => setReceiptSettings(p => ({ ...p, fontWeight: parseInt(e.target.value) }))}>
                        <option value={400}>Normal (400)</option>
                        <option value={500}>Médio (500)</option>
                        <option value={600}>Semi-Bold (600)</option>
                        <option value={700}>Bold (700)</option>
                        <option value={800}>Extra-Bold (800)</option>
                        <option value={900}>Black (900)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        checked={receiptSettings.showLogo}
                        onChange={e => setReceiptSettings(p => ({ ...p, showLogo: e.target.checked }))} />
                      <span className="text-sm text-gray-700">Mostrar Logo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        checked={receiptSettings.showAddress}
                        onChange={e => setReceiptSettings(p => ({ ...p, showAddress: e.target.checked }))} />
                      <span className="text-sm text-gray-700">Mostrar Endereço da Loja</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Receipts */}
            <div className={`${receiptType === 'both' ? 'grid grid-cols-2 gap-3' : 'flex justify-center'}`}>
              {(receiptType === "kitchen" || receiptType === "both") && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm" style={{ fontFamily: "'Courier New', monospace", maxWidth: 280, width: '100%', fontSize: `${receiptSettings.fontSize}px` }}>
                  <div className="text-center border-b-2 border-dashed border-gray-300 pb-3 mb-3">
                    {receiptSettings.showLogo && <div className="text-lg">🛸</div>}
                    <div className="font-black tracking-wider" style={{ fontSize: `${receiptSettings.fontSize + 2}px` }}>UFO BURGUERS</div>
                    <div className="mt-1.5 inline-block bg-gray-900 text-white font-bold px-3 py-0.5 rounded tracking-widest" style={{ fontSize: `${receiptSettings.fontSize - 2}px` }}>COZINHA</div>
                  </div>
                  <div className="space-y-0.5 mb-3" style={{ fontSize: `${receiptSettings.fontSize - 1}px` }}>
                    <div className="flex justify-between"><span className="font-bold">Pedido</span><span className="font-bold">{getDisplayOrderId(selected)}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Data</span><span>{selected.date} {selected.time}</span></div>
                  </div>
                  <div className="border-t border-dashed border-gray-300 pt-2 mb-2">
                    <p className="font-bold uppercase tracking-widest text-gray-500 mb-1.5" style={{ fontSize: `${receiptSettings.fontSize - 2}px` }}>Itens</p>
                    {selected.items.map((item, i) => {
                      const comps = item.selectedComplements ? Object.values(item.selectedComplements).flat().map(o => o?.name || o).filter(Boolean).join(', ') : '';
                      const obs = item.observation || '';
                      return (
                        <div key={i} className="py-1 border-b border-gray-100 last:border-0">
                          <div className="font-bold" style={{ fontSize: `${receiptSettings.fontSize}px` }}>{item.qty}x {item.name}</div>
                          {comps && <div className="text-gray-500 pl-3" style={{ fontSize: `${receiptSettings.fontSize - 2}px` }}>↳ {comps}</div>}
                          {obs && <div className="text-red-500 pl-3" style={{ fontSize: `${receiptSettings.fontSize - 2}px` }}>✏ {obs}</div>}
                        </div>
                      );
                    })}
                  </div>
                  {selected.note && (
                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-2 mt-2">
                      <p className="font-bold text-amber-700" style={{ fontSize: `${receiptSettings.fontSize - 2}px` }}>⚠ OBSERVAÇÃO</p>
                      <p className="font-bold text-amber-900 mt-0.5" style={{ fontSize: `${receiptSettings.fontSize}px` }}>{selected.note}</p>
                    </div>
                  )}
                  <div className="text-center text-gray-400 mt-3 pt-2 border-t border-dashed border-gray-300" style={{ fontSize: `${receiptSettings.fontSize - 3}px` }}>
                    VIA DA COZINHA
                  </div>
                </div>
              )}

              {(receiptType === "order" || receiptType === "both") && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm" style={{ fontFamily: "'Courier New', monospace", maxWidth: 280, width: '100%', fontSize: `${receiptSettings.fontSize}px` }}>
                  <div className="text-center border-b-2 border-dashed border-gray-300 pb-3 mb-3">
                    {receiptSettings.showLogo && <div className="text-lg">🛸</div>}
                    <div className="font-black tracking-wider" style={{ fontSize: `${receiptSettings.fontSize + 2}px` }}>UFO BURGUERS</div>
                    {receiptSettings.showAddress && <div className="text-gray-500" style={{ fontSize: `${receiptSettings.fontSize - 3}px` }}>Rua Dias Macêdo - Fortaleza/CE</div>}
                    <div className="mt-1.5 inline-block bg-gray-900 text-white font-bold px-3 py-0.5 rounded tracking-widest" style={{ fontSize: `${receiptSettings.fontSize - 2}px` }}>PEDIDO</div>
                  </div>
                  <div className="space-y-0.5 mb-3" style={{ fontSize: `${receiptSettings.fontSize - 1}px` }}>
                    <div className="flex justify-between"><span className="font-bold">Pedido</span><span className="font-bold">{getDisplayOrderId(selected)}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Data</span><span>{selected.date} {selected.time}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Cliente</span><span>{selected.customer}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Tel</span><span>{selected.phone}</span></div>
                    <div className="flex justify-between text-gray-500"><span>End.</span><span className="text-right max-w-[140px]">{selected.address}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Pgto.</span><span className="font-bold text-gray-900">{selected.payment}</span></div>
                  </div>
                  <div className="border-t border-dashed border-gray-300 pt-2 mb-2">
                    <p className="font-bold uppercase tracking-widest text-gray-500 mb-1.5" style={{ fontSize: `${receiptSettings.fontSize - 2}px` }}>Itens</p>
                    {selected.items.map((item, i) => {
                      const comps = item.selectedComplements ? Object.values(item.selectedComplements).flat().map(o => o?.name || o).filter(Boolean).join(', ') : '';
                      const obs = item.observation || '';
                      return (
                        <div key={i} className="py-1 border-b border-gray-100 last:border-0">
                          <div className="flex justify-between" style={{ fontSize: `${receiptSettings.fontSize - 1}px` }}>
                            <span>{item.qty}x {item.name}</span>
                            <span className="font-medium">R$ {(item.price * item.qty).toFixed(2)}</span>
                          </div>
                          {comps && <div className="text-gray-500 pl-3" style={{ fontSize: `${receiptSettings.fontSize - 2}px` }}>↳ {comps}</div>}
                          {obs && <div className="text-red-500 pl-3" style={{ fontSize: `${receiptSettings.fontSize - 2}px` }}>✏ {obs}</div>}
                        </div>
                      );
                    })}
                  </div>
                  {selected.note && (
                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-2 mt-2 mb-2">
                      <p className="font-bold text-amber-700" style={{ fontSize: `${receiptSettings.fontSize - 2}px` }}>⚠ OBSERVAÇÃO</p>
                      <p className="text-amber-900 mt-0.5" style={{ fontSize: `${receiptSettings.fontSize - 1}px` }}>{selected.note}</p>
                    </div>
                  )}
                  <div className="border-t border-dashed border-gray-300 pt-2 space-y-0.5" style={{ fontSize: `${receiptSettings.fontSize - 1}px` }}>
                    <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>R$ {(getTotal(selected) - selected.deliveryFee).toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Entrega</span><span>R$ {selected.deliveryFee.toFixed(2)}</span></div>
                    <div className="flex justify-between font-black border-t-2 border-gray-900 mt-1.5 pt-1.5" style={{ fontSize: `${receiptSettings.fontSize + 4}px` }}>
                      <span>TOTAL</span><span>R$ {getTotal(selected).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-center text-gray-400 mt-3 pt-2 border-t border-dashed border-gray-300" style={{ fontSize: `${receiptSettings.fontSize - 3}px` }}>
                    VIA DO CLIENTE
                  </div>
                </div>
              )}
            </div>

            {/* Print button */}
            <button onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition">
              <Printer size={18} /> Imprimir {receiptType === "both" ? "2 Vias" : receiptType === "kitchen" ? "Via Cozinha" : "Via Pedido"}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

// --- Caixa (POS) ---
const INITIAL_CAIXA_STATE = { isOpen: false, currentCash: 0, events: [] };

// eslint-disable-next-line no-unused-vars
const Caixa = ({ orders, setOrders, menu, caixa, setCaixa }) => {
  const [openingCash, setOpeningCash] = useState("");
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [flowType, setFlowType] = useState("Sangria"); // "Sangria" ou "Suprimento"
  const [flowAmount, setFlowAmount] = useState("");
  const [flowNote, setFlowNote] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // POS Order State
  const [posCart, setPosCart] = useState([]);
  const [posPayment, setPosPayment] = useState("Cartão");

  const addEvent = (type, amount, method, note = "") => {
    const newEvent = { id: Date.now().toString(), type, amount, method, note, timestamp: new Date().toISOString() };
    let newCash = caixa.currentCash;
    if (method === "Dinheiro") {
      if (type === "Abertura" || type === "Suprimento" || type === "Venda") newCash += amount;
      if (type === "Sangria") newCash -= amount;
    }
    setCaixa({ ...caixa, currentCash: newCash, events: [newEvent, ...(caixa.events || [])] });
  };

  const handleOpen = () => {
    const amt = parseFloat(openingCash) || 0;
    setCaixa({ isOpen: true, currentCash: amt, events: [{ id: Date.now().toString(), type: 'Abertura', amount: amt, method: 'Dinheiro', timestamp: new Date().toISOString() }] });
  };

  const handleFlow = () => {
    const amt = parseFloat(flowAmount);
    if (!amt || amt <= 0) return;
    addEvent(flowType, amt, "Dinheiro", flowNote);
    setShowFlowModal(false); setFlowAmount(""); setFlowNote("");
  };

  const handlePosCheckout = () => {
    if (posCart.length === 0) return;
    const total = posCart.reduce((s, i) => s + i.price * i.qty, 0);
    const newOrder = {
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      customer: "Cliente Balcão", phone: "-", address: "Retirada Local",
      items: posCart, deliveryFee: 0, payment: posPayment, status: "Entregue",
      date: new Date().toLocaleDateString('pt-BR'), time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setOrders(prev => [newOrder, ...prev]);
    addEvent("Venda", total, posPayment, `Pedido Balcão`);
    setShowOrderModal(false); setPosCart([]); setPosPayment("Cartão");
  };

  const handleClose = () => {
    setCaixa({ isOpen: false, currentCash: 0, events: [] });
    setShowCloseModal(false);
  };

  const formatTime = (ts) => {
    try {
      if (!ts) return '--:--';
      if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch { return '--:--'; }
  };

  if (!caixa.isOpen) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center max-w-lg mx-auto mt-10">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-sm">
          <CreditCard size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Caixa Fechado</h2>
        <p className="text-gray-500 mb-8 max-w-sm">Para iniciar as vendas e as operações no painel, você precisa abrir o caixa do dia.</p>

        <div className="w-full space-y-4 text-left">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Fundo de Troco Inicial (R$)</label>
            <input type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-medium focus:ring-2 focus:ring-gray-900 focus:bg-white transition outline-none"
              placeholder="0.00" value={openingCash} onChange={e => setOpeningCash(e.target.value)} />
          </div>
          <button onClick={handleOpen} className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold shadow-md hover:bg-gray-800 transition active:scale-[0.98]">
            Abrir Caixa Agora
          </button>
        </div>
      </div>
    );
  }

  // Caixa Summary Math
  const totalPix = caixa.events.filter(e => e.type === "Venda" && e.method === "PIX").reduce((s, e) => s + e.amount, 0);
  const totalCard = caixa.events.filter(e => e.type === "Venda" && e.method === "Cartão").reduce((s, e) => s + e.amount, 0);
  const totalCashSales = caixa.events.filter(e => e.type === "Venda" && e.method === "Dinheiro").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">Caixa <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded uppercase tracking-widest">Aberto</span></h1>
          <p className="text-sm text-gray-500">Gestão de gaveta e PDV rápido</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowOrderModal(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-700 transition flex items-center gap-2"><Plus size={16} /> Nova Venda</button>
          <button onClick={() => { setFlowType("Sangria"); setShowFlowModal(true); }} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition">Sangria</button>
          <button onClick={() => { setFlowType("Suprimento"); setShowFlowModal(true); }} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition">Suprimento</button>
          <button onClick={() => setShowCloseModal(true)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition">Fechar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Saldo em Gaveta" value={`R$ ${caixa.currentCash.toFixed(2)}`} color="text-gray-900" bg="bg-white" />
        <StatCard icon={Zap} label="Vendas PIX" value={`R$ ${totalPix.toFixed(2)}`} color="text-violet-600" bg="bg-white" />
        <StatCard icon={CreditCard} label="Vendas Cartão" value={`R$ ${totalCard.toFixed(2)}`} color="text-sky-600" bg="bg-white" />
        <StatCard icon={ShoppingCart} label="Vendas Dinheiro" value={`R$ ${totalCashSales.toFixed(2)}`} color="text-emerald-600" bg="bg-white" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Clock size={18} className="text-gray-400" />
          <h3 className="font-bold text-gray-900">Histórico de Movimentações</h3>
        </div>
        {(!caixa.events || caixa.events.length === 0) ? (
          <div className="p-8 text-center text-gray-500 text-sm">Nenhuma movimentação registrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="text-left p-4 font-bold border-b border-gray-100">Horário</th>
                <th className="text-left p-4 font-bold border-b border-gray-100">Tipo</th>
                <th className="text-left p-4 font-bold border-b border-gray-100">Método</th>
                <th className="text-left p-4 font-bold border-b border-gray-100">Obs / Ref</th>
                <th className="text-right p-4 font-bold border-b border-gray-100">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {caixa.events.map(e => (
                <tr key={e.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 text-gray-500">{formatTime(e.timestamp)}</td>
                  <td className="p-4 font-medium flex items-center gap-2">
                    {e.type === 'Abertura' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    {e.type === 'Venda' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    {e.type === 'Sangria' && <span className="w-2 h-2 rounded-full bg-red-500" />}
                    {e.type === 'Suprimento' && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                    {e.type}
                  </td>
                  <td className="p-4 text-gray-600">{e.method}</td>
                  <td className="p-4 text-gray-500 text-xs">{e.note || "-"}</td>
                  <td className={`p-4 font-bold text-right ${e.type === 'Sangria' ? 'text-red-500' : 'text-gray-900'}`}>
                    {e.type === 'Sangria' ? '-' : ''} R$ {(e.amount || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Flow Modal */}
      <Modal isOpen={showFlowModal} onClose={() => setShowFlowModal(false)} title={flowType === "Sangria" ? "Registrar Sangria (Saída)" : "Registrar Suprimento (Entrada)"}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{flowType === "Sangria" ? "Retirada de dinheiro físico da gaveta do caixa." : "Adição de dinheiro físico na gaveta para troco."}</p>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Valor (R$)</label>
            <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={flowAmount} onChange={e => setFlowAmount(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Motivo / Observação</label>
            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={flowNote} onChange={e => setFlowNote(e.target.value)} placeholder="Ex: Pagamento de fornecedor" />
          </div>
          <button onClick={handleFlow} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold">Confirmar {flowType}</button>
        </div>
      </Modal>

      {/* POS Modal (Nova Venda) */}
      <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} title="Nova Venda (Balcão)" wide>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Menu list */}
          <div className="border-r border-gray-100 pr-6 overflow-y-auto max-h-[60vh] space-y-2">
            <div className="sticky top-0 bg-white pb-3 pt-1 z-10"><input placeholder="Buscar produto..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div>
            {menu.filter(i => i.active).map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                onClick={() => setPosCart(p => p.find(c => c.id === item.id) ? p.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c) : [...p, { ...item, qty: 1 }])}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">{item.image}</div>
                  <div><p className="font-bold text-sm text-gray-900">{item.name}</p><p className="text-xs text-gray-500">R$ {item.price.toFixed(2)}</p></div>
                </div>
                <Plus size={18} className="text-emerald-500" />
              </div>
            ))}
          </div>
          {/* Cart side */}
          <div className="flex flex-col h-[60vh]">
            <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Resumo do Pedido</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {posCart.length === 0 ? <p className="text-sm text-gray-400 text-center py-10">Nenhum item adicionado.</p> : posCart.map(c => (
                <div key={c.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-bold text-sm">{c.name}</p>
                    <p className="text-xs text-gray-500">R$ {c.price.toFixed(2)} x {c.qty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">R$ {(c.price * c.qty).toFixed(2)}</p>
                    <button onClick={() => setPosCart(p => p.filter(i => i.id !== c.id))} className="w-7 h-7 bg-white border border-red-200 text-red-500 rounded flex items-center justify-center hover:bg-red-50"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-gray-100 mt-4">
              <div className="flex gap-2 mb-4">
                {["Dinheiro", "PIX", "Cartão"].map(p => (
                  <button key={p} onClick={() => setPosPayment(p)} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${posPayment === p ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}>{p}</button>
                ))}
              </div>
              <div className="flex justify-between items-end mb-4">
                <span className="text-gray-500 font-medium">Total a Pagar</span>
                <span className="text-2xl font-black text-emerald-600">R$ {posCart.reduce((s, c) => s + c.price * c.qty, 0).toFixed(2)}</span>
              </div>
              <button onClick={handlePosCheckout} disabled={posCart.length === 0} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50 transition">
                Concluir Venda e Imprimir
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Close Modal */}
      <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} title="Fechamento de Caixa">
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3 text-sm">Resumo da Movimentação</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between"><span>Vendas em PIX</span><span>R$ {totalPix.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Vendas em Cartão</span><span>R$ {totalCard.toFixed(2)}</span></div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900"><span>Saldo em Gaveta (Físico)</span><span>R$ {caixa.currentCash.toFixed(2)}</span></div>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed text-center">Ao fechar o caixa, ele será bloqueado para novas operações até a próxima abertura. Todas as vendas continuarão salvas no histórico geral.</p>
          <button onClick={handleClose} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition">Confirmo, Fechar Caixa</button>
        </div>
      </Modal>
    </div>
  );
};

// --- Dashboard ---
const Dashboard = ({ orders, customers }) => {
  const [dateRange, setDateRange] = useState('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start, end = new Date(today.getTime() + 86400000 - 1);

    switch (dateRange) {
      case 'today':
        start = today;
        break;
      case '7d':
        start = new Date(today.getTime() - 6 * 86400000);
        break;
      case '30d':
        start = new Date(today.getTime() - 29 * 86400000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        start = startDate ? new Date(startDate + 'T00:00:00') : new Date(today.getTime() - 29 * 86400000);
        end = endDate ? new Date(endDate + 'T23:59:59') : end;
        break;
      default:
        start = new Date(today.getTime() - 6 * 86400000);
    }
    return { start, end };
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();

  const parseOrderDate = (o) => {
    if (o.date) {
      const parts = o.date.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return new Date(o.date);
    }
    return new Date();
  };

  const filteredOrders = orders.filter(o => {
    const d = parseOrderDate(o);
    return d >= rangeStart && d <= rangeEnd;
  });

  // Previous period for comparison
  const periodLen = rangeEnd.getTime() - rangeStart.getTime();
  const prevStart = new Date(rangeStart.getTime() - periodLen - 86400000);
  const prevEnd = new Date(rangeStart.getTime() - 1);
  const prevOrders = orders.filter(o => {
    const d = parseOrderDate(o);
    return d >= prevStart && d <= prevEnd;
  });

  const getTotal = (o) => o.items.reduce((s, i) => s + i.price * i.qty, 0) + (o.deliveryFee || 0);
  const revenue = filteredOrders.reduce((s, o) => s + getTotal(o), 0);
  const prevRevenue = prevOrders.reduce((s, o) => s + getTotal(o), 0);
  const avgTicket = filteredOrders.length ? revenue / filteredOrders.length : 0;
  const prevAvgTicket = prevOrders.length ? prevRevenue / prevOrders.length : 0;

  const pctChange = (curr, prev) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

  // Top items
  const topItems = {};
  filteredOrders.forEach(o => o.items.forEach(i => { topItems[i.name] = (topItems[i.name] || 0) + i.qty; }));
  const sortedItems = Object.entries(topItems).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxQty = sortedItems[0]?.[1] || 1;

  // Revenue by day (bar chart)
  const revenueByDay = {};
  filteredOrders.forEach(o => {
    const d = parseOrderDate(o);
    const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    revenueByDay[key] = (revenueByDay[key] || 0) + getTotal(o);
  });
  const dayEntries = Object.entries(revenueByDay);
  const maxDayRev = Math.max(...dayEntries.map(d => d[1]), 1);

  // Payment methods
  const paymentMethods = {};
  filteredOrders.forEach(o => {
    const method = o.payment || 'Não informado';
    paymentMethods[method] = (paymentMethods[method] || 0) + 1;
  });
  const paymentEntries = Object.entries(paymentMethods).sort((a, b) => b[1] - a[1]);
  const paymentColors = { 'PIX': 'bg-emerald-500', 'Dinheiro': 'bg-amber-500', 'Cartão (Entrega)': 'bg-sky-500', 'Cartão (App)': 'bg-violet-500', 'Não informado': 'bg-gray-400' };

  // Delivery vs others
  const deliveryCount = filteredOrders.filter(o => (o.type || '').toLowerCase().includes('delivery') || o.deliveryFee > 0).length;
  const pickupCount = filteredOrders.length - deliveryCount;

  // Hourly distribution
  const hourly = new Array(24).fill(0);
  filteredOrders.forEach(o => {
    if (o.time) {
      const h = parseInt(o.time.split(':')[0]);
      if (!isNaN(h)) hourly[h]++;
    }
  });
  const maxHourly = Math.max(...hourly, 1);
  const peakHour = hourly.indexOf(Math.max(...hourly));

  // Completed orders
  const completedOrders = filteredOrders.filter(o => o.status === 'Entregue');
  const completedRevenue = completedOrders.reduce((s, o) => s + getTotal(o), 0);
  const cancelledOrders = filteredOrders.filter(o => o.status === 'Recusado');

  const PRESETS = [
    { key: 'today', label: 'Hoje' },
    { key: '7d', label: '7 dias' },
    { key: '30d', label: '30 dias' },
    { key: 'month', label: 'Mês Atual' },
    { key: 'custom', label: 'Personalizado' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Visão geral do seu negócio</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <Calendar size={16} className="text-gray-500" />
            Período:
          </div>
          <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
            {PRESETS.map(p => (
              <button key={p.key} onClick={() => setDateRange(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${dateRange === p.key ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                {p.label}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:ring-2 focus:ring-gray-900 outline-none" />
              <span className="text-xs text-gray-400">até</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:ring-2 focus:ring-gray-900 outline-none" />
            </div>
          )}
          <span className="ml-auto text-xs text-gray-400">
            {filteredOrders.length} pedidos no período
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50"><DollarSign size={20} className="text-emerald-600" /></div>
            {pctChange(revenue, prevRevenue) !== 0 && <span className={`text-xs font-medium ${pctChange(revenue, prevRevenue) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{pctChange(revenue, prevRevenue) > 0 ? '+' : ''}{pctChange(revenue, prevRevenue)}%</span>}
          </div>
          <p className="text-2xl font-bold text-gray-900">R$ {revenue.toFixed(0)}</p>
          <p className="text-sm text-gray-500 mt-1">Faturamento</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-50"><ShoppingBag size={20} className="text-sky-600" /></div>
            {pctChange(filteredOrders.length, prevOrders.length) !== 0 && <span className={`text-xs font-medium ${pctChange(filteredOrders.length, prevOrders.length) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{pctChange(filteredOrders.length, prevOrders.length) > 0 ? '+' : ''}{pctChange(filteredOrders.length, prevOrders.length)}%</span>}
          </div>
          <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
          <p className="text-sm text-gray-500 mt-1">Pedidos</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50"><Target size={20} className="text-violet-600" /></div>
            {pctChange(avgTicket, prevAvgTicket) !== 0 && <span className={`text-xs font-medium ${pctChange(avgTicket, prevAvgTicket) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{pctChange(avgTicket, prevAvgTicket) > 0 ? '+' : ''}{pctChange(avgTicket, prevAvgTicket)}%</span>}
          </div>
          <p className="text-2xl font-bold text-gray-900">R$ {avgTicket.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">Ticket Médio</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50"><Users size={20} className="text-amber-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
          <p className="text-sm text-gray-500 mt-1">Clientes Cadastrados</p>
        </div>
      </div>

      {/* Revenue Chart + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue by Day Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Faturamento por Dia</h3>
          {dayEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Nenhum dado no período selecionado</div>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {dayEntries.map(([day, rev]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-8 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                    R$ {rev.toFixed(0)}
                  </div>
                  <div className="w-full bg-gradient-to-t from-gray-800 to-gray-600 rounded-t-md transition-all hover:from-gray-700 hover:to-gray-500 cursor-pointer"
                    style={{ height: `${Math.max((rev / maxDayRev) * 100, 4)}%`, minHeight: '4px' }} />
                  <span className="text-[9px] text-gray-400 font-medium">{day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h3 className="font-bold text-gray-900">Resumo Rápido</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Entregues</span>
              <span className="text-sm font-bold text-emerald-600">{completedOrders.length} pedidos</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Receita Confirmada</span>
              <span className="text-sm font-bold text-emerald-600">R$ {completedRevenue.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Recusados</span>
              <span className="text-sm font-bold text-red-500">{cancelledOrders.length} pedidos</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Delivery</span>
              <span className="text-sm font-bold">{deliveryCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Retirada</span>
              <span className="text-sm font-bold">{pickupCount}</span>
            </div>
            {peakHour >= 0 && filteredOrders.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 text-sm">
                  <Flame size={14} className="text-orange-500" />
                  <span className="text-gray-500">Horário de Pico:</span>
                  <span className="font-bold text-gray-900">{String(peakHour).padStart(2, '0')}:00</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Itens Mais Vendidos</h3>
          {sortedItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sem dados no período</p>
          ) : (
            <div className="space-y-3">
              {sortedItems.map(([name, qty], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{name}</span>
                      <span className="text-sm text-gray-500">{qty} vendas</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-gray-800 to-gray-600 transition-all" style={{ width: `${(qty / maxQty) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Formas de Pagamento</h3>
          {paymentEntries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sem dados no período</p>
          ) : (
            <>
              <div className="h-3 rounded-full overflow-hidden flex mb-4">
                {paymentEntries.map(([method, count]) => (
                  <div key={method} className={`${paymentColors[method] || 'bg-gray-400'} transition-all`}
                    style={{ width: `${(count / filteredOrders.length) * 100}%` }}
                    title={`${method}: ${count}`} />
                ))}
              </div>
              <div className="space-y-2">
                {paymentEntries.map(([method, count]) => (
                  <div key={method} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${paymentColors[method] || 'bg-gray-400'}`} />
                    <span className="text-sm flex-1">{method}</span>
                    <span className="text-sm font-bold">{count}</span>
                    <span className="text-xs text-gray-400">{Math.round((count / filteredOrders.length) * 100)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Hourly Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Pedidos por Horário</h3>
          <div className="flex items-end gap-[2px] h-28">
            {hourly.slice(9, 24).map((count, i) => (
              <div key={i + 9} className="flex-1 flex flex-col items-center gap-1 group relative">
                {count > 0 && (
                  <div className="absolute -top-6 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                    {count}
                  </div>
                )}
                <div className={`w-full rounded-t-sm transition-all cursor-pointer ${i + 9 === peakHour ? 'bg-orange-500' : 'bg-gray-300 hover:bg-gray-500'}`}
                  style={{ height: `${count > 0 ? Math.max((count / maxHourly) * 100, 8) : 0}%`, minHeight: count > 0 ? '4px' : '0px' }} />
                <span className="text-[8px] text-gray-400">{i + 9}h</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
            <div className="w-2 h-2 rounded-sm bg-orange-500" /> Horário de pico
            <div className="w-2 h-2 rounded-sm bg-gray-300 ml-2" /> Normal
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Histórico ---
const OrderHistory = ({ orders }) => {
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const filtered = orders.filter(o => o.customer.toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search));
  const getTotal = (o) => o.items.reduce((s, i) => s + i.price * i.qty, 0) + o.deliveryFee;

  const handleDelete = async (orderId) => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
      setDeleteConfirm(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir pedido.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Histórico de Pedidos</h1>
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Buscar por cliente ou número..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="text-left p-3 font-semibold text-gray-600">#</th>
            <th className="text-left p-3 font-semibold text-gray-600">Cliente</th>
            <th className="text-left p-3 font-semibold text-gray-600">Data</th>
            <th className="text-left p-3 font-semibold text-gray-600">Itens</th>
            <th className="text-left p-3 font-semibold text-gray-600">Total</th>
            <th className="text-left p-3 font-semibold text-gray-600">Status</th>
            <th className="text-left p-3 font-semibold text-gray-600">Ações</th>
          </tr></thead>
          <tbody>
            {filtered.map(o => {
              const sc = STATUS_COLORS[o.status];
              return (
                <tr key={o.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="p-3 font-bold">{getDisplayOrderId(o)}</td>
                  <td className="p-3">{o.customer}</td>
                  <td className="p-3 text-gray-500">{o.date} {o.time}</td>
                  <td className="p-3 text-gray-500">{o.items.length} itens</td>
                  <td className="p-3 font-bold">R$ {getTotal(o).toFixed(2)}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>{o.status}</span></td>
                  <td className="p-3">
                    <button onClick={() => setDeleteConfirm(o.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir pedido">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Excluir Pedido">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <p className="text-sm text-gray-600">Tem certeza que deseja <strong>excluir permanentemente</strong> este pedido do histórico? Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition">Cancelar</button>
            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition">Excluir</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- Minha Empresa ---
const MyCompany = ({ company, setCompany }) => {
  const [form, setForm] = useState(company);
  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Minha Empresa</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-8">
        {/* Header Preview */}
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-4xl shadow-sm overflow-hidden flex-shrink-0">
            {form.logoImage ? <img src={form.logoImage} className="w-full h-full object-cover" /> : form.logo}
          </div>
          <div>
            <h2 className="text-xl font-bold">{form.name}</h2>
            <p className="text-sm text-gray-500">{form.description}</p>
          </div>
        </div>

        {/* Images */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Eye size={18} /> Imagens e Identidade</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Banner */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Capa / Banner</p>
              <div className="relative h-40 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 hover:border-gray-400 transition group cursor-pointer">
                {form.banner ? (
                  <>
                    <img src={form.banner} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 bg-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition text-gray-900">Trocar Capa</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Building2 size={32} className="mb-2" />
                    <p className="text-xs font-medium">Clique para enviar a capa</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const r = new FileReader(); r.onload = ev => update("banner", ev.target.result); r.readAsDataURL(file);
                    }
                  }} />
              </div>
            </div>

            {/* Logo */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Perfil da Loja</p>
              <div className="flex items-center gap-6 bg-gray-50 border border-gray-100 p-4 rounded-2xl h-40">
                <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white group flex-shrink-0 border-gray-100">
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-100">
                    {form.logoImage ? <img src={form.logoImage} className="w-full h-full object-cover" /> : form.logo}
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition items-center justify-center flex cursor-pointer">
                    <span className="opacity-0 group-hover:opacity-100 text-white font-bold text-xs"><Edit size={16} /></span>
                  </div>
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const r = new FileReader(); r.onload = ev => update("logoImage", ev.target.result); r.readAsDataURL(file);
                      }
                    }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 mb-1">{form.name}</p>
                  <p className="text-xs text-gray-500 mb-3">Envie uma foto real ou use um emoji legal!</p>
                  <div className="flex gap-2 items-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Emoji:</p>
                    <input className="w-12 px-2 py-1 bg-white border border-gray-200 rounded text-center text-lg shadow-sm" value={form.logo} onChange={e => { update("logo", e.target.value); update("logoImage", null); }} maxLength={2} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Building2 size={18} /> Detalhes do Negócio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Nome", key: "name", icon: Building2 },
              { label: "Slug/URL", key: "slug", icon: Globe },
              { label: "Telefone", key: "phone", icon: Phone },
              { label: "WhatsApp", key: "whatsapp", icon: Phone },
              { label: "Endereço", key: "address", icon: MapPin },
              { label: "Horário", key: "hours", icon: Clock },
            ].map(f => (
              <div key={f.key}>
                <label className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide mb-1.5 font-semibold">
                  <f.icon size={14} /> {f.label}
                </label>
                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition focus:bg-white"
                  value={form[f.key] || ""} onChange={e => update(f.key, e.target.value)} />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide mb-1.5 font-semibold">
                <Edit size={14} /> Descrição / Slogan
              </label>
              <textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition focus:bg-white resize-none"
                rows={2} value={form.description || ""} onChange={e => update("description", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <SaveButton onClick={() => setCompany(form)} label="Salvar Alterações" className="px-6 py-3" />
        </div>
      </div>
    </div>
  );
};

// --- Cupons Promocionais ---
const CouponsManagement = ({ coupons }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const initialForm = { code: '', description: '', type: 'PERCENT', discount: '', minOrder: '', limit: '', active: true, expiresAt: '' };
  const [form, setForm] = useState(initialForm);

  const saveCoupon = async () => {
    if (!form.code || !form.discount) return alert('Preencha código e desconto.');
    try {
      const data = {
        code: form.code.toUpperCase().replace(/\s+/g, '').trim(),
        description: form.description || '',
        type: form.type || 'PERCENT',
        discount: Number(form.discount) || 0,
        minOrder: Number(form.minOrder) || 0,
        limit: Number(form.limit) || 0,
        active: form.active === true || form.active === 'true',
        expiresAt: form.expiresAt || '',
        used: editingCoupon ? (editingCoupon.used || 0) : 0,
      };
      if (editingCoupon) await updateDoc(doc(db, "coupons", editingCoupon.id), data);
      else await addDoc(collection(db, "coupons"), { ...data, createdAt: serverTimestamp() });
      setShowModal(false);
      setEditingCoupon(null);
      setForm(initialForm);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar cupom: ' + e.message);
    }
  };

  const deleteCoupon = async (id) => {
    if (window.confirm('Tem certeza?')) await deleteDoc(doc(db, "coupons", id));
  };

  const toggleActive = async (coupon) => {
    await updateDoc(doc(db, "coupons", coupon.id), { active: !coupon.active });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-gray-900">Cupons Promocionais</h2><p className="text-sm text-gray-500">Crie e gerencie códigos de desconto</p></div>
        <button onClick={() => { setForm(initialForm); setEditingCoupon(null); setShowModal(true); }} className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-gray-800 transition flex items-center gap-2">
          <Plus size={16} /> Novo Cupom
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
              <th className="p-4">Código</th>
              <th className="p-4">Desconto</th>
              <th className="p-4 hidden md:table-cell">Regras</th>
              <th className="p-4 text-center">Uso</th>
              <th className="p-4 hidden md:table-cell">Validade</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {coupons.map((c) => {
              const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
              return (
                <tr key={c.id} className={`hover:bg-gray-50/50 transition ${isExpired ? 'opacity-60' : ''}`}>
                  <td className="p-4 font-bold text-gray-900">
                    <div className="flex items-center gap-2">
                      <Ticket size={16} className="text-emerald-500" />
                      {c.code}
                      {isExpired && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">EXPIRADO</span>}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-semibold text-emerald-600">{c.type === 'PERCENT' ? `${c.discount}%` : `R$ ${Number(c.discount).toFixed(2)}`}</td>
                  <td className="p-4 hidden md:table-cell text-xs text-gray-500">
                    Min: R$ {Number(c.minOrder || 0).toFixed(2)} {c.limit > 0 ? `| Limite: ${c.limit}` : '| Sem limite'}
                  </td>
                  <td className="p-4 text-center text-sm">{c.used || 0}{c.limit > 0 ? ` / ${c.limit}` : ''}</td>
                  <td className="p-4 hidden md:table-cell text-xs text-gray-500">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleActive(c)} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${c.active ? 'bg-emerald-500' : 'bg-gray-200'} transition-colors duration-200 ease-in-out`}>
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${c.active ? 'translate-x-2' : '-translate-x-2'}`} />
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingCoupon(c); setForm({ ...initialForm, ...c, expiresAt: c.expiresAt || '' }); setShowModal(true); }} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100"><Edit size={14} /></button>
                      <button onClick={() => deleteCoupon(c.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {coupons.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-400">Nenhum cupom criado</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">{editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 font-bold mb-1 block">Código</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 uppercase font-mono tracking-widest" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="EX: UFO10" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 font-bold mb-1 block">Descrição (opcional)</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Promoção de verão" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold mb-1 block">Tipo</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="PERCENT">Porcentagem (%)</option>
                    <option value="FIXED">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold mb-1 block">Desconto {form.type === 'PERCENT' ? '(%)' : '(R$)'}</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} placeholder={form.type === 'PERCENT' ? '10' : '15'} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold mb-1 block">Pedido Mín. (R$)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold mb-1 block">Limite de Usos</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} placeholder="0 (Sem Limite)" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 font-bold mb-1 block">Data de Expiração (opcional)</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
                  <p className="text-[10px] text-gray-400 mt-1">Deixe em branco para cupom sem validade</p>
                </div>
                <div className="col-span-2 flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <button type="button" onClick={() => setForm({ ...form, active: !form.active })} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full ${form.active ? 'bg-emerald-500' : 'bg-gray-300'} transition-colors`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${form.active ? 'translate-x-2' : '-translate-x-2'}`} />
                  </button>
                  <span className="text-sm font-semibold text-gray-700">{form.active ? 'Cupom ativo' : 'Cupom inativo'}</span>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50">Cancelar</button>
              <SaveButton onClick={saveCoupon} label="Salvar Cupom" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Fidelidade / Gamificação ---
const LoyaltyManagement = ({ customers, pointsLog, rewards, menu, TIERS, getTier }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);

  // Reward Form State
  const initialRewardForm = { name: '', description: '', cost: '', type: 'CUPOM', itemId: '', icon: '🎫', active: true, photo: null };
  const [rewardForm, setRewardForm] = useState(initialRewardForm);

  // Overview metrics
  const totalEarned = pointsLog.filter(l => l.type !== 'resgate').reduce((sum, l) => sum + (Number(l.points) || 0), 0);
  const totalRedeemed = pointsLog.filter(l => l.type === 'resgate').reduce((sum, l) => sum + Math.abs(Number(l.points) || 0), 0);
  const totalRedemptions = pointsLog.filter(l => l.type === 'resgate').length;
  const activeRewardsCount = rewards.filter(r => r.active).length;

  // Handle Reward Submit
  const saveReward = async () => {
    if (!rewardForm.name || !rewardForm.cost) return alert('Preencha nome e custo.');
    try {
      const data = { ...rewardForm, cost: Number(rewardForm.cost), redemptions: editingReward ? editingReward.redemptions : 0 };
      if (editingReward) await updateDoc(doc(db, "rewards", editingReward.id), data);
      else await addDoc(collection(db, "rewards"), data);
      setShowRewardModal(false);
      setEditingReward(null);
      setRewardForm(initialRewardForm);
    } catch (e) { alert('Erro ao salvar recompensa.'); }
  };

  const toggleRewardActivity = async (reward) => {
    await updateDoc(doc(db, "rewards", reward.id), { active: !reward.active });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><Award className="text-orange-500" /> Fidelidade & Gamificação</h1>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {['overview', 'rewards', 'activities'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'overview' ? 'Visão Geral' : t === 'rewards' ? 'Recompensas' : 'Atividades'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Award} label="Pontos Emitidos" value={totalEarned} color="text-orange-500" />
            <StatCard icon={Gift} label="Pontos Resgatados" value={totalRedeemed} color="text-purple-500" />
            <StatCard icon={CheckCircle2} label="Total de Resgates" value={totalRedemptions} color="text-emerald-500" />
            <StatCard icon={Star} label="Recompensas Ativas" value={activeRewardsCount} color="text-blue-500" />
          </div>

          {/* Tiers distribution */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Clientes por Nível</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {TIERS.map(tier => {
                const count = customers.filter(c => getTier((c.lifetimePoints || 0)).name === tier.name).length;
                return (
                  <div key={tier.name} className={`rounded-xl p-4 ${tier.bg} border border-white/50 relative overflow-hidden`}>
                    <p className={`text-2xl font-black ${tier.color}`}>{tier.name}</p>
                    <p className="text-sm font-medium text-gray-700 mt-1">{count} clientes</p>
                    <Crown size={40} className={`absolute -bottom-2 -right-2 opacity-20 ${tier.color}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setEditingReward(null); setRewardForm(initialRewardForm); setShowRewardModal(true); }}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition">
              <Plus size={16} /> Nova Recompensa
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {rewards.map(r => (
              <div key={r.id} className={`bg-white rounded-2xl p-5 border ${r.active ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'} relative`}>
                <div className="flex justify-between items-start mb-3">
                  {r.photo ? <ProductImage photo={r.photo} size="sm" emoji={r.icon} /> : <span className="text-3xl">{r.icon}</span>}
                  <Badge variant={r.type === 'CUPOM' ? 'warning' : 'info'}>{r.type}</Badge>
                </div>
                <h4 className="font-bold text-gray-900 leading-tight mb-1">{r.name}</h4>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[32px]">{r.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-orange-600 flex items-center gap-1"><Zap size={14} /> {r.cost} pts</span>
                  <span className="text-xs text-gray-400">{r.redemptions || 0} resgates</span>
                </div>
                <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between">
                  <button onClick={() => toggleRewardActivity(r)} className={`text-xs font-semibold ${r.active ? 'text-red-500' : 'text-emerald-500'}`}>{r.active ? 'Desativar' : 'Ativar'}</button>
                  <button onClick={() => { setEditingReward(r); setRewardForm(r); setShowRewardModal(true); }} className="text-gray-400 hover:text-gray-900"><Edit size={16} /></button>
                </div>
              </div>
            ))}
            {rewards.length === 0 && <div className="col-span-full text-center py-10 text-gray-400">Nenhuma recompensa cadastrada.</div>}
          </div>
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-gray-900">Log de Transações</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-4">Data/Hora</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4 text-right">Pontos</th>
                  <th className="p-4 w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {pointsLog.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="p-4">{log.createdAt ? new Date(log.createdAt.seconds * 1000).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '...'}</td>
                    <td className="p-4 font-medium text-gray-900">{log.userName}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {log.type === 'ganho' ? <span className="text-emerald-500">🟢</span> : log.type === 'bonus' ? <span className="text-orange-500">⭐</span> : <span className="text-purple-500">🟣</span>}
                        {log.description}
                      </div>
                    </td>
                    <td className={`p-4 text-right font-bold ${log.points > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{log.points > 0 ? '+' : ''}{log.points}</td>
                    <td className="p-4"><Badge variant={log.status === 'confirmado' ? 'success' : 'warning'}>{log.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pointsLog.length === 0 && <div className="text-center py-10 text-gray-400">Nenhum registro encontrado.</div>}
          </div>
        </div>
      )}

      {/* Reward Modal */}
      <Modal isOpen={showRewardModal} onClose={() => setShowRewardModal(false)} title={editingReward ? "Editar Recompensa" : "Nova Recompensa"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Tipo de Prêmio</label>
              <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold"
                value={rewardForm.type} onChange={e => setRewardForm({ ...rewardForm, type: e.target.value, itemId: '', name: '' })}>
                <option value="CUPOM">Cupom / Vantagem</option>
                <option value="ITEM">Item do Cardápio</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Custo em Pontos</label>
              <input type="number" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-orange-600"
                value={rewardForm.cost} onChange={e => setRewardForm({ ...rewardForm, cost: e.target.value })} placeholder="Ex: 150" />
            </div>
          </div>

          {rewardForm.type === 'ITEM' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Selecione o Item do Cardápio</label>
              <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                value={rewardForm.itemId} onChange={e => {
                  const item = menu.find(i => i.id === e.target.value);
                  setRewardForm({ ...rewardForm, itemId: e.target.value, name: item ? item.name : '', icon: item ? item.emoji : '🍔', photo: item ? item.photo : null });
                }}>
                <option value="">Selecione...</option>
                {menu.filter(i => i.active).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Nome de Exibição</label>
            <input className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              value={rewardForm.name} onChange={e => setRewardForm({ ...rewardForm, name: e.target.value })} placeholder="Ex: Batata Frita Grátis, 15% OFF" />
          </div>

          <div className="grid grid-cols-[80px_1fr] gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Ícone/Emoji</label>
              <input className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-xl"
                value={rewardForm.icon} onChange={e => setRewardForm({ ...rewardForm, icon: e.target.value })} maxLength={2} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Descrição</label>
              <input className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                value={rewardForm.description} onChange={e => setRewardForm({ ...rewardForm, description: e.target.value })} placeholder="Detalhes do prêmio..." />
            </div>
          </div>

          <SaveButton onClick={saveReward} label="Salvar Recompensa" fullWidth className="py-3 mt-6" />
        </div>
      </Modal>
    </div>
  );
};

// --- Controle de Insumos ---
const SUPPLY_CATEGORIES = ["Proteínas", "Laticínios", "Pães", "Vegetais", "Molhos", "Bebidas", "Descartáveis", "Limpeza", "Outros"];
const SUPPLY_UNITS = ["kg", "g", "L", "ml", "un", "pct", "cx", "dz"];

const InventoryManagement = ({ supplies, purchases, usage }) => {
  const [activeTab, setActiveTab] = useState('stock');
  const [showModal, setShowModal] = useState(false);
  const [editingSupply, setEditingSupply] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Supply Form
  const emptySupply = { name: '', category: 'Proteínas', unit: 'kg', currentStock: 0, minStock: 0, active: true };
  const [supplyForm, setSupplyForm] = useState(emptySupply);

  // Purchase Form
  const emptyPurchase = { supplyId: '', supplyName: '', supplier: '', price: '', quantity: '', note: '' };
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchase);

  // Usage Form
  const emptyUsage = { supplyId: '', supplyName: '', quantity: '', note: '' };
  const [usageForm, setUsageForm] = useState(emptyUsage);

  // Period filter for analysis
  const [analysisDays, setAnalysisDays] = useState(30);

  // --- CRUD Supplies ---
  const saveSupply = async () => {
    if (!supplyForm.name.trim()) return alert('Nome é obrigatório.');
    try {
      const data = { ...supplyForm, currentStock: Number(supplyForm.currentStock) || 0, minStock: Number(supplyForm.minStock) || 0 };
      if (editingSupply) await updateDoc(doc(db, "supplies", editingSupply.id), data);
      else await addDoc(collection(db, "supplies"), data);
      setShowModal(false); setEditingSupply(null); setSupplyForm(emptySupply);
    } catch (e) { alert('Erro ao salvar insumo.'); }
  };

  const deleteSupply = async (id) => {
    if (window.confirm('Excluir este insumo permanentemente?')) {
      await deleteDoc(doc(db, "supplies", id));
    }
  };

  // --- Save Purchase ---
  const savePurchase = async () => {
    if (!purchaseForm.supplyId || !purchaseForm.price || !purchaseForm.quantity) return alert('Preencha todos os campos.');
    try {
      const qty = Number(purchaseForm.quantity);
      await addDoc(collection(db, "supply_purchases"), {
        ...purchaseForm, price: Number(purchaseForm.price), quantity: qty, date: serverTimestamp(),
      });
      // Update stock
      const supply = supplies.find(s => s.id === purchaseForm.supplyId);
      if (supply) await updateDoc(doc(db, "supplies", supply.id), { currentStock: (supply.currentStock || 0) + qty });
      setShowPurchaseModal(false); setPurchaseForm(emptyPurchase);
    } catch (e) { alert('Erro ao registrar compra.'); }
  };

  // --- Save Usage ---
  const saveUsage = async () => {
    if (!usageForm.supplyId || !usageForm.quantity) return alert('Preencha insumo e quantidade.');
    try {
      const qty = Number(usageForm.quantity);
      await addDoc(collection(db, "supply_usage"), {
        ...usageForm, quantity: qty, date: serverTimestamp(),
      });
      // Update stock
      const supply = supplies.find(s => s.id === usageForm.supplyId);
      if (supply) await updateDoc(doc(db, "supplies", supply.id), { currentStock: Math.max(0, (supply.currentStock || 0) - qty) });
      setShowUsageModal(false); setUsageForm(emptyUsage);
    } catch (e) { alert('Erro ao registrar uso.'); }
  };

  // --- Analytics helpers ---
  const now = new Date();
  const cutoff = new Date(now.getTime() - analysisDays * 86400000);

  const recentUsage = usage.filter(u => u.date && new Date(u.date.seconds * 1000) >= cutoff);
  const recentPurchases = purchases.filter(p => p.date && new Date(p.date.seconds * 1000) >= cutoff);

  const usageBySupply = {};
  recentUsage.forEach(u => {
    if (!usageBySupply[u.supplyId]) usageBySupply[u.supplyId] = { name: u.supplyName, total: 0, count: 0 };
    usageBySupply[u.supplyId].total += (u.quantity || 0);
    usageBySupply[u.supplyId].count++;
  });

  const spendingTotal = recentPurchases.reduce((s, p) => s + (p.price || 0) * (p.quantity || 0), 0);

  // Stock status
  const getStockStatus = (s) => {
    if (s.currentStock <= 0) return { label: 'Zerado', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
    if (s.minStock > 0 && s.currentStock <= s.minStock) return { label: 'Baixo', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' };
    return { label: 'OK', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
  };

  const lowStockCount = supplies.filter(s => s.active && s.minStock > 0 && s.currentStock <= s.minStock).length;
  const zeroStockCount = supplies.filter(s => s.active && s.currentStock <= 0).length;
  const filteredSupplies = supplies.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  // Price comparison: group purchases by supplyId, then by supplier
  const priceComparison = {};
  purchases.forEach(p => {
    if (!priceComparison[p.supplyId]) priceComparison[p.supplyId] = { name: p.supplyName, suppliers: {} };
    if (!priceComparison[p.supplyId].suppliers[p.supplier]) priceComparison[p.supplyId].suppliers[p.supplier] = [];
    priceComparison[p.supplyId].suppliers[p.supplier].push({ price: p.price, date: p.date });
  });

  const tabs = [
    { key: 'stock', label: 'Estoque', icon: Package },
    { key: 'purchases', label: 'Compras', icon: ShoppingCart },
    { key: 'usage', label: 'Uso Diário', icon: TrendingUp },
    { key: 'analysis', label: 'Análise', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><Package className="text-orange-500" /> Controle de Insumos</h1>
        <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========== TAB: ESTOQUE ========== */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Package} label="Insumos Cadastrados" value={supplies.filter(s => s.active).length} color="text-blue-500" />
            <StatCard icon={CheckCircle2} label="Estoque OK" value={supplies.filter(s => s.active && (s.minStock <= 0 || s.currentStock > s.minStock)).length} color="text-emerald-500" />
            <StatCard icon={AlertCircle} label="Estoque Baixo" value={lowStockCount} color="text-amber-500" />
            <StatCard icon={AlertCircle} label="Zerados" value={zeroStockCount} color="text-red-500" />
          </div>

          {/* Header bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-gray-900 outline-none"
                placeholder="Buscar insumo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => { setEditingSupply(null); setSupplyForm(emptySupply); setShowModal(true); }}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition text-sm">
              <Plus size={16} /> Novo Insumo
            </button>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-4">Insumo</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4 text-center">Estoque</th>
                    <th className="p-4 text-center">Mínimo</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSupplies.filter(s => s.active).map(s => {
                    const status = getStockStatus(s);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-medium text-gray-900">{s.name}</td>
                        <td className="p-4 text-gray-500">{s.category}</td>
                        <td className="p-4 text-center font-bold">{s.currentStock} {s.unit}</td>
                        <td className="p-4 text-center text-gray-400">{s.minStock} {s.unit}</td>
                        <td className="p-4 text-center">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${status.color}`}>{status.label}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => { setEditingSupply(s); setSupplyForm(s); setShowModal(true); }}
                              className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"><Edit size={14} /></button>
                            <button onClick={() => deleteSupply(s.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredSupplies.filter(s => s.active).length === 0 && (
                <div className="text-center py-10 text-gray-400">Nenhum insumo cadastrado.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== TAB: COMPRAS ========== */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Registro de Compras</h3>
            <button onClick={() => { setPurchaseForm(emptyPurchase); setShowPurchaseModal(true); }}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition text-sm">
              <Plus size={16} /> Nova Compra
            </button>
          </div>

          {/* Purchase History */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-4">Data</th>
                    <th className="p-4">Insumo</th>
                    <th className="p-4">Fornecedor</th>
                    <th className="p-4 text-right">Qtd</th>
                    <th className="p-4 text-right">Preço Un.</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchases.slice(0, 50).map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-500">{p.date ? new Date(p.date.seconds * 1000).toLocaleDateString('pt-BR') : '...'}</td>
                      <td className="p-4 font-medium text-gray-900">{p.supplyName}</td>
                      <td className="p-4 text-gray-600">{p.supplier}</td>
                      <td className="p-4 text-right">{p.quantity}</td>
                      <td className="p-4 text-right">R$ {(p.price || 0).toFixed(2)}</td>
                      <td className="p-4 text-right font-bold">R$ {((p.price || 0) * (p.quantity || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {purchases.length === 0 && <div className="text-center py-10 text-gray-400">Nenhuma compra registrada.</div>}
            </div>
          </div>

          {/* Price Comparison */}
          {Object.keys(priceComparison).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><DollarSign size={18} className="text-emerald-500" /> Comparativo de Preços por Fornecedor</h3>
              <div className="space-y-4">
                {Object.entries(priceComparison).map(([supplyId, data]) => {
                  const supplierEntries = Object.entries(data.suppliers);
                  const avgPrices = supplierEntries.map(([name, purchases]) => ({
                    name, avg: purchases.reduce((s, p) => s + p.price, 0) / purchases.length, count: purchases.length,
                  })).sort((a, b) => a.avg - b.avg);
                  const bestPrice = avgPrices[0]?.avg || 0;

                  return (
                    <div key={supplyId} className="border border-gray-100 rounded-xl p-4">
                      <h4 className="font-bold text-sm text-gray-900 mb-3">{data.name}</h4>
                      <div className="space-y-2">
                        {avgPrices.map((sp, i) => (
                          <div key={sp.name} className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${i === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                              {i === 0 ? '★ Melhor' : `#${i + 1}`}
                            </span>
                            <span className="flex-1 text-sm font-medium text-gray-700">{sp.name}</span>
                            <span className="text-sm font-bold text-gray-900">R$ {sp.avg.toFixed(2)}</span>
                            <span className="text-xs text-gray-400">({sp.count} compras)</span>
                            {i > 0 && <span className="text-xs text-red-500 font-bold">+{((sp.avg - bestPrice) / bestPrice * 100).toFixed(0)}%</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== TAB: USO DIÁRIO ========== */}
      {activeTab === 'usage' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Uso Diário de Insumos</h3>
            <button onClick={() => { setUsageForm(emptyUsage); setShowUsageModal(true); }}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition text-sm">
              <Plus size={16} /> Registrar Uso
            </button>
          </div>

          {/* Today's Usage */}
          {(() => {
            const todayStr = new Date().toLocaleDateString('pt-BR');
            const todayUsage = usage.filter(u => u.date && new Date(u.date.seconds * 1000).toLocaleDateString('pt-BR') === todayStr);
            return (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2"><Calendar size={16} className="text-blue-500" /> Uso de Hoje ({todayStr})</h4>
                {todayUsage.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Nenhum registro hoje. Use o botão acima para registrar o uso do dia.</p>
                ) : (
                  <div className="space-y-2">
                    {todayUsage.map(u => (
                      <div key={u.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.supplyName}</p>
                          {u.note && <p className="text-[10px] text-gray-400 italic">{u.note}</p>}
                        </div>
                        <span className="text-sm font-bold text-gray-700">-{u.quantity} {supplies.find(s => s.id === u.supplyId)?.unit || ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Full Usage Log */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50"><h4 className="font-bold text-sm text-gray-900">Histórico de Uso</h4></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                  <tr><th className="p-4">Data</th><th className="p-4">Insumo</th><th className="p-4 text-right">Quantidade</th><th className="p-4">Obs.</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usage.slice(0, 50).map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-500">{u.date ? new Date(u.date.seconds * 1000).toLocaleDateString('pt-BR') : '...'}</td>
                      <td className="p-4 font-medium text-gray-900">{u.supplyName}</td>
                      <td className="p-4 text-right font-bold">-{u.quantity}</td>
                      <td className="p-4 text-gray-400 text-xs">{u.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {usage.length === 0 && <div className="text-center py-10 text-gray-400">Nenhum registro de uso.</div>}
            </div>
          </div>
        </div>
      )}

      {/* ========== TAB: ANÁLISE ========== */}
      {activeTab === 'analysis' && (
        <div className="space-y-4">
          {/* Period Filter */}
          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 p-2 w-fit">
            {[7, 14, 30, 60].map(d => (
              <button key={d} onClick={() => setAnalysisDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${analysisDays === d ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {d} dias
              </button>
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400 font-bold uppercase">Gasto Total</p>
              <p className="text-2xl font-black text-gray-900 mt-1">R$ {spendingTotal.toFixed(2)}</p>
              <p className="text-[10px] text-gray-400">últimos {analysisDays} dias</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400 font-bold uppercase">Compras Feitas</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{recentPurchases.length}</p>
              <p className="text-[10px] text-gray-400">últimos {analysisDays} dias</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400 font-bold uppercase">Registros de Uso</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{recentUsage.length}</p>
              <p className="text-[10px] text-gray-400">últimos {analysisDays} dias</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400 font-bold uppercase">Itens em Alerta</p>
              <p className="text-2xl font-black text-red-600 mt-1">{lowStockCount + zeroStockCount}</p>
              <p className="text-[10px] text-gray-400">baixo ou zerado</p>
            </div>
          </div>

          {/* Replenishment Forecast */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Target size={18} className="text-red-500" /> Previsão de Reposição</h3>
            <p className="text-xs text-gray-400 mb-4">Baseado no consumo médio dos últimos {analysisDays} dias</p>
            <div className="space-y-3">
              {supplies.filter(s => s.active).map(s => {
                const usageData = usageBySupply[s.id];
                const avgDaily = usageData ? usageData.total / analysisDays : 0;
                const avgWeekly = avgDaily * 7;
                const daysRemaining = avgDaily > 0 ? Math.floor(s.currentStock / avgDaily) : s.currentStock > 0 ? 999 : 0;
                const urgent = daysRemaining <= 7;
                const warning = daysRemaining <= 14;

                return (
                  <div key={s.id} className={`flex items-center gap-4 rounded-xl px-4 py-3 ${urgent ? 'bg-red-50 border border-red-200' : warning ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-100'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{s.name}</p>
                      <p className="text-[10px] text-gray-400">Estoque: {s.currentStock} {s.unit} · Consumo médio: {avgWeekly.toFixed(1)} {s.unit}/sem</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {daysRemaining >= 999 ? (
                        <span className="text-xs font-bold text-emerald-600">Sem uso registrado</span>
                      ) : daysRemaining <= 0 ? (
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">⚠ ZERADO</span>
                      ) : (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${urgent ? 'text-red-700 bg-red-100' : warning ? 'text-amber-700 bg-amber-100' : 'text-emerald-700 bg-emerald-100'}`}>
                          ~{daysRemaining} dias restantes
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {supplies.filter(s => s.active).length === 0 && <p className="text-center text-gray-400 py-6">Cadastre insumos para ver previsões.</p>}
            </div>
          </div>

          {/* Spending by Supply */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><DollarSign size={18} className="text-emerald-500" /> Gastos por Insumo</h3>
            <div className="space-y-2">
              {(() => {
                const spendByItem = {};
                recentPurchases.forEach(p => {
                  if (!spendByItem[p.supplyName]) spendByItem[p.supplyName] = 0;
                  spendByItem[p.supplyName] += (p.price || 0) * (p.quantity || 0);
                });
                const sorted = Object.entries(spendByItem).sort((a, b) => b[1] - a[1]);
                const maxSpend = sorted[0]?.[1] || 1;
                return sorted.map(([name, total]) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-32 truncate">{name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${(total / maxSpend) * 100}%` }} />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-24 text-right">R$ {total.toFixed(2)}</span>
                  </div>
                ));
              })()}
              {recentPurchases.length === 0 && <p className="text-center text-gray-400 py-6">Nenhuma compra no período.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* Supply Modal */}
      {showModal && (
        <Modal isOpen onClose={() => setShowModal(false)} title={editingSupply ? 'Editar Insumo' : 'Novo Insumo'}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">Nome</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={supplyForm.name} onChange={e => setSupplyForm({ ...supplyForm, name: e.target.value })} placeholder="Ex: Carne Bovina" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-bold mb-1 block">Categoria</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={supplyForm.category} onChange={e => setSupplyForm({ ...supplyForm, category: e.target.value })}>
                  {SUPPLY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-bold mb-1 block">Unidade</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={supplyForm.unit} onChange={e => setSupplyForm({ ...supplyForm, unit: e.target.value })}>
                  {SUPPLY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-bold mb-1 block">Estoque Atual</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={supplyForm.currentStock} onChange={e => setSupplyForm({ ...supplyForm, currentStock: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-bold mb-1 block">Estoque Mínimo</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={supplyForm.minStock} onChange={e => setSupplyForm({ ...supplyForm, minStock: e.target.value })} placeholder="Alerta quando abaixo" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50">Cancelar</button>
              <SaveButton onClick={saveSupply} label={editingSupply ? 'Salvar' : 'Cadastrar'} />
            </div>
          </div>
        </Modal>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <Modal isOpen onClose={() => setShowPurchaseModal(false)} title="Registrar Compra">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">Insumo</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                value={purchaseForm.supplyId} onChange={e => {
                  const supply = supplies.find(s => s.id === e.target.value);
                  setPurchaseForm({ ...purchaseForm, supplyId: e.target.value, supplyName: supply?.name || '' });
                }}>
                <option value="">Selecione...</option>
                {supplies.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">Fornecedor / Local</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={purchaseForm.supplier} onChange={e => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })} placeholder="Ex: Atacadão, Assaí, Mercado Central..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-bold mb-1 block">Preço Unitário (R$)</label>
                <input type="number" step="0.01" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={purchaseForm.price} onChange={e => setPurchaseForm({ ...purchaseForm, price: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-bold mb-1 block">Quantidade</label>
                <input type="number" step="0.1" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={purchaseForm.quantity} onChange={e => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">Observação (opcional)</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={purchaseForm.note} onChange={e => setPurchaseForm({ ...purchaseForm, note: e.target.value })} placeholder="Promoção, etc." />
            </div>
            {purchaseForm.price && purchaseForm.quantity && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm text-emerald-700 font-medium">Total da Compra</span>
                <span className="text-lg font-bold text-emerald-700">R$ {(Number(purchaseForm.price) * Number(purchaseForm.quantity)).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => setShowPurchaseModal(false)} className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50">Cancelar</button>
              <SaveButton onClick={savePurchase} label="Registrar Compra" />
            </div>
          </div>
        </Modal>
      )}

      {/* Usage Modal */}
      {showUsageModal && (
        <Modal isOpen onClose={() => setShowUsageModal(false)} title="Registrar Uso Diário">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">Insumo</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                value={usageForm.supplyId} onChange={e => {
                  const supply = supplies.find(s => s.id === e.target.value);
                  setUsageForm({ ...usageForm, supplyId: e.target.value, supplyName: supply?.name || '' });
                }}>
                <option value="">Selecione...</option>
                {supplies.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name} (estoque: {s.currentStock} {s.unit})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">Quantidade Utilizada</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={usageForm.quantity} onChange={e => setUsageForm({ ...usageForm, quantity: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">Observação (opcional)</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={usageForm.note} onChange={e => setUsageForm({ ...usageForm, note: e.target.value })} placeholder="Alto movimento, evento especial..." />
            </div>
            {usageForm.supplyId && usageForm.quantity && (() => {
              const supply = supplies.find(s => s.id === usageForm.supplyId);
              const remaining = Math.max(0, (supply?.currentStock || 0) - Number(usageForm.quantity));
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-700">Estoque atual: <b>{supply?.currentStock} {supply?.unit}</b></span>
                    <span className="text-amber-700">Após uso: <b>{remaining} {supply?.unit}</b></span>
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => setShowUsageModal(false)} className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50">Cancelar</button>
              <SaveButton onClick={saveUsage} label="Registrar Uso" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Catálogo ---
const CATEGORY_OPTIONS = ["Hamburguers Especiais", "Promoções da Galáxia", "Combos", "Extras", "Bebidas", "Sobremesas", "Porções", "Personalizado"];
const TAG_OPTIONS = [
  { value: "", label: "Nenhuma" },
  { value: "RECOMENDADO", label: "Recomendado" },
  { value: "MAIS PEDIDO", label: "Mais Pedido" },
  { value: "PROMO", label: "Promoção" },
  { value: "NOVO", label: "Novo" },
  { value: "EXCLUSIVO", label: "Exclusivo" },
];

const InputField = ({ label, icon: Icon, error, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1.5">
      {Icon && <Icon size={13} />} {label}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
  </div>
);

// ─── Ficha Técnica (Recipe Editor) ───────────────────────────────────────────
const RecipeEditor = ({ recipe = [], supplies = [], onChange }) => {
  const [selSupplyId, setSelSupplyId] = useState('');
  const [selQty,      setSelQty]      = useState('');

  const activeSupplies = supplies.filter(s => s.active !== false);

  const addIngredient = () => {
    const supply = activeSupplies.find(s => s.id === selSupplyId);
    if (!supply || !selQty) return;
    const qty = parseFloat(selQty);
    if (!qty || qty <= 0) return;
    // Avoid duplicates
    const existing = recipe.find(r => r.supplyId === supply.id);
    if (existing) {
      onChange(recipe.map(r => r.supplyId === supply.id ? { ...r, quantity: qty } : r));
    } else {
      onChange([...recipe, {
        supplyId:   supply.id,
        supplyName: supply.name,
        unit:       supply.unit,
        quantity:   qty,
      }]);
    }
    setSelSupplyId('');
    setSelQty('');
  };

  const removeIngredient = (supplyId) => onChange(recipe.filter(r => r.supplyId !== supplyId));

  const updateQty = (supplyId, raw) => {
    const qty = parseFloat(raw) || 0;
    onChange(recipe.map(r => r.supplyId === supplyId ? { ...r, quantity: qty } : r));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <div>
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Package size={18} className="text-orange-500" /> Ficha Técnica
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Defina quais insumos e quantidades são consumidos a cada unidade vendida.
          O estoque será deduzido automaticamente quando o pedido for confirmado.
        </p>
      </div>

      {/* Current ingredients */}
      {recipe.length > 0 ? (
        <div className="space-y-2">
          {recipe.map(ing => (
            <div key={ing.supplyId} className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2.5">
              <Package size={14} className="text-orange-400 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-gray-800">{ing.supplyName}</span>
              <input
                type="number" min="0.001" step="0.001"
                className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-sm bg-white text-center"
                value={ing.quantity}
                onChange={e => updateQty(ing.supplyId, e.target.value)}
              />
              <span className="text-xs text-gray-500 w-8 flex-shrink-0">{ing.unit}</span>
              <button onClick={() => removeIngredient(ing.supplyId)}
                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic text-center py-4 border border-dashed border-gray-200 rounded-xl">
          Nenhum insumo configurado. Use o formulário abaixo para adicionar.
        </p>
      )}

      {/* Add ingredient row */}
      {activeSupplies.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          <select
            className="flex-1 min-w-[150px] px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50"
            value={selSupplyId}
            onChange={e => setSelSupplyId(e.target.value)}
          >
            <option value="">Selecionar insumo…</option>
            {activeSupplies.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
            ))}
          </select>
          <input
            type="number" min="0.001" step="0.001"
            className="w-28 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-center"
            placeholder="Qtd."
            value={selQty}
            onChange={e => setSelQty(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addIngredient()}
          />
          <button onClick={addIngredient}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition flex items-center gap-1.5 flex-shrink-0">
            <Plus size={14} /> Adicionar
          </button>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
          ⚠️ Cadastre insumos primeiro em <strong>Controle de Insumos</strong> para poder configurar a ficha técnica.
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
        💡 Exemplo: <strong>Hamburguer Asteroide</strong> → Pão Brioche: 1 un · Carne 170g: 2 un · Bacon: 2 fatias · Queijo Prato: 2 fatias · Maionese: 12 ml
      </div>
    </div>
  );
};

const ItemForm = ({ item, onSave, onCancel, onDelete, isNew, supplies = [], menu = [] }) => {
  const [form, setForm] = useState(item || {
    name: "", price: 0, category: "Hamburguers Especiais", image: "🍔", photo: null,
    description: "", active: true, popular: false, tag: "", originalPrice: null,
    complements: [], recipe: [],
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [customCategory, setCustomCategory] = useState("");
  const [activeTab, setActiveTab] = useState("info");

  // Replication State
  const [showReplicateModal, setShowReplicateModal] = useState(false);
  const [replicateGroup, setReplicateGroup] = useState(null);
  const [replicateSelectedIds, setReplicateSelectedIds] = useState([]);
  const [replicateReplace, setReplicateReplace] = useState(true);

  // Complements helpers
  const addGroup = () => {
    update('complements', [...(form.complements || []), {
      id: Date.now().toString(),
      name: '',
      required: false,
      min: 0,
      max: 1,
      type: 'radio',
      options: [{ id: Date.now().toString() + '_o1', name: '', price: 0 }],
    }]);
  };
  const updateGroup = (gIdx, key, val) => {
    const groups = [...(form.complements || [])];
    groups[gIdx] = { ...groups[gIdx], [key]: val };
    update('complements', groups);
  };
  const removeGroup = (gIdx) => {
    update('complements', (form.complements || []).filter((_, i) => i !== gIdx));
  };
  const addOption = (gIdx) => {
    const groups = [...(form.complements || [])];
    groups[gIdx].options = [...groups[gIdx].options, { id: Date.now().toString(), name: '', price: 0 }];
    update('complements', groups);
  };
  const updateOption = (gIdx, oIdx, key, val) => {
    const groups = [...(form.complements || [])];
    groups[gIdx].options = groups[gIdx].options.map((o, i) => i === oIdx ? { ...o, [key]: val } : o);
    update('complements', groups);
  };
  const removeOption = (gIdx, oIdx) => {
    const groups = [...(form.complements || [])];
    groups[gIdx].options = groups[gIdx].options.filter((_, i) => i !== oIdx);
    update('complements', groups);
  };

  const update = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nome é obrigatório";
    if (!form.price || form.price <= 0) e.price = "Preço deve ser maior que zero";
    if (!form.category) e.category = "Selecione uma categoria";
    if (!form.description.trim()) e.description = "Descrição é obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      const finalCategory = form.category === "Personalizado" ? customCategory : form.category;
      onSave({ ...form, category: finalCategory || form.category, originalPrice: form.originalPrice || null });
    }
  };

  const runBatchReplicate = async () => {
    if (!replicateGroup || replicateSelectedIds.length === 0) return;
    try {
      const batch = writeBatch(db);
      replicateSelectedIds.forEach((tgId) => {
        const targetItem = menu.find(m => m.id === tgId);
        if (!targetItem) return;
        
        let newComplements = [...(targetItem.complements || [])];
        const replicatedCopy = {
           ...replicateGroup,
           id: Date.now().toString(36) + Math.random().toString(36).substring(2),
           options: (replicateGroup.options || []).map(opt => ({ ...opt, id: Date.now().toString(36) + Math.random().toString(36).substring(2) }))
        };

        if (replicateReplace) {
           const existingIdx = newComplements.findIndex(g => g.name === replicateGroup.name);
           if (existingIdx >= 0) newComplements[existingIdx] = replicatedCopy;
           else newComplements.push(replicatedCopy);
        } else {
           newComplements.push(replicatedCopy);
        }
        batch.set(doc(db, "menu", tgId.toString()), { complements: newComplements }, { merge: true });
      });
      await batch.commit();
      alert(`Grupo "${replicateGroup.name}" replicado com sucesso para ${replicateSelectedIds.length} item(ns)!`);
      setShowReplicateModal(false);
      setReplicateGroup(null);
      setReplicateSelectedIds([]);
    } catch (err) {
      console.error(err);
      alert("Erro ao replicar complemento.");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-gray-100 transition"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isNew ? "Novo Item" : "Editar Item"}</h1>
            <p className="text-sm text-gray-500">{isNew ? "Adicione um novo produto ao cardápio" : `Editando: ${item?.name}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition">
              <Trash2 size={15} /> Excluir
            </button>
          )}
          <SaveButton onClick={handleSave} label={isNew ? "Criar Item" : "Salvar"} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit overflow-x-auto">
        {[
          { key: "info", label: "Informações", icon: Edit },
          { key: "pricing", label: "Preço & Promoção", icon: DollarSign },
          { key: "complements", label: "Complementos", icon: Plus },
          { key: "recipe", label: "Ficha Técnica", icon: Package },
          { key: "display", label: "Exibição", icon: Eye },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon size={15} /> {tab.label}
            {tab.key === 'complements' && (form.complements || []).length > 0 && (
              <span className="ml-1 w-5 h-5 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{(form.complements || []).length}</span>
            )}
            {tab.key === 'recipe' && (form.recipe || []).length > 0 && (
              <span className="ml-1 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{(form.recipe || []).length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab: Info */}
          {activeTab === "info" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><UtensilsCrossed size={18} /> Informações do Produto</h3>

              <InputField label="Nome do item" icon={Edit} error={errors.name}>
                <input className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
                  value={form.name || ""} onChange={e => update("name", e.target.value)} placeholder="Ex: Burguer Cheddar Marciano" />
              </InputField>

              <InputField label="Descrição" icon={Clipboard} error={errors.description}>
                <textarea className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition resize-none ${errors.description ? 'border-red-300' : 'border-gray-200'}`}
                  rows={3} value={form.description || ""} onChange={e => update("description", e.target.value)} placeholder="Descreva os ingredientes e diferenciais do produto..." />
                <p className="text-xs text-gray-400 mt-1">{(form.description || "").length}/200 caracteres</p>
              </InputField>

              <InputField label="Categoria" icon={LayoutGrid} error={errors.category}>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map(cat => (
                    <button key={cat} onClick={() => update("category", cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition border ${form.category === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                {form.category === "Personalizado" && (
                  <input className="w-full mt-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    value={customCategory || ""} onChange={e => setCustomCategory(e.target.value)} placeholder="Nome da nova categoria" />
                )}
              </InputField>
            </div>
          )}

          {/* Tab: Pricing */}
          {activeTab === "pricing" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><DollarSign size={18} /> Preço & Promoção</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Preço (R$)" icon={DollarSign} error={errors.price}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">R$</span>
                    <input type="number" step="0.01" min="0"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition ${errors.price ? 'border-red-300' : 'border-gray-200'}`}
                      value={form.price || ""} onChange={e => update("price", parseFloat(e.target.value) || 0)} />
                  </div>
                </InputField>

                <InputField label="Preço original (riscado)" icon={DollarSign}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">R$</span>
                    <input type="number" step="0.01" min="0"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition"
                      value={form.originalPrice || ""} onChange={e => update("originalPrice", parseFloat(e.target.value) || null)} placeholder="Deixe vazio se não for promoção" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Se preenchido, o preço acima aparece como promocional com o original riscado</p>
                </InputField>
              </div>

              {form.originalPrice > 0 && form.price > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={16} className="text-amber-600" />
                    <span className="text-sm font-bold text-amber-800">Preview da Promoção</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-gray-400 line-through">R$ {form.originalPrice.toFixed(2)}</span>
                    <span className="text-2xl font-bold text-red-600">R$ {form.price.toFixed(2)}</span>
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-lg font-bold">
                      -{Math.round((1 - form.price / form.originalPrice) * 100)}% OFF
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Complements */}
          {activeTab === "complements" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Plus size={18} /> Grupos de Complementos</h3>
                <button onClick={addGroup}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition">
                  <Plus size={14} /> Novo Grupo
                </button>
              </div>
              <p className="text-xs text-gray-400">Crie grupos como "Ponto da Carne", "Adicionais", "Molhos" etc. Cada grupo pode ter várias opções com preço adicional.</p>

              {(form.complements || []).length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">Nenhum complemento cadastrado</p>
                  <button onClick={addGroup} className="text-sm text-gray-900 font-bold hover:underline">+ Adicionar primeiro grupo</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {(form.complements || []).map((group, gIdx) => (
                    <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Group Header */}
                      <div className="bg-gray-50 p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <input className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-gray-900 outline-none"
                            value={group.name} onChange={e => updateGroup(gIdx, 'name', e.target.value)}
                            placeholder="Nome do grupo (ex: Ponto da Carne, Adicionais...)" />
                          <button onClick={() => { setReplicateGroup(group); setShowReplicateModal(true); setReplicateSelectedIds([]); }} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Replicar para outros itens">
                            <Copy size={16} />
                          </button>
                          <button onClick={() => removeGroup(gIdx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir grupo">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                              checked={group.required}
                              onChange={e => updateGroup(gIdx, 'required', e.target.checked)} />
                            <span className="text-xs font-semibold text-gray-600">Obrigatório</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Tipo:</span>
                            <select className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                              value={group.type} onChange={e => {
                                updateGroup(gIdx, 'type', e.target.value);
                                if (e.target.value === 'radio') { updateGroup(gIdx, 'max', 1); updateGroup(gIdx, 'min', group.required ? 1 : 0); }
                              }}>
                              <option value="radio">Escolha única</option>
                              <option value="checkbox">Múltipla escolha</option>
                            </select>
                          </div>
                          {group.type === 'checkbox' && (
                            <>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Mín:</span>
                                <input type="number" min="0" className="w-12 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-center"
                                  value={group.min} onChange={e => updateGroup(gIdx, 'min', parseInt(e.target.value) || 0)} />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Máx:</span>
                                <input type="number" min="1" className="w-12 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-center"
                                  value={group.max} onChange={e => updateGroup(gIdx, 'max', parseInt(e.target.value) || 1)} />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Options */}
                      <div className="p-4 space-y-2">
                        {group.options.map((opt, oIdx) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                            <input className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                              value={opt.name} onChange={e => updateOption(gIdx, oIdx, 'name', e.target.value)}
                              placeholder="Nome da opção (ex: Mal Passado, Bacon Extra...)" />
                            <div className="relative w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">R$</span>
                              <input type="number" step="0.50" min="0"
                                className="w-full pl-7 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-gray-900 outline-none"
                                value={opt.price || ''} onChange={e => updateOption(gIdx, oIdx, 'price', parseFloat(e.target.value) || 0)}
                                placeholder="0" />
                            </div>
                            <button onClick={() => removeOption(gIdx, oIdx)} className="p-1.5 text-gray-300 hover:text-red-500 transition">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addOption(gIdx)}
                          className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition border border-dashed border-gray-200">
                          + Adicionar Opção
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Ficha Técnica */}
          {activeTab === "recipe" && (
            <RecipeEditor
              recipe={form.recipe || []}
              supplies={supplies}
              onChange={r => update('recipe', r)}
            />
          )}

          {/* Tab: Display */}
          {activeTab === "display" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Eye size={18} /> Exibição no Cardápio</h3>

              <InputField label="Foto do Produto">
                <div className="space-y-3">
                  {/* Upload Zone */}
                  <div className="relative">
                    <input type="file" accept="image/*" id="photo-upload"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => update("photo", ev.target.result);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    {form.photo ? (
                      <div className="relative group">
                        <div className="w-full h-48 rounded-2xl overflow-hidden border-2 border-gray-200">
                          <img src={form.photo} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-2xl transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <span className="bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-medium shadow-lg cursor-pointer">Trocar Foto</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-48 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center hover:border-gray-400 hover:bg-gray-100 transition cursor-pointer">
                        <div className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center mb-3">
                          <ShoppingBag size={24} className="text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Clique para enviar uma foto</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WEBP • Máx 5MB</p>
                        <p className="text-xs text-gray-400">Recomendado: 800x800px quadrada</p>
                      </div>
                    )}
                  </div>
                  {form.photo && (
                    <button onClick={() => update("photo", null)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition">
                      <Trash2 size={12} /> Remover foto
                    </button>
                  )}

                  {/* Emoji fallback */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ícone de Fallback (sem foto)</p>
                    <p className="text-xs text-gray-400 mb-3">Exibido quando não há foto. Usado também no mini-carrinho.</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${GRADIENT_MAP[form.image] || "from-gray-700 to-gray-500"} flex items-center justify-center text-2xl`}>
                        {form.image}
                      </div>
                      <input className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-center"
                        value={form.image || ""} onChange={e => update("image", e.target.value)} maxLength={2} placeholder="🍔" style={{ maxWidth: 60 }} />
                      <div className="flex flex-wrap gap-1">
                        {["🍔", "🥓", "🧀", "👽", "☄️", "☀️", "🌵", "🛸", "🍟", "🥤", "🧃", "🍫", "🍕", "🍗", "🥬"].map(em => (
                          <button key={em} onClick={() => update("image", em)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:bg-white hover:shadow-sm transition ${form.image === em ? 'bg-white shadow-sm ring-2 ring-gray-400' : ''}`}>
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </InputField>

              <InputField label="Tag / Destaque">
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map(tag => (
                    <button key={tag.value} onClick={() => update("tag", tag.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition border ${form.tag === tag.value
                        ? tag.value === "RECOMENDADO" ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : tag.value === "MAIS PEDIDO" ? 'bg-red-100 text-red-700 border-red-300'
                            : tag.value === "PROMO" ? 'bg-amber-100 text-amber-700 border-amber-300'
                              : tag.value === "NOVO" ? 'bg-blue-100 text-blue-700 border-blue-300'
                                : tag.value === "EXCLUSIVO" ? 'bg-violet-100 text-violet-700 border-violet-300'
                                  : 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                      {tag.label}
                    </button>
                  ))}
                </div>
              </InputField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Item Popular</p>
                    <p className="text-xs text-gray-400">Aparece na seção de destaques do cardápio</p>
                  </div>
                  <button onClick={() => update("popular", !form.popular)}
                    className={`w-12 h-7 rounded-full transition-colors flex items-center ${form.popular ? 'bg-orange-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                    <div className="bg-white rounded-full shadow mx-0.5" style={{ width: 22, height: 22 }} />
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Ativo no Cardápio</p>
                    <p className="text-xs text-gray-400">Se desativado, cliente não vê o item</p>
                  </div>
                  <button onClick={() => update("active", !form.active)}
                    className={`w-12 h-7 rounded-full transition-colors flex items-center ${form.active ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                    <div className="bg-white rounded-full shadow mx-0.5" style={{ width: 22, height: 22 }} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
            <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2"><Eye size={15} /> Preview</h3>

            {/* Card preview - Admin */}
            <div className="border border-gray-200 rounded-2xl p-4 mb-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Card no Admin</p>
              <div className="flex items-start gap-3">
                <ProductImage photo={form.photo} emoji={form.image} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-gray-900 text-xs truncate">{form.name || "Nome do item"}</span>
                    {form.tag === "RECOMENDADO" && <span className="text-[8px] px-1 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold">REC</span>}
                    {form.tag === "MAIS PEDIDO" && <span className="text-[8px] px-1 py-0.5 bg-red-100 text-red-700 rounded font-bold">TOP</span>}
                    {form.tag === "PROMO" && <span className="text-[8px] px-1 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">PROMO</span>}
                    {form.tag === "NOVO" && <span className="text-[8px] px-1 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">NOVO</span>}
                    {form.tag === "EXCLUSIVO" && <span className="text-[8px] px-1 py-0.5 bg-violet-100 text-violet-700 rounded font-bold">VIP</span>}
                    {form.popular && <Flame size={11} className="text-orange-500" />}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{form.description || "Descrição do produto..."}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {form.originalPrice > 0 && <span className="text-[10px] text-gray-400 line-through">R$ {form.originalPrice.toFixed(2)}</span>}
                    <span className={`text-xs font-bold ${form.originalPrice ? 'text-red-600' : 'text-gray-900'}`}>R$ {(form.price || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile preview - Customer Card */}
            <div className="border border-gray-200 rounded-2xl p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Card no Cardápio (Cliente)</p>
              <div className="bg-white rounded-xl border border-gray-100 p-3 flex gap-2.5">
                <ProductImage photo={form.photo} emoji={form.image} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-bold text-[11px] text-gray-900">{form.name || "Nome"}</span>
                    {form.tag && <span className="text-[7px] px-1 py-0.5 bg-red-100 text-red-700 rounded font-bold">{form.tag}</span>}
                  </div>
                  <p className="text-[9px] text-gray-400 line-clamp-1">{form.description || "Descrição..."}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      {form.originalPrice > 0 && <span className="text-[9px] text-gray-400 line-through">R${form.originalPrice.toFixed(2)}</span>}
                      <span className={`text-[11px] font-bold ${form.originalPrice ? 'text-red-600' : 'text-gray-900'}`}>R$ {(form.price || 0).toFixed(2)}</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 bg-red-600 text-white rounded font-medium">Adicionar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Summary */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium ${form.active ? 'text-emerald-600' : 'text-red-500'}`}>
                  {form.active ? '● Ativo' : '● Inativo'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Categoria</span>
                <span className="font-medium text-gray-700">{form.category === "Personalizado" ? customCategory || "..." : form.category}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Popular</span>
                <span className="font-medium">{form.popular ? '🔥 Sim' : 'Não'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Tag</span>
                <span className="font-medium text-gray-700">{TAG_OPTIONS.find(t => t.value === form.tag)?.label || "Nenhuma"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Excluir Item">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={28} className="text-red-500" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-2">Tem certeza?</h3>
          <p className="text-sm text-gray-500 mb-6">
            O item <strong>"{form.name}"</strong> será removido permanentemente do cardápio. Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
            <button onClick={() => { onDelete(form.id); setShowDeleteConfirm(false); }}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition">Excluir Item</button>
          </div>
        </div>
      </Modal>
      {/* Replication Modal */}
      {showReplicateModal && replicateGroup && (
        <Modal isOpen={true} title={`Replicar: ${replicateGroup.name}`} onClose={() => setShowReplicateModal(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Selecione os itens do cardápio que receberão esta mesma configuração de complementos.</p>
            
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200">
               <input type="checkbox" className="w-4 h-4 rounded text-gray-900 border-gray-300 focus:ring-gray-900"
                  checked={replicateReplace} onChange={e => setReplicateReplace(e.target.checked)} />
               <span className="text-sm font-semibold text-gray-900">Substituir grupo no destino se tiver o mesmo nome</span>
            </label>

            <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-4">
              {Array.from(new Set((menu || []).map(i => i.category))).map(cat => {
                 const catItems = (menu || []).filter(i => i.category === cat && i.id !== form.id);
                 if (catItems.length === 0) return null;
                 
                 const categorySelected = catItems.every(i => replicateSelectedIds.includes(i.id));
                 const handleCategoryToggle = (e) => {
                    if (e.target.checked) setReplicateSelectedIds(prev => [...new Set([...prev, ...catItems.map(i => i.id)])]);
                    else setReplicateSelectedIds(prev => prev.filter(id => !catItems.find(i => i.id === id)));
                 };

                 return (
                   <div key={cat} className="space-y-2">
                     <label className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={categorySelected} onChange={handleCategoryToggle} className="w-4 h-4 rounded text-gray-900" />
                        <span className="font-bold text-sm text-gray-900">{cat}</span>
                     </label>
                     <div className="pl-6 space-y-1">
                        {catItems.map(item => (
                           <label key={item.id} className="flex items-center gap-2 py-1 cursor-pointer">
                              <input type="checkbox" checked={replicateSelectedIds.includes(item.id)} 
                                 onChange={e => {
                                    if (e.target.checked) setReplicateSelectedIds(prev => [...prev, item.id]);
                                    else setReplicateSelectedIds(prev => prev.filter(id => id !== item.id));
                                 }}
                                 className="w-4 h-4 rounded text-gray-900" />
                              <span className="text-sm text-gray-700 w-full truncate">{item.name}</span>
                              {!item.active && <span className="text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded uppercase flex-shrink-0">Inativo</span>}
                           </label>
                        ))}
                     </div>
                   </div>
                 );
              })}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowReplicateModal(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition">Cancelar</button>
              <button 
                 onClick={runBatchReplicate} 
                 disabled={replicateSelectedIds.length === 0}
                 className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition disabled:opacity-50">
                 Replicar para {replicateSelectedIds.length} item(ns)
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const Catalog = ({ menu, setMenu, supplies = [] }) => {
  const [editItem, setEditItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const categories = ["Todos", ...new Set(menu.map(i => i.category))];
  const filtered = (filter === "Todos" ? menu : menu.filter(i => i.category === filter))
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const toggleActive = async (id) => {
    const item = menu.find(i => i.id === id);
    if (!item) return;
    try {
      await updateDoc(doc(db, "menu", id), { active: !item.active });
    } catch (e) {
      console.error(e);
      alert("Erro ao alterar status");
    }
  };

  const handleSave = async (updatedItem) => {
    try {
      if (updatedItem.id && editItem) {
        await updateDoc(doc(db, "menu", updatedItem.id.toString()), updatedItem);
        setEditItem(null);
      } else {
        // Adding new item
        const docRef = await addDoc(collection(db, "menu"), updatedItem);
        console.log("Item added: ", docRef.id);
        setIsAdding(false);
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar o item");
    }
  };

  const handleDelete = async (id) => {
    try {
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "menu", id.toString()));
      setEditItem(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir item. Verifique as permissões.");
    }
  };

  if (editItem) {
    return <ItemForm item={editItem} onSave={handleSave} onCancel={() => setEditItem(null)} onDelete={handleDelete} isNew={false} supplies={supplies} menu={menu} />;
  }

  if (isAdding) {
    return <ItemForm item={null} onSave={handleSave} onCancel={() => setIsAdding(false)} onDelete={() => { }} isNew={true} supplies={supplies} menu={menu} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cardápio</h1>
          <p className="text-sm text-gray-500 mt-1">{menu.filter(i => i.active).length} itens ativos de {menu.length} total</p>
        </div>
        <button onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition">
          <Plus size={16} /> Novo Item
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="Buscar item..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${filter === c ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {c} {c !== "Todos" && <span className="ml-1 text-xs opacity-60">({menu.filter(i => i.category === c).length})</span>}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => (
          <div key={item.id} className={`bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all group ${!item.active ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-3">
              <ProductImage photo={item.photo} emoji={item.image} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{item.name}</h3>
                  {item.tag === "RECOMENDADO" && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold">RECOMENDADO</span>}
                  {item.tag === "MAIS PEDIDO" && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">MAIS PEDIDO</span>}
                  {item.tag === "PROMO" && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">PROMO</span>}
                  {item.tag === "NOVO" && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">NOVO</span>}
                  {item.tag === "EXCLUSIVO" && <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded font-bold">EXCLUSIVO</span>}
                  {item.popular && <Flame size={14} className="text-orange-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {item.originalPrice && <span className="text-xs text-gray-400 line-through">R$ {item.originalPrice.toFixed(2)}</span>}
                    <span className={`font-bold ${item.originalPrice ? 'text-red-600' : 'text-gray-900'}`}>R$ {item.price.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleActive(item.id)} className={`p-1.5 rounded-lg transition ${item.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      {item.active ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    </button>
                    <button onClick={() => setEditItem(item)} className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition"><Edit size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Search size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Nenhum item encontrado</p>
          <p className="text-sm text-gray-300 mt-1">Tente outra busca ou categoria</p>
        </div>
      )}
    </div>
  );
};

// --- Delivery/Entregadores ---
const DeliveryManagement = ({ drivers, orders, onAssignDriver }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [activeTab, setActiveTab] = useState('drivers'); // 'drivers' | 'orders'

  const initialForm = { name: '', phone: '', vehicle: 'Moto', status: 'Disponível', active: true };
  const [form, setForm] = useState(initialForm);

  const saveDriver = async () => {
    if (!form.name || !form.phone) return alert('Preencha nome e telefone.');
    try {
      const data = {
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ''),
        vehicle: form.vehicle || 'Moto',
        status: form.status || 'Disponível',
        active: form.active !== false,
        deliveries: editingDriver ? (editingDriver.deliveries || 0) : 0,
        rating: editingDriver ? (editingDriver.rating || 5.0) : 5.0,
        currentOrderId: editingDriver ? (editingDriver.currentOrderId || null) : null,
        location: editingDriver ? (editingDriver.location || null) : null,
      };
      if (editingDriver) {
        await updateDoc(doc(db, 'drivers', editingDriver.id), data);
      } else {
        await addDoc(collection(db, 'drivers'), { ...data, createdAt: serverTimestamp() });
      }
      setShowModal(false);
      setEditingDriver(null);
      setForm(initialForm);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar entregador: ' + e.message);
    }
  };

  const deleteDriver = async (id) => {
    if (window.confirm('Remover este entregador?')) await deleteDoc(doc(db, 'drivers', id));
  };

  const toggleStatus = async (driver) => {
    const next = driver.status === 'Disponível' ? 'Offline' : 'Disponível';
    await updateDoc(doc(db, 'drivers', driver.id), { status: next });
  };

  const assignOrderToDriver = async (orderId, driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        assignedDriverId: driverId,
        assignedDriverName: driver.name,
        status: 'Saiu p/ Entrega',
      });
      await updateDoc(doc(db, 'drivers', driverId), {
        status: 'Em entrega',
        currentOrderId: orderId,
      });
    } catch (e) { alert('Erro ao atribuir entregador: ' + e.message); }
  };

  const getDriverLink = (driver) => {
    const base = window.location.origin;
    return `${base}/motorista?id=${driver.id}`;
  };

  const copyLink = (driver) => {
    navigator.clipboard.writeText(getDriverLink(driver));
    alert(`✅ Link copiado!\n\nEnvie esse link para ${driver.name} pelo WhatsApp.`);
  };

  const activeDrivers = drivers.filter(d => d.active !== false);
  const pendingOrders = orders.filter(o => ['Novo', 'Confirmado', 'Preparando'].includes(o.status));
  const outForDelivery = orders.filter(o => o.status === 'Saiu p/ Entrega');

  const statusColor = (s) => s === 'Disponível' ? 'bg-emerald-100 text-emerald-700' : s === 'Em entrega' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery & Entregadores</h1>
          <p className="text-sm text-gray-500 mt-1">{activeDrivers.filter(d => d.status === 'Disponível').length} disponíveis · {activeDrivers.filter(d => d.status === 'Em entrega').length} em rota</p>
        </div>
        <button onClick={() => { setForm(initialForm); setEditingDriver(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-md">
          <Plus size={16} /> Cadastrar Entregador
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Bike} label="Entregadores" value={activeDrivers.length} color="text-violet-600" />
        <StatCard icon={CheckCircle} label="Disponíveis" value={activeDrivers.filter(d => d.status === 'Disponível').length} color="text-emerald-600" />
        <StatCard icon={Truck} label="Em Entrega" value={activeDrivers.filter(d => d.status === 'Em entrega').length} color="text-amber-600" />
        <StatCard icon={Package} label="Aguardando Rota" value={pendingOrders.length} color="text-sky-600" />
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        {[['drivers', '🛵 Entregadores'], ['orders', '📦 Atribuir Pedidos'], ['map', '🗺️ Mapa ao Vivo']].map(([k, l]) => (
          <button key={k} onClick={() => setActiveTab(k)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition ${activeTab === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* TAB: Drivers */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeDrivers.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <Bike size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-semibold">Nenhum entregador cadastrado</p>
              <p className="text-xs text-gray-400 mt-1">Cadastre seus entregadores para começar a atribuir pedidos.</p>
            </div>
          )}
          {activeDrivers.map(d => {
            const locAge = d.location?.updatedAt?.seconds
              ? Math.round((Date.now() / 1000 - d.location.updatedAt.seconds) / 60)
              : null;
            return (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-black text-lg">
                      {d.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{d.name}</h3>
                      <p className="text-xs text-gray-400">{d.phone ? `+55 ${d.phone}` : 'Sem telefone'}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor(d.status)}`}>{d.status}</span>
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">{d.vehicle || 'Moto'}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">{d.deliveries || 0} entregas</span>
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />{Number(d.rating || 5).toFixed(1)}
                  </span>
                </div>

                {/* Location */}
                {d.location?.lat ? (
                  <a href={`https://www.google.com/maps?q=${d.location.lat},${d.location.lng}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-sky-600 bg-sky-50 rounded-lg px-3 py-1.5 mb-3 hover:bg-sky-100 transition">
                    <MapPin size={12} /> Ver no mapa
                    {locAge !== null && <span className="text-gray-400 ml-auto">há {locAge}min</span>}
                  </a>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-1.5 mb-3">
                    <MapPin size={12} /> Localização não disponível
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => copyLink(d)}
                    className="flex-1 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition flex items-center justify-center gap-1">
                    <Link2 size={12} /> Link do App
                  </button>
                  <button onClick={() => toggleStatus(d)}
                    className="flex-1 py-2 text-xs font-bold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition">
                    {d.status === 'Disponível' ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => { setEditingDriver(d); setForm({ ...initialForm, ...d }); setShowModal(true); }}
                    className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => deleteDriver(d.id)}
                    className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB: Assign Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Out for delivery */}
          {outForDelivery.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2"><Truck size={16} /> Em rota ({outForDelivery.length})</h3>
              <div className="space-y-2">
                {outForDelivery.map(o => (
                  <div key={o.id} className="bg-white rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-gray-900">#{String(o.dailyId || '').padStart(3, '0')} — {o.customer}</p>
                      <p className="text-xs text-gray-500">{o.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-amber-600 font-bold">{o.assignedDriverName || 'Sem entregador'}</p>
                      <p className="text-xs text-gray-400">R$ {Number(o.total || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending orders to assign */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900">Pedidos aguardando entregador ({pendingOrders.length})</h3>
            </div>
            {pendingOrders.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <Package size={32} className="mx-auto mb-2 text-gray-200" />
                <p>Nenhum pedido aguardando entregador</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingOrders.map(o => (
                  <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-gray-900">#{String(o.dailyId || '').padStart(3, '0')}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          o.status === 'Novo' ? 'bg-blue-100 text-blue-700' :
                          o.status === 'Confirmado' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                        }`}>{o.status}</span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{o.customer}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin size={10} /> {o.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">R$ {Number(o.total || 0).toFixed(2)}</span>
                      <select
                        defaultValue=""
                        onChange={e => { if (e.target.value) assignOrderToDriver(o.id, e.target.value); }}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900">
                        <option value="" disabled>Atribuir entregador…</option>
                        {activeDrivers.filter(d => d.status === 'Disponível').map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.vehicle})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Live Map */}
      {activeTab === 'map' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="bg-gray-950 rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                <Radio size={18} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-white font-black text-lg">Central de Operações</h2>
                <p className="text-gray-500 text-xs">{outForDelivery.length} entrega(s) ativa(s) agora · Atualização em tempo real</p>
              </div>
              <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-900/40 border border-emerald-700/40 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 ufo-live-dot"></span>
                <span className="text-emerald-400 text-xs font-bold">AO VIVO</span>
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-800">
              {[['🛸', 'UFO Burguers', 'text-gray-400'], ['🛵', 'Entregador (GPS ativo)', 'text-emerald-400'], ['🏠', 'Destino do cliente', 'text-violet-400']].map(([icon, label, cls]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-base">{icon}</span>
                  <span className={`text-xs font-medium ${cls}`}>{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div style={{width:24,height:3,background:'#EF4444',borderRadius:4,opacity:0.8}}></div>
                <span className="text-xs font-medium text-red-400">Rota ativa</span>
              </div>
            </div>
          </div>

          {/* No active deliveries */}
          {outForDelivery.length === 0 && (
            <div className="bg-gray-950 rounded-2xl border border-gray-800 p-16 text-center">
              <div className="text-6xl mb-4">🛸</div>
              <h3 className="text-white font-bold text-lg">Nenhuma entrega em rota</h3>
              <p className="text-gray-500 text-sm mt-1">O mapa será ativado quando um pedido for atribuído a um entregador.</p>
            </div>
          )}

          {/* One map card per active delivery */}
          {outForDelivery.map(order => {
            const assignedDriver = drivers.find(d => d.id === order.assignedDriverId);
            const driverLoc = assignedDriver?.location?.lat ? { lat: assignedDriver.location.lat, lng: assignedDriver.location.lng } : null;
            const locAge = assignedDriver?.location?.updatedAt?.seconds
              ? Math.round((Date.now() / 1000 - assignedDriver.location.updatedAt.seconds) / 60)
              : null;
            return (
              <div key={order.id} className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden">
                {/* Order header bar */}
                <div className="bg-gradient-to-r from-red-900/60 to-gray-900 px-5 py-3 flex items-center gap-3 border-b border-gray-800">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                    <Bike size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-black text-sm">#{String(order.dailyId || '').padStart(3, '0')} — {order.customer}</p>
                    <p className="text-gray-400 text-xs">{order.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">{assignedDriver?.name || 'Entregador não atribuído'}</p>
                    <div className="flex items-center gap-1.5 justify-end mt-0.5">
                      {driverLoc
                        ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ufo-live-dot"></span><span className="text-emerald-400 text-xs">GPS ativo {locAge !== null && `· há ${locAge}min`}</span></>
                        : <><span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span><span className="text-gray-500 text-xs">GPS offline</span></>}
                    </div>
                  </div>
                  <a href={`https://wa.me/55${assignedDriver?.phone || ''}?text=${encodeURIComponent(`Oi ${assignedDriver?.name || ''}! Pedido #${String(order.dailyId||'').padStart(3,'0')} para ${order.customer} no endereço: ${order.address}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="ml-2 p-2 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 rounded-xl hover:bg-emerald-600/40 transition text-xs font-bold flex items-center gap-1">
                    <Phone size={12} /> WhatsApp
                  </a>
                </div>
                {/* Map */}
                <div className="p-4">
                  <LiveTrackingMap
                    variant="admin"
                    driverLocation={driverLoc}
                    customerAddress={order.address}
                    driverName={assignedDriver?.name || 'Entregador'}
                    orderId={`#${String(order.dailyId || '').padStart(3, '0')}`}
                    height={340}
                  />
                </div>
                {/* Order footer */}
                <div className="px-5 pb-4 flex items-center gap-4">
                  <div className="flex-1 bg-gray-900 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Pagamento</p>
                    <p className="text-white font-bold text-sm">{order.payment}</p>
                  </div>
                  <div className="flex-1 bg-gray-900 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total</p>
                    <p className="text-white font-bold text-sm">R$ {(order.items?.reduce((s,i)=>s+i.price*i.qty,0)+(order.deliveryFee||0)).toFixed(2)}</p>
                  </div>
                  <div className="flex-1 bg-gray-900 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Entregador</p>
                    <p className="text-white font-bold text-sm">{assignedDriver?.vehicle || '—'}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-4 py-3 bg-sky-600/20 border border-sky-600/30 text-sky-400 rounded-xl hover:bg-sky-600/30 transition text-xs font-bold flex items-center gap-1.5">
                    <Navigation size={12} /> Abrir Rota
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">{editingDriver ? 'Editar Entregador' : 'Novo Entregador'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-bold mb-1 block">Nome Completo</label>
                <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-gray-900 outline-none"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Lucas Ferreira" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-bold mb-1 block">Telefone (WhatsApp)</label>
                <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-gray-900 outline-none"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(85) 99999-9999" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-bold mb-1 block">Veículo</label>
                  <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-gray-900 outline-none"
                    value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })}>
                    <option>Moto</option>
                    <option>Bicicleta</option>
                    <option>Carro</option>
                    <option>A pé</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold mb-1 block">Status Inicial</label>
                  <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-gray-900 outline-none"
                    value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option>Disponível</option>
                    <option>Offline</option>
                  </select>
                </div>
              </div>
              {editingDriver && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <p className="text-xs text-emerald-700 font-bold mb-1">🔗 Link do app do entregador</p>
                  <p className="text-[11px] text-emerald-600 break-all font-mono">{`${window.location.origin}/motorista?id=${editingDriver.id}`}</p>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/motorista?id=${editingDriver.id}`); }}
                    className="mt-2 text-xs text-emerald-700 font-bold flex items-center gap-1 hover:underline">
                    <Copy size={12} /> Copiar link
                  </button>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50">Cancelar</button>
              <SaveButton onClick={saveDriver} label={editingDriver ? 'Salvar Alterações' : 'Cadastrar'} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Fidelidade ---
const Loyalty = () => {
  const tiers = [
    { name: "Bronze", min: 0, max: 149, color: "bg-amber-700", icon: "🥉", benefit: "5% desconto" },
    { name: "Prata", min: 150, max: 299, color: "bg-gray-400", icon: "🥈", benefit: "10% desconto + entrega grátis" },
    { name: "Ouro", min: 300, max: 499, color: "bg-yellow-500", icon: "🥇", benefit: "15% desconto + brinde" },
    { name: "Diamante", min: 500, max: Infinity, color: "bg-violet-500", icon: "💎", benefit: "20% desconto + VIP" },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Programa de Fidelidade</h1>
      <p className="text-sm text-gray-500 mb-6">Recompense seus clientes fiéis</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tiers.map(t => (
          <div key={t.name} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition">
            <div className="text-3xl mb-3">{t.icon}</div>
            <h3 className="font-bold text-gray-900">{t.name}</h3>
            <p className="text-xs text-gray-400 mt-1">{t.min} - {t.max === Infinity ? '∞' : t.max} pontos</p>
            <p className="text-sm text-gray-600 mt-2 font-medium">{t.benefit}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-2">Configuração</h3>
        <p className="text-sm text-gray-500 mb-4">Defina como seus clientes acumulam pontos</p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-red-700 font-medium">🎁 Novos clientes ganham automaticamente 50 pontos de boas-vindas!</p>
          <p className="text-xs text-red-500 mt-1">A cada R$ 1,00 em compras o cliente ganha 1 ponto que pode ser trocado por prêmios.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">Pontos por R$ 1 gasto</label>
            <input className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" defaultValue="1" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">Bônus novos clientes</label>
            <input className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" defaultValue="50" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">Validade dos pontos (dias)</label>
            <input className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" defaultValue="365" />
          </div>
        </div>
        <SaveButton onClick={() => {}} label="Salvar" className="mt-4 px-6 py-2.5" />
      </div>
    </div>
  );
};

// --- Clientes ---
const Customers = ({ customers }) => {
  const [search, setSearch] = useState("");
  const filtered = customers.filter(c => {
    const name = (c.name || '').toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || phone.includes(q) || email.includes(q);
  });
  const totalPoints = customers.reduce((s, c) => s + (c.points || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Clientes</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total de Clientes" value={customers.length} color="text-sky-600" />
        <StatCard icon={Award} label="Pontos Emitidos" value={totalPoints} color="text-amber-600" />
        <StatCard icon={Star} label="Com Pontos" value={customers.filter(c => (c.points || 0) > 0).length} color="text-violet-600" />
        <StatCard icon={CheckCircle} label="Com Endereço" value={customers.filter(c => c.address).length} color="text-emerald-600" />
      </div>
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Buscar por nome, telefone ou email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-gray-300" />
          </div>
          <h3 className="font-bold text-gray-700 mb-1">{search ? 'Nenhum resultado' : 'Nenhum cliente cadastrado'}</h3>
          <p className="text-sm text-gray-400">{search ? 'Tente buscar por outro termo.' : 'Os clientes aparecerão aqui quando se cadastrarem pelo app.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="text-left p-3 font-semibold text-gray-600">Cliente</th>
              <th className="text-left p-3 font-semibold text-gray-600">Telefone</th>
              <th className="text-left p-3 font-semibold text-gray-600">Endereço</th>
              <th className="text-left p-3 font-semibold text-gray-600">Pontos</th>
              <th className="text-left p-3 font-semibold text-gray-600">Último Acesso</th>
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-xs flex-shrink-0">
                        {(c.name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.name || 'Sem nome'}</p>
                        {c.email && <p className="text-xs text-gray-400 truncate">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">{c.phone || '-'}</td>
                  <td className="p-3 text-gray-500 text-xs max-w-[200px] truncate">{c.address || '-'}</td>
                  <td className="p-3"><Badge variant="purple">{c.points || 0} pts</Badge></td>
                  <td className="p-3 text-gray-500 text-xs">{c.lastLogin ? new Date(c.lastLogin).toLocaleDateString('pt-BR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// --- Avaliações ---
const ReviewsPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-1">Avaliações</h1>
    <p className="text-sm text-gray-500 mb-6">O que seus clientes estão dizendo</p>
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <StatCard icon={Star} label="Nota Média" value="4.4" color="text-yellow-500" change={3} />
      <StatCard icon={Users} label="Total de Avaliações" value={REVIEWS.length} color="text-sky-600" />
      <StatCard icon={TrendingUp} label="5 Estrelas" value={`${Math.round(REVIEWS.filter(r => r.rating === 5).length / REVIEWS.length * 100)}%`} color="text-emerald-600" />
    </div>
    <div className="space-y-4">
      {REVIEWS.map(r => (
        <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">{r.customer.split(' ').map(n => n[0]).join('')}</div>
              <div>
                <p className="font-bold text-sm">{r.customer}</p>
                <p className="text-xs text-gray-400">Pedido #{r.order} • {r.date}</p>
              </div>
            </div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} className={s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />)}
            </div>
          </div>
          <p className="text-sm text-gray-600 ml-13 pl-13">{r.comment}</p>
        </div>
      ))}
    </div>
  </div>
);

// --- Usuários e Permissões ---
const UserManagement = ({ users, setUsers, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "MANAGER", phone: "" });

  const handleSave = async () => {
    if (!form.name || !form.email || !form.password) return;
    const newUser = { ...form, id: Date.now() };
    const updatedUsers = [...users, newUser];
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "settings", "company"), { adminUsers: updatedUsers }, { merge: true });
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "MANAGER", phone: "" });
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar usuário.");
    }
  };

  const handleDelete = async (id) => {
    if (users.find(u => u.id === id)?.role === "ADMIN") return; // Cannot delete admin
    const updatedUsers = users.filter(u => u.id !== id);
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "settings", "company"), { adminUsers: updatedUsers }, { merge: true });
    } catch (e) {
      console.error(e);
      alert("Erro ao remover usuário.");
    }
  };

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
        <p className="text-gray-500">Apenas administradores podem gerenciar usuários e permissões.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários & Permissões</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie quem tem acesso ao painel do restaurante</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800">
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users.map(u => (
          <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${u.role === 'ADMIN' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {u.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{u.name}</h3>
                <p className="text-xs text-gray-500">{u.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={u.role === 'ADMIN' ? "purple" : "info"}>{u.role === 'ADMIN' ? "Administrador" : "Gerente"}</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {u.role !== 'ADMIN' && (
                <button onClick={() => handleDelete(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Remover Usuário">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Usuário">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">Nome Completo</label>
            <input className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: João Silva" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">Email</label>
            <input type="email" className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="joao@email.com" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">Telefone</label>
            <input className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(85) 9..." />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">Senha</label>
            <input type="password" className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">Nível de Acesso</label>
            <select className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="MANAGER">Gerente (Acesso Limitado)</option>
              <option value="ADMIN">Administrador (Acesso Total)</option>
            </select>
            <p className="text-[10px] text-gray-400 mt-1">Administradores têm acesso a todas as telas, inclusive gerenciar outros usuários.</p>
          </div>
          <button onClick={handleSave} className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition">
            Cadastrar Usuário
          </button>
        </div>
      </Modal>
    </div>
  );
};

// ─── Delivery-fee helpers (shared between DeliveryConfig and handleSubmitOrder) ──
const ZONE_COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2'];

/** Nominatim geocoder — returns {lat, lng, neighborhood} or null */
const geocodeAddress = async (address) => {
  try {
    const q   = encodeURIComponent(address.includes('Brasil') ? address : address + ', Brasil');
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&addressdetails=1`,
      { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'UFOBurguers/1.0' } }
    );
    const data = await res.json();
    if (data.length > 0) {
      const item = data[0];
      const addr = item.address || {};
      const neighborhood = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || null;
      return { lat: parseFloat(item.lat), lng: parseFloat(item.lon), neighborhood };
    }
  } catch (e) { console.warn('Geocode error:', e); }
  return null;
};

/** Calculate delivery fee based on customer neighborhood */
const calcDeliveryFee = (neighborhood, deliveryZones) => {
  if (!deliveryZones?.zones?.length) return deliveryZones?.baseFee ?? 0;
  if (neighborhood) {
    const name = neighborhood.toLowerCase().trim();
    for (const zone of deliveryZones.zones) {
      const match = (zone.neighborhoods || []).some(n => {
        const nLower = n.toLowerCase().trim();
        return name === nLower || name.includes(nLower) || nLower.includes(name);
      });
      if (match) return Number(zone.fee);
    }
  }
  // Not matched to any zone → use outsideZoneFee or baseFee
  return (deliveryZones.outsideZoneFee !== null && deliveryZones.outsideZoneFee !== undefined)
    ? deliveryZones.outsideZoneFee
    : (deliveryZones.baseFee ?? 0);
};

const DeliveryConfig = ({ company, setCompany }) => {
  const defaultZones = {
    zones: [
      { id: 1, name: 'Bairro Próprio', fee: 0,  neighborhoods: [] },
      { id: 2, name: 'Imediações',     fee: 2,  neighborhoods: [] },
      { id: 3, name: 'Zona Distante',  fee: 8,  neighborhoods: [] },
    ],
    outsideZoneFee: 5,
    baseFee: 5,
  };

  // Migrate legacy range-based structure if necessary
  const rawZones = company.deliveryZones;
  const initialZones = (rawZones && rawZones.zones) ? rawZones : defaultZones;

  const [zones,          setZones]          = useState(initialZones);
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [newNhInput,     setNewNhInput]     = useState({}); // { [zoneId]: string }

  /* ── zone CRUD ───────────────────────────────────────────────────── */
  const addZone = () =>
    setZones(prev => ({
      ...prev,
      zones: [...prev.zones, { id: Date.now(), name: 'Nova Zona', fee: 5, neighborhoods: [] }],
    }));

  const removeZone = (id) =>
    setZones(prev => ({ ...prev, zones: prev.zones.filter(z => z.id !== id) }));

  const updateZone = (id, field, value) =>
    setZones(prev => ({
      ...prev,
      zones: prev.zones.map(z => z.id === id ? { ...z, [field]: value } : z),
    }));

  /* ── neighborhood CRUD within a zone ────────────────────────────── */
  const addNeighborhood = (zoneId) => {
    const name = (newNhInput[zoneId] || '').trim();
    if (!name) return;
    const zone = zones.zones.find(z => z.id === zoneId);
    if (!zone) return;
    updateZone(zoneId, 'neighborhoods', [...(zone.neighborhoods || []), name]);
    setNewNhInput(prev => ({ ...prev, [zoneId]: '' }));
  };

  const removeNeighborhood = (zoneId, idx) => {
    const zone = zones.zones.find(z => z.id === zoneId);
    if (!zone) return;
    updateZone(zoneId, 'neighborhoods', zone.neighborhoods.filter((_, i) => i !== idx));
  };

  /* ── persist ─────────────────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    let finalZones = { ...zones };
    Object.entries(newNhInput).forEach(([zId, text]) => {
      const val = text?.trim();
      if (val) {
        const zIdx = finalZones.zones.findIndex(z => z.id === Number(zId));
        if (zIdx !== -1) {
          finalZones.zones[zIdx].neighborhoods = [...(finalZones.zones[zIdx].neighborhoods || []), val];
        }
      }
    });
    setNewNhInput({});

    try {
      const allFees = finalZones.zones.map(z => Number(z.fee));
      const minFee  = allFees.length > 0 ? Math.min(...allFees) : (finalZones.baseFee ?? 5);
      await setDoc(doc(db, 'settings', 'company'), {
        deliveryZones:  finalZones,
        deliveryFeeMin: minFee,
      }, { merge: true });
      setCompany(prev => ({ ...prev, deliveryZones: finalZones, deliveryFeeMin: minFee }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { alert('Erro ao salvar: ' + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-gray-900 flex items-center gap-2">
        🛵 Taxas de Entrega por Bairro
      </h4>
      <p className="text-xs text-gray-500">
        Crie zonas e adicione os bairros de cada uma. No checkout, o sistema identifica o bairro do cliente e aplica a taxa automaticamente.
      </p>

      {/* Zone cards */}
      <div className="space-y-3">
        {zones.zones.map((zone, idx) => {
          const color = ZONE_COLORS[idx % ZONE_COLORS.length];
          return (
            <div key={zone.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">

              {/* Zone header: name + fee + delete */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <input
                  className="flex-1 min-w-[120px] px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold bg-white"
                  value={zone.name}
                  onChange={e => updateZone(zone.id, 'name', e.target.value)}
                  placeholder="Nome da zona"
                />
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {Number(zone.fee) === 0 ? (
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">Grátis 🎉</span>
                  ) : (
                    <>
                      <span className="text-xs text-gray-500">R$</span>
                      <input
                        type="number" min="0" step="0.50"
                        className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-center"
                        value={zone.fee}
                        onChange={e => updateZone(zone.id, 'fee', parseFloat(e.target.value) || 0)}
                      />
                    </>
                  )}
                  <button
                    onClick={() => updateZone(zone.id, 'fee', Number(zone.fee) === 0 ? 5 : 0)}
                    className="text-[10px] px-2 py-1 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 transition flex-shrink-0"
                    title={Number(zone.fee) === 0 ? 'Definir taxa' : 'Frete grátis'}
                  >
                    {Number(zone.fee) === 0 ? '+ taxa' : 'grátis'}
                  </button>
                </div>
                <button onClick={() => removeZone(zone.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0">
                  <X size={14} />
                </button>
              </div>

              {/* Neighborhood chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {(zone.neighborhoods || []).map((n, i) => (
                  <span key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: color }}>
                    {n}
                    <button onClick={() => removeNeighborhood(zone.id, i)}
                      className="opacity-80 hover:opacity-100 transition ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {(zone.neighborhoods || []).length === 0 && (
                  <span className="text-xs text-gray-400 italic self-center">Nenhum bairro adicionado ainda</span>
                )}
              </div>

              {/* Add neighborhood input */}
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white placeholder-gray-400"
                  placeholder="Ex: Meireles, Aldeota, Papicu… (Enter para adicionar)"
                  value={newNhInput[zone.id] || ''}
                  onChange={e => setNewNhInput(prev => ({ ...prev, [zone.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addNeighborhood(zone.id)}
                />
                <button onClick={() => addNeighborhood(zone.id)}
                  className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition flex-shrink-0">
                  + Bairro
                </button>
              </div>
            </div>
          );
        })}

        {zones.zones.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-2xl">
            Nenhuma zona configurada. Clique em "Nova Zona" para começar.
          </p>
        )}
      </div>

      {/* Outside-zone fee row */}
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex-wrap gap-y-2">
        <span className="text-sm text-gray-700 flex-1 min-w-[160px]">Fora das zonas configuradas</span>
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={zones.outsideZoneFee === null}
            onChange={e => setZones(prev => ({ ...prev, outsideZoneFee: e.target.checked ? null : 5 }))}
            className="rounded"
          />
          Não atender
        </label>
        {zones.outsideZoneFee !== null && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs text-gray-500">R$</span>
            <input
              type="number" min="0" step="0.50"
              className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-center"
              value={zones.outsideZoneFee ?? 5}
              onChange={e => setZones(prev => ({ ...prev, outsideZoneFee: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={addZone}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition">
          <Plus size={15} /> Nova Zona
        </button>
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${saved ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'}`}>
          {saving
            ? <><RefreshCw size={14} className="animate-spin" /> Salvando…</>
            : saved ? <>✅ Salvo!</>
            : <>Salvar Configuração</>}
        </button>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
        <p>💡 <strong>Como funciona:</strong> quando o cliente digita o endereço no checkout, o sistema identifica o bairro via OpenStreetMap e aplica automaticamente a taxa da zona correspondente.</p>
        <p className="text-blue-500">Dica: adicione variações do nome do bairro (ex: "Centro" e "Centro Histórico") para garantir o reconhecimento correto.</p>
      </div>
    </div>
  );
};

// --- Configurações ---
const Toggle = ({ on, onToggle }) => (
  <button onClick={onToggle} className={`w-11 h-6 rounded-full transition-colors flex items-center ${on ? 'bg-gray-900 justify-end' : 'bg-gray-300 justify-start'}`}>
    <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
  </button>
);

const ConfigPage = ({ company, setCompany }) => {
  const [notif, setNotif] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [sound, setSound] = useState(true);

  // Store pause state
  const [storePaused, setStorePaused] = useState(company.storePaused || false);
  const [storePausedReason, setStorePausedReason] = useState(company.storePausedReason || '');
  const [pauseSaving, setPauseSaving] = useState(false);

  // Delivery & Menu config local state
  const [prepTime, setPrepTime] = useState(company.prepTime || '35-45 min');
  const [deliveryFeeMin, setDeliveryFeeMin] = useState(company.deliveryFeeMin ?? 4);
  const [deliveryRadius, setDeliveryRadius] = useState(company.deliveryRadius ?? 8);

  // Payment config local state
  const [pixKey, setPixKey] = useState(company.pixKey || '');
  const [pixHolder, setPixHolder] = useState(company.pixHolder || '');
  const [pixKeyType, setPixKeyType] = useState(company.pixKeyType || 'email');
  const [cardOperator, setCardOperator] = useState(company.cardOperator || '');
  const [cardCreditFee, setCardCreditFee] = useState(company.cardCreditFee ?? '');
  const [cardDebitFee, setCardDebitFee] = useState(company.cardDebitFee ?? '');
  const [infinitePayHandle, setInfinitePayHandle] = useState(company.infinitePayHandle || '');

  const toggleStorePause = async () => {
    const newPaused = !storePaused;
    setPauseSaving(true);
    try {
      await setDoc(doc(db, "settings", "company"), {
        storePaused: newPaused,
        storePausedReason: newPaused ? storePausedReason.trim() : '',
        storePausedAt: newPaused ? new Date().toISOString() : null,
      }, { merge: true });
      setStorePaused(newPaused);
      setCompany(prev => ({ ...prev, storePaused: newPaused, storePausedReason: newPaused ? storePausedReason.trim() : '' }));
      if (!newPaused) setStorePausedReason('');
    } catch (e) { console.error(e); alert("Erro ao alterar status da loja."); }
    finally { setPauseSaving(false); }
  };

  const saveDeliveryConfig = async () => {
    try {
      await setDoc(doc(db, "settings", "company"), {
        prepTime: prepTime.trim(),
      }, { merge: true });
      alert('✅ Tempo de preparo salvo!');
    } catch (e) { console.error(e); alert("Erro ao salvar."); }
  };

  const savePaymentConfig = async () => {
    try {
      await setDoc(doc(db, "settings", "company"), {
        pixKey, pixHolder, pixKeyType, cardOperator,
        cardCreditFee: Number(cardCreditFee) || 0,
        cardDebitFee: Number(cardDebitFee) || 0,
        infinitePayHandle: infinitePayHandle.trim(),
      }, { merge: true });
      alert('✅ Configurações de pagamento salvas!');
    } catch (e) { console.error(e); alert("Erro ao salvar."); }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      {/* ── Store Pause / Reopen Control ────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">🏪 Status da Loja</h3>
        <div className={`rounded-2xl border-2 p-6 space-y-4 transition-all ${
          storePaused
            ? 'bg-red-50 border-red-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          {/* Status badge + toggle */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                storePaused ? 'bg-red-100' : 'bg-emerald-100'
              }`}>
                {storePaused ? '🔴' : '🟢'}
              </div>
              <div>
                <p className={`font-bold text-lg ${
                  storePaused ? 'text-red-800' : 'text-emerald-800'
                }`}>
                  {storePaused ? 'Loja Fechada Temporariamente' : 'Loja Aberta'}
                </p>
                <p className={`text-sm ${
                  storePaused ? 'text-red-600' : 'text-emerald-600'
                }`}>
                  {storePaused
                    ? 'Pedidos online e PDV estão bloqueados'
                    : 'Funcionando no horário normal'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={toggleStorePause}
              disabled={pauseSaving}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 ${
                storePaused
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {pauseSaving
                ? <><RefreshCw size={14} className="animate-spin" /> Salvando…</>
                : storePaused
                  ? <><>🟢 Reabrir Loja</></>
                  : <><>🔴 Fechar Loja</></>
              }
            </button>
          </div>

          {/* Reason input — shown when about to close or already closed */}
          {!storePaused && (
            <div className="bg-white/70 rounded-xl p-4 space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Motivo do fechamento (opcional)</label>
              <input
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400"
                value={storePausedReason}
                onChange={e => setStorePausedReason(e.target.value)}
                placeholder="Ex: Falta de ingredientes, manutenção, evento privado..."
              />
              <p className="text-[10px] text-gray-400">Se preenchido, o motivo será exibido aos clientes no cardápio.</p>
            </div>
          )}

          {/* Currently paused info */}
          {storePaused && (
            <div className="bg-white/70 rounded-xl p-4 space-y-2">
              {company.storePausedReason && (
                <div className="flex items-start gap-2">
                  <span className="text-red-500 flex-shrink-0 mt-0.5">📝</span>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Motivo informado</p>
                    <p className="text-sm text-gray-700 mt-0.5">{company.storePausedReason}</p>
                  </div>
                </div>
              )}
              {company.storePausedAt && (
                <p className="text-[11px] text-gray-400">
                  Fechada desde: {new Date(company.storePausedAt).toLocaleString('pt-BR')}
                </p>
              )}
              <div className="mt-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Alterar motivo</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400"
                    value={storePausedReason}
                    onChange={e => setStorePausedReason(e.target.value)}
                    placeholder="Novo motivo..."
                  />
                  <button
                    onClick={async () => {
                      try {
                        await setDoc(doc(db, "settings", "company"), { storePausedReason: storePausedReason.trim() }, { merge: true });
                        setCompany(prev => ({ ...prev, storePausedReason: storePausedReason.trim() }));
                      } catch (e) { alert('Erro: ' + e.message); }
                    }}
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-700 transition flex-shrink-0"
                  >Salvar</button>
                </div>
              </div>
            </div>
          )}

          {/* How it works */}
          <div className={`rounded-xl p-3 text-xs space-y-1 ${
            storePaused ? 'bg-red-100/60 text-red-700' : 'bg-emerald-100/60 text-emerald-700'
          }`}>
            <p>💡 <strong>Como funciona:</strong> ao fechar a loja, todos os clientes verão o status "Fechado" no cardápio e não poderão fazer novos pedidos. Ao clicar em "Reabrir", o funcionamento volta ao horário programado.</p>
          </div>
        </div>
      </div>

      {/* General Toggles */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Geral</h3>
        {[
          { label: "Notificações de pedidos", desc: "Receba alertas sonoros para novos pedidos", on: notif, toggle: () => setNotif(!notif) },
          { label: "Aceitar pedidos automaticamente", desc: "Pedidos serão aceitos sem confirmação manual", on: autoAccept, toggle: () => setAutoAccept(!autoAccept) },
          { label: "Sons do sistema", desc: "Ativar sons de notificação", on: sound, toggle: () => setSound(!sound) },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
            <div><p className="font-medium text-gray-900">{s.label}</p><p className="text-sm text-gray-500">{s.desc}</p></div>
            <Toggle on={s.on} onToggle={s.toggle} />
          </div>
        ))}
      </div>

      {/* Delivery & Menu Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Truck size={16} /> Delivery & Cardápio</h3>

        {/* Prep time + banner preview */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h4 className="font-bold text-gray-900 flex items-center gap-2"><Clock size={18} /> Informações do Cardápio</h4>
          <p className="text-xs text-gray-400">Esses dados aparecem no topo do cardápio digital para seus clientes.</p>
          <div>
            <label className="text-xs text-gray-500 font-bold mb-1 block">Tempo Médio de Preparo</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={prepTime} onChange={e => setPrepTime(e.target.value)} placeholder="Ex: 35-45 min" />
            <p className="text-[10px] text-gray-400 mt-1">Exibido como "🕐 35-45 min" no banner do cardápio</p>
          </div>
          {/* Live preview */}
          <div className="bg-gray-900 rounded-xl p-4 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Preview do Banner</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <span className="text-[11px] bg-white/15 text-white px-3 py-1.5 rounded-full font-medium">🕐 {prepTime || '35-45 min'}</span>
              <span className="text-[11px] bg-white/15 text-white px-3 py-1.5 rounded-full font-medium">🛵 A partir de R$ {Number(company.deliveryFeeMin) || 0}</span>
              <span className="text-[11px] bg-white/15 text-white px-3 py-1.5 rounded-full font-medium">📍 Raio de {Number(company.deliveryRadius) || 0} km</span>
            </div>
          </div>
          <SaveButton onClick={saveDeliveryConfig} label="Salvar Tempo de Preparo" fullWidth />
        </div>

        {/* Delivery zones map config */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <DeliveryConfig company={company} setCompany={setCompany} />
        </div>
      </div>

      {/* Payment Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><DollarSign size={16} /> Pagamento</h3>

        {/* PIX Config */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h4 className="font-bold text-gray-900 flex items-center gap-2"><span className="text-lg">💠</span> Configuração PIX</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">Tipo da Chave</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={pixKeyType} onChange={e => setPixKeyType(e.target.value)}>
                <option value="email">E-mail</option>
                <option value="cpf">CPF/CNPJ</option>
                <option value="phone">Telefone</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">Chave PIX</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="Ex: email@exemplo.com" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold mb-1 block">Nome do Titular</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={pixHolder} onChange={e => setPixHolder(e.target.value)} placeholder="Ex: UFO BURGUERS LTDA" />
          </div>
        </div>

        {/* Card Config */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h4 className="font-bold text-gray-900 flex items-center gap-2"><CreditCard size={18} /> Maquininha de Cartão</h4>
          <div>
            <label className="text-xs text-gray-500 font-bold mb-1 block">Operadora</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={cardOperator} onChange={e => setCardOperator(e.target.value)} placeholder="Ex: Stone, Rede, PagSeguro, InfinitePay..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">Taxa Crédito (%)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={cardCreditFee} onChange={e => setCardCreditFee(e.target.value)} placeholder="Ex: 3.5" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">Taxa Débito (%)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={cardDebitFee} onChange={e => setCardDebitFee(e.target.value)} placeholder="Ex: 1.5" />
            </div>
          </div>
          {(cardCreditFee || cardDebitFee) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              💡 A taxa será exibida ao cliente no checkout quando ele selecionar pagamento via cartão.
            </div>
          )}
        </div>

        {/* InfinitePay Config */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"><span className="text-white text-[10px] font-black">∞</span></div>
            InfinitePay — Checkout Integrado
          </h4>
          <p className="text-xs text-gray-500">Ao configurar o InfiniteTag, o checkout do cliente será redirecionado para o InfinitePay com confirmação automática de pagamento.</p>
          <div>
            <label className="text-xs text-gray-500 font-bold mb-1 block">InfiniteTag (Handle)</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold">$</span>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" value={infinitePayHandle} onChange={e => setInfinitePayHandle(e.target.value)} placeholder="Ex: ufoburguers" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">O nome de usuário da sua conta InfinitePay (sem o $). Encontre em: app.infinitepay.io → perfil.</p>
          </div>
          {infinitePayHandle && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700">
              ✅ Checkout ativo! Clientes serão redirecionados para pagar via InfinitePay (PIX + Cartão).
            </div>
          )}
        </div>

        <SaveButton onClick={savePaymentConfig} label="Salvar Configurações de Pagamento" fullWidth />
      </div>
    </div>
  );
};

// --- Meus Links ---
const MyLinks = () => {
  const links = [
    { label: "Cardápio Digital", url: "app.cardapioweb.com/ufo_burguers", icon: UtensilsCrossed },
    { label: "Totem PDV (Balcão)", url: "ufoburguers.com.br/pdv", icon: Smartphone },
    { label: "WhatsApp Pedidos", url: "wa.me/5585999901234", icon: Phone },
    { label: "Instagram", url: "@ufo_burguers", icon: Globe },
    { label: "Google Meu Negócio", url: "g.page/ufo-burguers", icon: MapPin },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Meus Links</h1>
      <p className="text-sm text-gray-500 mb-6">Compartilhe seus links com clientes</p>
      <div className="space-y-3">
        {links.map(l => (
          <div key={l.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center"><l.icon size={18} className="text-gray-600" /></div>
              <div><p className="font-medium text-gray-900">{l.label}</p><p className="text-sm text-gray-400">{l.url}</p></div>
            </div>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Copiar</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== CUSTOMER AREA ====================
const CustomerMenu = ({ menu, company, onBack, rewards, TIERS, getTier, pointsLog, coupons, isPdvMode = false }) => {
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showRegisterIncentive, setShowRegisterIncentive] = useState(false);
  const [tempComplements, setTempComplements] = useState({});
  const [tempObs, setTempObs] = useState('');
  const [showOrders, setShowOrders] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Checkout form states
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutPayment, setCheckoutPayment] = useState("");
  const [checkoutNote, setCheckoutNote] = useState("");
  // Reset pixCopied whenever payment method changes
  // (handled inline via wrapper setters)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [showPixReminder, setShowPixReminder] = useState(false);
  const [pixReminderData, setPixReminderData] = useState(null); // { key, amount, payload, orderId }
  // Dynamic delivery fee — null means "not yet calculated"
  const [checkoutDeliveryFee, setCheckoutDeliveryFee] = useState(null);
  const [isCalcFee, setIsCalcFee] = useState(false);

  // Order tracking — persisted in localStorage
  const [trackingOrderId, setTrackingOrderId] = useState(() => {
    try { return localStorage.getItem('ufo_tracking_order') || null; } catch { return null; }
  });
  const [trackingOrder, setTrackingOrder] = useState(null);

  // Real-time driver location for customer tracking map (top-level to respect Rules of Hooks)
  const [driverLiveLocation, setDriverLiveLocation] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);

  useEffect(() => {
    const isOutForDelivery = trackingOrder?.status === "Saiu p/ Entrega";
    if (!isOutForDelivery || !trackingOrder?.assignedDriverId) {
      setDriverLiveLocation(null);
      setDriverInfo(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'drivers', trackingOrder.assignedDriverId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setDriverInfo(d);
        if (d.location?.lat) {
          setDriverLiveLocation({ lat: d.location.lat, lng: d.location.lng });
        } else {
          setDriverLiveLocation(null);
        }
      }
    });
    return () => unsub();
  }, [trackingOrder?.status, trackingOrder?.assignedDriverId]);

  
  // InfinitePay fallback states (must be top-level for hooks)
  const [payNowUrl, setPayNowUrl] = useState(null);
  const [payNowLoading, setPayNowLoading] = useState(false);

  // Reminder popup when customer leaves tracking screen
  const [showTrackingReminder, setShowTrackingReminder] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  // Persist tracking to localStorage
  // Don't remove from localStorage when reminder is active — the popup needs the ID
  useEffect(() => {
    try {
      if (trackingOrderId) localStorage.setItem('ufo_tracking_order', trackingOrderId);
      else if (!showTrackingReminder) localStorage.removeItem('ufo_tracking_order');
    } catch {}
  }, [trackingOrderId, showTrackingReminder]);

  // Auth State
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Address State
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userDBData, setUserDBData] = useState(null);

  // Phone Auth State
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Filter State
  const [filter, setFilter] = useState("Todos");
  const filtered = filter === "Todos" ? menu.filter(i => i.active) : menu.filter(i => i.category === filter && i.active);

  // Realtime Customer Orders
  const [myOrders, setMyOrders] = useState([]);

  // Gamification & Hierarchy
  const currentTier = userDBData ? getTier(userDBData.lifetimePoints || 0) : null;
  const tierDiscountRaw = currentTier ? (currentTier.discount || 0) : 0;
  const freeDelivery = currentTier?.freeDelivery || false;
  // Effective display fee: uses live geocoded value when available, falls back to config minimum
  const displayDeliveryFee = freeDelivery ? 0 : (checkoutDeliveryFee ?? company.deliveryFeeMin ?? 0);

  // Realtime tracking for a specific order
  useEffect(() => {
    if (!trackingOrderId) return;
    const unsub = onSnapshot(doc(db, "orders", trackingOrderId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setTrackingOrder(prev => {
          if (prev && prev.status !== data.status && !isPdvMode) {
            const title = "UFO Burguers";
            const options = {
              body: `Seu pedido #${data.id.slice(-4)} atualizou para: ${data.status} 🚀`
            };
            if ("Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification(title, options);
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                  if (permission === "granted") new Notification(title, options);
                });
              }
            }
          }
          return data;
        });
      } else {
        // Order doesn't exist (deleted or invalid ID) — clear tracking
        console.warn("Tracked order not found:", trackingOrderId);
        setTrackingOrderId(null);
        setTrackingOrder(null);
      }
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingOrderId]);

  // PDV Auto-Reset
  useEffect(() => {
    if (isPdvMode && trackingOrderId) {
      const timer = setTimeout(() => {
        setTrackingOrderId(null);
        setTrackingOrder(null);
        setCart([]);
        setShowCart(false);
        setShowCheckout(false);
        setCheckoutPayment('');
        setCheckoutNote('');
        setCheckoutName('');
        setCheckoutPhone('');
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [isPdvMode, trackingOrderId]);

  // Handle InfinitePay payment redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const orderId = params.get('order_id') || trackingOrderId;
    
    if (paymentStatus === 'success' && orderId) {
      // Clean URL safely
      window.history.replaceState({}, '', window.location.pathname);
      try { localStorage.setItem('ufo_tracking_order', orderId); } catch {}
      
      const confirmOrder = async () => {
        try {
          const orderRef = doc(db, "orders", orderId);
          const snap = await getDoc(orderRef);
          if (snap.exists() && snap.data().status === "Aguardando Pagamento") {
            await updateDoc(orderRef, {
              status: "Confirmado",
              paymentConfirmedAt: serverTimestamp(),
              paymentMethod: params.get('capture_method') || 'infinitepay',
              receiptUrl: params.get('receipt_url') || ''
            });
          }
        } catch (e) { console.error("Error confirming order:", e); }
      };
      confirmOrder();
      setTrackingOrderId(orderId);
      setCart([]);
      setShowCart(false);
      setShowCheckout(false);
    } else if (trackingOrderId && !trackingOrder) {
      // Recovery fallback via ID only
      const confirmIfPending = async () => {
        try {
          const orderRef = doc(db, "orders", trackingOrderId);
          const orderSnap = await getDoc(orderRef);
          if (orderSnap.exists() && orderSnap.data().status === "Aguardando Pagamento") {
            await updateDoc(orderRef, {
              status: "Confirmado",
              paymentConfirmedAt: serverTimestamp(),
              paymentMethod: 'infinitepay'
            });
          }
        } catch (e) { console.error("Recovery confirm error:", e); }
      };
      confirmIfPending();
      setCart([]);
      setShowCart(false);
      setShowCheckout(false);
    }
  }, []);

  // Pre-fill checkout from profile
  useEffect(() => {
    if (authUser) {
      setCheckoutName(authUser.displayName || "");
      if (customerPhone) setCheckoutPhone(customerPhone);
      if (customerAddress) setCheckoutAddress(customerAddress);
    }
  }, [authUser, customerPhone, customerAddress]);

  // Auto-calculate delivery fee when address changes (debounced 700ms)
  useEffect(() => {
    setCheckoutDeliveryFee(null);
    if (!checkoutAddress || !company.deliveryZones || freeDelivery) return;
    const timer = setTimeout(async () => {
      setIsCalcFee(true);
      const geo = await geocodeAddress(checkoutAddress);
      if (geo) {
        setCheckoutDeliveryFee(calcDeliveryFee(geo.neighborhood, company.deliveryZones));
      } else {
        setCheckoutDeliveryFee(company.deliveryZones?.baseFee ?? company.deliveryFeeMin ?? 0);
      }
      setIsCalcFee(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [checkoutAddress, company.deliveryZones, freeDelivery]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authUser || !authUser.email) return;
    const unsubOrders = onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
      (snap) => {
        const _orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyOrders(_orders.filter(o => o.email === authUser.email));
      }
    );
    return () => unsubOrders();
  }, [authUser]);
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Register or update customer in Firestore
      const customerRef = doc(db, "customers", user.uid);
      await setDoc(customerRef, {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        lastLogin: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error("Login failed", e);
      alert("Houve um problema para fazer login com o Google.");
    }
  };

  const saveProfile = async () => {
    if (!authUser) return;
    try {
      const isNewInfo = !userDBData?.phone && !userDBData?.address;
      const initialPts = isNewInfo && (!userDBData?.points) ? 50 : 0;

      await setDoc(doc(db, "customers", authUser.uid), {
        phone: customerPhone,
        address: customerAddress,
        ...(initialPts > 0 && { points: (userDBData?.points || 0) + initialPts, lifetimePoints: (userDBData?.lifetimePoints || 0) + initialPts })
      }, { merge: true });

      if (initialPts > 0) {
        await addDoc(collection(db, "points_log"), {
          userId: authUser.uid,
          userName: authUser.displayName || 'Cliente',
          points: initialPts,
          type: 'bonus',
          description: 'Bônus de Boas-vindas',
          status: 'confirmado',
          createdAt: serverTimestamp()
        });
      }

      setIsEditingProfile(false);
      alert("Perfil atualizado com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar perfil", e);
      alert("Erro ao salvar perfil.");
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
  };

  const handlePhoneLogin = async () => {
    if (!phoneInput) return alert("Digite um número de telefone válido.");
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      // Phone number must be in E.164 format, e.g., +5585999999999
      const formattedPhone = phoneInput.startsWith('+') ? phoneInput : `+55${phoneInput.replace(/\D/g, '')}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      alert("Código enviado! Verifique seu SMS.");
    } catch (error) {
      console.error("Phone Auth Error", error);
      alert("Erro ao enviar SMS. Verifique o formato (+55 DDD Numero)");
    }
  };

  const verifyPhoneCode = async () => {
    if (!verificationCode || !confirmationResult) return;
    try {
      const result = await confirmationResult.confirm(verificationCode);
      const user = result.user;
      const customerRef = doc(db, "customers", user.uid);
      await setDoc(customerRef, {
        name: user.displayName || phoneInput,
        phone: user.phoneNumber,
        lastLogin: new Date().toISOString()
      }, { merge: true });
      setConfirmationResult(null);
      setShowPhoneLogin(false);
    } catch (error) {
      console.error("Code Verification Error", error);
      alert("Código inválido.");
    }
  };

  // Load profile when auth user changes
  useEffect(() => {
    if (!authUser) return;
    const unsub = onSnapshot(doc(db, "customers", authUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserDBData(data);
        if (data.phone) setCustomerPhone(data.phone);
        if (data.address) setCustomerAddress(data.address);
      }
    });
    return () => unsub();
  }, [authUser]);

  const handleLogout = () => signOut(auth);

  const checkIsOpen = () => {
    // If store is manually paused by admin, always return false
    if (company.storePaused) return false;
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    if (day >= 1 && day <= 4) return hour >= 19 && hour < 22;
    return hour >= 18 && hour < 23;
  };
  const [isOpen, setIsOpen] = useState(checkIsOpen());

  useEffect(() => {
    // Re-check immediately when storePaused changes
    setIsOpen(checkIsOpen());
    const interval = setInterval(() => setIsOpen(checkIsOpen()), 60000);
    return () => clearInterval(interval);
  }, [company.storePaused]);

  const categories = ["Todos", ...new Set(menu.filter(i => i.active).map(i => i.category))];

  const addToCart = (item, complements = {}, observation = '') => {
    // Block adding items when store is paused
    if (company.storePaused) {
      return alert('⛔ A loja está fechada temporariamente. Não é possível adicionar itens.');
    }
    const extrasTotal = Object.values(complements).flat().reduce((s, o) => s + (o.price || 0), 0);
    const cartId = item.id + '_' + JSON.stringify(complements) + '_' + observation;
    setCart(prev => {
      const exists = prev.find(c => c.cartId === cartId);
      if (exists) return prev.map(c => c.cartId === cartId ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1, cartId, selectedComplements: complements, observation, extrasTotal }];
    });
  };
  // Smart add: if item has required complement groups, open the modal instead of adding directly
  const handleAddOrOpen = (item, e) => {
    if (e) e.stopPropagation();
    const hasRequired = (item.complements || []).some(g => g.required);
    const hasAnyComplements = (item.complements || []).length > 0;
    if (hasRequired || hasAnyComplements) {
      setSelectedItem(item);
      setTempComplements({});
      setTempObs('');
    } else {
      addToCart(item);
    }
  };
  const removeFromCart = (cartId) => setCart(prev => prev.map(c => c.cartId === cartId ? { ...c, qty: c.qty - 1 } : c).filter(c => c.qty > 0));
  const cartTotal = cart.reduce((s, c) => s + (c.price + (c.extrasTotal || 0)) * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);


  // Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = () => {
    setCouponError("");
    if (!couponInput) return;
    const code = couponInput.toUpperCase().trim();
    // Support both boolean true and string "true" for the active field
    const found = coupons?.find(c => c.code === code && (c.active === true || c.active === 'true'));

    if (!found) {
      setCouponError("Cupom inválido ou inativo.");
      setAppliedCoupon(null);
      return;
    }
    // Check expiration date
    if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
      setCouponError("Este cupom está expirado.");
      setAppliedCoupon(null);
      return;
    }
    if (Number(found.minOrder) > 0 && cartTotal < Number(found.minOrder)) {
      setCouponError(`Pedido mínimo para este cupom é R$ ${Number(found.minOrder).toFixed(2)}`);
      setAppliedCoupon(null);
      return;
    }
    if (Number(found.limit) > 0 && (found.used || 0) >= Number(found.limit)) {
      setCouponError("Este cupom já atingiu o limite de usos.");
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(found);
    setCouponError("Cupom aplicado com sucesso! ✨");
    setTimeout(() => setCouponError(""), 3000);
  };

  const getFinalTotal = () => {
    let base = cartTotal;
    // Apply Tier
    base = base - (base * (tierDiscountRaw / 100));
    // Apply Coupon
    if (appliedCoupon) {
      if (appliedCoupon.type === 'PERCENT') {
        base = base - (base * (appliedCoupon.discount / 100));
      } else {
        base = base - appliedCoupon.discount;
      }
    }
    return Math.max(0, base);
  };

  // Submit order to Firestore
  const handleSubmitOrder = async () => {
    // Block orders when store is manually paused
    if (company.storePaused) {
      return alert("⛔ A loja está fechada temporariamente. Tente novamente mais tarde.");
    }
    if (isPdvMode) {
      if (!checkoutName) return alert("Preencha o nome do cliente.");
    } else {
      if (!checkoutName || !checkoutPhone || !checkoutAddress) {
        return alert("Preencha nome, telefone e endereço.");
      }
    }
    if (!checkoutPayment) {
      return alert("Selecione uma forma de pagamento.");
    }
    setIsSubmitting(true);
    try {
      const now = new Date();

      let totalDiscount = cartTotal * (tierDiscountRaw / 100);
      let couponValue = 0;
      if (appliedCoupon) {
        let afterTier = cartTotal - totalDiscount;
        if (appliedCoupon.type === 'PERCENT') {
          couponValue = afterTier * (appliedCoupon.discount / 100);
        } else {
          couponValue = appliedCoupon.discount;
        }
        totalDiscount += couponValue;
      }

      const dateStr = now.toLocaleDateString('en-CA');
      const counterRef = doc(db, "system", "daily_orders_" + dateStr);

      let orderSeq = 1;
      try {
        orderSeq = await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(counterRef);
          let newSeq = 1;
          if (counterDoc.exists()) {
            newSeq = (counterDoc.data().seq || 0) + 1;
          }
          transaction.set(counterRef, { seq: newSeq, date: dateStr }, { merge: true });
          return newSeq;
        });
      } catch (err) {
        console.error("Error auto-incrementing ID:", err);
        orderSeq = Math.floor(Math.random() * 1000);
      }

      // Dynamic delivery fee: use already-calculated state; recalculate only if still null
      let resolvedDeliveryFee = (freeDelivery || isPdvMode) ? 0 : (checkoutDeliveryFee ?? company.deliveryFeeMin ?? 0);
      if (!freeDelivery && !isPdvMode && checkoutDeliveryFee === null && company.deliveryZones) {
        const geo = await geocodeAddress(checkoutAddress);
        resolvedDeliveryFee = calcDeliveryFee(geo?.neighborhood ?? null, company.deliveryZones);
      }

      // Card fee calculation
      let cardFee = 0;
      let cardFeePercent = 0;
      if (checkoutPayment === 'Cartão Crédito') {
        cardFeePercent = company.cardCreditFee || 0;
      } else if (checkoutPayment === 'Cartão Débito') {
        cardFeePercent = company.cardDebitFee || 0;
      }
      const baseTotal = getFinalTotal() + resolvedDeliveryFee;
      cardFee = baseTotal * (cardFeePercent / 100);

      const orderData = {
        customer: checkoutName,
        phone: isPdvMode ? "PDV/Totem" : checkoutPhone,
        address: isPdvMode ? "Retirada no Balcão" : checkoutAddress,
        type: isPdvMode ? "Balcão" : "Delivery",
        email: authUser?.email || '',
        items: cart.map(c => ({ name: c.name, price: c.price, qty: c.qty, image: c.image || '', selectedComplements: c.selectedComplements || {}, observation: c.observation || '', extrasTotal: c.extrasTotal || 0 })),
        payment: checkoutPayment,
        note: checkoutNote,
        status: checkoutPayment === 'Pagar Online' ? 'Aguardando Pagamento' : 'Novo',
        deliveryFee: resolvedDeliveryFee,
        subtotal: cartTotal,
        discountGiven: totalDiscount,
        couponApplied: appliedCoupon ? appliedCoupon.code : null,
        cardFee: cardFee,
        cardFeePercent: cardFeePercent,
        total: baseTotal + cardFee,
        date: now.toLocaleDateString('pt-BR'),
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp(),
        dailyId: orderSeq,
        ...(checkoutPayment === 'Pagar Online' ? { paymentDeadline: new Date(Date.now() + 5 * 60 * 1000).toISOString() } : {})
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);

      // Auto-deduct inventory for orders that don't require online payment
      // (online-payment orders are deducted when the webhook confirms payment)
      if (orderData.status !== 'Aguardando Pagamento') {
        deductInventoryForOrder(docRef.id, orderData.items);
      }

      if (appliedCoupon) {
        await updateDoc(doc(db, "coupons", appliedCoupon.id), { used: (appliedCoupon.used || 0) + 1 });
      }

      // Earn points logic (1 pt per R$ 1 spent on final total excluding delivery)
      // Wrapped in its own try/catch — points are non-critical and must not block order submission
      if (authUser?.uid) {
        try {
          const earnedPts = Math.floor(getFinalTotal());
          if (earnedPts > 0) {
            // Use setDoc with merge:true instead of updateDoc — updateDoc throws if the
            // document does not exist yet (e.g. new users), which was causing the outer
            // catch to fire and show "Erro ao enviar pedido" for logged-in users.
            await setDoc(doc(db, "customers", authUser.uid), {
              points: (userDBData?.points || 0) + earnedPts,
              lifetimePoints: (userDBData?.lifetimePoints || 0) + earnedPts
            }, { merge: true });
            await addDoc(collection(db, "points_log"), {
              userId: authUser.uid,
              userName: checkoutName,
              points: earnedPts,
              type: 'ganho',
              description: `Pedido ${getDisplayOrderId({ id: docRef.id, dailyId: orderSeq })} (${earnedPts} pts)`,
              status: 'confirmado',
              createdAt: serverTimestamp()
            });
          }
        } catch (ptErr) {
          // Non-critical: log the error but do not interrupt order flow
          console.error("Erro ao registrar pontos (não-crítico):", ptErr);
        }
      }

      // InfinitePay checkout redirect — only for "Pagar Online"
      if (checkoutPayment === 'Pagar Online' && company.infinitePayHandle) {
        try {
          const itemsList = cart.map(c => ({
            description: `${c.name}${c.qty > 1 ? ' x' + c.qty : ''}`,
            quantity: 1,
            price: Math.round((c.price + (c.extrasTotal || 0)) * c.qty * 100) // centavos
          }));
          // Add delivery fee
          if (orderData.deliveryFee > 0) {
            itemsList.push({ description: "Taxa de Entrega", quantity: 1, price: Math.round(orderData.deliveryFee * 100) });
          }
          // Adjust for discount by reducing first item
          if (orderData.discountGiven > 0) {
            const discountCents = Math.round(orderData.discountGiven * 100);
            if (itemsList.length > 0 && itemsList[0].price > discountCents) {
              itemsList[0].price -= discountCents;
              itemsList[0].description += ` (desc. -R$${orderData.discountGiven.toFixed(2)})`;
            }
          }

          const currentUrl = window.location.origin + window.location.pathname;
          const redirectUrl = `${currentUrl}?payment=success&order_id=${docRef.id}`;
          const handle = company.infinitePayHandle.trim();

          // Call Cloud Function to create checkout link via InfinitePay API
          // This is the correct way — avoids CORS and works on ALL browsers/devices
          let checkoutUrl = null;
          try {
            const cfResponse = await fetch('https://us-central1-ufob-delivery-app-542.cloudfunctions.net/createCheckoutLink', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                handle,
                items: itemsList.filter(i => i.price > 0),
                order_nsu: docRef.id,
                redirect_url: redirectUrl,
              }),
            });
            const cfData = await cfResponse.json();
            console.log('InfinitePay API response:', cfData);
            checkoutUrl = cfData.url || cfData.link || cfData.checkout_url || null;
          } catch (apiErr) {
            console.error('Cloud Function API error (falling back to direct URL):', apiErr);
          }

          // Fallback: build URL manually if API call failed
          if (!checkoutUrl) {
            const params = new URLSearchParams();
            params.set('items', JSON.stringify(itemsList.filter(i => i.price > 0).map(i => ({ name: i.description, quantity: i.quantity, price: i.price }))));
            params.set('order_nsu', docRef.id);
            params.set('redirect_url', redirectUrl);
            checkoutUrl = `https://checkout.infinitepay.io/${handle}?${params.toString()}`;
            console.log('Using fallback checkout URL');
          }

          console.log('Final checkout URL:', checkoutUrl);

          // Save order ID before redirect.
          // Wrapped in try/catch: localStorage is blocked in Safari Private Browsing
          // and throws SecurityError — must not prevent the payment redirect.
          try { localStorage.setItem('ufo_tracking_order', docRef.id); } catch (_) {}

          // Use window.location.assign for better mobile browser compatibility
          // (some mobile browsers block window.location.href inside async handlers)
          window.location.assign(checkoutUrl);
          return;
        } catch (err) {
          console.error("InfinitePay error:", err);
          alert('Erro ao gerar link de pagamento. Tente novamente ou escolha outra forma de pagamento.\n\nDetalhes: ' + err.message);
        }
      }

      setTrackingOrderId(docRef.id);
      setTrackingOrder({ id: docRef.id, ...orderData });
      setShowCheckout(false);

      // If PIX, show the post-order PIX reminder popup
      if (checkoutPayment === 'PIX') {
        const total = baseTotal; // already computed above
        const pixPayload = company.pixKey
          ? generatePixPayload(company.pixKey, company.pixKeyType || 'email', company.pixHolder || company.name, total)
          : null;
        setPixReminderData({
          key: company.pixKey || 'ufoburguers51@gmail.com',
          amount: total,
          payload: pixPayload,
          orderId: docRef.id,
        });
        setShowPixReminder(true);
      }
    } catch (e) {
      console.error("Erro ao enviar pedido:", e);
      alert(`Erro ao enviar pedido. Tente novamente.\n\nDetalhes: ${e?.message || 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==== TRACKING SCREEN ====
  const TRACKING_STEPS = [
    { key: "Novo", label: "Enviado", icon: "⏳", desc: "Aguardando confirmação do restaurante" },
    { key: "Confirmado", label: "Pedido Aceito", icon: "✅", desc: "Seu pedido foi recebido e confirmado" },
    { key: "Preparando", label: "Preparando", icon: "👨‍🍳", desc: "Estamos preparando seu pedido" },
    { key: "Saiu p/ Entrega", label: "Saiu para Entrega", icon: "🛵", desc: "Seu pedido está a caminho" },
    { key: "Entregue", label: "Entregue", icon: "📦", desc: "Pedido entregue com sucesso!" },
  ];

  // Loading state while tracking order data is being fetched from Firestore
  if (trackingOrderId && !trackingOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl text-center">
          <div className="w-20 h-20 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-4xl">🛸</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Carregando seu pedido...</h2>
          <p className="text-sm text-gray-400">Aguarde um instante enquanto buscamos as informações do seu pedido.</p>
          <div className="mt-6 flex justify-center">
            <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }
  if (trackingOrderId && trackingOrder) {
    if (isPdvMode) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-4">
          <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col items-center justify-center">
            <div className="bg-white rounded-[3rem] p-12 w-full shadow-2xl border border-gray-100 text-center relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
              
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                <CheckCircle size={48} strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Pedido Realizado!</h2>
              <p className="text-xl text-gray-500 mb-10">Aguarde o chamado pelo seu número.</p>
              
              <div className="bg-gray-50 rounded-3xl p-8 mb-10 border-2 border-dashed border-gray-200">
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-3">Anota aí a sua senha</p>
                <p className="text-8xl font-black text-emerald-600 tabular-nums">#{trackingOrder.id.slice(-4)}</p>
              </div>
              
              <button 
                onClick={() => {
                  setTrackingOrderId(null); setTrackingOrder(null); setCart([]); setShowCart(false); setShowCheckout(false); setCheckoutPayment(''); setCheckoutNote(''); setCheckoutName(''); setCheckoutPhone(''); setFilter("Todos");
                }} 
                className="w-full py-6 text-2xl font-black rounded-2xl shadow-xl uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-2xl hover:-translate-y-1 transition-all"
              >
                Concluir & Novo Pedido
              </button>
            </div>
            <p className="text-gray-400 font-medium text-lg mt-8 text-center px-8">O totem retornará à tela inicial automaticamente em instantes para o próximo cliente.</p>
          </div>
        </div>
      );
    }

    const currentStatus = trackingOrder.status;
    const statusIndex = TRACKING_STEPS.findIndex(s => s.key === currentStatus || (s.key === "Novo" && currentStatus === "Aguardando Confirmação"));
    const isDelivered = currentStatus === "Entregue";
    const isCancelled = currentStatus === "Cancelado";
    const isPendingPayment = currentStatus === "Aguardando Pagamento";
    const isOutForDelivery = currentStatus === "Saiu p/ Entrega";
    const orderItems = trackingOrder.items || [];
    const orderTotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0) + (trackingOrder.deliveryFee || 0);



    // Payment countdown timer component
    const PaymentCountdown = () => {
      const [timeLeft, setTimeLeft] = useState(0);
      useEffect(() => {
        if (!trackingOrder.paymentDeadline) return;
        const deadline = new Date(trackingOrder.paymentDeadline).getTime();
        const tick = () => {
          const remaining = Math.max(0, deadline - Date.now());
          setTimeLeft(remaining);
          if (remaining <= 0) {
            // Auto-cancel
            updateDoc(doc(db, "orders", trackingOrderId), { status: "Cancelado", cancelReason: "Pagamento não realizado em 5 minutos" }).catch(console.error);
          }
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
      }, []);
      const mins = Math.floor(timeLeft / 60000);
      const secs = Math.floor((timeLeft % 60000) / 1000);
      const pct = trackingOrder.paymentDeadline ? Math.max(0, timeLeft / (5 * 60 * 1000)) * 100 : 0;
      return (
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-3xl font-black text-violet-700 tabular-nums">{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</p>
            <p className="text-[10px] text-gray-400 mt-1">para realizar o pagamento</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${pct > 30 ? 'bg-violet-500' : pct > 10 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }}></div>
          </div>
        </div>
      );
    };

    // Rebuild InfinitePay checkout URL for "Pagar Agora" button
    // Uses Cloud Function API for reliability across all browsers

    const handlePayNow = async () => {
      if (!company.infinitePayHandle) return;
      setPayNowLoading(true);
      try {
        const itemsList = orderItems.map(c => ({
          description: `${c.name}${c.qty > 1 ? ' x' + c.qty : ''}`,
          quantity: 1,
          price: Math.round((c.price + (c.extrasTotal || 0)) * c.qty * 100)
        }));
        if (trackingOrder.deliveryFee > 0) {
          itemsList.push({ description: "Taxa de Entrega", quantity: 1, price: Math.round(trackingOrder.deliveryFee * 100) });
        }
        const currentUrl = window.location.origin + window.location.pathname;
        const redirectUrl = `${currentUrl}?payment=success&order_id=${trackingOrderId}`;

        let checkoutUrl = null;
        try {
          const cfResponse = await fetch('https://us-central1-ufob-delivery-app-542.cloudfunctions.net/createCheckoutLink', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              handle: company.infinitePayHandle.trim(),
              items: itemsList.filter(i => i.price > 0),
              order_nsu: trackingOrderId,
              redirect_url: redirectUrl,
            }),
          });
          const cfData = await cfResponse.json();
          checkoutUrl = cfData.url || cfData.link || cfData.checkout_url || null;
        } catch (apiErr) {
          console.error('Cloud Function API error (falling back):', apiErr);
        }

        // Fallback to manual URL if API failed
        if (!checkoutUrl) {
          const params = new URLSearchParams();
          params.set('items', JSON.stringify(itemsList.filter(i => i.price > 0).map(i => ({ name: i.description, quantity: i.quantity, price: i.price }))));
          params.set('order_nsu', trackingOrderId);
          params.set('redirect_url', redirectUrl);
          checkoutUrl = `https://checkout.infinitepay.io/${company.infinitePayHandle.trim()}?${params.toString()}`;
        }

        // Use assign for mobile compatibility
        window.location.assign(checkoutUrl);
      } catch (err) {
        console.error('Pay now error:', err);
        alert('Erro ao gerar link de pagamento. Tente novamente.');
      } finally {
        setPayNowLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl relative">
          <button 
            onClick={() => {
              const isActiveOrder = !isDelivered && !isCancelled;
              if (isActiveOrder) {
                setShowTrackingReminder(true);
                setReminderDismissed(false);
              }
              setTrackingOrderId(null); setTrackingOrder(null); setCart([]); setShowCart(false); setShowCheckout(false); setCheckoutPayment(''); setCheckoutNote('');
            }}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition"
          >
            <X size={18} />
          </button>
          
          {/* Header */}
          <div className="text-center mb-6 mt-2">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 ${isDelivered ? 'bg-emerald-50' : isCancelled ? 'bg-red-50' : isPendingPayment ? 'bg-violet-50' : 'bg-amber-50'}`}>
              <span className="text-4xl">{isDelivered ? '🎉' : isCancelled ? '❌' : isPendingPayment ? '💳' : '🛸'}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {isDelivered ? 'Pedido Entregue!' : isCancelled ? 'Pedido Cancelado' : isPendingPayment ? 'Aguardando Pagamento' : 'Acompanhe seu Pedido'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">Pedido {getDisplayOrderId(trackingOrder)}</p>
            {!isDelivered && !isCancelled && !isPendingPayment && <p className="text-xs text-gray-400 mt-1">Tempo estimado: 35-45 min</p>}
          </div>

          {/* Pending Payment Screen */}
          {isPendingPayment && (
            <div className="mb-6 space-y-4">
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
                <PaymentCountdown />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-700 font-medium">⚠️ Seu pedido será cancelado automaticamente se o pagamento não for realizado.</p>
              </div>
              {company.infinitePayHandle && (
                <button onClick={handlePayNow} disabled={payNowLoading}
                  className="w-full py-3.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] text-sm disabled:opacity-60 disabled:cursor-wait">
                  {payNowLoading ? (
                    <><RefreshCw size={18} className="animate-spin" /> Gerando link...</>
                  ) : (
                    <><CreditCard size={18} /> Pagar Agora</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Timeline */}
          {!isCancelled && !isPendingPayment && (
            <div className="mb-6">
              {TRACKING_STEPS.map((step, idx) => {
                const isActive = idx <= statusIndex;
                const isCurrent = idx === statusIndex;
                return (
                  <div key={step.key} className="flex gap-3">
                    {/* Line + Dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${isActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50'
                        } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}>
                        {step.icon}
                      </div>
                      {idx < TRACKING_STEPS.length - 1 && (
                        <div className={`w-0.5 h-10 ${isActive ? 'bg-emerald-400' : 'bg-gray-200'}`}></div>
                      )}
                    </div>
                    {/* Text */}
                    <div className="pt-2">
                      <p className={`text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                      <p className={`text-xs ${isActive ? 'text-gray-500' : 'text-gray-300'}`}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Live Map — only when "Saiu p/ Entrega" */}
          {isOutForDelivery && (
            <div className="mb-5">
              {/* Driver banner */}
              <div className="flex items-center gap-3 mb-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                  {driverInfo?.name ? driverInfo.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '🛵'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{driverInfo?.name || 'Entregador'} está a caminho!</p>
                  <p className="text-xs text-gray-500">{driverInfo?.vehicle || 'Moto'} · {driverLiveLocation ? 'GPS ativo' : 'Localizando...'}</p>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ufo-live-dot ${driverLiveLocation ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
              </div>
              {/* Map */}
              <LiveTrackingMap
                variant="customer"
                driverLocation={driverLiveLocation}
                customerAddress={trackingOrder.address}
                driverName={driverInfo?.name || 'Entregador'}
                orderId={getDisplayOrderId(trackingOrder)}
                height={240}
              />
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Resumo do Pedido</h4>
            {orderItems.map((c, i) => <div key={i} className="flex justify-between text-sm py-1"><span className="text-gray-600">{c.qty}x {c.name}</span><span className="font-medium">R$ {(c.price * c.qty).toFixed(2)}</span></div>)}
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-xs text-gray-400"><span>Taxa de entrega</span><span>R$ 5,00</span></div>
            <div className="flex justify-between font-bold mt-1"><span>Total</span><span>R$ {orderTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Pagamento</span><span className="font-medium text-gray-600">{trackingOrder.payment}</span></div>
          </div>

          {/* PIX Payment Confirmation */}
          {trackingOrder.payment === 'PIX' && currentStatus !== 'Entregue' && !isCancelled && (
            <div className="space-y-2 mb-3">
              {currentStatus === 'Novo' ? (
                <>
                  <button onClick={async () => {
                    try {
                      await updateDoc(doc(db, "orders", trackingOrderId), { status: "Aguardando Confirmação", paymentConfirmedByClient: true });
                      setTrackingOrder(prev => ({ ...prev, status: "Aguardando Confirmação", paymentConfirmedByClient: true }));
                    } catch (e) { console.error(e); }
                  }}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-md active:scale-[0.98]">
                    <CheckCircle size={18} /> Já Paguei via PIX
                  </button>
                  <a href={`https://wa.me/${company.whatsapp || '5585999999999'}?text=${encodeURIComponent(`Olá! Segue o comprovante do meu pedido #${trackingOrderId.slice(-6).toUpperCase()}. Pagamento via PIX no valor de R$ ${orderTotal.toFixed(2)}. 🛸`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full py-2.5 bg-white border border-emerald-300 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition flex items-center justify-center gap-2">
                    📱 Enviar Comprovante via WhatsApp
                  </a>
                </>
              ) : trackingOrder.paymentConfirmedByClient ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-700 text-sm font-medium">
                  <CheckCircle size={16} /> Pagamento confirmado — aguardando aprovação da loja
                </div>
              ) : null}
            </div>
          )}

          {/* Actions */}
          <button onClick={() => {
            const isActiveOrder = !isDelivered && !isCancelled;
            if (isActiveOrder) {
              // Show reminder popup instead of immediately clearing
              setShowTrackingReminder(true);
              setReminderDismissed(false);
            }
            setTrackingOrderId(null); setTrackingOrder(null); setCart([]); setShowCart(false); setShowCheckout(false); setCheckoutPayment(''); setCheckoutNote('');
          }}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition">Fazer Novo Pedido</button>
        </div>
      </div>
    );
  }


  // Group items by category for section rendering
  const activeCategories = [...new Set(filtered.map(i => i.category))];

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Tracking Reminder Popup — shows when customer leaves tracking with an active order */}
      {showTrackingReminder && !reminderDismissed && (() => {
        // Check if the tracked order is still active from localStorage
        const savedOrderId = (() => { try { return localStorage.getItem('ufo_tracking_order'); } catch { return null; } })();
        if (!savedOrderId) return null;
        return (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-[calc(100%-2rem)] animate-[slideDown_0.4s_ease-out]">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl p-4 shadow-2xl shadow-emerald-900/30 border border-emerald-500/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <span className="text-lg">📦</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">Pedido em andamento!</p>
                  <p className="text-xs text-emerald-100 mt-0.5">Você tem um pedido ativo. Deseja voltar a acompanhar?</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setReminderDismissed(true); setShowTrackingReminder(false); }}
                  className="p-1 rounded-lg hover:bg-white/20 transition flex-shrink-0 -mt-1 -mr-1">
                  <X size={16} />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => {
                  setTrackingOrderId(savedOrderId);
                  setShowTrackingReminder(false);
                  setReminderDismissed(false);
                }}
                  className="flex-1 py-2 bg-white text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-50 transition active:scale-[0.98]">
                  🔍 Acompanhar Pedido
                </button>
                <button onClick={() => { setReminderDismissed(true); setShowTrackingReminder(false); try { localStorage.removeItem('ufo_tracking_order'); } catch {} }}
                  className="py-2 px-3 bg-white/15 text-white rounded-xl text-xs font-medium hover:bg-white/25 transition backdrop-blur-sm">
                  Dispensar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Header Banner Area */}
      <div className="text-white relative pb-16">
        {/* Banner Background Image */}
        {company.banner ? (
          <div className="absolute inset-0 overflow-hidden">
            <img src={company.banner} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-600 to-red-500"></div>
        )}
        {/* Top Bar */}
        <div className={`${isPdvMode ? 'max-w-7xl px-8' : 'max-w-lg px-4'} mx-auto pt-4 relative z-10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {!isPdvMode && <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/10 transition" title="Voltar"><ArrowLeft size={20} /></button>}
              {!isPdvMode && (
                <button onClick={() => setShowOrders(true)} className="p-2 rounded-lg hover:bg-white/10 transition" title="Minha Conta">
                  {authUser && authUser.photoURL ? (
                    <img src={authUser.photoURL} alt="User" className="w-7 h-7 rounded-full border-2 border-white/50" />
                  ) : (
                    <User size={20} />
                  )}
                </button>
              )}
            </div>
            <button onClick={() => setShowCart(true)} className="p-2 rounded-lg hover:bg-white/10 transition relative">
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-red-900 rounded-full text-xs flex items-center justify-center font-bold">{cartCount}</span>}
            </button>
          </div>
        </div>

        {/* Banner Info */}
        <div className={`${isPdvMode ? 'max-w-7xl px-8' : 'max-w-lg px-4'} mx-auto mt-4 text-center relative z-10`}>
          <p className="text-xs text-white/70 uppercase tracking-widest font-medium">Bem-vindo ao</p>
          <h1 className="text-2xl font-extrabold mt-1 tracking-tight drop-shadow-lg">{company.name} 🛸🍔</h1>
          <p className="text-sm text-white/80 mt-1 max-w-xs mx-auto">{company.description || 'Hambúrgueres artesanais de outro mundo!'}</p>
          <div className="flex gap-2 mt-4 justify-center flex-wrap">
            <span className="text-[11px] bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full font-medium">🕐 {company.prepTime || '35-45 min'}</span>
            <span className="text-[11px] bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full font-medium">🛵 A partir de R$ {company.deliveryFeeMin ?? 4}</span>
            <span className={`text-[11px] px-3 py-1.5 rounded-full font-bold backdrop-blur-sm ${isOpen ? 'bg-emerald-500/90 text-white' : 'bg-red-900/60 text-red-200'}`}>
              {isOpen ? '✅ Aberto agora' : company.storePaused ? '⛔ Fechado temporariamente' : '🔴 Fechado'}
            </span>
          </div>
        </div>

        {/* Round Logo floating at bottom center of banner */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10">
          <div className="w-20 h-20 rounded-full bg-white shadow-lg border-4 border-white flex items-center justify-center overflow-hidden">
            {company.logoImage ? (
              <img src={company.logoImage} alt={company.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{company.logo || '🛸'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Content below header */}
      <div className={`${isPdvMode ? 'max-w-7xl px-8' : 'max-w-lg px-4'} mx-auto pt-14`}>

        {/* Store Temporarily Closed Banner */}
        {company.storePaused && (
          <div className="mb-6 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-lg">
                ⛔
              </div>
              <div>
                <p className="font-bold text-base">Estamos fechados no momento</p>
                {company.storePausedReason ? (
                  <p className="text-sm text-white/90 mt-1">{company.storePausedReason}</p>
                ) : (
                  <p className="text-sm text-white/80 mt-1">Voltaremos em breve! Fique de olho 👀</p>
                )}
                <p className="text-[11px] text-white/60 mt-2 flex items-center gap-1">
                  🔔 O cardápio está disponível para consulta, mas pedidos estão suspensos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Categories horizontal scroll */}
        <div className={`flex gap-3 overflow-x-auto pb-4 mb-6 no-scrollbar ${isPdvMode ? 'sticky top-4 z-20 bg-white/90 py-3 backdrop-blur shadow-sm rounded-full px-3' : ''}`}>
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-all ${isPdvMode ? 'text-lg' : 'text-sm'} ${filter === c ? 'bg-red-600 text-white shadow-lg scale-105' : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Popular section */}
        {filter === "Todos" && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base"><Flame size={18} className="text-orange-500" /> Populares</h3>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {menu.filter(i => i.popular && i.active).map(item => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                <div key={item.id} onClick={() => { setSelectedItem(item); setTempComplements({}); setTempObs(''); }} className={`flex-shrink-0 bg-white border border-gray-100 overflow-hidden shadow-sm card-hover cursor-pointer flex flex-col ${isPdvMode ? 'w-56 rounded-3xl' : 'w-40 rounded-2xl'}`}>
                  <ProductImage photo={item.photo} emoji={item.image} size={isPdvMode ? "colossal" : "card"} className={`rounded-none ${isPdvMode ? 'rounded-t-3xl' : 'rounded-t-2xl'}`} />
                  <div className={`p-3 flex-1 flex flex-col ${isPdvMode ? 'p-4' : ''}`}>
                    <p className={`font-bold truncate ${isPdvMode ? 'text-base text-center text-gray-900' : 'text-sm'}`}>{item.name}</p>
                    <div className={`mt-auto flex flex-col ${isPdvMode ? 'items-center pt-2' : ''}`}>
                      <p className={`font-bold text-gray-900 ${isPdvMode ? 'text-lg' : 'text-sm mt-1'}`}>R$ {item.price.toFixed(2)}</p>
                      {inCart && isPdvMode ? (
                        <div className="mt-2 flex items-center justify-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                          <button onClick={() => removeFromCart(inCart.cartId)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition"><Minus size={16} /></button>
                          <span className="text-base font-bold w-6 text-center">{inCart.qty}</span>
                          <button onClick={(e) => handleAddOrOpen(item, e)} className="w-8 h-8 btn-primary rounded-lg flex items-center justify-center"><Plus size={16} /></button>
                        </div>
                      ) : (
                        <button onClick={(e) => handleAddOrOpen(item, e)} className={`mt-2 w-full py-1.5 btn-primary text-xs font-semibold shadow-sm ${isPdvMode ? 'rounded-xl py-2 text-sm uppercase tracking-wide px-3' : 'rounded-lg'}`}>Adicionar</button>
                      )}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}

        {/* Items grouped by category */}
        <div className="pb-28">
          {activeCategories.map(cat => {
            const catItems = filtered.filter(i => i.category === cat);
            return (
              <div key={cat} className="mb-6">
                {/* Category section header */}
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-bold text-gray-900 text-base whitespace-nowrap">{cat}</h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{catItems.length} {catItems.length === 1 ? 'item' : 'itens'}</span>
                </div>
                <div className={isPdvMode ? "grid grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                  {catItems.map(item => {
                    const inCart = cart.find(c => c.id === item.id);
                    if (isPdvMode) {
                      return (
                        <div key={item.id} onClick={() => { setSelectedItem(item); setTempComplements({}); setTempObs(''); }} className="bg-white rounded-3xl border border-gray-100 flex flex-col shadow-sm card-hover cursor-pointer overflow-hidden p-4">
                          <div className="flex justify-center mb-4">
                            <ProductImage photo={item.photo} emoji={item.image} size="colossal" className="rounded-2xl shadow-sm" />
                          </div>
                          <div className="flex-1 flex flex-col">
                            <div className="flex justify-center mb-2 flex-wrap gap-1">
                              {item.tag === "RECOMENDADO" && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-sm font-bold">RECOMENDADO</span>}
                              {item.tag === "MAIS PEDIDO" && <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-sm font-bold">MAIS PEDIDO</span>}
                              {item.tag === "PROMO" && <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-sm font-bold">PROMO</span>}
                              {item.tag === "NOVO" && <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-sm font-bold">NOVO</span>}
                              {item.tag === "EXCLUSIVO" && <span className="text-[9px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-sm font-bold">EXCLUSIVO</span>}
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 leading-tight text-center mb-1">{item.name}</h3>
                            <p className="text-xs text-gray-400 line-clamp-3 text-center flex-1">{item.description}</p>
                            <div className="mt-4 flex flex-col items-center gap-3">
                              <div className="flex flex-col items-center">
                                {item.originalPrice && <span className="text-xs text-gray-400 line-through">R$ {item.originalPrice.toFixed(2)}</span>}
                                <span className={`font-black text-2xl ${item.originalPrice ? 'text-red-600' : 'text-gray-900'}`}>R$ {item.price.toFixed(2)}</span>
                              </div>
                              {inCart ? (
                                <div className="flex items-center gap-3 w-full justify-center bg-gray-50 rounded-xl p-1" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => removeFromCart(inCart.cartId)} className="w-10 h-10 bg-white shadow-sm rounded-lg flex items-center justify-center hover:bg-gray-100 transition"><Minus size={18} /></button>
                                  <span className="text-lg font-bold w-8 text-center">{inCart.qty}</span>
                                  <button onClick={(e) => handleAddOrOpen(item, e)} className="w-10 h-10 btn-primary rounded-lg flex items-center justify-center"><Plus size={18} /></button>
                                </div>
                              ) : (
                                <button onClick={(e) => handleAddOrOpen(item, e)} className="w-full py-3.5 btn-primary rounded-xl text-sm font-bold shadow-sm uppercase tracking-wide">Adicionar</button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={item.id} onClick={() => { setSelectedItem(item); setTempComplements({}); setTempObs(''); }} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 shadow-sm card-hover cursor-pointer">
                        <ProductImage photo={item.photo} emoji={item.image} size="lg" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-semibold text-sm text-gray-900 leading-snug">{item.name}</h3>
                            {item.tag === "RECOMENDADO" && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-sm font-bold">RECOMENDADO</span>}
                            {item.tag === "MAIS PEDIDO" && <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-sm font-bold">MAIS PEDIDO</span>}
                            {item.tag === "PROMO" && <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-sm font-bold">PROMO</span>}
                            {item.tag === "NOVO" && <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-sm font-bold">NOVO</span>}
                            {item.tag === "EXCLUSIVO" && <span className="text-[9px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-sm font-bold">EXCLUSIVO</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1.5">
                              {item.originalPrice && <span className="text-xs text-gray-400 line-through">R$ {item.originalPrice.toFixed(2)}</span>}
                              <span className={`font-bold text-[15px] ${item.originalPrice ? 'text-red-600' : 'text-gray-900'}`}>R$ {item.price.toFixed(2)}</span>
                            </div>
                            {inCart ? (
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <button onClick={() => removeFromCart(inCart.cartId)} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition"><Minus size={15} /></button>
                                <span className="text-sm font-bold w-5 text-center">{inCart.qty}</span>
                                <button onClick={(e) => handleAddOrOpen(item, e)} className="w-8 h-8 btn-primary rounded-xl flex items-center justify-center"><Plus size={15} /></button>
                              </div>
                            ) : (
                              <button onClick={(e) => handleAddOrOpen(item, e)} className="px-4 py-2 btn-primary rounded-xl text-xs font-semibold shadow-sm">Adicionar</button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Menu */}
        {!isPdvMode && (
          <div className="mt-8 mb-12 bg-black rounded-[2rem] pt-10 pb-8 px-6 text-center text-gray-300 shadow-2xl">
            <h3 className="font-black text-white text-xl">{company.name}</h3>
            <p className="text-sm mt-1.5 mb-6 text-gray-400">{company.description || 'Hambúrgueres artesanais de outro mundo!'}</p>
            
            <div className="flex flex-col items-center gap-2.5 mb-6 text-sm font-medium">
              <span className="flex items-center gap-2 justify-center"><MapPin size={16} className="text-red-500" /> {company.address}</span>
              <span className="flex items-center gap-2 justify-center"><Phone size={16} className="text-red-500" /> {company.phone}</span>
            </div>
            
            {company.whatsapp && (
              <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-[#1ebd5a] transition active:scale-[0.98] shadow-md mt-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                Falar pelo WhatsApp
              </a>
            )}
            
            <p className="text-xs text-gray-500 mt-12 uppercase tracking-[0.2em] font-black flex items-center justify-center gap-1.5 opacity-80">
              Powered by ROMARIO UFO 🛸
            </p>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedItem && (() => {
        const hasComplements = (selectedItem.complements || []).length > 0;

        const handleRadio = (groupId, option) => {
          setTempComplements(prev => ({ ...prev, [groupId]: [option] }));
        };
        const handleCheckbox = (groupId, option, maxSel) => {
          setTempComplements(prev => {
            const curr = prev[groupId] || [];
            const exists = curr.find(o => o.id === option.id);
            if (exists) return { ...prev, [groupId]: curr.filter(o => o.id !== option.id) };
            if (curr.length >= maxSel) return prev;
            return { ...prev, [groupId]: [...curr, option] };
          });
        };

        const extrasTotal = Object.values(tempComplements).flat().reduce((s, o) => s + (o.price || 0), 0);
        const totalWithExtras = selectedItem.price + extrasTotal;

        const allRequiredFilled = (selectedItem.complements || []).filter(g => g.required).every(g => {
          const selected = tempComplements[g.id] || [];
          return selected.length >= (g.min || 1);
        });

        const inCart = cart.find(c => c.id === selectedItem.id);

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(50px)', WebkitBackdropFilter: 'blur(50px)' }} onClick={() => setSelectedItem(null)}>
            <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Large Image */}
              <div className="relative">
                <ProductImage photo={selectedItem.photo} emoji={selectedItem.image} size="card" className="rounded-none rounded-t-3xl sm:rounded-t-3xl aspect-[16/10]" />
                <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition">
                  <X size={18} className="text-gray-700" />
                </button>
                {selectedItem.tag && (
                  <div className="absolute top-4 left-4">
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-sm ${selectedItem.tag === 'RECOMENDADO' ? 'bg-emerald-500 text-white' :
                      selectedItem.tag === 'MAIS PEDIDO' ? 'bg-red-500 text-white' :
                        selectedItem.tag === 'PROMO' ? 'bg-amber-500 text-white' :
                          selectedItem.tag === 'NOVO' ? 'bg-blue-500 text-white' :
                            selectedItem.tag === 'EXCLUSIVO' ? 'bg-violet-500 text-white' :
                              'bg-gray-500 text-white'
                      }`}>{selectedItem.tag}</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">{selectedItem.name}</h2>
                    <p className="text-xs text-gray-400 mt-1">{selectedItem.category}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {selectedItem.originalPrice && <p className="text-sm text-gray-400 line-through">R$ {selectedItem.originalPrice.toFixed(2)}</p>}
                    <p className={`text-xl font-bold ${selectedItem.originalPrice ? 'text-red-600' : 'text-gray-900'}`}>R$ {selectedItem.price.toFixed(2)}</p>
                  </div>
                </div>

                {/* Full Description */}
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Descrição</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedItem.description || 'Sem descrição disponível.'}</p>
                </div>

                {/* Complement Groups */}
                {hasComplements && (
                  <div className="mt-4 space-y-4">
                    {(selectedItem.complements || []).map(group => {
                      const selected = tempComplements[group.id] || [];
                      return (
                        <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-gray-900">{group.name}</h4>
                              <p className="text-[10px] text-gray-400">
                                {group.type === 'radio' ? 'Escolha 1 opção' : `Escolha ${group.min || 0} a ${group.max || 'várias'} opções`}
                              </p>
                            </div>
                            {group.required && <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-bold">Obrigatório</span>}
                          </div>
                          <div className="divide-y divide-gray-100">
                            {group.options.map(opt => {
                              const isSelected = selected.some(s => s.id === opt.id);
                              return (
                                <button key={opt.id}
                                  onClick={() => group.type === 'radio' ? handleRadio(group.id, opt) : handleCheckbox(group.id, opt, group.max || 99)}
                                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${isSelected ? 'bg-gray-900/5' : 'hover:bg-gray-50'}`}>
                                  <div className={`w-5 h-5 flex-shrink-0 rounded-${group.type === 'radio' ? 'full' : 'md'} border-2 flex items-center justify-center transition ${isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}>
                                    {isSelected && <CheckCircle size={12} className="text-white" />}
                                  </div>
                                  <span className="flex-1 text-sm font-medium text-gray-700">{opt.name}</span>
                                  {opt.price > 0 && <span className="text-xs font-bold text-gray-500">+R$ {opt.price.toFixed(2)}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Observation */}
                <div className="mt-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Observação</label>
                  <textarea className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                    rows={2} value={tempObs} onChange={e => setTempObs(e.target.value)}
                    placeholder="Ex: Sem cebola, ponto da carne mal passado..." />
                </div>

                {/* Add to Cart Controls */}
                <div className="mt-5">
                  {extrasTotal > 0 && (
                    <div className="flex items-center justify-between mb-3 text-sm">
                      <span className="text-gray-500">Base: R$ {selectedItem.price.toFixed(2)} + Extras: R$ {extrasTotal.toFixed(2)}</span>
                      <span className="font-bold text-gray-900">R$ {totalWithExtras.toFixed(2)}</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (hasComplements && !allRequiredFilled) return alert('Preencha os complementos obrigatórios.');
                      addToCart(selectedItem, tempComplements, tempObs);
                      setSelectedItem(null);
                    }}
                    disabled={hasComplements && !allRequiredFilled}
                    className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-base transition ${hasComplements && !allRequiredFilled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'btn-primary'}`}>
                    <Plus size={18} /> Adicionar à Sacola — R$ {totalWithExtras.toFixed(2)}
                  </button>
                </div>

                {/* See more items */}
                <button onClick={() => setSelectedItem(null)} className="w-full mt-3 py-3 text-gray-500 font-semibold text-sm hover:bg-gray-50 rounded-xl transition">
                  ← Ver mais itens
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sticky Bottom Bar — Cart summary + Active order tracking */}
      {!showCart && !showCheckout && (
        <div className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]">
          <div className={`${isPdvMode ? 'max-w-7xl px-8' : 'max-w-lg px-4'} mx-auto pb-4 space-y-2`}>
            {/* Active Order Tracking Button */}
            {trackingOrderId && trackingOrder && !showCart && (
              <button onClick={() => { setShowCart(false); setShowCheckout(false); }}
                className="w-full bg-emerald-600 text-white rounded-2xl p-3.5 flex items-center justify-between shadow-xl hover:bg-emerald-700 transition active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <span className="text-sm">📦</span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium opacity-80">Pedido em andamento</p>
                    <p className="text-sm font-bold">{trackingOrder.status}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">Acompanhar →</span>
              </button>
            )}
            {/* Cart Summary Bar */}
            {cartCount > 0 && (
              <button onClick={() => setShowCart(true)} className="w-full btn-primary rounded-2xl p-4 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-3">
                  <ShoppingBag size={20} />
                  <span className="bg-white/25 px-2.5 py-1 rounded-lg text-sm font-bold backdrop-blur-sm">{cartCount}</span>
                  <span className="font-medium text-[15px]">Ver Sacola</span>
                </div>
                <span className="font-bold text-lg">R$ {cartTotal.toFixed(2)}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} onClick={() => setShowCart(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className={`${isPdvMode ? 'max-w-3xl' : 'max-w-lg'} mx-auto p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={20} className="text-gray-700" />
                  <h3 className="text-lg font-bold">Sua Sacola</h3>
                </div>
                <button onClick={() => setShowCart(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
              </div>
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag size={48} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">Sacola vazia</p>
                  <p className="text-xs text-gray-300 mt-1">Adicione itens do cardápio</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cart.map(c => (
                      <div key={c.cartId || c.id} className="flex items-start gap-3">
                        {c.isReward ? (
                          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl shrink-0"><Gift className="text-orange-500" size={20} /></div>
                        ) : (
                          <ProductImage photo={c.photo} emoji={c.image} size="xs" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate flex items-center gap-1.5">{c.name} {c.isReward && <Badge variant="warning" className="text-[9px] px-1 py-0 shadow-sm leading-none pt-0.5">PRÊMIO</Badge>}</p>
                          {c.selectedComplements && Object.values(c.selectedComplements).flat().length > 0 && (
                            <p className="text-[10px] text-gray-400 truncate">
                              {Object.values(c.selectedComplements).flat().map(o => o.name).join(', ')}
                            </p>
                          )}
                          {c.observation && <p className="text-[10px] text-gray-400 italic truncate">Obs: {c.observation}</p>}
                          <p className={`text-sm font-bold ${c.isReward ? 'text-orange-500 text-xs' : ''}`}>{c.isReward ? 'GRÁTIS' : `R$ ${((c.price + (c.extrasTotal || 0)) * c.qty).toFixed(2)}`}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => removeFromCart(c.cartId || c.id)} className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.isReward ? 'bg-red-50 text-red-500' : 'bg-gray-100 hover:bg-gray-200'}`}><Minus size={14} /></button>
                          <span className="text-sm font-bold w-5 text-center">{c.qty}</span>
                          {!c.isReward && <button onClick={() => addToCart(c, c.selectedComplements || {}, c.observation || '')} className="w-7 h-7 bg-gray-900 text-white rounded-lg flex items-center justify-center"><Plus size={14} /></button>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <div className="flex justify-between font-bold text-lg pt-2"><span>Subtotal (sem entrega)</span><span>R$ {cartTotal.toFixed(2)}</span></div>
                  </div>
                  {company.storePaused ? (
                    <div className="w-full mt-4 py-4 bg-red-100 text-red-600 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm">
                      ⛔ Loja fechada temporariamente — pedidos suspensos
                    </div>
                  ) : (
                    <button onClick={() => {
                      if (!authUser) {
                        setShowCart(false);
                        setShowRegisterIncentive(true);
                      } else {
                        setShowCart(false);
                        setShowCheckout(true);
                      }
                    }}
                      className="w-full mt-4 py-4 btn-primary rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg">
                      <Send size={18} /> Finalizar Pedido
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registration Incentive Modal */}
      {showRegisterIncentive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} onClick={() => setShowRegisterIncentive(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 text-white text-center relative">
              <button onClick={() => setShowRegisterIncentive(false)} className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition"><X size={18} /></button>
              <div className="text-4xl mb-2">🛸</div>
              <h2 className="text-xl font-black tracking-tight">Cadastre-se e Ganhe!</h2>
              <p className="text-red-200 text-sm mt-1">Faça parte da tripulação UFO Burguers</p>
            </div>
            {/* Benefits */}
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Gift size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-800">50 Pontos de Bônus</p>
                  <p className="text-xs text-amber-600">Ganhe 50 pontos na hora ao se cadastrar!</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Crown size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">Descontos Exclusivos</p>
                  <p className="text-xs text-emerald-600">Até 20% OFF conforme seu nível de fidelidade</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-sky-50 border border-sky-200 rounded-xl p-3">
                <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck size={20} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-sky-800">Acompanhe seus Pedidos</p>
                  <p className="text-xs text-sky-600">Rastreie em tempo real, acumule pontos a cada compra</p>
                </div>
              </div>

              {/* Google Login */}
              <button onClick={async () => {
                try {
                  await signInWithPopup(auth, googleProvider);
                  setShowRegisterIncentive(false);
                  setShowCheckout(true);
                } catch (e) { console.error(e); }
              }} className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition active:scale-[0.98] shadow-lg mt-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Cadastrar com Google
              </button>

              {/* Skip */}
              <button onClick={() => { setShowRegisterIncentive(false); setShowCheckout(true); }}
                className="w-full py-2.5 text-gray-500 text-xs font-medium hover:text-gray-700 transition">
                Continuar sem cadastro →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout — Full-screen drawer with sticky submit button */}
      {showCheckout && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} onClick={() => setShowCheckout(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Finalizar Pedido</h3>
              <button onClick={() => setShowCheckout(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition"><X size={18} /></button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Nome</label>
            <input className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="Seu nome completo" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} />
          </div>
          {!isPdvMode && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Telefone</label>
              <input className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="(85) 99999-9999" value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} />
            </div>
          )}
          {!isPdvMode && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Endereço de Entrega</label>
              <input className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="Rua, número, bairro" value={checkoutAddress} onChange={e => setCheckoutAddress(e.target.value)} />
            </div>
          )}

          {/* Payment Methods */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Forma de Pagamento</label>
            {isPdvMode ? (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button onClick={() => { setCheckoutPayment('PIX'); setPixCopied(false); }}
                  className={`py-3 px-2 border-2 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-1 ${checkoutPayment === 'PIX' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <span className="text-lg">💠</span>
                  <span className="text-xs">PIX</span>
                  <span className="text-[9px] font-normal text-gray-400 leading-tight text-center">QR Code Balcão</span>
                </button>
                <button onClick={() => setCheckoutPayment('Cartão Crédito')}
                  className={`py-3 px-2 border-2 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-1 ${checkoutPayment.startsWith('Cartão') ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <CreditCard size={18} />
                  <span className="text-xs">Cartão</span>
                  <span className="text-[9px] font-normal text-gray-400 leading-tight text-center">Na maquineta</span>
                </button>
                <button onClick={() => setCheckoutPayment('Dinheiro')}
                  className={`py-3 px-2 border-2 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-1 ${checkoutPayment === 'Dinheiro' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <span className="text-lg">💵</span>
                  <span className="text-xs">Dinheiro</span>
                  <span className="text-[9px] font-normal text-gray-400 leading-tight text-center">No caixa</span>
                </button>
              </div>
            ) : (
              <div className={`grid ${company.infinitePayHandle ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mt-2`}>
                <button onClick={() => { setCheckoutPayment('PIX'); setPixCopied(false); }}
                  className={`py-3 px-2 border-2 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-1 ${checkoutPayment === 'PIX' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <span className="text-lg">💠</span>
                  <span className="text-xs">PIX</span>
                  <span className="text-[9px] font-normal text-gray-400 leading-tight text-center">Copia e Cola</span>
                </button>
                <button onClick={() => setCheckoutPayment('Cartão Crédito')}
                  className={`py-3 px-2 border-2 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-1 ${checkoutPayment.startsWith('Cartão') ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <CreditCard size={18} />
                  <span className="text-xs">Cartão</span>
                  <span className="text-[9px] font-normal text-gray-400 leading-tight text-center">Na entrega</span>
                </button>
                {company.infinitePayHandle && (
                  <button onClick={() => setCheckoutPayment('Pagar Online')}
                    className={`py-3 px-2 border-2 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-1 ${checkoutPayment === 'Pagar Online' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <Smartphone size={18} />
                    <span className="text-xs">Online</span>
                    <span className="text-[9px] font-normal text-gray-400 leading-tight text-center">PIX ou Cartão</span>
                  </button>
                )}
              </div>
            )}

            {/* Card Sub-options: Crédito / Débito (only for physical card) */}
            {checkoutPayment.startsWith('Cartão') && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setCheckoutPayment('Cartão Crédito')}
                    className={`py-2.5 px-3 border-2 rounded-xl text-xs font-bold transition-all ${checkoutPayment === 'Cartão Crédito' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                    Crédito {company.cardCreditFee > 0 && <span className="text-[10px] font-normal">(+{company.cardCreditFee}%)</span>}
                  </button>
                  <button onClick={() => setCheckoutPayment('Cartão Débito')}
                    className={`py-2.5 px-3 border-2 rounded-xl text-xs font-bold transition-all ${checkoutPayment === 'Cartão Débito' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                    Débito {company.cardDebitFee > 0 && <span className="text-[10px] font-normal">(+{company.cardDebitFee}%)</span>}
                  </button>
                </div>
                {(() => {
                  const fee = checkoutPayment === 'Cartão Crédito' ? (company.cardCreditFee || 0) : (company.cardDebitFee || 0);
                  const baseTotal = getFinalTotal() + displayDeliveryFee;
                  const feeAmount = baseTotal * (fee / 100);
                  if (fee > 0) return (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700">Taxa {checkoutPayment === 'Cartão Crédito' ? 'crédito' : 'débito'} ({fee}%)</span>
                        <span className="font-bold text-blue-700">+ R$ {feeAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1 pt-1 border-t border-blue-200">
                        <span className="text-blue-800 font-bold">Total com taxa</span>
                        <span className="font-black text-blue-800">R$ {(baseTotal + feeAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                  return null;
                })()}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-sm text-blue-700 font-medium">💳 Aceitamos {checkoutPayment === 'Cartão Crédito' ? 'Crédito' : 'Débito'} na entrega</p>
                  {company.cardOperator && <p className="text-[10px] text-blue-500 mt-0.5">Operadora: {company.cardOperator}</p>}
                  <p className="text-[10px] text-blue-500 mt-0.5">O entregador levará a maquininha.</p>
                </div>
              </div>
            )}

            {/* Online Payment Info (InfinitePay) */}
            {checkoutPayment === 'Pagar Online' && (
              <div className="mt-3 bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <Smartphone size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-violet-800">Pagamento Online Seguro</p>
                    <p className="text-[11px] text-violet-600">Pague com PIX ou Cartão de forma segura</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-violet-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle size={14} className="text-emerald-500" /> <span>Pagamento via <b>InfinitePay</b> — 100% seguro</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle size={14} className="text-emerald-500" /> <span>Pague com PIX, Crédito ou Débito</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle size={14} className="text-emerald-500" /> <span>Confirmação automática do pedido</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-violet-200 text-center">
                  <p className="text-[10px] text-gray-400 uppercase">Valor a pagar</p>
                  <p className="text-2xl font-black text-violet-700">R$ {(getFinalTotal() + displayDeliveryFee).toFixed(2)}</p>
                </div>
                <p className="text-[10px] text-violet-500 text-center">Ao finalizar, você será redirecionado para a página de pagamento seguro.</p>
              </div>
            )}

            {/* PIX Info with Copia e Cola — Enhanced prominent block */}
            {checkoutPayment === 'PIX' && (() => {
              const pixTotal = getFinalTotal() + displayDeliveryFee;
              const pixPayload = company.pixKey
                ? generatePixPayload(company.pixKey, company.pixKeyType || 'email', company.pixHolder || company.name, pixTotal)
                : null;
              const pixDisplayKey = company.pixKey || 'ufoburguers51@gmail.com';
              return (
                <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: pixCopied ? '2px solid #10b981' : '2px solid #f59e0b', boxShadow: pixCopied ? '0 0 0 4px rgba(16,185,129,0.12)' : '0 0 0 4px rgba(245,158,11,0.15)', transition: 'all 0.4s ease' }}>
                  {/* Attention header */}
                  <div className={`px-4 py-3 flex items-center gap-2 ${pixCopied ? 'bg-emerald-600' : 'bg-amber-500'}`} style={{ transition: 'background 0.4s' }}>
                    <span className="text-xl">{pixCopied ? '✅' : '⚠️'}</span>
                    <div className="flex-1">
                      <p className="text-white font-black text-sm tracking-wide">
                        {pixCopied ? 'Ótimo! Agora faça o pagamento no seu banco' : 'ATENÇÃO — Copie a chave e pague o PIX!'}
                      </p>
                      <p className="text-white/80 text-[11px]">
                        {pixCopied ? 'Após pagar, clique em "Confirmar Pedido" abaixo.' : 'Seu pedido só será processado após o pagamento.'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-emerald-50 p-4 space-y-3">
                    {/* Valor */}
                    <div className="bg-white rounded-xl p-3 border border-emerald-200 text-center">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Valor a pagar via PIX</p>
                      <p className="text-3xl font-black text-emerald-700">R$ {pixTotal.toFixed(2)}</p>
                      {(company.pixHolder || company.pixKey) && (
                        <p className="text-[11px] text-gray-500 mt-1">Titular: <b className="text-gray-700">{company.pixHolder || 'UFO BURGUERS'}</b></p>
                      )}
                    </div>

                    {/* Chave PIX visível */}
                    <div className="bg-white rounded-xl border border-emerald-200 p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Chave PIX</p>
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-sm font-mono font-bold text-gray-800 break-all">{pixDisplayKey}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(pixDisplayKey);
                            setPixCopied(true);
                          }}
                          className="shrink-0 p-2 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition" title="Copiar chave">
                          <Copy size={15} className="text-emerald-600" />
                        </button>
                      </div>
                    </div>

                    {/* Copia e Cola payload */}
                    {pixPayload && (
                      <div className="space-y-2">
                        <div className="bg-white rounded-xl px-3 py-2 border border-emerald-200">
                          <p className="text-[10px] text-gray-400 mb-1">Código PIX Copia e Cola</p>
                          <p className="text-[10px] text-gray-500 font-mono break-all leading-tight">{pixPayload.substring(0, 80)}...</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(pixPayload);
                            setPixCopied(true);
                          }}
                          className={`w-full py-3.5 rounded-xl text-sm font-black transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-md ${pixCopied ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
                          {pixCopied
                            ? <><CheckCircle size={18} /> Código copiado! Abra seu banco e pague</>
                            : <><Copy size={18} /> Copiar Código PIX — R$ {pixTotal.toFixed(2)}</>}
                        </button>
                      </div>
                    )}

                    {/* WhatsApp comprovante */}
                    <a href={`https://wa.me/${company.whatsapp || '5585999999999'}?text=${encodeURIComponent('Olá! Fiz um pedido via PIX e gostaria de enviar o comprovante de pagamento. 🛸')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-full py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-800 transition flex items-center justify-center gap-2">
                      📱 Enviar Comprovante via WhatsApp
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Observações</label>
            <textarea className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none" rows={2} placeholder="Sem cebola, troco para..." value={checkoutNote} onChange={e => setCheckoutNote(e.target.value)} />
          </div>

          {/* Coupon Input */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2 block">Possui um cupom?</label>
            <div className="relative">
              <input
                className="w-full px-4 py-2.5 pr-24 border border-gray-200 rounded-lg text-sm uppercase font-mono tracking-widest outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                placeholder="Ex: UFO10"
                value={couponInput}
                onChange={e => setCouponInput(e.target.value)}
                disabled={appliedCoupon !== null}
              />
              {appliedCoupon ? (
                <button onClick={() => { setAppliedCoupon(null); setCouponInput(''); setCouponError(''); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-xs font-bold hover:bg-gray-200 transition">Remover</button>
              ) : (
                <button onClick={handleApplyCoupon} className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-bold shadow-md hover:bg-red-700 transition">Aplicar</button>
              )}
            </div>
            {couponError && <p className={`text-xs mt-2 font-medium ${couponError.includes('sucesso') ? 'text-emerald-600' : 'text-red-500'}`}>{couponError}</p>}
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>R$ {cartTotal.toFixed(2)}</span></div>
            {tierDiscountRaw > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-bold"><span className="flex items-center gap-1"><Zap size={14} /> Desconto {currentTier?.name} ({tierDiscountRaw}%)</span><span>- R$ {(cartTotal * (tierDiscountRaw / 100)).toFixed(2)}</span></div>
            )}
            {appliedCoupon && (
              <div className="flex justify-between text-sm text-emerald-600 font-bold"><span className="flex items-center gap-1"><Ticket size={14} /> Cupom {appliedCoupon.code}</span><span>- R$ {
                (appliedCoupon.type === 'PERCENT' ? (cartTotal - cartTotal * (tierDiscountRaw / 100)) * (appliedCoupon.discount / 100) : appliedCoupon.discount).toFixed(2)
              }</span></div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Entrega</span>
              <span className={freeDelivery ? "text-blue-500 font-bold" : ""}>
                {freeDelivery ? "Grátis" : isCalcFee ? <span className="text-gray-400 italic text-xs">Calculando…</span> : `R$ ${displayDeliveryFee.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200 mt-1 items-end">
              <span>Total</span>
              <div className="text-right">
                <span className="block text-xl">R$ {(getFinalTotal() + displayDeliveryFee).toFixed(2)}</span>
                {authUser?.uid && <span className="block text-[11px] font-semibold text-orange-500 mt-0.5">Ganhe {Math.floor(getFinalTotal())} pontos!</span>}
              </div>
            </div>
          </div>

          {/* Spacer so content doesn't hide behind sticky button */}
          <div className="h-2" />
            </div>

            {/* Sticky Submit Button — Always visible at the bottom */}
            <div className="flex-shrink-0 border-t border-gray-100 bg-white p-4 safe-area-bottom">
              {/* PIX warning strip when not yet copied */}
              {checkoutPayment === 'PIX' && !pixCopied && (
                <div className="mb-3 flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-xl px-3 py-2">
                  <span className="text-amber-500 text-lg">⚠️</span>
                  <p className="text-xs text-amber-700 font-semibold flex-1">Copie a chave PIX acima antes de confirmar!</p>
                </div>
              )}
              <button
                onClick={async () => {
                  if (checkoutPayment === 'PIX' && !pixCopied) {
                    const ok = window.confirm(
                      '⚠️ Você ainda não copiou a chave PIX!\n\nSeu pedido será registrado, mas ele só será processado após o pagamento via PIX.\n\nDeseja confirmar mesmo assim?'
                    );
                    if (!ok) return;
                  }
                  await handleSubmitOrder();
                }}
                disabled={isSubmitting}
                className="w-full py-4 btn-primary rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-base">
                {isSubmitting ? (
                  <><RefreshCw size={18} className="animate-spin" /> Enviando...</>
                ) : checkoutPayment === 'PIX' && !pixCopied ? (
                  <><Copy size={18} /> Confirmar Pedido (sem copiar PIX) — R$ {(getFinalTotal() + displayDeliveryFee).toFixed(2)}</>
                ) : (
                  <><Send size={18} /> Confirmar Pedido — R$ {(getFinalTotal() + displayDeliveryFee).toFixed(2)}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PIX PAYMENT REMINDER MODAL (shown after order is placed with PIX) ===== */}
      {showPixReminder && pixReminderData && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white text-center relative">
              <div className="text-5xl mb-2">💠</div>
              <h2 className="text-xl font-black">Falta só o pagamento!</h2>
              <p className="text-white/85 text-sm mt-1">Seu pedido foi registrado. Agora faça o PIX para confirmar.</p>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Valor destacado */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Valor a pagar via PIX</p>
                <p className="text-4xl font-black text-emerald-700 my-1">R$ {pixReminderData.amount.toFixed(2)}</p>
                <p className="text-[11px] text-gray-500">Pague exatamente este valor</p>
              </div>

              {/* Chave PIX */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Chave PIX</p>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <span className="flex-1 font-mono font-bold text-gray-800 text-sm break-all">{pixReminderData.key}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(pixReminderData.key); }}
                    className="shrink-0 p-2 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition">
                    <Copy size={16} className="text-emerald-600" />
                  </button>
                </div>
              </div>

              {/* Copia e cola button */}
              {pixReminderData.payload && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pixReminderData.payload);
                  }}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-700 active:scale-[0.98] transition">
                  <Copy size={20} /> Copiar Código PIX Copia e Cola
                </button>
              )}

              {/* Steps */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Como pagar:</p>
                {['Copie o código acima', 'Abra o app do seu banco', 'Escolha PIX → Copia e Cola', 'Cole e confirme o pagamento'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-xs text-gray-600">{step}</span>
                  </div>
                ))}
              </div>

              {/* CTA: close and go to tracking */}
              <button
                onClick={() => setShowPixReminder(false)}
                className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition active:scale-[0.98]">
                <CheckCircle size={18} /> Já copiei — Ver meu pedido
              </button>

              <p className="text-center text-[10px] text-gray-400">Depois de pagar, toque em "Já Paguei via PIX" na tela de acompanhamento.</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile/Orders Drawer */}
      {showOrders && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 transition-opacity" onClick={() => setShowOrders(false)}>
          <div className="w-full max-w-sm sm:max-w-md bg-gray-50 h-full flex flex-col shadow-2xl overflow-y-auto transform transition-transform duration-300 translate-x-0 animate-[slideLeft_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="p-5 bg-red-600 text-white flex items-center gap-4 relative flex-shrink-0">
              <button onClick={() => setShowOrders(false)} className="absolute top-2 left-2 p-2 hover:bg-red-700 rounded-full"><X size={18} /></button>
              {authUser ? (
                <>
                  <div className="mt-4 flex items-center gap-3 w-full">
                    {authUser.photoURL ? <img src={authUser.photoURL} className="w-12 h-12 rounded-full border-2 border-white" /> : <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center"><User size={24} /></div>}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate text-sm">{authUser.displayName || 'Cliente'}</h3>
                      <p className="text-xs text-red-200 truncate">{authUser.email}</p>
                    </div>
                    <button onClick={() => { handleLogout(); setShowOrders(false); }} className="p-2 hover:bg-red-700 rounded-lg" title="Sair"><LogOut size={18} /></button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-6 mt-4">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-3"><User size={32} /></div>
                  <h3 className="font-bold mb-3 text-center">Faça login para continuar</h3>

                  {showPhoneLogin ? (
                    <div className="w-full space-y-3">
                      {!confirmationResult ? (
                        <>
                          <input type="tel" className="w-full bg-white text-gray-900 border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-red-400 outline-none" placeholder="+55 (85) 99999-9999" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} />
                          <button onClick={handlePhoneLogin} className="w-full px-6 py-3 bg-gray-900 text-white font-bold rounded-full text-sm hover:bg-gray-800 transition">Enviar SMS</button>
                        </>
                      ) : (
                        <>
                          <input type="text" className="w-full bg-white text-gray-900 border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-red-400 outline-none tracking-widest text-center font-bold" placeholder="000000" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} maxLength={6} />
                          <button onClick={verifyPhoneCode} className="w-full px-6 py-3 bg-gray-900 text-white font-bold rounded-full text-sm hover:bg-gray-800 transition">Confirmar Código</button>
                        </>
                      )}
                      <button onClick={() => { setShowPhoneLogin(false); setConfirmationResult(null); }} className="w-full mt-2 text-red-200 text-xs hover:text-white transition">Voltar para Login Social</button>
                      <div id="recaptcha-container"></div>
                    </div>
                  ) : (
                    <>
                      <button onClick={handleLogin} className="w-full mb-3 px-6 py-3 bg-white text-red-600 font-bold rounded-full text-sm hover:bg-red-50 transition shadow-sm">Entrar com Google</button>
                      <button onClick={() => setShowPhoneLogin(true)} className="w-full px-6 py-3 bg-red-700 text-white font-bold rounded-full text-sm hover:bg-red-800 transition border border-red-500">Entrar com Celular</button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
              {authUser && (
                <>
                  <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2"><User size={16} className="text-red-500" /> Meus Dados</h4>
                      <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="text-xs text-red-600 font-medium px-2 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition">Editar</button>
                    </div>
                    {isEditingProfile ? (
                      <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div>
                          <label className="text-xs text-gray-500 font-medium">Telefone</label>
                          <input className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(85) 9..." />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium">Endereço de Entrega</label>
                          <textarea className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition" rows={2} value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Rua, número, complemento, bairro..." />
                        </div>
                        <SaveButton onClick={saveProfile} label="Salvar Alterações" fullWidth className="py-2.5" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 text-sm text-gray-600">
                          <Phone size={16} className="text-gray-400 mt-0.5" />
                          <span className={!customerPhone ? "text-gray-400 italic" : ""}>{customerPhone || 'Nenhum telefone informado'}</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-gray-600">
                          <MapPin size={16} className="text-gray-400 mt-0.5" />
                          <span className={!customerAddress ? "text-gray-400 italic" : ""}>{customerAddress || 'Nenhum endereço informado'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* GAMIFICATION DASHBOARD (Insert above My Orders) */}
                  <div className="mb-6 border-t border-gray-100 pt-6">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4 px-1"><Award size={18} className="text-orange-500" /> Fidelidade e Prêmios</h4>
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-5 text-white relative overflow-hidden mb-6 shadow-md">
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wide">Seu Nível</p>
                            <div className="flex items-center gap-2">
                              {currentTier && <Crown size={18} className={currentTier.color} />}
                              <span className={`text-lg font-black ${currentTier ? currentTier.color : 'text-gray-300'}`}>{currentTier ? currentTier.name : 'Iniciante'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-black text-orange-400 mb-0.5">{userDBData?.points || 0}</p>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Pontos Disponíveis</p>
                          </div>
                        </div>

                        {currentTier && currentTier.name !== 'Diamante' && (() => {
                          const nextTierIndex = TIERS.findIndex(t => t.name === currentTier.name) + 1;
                          const nextTier = TIERS[nextTierIndex];
                          const pts = userDBData?.lifetimePoints || 0;
                          const currentMin = currentTier.min;
                          const range = nextTier.min - currentMin;
                          const progress = Math.min(100, Math.max(0, ((pts - currentMin) / range) * 100));

                          return (
                            <div className="mt-3 bg-white/5 rounded-xl p-3 border border-white/10">
                              <div className="flex justify-between text-[11px] text-gray-300 font-bold mb-1.5">
                                <span>Progresso ({pts} pts)</span>
                                <span className={nextTier.color}>Rumo ao {nextTier.name} ({nextTier.min} pts)</span>
                              </div>
                              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="mt-4 pt-4 border-t border-gray-800 flex flex-wrap gap-2 text-[10px] uppercase font-bold tracking-wide">
                          {tierDiscountRaw > 0 && <span className="bg-white/10 px-2 py-1.5 rounded text-emerald-400">{tierDiscountRaw}% OFF em tudo</span>}
                          {currentTier?.freeDelivery && <span className="bg-white/10 px-2 py-1.5 rounded text-blue-400">Entrega Grátis</span>}
                          {currentTier?.gift && <span className="bg-white/10 px-2 py-1.5 rounded text-purple-400">Brinde Especial Exclusivo</span>}
                          {currentTier?.vip && <span className="bg-white/10 px-2 py-1.5 rounded text-yellow-500 drop-shadow-md">👑 VIP - Atendimento Expresso</span>}
                        </div>
                      </div>
                      <Award size={120} className="absolute -bottom-8 -right-8 text-white opacity-5" />
                    </div>

                    <h5 className="font-bold text-gray-900 text-sm mb-3 px-1">Resgatar Prêmios</h5>
                    <div className="grid grid-cols-1 gap-3">
                      {rewards?.filter(r => r.active).map(r => {
                        const cost = Number(r.cost);
                        const canRedeem = (userDBData?.points || 0) >= cost;
                        return (
                          <div key={r.id} className="bg-white border border-gray-100 p-3.5 rounded-2xl flex items-center gap-3.5 relative overflow-hidden shadow-sm">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${canRedeem ? 'bg-orange-50 border border-orange-100' : 'bg-gray-50 border border-gray-100 grayscale opacity-60'}`}>
                              {r.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{r.name}</p>
                              <p className="text-[11px] text-gray-500 leading-tight mt-0.5 line-clamp-2">{r.description}</p>
                              <p className={`text-xs font-bold mt-1.5 flex items-center gap-1 ${canRedeem ? 'text-orange-600' : 'text-gray-400'}`}>
                                <Zap size={11} /> {cost} pontos
                              </p>
                            </div>
                            <button disabled={!canRedeem} onClick={async () => {
                              if (window.confirm(`Deseja resgatar "${r.name}" por ${cost} pontos?`)) {
                                try {
                                  await updateDoc(doc(db, "customers", authUser.uid), { points: (userDBData.points || 0) - cost });
                                  await addDoc(collection(db, "points_log"), {
                                    userId: authUser.uid, userName: userDBData.name || authUser.displayName || 'Cliente', points: -cost, type: 'resgate', description: `Resgate: ${r.name}`, status: 'confirmado', createdAt: serverTimestamp()
                                  });
                                  await updateDoc(doc(db, "rewards", r.id), { redemptions: (r.redemptions || 0) + 1 });

                                  if (r.type === 'ITEM' && r.itemId) {
                                    const menuItem = menu.find(m => m.id === r.itemId);
                                    if (menuItem) {
                                      setCart([...cart, { ...menuItem, cartId: Date.now(), qty: 1, isReward: true, price: 0 }]);
                                      alert(`Prêmio resgatado! "${menuItem.name}" adicionado à sacola (R$ 0,00).`);
                                    }
                                  } else {
                                    alert(`Prêmio resgatado! Coloque uma observação no pedido ou mostre esta tela.`);
                                  }
                                } catch (e) { alert("Erro no resgate. Tente novamente."); }
                              }
                            }} className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${canRedeem ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}>
                              Resgatar
                            </button>
                          </div>
                        );
                      })}
                      {(!rewards || rewards.filter(r => r.active).length === 0) && <p className="text-gray-400 text-sm text-center py-6 bg-white rounded-2xl border border-gray-100">Nenhum prêmio disponível.</p>}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 px-1"><ShoppingBag size={18} className="text-red-500" /> Meus Pedidos</h4>
                    {myOrders.length === 0 ? (
                      <div className="text-center py-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <ShoppingBag size={32} className="text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-medium">Nenhum pedido recente</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myOrders.slice(0, 10).map(o => (
                          <div key={o.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                            onClick={() => { setTrackingOrderId(o.id); setTrackingOrder(o); }}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-bold text-sm text-gray-900">Pedido {getDisplayOrderId(o)}</span>
                                <p className="text-xs text-gray-400 mt-0.5">{o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleString() : ''}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${o.status === 'Novo' || o.status === 'Confirmado' ? 'bg-blue-50 text-blue-600' :
                                o.status === 'Preparando' ? 'bg-amber-50 text-amber-600' :
                                  o.status === 'Saiu p/ Entrega' ? 'bg-purple-50 text-purple-600' :
                                    o.status === 'Entregue' ? 'bg-emerald-50 text-emerald-600' :
                                      'bg-gray-100 text-gray-600'
                                }`}>{o.status}</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                              <span className="text-xs text-gray-500">{o.items?.length || 0} itens</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-900">R$ {(o.total || 0).toFixed(2)}</span>
                                {o.status !== 'Entregue' && o.status !== 'Cancelado' && (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Acompanhar →</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN APP ====================
const NAV_ITEMS = [
  ...[
    { key: "orders", label: "Gestão de Pedidos", icon: Clipboard },
    { key: "pos", label: "Caixa", icon: CreditCard },
  ],
  { key: "dashboard", label: "Dashboard", icon: BarChart3, adminOnly: true },
  { key: "history", label: "Histórico", icon: Clock },
  { key: "company", label: "Minha Empresa", icon: Building2, adminOnly: true },
  { key: "catalog", label: "Cardápio", icon: UtensilsCrossed, adminOnly: true },
  ...[
    { key: "inventory", label: "Controle de Insumos", icon: Package, adminOnly: true },
    { key: "delivery", label: "Delivery", icon: Truck },
    { key: "loyalty", label: "Fidelidade", icon: Heart, adminOnly: true },
    { key: "coupons", label: "Cupons Promocionais", icon: Ticket, adminOnly: true },
    { key: "customers", label: "Clientes", icon: Users },
    { key: "reviews", label: "Avaliações", icon: Star },
    { key: "users", label: "Usuários & Permissões", icon: User, adminOnly: true },
    { key: "config", label: "Configurações", icon: Settings, adminOnly: true },
    { key: "links", label: "Meus Links", icon: Link2 },
  ]
];

// GAMIFICATION CONSTANTS
const TIERS = [
  { name: 'Bronze', min: 0, discount: 5, color: 'text-orange-700' },
  { name: 'Prata', min: 150, discount: 10, freeDelivery: true, color: 'text-gray-400' },
  { name: 'Ouro', min: 300, discount: 15, gift: true, color: 'text-yellow-500' },
  { name: 'Diamante', min: 500, discount: 20, vip: true, color: 'text-cyan-400' }
];
const getTier = (pts) => [...TIERS].reverse().find(t => pts >= t.min) || TIERS[0];

// ==================== DRIVER APP (public page for delivery drivers) ====================
const DriverApp = ({ orders, drivers }) => {
  const params = new URLSearchParams(window.location.search);
  const driverId = params.get('id');

  const [driver, setDriver] = useState(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [driverCurrentPos, setDriverCurrentPos] = useState(null);
  const watchRef = useRef(null);

  // Find driver from prop
  useEffect(() => {
    if (driverId && drivers.length > 0) {
      const d = drivers.find(dr => dr.id === driverId);
      setDriver(d || null);
    }
  }, [driverId, drivers]);

  // Find the current assigned order for this driver
  const currentOrder = driver?.currentOrderId
    ? orders.find(o => o.id === driver.currentOrderId && o.status !== 'Entregue' && o.status !== 'Cancelado')
    : null;

  // Start GPS tracking
  const startGPS = () => {
    if (!navigator.geolocation) { setGpsError('GPS não disponível neste aparelho.'); return; }
    setGpsError('');
    setGpsActive(true);
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        setDriverCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        try {
          await updateDoc(doc(db, 'drivers', driverId), {
            location: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              updatedAt: serverTimestamp(),
            },
            status: 'Em entrega',
          });
        } catch (e) { console.error('GPS update error:', e); }
      },
      (err) => { setGpsError('Erro no GPS: ' + err.message); setGpsActive(false); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  const stopGPS = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setGpsActive(false);
  };

  useEffect(() => () => stopGPS(), []);

  // Confirm delivery
  const confirmDelivery = async () => {
    if (!currentOrder) return;
    setConfirming(true);
    try {
      await updateDoc(doc(db, 'orders', currentOrder.id), {
        status: 'Entregue',
        deliveredAt: serverTimestamp(),
        deliveredByDriverId: driverId,
        deliveredByDriverName: driver?.name || '',
      });
      await updateDoc(doc(db, 'drivers', driverId), {
        status: 'Disponível',
        currentOrderId: null,
        deliveries: (driver?.deliveries || 0) + 1,
      });
      stopGPS();
      setConfirmed(true);
    } catch (e) {
      alert('Erro ao confirmar entrega: ' + e.message);
    } finally {
      setConfirming(false);
    }
  };

  if (!driverId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="text-center text-white">
          <div className="text-5xl mb-4">🛸</div>
          <h1 className="text-xl font-bold">Link inválido</h1>
          <p className="text-gray-400 text-sm mt-2">Entre em contato com a loja para receber seu link correto.</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-5 pt-10 pb-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-black">
            {driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-gray-400">App do Entregador</p>
            <h1 className="text-lg font-black">{driver.name}</h1>
          </div>
          <span className={`ml-auto text-xs font-bold px-3 py-1.5 rounded-full ${driver.status === 'Em entrega' ? 'bg-amber-500/20 text-amber-400' : driver.status === 'Disponível' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
            {driver.status}
          </span>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-4">
        {/* GPS Button */}
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${gpsActive ? 'bg-emerald-900/30 border border-emerald-700/40' : 'bg-gray-800 border border-gray-700'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${gpsActive ? 'bg-emerald-500' : 'bg-gray-600'}`}>
            <MapPin size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">Localização em tempo real</p>
            <p className={`text-xs ${gpsActive ? 'text-emerald-400' : 'text-gray-400'}`}>
              {gpsActive ? '✅ Ativo — enviando posição' : 'Ative para que a loja veja sua localização'}
            </p>
            {gpsError && <p className="text-xs text-red-400 mt-0.5">{gpsError}</p>}
          </div>
          <button
            onClick={gpsActive ? stopGPS : startGPS}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${gpsActive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
            {gpsActive ? 'Parar' : 'Ativar'}
          </button>
        </div>

        {/* Current Order */}
        {confirmed ? (
          <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-xl font-black text-white">Entrega Confirmada!</h2>
            <p className="text-emerald-400 text-sm mt-1">O status do pedido foi atualizado automaticamente.</p>
            <p className="text-gray-400 text-xs mt-3">Aguarde o próximo pedido ser atribuído a você.</p>
          </div>
        ) : currentOrder ? (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
            <div className="bg-amber-600 px-4 py-3 flex items-center gap-2">
              <Package size={16} className="text-white" />
              <span className="text-white font-bold text-sm">Pedido em andamento</span>
              <span className="ml-auto text-white/80 text-xs">#{String(currentOrder.dailyId || '').padStart(3, '0')}</span>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Cliente</p>
                <p className="text-white font-bold">{currentOrder.customer}</p>
                {currentOrder.phone && <p className="text-gray-400 text-xs">{currentOrder.phone}</p>}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Endereço de Entrega</p>
                <p className="text-white font-semibold">{currentOrder.address}</p>
                {/* Navigation buttons */}
                <div className="flex gap-2 mt-2">
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentOrder.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-2 bg-sky-600/20 border border-sky-600/30 text-sky-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-sky-600/40 transition">
                    <Navigation size={12} /> Google Maps
                  </a>
                  <a href={`waze://?q=${encodeURIComponent(currentOrder.address)}&navigate=yes`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-2 bg-violet-600/20 border border-violet-600/30 text-violet-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-violet-600/40 transition">
                    🗯️ Waze
                  </a>
                </div>
              </div>
              {/* Mini map */}
              {gpsActive && (
                <div className="rounded-2xl overflow-hidden border border-gray-700">
                  <LiveTrackingMap
                    variant="admin"
                    driverLocation={driverCurrentPos}
                    customerAddress={currentOrder.address}
                    driverName={driver.name}
                    orderId={`#${String(currentOrder.dailyId || '').padStart(3, '0')}`}
                    height={220}
                  />
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <div className="flex-1 bg-gray-700 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">Pagamento</p>
                  <p className="text-white font-bold text-sm">{currentOrder.payment}</p>
                </div>
                <div className="flex-1 bg-gray-700 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-white font-bold text-sm">R$ {Number(currentOrder.total || 0).toFixed(2)}</p>
                </div>
              </div>
              {currentOrder.note && (
                <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-xl p-3">
                  <p className="text-xs text-yellow-400 font-bold mb-0.5">📝 Obs do cliente</p>
                  <p className="text-yellow-200 text-sm">{currentOrder.note}</p>
                </div>
              )}
              <button
                onClick={confirmDelivery}
                disabled={confirming}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-[0.98] transition disabled:opacity-60 shadow-lg mt-2">
                {confirming ? (
                  <><RefreshCw size={20} className="animate-spin" /> Confirmando...</>
                ) : (
                  <><CheckCircle size={20} /> Confirmar Entrega</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">⏳</div>
            <h2 className="text-white font-bold">Aguardando pedido</h2>
            <p className="text-gray-400 text-sm mt-1">Quando um pedido for atribuído a você, ele aparecerá aqui.</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">Como usar</p>
          <div className="space-y-1.5">
            {[
              'Ative o GPS para a loja acompanhar sua localização',
              'O pedido aparece automaticamente quando atribuído',
              'Após entregar, toque em "Confirmar Entrega"',
              'O status atualiza automaticamente no painel da loja',
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-gray-700 text-gray-300 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-gray-300 text-xs">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================

export function App() {
  console.log("App component executing...");
  const navigate = useNavigate();

  const [page, setPage] = useState("orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingDb, setLoadingDb] = useState(true);
  const [isCustomer, setIsCustomer] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0); // badge counter for new orders
  const [showNewOrderToast, setShowNewOrderToast] = useState(false);
  const [lastNewOrderInfo, setLastNewOrderInfo] = useState(null); // { id, customer, total }
  // Stable ref so the onSnapshot closure always knows if admin is mounted
  const isAdminMountedRef = useRef(false);
  // Reusable AudioContext to avoid browser autoplay blocking on repeated creates
  const audioCtxRef = useRef(null);
  const getAudioCtx = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };



  // REALTIME FIRESTORE STATES
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [company, setCompany] = useState(INITIAL_COMPANY);
  const [customers, setCustomers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [pointsLog, setPointsLog] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [supplyPurchases, setSupplyPurchases] = useState([]);
  const [supplyUsage, setSupplyUsage] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // STATIC STATES (For now)
  const [users, setUsers] = useState(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ufo_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('ufo_admin_session', JSON.stringify(user));
  };

  // Derive Caixa from Company state + local currentCash calc if needed. Or just use company.caixa
  const caixa = company.caixa || INITIAL_CAIXA_STATE;

  const handleUpdateCaixa = async (newCaixa) => {
    try {
      await setDoc(doc(db, "settings", "company"), { caixa: newCaixa }, { merge: true });
    } catch (e) {
      console.error(e);
      alert("Erro ao gravar caixa");
    }
  };

  useEffect(() => {
    // 1. Listen to Company Settings
    const unsubCompany = onSnapshot(doc(db, "settings", "company"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCompany(data);
        if (data.adminUsers) {
          const allUsers = [...INITIAL_USERS];
          data.adminUsers.forEach(u => {
            if (!allUsers.find(au => au.email === u.email)) allUsers.push(u);
          });
          setUsers(allUsers);
        }
      }
    });

    // 2. Listen to Menu
    const unsubMenu = onSnapshot(collection(db, "menu"), (snap) => {
      setMenu(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Notification sound helpers using Web Audio API
    const playToneOn = (ctx, type, freq, start, duration, vol = 0.35) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    const playNewOrderSound = () => {
      try {
        const ctx = getAudioCtx();
        // 3-tone urgent alert: Dó-Mi-Sol rapid x2
        playToneOn(ctx, 'square', 523, 0,    0.15);
        playToneOn(ctx, 'square', 659, 0.15, 0.15);
        playToneOn(ctx, 'square', 784, 0.30, 0.3);
        playToneOn(ctx, 'square', 523, 0.7,  0.15);
        playToneOn(ctx, 'square', 659, 0.85, 0.15);
        playToneOn(ctx, 'square', 784, 1.0,  0.3);
      } catch (e) { console.error('Sound error:', e); }
    };

    const playConfirmedSound = () => {
      try {
        const ctx = getAudioCtx();
        playToneOn(ctx, 'sine', 880,  0,   0.2, 0.25);
        playToneOn(ctx, 'sine', 1175, 0.2, 0.4, 0.25);
      } catch (e) { console.error('Sound error:', e); }
    };

    const playPendingPaymentSound = () => {
      try {
        const ctx = getAudioCtx();
        playToneOn(ctx, 'sine', 660, 0,    0.15, 0.18);
        playToneOn(ctx, 'sine', 880, 0.18, 0.25, 0.18);
      } catch (e) { console.error('Sound error:', e); }
    };

    // Mark admin as mounted so the closure can detect it
    isAdminMountedRef.current = true;

    let prevOrderIds = new Set();
    let prevConfirmedIds = new Set();
    let prevPendingPaymentIds = new Set();
    let alarmInterval = null;
    let toastTimeout = null;

    // 3. Listen to Orders (with repeating sound for new orders)
    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
      const newOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(newOrders);

      const isAdminActive = isAdminMountedRef.current;

      // Update new-order badge count
      const novoCount = newOrders.filter(o => o.status === 'Novo').length;
      setNewOrderCount(novoCount);

      // --- Sound & toast logic ---
      // Only play sounds if the admin panel is the active context
      if (isAdminActive) {
        // Detect truly new orders (not seen in previous snapshot)
        const brandNewOrders = newOrders.filter(o => o.status === 'Novo' && !prevOrderIds.has(o.id));
        if (brandNewOrders.length > 0) {
          // Show toast for first new order
          const first = brandNewOrders[0];
          setLastNewOrderInfo({ id: first.id, customer: first.customer, dailyId: first.dailyId, total: first.total });
          setShowNewOrderToast(true);
          if (toastTimeout) clearTimeout(toastTimeout);
          toastTimeout = setTimeout(() => setShowNewOrderToast(false), 8000);
        }

        // Newly confirmed online payment orders
        if (prevOrderIds.size > 0) {
          newOrders.forEach(o => {
            if (!prevConfirmedIds.has(o.id) && o.status === 'Confirmado' && o.paymentConfirmedAt) {
              playConfirmedSound();
            }
          });
          // Newly pending payment orders
          newOrders.forEach(o => {
            if (!prevPendingPaymentIds.has(o.id) && o.status === 'Aguardando Pagamento') {
              playPendingPaymentSound();
            }
          });
        }
      }

      // Repeating alarm: runs regardless of page, stops when no 'Novo' remain
      const hasNewOrders = novoCount > 0;
      if (isAdminActive && hasNewOrders && !alarmInterval) {
        playNewOrderSound();
        alarmInterval = setInterval(() => {
          if (isAdminMountedRef.current) {
            playNewOrderSound();
          } else {
            clearInterval(alarmInterval);
            alarmInterval = null;
          }
        }, 5000);
      } else if (!hasNewOrders && alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
      }

      prevOrderIds = new Set(newOrders.map(o => o.id));
      prevConfirmedIds = new Set(newOrders.filter(o => o.status === 'Confirmado').map(o => o.id));
      prevPendingPaymentIds = new Set(newOrders.filter(o => o.status === 'Aguardando Pagamento').map(o => o.id));
    });

    // 4. Listen to Customers
    const unsubCustomers = onSnapshot(collection(db, "customers"), (snap) => {
      setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 5. Listen to Rewards
    const unsubRewards = onSnapshot(collection(db, "rewards"), (snap) => {
      setRewards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 6. Listen to Points Log
    const unsubPoints = onSnapshot(query(collection(db, "points_log"), orderBy("createdAt", "desc")), (snap) => {
      setPointsLog(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 7. Listen to Coupons
    const unsubCoupons = onSnapshot(collection(db, "coupons"), (snap) => {
      setCoupons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 8. Listen to Supplies
    const unsubSupplies = onSnapshot(collection(db, "supplies"), (snap) => {
      setSupplies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 9. Listen to Supply Purchases
    const unsubSupplyPurchases = onSnapshot(query(collection(db, "supply_purchases"), orderBy("date", "desc")), (snap) => {
      setSupplyPurchases(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 10. Listen to Supply Usage
    const unsubSupplyUsage = onSnapshot(query(collection(db, "supply_usage"), orderBy("date", "desc")), (snap) => {
      setSupplyUsage(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 11. Listen to Drivers
    const unsubDrivers = onSnapshot(collection(db, "drivers"), (snap) => {
      setDrivers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    setTimeout(() => setLoadingDb(false), 500);
    return () => {
      isAdminMountedRef.current = false;
      if (alarmInterval) clearInterval(alarmInterval);
      if (toastTimeout) clearTimeout(toastTimeout);
      unsubCompany(); unsubMenu(); unsubOrders(); unsubCustomers(); unsubRewards(); unsubPoints(); unsubCoupons(); unsubSupplies(); unsubSupplyPurchases(); unsubSupplyUsage(); unsubDrivers();
    };
  }, []);

  if (loadingDb) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Carregando Sistema...</div>;

  // Filter nav items based on user role
  const visibleNavItems = currentUser ? NAV_ITEMS.filter(item =>
    currentUser.role === 'ADMIN' || !item.adminOnly
  ) : [];

  // If a manager is on an admin-only page and reloads (or state gets weird), kick them to orders
  if (currentUser && currentUser.role !== 'ADMIN' && NAV_ITEMS.find(n => n.key === page)?.adminOnly) {
    setPage("orders");
  }



  // Update company wrapper
  const handleUpdateCompany = async (newCompany) => {
    try {
      // Remove any potentially undefined fields to prevent Firestore errors
      // eslint-disable-next-line no-unused-vars
      const safeCompany = Object.fromEntries(Object.entries(newCompany).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, "settings", "company"), safeCompany, { merge: true });
    } catch (e) {
      console.error(e);
      alert("Erro ao gravar alterações na empresa");
    }
  };

  const renderPage = () => {
    switch (page) {
      case "orders": return <OrderManagement orders={orders} setOrders={setOrders} caixa={caixa} setCaixa={handleUpdateCaixa} />;
      case "pos": return <Caixa orders={orders} setOrders={setOrders} menu={menu} caixa={caixa} setCaixa={handleUpdateCaixa} />;
      case "dashboard": return <Dashboard orders={orders} customers={INITIAL_CUSTOMERS} />;
      case "history": return <OrderHistory orders={orders} />;
      case "company": return <MyCompany company={company} setCompany={handleUpdateCompany} />;
      case "catalog": return <Catalog menu={menu} setMenu={setMenu} supplies={supplies} />;
      case "delivery": return <DeliveryManagement drivers={drivers} orders={orders} />;
      case "loyalty": return <LoyaltyManagement customers={customers} pointsLog={pointsLog} rewards={rewards} menu={menu} TIERS={TIERS} getTier={getTier} />;
      case "coupons": return <CouponsManagement coupons={coupons} />;
      case "inventory": return <InventoryManagement supplies={supplies} purchases={supplyPurchases} usage={supplyUsage} />;
      case "customers": return <Customers customers={customers} />;
      case "users": return <UserManagement users={users} setUsers={setUsers} currentUser={currentUser} />;
      case "reviews": return <ReviewsPage />;
      case "config": return <ConfigPage company={company} setCompany={handleUpdateCompany} />;
      case "links": return <MyLinks />;
      default: return <OrderManagement orders={orders} setOrders={setOrders} />;
    }
  };

  if (isCustomer) return <CustomerMenu menu={menu} onBack={() => setIsCustomer(false)} company={company} rewards={rewards} TIERS={TIERS} getTier={getTier} pointsLog={pointsLog} />;

  return (
    <Routes>
      <Route path="/" element={
        (() => {
          try {
            const pendingOrder = localStorage.getItem('ufo_tracking_order');
            if (pendingOrder) return <Navigate to="/cardapio" replace />;
          } catch {}
          return <Navigate to="/admin" replace />;
        })()
      } />
      <Route path="/header-demo" element={<HeaderDemo />} />
      <Route path="/cardapio" element={<CustomerMenu menu={menu} company={company} onBack={() => { }} rewards={rewards} TIERS={TIERS} getTier={getTier} pointsLog={pointsLog} />} />
      <Route path="/pdv" element={<CustomerMenu isPdvMode={true} menu={menu} company={company} onBack={() => { }} rewards={rewards} TIERS={TIERS} getTier={getTier} pointsLog={pointsLog} />} />
      <Route path="/motorista" element={<DriverApp orders={orders} drivers={drivers} />} />
      <Route path="/admin" element={
        !currentUser ? <Login onLogin={handleLoginSuccess} users={users} /> : (
          <div className="flex h-screen bg-gray-50 overflow-hidden" style={{ fontFamily: "'Poppins', 'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
            {/* Mobile overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
              <div className="p-5 border-b border-gray-100">
                <div className="flex flex-col items-start gap-1">
                  <img src="/logo-horizontal.png" alt="Ufo Burguers" className="h-[40px] w-auto object-contain" />
                  <p className="text-xs text-gray-400 ml-1 mt-1">Fortaleza, CE</p>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto p-3 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
                {visibleNavItems.map(item => (
                  <button key={item.key} onClick={() => { setPage(item.key); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${page === item.key ? 'bg-gray-900 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <item.icon size={18} />
                    {item.label}
                    {/* Red badge on Gestão de Pedidos when there are new orders */}
                    {item.key === 'orders' && newOrderCount > 0 && (
                      <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse ${page === item.key ? 'bg-red-500 text-white' : 'bg-red-500 text-white'}`}>
                        {newOrderCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="p-3 border-t border-gray-100 space-y-2">
                <button onClick={() => setIsCustomer(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition">
                  <Eye size={18} />
                  Ver App Cliente
                </button>
                <button onClick={() => { setCurrentUser(null); localStorage.removeItem('ufo_admin_session'); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 font-medium transition">
                  <LogOut size={16} /> Sair
                </button>
              </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-auto">
              {/* New Order Toast Banner — visible on any admin page */}
              {showNewOrderToast && lastNewOrderInfo && (
                <div
                  className="sticky top-0 z-50 bg-red-600 text-white px-5 py-3 flex items-center gap-3 shadow-xl cursor-pointer animate-pulse"
                  onClick={() => { setPage('orders'); setShowNewOrderToast(false); }}
                >
                  <span className="text-xl">🛸</span>
                  <div className="flex-1">
                    <p className="font-black text-sm">NOVO PEDIDO! #{lastNewOrderInfo.dailyId ? String(lastNewOrderInfo.dailyId).padStart(3,'0') : '---'} — {lastNewOrderInfo.customer}</p>
                    <p className="text-red-200 text-xs">R$ {Number(lastNewOrderInfo.total || 0).toFixed(2)} · Clique para ver</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setShowNewOrderToast(false); }} className="p-1 hover:bg-red-700 rounded-lg transition">
                    <X size={16} />
                  </button>
                </div>
              )}
              <header className="sticky top-0 bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-100 px-6 py-3 flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100"><Menu size={20} /></button>
                  <h2 className="font-bold text-gray-900">{visibleNavItems.find(n => n.key === page)?.label}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{currentUser.role === 'ADMIN' ? 'Administrador' : 'Gerente'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 border border-gray-200 flex items-center justify-center text-sm font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                </div>
              </header>
              <div className="p-6">{renderPage()}</div>
            </main>
          </div>
        )
      } />
    </Routes>
  );
}

export default App;

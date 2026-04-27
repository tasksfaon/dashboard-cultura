import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, DollarSign, Activity, Focus,
  ArrowUpRight, ArrowDownRight, Filter, CalendarDays, Loader2, KeyRound, ChevronDown, ChevronRight, PieChart as PieChartIcon, BarChart2,
  Zap, Target, ShoppingCart, Award
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = {
  meta: '#3b82f6', // blue-500
  google: '#f43f5e', // rose-500
  organic: '#10b981', // emerald-500
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111113] border border-[#222225] p-3 rounded-lg shadow-xl outline-none">
        <p className="text-[#FAFAFA] font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
           <div key={index} className="flex items-center justify-between gap-4 text-sm mb-1">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
               <span className="text-[#8E9299]">{entry.name}</span>
             </div>
             <span className="font-mono text-white">R$ {Number(entry.value).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
           </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- MOCK DATA ---
const mockKpis = [
  { title: 'Total Conversions', value: '4,842', trend: '+14.5%', isUp: true, icon: TrendingUp },
  { title: 'Blended CPA', value: 'R$ 14,20', trend: '-2.4%', isUp: true, icon: Focus }, 
  { title: 'Blended ROAS', value: '3.8x', trend: '+0.4', isUp: true, icon: Activity },
  { title: 'Total Revenue', value: 'R$ 124.5k', trend: '+18.2%', isUp: true, icon: DollarSign },
];

// --- COMPONENTS ---
const Card = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-[#111113] border border-[#222225] rounded-2xl p-6 ${className}`} {...props}>
    {children}
  </div>
);

const ProductRow: React.FC<{ p: any }> = ({ p }) => {
  const [expanded, setExpanded] = useState(false);
  const roas = p.cost > 0 ? p.rev / p.cost : 0;
  return (
    <React.Fragment>
      <tr onClick={() => setExpanded(!expanded)} className="hover:bg-[#111113] transition-colors cursor-pointer group border-b border-[#222225]/50">
        <td className="p-4 text-xs text-[#E4E3E0] max-w-[200px] truncate" title={p.name}>
          <div className="flex items-center gap-2">
            <ChevronRight className={`w-3 h-3 shrink-0 text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            <div className="flex flex-col">
              <span className="truncate font-medium">{p.name}</span>
              <span className="text-[10px] text-[#52525B]">Sessões: {p.sessions || 0}</span>
            </div>
          </div>
        </td>
        <td className="p-4 text-xs text-right font-mono text-[#8E9299]">{p.qty}</td>
        <td className="p-4 text-xs text-right font-mono">
           <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roas > 3 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
             {roas > 0 ? `${roas.toFixed(1)}x` : '-'}
           </span>
        </td>
        <td className="p-4 text-xs text-right font-mono text-emerald-400 font-semibold">R$ {p.rev.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
      </tr>
      {expanded && p.campaigns && p.campaigns.length > 0 && (
        <tr className="bg-[#0f0f11]">
          <td colSpan={4} className="p-0">
            <div className="px-4 py-3 border-l-2 border-[#333] ml-4 bg-[#0a0a0a]">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-medium">Vendas por Campanha/Origem</div>
              <div className="space-y-2">
                {p.campaigns.map((c: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 truncate pr-2 max-w-[180px]" title={c.name}>{c.name}</span>
                    <div className="flex space-x-4 shrink-0 text-right">
                      <span className="font-mono text-gray-500 w-8">{c.qty} un</span>
                      <span className="font-mono text-emerald-500/80 w-20">R$ {c.rev.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

export default function App() {
  const [dataStatus, setDataStatus] = useState<'loading' | 'needs_setup' | 'logged_out' | 'success' | 'error'>('loading');
  const [channelData, setChannelData] = useState<any>({
    meta: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0, products: [] },
    google: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0, products: [] },
    organic: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0, products: [] },
    total: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0 }
  });
  const [kpis, setKpis] = useState(mockKpis);
  const [errorMessage, setErrorMessage] = useState('');
  const companies = [
    {
      id: "g7",
      name: "Dashboard G7",
      propertyId: "326638842",
      logo: "https://www.g7juridico.com.br/imagens/simbolo.jpg",
    },
    {
      id: "cultura",
      name: "Dashboard Cultura",
      propertyId: "299236151",
      logo: "https://www.culturajuridica.com.br/imagens/novo/logo-topo.svg",
    }
  ];

  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0].id);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];
  const propertyId = selectedCompany.propertyId;

  const [dateRange, setDateRange] = useState('7days');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [appliedCustomDate, setAppliedCustomDate] = useState({ start: '', end: '' });

  const dateRangeLabels: Record<string, string> = {
      today: 'Hoje',
      yesterday: 'Ontem',
      '7days': 'Últimos 7 dias',
      '14days': 'Últimos 14 dias',
      '30days': 'Últimos 30 dias',
      '60days': 'Últimos 60 dias',
      '90days': 'Últimos 90 dias',
      '180days': 'Últimos 180 dias',
      custom: 'Personalizado'
  };

  const [tokens, setTokens] = useState<any>(() => {
    const saved = localStorage.getItem('ga4_tokens');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    document.title = selectedCompany.name;
    const link: any = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = selectedCompany.logo;
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (!tokens) {
      setDataStatus('logged_out');
      return;
    }

    if (!propertyId) {
      setDataStatus('error');
      setErrorMessage('Property ID is missing. Please refresh and provide it before connecting.');
      setTokens(null);
      return;
    }
    
    setDataStatus('loading');

    const fetchAnalytics = async () => {
      try {
        let url = `/api/analytics?propertyId=${propertyId}&dateRange=${dateRange}`;
        if (dateRange === 'custom') {
          url += `&customStart=${appliedCustomDate.start}&customEnd=${appliedCustomDate.end}`;
        }
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${JSON.stringify(tokens)}` }
        });
        
        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await res.json();
        } else {
          throw new Error('API returned non-JSON response');
        }
        
        if (res.ok && data.status === 'success') {
          setDataStatus('success');
          console.log("Real GA4 Data received:", data.data);

            if (data.data && data.data.sources && data.data.sources.rows) {
              const srcRows = data.data.sources.rows || [];
              const campRows = data.data.campaigns?.rows || [];
              const itmRows = data.data.items?.rows || [];
              const winningAds: any[] = [];

              const agg = {
                meta: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0, products: new Map<string, {qty: number, rev: number, sessions: number, cost: number, campaigns: any[]}>(), campaigns: new Map<string, {sales: number, rev: number, leads: number}>() },
                google: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0, products: new Map<string, {qty: number, rev: number, sessions: number, cost: number, campaigns: any[]}>(), campaigns: new Map<string, {sales: number, rev: number, leads: number}>() },
                organic: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0, products: new Map<string, {qty: number, rev: number, sessions: number, cost: number, campaigns: any[]}>(), campaigns: new Map<string, {sales: number, rev: number, leads: number}>() },
                total: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0 }
              };

              // 1. Process Channel Totals & Costs
              srcRows.forEach((row: any) => {
                const source = (row.dimensionValues?.[0]?.value || 'direct').toLowerCase();
                const medium = (row.dimensionValues?.[1]?.value || '(none)').toLowerCase();
                
                const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);
                const conversions = parseInt(row.metricValues?.[1]?.value || '0', 10);
                const sales = parseInt(row.metricValues?.[2]?.value || '0', 10);
                const revenue = parseFloat(row.metricValues?.[3]?.value || '0');
                const cost = parseFloat(row.metricValues?.[4]?.value || '0');
                
                let leads = Math.max(0, conversions - sales);
                if (leads === 0 && conversions > 0 && sales === 0) leads = conversions; 

                let cat = 'organic';
                const searchStr = `${source} ${medium}`;
                
                if (searchStr.includes('google') || searchStr.includes('cpc') || searchStr.includes('ads') || searchStr.includes('gclid') || (source === 'google' && medium === 'cpc')) {
                  cat = 'google';
                } else if (searchStr.includes('fb') || searchStr.includes('meta') || searchStr.includes('ig') || searchStr.includes('instagram') || searchStr.includes('facebook') || searchStr.includes('messenger')) {
                  cat = 'meta';
                }

                const target = agg[cat as keyof typeof agg] as any;
                target.revenue += revenue;
                target.sales += sales;
                target.leads += leads;
                target.sessions += sessions;
                target.cost += cost;

                agg.total.revenue += revenue;
                agg.total.sales += sales;
                agg.total.leads += leads;
                agg.total.sessions += sessions;
                agg.total.cost += cost;
              });

              // 2. Process Campaigns
              campRows.forEach((row: any) => {
                const source = (row.dimensionValues?.[0]?.value || 'direct').toLowerCase();
                const medium = (row.dimensionValues?.[1]?.value || '(none)').toLowerCase();
                const campaign = (row.dimensionValues?.[2]?.value || '').toLowerCase();
                const adContent = (row.dimensionValues?.[3]?.value || '').toLowerCase();
                
                const conversions = parseInt(row.metricValues?.[1]?.value || '0', 10);
                const sales = parseInt(row.metricValues?.[2]?.value || '0', 10);
                const revenue = parseFloat(row.metricValues?.[3]?.value || '0');
                
                let leads = Math.max(0, conversions - sales);
                if (leads === 0 && conversions > 0 && sales === 0) leads = conversions; 

                let cat = 'organic';
                const searchStr = `${source} ${medium} ${campaign}`;
                
                if (searchStr.includes('google') || searchStr.includes('cpc') || searchStr.includes('ads') || searchStr.includes('gclid') || (source === 'google' && medium === 'cpc')) {
                  cat = 'google';
                } else if (searchStr.includes('fb') || searchStr.includes('meta') || searchStr.includes('ig') || searchStr.includes('instagram') || searchStr.includes('facebook') || searchStr.includes('messenger')) {
                  cat = 'meta';
                }

                const target = agg[cat as keyof typeof agg] as any;

                if (sales > 0 || revenue > 0 || leads > 0) {
                  let campName = campaign;
                  if (!campName || campName === '(not set)') campName = `${source} / ${medium}`;
                  if (adContent && adContent !== '(not set)') campName += ` (Anúncio: ${adContent})`;
                  
                  const cMap = target.campaigns;
                  if (!cMap.has(campName)) {
                    cMap.set(campName, { sales: 0, rev: 0, leads: 0 });
                  }
                  const c = cMap.get(campName);
                  c.sales += sales;
                  c.rev += revenue;
                  c.leads += leads;

                  if (sales > 0 && revenue > 0) {
                    winningAds.push({
                      name: campName,
                      sales,
                      rev: revenue,
                      source: cat,
                      roas: 0 // Will assign later if we have cost rows
                    });
                  }
                }
              });

              // 3. Process Items
              itmRows.forEach((row: any) => {
                const source = (row.dimensionValues?.[0]?.value || 'direct').toLowerCase();
                const medium = (row.dimensionValues?.[1]?.value || '(none)').toLowerCase();
                const campaign = (row.dimensionValues?.[2]?.value || '').toLowerCase();
                const adContent = (row.dimensionValues?.[3]?.value || '').toLowerCase();
                const itemName = row.dimensionValues?.[4]?.value || 'Unknown Product';
                if (itemName === '(not set)') return;

                const qty = parseInt(row.metricValues?.[0]?.value || '0', 10);
                const rev = parseFloat(row.metricValues?.[1]?.value || '0');

                if (qty === 0 && rev === 0) return;

                let cat = 'organic';
                const searchStr = `${source} ${medium} ${campaign}`;
                
                if (searchStr.includes('google') || searchStr.includes('cpc') || searchStr.includes('ads')) cat = 'google';
                else if (
                    searchStr.includes('fb') || 
                    searchStr.includes('meta') || 
                    searchStr.includes('ig') || 
                    searchStr.includes('instagram') ||
                    searchStr.includes('facebook')
                ) cat = 'meta';

                const pMap = (agg[cat as keyof typeof agg] as any).products;
                if (!pMap.has(itemName)) {
                  pMap.set(itemName, { qty: 0, rev: 0, sessions: 0, cost: 0, campaigns: [] });
                }
                const p = pMap.get(itemName);
                p.qty += qty;
                p.rev += rev;
                
                let campName = campaign;
                if (!campName || campName === '(not set)') campName = `${source} / ${medium}`;
                if (adContent && adContent !== '(not set)') campName += ` (Anúncio: ${adContent})`;
                
                const existingCamp = p.campaigns.find((c: any) => c.name === campName);
                if (existingCamp) {
                    existingCamp.qty += qty;
                    existingCamp.rev += rev;
                } else {
                    p.campaigns.push({ name: campName, qty, rev });
                }
                
                p.campaigns.sort((a: any, b: any) => b.rev - a.rev || b.qty - a.qty);
              });

              // Convert product maps to sorted arrays
              const formatProducts = (map: Map<string, any>) => Array.from(map.entries())
                  .map(([name, data]) => ({ name, ...data }))
                  .sort((a, b) => b.rev - a.rev);

              const formatCampaigns = (map: Map<string, any>) => Array.from(map.entries())
                  .map(([name, data]) => ({ name, ...data }))
                  .sort((a, b) => b.rev - a.rev || b.leads - a.leads);

              setChannelData({
                meta: { ...agg.meta, products: formatProducts(agg.meta.products), campaigns: formatCampaigns(agg.meta.campaigns) },
                google: { ...agg.google, products: formatProducts(agg.google.products), campaigns: formatCampaigns(agg.google.campaigns) },
                organic: { ...agg.organic, products: formatProducts(agg.organic.products), campaigns: formatCampaigns(agg.organic.campaigns) },
                total: agg.total,
                winners: winningAds.sort((a, b) => b.rev - a.rev).slice(0, 10)
              });

              const totalCR = agg.total.sessions > 0 ? agg.total.sales / agg.total.sessions * 100 : 0;
              const totalROAS = agg.total.cost > 0 ? agg.total.revenue / agg.total.cost : 0;
              const totalCPL = agg.total.leads > 0 ? agg.total.cost / agg.total.leads : 0;
              const totalCPA = agg.total.sales > 0 ? agg.total.cost / agg.total.sales : 0;

              setKpis([
                { title: 'Receita Total', value: `R$ ${agg.total.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, trend: 'Faturamento Blended', isUp: true, icon: DollarSign },
                { title: 'ROAS Geral', value: `${totalROAS.toFixed(2)}x`, trend: 'Retorno sobre o Anúncio', isUp: totalROAS >= 2, icon: Activity },
                { title: 'Custo p/ Venda (CPA)', value: `R$ ${totalCPA.toFixed(2)}`, trend: 'Custo por Aquisição', isUp: false, icon: Focus },
                { title: 'Taxa Conv. Global', value: `${totalCR.toFixed(2)}%`, trend: `Vendas / ${agg.total.sessions} Sessões`, isUp: true, icon: TrendingUp },
                { title: 'Vendas Totais', value: agg.total.sales.toString(), trend: 'Todas as origens', isUp: true, icon: Users },
              ]);
            }

        } else {
          setDataStatus('error');
          const errorMsg = data?.error || 'Failed to load';
          setErrorMessage(errorMsg);
          
          if (errorMsg.includes('refresh_token') || errorMsg.includes('Invalud session token') || !res.ok) {
            handleDisconnect();
          }
        }
      } catch (err: any) {
        console.error(err);
        setDataStatus('error');
        setErrorMessage('Network error connecting to Backend.');
        
        if (err.message === 'API returned non-JSON response') {
           handleDisconnect();
        }
      }
    };

    fetchAnalytics();
  }, [tokens, propertyId, dateRange, appliedCustomDate.start, appliedCustomDate.end]);

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/auth/url');
      const { url } = await response.json();
      
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          localStorage.setItem('ga4_tokens', JSON.stringify(event.data.tokens));
          setTokens(event.data.tokens);
          setDataStatus('loading');
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
      
    } catch (error) {
      console.error('OAuth error:', error);
      setDataStatus('error');
      setErrorMessage('Falha ao iniciar login');
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('ga4_tokens');
    setTokens(null);
    setDataStatus('logged_out');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] font-sans selection:bg-[#F43F5E] selection:text-white pb-12">
      {/* Top Navigation / Header */}
      <header className="border-b border-[#222225] bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="relative group">
            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none">
              <img src={selectedCompany.logo} alt="Logo" className="w-10 h-10 rounded-full border border-[#222225] object-cover" />
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{selectedCompany.name}</h1>
                <ChevronDown className="w-4 h-4 text-[#8E9299]" />
              </div>
            </button>
            <div className="absolute top-12 left-0 w-64 bg-[#111113] border border-[#222225] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50">
              {companies.map(company => (
                 <button
                   key={company.id}
                   onClick={() => setSelectedCompanyId(company.id)}
                   className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#222225] transition-colors focus:outline-none ${selectedCompanyId === company.id ? 'bg-[#1A1A1D]' : ''}`}
                 >
                   <img src={company.logo} alt={company.name} className="w-8 h-8 object-cover rounded-full border border-[#222225]" />
                   <span className="text-sm font-medium">{company.name}</span>
                 </button>
              ))}
              {tokens && (
                <div className="p-2 border-t border-[#222225]">
                  <button 
                    onClick={handleDisconnect}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <KeyRound className="w-3 h-3" />
                    Desconectar Google
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                  onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#222225] bg-[#111113] hover:bg-[#1A1A1D] transition-colors text-sm font-medium focus:outline-none"
              >
                <CalendarDays className="w-4 h-4 text-[#8E9299]" />
                <span>{dateRangeLabels[dateRange]}</span>
                <ChevronDown className="w-4 h-4 text-[#8E9299]" />
              </button>
              
              {isDateDropdownOpen && (
                <div className="absolute top-12 right-0 w-64 bg-[#111113] border border-[#222225] rounded-xl shadow-xl z-50 p-2 text-sm">
                   {Object.entries(dateRangeLabels).map(([key, label]) => (
                     <button
                        key={key}
                        onClick={() => { 
                          setDateRange(key); 
                          if(key !== 'custom') setIsDateDropdownOpen(false); 
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-lg hover:bg-[#222225] transition-colors focus:outline-none ${dateRange === key ? 'bg-[#1A1A1D] font-medium text-white' : 'text-[#8E9299]'}`}
                     >
                       {label}
                     </button>
                   ))}

                   {dateRange === 'custom' && (
                     <div className="mt-2 pt-3 border-t border-[#222225] flex flex-col gap-3 px-2 pb-1">
                       <div className="flex flex-col gap-1">
                         <label className="text-xs text-[#8E9299]">Data de Início</label>
                         <input 
                           type="date" 
                           value={customStart} 
                           onChange={e => setCustomStart(e.target.value)} 
                           className="bg-[#050505] border border-[#222225] text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-[#8E9299]" 
                         />
                       </div>
                       <div className="flex flex-col gap-1">
                         <label className="text-xs text-[#8E9299]">Data de Fim</label>
                         <input 
                           type="date" 
                           value={customEnd} 
                           onChange={e => setCustomEnd(e.target.value)} 
                           className="bg-[#050505] border border-[#222225] text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-[#8E9299]" 
                         />
                       </div>
                       <button 
                         onClick={() => {
                           setAppliedCustomDate({ start: customStart, end: customEnd });
                           setIsDateDropdownOpen(false);
                         }}
                         className="mt-1 bg-white text-black py-2 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                       >
                         Aplicar Filtro
                       </button>
                     </div>
                   )}
                </div>
              )}
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 ml-2 rounded-full border border-[#222225] bg-[#111113] hover:bg-[#1A1A1D] transition-colors text-sm font-medium">
              <Filter className="w-4 h-4 text-[#8E9299]" />
              <span>Filtros</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* SETUP BANNER */}
        {dataStatus === 'logged_out' && (
          <div className="bg-[#111113] border border-[#222225] text-white rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-medium mb-2">Conectar Google Analytics</h3>
              <p className="text-sm text-[#8E9299] max-w-2xl mb-4">
                Para visualizar seus dados reais da propriedade {selectedCompany.name} ({propertyId}), conecte sua conta Google. Esta autorização é segura e usada apenas para leitura de dados de relatórios. Ela será salva no seu navegador para que você não precise aprovar toda vez.
              </p>
            </div>
            <button 
                onClick={handleConnect}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black hover:bg-gray-200 transition-colors font-medium whitespace-nowrap"
            >
              Conectar Conta Google
            </button>
          </div>
        )}
        
        {dataStatus === 'error' && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl p-6">
            <h3 className="text-lg font-medium mb-2 text-rose-400">Erro na Consulta da API</h3>
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-light tracking-tight mb-2">
            Performance Overview 
            {dataStatus === 'loading' && <Loader2 className="inline-block ml-4 w-5 h-5 animate-spin text-[#8E9299]" />}
          </h2>
          <p className="text-[#8E9299]">Blended data across all channels.</p>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi, idx) => (
            <Card key={idx} className="relative overflow-hidden group hover:border-[#333338] transition-colors p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-[#1A1A1D] rounded-lg group-hover:bg-[#222225] transition-colors">
                  <kpi.icon className="w-5 h-5 text-[#8E9299]" />
                </div>
              </div>
              <div>
                <p className="text-xs text-[#8E9299] mb-1 font-medium">{kpi.title}</p>
                <h3 className="text-2xl font-semibold tracking-tight">{kpi.value}</h3>
                <p className="text-xs text-[#52525B] mt-1">{kpi.trend}</p>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                <kpi.icon className="w-24 h-24" />
              </div>
            </Card>
          ))}
        </div>

        {/* Charts and Funnel Section */}
        {dataStatus === 'success' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
             <Card className="p-5 lg:col-span-2">
               <div className="flex items-center justify-between mb-6">
                 <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
                    <BarChart2 className="w-4 h-4" /> Receita vs Custo por Canal
                 </h4>
               </div>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Meta Ads', Receita: channelData.meta.revenue, Custo: channelData.meta.cost },
                        { name: 'Google Ads', Receita: channelData.google.revenue, Custo: channelData.google.cost },
                        { name: 'Orgânico', Receita: channelData.organic.revenue, Custo: 0 },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#222225" vertical={false} />
                      <XAxis dataKey="name" stroke="#8E9299" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#1A1A1D' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#8E9299', paddingTop: '20px' }} />
                      <Bar dataKey="Receita" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                      <Bar dataKey="Custo" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
             </Card>

             <Card className="p-5">
               <h4 className="text-sm font-medium mb-6 text-[#A1A1AA] flex items-center gap-2">
                  <Target className="w-4 h-4" /> Funil de Infoproduto
               </h4>
               <div className="space-y-6">
                  {[
                    { label: 'Sessões Totais', value: channelData.total.sessions, color: 'bg-white/10', icon: Activity },
                    { label: 'Criação de Leads', value: channelData.total.leads, color: 'bg-blue-500/20', icon: Users, pct: channelData.total.sessions > 0 ? (channelData.total.leads / channelData.total.sessions * 100).toFixed(1) : 0 },
                    { label: 'Vendas Realizadas', value: channelData.total.sales, color: 'bg-emerald-500/20', icon: ShoppingCart, pct: channelData.total.leads > 0 ? (channelData.total.sales / channelData.total.leads * 100).toFixed(1) : 0 },
                  ].map((step, i, arr) => (
                    <div key={i} className="relative">
                      <div className={`p-4 rounded-xl border border-white/5 ${step.color} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-black/40 rounded-lg">
                            <step.icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] text-[#8E9299] uppercase font-bold">{step.label}</p>
                            <p className="text-xl font-mono">{step.value.toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                        {step.pct && (
                          <div className="text-right">
                            <p className="text-[10px] text-[#8E9299] mb-1 font-medium">Tx. Conversão</p>
                            <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-md">{step.pct}%</span>
                          </div>
                        )}
                      </div>
                      {i < arr.length - 1 && (
                        <div className="flex justify-center my-1">
                          <ChevronDown className="w-4 h-4 text-gray-700" />
                        </div>
                      )}
                    </div>
                  ))}
               </div>
               <div className="mt-6 pt-6 border-t border-[#222225] flex justify-between items-center">
                 <span className="text-xs text-[#8E9299]">Tx. de Venda Global</span>
                 <span className="text-sm font-bold text-emerald-400">
                    {channelData.total.sessions > 0 ? (channelData.total.sales / channelData.total.sessions * 100).toFixed(2) : 0}%
                 </span>
               </div>
             </Card>
          </div>
        )}

        {/* Winning Ads and Products Matrix */}
        {dataStatus === 'success' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card className="p-0 overflow-hidden">
                <div className="p-5 border-b border-[#222225] flex items-center justify-between bg-gradient-to-r from-[#111113] to-transparent">
                   <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" /> Anúncios Ganhadores (Escalar)
                   </h4>
                   <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 font-bold">Top ROI</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                   <table className="w-full text-left">
                      <thead className="bg-[#111113]/50 sticky top-0 z-10">
                        <tr>
                          <th className="p-4 text-[10px] text-[#52525B] uppercase font-bold">Campanha / Anúncio</th>
                          <th className="p-4 text-[10px] text-[#52525B] uppercase font-bold text-right">Vendas</th>
                          <th className="p-4 text-[10px] text-[#52525B] uppercase font-bold text-right">Receita</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222225]/50">
                        {channelData.winners?.map((win: any, i: number) => (
                           <tr key={i} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 flex items-center gap-3">
                                 <div className={`w-1.5 h-1.5 rounded-full ${win.source === 'meta' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                                 <span className="text-xs text-[#FAFAFA] truncate max-w-[240px]" title={win.name}>{win.name}</span>
                              </td>
                              <td className="p-4 text-xs font-mono text-center">{win.sales}</td>
                              <td className="p-4 text-xs font-mono text-right text-emerald-400">R$ {win.rev.toLocaleString('pt-BR')}</td>
                           </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </Card>

             <Card className="p-0 overflow-hidden">
                <div className="p-5 border-b border-[#222225] flex items-center justify-between bg-gradient-to-r from-[#111113] to-transparent">
                   <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" /> Qual curso está vendendo?
                   </h4>
                   <span className="text-[10px] text-[#8E9299]">Ordenado por Receita</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-[#111113]/50 sticky top-0 z-10">
                        <tr>
                          <th className="p-4 text-[10px] text-[#52525B] uppercase font-bold">Infoproduto</th>
                          <th className="p-4 text-[10px] text-[#52525B] uppercase font-bold text-right">Vendas</th>
                          <th className="p-4 text-[10px] text-[#52525B] uppercase font-bold text-right">ROAS</th>
                          <th className="p-4 text-[10px] text-[#52525B] uppercase font-bold text-right">Receita</th>
                        </tr>
                      </thead>
                      <tbody className="bg-[#111113]/20">
                        {[...channelData.meta.products, ...channelData.google.products, ...channelData.organic.products]
                          .sort((a: any, b: any) => b.rev - a.rev)
                          .map((p: any, i: number) => (
                            <ProductRow key={i} p={p} />
                          ))}
                      </tbody>
                   </table>
                </div>
             </Card>
          </div>
        )}

        {/* Channels Breakdown */}
        {dataStatus === 'success' && (
          <div className="space-y-6 mt-8">
            <h2 className="text-2xl font-light tracking-tight mb-4 border-b border-[#222225] pb-2">
              Detalhamento de Canais
            </h2>
            
            {[
              { id: 'meta', name: 'Meta Ads', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
              { id: 'google', name: 'Google Ads', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
              { id: 'organic', name: 'Tráfego Orgânico / Direto', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
            ].map(channel => {
              const data = channelData[channel.id];
              if (!data) return null;
              
              const cr = data.sessions > 0 ? (data.sales) / data.sessions * 100 : 0;
              const roas = data.cost > 0 ? data.revenue / data.cost : 0;
              const cpa = data.sales > 0 ? data.cost / data.sales : 0;
              const roasColor = roas > 3 ? 'text-emerald-400' : roas >= 1.5 ? 'text-amber-400' : roas > 0 ? 'text-rose-400' : 'text-gray-400';

              return (
                <Card key={channel.id} className="p-0 overflow-hidden border border-[#222225]">
                  <div className="p-5 border-b border-[#222225] flex justify-between items-center bg-[#0A0A0A]">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${channel.color}`}>
                        {channel.name}
                      </span>
                      {data.cost === 0 && channel.id !== 'organic' && (
                        <div className="group relative flex items-center">
                          <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 cursor-help">
                            ⚠️ Sem dados de custo no GA4
                          </span>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl text-xs text-gray-300 z-50">
                            <p className="font-semibold text-white mb-1">Como enviar o custo da Meta para o GA4?</p>
                            <p className="mb-2">O GA4 só importa custos automaticamente do Google Ads. Para Facebook/Meta Ads, o GTM não lê essas informações.</p>
                            <p>Você precisa usar o <b>Data Import do GA4</b> (Admin &gt; Data Import &gt; Cost Data) enviando um CSV (manualmente ou via ferramentas como API, Zapier, Supermetrics, etc).</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-[#222225] bg-[#111113]">
                    <div className="p-4 flex flex-col justify-center">
                      <span className="text-xs text-[#8E9299] font-medium mb-1">Receita Gerada</span>
                      <span className="text-lg font-semibold">R$ {data.revenue.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <span className="text-xs text-[#8E9299] font-medium mb-1">Custo Total</span>
                      <span className="text-lg font-semibold text-red-400">R$ {data.cost.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <span className="text-xs text-[#8E9299] font-medium mb-1">ROAS</span>
                      <span className={`text-lg font-semibold ${roasColor}`}>{roas.toFixed(2)}x</span>
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <span className="text-xs text-[#8E9299] font-medium mb-1">Vendas (Qtd)</span>
                      <span className="text-lg font-semibold">{data.sales}</span>
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <span className="text-xs text-[#8E9299] font-medium mb-1">Custo por Venda (CPA)</span>
                      <span className="text-lg font-semibold">R$ {cpa.toFixed(2)}</span>
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <span className="text-xs text-[#8E9299] font-medium mb-1">Taxa de Conversão</span>
                      <span className="text-lg font-semibold">{cr.toFixed(2)}%</span>
                    </div>
                  </div>

                  {(data.products?.length > 0 || data.campaigns?.length > 0) && (
                    <div className="p-5 bg-[#050505] border-t border-[#222225] grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {data.products && data.products.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-3 text-[#A1A1AA] flex items-center gap-2">
                            <Focus className="w-4 h-4" /> Detalhamento de Cursos (Canais)
                          </h4>
                          <div className="overflow-x-auto rounded-lg border border-[#222225]">
                            <table className="w-full text-left">
                              <thead className="bg-[#111113]">
                                <tr>
                                  <th className="text-[10px] font-medium text-[#8E9299] p-3 uppercase tracking-wider">Produto</th>
                                  <th className="text-[10px] font-medium text-[#8E9299] p-3 uppercase tracking-wider text-right">Qtd</th>
                                  <th className="text-[10px] font-medium text-[#8E9299] p-3 uppercase tracking-wider text-right">Receita</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#222225] bg-[#0A0A0A]">
                                {data.products.map((p: any, i: number) => (
                                  <ProductRow key={i} p={p} />
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {data.campaigns && data.campaigns.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-3 text-[#A1A1AA] flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Top Campanhas / Origens
                          </h4>
                          <div className="overflow-x-auto rounded-lg border border-[#222225]">
                            <table className="w-full text-left">
                              <thead className="bg-[#111113]">
                                <tr>
                                  <th className="text-[10px] font-medium text-[#8E9299] p-3 uppercase tracking-wider">Campanha</th>
                                  <th className="text-[10px] font-medium text-[#8E9299] p-3 uppercase tracking-wider text-right w-24">Vendas</th>
                                  <th className="text-[10px] font-medium text-[#8E9299] p-3 uppercase tracking-wider text-right w-24">Taxa %</th>
                                  <th className="text-[10px] font-medium text-[#8E9299] p-3 uppercase tracking-wider text-right w-32">Receita</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#222225] bg-[#0A0A0A]">
                                {data.campaigns.map((c: any, i: number) => {
                                  const totalCampSales = data.sales || 1;
                                  const pct = (c.sales / totalCampSales) * 100;
                                  return (
                                  <tr key={i} className="hover:bg-[#111113] transition-colors">
                                    <td className="p-3 text-xs text-[#E4E3E0] max-w-[200px] truncate" title={c.name}>{c.name}</td>
                                    <td className="p-3 text-xs text-right font-mono text-[#8E9299]">{c.sales}</td>
                                    <td className="p-3 text-xs text-right font-mono text-[#8E9299]">
                                      <div className="flex items-center justify-end gap-2">
                                        <div className="w-12 h-1.5 bg-[#222225] rounded-full overflow-hidden">
                                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                        </div>
                                        <span className="w-8">{pct.toFixed(0)}%</span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-xs text-right font-mono text-emerald-400">R$ {c.rev.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                  </tr>
                                )})}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, DollarSign, Activity, Focus,
  ArrowUpRight, ArrowDownRight, Filter, CalendarDays, Loader2, KeyRound, ChevronDown, ChevronRight, PieChart as PieChartIcon, BarChart2,
  Zap, Target, ShoppingCart, Award, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
const Card = ({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`bg-[#0F0F12]/60 backdrop-blur-xl border border-white/[0.05] rounded-3xl shadow-2xl shadow-black/50 ${className}`}
    {...(props as any)}
  >
    {children}
  </motion.div>
);

const KpiCard = ({ title, value, trend, isUp, icon: Icon, color = "blue" }: any) => {
  const colors: Record<string, string> = {
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    rose: "text-rose-400 bg-rose-400/10 border-rose-400/20",
    amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  };
  
  return (
    <Card className="p-7 relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className={`absolute -top-4 -right-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 rounded-full ${colors[color].split(' ')[1]}`} />
      
      <div className="flex items-center justify-between mb-5">
        <div className={`p-3 rounded-2xl border ${colors[color] || colors.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-tight ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
          {trend}
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-[10px] text-[#8E9299] uppercase font-medium tracking-[0.2em]">{title}</p>
        <h3 className="text-3xl font-medium text-white tracking-tight leading-none">{value}</h3>
      </div>
    </Card>
  );
};

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
           <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${roas > 3 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
             {roas > 0 ? `${roas.toFixed(1)}x` : '-'}
           </span>
        </td>
        <td className="p-4 text-xs text-right font-mono text-emerald-400">R$ {p.rev.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
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
                { title: 'Receita Total', value: `R$ ${agg.total.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, trend: 'Blended', isUp: true, icon: DollarSign, color: "emerald" },
                { title: 'ROAS Geral', value: `${totalROAS.toFixed(2)}x`, trend: 'GA4 Data', isUp: totalROAS >= 2, icon: Activity, color: "blue" },
                { title: 'Custo por Venda', value: `R$ ${totalCPA.toFixed(2)}`, trend: 'CPA Médio', isUp: false, icon: Target, color: "rose" },
                { title: 'Vendas Totais', value: agg.total.sales.toString(), trend: 'Consolidados', isUp: true, icon: ShoppingCart, color: "amber" },
                { title: 'Taxa Conv.', value: `${totalCR.toFixed(2)}%`, trend: 'Sessões', isUp: true, icon: TrendingUp, color: "blue" },
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
    <div className="min-h-screen bg-[#050507] text-[#FAFAFA] font-sans selection:bg-blue-500/30 selection:text-white pb-12 overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full opacity-60 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full opacity-40 animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-rose-500/5 blur-[120px] rounded-full opacity-30 animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* Top Navigation / Header */}
      <header className="border-b border-white/[0.05] bg-[#050507]/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="relative group">
              <button className="flex items-center gap-4 hover:opacity-80 transition-all focus:outline-none bg-white/[0.03] px-4 py-2 rounded-2xl border border-white/5">
                <div className="relative">
                  <img src={selectedCompany.logo} alt="Logo" className="w-9 h-9 rounded-xl object-cover ring-2 ring-white/10" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#050507] rounded-full shadow-lg" />
                </div>
                <div className="flex flex-col items-start">
                  <h1 className="text-sm font-medium uppercase tracking-tight flex items-center gap-2">
                    {selectedCompany.name} <ChevronDown className="w-3 h-3 text-[#52525B]" />
                  </h1>
                  <span className="text-[10px] font-mono text-[#52525B] leading-none">Property ID: {propertyId}</span>
                </div>
              </button>
              
              <div className="absolute top-14 left-0 w-72 bg-[#0F0F12] border border-white/10 rounded-3xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 overflow-hidden z-50 backdrop-blur-xl">
                <div className="p-3 text-[10px] text-[#52525B] font-medium uppercase tracking-widest border-b border-white/5">Selecionar Unidade</div>
                <div className="p-1">
                  {companies.map(company => (
                    <button
                      key={company.id}
                      onClick={() => setSelectedCompanyId(company.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] rounded-2xl transition-all focus:outline-none ${selectedCompanyId === company.id ? 'bg-white/[0.05]' : ''}`}
                    >
                      <img src={company.logo} alt={company.name} className="w-8 h-8 object-cover rounded-xl border border-white/10" />
                      <div className="text-left">
                        <span className="text-sm font-medium block leading-none mb-1">{company.name}</span>
                        <span className="text-[9px] text-[#52525B] font-mono">ID: {company.propertyId}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                  onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                  className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] transition-all text-xs font-medium uppercase tracking-widest focus:outline-none shadow-lg shadow-black/20"
              >
                <CalendarDays className="w-4 h-4 text-blue-400" />
                <span>{dateRangeLabels[dateRange]}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isDateDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute top-14 right-0 w-64 bg-[#0F0F12] border border-white/10 rounded-3xl shadow-2xl z-50 p-2 text-sm backdrop-blur-xl"
                  >
                     <div className="grid grid-cols-1 gap-1">
                       {Object.entries(dateRangeLabels).map(([key, label]) => (
                         <button
                            key={key}
                            onClick={() => { 
                              setDateRange(key); 
                              if(key !== 'custom') setIsDateDropdownOpen(false); 
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded-2xl hover:bg-white/[0.03] transition-all focus:outline-none flex items-center justify-between ${dateRange === key ? 'bg-blue-500/10 text-blue-400' : 'text-[#8E9299]'}`}
                         >
                           <span className="font-medium">{label}</span>
                           {dateRange === key && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />}
                         </button>
                       ))}
                     </div>

                     {dateRange === 'custom' && (
                       <div className="mt-2 pt-4 border-t border-white/5 flex flex-col gap-4 px-3 pb-2">
                         <div className="flex flex-col gap-2">
                           <label className="text-[10px] text-[#52525B] font-medium uppercase tracking-widest">Início</label>
                           <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-black/40 border border-white/5 text-white px-4 py-3 rounded-xl text-xs focus:outline-none focus:border-blue-500/50" />
                         </div>
                         <div className="flex flex-col gap-2">
                           <label className="text-[10px] text-[#52525B] font-medium uppercase tracking-widest">Fim</label>
                           <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-black/40 border border-white/5 text-white px-4 py-3 rounded-xl text-xs focus:outline-none focus:border-blue-500/50" />
                         </div>
                         <button 
                           onClick={() => {
                             setAppliedCustomDate({ start: customStart, end: customEnd });
                             setIsDateDropdownOpen(false);
                           }}
                           className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-medium uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                         >
                           Aplicar Filtro
                         </button>
                       </div>
                     )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {tokens && (
              <button 
                onClick={handleDisconnect}
                className="p-3 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                title="Desconectar Google"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12 space-y-12 relative z-10">
        
        {/* SETUP BANNER */}
        {dataStatus === 'logged_out' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-10 text-center max-w-3xl mx-auto border-dashed border-blue-500/30 bg-blue-500/[0.02]">
              <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <KeyRound className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="text-3xl font-medium mb-4 text-white tracking-tight uppercase">Conectar Google Analytics</h2>
              <p className="text-sm text-[#8E9299] max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                Sincronize sua conta Google para transformar os dados brutos da unidade <span className="text-white">{selectedCompany.name}</span> em inteligência competitiva e ROAS real.
              </p>
              <button 
                  onClick={handleConnect}
                  className="inline-flex items-center gap-3 px-10 py-5 rounded-3xl bg-blue-600 hover:bg-blue-500 text-white font-medium uppercase tracking-[0.2em] text-xs transition-all shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95"
              >
                Conectar Conta GA4 <ChevronRight className="w-4 h-4" />
              </button>
            </Card>
          </motion.div>
        )}
        
        {dataStatus === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded-3xl p-8 flex items-center gap-6">
              <div className="p-4 bg-rose-500/10 rounded-2xl">
                 <Zap className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-medium uppercase mb-1 tracking-tight">Falha Crítica no Sistema</p>
                <p className="text-sm text-amber-400 font-medium">{errorMessage}</p>
              </div>
              <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-medium transition-all">Recarregar</button>
            </div>
          </motion.div>
        )}

        {propertyId && dataStatus === 'success' && (
          <div className="space-y-12">
            <div>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#52525B]">Live Performance Insight</span>
                  </div>
                  <h2 className="text-4xl font-medium tracking-tight text-white uppercase">
                    Visão Geral do Resultado
                  </h2>
                </div>
                {dataStatus === 'loading' && (
                  <div className="flex items-center gap-2 text-[#8E9299]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-medium uppercase tracking-widest">Sincronizando...</span>
                  </div>
                )}
              </div>

              {/* KPIs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {kpis.map((kpi: any, idx) => (
                  <KpiCard key={idx} {...kpi} />
                ))}
              </div>
            </div>

            {/* Charts and Funnel Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="p-8 lg:col-span-2 relative">
                <div className="flex items-center justify-between mb-10">
                  <h4 className="text-xs font-medium text-[#8E9299] uppercase tracking-[0.2em] flex items-center gap-3">
                    <BarChart2 className="w-5 h-5 text-blue-500" /> Comparativo de Atribuição (Vendas x Custo)
                  </h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                      <span className="text-[10px] text-[#52525B] font-medium uppercase">Receita</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
                      <span className="text-[10px] text-[#52525B] font-medium uppercase">Custo</span>
                    </div>
                  </div>
                </div>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'META ADS', Receita: channelData.meta.revenue, Custo: channelData.meta.cost },
                        { name: 'GOOGLE ADS', Receita: channelData.google.revenue, Custo: channelData.google.cost },
                        { name: 'ORGÂNICO', Receita: channelData.organic.revenue, Custo: 0 },
                      ]}
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="name" stroke="#52525B" fontSize={11} fontWeight={900} tickLine={false} axisLine={false} dy={15} />
                      <YAxis stroke="#52525B" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                      <Bar dataKey="Receita" fill="#10b981" radius={[8, 8, 0, 0]} barSize={32} />
                      <Bar dataKey="Custo" fill="#f43f5e" radius={[8, 8, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-8 border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                <h4 className="text-xs font-medium text-[#8E9299] uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-500" /> Funil de Infoproduto
                </h4>
                <div className="space-y-8 relative">
                  <div className="absolute left-1/2 top-4 bottom-4 w-[1px] bg-white/[0.05] -translate-x-1/2" />
                  {[
                    { label: 'Visitas no Site', value: channelData.total.sessions, color: 'text-white', icon: Activity, bg: 'bg-white/5' },
                    { label: 'Checkouts/Leads', value: channelData.total.leads, color: 'text-blue-400', icon: Users, bg: 'bg-blue-500/10', pct: channelData.total.sessions > 0 ? (channelData.total.leads / channelData.total.sessions * 100).toFixed(1) : 0 },
                    { label: 'Vendas Pagas', value: channelData.total.sales, color: 'text-emerald-400', icon: ShoppingCart, bg: 'bg-emerald-500/10', pct: channelData.total.leads > 0 ? (channelData.total.sales / channelData.total.leads * 100).toFixed(1) : 0 },
                  ].map((step, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center">
                      <div className={`p-4 rounded-2xl ${step.bg} border border-white/5 backdrop-blur-md w-full group hover:border-white/10 transition-all`}>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-black/40 rounded-xl group-hover:scale-110 transition-transform">
                                <step.icon className={`w-4 h-4 ${step.color}`} />
                              </div>
                              <div>
                                <p className="text-[10px] text-[#52525B] font-medium uppercase tracking-widest">{step.label}</p>
                                <p className="text-xl font-medium tracking-tight">{step.value.toLocaleString('pt-BR')}</p>
                              </div>
                           </div>
                           {step.pct && (
                             <div className="text-right">
                               <p className="text-[9px] text-[#52525B] font-medium uppercase mb-1">Conversão</p>
                               <span className={`text-xs font-medium px-2 py-1 rounded-lg bg-black/40 border border-white/5 ${step.color}`}>{step.pct}%</span>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#52525B] font-medium uppercase tracking-widest">Taxa de Venda (Global)</span>
                    <span className="text-lg font-medium text-emerald-400 tracking-tight">
                       {channelData.total.sessions > 0 ? (channelData.total.sales / channelData.total.sessions * 100).toFixed(2) : 0}%
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Winning Ads and Products Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-0 overflow-hidden border-white/5">
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/5">
                        <Award className="w-5 h-5 text-amber-500" />
                     </div>
                     <div>
                       <h4 className="text-xs font-medium text-white uppercase tracking-[0.2em]">Top Anúncios (Escalar)</h4>
                       <p className="text-[10px] text-[#52525B] font-medium">Campanhas com custo/benefício superior</p>
                     </div>
                   </div>
                </div>
                <div className="max-h-[440px] overflow-y-auto custom-scrollbar">
                   <table className="w-full text-left">
                      <thead className="bg-[#0A0A0C] sticky top-0 z-20">
                        <tr>
                          <th className="p-5 text-[10px] text-[#52525B] uppercase font-medium tracking-widest">Ativo / Campanha</th>
                          <th className="p-5 text-[10px] text-[#52525B] uppercase font-medium tracking-widest text-right">Vendas</th>
                          <th className="p-5 text-[10px] text-[#52525B] uppercase font-medium tracking-widest text-right">Faturamento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {channelData.winners?.map((win: any, i: number) => (
                           <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="p-5 flex items-center gap-4">
                                 <div className={`w-2 h-2 rounded-full ${win.source === 'meta' ? 'bg-blue-500' : 'bg-rose-500'} shadow-[0_0_8px_rgba(0,0,0,0)] group-hover:shadow-current transition-all`} />
                                 <span className="text-xs text-[#FAFAFA] font-medium truncate max-w-[280px]" title={win.name}>{win.name}</span>
                              </td>
                              <td className="p-5 text-xs font-mono text-center font-medium text-[#8E9299]">{win.sales}</td>
                              <td className="p-5 text-sm font-medium text-right text-emerald-400 tracking-tight px-6">R$ {win.rev.toLocaleString('pt-BR')}</td>
                           </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </Card>

              <Card className="p-0 overflow-hidden border-white/5">
                 <div className="p-8 border-b border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
                         <ShoppingCart className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-white uppercase tracking-[0.2em]">Cursos & Infoprodutos</h4>
                        <p className="text-[10px] text-[#52525B] font-medium">Rankings de faturamento por item</p>
                      </div>
                    </div>
                 </div>
                 <div className="max-h-[440px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-[#0A0A0C] sticky top-0 z-20">
                         <tr>
                           <th className="p-5 text-[10px] text-[#52525B] uppercase font-medium tracking-widest">Produto</th>
                           <th className="p-5 text-[10px] text-[#52525B] uppercase font-medium tracking-widest text-right">Qtd</th>
                           <th className="p-5 text-[10px] text-[#52525B] uppercase font-medium tracking-widest text-right">ROI</th>
                           <th className="p-5 text-[10px] text-[#52525B] uppercase font-medium tracking-widest text-right">Faturamento</th>
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

            {/* Channels Breakdown */}
            <div className="space-y-8">
              {[
                { id: 'meta', name: 'Meta Ads', icon: Activity, color: 'text-blue-400' },
                { id: 'google', name: 'Google Ads', icon: Zap, color: 'text-rose-400' },
                { id: 'organic', name: 'Orgânico', icon: TrendingUp, color: 'text-emerald-400' }
              ].map(channel => {
                const data = channelData[channel.id];
                if (!data) return null;
                
                const cr = data.sessions > 0 ? (data.sales) / data.sessions * 100 : 0;
                const roas = data.cost > 0 ? data.revenue / data.cost : 0;
                const cpa = data.sales > 0 ? data.cost / data.sales : 0;
                const roasColor = roas > 3 ? 'text-emerald-400' : roas >= 1.5 ? 'text-amber-400' : roas > 0 ? 'text-rose-400' : 'text-gray-400';

                return (
                  <Card key={channel.id} className="p-0 overflow-hidden border-white/5">
                    <div className="p-8 bg-gradient-to-r from-white/[0.03] to-transparent border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl bg-black/40 border border-white/5 ${channel.color}`}>
                          <channel.icon className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-medium uppercase tracking-tight text-white">{channel.name}</h3>
                          <p className="text-[10px] text-[#52525B] font-medium uppercase tracking-[0.2em]">{data.sessions.toLocaleString()} Sessões Identificadas</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-8 bg-black/40 p-6 rounded-3xl border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#52525B] font-medium uppercase tracking-widest mb-1">Receita</span>
                          <span className="text-xl font-medium text-white tracking-tight">R$ {data.revenue.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#52525B] font-medium uppercase tracking-widest mb-1">Custo</span>
                          <span className="text-xl font-medium text-rose-500 tracking-tight">R$ {data.cost.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#52525B] font-medium uppercase tracking-widest mb-1">ROAS</span>
                          <span className={`text-xl font-medium tracking-tight ${roasColor}`}>{roas.toFixed(2)}x</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#52525B] font-medium uppercase tracking-widest mb-1">Vendas</span>
                          <span className="text-xl font-medium text-white tracking-tight">{data.sales}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#52525B] font-medium uppercase tracking-widest mb-1">CPA</span>
                          <span className="text-xl font-medium text-white tracking-tight">R$ {cpa.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>

                    {(data.products?.length > 0 || data.campaigns?.length > 0) && (
                      <div className="p-8 bg-black/20 space-y-10">
                        {data.campaigns && data.campaigns.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#52525B] mb-5 flex items-center gap-3">
                              <Target className="w-4 h-4 text-blue-500" /> Detalhamento de Ativos & Campanhas
                            </h4>
                            <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#050507]">
                              <table className="w-full text-left">
                                <thead className="bg-[#111113]">
                                  <tr>
                                    <th className="text-[10px] font-medium text-[#52525B] p-5 uppercase tracking-widest">Campanha / Criativo</th>
                                    <th className="text-[10px] font-medium text-[#52525B] p-5 uppercase tracking-widest text-right w-24">Vendas</th>
                                    <th className="text-[10px] font-medium text-[#52525B] p-5 uppercase tracking-widest text-right w-32">Participação</th>
                                    <th className="text-[10px] font-medium text-[#52525B] p-5 uppercase tracking-widest text-right w-32">Receita</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {data.campaigns.map((c: any, i: number) => {
                                    const totalCampSales = data.sales || 1;
                                    const pct = (c.sales / totalCampSales) * 100;
                                    return (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                                      <td className="p-5 text-xs text-[#E4E3E0] max-w-[280px] truncate font-medium group-hover:text-white" title={c.name}>{c.name}</td>
                                      <td className="p-5 text-xs text-right font-mono text-[#8E9299] font-medium">{c.sales}</td>
                                      <td className="p-5 text-xs text-right font-mono text-[#8E9299]">
                                        <div className="flex items-center justify-end gap-3">
                                          <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                                          </div>
                                          <span className="w-10 text-[10px] font-medium">{pct.toFixed(0)}%</span>
                                        </div>
                                      </td>
                                      <td className="p-5 text-sm text-right font-medium text-emerald-400 tracking-tight">R$ {c.rev.toLocaleString('pt-BR')}</td>
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
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 mt-12 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-medium uppercase tracking-[0.3em] text-[#52525B] relative z-10">
        <div>© 2026 Traffic Performance Engine</div>
        <div className="flex items-center gap-8">
          <span className="hover:text-white transition-colors cursor-pointer">Security Portal</span>
          <span className="hover:text-white transition-colors cursor-pointer">GA4 Cloud Sync</span>
          <span className="hover:text-white transition-colors cursor-pointer">Export Ledger</span>
        </div>
      </footer>
    </div>
  );
}


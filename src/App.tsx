import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, DollarSign, Activity, Focus,
  ArrowUpRight, ArrowDownRight, Filter, CalendarDays, Loader2, KeyRound, ChevronDown
} from 'lucide-react';

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
        const data = await res.json();
        
        if (data.status === 'success') {
          setDataStatus('success');
          console.log("Real GA4 Data received:", data.data);

            if (data.data && data.data.sources && data.data.sources.rows) {
              const srcRows = data.data.sources.rows;
              const itmRows = data.data.items?.rows || [];

              const agg = {
                meta: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0, products: new Map<string, {qty: number, rev: number}>() },
                google: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0, products: new Map<string, {qty: number, rev: number}>() },
                organic: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0, products: new Map<string, {qty: number, rev: number}>() },
                total: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0 }
              };

              // Process Sources
              console.log("Raw Sources from GA4:", srcRows.map((r: any) => ({
                source: r.dimensionValues?.[0]?.value,
                sessions: r.metricValues?.[0]?.value,
                revenue: r.metricValues?.[3]?.value,
                cost: r.metricValues?.[4]?.value
              })));

              srcRows.forEach((row: any) => {
                const source = (row.dimensionValues?.[0]?.value || 'direct').toLowerCase();
                const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);
                const conversions = parseInt(row.metricValues?.[1]?.value || '0', 10);
                const sales = parseInt(row.metricValues?.[2]?.value || '0', 10);
                const revenue = parseFloat(row.metricValues?.[3]?.value || '0');
                const cost = parseFloat(row.metricValues?.[4]?.value || '0');
                
                let leads = Math.max(0, conversions - sales);
                if (leads === 0 && conversions > 0 && sales === 0) leads = conversions; 

                let cat = 'organic';
                // Detect Google Ads
                if (source.includes('google') || source.includes('cpc') || source.includes('ads') || source.includes('gclid')) {
                  cat = 'google';
                } 
                // Detect Meta Ads (Facebook/Instagram) - Including common referral patterns
                else if (
                  source.includes('fb') || 
                  source.includes('meta') || 
                  source.includes('ig') || 
                  source.includes('instagram') || 
                  source.includes('facebook') || 
                  source.includes('messenger')
                ) {
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

              // Process Items
              itmRows.forEach((row: any) => {
                const source = (row.dimensionValues?.[0]?.value || 'direct').toLowerCase();
                const itemName = row.dimensionValues?.[1]?.value || 'Unknown Product';
                if (itemName === '(not set)') return;

                const qty = parseInt(row.metricValues?.[0]?.value || '0', 10);
                const rev = parseFloat(row.metricValues?.[1]?.value || '0');

                if (qty === 0 && rev === 0) return;

                let cat = 'organic';
                if (source.includes('google') || source.includes('cpc') || source.includes('ads')) cat = 'google';
                else if (source.includes('fb') || source.includes('meta') || source.includes('ig') || source.includes('instagram')) cat = 'meta';

                const pMap = (agg[cat as keyof typeof agg] as any).products;
                if (!pMap.has(itemName)) {
                  pMap.set(itemName, { qty: 0, rev: 0 });
                }
                const p = pMap.get(itemName);
                p.qty += qty;
                p.rev += rev;
              });

              // Convert product maps to sorted arrays
              const formatProducts = (map: Map<string, any>) => Array.from(map.entries())
                  .map(([name, data]) => ({ name, ...data }))
                  .sort((a, b) => b.rev - a.rev);

              setChannelData({
                meta: { ...agg.meta, products: formatProducts(agg.meta.products) },
                google: { ...agg.google, products: formatProducts(agg.google.products) },
                organic: { ...agg.organic, products: formatProducts(agg.organic.products) },
                total: agg.total
              });

              const totalCR = agg.total.sessions > 0 ? (agg.total.sales + agg.total.leads) / agg.total.sessions * 100 : 0;
              const totalROAS = agg.total.cost > 0 ? agg.total.revenue / agg.total.cost : 0;
              const totalCPL = agg.total.leads > 0 ? agg.total.cost / agg.total.leads : 0;

              setKpis([
                { title: 'Receita Total', value: `R$ ${agg.total.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, trend: 'Exato', isUp: true, icon: DollarSign },
                { title: 'ROAS Geral', value: `${totalROAS.toFixed(2)}x`, trend: 'Baseado no GA4', isUp: totalROAS > 2, icon: Activity },
                { title: 'Leads Totais', value: agg.total.leads.toString(), trend: 'Todas as origens', isUp: true, icon: Users },
                { title: 'Custo por Lead (CPL)', value: `R$ ${totalCPL.toFixed(2)}`, trend: 'Média Geral', isUp: false, icon: Focus },
                { title: 'Taxa Conv. Geral', value: `${totalCR.toFixed(2)}%`, trend: `de ${agg.total.sessions} sessões`, isUp: true, icon: TrendingUp },
              ]);
            }

        } else {
          setDataStatus('error');
          setErrorMessage(data.error || 'Failed to load');
        }
      } catch (err) {
        console.error(err);
        setDataStatus('error');
        setErrorMessage('Network error connecting to Backend.');
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
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
      
    } catch (error) {
      console.error('OAuth error:', error);
      setDataStatus('error');
      setErrorMessage('Failed to initiate login');
    }
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
              
              const cr = data.sessions > 0 ? (data.sales + data.leads) / data.sessions * 100 : 0;
              const roas = data.cost > 0 ? data.revenue / data.cost : 0;
              const cpl = data.leads > 0 ? data.cost / data.leads : 0;

              return (
                <Card key={channel.id} className="p-0 overflow-hidden border border-[#222225]">
                  <div className="p-5 border-b border-[#222225] flex justify-between items-center bg-[#0A0A0A]">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${channel.color}`}>
                        {channel.name}
                      </span>
                      {data.cost === 0 && channel.id !== 'organic' && (
                        <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          ⚠️ Sem dados de custo no GA4
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-[#222225] bg-[#111113]">
                    <div className="p-4 flex flex-col justify-center">
                      <span className="text-xs text-[#8E9299] font-medium mb-1">Receita Gerada</span>
                      <span className="text-lg font-semibold">R$ {data.revenue.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <span className="text-xs text-[#8E9299] font-medium mb-1">ROAS</span>
                      <span className="text-lg font-semibold">{roas.toFixed(2)}x</span>
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <span className="text-xs text-[#8E9299] font-medium mb-1">Taxa de Conversão</span>
                      <span className="text-lg font-semibold">{cr.toFixed(2)}%</span>
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <span className="text-xs text-[#8E9299] font-medium mb-1">Leads Gerados</span>
                      <span className="text-lg font-semibold">{data.leads}</span>
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <span className="text-xs text-[#8E9299] font-medium mb-1">Custo por Lead (CPL)</span>
                      <span className="text-lg font-semibold">R$ {cpl.toFixed(2)}</span>
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <span className="text-xs text-[#8E9299] font-medium mb-1">Vendas (Qtd)</span>
                      <span className="text-lg font-semibold">{data.sales}</span>
                    </div>
                  </div>

                  {data.products && data.products.length > 0 && (
                    <div className="p-5 bg-[#050505] border-t border-[#222225]">
                      <h4 className="text-sm font-medium mb-3 text-[#A1A1AA]">Produtos Vendidos</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr>
                              <th className="text-xs font-medium text-[#52525B] pb-2 uppercase tracking-wide">Produto</th>
                              <th className="text-xs font-medium text-[#52525B] pb-2 uppercase tracking-wide text-right">Qtd</th>
                              <th className="text-xs font-medium text-[#52525B] pb-2 uppercase tracking-wide text-right">Receita</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#222225]">
                            {data.products.map((p: any, i: number) => (
                              <tr key={i} className="hover:bg-[#111113] transition-colors">
                                <td className="py-2 text-sm text-[#E4E3E0] max-w-[200px] truncate">{p.name}</td>
                                <td className="py-2 text-sm text-right font-mono text-[#8E9299]">{p.qty}</td>
                                <td className="py-2 text-sm text-right font-mono text-[#8E9299]">R$ {p.rev.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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


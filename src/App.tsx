import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, Activity, Focus,
  ArrowUpRight, ArrowDownRight, Filter, CalendarDays, Loader2, KeyRound
} from 'lucide-react';

// --- MOCK DATA ---
const mockPerformanceData = [
  { date: '01/05', organic: 120, meta: 80, google: 150 },
  { date: '02/05', organic: 132, meta: 95, google: 160 },
  { date: '03/05', organic: 141, meta: 110, google: 140 },
  { date: '04/05', organic: 158, meta: 130, google: 180 },
  { date: '05/05', organic: 145, meta: 140, google: 175 },
  { date: '06/05', organic: 160, meta: 165, google: 210 },
  { date: '07/05', organic: 175, meta: 180, google: 230 },
  { date: '08/05', organic: 182, meta: 195, google: 250 },
  { date: '09/05', organic: 190, meta: 210, google: 240 },
  { date: '10/05', organic: 210, meta: 190, google: 270 },
  { date: '11/05', organic: 225, meta: 230, google: 290 },
  { date: '12/05', organic: 240, meta: 250, google: 310 },
  { date: '13/05', organic: 255, meta: 280, google: 325 },
  { date: '14/05', organic: 270, meta: 310, google: 350 },
];

const mockSourceDistribution = [
  { name: 'Organic Search', value: 35, color: '#10B981' }, // Emerald
  { name: 'Meta Ads', value: 25, color: '#3B82F6' }, // Blue
  { name: 'Google Ads', value: 40, color: '#F43F5E' }, // Rose
];

const mockCampaignData = [
  { id: 1, name: 'Retargeting_LAL_30D', platform: 'Meta', conversions: 342, cpa: 12.50, roas: 4.2, spend: 4275 },
  { id: 2, name: 'Search_Brand_Exact', platform: 'Google', conversions: 512, cpa: 8.20, roas: 5.8, spend: 4198 },
  { id: 3, name: 'Cold_Broad_Interest', platform: 'Meta', conversions: 185, cpa: 24.30, roas: 2.1, spend: 4495 },
  { id: 4, name: 'PMax_Bestsellers', platform: 'Google', conversions: 420, cpa: 15.10, roas: 3.5, spend: 6342 },
];

const mockKpis = [
  { title: 'Total Conversions', value: '4,842', trend: '+14.5%', isUp: true, icon: TrendingUp },
  { title: 'Blended CPA', value: 'R$ 14,20', trend: '-2.4%', isUp: true, icon: Focus }, 
  { title: 'Blended ROAS', value: '3.8x', trend: '+0.4', isUp: true, icon: Activity },
  { title: 'Total Revenue', value: 'R$ 124.5k', trend: '+18.2%', isUp: true, icon: DollarSign },
];

// --- COMPONENTS ---
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-[#111113] border border-[#222225] rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);

export default function App() {
  const [dataStatus, setDataStatus] = useState<'loading' | 'needs_setup' | 'logged_out' | 'success' | 'error'>('loading');
  const [performanceData, setPerformanceData] = useState(mockPerformanceData);
  const [sourceDistribution, setSourceDistribution] = useState(mockSourceDistribution);
  const [campaignData, setCampaignData] = useState(mockCampaignData);
  const [kpis, setKpis] = useState(mockKpis);
  const [errorMessage, setErrorMessage] = useState('');
  const [tokens, setTokens] = useState<any>(() => {
    const saved = localStorage.getItem('ga4_tokens');
    return saved ? JSON.parse(saved) : null;
  });
  const [propertyId] = useState('326638842');

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

    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/analytics?propertyId=${propertyId}`, {
            headers: { 'Authorization': `Bearer ${JSON.stringify(tokens)}` }
        });
        const data = await res.json();
        
        if (data.status === 'success') {
          setDataStatus('success');
          console.log("Real GA4 Data received:", data.data);

          if (data.data && data.data.rows) {
            const rawRows = data.data.rows;

            const dateMap = new Map<string, { date: string; organic: number; meta: number; google: number }>();
            let totalSessions = 0;
            let totalConversions = 0;
            const sourceMap = new Map<string, number>();

            rawRows.forEach((row: any) => {
              const dateVal = row.dimensionValues?.[0]?.value || '';
              const formattedDate = dateVal.length === 8 ? `${dateVal.substring(6,8)}/${dateVal.substring(4,6)}` : dateVal;
              const sourceVal = row.dimensionValues?.[1]?.value || 'direct';
              
              const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);
              const conversions = parseInt(row.metricValues?.[1]?.value || '0', 10);

              totalSessions += sessions;
              totalConversions += conversions;

              if (!dateMap.has(formattedDate)) {
                dateMap.set(formattedDate, { date: formattedDate, organic: 0, meta: 0, google: 0 });
              }
              const dateEntry = dateMap.get(formattedDate)!;
              
              const lsSource = sourceVal.toLowerCase();
              if (lsSource.includes('google') || lsSource.includes('cpc')) dateEntry.google += sessions;
              else if (lsSource.includes('fb') || lsSource.includes('meta') || lsSource.includes('ig') || lsSource.includes('instagram')) dateEntry.meta += sessions;
              else dateEntry.organic += sessions;

              let pieKey = 'Organic / Direct';
              if (lsSource.includes('google') || lsSource.includes('cpc')) { pieKey = 'Google Ads'; }
              else if (lsSource.includes('fb') || lsSource.includes('meta') || lsSource.includes('ig')) { pieKey = 'Meta Ads'; }
              
              if (!sourceMap.has(pieKey)) {
                sourceMap.set(pieKey, 0);
              }
              sourceMap.set(pieKey, sourceMap.get(pieKey)! + sessions);
            });

            const newPerformanceData = Array.from(dateMap.values()).sort((a,b) => {
               // roughly sort by date string DD/MM, assuming same year spanning
               const [d1, m1] = a.date.split('/');
               const [d2, m2] = b.date.split('/');
               if (m1 !== m2) return (m1 || '').localeCompare(m2 || '');
               return (d1 || '').localeCompare(d2 || '');
            });
            
            if (newPerformanceData.length > 0) {
              setPerformanceData(newPerformanceData);
            }

            const newSourceData = Array.from(sourceMap.entries()).map(([name, value]) => {
              let color = '#10B981';
              if (name === 'Google Ads') color = '#F43F5E';
              if (name === 'Meta Ads') color = '#3B82F6';
              return { name, value, color };
            });
            if (newSourceData.length > 0) {
               setSourceDistribution(newSourceData);
            }

            setKpis([
              { title: 'Sessões Totais', value: totalSessions.toString(), trend: '-', isUp: true, icon: Users },
              { title: 'Conversões', value: totalConversions.toString(), trend: '-', isUp: true, icon: TrendingUp },
              { title: 'Taxa de Conv.', value: totalSessions > 0 ? ((totalConversions/totalSessions)*100).toFixed(2) + '%' : '0%', trend: '-', isUp: true, icon: Activity },
              { title: 'Origem de Dados', value: 'GA4 API', trend: 'Live', isUp: true, icon: KeyRound },
            ]);
            
            // clear out mock campaign data
            setCampaignData([]);
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
  }, [tokens]);

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
          <div className="flex items-center gap-3">
            <img src="https://www.g7juridico.com.br/imagens/simbolo.jpg" alt="Logo" className="w-10 h-10 rounded-full object-cover shadow-lg" />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Dashboard G7</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#222225] bg-[#111113] hover:bg-[#1A1A1D] transition-colors text-sm font-medium">
              <CalendarDays className="w-4 h-4 text-[#8E9299]" />
              <span>Last 14 Days</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black hover:bg-gray-200 transition-colors text-sm font-medium">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
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
                Para visualizar seus dados reais da propriedade Connect (326638842), conecte sua conta Google. Esta autorização é segura e usada apenas para leitura de dados de relatórios. Ela será salva no seu navegador para que você não precise aprovar toda vez.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, idx) => (
            <Card key={idx} className="relative overflow-hidden group hover:border-[#333338] transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-[#1A1A1D] rounded-lg group-hover:bg-[#222225] transition-colors">
                  <kpi.icon className="w-5 h-5 text-[#8E9299]" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${kpi.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {kpi.isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {kpi.trend}
                </div>
              </div>
              <div>
                <p className="text-sm text-[#8E9299] mb-1 font-medium">{kpi.title}</p>
                <h3 className="text-3xl font-semibold tracking-tight">{kpi.value}</h3>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                <kpi.icon className="w-32 h-32" />
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Area Chart */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-medium">Conversions by Source</h3>
                <p className="text-sm text-[#8E9299]">Daily progression aggregated from Meta, Google, and Analytics.</p>
              </div>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGoogle" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222225" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#8E9299" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#8E9299" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111113', borderColor: '#222225', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#E4E3E0' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="google" name="Google Ads" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#colorGoogle)" />
                  <Area type="monotone" dataKey="meta" name="Meta Ads" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorMeta)" />
                  <Area type="monotone" dataKey="organic" name="Organic Search" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorOrganic)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Distribution Pie Chart */}
          <Card>
            <h3 className="text-lg font-medium mb-1">Source Distribution</h3>
            <p className="text-sm text-[#8E9299] mb-6">Total conversion split.</p>
            <div className="h-[240px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceDistribution}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {sourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111113', borderColor: '#222225', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#E4E3E0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3 mt-4">
              {sourceDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[#E4E3E0]">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* Data Grid / Campaigns */}
        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b border-[#222225]">
            <h3 className="text-lg font-medium">Top Active Campaigns</h3>
            <p className="text-sm text-[#8E9299]">Performance breakdown for the leading acquisition channels.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A]/50">
                  <th className="font-mono text-xs text-[#8E9299] font-medium uppercase tracking-wider py-4 px-6 border-b border-[#222225]">Campaign Name</th>
                  <th className="font-mono text-xs text-[#8E9299] font-medium uppercase tracking-wider py-4 px-6 border-b border-[#222225]">Platform</th>
                  <th className="font-mono text-xs text-[#8E9299] font-medium uppercase tracking-wider py-4 px-6 border-b border-[#222225] text-right">Spend</th>
                  <th className="font-mono text-xs text-[#8E9299] font-medium uppercase tracking-wider py-4 px-6 border-b border-[#222225] text-right">Convs</th>
                  <th className="font-mono text-xs text-[#8E9299] font-medium uppercase tracking-wider py-4 px-6 border-b border-[#222225] text-right">CPA</th>
                  <th className="font-mono text-xs text-[#8E9299] font-medium uppercase tracking-wider py-4 px-6 border-b border-[#222225] text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222225]">
                {campaignData.map((camp) => (
                  <tr key={camp.id} className="hover:bg-[#1A1A1D] transition-colors group cursor-pointer text-sm">
                    <td className="py-4 px-6 font-medium text-[#E4E3E0]">{camp.name}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-opacity-10 ${
                        camp.platform === 'Meta' ? 'bg-blue-500 text-blue-400' : 'bg-rose-500 text-rose-400'
                      }`}>
                        {camp.platform}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-[#8E9299]">R$ {camp.spend.toLocaleString()}</td>
                    <td className="py-4 px-6 text-right font-medium">{camp.conversions}</td>
                    <td className="py-4 px-6 text-right font-mono text-[#8E9299]">R$ {camp.cpa.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right">
                      <span className={`font-mono ${camp.roas > 3 ? 'text-emerald-400' : 'text-[#8E9299]'}`}>
                        {camp.roas.toFixed(1)}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}


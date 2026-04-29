import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, DollarSign, Activity, Focus,
  ArrowUpRight, ArrowDownRight, Filter, CalendarDays, Loader2, KeyRound, ChevronDown, ChevronRight, PieChart as PieChartIcon, BarChart2,
  Zap, Target, ShoppingCart, Award, CreditCard
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { supabase } from './lib/supabase';

const COLORS = {
  meta: '#3b82f6', // blue-500
  google: '#f43f5e', // rose-500
  organic: '#10b981', // emerald-500
};

const CHART_COLORS = [
  '#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316'
];

const PieChartLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index, name, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.1;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (value === 0) return null;

  // Usa o percent do próprio Recharts (que é uma fração entre 0 e 1)
  const displayPercent = (percent * 100).toFixed(1);

  return (
    <text
      x={x}
      y={y}
      fill="#8E9299"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-[10px] font-medium"
    >
      {`${name} (${displayPercent}%)`}
    </text>
  );
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

const ProductRow: React.FC<{ p: any, isSupabase?: boolean }> = ({ p, isSupabase }) => {
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
              {!isSupabase && <span className="text-[10px] text-[#52525B]">Sessões: {p.sessions || 0}</span>}
            </div>
          </div>
        </td>
        <td className="p-4 text-xs text-right font-mono text-[#8E9299]">{p.qty}</td>
        <td className="p-4 text-xs text-right font-mono">
           {isSupabase ? (
             <span className="text-[10px] text-gray-500 uppercase">Supabase</span>
           ) : (
             <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roas > 3 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
               {roas > 0 ? `${roas.toFixed(1)}x` : '-'}
             </span>
           )}
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
      id: "cultura",
      name: "Dashboard Cultura",
      propertyId: "299236151",
      logo: "https://www.culturajuridica.com.br/imagens/novo/logo-topo.svg",
    }
  ];

  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0].id);
  const [supabaseSchema, setSupabaseSchema] = useState<Record<string, string[]>>({});
  const [supabaseSample, setSupabaseSample] = useState<Record<string, any[]>>({});
  
  // Novos estados para os dados específicos da Cultura
  const [supabaseCadastros, setSupabaseCadastros] = useState<any[]>([]);
  const [supabaseCategorias, setSupabaseCategorias] = useState<any[]>([]);
  const [supabaseCursos, setSupabaseCursos] = useState<any[]>([]);
  const [supabaseCheckouts, setSupabaseCheckouts] = useState<any[]>([]);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];
  const propertyId = selectedCompany.propertyId;

  const [dateRange, setDateRange] = useState('7days');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [appliedCustomDate, setAppliedCustomDate] = useState({ start: '', end: '' });
  const [expandedCheckoutId, setExpandedCheckoutId] = useState<string | null>(null);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<any>(null);

  const formatTimeDiff = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffMs = end.getTime() - start.getTime();
    
    // Se a data de cadastro é posterior à compra (erro de log), tratamos como instantâneo
    if (diffMs <= 0) return 'Instantâneo';
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 24) {
      if (diffHrs === 0) {
        const mins = Math.floor(diffMs / (1000 * 60));
        return `${mins}min`;
      }
      return `${diffHrs}h`;
    } else {
      const days = Math.floor(diffHrs / 24);
      const hrs = diffHrs % 24;
      return `${days}d ${hrs}h`;
    }
  };

  const getFriendlyChannel = (source: any = '', medium: any = '', campaign: any = '', content: any = '') => {
    const src = (source || '').toLowerCase();
    const med = (medium || '').toLowerCase();
    const camp = (campaign || '').toLowerCase();
    const cont = (content || '').toLowerCase();

    if (src.includes('manychat')) return 'Manychat';
    if (src.includes('rdstation') || src.includes('rd_station')) return 'RD Station';
    if (src.includes('email') || src.includes('e-mail') || src.includes('newsletter')) return 'E-Mail';
    if (src.includes('bio') || med.includes('bio') || camp.includes('bio') || cont.includes('bio')) return 'Bio do Instagram';
    if (src.includes('comercial') || src.includes('whatsapp') || src.includes('crm') || src.includes('comerc')) return 'Comercial';
    if ((src.includes('google') || src.includes('gads')) && (med.includes('cpc') || med.includes('ads') || med.includes('search'))) return 'Search Ads';
    if (src.includes('fb') || src.includes('ig') || src.includes('meta') || src.includes('instagram') || src.includes('facebook')) return 'Meta Ads';
    
    return 'Busca Orgânica / Sem Rastreio';
  };

  const dateRangeLabels: Record<string, string> = {
      today: 'Hoje',
      yesterday: 'Ontem',
      thisMonth: 'Este mês',
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
    // Para a Cultura, não precisamos de tokens do Google no estado inicial
    if (selectedCompanyId !== 'cultura' && !tokens) {
      setDataStatus('logged_out');
      return;
    }

    if (selectedCompanyId !== 'cultura' && !propertyId) {
      setDataStatus('error');
      setErrorMessage('Property ID is missing. Please refresh and provide it before connecting.');
      setTokens(null);
      return;
    }
    
    setDataStatus('loading');

    const fetchAnalytics = async () => {
      try {
        if (selectedCompanyId === 'cultura' && supabase) {
          console.log("🚀 Carregando dados exclusivos da Cultura via Supabase...");
          
          try {
            setDataStatus('loading');
            
            // 1. Cadastros (Incluindo id_usuario)
            const { data: cadastros, error: err1 } = await supabase
              .from('cadastros')
              .select('id_usuario, nome, email, telefone, data_cadastro, utm_source_cadastro, utm_medium_cadastro, utm_campaign_cadastro, utm_content_cadastro, utm_term_cadastro')
              .order('data_cadastro', { ascending: false });
            if (err1) throw err1;
            setSupabaseCadastros(cadastros || []);

            // 2. Categorias (Incluindo id_categoria)
            const { data: categorias, error: err2 } = await supabase
              .from('categorias')
              .select('id_categoria, nome, descricao');
            if (err2) throw err2;
            setSupabaseCategorias(categorias || []);

            // 3. Cursos (Incluindo id_curso)
            const { data: cursos, error: err3 } = await supabase
              .from('cursos')
              .select('id_curso, nome, descricao, preco');
            if (err3) throw err3;
            setSupabaseCursos(cursos || []);

            // 4. Eventos Checkout (TUDO)
            const { data: checkouts, error: err4 } = await supabase
              .from('eventos_checkout')
              .select('*');
            if (err4) throw err4;
            setSupabaseCheckouts(checkouts || []);

            // --- FILTRAGEM POR DATA (JS) ---
            const now = new Date();
            let startDate = new Date();
            
            if (dateRange === '7days') startDate.setDate(now.getDate() - 7);
            else if (dateRange === '14days') startDate.setDate(now.getDate() - 14);
            else if (dateRange === '30days') startDate.setDate(now.getDate() - 30);
            else if (dateRange === 'thisMonth') {
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              startDate.setHours(0,0,0,0);
            }
            else if (dateRange === 'yesterday') startDate.setDate(now.getDate() - 1);
            else if (dateRange === 'today') startDate.setHours(0,0,0,0);
            else if (dateRange === 'custom' && appliedCustomDate.start) startDate = new Date(appliedCustomDate.start);
            else startDate.setDate(now.getDate() - 365); // Default 1 ano

            const filteredCheckouts = checkouts.filter(c => new Date(c.timestamp || c.created_at) >= startDate);
            const filteredCadastros = cadastros.filter(c => new Date(c.data_cadastro) >= startDate);

            // --- PROCESSAMENTO DE DADOS SUPABASE PARA O DASHBOARD ---
            const leadsCount = filteredCadastros.length;
            const totalRevenue = filteredCheckouts.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
            const salesCount = filteredCheckouts.length;
            
            const paymentMap = new Map<string, number>();
            let fallbackCount = 0;
            
            // Atribuição por Canal (UTM Source)
            const channelDefinitions: Record<string, { name: string, color: string }> = {
              meta: { name: 'Meta Ads', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
              google: { name: 'Search Ads', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
              comercial: { name: 'Comercial', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              rdstation: { name: 'RD Station', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
              bio: { name: 'Bio do Instagram', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
              manychat: { name: 'Manychat', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
              email: { name: 'E-Mail', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
              organic: { name: 'Busca Orgânica / Sem Rastreio', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
            };

            const channelMap: any = {};
            Object.keys(channelDefinitions).forEach(key => {
              channelMap[key] = { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0, products: new Map(), campaigns: new Map() };
            });
            channelMap.total = { revenue: totalRevenue, sales: salesCount, leads: leadsCount, sessions: 0, cost: 0, products: new Map() };

            // Map para fácil acesso aos cursos
            const cursosMap = new Map<string, any>(cursos.map((c: any) => [c.id_curso, c]));

            const getCategory = (source: any, medium: any, campaign: any = '', content: any = '') => {
              const src = (source || '').toLowerCase();
              const med = (medium || '').toLowerCase();
              const camp = (campaign || '').toLowerCase();
              const cont = (content || '').toLowerCase();

              if (src.includes('manychat')) return 'manychat';
              if (src.includes('rdstation') || src.includes('rd_station')) return 'rdstation';
              if (src.includes('email') || src.includes('e-mail') || src.includes('newsletter')) return 'email';
              if (src.includes('bio') || med.includes('bio') || camp.includes('bio') || cont.includes('bio')) return 'bio';
              if (src.includes('comercial') || src.includes('whatsapp') || src.includes('crm') || src.includes('comerc')) return 'comercial';
              if ((src.includes('google') || src.includes('gads')) && (med.includes('cpc') || med.includes('ads') || med.includes('search'))) return 'google';
              if (src.includes('fb') || src.includes('ig') || src.includes('meta') || src.includes('instagram') || src.includes('facebook')) return 'meta';
              
              return 'organic';
            };

            filteredCheckouts.forEach(checkout => {
              let source = checkout.utm_source || '';
              let medium = checkout.utm_medium || '';
              let campaign = checkout.utm_campaign || '';
              let content = checkout.utm_content || '';
              const rev = Number(checkout.valor) || 0;
              const cursoId = checkout.id_curso;
              const curso = cursosMap.get(cursoId);
              const cursoName = curso ? curso.nome : 'Curso Indefinido';

              // Fallback logic: Se não tem rastreio direto, busca no cadastro do usuário
              if (!source && checkout.id_usuario) {
                const lead = cadastros.find((l: any) => l.id_usuario === checkout.id_usuario);
                if (lead && lead.utm_source_cadastro) {
                  source = lead.utm_source_cadastro;
                  medium = lead.utm_medium_cadastro || '';
                  campaign = lead.utm_campaign_cadastro || '';
                  content = lead.utm_content_cadastro || '';
                  fallbackCount++;
                }
              }

              const cat = getCategory(source, medium, campaign, content);
              
              channelMap[cat].revenue += rev;
              channelMap[cat].sales += 1;

              // Métodos de Pagamento
              const pm = checkout.metodo_pagamento || checkout.payment_method || checkout.forma_pagamento || 'Outro';
              paymentMap.set(pm, (paymentMap.get(pm) || 0) + rev);

              // Produtos por canal
              if (!channelMap[cat].products.has(cursoName)) {
                channelMap[cat].products.set(cursoName, { qty: 0, rev: 0, sessions: 0, cost: 0, campaigns: [] });
              }
              const p = channelMap[cat].products.get(cursoName);
              p.qty += 1;
              p.rev += rev;

              // Consolidação global
              if (!channelMap.total.products.has(cursoName)) {
                channelMap.total.products.set(cursoName, { qty: 0, rev: 0, sessions: 0, cost: 0, campaigns: [] });
              }
              const pt = channelMap.total.products.get(cursoName);
              pt.qty += 1;
              pt.rev += rev;
            });

            // Leads por canal (baseado nos UTMs do cadastro)
            filteredCadastros.forEach(lead => {
              const source = lead.utm_source_cadastro || '';
              const medium = lead.utm_medium_cadastro || '';
              const campaign = lead.utm_campaign_cadastro || '';
              const cat = getCategory(source, medium, campaign);
              channelMap[cat].leads += 1;
            });

            const formatProducts = (map: Map<string, any>) => Array.from(map.entries())
              .map(([name, data]) => ({ name, ...data }))
              .sort((a, b) => b.rev - a.rev);

            // --- TREND DATA (Receita, Leads e Produtos por Dia) ---
            const trendMap = new Map<string, { value: number, salesCount: number, leads: number, products: Map<string, number> }>();
            
            // Inicializar com checkouts (vendas)
            filteredCheckouts.forEach(c => {
              const dateStr = new Date(c.timestamp || c.created_at).toLocaleDateString('pt-BR');
              if (!trendMap.has(dateStr)) {
                trendMap.set(dateStr, { value: 0, salesCount: 0, leads: 0, products: new Map() });
              }
              const dayData = trendMap.get(dateStr)!;
              dayData.value += (Number(c.valor) || 0);
              dayData.salesCount += 1;
              
              const curso = cursosMap.get(c.id_curso);
              const cursoName = curso ? curso.nome : 'Curso #' + c.id_curso;
              dayData.products.set(cursoName, (dayData.products.get(cursoName) || 0) + 1);
            });

            // Mesclar com cadastros (leads)
            filteredCadastros.forEach(lead => {
              const dateStr = new Date(lead.data_cadastro).toLocaleDateString('pt-BR');
              if (!trendMap.has(dateStr)) {
                trendMap.set(dateStr, { value: 0, salesCount: 0, leads: 0, products: new Map() });
              }
              trendMap.get(dateStr)!.leads += 1;
            });

            const trendData = Array.from(trendMap.entries())
              .map(([date, data]) => ({ 
                date, 
                value: data.value,
                salesCount: data.salesCount,
                leads: data.leads,
                products: Array.from(data.products.entries()).map(([name, qty]) => ({ name, qty }))
              }))
              .sort((a, b) => {
                const [da, ma, aa] = a.date.split('/');
                const [db, mb, ab] = b.date.split('/');
                return new Date(`${aa}-${ma}-${da}`).getTime() - new Date(`${ab}-${mb}-${db}`).getTime();
              });

            // Atribuição de "Campanhas" (Winning Ads)
            const campaignMap = new Map();
            filteredCheckouts.forEach(c => {
               const camp = c.utm_campaign || c.utm_source || 'Desconhecido';
               if (!campaignMap.has(camp)) campaignMap.set(camp, { name: camp, sales: 0, rev: 0, source: '' });
               const stats = campaignMap.get(camp);
               stats.sales += 1;
               stats.rev += Number(c.valor) || 0;
               
               stats.source = getCategory(c.utm_source || '', c.utm_medium || '', c.utm_campaign || '');
            });

            const winners = Array.from(campaignMap.values())
              .sort((a, b) => b.rev - a.rev)
              .slice(0, 10);

            // --- TOP 5 CLIENTES ---
            const customerMap = new Map();
            filteredCheckouts.forEach(c => {
                const uid = c.id_usuario;
                if (!customerMap.has(uid)) customerMap.set(uid, { id: uid, rev: 0, sales: 0, purchases: [] });
                const stats = customerMap.get(uid);
                stats.rev += Number(c.valor) || 0;
                stats.sales += 1;
                
                // Buscar nome do curso
                const curso = cursos.find((cur: any) => cur.id_curso === c.id_curso);
                stats.purchases.push({ ...c, cursoName: curso ? curso.nome : 'Curso ' + c.id_curso });
            });

            const topCustomers = Array.from(customerMap.values())
                .map(c => {
                    const lead = cadastros.find((l: any) => l.id_usuario === c.id);
                    return { ...c, name: lead ? (lead.nome || lead.email) : 'Cliente ' + c.id };
                })
                .sort((a, b) => b.rev - a.rev)
                .slice(0, 5);

            const paymentMethodsData = Array.from(paymentMap.entries())
              .map(([name, value]) => ({ name, value }))
              .sort((a, b) => b.value - a.value);

            // Proporções para Gráficos de Pizza
            const productPieData = formatProducts(channelMap.total.products)
              .map(p => ({
                name: p.name,
                value: p.rev
              }))
              .filter(p => p.value > 0);

            const channelPieData = [
              { name: 'Meta Ads', value: channelMap.meta.revenue },
              { name: 'Google Ads', value: channelMap.google.revenue },
              { name: 'Orgânico/Busca', value: channelMap.organic.revenue },
              { name: 'Manychat', value: channelMap.manychat.revenue },
              { name: 'RD Station', value: channelMap.rdstation.revenue },
              { name: 'E-mail', value: channelMap.email.revenue },
              { name: 'Comercial/CRM', value: channelMap.comercial.revenue },
              { name: 'Link na Bio', value: channelMap.bio.revenue },
            ]
            .map(c => ({
              name: c.name,
              value: c.value
            }))
            .filter(c => c.value > 0)
            .sort((a, b) => b.value - a.value);

            setChannelData({
              meta: { ...channelMap.meta, products: formatProducts(channelMap.meta.products), campaigns: [] },
              google: { ...channelMap.google, products: formatProducts(channelMap.google.products), campaigns: [] },
              organic: { ...channelMap.organic, products: formatProducts(channelMap.organic.products), campaigns: [] },
              rdstation: { ...channelMap.rdstation, products: formatProducts(channelMap.rdstation.products) },
              manychat: { ...channelMap.manychat, products: formatProducts(channelMap.manychat.products) },
              bio: { ...channelMap.bio, products: formatProducts(channelMap.bio.products) },
              email: { ...channelMap.email, products: formatProducts(channelMap.email.products) },
              comercial: { ...channelMap.comercial, products: formatProducts(channelMap.comercial.products) },
              total: channelMap.total,
              totalProducts: formatProducts(channelMap.total.products),
              trendData,
              winners,
              topCustomers,
              paymentMethods: paymentMethodsData,
              productPieData,
              channelPieData,
              hasFallback: fallbackCount > 0
            });

            setKpis([
              { title: 'Receita Total', value: `R$ ${totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, trend: 'Faturamento no Período', isUp: true, icon: DollarSign },
              { title: 'Ticket Médio', value: `R$ ${(salesCount > 0 ? totalRevenue / salesCount : 0).toFixed(2)}`, trend: 'Venda Média', isUp: true, icon: Activity },
              { title: 'Total Leads', value: leadsCount.toString(), trend: 'Novos Cadastros', isUp: true, icon: Users },
              { title: 'Conversão Lead/Venda', value: `${(leadsCount > 0 ? (salesCount / leadsCount) * 100 : 0).toFixed(2)}%`, trend: 'Eficiência de Vendas', isUp: true, icon: TrendingUp },
              { title: 'Vendas Totais', value: salesCount.toString(), trend: 'Checkouts realizados', isUp: true, icon: ShoppingCart },
            ]);

            setDataStatus('success');
            console.log("🚀 Dados da Cultura carregados!");
            return;
          } catch (e) {
            console.error(e);
            setDataStatus('error');
            setErrorMessage('Falha ao conectar com o Supabase.');
            return;
          }
        }

        // Caso existissem outras empresas com GA4 (removido por solicitação)
        setDataStatus('error');
        setErrorMessage('Nenhuma configuração de fonte de dados encontrada.');
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
        
        {/* SETUP BANNER - Totalmente removido para Cultura */}
        {dataStatus === 'logged_out' && selectedCompanyId !== 'cultura' && (
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

        {/* GRÁFICO DE RECEITA TEMPORAL - Principal */}
        {dataStatus === 'success' && channelData.trendData && channelData.trendData.length > 0 && (
          <Card className="mb-8 p-6 bg-gradient-to-br from-[#111113] to-[#0A0A0A]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-medium text-[#8E9299] uppercase tracking-wider mb-1">Performance Histórica</h3>
                <p className="text-2xl font-semibold">Receita Diária (Faturamento Real)</p>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                   <p className="text-[10px] text-[#52525B] uppercase font-bold">Máximo Diário</p>
                   <p className="text-lg font-mono text-emerald-400">R$ {Math.max(...channelData.trendData.map((d: any) => d.value)).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={channelData.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222225" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#52525B" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    minTickGap={30}
                  />
                  <YAxis 
                    stroke="#52525B" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#3b82f6" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `${val}`}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="leads"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="transparent"
                    name="Leads"
                  />
                  <RechartsTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#111113] border border-[#222225] p-4 rounded-lg shadow-2xl text-[11px] min-w-[180px] backdrop-blur-sm bg-black/80">
                            <p className="text-[#8E9299] mb-3 font-medium border-b border-white/5 pb-2">{label}</p>
                            <div className="space-y-2 mb-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[#8E9299]">Faturamento:</span>
                                <span className="text-emerald-400 font-bold ml-4">R$ {Number(data.value || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[#8E9299]">Vendas:</span>
                                <span className="text-emerald-400 font-bold ml-4">{data.salesCount}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[#8E9299]">Novos Leads:</span>
                                <span className="text-blue-400 font-bold ml-4">{data.leads}</span>
                              </div>
                            </div>
                            
                            {data.products && data.products.length > 0 && (
                              <div className="pt-2 border-t border-white/5 space-y-1.5">
                                <p className="text-[#52525B] uppercase text-[9px] font-bold tracking-widest mb-1">Vendas por Produto:</p>
                                {data.products.map((p: any, idx: number) => (
                                  <div key={idx} className="flex justify-between gap-4 items-center">
                                    <span className="text-gray-400 truncate max-w-[140px] italic">{p.name}</span>
                                    <span className="text-white font-mono bg-white/5 px-1.5 rounded text-[10px]">{p.qty}x</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="salesCount" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                    animationDuration={1500}
                    name="Vendas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

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

        {/* Insights de Distribuição */}
        {dataStatus === 'success' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Distribuição de Receita por Produto
                </h4>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData.productPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                      label={PieChartLabel}
                    >
                      {channelData.productPieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
                  <Target className="w-4 h-4" /> Mix de Origem (Market Share Interno)
                </h4>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData.channelPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                      label={PieChartLabel}
                    >
                      {channelData.channelPieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        {/* DETALHE DO CLIENTE (MODAL) */}
        {selectedCustomerDetail && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCustomerDetail(null)}>
            <Card className="max-w-lg w-full p-8 relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedCustomerDetail(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
                <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Award className="w-4 h-4" /> Perfil Financeiro
                </h3>
                <p className="text-3xl font-bold mb-1">{selectedCustomerDetail.name}</p>
                <p className="text-gray-500 text-sm mb-6">ID: {selectedCustomerDetail.id}</p>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-[10px] text-gray-500 uppercase">Receita Total</p>
                        <p className="text-lg font-mono text-emerald-400">R$ {selectedCustomerDetail.rev.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-[10px] text-gray-500 uppercase">Vendas</p>
                        <p className="text-lg font-mono text-white">{selectedCustomerDetail.sales}x</p>
                    </div>
                </div>
                
                <div className="mt-6">
                    <p className="text-[10px] text-gray-500 uppercase mb-2">Histórico de Compras</p>
                    <div className="space-y-2">
                        {selectedCustomerDetail.purchases.map((p: any, idx: number) => (
                            <div key={idx} className="flex justify-between p-2 rounded bg-white/5 text-xs">
                                <span className="text-white truncate max-w-[200px]">{p.cursoName}</span>
                                <span className="font-mono text-emerald-400">R$ {Number(p.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
          </div>
        )}

        {/* Top 5 Clientes */}
        {dataStatus === 'success' && channelData.topCustomers && channelData.topCustomers.length > 0 && (
          <div className="lg:col-span-1 mt-8">
            <Card>
              <h3 className="text-sm font-medium text-[#A1A1AA] mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" /> Top 5 Clientes (LTV)
              </h3>
              <div className="space-y-3">
                {channelData.topCustomers.map((c: any, i: number) => (
                    <div key={i} onClick={() => setSelectedCustomerDetail(c)} className="flex items-center justify-between p-3 rounded-lg bg-black/40 hover:bg-[#1A1A1D] cursor-pointer transition-colors border border-[#222225]">
                        <div className="max-w-[70%]">
                          <p className="text-xs text-white truncate font-medium">{c.name}</p>
                          <p className="text-[10px] text-gray-500">{c.sales} vendas</p>
                        </div>
                        <p className="text-xs text-emerald-400 font-mono font-bold">R$ {c.rev.toLocaleString('pt-BR')}</p>
                    </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Charts and Funnel Section */}
        {dataStatus === 'success' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              <Card className="p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
                     <BarChart2 className="w-4 h-4" /> {selectedCompanyId === 'cultura' ? 'Receita por Canal (Atribuição Blended)' : 'Receita vs Custo por Canal'}
                  </h4>
                  {channelData.hasFallback && (
                    <div className="group relative flex items-center cursor-help">
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Origem Provável (Primeiro Contato)
                      </span>
                      <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-[#111113] border border-[#222225] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-[11px] leading-relaxed">
                        <p className="text-white font-bold mb-1">Como funciona?</p>
                        <p className="text-gray-400">Quando uma venda não possui rastreio UTM direto no checkout, buscamos a origem original do usuário no cadastro (First Click). Isso recupera faturamento que antes ficaria "Sem Rastreio".</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart
                       data={[
                         { name: 'Meta Ads', Receita: channelData.meta.revenue, Custo: channelData.meta.cost },
                         { name: 'Search Ads', Receita: channelData.google.revenue, Custo: channelData.google.cost },
                         { name: 'Comercial', Receita: channelData.comercial?.revenue || 0 },
                         { name: 'RD Station', Receita: channelData.rdstation?.revenue || 0 },
                         { name: 'Bio do Instagram', Receita: channelData.bio?.revenue || 0 },
                         { name: 'Manychat', Receita: channelData.manychat?.revenue || 0 },
                         { name: 'E-Mail', Receita: channelData.email?.revenue || 0 },
                         { name: 'Busca Orgânica / Sem Rastreio', Receita: channelData.organic.revenue },
                       ].filter(d => d.Receita > 0 || (d.Custo !== undefined && d.Custo > 0))}
                       margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                     >
                       <CartesianGrid strokeDasharray="3 3" stroke="#222225" vertical={false} />
                       <XAxis dataKey="name" stroke="#8E9299" fontSize={12} tickLine={false} axisLine={false} />
                       <YAxis stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`} />
                       <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#1A1A1D' }} />
                       <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#8E9299', paddingTop: '20px' }} />
                       <Bar dataKey="Receita" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                       {selectedCompanyId !== 'cultura' && <Bar dataKey="Custo" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />}
                     </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

             <Card className="p-5">
               <h4 className="text-sm font-medium mb-6 text-[#A1A1AA] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Funil de Conversão
               </h4>
               <div className="space-y-6">
                  {[
                    selectedCompanyId !== 'cultura' && { label: 'Sessões Totais', value: channelData.total.sessions, color: 'bg-white/10', icon: Activity },
                    { label: 'Criação de Leads', value: channelData.total.leads, color: 'bg-blue-500/20', icon: Users, pct: (selectedCompanyId !== 'cultura' && channelData.total.sessions > 0) ? (channelData.total.leads / channelData.total.sessions * 100).toFixed(1) : undefined },
                    { label: 'Vendas Realizadas', value: channelData.total.sales, color: 'bg-emerald-500/20', icon: ShoppingCart, pct: channelData.total.leads > 0 ? (channelData.total.sales / channelData.total.leads * 100).toFixed(1) : 0 },
                  ].filter(Boolean).map((step: any, i, arr) => (
                    <div key={i} className="relative">
                      <div className={`p-4 rounded-xl border border-white/5 ${step.color} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white">
                            <step.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-[#8E9299] font-medium uppercase tracking-wider">{step.label}</p>
                            <p className="text-xl font-mono">{step.value.toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                        {step.pct !== undefined && (
                          <div className="text-right">
                            <p className="text-[10px] text-[#8E9299] mb-1 font-medium">{selectedCompanyId === 'cultura' ? 'Conversão' : 'Tx. Conversão'}</p>
                            <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-md">{step.pct}%</span>
                          </div>
                        )}
                      </div>
                      {i < arr.length - 1 && (
                        <div className="flex justify-center -my-2 relative z-10">
                          <div className="bg-[#222225] p-1 rounded-full border border-[#333336]">
                             <ChevronDown className="w-3 h-3 text-[#8E9299]" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
               </div>
               {selectedCompanyId !== 'cultura' && (
                 <div className="mt-6 pt-6 border-t border-[#222225] flex justify-between items-center">
                   <span className="text-xs text-[#8E9299]">Tx. de Venda Global</span>
                   <span className="text-sm font-bold text-emerald-400">
                      {channelData.total.sessions > 0 ? (channelData.total.sales / channelData.total.sessions * 100).toFixed(2) : 0}%
                   </span>
                 </div>
               )}
             </Card>
          </div>
        )}

        {/* PAYMENT METHODS CHART */}
        {selectedCompanyId === 'cultura' && dataStatus === 'success' && channelData.paymentMethods && (
          <div className="mt-8">
            <Card className="p-6">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                       <CreditCard className="w-4 h-4 text-indigo-400" /> Métodos de Pagamento
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-1">Volume financeiro por tipo de transação</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelData.paymentMethods}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {channelData.paymentMethods.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={[
                              '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'
                            ][index % 6]} stroke="none" />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                           contentStyle={{ backgroundColor: '#111113', border: '1px solid #222225', borderRadius: '8px' }}
                           formatter={(val: number) => [`R$ ${val.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 'Volume']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-5">
                    {channelData.paymentMethods.map((pm: any, i: number) => {
                      const colors = ['bg-emerald-500', 'bg-indigo-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500', 'bg-violet-500'];
                      const totalRev = channelData.total.revenue;
                      const pct = ((pm.value / totalRev) * 100).toFixed(1);
                      return (
                        <div key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${colors[i % 6]}`} />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{pm.name}</span>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-mono font-bold text-white">R$ {pm.value.toLocaleString('pt-BR')}</p>
                             <p className="text-[11px] text-gray-500">{pct}% do total</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
            </Card>
          </div>
        )}

        {/* Winning Ads and Products Matrix */}
        {dataStatus === 'success' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* ... col 1 ... */}
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
                        {channelData.winners?.length > 0 ? channelData.winners.map((win: any, i: number) => (
                           <tr key={i} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 flex items-center gap-3">
                                 <div className={`w-1.5 h-1.5 rounded-full ${win.source === 'meta' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                                 <span className="text-xs text-[#FAFAFA] truncate max-w-[240px]" title={win.name}>{win.name}</span>
                              </td>
                              <td className="p-4 text-xs font-mono text-center">{win.sales}</td>
                              <td className="p-4 text-xs font-mono text-right text-emerald-400">R$ {win.rev.toLocaleString('pt-BR')}</td>
                           </tr>
                        )) : (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-gray-600 italic text-xs">
                              {selectedCompanyId === 'cultura' ? 'Dados insuficientes de UTMs para classificar anúncios.' : 'Nenhum dado de campanha encontrado.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                   </table>
                </div>
             </Card>

             <Card className="p-0 overflow-hidden">
                <div className="p-5 border-b border-[#222225] flex items-center justify-between bg-gradient-to-r from-[#111113] to-transparent">
                   <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" /> Performance por Produto
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
                        {(channelData.totalProducts || [])
                          .map((p: any, i: number) => (
                             <ProductRow key={i} p={{ ...p, cost: 0 }} isSupabase={selectedCompanyId === 'cultura'} />
                          ))}
                      </tbody>
                   </table>
                </div>
             </Card>
          </div>
        )}

        {/* LIVE ACTIVITY FEED - Somente para Cultura */}
        {selectedCompanyId === 'cultura' && dataStatus === 'success' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
             <Card className="p-0 overflow-hidden border-indigo-500/20">
                <div className="p-5 border-b border-[#222225] flex items-center justify-between bg-indigo-500/5">
                   <h4 className="text-sm font-medium text-indigo-400 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Vendas Recentes (Checkouts)
                   </h4>
                </div>
                 <div className="max-h-[500px] overflow-y-auto">
                   <div className="divide-y divide-white/5">
                     {supabaseCheckouts.slice(0, 30).map((checkout, i) => {
                       const lead = supabaseCadastros.find(l => l.id_usuario === checkout.id_usuario);
                       const curso = supabaseCursos.find(c => c.id_curso === checkout.id_curso);
                       const checkoutId = checkout.id || checkout.timestamp || i.toString();
                       const isExpanded = expandedCheckoutId === checkoutId;
                       
                       const purchaseDate = new Date(checkout.timestamp || checkout.created_at);
                       const regDate = lead ? new Date(lead.data_cadastro) : null;
                       const timeToConversion = lead ? formatTimeDiff(lead.data_cadastro, checkout.timestamp || checkout.created_at) : 'N/A';
                       
                       const origin = checkout.utm_source || lead?.utm_source_cadastro || 'Direto / S. Rastreio';
                       const paymentMethod = checkout.metodo_pagamento || checkout.payment_method || checkout.forma_pagamento || 'Indefinido';

                       return (
                         <div key={i} className="flex flex-col">
                            <div 
                              onClick={() => setExpandedCheckoutId(isExpanded ? null : checkoutId)}
                              className={`p-4 flex items-center justify-between hover:bg-white/[0.04] cursor-pointer transition-colors ${isExpanded ? 'bg-white/[0.03]' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-emerald-500 text-black' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    <DollarSign className="w-4 h-4" />
                                </div>
                                <div className="max-w-[150px] sm:max-w-none">
                                    <p className="text-xs font-medium text-white truncate">{lead?.nome || 'Usuário #' + checkout.id_usuario}</p>
                                    <p className="text-[10px] text-gray-500 truncate">{curso?.nome || 'Curso #' + checkout.id_curso}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                   <p className="text-[10px] text-gray-400">{purchaseDate.toLocaleDateString('pt-BR')}</p>
                                   <p className="text-[9px] text-gray-600 uppercase font-bold">{paymentMethod}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-sm font-bold text-emerald-400">R$ {Number(checkout.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                   <ChevronDown className={`w-3 h-3 text-gray-600 ml-auto transition-transform ${isExpanded ? 'rotate-180 text-emerald-500' : ''}`} />
                                </div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-6 pb-10 pt-6 bg-white/[0.03] border-b border-indigo-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-16">
                                  
                                  {/* Seção: Identidade & Contato */}
                                  <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                      <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-[0.2em]">Identidade e Contato</p>
                                    </div>
                                    <div className="space-y-4 pl-3">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-gray-500 uppercase font-medium">E-mail de Cadastro</span>
                                        <span className="text-sm text-white font-medium select-all break-all">{lead?.email || 'Não informado'}</span>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-gray-500 uppercase font-medium">WhatsApp / Telefone</span>
                                        <span className="text-sm text-white font-mono">{lead?.telefone || 'Não informado'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Seção: Ciclo de Venda */}
                                  <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                      <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-[0.2em]">Ciclo de Venda</p>
                                    </div>
                                    <div className="space-y-4 pl-3">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-gray-500 uppercase font-medium text-indigo-400/80">Data de Primeiro Contato</span>
                                        <span className="text-sm text-white">{regDate ? regDate.toLocaleString('pt-BR') : '---'}</span>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-gray-500 uppercase font-medium text-emerald-400/80">Janela de Decisão</span>
                                        <span className={`text-sm font-bold ${timeToConversion === 'Instantâneo' ? 'text-blue-400' : 'text-emerald-400'}`}>
                                          {timeToConversion === 'Instantâneo' ? 'Compra Imediata' : `${timeToConversion} pós-cadastro`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Seção: Atribuição Detalhada */}
                                  <div className="space-y-6 lg:col-span-1 md:col-span-2">
                                    <div className="flex items-center gap-2 mb-4">
                                      <div className="w-1 h-3 bg-amber-500 rounded-full" />
                                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-[0.2em]">Atribuição do Negócio</p>
                                    </div>
                                    <div className="space-y-5 pl-3">
                                      <div>
                                        <span className="text-[9px] text-gray-500 uppercase font-medium block mb-2">Canal de Origem</span>
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                          <span className="text-xs text-indigo-300 font-bold">
                                            {getFriendlyChannel(checkout.utm_source || lead?.utm_source_cadastro, checkout.utm_medium || lead?.utm_medium_cadastro, checkout.utm_campaign || lead?.utm_campaign_cadastro, checkout.utm_content || lead?.utm_content_cadastro)}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="pt-2 border-t border-white/5 space-y-2">
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="text-gray-500">UTM Source:</span>
                                          <span className="text-gray-300 font-mono">{checkout.utm_source || lead?.utm_source_cadastro || '(vazio)'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="text-gray-500">UTM Campaign:</span>
                                          <span className="text-gray-300 font-mono truncate max-w-[150px]" title={checkout.utm_campaign || lead?.utm_campaign_cadastro}>
                                            {checkout.utm_campaign || lead?.utm_campaign_cadastro || '(vazio)'}
                                          </span>
                                        </div>
                                      </div>

                                      {!checkout.utm_source && lead?.utm_source_cadastro && (
                                        <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
                                          <Activity className="w-4 h-4 text-amber-500 shrink-0" />
                                          <p className="text-[10px] text-amber-500/90 leading-relaxed font-medium">
                                            Venda sem rastreio direto. Atribuição recuperada através do <span className="underline decoration-amber-500/50">Primeiro Contato</span> do lead na base.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                         </div>
                       );
                     })}
                   </div>
                </div>
             </Card>

             <Card className="p-0 overflow-hidden border-emerald-500/20">
                <div className="p-5 border-b border-[#222225] flex items-center justify-between bg-emerald-500/5">
                   <h4 className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Novos Leads (Cadastros)
                   </h4>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <div className="divide-y divide-white/5">
                    {supabaseCadastros.slice(0, 30).map((lead, i) => {
                      const hasPurchased = supabaseCheckouts.some(c => c.id_usuario === lead.id_usuario);
                      const leadId = lead.id_usuario || lead.email || i.toString();
                      const isExpanded = expandedLeadId === leadId;

                      const purchase = supabaseCheckouts.find(c => c.id_usuario === lead.id_usuario);
                      const origin = getFriendlyChannel(
                        lead.utm_source_cadastro,
                        lead.utm_medium_cadastro,
                        lead.utm_campaign_cadastro,
                        lead.utm_content_cadastro
                      );

                      return (
                        <div key={i} className="flex flex-col border-b border-white/5 last:border-0">
                          <div 
                            onClick={() => setExpandedLeadId(isExpanded ? null : leadId)}
                            className={`p-4 flex items-center justify-between hover:bg-white/[0.04] cursor-pointer transition-colors ${isExpanded ? 'bg-white/[0.03]' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-indigo-500 text-white' : hasPurchased ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 text-blue-500'}`}>
                                  <Users className="w-4 h-4" />
                               </div>
                               <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-medium text-white">{lead.nome || lead.email || 'Lead #' + lead.id_usuario}</p>
                                    {hasPurchased && (
                                      <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-black tracking-widest">
                                        CLIENTE
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-500">{origin}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="text-right">
                                  <p className="text-[10px] text-gray-400">{new Date(lead.data_cadastro).toLocaleDateString('pt-BR')}</p>
                                  <p className="text-[9px] text-gray-600 uppercase tracking-tighter">{lead.cidade || 'S/ Cidade'}</p>
                               </div>
                               <ChevronDown className={`w-3 h-3 text-gray-600 transition-transform ${isExpanded ? 'rotate-180 text-indigo-400' : ''}`} />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-6 pb-8 pt-4 bg-white/[0.015] animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-2">Informações de Contato</p>
                                    <div className="space-y-1.5">
                                      <p className="text-[11px] text-white flex justify-between"><span className="text-gray-600">E-mail:</span> <span className="font-medium select-all">{lead.email || 'N/A'}</span></p>
                                      <p className="text-[11px] text-white flex justify-between"><span className="text-gray-600">Tel/Cel:</span> <span className="font-mono">{lead.telefone || 'N/A'}</span></p>
                                      <p className="text-[11px] text-white flex justify-between"><span className="text-gray-600">Local:</span> <span>{lead.cidade ? `${lead.cidade} - ${lead.estado || ''}` : 'Não identificado'}</span></p>
                                    </div>
                                  </div>

                                  {hasPurchased && purchase && (
                                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                      <p className="text-[9px] text-emerald-500 uppercase font-bold tracking-widest mb-2">Conversão Realizada</p>
                                      <p className="text-[10px] text-emerald-200/80 leading-relaxed">
                                        Comprou <span className="text-white font-bold italic">"{supabaseCursos.find(c => c.id_curso === purchase.id_curso)?.nome || 'Produto'}"</span> em {new Date(purchase.timestamp || purchase.created_at).toLocaleDateString('pt-BR')}.
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-2">Rastreamento (UTMs)</p>
                                    <div className="space-y-2">
                                      <div className="p-2 rounded bg-black/20 border border-white/5 space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                          <span className="text-gray-600">Source:</span>
                                          <span className="text-gray-300 font-mono truncate max-w-[120px]">{lead.utm_source_cadastro || '(vazio)'}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                          <span className="text-gray-600">Medium:</span>
                                          <span className="text-gray-300 font-mono truncate max-w-[120px]">{lead.utm_medium_cadastro || '(vazio)'}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                          <span className="text-gray-600">Campaign:</span>
                                          <span className="text-gray-300 font-mono truncate max-w-[120px]">{lead.utm_campaign_cadastro || '(vazio)'}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 mt-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-tight">Canal: {origin}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
            
            {(selectedCompanyId === 'cultura' ? [
              { id: 'meta', name: 'Meta Ads', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
              { id: 'google', name: 'Search Ads', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
              { id: 'comercial', name: 'Comercial', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              { id: 'rdstation', name: 'RD Station', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
              { id: 'bio', name: 'Bio do Instagram', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
              { id: 'manychat', name: 'Manychat', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
              { id: 'email', name: 'E-Mail', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
              { id: 'organic', name: 'Busca Orgânica / Sem Rastreio', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
            ] : [
              { id: 'meta', name: 'Meta Ads', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
              { id: 'google', name: 'Google Ads', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
              { id: 'organic', name: 'Tráfego Orgânico / Direto', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
            ]).map(channel => {
              const data = channelData[channel.id];
              if (!data || (selectedCompanyId === 'cultura' && data.revenue === 0 && data.leads === 0)) return null;
              
              const cr = data.sessions > 0 ? (data.sales) / data.sessions * 100 : 0;
              const roas = data.cost > 0 ? data.revenue / data.cost : 0;
              const cpa = data.sales > 0 ? data.cost / data.sales : 0;
              const avgTicket = data.sales > 0 ? data.revenue / data.sales : 0;
              const roasColor = roas > 3 ? 'text-emerald-400' : roas >= 1.5 ? 'text-amber-400' : roas > 0 ? 'text-rose-400' : 'text-gray-400';

              return (
                <Card key={channel.id} className="p-0 overflow-hidden border border-[#222225]">
                  <div className="p-5 border-b border-[#222225] flex justify-between items-center bg-[#0A0A0A]">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${channel.color}`}>
                        {channel.name}
                      </span>
                    </div>
                  </div>
                  <div className={`grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-[#222225] bg-[#111113]`}>
                    <div className="p-4 flex flex-col justify-center">
                      <span className="text-xs text-[#8E9299] font-medium mb-1">Receita Gerada</span>
                      <span className="text-lg font-semibold">R$ {data.revenue.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    {selectedCompanyId === 'cultura' ? (
                      <div className="p-4 flex flex-col justify-center">
                        <span className="text-xs text-[#8E9299] font-medium mb-1">Total Leads</span>
                        <span className="text-lg font-semibold text-blue-400">{data.leads}</span>
                      </div>
                    ) : (
                      <div className="p-4 flex flex-col justify-center">
                        <span className="text-xs text-[#8E9299] font-medium mb-1">Custo Total</span>
                        <span className="text-lg font-semibold text-red-400">R$ {data.cost.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                      </div>
                    )}
                    {selectedCompanyId === 'cultura' ? (
                       <div className="p-4 flex flex-col justify-center">
                        <span className="text-xs text-[#8E9299] font-medium mb-1">Ticket Médio</span>
                        <span className="text-lg font-semibold text-emerald-400">R$ {avgTicket.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div className="p-4 flex flex-col justify-center">
                        <span className="text-xs text-[#8E9299] font-medium mb-1">ROAS</span>
                        <span className={`text-lg font-semibold ${roasColor}`}>{roas.toFixed(2)}x</span>
                      </div>
                    )}
                    <div className="p-4 flex flex-col justify-center">
                      <span className="text-xs text-[#8E9299] font-medium mb-1">Vendas (Qtd)</span>
                      <span className="text-lg font-semibold">{data.sales}</span>
                    </div>
                    {selectedCompanyId === 'cultura' ? (
                       <div className="p-4 flex flex-col justify-center">
                        <span className="text-xs text-[#8E9299] font-medium mb-1">Conversão Lead/Venda</span>
                        <span className="text-lg font-semibold text-indigo-400">{data.leads > 0 ? ((data.sales / data.leads) * 100).toFixed(1) : 0}%</span>
                      </div>
                    ) : (
                      <div className="p-4 flex flex-col justify-center">
                        <span className="text-xs text-[#8E9299] font-medium mb-1">Taxa de Conversão</span>
                        <span className="text-lg font-semibold">{cr.toFixed(2)}%</span>
                      </div>
                    )}
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
                                  <ProductRow key={i} p={p} isSupabase={selectedCompanyId === 'cultura'} />
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


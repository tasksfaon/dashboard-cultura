import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Users, DollarSign, Activity, Focus,
  ArrowUpRight, ArrowDownRight, Filter, CalendarDays, Loader2, KeyRound, ChevronDown, ChevronRight, PieChart as PieChartIcon, BarChart2,
  Zap, Target, ShoppingCart, Award, CreditCard, Clock, AlertCircle, Database, Check, Copy, Trash2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { supabase } from './lib/supabase';

const COLORS = {
  meta: '#DCA61F', // blue-500
  google: '#DCA61F', // rose-500
  organic: '#DCA61F', // emerald-500
};

const CHART_COLORS = ['#DCA61F', '#A3A3A3', '#737373', '#525252', '#404040', '#E5E5E5', '#FFFFFF', '#D4D4D4', '#262626', '#171717'];
const PROJECT_LABELS: Record<string, string> = {
  'ACA26': 'Academia',
  'GAR26': 'Garantismo',
  'PEN26': 'Clube dos Penalistas',
  'CIV26': 'Clube dos Civilistas',
  'CUL26': 'Cultura'
};

const OBJECTIVE_LABELS: Record<string, string> = {
  'VENDA': 'Venda',
  'VEN': 'Venda',
  'CAP': 'Captação',
  'CAPTACAO': 'Captação',
  'DIST': 'Distribuição',
  'ENG': 'Engajamento',
  'ACE': 'Alcance'
};

const CampaignGroupTable: React.FC<{ title: string, data: any[], icon: React.ReactNode }> = ({ title, data, icon }) => (
  <Card className="p-0 overflow-hidden">
    <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-[#111113] to-transparent">
      <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
        {icon} {title}
      </h4>
    </div>
    <div className="w-full overflow-x-auto scrollbar-hide">
      <table className="w-full text-left min-w-[600px]">
        <thead className="bg-bg-card/50 sticky top-0 z-10">
          <tr>
            <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold">Campanha / Projeto</th>
            <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right">Investimento</th>
            <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right">Cadastros</th>
            <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right">Vendas</th>
            <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right">Receita</th>
            <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right">ROAS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#222225]/50">
          {data.length > 0 ? data.map((item: any, i: number) => {
             const roas = item.cost > 0 ? (item.revenue / item.cost) : 0;
             return (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-xs text-text-primary truncate max-w-[240px]" title={item.name}>{item.name}</span>
                </td>
                <td className="p-4 text-[0.875rem] font-medium tabular-nums text-text-primary text-right">R$ {item.cost.toLocaleString('pt-BR')}</td>
                <td className="p-4 text-[0.875rem] font-medium tabular-nums text-text-primary text-right">{item.leads}</td>
                <td className="p-4 text-[0.875rem] font-medium tabular-nums text-text-primary text-right">{item.sales}</td>
                <td className="p-4 text-[0.875rem] font-medium tabular-nums text-text-primary text-right text-primary">R$ {item.revenue.toLocaleString('pt-BR')}</td>
                <td className="p-4 text-[0.875rem] font-medium tabular-nums text-right">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roas > 3 ? 'bg-primary/10 text-primary' : (roas > 1 ? 'bg-orange-500/10 text-orange-600' : 'bg-gray-500/10 text-text-secondary')}`}>
                     {roas > 0 ? `${roas.toFixed(1)}x` : '0.0x'}
                   </span>
                </td>
              </tr>
             );
          }) : (
            <tr>
              <td colSpan={6} className="p-8 text-center text-[#525252] italic text-xs">
                Nenhum dado encontrado para este período.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </Card>
);

const ActiveCampaignsTree: React.FC<{ data: any[], metaCosts?: any[], checkouts?: any[], cursos?: any[] }> = ({ data, metaCosts = [], checkouts = [], cursos = [] }) => {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleKey = (key: string) => {
    setExpandedKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getGroupedData = (rawRows: any[]) => {
    const categoriesMap: Record<string, any> = {
      venda: { id: 'venda', title: 'Campanhas de Venda Ativas', campaigns: {} },
      captacao: { id: 'captacao', title: 'Campanhas de Captação Ativas', campaigns: {} },
      distribuicao: { id: 'distribuicao', title: 'Campanhas de Distribuição Ativas', campaigns: {} },
      alcance: { id: 'alcance', title: 'Campanhas de Alcance Ativas', campaigns: {} }
    };

    rawRows.forEach(row => {
      const rawCampName = row.campaign_name || row.campaign || row.campanha || '';
      if (!rawCampName) return;

      const campNameUpper = rawCampName.toUpperCase();
      let categoryKey = 'venda';

      if (campNameUpper.includes('DIST') || campNameUpper.includes('DISTRIBUICAO') || campNameUpper.includes('ENG') || campNameUpper.includes('ENGAJAMENTO')) {
        categoryKey = 'distribuicao';
      } else if (campNameUpper.includes('ACE') || campNameUpper.includes('ALCANCE')) {
        categoryKey = 'alcance';
      } else if (campNameUpper.includes('CAP') || campNameUpper.includes('CAPTACAO') || campNameUpper.includes('LEAD')) {
        categoryKey = 'captacao';
      } else if (campNameUpper.includes('VEN') || campNameUpper.includes('VENDA') || campNameUpper.includes('PURCHASE') || campNameUpper.includes('CONV')) {
        categoryKey = 'venda';
      }

      const adsetName = row.adset_name || row.ad_set_name || row.adset || row.conjunto_anuncio || row.conjunto_anuncios || row.conjunto || 'Sem Conjunto de Anúncios';
      const adName = row.ad_name || row.adname || row.ad || row.anuncio || 'Sem Anúncio';
      const adId = row.ad_id ? String(row.ad_id) : '';
      const creativeUrl = row.creative_url || row.creativeUrl || row.url_criativo || '';

      const cat = categoriesMap[categoryKey];
      if (!cat.campaigns[rawCampName]) {
        cat.campaigns[rawCampName] = { name: rawCampName, adsets: {}, stats: { spend: 0, purchases: 0, revenue: 0, leads: 0, engagements: 0, impressions: 0, reach: 0, cpmSum: 0, cpmCount: 0 } };
      }

      const campaignObj = cat.campaigns[rawCampName];
      if (!campaignObj.adsets[adsetName]) {
        campaignObj.adsets[adsetName] = { name: adsetName, ads: [], stats: { spend: 0, purchases: 0, revenue: 0, leads: 0, engagements: 0, impressions: 0, reach: 0, cpmSum: 0, cpmCount: 0 } };
      }

      const adsetObj = campaignObj.adsets[adsetName];
      const exists = adsetObj.ads.find((item: any) => item.name === adName && item.creativeUrl === creativeUrl);
      
      let adItem = exists;
      if (!adItem) {
        adItem = { name: adName, creativeUrl, stats: { spend: 0, purchases: 0, revenue: 0, leads: 0, engagements: 0, impressions: 0, reach: 0, cpmSum: 0, cpmCount: 0 } };
        adsetObj.ads.push(adItem);
        
        // Calculate metrics for this Ad
        const matchingCosts = metaCosts.filter(m => {
          if (adId && m.ad_id) {
            return String(m.ad_id) === adId;
          }
          return m.adName === adName || m.ad_name === adName;
        });
        matchingCosts.forEach(m => {
            adItem.stats.spend += m.cost || 0;
            adItem.stats.purchases += Number(m.purchases) || 0;
            adItem.stats.leads += Number(m.leads) || 0;
            adItem.stats.engagements += (Number(m.post_engagement) || 0) + (Number(m.page_engagement) || 0);
            adItem.stats.impressions += Number(m.impressions) || 0;
            adItem.stats.reach += Number(m.reach) || 0;
            if (m.cpm > 0) {
               adItem.stats.cpmSum += m.cpm;
               adItem.stats.cpmCount += 1;
            }
        });
        
        // Match revenue using UTMs
        const matchingCheckouts = checkouts.filter(c => {
           const utmCamp = (c.utm_campaign || '').toLowerCase();
           const utmContent = (c.utm_content || '').toLowerCase();
           return utmCamp === rawCampName.toLowerCase() && utmContent === adName.toLowerCase();
        });

        // Determine product price to calculate real revenue and ROAS based on campaign / course name
        let productPrice = 948; // default fallback (civilistas or penalistas)
        const combinedText = `${rawCampName} ${adsetName} ${adName}`.toLowerCase();
        
        const isCiv = combinedText.includes('civ') || combinedText.includes('civilista');
        const isPen = combinedText.includes('pen') || combinedText.includes('penalista');
        const isAca = combinedText.includes('aca') || combinedText.includes('academia');
        const isAgora = combinedText.includes('agora') || combinedText.includes('ágora');
        
        if (cursos && cursos.length > 0) {
          if (isCiv && isPen) {
            const match = cursos.find(c => c.id_curso === 10 || (c.nome.toLowerCase().includes('penalistas') && c.nome.toLowerCase().includes('civilistas')));
            if (match) productPrice = match.preco;
          } else if (isCiv) {
            const match = cursos.find(c => c.id_curso === 11 || c.nome.toLowerCase().includes('civilistas'));
            if (match) productPrice = match.preco;
          } else if (isPen) {
            const match = cursos.find(c => c.id_curso === 12 || c.nome.toLowerCase().includes('penalistas'));
            if (match) productPrice = match.preco;
          } else if (isAca) {
            const match = cursos.find(c => c.id_curso === 9 || c.nome.toLowerCase().includes('academia'));
            if (match) productPrice = match.preco;
          } else if (isAgora) {
            const match = cursos.find(c => c.id_curso === 8 || c.nome.toLowerCase().includes('ágora') || c.nome.toLowerCase().includes('agora'));
            if (match) productPrice = match.preco;
          }
        } else {
          // Hardcoded fallback static values matching Supabase
          if (isCiv && isPen) productPrice = 1656;
          else if (isCiv) productPrice = 948;
          else if (isPen) productPrice = 948;
          else if (isAca) productPrice = 348;
          else if (isAgora) productPrice = 900.6;
        }

        // Calculate revenue dynamically
        if (adItem.stats.purchases > 0) {
          adItem.stats.revenue = adItem.stats.purchases * productPrice;
        } else {
          const utmRevenue = matchingCheckouts.reduce((acc: number, curr: any) => acc + (Number(curr.valor) || 0), 0);
          adItem.stats.revenue = utmRevenue;
        }

        // Rollup to Adset
        adsetObj.stats.spend += adItem.stats.spend;
        adsetObj.stats.purchases += adItem.stats.purchases;
        adsetObj.stats.revenue += adItem.stats.revenue;
        adsetObj.stats.leads += adItem.stats.leads;
        adsetObj.stats.engagements += adItem.stats.engagements;
        adsetObj.stats.impressions += adItem.stats.impressions;
        adsetObj.stats.reach += adItem.stats.reach;
        adsetObj.stats.cpmSum += adItem.stats.cpmSum;
        adsetObj.stats.cpmCount += adItem.stats.cpmCount;

        // Rollup to Campaign
        campaignObj.stats.spend += adItem.stats.spend;
        campaignObj.stats.purchases += adItem.stats.purchases;
        campaignObj.stats.revenue += adItem.stats.revenue;
        campaignObj.stats.leads += adItem.stats.leads;
        campaignObj.stats.engagements += adItem.stats.engagements;
        campaignObj.stats.impressions += adItem.stats.impressions;
        campaignObj.stats.reach += adItem.stats.reach;
        campaignObj.stats.cpmSum += adItem.stats.cpmSum;
        campaignObj.stats.cpmCount += adItem.stats.cpmCount;
      }
    });

    return Object.values(categoriesMap)
      .map((cat: any) => {
        const campaignsArray = Object.values(cat.campaigns).map((camp: any) => {
          const adsetsArray = Object.values(camp.adsets).map((adset: any) => ({
            name: adset.name,
            stats: adset.stats,
            ads: adset.ads
          }));
          return {
            name: camp.name,
            stats: camp.stats,
            adsets: adsetsArray
          };
        });
        return {
          ...cat,
          campaigns: campaignsArray
        };
      })
      .filter(cat => cat.campaigns.length > 0);
  };

  const categories = getGroupedData(data);

  if (data.length === 0) {
    return (
      <Card className="p-8 text-center text-[#525252] italic text-xs">
        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-primary" />
        Nenhum anúncio ativo encontrado na tabela `anuncios_ativos_cultura`.
      </Card>
    );
  }

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'distribuicao': return <Zap className="w-4 h-4 text-primary" />;
      case 'captacao': return <Target className="w-4 h-4 text-primary" />;
      case 'venda': return <Award className="w-4 h-4 text-primary" />;
      case 'alcance': return <Focus className="w-4 h-4 text-primary" />;
      default: return <Activity className="w-4 h-4 text-primary" />;
    }
  };

  const renderMetricsBlock = (catId: string, stats: any) => {
    const s = stats || {};
    const money = (val: number) => "R$ " + (val || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const num = (val: number) => (val || 0).toLocaleString('pt-BR');

    // Estiliza de forma compacta e chamativa cada item de métrica em pílulas com borda e fundo levemente opaco
    const MetricItem = ({ label, value, colorClass = "text-white", bgClass = "bg-[#161618] border-white/10" }: { label: string, value: string, colorClass?: string, bgClass?: string }) => {
      return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-[10px] font-medium tracking-wide ${bgClass} transition-shadow duration-300 hover:shadow-md`}>
          <span className="text-[#A1A1AA] uppercase text-[9px] font-semibold">{label}:</span>
          <span className={`font-mono font-bold ${colorClass}`}>{value}</span>
        </div>
      );
    };

    // Mapeamento de métricas conforme a categoria:
    if (catId === 'venda') {
      const cpa = s.purchases > 0 ? s.spend / s.purchases : 0;
      const roas = s.spend > 0 ? s.revenue / s.spend : 0;
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          <MetricItem label="Inv" value={money(s.spend)} colorClass="text-zinc-100" bgClass="bg-zinc-900/70 border-zinc-700/30" />
          <MetricItem label="Vnd" value={num(s.purchases)} colorClass="text-zinc-100" bgClass="bg-zinc-900/70 border-zinc-700/30" />
          <MetricItem label="CPA" value={cpa > 0 ? money(cpa) : "R$ 0,00"} colorClass="text-primary-light" bgClass="bg-primary/10 border-primary/20" />
          <MetricItem label="Fat" value={money(s.revenue)} colorClass="text-emerald-400" bgClass="bg-emerald-950/20 border-emerald-500/20" />
          <MetricItem label="ROAS" value={roas > 0 ? `${roas.toFixed(2)}x` : "0.00x"} colorClass="text-emerald-400 font-extrabold" bgClass="bg-emerald-950/20 border-emerald-500/20" />
        </div>
      );
    } else if (catId === 'captacao') {
      const cpl = s.leads > 0 ? s.spend / s.leads : 0;
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          <MetricItem label="Inv" value={money(s.spend)} colorClass="text-zinc-100" bgClass="bg-zinc-900/70 border-zinc-700/30" />
          <MetricItem label="Cadastros" value={num(s.leads)} colorClass="text-zinc-100" bgClass="bg-zinc-900/70 border-zinc-700/30" />
          <MetricItem label="CPL" value={cpl > 0 ? money(cpl) : "R$ 0,00"} colorClass="text-primary-light" bgClass="bg-primary/10 border-primary/20" />
        </div>
      );
    } else if (catId === 'distribuicao') {
      const cpe = s.engagements > 0 ? s.spend / s.engagements : 0;
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          <MetricItem label="Inv" value={money(s.spend)} colorClass="text-zinc-100" bgClass="bg-zinc-900/70 border-zinc-700/30" />
          <MetricItem label="Clicks/Engaj" value={num(s.engagements)} colorClass="text-zinc-100" bgClass="bg-zinc-900/70 border-zinc-700/30" />
          <MetricItem label="CPE" value={cpe > 0 ? money(cpe) : "R$ 0,00"} colorClass="text-primary-light" bgClass="bg-primary/10 border-primary/20" />
        </div>
      );
    } else if (catId === 'alcance') {
      const cpm = s.cpmCount > 0 ? (s.cpmSum / s.cpmCount) : 0;
      const freq = s.reach > 0 ? s.impressions / s.reach : 0;
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          <MetricItem label="Inv" value={money(s.spend)} colorClass="text-zinc-100" bgClass="bg-zinc-900/70 border-zinc-700/30" />
          <MetricItem label="Impr" value={num(s.impressions)} colorClass="text-zinc-100" bgClass="bg-zinc-900/70 border-zinc-700/30" />
          <MetricItem label="Alcance" value={num(s.reach)} colorClass="text-zinc-100" bgClass="bg-zinc-900/70 border-zinc-700/30" />
          <MetricItem label="Freq" value={freq.toFixed(2)} colorClass="text-primary-light" bgClass="bg-primary/10 border-primary/20" />
          <MetricItem label="CPM" value={cpm > 0 ? money(cpm) : "R$ 0,00"} colorClass="text-orange-400" bgClass="bg-orange-950/20 border-orange-500/20" />
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {categories.map((cat, catIdx) => {
        const catKey = `cat-${cat.id}`;
        const isCatExpanded = !!expandedKeys[catKey];

        return (
          <Card key={catIdx} className="overflow-hidden border border-zinc-800 bg-zinc-950/60 p-0 shadow-xl animate-fade-in">
            {/* Category Header */}
            <div 
              onClick={() => toggleKey(catKey)}
              className="flex items-center justify-between p-5 cursor-pointer select-none bg-gradient-to-r from-zinc-900 to-transparent hover:bg-zinc-900/80 transition-all border-b border-zinc-800/80"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-inner">
                  {getCategoryIcon(cat.id)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">{cat.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-850 font-mono">
                      {cat.campaigns.length} {cat.campaigns.length === 1 ? 'campanha ativa' : 'campanhas ativas'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-1 rounded-full hover:bg-zinc-800 transition-colors">
                {isCatExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </div>
            </div>

            {/* Campaigns list */}
            {isCatExpanded && (
              <div className="divide-y divide-zinc-800/50 bg-zinc-950/20 p-2 space-y-3 select-none">
                {cat.campaigns.map((camp, campIdx) => {
                  const campKey = `camp-${cat.id}-${campIdx}`;
                  const isCampExpanded = !!expandedKeys[campKey];

                  const adsetCount = camp.adsets.length;
                  const adCount = camp.adsets.reduce((acc: number, curr: any) => acc + curr.ads.length, 0);

                  return (
                    <div 
                      key={campIdx} 
                      className="group border border-zinc-900 hover:border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/40 rounded-xl transition-all duration-300 overflow-hidden"
                    >
                      {/* Campaign Header Row */}
                      <div 
                        onClick={() => toggleKey(campKey)}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3.5 w-full">
                          <div className="mt-1 p-0.5 rounded bg-zinc-800 text-zinc-400 group-hover:text-zinc-200 transition-colors shrink-0">
                            {isCampExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 w-full min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Campanha Ativa" />
                              <span className="text-xs md:text-sm font-bold text-zinc-100 group-hover:text-primary transition-colors text-left break-all">{camp.name}</span>
                            </div>
                            {renderMetricsBlock(cat.id, camp.stats)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-3 md:mt-0 ml-8 md:ml-0 font-mono shrink-0">
                          <span className="bg-zinc-900/80 px-2 py-1 rounded-md border border-zinc-800/80">{adsetCount} {adsetCount === 1 ? 'conjunto' : 'conjuntos'}</span>
                          <span className="bg-zinc-900/80 px-2 py-1 rounded-md border border-zinc-800/80">{adCount} {adCount === 1 ? 'anúncio' : 'anúncios'}</span>
                        </div>
                      </div>

                      {/* Expanded Section (Adsets & Ads) */}
                      {isCampExpanded && (
                        <div className="px-4 pb-4 pt-1 space-y-4 bg-zinc-950/40 border-t border-zinc-800/40">
                          <div className="pl-2 md:pl-5 border-l border-zinc-800 space-y-4">
                            {camp.adsets.map((adset: any, adsetIdx: number) => {
                              const adsetKey = `adset-${cat.id}-${campIdx}-${adsetIdx}`;
                              const isAdsetExpanded = !!expandedKeys[adsetKey];

                              return (
                                <div key={adsetIdx} className="space-y-3">
                                  {/* Adset Header */}
                                  <div 
                                    onClick={() => toggleKey(adsetKey)}
                                    className="flex items-start justify-between p-3.5 rounded-lg bg-zinc-900/45 hover:bg-zinc-900/80 cursor-pointer border border-zinc-850/60 transition-all duration-200"
                                  >
                                    <div className="flex items-start gap-3 min-w-0">
                                      <div className="mt-1 p-0.5 rounded bg-zinc-800/70 text-zinc-400 shrink-0">
                                        {isAdsetExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                         <span className="text-xs font-semibold text-zinc-300 hover:text-zinc-100 text-left truncate" title={adset.name}>
                                           {adset.name}
                                         </span>
                                         {renderMetricsBlock(cat.id, adset.stats)}
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded shrink-0 self-start mt-0.5 shadow-sm">
                                      {adset.ads.length} {adset.ads.length === 1 ? 'anúncio' : 'anúncios'}
                                    </span>
                                  </div>

                                  {/* List of Ads under Adset */}
                                  {isAdsetExpanded && (
                                    <div className="pl-4 space-y-3.5 py-1.5 border-l border-zinc-850 transition-all duration-300">
                                      {adset.ads.map((ad: any, adIdx: number) => (
                                        <div 
                                          key={adIdx} 
                                          className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 hover:bg-zinc-900/60 rounded-xl border border-zinc-850/50 bg-zinc-950/40 transition-all shadow-sm"
                                        >
                                          {/* Ad Creative Image */}
                                          {ad.creativeUrl ? (
                                            <div className="relative group/thumb w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 shadow-md">
                                              <img 
                                                src={ad.creativeUrl} 
                                                alt={ad.name} 
                                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300" 
                                                referrerPolicy="no-referrer"
                                                onError={(e) => {
                                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                }}
                                              />
                                            </div>
                                          ) : (
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary/40 mt-2 shrink-0 animate-pulse" />
                                          )}

                                          {/* Ad metrics & link */}
                                          <div className="flex-1 min-w-0 w-full">
                                            <span className="text-xs font-bold text-zinc-200 block text-left mb-1 hover:text-primary transition-colors line-clamp-2" title={ad.name}>
                                              {ad.name}
                                            </span>
                                            {renderMetricsBlock(cat.id, ad.stats)}
                                            

                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

// Corrige conversão de timezone (UTC to Local) para dados vindos do Supabase
const parseSupabaseDate = (dateVal: string | null | undefined): Date => {
  if (!dateVal) return new Date();
  let str = dateVal.replace(' ', 'T');
  if (!/(Z|[+-]\d{2}(:?\d{2})?)$/.test(str)) {
    str += 'Z';
  }
  return new Date(str);
};

const getBRLDate = (val: string | Date | null | undefined): Date => {
  if (!val) return new Date();
  if (val instanceof Date) {
    if ((val as any)._isBRL) return val;
    const shifted = new Date(val.getTime() - 3 * 3600 * 1000);
    (shifted as any)._isBRL = true;
    return shifted;
  }
  const d = parseSupabaseDate(val);
  const shifted = new Date(d.getTime() - 3 * 3600 * 1000);
  (shifted as any)._isBRL = true;
  return shifted;
};

const formatDateBRL = (val: string | Date | null | undefined): string => {
  if (!val) return '';
  const d = getBRLDate(val);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const normalizePaymentMethod = (raw: string | null | undefined): string => {
  if (!raw) return 'Indefinido';
  const val = String(raw).toLowerCase().trim();
  if (val.includes('pix')) return 'Pix';
  if (val.includes('boleto') || val.includes('slip') || val.includes('facture') || val.includes('billet')) return 'Boleto';
  if (
    val.includes('cartao') || 
    val.includes('cartão') || 
    val.includes('card') || 
    val.includes('credito') || 
    val.includes('crédito') || 
    val.includes('cc') || 
    val.includes('2cartao') || 
    val.includes('2_cartoes') || 
    val.includes('dois_cartoes') ||
    val.includes('cartoes') ||
    val.includes('cartões')
  ) {
    return 'Cartão de Crédito';
  }
  if (val.includes('paypal')) return 'PayPal';
  if (val.includes('apple') || val.includes('pay')) return 'Carteira Digital';
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const PieChartLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index, name, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (value === 0) return null;

  const displayPercent = (percent * 100).toFixed(1);
  const textAnchor = x > cx ? 'start' : 'end';

  const maxLineLen = 14;
  const words = name.split(' ');
  const nameLines: string[] = [];
  let currentLine = '';

  words.forEach((word: string) => {
    if (!currentLine) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= maxLineLen) {
      currentLine += ' ' + word;
    } else {
      nameLines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) {
    nameLines.push(currentLine);
  }

  const lines = [...nameLines, `(${displayPercent}%)`];

  return (
    <text
      x={x}
      y={y}
      fill="#8E9299"
      textAnchor={textAnchor}
      className="text-[10px] font-medium"
    >
      {lines.map((line, i) => {
        const spacing = 12;
        const dy = i === 0 ? -(lines.length - 1) * spacing / 2 : spacing;
        return (
          <tspan key={i} x={x} dy={dy} fill={i === lines.length - 1 ? "#A1A1AA" : "#8E9299"} className={i === lines.length - 1 ? "text-[9px] font-mono" : ""}>
            {line}
          </tspan>
        );
      })}
    </text>
  );
};

const CustomTooltip = ({ active, payload, label, isCurrency = true }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card border border-border p-3 rounded-[4px] shadow-xl outline-none">
        <p className="text-text-primary font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
           <div key={index} className="flex items-center justify-between gap-4 text-sm mb-1">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
               <span className="text-text-label">{entry.name}</span>
             </div>
             <span className="font-mono text-text-primary">
               {isCurrency ? "R$ " : ""}
               {Number(entry.value).toLocaleString('pt-BR', {
                 minimumFractionDigits: isCurrency ? 2 : 0, 
                 maximumFractionDigits: isCurrency ? 2 : 0
               })}
             </span>
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
  <div className={`card ${className}`} {...props}>
    {children}
  </div>
);

const MonthlyClosingSection: React.FC<{ checkouts: any[], costs: any[], cursos: any[] }> = ({ checkouts, costs, cursos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [productGoals, setProductGoals] = useState<Record<string, number>>({});
  const [dbStatus, setDbStatus] = useState<'loading' | 'synced' | 'local_fallback' | 'error'>('loading');
  const [showSqlInfo, setShowSqlInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number | string>('');
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  
  const getMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      });
    }
    return months;
  };

  const monthsList = getMonths();
  const selectedMonth = monthsList[currentIndex];
  const monthKey = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;

  const loadLocalFallback = () => {
    const saved = localStorage.getItem('cultura-monthly-product-goals');
    if (saved) {
      try {
        setProductGoals(JSON.parse(saved));
        return;
      } catch (e) {
        console.error(e);
      }
    }
    // Default goals for May 2026 as starting placeholders
    setProductGoals({
      '2026-05::Academia Jurídica': 30,
      '2026-05::Clube do Advogado': 15,
    });
  };

  useEffect(() => {
    const fetchDbGoals = async () => {
      try {
        if (!supabase) {
          setDbStatus('local_fallback');
          loadLocalFallback();
          return;
        }

        setDbStatus('loading');
        const { data, error } = await supabase
          .from('metas_vendas')
          .select('month_key, product_name, goal_value');

        if (error) {
          console.warn('Tabela metas_vendas não encontrada. Usando modo local.', error);
          setDbStatus('local_fallback');
          loadLocalFallback();
          return;
        }

        if (data) {
          const goalsObj: Record<string, number> = {};
          data.forEach((row: any) => {
            goalsObj[`${row.month_key}::${row.product_name}`] = row.goal_value;
          });
          setProductGoals(goalsObj);
          setDbStatus('synced');
        } else {
          loadLocalFallback();
          setDbStatus('synced');
        }
      } catch (err) {
        console.error('Erro de conexão ao carregar metas:', err);
        setDbStatus('local_fallback');
        loadLocalFallback();
      }
    };

    fetchDbGoals();
  }, []);

  const updateGoal = async (productName: string, value: number) => {
    const key = `${monthKey}::${productName}`;
    const updated = { ...productGoals, [key]: value };
    setProductGoals(updated);
    localStorage.setItem('cultura-monthly-product-goals', JSON.stringify(updated));

    if (supabase && dbStatus !== 'local_fallback') {
      try {
        const { error } = await supabase
          .from('metas_vendas')
          .upsert({
            month_key: monthKey,
            product_name: productName,
            goal_value: value
          }, {
            onConflict: 'month_key,product_name'
          });

        if (error) {
          console.error('Erro ao salvar meta no banco:', error);
          setDbStatus('local_fallback'); // Show integration help
        } else {
          setDbStatus('synced');
        }
      } catch (e) {
        console.error('Falha de conexão com o banco:', e);
        setDbStatus('local_fallback');
      }
    }
  };

  const deleteGoal = async (productName: string) => {
    const key = `${monthKey}::${productName}`;
    const updated = { ...productGoals };
    delete updated[key];
    setProductGoals(updated);
    localStorage.setItem('cultura-monthly-product-goals', JSON.stringify(updated));

    if (supabase && dbStatus !== 'local_fallback') {
      try {
        const { error } = await supabase
          .from('metas_vendas')
          .delete()
          .match({ month_key: monthKey, product_name: productName });

        if (error) {
          console.error('Erro ao deletar meta no banco:', error);
          setDbStatus('local_fallback');
        } else {
          setDbStatus('synced');
        }
      } catch (e) {
        console.error('Falha de rede para deletar:', e);
        setDbStatus('local_fallback');
      }
    }
  };

  const calculateStats = (month: number, year: number) => {
    // Definimos início e fim do mês em BRT (UTC-3)
    const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    
    const filteredCheckouts = checkouts.filter(c => {
      const d = getBRLDate(c.timestamp || c.created_at);
      return d >= startOfMonth && d <= endOfMonth && (c.status || '').toLowerCase().trim() === 'pago';
    });

    const filteredCosts = costs.filter(c => {
      const d = c.date; // Já está como BRL Date
      return d >= startOfMonth && d <= endOfMonth;
    });

    const revenue = filteredCheckouts.reduce((acc, curr) => acc + Number(curr.valor), 0);
    const sales = filteredCheckouts.length;
    const cost = filteredCosts.reduce((acc, curr) => acc + curr.cost, 0);

    const productMap = new Map();
    
    // Seed all database courses with 0 default sales to allow goal tracking for any of them
    if (cursos && cursos.length > 0) {
      cursos.forEach(cur => {
        productMap.set(cur.nome, { name: cur.nome, qty: 0, rev: 0 });
      });
    }

    filteredCheckouts.forEach(c => {
      const curso = cursos.find(cur => cur.id_curso === c.id_curso);
      const name = curso ? curso.nome : 'Produto #' + c.id_curso;
      const existing = productMap.get(name) || { name, qty: 0, rev: 0 };
      productMap.set(name, { ...existing, qty: existing.qty + 1, rev: existing.rev + Number(c.valor) });
    });

    return { 
      revenue, 
      sales, 
      cost, 
      products: Array.from(productMap.values()).sort((a, b) => b.rev - a.rev)
    };
  };

  const currentStats = calculateStats(selectedMonth.month, selectedMonth.year);
  
  const totalGoalRevenue = currentStats.products.reduce((acc, p) => {
    const goalKey = `${monthKey}::${p.name}`;
    const currentGoal = productGoals[goalKey] || 0;
    const curso = cursos.find(c => c.nome === p.name);
    const price = curso ? (Number(curso.preco) || 0) : 0;
    return acc + (currentGoal * price);
  }, 0);

  const totalGoalSales = currentStats.products.reduce((acc, p) => {
    const goalKey = `${monthKey}::${p.name}`;
    const currentGoal = productGoals[goalKey] || 0;
    return acc + currentGoal;
  }, 0);
  
  // Previous Month for comparison
  const prevDate = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
  const prevStats = calculateStats(prevDate.getMonth(), prevDate.getFullYear());

  const currentRoas = currentStats.cost > 0 ? currentStats.revenue / currentStats.cost : 0;
  const prevRoas = prevStats.cost > 0 ? prevStats.revenue / prevStats.cost : 0;

  const getDiff = (curr: number, prev: number) => {
    if (prev === 0) return { diff: curr, percent: 100, isUp: true };
    const diff = curr - prev;
    const percent = (diff / prev) * 100;
    return { diff, percent, isUp: diff >= 0 };
  };

  const revDiff = getDiff(currentStats.revenue, prevStats.revenue);
  const salesDiff = getDiff(currentStats.sales, prevStats.sales);
  const costDiff = getDiff(currentStats.cost, prevStats.cost);
  const roasDiff = getDiff(currentRoas, prevRoas);

  const formatDiff = (d: { diff: number, percent: number, isUp: boolean }, isCurrency = false) => {
    const symbol = d.isUp ? '+' : '';
    const color = d.isUp ? 'text-emerald-500' : 'text-red-500';
    const val = isCurrency ? `R$ ${Math.abs(d.diff).toLocaleString('pt-BR')}` : Math.abs(d.diff);
    return (
      <span className={`text-[10px] font-bold ${color}`}>
        {symbol}{val} ({symbol}{d.percent.toFixed(1)}%)
      </span>
    );
  };

  // Cost comparison is "good" if it goes down (usually, but for growth maybe up is expected)
  // Let's stick to standard color: up green, down red for revenue/sales.
  
  return (
    <Card className="p-0 border-primary/30 bg-black/40 backdrop-blur-sm overflow-hidden">
      <div className="p-6 border-b border-border flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-primary/10 text-primary self-start">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h3 className="text-xl font-serif font-bold italic text-white capitalize">{selectedMonth.label}</h3>
              {dbStatus === 'synced' && (
                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-emerald-500/20" title="Metas salvas em tempo real no Supabase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Database className="w-2.5 h-2.5" /> Nuvem Ativa
                </span>
              )}
              {dbStatus === 'loading' && (
                <span className="inline-flex items-center gap-1 text-[9px] bg-zinc-500/10 text-zinc-400 font-mono px-1.5 py-0.5 rounded border border-zinc-500/15">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Conectando...
                </span>
              )}
              {dbStatus === 'local_fallback' && (
                <button 
                  onClick={() => setShowSqlInfo(!showSqlInfo)}
                  className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-450 hover:bg-amber-500/20 font-mono px-1.5 py-0.5 rounded border border-amber-500/25 transition-all text-left" 
                  title="Metas salvas apenas localmente no navegador. Clique para ver instruções do banco de dados."
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <Database className="w-2.5 h-2.5" /> Modo Local (Ativar Banco ⚡)
                </button>
              )}
            </div>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Fechamento do Mês</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button 
            disabled={currentIndex === monthsList.length - 1}
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="p-2 rounded hover:bg-white/5 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex gap-1">
            {monthsList.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-primary w-4' : 'bg-white/10'}`} />
            ))}
          </div>
          <button 
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => prev - 1)}
            className="p-2 rounded hover:bg-white/5 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Alerta de Persistência em Banco Supabase */}
      {dbStatus === 'local_fallback' && (
        <div className="mx-6 mt-4 p-4 rounded bg-amber-500/5 border border-amber-500/15 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex gap-2.5">
              <Database className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-400 font-sans">Persistência em Nuvem Desativada (Salvo no Navegador)</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                  As metas atuais estão salvas localmente no seu dispositivo. Para gravá-las no banco de dados do <strong>Supabase</strong> para que todos os membros da sua equipe vejam as mesmas metas, execute o seguinte comando no SQL Editor do seu Supabase.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowSqlInfo(!showSqlInfo)}
              className="text-xs font-semibold text-primary hover:text-amber-300 transition-colors shrink-0 whitespace-nowrap self-end sm:self-auto"
            >
              {showSqlInfo ? "Ocultar Código" : "Ver Código SQL ↓"}
            </button>
          </div>

          {(showSqlInfo || !localStorage.getItem('cultura-monthly-product-goals-setup-dismissed')) && (
            <div className="mt-1 text-left bg-zinc-950 border border-zinc-900 rounded p-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Passo Único: SQL Editor do Supabase</span>
                <button
                  onClick={() => {
                    const sql = `CREATE TABLE public.metas_vendas (
  month_key TEXT NOT NULL,
  product_name TEXT NOT NULL,
  goal_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (month_key, product_name)
);

-- Configura permissões simples para gravação imediata
ALTER TABLE public.metas_vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para todos" ON public.metas_vendas FOR ALL USING (true) WITH CHECK (true);`;
                    navigator.clipboard.writeText(sql);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary font-mono px-2 py-1 rounded transition-colors self-start sm:self-auto"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado!" : "Copiar Script SQL"}
                </button>
              </div>
              <pre className="text-[10px] font-mono text-zinc-300 p-2 bg-black/60 rounded border border-zinc-900 overflow-x-auto select-all leading-relaxed whitespace-pre font-normal scrollbar-hide">
{`CREATE TABLE public.metas_vendas (
  month_key TEXT NOT NULL,
  product_name TEXT NOT NULL,
  goal_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (month_key, product_name)
);

-- Permissões básicas para gravação
ALTER TABLE public.metas_vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para todos" ON public.metas_vendas FOR ALL USING (true) WITH CHECK (true);`}
              </pre>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 text-[10px] text-zinc-500 leading-normal">
                <span>Após rodar o script SQL no painel Supabase, basta atualizar esta página para sincronizar de forma nativa.</span>
                <button 
                  onClick={() => {
                    localStorage.setItem('cultura-monthly-product-goals-setup-dismissed', 'true');
                    setShowSqlInfo(false);
                  }} 
                  className="hover:text-white underline text-zinc-400 font-medium self-end sm:self-auto"
                >
                  Dispensar este aviso
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Faturamento */}
        <div className="p-6 flex flex-col items-center text-center justify-between min-h-[145px] hover:bg-white/[0.01] transition-colors duration-200">
          <div className="w-full">
            <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-3">Faturamento Mensal</p>
            
            <div className="flex flex-col items-center gap-2 mb-2">
              {/* Realizado Header & Value */}
              <div className="text-center">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold block mb-0.5">Realizado</span>
                <span className="text-3xl font-extrabold text-white tracking-tight leading-none block">
                  R$ {currentStats.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </span>
              </div>

              {/* Meta & Percentage Row */}
              {totalGoalRevenue > 0 && (
                <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1 mt-1 text-[11px] text-zinc-300">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide">Meta:</span>
                  <span className="font-bold text-primary">R$ {totalGoalRevenue.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold rounded">
                    {((currentStats.revenue / totalGoalRevenue) * 100).toFixed(0)}% atingido
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              {formatDiff(revDiff, true)}
              <span className="text-[10px] text-[#52525B]">vs mês anterior</span>
            </div>
          </div>
          {totalGoalRevenue > 0 && (
            <div className="mt-4 w-full max-w-[220px] flex flex-col gap-1 items-center">
              <div className="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden relative border border-zinc-900 shadow-inner">
                <div 
                  style={{ width: `${Math.min(100, (currentStats.revenue / totalGoalRevenue) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-[#DCA61F] to-[#E9C364] rounded-full transition-all duration-500 shadow-[0_0_4px_rgba(220,166,31,0.2)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Vendas */}
        <div className="p-6 flex flex-col items-center text-center justify-between min-h-[145px] hover:bg-white/[0.01] transition-colors duration-200">
          <div className="w-full">
            <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-3">Quantidade de Vendas</p>
            
            <div className="flex flex-col items-center gap-2 mb-2">
              {/* Realizado Header & Value */}
              <div className="text-center">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold block mb-0.5">Realizado</span>
                <span className="text-3xl font-extrabold text-white tracking-tight leading-none block">
                  {currentStats.sales} <span className="text-sm font-normal text-zinc-400 font-sans">vendas</span>
                </span>
              </div>

              {/* Meta & Percentage Row */}
              {totalGoalSales > 0 && (
                <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1 mt-1 text-[11px] text-zinc-300">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide">Meta:</span>
                  <span className="font-bold text-primary">{totalGoalSales} <span className="text-[11px] font-normal text-primary/80">vendas</span></span>
                  <span className="text-zinc-600">•</span>
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold rounded">
                    {((currentStats.sales / totalGoalSales) * 100).toFixed(0)}% atingido
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              {formatDiff(salesDiff)}
              <span className="text-[10px] text-[#52525B]">vs mês anterior</span>
            </div>
          </div>
          {totalGoalSales > 0 && (
            <div className="mt-4 w-full max-w-[220px] flex flex-col gap-1 items-center">
              <div className="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden relative border border-zinc-900 shadow-inner">
                <div 
                  style={{ width: `${Math.min(100, (currentStats.sales / totalGoalSales) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-[#DCA61F] to-[#E9C364] rounded-full transition-all duration-500 shadow-[0_0_4px_rgba(220,166,31,0.2)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Investimento */}
        <div className="p-6 flex flex-col items-center text-center">
          <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-2">Investimento em Anúncios</p>
          <div className="flex items-baseline justify-center gap-3 mb-1">
            <h4 className="text-3xl font-bold text-white">R$ {currentStats.cost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h4>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-[10px] font-bold ${costDiff.isUp ? 'text-red-500' : 'text-emerald-500'}`}>
              {costDiff.isUp ? '+' : ''}{Math.abs(costDiff.diff).toLocaleString('pt-BR')} ({costDiff.isUp ? '+' : ''}{costDiff.percent.toFixed(1)}%)
            </span>
            <span className="text-[10px] text-[#52525B]">vs mês anterior</span>
          </div>
        </div>

        {/* ROAS */}
        <div className="p-6 flex flex-col items-center text-center">
          <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-2">ROAS do Mês</p>
          <div className="flex items-baseline justify-center gap-3 mb-1">
            <h4 className="text-3xl font-bold text-white">{currentRoas.toFixed(2)}x</h4>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-[10px] font-bold ${roasDiff.isUp ? 'text-emerald-500' : 'text-red-500'}`}>
              {roasDiff.isUp ? '+' : ''}{roasDiff.diff.toFixed(2)} ({roasDiff.isUp ? '+' : ''}{roasDiff.percent.toFixed(1)}%)
            </span>
            <span className="text-[10px] text-[#52525B]">vs mês anterior</span>
          </div>
        </div>
      </div>

      <div className="p-0 border-t border-border bg-black/20">
        <div className="px-6 py-4 border-b border-border/50">
          <p className="text-[10px] text-text-secondary uppercase font-bold tracking-[0.2em]">Detalhamento por Produto</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-[10px] text-text-muted uppercase font-bold">Produto</th>
                <th className="px-6 py-3 text-[10px] text-text-muted uppercase font-bold text-center">Meta de Vendas (Mês)</th>
                <th className="px-6 py-3 text-[10px] text-text-muted uppercase font-bold text-right">Quantidade</th>
                <th className="px-6 py-3 text-[10px] text-text-muted uppercase font-bold text-right">Comparativo Qtd</th>
                <th className="px-6 py-3 text-[10px] text-text-muted uppercase font-bold text-right">Faturamento</th>
                <th className="px-6 py-3 text-[10px] text-text-muted uppercase font-bold text-right">Comparativo R$</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentStats.products.length > 0 ? currentStats.products.map((p, i) => {
                const prevP = prevStats.products.find(pp => pp.name === p.name) || { qty: 0, rev: 0 };
                const qDiff = getDiff(p.qty, prevP.qty);
                const rDiff = getDiff(p.rev, prevP.rev);
                
                const goalKey = `${monthKey}::${p.name}`;
                const currentGoal = productGoals[goalKey] || 0;
                const isEditing = editingProduct === p.name;

                return (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-serif font-normal italic text-white truncate max-w-[250px] tracking-wide" title={p.name}>{p.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 justify-center">
                          <input
                            type="number"
                            min={1}
                            autoFocus
                            value={editingValue}
                            onChange={e => setEditingValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const val = Number(editingValue);
                                if (val > 0) {
                                  updateGoal(p.name, val);
                                } else {
                                  deleteGoal(p.name);
                                }
                                setEditingProduct(null);
                              } else if (e.key === 'Escape') {
                                setEditingProduct(null);
                              }
                            }}
                            className="w-14 bg-zinc-900 border border-primary/55 rounded px-2 py-1 text-xs text-zinc-100 font-mono text-center focus:outline-none focus:border-primary shadow-inner"
                          />
                          <button
                            onClick={() => {
                              const val = Number(editingValue);
                              if (val > 0) {
                                updateGoal(p.name, val);
                              } else {
                                deleteGoal(p.name);
                              }
                              setEditingProduct(null);
                            }}
                            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 transition-all font-mono"
                            title="Salvar"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingProduct(null)}
                            className="text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 transition-all font-mono"
                            title="Cancelar"
                          >
                            ✗
                          </button>
                        </div>
                      ) : currentGoal > 0 ? (
                        (() => {
                          const pct = Math.min(100, (p.qty / currentGoal) * 100);
                          const isFinished = p.qty >= currentGoal;
                          const curso = cursos.find(c => c.nome === p.name);
                          const unitPrice = curso ? (Number(curso.preco) || 0) : 0;
                          const goalRevenue = currentGoal * unitPrice;
                          return (
                            <div className="flex flex-col gap-1 mx-auto max-w-[170px]">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="text-zinc-400 text-xs font-semibold">{p.qty} / {currentGoal} vendas</span>
                                <span className={isFinished ? "text-emerald-400 font-bold" : "text-primary font-bold"}>
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-zinc-950/80 border border-zinc-900 overflow-hidden relative shadow-inner">
                                <div
                                  style={{ width: `${pct}%` }}
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isFinished 
                                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.3)]' 
                                      : 'bg-gradient-to-r from-[#DCA61F] to-[#E9C364] shadow-[0_0_6px_rgba(220,166,31,0.2)]'
                                  }`}
                                />
                              </div>
                              {goalRevenue > 0 && (
                                <div className="text-[9px] font-mono text-zinc-500 text-left -mt-0.5 leading-none mb-0.5">
                                  Equivale a: <span className="text-zinc-300">R$ {goalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-[9px] text-[#A1A1AA] mt-0.5 select-none leading-none">
                                <span className={isFinished ? "text-emerald-400 font-semibold" : "text-zinc-500"}>
                                  {isFinished ? 'Meta batida! 🎉' : `Falta ${currentGoal - p.qty}`}
                                </span>
                                <div className="flex items-center gap-1.5 ml-2">
                                  <button
                                    onClick={() => {
                                      setEditingProduct(p.name);
                                      setEditingValue(currentGoal);
                                    }}
                                    className="text-[#71717A] hover:text-white transition-colors underline font-medium"
                                  >
                                    Editar
                                  </button>
                                  <span>•</span>
                                  {deletingProduct === p.name ? (
                                    <span className="flex items-center gap-1.5 bg-red-950/40 border border-red-500/20 px-1.5 py-0.5 rounded leading-none transition-all">
                                      <span className="text-red-400 font-semibold text-[8px] tracking-wide uppercase">Apagar?</span>
                                      <button
                                        onClick={() => {
                                          deleteGoal(p.name);
                                          setDeletingProduct(null);
                                        }}
                                        className="text-[9px] font-bold text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                                      >
                                        Sim
                                      </button>
                                      <span className="text-[#52525B] text-[8px]">/</span>
                                      <button
                                        onClick={() => setDeletingProduct(null)}
                                        className="text-[9px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                      >
                                        Não
                                      </button>
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setDeletingProduct(p.name);
                                      }}
                                      className="text-[#71717A] hover:text-red-400 transition-colors flex items-center gap-1"
                                      title="Excluir Meta"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Excluir
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-center">
                          <button
                            onClick={() => {
                              setEditingProduct(p.name);
                              setEditingValue(10);
                            }}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/20 border border-primary/20 px-2 py-1 rounded transition-all tracking-wider uppercase"
                          >
                            <Target className="w-3 h-3 text-primary animate-pulse" /> Definir Meta
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-right text-text-primary">{p.qty}</td>
                    <td className="px-6 py-4 text-right">
                       {formatDiff(qDiff)}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-right text-primary">R$ {p.rev.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td className="px-6 py-4 text-right">
                       {formatDiff(rDiff, true)}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#525252] italic text-xs">Sem dados para este período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

const ProductRow: React.FC<{ p: any, isSupabase?: boolean }> = ({ p, isSupabase }) => {
  const [expanded, setExpanded] = useState(false);
  const roas = p.cost > 0 ? p.rev / p.cost : 0;
  console.log(`Debug ProductRow: Name: ${p.name}, Cost: ${p.cost}, Rev: ${p.rev}, ROAS: ${roas}`);
  return (
    <React.Fragment>
      <tr onClick={() => setExpanded(!expanded)} className="hover:bg-bg-card transition-colors cursor-pointer group border-b border-border/50">
        <td className="p-4 text-[0.875rem] font-normal text-text-secondary max-w-[200px] truncate" title={p.name}>
          <div className="flex items-center gap-2">
            <ChevronRight className={`w-3 h-3 shrink-0 text-text-secondary transition-transform ${expanded ? 'rotate-90' : ''}`} />
            <div className="flex flex-col">
              <span className="truncate font-medium">{p.name}</span>
              {!isSupabase && <span className="text-[0.75rem] text-text-muted">Sessões: {p.sessions || 0}</span>}
            </div>
          </div>
        </td>
        <td className="p-4 text-[0.875rem] font-medium tabular-nums text-right text-text-primary text-text-label">{p.qty}</td>
        <td className="p-4 text-[0.875rem] font-medium tabular-nums text-right text-text-primary">
             <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roas > 3 ? 'bg-primary/10 text-primary' : (roas > 0 ? 'bg-orange-500/10 text-orange-600' : 'bg-gray-500/10 text-text-secondary')}`}>
               {roas > 0 ? `${roas.toFixed(1)}x` : '0.0x'}
             </span>
        </td>
        <td className="p-4 text-[0.875rem] font-medium tabular-nums text-right text-text-primary text-primary font-semibold">R$ {p.rev.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
      </tr>
      {expanded && p.campaigns && p.campaigns.length > 0 && (
        <tr className="bg-bg-section">
          <td colSpan={4} className="p-0">
            <div className="px-4 py-3 border-l-2 border-border ml-4 bg-bg-sidebar">
              <div className="text-[0.75rem] font-semibold uppercase tracking-[0.05em] text-text-label mb-2 font-medium">Vendas por Campanha/Origem</div>
              <div className="space-y-2">
                {p.campaigns.map((c: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary truncate pr-2 max-w-[180px]" title={c.name}>{c.name}</span>
                    <div className="flex space-x-4 shrink-0 text-right">
                      <span className="font-mono text-text-secondary w-8">{c.qty} un</span>
                      <span className="font-mono text-primary w-20">R$ {c.rev.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
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

interface CulturaSplashScreenProps {
  onComplete: () => void;
}

const CulturaSplashScreen: React.FC<CulturaSplashScreenProps> = ({ onComplete }) => {
  const letters = "Cultura Jurídica".split("");

  useEffect(() => {
    const timer = setTimeout(onComplete, 2000); // Transitions exactly when animations finish
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center text-white select-none overflow-hidden"
    >
      <div className="flex flex-col items-center">
        {/* Logo - EXACT Matching Dashboard Header Style */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 relative"
        >
          <img 
            src="https://jndvesrtqewjqvarfaox.supabase.co/storage/v1/object/public/Logos/625949743_18077241884595017_7660496256666720708_n.jpg" 
            alt="Cultura Jurídica" 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full border border-white/10 object-cover shadow-2xl" 
            referrerPolicy="no-referrer"
          />
        </motion.div>
        
        {/* Cultura Jurídica Animado - Matching Dashboard Title EXACTLY (Now White) */}
        <div className="flex overflow-hidden mb-6 h-12 md:h-20 items-center">
          {letters.map((letter, i) => (
            <motion.span
              key={i}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                delay: 0.3 + i * 0.04, 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1] 
              }}
              className="text-3xl md:text-5xl font-serif font-normal italic tracking-[0.08em] text-white"
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}
        </div>
        
        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.4, y: 0 }}
          transition={{ delay: 1.3, duration: 0.7 }}
          className="text-[10px] md:text-xs font-light tracking-[0.3em] text-gray-400 uppercase"
        >
          Saiba mais. Saiba melhor. Saiba Direito.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [dataStatus, setDataStatus] = useState<'loading' | 'needs_setup' | 'logged_out' | 'success' | 'error'>('loading');
  const [showSplash, setShowSplash] = useState(true);
  const [channelData, setChannelData] = useState<any>({
    meta: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0, products: [] },
    google: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0, products: [] },
    organic: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0, products: [] },
    total: { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0 }
  });
  const [kpis, setKpis] = useState<any[]>([]);
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
  const [checkoutsAllStatus, setCheckoutsAllStatus] = useState<any[]>([]);
  const [checkoutsCancelados, setCheckoutsCancelados] = useState<any[]>([]);
  const [checkoutsRecusados, setCheckoutsRecusados] = useState<any[]>([]);
  const [filteredCheckouts, setFilteredCheckouts] = useState<any[]>([]);
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [metaCosts, setMetaCosts] = useState<any[]>([]);
  const [filteredMetaCosts, setFilteredMetaCosts] = useState<any[]>([]);
  const [metaCostsFull, setMetaCostsFull] = useState<any[]>([]);
  const [supabaseCheckoutsFull, setSupabaseCheckoutsFull] = useState<any[]>([]);
  const [supabaseCampanhasAtivas, setSupabaseCampanhasAtivas] = useState<any[]>([]);
  const [distStats, setDistStats] = useState<any>({ cost: 0, revenue: 0, sales: 0, leads: 0 });

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

    if (src === 'ig' && med === 'paid') return 'Botão turbinar do Instagram';
    if (src === 'fb' && med === 'paid') return 'Botão turbinar do Facebook';
    if ((src === 'search_ads' || src === 'google') && camp.includes('brand')) return 'Google Ads (Campanha de Marca)';

    if (src === 'ig' && med === 'social' && cont === 'link_in_bio') return 'Link na bio do Instagram';

    if (src.includes('manychat')) return 'Manychat';
    if (src.includes('rdstation') || src.includes('rd_station')) return 'RD Station';
    if (src.includes('email') || src.includes('e-mail') || src.includes('newsletter')) return 'E-Mail';
    if (src.includes('bio') || med.includes('bio') || camp.includes('bio') || cont.includes('bio')) return 'Bio do Instagram';
    if (src.includes('comercial') || src.includes('whatsapp') || src.includes('crm') || src.includes('comerc')) return 'Comercial';
    if ((src.includes('google') || src.includes('gads')) && (med.includes('cpc') || med.includes('ads') || med.includes('search'))) return 'Google Ads (Search)';
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
            
            // 1. Cadastros (Incluindo todos os campos para garantir que pegamos o 'id' se necessário)
            const { data: cadastros, error: err1 } = await supabase
              .from('cadastros')
              .select('*')
              .order('data_cadastro', { ascending: false })
              .limit(5000);
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
            const { data: checkoutsRaw, error: err4 } = await supabase
              .from('eventos_checkout')
              .select('*')
              .order('timestamp', { ascending: false })
              .limit(5000);
            if (err4) throw err4;

            // 5. Tráfego Meta Cultura (TUDO) do Supabase
            const { data: trafegoMeta, error: err5 } = await supabase
              .from('trafego_meta_cultura')
              .select('*')
              .order('date', { ascending: false })
              .limit(5000);
            
            console.log('err5:', err5);
            if (err5) throw err5;
            
            console.log("Data provided by trafegoMeta (first 2 rows):", trafegoMeta?.slice(0, 2));

            // 6. Anúncios Ativos Cultura (TUDO) do Supabase
            let activeCampsRaw: any[] = [];
            try {
              const { data: activeCamps, error: err6 } = await supabase
                .from('anuncios_ativos_cultura')
                .select('*');
              if (err6) throw err6;
              activeCampsRaw = activeCamps || [];
            } catch (e) {
              console.warn("Aviso: Falha ao carregar anuncios_ativos_cultura", e);
            }

            // Fallback robusto se a tabela estiver vazia
            if (activeCampsRaw.length === 0 && trafegoMeta && trafegoMeta.length > 0) {
              console.log("ℹ️ Tabela de anuncios_ativos_cultura está vazia. Gerando campanhas ativas a partir de trafego_meta_cultura...");
              const seen = new Set();
              trafegoMeta.forEach(row => {
                const campaign = row.campaign_name || row.campaign || row.campanha || '';
                const adset = row.adset_name || row.ad_set_name || row.adset || row.conjunto_anuncio || row.conjunto || '';
                const ad = row.ad_name || row['ad name'] || row.nome_do_anuncio || row.nome || row.ad || '';
                if (campaign && adset && ad) {
                  const key = `${campaign}||${adset}||${ad}`;
                  if (!seen.has(key)) {
                    seen.add(key);
                    activeCampsRaw.push({
                      campaign_name: campaign,
                      adset_name: adset,
                      ad_name: ad,
                      ad_id: row.ad_id || '',
                      creative_url: row.creative_url || row.creativeUrl || row.url_criativo || ''
                    });
                  }
                }
              });
            }
            setSupabaseCampanhasAtivas(activeCampsRaw);

            // Formata custo do Meta do Supabase conforme correspondências especificadas pelo usuário:
            // - date -> day, data
            // - spend -> spent, gasto, cost, valor
            // - campaign_name -> campaign, campanha
            // - ad_name -> ad name, nome do anuncio
            const metaCosts = (trafegoMeta || []).map(row => {
              const rawDate = row.date || row.day || row.data || '';
              const dateStr = String(rawDate);
              
              let rawSpend = row.spend;
              if (rawSpend === undefined || rawSpend === null) rawSpend = row.spent;
              if (rawSpend === undefined || rawSpend === null) rawSpend = row.gasto;
              if (rawSpend === undefined || rawSpend === null) rawSpend = row.cost;
              if (rawSpend === undefined || rawSpend === null) rawSpend = row.valor;
              if (rawSpend === undefined || rawSpend === null) rawSpend = row.amount_spent;

              let cost = 0;
              if (rawSpend !== undefined && rawSpend !== null) {
                if (typeof rawSpend === 'number') {
                  cost = rawSpend;
                } else {
                  const valStr = String(rawSpend)
                    .replace('R$', '')
                    .replace(/\./g, '')
                    .replace(',', '.')
                    .trim();
                  cost = parseFloat(valStr);
                }
              }
              
              const campaign = row.campaign_name || row.campaign || row.campanha || 'Desconhecido';
              const adName = row.ad_name || row['ad name'] || row.nome_do_anuncio || row['nome do anuncio'] || row.nome || 'Desconhecido';

              if (!dateStr || isNaN(cost)) return null;

              let dateObj: Date;
              const cleanDateStr = dateStr.split('T')[0].split(' ')[0];
              if (dateStr.includes('-')) {
                const [y, m, d] = cleanDateStr.split('-');
                dateObj = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0));
              } else if (dateStr.includes('/')) {
                const [d, m, y] = cleanDateStr.split('/');
                dateObj = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0));
              } else {
                dateObj = new Date(cleanDateStr);
              }

              if (isNaN(dateObj.getTime())) return null;
              if (dateStr.includes('-') || dateStr.includes('/')) {
                (dateObj as any)._isBRL = true;
              } else {
                const shifted = new Date(dateObj.getTime() - 3 * 3600 * 1000);
                (shifted as any)._isBRL = true;
                dateObj = shifted;
              }

              return { 
                date: dateObj, 
                cost, 
                campaign, 
                adsetName: row.adset_name || row.ad_set_name || row.adset || row.conjunto_anuncio || 'Sem Conjunto de Anúncios',
                adName,
                ad_id: row.ad_id ? String(row.ad_id) : '',
                campaign_id: row.campaign_id ? String(row.campaign_id) : '',
                adset_id: row.adset_id ? String(row.adset_id) : '',
                impressions: Number(row.impressions) || 0,
                reach: Number(row.reach) || 0,
                frequency: Number(row.frequency) || 0,
                clicks: Number(row.clicks) || 0,
                unique_clicks: Number(row.unique_clicks) || 0,
                outbound_clicks: Number(row.outbound_clicks) || 0,
                ctr: Number(row.ctr) || 0,
                unique_ctr: Number(row.unique_ctr) || 0,
                website_ctr: Number(row.website_ctr) || 0,
                social_spend: Number(row.social_spend) || 0,
                cpc: Number(row.cpc) || 0,
                cpm: Number(row.cpm) || 0,
                cpp: Number(row.cpp) || 0,
                link_clicks: Number(row.link_clicks) || 0,
                post_engagement: Number(row.post_engagement) || 0,
                page_engagement: Number(row.page_engagement) || 0,
                leads: Number(row.leads) || 0,
                purchases: Number(row.purchases) || 0,
                omni_purchases: Number(row.omni_purchases) || 0,
                complete_registrations: Number(row.complete_registrations) || 0,
                initiate_checkouts: Number(row.initiate_checkouts) || 0,
                add_to_carts: Number(row.add_to_carts) || 0,
                add_payment_infos: Number(row.add_payment_infos) || 0,
                searches: Number(row.searches) || 0,
                view_contents: Number(row.view_contents) || 0,
                contacts: Number(row.contacts) || 0,
                schedules: Number(row.schedules) || 0,
                subscribe: Number(row.subscribe) || 0,
                start_trial: Number(row.start_trial) || 0,
                cost_per_lead: Number(row.cost_per_lead) || 0,
                cost_per_purchase: Number(row.cost_per_purchase) || 0,
                cost_per_complete_registration: Number(row.cost_per_complete_registration) || 0,
                cost_per_link_click: Number(row.cost_per_link_click) || 0,
                video_plays: Number(row.video_plays) || 0,
                video_avg_watch_time: Number(row.video_avg_watch_time) || 0,
                video_p25: Number(row.video_p25) || 0,
                video_p50: Number(row.video_p50) || 0,
                video_p75: Number(row.video_p75) || 0,
                video_p95: Number(row.video_p95) || 0,
                video_p100: Number(row.video_p100) || 0,
                video_thruplay: Number(row.video_thruplay) || 0
              };
            }).filter(v => v !== null) as any[];

            setMetaCosts(metaCosts);
            setMetaCostsFull(metaCosts);

            // Deduplicate exact purchases (same course, same user, same value)
            const uniquePurchases: any[] = [];
            
            // Prioritize 'pago' status during deduplication
            const rawCheckouts = (checkoutsRaw || []);
            const chronologicalCheckouts = [...rawCheckouts].sort((a, b) => {
               const timeA = getBRLDate(a.timestamp || a.created_at).getTime();
               const timeB = getBRLDate(b.timestamp || b.created_at).getTime();
               
               // If it's the same time, prioritize 'pago'
               if (Math.abs(timeA - timeB) < 1000) {
                 const statusA = (a.status || '').toLowerCase().trim();
                 const statusB = (b.status || '').toLowerCase().trim();
                 if (statusA === 'pago' && statusB !== 'pago') return -1;
                 if (statusB === 'pago' && statusA !== 'pago') return 1;
               }
               return timeA - timeB;
            });

            chronologicalCheckouts.forEach(c => {
               const dateVal = c.timestamp || c.created_at;
               if (!dateVal || !c.id_usuario || !c.id_curso) {
                 uniquePurchases.push(c);
                 return;
               }
               const cTime = getBRLDate(dateVal).getTime();
               const cStatus = (c.status || '').toLowerCase().trim();
               
               const existingIdx = uniquePurchases.findIndex(existing => {
                 if (existing.id_usuario === c.id_usuario && existing.id_curso === c.id_curso && existing.valor === c.valor) {
                    const eTime = getBRLDate(existing.timestamp || existing.created_at).getTime();
                    const diffDays = Math.abs(cTime - eTime) / (1000 * 60 * 60 * 24);
                    return diffDays <= 30;
                 }
                 return false;
               });

               if (existingIdx === -1) {
                 uniquePurchases.push(c);
               } else {
                 // Optimization: If the new one is 'pago' and the existing one isn't, swap them!
                 const existing = uniquePurchases[existingIdx];
                 const eStatus = (existing.status || '').toLowerCase().trim();
                 if (cStatus === 'pago' && eStatus !== 'pago') {
                   uniquePurchases[existingIdx] = c;
                 }
               }
            });

            // Restore descending order for the rest of the app
            uniquePurchases.sort((a, b) => 
               getBRLDate(b.timestamp || b.created_at).getTime() - getBRLDate(a.timestamp || a.created_at).getTime()
            );

            // Deduplicate combo checkouts (same day + user + value for different courses)
            const deduplicatedCheckouts: any[] = [];
            const checkoutMap = new Map();
            uniquePurchases.forEach((c: any) => {
               const dateVal = c.timestamp || c.created_at;
               if (!dateVal || !c.id_usuario) {
                 deduplicatedCheckouts.push(c);
                 return;
               }
               // Group by YYYY-MM-DD to handle webhook delays for the same transaction
               const dayGroup = new Date(dateVal).toISOString().substring(0, 10);
               const key = `${c.id_usuario}_${dayGroup}_${c.valor}`;
               if (checkoutMap.has(key)) {
                  const existing = checkoutMap.get(key);
                  
                  // Collect the course names that make up this combo
                  const existingCurso = cursos?.find((cur: any) => cur.id_curso === existing.id_curso);
                  const newCurso = cursos?.find((cur: any) => cur.id_curso === c.id_curso);
                  
                  if (!existing._comboParts) {
                    existing._comboParts = [];
                    if (existingCurso) existing._comboParts.push(existingCurso.nome.toLowerCase());
                  }
                  if (newCurso) existing._comboParts.push(newCurso.nome.toLowerCase());

                  // Now, try to find a course in `cursos` that contains ALL of these parts in its name!
                  // That would be the actual "combo" course.
                  const parts = existing._comboParts;
                  const comboMatch = cursos?.find((cur: any) => {
                     const lowerName = cur.nome.toLowerCase();
                     // See if this course name contains all the parts (like "clube dos penalistas" AND "clube dos civilistas")
                     // We ignore courses that only have one part if we have multiple parts
                     if (parts.length > 1 && parts.every((p: string) => lowerName.includes(p.replace(/clube dos /g, '').replace(/clube /g, '').trim()))) {
                         return true;
                     }
                     return false;
                  });

                  if (comboMatch) {
                     existing.id_curso = comboMatch.id_curso; // Assign the real combo ID!
                  }
               } else {
                  checkoutMap.set(key, { ...c });
               }
            });

            const checkouts = [...deduplicatedCheckouts, ...Array.from(checkoutMap.values())].sort((a: any, b: any) => {
               const dateA = new Date(a.timestamp || a.created_at || 0).getTime();
               const dateB = new Date(b.timestamp || b.created_at || 0).getTime();
               return dateB - dateA;
            });

            setSupabaseCheckouts(checkouts);
            setSupabaseCheckoutsFull(checkouts);

            // Crossover de dados: Atribui os UTMs de cadastro (lead) para compras (checkouts) sem UTM
            checkouts.forEach((c: any) => {
               const hasNoUtm = !c.utm_source || 
                                c.utm_source.trim() === '' || 
                                c.utm_source === 'null' || 
                                c.utm_source === 'undefined' ||
                                ['organico', 'direto', 'direct', 'organic', 'sem rastreio', 'busca orgânica / sem rastreio'].includes(c.utm_source.toLowerCase().trim());

               if (hasNoUtm) {
                  const lead = (cadastros || []).find((l: any) => {
                     if (c.id_usuario) {
                        const cId = String(c.id_usuario);
                        if (String(l.id_usuario) === cId || String(l.id) === cId) return true;
                     }
                     const cEmail = String(c.email || c.email_cliente || c.customer_email || '').toLowerCase().trim();
                     const lEmail = String(l.email || '').toLowerCase().trim();
                     if (cEmail && lEmail && cEmail === lEmail) return true;
                     return false;
                  });

                  if (lead && lead.utm_source_cadastro) {
                     c.utm_source = lead.utm_source_cadastro;
                     c.utm_medium = lead.utm_medium_cadastro || '';
                     c.utm_campaign = lead.utm_campaign_cadastro || '';
                     c.utm_content = lead.utm_content_cadastro || '';
                     c.utm_crossed_from_cadastro = true;
                  }
               }
            });

            // --- FILTRAGEM POR DATA (JS) ---
            const nowUTC = new Date();
            // Pegamos o horário atual de Brasília e representamos como UTC absoluto
            const now = new Date(nowUTC.getTime() - 3 * 3600 * 1000);
            (now as any)._isBRL = true;

            let startDate = new Date(now.getTime());
            let endDate = new Date(now.getTime());
            
            if (dateRange === '7days') { 
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); 
              startDate.setUTCHours(0,0,0,0); 
              endDate = new Date(now.getTime());
              endDate.setUTCHours(23,59,59,999);
            }
            else if (dateRange === '14days') { 
              startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); 
              startDate.setUTCHours(0,0,0,0); 
              endDate = new Date(now.getTime());
              endDate.setUTCHours(23,59,59,999);
            }
            else if (dateRange === '30days') { 
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); 
              startDate.setUTCHours(0,0,0,0); 
              endDate = new Date(now.getTime());
              endDate.setUTCHours(23,59,59,999);
            }
            else if (dateRange === 'thisMonth') {
              startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
              endDate = new Date(now.getTime());
              endDate.setUTCHours(23,59,59,999);
            }
            else if (dateRange === 'yesterday') {
              startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              startDate.setUTCHours(0,0,0,0);
              endDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              endDate.setUTCHours(23,59,59,999);
            }
            else if (dateRange === 'today') {
              startDate = new Date(now.getTime());
              startDate.setUTCHours(0,0,0,0);
              endDate = new Date(now.getTime());
              endDate.setUTCHours(23,59,59,999);
            }
            else if (dateRange === 'custom' && appliedCustomDate.start) {
              const [sy, sm, sd] = appliedCustomDate.start.split('-').map(Number);
              startDate = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0));
              if (appliedCustomDate.end) {
                const [ey, em, ed] = appliedCustomDate.end.split('-').map(Number);
                endDate = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));
              }
            }
            else { 
              startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); 
              startDate.setUTCHours(0,0,0,0); 
              endDate = new Date(now.getTime());
              endDate.setUTCHours(23,59,59,999);
            } // Default 1 ano

            (startDate as any)._isBRL = true;
            (endDate as any)._isBRL = true;

            const checkoutsNoPeriodo = (checkouts || []).filter((c: any) => {
              const dateVal = c.timestamp || c.created_at;
              if (!dateVal) return false;
              
              const itemDate = getBRLDate(dateVal);
              
              return itemDate >= startDate && itemDate <= endDate;
            });
            const filteredData = checkoutsNoPeriodo.filter((c: any) => (c.status || '').toLowerCase().trim() === 'pago');
            const canceladosData = checkoutsNoPeriodo.filter((c: any) => {
               const st = (c.status || '').toLowerCase().trim();
               return st.includes('cancelad') || st.includes('estornad') || st.includes('refunded');
            });
            const recusadosData = checkoutsNoPeriodo.filter((c: any) => {
               const st = (c.status || '').toLowerCase().trim();
               return st.includes('recusa') || st.includes('negad');
            });
            
            setFilteredCheckouts(filteredData);
            setFilteredMetaCosts(metaCosts.filter((m: any) => m.date >= startDate && m.date <= endDate));
            setSupabaseCheckouts(filteredData);
            setCheckoutsAllStatus(checkoutsNoPeriodo);
            setCheckoutsCancelados(canceladosData);
            setCheckoutsRecusados(recusadosData);
            
            const filteredCadastros = cadastros.filter(c => {
              const dateVal = c.data_cadastro;
              if (!dateVal) return false;
              
              const itemDate = getBRLDate(dateVal);
              return itemDate >= startDate && itemDate <= endDate;
            });

            // --- PROCESSAMENTO DE DADOS SUPABASE PARA O DASHBOARD ---
            const leadsCount = filteredCadastros.length;
            const totalRevenue = filteredData.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
            const salesCount = filteredData.length;
            
            console.log("DEBUG CALCS:", {
               startDate, endDate,
               allCheckouts: (checkouts || []).length,
               filteredData: filteredData.length,
               totalRevenue,
               salesCount,
               activeCampsCount: activeCampsRaw.length,
               metaCostsCount: metaCosts.length
            });
            
            const paymentMap = new Map<string, number>();
            let fallbackCount = 0;
            
            // Atribuição por Canal (UTM Source)
            const channelDefinitions: Record<string, { name: string, color: string }> = {
              meta: { name: 'Meta Ads', color: 'bg-primary/10 text-primary border-primary/20' },
              google: { name: 'Google Ads (Search)', color: 'bg-primary/10 text-primary border-primary/20' },
              comercial: { name: 'Comercial', color: 'bg-primary/10 text-primary border-primary/20' },
              rdstation: { name: 'RD Station', color: 'bg-primary/10 text-primary border-primary/20' },
              bio: { name: 'Bio do Instagram', color: 'bg-primary/10 text-primary border-primary/20' },
              manychat: { name: 'Manychat', color: 'bg-primary/10 text-primary border-primary/20' },
              email: { name: 'E-Mail', color: 'bg-primary/10 text-primary border-primary/20' },
              organic: { name: 'Busca Orgânica / Sem Rastreio', color: 'bg-primary/10 text-primary border-primary/20' }
            };

            const channelMap: any = {};
            Object.keys(channelDefinitions).forEach(key => {
              channelMap[key] = { revenue: 0, sales: 0, leads: 0, sessions: 0, cost: 0, products: new Map(), campaigns: new Map() };
            });
            channelMap.total = { revenue: totalRevenue, sales: salesCount, leads: leadsCount, sessions: 0, cost: 0, products: new Map() };

            // Integration of Meta Ads Costs from Spreadsheet
            const periodMetaCost = metaCosts.reduce((acc, curr) => {
              if (curr.date >= startDate && curr.date <= endDate) {
                return acc + curr.cost;
              }
              return acc;
            }, 0);
            channelMap.meta.cost = periodMetaCost;
            channelMap.total.cost = periodMetaCost; // For now total cost is just Meta. Google cost would be separate if available.

            // --- DISTRIBUIÇÃO DE CONTEÚDO (Tags: [CUL26], [DIST], [ACE]) ---
            const distributionTags = ["[CUL26]", "[DIST]", "[ACE]"];
            const distributionCosts = metaCosts.filter(c => 
                c.date >= startDate && c.date <= endDate &&
                distributionTags.some(tag => c.campaign.includes(tag))
            ).reduce((acc, curr) => acc + curr.cost, 0);

            // Filter checkouts that belong to distribution campaigns
            const distributionCheckouts = filteredData.filter(c => {
                let camp = c.utm_campaign || '';
                if (!c.utm_source && !camp && c.id_usuario) {
                   const lead = cadastros.find((l: any) => String(l.id_usuario) === String(c.id_usuario) || String(l.id) === String(c.id_usuario));
                   if (lead && lead.utm_campaign_cadastro) {
                      camp = lead.utm_campaign_cadastro;
                   }
                }
                return distributionTags.some(tag => camp.includes(tag));
            });
            const distributionRevenue = distributionCheckouts.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
            
            // Filter leads belonging to distribution campaigns
            const distributionLeads = filteredCadastros.filter(l => 
                distributionTags.some(tag => (l.utm_campaign_cadastro || '').includes(tag))
            ).length;

            setDistStats({
                cost: distributionCosts,
                revenue: distributionRevenue,
                sales: distributionCheckouts.length,
                leads: distributionLeads
            });



            // Map para fácil acesso aos cursos
            const cursosMap = new Map<string, any>(cursos.map((c: any) => [String(c.id_curso), c]));

            const getCategory = (source: any, medium: any, campaign: any = '', content: any = '') => {
              const src = (source || '').toLowerCase();
              const med = (medium || '').toLowerCase();
              const camp = (campaign || '').toLowerCase();
              const cont = (content || '').toLowerCase();

              if ((src === 'search_ads' || src === 'google') && camp.includes('brand')) return 'google';
              if (src === 'ig' && med === 'social' && cont === 'link_in_bio') return 'bio';

              if (src.includes('manychat')) return 'manychat';
              if (src.includes('rdstation') || src.includes('rd_station')) return 'rdstation';
              if (src.includes('email') || src.includes('e-mail') || src.includes('newsletter')) return 'email';
              if (src.includes('bio') || med.includes('bio') || camp.includes('bio') || cont.includes('bio')) return 'bio';
              if (src.includes('comercial') || src.includes('whatsapp') || src.includes('crm') || src.includes('comerc')) return 'comercial';
              if (src.includes('search_ads') || (src.includes('google') || src.includes('gads')) && (med.includes('cpc') || med.includes('ads') || med.includes('search'))) return 'google';
              if (src.includes('fb') || src.includes('ig') || src.includes('meta') || src.includes('instagram') || src.includes('facebook')) return 'meta';
              
              return 'organic';
            };

            filteredData.forEach(checkout => {
              let source = checkout.utm_source || '';
              let medium = checkout.utm_medium || '';
              let campaign = checkout.utm_campaign || '';
              let content = checkout.utm_content || '';
              const rev = Number(checkout.valor) || 0;
              const cursoId = checkout.id_curso;
              const curso = cursosMap.get(String(cursoId));
              const cursoName = curso ? curso.nome : 'Curso Indefinido';

              // Fallback logic: Se não tem rastreio direto, busca no cadastro do usuário
              if (!source && checkout.id_usuario) {
                const lead = cadastros.find((l: any) => {
                  const cId = String(checkout.id_usuario);
                  return String(l.id_usuario) === cId || String(l.id) === cId;
                });
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
              const pmRaw = checkout.metodo_pagamento || checkout.payment_method || checkout.forma_pagamento || 'Outro';
              const pm = normalizePaymentMethod(pmRaw);
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

            // --- CUSTOS POR PRODUTO ---
            // Mapping for product costs based on tags
            metaCosts.forEach(c => {
                if (c.date >= startDate && c.date <= endDate) {
                    channelMap.total.products.forEach((p: any, name: string) => {
                         const ad = c.adName.toUpperCase();
                         const campName = c.campaign.toUpperCase();
                         const searchStr = `${ad} ${campName}`;
                         const prod = name.toUpperCase();
                         
                         // More flexible matching
                         const hasCIV = searchStr.includes('CIV') && searchStr.includes('26');
                         const hasPEN = searchStr.includes('PEN') && searchStr.includes('26');
                         const hasACA = searchStr.includes('ACA') && searchStr.includes('26');

                         if (hasPEN && prod.includes('PENALIST')) {
                             p.cost = (p.cost || 0) + c.cost;
                         }
                         if (hasCIV && prod.includes('CIVILIST')) {
                             p.cost = (p.cost || 0) + c.cost;
                         }
                         if (hasACA && prod.includes('ACADEMIA')) {
                             p.cost = (p.cost || 0) + c.cost;
                         }
                    });
                }
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
            const trendMap = new Map<string, { value: number, salesCount: number, leads: number, cost: number, cancelsCount: number, declinesCount: number, products: Map<string, number> }>();
            
            // Adicionar custos (Meta Ads) ao trendMap
            metaCosts.forEach(c => {
              if (c.date >= startDate && c.date <= endDate) {
                const dateStr = formatDateBRL(c.date);
                if (!trendMap.has(dateStr)) {
                  trendMap.set(dateStr, { value: 0, salesCount: 0, leads: 0, cost: 0, cancelsCount: 0, declinesCount: 0, products: new Map() });
                }
                trendMap.get(dateStr)!.cost += c.cost;
              }
            });

            // Inicializar com checkouts (vendas PAGAS)
            filteredData.forEach(c => {
              const dateStr = formatDateBRL(c.timestamp || c.created_at);
              if (!trendMap.has(dateStr)) {
                trendMap.set(dateStr, { value: 0, salesCount: 0, leads: 0, cost: 0, cancelsCount: 0, declinesCount: 0, products: new Map() });
              }
              const dayData = trendMap.get(dateStr)!;
              dayData.value += (Number(c.valor) || 0);
              dayData.salesCount += 1;
              
              const curso = cursosMap.get(String(c.id_curso));
              const cursoName = curso ? curso.nome : 'Curso #' + c.id_curso;
              dayData.products.set(cursoName, (dayData.products.get(cursoName) || 0) + 1);
            });

            // Incluir cancelamentos no trendMap
            canceladosData.forEach(c => {
              const dateStr = formatDateBRL(c.timestamp || c.created_at);
              if (!trendMap.has(dateStr)) {
                trendMap.set(dateStr, { value: 0, salesCount: 0, leads: 0, cost: 0, cancelsCount: 0, declinesCount: 0, products: new Map() });
              }
              trendMap.get(dateStr)!.cancelsCount += 1;
            });

            // Incluir recusados no trendMap
            recusadosData.forEach(c => {
              const dateStr = formatDateBRL(c.timestamp || c.created_at);
              if (!trendMap.has(dateStr)) {
                trendMap.set(dateStr, { value: 0, salesCount: 0, leads: 0, cost: 0, cancelsCount: 0, declinesCount: 0, products: new Map() });
              }
              trendMap.get(dateStr)!.declinesCount += 1;
            });

            // Mesclar com cadastros (leads)
            filteredCadastros.forEach(lead => {
              const dateStr = formatDateBRL(lead.data_cadastro);
              if (!trendMap.has(dateStr)) {
                trendMap.set(dateStr, { value: 0, salesCount: 0, leads: 0, cost: 0, cancelsCount: 0, declinesCount: 0, products: new Map() });
              }
              trendMap.get(dateStr)!.leads += 1;
            });

            const trendData = Array.from(trendMap.entries())
              .map(([date, data]) => ({ 
                date, 
                value: data.value,
                salesCount: data.salesCount,
                leads: data.leads,
                cost: data.cost,
                cancelsCount: data.cancelsCount,
                declinesCount: data.declinesCount,
                products: Array.from(data.products.entries()).map(([name, qty]) => ({ name, qty }))
              }))
              .sort((a, b) => {
                const [da, ma, aa] = a.date.split('/');
                const [db, mb, ab] = b.date.split('/');
                return new Date(`${aa}-${ma}-${da}`).getTime() - new Date(`${ab}-${mb}-${db}`).getTime();
              });

            // --- MONTHLY TREND DATA (Last 12 Months) ---
            const monthlyTrendMap = new Map<string, { value: number, salesCount: number, leads: number, cost: number }>();
            const nowBRL = new Date();
            
            // Generate stable keys YYYY-MM and labels MMM/YY
            const monthsToProcess: { key: string, label: string }[] = [];
            for (let i = 11; i >= 0; i--) {
              const d = new Date(nowBRL.getFullYear(), nowBRL.getMonth() - i, 1);
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
              monthlyTrendMap.set(key, { value: 0, salesCount: 0, leads: 0, cost: 0 });
              monthsToProcess.push({ key, label });
            }

            metaCosts.forEach(c => {
               const d = c.date;
               const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
               if (monthlyTrendMap.has(key)) {
                  monthlyTrendMap.get(key)!.cost += c.cost;
               }
            });

            checkouts.forEach(c => {
               if ((c.status || '').toLowerCase().trim() !== 'pago') return;
               const d = getBRLDate(c.timestamp || c.created_at);
               const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
               if (monthlyTrendMap.has(key)) {
                  const data = monthlyTrendMap.get(key)!;
                  data.value += Number(c.valor) || 0;
                  data.salesCount += 1;
               }
            });

            cadastros.forEach(l => {
                const d = getBRLDate(l.data_cadastro);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyTrendMap.has(key)) {
                   monthlyTrendMap.get(key)!.leads += 1;
                }
            });

            const monthlyTrendData = monthsToProcess.map(m => ({
                date: m.label,
                ...monthlyTrendMap.get(m.key)!
            }));

            // Atribuição de "Campanhas" (Winning Ads)
            const campaignMap = new Map();
            filteredData.forEach(c => {
               let camp = c.utm_campaign || c.utm_source || '';
               
               if (!camp && c.id_usuario) {
                 const lead = cadastros.find((l: any) => String(l.id_usuario) === String(c.id_usuario) || String(l.id) === String(c.id_usuario));
                 if (lead && (lead.utm_campaign_cadastro || lead.utm_source_cadastro)) {
                    camp = lead.utm_campaign_cadastro || lead.utm_source_cadastro || '';
                 }
               }
               if (!camp) camp = 'Desconhecido';

               if (camp.toLowerCase().includes('meta_ads')) {
                   camp = 'Meta Ads';
               } else if (camp === 'ig') {
                   camp = 'Link na bio do Instagram';
               } else if (camp === 'busca-organica') {
                   camp = 'Orgânico/sem rastreio';
               } else if (camp === 'comercial') {
                   camp = 'Comercial';
               } else if (camp === 'brand') {
                   camp = 'Google Ads';
               }
               if (!campaignMap.has(camp)) campaignMap.set(camp, { name: camp, sales: 0, rev: 0, source: '' });
               const stats = campaignMap.get(camp);
               stats.sales += 1;
               stats.rev += Number(c.valor) || 0;
               
               stats.source = getCategory(c.utm_source || '', c.utm_medium || '', c.utm_campaign || '');
            });

            const winners = Array.from(campaignMap.values())
              .sort((a, b) => b.rev - a.rev)
               .slice(0, 10);

             // --- NOVA LÓGICA DE CAMPANHAS (DISTRIBUIÇÃO, CAPTAÇÃO, VENDA) ---
            const distCampaignMap = new Map();
            const capCampaignMap = new Map();
            const venCampaignMap = new Map();

            const getFriendlyName = (name: string) => {
               // Remove as tags entre colchetes [TAG] e espaços extras
               return name.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim();
            };

            const getProjectInfo = (camp: string) => {
               const foundProjects = Object.keys(PROJECT_LABELS).filter(p => camp.includes(p));
               if (foundProjects.length === 0) return { id: 'CUL26', label: PROJECT_LABELS['CUL26'] };
               return {
                  id: foundProjects.join('+'),
                  label: foundProjects.map(p => PROJECT_LABELS[p]).join(' + ')
               };
            };

            // 1. Processar Custos (Banco de Dados Meta)
            metaCosts.filter(c => c.date >= startDate && c.date <= endDate).forEach(c => {
               const camp = c.campaign.toUpperCase();
               
               let objective = 'OUTROS';
               if (camp.includes('DIST') || camp.includes('ACE') || camp.includes('ENG')) objective = 'DIST';
               else if (camp.includes('CAP') || camp.includes('CAPTACAO')) objective = 'CAP';
               else if (camp.includes('VEN') || camp.includes('VENDA')) objective = 'VEN';

               const project = getProjectInfo(camp);
               
               if (objective === 'DIST') {
                  const key = c.campaign; // Individual for dist as requested
                  if (!distCampaignMap.has(key)) distCampaignMap.set(key, { name: getFriendlyName(c.campaign) || c.campaign, cost: 0, revenue: 0, sales: 0, leads: 0 });
                  distCampaignMap.get(key).cost += c.cost;
               } else if (objective === 'CAP') {
                  const key = c.campaign;
                  if (!capCampaignMap.has(key)) capCampaignMap.set(key, { name: getFriendlyName(c.campaign) || c.campaign, cost: 0, revenue: 0, sales: 0, leads: 0 });
                  capCampaignMap.get(key).cost += c.cost;
               } else if (objective === 'VEN') {
                  const key = project.id; // Grouped by product for VEN
                  if (!venCampaignMap.has(key)) venCampaignMap.set(key, { name: project.label, cost: 0, revenue: 0, sales: 0, leads: 0 });
                  venCampaignMap.get(key).cost += c.cost;
               }
            });

            // 2. Processar Vendas (Supabase)
            filteredData.forEach(c => {
               let camp = (c.utm_campaign || '').toUpperCase();
               if (!camp && c.id_usuario) {
                  const lead = cadastros.find((l: any) => String(l.id_usuario) === String(c.id_usuario) || String(l.id) === String(c.id_usuario));
                  if (lead && lead.utm_campaign_cadastro) camp = lead.utm_campaign_cadastro.toUpperCase();
               }
               if (!camp) return;

               let objective = 'OUTROS';
               if (camp.includes('DIST') || camp.includes('ACE') || camp.includes('ENG')) objective = 'DIST';
               else if (camp.includes('CAP') || camp.includes('CAPTACAO')) objective = 'CAP';
               else if (camp.includes('VEN') || camp.includes('VENDA')) objective = 'VEN';

               const utmCampaign = c.utm_campaign || camp;
               const project = getProjectInfo(camp);
               const rev = Number(c.valor) || 0;

               if (objective === 'DIST') {
                  if (!distCampaignMap.has(utmCampaign)) distCampaignMap.set(utmCampaign, { name: getFriendlyName(utmCampaign) || utmCampaign, cost: 0, revenue: 0, sales: 0, leads: 0 });
                  const s = distCampaignMap.get(utmCampaign);
                  s.revenue += rev; s.sales += 1;
               } else if (objective === 'CAP') {
                  if (!capCampaignMap.has(utmCampaign)) capCampaignMap.set(utmCampaign, { name: getFriendlyName(utmCampaign) || utmCampaign, cost: 0, revenue: 0, sales: 0, leads: 0 });
                  const s = capCampaignMap.get(utmCampaign);
                  s.revenue += rev; s.sales += 1;
               } else if (objective === 'VEN') {
                  if (!venCampaignMap.has(project.id)) venCampaignMap.set(project.id, { name: project.label, cost: 0, revenue: 0, sales: 0, leads: 0 });
                  const s = venCampaignMap.get(project.id);
                  s.revenue += rev; s.sales += 1;
               }
            });

            // 3. Processar Leads (Supabase)
            filteredCadastros.forEach(l => {
                const rawCamp = (l.utm_campaign_cadastro || '').toUpperCase();
                if (!rawCamp) return;
                const utmCampaign = l.utm_campaign_cadastro || rawCamp;

                let objective = 'OUTROS';
                if (rawCamp.includes('DIST') || rawCamp.includes('ACE') || rawCamp.includes('ENG')) objective = 'DIST';
                else if (rawCamp.includes('CAP') || rawCamp.includes('CAPTACAO')) objective = 'CAP';
                else if (rawCamp.includes('VEN') || rawCamp.includes('VENDA')) objective = 'VEN';
                
                const project = getProjectInfo(rawCamp);

                if (objective === 'DIST' && distCampaignMap.has(utmCampaign)) distCampaignMap.get(utmCampaign).leads += 1;
                else if (objective === 'CAP') {
                   if (!capCampaignMap.has(utmCampaign)) capCampaignMap.set(utmCampaign, { name: getFriendlyName(utmCampaign) || utmCampaign, cost: 0, revenue: 0, sales: 0, leads: 0 });
                   capCampaignMap.get(utmCampaign).leads += 1;
                }
                else if (objective === 'VEN' && venCampaignMap.has(project.id)) venCampaignMap.get(project.id).leads += 1;
            });

            // 4. Métricas Gerais Meta (tabela trafego_meta_cultura completa)
            const metaAdsMap = new Map();
            metaCosts.filter(c => c.date >= startDate && c.date <= endDate).forEach(c => {
               const key = c.campaign;
               if (!metaAdsMap.has(key)) {
                  metaAdsMap.set(key, {
                      name: getFriendlyName(c.campaign) || c.campaign,
                      cost: 0,
                      impressions: 0,
                      clicks: 0,
                      link_clicks: 0,
                      leads: 0,
                      purchases: 0,
                      reach: 0
                  });
               }
               const s = metaAdsMap.get(key);
               s.cost += c.cost;
               s.impressions += c.impressions;
               s.clicks += c.clicks;
               s.link_clicks += c.link_clicks;
               s.leads += c.leads;
               s.purchases += c.purchases;
               s.reach += c.reach;
            });

            // --- TOP 5 CLIENTES ---
            const customerMap = new Map();
            filteredData.forEach(c => {
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
                    const lead = cadastros.find((l: any) => {
                      const cId = String(c.id);
                      return String(l.id_usuario) === cId || String(l.id) === cId;
                    });
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
              { name: 'Comercial', value: channelMap.comercial.revenue },
              { name: 'Link na Bio', value: channelMap.bio.revenue },
            ]
            .map(c => ({
              name: c.name,
              value: c.value
            }))
            .filter(c => c.value > 0)
            .sort((a, b) => b.value - a.value);

            const leadsSourcePieData = [
              { name: 'Meta Ads', value: channelMap.meta.leads },
              { name: 'Google Ads (Search)', value: channelMap.google.leads },
              { name: 'Orgânico/Busca', value: channelMap.organic.leads },
              { name: 'Manychat', value: channelMap.manychat.leads },
              { name: 'RD Station', value: channelMap.rdstation.leads },
              { name: 'E-mail', value: channelMap.email.leads },
              { name: 'Comercial', value: channelMap.comercial.leads },
              { name: 'Link na Bio', value: channelMap.bio.leads },
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
              monthlyTrendData,
              winners,
              metaAdsCampaigns: Array.from(metaAdsMap.values()).sort((a, b) => b.cost - a.cost),
              distCampaigns: Array.from(distCampaignMap.values()).sort((a, b) => b.cost - a.cost),
              capCampaigns: Array.from(capCampaignMap.values()).sort((a, b) => b.leads - a.leads),
              venCampaigns: Array.from(venCampaignMap.values()).sort((a, b) => b.rev - a.rev),
              topCustomers,
              paymentMethods: paymentMethodsData,
              productPieData,
              channelPieData,
              leadsSourcePieData,
              hasFallback: fallbackCount > 0
            });

            const blendedROAS = periodMetaCost > 0 ? (totalRevenue / periodMetaCost).toFixed(2) + 'x' : '0.00x';
            const blendedCPA = salesCount > 0 ? `R$ ${(periodMetaCost / salesCount).toFixed(2)}` : 'R$ 0,00';

            let totalConvMs = 0;
            let convCount = 0;
            
            filteredData.forEach(c => {
               if (c.id_usuario) {
                   const lead = cadastros.find((l: any) => {
                     const cId = String(c.id_usuario);
                     return String(l.id_usuario) === cId || String(l.id) === cId;
                   });
                  if (lead && lead.data_cadastro && (c.timestamp || c.created_at)) {
                     const cDate = parseSupabaseDate(c.timestamp || c.created_at);
                     const lDate = parseSupabaseDate(lead.data_cadastro);
                     const diff = cDate.getTime() - lDate.getTime();
                     if (diff > 0) { // Only count valid positive diffs
                       totalConvMs += diff;
                       convCount++;
                     }
                  }
               }
            });

            let avgConvTime = 'N/A';
            if (convCount > 0) {
               const avgMs = totalConvMs / convCount;
               const diffHrs = Math.floor(avgMs / (1000 * 60 * 60));
               if (diffHrs < 24) {
                 if (diffHrs === 0) {
                   const mins = Math.floor(avgMs / (1000 * 60));
                   avgConvTime = `${mins}min`;
                 } else {
                   avgConvTime = `${diffHrs}h`;
                 }
               } else {
                 const days = Math.floor(diffHrs / 24);
                 avgConvTime = `${days} dia${days !== 1 ? 's' : ''}`;
               }
            }

            const taxaCancelamento = checkoutsNoPeriodo.length > 0 ? ((canceladosData.length / checkoutsNoPeriodo.length) * 100).toFixed(1) + '%' : '0%';
            const recusadosCount = recusadosData.length.toString();

            const todayStr = formatDateBRL(new Date());
            const checkoutsToday = checkouts.filter((c: any) => {
              const dateVal = c.timestamp || c.created_at;
              if (!dateVal || (c.status || '').toLowerCase().trim() !== 'pago') return false;
              return formatDateBRL(dateVal) === todayStr;
            });
            const cadastrosToday = (cadastros || []).filter((c: any) => {
              const dateVal = c.data_cadastro;
              if (!dateVal) return false;
              return formatDateBRL(dateVal) === todayStr;
            });

            const vendasHojeCount = checkoutsToday.length.toString();
            const cadastrosHojeCount = cadastrosToday.length.toString();

            setKpis([
              { title: 'Receita Total', value: `R$ ${totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, trend: 'Faturamento no Período', isUp: true, icon: DollarSign },
              { title: 'Investimento Total', value: `R$ ${periodMetaCost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, trend: 'Valor Gasto no Período', isUp: true, icon: CreditCard },
              { title: 'ROAS Geral', value: blendedROAS, trend: 'Retorno do investimento', isUp: true, icon: Activity },
              { title: 'CPA Geral', value: blendedCPA, trend: 'Custo por Venda', isUp: true, icon: Target },
              { title: 'Vendas hoje', value: vendasHojeCount, trend: 'Checkouts hoje', isUp: true, icon: ShoppingCart, isToday: true },
              { title: 'Total de cadastros', value: leadsCount.toString(), trend: 'Novos Cadastros', isUp: true, icon: Users },
              { title: 'Vendas Totais', value: salesCount.toString(), trend: 'Checkouts realizados', isUp: true, icon: ShoppingCart },
              { title: 'Taxa de Cancelamento', value: taxaCancelamento, trend: 'Pedidos Cancelados', isUp: false, icon: ArrowDownRight },
              { title: 'Cartão Recusado', value: recusadosCount, trend: 'Pagamentos Negados', isUp: false, icon: ArrowDownRight },
              { title: 'Cadastros hoje', value: cadastrosHojeCount, trend: 'Contatos hoje', isUp: true, icon: Users, isToday: true },
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

  const statusPieData = [
    { name: 'Pago', value: checkoutsAllStatus.filter(c => (c.status || '').toLowerCase().trim() === 'pago').length, color: '#DCA61F' },
    { name: 'Aguardando', value: checkoutsAllStatus.filter(c => (c.status || '').toLowerCase().trim().includes('aguardando')).length, color: '#f59e0b' },
    { name: 'Cancelado', value: checkoutsCancelados.length, color: '#ef4444' },
    { name: 'Recusado/Negado', value: checkoutsRecusados.length, color: '#f97316' }
  ].filter(d => d.value > 0);

  const getTodayStats = () => {
    const now = new Date();
    const todayStr = formatDateBRL(now);
    
    // Checkouts Today
    const checkoutsToday = supabaseCheckouts.filter(c => {
      const dateVal = c.timestamp || c.created_at;
      if (!dateVal || (c.status || '').toLowerCase().trim() !== 'pago') return false;
      return formatDateBRL(dateVal) === todayStr;
    });

    const productsCount = new Map<string, number>();
    checkoutsToday.forEach(c => {
      const curso = supabaseCursos.find(cur => cur.id_curso === c.id_curso);
      const name = curso ? curso.nome : 'Produto #' + c.id_curso;
      productsCount.set(name, (productsCount.get(name) || 0) + 1);
    });

    const todayPieData = Array.from(productsCount.entries())
      .map(([name, qty]) => ({ name, value: qty }))
      .sort((a, b) => b.value - a.value);

    // Cadastros Today
    const cadastrosToday = supabaseCadastros.filter(c => {
      const dateVal = c.data_cadastro;
      if (!dateVal) return false;
      return formatDateBRL(dateVal) === todayStr;
    });

    return { 
      todayPieData,
      vendasHojeTotal: checkoutsToday.length,
      cadastrosHojeTotal: cadastrosToday.length
    };
  };

  const { todayPieData, vendasHojeTotal, cadastrosHojeTotal } = getTodayStats();

  const renderCheckoutCard = (checkoutsToRender: any[], title: string, limit: number, iconComp: React.ReactNode, type: 'sales' | 'cancels' | 'declines') => {
    return (
      <Card className="p-0 overflow-hidden border-primary/20">
         <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between bg-white/5 gap-2">
         <h4 className="text-[0.75rem] font-serif font-normal text-primary/80 uppercase tracking-[0.25em] flex items-center gap-2 shrink-0">
               {iconComp} {title}
            </h4>
         </div>
          <div className="max-h-[500px] overflow-y-auto">
            <div className="divide-y divide-white/5">
              {checkoutsToRender.slice(0, limit).map((checkout, i) => {
                 const lead = supabaseCadastros.find(l => {
                   const cId = String(checkout.id_usuario);
                   return String(l.id_usuario) === cId || String(l.id) === cId;
                 });
                const curso = supabaseCursos.find(c => c.id_curso === checkout.id_curso);
                const checkoutId = checkout.id || checkout.timestamp || i.toString() + type;
                const isExpanded = expandedCheckoutId === checkoutId;
                
                const purchaseDate = parseSupabaseDate(checkout.timestamp || checkout.created_at);
                const regDate = lead ? getBRLDate(lead.data_cadastro) : null;
                const timeToConversion = lead ? formatTimeDiff(lead.data_cadastro, checkout.timestamp || checkout.created_at) : 'N/A';
                
                const origin = checkout.utm_source || lead?.utm_source_cadastro || 'Direto / S. Rastreio';
                const paymentMethod = checkout.metodo_pagamento || checkout.payment_method || checkout.forma_pagamento || 'Indefinido';

                let IconMain = DollarSign;
                if (type === 'cancels') IconMain = Target;
                if (type === 'declines') IconMain = AlertCircle;
                let bgIconClass = 'bg-primary/10 text-primary';
                if (type === 'cancels') bgIconClass = 'bg-red-500/10 text-red-500';
                if (type === 'declines') bgIconClass = 'bg-orange-500/10 text-orange-500';

                return (
                  <div key={i} className="flex flex-col">
                     <div 
                       onClick={() => setExpandedCheckoutId(isExpanded ? null : checkoutId)}
                       className={`p-4 flex items-center justify-between hover:bg-white/[0.04] cursor-pointer transition-colors ${isExpanded ? 'bg-white/[0.03]' : ''}`}
                     >
                       <div className="flex items-center gap-3 overflow-hidden">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isExpanded && type === 'sales' ? 'bg-primary text-[#0D0D0D]' : bgIconClass}`}>
                             <IconMain className="w-4 h-4" />
                         </div>
                         <div className="overflow-hidden">
                             <p className="text-[11px] md:text-xs font-medium text-text-primary truncate">{lead?.nome || 'Usuário #' + checkout.id_usuario}</p>
                             <p className="text-[9px] md:text-[10px] text-text-secondary truncate">{curso?.nome || 'Curso #' + checkout.id_curso}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-2 md:gap-4 shrink-0">
                         <div className="text-right hidden md:block">
                            <p className="text-[10px] text-text-secondary">
                              {(() => {
                                const d = getBRLDate(checkout.timestamp || checkout.created_at);
                                return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
                              })()}
                            </p>
                            <p className="text-[9px] text-[#525252] uppercase font-bold">{normalizePaymentMethod(paymentMethod)} / {checkout.status}</p>
                         </div>
                         <div className="text-right">
                            <p className={`text-sm font-bold ${type === 'cancels' ? 'text-red-500' : type === 'declines' ? 'text-orange-500' : 'text-primary'}`}>R$ {Number(checkout.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                            <ChevronDown className={`w-3 h-3 text-[#525252] ml-auto transition-transform ${isExpanded ? 'rotate-180 text-[inherit]' : ''}`} />
                         </div>
                       </div>
                     </div>

                     {isExpanded && (
                       <div className="px-6 pb-10 pt-6 bg-white/[0.03] border-b border-primary/20 animate-in fade-in slide-in-from-top-4 duration-300">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-16">
                           
                           {/* Seção: Identidade & Contato */}
                           <div className="space-y-6">
                             <div className="flex items-center gap-2 mb-4">
                               <div className="w-1 h-3 bg-primary rounded-full" />
                               <p className="text-[10px] text-text-secondary uppercase font-bold tracking-[0.2em]">Identidade e Contato</p>
                             </div>
                             <div className="space-y-4 pl-3">
                               <div className="flex flex-col gap-1">
                                 <span className="text-[9px] text-text-secondary uppercase font-medium">E-mail de Cadastro</span>
                                 <span className="text-sm text-text-primary font-medium select-all break-all">{lead?.email || 'Não informado'}</span>
                               </div>
                               <div className="flex flex-col gap-1">
                                 <span className="text-[9px] text-text-secondary uppercase font-medium">WhatsApp / Telefone</span>
                                 <span className="text-sm text-text-primary font-mono">{lead?.telefone || 'Não informado'}</span>
                               </div>
                             </div>
                           </div>

                           {/* Seção: Ciclo de Venda */}
                           <div className="space-y-6">
                             <div className="flex items-center gap-2 mb-4">
                               <div className="w-1 h-3 bg-primary rounded-full" />
                               <p className="text-[10px] text-text-secondary uppercase font-bold tracking-[0.2em]">Ciclo de {type === 'sales' ? 'Venda' : 'Processamento'}</p>
                             </div>
                             <div className="space-y-4 pl-3">
                               <div className="flex flex-col gap-1">
                                 <span className="text-[9px] text-text-secondary uppercase font-medium text-primary">Data de Primeiro Contato</span>
                                 <span className="text-sm text-text-primary">{regDate ? `${String(regDate.getUTCDate()).padStart(2, '0')}/${String(regDate.getUTCMonth() + 1).padStart(2, '0')}/${regDate.getUTCFullYear()} ${String(regDate.getUTCHours()).padStart(2, '0')}:${String(regDate.getUTCMinutes()).padStart(2, '0')}` : '---'}</span>
                               </div>
                               <div className="flex flex-col gap-1">
                                 <span className="text-[9px] text-text-secondary uppercase font-medium text-primary">Janela de Decisão</span>
                                 <span className={`text-sm font-bold ${timeToConversion === 'Instantâneo' ? 'text-primary' : 'text-primary'}`}>
                                   {timeToConversion === 'Instantâneo' ? 'Compra Imediata' : `${timeToConversion} pós-cadastro`}
                                 </span>
                               </div>
                             </div>
                           </div>

                           {/* Seção: Atribuição Detalhada */}
                           <div className="space-y-6 lg:col-span-1 md:col-span-2">
                             <div className="flex items-center gap-2 mb-4">
                               <div className="w-1 h-3 bg-primary rounded-full" />
                               <p className="text-[10px] text-text-secondary uppercase font-bold tracking-[0.2em]">Atribuição do Negócio</p>
                             </div>
                             <div className="space-y-5 pl-3">
                               <div>
                                 <span className="text-[9px] text-text-secondary uppercase font-medium block mb-2">Canal de Origem</span>
                                 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-primary/10 border border-primary/20">
                                   <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                   <span className="text-xs text-primary font-bold">
                                     {getFriendlyChannel(checkout.utm_source || lead?.utm_source_cadastro, checkout.utm_medium || lead?.utm_medium_cadastro, checkout.utm_campaign || lead?.utm_campaign_cadastro, checkout.utm_content || lead?.utm_content_cadastro)}
                                     {checkout.utm_crossed_from_cadastro && (
                                       <span className="block text-[8px] text-primary/80 uppercase font-bold tracking-wider mt-1.5 pt-1.5 border-t border-primary/20 animate-pulse select-none">
                                         ✦ Atribuído via Cadastro (Lead)
                                       </span>
                                     )}
                                   </span>
                                 </div>
                               </div>

                               <div className="pt-2 border-t border-white/5 space-y-2">
                                 <div className="flex items-center justify-between text-[10px]">
                                   <span className="text-text-secondary">UTM Source:</span>
                                   <span className="text-text-secondary font-mono">{checkout.utm_source || lead?.utm_source_cadastro || '(vazio)'}</span>
                                 </div>
                                 <div className="flex items-center justify-between text-[10px]">
                                   <span className="text-text-secondary">UTM Campaign:</span>
                                   <span className="text-text-secondary font-mono truncate max-w-[150px]" title={checkout.utm_campaign || lead?.utm_campaign_cadastro}>
                                     {checkout.utm_campaign || lead?.utm_campaign_cadastro || '(vazio)'}
                                   </span>
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
    );
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <CulturaSplashScreen onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-bg-page text-text-main font-sans selection:bg-primary selection:text-text-primary pb-12">
      {/* Decorative Top Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      {/* Top Navigation / Header */}
      <header className="border-b border-border bg-bg-page/80 backdrop-blur-md z-[60] pt-6 md:pt-10 pb-6 relative">
        <div className="max-w-[95rem] mx-auto px-4 md:px-6 flex flex-col items-center relative">
          
          <div className="z-0 flex flex-col items-center mb-4 md:mb-6">
             <img src="https://jndvesrtqewjqvarfaox.supabase.co/storage/v1/object/public/Logos/625949743_18077241884595017_7660496256666720708_n.jpg" alt="Logo Central" className="w-16 h-16 md:w-28 md:h-28 rounded-full border border-border object-cover mb-3 md:mb-4 shadow-2xl" />
             <span className="text-xl md:text-3xl font-serif font-normal italic text-text-primary tracking-[0.08em] text-center">Dashboard Cultura Jurídica</span>
          </div>
          
          <div className="flex items-center gap-2 z-50 w-full justify-center md:justify-end mt-2 md:mt-0 md:absolute md:top-1/2 md:-translate-y-1/2 md:right-6">
            <div className="relative w-full md:w-auto flex justify-center">
              <button 
                  onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                  className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto px-4 py-2 rounded-[4px] border border-border bg-bg-card hover:brightness-110 transition-colors text-sm font-medium focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-text-secondary" />
                  <span>{dateRangeLabels[dateRange]}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-text-secondary" />
              </button>
              
              {isDateDropdownOpen && (
                <div className="absolute top-12 right-0 w-64 bg-bg-card border border-border rounded-[4px] shadow-2xl z-[100] p-2 text-sm">
                   {Object.entries(dateRangeLabels).map(([key, label]) => (
                     <button
                        key={key}
                        onClick={() => { 
                          setDateRange(key); 
                          if(key !== 'custom') setIsDateDropdownOpen(false); 
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-[4px] hover:bg-bg-sidebar transition-colors focus:outline-none ${dateRange === key ? 'bg-[#1E1E1E] font-medium text-text-primary' : 'text-text-label'}`}
                     >
                       {label}
                     </button>
                   ))}

                   {dateRange === 'custom' && (
                     <div className="mt-2 pt-3 border-t border-border flex flex-col gap-3 px-2 pb-1">
                       <div className="flex flex-col gap-1">
                         <label className="text-[0.875rem] font-medium text-text-label">Data de Início</label>
                         <input 
                           type="date" 
                           value={customStart} 
                           onChange={e => setCustomStart(e.target.value)} 
                           className="bg-bg-input border border-border text-text-primary px-3 py-2 rounded-[4px] text-xs focus:outline-none focus:border-primary" 
                         />
                       </div>
                       <div className="flex flex-col gap-1">
                         <label className="text-[0.875rem] font-medium text-text-label">Data de Fim</label>
                         <input 
                           type="date" 
                           value={customEnd} 
                           onChange={e => setCustomEnd(e.target.value)} 
                           className="bg-bg-input border border-border text-text-primary px-3 py-2 rounded-[4px] text-xs focus:outline-none focus:border-primary" 
                         />
                       </div>
                       <button 
                         onClick={() => {
                           setAppliedCustomDate({ start: customStart, end: customEnd });
                           setIsDateDropdownOpen(false);
                         }}
                         className="mt-1 bg-primary text-bg-page py-2 rounded-[4px] text-[0.8125rem] font-semibold hover:bg-primary-dark transition-colors"
                       >
                         Aplicar Filtro
                       </button>
                     </div>
                   )}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </header>

      <main className="max-w-[95rem] mx-auto px-4 md:px-6 mt-6 md:mt-8 space-y-6">
        


        

        
        {/* SETUP BANNER - Totalmente removido para Cultura */}
        {dataStatus === 'logged_out' && selectedCompanyId !== 'cultura' && (
          <div className="bg-bg-card border border-border text-text-primary rounded-[4px] p-8 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-medium mb-2">Conectar Google Analytics</h3>
              <p className="text-sm text-text-label max-w-2xl mb-4">
                Para visualizar seus dados reais da propriedade {selectedCompany.name} ({propertyId}), conecte sua conta Google. Esta autorização é segura e usada apenas para leitura de dados de relatórios. Ela será salva no seu navegador para que você não precise aprovar toda vez.
              </p>
            </div>
            <button 
                onClick={handleConnect}
                className="flex items-center gap-2 px-6 py-3 rounded-[4px] bg-primary text-[#0D0D0D] font-semibold tracking-[0.02em] hover:bg-[#E6BE5A] transition-colors font-medium whitespace-nowrap"
            >
              Conectar Conta Google
            </button>
          </div>
        )}
        
        {dataStatus === 'error' && (
          <div className="bg-primary/10 border border-primary/20 text-primary rounded-[4px] p-6">
            <h3 className="text-[1.5rem] font-serif font-normal text-text-primary mb-2 text-primary">Erro na Consulta da API</h3>
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {dataStatus === 'loading' && (
          <div className="space-y-8 animate-pulse">
            <div className="flex items-center gap-2 mb-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-text-label">Sincronizando dados com Supabase...</span>
            </div>
            
            {/* Chart Skeleton */}
            <div className="h-48 sm:h-80 bg-white/5 rounded-[4px] border border-white/5 w-full" />
            
            {/* KPI Grid Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 md:gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-32 bg-white/5 rounded-[4px] border border-white/5" />
              ))}
            </div>

            {/* Bottom Sections Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-[350px] bg-white/5 rounded-[4px] border border-white/5" />
              <div className="h-[350px] bg-white/5 rounded-[4px] border border-white/5" />
              <div className="h-[350px] bg-white/5 rounded-[4px] border border-white/5" />
            </div>
          </div>
        )}



        {dataStatus === 'success' && channelData.trendData && channelData.trendData.length > 0 && (
          <Card className="mb-8 p-6 bg-gradient-to-br from-[#111113] to-[#0A0A0A]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[1.5rem] font-serif font-normal text-text-primary italic">Performance diária</h3>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                   <p className="text-[0.75rem] text-text-muted uppercase font-bold">Máximo Diário</p>
                   <p className="text-lg font-mono text-primary">R$ {Math.max(...channelData.trendData.map((d: any) => d.value)).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
            <div className="h-48 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={channelData.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DCA61F" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#DCA61F" stopOpacity={0}/>
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
                    yAxisId="left"
                    stroke="#52525B" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#52525B" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="value"
                    stroke="#DCA61F"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    name="Receita"
                    dot={{ r: 2, strokeWidth: 1 }}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="cost"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fill="transparent"
                    name="Investimento"
                    dot={{ r: 2, strokeWidth: 1 }}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="leads"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="transparent"
                    name="Cadastros"
                    dot={{ r: 2, strokeWidth: 1 }}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="salesCount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="transparent"
                    name="Vendas (Qtd)"
                    dot={{ r: 2, strokeWidth: 1 }}
                    activeDot={{ r: 4 }}
                  />
                  <RechartsTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-bg-card border border-border p-4 rounded-[4px] shadow-2xl text-[11px] min-w-[200px] backdrop-blur-sm bg-black/80">
                            <p className="text-text-label mb-3 font-medium border-b border-white/5 pb-2">{label}</p>
                            <div className="space-y-2 mb-3">
                              <div className="flex justify-between items-center">
                                <span className="text-text-label">Faturamento:</span>
                                <span className="text-primary font-bold ml-4">R$ {Number(data.value || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-text-label text-red-400">Investimento Meta:</span>
                                <span className="text-red-400 font-bold ml-4">R$ {Number(data.cost || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-text-label text-emerald-400">ROAS:</span>
                                <span className="text-emerald-400 font-bold ml-4">{(data.cost > 0 ? (data.value / data.cost).toFixed(2) : '0.00') + 'x'}</span>
                              </div>
                              <div className="flex justify-between items-center pt-1 border-t border-white/5">
                                <span className="text-text-label">Vendas (Pagas):</span>
                                <span className="text-primary font-bold ml-4">{data.salesCount}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-red-400">Cancelados:</span>
                                <span className="text-red-400 font-bold ml-4">{data.cancelsCount || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-orange-400">Recusados:</span>
                                <span className="text-orange-400 font-bold ml-4">{data.declinesCount || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-text-label">Novos Cadastros:</span>
                                <span className="text-primary font-bold ml-4">{data.leads}</span>
                              </div>
                            </div>
                            
                            {data.products && data.products.length > 0 && (
                              <div className="pt-2 border-t border-white/5 space-y-1.5">
                                <p className="text-text-muted uppercase text-[9px] font-bold tracking-widest mb-1">Vendas por Produto:</p>
                                {data.products.map((p: any, idx: number) => (
                                  <div key={idx} className="flex justify-between gap-4 items-center">
                                    <span className="text-text-secondary truncate max-w-[140px] italic">{p.name}</span>
                                    <span className="text-text-primary font-mono bg-white/5 px-1.5 rounded text-[10px]">{p.qty}x</span>
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
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* KPIs Grid */}
        {dataStatus === 'success' && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 md:gap-4">
            {kpis.map((kpi, idx) => {
              return (
                <Card 
                  key={idx} 
                  className={`relative overflow-hidden group transition-all duration-300 p-4 md:p-6 flex flex-col items-center text-center hover:border-primary/50`}
                >
                  <div className="p-1.5 md:p-2.5 rounded-full transition-colors bg-primary/10 text-primary mb-3 md:mb-4">
                    <kpi.icon className="w-4 h-4 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[0.65rem] font-bold uppercase tracking-[0.1em] mb-1.5 md:mb-2 text-text-muted">
                      {kpi.title}
                    </p>
                    <h3 className="text-[1.25rem] md:text-[1.75rem] font-bold tabular-nums tracking-tight whitespace-nowrap text-text-primary">
                      {kpi.value}
                    </h3>
                    <p className="text-[10px] md:text-[0.7rem] mt-1 md:mt-2 text-[#71717A] font-medium">
                      {kpi.trend}
                    </p>
                  </div>
                  <div className="absolute -right-6 -bottom-6 transition-opacity text-primary opacity-[0.02] group-hover:opacity-[0.04]">
                    <kpi.icon className="w-24 h-24" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {dataStatus === 'success' && (
          <MonthlyClosingSection 
            checkouts={supabaseCheckoutsFull} 
            costs={metaCostsFull} 
            cursos={supabaseCursos} 
          />
        )}

        {dataStatus === 'success' && channelData.monthlyTrendData && channelData.monthlyTrendData.length > 0 && (
          <Card className="p-6 bg-gradient-to-br from-[#111113] to-[#0A0A0A]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[1.5rem] font-serif font-normal text-text-primary italic">Performance Mensal</h3>
                <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Últimos 12 meses</p>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                   <p className="text-[0.75rem] text-text-muted uppercase font-bold">Recorde Mensal</p>
                   <p className="text-lg font-mono text-primary">R$ {Math.max(...channelData.monthlyTrendData.map((d: any) => d.value)).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
            <div className="h-48 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={channelData.monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevMonthly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DCA61F" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#DCA61F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222225" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#52525B" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#52525B" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `R$ ${Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(val)}`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#52525B" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="value"
                    stroke="#DCA61F"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevMonthly)"
                    name="Receita"
                    dot={{ r: 3, strokeWidth: 1 }}
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="cost"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fill="transparent"
                    name="Investimento"
                    dot={{ r: 3, strokeWidth: 1 }}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="leads"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="transparent"
                    name="Cadastros"
                    dot={{ r: 3, strokeWidth: 1 }}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="salesCount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="transparent"
                    name="Vendas"
                    dot={{ r: 3, strokeWidth: 1 }}
                  />
                  <RechartsTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-bg-card border border-border p-4 rounded-[4px] shadow-2xl text-[11px] min-w-[200px] backdrop-blur-sm bg-black/80">
                            <p className="text-text-label mb-3 font-medium border-b border-white/5 pb-2">{label}</p>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-text-label">Faturamento:</span>
                                <span className="text-primary font-bold ml-4">R$ {Number(data.value || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-text-label text-red-400">Investimento Meta:</span>
                                <span className="text-red-400 font-bold ml-4">R$ {Number(data.cost || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-emerald-400">ROAS:</span>
                                <span className="text-emerald-400 font-bold ml-4">{(data.cost > 0 ? (data.value / data.cost).toFixed(2) : '0.00') + 'x'}</span>
                              </div>
                              <div className="flex justify-between items-center pt-1 border-t border-white/5">
                                <span className="text-text-label text-emerald-500">Vendas:</span>
                                <span className="text-emerald-500 font-bold ml-4">{data.salesCount}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-text-label text-indigo-400">Cadastros:</span>
                                <span className="text-indigo-400 font-bold ml-4">{data.leads}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Insights de Distribuição */}
        {dataStatus === 'success' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Status de pagamentos
                </h4>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                      label={PieChartLabel}
                    >
                      {statusPieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-bg-card border border-border p-3 rounded-[4px] shadow-xl outline-none">
                              <div className="flex items-center justify-between gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                                  <span className="text-text-label">Status: {data.name}</span>
                                </div>
                                <span className="font-mono text-text-primary text-[24px] font-bold">{data.value}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

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
                      innerRadius={55}
                      outerRadius={90}
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
                  <Target className="w-4 h-4" /> Distribuição dos canais de aquisição
                </h4>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData.channelPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
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
            <Card className="max-w-lg w-full p-6 md:p-8 relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedCustomerDetail(null)} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">✕</button>
                <h3 className="text-[0.75rem] md:text-[0.8125rem] font-semibold text-primary uppercase tracking-[0.15em] mb-2 flex items-center gap-2 border-b border-border/30 pb-2">
                     <Award className="w-3 h-3 md:w-4 md:h-4" /> Perfil Financeiro
                </h3>
                <p className="text-[1.5rem] md:text-[2.25rem] font-bold tabular-nums tracking-tight mb-1">{selectedCustomerDetail.name}</p>
                <p className="text-text-secondary text-[11px] md:text-sm mb-4 md:mb-6">ID: {selectedCustomerDetail.id}</p>
                
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="bg-white/5 p-3 md:p-4 rounded-[4px]">
                        <p className="text-[9px] md:text-[10px] text-text-secondary uppercase">Receita Total</p>
                        <p className="text-base md:text-lg font-mono text-primary">R$ {selectedCustomerDetail.rev.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="bg-white/5 p-3 md:p-4 rounded-[4px]">
                        <p className="text-[9px] md:text-[10px] text-text-secondary uppercase">Vendas</p>
                        <p className="text-base md:text-lg font-mono text-text-primary">{selectedCustomerDetail.sales}x</p>
                    </div>
                </div>
                
                <div className="mt-6 overflow-hidden">
                    <p className="text-[9px] md:text-[10px] text-text-secondary uppercase mb-2">Histórico de Compras</p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-hide">
                        {selectedCustomerDetail.purchases.map((p: any, idx: number) => (
                            <div key={idx} className="flex justify-between p-2 rounded bg-white/5 text-[10px] md:text-xs">
                                <span className="text-text-primary truncate max-w-[140px] md:max-w-[200px]">{p.cursoName}</span>
                                <span className="font-mono text-primary shrink-0">R$ {Number(p.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
          </div>
        )}

        {/* Combined Section for Top Clientes and Payment Methods */}
        {dataStatus === 'success' && (
          <div className={`grid grid-cols-1 ${
            selectedCompanyId === 'cultura' && channelData.leadsSourcePieData && channelData.leadsSourcePieData.length > 0
              ? 'lg:grid-cols-3'
              : 'lg:grid-cols-2'
          } gap-6 mt-8`}>
            {/* Top 5 Clientes */}
            {channelData.topCustomers && channelData.topCustomers.length > 0 && (
              <Card className="h-full">
                <h3 className="text-sm font-medium text-[#A1A1AA] mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" /> Melhores clientes no período
                </h3>
                <div className="space-y-3">
                  {channelData.topCustomers.map((c: any, i: number) => (
                      <div key={i} onClick={() => setSelectedCustomerDetail(c)} className="flex items-center justify-between p-3 rounded-[4px] bg-black/40 hover:bg-[#1E1E1E] cursor-pointer transition-colors border border-border">
                          <div className="max-w-[70%]">
                            <p className="text-xs text-text-primary truncate font-medium">{c.name}</p>
                            <p className="text-[10px] text-text-secondary">{c.sales} vendas</p>
                          </div>
                          <p className="text-xs text-primary font-mono font-bold">R$ {c.rev.toLocaleString('pt-BR')}</p>
                      </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Fontes de cadastro */}
            {selectedCompanyId === 'cultura' && channelData.leadsSourcePieData && channelData.leadsSourcePieData.length > 0 && (
              <Card className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" /> Fontes de cadastros
                      </h4>
                      <p className="text-[11px] text-text-secondary mt-1">Distribuição de Cadastros</p>
                    </div>
                  </div>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelData.leadsSourcePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {channelData.leadsSourcePieData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip isCurrency={false} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-3 mt-6">
                  {channelData.leadsSourcePieData.map((lead: any, i: number) => {
                    const totalLeads = channelData.leadsSourcePieData.reduce((acc: number, curr: any) => acc + curr.value, 0);
                    const pct = totalLeads > 0 ? ((lead.value / totalLeads) * 100).toFixed(1) : '0';
                    return (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-[11px] text-text-secondary group-hover:text-text-primary transition-colors">{lead.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-mono font-bold text-text-primary">{lead.value} cadastros</p>
                          <p className="text-[10px] text-text-secondary">{pct}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* PAYMENT METHODS CHART */}
            {selectedCompanyId === 'cultura' && channelData.paymentMethods && (
              <Card className="p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-primary" /> Métodos de Pagamento
                      </h4>
                      <p className="text-[11px] text-text-secondary mt-1">Distribuição de Volume</p>
                    </div>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={channelData.paymentMethods}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={8}
                            dataKey="value"
                          >
                            {channelData.paymentMethods.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={[
                                '#DCA61F', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'
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
                    <div className="space-y-3">
                      {channelData.paymentMethods.map((pm: any, i: number) => {
                        const colors = ['bg-[#DCA61F]', 'bg-[#6366f1]', 'bg-[#737373]', 'bg-[#525252]', 'bg-[#404040]', 'bg-[#E5E5E5]'];
                        const totalRev = channelData.total.revenue;
                        const pct = ((pm.value / totalRev) * 100).toFixed(1);
                        return (
                          <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full ${colors[i % 6]}`} />
                              <span className="text-[11px] text-text-secondary group-hover:text-text-primary transition-colors">{pm.name}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-mono font-bold text-text-primary">R$ {pm.value.toLocaleString('pt-BR')}</p>
                                <p className="text-[10px] text-text-secondary">{pct}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Charts and Funnel Section */}
        {dataStatus === 'success' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              <Card className="p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
                     <BarChart2 className="w-4 h-4" /> {selectedCompanyId === 'cultura' ? 'Receita por Canal' : 'Receita vs Custo por Canal'}
                  </h4>
                  {channelData.hasFallback && (
                    <div className="group relative flex items-center cursor-help">
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Origem Provável (Primeiro Contato)
                      </span>
                      <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-bg-card border border-border rounded-[4px] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-[11px] leading-relaxed">
                        <p className="text-text-primary font-bold mb-1">Como funciona?</p>
                        <p className="text-text-secondary">Quando uma venda não possui rastreio UTM direto no checkout, buscamos a origem original do usuário no cadastro (First Click). Isso recupera faturamento que antes ficaria "Sem Rastreio".</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart
                       data={[
                         { name: 'Meta Ads', Receita: channelData.meta.revenue, Custo: channelData.meta.cost },
                         { name: 'Google Ads (Search)', Receita: channelData.google.revenue, Custo: channelData.google.cost },
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
                       <Bar dataKey="Receita" fill="#DCA61F" radius={[4, 4, 0, 0]} barSize={40} />
                       {selectedCompanyId !== 'cultura' && <Bar dataKey="Custo" fill="#DCA61F" radius={[4, 4, 0, 0]} barSize={40} />}
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
                    { label: 'Criação de Cadastros', value: channelData.total.leads, color: 'bg-primary/20', icon: Users, pct: (selectedCompanyId !== 'cultura' && channelData.total.sessions > 0) ? (channelData.total.leads / channelData.total.sessions * 100).toFixed(1) : undefined },
                    { label: 'Vendas Realizadas', value: channelData.total.sales, color: 'bg-primary/20', icon: ShoppingCart, pct: channelData.total.leads > 0 ? (channelData.total.sales / channelData.total.leads * 100).toFixed(1) : 0 },
                  ].filter(Boolean).map((step: any, i, arr) => (
                    <div key={i} className="relative">
                      <div className={`p-4 rounded-[4px] border border-white/5 ${step.color} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-text-primary">
                            <step.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-text-label font-medium uppercase tracking-wider">{step.label}</p>
                            <p className="text-xl font-mono">{step.value.toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                        {step.pct !== undefined && (
                          <div className="text-right">
                            <p className="text-[10px] text-text-label mb-1 font-medium">{selectedCompanyId === 'cultura' ? 'Conversão' : 'Tx. Conversão'}</p>
                            <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-md">{step.pct}%</span>
                          </div>
                        )}
                      </div>
                      {i < arr.length - 1 && (
                        <div className="flex justify-center -my-2 relative z-10">
                          <div className="bg-bg-sidebar p-1 rounded-full border border-border">
                             <ChevronDown className="w-3 h-3 text-text-label" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
               </div>
               {selectedCompanyId !== 'cultura' && (
                 <div className="mt-6 pt-6 border-t border-border flex justify-between items-center">
                   <span className="text-[0.875rem] font-medium text-text-label">Tx. de Venda Global</span>
                   <span className="text-sm font-bold text-primary">
                      {channelData.total.sessions > 0 ? (channelData.total.sales / channelData.total.sessions * 100).toFixed(2) : 0}%
                   </span>
                 </div>
               )}
             </Card>
          </div>
        )}


        {/* Winning Ads and Products Matrix */}
        {dataStatus === 'success' && (
          <div className="grid grid-cols-1 gap-6">
             {selectedCompanyId === 'cultura' ? (
                <div className="mt-4 mb-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border/40 pb-3 mb-6">
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-text-primary tracking-tight">Campanhas Ativas</h3>
                      <p className="text-[11px] text-text-secondary mt-1">Status atual das campanhas em veiculação (dados em tempo real não afetados pelo seletor de data).</p>
                    </div>
                  </div>
                  <ActiveCampaignsTree 
                    data={supabaseCampanhasAtivas} 
                    metaCosts={filteredMetaCosts} 
                    checkouts={filteredCheckouts} 
                    cursos={supabaseCursos}
                  />
                </div>
             ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Winning Ads Table */}
                  <Card className="p-0 overflow-hidden">
                    <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-[#111113] to-transparent">
                        <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
                          <Award className="w-4 h-4 text-primary" /> Fontes de Aquisição
                        </h4>
                    </div>
                    <div className="w-full overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left min-w-[600px]">
                          <thead className="bg-bg-card/50 sticky top-0 z-10">
                            <tr>
                              <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold">Campanha / Anúncio</th>
                              <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right">Vendas</th>
                              <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right">Receita</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#222225]/50">
                            {channelData.winners?.length > 0 ? channelData.winners.map((win: any, i: number) => (
                              <tr key={i} className="hover:bg-white/5 transition-colors">
                                  <td className="p-4 flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${win.source === 'meta' ? 'bg-primary' : 'bg-primary'}`} />
                                    <span className="text-xs text-text-primary truncate max-w-[240px]" title={win.name}>{win.name}</span>
                                  </td>
                                  <td className="p-4 text-[0.875rem] font-medium tabular-nums text-text-primary text-center">{win.sales}</td>
                                  <td className="p-4 text-[0.875rem] font-medium tabular-nums text-text-primary text-right text-primary">R$ {win.rev.toLocaleString('pt-BR')}</td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={3} className="p-8 text-center text-[#525252] italic text-xs">
                                  {selectedCompanyId === 'cultura' ? 'Dados insuficientes de UTMs para classificar anúncios.' : 'Nenhum dado de campanha encontrado.'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                    </div>
                  </Card>

                  <Card className="p-0 overflow-hidden">
                    <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-[#111113] to-transparent">
                        <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" /> Performance por Produto
                        </h4>
                        <span className="text-[10px] text-text-label">Ordenado por Receita</span>
                    </div>
                    <div className="w-full overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead className="bg-bg-card/50 sticky top-0 z-10">
                            <tr>
                              <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold">Infoproduto</th>
                              <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right">Vendas</th>
                              <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right">ROAS</th>
                              <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right">Receita</th>
                            </tr>
                          </thead>
                          <tbody className="bg-bg-card/20">
                            {(channelData.totalProducts || [])
                              .map((p: any, i: number) => (
                                <ProductRow key={i} p={p} isSupabase={selectedCompanyId === 'cultura'} />
                              ))}
                          </tbody>
                        </table>
                    </div>
                  </Card>
                </div>
             )}

             {selectedCompanyId === 'cultura' && (
                <Card className="p-0 overflow-hidden">
                   <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-[#111113] to-transparent">
                       <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
                         <ShoppingCart className="w-4 h-4" /> Performance por Produto
                       </h4>
                       <span className="text-[10px] text-text-label">Ordenado por Receita</span>
                   </div>
                   <div className="w-full overflow-x-auto scrollbar-hide">
                       <table className="w-full text-left border-collapse min-w-[600px]">
                         <thead className="bg-bg-card/50 sticky top-0 z-10">
                           <tr>
                             <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold">Infoproduto</th>
                             <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right">Vendas</th>
                             <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right">ROAS</th>
                             <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right">Receita</th>
                           </tr>
                         </thead>
                         <tbody className="bg-bg-card/20">
                           {(channelData.totalProducts || [])
                             .map((p: any, i: number) => (
                                <ProductRow key={i} p={p} isSupabase={selectedCompanyId === 'cultura'} />
                             ))}
                         </tbody>
                       </table>
                   </div>
                </Card>
             )}
          </div>
        )}

        {/* MÉTRICAS META ADS (Tabela trafego_meta_cultura) */}
        {selectedCompanyId === 'cultura' && dataStatus === 'success' && (
           <Card className="p-0 overflow-hidden mb-6">
              <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-[#111113] to-transparent">
                  <h4 className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#DCA61F]" /> Desempenho Meta Ads
                  </h4>
                  <span className="text-[10px] text-text-label uppercase tracking-widest text-primary">Trafego_Meta_Cultura</span>
              </div>
              <div className="w-full overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-[#111113] sticky top-0 z-10 bottom-border">
                      <tr>
                        <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold border-b border-white/5">Campanha</th>
                        <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right border-b border-white/5">Investimento</th>
                        <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right border-b border-white/5">Impressões</th>
                        <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right border-b border-white/5">Cliques</th>
                        <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right border-b border-white/5">CTR</th>
                        <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right border-b border-white/5">CPM</th>
                        <th className="p-4 text-[0.75rem] text-text-muted uppercase font-bold text-right border-b border-white/5">CPC</th>
                        <th className="p-4 text-[0.75rem] text-[#6366f1] uppercase font-bold text-right border-b border-white/5">Leads</th>
                        <th className="p-4 text-[0.75rem] text-[#10b981] uppercase font-bold text-right border-b border-white/5">Vendas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222225]/50 bg-bg-card/20">
                      {(channelData.metaAdsCampaigns || []).map((camp: any, i: number) => {
                         const ctr = camp.impressions > 0 ? (camp.clicks / camp.impressions) * 100 : 0;
                         const cpm = camp.impressions > 0 ? (camp.cost / camp.impressions) * 1000 : 0;
                         const cpc = camp.clicks > 0 ? camp.cost / camp.clicks : 0;
                         
                         return (
                           <tr key={i} className="hover:bg-white/5 transition-colors group">
                               <td className="p-4 text-[0.75rem] font-medium text-text-primary max-w-[280px] break-words whitespace-normal border-r border-[#222225]/30 group-hover:border-transparent">
                                  {camp.name}
                               </td>
                               <td className="p-4 text-[0.75rem] text-right font-mono text-red-400">
                                  R$ {camp.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                               </td>
                               <td className="p-4 text-[0.75rem] text-right text-text-secondary tabular-nums">
                                  {camp.impressions.toLocaleString('pt-BR')}
                               </td>
                               <td className="p-4 text-[0.75rem] text-right text-text-secondary tabular-nums">
                                  {camp.clicks.toLocaleString('pt-BR')}
                               </td>
                               <td className="p-4 text-[0.75rem] text-right text-text-secondary tabular-nums">
                                  {ctr.toFixed(2)}%
                               </td>
                               <td className="p-4 text-[0.75rem] text-right text-text-secondary tabular-nums">
                                  R$ {cpm.toFixed(2)}
                               </td>
                               <td className="p-4 text-[0.75rem] text-right text-text-secondary tabular-nums border-r border-[#222225]/30 group-hover:border-transparent">
                                  R$ {cpc.toFixed(2)}
                               </td>
                               <td className="p-4 text-[0.75rem] text-right font-bold text-[#818cf8] tabular-nums">
                                  {camp.leads.toLocaleString('pt-BR')}
                               </td>
                               <td className="p-4 text-[0.75rem] text-right font-bold text-[#34d399] tabular-nums">
                                  {camp.purchases.toLocaleString('pt-BR')}
                               </td>
                           </tr>
                         );
                      })}
                      
                      {(!channelData.metaAdsCampaigns || channelData.metaAdsCampaigns.length === 0) && (
                         <tr>
                           <td colSpan={9} className="p-8 text-center text-[#525252] italic text-xs">
                             Nenhum dado do Meta encontrado para este período.
                           </td>
                         </tr>
                      )}
                    </tbody>
                  </table>
              </div>
           </Card>
        )}



        {/* LIVE ACTIVITY FEED - Somente para Cultura */}
        {selectedCompanyId === 'cultura' && dataStatus === 'success' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
               {renderCheckoutCard(supabaseCheckouts, "Vendas Recentes", 30, <CreditCard className="w-4 h-4" />, 'sales')}

             <Card className="p-0 overflow-hidden border-primary/20">
                <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between bg-white/5 gap-2">
                <h4 className="text-[0.75rem] font-serif font-normal text-primary/80 uppercase tracking-[0.25em] flex items-center gap-2 shrink-0">
                       <Users className="w-4 h-4" /> Cadastros recentes
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
                            <div className="flex items-center gap-3 overflow-hidden">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isExpanded ? 'bg-primary text-text-primary' : hasPurchased ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                                  <Users className="w-4 h-4" />
                               </div>
                               <div className="overflow-hidden">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <p className="text-[11px] md:text-xs font-medium text-text-primary truncate max-w-[150px]">{lead.nome || lead.email || 'Lead #' + lead.id_usuario}</p>
                                    {hasPurchased && (
                                      <span className="text-[8px] bg-primary/10 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full font-black tracking-widest">
                                        CLIENTE
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[9px] md:text-[10px] text-text-secondary truncate">{origin}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                               <div className="text-right">
                                  <p className="text-[10px] text-text-secondary">
                                    {(() => {
                                      const d = getBRLDate(lead.data_cadastro);
                                      return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
                                    })()}
                                  </p>
                                  <p className="text-[9px] text-[#525252] uppercase tracking-tighter truncate max-w-[60px] md:max-w-none">{lead.cidade || 'S/ Cidade'}</p>
                               </div>
                               <ChevronDown className={`w-3 h-3 text-[#525252] transition-transform ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-6 pb-8 pt-4 bg-white/[0.015] animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-[9px] text-text-secondary uppercase font-bold tracking-widest mb-2">Informações de Contato</p>
                                    <div className="space-y-1.5">
                                      <p className="text-[11px] text-text-primary flex justify-between"><span className="text-[#525252]">E-mail:</span> <span className="font-medium select-all">{lead.email || 'N/A'}</span></p>
                                      <p className="text-[11px] text-text-primary flex justify-between"><span className="text-[#525252]">Tel/Cel:</span> <span className="font-mono">{lead.telefone || 'N/A'}</span></p>
                                      <p className="text-[11px] text-text-primary flex justify-between"><span className="text-[#525252]">Local:</span> <span>{lead.cidade ? `${lead.cidade} - ${lead.estado || ''}` : 'Não identificado'}</span></p>
                                    </div>
                                  </div>

                                  {hasPurchased && purchase && (
                                    <div className="p-3 rounded-[4px] bg-white/5 border border-primary/20">
                                      <p className="text-[9px] text-primary uppercase font-bold tracking-widest mb-2">Conversão Realizada</p>
                                      <p className="text-[10px] text-text-secondary leading-relaxed">
                                        Comprou <span className="text-text-primary font-bold italic">"{supabaseCursos.find(c => c.id_curso === purchase.id_curso)?.nome || 'Produto'}"</span> em {formatDateBRL(purchase.timestamp || purchase.created_at)}.
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <p className="text-[9px] text-text-secondary uppercase font-bold tracking-widest mb-2">Rastreamento (UTMs)</p>
                                    <div className="space-y-2">
                                      <div className="p-2 rounded bg-black/20 border border-white/5 space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                          <span className="text-[#525252]">Source:</span>
                                          <span className="text-text-secondary font-mono truncate max-w-[120px]">{lead.utm_source_cadastro || '(vazio)'}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                          <span className="text-[#525252]">Medium:</span>
                                          <span className="text-text-secondary font-mono truncate max-w-[120px]">{lead.utm_medium_cadastro || '(vazio)'}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                          <span className="text-[#525252]">Campaign:</span>
                                          <span className="text-text-secondary font-mono truncate max-w-[120px]">{lead.utm_campaign_cadastro || '(vazio)'}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 mt-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">Canal: {origin}</span>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
             {renderCheckoutCard(checkoutsCancelados, "Cancelamentos Recentes", 30, <Target className="w-4 h-4 text-red-500" />, 'cancels')}
             {renderCheckoutCard(checkoutsRecusados, "Recusas Recentes", 30, <AlertCircle className="w-4 h-4 text-orange-500" />, 'declines')}
          </div>


          </>
        )}

        {/* Channels Breakdown */}
        {dataStatus === 'success' && (
          <div className="mt-8">
            <h2 className="text-2xl font-light tracking-tight mb-6 border-b border-border pb-2">
              Detalhamento de Canais
            </h2>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {(selectedCompanyId === 'cultura' ? [
                { id: 'meta', name: 'Meta Ads', color: 'bg-primary/10 text-primary border-primary/20' },
                { id: 'google', name: 'Google Ads (Search)', color: 'bg-primary/10 text-primary border-primary/20' },
                { id: 'comercial', name: 'Comercial', color: 'bg-primary/10 text-primary border-primary/20' },
                { id: 'rdstation', name: 'RD Station', color: 'bg-primary/10 text-primary border-primary/20' },
                { id: 'bio', name: 'Bio do Instagram', color: 'bg-primary/10 text-primary border-primary/20' },
                { id: 'manychat', name: 'Manychat', color: 'bg-primary/10 text-primary border-primary/20' },
                { id: 'email', name: 'E-Mail', color: 'bg-primary/10 text-primary border-primary/20' },
                { id: 'organic', name: 'Busca Orgânica / Sem Rastreio', color: 'bg-primary/10 text-primary border-primary/20' }
              ] : [
                { id: 'meta', name: 'Meta Ads', color: 'bg-primary/10 text-primary border-primary/20' },
                { id: 'google', name: 'Google Ads', color: 'bg-primary/10 text-primary border-primary/20' },
                { id: 'organic', name: 'Tráfego Orgânico / Direto', color: 'bg-primary/10 text-primary border-primary/20' }
              ]).map(channel => {
                const data = channelData[channel.id];
                if (!data || (selectedCompanyId === 'cultura' && data.revenue === 0 && data.leads === 0)) return null;
                
                const cr = data.sessions > 0 ? (data.sales) / data.sessions * 100 : 0;
                const roas = data.cost > 0 ? data.revenue / data.cost : 0;
                const cpa = data.sales > 0 ? data.cost / data.sales : 0;
                const avgTicket = data.sales > 0 ? data.revenue / data.sales : 0;
                const roasColor = roas > 3 ? 'text-primary' : roas >= 1.5 ? 'text-primary' : roas > 0 ? 'text-primary' : 'text-text-secondary';

                return (
                  <Card key={channel.id} className="p-0 overflow-hidden border border-border flex flex-col h-full">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-bg-sidebar">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${channel.color}`}>
                          {channel.name}
                        </span>
                      </div>
                    </div>
                    <div className={`grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-[#222225] bg-bg-card border-b border-border`}>
                      <div className="p-3 flex flex-col">
                        <span className="text-[0.7rem] font-medium text-text-label uppercase tracking-wider mb-1">Receita</span>
                        <span className="text-lg font-bold">R$ {data.revenue.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                      </div>
                      
                      {channel.id === 'meta' && data.cost > 0 ? (
                        <div className="p-3 flex flex-col">
                          <span className="text-[0.7rem] font-medium text-text-label uppercase tracking-wider mb-1">Investimento</span>
                          <span className="text-lg font-bold text-red-500">R$ {data.cost.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                        </div>
                      ) : (
                        <div className="p-3 flex flex-col">
                          <span className="text-[0.7rem] font-medium text-text-label uppercase tracking-wider mb-1">{selectedCompanyId === 'cultura' ? 'Cadastros' : 'Custo'}</span>
                          <span className="text-lg font-bold text-primary">{selectedCompanyId === 'cultura' ? data.leads : `R$ ${data.cost.toLocaleString('pt-BR')}`}</span>
                        </div>
                      )}

                      {channel.id === 'meta' && data.cost > 0 ? (
                        <div className="p-3 flex flex-col">
                          <span className="text-[0.7rem] font-medium text-text-label uppercase tracking-wider mb-1">ROAS</span>
                          <span className={`text-lg font-bold ${roasColor}`}>{roas.toFixed(2)}x</span>
                        </div>
                      ) : (
                        <div className="p-3 flex flex-col">
                          <span className="text-[0.7rem] font-medium text-text-label uppercase tracking-wider mb-1">Ticket Médio</span>
                          <span className={`text-lg font-bold`}>{`R$ ${avgTicket.toFixed(0)}`}</span>
                        </div>
                      )}

                      <div className="p-3 flex flex-col">
                        <span className="text-[0.7rem] font-medium text-text-label uppercase tracking-wider mb-1">Vendas</span>
                        <span className="text-lg font-bold">{data.sales}</span>
                      </div>

                      <div className="p-3 flex flex-col">
                        <span className="text-[0.7rem] font-medium text-text-label uppercase tracking-wider mb-1">Conversão</span>
                        <span className="text-lg font-bold">{selectedCompanyId === 'cultura' ? (data.leads > 0 ? ((data.sales / data.leads) * 100).toFixed(1) : 0) + '%' : cr.toFixed(2) + '%'}</span>
                      </div>
                      
                      {channel.id !== 'meta' && (
                        <div className="p-3 flex flex-col">
                          <span className="text-[0.7rem] font-medium text-text-label uppercase tracking-wider mb-1">ROAS</span>
                          <span className={`text-lg font-bold ${roasColor}`}>{roas.toFixed(2)}x</span>
                        </div>
                      )}
                      
                      {channel.id === 'meta' && (
                        <div className="p-3 flex flex-col">
                           <span className="text-[0.7rem] font-medium text-text-label uppercase tracking-wider mb-1">CPA Meta</span>
                           <span className="text-lg font-bold text-primary">R$ {cpa.toFixed(0)}</span>
                        </div>
                      )}
                    </div>

                    {(data.products?.length > 0 || data.campaigns?.length > 0) && (
                      <div className="p-4 bg-bg-page/30 flex-1 space-y-4">
                        {data.products && data.products.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-bold mb-2 text-[#A1A1AA] flex items-center gap-2 uppercase tracking-widest">
                              <Focus className="w-3 h-3" /> Cursos (Canais)
                            </h4>
                            <div className="overflow-x-auto rounded-[4px] border border-border">
                              <table className="w-full text-left">
                                <thead className="bg-bg-card">
                                  <tr>
                                    <th className="text-[9px] font-bold text-text-label p-2 uppercase tracking-wider">Produto</th>
                                    <th className="text-[9px] font-bold text-text-label p-2 uppercase tracking-wider text-right">Quantidade</th>
                                    <th className="text-[9px] font-bold text-text-label p-2 uppercase tracking-wider text-right">Receita</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#222225] bg-bg-sidebar/40">
                                  {data.products.slice(0, 5).map((p: any, i: number) => (
                                    <tr key={i} className="hover:bg-bg-card transition-colors">
                                      <td className="p-2 text-[10px] font-normal text-text-secondary truncate max-w-[120px]" title={p.name}>{p.name}</td>
                                      <td className="p-2 text-[10px] font-medium tabular-nums text-right text-text-label">{p.qty}</td>
                                      <td className="p-2 text-[10px] font-bold tabular-nums text-right text-primary">R$ {p.rev.toLocaleString('pt-BR', {minimumFractionDigits:0})}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {data.campaigns && data.campaigns.length > 0 && selectedCompanyId === 'cultura' && (
                          <div>
                            <h4 className="text-[10px] font-bold mb-2 text-[#A1A1AA] flex items-center gap-2 uppercase tracking-widest">
                              <TrendingUp className="w-3 h-3" /> Top Campanhas
                            </h4>
                            <div className="overflow-x-auto rounded-[4px] border border-border">
                              <table className="w-full text-left">
                                <thead className="bg-bg-card">
                                  <tr>
                                    <th className="text-[9px] font-bold text-text-label p-2 uppercase tracking-wider">Camp</th>
                                    <th className="text-[9px] font-bold text-text-label p-2 uppercase tracking-wider text-right">Vds</th>
                                    <th className="text-[9px] font-bold text-text-label p-2 uppercase tracking-wider text-right">Receita</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#222225] bg-bg-sidebar/40">
                                  {data.campaigns.slice(0, 5).map((c: any, i: number) => (
                                    <tr key={i} className="hover:bg-bg-card transition-colors">
                                      <td className="p-2 text-[10px] font-normal text-text-secondary truncate max-w-[120px]" title={c.name}>{c.name}</td>
                                      <td className="p-2 text-[10px] font-medium tabular-nums text-right text-text-label">{c.sales}</td>
                                      <td className="p-2 text-[10px] font-bold tabular-nums text-right text-primary">R$ {c.rev.toLocaleString('pt-BR', {minimumFractionDigits:0})}</td>
                                    </tr>
                                  ))}
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
    </div>
    </>
  );
}


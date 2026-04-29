import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace CHART_COLORS
content = content.replace(
  /const CHART_COLORS = \[.*?\];/s,
  `const CHART_COLORS = ['#DCA61F', '#A3A3A3', '#737373', '#525252', '#404040', '#E5E5E5', '#FFFFFF', '#D4D4D4', '#262626', '#171717'];`
);

// Colors in pie chart
content = content.replace(/const colors = \['bg-emerald-500', 'bg-indigo-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500', 'bg-violet-500'\];/g,
  `const colors = ['bg-[#DCA61F]', 'bg-[#A3A3A3]', 'bg-[#737373]', 'bg-[#525252]', 'bg-[#404040]', 'bg-[#E5E5E5]'];`
);

const replacements = [
  [/text-(emerald|blue|rose|amber|indigo|pink|cyan|yellow)-(400|500)(\/80|\/90)?/g, 'text-primary'],
  [/bg-(emerald|blue|rose|amber|indigo|pink|cyan|yellow)-(400|500)\/10/g, 'bg-primary/10'],
  [/bg-(emerald|blue|rose|amber|indigo|pink|cyan|yellow)-(400|500)\/20/g, 'bg-primary/20'],
  [/bg-(emerald|blue|rose|amber|indigo|pink|cyan|yellow)-(400|500)\/5/g, 'bg-white/5'],
  [/bg-(emerald|blue|rose|amber|indigo|pink|cyan|yellow)-(400|500)/g, 'bg-primary'],
  [/border-(emerald|blue|rose|amber|indigo|pink|cyan|yellow)-(400|500)\/20/g, 'border-primary/20'],
  [/border-(emerald|blue|rose|amber|indigo|pink|cyan|yellow)-(400|500)\/30/g, 'border-primary/30'],
  [/border-(emerald|blue|rose|amber|indigo|pink|cyan|yellow)-(400|500)\/50/g, 'border-primary/50'],
  [/border-(emerald|blue|rose|amber|indigo|pink|cyan|yellow)-(400|500)/g, 'border-primary'],
  [/text-gray-400/g, 'text-text-secondary'],
  [/text-gray-300/g, 'text-text-secondary'],
  [/text-gray-500/g, 'text-text-secondary'],
  [/text-gray-600/g, 'text-[#525252]'],
  [/#10b981|#3b82f6|#f43f5e/g, '#DCA61F']
];

for (const [regex, replacement] of replacements) {
  content = content.replace(regex, replacement);
}

fs.writeFileSync('src/App.tsx', content);

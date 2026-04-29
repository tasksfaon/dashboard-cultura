import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const replacements = [
  // text-white and text-black
  [/text-white/g, 'text-text-primary'],
  [/text-black/g, 'text-[#0D0D0D]'],
  
  // Custom focus state
  [/focus:border-\[\#8E9299\]/g, 'focus:border-primary'],
  
  // Badges and tags that still have other random colors (if any)
  [/bg-blue-500\/10 text-blue-500/g, 'bg-info/10 text-info'],
  [/bg-pink-500\/10/g, 'bg-primary/10'],
  [/text-pink-400/g, 'text-primary'],
  [/bg-cyan-500\/10/g, 'bg-primary/10'],
  [/text-cyan-400/g, 'text-primary'],
  [/bg-yellow-500\/10/g, 'bg-primary/10'],
  [/text-yellow-400/g, 'text-primary'],
  
  // Any specific semantic changes:
  // "text-emerald..." should be success mostly, but the rules say "Dourado - cor de destaque principal". 
  // Let's keep success as --color-success.
  // Actually, wait, the rule says "Semânticas: --color-success: #4ADE80" so we can keep using semantic colors if we apply them properly.
  // The user prompt also says: Gráficos (Recharts): Linha/área principal chart-primary, Barras secundárias chart-secondary.
];

for (const [regex, replacement] of replacements) {
  content = content.replace(regex, replacement);
}

fs.writeFileSync('src/App.tsx', content);
console.log('Final fixes applied!');

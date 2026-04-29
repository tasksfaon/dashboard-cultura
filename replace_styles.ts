import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The new colors are:
// bg-[#111113] and similar -> bg-bg-card
// bg-[#0A0A0A] -> bg-bg-sidebar or bg-bg-section
// bg-[#1A1A1D] -> bg-[#1E1E1E]

const replacements = [
  // Layout and structural
  [/bg-bg-app/g, 'bg-bg-page'],
  [/bg-\[#111113\]/g, 'bg-bg-card'],
  [/bg-\[#0A0A0A\]/g, 'bg-bg-sidebar'],
  [/bg-\[#222225\]/g, 'bg-bg-sidebar'],
  [/bg-\[#1A1A1D\]/g, 'bg-[#1E1E1E]'], // bg-card-hover representation
  [/bg-\[#050505\]/g, 'bg-bg-input'],
  [/bg-\[#0f0f11\]/g, 'bg-bg-section'],
  [/bg-\[#0a0a0a\]/g, 'bg-bg-sidebar'],

  // Borders
  [/border-\[#222225\]/g, 'border-border'],
  [/border-\[#333336\]/g, 'border-border'],
  [/border-\[#333\]/g, 'border-border'],
  
  // Specific styling
  [/rounded-2xl/g, 'rounded-[14px]'],
  [/rounded-xl/g, 'rounded-[14px]'],
  [/rounded-lg/g, 'rounded-[14px]'],
  
  // Typography hierarchy
  // Dashboard Title / App Name: should be font-serif
  [/text-xl font-bold/g, 'text-2xl font-serif font-normal tracking-[-0.01em]'],
  [/text-lg font-bold/g, 'text-[24px] font-serif font-normal tracking-[-0.01em]'],
  [/text-lg font-semibold/g, 'text-[24px] font-serif font-normal tracking-[-0.01em]'],
  [/text-xl font-semibold/g, 'text-[24px] font-serif font-normal tracking-[-0.01em]'],
  
  // Section titles
  [/text-lg font-medium/g, 'text-[1.5rem] font-serif font-normal text-text-primary'],
  
  // KPI Numbers
  [/text-2xl font-semibold/g, 'text-[2.25rem] font-bold tabular-nums tracking-tight'],
  [/text-3xl font-bold/g, 'text-[2.25rem] font-bold tabular-nums tracking-tight'],
  [/text-6xl font-light tracking-tighter text-primary/g, 'text-[3rem] font-bold tabular-nums text-primary'],

  // KPI Labels / Subtitles
  [/text-xs text-text-secondary mb-1 font-medium/g, 'text-[0.75rem] font-medium text-text-label uppercase tracking-[0.05em] mb-1'],
  [/text-xs text-\[\#8E9299\] mb-1 font-medium/g, 'text-[0.75rem] font-medium text-text-label uppercase tracking-[0.05em] mb-1'],
  [/text-sm font-medium text-text-secondary mb-4/g, 'text-[0.8125rem] font-semibold text-text-secondary uppercase tracking-[0.06em] mb-4'],
  [/text-sm font-medium text-primary/g, 'text-[0.8125rem] font-semibold text-text-secondary uppercase tracking-[0.06em] text-primary'],
  
  // Table Values
  [/text-xs text-right font-mono/g, 'text-[0.875rem] font-medium tabular-nums text-right text-text-primary'],
  [/text-xs font-mono/g, 'text-[0.875rem] font-medium tabular-nums text-text-primary'],
  
  // Table Cells and labels
  [/text-xs text-\[\#E4E3E0\]/g, 'text-[0.875rem] font-normal text-text-secondary'],
  [/text-xs text-\[\#8E9299\]/g, 'text-[0.875rem] font-medium text-text-label'],
  
  // Table headers (were typically text-[10px] uppercase)
  [/text-\[10px\] text-text-secondary uppercase tracking-widest/g, 'text-[0.75rem] font-semibold uppercase tracking-[0.05em] text-text-label'],
  [/text-\[10px\] text-\[\#52525B\]/g, 'text-[0.75rem] text-text-muted'],
  
  // Buttons
  [/bg-primary text-white hover:brightness-110/g, 'bg-primary text-[#0D0D0D] font-semibold tracking-[0.02em] hover:bg-[#E6BE5A]'],
  
  // Tooltips
  [/bg-\[#111113\] border border-\[#222225\]/g, 'bg-bg-tooltip border border-border'],
  
  // Text secondary colors -> text-text-secondary
  [/text-\[\#52525B\]/g, 'text-text-muted'],
  [/text-\[\#8E9299\]/g, 'text-text-label'],
  [/text-\[\#E4E3E0\]/g, 'text-text-secondary'],
  [/text-\[\#FAFAFA\]/g, 'text-text-primary'],

  // App.tsx uses some more complex classNames for the Card component
  [/bg-bg-card border border-border rounded-sm p-6 shadow-sm/g, 'card'],
  [/border-border rounded-sm p-6 shadow-sm/g, 'border-border rounded-[14px] p-6 shadow-sm']
];

for (const [regex, replacement] of replacements) {
  content = content.replace(regex, replacement);
}

fs.writeFileSync('src/App.tsx', content);
console.log('Styles applied!');

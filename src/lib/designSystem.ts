// Apple-Native Premium design tokens for Quotelo
// Spec: docs/superpowers/specs/2026-05-06-quotelo-apple-redesign-design.md

export const ds = {
  // --- Backgrounds ---
  bg: 'bg-[#f2f2f7]',
  surface: 'bg-white',

  // --- Shadows ---
  shadow1: 'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]',
  shadow2: 'shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]',
  shadow3: 'shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]',
  shadowOrange: 'shadow-[0_6px_18px_rgba(249,115,22,0.35),0_2px_6px_rgba(249,115,22,0.20)]',

  // --- Border Radius ---
  radiusSm: 'rounded-lg',       // 8px  — badges, tags
  radiusMd: 'rounded-xl',       // 12px — cards, inputs, list groups
  radiusLg: 'rounded-2xl',      // 16px — buttons, action sheets
  radiusXl: 'rounded-[20px]',   // 20px — hero cards, large modals
  radiusFull: 'rounded-full',   //        pill filters, FAB, avatars

  // --- Typography (Plus Jakarta Sans) ---
  largeTitle: 'text-[34px] font-extrabold tracking-[-0.5px] leading-tight',
  title1:     'text-[28px] font-extrabold tracking-[-0.5px] leading-tight',
  title2:     'text-[22px] font-bold tracking-[-0.2px] leading-snug',
  title3:     'text-[20px] font-semibold tracking-[-0.1px]',
  headline:   'text-[17px] font-semibold',
  body:       'text-[17px] font-normal leading-relaxed',
  callout:    'text-[15px] font-normal',
  footnote:   'text-[13px] font-normal',
  caption:    'text-[11px] font-bold uppercase tracking-[0.5px]',
  numeric:    'font-bold tabular-nums tracking-[-0.2px]',

  // --- Interaction ---
  transition: 'transition-all duration-150 ease-out',
  press: 'active:scale-[0.97]',

  // --- Composite helpers ---
  card: 'bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]',

  btnPrimary: [
    'bg-[#f97316] text-white font-semibold text-[17px]',
    'rounded-2xl px-6 py-4',
    'shadow-[0_6px_18px_rgba(249,115,22,0.35),0_2px_6px_rgba(249,115,22,0.20)]',
    'active:scale-[0.97] transition-all duration-150 ease-out',
  ].join(' '),

  btnSecondary: [
    'bg-[#f2f2f7] text-black font-semibold text-[17px]',
    'rounded-2xl px-6 py-4',
    'active:scale-[0.97] transition-all duration-150 ease-out',
  ].join(' '),

  input: [
    'bg-[#f2f2f7] rounded-xl w-full px-4 py-3',
    'text-[17px] text-black placeholder:text-[#c7c7cc]',
    'focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:ring-offset-0',
    'transition-all duration-150 ease-out',
  ].join(' '),

  tabBar: [
    'bg-[rgba(242,242,247,0.92)] backdrop-blur-xl',
    'border-t border-[rgba(0,0,0,0.12)]',
  ].join(' '),

  // --- Sub-screen header icon button ---
  headerIconBtn: [
    'w-8 h-8 rounded-full bg-[#f2f2f7] border border-[#e5e5ea]',
    'flex items-center justify-center',
    'active:scale-[0.97] transition-all duration-150 ease-out',
  ].join(' '),
};

// Status badge helper — returns className string for a given status
export function statusBadge(status: 'draft' | 'sent' | 'paid' | 'overdue' | 'viewed'): string {
  const map: Record<string, string> = {
    draft:   'bg-[#f2f2f7] text-[#8e8e93]',
    sent:    'bg-[#dbeafe] text-[#1d4ed8]',
    paid:    'bg-[#d1fae5] text-[#065f46]',
    overdue: 'bg-[#fee2e2] text-[#991b1b]',
    viewed:  'bg-[#f3e8ff] text-[#6b21a8]',
  };
  const base = 'inline-block text-[11px] font-bold px-2.5 py-1 rounded-full';
  const normalized = status.toLowerCase();
  if (import.meta.env.DEV && !map[normalized]) {
    console.warn(`statusBadge: unknown status "${status}", falling back to draft style`);
  }
  const color = map[normalized] ?? 'bg-[#f2f2f7] text-[#8e8e93]';
  return `${base} ${color}`;
}

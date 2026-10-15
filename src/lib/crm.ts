import { queryOptions } from '@tanstack/react-query';
import { getCRM } from './crm.functions';
import type { Tables } from '@/integrations/supabase/types';
export const crmQuery = queryOptions({ queryKey: ['crm'], queryFn: () => getCRM() });
export type Section = 'property-category' | 'properties' | 'employee-category' | 'employees' | 'teams' | 'sales';
export const sections = {
  'property-category': { title: 'Property category', description: 'A well-organized portfolio starts with the right categories.', action: 'Add category', group: 'Property' },
  properties: { title: 'Properties', description: 'Every property. Every opportunity. All in one place.', action: 'Add property', group: 'Property' },
  'employee-category': { title: 'Employee category', description: 'Define the designations that shape your organization.', action: 'Add designation', group: 'People' },
  employees: { title: 'Employees', description: 'The people behind every successful property journey.', action: 'Add employee', group: 'People' },
  teams: { title: 'Team management', description: 'Bring the right people together to achieve more.', action: 'New team', group: 'People' },
  sales: { title: 'Sales', description: 'Record every villa sold and see exactly how the cutoff is shared.', action: 'Record sale', group: 'Sales' },
};
export function categoryInUse(id: string, rows: { category_id: string }[]) { return rows.some(row => row.category_id === id); }
export function sortEmployees(rows: Tables<'employees'>[], categories: {id:string;position:number;name?:string}[]) {
  const rank = (id: string) => categories.find(c => c.id === id)?.position ?? Infinity;
  return [...rows].sort((a,b) => rank(a.category_id) - rank(b.category_id) || a.name.localeCompare(b.name));
}
export function teamAssignments(rows: {id:string;team_id:string|null}[], teamId:string, selected:string[]) {
  return rows.map(row => ({...row, team_id: selected.includes(row.id) ? teamId : row.team_id === teamId ? null : row.team_id }));
}
export function crmHead(title: string) {
  const description = `${title} — manage your property portfolio and people with RealEstate CRM.`;
  return { meta: [{ title: `${title} | RealEstate CRM` }, {name:'description',content:description}, {property:'og:title',content:`${title} | RealEstate CRM`}, {property:'og:description',content:description}, {property:'og:type',content:'website'}, {name:'twitter:card',content:'summary_large_image'}] };
}

export type Share = { type: string; value: number };
/** Cutoff amount: per_sqft means the value is rupees per square foot (total = value × sqft);
 * otherwise a fixed amount or a percentage of the price per unit. */
export function cutoffAmount(price: number, type: string, value: number, basis = 'per_unit', sqft = 0) {
  if (basis === 'per_sqft') return Math.max(0, Math.round(value * sqft));
  return Math.max(0, Math.round(type === 'percentage' ? price * value / 100 : value));
}
export function propertyRules(categories: {id:string;name:string;position:number}[], shares: Record<string, Share>) { return categories.map(c => ({ id: c.id, name: c.name, position: c.position, share_type: shares[c.id]?.type ?? 'percentage', share_value: Number(shares[c.id]?.value) || 0 })); }
export type ShareRule = { id: string; name: string; position: number; share_type: string; share_value: number };
export type SplitLine = { categoryId: string; designation: string; amount: number; remainder: boolean };
/** Cutoff split: company keeps listing price minus cutoff; the cutoff (less any discount) is shared by every
 * designation ranked above the seller using its fixed/percentage rule (percentage of the effective cutoff),
 * and the seller's designation receives whatever remains. */
export function cutoffSplit(price: number, cutoff: number, discount: number, rules: ShareRule[], sellerCategoryId: string) {
  const effective = Math.max(0, cutoff - discount);
  const ordered = [...rules].sort((a,b)=>a.position-b.position);
  const sellerIndex = ordered.findIndex(r=>r.id===sellerCategoryId);
  const lines: SplitLine[] = []; let left = effective;
  if (sellerIndex >= 0) {
    for (const rule of ordered.slice(0, sellerIndex)) {
      const want = rule.share_type === 'fixed' ? rule.share_value : effective * rule.share_value / 100;
      const amount = Math.min(left, Math.max(0, Math.round(want)));
      left -= amount; lines.push({ categoryId: rule.id, designation: rule.name, amount, remainder: false });
    }
    const seller = ordered[sellerIndex]!;
    lines.push({ categoryId: seller.id, designation: seller.name, amount: left, remainder: true });
  }
  return { company: Math.max(0, price - cutoff), salePrice: Math.max(0, price - discount), effectiveCutoff: effective, lines };
}

import { useMemo, useState, type FormEvent } from 'react';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Check, Loader2, HandCoins, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { crmQuery, sections, sortEmployees, cutoffSplit, cutoffAmount, propertyRules, type Share } from '@/lib/crm';
import { CRMShell } from './crm-shell';

type SplitRow = { designation: string; person: string; amount: number; remainder: boolean };
const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function Pick({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { id: string; name: string }[]; label: string }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue placeholder={label} /></SelectTrigger><SelectContent>{options.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select>;
}

export function SalesPage() {
  const { data } = useSuspenseQuery(crmQuery);
  const queryClient = useQueryClient();
  const config = sections.sales;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [draft, setDraft] = useState({ property_id: '', unit_label: '', sold_by: '', discount: '0', sale_date: new Date().toISOString().slice(0, 10) });
  const set = (k: keyof typeof draft, v: string) => setDraft(d => ({ ...d, [k]: v }));
  const nameOf = (id: string | null, list: { id: string; name: string }[]) => list.find(x => x.id === id)?.name ?? '—';

  const property = data.properties.find(p => p.id === draft.property_id);
  const seller = data.employees.find(e => e.id === draft.sold_by);
  const preview = useMemo(() => {
    if (!property || !seller) return null;
    const cutoff = cutoffAmount(property.price, property.cutoff_type, property.cutoff, property.cutoff_basis, property.sqft);
    const result = cutoffSplit(property.price, cutoff, Number(draft.discount) || 0, propertyRules(data.employeeCategories, (property.shares ?? {}) as Record<string, Share>), seller.category_id);
    const rows: SplitRow[] = result.lines.map(l => ({
      designation: l.designation,
      amount: l.amount,
      remainder: l.remainder,
      person: l.remainder ? seller.name : seller.team_id ? data.employees.filter(e => e.team_id === seller.team_id && e.category_id === l.categoryId).map(e => e.name).join(', ') || 'Vacant' : 'No team',
    }));
    return { ...result, cutoff, rows };
  }, [property, seller, draft.discount, data]);

  const start = () => { setDraft({ property_id: data.properties[0]?.id ?? '', unit_label: '', sold_by: '', discount: '0', sale_date: new Date().toISOString().slice(0, 10) }); setError(''); setOpen(true); };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!property || !seller || !preview) { setError('Choose the property and who sold it.'); return; }
    const discount = Number(draft.discount);
    if (!Number.isFinite(discount) || discount < 0) { setError('Enter a valid discount.'); return; }
    if (discount > preview.cutoff) { setError('The discount cannot be more than the cutoff.'); return; }
    if (data.sales.filter(s => s.property_id === property.id).length >= property.units) { setError('All villas at this property are already sold.'); return; }
    setBusy(true);
    try {
      const { error: e } = await supabase.from('sales').insert({
        property_id: property.id, unit_label: draft.unit_label.trim(), sold_by: seller.id, team_id: seller.team_id, sale_date: draft.sale_date,
        list_price: property.price, discount, cutoff: preview.effectiveCutoff, sale_price: preview.salePrice, company_share: preview.company, split: preview.rows,
      });
      if (e) { setError('The sale could not be saved. Please try again.'); return; }
      await queryClient.invalidateQueries({ queryKey: ['crm'] });
      toast.success('Sale recorded successfully'); setOpen(false);
    } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleting) return; setBusy(true);
    try {
      const { error: e } = await supabase.from('sales').delete().eq('id', deleting);
      if (e) { toast.error('Could not delete this sale.'); return; }
      await queryClient.invalidateQueries({ queryKey: ['crm'] }); toast.success('Sale deleted'); setDeleting(null);
    } finally { setBusy(false); }
  };
  const totals = data.sales.reduce((t, s) => ({ sales: t.sales + s.sale_price, company: t.company + s.company_share, cutoff: t.cutoff + s.cutoff }), { sales: 0, company: 0, cutoff: 0 });

  return <CRMShell section="sales"><main className="content">
    <div className="page-heading"><div><div className="text-[10px] text-primary font-bold tracking-[1.5px] uppercase mb-2">{config.group} management</div><h1>{config.title}</h1><p>{config.description}</p></div><Button className="primary-action" onClick={start}><Plus size={16} />{config.action}</Button></div>
    <div className="grid gap-4 sm:grid-cols-3 mb-6">{[['Total sales', totals.sales], ['Company share', totals.company], ['Cutoff paid to teams', totals.cutoff]].map(([l, v]) => <div key={l as string} className="data-panel p-5"><div className="text-xs text-muted-foreground">{l}</div><div className="text-2xl font-bold mt-1">{inr(v as number)}</div></div>)}</div>
    <section className="data-panel">{data.sales.length ? <div className="table-scroll"><table className="crm-table"><thead><tr>{['Date', 'Property', 'Sold by', 'Team', 'Sale price', 'Cutoff', 'Company', ''].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{data.sales.map(s => {
      const rows = (s.split ?? []) as SplitRow[];
      return [<tr key={s.id}><td className="whitespace-nowrap">{s.sale_date}</td><td><div className="font-semibold">{nameOf(s.property_id, data.properties.map(p => ({ id: p.id, name: p.address })))}</div>{s.unit_label && <div className="text-xs text-muted-foreground">{s.unit_label}</div>}</td><td className="whitespace-nowrap">{nameOf(s.sold_by, data.employees)}</td><td>{nameOf(s.team_id, data.teams)}</td><td className="whitespace-nowrap">{inr(s.sale_price)}{s.discount > 0 && <div className="text-xs text-muted-foreground">−{inr(s.discount)} discount</div>}</td><td className="whitespace-nowrap">{inr(s.cutoff)}</td><td className="whitespace-nowrap">{inr(s.company_share)}</td><td><div className="actions-group"><Button variant="ghost" size="icon" className="row-action" aria-label="Show split" title="Show split" onClick={() => setExpanded(expanded === s.id ? null : s.id)}><ChevronDown size={14} /></Button><Button variant="ghost" size="icon" className="row-action delete-action" aria-label="Delete sale" title="Delete sale" onClick={() => setDeleting(s.id)}><Trash2 size={14} /></Button></div></td></tr>,
        expanded === s.id && <tr key={`${s.id}-split`}><td colSpan={8}><div className="grid gap-1 text-xs sm:grid-cols-2">{rows.map(r => <div key={r.designation} className="flex justify-between rounded-md border px-3 py-2"><span>{r.designation} · {r.person}{r.remainder ? ' (remainder)' : ''}</span><b>{inr(r.amount)}</b></div>)}</div></td></tr>];
    })}</tbody></table></div> : <div className="empty-state"><HandCoins size={30} className="mx-auto" /><h3>No sales yet</h3><Button variant="outline" onClick={start}>Record sale</Button></div>}</section>
  </main>
    <Dialog open={open} onOpenChange={v => { if (!v && !busy) setOpen(false); }}><DialogContent className="max-h-[90vh] overflow-y-auto w-[calc(100%-32px)] sm:max-w-lg"><div><DialogTitle>Record sale</DialogTitle><DialogDescription className="mt-2">The cutoff and shares come from the property's settings.</DialogDescription></div>
      <form onSubmit={save} noValidate><div className="form-grid">
        <div className="form-field form-wide"><label>Property *</label><Pick label="Property" value={draft.property_id} onChange={v => set('property_id', v)} options={data.properties.map(p => ({ id: p.id, name: `${p.address}, ${p.city} (${data.sales.filter(s => s.property_id === p.id).length}/${p.units} sold)` }))} /></div>
        <div className="form-field"><label htmlFor="sale-unit">Villa / unit no.</label><Input id="sale-unit" value={draft.unit_label} onChange={e => set('unit_label', e.target.value)} placeholder="e.g. Villa 7" /></div>
        <div className="form-field"><label htmlFor="sale-date">Sale date</label><Input id="sale-date" type="date" value={draft.sale_date} onChange={e => set('sale_date', e.target.value)} /></div>
        <div className="form-field form-wide"><label>Sold by *</label><Pick label="Sold by" value={draft.sold_by} onChange={v => set('sold_by', v)} options={sortEmployees(data.employees, data.employeeCategories).map(e => ({ id: e.id, name: `${e.name} · ${nameOf(e.category_id, data.employeeCategories)} · ${e.team_id ? nameOf(e.team_id, data.teams) : 'No team'}` }))} /></div>
        <div className="form-field form-wide"><label htmlFor="sale-discount">Discount (₹)</label><Input id="sale-discount" type="number" min={0} value={draft.discount} onChange={e => set('discount', e.target.value)} /></div>
      </div>
        {preview && <div className="mt-4 rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
          <div className="flex justify-between"><span>Property value</span><b>{inr(property!.price)}</b></div>
          <div className="flex justify-between"><span>Sale price</span><b>{inr(preview.salePrice)}</b></div>
          <div className="flex justify-between"><span>Company share</span><b>{inr(preview.company)}</b></div>
          <div className="flex justify-between"><span>Cutoff after discount</span><b>{inr(preview.effectiveCutoff)}</b></div>
          {preview.rows.map(r => <div key={r.designation} className="flex justify-between text-muted-foreground"><span>{r.designation} · {r.person}{r.remainder ? ' (remainder)' : ''}</span><b className="text-foreground">{inr(r.amount)}</b></div>)}
        </div>}
        {error && <p role="alert" className="text-destructive text-xs mt-4">{error}</p>}
        <DialogFooter className="mt-6 gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Check />}{busy ? 'Saving...' : 'Save sale'}</Button></DialogFooter>
      </form></DialogContent></Dialog>
    <Dialog open={Boolean(deleting)} onOpenChange={v => { if (!v && !busy) setDeleting(null); }}><DialogContent className="w-[calc(100%-32px)]"><DialogTitle>Delete sale?</DialogTitle><DialogDescription>This removes the sale and its split. This action cannot be undone.</DialogDescription><DialogFooter className="gap-2"><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={remove}>{busy ? 'Deleting...' : 'Delete'}</Button></DialogFooter></DialogContent></Dialog>
  </CRMShell>;
}

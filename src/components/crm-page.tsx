import { useState, type FormEvent } from 'react';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, LandPlot, House, Building2, Sprout, BriefcaseBusiness, Search, ListFilter, ChevronRight, Check, MapPin, BedDouble, Bath, Maximize, UsersRound, Network, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { crmQuery, sections, categoryInUse, sortEmployees, cutoffSplit, cutoffAmount, propertyRules, type Share, type Section } from '@/lib/crm';
import { CRMShell } from './crm-shell';
import villa from '@/assets/villa.jpg';
import apartment from '@/assets/apartment.jpg';
import land from '@/assets/land.jpg';
import commercial from '@/assets/commercial.jpg';

export const crmSearch = (search: Record<string, unknown>) => ({ q: typeof search['q'] === 'string' ? search['q'] : '', category: typeof search['category'] === 'string' ? search['category'] : 'all', status: typeof search['status'] === 'string' ? search['status'] : 'all' });
const categoryIcons: Record<string, typeof House> = { 'Open plot': LandPlot, Villa:House, Apartment:Building2, Farmland:Sprout, Commercial:BriefcaseBusiness };
const images: Record<string,string> = {Villa:villa,Apartment:apartment,'Open plot':land,Farmland:land,Commercial:commercial};
type Item = {id:string;name?:string;address?:string};
type Draft = Record<string,string>;

function Dropdown({ value, onChange, options, label, className }: {value:string;onChange:(v:string)=>void;options:{id:string;name:string}[];label:string;className?:string}) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className={className}><SelectValue placeholder={label}/></SelectTrigger><SelectContent>{options.map(option=><SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}</SelectContent></Select>;
}
function CategoryIcon({name}:{name:string}) { const Icon = categoryIcons[name] ?? BriefcaseBusiness; return <span className="category-icon" data-kind={name}><Icon size={19} strokeWidth={1.65}/></span>; }
function Initials({name}:{name:string}) { return <div className="employee-avatar">{name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>; }
export function CRMLoading() { return <div className="content"><div className="skeleton-row"/>{[1,2,3,4,5].map(i=><div key={i} className="skeleton-row"/>)}</div>; }
export function CRMError() { const navigate=useNavigate(); return <div className="empty-state"><h3>Workspace unavailable</h3><p>Please try opening your workspace again.</p><Button className="mt-5" onClick={()=>navigate({to:'/',search:{q:'',category:'all',status:'all'},reloadDocument:true})}>Try again</Button></div>; }
export function CRMNotFound() { return <div className="empty-state"><h3>Record not found</h3></div>; }

export function CRMPage({section}:{section:Section}) {
  const {data}=useSuspenseQuery(crmQuery);
  const queryClient=useQueryClient();
  const navigate=useNavigate();
  const search = useSearch({strict:false});
  const q = search.q ?? '';
  const category=search.category ?? 'all';
  const status=search.status ?? 'all';
  const currentPath = section==='property-category'?'/' : section==='teams'?'/teams':section==='properties'?'/properties':section==='employees'?'/employees':section==='sales'?'/sales':'/employee-category';
  const filter=(key:string,value:string)=>navigate({to:currentPath,search:{q,category,status,[key]:value},replace:true});
  const [editing,setEditing]=useState<Item|null|undefined>(undefined);
  const [draft,setDraft]=useState<Draft>({});
  const [members,setMembers]=useState<string[]>([]);
  const [deleting,setDeleting]=useState<Item|null>(null);
  const [busy,setBusy]=useState(false);
  const [errors,setErrors]=useState<Record<string,string>>({});
  const config=sections[section];
  const categoryPage=section==='property-category'||section==='employee-category';
  const categories=section==='property-category'||section==='properties'?data.propertyCategories:data.employeeCategories;
  const table=section==='property-category'?'property_categories':section==='employee-category'?'employee_categories':section==='properties'?'properties':section==='employees'?'employees':'teams';
  const label=section==='properties'?'property':section==='employees'?'employee':section==='teams'?'team':section==='employee-category'?'designation':'category';
  const nameFor=(id:string, list:{id:string;name:string}[])=>list.find(x=>x.id===id)?.name ?? 'Unassigned';
  const employees=sortEmployees(data.employees,data.employeeCategories).filter(e=>(category==='all'||e.category_id===category)&&[e.name,e.phone,e.email].some(v=>v.toLowerCase().includes(q.toLowerCase())));
  const properties=data.properties.filter(p=>(category==='all'||p.category_id===category)&&(status==='all'||p.status===status)&&`${p.address} ${p.city}`.toLowerCase().includes(q.toLowerCase()));
  const hasCutoff=section==='properties';
  const shares:Record<string,Share>=(()=>{try{return JSON.parse(draft['shares']||'{}');}catch{return {};}})();
  const setShare=(id:string,patch:Partial<Share>)=>update('shares',JSON.stringify({...shares,[id]:{type:shares[id]?.type??'percentage',value:shares[id]?.value??0,...patch}}));
  const cutoffValue=cutoffAmount(Number(draft['price'])||0,draft['cutoff_type']??'fixed',Number(draft['cutoff'])||0,draft['cutoff_basis']??'per_unit',Number(draft['sqft'])||0);
  const perSqft=draft['cutoff_basis']==='per_sqft';
  const rankedDesignations=[...data.employeeCategories].sort((a,b)=>a.position-b.position);
  const inr=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
  const open=(item?:Item)=>{
    setEditing(item??null); setErrors({});
    setDraft(item?Object.fromEntries(Object.entries(item).map(([k,v])=>[k,v==null?'none':typeof v==='object'?JSON.stringify(v):String(v)])):{name:'',address:'',city:'',price:'',sqft:'',beds:'0',baths:'0',category_id:categories[0]?.id??'',status:'Active',team_id:'none',units:'1',cutoff:'0',cutoff_type:'fixed',cutoff_basis:'per_unit',shares:'{}',sale_discount:'0',sold_by:'none',share_type:'percentage',share_value:'0',has_cutoff:'false'});
    setMembers(item?data.employees.filter(e=>e.team_id===item.id).map(e=>e.id):[]);
  };
  const update=(key:string,value:string)=>setDraft(prev=>({...prev,[key]:value}));
  const refresh=async()=>{await queryClient.invalidateQueries({queryKey:['crm']});};
  const fail=(error:{message:string;code?:string})=>{
    if(error.code==='23503') return 'This category is in use. Reassign its records before deleting it.';
    return 'The change could not be saved. Please try again.';
  };
  const save=async(event:FormEvent)=>{
    event.preventDefault(); const validation:Record<string,string>={};
    for(const key of section==='properties'?['address','city','category_id']:section==='employees'?['name','category_id']:['name']) if(!draft[key]?.trim()) validation[key]='This field is required.';
    if(section==='employees'&&draft['email']&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft['email']??'')) validation['email']='Enter a valid email address.';
    if(section==='properties'&&(Object.values(shares).some(v=>!(Number(v.value)>=0))||(draft['cutoff_type']==='percentage'&&Number(draft['cutoff'])>100))) validation['cutoff']='Enter valid cutoff and share values.';
    if(section==='properties') for(const key of ['price','sqft','beds','baths',...(hasCutoff?['cutoff','sale_discount']:[])]) if(Number(draft[key])<0||!Number.isFinite(Number(draft[key]))||(['beds','baths'].includes(key)&&!Number.isInteger(Number(draft[key])))) validation[key]='Enter a valid non-negative number.';
    setErrors(validation); if(Object.keys(validation).length) return;
    setBusy(true);
    try {
      let error:{message:string;code?:string}|null=null;
      if(categoryPage){
        const base={name:(draft['name'] ?? '').trim(),position:editing?Number(draft['position']):Math.max(-1,...categories.map(c=>c.position))+1};
        if(table==='property_categories'){const value=base;const result=editing?await supabase.from('property_categories').update(value).eq('id',editing.id):await supabase.from('property_categories').insert(value);error=result.error;}
        else{const value=base;const result=editing?await supabase.from('employee_categories').update(value).eq('id',editing.id):await supabase.from('employee_categories').insert(value);error=result.error;}
      } else if(section==='properties') {
        const value={address:(draft['address'] ?? '').trim(),city:(draft['city'] ?? '').trim(),price:Number(draft['price']),sqft:Number(draft['sqft']),beds:Number(draft['beds']),baths:Number(draft['baths']),status:draft['status']??'Active',category_id:draft['category_id']??'',cutoff:Number(draft['cutoff'])||0,cutoff_type:draft['cutoff_type']==='percentage'?'percentage':'fixed',cutoff_basis:draft['cutoff_basis']==='per_sqft'?'per_sqft':'per_unit',shares:Object.fromEntries(Object.entries(shares).map(([k,v])=>[k,{type:v.type==='fixed'?'fixed':'percentage',value:Number(v.value)||0}])),units:Math.max(1,Math.floor(Number(draft['units'])||1))};
        const result=editing?await supabase.from('properties').update(value).eq('id',editing.id):await supabase.from('properties').insert(value);error=result.error;
      } else if(section==='employees') {
        const value={name:(draft['name'] ?? '').trim(),phone:draft['phone']??'',email:draft['email']??'',category_id:draft['category_id']??''};
        const result=editing?await supabase.from('employees').update(value).eq('id',editing.id):await supabase.from('employees').insert(value);error=result.error;
      } else {
        const result=await supabase.rpc('save_crm_team',{team_name:(draft['name'] ?? '').trim(),member_ids:members,...(editing?{existing_id:editing.id}:{})});error=result.error;
      }
      if(error){setErrors({form:fail(error)});return;}
      await refresh(); toast.success(`${label.charAt(0).toUpperCase()+label.slice(1)} ${editing?'updated':'created'} successfully`);setEditing(undefined);
    } catch { setErrors({form:'The change could not be saved. Please try again.'}); }
    finally {setBusy(false);}
  };
  const askDelete=(item:Item)=>{
    if(categoryPage&&categoryInUse(item.id,section==='property-category'?data.properties:data.employees)) {toast.error(section==='property-category'?'Reassign the properties first. This category is in use.':'This designation is assigned to employees. Reassign them first.');return;}
    setDeleting(item);
  };
  const remove=async()=>{if(!deleting)return;setBusy(true);try{const result=await supabase.from(table).delete().eq('id',deleting.id);if(result.error){toast.error(fail(result.error));return;}await refresh();toast.success(`${label.charAt(0).toUpperCase()+label.slice(1)} deleted successfully`);setDeleting(null);setEditing(undefined);}catch{toast.error('Could not delete this record. Please try again.');}finally{setBusy(false);}};
  const reorder=async(index:number,direction:number)=>{const first=data.employeeCategories[index];const second=data.employeeCategories[index+direction];if(!first||!second)return;setBusy(true);try{const {error}=await supabase.rpc('swap_designations',{first_id:first.id,second_id:second.id});if(error)toast.error(fail(error));else{await refresh();toast.success('Designation order updated');}}finally{setBusy(false);}};
  const actions=(item:Item)=><div className="actions-group"><Button variant="ghost" size="icon" className="row-action" aria-label={`Edit ${item.name??item.address}`} title={`Edit ${item.name??item.address}`} onClick={()=>open(item)}><Pencil size={14}/></Button><Button variant="ghost" size="icon" className="row-action delete-action" aria-label={`Delete ${item.name??item.address}`} title={`Delete ${item.name??item.address}`} onClick={()=>askDelete(item)}><Trash2 size={14}/></Button></div>;
  const field=(key:string,title:string,type='text',wide=false)=><div className={`form-field ${wide?'form-wide':''}`} key={key}><label htmlFor={`field-${key}`}>{title}</label><Input id={`field-${key}`} value={draft[key]??''} type={type} min={type==='number'?0:undefined} step={type==='number'&&['price','sqft'].includes(key)?'any':undefined} onChange={e=>update(key,e.target.value)} aria-invalid={Boolean(errors[key])}/>{errors[key]&&<span className="text-destructive text-xs">{errors[key]}</span>}</div>;
  const selectField=(key:string,title:string,options:{id:string;name:string}[],wide=false)=><div className={`form-field ${wide?'form-wide':''}`}><label>{title}</label><Dropdown label={title} value={draft[key]??''} options={options} onChange={v=>update(key,v)}/>{errors[key]&&<span className="text-destructive text-xs">{errors[key]}</span>}</div>;
  const empty=(title:string)=><div className="empty-state"><Search size={30} className="mx-auto"/><h3>{title}</h3><Button variant="outline" onClick={()=>q||category!=='all'||status!=='all'?navigate({to:currentPath,search:{q:'',category:'all',status:'all'}}):open()}>{q||category!=='all'||status!=='all'?'Clear filters':config.action}</Button></div>;
  return <CRMShell section={section}><main className="content"><div className="page-heading"><div><div className="text-[10px] text-primary font-bold tracking-[1.5px] uppercase mb-2">{config.group} management</div><h1>{config.title}</h1><p>{config.description}</p></div><Button className="primary-action" onClick={()=>open()}><Plus size={16}/>{config.action}</Button></div>
    {categoryPage?<section className="data-panel"><div className="panel-top"><div><h2 className="panel-title">{section==='property-category'?'All property categories':'Designation hierarchy'}</h2><p className="panel-caption">{section==='property-category'?'Your portfolio, thoughtfully organized.':'Seniority order, from leadership to agents.'}</p></div><span className="text-muted-foreground"><ListFilter size={17} strokeWidth={1.5}/></span></div>{categories.length?<div className="table-scroll"><table className="crm-table"><thead><tr><th>{section==='property-category'?'#':'Rank'}</th><th>{section==='property-category'?'Category name':'Designation'}</th>{section==='employee-category'&&<th>Order</th>}<th className="actions-cell">Actions</th></tr></thead><tbody>{categories.map((item,index)=><tr key={item.id}><td className="row-index">{String(index+1).padStart(2,'0')}</td><td><div className="category-name"><CategoryIcon name={item.name}/>{item.name}</div></td>{section==='employee-category'&&<td><div className="flex gap-2"><Button variant="ghost" size="icon" className="row-action" disabled={index===0||busy} title="Move up" aria-label={`Move ${item.name} up`} onClick={()=>reorder(index,-1)}><ArrowUp/></Button><Button variant="ghost" size="icon" className="row-action" disabled={index===categories.length-1||busy} title="Move down" aria-label={`Move ${item.name} down`} onClick={()=>reorder(index,1)}><ArrowDown/></Button></div></td>}<td className="actions-cell">{actions(item)}</td></tr>)}</tbody></table></div>:empty('No categories yet')}<div className="panel-footer"><Check size={13} className="text-primary"/>All changes saved</div></section>:null}
    {(section==='properties'||section==='employees')&&<div className={section==='employees'?'data-panel':''}><div className={`toolbar ${section==='properties'?'rounded-lg border bg-card':''}`}><div className="search-field"><Search/><Input aria-label="Search" placeholder={section==='properties'?'Search by address or city...':'Search name, phone or email...'} value={q} onChange={e=>filter('q',e.target.value)}/></div><Dropdown className="filter-select" label="Category filter" value={category} onChange={v=>filter('category',v)} options={[{id:'all',name:'All categories'},...categories]}/>{section==='properties'&&<Dropdown className="filter-select" label="Status filter" value={status} onChange={v=>filter('status',v)} options={['All','Active','Pending','Sold'].map(s=>({id:s==='All'?'all':s,name:s==='All'?'All statuses':s}))}/>}</div>
      {section==='employees'&&(employees.length?<div className="table-scroll"><table className="crm-table employees-table"><thead><tr>{['Name','Category','Phone','Email','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{employees.map(e=><tr key={e.id}><td><div className="flex items-center gap-3"><Initials name={e.name}/><span className="font-semibold whitespace-nowrap">{e.name}</span></div></td><td className="whitespace-nowrap">{nameFor(e.category_id,data.employeeCategories)}</td><td className="text-muted-foreground whitespace-nowrap">{e.phone||'—'}</td><td className="text-muted-foreground">{e.email||'—'}</td><td>{actions(e)}</td></tr>)}</tbody></table></div>:empty('No employees found'))}
    </div>}
    {section==='properties'&&(properties.length?<div className="property-grid">{properties.map(p=>{const name=nameFor(p.category_id,data.propertyCategories);return <article key={p.id} className="property-card" tabIndex={0} role="button" aria-label={`Edit property ${p.address}`} onClick={()=>open(p)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(p);}}}><div className="property-image"><img src={images[name]??villa} alt={`${name} exterior`} width={1000} height={700} loading="lazy"/><span className="status-badge" data-status={p.status}>{p.status}</span><span className="property-price">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(p.price)}</span></div><div className="property-body"><h3>{p.address}</h3><p><MapPin size={12}/>{p.city}</p><div className="property-specs"><span><BedDouble size={14}/>{p.beds} beds</span><span><Bath size={14}/>{p.baths} baths</span><span><Maximize size={13}/>{p.sqft.toLocaleString()} sqft</span></div><p className="text-[11px] text-muted-foreground mt-1">Cutoff: <b className="text-foreground">{inr(cutoffAmount(p.price,p.cutoff_type,p.cutoff,p.cutoff_basis,p.sqft))}</b>{p.cutoff_basis==='per_sqft'?` (${inr(p.cutoff)}/sqft)`:p.cutoff_type==='percentage'?` (${p.cutoff}% of price)`:' (fixed)'}</p><span className="property-category">{name}</span><span className="text-[11px] text-muted-foreground ml-2">{data.sales.filter(x=>x.property_id===p.id).length} of {p.units} sold</span></div></article>;})}</div>:empty('No properties found'))}
    {section==='teams'&&(data.teams.length?<div className="team-grid">{data.teams.map(team=>{const teamMembers=data.employees.filter(e=>e.team_id===team.id);return <section key={team.id} className="team-card"><div className="panel-top"><div><h2 className="panel-title flex items-center gap-2"><Network size={18} className="text-primary"/>{team.name}</h2><p className="panel-caption">{teamMembers.length} members</p></div><div className="flex gap-2 items-center"><Button variant="outline" size="sm" onClick={()=>open(team)}><Pencil size={12}/>Manage</Button><Button className="row-action delete-action" variant="ghost" size="icon" title={`Delete ${team.name}`} aria-label={`Delete ${team.name}`} onClick={()=>askDelete(team)}><Trash2/></Button></div></div>{data.employeeCategories.map(c=>{const people=teamMembers.filter(e=>e.category_id===c.id);return <div className="team-slot" key={c.id}><h4>{c.name.toUpperCase()}{people.length>1?` (${people.length})`:''}</h4>{people.length?people.map(e=><span className="member-chip" key={e.id} title={e.phone}><UsersRound size={12} className="text-primary"/>{e.name}</span>):<span className="text-xs text-muted-foreground">Vacant</span>}</div>;})}</section>;})}</div>:empty('No teams yet'))}
    <div className="page-footer"><span className="flex gap-1.5 items-center"><ShieldCheck size={12}/>RealEstate CRM · Administration</span><span>Built for better connections.</span></div>
  </main>
  <Dialog open={editing!==undefined} onOpenChange={value=>{if(!value&&!busy)setEditing(undefined);}}><DialogContent className="max-h-[90vh] overflow-y-auto w-[calc(100%-32px)] sm:max-w-lg"><div><DialogTitle>{editing?'Edit':'Add'} {label}</DialogTitle><DialogDescription className="mt-2">{section==='teams'?'Team details and members.':`Enter the ${label} details below.`}</DialogDescription></div><form onSubmit={save} noValidate><div className="form-grid">{categoryPage?<>{field('name','Name','text',true)}</>:section==='properties'?<>{field('address','Address *','text',true)}{field('city','City *')}{field('price','Price (₹)','number')}{field('sqft','Sqft','number')}{field('beds','Beds','number')}{field('baths','Baths','number')}{field('units','Villas at this location','number')}{selectField('status','Status',['Active','Pending','Sold'].map(s=>({id:s,name:s})))}{selectField('category_id','Category *',categories,true)}{hasCutoff&&<>{selectField('cutoff_basis','Cutoff basis',[{id:'per_unit',name:'Per unit (villa, apartment…)'},{id:'per_sqft',name:'Per sqft (plot, farmland…)'}])}{!perSqft&&selectField('cutoff_type','Cutoff type',[{id:'fixed',name:'Fixed amount (₹)'},{id:'percentage',name:'Percentage of price'}])}{field('cutoff',perSqft?'Cutoff (₹ per sqft)':draft['cutoff_type']==='percentage'?'Cutoff (%)':'Cutoff (₹)','number')}<div className="form-wide space-y-2"><label className="text-xs font-semibold">Designation shares for this property</label>{rankedDesignations.map((c,i)=><div key={c.id} className="grid grid-cols-[1fr_150px_110px] gap-2 items-center text-xs"><span>{c.name}</span>{i===rankedDesignations.length-1?<span className="col-span-2 text-muted-foreground">Receives the remainder</span>:<><Dropdown label={`${c.name} share type`} value={shares[c.id]?.type??'percentage'} options={[{id:'percentage',name:'% of cutoff'},{id:'fixed',name:'Fixed (₹)'}]} onChange={v=>setShare(c.id,{type:v})}/><Input aria-label={`${c.name} share`} type="number" min={0} value={String(shares[c.id]?.value??0)} onChange={e=>setShare(c.id,{value:Number(e.target.value)})}/></>}</div>)}<p className="text-[11px] text-muted-foreground">When someone above the lowest rank sells, they receive the remainder instead.</p></div><div className="form-wide rounded-lg border bg-muted/40 p-3 text-xs space-y-1"><div className="flex justify-between"><span>Company share per unit</span><b>{inr(Math.max(0,(Number(draft['price'])||0)-cutoffValue))}</b></div><div className="flex justify-between"><span>Cutoff per unit (shared by the selling team){perSqft&&` — ${inr(Number(draft['cutoff'])||0)}/sqft × ${(Number(draft['sqft'])||0).toLocaleString()} sqft`}</span><b>{inr(cutoffValue)}</b></div></div></>}</>:section==='employees'?<>{field('name','Full name *','text',true)}{selectField('category_id','Category *',categories,true)}{field('phone','Phone','tel')}{field('email','Email','email')}</>:field('name','Team name *','text',true)}</div>
    {section==='teams'&&<div className="member-options">{data.employeeCategories.map(c=><div key={c.id}><h4>{c.name}</h4>{sortEmployees(data.employees,data.employeeCategories).filter(e=>e.category_id===c.id).map(e=><label className="member-option" key={e.id}><Checkbox checked={members.includes(e.id)} onCheckedChange={checked=>setMembers(prev=>checked?[...prev,e.id]:prev.filter(id=>id!==e.id))}/><span>{e.name}{e.team_id&&e.team_id!==editing?.id&&<span className="block text-[10px] text-muted-foreground mt-1">(in {nameFor(e.team_id,data.teams)} – will move)</span>}</span></label>)}</div>)}</div>}
    {errors['form']&&<p role="alert" className="text-destructive text-xs mt-4">{errors['form']}</p>}<DialogFooter className="mt-6 gap-2">{editing&&section==='properties'&&<Button type="button" variant="ghost" className="text-destructive mr-auto" onClick={()=>askDelete(editing)}><Trash2/>Delete</Button>}<Button type="button" variant="outline" disabled={busy} onClick={()=>setEditing(undefined)}>Cancel</Button><Button type="submit" disabled={busy}>{busy?<Loader2 className="animate-spin"/>:<Check/>}{busy?'Saving...':'Save'}</Button></DialogFooter></form></DialogContent></Dialog>
  <Dialog open={Boolean(deleting)} onOpenChange={value=>{if(!value&&!busy)setDeleting(null);}}><DialogContent className="w-[calc(100%-32px)]"><DialogTitle>Delete {label}?</DialogTitle><DialogDescription>Are you sure you want to delete “{deleting?.name??deleting?.address}”? {section==='teams'?'All members will become unassigned.':'This action cannot be undone.'}</DialogDescription><DialogFooter className="gap-2"><Button variant="outline" disabled={busy} onClick={()=>setDeleting(null)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={remove}>{busy?'Deleting...':'Delete'}</Button></DialogFooter></DialogContent></Dialog>
  </CRMShell>;
}

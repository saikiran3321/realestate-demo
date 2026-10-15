import { Link } from '@tanstack/react-router';
import { Building2, Shapes, House, BriefcaseBusiness, UsersRound, Network, ChevronRight, ArrowUpRight, HandCoins, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { sections, type Section } from '@/lib/crm';
import villa from '@/assets/villa.jpg';
const navigation = [
  { section:'property-category' as const, to:'/' as const, icon:Shapes },
  { section:'properties' as const, to:'/properties' as const, icon:House },
  { section:'employee-category' as const, to:'/employee-category' as const, icon:BriefcaseBusiness },
  { section:'employees' as const, to:'/employees' as const, icon:UsersRound },
  { section:'teams' as const, to:'/teams' as const, icon:Network },
  { section:'sales' as const, to:'/sales' as const, icon:HandCoins },
];
export function CRMShell({ section, children }: {section:Section;children:ReactNode}) {
  const [collapsed,setCollapsed] = useState(false);
  const current = sections[section];
  return <div className={collapsed ? 'crm-layout sidebar-collapsed' : 'crm-layout'}>
    <aside className="crm-sidebar">
      <div className="brand"><div className="brand-mark"><Building2 size={25} strokeWidth={1.4}/></div><div className="brand-copy"><div className="brand-name">RealEstate <span className="font-normal">CRM</span></div><div className="brand-subtitle">YOUR GROWTH, CONNECTED</div></div></div>
      <nav className="sidebar-navigation" aria-label="Main navigation">{['Property','People','Sales'].map(group => <div className="nav-group" key={group}><div className="nav-label">{group.toUpperCase()}</div>{navigation.filter(item=>sections[item.section].group===group).map(item=><Button key={item.section} variant="ghost" className="nav-item" asChild><Link to={item.to} search={{q:'',category:'all',status:'all'}} data-active={section===item.section} title={sections[item.section].title}><item.icon size={18} strokeWidth={1.6}/><span>{sections[item.section].title}</span></Link></Button>)}</div>)}</nav>
      <div className="sidebar-image"><img src={villa} alt="Contemporary villa" width={1200} height={800}/><p>Great spaces.<br/>Greater possibilities.<ArrowUpRight size={16} className="inline ml-3"/></p></div>
      <div className="workspace-bottom"><div className="workspace-avatar">RE</div><div className="brand-copy"><div className="font-semibold">RealEstate workspace</div><div className="text-nav-muted text-[10px] mt-1">Administration</div></div></div>
    </aside>
    <div className="crm-main"><header className="topbar"><div className="flex items-center gap-3 text-xs"><Button variant="ghost" size="icon" className="hidden md:inline-flex text-muted-foreground" aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} title={collapsed?'Expand sidebar':'Collapse sidebar'} onClick={()=>setCollapsed(!collapsed)}>{collapsed?<PanelLeftOpen/>:<PanelLeftClose/>}</Button><span className="text-muted-foreground">Workspace</span><ChevronRight size={13} className="text-muted-foreground"/><span className="font-semibold">{current.group}</span></div><div className="flex items-center gap-3"><span className="text-[10px] text-muted-foreground hidden sm:block">Admin workspace</span><div className="employee-avatar">RE</div></div></header>{children}</div>
  </div>;
}

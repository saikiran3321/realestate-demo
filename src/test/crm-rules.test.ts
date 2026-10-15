import { describe, it, expect } from 'vitest';
import { cutoffSplit, cutoffAmount, categoryInUse, sortEmployees, teamAssignments } from '@/lib/crm';
describe('CRM business rules',()=>{
  it('blocks deletion of a property category referenced by a property',()=>{expect(categoryInUse('villa',[{category_id:'villa'}])).toBe(true);expect(categoryInUse('farm',[{category_id:'villa'}])).toBe(false);});
  it('blocks deletion of a designation assigned to an employee',()=>{expect(categoryInUse('agent',[{category_id:'agent'}])).toBe(true);});
  it('sorts employees by designation rank then name',()=>{
    const rows=[{id:'1',name:'Zara',category_id:'senior',phone:'',email:'',team_id:null},{id:'2',name:'Aaron',category_id:'agent',phone:'',email:'',team_id:null},{id:'3',name:'Adam',category_id:'senior',phone:'',email:'',team_id:null}];
    expect(sortEmployees(rows,[{id:'agent',name:'Agent',position:5},{id:'senior',name:'Senior Director',position:0}]).map(e=>e.name)).toEqual(['Adam','Zara','Aaron']);
  });
  it('moves selected employees out of their old team',()=>{expect(teamAssignments([{id:'a',team_id:'alpha'}],'beta',['a'])).toEqual([{id:'a',team_id:'beta'}]);});
  it('unassigns unchecked team members and preserves unrelated assignments',()=>{expect(teamAssignments([{id:'a',team_id:'alpha'},{id:'b',team_id:'beta'}],'alpha',[])).toEqual([{id:'a',team_id:null},{id:'b',team_id:'beta'}]);});
  const rules=[{id:'sd',name:'Senior Director',position:0,share_type:'fixed',share_value:200000},{id:'d',name:'Director',position:1,share_type:'percentage',share_value:2},{id:'a',name:'Agent',position:5,share_type:'percentage',share_value:2}];
  it('villa of 1 Cr with 8 L cutoff leaves 92 L for the company and agent gets the remainder',()=>{const r=cutoffSplit(10000000,800000,0,rules,'a');expect(r.company).toBe(9200000);expect(r.lines.map(l=>l.amount)).toEqual([200000,16000,584000]);});
  it('a 3 L discount reduces the cutoff to 5 L',()=>{const r=cutoffSplit(10000000,800000,300000,rules,'a');expect(r.effectiveCutoff).toBe(500000);expect(r.company).toBe(9200000);expect(r.lines.map(l=>l.amount)).toEqual([200000,10000,290000]);});
  it('sale through a director pays only the senior director rule and the director gets the rest',()=>{const r=cutoffSplit(10000000,800000,0,rules,'d');expect(r.lines.map(l=>l.amount)).toEqual([200000,600000]);});
  it('per-sqft cutoff multiplies the rate by the area (₹200/sqft × 2400 sqft = ₹4.8 L)',()=>{expect(cutoffAmount(4800000,'fixed',200,'per_sqft',2400)).toBe(480000);});
  it('per-sqft cutoff feeds the same split as a villa cutoff',()=>{const cutoff=cutoffAmount(4800000,'fixed',200,'per_sqft',2400);const r=cutoffSplit(4800000,cutoff,0,rules,'a');expect(r.company).toBe(4320000);expect(r.lines.map(l=>l.amount)).toEqual([200000,9600,270400]);});
  it('per-unit basis keeps the existing fixed and percentage behaviour',()=>{expect(cutoffAmount(10000000,'fixed',800000)).toBe(800000);expect(cutoffAmount(10000000,'percentage',8)).toBe(800000);});
});

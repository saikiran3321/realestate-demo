import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export const getCRM = createServerFn({ method: 'GET' }).handler(async () => {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) {
    console.error('[getCRM] Missing server Supabase configuration', {
      hasSupabaseUrl: Boolean(url),
      hasPublishableKey: Boolean(key),
    });
    throw new Error('The workspace connection is unavailable.');
  }
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
  const [pc, p, ec, e, t, s] = await Promise.all([
    client.from('property_categories').select('*').order('position'),
    client.from('properties').select('*').order('address'),
    client.from('employee_categories').select('*').order('position'),
    client.from('employees').select('*').order('name'),
    client.from('teams').select('*').order('name'),
    client.from('sales').select('*').order('sale_date', { ascending: false }),
  ]);
  const tables = [
    ['property_categories', pc],
    ['properties', p],
    ['employee_categories', ec],
    ['employees', e],
    ['teams', t],
    ['sales', s],
  ] as const;
  for (const [table, result] of tables) {
    if (result.error) {
      console.error('[getCRM] Supabase query failed', {
        table,
        code: result.error.code,
        message: result.error.message,
      });
      throw new Error('Your workspace could not be loaded. Please try again.');
    }
  }
  return { propertyCategories: pc.data ?? [], properties: p.data ?? [], employeeCategories: ec.data ?? [], employees: e.data ?? [], teams: t.data ?? [], sales: s.data ?? [] };
});

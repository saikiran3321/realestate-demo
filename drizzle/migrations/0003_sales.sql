ALTER TABLE public.properties ADD COLUMN units integer NOT NULL DEFAULT 1;
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  unit_label text NOT NULL DEFAULT '',
  sold_by uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  sale_date date NOT NULL DEFAULT current_date,
  list_price numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  cutoff numeric NOT NULL DEFAULT 0,
  sale_price numeric NOT NULL DEFAULT 0,
  company_share numeric NOT NULL DEFAULT 0,
  split jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO anon, authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open CRM access" ON public.sales FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
COMMENT ON COLUMN public.properties.sale_discount IS 'DEPRECATED: recorded per sale in sales';
COMMENT ON COLUMN public.properties.sold_by IS 'DEPRECATED: recorded per sale in sales';
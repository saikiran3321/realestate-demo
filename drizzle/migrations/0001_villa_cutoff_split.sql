ALTER TABLE public.property_categories ADD COLUMN has_cutoff boolean NOT NULL DEFAULT false;
UPDATE public.property_categories SET has_cutoff = true WHERE lower(name) = 'villa';
ALTER TABLE public.properties ADD COLUMN cutoff numeric NOT NULL DEFAULT 0, ADD COLUMN sale_discount numeric NOT NULL DEFAULT 0, ADD COLUMN sold_by uuid REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.employee_categories ADD COLUMN share_type text NOT NULL DEFAULT 'percentage', ADD COLUMN share_value numeric NOT NULL DEFAULT 0;
ALTER TABLE public.employee_categories ADD CONSTRAINT employee_categories_share_type_check CHECK (share_type IN ('fixed','percentage'));
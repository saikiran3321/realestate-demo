ALTER TABLE public.properties ADD COLUMN cutoff_type text NOT NULL DEFAULT 'fixed', ADD COLUMN shares jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.properties ADD CONSTRAINT properties_cutoff_type_check CHECK (cutoff_type IN ('fixed','percentage'));
COMMENT ON COLUMN public.employee_categories.share_type IS 'DEPRECATED: shares are set per property in properties.shares';
COMMENT ON COLUMN public.employee_categories.share_value IS 'DEPRECATED: shares are set per property in properties.shares';
COMMENT ON COLUMN public.property_categories.has_cutoff IS 'DEPRECATED: cutoff applies to all property types';
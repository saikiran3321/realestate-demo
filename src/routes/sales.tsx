import { createFileRoute } from '@tanstack/react-router';
import { CRMLoading, CRMError, CRMNotFound, crmSearch } from '@/components/crm-page';
import { SalesPage } from '@/components/sales-page';
import { crmQuery, crmHead, sections } from '@/lib/crm';
export const Route = createFileRoute('/sales')({
  validateSearch: crmSearch,
  loader: ({context}) => context.queryClient.ensureQueryData(crmQuery),
  head: () => crmHead(sections['sales'].title),
  pendingComponent: CRMLoading,
  errorComponent: CRMError,
  notFoundComponent: CRMNotFound,
  component: SalesPage,
});

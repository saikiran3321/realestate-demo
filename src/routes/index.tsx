import { createFileRoute } from '@tanstack/react-router';
import { CRMPage, CRMLoading, CRMError, CRMNotFound, crmSearch } from '@/components/crm-page';
import { crmQuery, crmHead, sections } from '@/lib/crm';
export const Route = createFileRoute('/')({
  validateSearch: crmSearch,
  loader: ({context}) => context.queryClient.ensureQueryData(crmQuery),
  head: () => crmHead(sections['property-category'].title),
  pendingComponent: CRMLoading,
  errorComponent: CRMError,
  notFoundComponent: CRMNotFound,
  component: Page,
});
function Page() { return <CRMPage section="property-category"/>; }

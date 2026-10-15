import { createFileRoute } from '@tanstack/react-router';
import { CRMPage, CRMLoading, CRMError, CRMNotFound, crmSearch } from '@/components/crm-page';
import { crmQuery, crmHead, sections } from '@/lib/crm';
export const Route = createFileRoute('/teams')({
  validateSearch: crmSearch,
  loader: ({context}) => context.queryClient.ensureQueryData(crmQuery),
  head: () => crmHead(sections['teams'].title),
  pendingComponent: CRMLoading,
  errorComponent: CRMError,
  notFoundComponent: CRMNotFound,
  component: Page,
});
function Page() { return <CRMPage section="teams"/>; }

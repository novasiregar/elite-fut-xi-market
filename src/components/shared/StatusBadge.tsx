import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  // Order statuses
  CREATED:         { label: 'Created',          className: 'bg-slate-500/20   text-slate-300   border-slate-500/30' },
  WAITING_PAYMENT: { label: 'Awaiting Payment', className: 'bg-yellow-500/20  text-yellow-300  border-yellow-500/30' },
  PAID:            { label: 'Paid',              className: 'bg-blue-500/20    text-blue-300    border-blue-500/30' },
  ESCROW_HOLD:     { label: 'In Escrow',         className: 'bg-purple-500/20  text-purple-300  border-purple-500/30' },
  DELIVERED:       { label: 'Delivered',         className: 'bg-cyan-500/20    text-cyan-300    border-cyan-500/30' },
  COMPLETED:       { label: 'Completed',         className: 'bg-green-500/20   text-green-300   border-green-500/30' },
  DISPUTED:        { label: 'Disputed',          className: 'bg-red-500/20     text-red-300     border-red-500/30' },
  REFUNDED:        { label: 'Refunded',          className: 'bg-orange-500/20  text-orange-300  border-orange-500/30' },
  RELEASED:        { label: 'Released',          className: 'bg-teal-500/20    text-teal-300    border-teal-500/30' },
  CANCELLED:       { label: 'Cancelled',         className: 'bg-gray-500/20    text-gray-300    border-gray-500/30' },
  // KYC
  PENDING:         { label: 'Pending',           className: 'bg-yellow-500/20  text-yellow-300  border-yellow-500/30' },
  APPROVED:        { label: 'Approved',          className: 'bg-green-500/20   text-green-300   border-green-500/30' },
  REJECTED:        { label: 'Rejected',          className: 'bg-red-500/20     text-red-300     border-red-500/30' },
  RESUBMIT:        { label: 'Resubmit',          className: 'bg-orange-500/20  text-orange-300  border-orange-500/30' },
  // Withdraw
  UNDER_REVIEW:    { label: 'Under Review',      className: 'bg-blue-500/20    text-blue-300    border-blue-500/30' },
  PROCESSING:      { label: 'Processing',        className: 'bg-cyan-500/20    text-cyan-300    border-cyan-500/30' },
  // Listing
  ACTIVE:          { label: 'Active',            className: 'bg-green-500/20   text-green-300   border-green-500/30' },
  SOLD:            { label: 'Sold',              className: 'bg-slate-500/20   text-slate-300   border-slate-500/30' },
  ARCHIVED:        { label: 'Archived',          className: 'bg-gray-500/20    text-gray-300    border-gray-500/30' },
  DRAFT:           { label: 'Draft',             className: 'bg-slate-500/20   text-slate-300   border-slate-500/30' },
  SUSPENDED:       { label: 'Suspended',         className: 'bg-red-500/20     text-red-300     border-red-500/30' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
  return (
    <Badge variant="outline" className={cn('status-badge', config.className)}>
      {config.label}
    </Badge>
  );
}

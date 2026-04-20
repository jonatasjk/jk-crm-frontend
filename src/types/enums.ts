export type InvestorStage =
  | 'PROSPECT'
  | 'CONTACTED'
  | 'MEETING'
  | 'DUE_DILIGENCE'
  | 'TERM_SHEET'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export type PartnerStage =
  | 'LEAD'
  | 'QUALIFIED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'ACTIVE'
  | 'INACTIVE';

export type EntityType = 'INVESTOR' | 'PARTNER';
export type EmailStatus = 'PENDING' | 'SENT' | 'FAILED';

export const INVESTOR_STAGES: InvestorStage[] = [
  'PROSPECT',
  'CONTACTED',
  'MEETING',
  'DUE_DILIGENCE',
  'TERM_SHEET',
  'CLOSED_WON',
  'CLOSED_LOST',
];

export const INVESTOR_STAGE_LABELS: Record<InvestorStage, string> = {
  PROSPECT: 'Prospect',
  CONTACTED: 'Contacted',
  MEETING: 'Meeting Scheduled',
  DUE_DILIGENCE: 'Due Diligence',
  TERM_SHEET: 'Term Sheet',
  CLOSED_WON: 'Closed / Won',
  CLOSED_LOST: 'Closed / Lost',
};

export const PARTNER_STAGES: PartnerStage[] = [
  'LEAD',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'ACTIVE',
  'INACTIVE',
];

export const PARTNER_STAGE_LABELS: Record<PartnerStage, string> = {
  LEAD: 'Lead',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal Sent',
  NEGOTIATION: 'Negotiation',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

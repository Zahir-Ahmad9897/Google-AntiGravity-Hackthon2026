export type ActionStatus = 'completed' | 'in_progress' | 'failed' | 'warning';

export interface ActionItem {
  id: string;
  description: string;
  status: ActionStatus;
  timestamp: string;
}

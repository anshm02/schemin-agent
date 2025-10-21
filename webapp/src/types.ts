export interface AutomationCard {
  id: string;
  title: string;
  sources: string;
  extract: string;
  storeTo: string;
  googleFileId?: string;
  googleFileName?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isActive?: boolean;
  lastRun?: string;
}

export interface Tab {
  id: string;
  name: string;
  automations: AutomationCard[];
}


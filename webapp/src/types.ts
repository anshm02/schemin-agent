export interface AutomationCard {
  id: string;
  title: string;
  sources: string;
  extract: string;
  storeTo: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface Tab {
  id: string;
  name: string;
  automations: AutomationCard[];
}


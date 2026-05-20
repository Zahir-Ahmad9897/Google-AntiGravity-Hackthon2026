export type LanguageLabel = 'english' | 'urdu_roman' | 'mixed' | 'unknown';

export interface SocialPost {
  post_id: string;
  text: string;
  platform: string;
  timestamp: string;
  language: LanguageLabel;
  reporter_hash?: string | null;
}

export interface WeatherReport {
  report_id: string;
  district: string;
  rainfall_mm_per_hour: number;
  alert_active: boolean;
  alert_type: string;
  alert_level: number;
  timestamp: string;
}

export interface TrafficReport {
  report_id: string;
  road_name: string;
  speed_kmh: number;
  normal_speed_kmh: number;
  congestion_level: number;
  timestamp: string;
}

export interface ScenarioInput {
  scenario_id: string;
  title: string;
  description: string;
  social_posts: SocialPost[];
  weather: WeatherReport;
  traffic: TrafficReport[];
  expected_escalation: boolean;
  expected_confidence_max?: number | null;
}

export interface IterativeScenarioStep {
  iteration_number: number;
  update_note: string;
  scenario: ScenarioInput;
  approved_context: string[];
  permission_granted: boolean;
}

export interface Scenario {
  scenario_id: string;
  title: string;
  description: string;
  steps: IterativeScenarioStep[];
}

export interface ScenarioWeatherMeta {
  condition: string;
  temperature_c: number;
  rainfall_mm_hr: number;
  wind_kmh: number;
  is_crisis_factor: boolean;
}

export interface ScenarioBeforeState {
  roads_blocked: number;
  vehicles_stranded: number;
  units_deployed: number;
  users_alerted: number;
}

export interface ScenarioAfterState {
  roads_cleared: number;
  vehicles_rerouted: number;
  units_en_route: number;
  users_alerted: number;
}

export interface ScenarioMeta {
  scenario_id: string;
  display_name: string;
  location: string;
  crisis_type: string;
  description: string;
  weather: ScenarioWeatherMeta;
  before_state: ScenarioBeforeState;
  after_state: ScenarioAfterState;
  map_layout: 'g10_grid' | 'peshawar_ring' | 'city_intersection';
}

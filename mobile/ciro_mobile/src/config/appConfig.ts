export const BASE_URLS = {
  androidEmulator: 'http://10.0.2.2:8000',
  iosSimulator: 'https://ciro-995225262970.asia-south1.run.app',
  default: 'https://ciro-995225262970.asia-south1.run.app',
};

export interface LocalScenarioMetadata {
  displayName: string;
  location: string;
  crisisType: string;
  icon: string;
  description: string;
  weather: {
    condition: string;
    temperatureC: number;
    rainfallMmHr: number;
    windKmh: number;
    isCrisisFactor: boolean;
  };
  beforeState: {
    roadsBlocked: number;
    vehiclesStranded: number;
    unitsDeployed: number;
    usersAlerted: number;
  };
  afterState: {
    roadsCleared: number;
    vehiclesRerouted: number;
    unitsEnRoute: number;
    usersAlerted: number;
  };
  mapLayout: 'g10_grid' | 'peshawar_ring' | 'city_intersection';
}

export const SCENARIO_METADATA: Record<string, LocalScenarioMetadata> = {
  g10_urban_flooding: {
    displayName: 'G-10 Urban Flooding',
    location: 'Islamabad, G-10 Sector',
    crisisType: 'Urban Flooding',
    icon: '🌊',
    description: 'Flash flooding in G-10 — vehicles stranded, roads blocked.',
    weather: {
      condition: 'Heavy Rain',
      temperatureC: 24,
      rainfallMmHr: 48,
      windKmh: 32,
      isCrisisFactor: true,
    },
    beforeState: { roadsBlocked: 3, vehiclesStranded: 40, unitsDeployed: 0, usersAlerted: 0 },
    afterState: { roadsCleared: 2, vehiclesRerouted: 35, unitsEnRoute: 2, usersAlerted: 1240 },
    mapLayout: 'g10_grid',
  },
  peshawar_ring_road_blast: {
    displayName: 'Peshawar Ring Road Blast',
    location: 'Peshawar, Ring Road',
    crisisType: 'Road Blast & Blockage',
    icon: '💥',
    description: 'Explosion on Ring Road — full road closure, emergency response needed.',
    weather: {
      condition: 'Partly Cloudy',
      temperatureC: 31,
      rainfallMmHr: 0,
      windKmh: 18,
      isCrisisFactor: false,
    },
    beforeState: { roadsBlocked: 1, vehiclesStranded: 25, unitsDeployed: 0, usersAlerted: 0 },
    afterState: { roadsCleared: 1, vehiclesRerouted: 20, unitsEnRoute: 4, usersAlerted: 890 },
    mapLayout: 'peshawar_ring',
  },
  ambulance_rain_congestion: {
    displayName: 'Ambulance Rain Congestion',
    location: 'Islamabad, City Center',
    crisisType: 'Emergency Vehicle Blocked',
    icon: '🚑',
    description: 'Ambulance stuck in rain-induced congestion — priority corridor needed.',
    weather: {
      condition: 'Thunderstorm',
      temperatureC: 21,
      rainfallMmHr: 62,
      windKmh: 45,
      isCrisisFactor: true,
    },
    beforeState: { roadsBlocked: 2, vehiclesStranded: 60, unitsDeployed: 1, usersAlerted: 0 },
    afterState: { roadsCleared: 1, vehiclesRerouted: 50, unitsEnRoute: 1, usersAlerted: 540 },
    mapLayout: 'city_intersection',
  },
  custom_permission_input: {
    displayName: 'Custom Citizen Report',
    location: 'User supplied location',
    crisisType: 'Detected Crisis',
    icon: '📝',
    description: 'User-approved report processed through the CIRO agent pipeline.',
    weather: {
      condition: 'Simulated Weather',
      temperatureC: 0,
      rainfallMmHr: 8,
      windKmh: 0,
      isCrisisFactor: true,
    },
    beforeState: { roadsBlocked: 1, vehiclesStranded: 24, unitsDeployed: 0, usersAlerted: 0 },
    afterState: { roadsCleared: 1, vehiclesRerouted: 28, unitsEnRoute: 1, usersAlerted: 650 },
    mapLayout: 'g10_grid',
  },
};

export const AGENTS = [
  { id: 1, name: 'CIRO Commander', icon: '🎯' },
  { id: 2, name: 'Weather Risk Agent', icon: '🌧' },
  { id: 3, name: 'Traffic Analysis Agent', icon: '🚦' },
  { id: 4, name: 'Social Signal Agent', icon: '📡' },
  { id: 5, name: 'Verification Agent', icon: '🔍' },
  { id: 6, name: 'Crisis Reasoning Agent', icon: '🧠' },
  { id: 7, name: 'Rescue Planning Agent', icon: '🗺' },
  { id: 8, name: 'Action Execution Agent', icon: '⚡' },
  { id: 9, name: 'Evaluation/Replan Agent', icon: '🔄' },
];

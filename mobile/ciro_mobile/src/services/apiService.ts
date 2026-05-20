import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { BASE_URLS, SCENARIO_METADATA } from '../config/appConfig';
import { PipelineResult } from '../models/PipelineResult';
import { Scenario } from '../models/Scenario';
import { ScenarioMeta } from '../models/ScenarioMeta';

const STORAGE_KEY = 'ciro.baseUrl';
const LEGACY_STORAGE_KEY = 'customBaseUrl';

export interface CustomPipelineRequest {
  text: string;
  source: string;
  location: string;
  permission_granted: boolean;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export class CiroApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'CiroApiError';
    this.status = status;
  }
}

const normalizeError = (error: unknown): CiroApiError => {
  if (error instanceof CiroApiError) {
    return error;
  }

  const axiosError = error as AxiosError<{ detail?: string }>;
  const status = axiosError.response?.status;
  const detail = axiosError.response?.data?.detail;
  const message = detail || axiosError.message || 'CIRO backend request failed';
  return new CiroApiError(message, status);
};

export const getBaseUrl = async () => {
  const current = await AsyncStorage.getItem(STORAGE_KEY);
  if (current) {
    return current;
  }

  const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    return legacy;
  }
  if (Platform.OS === 'web' || Platform.OS === 'ios') {
    return BASE_URLS.iosSimulator;
  }
  return BASE_URLS.default;
};

export const setBaseUrl = async (baseUrl: string) => {
  await AsyncStorage.setItem(STORAGE_KEY, baseUrl.trim());
  await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
};

export const clearBaseUrl = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
  await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
};

const createClient = async (timeout = 10000): Promise<AxiosInstance> => {
  const baseURL = await getBaseUrl();
  const client = axios.create({ baseURL, timeout });

  client.interceptors.request.use((config) => {
    if (__DEV__) {
      console.log(`[CIRO API] ${String(config.method).toUpperCase()} ${baseURL}${config.url}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      if (__DEV__) {
        console.log(`[CIRO API] ${response.status} ${response.config.url}`);
      }
      return response;
    },
    (error) => {
      throw normalizeError(error);
    },
  );

  return client;
};

const localMetaToApiMeta = (scenarioId: string): ScenarioMeta => {
  const meta = SCENARIO_METADATA[scenarioId];
  if (!meta) {
    throw new CiroApiError(`Scenario metadata missing for ${scenarioId}`);
  }

  return {
    scenario_id: scenarioId,
    display_name: meta.displayName,
    location: meta.location,
    crisis_type: meta.crisisType,
    description: meta.description,
    weather: {
      condition: meta.weather.condition,
      temperature_c: meta.weather.temperatureC,
      rainfall_mm_hr: meta.weather.rainfallMmHr,
      wind_kmh: meta.weather.windKmh,
      is_crisis_factor: meta.weather.isCrisisFactor,
    },
    before_state: {
      roads_blocked: meta.beforeState.roadsBlocked,
      vehicles_stranded: meta.beforeState.vehiclesStranded,
      units_deployed: meta.beforeState.unitsDeployed,
      users_alerted: meta.beforeState.usersAlerted,
    },
    after_state: {
      roads_cleared: meta.afterState.roadsCleared,
      vehicles_rerouted: meta.afterState.vehiclesRerouted,
      units_en_route: meta.afterState.unitsEnRoute,
      users_alerted: meta.afterState.usersAlerted,
    },
    map_layout: meta.mapLayout,
  };
};

export const apiService = {
  async getScenarios(): Promise<Scenario[]> {
    try {
      const client = await createClient();
      const response = await client.get<Scenario[]>('/api/iterative/scenarios');
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async runPipeline(scenarioId: string): Promise<PipelineResult> {
    try {
      const client = await createClient(45000);
      const response = await client.post<PipelineResult>('/api/iterative/run', {
        scenario_id: scenarioId,
      });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async runCustomPipeline(request: CustomPipelineRequest): Promise<PipelineResult> {
    try {
      const client = await createClient(45000);
      const response = await client.post<PipelineResult>('/api/iterative/run-custom', request);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getScenarioMeta(scenarioId: string): Promise<ScenarioMeta> {
    try {
      const client = await createClient();
      const response = await client.get<ScenarioMeta>(`/api/scenario/${scenarioId}/meta`);
      return response.data;
    } catch (error) {
      if (__DEV__) {
        console.warn(`[CIRO API] Falling back to local metadata for ${scenarioId}`, error);
      }
      return localMetaToApiMeta(scenarioId);
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      const client = await createClient();
      const response = await client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  },

  async getArtifact(filename: string): Promise<string> {
    try {
      const client = await createClient();
      const response = await client.get<string>(`/api/artifacts/${filename}`, {
        responseType: 'text',
      });
      return typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  getBaseUrl,
  setBaseUrl,
  clearBaseUrl,
};

import { create } from 'zustand';
import { Scenario } from '../models/Scenario';
import { apiService } from '../services/apiService';

interface ScenarioStoreState {
  scenarios: Scenario[];
  selectedScenarioId: string | null;
  loading: boolean;
  error: string | null;
  loadScenarios: () => Promise<void>;
  selectScenario: (id: string) => void;
}

export const useScenarioStore = create<ScenarioStoreState>((set) => ({
  scenarios: [],
  selectedScenarioId: null,
  loading: false,
  error: null,

  loadScenarios: async () => {
    set({ loading: true, error: null });
    try {
      const scenarios = await apiService.getScenarios();
      set({ scenarios, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load scenarios';
      set({ error: message, loading: false });
    }
  },

  selectScenario: (id: string) => set({ selectedScenarioId: id }),
}));

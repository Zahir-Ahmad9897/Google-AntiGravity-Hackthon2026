import { create } from 'zustand';
import { PipelineResult } from '../models/PipelineResult';
import { apiService, CustomPipelineRequest } from '../services/apiService';

export type PipelineStatus = 'idle' | 'loading' | 'success' | 'error';
export type IterationStatus = 'pending' | 'running' | 'done';

interface PipelineStoreState {
  status: PipelineStatus;
  result: PipelineResult | null;
  error: string | null;
  animationStep: number;
  iterationStatus: IterationStatus[];
  logLines: string[];
  runPipeline: (scenarioId: string) => Promise<void>;
  runCustomPipeline: (request: CustomPipelineRequest) => Promise<void>;
  setAnimationStep: (step: number) => void;
  advanceAnimation: () => void;
  addLogLine: (line: string) => void;
  updateIterationStatus: (index: number, status: IterationStatus) => void;
  reset: () => void;
}

const initialIterationStatus: IterationStatus[] = ['pending', 'pending', 'pending'];

export const usePipelineStore = create<PipelineStoreState>((set) => ({
  status: 'idle',
  result: null,
  error: null,
  animationStep: 0,
  iterationStatus: initialIterationStatus,
  logLines: [],

  runPipeline: async (scenarioId: string) => {
    set({
      status: 'loading',
      result: null,
      error: null,
      animationStep: 0,
      iterationStatus: ['running', 'pending', 'pending'],
      logLines: [],
    });

    try {
      const result = await apiService.runPipeline(scenarioId);
      set({ status: 'success', result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pipeline execution failed';
      set({ status: 'error', error: message });
    }
  },

  runCustomPipeline: async (request: CustomPipelineRequest) => {
    set({
      status: 'loading',
      result: null,
      error: null,
      animationStep: 0,
      iterationStatus: ['running', 'pending', 'pending'],
      logLines: [],
    });

    try {
      const result = await apiService.runCustomPipeline(request);
      set({ status: 'success', result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Custom pipeline execution failed';
      set({ status: 'error', error: message });
    }
  },

  setAnimationStep: (step: number) => set({ animationStep: step }),
  advanceAnimation: () => set((state) => ({ animationStep: Math.min(9, state.animationStep + 1) })),
  addLogLine: (line: string) => set((state) => ({ logLines: [...state.logLines, line] })),
  updateIterationStatus: (index: number, status: IterationStatus) => set((state) => {
    const next = [...state.iterationStatus];
    next[index] = status;
    return { iterationStatus: next };
  }),
  reset: () => set({
    status: 'idle',
    result: null,
    error: null,
    animationStep: 0,
    iterationStatus: initialIterationStatus,
    logLines: [],
  }),
}));

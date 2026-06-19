import { create } from 'zustand';
import type { Agent } from '@/types';
import { agentAPI } from '@/services/agent';

interface AgentState {
  agents: Agent[];
  loading: boolean;
  loadAgents: (userId: string) => Promise<void>;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<void>;
  replaceAgent: (agent: Agent) => void;
  deleteAgent: (id: string) => Promise<void>;
  duplicateAgent: (id: string) => Promise<Agent | null>;
  touchAgent: (id: string) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  loading: false,

  loadAgents: async (userId) => {
    set({ loading: true });
    const agents = await agentAPI.list(userId);
    set({ agents, loading: false });
  },

  addAgent: (agent) => {
    set({ agents: [agent, ...get().agents] });
  },

  replaceAgent: (agent) => {
    set({
      agents: get().agents.map((a) => (a.id === agent.id ? agent : a)),
    });
  },

  updateAgent: async (id, data) => {
    await agentAPI.update(id, data);
    set({
      agents: get().agents.map((a) => (a.id === id ? { ...a, ...data } : a)),
    });
  },

  deleteAgent: async (id) => {
    await agentAPI.delete(id);
    set({ agents: get().agents.filter((a) => a.id !== id) });
  },

  duplicateAgent: async (id) => {
    const copy = await agentAPI.duplicate(id);
    if (copy) {
      set({ agents: [copy, ...get().agents] });
    }
    return copy;
  },

  touchAgent: async (id) => {
    await agentAPI.touch(id);
    set({
      agents: get()
        .agents.map((a) => (a.id === id ? { ...a, lastUsedAt: Date.now() } : a))
        .sort((a, b) => b.lastUsedAt - a.lastUsedAt),
    });
  },
}));

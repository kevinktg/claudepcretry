import { createStore } from 'zustand/vanilla';
import { createDispatch } from 'zutron/main';
import { AppState } from './types';
import { runAgent } from './runAgent';

export const store = createStore<AppState>((set, get) => ({
  instructions: 'find flights from seattle to sf for next tuesday to thursday',
  fullyAuto: true,
  running: false,
  error: null,
  runHistory: [],
  RUN_AGENT: async () => {
    const state = get();
    if (!state.instructions || state.running) return;
    
    // Add initial message to history
    set({ 
      running: true,
      runHistory: [{
        role: 'user',
        content: state.instructions
      }]
    });
    
    await runAgent(set, get);
  },
  STOP_RUN: () => set({ running: false }),
  SET_INSTRUCTIONS: (instructions) => set({ instructions }),
  SET_FULLY_AUTO: (fullyAuto) => {
    set({ fullyAuto: fullyAuto ?? true });
  },
  CLEAR_HISTORY: () => set({ runHistory: [] }),
  SEND_MESSAGE: async () => {
    const state = get();
    if (!state.instructions || state.running) return;
    
    // Check if the last message was from the assistant and had a tool use
    const lastMessage = state.runHistory[state.runHistory.length - 1];
    const needsToolResult = 
      lastMessage?.role === 'assistant' &&
      Array.isArray(lastMessage.content) &&
      lastMessage.content.some((c) => c.type === 'tool_use');
    
    // Add the new message to history
    set({ 
      running: true,
      runHistory: [
        ...(state.runHistory.length > 0 ? state.runHistory : []),
        ...(needsToolResult ? [{
          role: 'user' as const,
          content: [{
            type: 'tool_result' as const,
            tool_use_id: lastMessage.content[lastMessage.content.length - 1].id,
            content: [
              {
                type: 'text' as const,
                text: 'Action completed successfully',
              },
            ],
          }],
        }] : []),
        {
          role: 'user' as const,
          content: state.instructions,
        },
      ],
    });
    
    await runAgent(set, get);
  },
}));

export const dispatch = createDispatch(store);

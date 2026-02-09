import React, { createContext, useContext, useReducer, useEffect } from "react";

export interface TimeEntry {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in milliseconds
  description?: string;
  isActive: boolean;
}

export interface TimeTrackerState {
  entries: TimeEntry[];
  activeEntry: TimeEntry | null;
  totalTimeToday: number;
  isTracking: boolean;
}

type TimeTrackerAction =
  | {
      type: "START_TRACKING";
      payload: { taskId: string; description?: string };
    }
  | { type: "STOP_TRACKING" }
  | { type: "PAUSE_TRACKING" }
  | { type: "RESUME_TRACKING" }
  | { type: "ADD_ENTRY"; payload: TimeEntry }
  | { type: "UPDATE_ACTIVE_ENTRY"; payload: Partial<TimeEntry> }
  | { type: "LOAD_ENTRIES"; payload: TimeEntry[] }
  | { type: "DELETE_ENTRY"; payload: string };

const initialState: TimeTrackerState = {
  entries: [],
  activeEntry: null,
  totalTimeToday: 0,
  isTracking: false,
};

function timeTrackerReducer(
  state: TimeTrackerState,
  action: TimeTrackerAction,
): TimeTrackerState {
  switch (action.type) {
    case "START_TRACKING": {
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        taskId: action.payload.taskId,
        startTime: new Date(),
        duration: 0,
        description: action.payload.description,
        isActive: true,
      };
      return {
        ...state,
        activeEntry: newEntry,
        isTracking: true,
      };
    }
    case "STOP_TRACKING": {
      if (!state.activeEntry) return state;

      const endTime = new Date();
      const duration =
        endTime.getTime() - state.activeEntry.startTime.getTime();
      const completedEntry: TimeEntry = {
        ...state.activeEntry,
        endTime,
        duration,
        isActive: false,
      };

      return {
        ...state,
        entries: [...state.entries, completedEntry],
        activeEntry: null,
        isTracking: false,
        totalTimeToday: state.totalTimeToday + duration,
      };
    }
    case "PAUSE_TRACKING": {
      if (!state.activeEntry) return state;

      return {
        ...state,
        isTracking: false,
      };
    }
    case "RESUME_TRACKING": {
      if (!state.activeEntry) return state;

      return {
        ...state,
        isTracking: true,
      };
    }
    case "ADD_ENTRY": {
      return {
        ...state,
        entries: [...state.entries, action.payload],
        totalTimeToday: state.totalTimeToday + action.payload.duration,
      };
    }
    case "UPDATE_ACTIVE_ENTRY": {
      if (!state.activeEntry) return state;

      return {
        ...state,
        activeEntry: { ...state.activeEntry, ...action.payload },
      };
    }
    case "LOAD_ENTRIES": {
      const today = new Date().toDateString();
      const todayEntries = action.payload.filter(
        (entry) => new Date(entry.startTime).toDateString() === today,
      );
      const totalTime = todayEntries.reduce(
        (sum, entry) => sum + entry.duration,
        0,
      );

      return {
        ...state,
        entries: action.payload,
        totalTimeToday: totalTime,
      };
    }
    case "DELETE_ENTRY": {
      const entryToDelete = state.entries.find(
        (entry) => entry.id === action.payload,
      );
      const newEntries = state.entries.filter(
        (entry) => entry.id !== action.payload,
      );

      return {
        ...state,
        entries: newEntries,
        totalTimeToday: entryToDelete
          ? state.totalTimeToday - entryToDelete.duration
          : state.totalTimeToday,
      };
    }
    default:
      return state;
  }
}

const TimeTrackerContext = createContext<{
  state: TimeTrackerState;
  dispatch: React.Dispatch<TimeTrackerAction>;
  startTracking: (taskId: string, description?: string) => void;
  stopTracking: () => void;
  pauseTracking: () => void;
  resumeTracking: () => void;
  getTaskTotalTime: (taskId: string) => number;
  formatDuration: (milliseconds: number) => string;
  getCurrentDuration: () => number;
} | null>(null);

export function TimeTrackerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(timeTrackerReducer, initialState);

  // Load saved data on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem("timeTrackerEntries");
    if (savedEntries) {
      try {
        const entries = JSON.parse(savedEntries).map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
        }));
        dispatch({ type: "LOAD_ENTRIES", payload: entries });
      } catch (error) {
        console.error("Failed to load time tracker entries:", error);
      }
    }
  }, []);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("timeTrackerEntries", JSON.stringify(state.entries));
  }, [state.entries]);

  // Update active entry duration every second
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.isTracking && state.activeEntry) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = now.getTime() - state.activeEntry!.startTime.getTime();
        dispatch({
          type: "UPDATE_ACTIVE_ENTRY",
          payload: { duration },
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isTracking, state.activeEntry]);

  const startTracking = (taskId: string, description?: string) => {
    if (state.activeEntry) {
      stopTracking(); // Stop current tracking before starting new one
    }
    dispatch({ type: "START_TRACKING", payload: { taskId, description } });
  };

  const stopTracking = () => {
    dispatch({ type: "STOP_TRACKING" });
  };

  const pauseTracking = () => {
    dispatch({ type: "PAUSE_TRACKING" });
  };

  const resumeTracking = () => {
    dispatch({ type: "RESUME_TRACKING" });
  };

  const getTaskTotalTime = (taskId: string) => {
    return state.entries
      .filter((entry) => entry.taskId === taskId)
      .reduce((total, entry) => total + entry.duration, 0);
  };

  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getCurrentDuration = () => {
    if (!state.activeEntry || !state.isTracking) return 0;
    return new Date().getTime() - state.activeEntry.startTime.getTime();
  };

  return (
    <TimeTrackerContext.Provider
      value={{
        state,
        dispatch,
        startTracking,
        stopTracking,
        pauseTracking,
        resumeTracking,
        getTaskTotalTime,
        formatDuration,
        getCurrentDuration,
      }}
    >
      {children}
    </TimeTrackerContext.Provider>
  );
}

export function useTimeTracker() {
  const context = useContext(TimeTrackerContext);
  if (!context) {
    throw new Error("useTimeTracker must be used within a TimeTrackerProvider");
  }
  return context;
}

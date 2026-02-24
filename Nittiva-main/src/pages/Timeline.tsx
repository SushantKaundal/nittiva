import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
import { useTask } from "@/context/TaskContext";
import { useProject } from "@/context/ProjectContext";
import { apiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Timeline() {
  const { tasks, refresh } = useTask();
  const { projects } = useProject();
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "month" | "quarter">("month");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredTasks = selectedProject
    ? tasks.filter(t => String(t.projectId) === selectedProject)
    : tasks;

  const tasksWithDates = filteredTasks
    .filter(t => t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "in-progress":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "review":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  return (
    <div className="h-full bg-dashboard-bg p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-normal text-white">Timeline View</h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedProject || ""}
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className="bg-dashboard-surface border border-dashboard-border text-white px-4 py-2 rounded"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            {(["week", "month", "quarter"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded transition-colors ${
                  viewMode === mode
                    ? "bg-accent text-black"
                    : "bg-dashboard-surface text-white border border-dashboard-border hover:bg-dashboard-bg"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tasksWithDates.length === 0 ? (
        <div className="bg-dashboard-surface border border-dashboard-border rounded-lg p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No tasks with due dates found.</p>
        </div>
      ) : (
        <div className="bg-dashboard-surface border border-dashboard-border rounded-lg p-6">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-dashboard-border" />
            
            {tasksWithDates.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex items-start gap-4 mb-6 pl-8"
              >
                <div className="absolute left-6 w-4 h-4 bg-accent rounded-full border-4 border-dashboard-bg z-10" />
                <div className="flex-1 bg-dashboard-bg border border-dashboard-border rounded-lg p-4 hover:border-accent/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">{task.name}</h3>
                    <span className="text-xs text-gray-400">
                      {new Date(task.dueDate!).toLocaleDateString()}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Calendar className="w-3 h-3" />
                      Due: {new Date(task.dueDate!).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded border ${getStatusColor(task.status)}`}>
                      {task.status.replace("-", " ")}
                    </span>
                    {task.priority && (
                      <span className="text-gray-500 capitalize">
                        Priority: {task.priority}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

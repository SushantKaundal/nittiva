import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, Target, CheckCircle2, Plus, ArrowLeft } from "lucide-react";
import { useTask } from "@/context/TaskContext";
import { useProject } from "@/context/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  goal: string;
  projectId: string;
}

export default function Sprint() {
  const { tasks, refresh } = useTask();
  const { projects } = useProject();
  const { toast } = useToast();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null);
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [sprintForm, setSprintForm] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
    projectId: "",
  });

  useEffect(() => {
    refresh();
    // Load sprints from localStorage
    const savedSprints = localStorage.getItem("sprints");
    if (savedSprints) {
      try {
        setSprints(JSON.parse(savedSprints));
      } catch (e) {
        console.error("Failed to load sprints:", e);
      }
    }
  }, [refresh]);

  const handleCreateSprint = () => {
    if (!sprintForm.name || !sprintForm.startDate || !sprintForm.endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Start Date, End Date).",
        variant: "destructive",
      });
      return;
    }

    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      name: sprintForm.name,
      goal: sprintForm.goal || "Complete sprint tasks",
      startDate: sprintForm.startDate,
      endDate: sprintForm.endDate,
      projectId: sprintForm.projectId || (projects.length > 0 ? String(projects[0].id) : ""),
    };

    const updatedSprints = [...sprints, newSprint];
    setSprints(updatedSprints);
    localStorage.setItem("sprints", JSON.stringify(updatedSprints));
    setSelectedSprint(newSprint.id);
    setIsCreatingSprint(false);
    setSprintForm({
      name: "",
      goal: "",
      startDate: "",
      endDate: "",
      projectId: "",
    });

    toast({
      title: "Sprint Created",
      description: `Sprint "${newSprint.name}" has been created successfully.`,
    });
  };

  const sprintTasks = selectedSprint
    ? tasks.filter(t => (t.customFields as any)?.sprint_id === selectedSprint)
    : [];

  const completedTasks = sprintTasks.filter(t => t.status === "completed").length;
  const totalStoryPoints = sprintTasks.reduce((sum, t) => sum + ((t.customFields as any)?.story_points || 0), 0);
  const completedStoryPoints = sprintTasks
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + ((t.customFields as any)?.story_points || 0), 0);

  const velocity = totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0;

  return (
    <div className="h-full bg-dashboard-bg p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-normal text-white">Sprint View</h1>
        <Button
          onClick={() => setIsCreatingSprint(true)}
          className="bg-accent text-black hover:bg-accent/80 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Sprint
        </Button>
      </div>

      {selectedSprint ? (
        <div className="space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setSelectedSprint(null)}
            className="text-gray-400 hover:text-white mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sprints
          </Button>

          {/* Sprint header */}
          <div className="bg-dashboard-surface border border-dashboard-border rounded-lg p-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Sprint Goal</div>
                <div className="text-white font-medium">
                  {sprints.find(s => s.id === selectedSprint)?.goal || "Complete sprint tasks"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Progress</div>
                <div className="text-white font-medium">
                  {completedTasks} / {sprintTasks.length} tasks
                </div>
                <div className="w-full bg-dashboard-bg rounded-full h-2 mt-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all"
                    style={{ width: `${sprintTasks.length > 0 ? (completedTasks / sprintTasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Story Points</div>
                <div className="text-white font-medium">
                  {completedStoryPoints} / {totalStoryPoints} SP
                </div>
                <div className="w-full bg-dashboard-bg rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${totalStoryPoints > 0 ? (completedStoryPoints / totalStoryPoints) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Velocity</div>
                <div className="text-white font-medium">{velocity}%</div>
              </div>
            </div>
          </div>

          {/* Sprint tasks by status */}
          <div className="grid grid-cols-4 gap-4">
            {["to-do", "in-progress", "review", "completed"].map(status => {
              const statusTasks = sprintTasks.filter(t => t.status === status);
              return (
                <div key={status} className="bg-dashboard-surface border border-dashboard-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium capitalize">{status.replace("-", " ")}</h3>
                    <Badge variant="secondary" className="bg-dashboard-bg text-gray-400">
                      {statusTasks.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {statusTasks.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No tasks</p>
                    ) : (
                      statusTasks.map(task => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-dashboard-bg border border-dashboard-border rounded p-3 hover:border-accent/50 transition-colors"
                        >
                          <div className="text-white text-sm mb-1 font-medium">{task.name}</div>
                          {(task.customFields as any)?.story_points && (
                            <div className="text-xs text-gray-400 mb-2">
                              {(task.customFields as any).story_points} SP
                            </div>
                          )}
                          {task.assigneeIds && task.assigneeIds.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <Users className="w-3 h-3 text-gray-500" />
                              <span className="text-xs text-gray-500">{task.assigneeIds.length} assignee(s)</span>
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : sprints.length > 0 ? (
        <div className="bg-dashboard-surface border border-dashboard-border rounded-lg p-6">
          <h2 className="text-xl font-medium text-white mb-4">Select a Sprint</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sprints.map((sprint) => (
              <motion.div
                key={sprint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedSprint(sprint.id)}
                className="bg-dashboard-bg border border-dashboard-border rounded-lg p-4 cursor-pointer hover:border-accent/50 transition-colors"
              >
                <h3 className="text-white font-medium mb-2">{sprint.name}</h3>
                <p className="text-sm text-gray-400 mb-2">{sprint.goal}</p>
                <div className="text-xs text-gray-500">
                  {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-dashboard-surface border border-dashboard-border rounded-lg p-12 text-center">
          <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No sprint selected.</p>
          <p className="text-sm text-gray-500 mb-6">Create or select a sprint to view tasks and track progress.</p>
          <Button
            onClick={() => setIsCreatingSprint(true)}
            className="bg-accent text-black hover:bg-accent/80"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Sprint
          </Button>
        </div>
      )}

      {/* Create Sprint Dialog */}
      <Dialog open={isCreatingSprint} onOpenChange={setIsCreatingSprint}>
        <DialogContent className="bg-dashboard-surface border-dashboard-border text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Sprint</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new sprint to organize and track your tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="sprint-name" className="text-gray-300">
                Sprint Name *
              </Label>
              <Input
                id="sprint-name"
                placeholder="Sprint 1"
                value={sprintForm.name}
                onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
                className="bg-dashboard-bg border-dashboard-border text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sprint-goal" className="text-gray-300">
                Sprint Goal
              </Label>
              <Input
                id="sprint-goal"
                placeholder="Complete payment integration"
                value={sprintForm.goal}
                onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })}
                className="bg-dashboard-bg border-dashboard-border text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sprint-project" className="text-gray-300">
                Project
              </Label>
              <select
                id="sprint-project"
                value={sprintForm.projectId}
                onChange={(e) => setSprintForm({ ...sprintForm, projectId: e.target.value })}
                className="w-full bg-dashboard-bg border border-dashboard-border text-white rounded px-3 py-2 mt-1"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sprint-start" className="text-gray-300">
                  Start Date *
                </Label>
                <Input
                  id="sprint-start"
                  type="date"
                  value={sprintForm.startDate}
                  onChange={(e) => setSprintForm({ ...sprintForm, startDate: e.target.value })}
                  className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sprint-end" className="text-gray-300">
                  End Date *
                </Label>
                <Input
                  id="sprint-end"
                  type="date"
                  value={sprintForm.endDate}
                  onChange={(e) => setSprintForm({ ...sprintForm, endDate: e.target.value })}
                  className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreatingSprint(false);
                setSprintForm({
                  name: "",
                  goal: "",
                  startDate: "",
                  endDate: "",
                  projectId: "",
                });
              }}
              className="border-dashboard-border text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSprint}
              className="bg-accent text-black hover:bg-accent/80"
            >
              Create Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

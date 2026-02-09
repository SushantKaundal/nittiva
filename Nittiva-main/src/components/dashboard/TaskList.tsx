import React, { useState, useRef, useCallback } from "react";
import { motion, Reorder } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/context/ProjectContext";
import { useUser } from "@/context/UserContext";
import { useTask } from "@/context/TaskContext";
import { apiService } from "@/lib/api";
import {
  GripVertical,
  Edit2,
  Check,
  X,
  Calendar,
  User,
  Clock,
  MoreHorizontal,
  ChevronDown,
  Plus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TaskTimeTracker } from "@/components/ui/task-time-tracker";
import { FieldCreator } from "@/components/ui/field-creator";
import { FieldRenderer } from "@/components/ui/field-renderer";
import { CustomField, TaskWithCustomFields } from "@/types/fieldTypes";
import { EmptyTaskList } from "@/components/dashboard/EmptyTaskList";



type Task = TaskWithCustomFields;

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-orange-500",
  low: "bg-gray-500",
};

const priorityLabels = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface Column {
  id: string;
  label: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  isCustom?: boolean;
  fieldType?: string;
  resizable?: boolean;
}

const defaultColumns: Column[] = [
  {
    id: "name",
    label: "Task name",
    width: 300,
    minWidth: 200,
    maxWidth: 500,
    sortable: false,
    resizable: true,
  },
  {
    id: "assignee",
    label: "Assignee",
    width: 160,
    minWidth: 120,
    maxWidth: 300,
    sortable: true,
    resizable: true,
  },
  {
    id: "dueDate",
    label: "Due date",
    width: 120,
    minWidth: 100,
    maxWidth: 200,
    sortable: true,
    resizable: true,
  },
  {
    id: "priority",
    label: "Priority",
    width: 100,
    minWidth: 80,
    maxWidth: 150,
    sortable: true,
    resizable: true,
  },
  {
    id: "status",
    label: "Status",
    width: 120,
    minWidth: 100,
    maxWidth: 180,
    sortable: true,
    resizable: true,
  },
  {
    id: "timeTracked",
    label: "Time tracked",
    width: 150,
    minWidth: 120,
    maxWidth: 200,
    sortable: true,
    resizable: true,
  },
  {
    id: "progress",
    label: "Progress",
    width: 150,
    minWidth: 100,
    maxWidth: 250,
    sortable: true,
    resizable: true,
  },
  // Sample custom fields
  {
    id: "status-field",
    label: "Status",
    width: 120,
    minWidth: 100,
    maxWidth: 200,
    sortable: true,
    isCustom: true,
    fieldType: "dropdown",
    resizable: true,
  },
  {
    id: "budget-field",
    label: "Budget",
    width: 100,
    minWidth: 80,
    maxWidth: 150,
    sortable: true,
    isCustom: true,
    fieldType: "money",
    resizable: true,
  },
  {
    id: "rating-field",
    label: "Priority Rating",
    width: 140,
    minWidth: 120,
    maxWidth: 200,
    sortable: true,
    isCustom: true,
    fieldType: "rating",
    resizable: true,
  },
  { id: "actions", label: "", width: 80, sortable: false, resizable: false },
];

export function TaskList() {
  const navigate = useNavigate();
  const creatingTaskRef = useRef(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const { currentProject } = useProject();
  const { users, getUserById } = useUser();
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [userMap, setUserMap] = React.useState<Record<string, any>>({});
  const [loadingUsers, setLoadingUsers] = useState(true); 
  const {
  tasks,
  setTasks,
  customFields,
  setCustomFields,
  addTask,
  updateTask,
  getTasksForProject,
  setTaskAssignees,
   refresh,
} = useTask();

  const currentUser = React.useMemo(() => apiService.getCurrentUser(), []);
  // Get tasks for current project
  const projectTasks = currentProject
  ? getTasksForProject(String(currentProject.id))
  : [];

  console.log("CURECT PROIEJCT", currentProject);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<Task>>({});
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [editingAssignee, setEditingAssignee] = useState<number | null>(null);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartWidth, setDragStartWidth] = useState<number>(0);
  const tableRef = useRef<HTMLDivElement>(null);
  const [isFieldCreatorOpen, setIsFieldCreatorOpen] = useState(false);
  const [editingField, setEditingField] = useState<{
    taskId: number;
    fieldId: string;
  } | null>(null);

  const startEditing = (task: Task) => {
    setEditingTask(task.id);
    setEditValues(task);
  };

  const saveEditing = () => {
    if (editingTask && editValues) {
      updateTask(editingTask, editValues);
    }
    setEditingTask(null);
    setEditValues({});
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditValues({});
  };

  const updateEditValue = (field: keyof Task, value: any) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

console.log("project tasks", projectTasks);
const toggleAssignee = (taskId: number, assigneeId: string) => {
  setTasks(prev =>
    prev.map(task => {
      if (task.id === taskId) {
        const current = task.assigneeIds || [];
        const newAssignees = current.includes(assigneeId)
          ? current.filter(id => id !== assigneeId)
          : [...current, assigneeId];
        return { ...task, assigneeIds: newAssignees }; // only local update
      }
      return task;
    })
  );
};

React.useEffect(() => {
  if (currentProject?.id) {
    refresh(String(currentProject.id));
  }
}, [currentProject?.id, refresh]);


const addNewTask = async () => {


   if (creatingTaskRef.current) return;       // hard guard
    creatingTaskRef.current = true;
    setCreatingTask(true);


   if (!currentProject?.id) {
       alert("Select a project first.");
      creatingTaskRef.current = false;
      setCreatingTask(false);
      return;
     }
  const newTask = {
    name: "New Task",
    assigneeId: "",
    assigneeIds: [],
    dueDate: "",
    priority: "medium" as const,
    progress: 0,
    status: "to-do" as const,
    customFields: {},
    projectId: String(currentProject.id),
  };
  const created = await addTask(newTask, String(currentProject.id));
  if (created) {
    setEditingTask(created.id); // ← use real backend id
    setEditValues({ ...newTask, id: created.id });
  }
  creatingTaskRef.current = false;
  setCreatingTask(false);
};


  const handleCreateField = (field: CustomField) => {
    setCustomFields([...customFields, field]);

    // Add the new column
    const newColumn: Column = {
      id: field.id,
      label: field.name,
      width: field.width || 150,
      sortable: true,
      isCustom: true,
      fieldType: field.type,
    };

    // Insert before actions column
    const newColumns = [...columns];
    const actionsIndex = newColumns.findIndex((col) => col.id === "actions");
    newColumns.splice(actionsIndex, 0, newColumn);
    setColumns(newColumns);
  };

  const handleCustomFieldChange = (
    taskId: number,
    fieldId: string,
    value: any,
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      updateTask(taskId, {
        customFields: {
          ...task.customFields,
          [fieldId]: value,
        },
      });
    }
  };
React.useEffect(() => {
  const loadUsers = async () => {
    try {
      const res = await apiService.getUsers();
      const all = Array.isArray(res.data) ? res.data : res.data?.results ?? [];

      // keep a map of ALL users for rendering avatars etc.
      const map: Record<string, any> = {};
      for (const u of all) map[String(u.id)] = u;
      setUserMap(map);

      // picker list: hide the logged-in admin user
      const isAdmin =
        String(currentUser?.role || "").toLowerCase() === "admin" ||
        !!currentUser?.is_staff ||
        !!currentUser?.is_superuser;

      const pickable = isAdmin
        ? all.filter((u: any) => String(u.id) !== String(currentUser?.id))
        : all;

      setDbUsers(pickable);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };
  loadUsers();
}, [currentUser]);




console.log(dbUsers,"DB");

  const removeCustomField = (fieldId: string) => {
    setCustomFields(customFields.filter((field) => field.id !== fieldId));
    setColumns(columns.filter((col) => col.id !== fieldId));

    // Remove field data from all tasks
    tasks.forEach((task) => {
      const newCustomFields = Object.fromEntries(
        Object.entries(task.customFields || {}).filter(
          ([key]) => key !== fieldId,
        ),
      );
      updateTask(task.id, { customFields: newCustomFields });
    });
  };

  const handleColumnResize = useCallback(
    (columnId: string, newWidth: number) => {
      setColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.id === columnId) {
            const minWidth = col.minWidth || 50;
            const maxWidth = col.maxWidth || 1000;
            return {
              ...col,
              width: Math.max(minWidth, Math.min(maxWidth, newWidth)),
            };
          }
          return col;
        }),
      );
    },
    [],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, columnId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const column = columns.find((col) => col.id === columnId);
      if (!column?.resizable) return;

      setResizingColumn(columnId);
      setDragStartX(e.clientX);
      setDragStartWidth(column.width);
    },
    [columns],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingColumn) return;

      const deltaX = e.clientX - dragStartX;
      const newWidth = dragStartWidth + deltaX;
      handleColumnResize(resizingColumn, newWidth);
    },
    [resizingColumn, dragStartX, dragStartWidth, handleColumnResize],
  );

  const handleMouseUp = useCallback(() => {
    setResizingColumn(null);
    setDragStartX(0);
    setDragStartWidth(0);
  }, []);

  React.useEffect(() => {
    if (resizingColumn) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [resizingColumn, handleMouseMove, handleMouseUp]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-card border border-dashboard-border rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-dashboard-surface border-b border-dashboard-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronDown className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              <span className="text-white font-medium">
                {currentProject?.name || "Task List"}
              </span>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-gray-600 text-white text-xs"
                >
                  To Do:{" "}
                  {projectTasks.filter((t) => t.status === "to-do").length}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-orange-600 text-white text-xs"
                >
                  In Progress:{" "}
                  {
                    projectTasks.filter((t) => t.status === "in-progress")
                      .length
                  }
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-green-600 text-white text-xs"
                >
                  Completed:{" "}
                  {projectTasks.filter((t) => t.status === "completed").length}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFieldCreatorOpen(true)}
              className="text-gray-400 hover:text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Column
            </Button>

               <Button
   variant="ghost"
   size="sm"
   onClick={addNewTask}
   disabled={creatingTask}
   className="text-gray-400 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
>
              <Plus className="w-4 h-4 mr-1" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Reorderable Table Structure */}
      <div className="overflow-x-auto overflow-y-hidden">
        {/* Column Headers */}
        <div className="bg-dashboard-surface border-b border-dashboard-border">
          <Reorder.Group
            values={columns}
            onReorder={setColumns}
            as="div"
            className="flex"
            style={{
              minWidth: `${columns.reduce((sum, col) => sum + col.width, 0)}px`,
            }}
            axis="x"
          >
            {columns.map((column) => {
              const getColumnWidth = (column: Column) => {
                return `min-w-[${column.width}px]`;
              };

              return (
                <Reorder.Item
                  key={column.id}
                  value={column}
                  as="div"
                  className={cn(
                    getColumnWidth(column),
                    "border-r border-dashboard-border last:border-r-0 flex-shrink-0",
                    column.sortable
                      ? "cursor-grab active:cursor-grabbing group"
                      : "cursor-default",
                  )}
                  style={{ width: column.width }}
                  whileDrag={
                    column.sortable
                      ? {
                          scale: 1.05,
                          backgroundColor: "#1a1a1a",
                          borderRadius: "4px",
                          zIndex: 1000,
                          boxShadow: "0 10px 30px rgba(190, 252, 169, 0.2)",
                        }
                      : {}
                  }
                  dragConstraints={
                    column.sortable
                      ? undefined
                      : { top: 0, bottom: 0, left: 0, right: 0 }
                  }
                >
                  <div className="px-4 py-2 w-full relative">
                    <div
                      className={cn(
                        "text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1",
                        column.sortable
                          ? "hover:text-white transition-colors"
                          : "",
                      )}
                    >
                      <span className="truncate">{column.label}</span>
                      {column.sortable && (
                        <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      )}
                      {column.isCustom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomField(column.id)}
                          className="p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                        >
                          <X className="w-3 h-3 text-red-400" />
                        </Button>
                      )}
                    </div>
                    {/* Column Resize Handle */}
                    {column.resizable && (
                      <div
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-accent/30 transition-colors group/resize"
                        onMouseDown={(e) => handleMouseDown(e, column.id)}
                      >
                        <div className="w-full h-full opacity-0 group-hover/resize:opacity-100 bg-accent/50 transition-opacity" />
                      </div>
                    )}
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>

        {/* Task Rows or Empty State */}
        {projectTasks.length === 0 ? (
          <div className="p-6">
            <EmptyTaskList onCreateTask={addNewTask} />
          </div>
        ) : (
          <Reorder.Group
            values={projectTasks}
            onReorder={(newTasks) => {
              // Update the order but maintain the context state
              const otherTasks = tasks.filter(
                (t) => !currentProject || t.projectId !== currentProject.id,
              );
              setTasks([...otherTasks, ...newTasks]);
            }}
            className="divide-y divide-dashboard-border"
          >
            {projectTasks.map((task, index) => (
              <Reorder.Item
                key={task.id}
                value={task}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group hover:bg-dashboard-surface/50 transition-colors"
                whileDrag={{
                  scale: 1.02,
                  boxShadow: "0 10px 30px rgba(190, 252, 169, 0.2)",
                  backgroundColor: "#1a1a1a",
                  zIndex: 1000,
                }}
              >
                <div
                  className="flex"
                  style={{
                    minWidth: `${columns.reduce((sum, col) => sum + col.width, 0)}px`,
                  }}
                >
                  {columns.map((column) => {
                    return (
                      <div
                        key={column.id}
                        className="border-r border-dashboard-border last:border-r-0 py-3 flex items-center flex-shrink-0"
                        style={{ width: column.width }}
                      >
                        {/* Render cell content based on column type */}
                        {column.id === "name" && (
                          <div className="flex items-center gap-2 px-4 w-full">
                            <GripVertical className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            <input
                              type="checkbox"
                              className="rounded border-dashboard-border bg-transparent flex-shrink-0"
                            />
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {editingTask === task.id ? (
                                <Input
                                  value={editValues.name || ""}
                                  onChange={(e) =>
                                    updateEditValue("name", e.target.value)
                                  }
                                  className="bg-dashboard-bg border-dashboard-border text-white text-sm h-8 flex-1"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className="text-white text-sm truncate cursor-pointer hover:text-accent transition-colors"
                                  onClick={() =>
                                    navigate(`/dashboard/tasks/${task.id}`)
                                  }
                                >
                                  {task.name}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

{column.id === "assignee" && (
  <div className="px-4 flex items-center justify-center w-full">
    {editingAssignee === task.id ? (
      <Popover
        open={true}
        onOpenChange={(open) => {
          if (!open) setEditingAssignee(null);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-8 bg-dashboard-bg border-dashboard-border text-sm justify-start"
          >
            Select assignees
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-64 p-3 bg-dashboard-surface border-dashboard-border"
          align="start"
        >
          <div className="space-y-2">
            <div className="text-sm font-medium text-white mb-3">
              Assign to:
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
                {loadingUsers && (
    <div className="text-xs text-gray-500 px-2 py-1">Loading users…</div>
  )}
  {!loadingUsers && dbUsers.length === 0 && (
    <div className="text-xs text-gray-500 px-2 py-1">No teammates found.</div>
  )}
  {dbUsers.map((u: any) => {
                const idStr = String(u.id);
                const isSelected = (task.assigneeIds || []).includes(idStr);

                const name =
                  u.full_name ||
                  `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() ||
                  u.name ||
                  `User ${u.id}`;

                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-dashboard-bg transition-colors cursor-pointer"
                    onClick={() => toggleAssignee(task.id, idStr)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAssignee(task.id, idStr)}
                      className="rounded border-dashboard-border bg-transparent"
                      onClick={(e) => e.stopPropagation()}
                    />

                    {u.photo_url ? (
                      <img
                        src={u.photo_url}
                        alt={name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-black">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <span className="text-sm text-gray-300">
                      {name} {u.role ? `(${u.role})` : ""}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-dashboard-border">
              <Button
  size="sm"
  className="w-full bg-accent text-black hover:bg-accent/90"
  onClick={async () => {
    try {
      const ids = (task.assigneeIds || []); // already string[]
      await setTaskAssignees(task.id, ids); // PATCH to Django
      setEditingAssignee(null);
      // refresh just this project’s tasks so the UI matches backend
      if (currentProject?.id) await refresh(String(currentProject.id));
    } catch (err) {
      console.error("❌ Error assigning users:", err);
    }
  }}
>
  Done
</Button>

            </div>
          </div>
        </PopoverContent>
      </Popover>
    ) : (
      <button
        onClick={() => setEditingAssignee(task.id)}
        className="flex items-center justify-center w-full h-8 hover:bg-dashboard-surface/50 rounded transition-colors group gap-1"
        title="Click to assign users"
      >
        {task.assigneeIds && task.assigneeIds.length > 0 ? (
  <div className="flex items-center gap-1">
    <div className="flex -space-x-1">
      {(
        (Array.isArray(task.assignees) && task.assignees.length
          ? task.assignees                              // already user objects from backend
          : (task.assigneeIds || []).map((id: string) => userMap[String(id)]).filter(Boolean)
        ) as any[]
      )
        .slice(0, 3)
        .map((u: any, index: number) => {
          const name =
            u.full_name ||
            `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() ||
            u.name ||
            "User";
          const initials = name
            .split(" ")
            .map((p: string) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={u.id ?? index}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-black border border-dashboard-border"
              style={{ zIndex: 10 - index }}
              title={name}
            >
              {u.photo_url ? (
                <img src={u.photo_url} alt={name} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-accent flex items-center justify-center">
                  {initials}
                </div>
              )}
            </div>
          );
        })}
    </div>

    {((Array.isArray(task.assignees) && task.assignees.length)
      ? task.assignees.length
      : (task.assigneeIds || []).length) > 3 && (
      <span className="text-xs text-gray-400 ml-1">
        +{((Array.isArray(task.assignees) && task.assignees.length)
          ? task.assignees.length
          : (task.assigneeIds || []).length) - 3}
      </span>
    )}

    <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
      Edit
    </span>
  </div>
) 
 : (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Assign
            </span>
          </div>
        )}
      </button>
    )}
  </div>
)}



                        {column.id === "dueDate" && (
                          <div className="px-4 flex items-center justify-center w-full">
                            {editingTask === task.id ? (
                              <Input
                                type="date"
                                value={editValues.dueDate || ""}
                                onChange={(e) =>
                                  updateEditValue("dueDate", e.target.value)
                                }
                                className="bg-dashboard-bg border-dashboard-border text-white text-sm h-8"
                              />
                            ) : (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors text-gray-300 text-sm min-w-0 hover:bg-dashboard-surface/50 rounded px-1 py-1">
                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                    {task.dueDate ? (
                                      <span className="truncate">
                                        {new Date(
                                          task.dueDate,
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year:
                                            new Date().getFullYear() !==
                                            new Date(task.dueDate).getFullYear()
                                              ? "numeric"
                                              : undefined,
                                        })}
                                      </span>
                                    ) : (
                                      <span className="text-gray-500 text-xs">
                                        Set date
                                      </span>
                                    )}
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-64 p-3 bg-dashboard-surface border-dashboard-border"
                                  align="center"
                                >
                                  <div className="space-y-3">
                                    <div className="text-sm font-medium text-white">
                                      Set Due Date
                                    </div>

                                    {/* Quick Date Options */}
                                    <div className="flex flex-wrap gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          const today = new Date()
                                            .toISOString()
                                            .split("T")[0];
                                          updateTask(task.id, {
                                            dueDate: today,
                                          });
                                        }}
                                        className="text-xs h-6 px-2 text-gray-300 hover:text-white hover:bg-dashboard-bg"
                                      >
                                        Today
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          const tomorrow = new Date();
                                          tomorrow.setDate(
                                            tomorrow.getDate() + 1,
                                          );
                                          updateTask(task.id, {
                                            dueDate: tomorrow
                                              .toISOString()
                                              .split("T")[0],
                                          });
                                        }}
                                        className="text-xs h-6 px-2 text-gray-300 hover:text-white hover:bg-dashboard-bg"
                                      >
                                        Tomorrow
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          const nextWeek = new Date();
                                          nextWeek.setDate(
                                            nextWeek.getDate() + 7,
                                          );
                                          updateTask(task.id, {
                                            dueDate: nextWeek
                                              .toISOString()
                                              .split("T")[0],
                                          });
                                        }}
                                        className="text-xs h-6 px-2 text-gray-300 hover:text-white hover:bg-dashboard-bg"
                                      >
                                        Next Week
                                      </Button>
                                    </div>

                                    <Input
                                      type="date"
                                      value={task.dueDate || ""}
                                      onChange={(e) => {
                                        updateTask(task.id, {
                                          dueDate: e.target.value,
                                        });
                                      }}
                                      className="bg-dashboard-bg border-dashboard-border text-white text-sm"
                                    />

                                    <div className="flex items-center justify-between">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(
                                            `/dashboard/tasks/${task.id}`,
                                          );
                                        }}
                                        className="text-xs text-gray-400 hover:text-white"
                                      >
                                        View Task
                                      </Button>
                                      {task.dueDate && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            updateTask(task.id, {
                                              dueDate: "",
                                            });
                                          }}
                                          className="text-xs text-red-400 hover:text-red-300"
                                        >
                                          Clear Date
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        )}

                        {column.id === "priority" && (
                          <div className="px-4 flex items-center justify-center w-full">
                            {editingTask === task.id ? (
                              <Select
                                value={editValues.priority || task.priority}
                                onValueChange={(value) =>
                                  updateEditValue("priority", value)
                                }
                              >
                                <SelectTrigger className="w-full h-8 bg-dashboard-bg border-dashboard-border text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      High
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="medium">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                      Medium
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="low">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                      Low
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div
                                className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`}
                              ></div>
                            )}
                          </div>
                        )}

                        {column.id === "status" && (
                          <div className="px-4 flex items-center justify-center w-full">
                            <Select
                              value={task.status}
                              onValueChange={(value) => {
                                updateTask(task.id, {
                                  status: value as Task["status"],
                                });
                              }}
                            >
                              <SelectTrigger className="w-full h-8 bg-dashboard-bg border-dashboard-border text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="to-do">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                    To Do
                                  </div>
                                </SelectItem>
                                <SelectItem value="in-progress">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    In Progress
                                  </div>
                                </SelectItem>
                                <SelectItem value="completed">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Completed
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {column.id === "timeTracked" && (
                          <div className="px-4 flex items-center justify-center w-full">
                            <TaskTimeTracker
                              taskId={task.id.toString()}
                              taskName={task.name}
                              variant="badge"
                              className="w-full"
                            />
                          </div>
                        )}

                        {column.id === "progress" && (
                          <div className="px-4 w-full">
                            {editingTask === task.id ? (
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={editValues.progress || 0}
                                onChange={(e) =>
                                  updateEditValue(
                                    "progress",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                className="bg-dashboard-bg border-dashboard-border text-white text-sm h-8"
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={task.progress}
                                  className="flex-1 h-2 bg-gray-700"
                                />
                                <span className="text-xs text-gray-400 w-8">
                                  {task.progress}%
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {column.id === "actions" && (
                          <div className="px-4 flex items-center justify-end gap-1 w-full">
                            {editingTask === task.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-accent hover:text-accent"
                                  onClick={saveEditing}
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                                  onClick={cancelEditing}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Custom Fields */}
                        {column.isCustom &&
                          (() => {
                            const field = customFields.find(
                              (f) => f.id === column.id,
                            );
                            if (!field) return null;

                            return (
                              <div className="px-4 flex items-center w-full">
                                <FieldRenderer
                                  field={field}
                                  value={task.customFields?.[column.id]}
                                  isEditing={
                                    editingField?.taskId === task.id &&
                                    editingField?.fieldId === column.id
                                  }
                                  onValueChange={(value) =>
                                    handleCustomFieldChange(
                                      task.id,
                                      column.id,
                                      value,
                                    )
                                  }
                                  onStartEdit={() =>
                                    setEditingField({
                                      taskId: task.id,
                                      fieldId: column.id,
                                    })
                                  }
                                  onSave={() => setEditingField(null)}
                                  onCancel={() => setEditingField(null)}
                                />
                              </div>
                            );
                          })()}
                      </div>
                    );
                  })}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* Field Creator Dialog */}
      <FieldCreator
        isOpen={isFieldCreatorOpen}
        onClose={() => setIsFieldCreatorOpen(false)}
        onCreateField={handleCreateField}
      />
    </motion.div>
  );
}

export default TaskList;

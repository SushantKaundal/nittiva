import { motion } from "framer-motion";
import { Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimeEntry {
  user: string;
  avatar: string;
  totalHours: string;
  projects: number;
  color: string;
}

const mockTimeData: TimeEntry[] = [
  {
    user: "olsocials",
    avatar: "OS",
    totalHours: "42h 15m",
    projects: 3,
    color: "#befca9",
  },
  {
    user: "john_doe",
    avatar: "JD",
    totalHours: "38h 30m",
    projects: 2,
    color: "#8b5cf6",
  },
  {
    user: "jane_smith",
    avatar: "JS",
    totalHours: "35h 45m",
    projects: 4,
    color: "#f59e0b",
  },
];

export default function TimeSheet() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-gradient-to-br from-card to-dashboard-surface border border-dashboard-border rounded-lg p-6 h-full shadow-xl shadow-black/20"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent-dark rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-black" />
          </div>
          <h3 className="text-lg font-semibold text-white">Time Sheet</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-accent hover:bg-accent/10 transition-all duration-300"
        >
          <Calendar className="w-4 h-4" />
        </Button>
      </div>

      <div className="mb-4">
        <Select defaultValue="this-week">
          <SelectTrigger className="w-full bg-dashboard-surface border-dashboard-border">
            <SelectValue placeholder="Date between" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-week">This Week</SelectItem>
            <SelectItem value="last-week">Last Week</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar">
        <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wider border-b border-gradient-to-r border-dashboard-border pb-3">
          <span className="font-semibold">Team Member</span>
          <span className="font-semibold">Time Tracked</span>
        </div>

        <div className="space-y-3">
          {mockTimeData.map((entry, index) => (
            <motion.div
              key={entry.user}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group flex items-center justify-between p-4 bg-gradient-to-r from-dashboard-surface to-dashboard-bg rounded-lg border border-dashboard-border hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black shadow-lg transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: entry.color }}
                  >
                    {entry.avatar}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-dashboard-surface" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors duration-300">
                    {entry.user}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {entry.projects} active projects
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-white group-hover:text-accent transition-colors duration-300 tabular-nums">
                    {entry.totalHours}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                    this week
                  </div>
                </div>
                <Clock className="w-4 h-4 text-accent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gradient-to-r border-dashboard-border bg-gradient-to-r from-accent/5 to-transparent rounded-lg p-4 -mx-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-gray-300">
              Total this week
            </span>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono font-bold text-accent tabular-nums">
              116h 30m
            </div>
            <div className="text-xs text-gray-400 font-medium">
              across all projects
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

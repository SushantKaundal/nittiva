import { motion } from "framer-motion";
import { Activity, Clock, User, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  timeAgo: string;
  type: "start" | "stop" | "create" | "update";
  avatar: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    user: "olsocials socials",
    action: "stopped time tracker",
    target: "",
    time: "19-06-2025 14:59:36",
    timeAgo: "A2 minutes ago",
    type: "stop",
    avatar: "OS",
  },
  {
    id: "2",
    user: "olsocials socials",
    action: "started time tracker",
    target: "",
    time: "19-06-2025 14:59:32",
    timeAgo: "3h ago",
    type: "start",
    avatar: "OS",
  },
];

const getActionIcon = (type: string) => {
  switch (type) {
    case "start":
      return <Play className="w-3 h-3 text-accent" />;
    case "stop":
      return <Square className="w-3 h-3 text-red-400" />;
    case "create":
      return <User className="w-3 h-3 text-blue-400" />;
    default:
      return <Clock className="w-3 h-3 text-gray-400" />;
  }
};

export default function RecentActivities() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-card border border-dashboard-border rounded-lg h-full flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
        <h3 className="text-lg font-normal text-white">Recent Activities</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          <Activity className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {mockActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 bg-dashboard-surface rounded-lg border border-dashboard-border hover:border-accent/20 transition-colors"
          >
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-xs font-medium text-black flex-shrink-0">
              {activity.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getActionIcon(activity.type)}
                <span className="text-sm text-white">
                  <span className="font-medium">{activity.user}</span>{" "}
                  <span className="text-gray-300">{activity.action}</span>
                  {activity.target && (
                    <span className="text-accent ml-1">{activity.target}</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{activity.time}</span>
                <span className="text-xs text-gray-500">
                  {activity.timeAgo}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 border-t border-dashboard-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-gray-400 hover:text-white"
        >
          View all activities
        </Button>
      </div>
    </motion.div>
  );
}

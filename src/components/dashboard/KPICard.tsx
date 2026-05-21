import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info";
  index?: number;
}

const variantStyles = {
  default: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    gradient: "from-primary/5 to-transparent",
  },
  success: {
    iconBg: "bg-success-muted",
    iconColor: "text-success",
    gradient: "from-success/5 to-transparent",
  },
  warning: {
    iconBg: "bg-warning-muted",
    iconColor: "text-warning",
    gradient: "from-warning/5 to-transparent",
  },
  danger: {
    iconBg: "bg-danger-muted",
    iconColor: "text-danger",
    gradient: "from-danger/5 to-transparent",
  },
  info: {
    iconBg: "bg-info-muted",
    iconColor: "text-info",
    gradient: "from-info/5 to-transparent",
  },
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  index = 0,
}: KPICardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="kpi-card group"
    >
      {/* Background gradient */}
      <div className={cn("kpi-card-gradient bg-gradient-to-br", styles.gradient)} />

      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <motion.p
            initial={{ scale: 0.8 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
            className="text-3xl font-bold text-foreground"
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.value >= 0 ? "text-success" : "text-danger"
                )}
              >
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>

        <motion.div
          whileHover={{ rotate: 10, scale: 1.1 }}
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl transition-colors",
            styles.iconBg
          )}
        >
          <Icon className={cn("w-6 h-6", styles.iconColor)} />
        </motion.div>
      </div>
    </motion.div>
  );
}

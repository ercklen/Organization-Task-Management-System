"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface GroupPerformanceData {
  name: string;
  completionRate: number;
  totalTasks: number;
}

interface StatusDistributionData {
  name: string;
  value: number;
  color: string;
}

interface DashboardChartsProps {
  groupData: GroupPerformanceData[];
  statusData: StatusDistributionData[];
}

export function DashboardCharts({ groupData, statusData }: DashboardChartsProps) {
  const t = useTranslations("dashboard.charts");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-80 flex items-center justify-center bg-muted/20 animate-pulse">
          <span className="text-xs text-muted-foreground">Chargement des graphiques...</span>
        </Card>
        <Card className="h-80 flex items-center justify-center bg-muted/20 animate-pulse">
          <span className="text-xs text-muted-foreground">Chargement des graphiques...</span>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Group completion bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{t("groupPerformance")}</CardTitle>
          <CardDescription className="text-xs">
            {t("completionRate")}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={groupData}
              margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(value: any) => [`${value}%`, t("completionRate")]}
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderRadius: "8px",
                  borderColor: "var(--border)",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="completionRate"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Task status distribution donut chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{t("statusDistribution")}</CardTitle>
          <CardDescription className="text-xs">
            {t("count")}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-72 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(value: any, name: any) => [value, name]}
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderRadius: "8px",
                  borderColor: "var(--border)",
                  fontSize: "12px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs font-medium text-foreground">{value}</span>}
              />
              <Pie
                data={statusData}
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

import React from "react"
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
  Legend
} from "recharts"
import type { CategoryCount } from "@workspace/api-client-react"

interface ChartProps {
  jenisData: CategoryCount[]
  kondisiData: CategoryCount[]
}

const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'];

export function DashboardCharts({ jenisData, kondisiData }: ChartProps) {
  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex-1 min-h-[200px]">
        <h4 className="text-sm font-semibold mb-4 text-foreground">Jenis Perubahan</h4>
        {jenisData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={jenisData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="label" type="category" fontSize={11} tickLine={false} axisLine={false} width={100} />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Bar dataKey="jumlah" fill="#0f172a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Tidak ada data</div>
        )}
      </div>

      <div className="flex-1 min-h-[200px]">
        <h4 className="text-sm font-semibold mb-4 text-foreground">Kondisi Bangunan</h4>
        {kondisiData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={kondisiData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="jumlah"
                nameKey="label"
              >
                {kondisiData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Tidak ada data</div>
        )}
      </div>
    </div>
  )
}

'use client';

import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const data = [
  {
    name: 'Jan',
    total: 1200,
  },
  {
    name: 'Feb',
    total: 1900,
  },
  {
    name: 'Mar',
    total: 1500,
  },
  {
    name: 'Apr',
    total: 2200,
  },
  {
    name: 'May',
    total: 2800,
  },
  {
    name: 'Jun',
    total: 2600,
  },
  {
    name: 'Jul',
    total: 3100,
  },
  {
    name: 'Aug',
    total: 2900,
  },
  {
    name: 'Sep',
    total: 3300,
  },
  {
    name: 'Oct',
    total: 3500,
  },
  {
    name: 'Nov',
    total: 3200,
  },
  {
    name: 'Dec',
    total: 3800,
  },
];

export function BarChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsBarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number) => [`$${value}`, 'Revenue']}
        />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

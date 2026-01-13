'use client';

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const data = [
  {
    name: 'Jan',
    value: 2400,
  },
  {
    name: 'Feb',
    value: 1398,
  },
  {
    name: 'Mar',
    value: 9800,
  },
  {
    name: 'Apr',
    value: 3908,
  },
  {
    name: 'May',
    value: 4800,
  },
  {
    name: 'Jun',
    value: 3800,
  },
  {
    name: 'Jul',
    value: 4300,
  },
  {
    name: 'Aug',
    value: 5300,
  },
  {
    name: 'Sep',
    value: 4900,
  },
  {
    name: 'Oct',
    value: 3800,
  },
  {
    name: 'Nov',
    value: 4800,
  },
  {
    name: 'Dec',
    value: 5200,
  },
];

export function LineChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsLineChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number) => [`${value}`, 'Performance']}
        />
        <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

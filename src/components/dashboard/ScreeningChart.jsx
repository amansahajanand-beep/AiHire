import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card, { CardHeader } from '../ui/Card';
import { screeningChartData } from '../../data/mockData';

export default function ScreeningChart() {
  return (
    <Card>
      <CardHeader title="Candidate Screening Overview" />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={screeningChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }} barGap={3} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0, 200]} />
            <Tooltip
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} iconType="circle" />
            <Bar dataKey="screened" fill="#6366F1" radius={[4, 4, 0, 0]} name="Screened" maxBarSize={18} />
            <Bar dataKey="shortlisted" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Shortlisted" maxBarSize={18} />
            <Bar dataKey="hired" fill="#A5B4FC" radius={[4, 4, 0, 0]} name="Hired" maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

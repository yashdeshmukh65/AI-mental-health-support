import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Activity, TrendingUp, Sparkles, BrainCircuit, HeartPulse, ShieldCheck
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

// --- MOCK DATA ---
const recoveryData = [
  { name: 'Recovered', value: 78, color: '#10b981' },
  { name: 'In Progress', value: 22, color: '#6366f1' }
];

const activeUsersData = [
  { name: 'Mon', users: 1200 },
  { name: 'Tue', users: 1350 },
  { name: 'Wed', users: 1250 },
  { name: 'Thu', users: 1500 },
  { name: 'Fri', users: 1600 },
  { name: 'Sat', users: 1800 },
  { name: 'Sun', users: 1950 },
];

const moodData = [
  { name: 'Positive', count: 4500, color: '#3b82f6' },
  { name: 'Moderate', count: 3200, color: '#8b5cf6' },
  { name: 'High Stress', count: 1200, color: '#f59e0b' },
  { name: 'Critical', count: 300, color: '#ef4444' },
];

const liveActivities = [
  { id: 1, text: "User #492 completed a meditation session", time: "Just now", icon: HeartPulse, color: "text-emerald-400" },
  { id: 2, text: "New user joined from New York", time: "2 min ago", icon: Users, color: "text-blue-400" },
  { id: 3, text: "Significant mood improvement detected for User #811", time: "5 min ago", icon: Sparkles, color: "text-purple-400" },
];

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-dark p-3 rounded-lg border border-white/10 shadow-xl">
        <p className="text-white font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color || entry.payload.color }} className="text-sm">
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function PlatformImpact() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Platform Impact</h1>
          <p className="text-slate-400">Real-time analytics and global wellness metrics</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass border border-blue-500/20 text-sm text-blue-300">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          Live Updates Active
        </div>
      </motion.div>

      {/* Top 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Users" 
          value="12,450" 
          trend="+15%" 
          trendUp={true} 
          icon={Users} 
          color="blue" 
          delay={0.1}
          subtitle="Registered profiles" 
        />
        <MetricCard 
          title="Active Treatments" 
          value="3,820" 
          trend="+8%" 
          trendUp={true} 
          icon={Activity} 
          color="purple" 
          delay={0.2}
          subtitle="Currently on 7-day plans" 
        />
        <MetricCard 
          title="Recovery Rate" 
          value="78%" 
          trend="+4%" 
          trendUp={true} 
          icon={TrendingUp} 
          color="emerald" 
          delay={0.3}
          subtitle="Users recovered from stress" 
        />
        <MetricCard 
          title="Therapist Support" 
          value="1,432" 
          trend="+12%" 
          trendUp={true} 
          icon={HeartPulse} 
          color="rose" 
          delay={0.4}
          subtitle="Connected with professionals" 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Users Line Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-dark rounded-2xl p-6 border border-white/5 card-hover"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Active Users (7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeUsersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }} 
                  activeDot={{ r: 6, fill: '#fff' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recovery Ratio Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.4 }}
          className="glass-dark rounded-2xl p-6 border border-white/5 card-hover flex flex-col"
        >
          <h3 className="text-lg font-semibold text-white mb-2">Recovery Ratio</h3>
          <p className="text-sm text-slate-400 mb-4">Wellness plan completion vs ongoing</p>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={recoveryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {recoveryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {recoveryData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-sm text-slate-300">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Mood Distribution Bar Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass-dark rounded-2xl p-6 border border-white/5 card-hover"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Mood Distribution</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moodData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#e2e8f0" tick={{fill: '#e2e8f0'}} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                  {moodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Live Activity & AI Accuracy */}
        <div className="space-y-6">
          
          {/* AI Accuracy */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.6 }}
            className="glass-dark rounded-2xl p-6 border border-white/5"
          >
            <div className="flex items-center gap-2 mb-6">
              <BrainCircuit className="text-purple-400" size={20} />
              <h3 className="text-lg font-semibold text-white">AI Engine Accuracy</h3>
            </div>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300">Sentiment Analysis</span>
                  <span className="text-emerald-400 font-bold">98.4%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-300 h-2 rounded-full" style={{ width: '98.4%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300">Burnout Detection</span>
                  <span className="text-blue-400 font-bold">94.7%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-300 h-2 rounded-full" style={{ width: '94.7%' }}></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Live Activity */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.7 }}
            className="glass-dark rounded-2xl p-6 border border-white/5"
          >
            <div className="flex items-center gap-2 mb-5">
              <Activity className="text-blue-400" size={20} />
              <h3 className="text-lg font-semibold text-white">Live Activity</h3>
            </div>
            <div className="space-y-4">
              {liveActivities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className={`mt-1 flex-shrink-0 ${activity.color}`}>
                    <activity.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-200">{activity.text}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>

    </div>
  );
}

function MetricCard({ title, value, trend, trendUp, icon: Icon, color, delay, subtitle }) {
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/20 text-rose-400',
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay }}
      className={`glass-dark rounded-2xl p-5 border ${colorMap[color].split(' ')[2]} card-hover relative overflow-hidden`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorMap[color].split(' ').slice(0,2).join(' ')} blur-3xl opacity-50 -mr-10 -mt-10 rounded-full`}></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          </div>
          <div className={`p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 ${colorMap[color].split(' ')[3]}`}>
            <Icon size={20} />
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-slate-400 truncate mr-2">{subtitle}</p>
          <div className={`flex items-center text-xs font-semibold ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

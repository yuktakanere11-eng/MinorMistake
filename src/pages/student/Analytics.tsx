import { useEffect, useState } from "react";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell 
} from "recharts";
import { Sparkles, TrendingUp, Award, Target, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

// --- TYPES & INTERFACES ---
interface PerformanceData {
  name: string;
  score: number;
}

interface GradeDistData {
  name: string;
  value: number;
  color: string;
}

interface AnalyticsState {
  stats: {
    avgScore: number;
    totalSubmissions: number;
    rank: string;
    completionRate: number;
    gradedCount: number;
  };
  performanceTrend: PerformanceData[];
  gradeDist: GradeDistData[];
  insights: string[];
}

export default function StudentAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsState>({
    stats: { avgScore: 0, totalSubmissions: 0, rank: "Unranked", completionRate: 0, gradedCount: 0 },
    performanceTrend: [],
    gradeDist: [],
    insights: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. CALL SUPABASE RPC
      // Ensure the parameter name 'target_student_id' matches your SQL function
      const { data: result, error } = await supabase.rpc('get_student_analytics', { 
        target_student_id: user.id 
      });

      if (error) throw error;

      // 2. DEFENSIVE DATA MAPPING
      // This prevents "Cannot read property of undefined" errors
      const stats = result?.stats || { 
        avg_score: 0, 
        total_submissions: 0, 
        completion_rate: 0, 
        graded_count: 0 
      };

      // 3. CALCULATE RANK LOGIC
      let currentRank = "Unranked";
      if (stats.graded_count > 0) {
        currentRank = stats.avg_score >= 90 ? "Top 5%" : 
                      stats.avg_score >= 80 ? "Top 15%" : "Top 30%";
      }

      // 4. PROCESS TRENDS AND DISTRIBUTION
      const trendData = result?.performanceTrend || [];
      const distribution = result?.gradeDist || [];
      const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#cbd5e1'];
      
      const coloredDist = distribution.map((item: any, i: number) => ({
        ...item,
        color: colors[i] || '#cbd5e1'
      }));

      setData({
        stats: { 
          avgScore: stats.avg_score, 
          totalSubmissions: stats.total_submissions, 
          rank: currentRank, 
          completionRate: stats.completion_rate,
          gradedCount: stats.graded_count
        },
        performanceTrend: trendData,
        gradeDist: coloredDist,
        insights: [
          `You have completed ${stats.completion_rate}% of your total course load.`,
          stats.avg_score >= 80 
            ? "Your scoring trend is strong. Keep applying current study habits." 
            : "Focus on reviewing graded feedback to improve your score average."
        ]
      });
    } catch (error) {
      console.error("Analytics Error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Performance Analytics</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time data from your dashboard</p>
      </header>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Avg Score" val={`${data.stats.avgScore}%`} icon={Target} bg="bg-indigo-50" color="text-indigo-600" />
        <StatCard label="Submissions" val={data.stats.totalSubmissions} icon={BookOpen} bg="bg-emerald-50" color="text-emerald-600" />
        <StatCard label="Class Rank" val={data.stats.rank} icon={Award} bg="bg-amber-50" color="text-amber-600" />
        <StatCard label="Completion" val={`${data.stats.completionRate}%`} icon={TrendingUp} bg="bg-rose-50" color="text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SCORE TREND */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest mb-8 text-slate-400">Score Trend</h3>
          <div className="h-64 w-full">
            {data.performanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} dy={10} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No scores to track yet" />}
          </div>
        </div>

        {/* GRADE SPREAD */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest mb-8 text-slate-400">Grade Spread</h3>
          <div className="h-64 w-full">
            {data.gradeDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.gradeDist}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontWeight: 'bold', fontSize: 10}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={32}>
                    {data.gradeDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No grading data yet" />}
          </div>
        </div>
      </div>

      {/* AI COACH OBSERVATIONS */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex items-start gap-6 shadow-xl shadow-slate-200">
        <div className="bg-indigo-500 p-4 rounded-2xl shrink-0">
          <Sparkles size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-black uppercase tracking-widest text-xs mb-3 text-indigo-400">AI Coach Observations</h3>
          <ul className="space-y-3">
            {data.insights.map((text, i) => (
              <li key={i} className="text-slate-300 text-sm font-bold flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function StatCard({ label, val, icon: Icon, bg, color }: any) {
  return (
    <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
      <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center mb-5`}>
        <Icon size={24} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900">{val}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-50 rounded-[2rem]">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{message}</p>
    </div>
  );
}
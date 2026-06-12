import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const data = [
  { name: 'Seg', Rato: 4, Barata: 12, Escorpião: 2 },
  { name: 'Ter', Rato: 3, Barata: 8, Escorpião: 1 },
  { name: 'Qua', Rato: 6, Barata: 15, Escorpião: 4 },
  { name: 'Qui', Rato: 2, Barata: 10, Escorpião: 0 },
  { name: 'Sex', Rato: 5, Barata: 18, Escorpião: 3 },
  { name: 'Sáb', Rato: 8, Barata: 22, Escorpião: 5 },
  { name: 'Dom', Rato: 7, Barata: 14, Escorpião: 2 },
];

const COLORS = {
  Rato: '#ef4444',
  Barata: '#eab308',
  Escorpião: '#f97316',
};

export default function StatsOverview() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-[#00f59b]" />
          <h2 className="font-mono text-xs uppercase tracking-widest text-white/50 italic">
            Análise de Atividade (7 dias)
          </h2>
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#ffffff20" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              fontFamily="monospace"
              dy={10}
            />
            <YAxis 
              stroke="#ffffff20" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              fontFamily="monospace"
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{ 
                backgroundColor: '#011a14', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontFamily: 'monospace',
                fontSize: '10px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }}
              itemStyle={{ color: '#fff', textTransform: 'uppercase' }}
            />
            <Bar dataKey="Rato" fill={COLORS.Rato} radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="Barata" fill={COLORS.Barata} radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="Escorpião" fill={COLORS.Escorpião} radius={[4, 4, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4">
        {Object.entries(COLORS).map(([key, color]) => (
          <div key={key} className="flex flex-col items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-mono text-[8px] text-white/40 uppercase tracking-widest">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

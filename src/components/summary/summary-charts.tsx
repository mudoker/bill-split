import { formatCurrency } from "@/lib/format";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { CHART_COLORS } from "@/constants/colors";

interface ChartDataItem {
    name: string;
    fullName?: string;
    value: number;
    color: string;
}

interface BarDataItem {
    name: string;
    fullName: string;
    ordered: number;
    sponsored: number;
    toPay: number;
}

function CustomTooltip({ active, payload }: any) {
    if (active && payload?.length) {
        const data = payload[0];
        return (
            <div className="bg-popover border rounded-lg shadow-lg px-3 py-2 text-xs">
                <p className="font-medium">{data.payload.fullName || data.name}</p>
                <p className="text-primary">{formatCurrency(data.value)}</p>
            </div>
        );
    }
    return null;
}

function BarTooltip({ active, payload, label }: any) {
    if (active && payload?.length) {
        return (
            <div className="bg-popover border rounded-lg shadow-lg px-3 py-2 text-xs space-y-1">
                <p className="font-medium mb-1">{payload[0]?.payload?.fullName || label}</p>
                {payload.map((entry: any, i: number) => (
                    <p key={i} style={{ color: entry.color }}>
                        {entry.name}: {formatCurrency(entry.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
}

export function CostPieChart({ data }: { data: ChartDataItem[] }) {
    if (data.length === 0) {
        return <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No data yet</div>;
    }

    return (
        <div className="relative group">
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <defs>
                        {data.map((_, i) => (
                            <filter id={`glow-${i}`} key={i}>
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        ))}
                    </defs>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                style={{ filter: `url(#glow-${index})` }}
                                className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
                {data.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 group/item">
                        <div className="w-2 h-2 rounded-full transition-transform group-hover/item:scale-125 shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}44` }} />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover/item:text-foreground transition-colors">{entry.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function CompareBarChart({ data }: { data: BarDataItem[] }) {
    if (data.length === 0) {
        return <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Add people and items to see chart</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-foreground/5" />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    className="text-muted-foreground/60 uppercase tracking-tighter"
                />
                <YAxis
                    tick={{ fontSize: 9, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    className="text-muted-foreground/40"
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend
                    wrapperStyle={{ fontSize: 10, fontWeight: 900, paddingTop: '20px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    iconType="circle"
                />
                <Bar dataKey="ordered" name="Ordered" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="sponsored" name="Sponsored" fill={CHART_COLORS[1]} radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="toPay" name="To Pay" fill={CHART_COLORS[2]} radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
        </ResponsiveContainer>
    );
}

/** Builds chart-ready data from raw bill state */
export function buildChartData(
    people: { id: string; name: string; sponsorAmount: number }[],
    items: { name: string; price: number }[],
    rawCosts: Record<string, number>,
    finalPayables: Record<string, number>
) {
    const pieData: ChartDataItem[] = people
        .filter(p => (rawCosts[p.id] || 0) > 0)
        .map((p, i) => ({
            name: p.name,
            value: Math.round(rawCosts[p.id] || 0),
            color: CHART_COLORS[i % CHART_COLORS.length],
        }));

    const barData: BarDataItem[] = people.map((p) => ({
        name: p.name.length > 8 ? p.name.slice(0, 7) + '…' : p.name,
        fullName: p.name,
        ordered: Math.round(rawCosts[p.id] || 0),
        sponsored: Math.round(p.sponsorAmount || 0),
        toPay: Math.round(finalPayables[p.id] || 0),
    }));

    const itemCostData: ChartDataItem[] = items
        .filter(item => item.price > 0)
        .map((item, i) => ({
            name: item.name.length > 12 ? item.name.slice(0, 11) + '…' : item.name,
            fullName: item.name,
            value: Math.round(item.price),
            color: CHART_COLORS[i % CHART_COLORS.length],
        }));

    return { pieData, barData, itemCostData };
}

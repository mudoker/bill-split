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
        <div>
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {data.map((entry, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px]">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground">{entry.name}</span>
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
            <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip content={<BarTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="ordered" name="Ordered" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="sponsored" name="Sponsored" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="toPay" name="To Pay" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
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

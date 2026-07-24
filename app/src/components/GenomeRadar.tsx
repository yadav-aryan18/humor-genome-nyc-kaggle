import { useMemo } from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';

/**
 * 8-dimension humor genome object representing quantitative comedic metrics (0-10 scale).
 */
export interface Genome {
  surprise: number;
  incongruity: number;
  superiority: number;
  relief: number;
  absurdity: number;
  warmth: number;
  edge: number;
  wordplay: number;
}

/**
 * Mapping of full humor genome dimension names to 3-letter uppercase display codes.
 */
export const GENOME_DIMS: { key: keyof Genome; short: string }[] = [
  { key: 'surprise', short: 'SUR' },
  { key: 'incongruity', short: 'INC' },
  { key: 'superiority', short: 'SUP' },
  { key: 'relief', short: 'REL' },
  { key: 'absurdity', short: 'ABS' },
  { key: 'warmth', short: 'WRM' },
  { key: 'edge', short: 'EDG' },
  { key: 'wordplay', short: 'WRD' },
];

/**
 * Recharts radar chart component displaying an 8-axis comedic DNA profile.
 *
 * @param props.genome The 8-dimension genome score object.
 * @param props.size Visual height of the radar chart container in pixels.
 */
export function GenomeRadar({ genome, size = 300 }: { genome: Genome; size?: number }) {
  const data = useMemo(
    () =>
      GENOME_DIMS.map((d) => ({
        dim: d.short,
        full: d.key,
        value: genome[d.key],
      })),
    [genome],
  );
  return (
    <div style={{ width: '100%', height: size }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="hsl(240 5% 18%)" />
          <PolarAngleAxis
            dataKey="dim"
            tick={{ fill: 'hsl(240 6% 62%)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          />
          <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="hsl(42 96% 55%)"
            fill="hsl(42 96% 55%)"
            fillOpacity={0.22}
            strokeWidth={2}
            dot={{ r: 2.5, fill: 'hsl(42 96% 55%)', strokeWidth: 0 }}
            isAnimationActive
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Compact horizontal "DNA barcode" strip of the 8 genome scores. */
export function GenomeBarcode({ genome }: { genome: Genome }) {
  return (
    <div className="flex h-16 w-full items-end gap-1">
      {GENOME_DIMS.map((d) => (
        <div key={d.key} className="group flex flex-1 flex-col items-center gap-1">
          <div className="flex h-12 w-full items-end overflow-hidden rounded-sm bg-secondary/50">
            <div
              className="w-full rounded-sm bg-gradient-to-t from-gold/70 to-gold transition-all duration-700 group-hover:from-neon-violet/70 group-hover:to-neon-violet"
              style={{ height: `${Math.max(4, genome[d.key] * 10)}%` }}
              title={`${d.key}: ${genome[d.key]}`}
            />
          </div>
          <span className="font-mono text-[8px] tracking-tight text-muted-foreground/70">{d.short}</span>
        </div>
      ))}
    </div>
  );
}

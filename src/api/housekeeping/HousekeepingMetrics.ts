/**
 * Per-action metrics — bounded sliding window of latency samples,
 * P50/P95 computed on demand. Keep this pure so the action runner
 * (`useHousekeepingActions.runAction`) and the debug panel render
 * function can both read the same shape without re-implementing
 * percentile math.
 */

export interface HousekeepingActionMetric
{
    action: string;
    /** Total calls observed (success + failure). */
    count: number;
    /** Failures only — `result.ok === false` or thrown. */
    errors: number;
    /** Most-recent latency in ms, plus min/max for visibility. */
    lastMs: number;
    minMs: number;
    maxMs: number;
    p50Ms: number;
    p95Ms: number;
}

const SAMPLE_CAP = 50;

const percentile = (sorted: ReadonlyArray<number>, p: number): number =>
{
    if(sorted.length === 0) return 0;
    if(sorted.length === 1) return sorted[0];

    // Linear interpolation between adjacent samples — standard
    // percentile definition. Clamp the rank into [0, n-1] so p=100
    // doesn't read off the end on small samples.
    const rank = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(rank);
    const hi = Math.ceil(rank);

    if(lo === hi) return sorted[lo];

    const frac = rank - lo;

    return (sorted[lo] * (1 - frac)) + (sorted[hi] * frac);
};

export interface MetricSample
{
    samples: number[];
    count: number;
    errors: number;
}

export const emptySample = (): MetricSample => ({ samples: [], count: 0, errors: 0 });

/**
 * Append a new latency sample, trim past SAMPLE_CAP. Returns a NEW
 * object so the shape plays nicely with React state updates — never
 * mutates the input.
 */
export const recordSample = (current: MetricSample, latencyMs: number, isError: boolean): MetricSample =>
{
    const trimmed = current.samples.length >= SAMPLE_CAP
        ? current.samples.slice(current.samples.length - (SAMPLE_CAP - 1))
        : current.samples.slice();

    trimmed.push(latencyMs);

    return {
        samples: trimmed,
        count: current.count + 1,
        errors: current.errors + (isError ? 1 : 0)
    };
};

/**
 * Snapshot transform — fold the sliding window into a renderable
 * record. Computes percentiles on a sorted copy (small `samples`
 * sizes — cap is 50, so this is essentially O(n log n) on n≤50).
 */
export const sampleToMetric = (action: string, sample: MetricSample): HousekeepingActionMetric =>
{
    if(sample.samples.length === 0)
    {
        return {
            action,
            count: sample.count,
            errors: sample.errors,
            lastMs: 0,
            minMs: 0,
            maxMs: 0,
            p50Ms: 0,
            p95Ms: 0
        };
    }

    const sorted = sample.samples.slice().sort((a, b) => a - b);

    return {
        action,
        count: sample.count,
        errors: sample.errors,
        lastMs: sample.samples[sample.samples.length - 1],
        minMs: sorted[0],
        maxMs: sorted[sorted.length - 1],
        p50Ms: percentile(sorted, 50),
        p95Ms: percentile(sorted, 95)
    };
};

export const HK_METRICS_SAMPLE_CAP = SAMPLE_CAP;

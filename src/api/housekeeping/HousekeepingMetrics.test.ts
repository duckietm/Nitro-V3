import { describe, expect, it } from 'vitest';
import { emptySample, HK_METRICS_SAMPLE_CAP, recordSample, sampleToMetric } from './HousekeepingMetrics';

describe('emptySample', () => {
    it('starts with zero samples and counts', () => {
        const e = emptySample();

        expect(e.samples).toEqual([]);
        expect(e.count).toBe(0);
        expect(e.errors).toBe(0);
    });
});

describe('recordSample', () => {
    it('appends one sample and increments count', () => {
        const next = recordSample(emptySample(), 50, false);

        expect(next.samples).toEqual([50]);
        expect(next.count).toBe(1);
        expect(next.errors).toBe(0);
    });

    it('tracks errors independently from total count', () => {
        let s = emptySample();
        s = recordSample(s, 10, false);
        s = recordSample(s, 20, true);
        s = recordSample(s, 30, false);

        expect(s.count).toBe(3);
        expect(s.errors).toBe(1);
    });

    it('never mutates the input (returns a new sample object)', () => {
        const before = emptySample();
        const after = recordSample(before, 100, false);

        expect(before.samples).toEqual([]);
        expect(after).not.toBe(before);
    });

    it('trims the sliding window to SAMPLE_CAP, keeping the most recent values', () => {
        let s = emptySample();

        // Push CAP+5 samples so the first 5 should fall off.
        for (let i = 0; i < HK_METRICS_SAMPLE_CAP + 5; i++) s = recordSample(s, i, false);

        expect(s.samples.length).toBe(HK_METRICS_SAMPLE_CAP);
        // Most-recent sample (i = CAP+4) survives
        expect(s.samples[s.samples.length - 1]).toBe(HK_METRICS_SAMPLE_CAP + 4);
        // First 5 values (0..4) dropped — sample[0] now starts at 5
        expect(s.samples[0]).toBe(5);
        // Count keeps growing past the cap (cumulative, NOT windowed)
        expect(s.count).toBe(HK_METRICS_SAMPLE_CAP + 5);
    });
});

describe('sampleToMetric', () => {
    it('returns zeros for an empty sample (no samples observed yet)', () => {
        const m = sampleToMetric('ban', emptySample());

        expect(m).toEqual({
            action: 'ban',
            count: 0,
            errors: 0,
            lastMs: 0,
            minMs: 0,
            maxMs: 0,
            p50Ms: 0,
            p95Ms: 0
        });
    });

    it('handles a single sample (P50 == P95 == min == max == lastMs)', () => {
        let s = emptySample();
        s = recordSample(s, 42, false);
        const m = sampleToMetric('kick', s);

        expect(m.lastMs).toBe(42);
        expect(m.minMs).toBe(42);
        expect(m.maxMs).toBe(42);
        expect(m.p50Ms).toBe(42);
        expect(m.p95Ms).toBe(42);
    });

    it('computes P50 and P95 on a sorted copy (input order does not affect output)', () => {
        // Build a known 11-sample distribution: 0..100 in steps of 10.
        let s = emptySample();
        const values = [100, 10, 50, 30, 80, 0, 70, 20, 90, 40, 60];

        for (const v of values) s = recordSample(s, v, false);

        const m = sampleToMetric('mute', s);

        // With 11 samples sorted 0..100, P50 = 50 (median index 5),
        // P95 = 95 (between sorted[9]=90 and sorted[10]=100, half-way).
        expect(m.p50Ms).toBe(50);
        expect(m.p95Ms).toBeCloseTo(95, 1);
        expect(m.minMs).toBe(0);
        expect(m.maxMs).toBe(100);
        expect(m.lastMs).toBe(60); // last pushed value
        expect(m.count).toBe(11);
    });

    it('preserves the error count in the snapshot', () => {
        let s = emptySample();
        s = recordSample(s, 10, true);
        s = recordSample(s, 20, true);
        s = recordSample(s, 30, false);

        const m = sampleToMetric('ban', s);

        expect(m.count).toBe(3);
        expect(m.errors).toBe(2);
    });
});

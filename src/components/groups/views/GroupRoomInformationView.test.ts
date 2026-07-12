import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('GroupRoomInformationView', () => {
    it('matches the width of the other HUD boxes', () => {
        const source = readFileSync(join(process.cwd(), 'src/components/groups/views/GroupRoomInformationView.tsx'), 'utf8');

        expect(source).toContain("'w-full max-w-[230px]'");
    });
});

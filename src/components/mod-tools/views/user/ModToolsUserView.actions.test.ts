import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ModToolsUserView action buttons', () => {
    it('uses the active blue treatment for regular actions', () => {
        const source = readFileSync(join(process.cwd(), 'src/components/mod-tools/views/user/ModToolsUserView.tsx'), 'utf8');
        const actionBar = source.slice(source.indexOf('{/* Action bar */}'));

        expect(actionBar.match(/variant="primary"/g)).toHaveLength(3);
        expect(actionBar.match(/mod-tools-action-button/g)).toHaveLength(3);
        expect(actionBar.match(/variant="danger"/g)).toHaveLength(1);
        expect(actionBar.match(/mod-tools-danger-button/g)).toHaveLength(1);
    });
});

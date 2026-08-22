import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const chatCss = readFileSync(resolve(process.cwd(), 'src/css/chat/Chats.css'), 'utf8');
const bubbleMovementDeclarations = chatCss.match(/\.bubble-container\s*\{([\s\S]*?)\.chat-bubble\s*\{/i)?.[1] ?? '';

afterEach(() => {
    document.body.replaceChildren();
    document.head.replaceChildren();
});

describe('Free-flow chat movement', () => {
    it('animates horizontal and vertical collision movement over the same interval', () => {
        const stylesheet = document.createElement('style');
        const bubble = document.createElement('div');

        stylesheet.textContent = `.bubble-container { ${bubbleMovementDeclarations} }`;
        bubble.className = 'bubble-container';
        document.head.append(stylesheet);
        document.body.append(bubble);

        const style = getComputedStyle(bubble);

        expect(style.transition).toBe('top 0.15s linear, left 0.15s linear');
    });
});

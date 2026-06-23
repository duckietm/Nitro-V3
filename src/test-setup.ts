import '@testing-library/jest-dom/vitest';

// Set up a container for React portals (used by NitroCardView's DraggableWindow)
const draggableWindowsContainer = document.createElement('div');
draggableWindowsContainer.id = 'draggable-windows-container';
document.body.appendChild(draggableWindowsContainer);

// jsdom doesn't ship ResizeObserver, but LayoutRoomPreviewerView (and
// any component that resizes a canvas to its container) constructs
// one at mount. A no-op stub is enough — the tests never assert
// resize-driven behavior, they just need the constructor to exist.
if (typeof globalThis.ResizeObserver === 'undefined') {
    class ResizeObserverStub {
        constructor(_callback: unknown) {
            // no-op
        }
        public observe(): void {
            // no-op
        }
        public unobserve(): void {
            // no-op
        }
        public disconnect(): void {
            // no-op
        }
    }
    (globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver = ResizeObserverStub;
}

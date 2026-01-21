import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Toast from './Toast';

describe('Toast Component', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders message when show is true', () => {
        render(<Toast message="Hello World" show={true} onClose={() => { }} />);
        expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('does not render when show is false', () => {
        render(<Toast message="Hidden" show={false} onClose={() => { }} />);
        expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });

    it('calls onClose after timeout', () => {
        const onClose = vi.fn();
        render(<Toast message="Autoclose" show={true} onClose={onClose} />);

        expect(onClose).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(2500);
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

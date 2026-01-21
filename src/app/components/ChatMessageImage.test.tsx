import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ChatMessageImage from './ChatMessageImage';

// Mock fetch
global.fetch = vi.fn();

describe('ChatMessageImage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders base64 image immediately', () => {
        const base64 = 'data:image/png;base64,fake';
        render(<ChatMessageImage src={base64} alt="Base64 Image" />);

        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', base64);
        expect(img).toHaveAttribute('alt', 'Base64 Image');
    });

    it('fetches image from API and renders it', async () => {
        const apiUrl = '/api/images/123';
        const fakeImage = 'data:image/jpeg;base64,fetched';

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data_image: fakeImage }),
        });

        render(<ChatMessageImage src={apiUrl} alt="API Image" />);

        // Initially loading (optional check depending on implementation speed)
        // await waitFor(() => expect(screen.queryByRole('img')).not.toBeInTheDocument());

        await waitFor(() => {
            const img = screen.getByRole('img');
            expect(img).toHaveAttribute('src', fakeImage);
        });
    });

    it('shows error state on fetch failure', async () => {
        const apiUrl = '/api/images/fail';

        (global.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

        render(<ChatMessageImage src={apiUrl} alt="Error Image" />);

        await waitFor(() => {
            expect(screen.getByText('Image indisponible')).toBeInTheDocument();
        });
    });
});

import { describe, it, expect } from 'vitest';
import { formatRoomName } from './helpers';

describe('formatRoomName', () => {
    it('should return original name if short enough', () => {
        const result = formatRoomName('Short Name');
        expect(result).toEqual({ short: 'Short Name', full: 'Short Name' });
    });

    it('should truncate long names', () => {
        const longName = 'This is a very long room name that exceeds the limit';
        const result = formatRoomName(longName, 20);
        expect(result.short.endsWith('…')).toBe(true);
        expect(result.short.length).toBeLessThanOrEqual(20);
        expect(result.full).toBe(longName);
    });

    it('should decode URI components', () => {
        const result = formatRoomName('Hello%20World');
        expect(result.full).toBe('Hello World');
    });

    it('should remove quotes', () => {
        const result = formatRoomName('"Quoted"');
        expect(result.full).toBe('Quoted');
    });
});

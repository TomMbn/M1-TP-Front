/**
 * Generates a unique ID (UUID or fallback)
 */
export const genId = (): string => {
    try {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }
    } catch (e) {
        // ignore
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * Format room name (decoding, trimming)
 */
export const formatRoomName = (raw: string, max = 40): { short: string; full: string } => {
    let full = raw;
    try {
        // Iteratively decode until stable or max iterations (handles double/triple encoding)
        let prev = null;
        const maxIterations = 6;
        let i = 0;
        while (i < maxIterations && full !== prev) {
            prev = full;
            try {
                full = decodeURIComponent(full);
            } catch (e) {
                // stop decoding if invalid
                break;
            }
            i++;
        }

        // Replace plus with space (some encodings use + for spaces)
        full = full.replace(/\+/g, " ");

        // Trim surrounding quotes or whitespace
        full = full.trim().replace(/^\"|\"$/g, "");
    } catch (e) {
        // leave raw if decode fails
        full = raw;
    }
    if (full.length <= max) return { short: full, full };
    const short = full.slice(0, max - 1).trim() + "…";
    return { short, full };
};

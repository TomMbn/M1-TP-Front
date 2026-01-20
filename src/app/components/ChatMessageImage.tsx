"use client";

import { useState, useEffect } from "react";

interface ChatMessageImageProps {
    src: string;
    alt: string;
    className?: string;
}

export default function ChatMessageImage({ src, alt, className }: ChatMessageImageProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src) return;

        if (src.startsWith("data:")) {
            setImageSrc(src);
            setLoading(false);
            return;
        }

        // If it's not a data URL and not from our specific API pattern, just use it directly
        if (!src.includes("/api/images/")) {
            setImageSrc(src);
            setLoading(false);
            return;
        }

        const fetchImage = async () => {
            try {
                setLoading(true);
                const res = await fetch(src);
                if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);

                const data = await res.json();
                // console.log("Image fetch response for", src, data); // Debug log

                if (data.success && data.data_image) {
                    setImageSrc(data.data_image);
                } else {
                    console.warn("Invalid image data received for:", src, data);
                    setError(true);
                }
            } catch (err) {
                console.warn("Error fetching chat image:", src, err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchImage();
    }, [src]);

    if (error) {
        return (
            <div className={`bg-gray-200 flex items-center justify-center text-gray-400 text-xs p-2 rounded ${className}`} style={{ width: '200px', height: '150px' }}>
                Image indisponible
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`bg-gray-200 animate-pulse rounded ${className}`} style={{ width: '200px', height: '150px' }} />
        );
    }

    return (
        <img
            src={imageSrc || ""}
            alt={alt}
            className={className}
        />
    );
}

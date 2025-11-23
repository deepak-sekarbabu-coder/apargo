/**
 * Utility functions for optimizing images, particularly for external sources like Google
 */

interface GoogleImageOptions {
    /**
     * Size in pixels for square images (default: 64)
     */
    size?: number;
    /**
     * Whether to crop the image to square (default: true)
     */
    crop?: boolean;
    /**
     * Quality setting (default: 90)
     */
    quality?: number;
}

/**
 * Optimizes Google user profile images by adding size and format parameters
 * 
 * Google Images support various URL parameters:
 * - s{size} or w{width}-h{height}: Resize image
 * - c: Crop to square
 * - rw: Use WebP format when supported
 * 
 * @param url - Original Google user image URL
 * @param options - Optimization options
 * @returns Optimized image URL
 * 
 * @example
 * ```ts
 * const optimized = optimizeGoogleImage(
 *   'https://lh3.googleusercontent.com/a/ACg8oc...',
 *   { size: 64, crop: true }
 * );
 * ```
 */
export function optimizeGoogleImage(
    url: string | undefined,
    options: GoogleImageOptions = {}
): string | undefined {
    if (!url) return undefined;

    // Only optimize Google user content URLs
    if (!url.includes('googleusercontent.com')) {
        return url;
    }

    const { size = 64, crop = true, quality = 90 } = options;

    try {
        // Remove any existing size parameters
        let optimizedUrl = url.replace(/=s\d+-c/, '').replace(/=s\d+/, '');

        // Add size and crop parameters
        // Format: =s{size}-c for square cropped images
        const sizeParam = crop ? `=s${size}-c` : `=s${size}`;

        // Add quality parameter if possible
        // Note: Google's image service may ignore quality in some cases
        const params = `${sizeParam}`;

        // Construct the optimized URL
        if (optimizedUrl.includes('=')) {
            optimizedUrl = optimizedUrl.replace(/=$/, params);
        } else {
            optimizedUrl = `${optimizedUrl}${params}`;
        }

        return optimizedUrl;
    } catch (error) {
        console.error('Error optimizing Google image URL:', error);
        return url;
    }
}

/**
 * Generate srcSet for responsive Google images
 * 
 * @param url - Original Google user image URL  
 * @param sizes - Array of sizes to generate (default: [32, 64, 96, 128])
 * @returns srcSet string for responsive images
 * 
 * @example
 * ```ts
 * const srcSet = generateGoogleImageSrcSet(
 *   'https://lh3.googleusercontent.com/a/ACg8oc...',
 *   [32, 64, 96]
 * );
 * // Returns: "url=s32-c 32w, url=s64-c 64w, url=s96-c 96w"
 * ```
 */
export function generateGoogleImageSrcSet(
    url: string | undefined,
    sizes: number[] = [32, 64, 96, 128]
): string | undefined {
    if (!url || !url.includes('googleusercontent.com')) {
        return undefined;
    }

    try {
        const srcSetParts = sizes.map(size => {
            const optimizedUrl = optimizeGoogleImage(url, { size, crop: true });
            return `${optimizedUrl} ${size}w`;
        });

        return srcSetParts.join(', ');
    } catch (error) {
        console.error('Error generating Google image srcSet:', error);
        return undefined;
    }
}

/**
 * Get the appropriate sizes attribute for avatar images
 * Based on common breakpoints and avatar display sizes
 * 
 * @returns sizes attribute value for responsive images
 */
export function getAvatarSizes(): string {
    // Mobile: 40px (2.5rem), Tablet: 48px (3rem), Desktop: 64px (4rem)
    return '(max-width: 640px) 40px, (max-width: 1024px) 48px, 64px';
}

/**
 * Performance optimization utilities for the credit portfolio dashboard
 */

// Memoization utility for expensive calculations
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
    const cache = new Map();

    return ((...args: any[]) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn(...args);
        cache.set(key, result);
        return result;
    }) as T;
}

// Debounce utility for search and filter operations
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        const callNow = immediate && !timeout;

        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            timeout = null;
            if (!immediate) func(...args);
        }, wait);

        if (callNow) func(...args);
    };
}

// Throttle utility for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Virtual scrolling utility for large datasets
export interface VirtualScrollOptions {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
}

export function calculateVirtualScrollRange(
    scrollTop: number,
    totalItems: number,
    options: VirtualScrollOptions
): { startIndex: number; endIndex: number; offsetY: number } {
    const { itemHeight, containerHeight, overscan = 5 } = options;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleItems + overscan * 2);
    const offsetY = startIndex * itemHeight;

    return { startIndex, endIndex, offsetY };
}

// Batch processing utility for large operations
export async function batchProcess<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize = 50,
    onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await processor(batch);
        results.push(...batchResults);

        if (onProgress) {
            onProgress(Math.min(i + batchSize, items.length), items.length);
        }
    }

    return results;
}

// Image lazy loading utility
export function createIntersectionObserver(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
): IntersectionObserver {
    return new IntersectionObserver(callback, {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
    });
}

// Memory usage monitoring
export function getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
} | null {
    if (typeof window !== 'undefined' && 'memory' in performance) {
        const memory = (performance as any).memory;
        return {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
        };
    }
    return null;
}

// Performance timing utility
export class PerformanceTimer {
    private startTime: number;
    private marks: Map<string, number> = new Map();

    constructor() {
        this.startTime = performance.now();
    }

    mark(name: string): void {
        this.marks.set(name, performance.now());
    }

    measure(name: string, startMark?: string): number {
        const endTime = performance.now();
        const startTime = startMark ? this.marks.get(startMark) || this.startTime : this.startTime;
        const duration = endTime - startTime;

        if (process.env.NODE_ENV === 'development') {
            console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
        }

        return duration;
    }

    getElapsed(): number {
        return performance.now() - this.startTime;
    }
}

// Cache utility with TTL support
export class TTLCache<K, V> {
    private cache = new Map<K, { value: V; expiry: number }>();
    private defaultTTL: number;

    constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
        this.defaultTTL = defaultTTL;
    }

    set(key: K, value: V, ttl?: number): void {
        const expiry = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, { value, expiry });
    }

    get(key: K): V | undefined {
        const item = this.cache.get(key);

        if (!item) return undefined;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return undefined;
        }

        return item.value;
    }

    has(key: K): boolean {
        return this.get(key) !== undefined;
    }

    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        // Clean expired items first
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
        return this.cache.size;
    }
}

// Bundle size analyzer utility
export function analyzeBundleSize(): void {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const totalSize = scripts.reduce((size, script) => {
            const src = script.getAttribute('src');
            if (src && src.includes('/_next/')) {
                // Estimate size based on script length (rough approximation)
                return size + (script.innerHTML.length || 1000);
            }
            return size;
        }, 0);

        console.log(`Estimated bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
    }
}

// React component performance wrapper
export function withPerformanceMonitoring<P extends object>(
    Component: React.ComponentType<P>,
    componentName: string
) {
    return function PerformanceMonitoredComponent(props: P) {
        const timer = new PerformanceTimer();

        // React.useEffect(() => {
        //     timer.measure(`${componentName} mount`);
        // }, []);

        // React.useEffect(() => {
        //     return () => {
        //         timer.measure(`${componentName} unmount`);
        //     };
        // }, []);

        // return React.createElement(Component, props);
    };
}
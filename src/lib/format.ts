/**
 * Format a date to a relative time string (e.g., "2 minutes ago", "1 hour ago")
 */
export function formatTimeAgo(dateString: string | Date): string {
    const date = dateString instanceof Date ? dateString : new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (seconds < 60) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    if (weeks < 4) return `${weeks}w ago`
    if (months < 12) return `${months}mo ago`
    return `${years}y ago`
}

/**
 * Format a date to a readable string
 */
export function formatDate(dateString: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const date = dateString instanceof Date ? dateString : new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
    })
}

/**
 * Format a date to a readable time string
 */
export function formatTime(dateString: string | Date): string {
    const date = dateString instanceof Date ? dateString : new Date(dateString)
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Format a date to a readable date and time string
 */
export function formatDateTime(dateString: string | Date): string {
    const date = dateString instanceof Date ? dateString : new Date(dateString)
    return `${formatDate(date)} at ${formatTime(date)}`
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
    return num.toLocaleString()
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`

    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return `${seconds}s`
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`
    if (hours < 24) return `${hours}h ${minutes % 60}m`
    return `${days}d ${hours % 24}h`
}

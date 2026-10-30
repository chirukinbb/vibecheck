export const isEmptyValue = (val: unknown): boolean => {
    if (val === null || val === undefined) return true;
    if (typeof val === 'string') return val.trim() === '';
    if (Array.isArray(val)) return val.length === 0;
    if (typeof val === 'object') return Object.keys(val as Record<string, unknown>).length === 0;
    return false;
};

export const isFilterEmpty = (filter: unknown): boolean => {
    if (!filter || typeof filter !== 'object') return true;
    return Object.values(filter as Record<string, unknown>).every(isEmptyValue);
};

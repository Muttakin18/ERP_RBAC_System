export const STATUS = {
    ACTIVE: 1,
    INACTIVE: 0,
    DELETED: -1
};

export const STATUS_LABELS: { [key: number]: string } = {
    1: 'Active',
    0: 'Inactive',
    [-1]: 'Deleted'
};

export const STATUS_COLORS: { [key: number]: string } = {
    1: 'bg-green-100 text-green-700',
    0: 'bg-yellow-100 text-yellow-700',
    [-1]: 'bg-red-100 text-red-700'
};
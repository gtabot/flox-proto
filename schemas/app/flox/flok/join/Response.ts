export interface Content {
    status: 'approved' | 'queued' | 'rejected';
    message?: string;   // Optional response message
}
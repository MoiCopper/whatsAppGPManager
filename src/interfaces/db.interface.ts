export interface Group {
    id: string;
    name: string;
    description: string;
    members: { [key: string]: Member };
}

export interface Member {
    id: string;
    name: string;
    isAdmin: boolean;
    punishments: {
        timeout: number;
        mute: number;
        ban: number;
        kick: number;
        warn: number;
        note: string;
    };
    currentPunishment?: {
        type: 'timeout' | 'mute' | 'ban' | 'kick' | 'warn';
        duration: number;
        reason: string;
        appliedAt: Date;
        expiresAt: Date | null;
    };
    menssagesIds: string[];
    numberOfMessages: number;
}

export interface DB {
    groups: { [key: string]: Group };
}

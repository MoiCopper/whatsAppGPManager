/**
 * Interfaces para os payloads de cada tipo de evento de domínio
 * Facilita a tipagem forte ao usar o EventBus
 */

import { Message } from "whatsapp-web.js";
import { CurrentPunishment } from "../../dtos/db.interface";

// Payload para MEMBER_MESSAGE_SENT
export interface MemberMessageSentPayload {
    groupId: string;
    memberId: string;
    message: Message;
    name: string;
    isAdmin: boolean;
}

// Payload para TIMEOUT_CREATED
export interface TimeoutCreatedPayload {
    groupId: string;
    memberId: string;
    duration: number;
    expiresAt: Date | string;
    reason?: string;
}

// Payload para TIMEOUT_EXPIRED
export interface TimeoutExpiredPayload {
    groupId: string;
    memberId: string;
    expiredAt?: string;
}

// Payload para TIMEOUT_REMOVED
export interface TimeoutRemovedPayload {
    groupId: string;
    memberId: string;
    removedBy?: string;
}

// Payload para PUNISHMENT_CHECKED
export interface PunishmentCheckedPayload {
    groupId: string;
    memberId: string;
    message: Message;
    punishment: CurrentPunishment
}

// Payload para GROUP_REGISTERED
export interface GroupRegisteredPayload {
    groupId: string;
    name: string;
}

// Payload para GROUP_UPDATED
export interface GroupUpdatedPayload {
    groupId: string;
    updates: {
        name?: string;
        description?: string;
        [key: string]: any;
    };
}

// Payload para MEMBER_CREATED
export interface MemberCreatedPayload {
    groupId: string;
    memberId: string;
    name: string;
    isAdmin: boolean;
}

// Payload para MEMBER_UPDATED
export interface MemberUpdatedPayload {
    groupId: string;
    memberId: string;
    updates: {
        name?: string;
        isAdmin?: boolean;
        numberOfMessages?: number;
        [key: string]: any;
    };
}

// Payload para COMMAND_EXECUTED
export interface CommandExecutedPayload {
    command: string;
    message: Message;
}

// Payload para COMMAND_FAILED
export interface CommandFailedPayload {
    command: string;
    executorId: string;
    groupId: string;
    error: string;
}


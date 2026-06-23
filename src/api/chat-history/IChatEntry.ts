export interface IChatEntry {
    id: number;
    webId: number;
    entityId: number;
    name: string;
    look?: string;
    message?: string;
    entityType?: number;
    style?: number;
    chatType?: number;
    imageUrl?: string;
    color?: string;
    showTranslation?: boolean;
    originalMessage?: string;
    translatedMessage?: string;
    detectedLanguage?: string;
    targetLanguage?: string;
    roomId: number;
    timestamp: string;
    type: number;
}

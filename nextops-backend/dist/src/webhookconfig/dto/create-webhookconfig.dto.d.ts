export declare class CreateWebhookConfigDto {
    projectId: string;
    url: string;
    secret?: string;
    events: string[];
    isActive?: boolean;
}

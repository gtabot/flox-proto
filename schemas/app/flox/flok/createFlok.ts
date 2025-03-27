export interface Content {
    name: string;               // Display name of the Flok
    description?: string;       // Optional description
    private: boolean;           // Whether the Flok is private
    inviteOnly: boolean;        // Whether joins require invites
    members?: {
        memberIds: string[];    // Initial member DIDs
        adminIds: string[];     // Initial admin DIDs
        maxMembers?: number;    // Optional member cap
    };
}
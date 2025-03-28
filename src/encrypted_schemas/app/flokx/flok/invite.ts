export interface Invite {
    flokId: string;      // The unique identifier for the Flok
    inviteId: string;    // The unique identifier for the invite
    inviterId?: string;  // DID of the user who sent the invite
    inviteeId?: string;  // DID of the user who received the invite
}

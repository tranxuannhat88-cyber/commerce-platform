import { GuestIdentity, ReviewInvitation, Order, Transaction } from "@/types";
import { cleanPhoneNumber, isValidVietnamesePhone } from "@/lib/utils";

export class GuestIdentityService {
  /**
   * Generates or resolves an immutable GuestIdentity record without creating a user account.
   */
  public static resolveOrCreateGuestIdentity(params: {
    customerPhone: string;
    customerName?: string;
    customerEmail?: string;
    existingGuests?: GuestIdentity[];
  }): GuestIdentity {
    const cleanedPhone = cleanPhoneNumber(params.customerPhone);
    const existing = params.existingGuests?.find(
      (g) => g.verified_phone === cleanedPhone && g.status !== "ARCHIVED"
    );

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const guestId = `gst_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const maskedName = this.maskCustomerName(params.customerName);

    return {
      id: guestId,
      status: "ACTIVE",
      display_name: maskedName,
      verified_phone: cleanedPhone,
      verified_email: params.customerEmail ? params.customerEmail.trim().toLowerCase() : undefined,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Generates a cryptographically random, unguessable token hash for Guest Review Invitations.
   */
  public static issueReviewInvitation(params: {
    transaction: Transaction | { id: string; order_id?: string; order_number?: string };
    guestIdentity: GuestIdentity;
    customerName?: string;
    customerPhone?: string;
    reviewDirection?: "BUYER_TO_SELLER" | "SELLER_TO_BUYER";
  }): { invitation: ReviewInvitation; rawToken: string; reviewUrl: string } {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    // Generate 32-byte secure token
    let rawToken = "";
    for (let i = 0; i < 4; i++) {
      rawToken += Math.random().toString(36).substring(2, 10);
    }
    const tokenHash = `tok_${rawToken}`;

    const invitation: ReviewInvitation = {
      id: `rinv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      transaction_id: params.transaction.id,
      order_id: params.transaction.order_id,
      order_number: params.transaction.order_number,
      participant_type: "GUEST",
      guest_identity_id: params.guestIdentity.id,
      review_direction: params.reviewDirection || "BUYER_TO_SELLER",
      recipient_phone: params.customerPhone || params.guestIdentity.verified_phone,
      recipient_name: params.customerName || params.guestIdentity.display_name,
      secure_token_hash: tokenHash,
      status: "PENDING",
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString(),
    };

    const reviewUrl = `/review/${tokenHash}`;

    return { invitation, rawToken: tokenHash, reviewUrl };
  }

  /**
   * Masks a Vietnamese full name (e.g., "Trần Xuân Nhất" -> "Trần N.")
   */
  public static maskCustomerName(fullName?: string): string {
    if (!fullName) return "Khách hàng đã xác minh";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const lastName = parts[0];
    const firstName = parts[parts.length - 1];
    return `${lastName} ${firstName.slice(0, 1).toUpperCase()}.`;
  }

  /**
   * Masks phone number for secure display (e.g. 0912345678 -> ***5678)
   */
  public static maskPhoneNumber(phone?: string): string {
    if (!phone) return "***";
    const clean = cleanPhoneNumber(phone);
    if (clean.length < 4) return clean;
    return `***${clean.slice(-4)}`;
  }
}

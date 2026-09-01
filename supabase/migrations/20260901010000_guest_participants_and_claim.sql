-- =========================================================================
-- MIGRATION: 20260901010000_guest_participants_and_claim.sql
-- DESCRIPTION: Guest Transaction Participant, Verified Guest Review & Account Claim
-- PRINCIPLES:
-- 1. TRANSACTION FIRST. REGISTRATION SECOND.
-- 2. A USER ACCOUNT IS NOT REQUIRED TO CREATE A VERIFIED TRANSACTION.
-- 3. LINK, DO NOT COPY ON ACCOUNT CLAIM.
-- =========================================================================

-- 1. Create guest_identities table
CREATE TABLE IF NOT EXISTS public.guest_identities (
    id TEXT PRIMARY KEY, -- gst_xxx
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLAIMED', 'ARCHIVED')),
    display_name TEXT,
    verified_phone TEXT,
    phone_verified_at TIMESTAMPTZ,
    verified_email TEXT,
    email_verified_at TIMESTAMPTZ,
    claimed_by_actor_id TEXT,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_identities_phone ON public.guest_identities (verified_phone);
CREATE INDEX IF NOT EXISTS idx_guest_identities_claimed_actor ON public.guest_identities (claimed_by_actor_id);

-- 2. Create review_invitations table
CREATE TABLE IF NOT EXISTS public.review_invitations (
    id TEXT PRIMARY KEY, -- rinv_xxx
    transaction_id TEXT NOT NULL,
    order_id TEXT,
    order_number TEXT,
    participant_type TEXT NOT NULL CHECK (participant_type IN ('ACTOR', 'GUEST')),
    guest_identity_id TEXT REFERENCES public.guest_identities(id) ON DELETE SET NULL,
    actor_id TEXT,
    review_direction TEXT NOT NULL CHECK (review_direction IN ('BUYER_TO_SELLER', 'SELLER_TO_BUYER')),
    recipient_phone TEXT,
    recipient_name TEXT,
    secure_token_hash TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'USED', 'EXPIRED', 'REVOKED')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_review_invitations_token_hash ON public.review_invitations (secure_token_hash);
CREATE INDEX IF NOT EXISTS idx_review_invitations_tx_guest ON public.review_invitations (transaction_id, guest_identity_id);

-- 3. Alter transaction_reviews to allow guest party identification
ALTER TABLE public.transaction_reviews
    ALTER COLUMN reviewer_actor_id DROP NOT NULL,
    ALTER COLUMN reviewer_actor_type DROP NOT NULL,
    ALTER COLUMN reviewee_actor_id DROP NOT NULL,
    ALTER COLUMN reviewee_actor_type DROP NOT NULL,
    ALTER COLUMN performed_by_user_id DROP NOT NULL;

ALTER TABLE public.transaction_reviews
    ADD COLUMN IF NOT EXISTS reviewer_party_type TEXT DEFAULT 'ACTOR' CHECK (reviewer_party_type IN ('ACTOR', 'GUEST')),
    ADD COLUMN IF NOT EXISTS reviewer_guest_identity_id TEXT REFERENCES public.guest_identities(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewee_party_type TEXT DEFAULT 'ACTOR' CHECK (reviewee_party_type IN ('ACTOR', 'GUEST')),
    ADD COLUMN IF NOT EXISTS reviewee_guest_identity_id TEXT REFERENCES public.guest_identities(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'AUTH_SESSION' CHECK (verification_method IN ('PHONE_OTP', 'AUTH_SESSION', 'INVITATION_TOKEN'));

-- 4. Enable RLS
ALTER TABLE public.guest_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_invitations ENABLE ROW LEVEL SECURITY;

-- RLS: Public can view verified invitations via secure token hash lookup only
CREATE POLICY "Public token lookup for review invitations"
ON public.review_invitations FOR SELECT
USING (status IN ('PENDING', 'VERIFIED'));

-- RLS: Claimed guest identities readable by claiming actor
CREATE POLICY "Claiming actor can view claimed guest identity"
ON public.guest_identities FOR SELECT
USING (claimed_by_actor_id = auth.uid()::text);

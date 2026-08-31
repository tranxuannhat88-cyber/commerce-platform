-- =========================================================================
-- MIGRATION: 20260901000000_verified_transaction_reviews.sql
-- DESCRIPTION: Verified Transaction Reviews & Reputation Engine Foundation
-- PRINCIPLE: ONLY REAL TRANSACTIONS CAN CREATE REPUTATION
-- =========================================================================

-- 1. Create transaction_reviews table
CREATE TABLE IF NOT EXISTS public.transaction_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL,
    order_id TEXT,
    order_number TEXT,
    
    reviewer_actor_id TEXT NOT NULL,
    reviewer_actor_type TEXT NOT NULL CHECK (reviewer_actor_type IN ('PERSONAL', 'ORGANIZATION')),
    reviewer_name TEXT,
    reviewer_avatar TEXT,
    
    reviewee_actor_id TEXT NOT NULL,
    reviewee_actor_type TEXT NOT NULL CHECK (reviewee_actor_type IN ('PERSONAL', 'ORGANIZATION')),
    reviewee_name TEXT,
    
    reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('BUYER', 'SELLER')),
    
    -- Universal Overall Rating
    overall_rating INT NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    
    -- Buyer -> Seller Criteria
    accuracy_rating INT CHECK (accuracy_rating IS NULL OR (accuracy_rating >= 1 AND accuracy_rating <= 5)),
    timeliness_rating INT CHECK (timeliness_rating IS NULL OR (timeliness_rating >= 1 AND timeliness_rating <= 5)),
    communication_rating INT CHECK (communication_rating IS NULL OR (communication_rating >= 1 AND communication_rating <= 5)),
    quality_rating INT CHECK (quality_rating IS NULL OR (quality_rating >= 1 AND quality_rating <= 5)),
    
    -- Seller -> Buyer Criteria
    payment_rating INT CHECK (payment_rating IS NULL OR (payment_rating >= 1 AND payment_rating <= 5)),
    clarity_rating INT CHECK (clarity_rating IS NULL OR (clarity_rating >= 1 AND clarity_rating <= 5)),
    cooperation_rating INT CHECK (cooperation_rating IS NULL OR (cooperation_rating >= 1 AND cooperation_rating <= 5)),
    
    comment VARCHAR(1000),
    
    status TEXT NOT NULL DEFAULT 'HIDDEN_PENDING_REVEAL' CHECK (
        status IN ('DRAFT', 'SUBMITTED', 'HIDDEN_PENDING_REVEAL', 'PUBLISHED', 'REPORTED', 'UNDER_REVIEW', 'HIDDEN', 'REMOVED')
    ),
    is_verified_transaction BOOLEAN NOT NULL DEFAULT true,
    
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    editable_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    review_deadline TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
    
    performed_by_user_id TEXT NOT NULL,
    review_hash TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Anti-Abuse: One review per actor per transaction & No self-review
    CONSTRAINT unique_transaction_actor_review UNIQUE (transaction_id, reviewer_actor_id, reviewee_actor_id),
    CONSTRAINT check_no_self_review CHECK (reviewer_actor_id != reviewee_actor_id)
);

-- Indexes for lightning fast review queries
CREATE INDEX IF NOT EXISTS idx_tx_reviews_reviewee ON public.transaction_reviews (reviewee_actor_id, status);
CREATE INDEX IF NOT EXISTS idx_tx_reviews_tx_id ON public.transaction_reviews (transaction_id);
CREATE INDEX IF NOT EXISTS idx_tx_reviews_status_deadline ON public.transaction_reviews (status, review_deadline);

-- 2. Create review_responses table
CREATE TABLE IF NOT EXISTS public.review_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.transaction_reviews(id) ON DELETE CASCADE,
    responder_actor_id TEXT NOT NULL,
    responder_name TEXT,
    comment VARCHAR(1000) NOT NULL,
    performed_by_user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_review_response UNIQUE (review_id)
);

-- 3. Create review_reports table
CREATE TABLE IF NOT EXISTS public.review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.transaction_reviews(id) ON DELETE CASCADE,
    reporter_actor_id TEXT NOT NULL,
    reporter_user_id TEXT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('SPAM', 'OFFENSIVE_CONTENT', 'NOT_TRANSACTION_RELATED', 'PERSONAL_INFO_LEAK', 'FRAUD', 'OTHER')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'INVESTIGATING', 'RESOLVED_HIDDEN', 'RESOLVED_KEPT', 'DISMISSED')),
    moderator_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create actor_review_stats table (Deterministic Cache)
CREATE TABLE IF NOT EXISTS public.actor_review_stats (
    actor_id TEXT PRIMARY KEY,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('PERSONAL', 'ORGANIZATION')),
    published_reviews_count INT NOT NULL DEFAULT 0,
    overall_rating_avg NUMERIC(3, 2),
    
    accuracy_rating_avg NUMERIC(3, 2),
    timeliness_rating_avg NUMERIC(3, 2),
    communication_rating_avg NUMERIC(3, 2),
    quality_rating_avg NUMERIC(3, 2),
    
    payment_rating_avg NUMERIC(3, 2),
    clarity_rating_avg NUMERIC(3, 2),
    cooperation_rating_avg NUMERIC(3, 2),
    
    rating_distribution JSONB NOT NULL DEFAULT '{"star_5": 0, "star_4": 0, "star_3": 0, "star_2": 0, "star_1": 0}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.transaction_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actor_review_stats ENABLE ROW LEVEL SECURITY;

-- RLS: Public can view PUBLISHED reviews only
CREATE POLICY "Public can view published reviews" 
ON public.transaction_reviews FOR SELECT 
USING (status = 'PUBLISHED');

-- RLS: Reviewer can view their own review even when hidden pending reveal
CREATE POLICY "Reviewer can view own review" 
ON public.transaction_reviews FOR SELECT 
USING (reviewer_actor_id = auth.uid()::text OR reviewer_actor_id = current_setting('request.jwt.claim.actor_id', true));

-- RLS: Review stats are public
CREATE POLICY "Public can view actor review stats" 
ON public.actor_review_stats FOR SELECT 
USING (true);

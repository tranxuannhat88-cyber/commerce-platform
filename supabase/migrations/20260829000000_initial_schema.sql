-- ==============================================================================
-- COMMERCE & TRANSACTION PLATFORM V1 - COMPLETE DATABASE MIGRATION
-- Dual-Sided Commerce + Blockchain Transaction Verification & Trust Engine
-- Multi-Tenant, RLS-Hardened, Event-Driven, Append-Only Ledger, Merkle Batching
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'SALES', 'PURCHASING', 'WAREHOUSE', 'ACCOUNTING', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE party_type AS ENUM ('CUSTOMER', 'SUPPLIER', 'BOTH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE offer_type AS ENUM ('PRODUCT', 'SERVICE', 'DIGITAL_PRODUCT', 'PACKAGE', 'SUBSCRIPTION', 'RENTAL', 'BOOKING', 'CUSTOM_QUOTATION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE offer_status AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE request_type AS ENUM ('PRODUCT_REQUEST', 'SERVICE_REQUEST', 'RFQ', 'CUSTOM_MANUFACTURING', 'REPAIR_REQUEST', 'PROCUREMENT_REQUEST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('DRAFT', 'OPEN', 'QUOTING', 'SELECTED', 'CLOSED', 'CANCELLED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE request_visibility AS ENUM ('PUBLIC_LINK', 'PRIVATE_INVITE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE quotation_status AS ENUM ('DRAFT', 'SUBMITTED', 'VIEWED', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE movement_type AS ENUM ('OPENING', 'PURCHASE', 'SALE', 'RETURN', 'DAMAGED', 'ADJUSTMENT', 'STOCKTAKE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_source AS ENUM ('SOURCE_OFFER', 'SOURCE_QUOTATION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('NEW', 'CONFIRMED', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('BANK_TRANSFER', 'COD', 'CASH', 'MOMO', 'VNPAY', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'COD_PENDING', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE ledger_entry_type AS ENUM ('ORDER_CREATED', 'PAYMENT_RECEIVED', 'REFUND', 'EXPENSE_LOGGED', 'DELIVERY_FEE', 'PLATFORM_FEE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE ledger_direction AS ENUM ('DEBIT', 'CREDIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM ('DELIVERY', 'MARKETING', 'RENT', 'UTILITIES', 'LABOR', 'MATERIALS', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('PENDING', 'BATCHED', 'ANCHORED', 'VERIFIED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE merkle_batch_status AS ENUM ('BUILDING', 'READY', 'ANCHORING', 'ANCHORED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE anchor_status AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. CORE COMMERCE TABLES

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tax_code TEXT,
    logo_url TEXT,
    phone TEXT,
    email TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'MEMBER',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    cover_image_url TEXT,
    description TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    location JSONB,
    social_links JSONB DEFAULT '{}'::jsonb,
    business_hours JSONB DEFAULT '{}'::jsonb,
    payment_settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type party_type NOT NULL DEFAULT 'CUSTOMER',
    name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    tax_code TEXT,
    addresses JSONB DEFAULT '[]'::jsonb,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC(15,2) DEFAULT 0,
    total_quotations INTEGER DEFAULT 0,
    last_interacted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    offer_type offer_type NOT NULL DEFAULT 'PRODUCT',
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    short_description TEXT,
    description TEXT,
    price NUMERIC(15,2) NOT NULL DEFAULT 0,
    compare_at_price NUMERIC(15,2),
    cost_price NUMERIC(15,2) DEFAULT 0,
    status offer_status NOT NULL DEFAULT 'DRAFT',
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    image_url TEXT,
    gallery JSONB DEFAULT '[]'::jsonb,
    inventory_tracking BOOLEAN DEFAULT FALSE,
    attributes JSONB DEFAULT '{}'::jsonb,
    service_duration_minutes INTEGER,
    service_unit TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, slug)
);

CREATE TABLE IF NOT EXISTS offer_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    sku TEXT,
    name TEXT NOT NULL,
    price NUMERIC(15,2) NOT NULL,
    cost_price NUMERIC(15,2) DEFAULT 0,
    barcode TEXT,
    weight NUMERIC(10,2),
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number TEXT UNIQUE NOT NULL,
    buyer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    buyer_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    request_type request_type NOT NULL DEFAULT 'PRODUCT_REQUEST',
    visibility request_visibility NOT NULL DEFAULT 'PUBLIC_LINK',
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL,
    target_budget NUMERIC(15,2),
    delivery_location TEXT,
    required_date DATE,
    quotation_deadline TIMESTAMPTZ,
    status request_status NOT NULL DEFAULT 'OPEN',
    allow_partial_quote BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'cái',
    specification TEXT,
    target_price NUMERIC(15,2),
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number TEXT UNIQUE NOT NULL,
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    buyer_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    buyer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    seller_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    seller_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_seller_name TEXT,
    guest_company_name TEXT,
    guest_phone TEXT,
    guest_email TEXT,
    guest_claim_token TEXT UNIQUE,
    currency TEXT DEFAULT 'VND',
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount NUMERIC(15,2) DEFAULT 0,
    tax NUMERIC(15,2) DEFAULT 0,
    shipping_fee NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) NOT NULL DEFAULT 0,
    lead_time TEXT,
    payment_terms TEXT,
    delivery_terms TEXT,
    warranty TEXT,
    valid_until DATE,
    note TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    status quotation_status NOT NULL DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    request_item_id UUID REFERENCES request_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    specification TEXT,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,
    total_price NUMERIC(15,2) NOT NULL,
    note TEXT
);

CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    address TEXT,
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES offer_variants(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    on_hand INTEGER NOT NULL DEFAULT 0,
    reserved INTEGER NOT NULL DEFAULT 0,
    available INTEGER GENERATED ALWAYS AS (on_hand - reserved) STORED,
    minimum_stock INTEGER DEFAULT 5,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(offer_id, variant_id, warehouse_id)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type movement_type NOT NULL,
    quantity INTEGER NOT NULL,
    before_qty INTEGER NOT NULL,
    after_qty INTEGER NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    note TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE NOT NULL,
    source_type order_source NOT NULL DEFAULT 'SOURCE_OFFER',
    source_id UUID,
    customer_id UUID REFERENCES business_parties(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    shipping_address JSONB,
    has_physical_items BOOLEAN DEFAULT TRUE,
    order_status order_status NOT NULL DEFAULT 'NEW',
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    shipping_fee NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL,
    customer_notes TEXT,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES offer_variants(id) ON DELETE SET NULL,
    offer_type TEXT NOT NULL,
    item_name TEXT NOT NULL,
    variant_name TEXT,
    unit_price NUMERIC(15,2) NOT NULL,
    cost_price NUMERIC(15,2) DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC(15,2) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method payment_method NOT NULL DEFAULT 'BANK_TRANSFER',
    payment_status payment_status NOT NULL DEFAULT 'UNPAID',
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'VND',
    provider TEXT NOT NULL DEFAULT 'VIETQR',
    provider_reference TEXT,
    qr_code_url TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    gateway_transaction_id TEXT UNIQUE NOT NULL,
    raw_payload JSONB NOT NULL,
    amount_received NUMERIC(15,2) NOT NULL,
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entry_type ledger_entry_type NOT NULL,
    direction ledger_direction NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    reference_type TEXT NOT NULL,
    reference_id UUID NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category expense_category NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    receipt_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    before_state JSONB,
    after_state JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. BLOCKCHAIN VERIFICATION & TRUST LAYER TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    transaction_code TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    quotation_version INTEGER DEFAULT 1,
    buyer_party_id UUID REFERENCES business_parties(id) ON DELETE SET NULL,
    seller_party_id UUID REFERENCES business_parties(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    verification_completeness_score INTEGER DEFAULT 0,
    is_fully_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS quotation_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    payload_snapshot JSONB NOT NULL,
    document_hashes JSONB DEFAULT '[]'::jsonb,
    canonical_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(quotation_id, version_number)
);

CREATE TABLE IF NOT EXISTS document_hashes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_version INTEGER DEFAULT 1,
    file_hash TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT,
    storage_path TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    entity_version INTEGER DEFAULT 1,
    event_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    canonical_payload_hash TEXT NOT NULL,
    hash_algorithm TEXT NOT NULL DEFAULT 'SHA-256',
    merkle_batch_id UUID,
    merkle_leaf_index INTEGER,
    verification_status verification_status NOT NULL DEFAULT 'PENDING',
    blockchain_anchor_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS merkle_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number BIGSERIAL UNIQUE,
    record_count INTEGER NOT NULL DEFAULT 0,
    merkle_root TEXT,
    status merkle_batch_status NOT NULL DEFAULT 'BUILDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    anchored_at TIMESTAMPTZ,
    blockchain_anchor_id UUID
);

CREATE TABLE IF NOT EXISTS blockchain_anchors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL DEFAULT 'EVM_ANCHOR',
    network TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    batch_id UUID NOT NULL REFERENCES merkle_batches(id) ON DELETE CASCADE,
    merkle_root TEXT NOT NULL,
    transaction_hash TEXT,
    block_number BIGINT,
    contract_address TEXT,
    status anchor_status NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    submitted_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

CREATE OR REPLACE FUNCTION auth.current_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE merkle_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_anchors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read organization" ON organizations FOR SELECT USING (id IN (SELECT auth.current_org_ids()));
CREATE POLICY "Public can view active stores" ON stores FOR SELECT USING (is_active = true);
CREATE POLICY "Org members manage stores" ON stores FOR ALL USING (organization_id IN (SELECT auth.current_org_ids()));
CREATE POLICY "Public can view active offers" ON offers FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Org members manage offers" ON offers FOR ALL USING (organization_id IN (SELECT auth.current_org_ids()));
CREATE POLICY "Public can view public requests" ON requests FOR SELECT USING (visibility = 'PUBLIC_LINK' AND status != 'DRAFT');
CREATE POLICY "Buyer manages own requests" ON requests FOR ALL USING (buyer_user_id = auth.uid() OR buyer_organization_id IN (SELECT auth.current_org_ids()));
CREATE POLICY "Buyer views quotes on their request" ON quotations FOR SELECT USING (request_id IN (SELECT id FROM requests WHERE buyer_user_id = auth.uid() OR buyer_organization_id IN (SELECT auth.current_org_ids())));
CREATE POLICY "Seller views own quotes" ON quotations FOR SELECT USING (seller_user_id = auth.uid() OR seller_organization_id IN (SELECT auth.current_org_ids()));
CREATE POLICY "Public can insert quotation" ON quotations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can place order" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Org members manage orders" ON orders FOR ALL USING (organization_id IN (SELECT auth.current_org_ids()));
CREATE POLICY "Org members read ledger" ON ledger_entries FOR SELECT USING (organization_id IN (SELECT auth.current_org_ids()));
CREATE POLICY "Org members manage expenses" ON expenses FOR ALL USING (organization_id IN (SELECT auth.current_org_ids()));
CREATE POLICY "Public can view verification records for passports" ON verification_records FOR SELECT USING (true);
CREATE POLICY "Public can view merkle batches" ON merkle_batches FOR SELECT USING (true);
CREATE POLICY "Public can view blockchain anchors" ON blockchain_anchors FOR SELECT USING (true);
CREATE POLICY "Public can view document hashes" ON document_hashes FOR SELECT USING (true);

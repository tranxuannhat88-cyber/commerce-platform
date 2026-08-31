"use client";

import { useState, useEffect } from "react";
import {
  Organization,
  OrganizationMember,
  PersonalActor,
  WorkContext,
  Store,
  BusinessParty,
  Category,
  Collection,
  Offer,
  RequestRFQ,
  Quotation,
  QuotationVersion,
  DocumentHash,
  VerificationRecord,
  MerkleBatch,
  BlockchainAnchor,
  Transaction,
  Order,
  Payment,
  Warehouse,
  InventoryItem,
  InventoryMovement,
  LedgerEntry,
  Expense,
  AppNotification,
  OfferVariant,
  RequestItem,
  QuotationItem,
  OrderItem,
  Product,
  ShippingMethod,
  ShippingZone,
  OrderShippingSnapshot,
  ShippingStatus,
  ActorPaymentAccount,
  StorePaymentSettings,
  StoreFulfillmentSettings,
  PaymentMethodType,
  FulfillmentMethodType,
} from "@/types";

import {
  INITIAL_PERSONAL_ACTOR,
  INITIAL_ORGANIZATION,
  INITIAL_ORGANIZATIONS,
  INITIAL_ORGANIZATION_MEMBERS,
  INITIAL_STORE,
  INITIAL_PAYMENT_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_COLLECTIONS,
  INITIAL_OFFERS,
  INITIAL_PRODUCTS,
  INITIAL_WAREHOUSES,
  INITIAL_INVENTORY,
  INITIAL_MOVEMENTS,
  INITIAL_REQUESTS,
  INITIAL_QUOTATIONS,
  INITIAL_ORDERS,
  INITIAL_PARTIES,
  INITIAL_LEDGER,
  INITIAL_EXPENSES,
  INITIAL_NOTIFICATIONS,
  INITIAL_DOCUMENT_HASHES,
  INITIAL_QUOTATION_VERSIONS,
  INITIAL_VERIFICATION_RECORDS,
  INITIAL_MERKLE_BATCHES,
  INITIAL_BLOCKCHAIN_ANCHORS,
  INITIAL_TRANSACTIONS,
  INITIAL_SHIPPING_METHODS,
  INITIAL_SHIPPING_ZONES,
  INITIAL_USER_IDENTITY,
  INITIAL_PASSKEYS,
  INITIAL_AUTH_SESSION,
  INITIAL_SUBSCRIPTION,
  INITIAL_SUBSCRIPTION_PERSONAL,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_BILLING_ORDERS,
  INITIAL_BILLING_INVOICES,
} from "./mock-data";
import { UserIdentity, PasskeyCredential, AuthSession, AuthMethodType } from "@/lib/auth/types";
import { PhoneNormalizationService } from "@/lib/auth/phone";
import {
  Subscription,
  BillingOrder,
  BillingInvoice,
  BillingPlanCode,
  BillingPeriod,
  BillingOrderType,
} from "@/lib/billing/types";
import { BillingService } from "@/lib/billing/billing-service";
import { EntitlementService } from "@/lib/billing/entitlement-service";

import { ShippingCalculationService } from "@/lib/shipping/engine";
import { PaymentSettingsService } from "@/lib/services/payment-settings-service";
import { FulfillmentService } from "@/lib/services/fulfillment-service";

import { 
  generateOrderNumber, 
  generateRequestNumber, 
  generateQuotationNumber 
} from "@/lib/utils";

import { canonicalizeVerificationPayload } from "@/core/verification/canonical";
import { computeSHA256, quickSyncHash } from "@/core/verification/hasher";
import { MerkleTree } from "@/core/verification/merkle";
import { defaultBlockchainProvider } from "@/core/verification/blockchain-adapter";

const STORAGE_KEYS = {
  PERSONAL_ACTOR: "commerce_personal_actor",
  ORGANIZATION: "commerce_org",
  ORGANIZATIONS: "commerce_organizations",
  ORGANIZATION_MEMBERS: "commerce_org_members",
  ACTIVE_CONTEXT: "commerce_active_context",
  STORE: "commerce_store",
  STORES: "commerce_stores_list",
  CATEGORIES: "commerce_categories",
  COLLECTIONS: "commerce_collections",
  OFFERS: "commerce_offers",
  PRODUCTS: "commerce_products",
  WAREHOUSES: "commerce_warehouses",
  INVENTORY: "commerce_inventory",
  MOVEMENTS: "commerce_movements",
  REQUESTS: "commerce_requests",
  QUOTATIONS: "commerce_quotations",
  QUOTATION_VERSIONS: "commerce_quote_versions",
  DOCUMENT_HASHES: "commerce_doc_hashes",
  VERIFICATION_RECORDS: "commerce_verif_records",
  MERKLE_BATCHES: "commerce_merkle_batches",
  BLOCKCHAIN_ANCHORS: "commerce_chain_anchors",
  TRANSACTIONS: "commerce_transactions",
  ORDERS: "commerce_orders",
  PARTIES: "commerce_parties",
  LEDGER: "commerce_ledger",
  EXPENSES: "commerce_expenses",
  NOTIFICATIONS: "commerce_notifications",
  SHIPPING_METHODS: "commerce_shipping_methods",
  SHIPPING_ZONES: "commerce_shipping_zones",
  PAYMENT_ACCOUNTS: "commerce_payment_accounts",
  USER: "commerce_user",
  PASSKEYS: "commerce_passkeys",
  SESSION: "commerce_session",
  SUBSCRIPTION: "commerce_subscription",
  SUBSCRIPTIONS: "commerce_subscriptions_list",
  BILLING_ORDERS: "commerce_billing_orders",
  BILLING_INVOICES: "commerce_billing_invoices",
};

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("commerce_storage_update", { detail: { key } }));
  } catch (e: any) {
    console.warn(`Storage quota notice on ${key}:`, e);
    try {
      // Clear non-critical verification log cache to free storage quota
      localStorage.removeItem(STORAGE_KEYS.MERKLE_BATCHES);
      localStorage.removeItem(STORAGE_KEYS.BLOCKCHAIN_ANCHORS);
      localStorage.removeItem(STORAGE_KEYS.DOCUMENT_HASHES);
      localStorage.removeItem(STORAGE_KEYS.VERIFICATION_RECORDS);
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent("commerce_storage_update", { detail: { key } }));
    } catch (retryErr) {
      console.error(`Critical storage save error for ${key}:`, retryErr);
    }
  }
}

export function useCommerceStore() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [personalActor, setPersonalActorState] = useState<PersonalActor>(INITIAL_PERSONAL_ACTOR);
  const [organization, setOrgState] = useState<Organization>(INITIAL_ORGANIZATION);
  const [organizations, setOrganizationsState] = useState<Organization[]>(INITIAL_ORGANIZATIONS);
  const [organizationMembers, setOrgMembersState] = useState<OrganizationMember[]>(INITIAL_ORGANIZATION_MEMBERS);
  const [currentContext, setCurrentContextState] = useState<WorkContext>({
    actor_id: INITIAL_PERSONAL_ACTOR.id,
    context_type: "PERSONAL",
    display_name: INITIAL_PERSONAL_ACTOR.display_name,
    plan_code: "FREE",
    is_active: true,
  });

  const [store, setStoreState] = useState<Store>(INITIAL_STORE);
  const [categories, setCategoriesState] = useState<Category[]>(INITIAL_CATEGORIES);
  const [collections, setCollectionsState] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [offers, setOffersState] = useState<Offer[]>(INITIAL_OFFERS);
  const [products, setProductsState] = useState<Product[]>(INITIAL_PRODUCTS);
  const [warehouses, setWarehousesState] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [inventory, setInventoryState] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [movements, setMovementsState] = useState<InventoryMovement[]>(INITIAL_MOVEMENTS);
  const [requests, setRequestsState] = useState<RequestRFQ[]>(INITIAL_REQUESTS);
  const [quotations, setQuotationsState] = useState<Quotation[]>(INITIAL_QUOTATIONS);
  const [quotationVersions, setQuoteVersionsState] = useState<QuotationVersion[]>(INITIAL_QUOTATION_VERSIONS);
  const [documentHashes, setDocHashesState] = useState<DocumentHash[]>(INITIAL_DOCUMENT_HASHES);
  const [verificationRecords, setVerifRecordsState] = useState<VerificationRecord[]>(INITIAL_VERIFICATION_RECORDS);
  const [merkleBatches, setMerkleBatchesState] = useState<MerkleBatch[]>(INITIAL_MERKLE_BATCHES);
  const [blockchainAnchors, setChainAnchorsState] = useState<BlockchainAnchor[]>(INITIAL_BLOCKCHAIN_ANCHORS);
  const [transactions, setTransactionsState] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [orders, setOrdersState] = useState<Order[]>(INITIAL_ORDERS);
  const [parties, setPartiesState] = useState<BusinessParty[]>(INITIAL_PARTIES);
  const [ledger, setLedgerState] = useState<LedgerEntry[]>(INITIAL_LEDGER);
  const [expenses, setExpensesState] = useState<Expense[]>(INITIAL_EXPENSES);
  const [notifications, setNotificationsState] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [shippingMethods, setShippingMethodsState] = useState<ShippingMethod[]>(INITIAL_SHIPPING_METHODS);
  const [shippingZones, setShippingZonesState] = useState<ShippingZone[]>(INITIAL_SHIPPING_ZONES);
  const [paymentAccounts, setPaymentAccountsState] = useState<ActorPaymentAccount[]>(INITIAL_PAYMENT_ACCOUNTS);
  const [currentUser, setCurrentUserState] = useState<UserIdentity | null>(INITIAL_USER_IDENTITY);
  const [currentSession, setCurrentSessionState] = useState<AuthSession | null>(INITIAL_AUTH_SESSION);
  const [passkeys, setPasskeysState] = useState<PasskeyCredential[]>(INITIAL_PASSKEYS);
  const [subscription, setSubscriptionState] = useState<Subscription>(INITIAL_SUBSCRIPTION);
  const [subscriptions, setSubscriptionsState] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  const [billingOrders, setBillingOrdersState] = useState<BillingOrder[]>(INITIAL_BILLING_ORDERS);
  const [billingInvoices, setBillingInvoicesState] = useState<BillingInvoice[]>(INITIAL_BILLING_INVOICES);

  useEffect(() => {
    // PURGE GUARD: Automatically clear stale mock data from previous sessions
    const PURGE_VERSION_KEY = "commerce_data_purge_version";
    const CURRENT_PURGE_VERSION = "2026_08_31_CLEAN_INTERNAL_TEST_V1";
    if (typeof window !== "undefined") {
      const storedPurgeVer = localStorage.getItem(PURGE_VERSION_KEY);
      if (storedPurgeVer !== CURRENT_PURGE_VERSION) {
        Object.values(STORAGE_KEYS).forEach((key) => {
          localStorage.removeItem(key);
        });
        localStorage.setItem(PURGE_VERSION_KEY, CURRENT_PURGE_VERSION);
      }
    }

    const storedUser = getStored<UserIdentity | null>(STORAGE_KEYS.USER, INITIAL_USER_IDENTITY);
    const storedPersonal = getStored<PersonalActor>(STORAGE_KEYS.PERSONAL_ACTOR, INITIAL_PERSONAL_ACTOR);
    const storedOrgs = getStored<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, INITIAL_ORGANIZATIONS);
    const storedMembers = getStored<OrganizationMember[]>(STORAGE_KEYS.ORGANIZATION_MEMBERS, INITIAL_ORGANIZATION_MEMBERS);
    const storedSubs = getStored<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    const storedActiveContext = getStored<WorkContext | null>(STORAGE_KEYS.ACTIVE_CONTEXT, null);

    setCurrentUserState(storedUser);

    const effectiveUserName = storedUser?.full_name || storedPersonal.display_name || "Cá nhân";
    const effectivePersonalActor: PersonalActor = {
      ...storedPersonal,
      user_id: storedUser?.id || storedPersonal.user_id,
      display_name: `${effectiveUserName} (Cá nhân)`,
      phone: storedUser?.primary_phone || storedPersonal.phone,
      email: storedUser?.primary_email || storedPersonal.email,
    };

    setPersonalActorState(effectivePersonalActor);
    setOrganizationsState(storedOrgs);
    setOrgMembersState(storedMembers);
    setSubscriptionsState(storedSubs);

    if (storedActiveContext) {
      if (storedActiveContext.context_type === "PERSONAL") {
        const updatedPersonalCtx: WorkContext = {
          ...storedActiveContext,
          display_name: effectiveUserName,
        };
        setCurrentContextState(updatedPersonalCtx);
        const sub = storedSubs.find((s) => s.actor_id === storedPersonal.id) || INITIAL_SUBSCRIPTION_PERSONAL;
        setSubscriptionState(sub);
      } else if (storedActiveContext.organization_id) {
        const matchingOrg = storedOrgs.find((o) => o.id === storedActiveContext.organization_id) || storedOrgs[0];
        if (matchingOrg) {
          setOrgState(matchingOrg);
          setCurrentContextState({
            ...storedActiveContext,
            display_name: matchingOrg.short_name || matchingOrg.name,
          });
        }
        const sub = storedSubs.find((s) => s.actor_id === matchingOrg?.id);
        if (sub) setSubscriptionState(sub);
      }
    } else {
      const defaultCtx: WorkContext = {
        actor_id: effectivePersonalActor.id,
        context_type: "PERSONAL",
        display_name: effectiveUserName,
        plan_code: "FREE",
        is_active: true,
      };
      setCurrentContextState(defaultCtx);
      setOrgState(getStored(STORAGE_KEYS.ORGANIZATION, INITIAL_ORGANIZATION));
      setSubscriptionState(getStored(STORAGE_KEYS.SUBSCRIPTION, INITIAL_SUBSCRIPTION_PERSONAL));
    }

    setStoreState(getStored(STORAGE_KEYS.STORE, INITIAL_STORE));
    setCategoriesState(getStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES));
    setCollectionsState(getStored(STORAGE_KEYS.COLLECTIONS, INITIAL_COLLECTIONS));
    const rawOffers = getStored<Offer[]>(STORAGE_KEYS.OFFERS, INITIAL_OFFERS);
    const sanitizedOffers = rawOffers.map((o) => ({
      ...o,
      image_url: o.image_url && o.image_url.includes("images.unsplash.com") ? undefined : o.image_url,
      items: o.items?.map((it) => ({
        ...it,
        image_url: it.image_url && it.image_url.includes("images.unsplash.com") ? undefined : it.image_url,
      })),
    }));
    setOffersState(sanitizedOffers);
    setStored(STORAGE_KEYS.OFFERS, sanitizedOffers);

    const rawProducts = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const sanitizedProducts = rawProducts.map((p) => ({
      ...p,
      image_url: p.image_url && p.image_url.includes("images.unsplash.com") ? undefined : p.image_url,
    }));
    setProductsState(sanitizedProducts);
    setStored(STORAGE_KEYS.PRODUCTS, sanitizedProducts);
    setWarehousesState(getStored(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES));
    setInventoryState(getStored(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY));
    setMovementsState(getStored(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS));
    setRequestsState(getStored(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS));
    setQuotationsState(getStored(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS));
    setQuoteVersionsState(getStored(STORAGE_KEYS.QUOTATION_VERSIONS, INITIAL_QUOTATION_VERSIONS));
    setDocHashesState(getStored(STORAGE_KEYS.DOCUMENT_HASHES, INITIAL_DOCUMENT_HASHES));
    setVerifRecordsState(getStored(STORAGE_KEYS.VERIFICATION_RECORDS, INITIAL_VERIFICATION_RECORDS));
    setMerkleBatchesState(getStored(STORAGE_KEYS.MERKLE_BATCHES, INITIAL_MERKLE_BATCHES));
    setChainAnchorsState(getStored(STORAGE_KEYS.BLOCKCHAIN_ANCHORS, INITIAL_BLOCKCHAIN_ANCHORS));
    setTransactionsState(getStored(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS));
    setOrdersState(getStored(STORAGE_KEYS.ORDERS, INITIAL_ORDERS));
    setPartiesState(getStored(STORAGE_KEYS.PARTIES, INITIAL_PARTIES));
    setLedgerState(getStored(STORAGE_KEYS.LEDGER, INITIAL_LEDGER));
    setExpensesState(getStored(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES));
    setNotificationsState(getStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS));
    setShippingMethodsState(getStored(STORAGE_KEYS.SHIPPING_METHODS, INITIAL_SHIPPING_METHODS));
    setShippingZonesState(getStored(STORAGE_KEYS.SHIPPING_ZONES, INITIAL_SHIPPING_ZONES));
    setPaymentAccountsState(getStored(STORAGE_KEYS.PAYMENT_ACCOUNTS, INITIAL_PAYMENT_ACCOUNTS));
    setCurrentSessionState(getStored(STORAGE_KEYS.SESSION, INITIAL_AUTH_SESSION));
    setPasskeysState(getStored(STORAGE_KEYS.PASSKEYS, INITIAL_PASSKEYS));
    setBillingOrdersState(getStored(STORAGE_KEYS.BILLING_ORDERS, INITIAL_BILLING_ORDERS));
    setBillingInvoicesState(getStored(STORAGE_KEYS.BILLING_INVOICES, INITIAL_BILLING_INVOICES));
    setIsLoaded(true);

    const handleStorageUpdate = () => {
      const u = getStored<UserIdentity | null>(STORAGE_KEYS.USER, INITIAL_USER_IDENTITY);
      const p = getStored<PersonalActor>(STORAGE_KEYS.PERSONAL_ACTOR, INITIAL_PERSONAL_ACTOR);
      const oList = getStored<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, INITIAL_ORGANIZATIONS);
      const mList = getStored<OrganizationMember[]>(STORAGE_KEYS.ORGANIZATION_MEMBERS, INITIAL_ORGANIZATION_MEMBERS);
      const sList = getStored<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
      const ctx = getStored<WorkContext | null>(STORAGE_KEYS.ACTIVE_CONTEXT, null);

      setCurrentUserState(u);

      const name = u?.full_name || p.display_name || "Cá nhân";
      const personalActorObj: PersonalActor = {
        ...p,
        user_id: u?.id || p.user_id,
        display_name: `${name} (Cá nhân)`,
      };
      setPersonalActorState(personalActorObj);
      setOrganizationsState(oList);
      setOrgMembersState(mList);
      setSubscriptionsState(sList);

      if (ctx) {
        if (ctx.context_type === "PERSONAL") {
          setCurrentContextState({ ...ctx, display_name: name });
        } else {
          setCurrentContextState(ctx);
        }
      }

      setOrgState(getStored(STORAGE_KEYS.ORGANIZATION, INITIAL_ORGANIZATION));
      setStoreState(getStored(STORAGE_KEYS.STORE, INITIAL_STORE));
      setCategoriesState(getStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES));
      setCollectionsState(getStored(STORAGE_KEYS.COLLECTIONS, INITIAL_COLLECTIONS));
      setOffersState(getStored(STORAGE_KEYS.OFFERS, INITIAL_OFFERS));
      setProductsState(getStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS));
      setWarehousesState(getStored(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES));
      setInventoryState(getStored(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY));
      setMovementsState(getStored(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS));
      setRequestsState(getStored(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS));
      setQuotationsState(getStored(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS));
      setQuoteVersionsState(getStored(STORAGE_KEYS.QUOTATION_VERSIONS, INITIAL_QUOTATION_VERSIONS));
      setDocHashesState(getStored(STORAGE_KEYS.DOCUMENT_HASHES, INITIAL_DOCUMENT_HASHES));
      setVerifRecordsState(getStored(STORAGE_KEYS.VERIFICATION_RECORDS, INITIAL_VERIFICATION_RECORDS));
      setMerkleBatchesState(getStored(STORAGE_KEYS.MERKLE_BATCHES, INITIAL_MERKLE_BATCHES));
      setChainAnchorsState(getStored(STORAGE_KEYS.BLOCKCHAIN_ANCHORS, INITIAL_BLOCKCHAIN_ANCHORS));
      setTransactionsState(getStored(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS));
      setOrdersState(getStored(STORAGE_KEYS.ORDERS, INITIAL_ORDERS));
      setPartiesState(getStored(STORAGE_KEYS.PARTIES, INITIAL_PARTIES));
      setLedgerState(getStored(STORAGE_KEYS.LEDGER, INITIAL_LEDGER));
      setExpensesState(getStored(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES));
      setNotificationsState(getStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS));
      setShippingMethodsState(getStored(STORAGE_KEYS.SHIPPING_METHODS, INITIAL_SHIPPING_METHODS));
      setShippingZonesState(getStored(STORAGE_KEYS.SHIPPING_ZONES, INITIAL_SHIPPING_ZONES));
      setPaymentAccountsState(getStored(STORAGE_KEYS.PAYMENT_ACCOUNTS, INITIAL_PAYMENT_ACCOUNTS));
      setCurrentSessionState(getStored(STORAGE_KEYS.SESSION, INITIAL_AUTH_SESSION));
      setPasskeysState(getStored(STORAGE_KEYS.PASSKEYS, INITIAL_PASSKEYS));
      setSubscriptionState(getStored(STORAGE_KEYS.SUBSCRIPTION, INITIAL_SUBSCRIPTION));
      setBillingOrdersState(getStored(STORAGE_KEYS.BILLING_ORDERS, INITIAL_BILLING_ORDERS));
      setBillingInvoicesState(getStored(STORAGE_KEYS.BILLING_INVOICES, INITIAL_BILLING_INVOICES));
    };

    window.addEventListener("commerce_storage_update", handleStorageUpdate);
    return () => window.removeEventListener("commerce_storage_update", handleStorageUpdate);
  }, []);

  const switchContext = (actorId: string) => {
    if (actorId === personalActor.id) {
      const personalSub = subscriptions.find((s) => s.actor_id === personalActor.id) || INITIAL_SUBSCRIPTION_PERSONAL;
      const ctx: WorkContext = {
        actor_id: personalActor.id,
        context_type: "PERSONAL",
        display_name: personalActor.display_name,
        plan_code: personalSub.plan_code,
        is_active: true,
      };
      setCurrentContextState(ctx);
      setSubscriptionState(personalSub);
      setStored(STORAGE_KEYS.ACTIVE_CONTEXT, ctx);
      return;
    }

    const org = organizations.find((o) => o.id === actorId);
    if (!org) return;
    const member = organizationMembers.find(
      (m) => m.organization_id === org.id && m.user_id === (currentUser?.id || "usr_2k_admin")
    );
    const orgSub = subscriptions.find((s) => s.actor_id === org.id) || {
      ...INITIAL_SUBSCRIPTION,
      actor_id: org.id,
      actor_name: org.name,
    };

    const ctx: WorkContext = {
      actor_id: org.id,
      context_type: "ORGANIZATION",
      organization_id: org.id,
      display_name: org.short_name || org.name,
      org_type: org.org_type || "COMPANY",
      role: member?.role || "OWNER",
      plan_code: orgSub.plan_code,
      is_active: true,
    };
    setCurrentContextState(ctx);
    setOrgState(org);
    setSubscriptionState(orgSub);
    setStored(STORAGE_KEYS.ACTIVE_CONTEXT, ctx);
  };

  const createOrganization = (data: {
    name: string;
    short_name?: string;
    org_type?: import("@/types").OrganizationType;
    tax_code?: string;
    phone?: string;
    email?: string;
    address?: string;
    logo_url?: string;
  }): Organization => {
    const orgId = `org_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newOrg: Organization = {
      id: orgId,
      name: data.name,
      short_name: data.short_name?.trim() || undefined,
      slug: (data.short_name || data.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      org_type: data.org_type || "COMPANY",
      tax_code: data.tax_code,
      phone: data.phone,
      email: data.email,
      address: data.address,
      logo_url: data.logo_url?.trim() || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newMember: OrganizationMember = {
      id: `mem_${Date.now()}`,
      organization_id: orgId,
      user_id: currentUser?.id || "usr_2k_admin",
      role: "OWNER",
      status: "ACTIVE",
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const newOrgSub: Subscription = {
      id: `sub_${orgId}`,
      actor_id: orgId,
      actor_type: "ORGANIZATION",
      actor_name: newOrg.name,
      plan_id: "plan-free",
      plan_code: "FREE",
      status: "ACTIVE",
      billing_period: "MONTHLY",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
      cancel_at_period_end: false,
      items: [
        {
          id: `item_${Date.now()}`,
          subscription_id: `sub_${orgId}`,
          item_type: "BASE_PLAN",
          quantity: 1,
          unit_price: 0,
          total_amount: 0,
          effective_from: new Date().toISOString(),
        },
      ],
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedOrgs = [...organizations, newOrg];
    const updatedMembers = [...organizationMembers, newMember];
    const updatedSubs = [...subscriptions, newOrgSub];

    setOrganizationsState(updatedOrgs);
    setStored(STORAGE_KEYS.ORGANIZATIONS, updatedOrgs);

    setOrgMembersState(updatedMembers);
    setStored(STORAGE_KEYS.ORGANIZATION_MEMBERS, updatedMembers);

    setSubscriptionsState(updatedSubs);
    setStored(STORAGE_KEYS.SUBSCRIPTIONS, updatedSubs);

    // Automatically switch context to new org
    const ctx: WorkContext = {
      actor_id: orgId,
      context_type: "ORGANIZATION",
      organization_id: orgId,
      display_name: newOrg.short_name || newOrg.name,
      org_type: newOrg.org_type,
      role: "OWNER",
      plan_code: "FREE",
      is_active: true,
    };
    setCurrentContextState(ctx);
    setOrgState(newOrg);
    setSubscriptionState(newOrgSub);
    setStored(STORAGE_KEYS.ACTIVE_CONTEXT, ctx);

    return newOrg;
  };

  const transferStoreToOrganization = (storeId: string, targetOrgId: string): boolean => {
    const targetOrg = organizations.find((o) => o.id === targetOrgId);
    if (!targetOrg) return false;

    const updatedStore = {
      ...store,
      organization_id: targetOrgId,
      owner_actor_id: targetOrgId,
      owner_actor_type: "ORGANIZATION" as const,
      updated_at: new Date().toISOString(),
    };
    setStoreState(updatedStore);
    setStored(STORAGE_KEYS.STORE, updatedStore);
    return true;
  };

  const getWorkContexts = (): WorkContext[] => {
    const personalSub = subscriptions.find((s) => s.actor_id === personalActor.id) || INITIAL_SUBSCRIPTION_PERSONAL;
    const personalContext: WorkContext = {
      actor_id: personalActor.id,
      context_type: "PERSONAL",
      display_name: currentUser?.full_name || personalActor.display_name,
      plan_code: personalSub.plan_code,
      is_active: currentContext.actor_id === personalActor.id,
    };

    const orgContexts: WorkContext[] = organizations.map((org) => {
      const member = organizationMembers.find(
        (m) => m.organization_id === org.id && m.user_id === (currentUser?.id || "usr_2k_admin")
      );
      const orgSub = subscriptions.find((s) => s.actor_id === org.id) || {
        ...INITIAL_SUBSCRIPTION,
        actor_id: org.id,
        actor_name: org.name,
      };

      return {
        actor_id: org.id,
        context_type: "ORGANIZATION",
        organization_id: org.id,
        display_name: org.short_name ? `${org.short_name} - ${org.name}` : org.name,
        org_type: org.org_type || "COMPANY",
        role: member?.role || "MEMBER",
        plan_code: orgSub.plan_code,
        is_active: currentContext.actor_id === org.id,
      };
    });

    return [personalContext, ...orgContexts];
  };

  const updateOrganization = (newOrg: Partial<Organization>) => {
    const updated = { ...organization, ...newOrg, updated_at: new Date().toISOString() };
    setOrgState(updated);
    setStored(STORAGE_KEYS.ORGANIZATION, updated);

    const updatedOrgs = organizations.map((o) => (o.id === organization.id ? updated : o));
    setOrganizationsState(updatedOrgs);
    setStored(STORAGE_KEYS.ORGANIZATIONS, updatedOrgs);

    if (currentContext.actor_id === organization.id) {
      const updatedCtx: WorkContext = {
        ...currentContext,
        display_name: updated.short_name || updated.name,
        org_type: updated.org_type || currentContext.org_type,
      };
      setCurrentContextState(updatedCtx);
      setStored(STORAGE_KEYS.ACTIVE_CONTEXT, updatedCtx);
    }
  };

  const updateStore = (newStore: Partial<Store>) => {
    const storeId = store.id || `store_${Date.now()}`;
    const updated: Store = {
      ...store,
      id: storeId,
      owner_actor_id: store.owner_actor_id || currentContext.actor_id,
      owner_actor_type: store.owner_actor_type || currentContext.context_type,
      organization_id: currentContext.context_type === "ORGANIZATION" ? currentContext.actor_id : undefined,
      ...newStore,
      updated_at: new Date().toISOString(),
    };
    setStoreState(updated);
    setStored(STORAGE_KEYS.STORE, updated);
  };

  // Helper to record verification proof
  const recordVerificationEvent = (params: {
    transactionId?: string;
    entityType: string;
    entityId: string;
    entityVersion?: number;
    eventType: string;
    payload: Record<string, unknown>;
  }) => {
    const canonicalStr = canonicalizeVerificationPayload(params.payload);
    const canonicalHash = quickSyncHash(canonicalStr);

    const record: VerificationRecord = {
      id: `vr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      organization_id: organization.id,
      transaction_id: params.transactionId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      entity_version: params.entityVersion || 1,
      event_id: `evt-${Date.now()}`,
      event_type: params.eventType,
      canonical_payload_hash: canonicalHash,
      hash_algorithm: "SHA-256",
      verification_status: "BATCHED",
      created_at: new Date().toISOString(),
    };

    const updated = [record, ...verificationRecords];
    setVerifRecordsState(updated);
    setStored(STORAGE_KEYS.VERIFICATION_RECORDS, updated);
    return record;
  };

  const addNotification = (notif: Omit<AppNotification, "id" | "organization_id" | "is_read" | "created_at">) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      organization_id: organization.id,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    const updated = [newNotif, ...notifications];
    setNotificationsState(updated);
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
  };

  const markNotificationRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    setNotificationsState(updated);
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
  };

  const upsertPartyFromOrder = (order: Order) => {
    const existing = parties.find((p) => p.phone === order.customer_phone);
    if (existing) {
      const updated = parties.map((p) =>
        p.id === existing.id
          ? {
              ...p,
              total_orders: p.total_orders + 1,
              total_spent: p.total_spent + order.total_amount,
              last_interacted_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : p
      );
      setPartiesState(updated);
      setStored(STORAGE_KEYS.PARTIES, updated);
    } else {
      const newParty: BusinessParty = {
        id: `party-${Date.now()}`,
        organization_id: organization.id,
        type: "CUSTOMER",
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email,
        total_orders: 1,
        total_spent: order.total_amount,
        total_quotations: 0,
        last_interacted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updated = [newParty, ...parties];
      setPartiesState(updated);
      setStored(STORAGE_KEYS.PARTIES, updated);
    }
  };

  function generateVietQRUrl(
    amount: number,
    orderRef: string,
    customBankSettings?: { bank_bin?: string; bank_account_no?: string; bank_account_name?: string }
  ): string {
    const bankBin = customBankSettings?.bank_bin || store.payment_settings?.bank_bin || "970422";
    const accountNo = customBankSettings?.bank_account_no || store.payment_settings?.bank_account_no || "098812345688";
    const accountName = encodeURIComponent(
      customBankSettings?.bank_account_name || store.payment_settings?.bank_account_name || "CONG TY TNHH KY THUAT 2K"
    );
    const cleanRef = orderRef.replace(/[^a-zA-Z0-9]/g, "");
    return `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png?amount=${amount}&addInfo=${cleanRef}&accountName=${accountName}`;
  }

  // OFFER ACTIONS
  const createOffer = (newOffer: Omit<Offer, "id" | "created_at" | "updated_at">) => {
    const offerId = `offer-${Date.now()}`;
    const offer: Offer = {
      ...newOffer,
      id: offerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [offer, ...offers];
    setOffersState(updated);
    setStored(STORAGE_KEYS.OFFERS, updated);

    if (offer.offer_type === "PRODUCT" && offer.inventory_tracking) {
      const defaultWhId = warehouses[0]?.id || INITIAL_WAREHOUSES[0]?.id || "wh-main-01";
      const newInvItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        organization_id: offer.organization_id,
        offer_id: offer.id,
        offer_name: offer.name,
        warehouse_id: defaultWhId,
        on_hand: 20,
        reserved: 0,
        available: 20,
        minimum_stock: 5,
        updated_at: new Date().toISOString(),
      };
      const updatedInv = [newInvItem, ...inventory];
      setInventoryState(updatedInv);
      setStored(STORAGE_KEYS.INVENTORY, updatedInv);

      const newMov: InventoryMovement = {
        id: `mov-${Date.now()}`,
        organization_id: offer.organization_id,
        inventory_item_id: newInvItem.id,
        offer_name: offer.name,
        movement_type: "OPENING",
        quantity: 20,
        before_qty: 0,
        after_qty: 20,
        note: "Khởi tạo tồn kho ban đầu",
        created_at: new Date().toISOString(),
      };
      const updatedMov = [newMov, ...movements];
      setMovementsState(updatedMov);
      setStored(STORAGE_KEYS.MOVEMENTS, updatedMov);
    }

    addNotification({
      type: "OFFER_CREATED",
      title: "Đã tạo Offer mới",
      message: `Offer "${offer.name}" đã được phát hành sẵn sàng chia sẻ.`,
      link: `/sell/offers`,
    });

    return offer;
  };

  const updateOffer = (id: string, updates: Partial<Offer>) => {
    const updated = offers.map((o) =>
      o.id === id ? { ...o, ...updates, updated_at: new Date().toISOString() } : o
    );
    setOffersState(updated);
    setStored(STORAGE_KEYS.OFFERS, updated);
  };

  const deleteOffer = (id: string) => {
    const updated = offers.filter((o) => o.id !== id);
    setOffersState(updated);
    setStored(STORAGE_KEYS.OFFERS, updated);
  };

  // PRODUCT LIBRARY ACTIONS
  const addProduct = (newProd: Omit<Product, "id" | "created_at" | "updated_at">) => {
    const prodId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const product: Product = {
      ...newProd,
      id: prodId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [product, ...products];
    setProductsState(updated);
    setStored(STORAGE_KEYS.PRODUCTS, updated);
    return product;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    );
    setProductsState(updated);
    setStored(STORAGE_KEYS.PRODUCTS, updated);
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProductsState(updated);
    setStored(STORAGE_KEYS.PRODUCTS, updated);
  };

  const syncProductsFromOfferItems = (items: import("@/types").OfferItem[], organizationId: string) => {
    let currentProducts = [...products];
    let hasChanges = false;

    items.forEach((item) => {
      if (!item.name || !item.name.trim()) return;
      const normalizedName = item.name.trim().toLowerCase();
      const existingIdx = currentProducts.findIndex(
        (p) => p.name.trim().toLowerCase() === normalizedName
      );

      if (existingIdx >= 0) {
        const existing = currentProducts[existingIdx];
        currentProducts[existingIdx] = {
          ...existing,
          price: item.price || existing.price,
          compare_at_price: item.compare_at_price || existing.compare_at_price,
          unit: item.unit || existing.unit,
          description: item.description || existing.description,
          image_url: item.image_url || existing.image_url,
          gallery: item.gallery && item.gallery.length > 0 ? item.gallery : existing.gallery,
          attachments: item.attachments && item.attachments.length > 0 ? item.attachments : existing.attachments,
          variants: item.variants && item.variants.length > 0 ? item.variants : existing.variants,
          updated_at: new Date().toISOString(),
        };
        hasChanges = true;
      } else {
        const newProd: Product = {
          id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          organization_id: organizationId || organization.id,
          store_id: store.id,
          name: item.name.trim(),
          price: item.price || 0,
          compare_at_price: item.compare_at_price,
          cost_price: (item.price || 0) * 0.5,
          unit: item.unit || "cái",
          category: item.category || "Chung",
          description: item.description || "",
          image_url: item.image_url?.trim() || undefined,
          gallery: item.gallery || [],
          attachments: item.attachments || [],
          variants: item.variants || [],
          is_available: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        currentProducts = [newProd, ...currentProducts];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setProductsState(currentProducts);
      setStored(STORAGE_KEYS.PRODUCTS, currentProducts);
    }
  };

  // PRODUCT AVAILABILITY & VISIBILITY ACTIONS
  const updateProductStatus = (productId: string, newStatus: import("@/types").ProductStatus) => {
    const updatedProducts = products.map((p) =>
      p.id === productId ? { ...p, product_status: newStatus, updated_at: new Date().toISOString() } : p
    );
    setProductsState(updatedProducts);
    setStored(STORAGE_KEYS.PRODUCTS, updatedProducts);

    // Sync corresponding Offer if offer ID matches
    const updatedOffers = offers.map((o) =>
      o.id === productId || o.slug.includes(productId) ? { ...o, product_status: newStatus, updated_at: new Date().toISOString() } : o
    );
    setOffersState(updatedOffers);
    setStored(STORAGE_KEYS.OFFERS, updatedOffers);

    addNotification({
      type: "SYSTEM_SECURITY",
      title: "Cập nhật trạng thái sản phẩm",
      message: `Sản phẩm đã chuyển sang trạng thái "${newStatus}".`,
      link: "/inventory",
    });
  };

  const updateManualAvailability = (productId: string, newAvail: import("@/types").AvailabilityStatus) => {
    const updatedProducts = products.map((p) =>
      p.id === productId ? { ...p, availability_status: newAvail, is_available: newAvail !== "OUT_OF_STOCK", updated_at: new Date().toISOString() } : p
    );
    setProductsState(updatedProducts);
    setStored(STORAGE_KEYS.PRODUCTS, updatedProducts);

    const updatedOffers = offers.map((o) =>
      o.id === productId ? { ...o, availability_status: newAvail, is_available: newAvail !== "OUT_OF_STOCK", updated_at: new Date().toISOString() } : o
    );
    setOffersState(updatedOffers);
    setStored(STORAGE_KEYS.OFFERS, updatedOffers);
  };

  const restockProduct = (productId: string, addQuantity: number) => {
    if (addQuantity <= 0) return;

    let targetProductName = "";
    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        targetProductName = p.name;
        const newQty = (p.available_quantity || 0) + addQuantity;
        const threshold = p.low_stock_threshold || 5;
        const newAvail: import("@/types").AvailabilityStatus = newQty > threshold ? "IN_STOCK" : (newQty > 0 ? "LOW_STOCK" : "OUT_OF_STOCK");
        return {
          ...p,
          available_quantity: newQty,
          availability_status: newAvail,
          is_available: true,
          updated_at: new Date().toISOString(),
        };
      }
      return p;
    });
    setProductsState(updatedProducts);
    setStored(STORAGE_KEYS.PRODUCTS, updatedProducts);

    // Also update Offer
    const updatedOffers = offers.map((o) => {
      if (o.id === productId) {
        const newQty = (o.available_quantity || 0) + addQuantity;
        const threshold = o.low_stock_threshold || 5;
        const newAvail: import("@/types").AvailabilityStatus = newQty > threshold ? "IN_STOCK" : (newQty > 0 ? "LOW_STOCK" : "OUT_OF_STOCK");
        return {
          ...o,
          available_quantity: newQty,
          availability_status: newAvail,
          updated_at: new Date().toISOString(),
        };
      }
      return o;
    });
    setOffersState(updatedOffers);
    setStored(STORAGE_KEYS.OFFERS, updatedOffers);

    addNotification({
      type: "SYSTEM_SECURITY",
      title: "Nhập kho thành công",
      message: `Đã nhập thêm ${addQuantity} vào sản phẩm "${targetProductName || productId}". Sản phẩm đã tự động hiển thị lại trên bảng giá.`,
      link: "/inventory",
    });
  };

  const updateStoreVisibilitySettings = (newSettings: Partial<import("@/types").StoreProductVisibilitySettings>) => {
    const updatedStore: Store = {
      ...store,
      product_visibility_settings: {
        ...(store.product_visibility_settings || { show_out_of_stock_products: true }),
        ...newSettings,
      },
      updated_at: new Date().toISOString(),
    };
    setStoreState(updatedStore);
    setStored(STORAGE_KEYS.STORE, updatedStore);
  };

  const updateStorePublicSettings = (
    publicSettings: import("@/types").StorePublicSettings,
    policySettings?: import("@/types").StorePolicySettings
  ) => {
    const updatedStore: Store = {
      ...store,
      public_settings: publicSettings,
      ...(policySettings ? { policy_settings: policySettings } : {}),
      updated_at: new Date().toISOString(),
    };
    setStoreState(updatedStore);
    setStored(STORAGE_KEYS.STORE, updatedStore);
    return updatedStore;
  };

  // PAYMENT ACCOUNT & STORE SETTINGS ACTIONS
  const addPaymentAccount = (newAcc: Omit<ActorPaymentAccount, "id" | "created_at" | "updated_at">) => {
    const accId = `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const isFirst = paymentAccounts.length === 0 || newAcc.is_default;
    const current = isFirst ? paymentAccounts.map((a) => ({ ...a, is_default: false })) : [...paymentAccounts];
    const account: ActorPaymentAccount = {
      ...newAcc,
      id: accId,
      is_default: isFirst,
      verification_status: "VERIFIED",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [account, ...current];
    setPaymentAccountsState(updated);
    setStored(STORAGE_KEYS.PAYMENT_ACCOUNTS, updated);
    return account;
  };

  const updatePaymentAccount = (id: string, updates: Partial<ActorPaymentAccount>) => {
    const updated = paymentAccounts.map((a) =>
      a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a
    );
    setPaymentAccountsState(updated);
    setStored(STORAGE_KEYS.PAYMENT_ACCOUNTS, updated);
  };

  const deletePaymentAccount = (id: string) => {
    const updated = paymentAccounts.filter((a) => a.id !== id);
    setPaymentAccountsState(updated);
    setStored(STORAGE_KEYS.PAYMENT_ACCOUNTS, updated);
  };

  const setDefaultPaymentAccount = (id: string) => {
    const updated = paymentAccounts.map((a) => ({
      ...a,
      is_default: a.id === id,
      updated_at: new Date().toISOString(),
    }));
    setPaymentAccountsState(updated);
    setStored(STORAGE_KEYS.PAYMENT_ACCOUNTS, updated);

    // Also update default account in store payment settings
    if (store.advanced_payment_settings) {
      updateStorePaymentSettings({
        ...store.advanced_payment_settings,
        default_payment_account_id: id,
      });
    }
  };

  const updateStorePaymentSettings = (settings: StorePaymentSettings) => {
    const updatedStore: Store = {
      ...store,
      advanced_payment_settings: settings,
      updated_at: new Date().toISOString(),
    };
    setStoreState(updatedStore);
    setStored(STORAGE_KEYS.STORE, updatedStore);
    return updatedStore;
  };

  const updateStoreFulfillmentSettings = (settings: StoreFulfillmentSettings) => {
    const updatedStore: Store = {
      ...store,
      advanced_fulfillment_settings: settings,
      updated_at: new Date().toISOString(),
    };
    setStoreState(updatedStore);
    setStored(STORAGE_KEYS.STORE, updatedStore);
    return updatedStore;
  };

  // REQUEST & RFQ ACTIONS
  const createRequest = (newReq: Omit<RequestRFQ, "id" | "request_number" | "created_at" | "updated_at">) => {
    const reqId = `req-${Date.now()}`;
    const reqNum = generateRequestNumber();
    const req: RequestRFQ = {
      ...newReq,
      id: reqId,
      request_number: reqNum,
      quotations_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [req, ...requests];
    setRequestsState(updated);
    setStored(STORAGE_KEYS.REQUESTS, updated);

    // Record document hash if attachment present
    if (newReq.attachments && newReq.attachments.length > 0) {
      const docHash: DocumentHash = {
        id: `dochash-${Date.now()}`,
        organization_id: organization.id,
        entity_type: "REQUEST",
        entity_id: reqId,
        file_name: newReq.attachments[0].file_name,
        file_version: 1,
        file_hash: quickSyncHash(newReq.attachments[0].file_name),
        file_size: newReq.attachments[0].file_size || 1500000,
        storage_path: newReq.attachments[0].file_url,
        uploaded_at: new Date().toISOString(),
      };
      const updatedDocs = [docHash, ...documentHashes];
      setDocHashesState(updatedDocs);
      setStored(STORAGE_KEYS.DOCUMENT_HASHES, updatedDocs);
    }

    // Cryptographic verification record
    recordVerificationEvent({
      entityType: "request",
      entityId: reqId,
      eventType: "REQUEST_PUBLISHED",
      payload: {
        request_number: reqNum,
        title: req.title,
        budget: req.target_budget,
        deadline: req.quotation_deadline,
        items_count: req.items?.length || 1,
      },
    });

    addNotification({
      type: "REQUEST_CREATED",
      title: "Đã đăng Yêu cầu Mua hàng (RFQ)",
      message: `Yêu cầu "${req.title}" đã mở và được tạo chứng thực mã hóa.`,
      link: `/buy/requests`,
    });

    return req;
  };

  const deleteRequest = (requestId: string) => {
    const updated = requests.filter((r) => r.id !== requestId);
    setRequestsState(updated);
    setStored(STORAGE_KEYS.REQUESTS, updated);

    addNotification({
      type: "SYSTEM_SECURITY",
      title: "Đã xóa Yêu cầu Mua hàng",
      message: "Yêu cầu mua hàng đã được xóa khỏi hệ thống.",
      link: "/buy/requests",
    });
  };

  // QUOTATION ACTIONS
  const submitQuotation = (newQuote: Omit<Quotation, "id" | "quotation_number" | "created_at" | "updated_at" | "submitted_at" | "version">) => {
    const quoteId = `quote-${Date.now()}`;
    const quoteNum = generateQuotationNumber();
    const version = 1;

    const quote: Quotation = {
      ...newQuote,
      id: quoteId,
      quotation_number: quoteNum,
      version,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedQuotes = [quote, ...quotations];
    setQuotationsState(updatedQuotes);
    setStored(STORAGE_KEYS.QUOTATIONS, updatedQuotes);

    // Save quotation version snapshot
    const canonicalHash = quickSyncHash(
      canonicalizeVerificationPayload({
        quotation_number: quoteNum,
        total: quote.total,
        lead_time: quote.lead_time,
        payment_terms: quote.payment_terms,
      })
    );

    const quoteVer: QuotationVersion = {
      id: `qv-${Date.now()}`,
      quotation_id: quoteId,
      version_number: version,
      payload_snapshot: {
        total: quote.total,
        subtotal: quote.subtotal,
        lead_time: quote.lead_time,
        payment_terms: quote.payment_terms,
        warranty: quote.warranty,
      },
      document_hashes: [],
      canonical_hash: canonicalHash,
      created_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    };
    const updatedVers = [quoteVer, ...quotationVersions];
    setQuoteVersionsState(updatedVers);
    setStored(STORAGE_KEYS.QUOTATION_VERSIONS, updatedVers);

    // Verification record for Quotation Submitted
    recordVerificationEvent({
      entityType: "quotation",
      entityId: quoteId,
      entityVersion: version,
      eventType: "QUOTATION_SUBMITTED",
      payload: {
        quotation_number: quoteNum,
        request_id: quote.request_id,
        total_amount: quote.total,
        version: version,
      },
    });

    // Update request
    const updatedReqs = requests.map((r) =>
      r.id === quote.request_id
        ? {
            ...r,
            status: r.status === "OPEN" ? ("QUOTING" as const) : r.status,
            quotations_count: (r.quotations_count || 0) + 1,
            updated_at: new Date().toISOString(),
          }
        : r
    );
    setRequestsState(updatedReqs);
    setStored(STORAGE_KEYS.REQUESTS, updatedReqs);

    addNotification({
      type: "NEW_QUOTATION",
      title: `Nhận Báo giá mới cho ${quote.request_title || "Yêu cầu"}`,
      message: `${quote.guest_company_name || quote.guest_seller_name || "Nhà cung cấp"} vừa gửi báo giá ${new Intl.NumberFormat("vi-VN").format(quote.total)}đ.`,
      link: `/buy/requests`,
    });

    return quote;
  };

  const markQuotationViewed = (quoteId: string) => {
    const updated = quotations.map((q) =>
      q.id === quoteId && q.status === "SUBMITTED"
        ? { ...q, status: "VIEWED" as const, viewed_at: new Date().toISOString() }
        : q
    );
    setQuotationsState(updated);
    setStored(STORAGE_KEYS.QUOTATIONS, updated);
  };

  const acceptQuotation = (quoteId: string) => {
    const targetQuote = quotations.find((q) => q.id === quoteId);
    if (!targetQuote) return;

    // 1. Update quotation statuses
    const updatedQuotes = quotations.map((q) => {
      if (q.id === quoteId) return { ...q, status: "ACCEPTED" as const };
      if (q.request_id === targetQuote.request_id) return { ...q, status: "REJECTED" as const };
      return q;
    });
    setQuotationsState(updatedQuotes);
    setStored(STORAGE_KEYS.QUOTATIONS, updatedQuotes);

    // 2. Update request status to SELECTED
    const targetReq = requests.find((r) => r.id === targetQuote.request_id);
    const updatedReqs = requests.map((r) =>
      r.id === targetQuote.request_id ? { ...r, status: "SELECTED" as const } : r
    );
    setRequestsState(updatedReqs);
    setStored(STORAGE_KEYS.REQUESTS, updatedReqs);

    // 3. Auto create Order
    const orderNumber = generateOrderNumber();
    const orderId = `order-q-${Date.now()}`;
    const txCode = `TX${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, "0")}${new Date().getDate().toString().padStart(2, "0")}-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderItems: OrderItem[] = (targetQuote.items || []).map((item, idx) => ({
      id: `oi-q-${Date.now()}-${idx}`,
      order_id: orderId,
      offer_type: "SERVICE",
      item_name: item.item_name,
      unit_price: item.unit_price,
      cost_price: item.unit_price * 0.7,
      quantity: item.quantity,
      total_price: item.total_price,
    }));

    const newOrder: Order = {
      id: orderId,
      organization_id: targetQuote.seller_organization_id || organization.id,
      store_id: store.id,
      order_number: orderNumber,
      source_type: "SOURCE_QUOTATION",
      source_id: targetQuote.id,
      customer_name: targetQuote.guest_company_name || targetQuote.guest_seller_name || "Khách Hàng Báo Giá",
      customer_phone: targetQuote.guest_phone || "0988.000.000",
      customer_email: targetQuote.guest_email,
      has_physical_items: false,
      order_status: "CONFIRMED",
      subtotal: targetQuote.subtotal,
      discount_amount: targetQuote.discount,
      shipping_fee: targetQuote.shipping_fee,
      total_amount: targetQuote.total,
      items: orderItems,
      payment: {
        id: `pay-q-${Date.now()}`,
        organization_id: targetQuote.seller_organization_id || organization.id,
        order_id: orderId,
        payment_method: "BANK_TRANSFER",
        payment_status: "UNPAID",
        amount: targetQuote.total,
        currency: "VND",
        provider: "VIETQR",
        qr_code_url: generateVietQRUrl(targetQuote.total, orderNumber),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedOrders = [newOrder, ...orders];
    setOrdersState(updatedOrders);
    setStored(STORAGE_KEYS.ORDERS, updatedOrders);

    // 4. Create Transaction Passport Entity
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      organization_id: organization.id,
      transaction_code: txCode,
      order_id: orderId,
      order_number: orderNumber,
      request_id: targetQuote.request_id,
      request_number: targetReq?.request_number || "RQ260829-00125",
      quotation_id: targetQuote.id,
      quotation_number: targetQuote.quotation_number,
      quotation_version: targetQuote.version || 3,
      buyer_name: targetReq?.buyer_name || "Bên Mua Hàng",
      seller_name: targetQuote.guest_company_name || targetQuote.guest_seller_name || organization.name,
      total_amount: targetQuote.total,
      status: "ACTIVE",
      verification_completeness_score: 60, // Request + Quote + Acceptance = 60%
      is_fully_verified: false,
      created_at: new Date().toISOString(),
    };
    const updatedTxs = [newTx, ...transactions];
    setTransactionsState(updatedTxs);
    setStored(STORAGE_KEYS.TRANSACTIONS, updatedTxs);

    // 5. Verification Records
    recordVerificationEvent({
      transactionId: newTx.id,
      entityType: "quotation",
      entityId: targetQuote.id,
      entityVersion: targetQuote.version || 3,
      eventType: "QUOTATION_ACCEPTED",
      payload: {
        quotation_number: targetQuote.quotation_number,
        accepted_version: targetQuote.version || 3,
        total_amount: targetQuote.total,
      },
    });

    recordVerificationEvent({
      transactionId: newTx.id,
      entityType: "order",
      entityId: orderId,
      eventType: "ORDER_CREATED",
      payload: {
        order_number: orderNumber,
        total_amount: targetQuote.total,
        source: "SOURCE_QUOTATION",
      },
    });

    addNotification({
      type: "QUOTATION_ACCEPTED",
      title: `Báo giá ${targetQuote.quotation_number} đã được chấp nhận!`,
      message: `Tạo Đơn hàng ${orderNumber} & Khởi tạo Transaction Passport ${txCode}.`,
      link: `/sell/orders`,
    });

    return newOrder;
  };

  const claimGuestQuotations = (claimToken: string) => {
    const updated = quotations.map((q) =>
      q.guest_claim_token === claimToken
        ? {
            ...q,
            seller_organization_id: organization.id,
            guest_claim_token: undefined,
            updated_at: new Date().toISOString(),
          }
        : q
    );
    setQuotationsState(updated);
    setStored(STORAGE_KEYS.QUOTATIONS, updated);
  };

  // ORDER & CHECKOUT
  const createOrder = (orderData: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    shipping_address?: { full_address: string; latitude?: number; longitude?: number; map_url?: string; province?: string; district?: string };
    items: Array<{
      offer: Offer;
      variant?: OfferVariant;
      quantity: number;
    }>;
    payment_method: string;
    customer_notes?: string;
    shipping_method_id?: string;
    fulfillment_method_type?: FulfillmentMethodType;
  }) => {
    const orderNumber = generateOrderNumber();
    const orderId = `order-${Date.now()}`;
    const txCode = `TX${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, "0")}${new Date().getDate().toString().padStart(2, "0")}-${Math.floor(100000 + Math.random() * 900000)}`;

    let subtotal = 0;
    const orderItems: OrderItem[] = orderData.items.map((it, idx) => {
      const unitPrice = it.variant ? it.variant.price : it.offer.price;
      const costPrice = it.variant?.cost_price || it.offer.cost_price || 0;
      const lineTotal = unitPrice * it.quantity;
      subtotal += lineTotal;

      return {
        id: `oi-${Date.now()}-${idx}`,
        order_id: orderId,
        offer_id: it.offer.id,
        variant_id: it.variant?.id,
        offer_type: it.offer.offer_type,
        item_name: it.offer.name,
        variant_name: it.variant?.name,
        unit_price: unitPrice,
        cost_price: costPrice,
        quantity: it.quantity,
        total_price: lineTotal,
      };
    });

    // Server-side Shipping Calculation
    const calcInput = {
      store,
      items: orderData.items.map((i) => ({
        id: i.offer.id,
        name: i.offer.name,
        price: i.variant ? i.variant.price : i.offer.price,
        quantity: i.quantity,
        offer_type: i.offer.offer_type,
      })),
      subtotal,
      delivery_address: orderData.shipping_address,
      selected_method_id: (orderData as any).shipping_method_id,
      shipping_methods: shippingMethods,
      shipping_zones: shippingZones,
    };

    const shippingResult = ShippingCalculationService.calculate(calcInput);
    const isQuoteLater = shippingResult.selected_option?.is_quote_later === true;
    const shippingFee = isQuoteLater ? 0 : shippingResult.final_shipping_fee;
    const totalAmount = subtotal + shippingFee;

    const shippingSnapshot = ShippingCalculationService.createSnapshot(
      shippingResult.selected_option,
      shippingResult.requires_shipping
    );

    const primaryOffer = orderData.items[0]?.offer;
    const customBankSettings = primaryOffer?.payment_settings;

    // Resolve Payment Method Type
    const chosenMethod = (orderData.payment_method === "BANK_TRANSFER" ? "VIETQR" : orderData.payment_method) as PaymentMethodType;
    const effectivePayment = PaymentSettingsService.getEffectivePaymentMethods(store, primaryOffer, paymentAccounts);
    const activeAccount = effectivePayment.active_account;

    // Generate Immutable Payment Snapshot
    const paymentSnapshot = PaymentSettingsService.createOrderPaymentSnapshot(
      chosenMethod,
      totalAmount,
      activeAccount,
      primaryOffer?.payment_override
    );

    // Generate Immutable Fulfillment Snapshot
    const chosenFulfillmentMethod: FulfillmentMethodType = orderData.fulfillment_method_type || (isQuoteLater ? "SHIPPING_QUOTE_LATER" : "DELIVERY");
    const fulfillmentSnapshot = FulfillmentService.createOrderFulfillmentSnapshot(
      chosenFulfillmentMethod,
      store,
      primaryOffer,
      totalAmount,
      orderData.shipping_address?.province
    );

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      organization_id: organization.id,
      order_id: orderId,
      payment_method: orderData.payment_method as any,
      payment_status: isQuoteLater ? "PENDING" : (chosenMethod === "COD" || chosenMethod === "PAY_LATER" ? "COD_PENDING" : "UNPAID"),
      amount: totalAmount,
      currency: "VND",
      provider: "VIETQR",
      qr_code_url: (!isQuoteLater && paymentSnapshot?.bank_account_snapshot) ? generateVietQRUrl(totalAmount, orderNumber, {
        bank_bin: paymentSnapshot.bank_account_snapshot.bank_bin,
        bank_account_no: paymentSnapshot.bank_account_snapshot.account_number,
        bank_account_name: paymentSnapshot.bank_account_snapshot.account_name,
      }) : (!isQuoteLater ? generateVietQRUrl(totalAmount, orderNumber, customBankSettings) : undefined),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newOrder: Order = {
      id: orderId,
      organization_id: organization.id,
      store_id: store.id,
      order_number: orderNumber,
      source_type: "SOURCE_OFFER",
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_email: orderData.customer_email,
      shipping_address: orderData.shipping_address,
      has_physical_items: orderData.items.some((i) => i.offer.offer_type === "PRODUCT"),
      order_status: "NEW",
      subtotal,
      discount_amount: 0,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      shipping_status: isQuoteLater ? "QUOTING" : shippingSnapshot.shipping_status,
      shipping_snapshot: shippingSnapshot,
      payment_snapshot: paymentSnapshot,
      fulfillment_snapshot: fulfillmentSnapshot,
      customer_notes: orderData.customer_notes,
      items: orderItems,
      payment: newPayment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedOrders = [newOrder, ...orders];
    setOrdersState(updatedOrders);
    setStored(STORAGE_KEYS.ORDERS, updatedOrders);

    // Reserve stock
    orderData.items.forEach((it) => {
      if (it.offer.inventory_tracking) {
        reserveStock(it.offer.id, it.variant?.id, it.quantity);
      }
    });

    // Create Transaction Passport
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      organization_id: organization.id,
      transaction_code: txCode,
      order_id: orderId,
      order_number: orderNumber,
      quotation_version: 1,
      buyer_name: orderData.customer_name,
      seller_name: organization.name,
      total_amount: totalAmount,
      status: "ACTIVE",
      verification_completeness_score: 40,
      is_fully_verified: false,
      created_at: new Date().toISOString(),
    };
    const updatedTxs = [newTx, ...transactions];
    setTransactionsState(updatedTxs);
    setStored(STORAGE_KEYS.TRANSACTIONS, updatedTxs);

    // Record verification event
    recordVerificationEvent({
      transactionId: newTx.id,
      entityType: "order",
      entityId: orderId,
      eventType: "ORDER_CREATED",
      payload: {
        order_number: orderNumber,
        customer_name: orderData.customer_name,
        total_amount: totalAmount,
        payment_method: orderData.payment_method,
      },
    });

    // Deduct stock for inventory-tracked items
    let hasStockChanges = false;
    const nextProducts = products.map((p) => {
      const orderItem = orderData.items.find((it) => it.offer.id === p.id);
      if (orderItem && p.inventory_tracking) {
        hasStockChanges = true;
        const currentQty = p.available_quantity || 0;
        const newQty = Math.max(0, currentQty - orderItem.quantity);
        const threshold = p.low_stock_threshold || 5;
        const newAvail: import("@/types").AvailabilityStatus = newQty > threshold ? "IN_STOCK" : (newQty > 0 ? "LOW_STOCK" : "OUT_OF_STOCK");
        return {
          ...p,
          available_quantity: newQty,
          availability_status: newAvail,
          is_available: newQty > 0,
          updated_at: new Date().toISOString(),
        };
      }
      return p;
    });

    if (hasStockChanges) {
      setProductsState(nextProducts);
      setStored(STORAGE_KEYS.PRODUCTS, nextProducts);
    }

    upsertPartyFromOrder(newOrder);

    addNotification({
      type: "NEW_ORDER",
      title: `Đơn hàng mới: ${orderNumber}`,
      message: `Khách hàng ${orderData.customer_name} vừa đặt đơn ${new Intl.NumberFormat("vi-VN").format(totalAmount)}đ.`,
      link: `/sell/orders`,
    });

    return newOrder;
  };

  // ==========================================
  // SHIPPING ACTIONS & QUOTE LATER MANAGEMENT
  // ==========================================
  const updateShippingSettings = (newSettings: Partial<NonNullable<Store["shipping_settings"]>>) => {
    const updatedStore: Store = {
      ...store,
      shipping_settings: {
        ...(store.shipping_settings || { shipping_enabled: true }),
        ...newSettings,
      },
      updated_at: new Date().toISOString(),
    };
    setStoreState(updatedStore);
    setStored(STORAGE_KEYS.STORE, updatedStore);
  };

  const addShippingMethod = (methodData: Omit<ShippingMethod, "id" | "created_at" | "updated_at">) => {
    const newMethod: ShippingMethod = {
      ...methodData,
      id: `sm-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...shippingMethods, newMethod];
    setShippingMethodsState(updated);
    setStored(STORAGE_KEYS.SHIPPING_METHODS, updated);
    return newMethod;
  };

  const updateShippingMethod = (id: string, updates: Partial<ShippingMethod>) => {
    const updated = shippingMethods.map((m) =>
      m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m
    );
    setShippingMethodsState(updated);
    setStored(STORAGE_KEYS.SHIPPING_METHODS, updated);
  };

  const deleteShippingMethod = (id: string) => {
    const updated = shippingMethods.filter((m) => m.id !== id);
    setShippingMethodsState(updated);
    setStored(STORAGE_KEYS.SHIPPING_METHODS, updated);
  };

  const addShippingZone = (zoneData: Omit<ShippingZone, "id" | "created_at" | "updated_at">) => {
    const newZone: ShippingZone = {
      ...zoneData,
      id: `zone-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...shippingZones, newZone];
    setShippingZonesState(updated);
    setStored(STORAGE_KEYS.SHIPPING_ZONES, updated);
    return newZone;
  };

  const updateShippingZone = (id: string, updates: Partial<ShippingZone>) => {
    const updated = shippingZones.map((z) =>
      z.id === id ? { ...z, ...updates, updated_at: new Date().toISOString() } : z
    );
    setShippingZonesState(updated);
    setStored(STORAGE_KEYS.SHIPPING_ZONES, updated);
  };

  const deleteShippingZone = (id: string) => {
    const updated = shippingZones.filter((z) => z.id !== id);
    setShippingZonesState(updated);
    setStored(STORAGE_KEYS.SHIPPING_ZONES, updated);
  };

  const updateOrderShippingQuote = (orderId: string, quoteFee: number, quoteNotes?: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const newTotal = targetOrder.subtotal - targetOrder.discount_amount + quoteFee + (targetOrder.tax_amount || 0);

    const primaryOfferId = targetOrder.items?.[0]?.offer_id;
    const targetOffer = offers.find((o) => o.id === primaryOfferId);
    const customBankSettings = targetOffer?.payment_settings;

    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        const updatedSnapshot: OrderShippingSnapshot = {
          ...(o.shipping_snapshot || {
            method_name: "Báo phí sau (Xe tải / B2B)",
            method_type: "QUOTE_LATER",
            fulfillment_type: "SHIPPING",
            shipping_fee_original: quoteFee,
            shipping_discount: 0,
          }),
          shipping_fee: quoteFee,
          shipping_fee_original: quoteFee,
          shipping_status: "QUOTED",
          quote_notes: quoteNotes || o.shipping_snapshot?.quote_notes,
          quoted_at: new Date().toISOString(),
          quoted_by: "Người bán 2K",
        };

        const updatedPayment: Payment = {
          ...(o.payment || {
            id: `pay-${Date.now()}`,
            organization_id: o.organization_id,
            order_id: o.id,
            payment_method: "BANK_TRANSFER",
            currency: "VND",
            provider: "VIETQR",
            created_at: new Date().toISOString(),
          }),
          payment_status: o.payment?.payment_method === "COD" ? "COD_PENDING" : "UNPAID",
          amount: newTotal,
          qr_code_url: generateVietQRUrl(newTotal, o.order_number, customBankSettings),
          updated_at: new Date().toISOString(),
        };

        return {
          ...o,
          shipping_fee: quoteFee,
          total_amount: newTotal,
          shipping_status: "QUOTED" as const,
          shipping_snapshot: updatedSnapshot,
          payment: updatedPayment,
          updated_at: new Date().toISOString(),
        };
      }
      return o;
    });

    setOrdersState(updatedOrders);
    setStored(STORAGE_KEYS.ORDERS, updatedOrders);

    addNotification({
      type: "SHIPPING_QUOTED",
      title: `Đã cập nhật phí vận chuyển đơn ${targetOrder.order_number}`,
      message: `Phí ship ${quoteFee.toLocaleString("vi-VN")}đ. Tổng thanh toán mới: ${newTotal.toLocaleString("vi-VN")}đ.`,
      link: `/sell/orders`,
    });
  };

  // PAYMENT CONFIRMATION & VERIFICATION
  const confirmPayment = (orderId: string, providerTxId?: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const txRef = providerTxId || `MB-TX-${Math.floor(100000 + Math.random() * 900000)}`;

    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          order_status: "CONFIRMED" as const,
          payment: o.payment
            ? {
                ...o.payment,
                payment_status: "PAID" as const,
                paid_at: new Date().toISOString(),
                provider_reference: txRef,
                updated_at: new Date().toISOString(),
              }
            : undefined,
          updated_at: new Date().toISOString(),
        };
      }
      return o;
    });
    setOrdersState(updatedOrders);
    setStored(STORAGE_KEYS.ORDERS, updatedOrders);

    // Ledger entry
    const newLedgerEntry: LedgerEntry = {
      id: `led-${Date.now()}`,
      organization_id: organization.id,
      entry_type: "PAYMENT_RECEIVED",
      direction: "CREDIT",
      amount: targetOrder.total_amount,
      reference_type: "ORDER",
      reference_id: targetOrder.id,
      description: `Thu tiền đơn hàng ${targetOrder.order_number} (${targetOrder.payment?.payment_method || "VIETQR"})`,
      created_at: new Date().toISOString(),
    };
    const updatedLedger = [newLedgerEntry, ...ledger];
    setLedgerState(updatedLedger);
    setStored(STORAGE_KEYS.LEDGER, updatedLedger);

    // Update Transaction verification score
    const targetTx = transactions.find((t) => t.order_id === orderId);
    if (targetTx) {
      const updatedTxs = transactions.map((t) =>
        t.id === targetTx.id
          ? {
              ...t,
              verification_completeness_score: Math.min(100, t.verification_completeness_score + 30),
            }
          : t
      );
      setTransactionsState(updatedTxs);
      setStored(STORAGE_KEYS.TRANSACTIONS, updatedTxs);
    }

    // Verification record for Payment Confirmed
    recordVerificationEvent({
      transactionId: targetTx?.id,
      entityType: "payment",
      entityId: targetOrder.payment?.id || `pay-${orderId}`,
      eventType: "PAYMENT_CONFIRMED",
      payload: {
        order_number: targetOrder.order_number,
        amount_paid: targetOrder.total_amount,
        provider_reference: txRef,
      },
    });

    addNotification({
      type: "PAYMENT_CONFIRMED",
      title: `🔔 Đơn hàng ${targetOrder.order_number} ĐÃ THANH TOÁN!`,
      message: `Đã xác nhận thanh toán ${new Intl.NumberFormat("vi-VN").format(targetOrder.total_amount)}đ qua VietQR.`,
      link: `/sell/orders`,
    });

    window.dispatchEvent(
      new CustomEvent("commerce_payment_confirmed", {
        detail: { orderId, orderNumber: targetOrder.order_number, amount: targetOrder.total_amount },
      })
    );
  };

  const reserveStock = (offerId: string, variantId?: string, qty: number = 1) => {
    const updated = inventory.map((item) => {
      const matchOffer = item.offer_id === offerId;
      const matchVariant = variantId ? item.variant_id === variantId : true;
      if (matchOffer && matchVariant) {
        const newReserved = item.reserved + qty;
        return {
          ...item,
          reserved: newReserved,
          available: item.on_hand - newReserved,
          updated_at: new Date().toISOString(),
        };
      }
      return item;
    });
    setInventoryState(updated);
    setStored(STORAGE_KEYS.INVENTORY, updated);
  };

  const completeOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    // Deduct stock permanently
    targetOrder.items?.forEach((item) => {
      if (item.offer_id) {
        const invItem = inventory.find((i) => i.offer_id === item.offer_id);
        if (invItem) {
          const newOnHand = Math.max(0, invItem.on_hand - item.quantity);
          const newReserved = Math.max(0, invItem.reserved - item.quantity);
          const updatedInv = inventory.map((i) =>
            i.id === invItem.id
              ? { ...i, on_hand: newOnHand, reserved: newReserved, available: newOnHand - newReserved, updated_at: new Date().toISOString() }
              : i
          );
          setInventoryState(updatedInv);
          setStored(STORAGE_KEYS.INVENTORY, updatedInv);

          const newMov: InventoryMovement = {
            id: `mov-${Date.now()}`,
            organization_id: organization.id,
            inventory_item_id: invItem.id,
            offer_name: item.item_name,
            movement_type: "SALE",
            quantity: -item.quantity,
            before_qty: invItem.on_hand,
            after_qty: newOnHand,
            reference_type: "ORDER",
            reference_id: targetOrder.id,
            note: `Xuất kho hoàn tất đơn ${targetOrder.order_number}`,
            created_at: new Date().toISOString(),
          };
          const updatedMov = [newMov, ...movements];
          setMovementsState(updatedMov);
          setStored(STORAGE_KEYS.MOVEMENTS, updatedMov);
        }
      }
    });

    const updatedOrders = orders.map((o) =>
      o.id === orderId ? { ...o, order_status: "COMPLETED" as const, updated_at: new Date().toISOString() } : o
    );
    setOrdersState(updatedOrders);
    setStored(STORAGE_KEYS.ORDERS, updatedOrders);

    // Update Transaction to 100% verified & completed
    const targetTx = transactions.find((t) => t.order_id === orderId);
    if (targetTx) {
      const updatedTxs = transactions.map((t) =>
        t.id === targetTx.id
          ? {
              ...t,
              status: "COMPLETED" as const,
              verification_completeness_score: 100,
              is_fully_verified: true,
              completed_at: new Date().toISOString(),
            }
          : t
      );
      setTransactionsState(updatedTxs);
      setStored(STORAGE_KEYS.TRANSACTIONS, updatedTxs);
    }

    // Verification record for Transaction Completed
    recordVerificationEvent({
      transactionId: targetTx?.id,
      entityType: "delivery",
      entityId: orderId,
      eventType: "TRANSACTION_COMPLETED",
      payload: {
        order_number: targetOrder.order_number,
        completed_at: new Date().toISOString(),
      },
    });
  };

  const updateOrderStatus = (orderId: string, status: Order["order_status"]) => {
    if (status === "COMPLETED") {
      completeOrder(orderId);
      return;
    }
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, order_status: status, updated_at: new Date().toISOString() } : o
    );
    setOrdersState(updated);
    setStored(STORAGE_KEYS.ORDERS, updated);
  };

  // BLOCKCHAIN MERKLE ANCHOR WORKER SIMULATION
  const anchorPendingBatch = async () => {
    const unanchored = verificationRecords.filter((vr) => vr.verification_status !== "ANCHORED");
    if (unanchored.length === 0) return null;

    const hashes = unanchored.map((r) => r.canonical_payload_hash);
    const tree = new MerkleTree(hashes);
    const merkleRoot = tree.getRoot();

    const batchId = `batch-${Date.now()}`;
    const anchorRes = await defaultBlockchainProvider.anchorMerkleRoot(batchId, merkleRoot);

    const newAnchor: BlockchainAnchor = {
      id: `anchor-${Date.now()}`,
      provider: defaultBlockchainProvider.providerName,
      network: defaultBlockchainProvider.networkName,
      chain_id: defaultBlockchainProvider.chainId,
      batch_id: batchId,
      merkle_root: merkleRoot,
      transaction_hash: anchorRes.transactionHash,
      block_number: anchorRes.blockNumber,
      contract_address: anchorRes.contractAddress,
      status: "CONFIRMED",
      retry_count: 0,
      submitted_at: anchorRes.submittedAt,
      confirmed_at: anchorRes.confirmedAt,
      created_at: new Date().toISOString(),
    };
    const updatedAnchors = [newAnchor, ...blockchainAnchors];
    setChainAnchorsState(updatedAnchors);
    setStored(STORAGE_KEYS.BLOCKCHAIN_ANCHORS, updatedAnchors);

    const newBatch: MerkleBatch = {
      id: batchId,
      batch_number: merkleBatches.length + 102,
      record_count: unanchored.length,
      merkle_root: merkleRoot,
      status: "ANCHORED",
      created_at: new Date().toISOString(),
      anchored_at: new Date().toISOString(),
      blockchain_anchor_id: newAnchor.id,
    };
    const updatedBatches = [newBatch, ...merkleBatches];
    setMerkleBatchesState(updatedBatches);
    setStored(STORAGE_KEYS.MERKLE_BATCHES, updatedBatches);

    // Update records to ANCHORED
    const updatedRecords = verificationRecords.map((r) => {
      const idx = unanchored.findIndex((u) => u.id === r.id);
      if (idx > -1) {
        return {
          ...r,
          verification_status: "ANCHORED" as const,
          merkle_batch_id: batchId,
          merkle_leaf_index: idx,
          blockchain_anchor_id: newAnchor.id,
        };
      }
      return r;
    });
    setVerifRecordsState(updatedRecords);
    setStored(STORAGE_KEYS.VERIFICATION_RECORDS, updatedRecords);

    return newAnchor;
  };

  const createExpense = (newExp: Omit<Expense, "id" | "created_at">) => {
    const exp: Expense = {
      ...newExp,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [exp, ...expenses];
    setExpensesState(updated);
    setStored(STORAGE_KEYS.EXPENSES, updated);

    const newLedgerEntry: LedgerEntry = {
      id: `led-${Date.now()}`,
      organization_id: organization.id,
      entry_type: "EXPENSE_LOGGED",
      direction: "DEBIT",
      amount: exp.amount,
      reference_type: "EXPENSE",
      reference_id: exp.id,
      description: `Chi phí ${exp.category}: ${exp.description}`,
      created_at: new Date().toISOString(),
    };
    const updatedLedger = [newLedgerEntry, ...ledger];
    setLedgerState(updatedLedger);
    setStored(STORAGE_KEYS.LEDGER, updatedLedger);
  };

  // =========================================================================
  // AUTH & IDENTITY ACTIONS (PHONE OTP, PASSKEY, STEP-UP, SESSIONS)
  // =========================================================================
  const loginWithPhone = (rawPhone: string, fullName?: string) => {
    const normalized = PhoneNormalizationService.normalize(rawPhone);
    let user = currentUser;
    if (!user || user.primary_phone !== normalized) {
      user = {
        id: `usr_${Date.now().toString(36)}`,
        user_code: `usr_${Math.floor(100000 + Math.random() * 900000)}`,
        full_name: fullName || "Người Dùng Mới",
        primary_phone: normalized,
        status: "ACTIVE",
        is_phone_verified: true,
        is_email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else if (fullName && fullName.trim()) {
      user = { ...user, full_name: fullName.trim(), updated_at: new Date().toISOString() };
    }

    const session: AuthSession = {
      id: `sess_${Date.now()}`,
      user_id: user.id,
      user,
      device_name: typeof navigator !== "undefined" ? navigator.userAgent.substring(0, 30) : "Thiết bị hiện tại",
      session_token: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      last_active_at: new Date().toISOString(),
      step_up_authenticated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    };

    setCurrentUserState(user);
    setCurrentSessionState(session);
    setStored(STORAGE_KEYS.USER, user);
    setStored(STORAGE_KEYS.SESSION, session);

    // Auto-create / Synchronize Personal Actor
    const personalActorId = `actor_${user.id}`;
    const newPersonalActor: PersonalActor = {
      id: personalActorId,
      user_id: user.id,
      display_name: `${user.full_name} (Cá nhân)`,
      phone: user.primary_phone,
      email: user.primary_email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPersonalActorState(newPersonalActor);
    setStored(STORAGE_KEYS.PERSONAL_ACTOR, newPersonalActor);

    // Ensure Personal Subscription (FREE) exists
    let existingSub = subscriptions.find((s) => s.actor_id === personalActorId);
    if (!existingSub) {
      existingSub = {
        id: `sub_personal_${user.id}`,
        actor_id: personalActorId,
        actor_type: "PERSONAL",
        actor_name: newPersonalActor.display_name,
        plan_id: "plan-free",
        plan_code: "FREE",
        status: "ACTIVE",
        billing_period: "MONTHLY",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
        cancel_at_period_end: false,
        items: [
          {
            id: `item_personal_base_${Date.now()}`,
            subscription_id: `sub_personal_${user.id}`,
            item_type: "BASE_PLAN",
            quantity: 1,
            unit_price: 0,
            total_amount: 0,
            effective_from: new Date().toISOString(),
          },
        ],
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updatedSubs = [...subscriptions.filter((s) => s.actor_id !== personalActorId), existingSub];
      setSubscriptionsState(updatedSubs);
      setStored(STORAGE_KEYS.SUBSCRIPTIONS, updatedSubs);
    }

    const personalCtx: WorkContext = {
      actor_id: personalActorId,
      context_type: "PERSONAL",
      display_name: user.full_name,
      plan_code: existingSub.plan_code || "FREE",
      is_active: true,
    };
    setCurrentContextState(personalCtx);
    setSubscriptionState(existingSub);
    setStored(STORAGE_KEYS.ACTIVE_CONTEXT, personalCtx);

    return { user, session };
  };

  const loginWithPasskey = (credentialId: string) => {
    const matched = passkeys.find((p) => p.credential_id === credentialId);
    let user = currentUser;
    if (!user) {
      user = {
        id: matched?.user_id || `usr_${Date.now().toString(36)}`,
        user_code: `usr_${Math.floor(100000 + Math.random() * 900000)}`,
        full_name: "Người Dùng Passkey",
        primary_phone: "+84988000000",
        status: "ACTIVE",
        is_phone_verified: true,
        is_email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    const updatedPasskeys = passkeys.map((p) =>
      p.credential_id === credentialId
        ? { ...p, counter: p.counter + 1, last_used_at: new Date().toISOString() }
        : p
    );
    setPasskeysState(updatedPasskeys);
    setStored(STORAGE_KEYS.PASSKEYS, updatedPasskeys);

    const session: AuthSession = {
      id: `sess_${Date.now()}`,
      user_id: user.id,
      user,
      device_name: matched?.device_name || "Thiết bị Passkey",
      session_token: `tok_passkey_${Date.now()}`,
      last_active_at: new Date().toISOString(),
      step_up_authenticated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    setCurrentUserState(user);
    setCurrentSessionState(session);
    setStored(STORAGE_KEYS.USER, user);
    setStored(STORAGE_KEYS.SESSION, session);
    return { user, session };
  };

  const addPasskey = (passkey: PasskeyCredential) => {
    const updated = [passkey, ...passkeys.filter((p) => p.credential_id !== passkey.credential_id)];
    setPasskeysState(updated);
    setStored(STORAGE_KEYS.PASSKEYS, updated);
  };

  const removePasskey = (passkeyId: string) => {
    const updated = passkeys.filter((p) => p.id !== passkeyId);
    setPasskeysState(updated);
    setStored(STORAGE_KEYS.PASSKEYS, updated);
  };

  const renamePasskey = (passkeyId: string, newName: string) => {
    const updated = passkeys.map((p) =>
      p.id === passkeyId ? { ...p, device_name: newName.trim() } : p
    );
    setPasskeysState(updated);
    setStored(STORAGE_KEYS.PASSKEYS, updated);
  };

  const updatePrimaryPhone = (newPhone: string) => {
    if (!currentUser) return;
    const normalized = PhoneNormalizationService.normalize(newPhone);
    const updated: UserIdentity = {
      ...currentUser,
      primary_phone: normalized,
      is_phone_verified: true,
      updated_at: new Date().toISOString(),
    };
    setCurrentUserState(updated);
    setStored(STORAGE_KEYS.USER, updated);
  };

  const updateUserProfile = (profile: Partial<UserIdentity>) => {
    if (!currentUser) return;
    const updated: UserIdentity = {
      ...currentUser,
      ...profile,
      updated_at: new Date().toISOString(),
    };
    setCurrentUserState(updated);
    setStored(STORAGE_KEYS.USER, updated);

    // Update Personal Actor
    if (profile.full_name) {
      const updatedPersonalActor: PersonalActor = {
        ...personalActor,
        display_name: `${profile.full_name} (Cá nhân)`,
        user_id: updated.id,
        phone: updated.primary_phone,
        email: updated.primary_email,
        updated_at: new Date().toISOString(),
      };
      setPersonalActorState(updatedPersonalActor);
      setStored(STORAGE_KEYS.PERSONAL_ACTOR, updatedPersonalActor);

      // If active context is PERSONAL, update active context display_name
      if (currentContext.context_type === "PERSONAL") {
        const updatedCtx: WorkContext = {
          ...currentContext,
          display_name: profile.full_name,
        };
        setCurrentContextState(updatedCtx);
        setStored(STORAGE_KEYS.ACTIVE_CONTEXT, updatedCtx);
      }
    }
  };

  const performStepUpAuth = (method: AuthMethodType = "PASSKEY") => {
    if (!currentSession) return false;
    const now = new Date().toISOString();
    const updatedSession = { ...currentSession, step_up_authenticated_at: now };
    setCurrentSessionState(updatedSession);
    setStored(STORAGE_KEYS.SESSION, updatedSession);
    return true;
  };

  const isStepUpValid = (maxAgeMinutes: number = 15): boolean => {
    if (!currentSession || !currentSession.step_up_authenticated_at) return false;
    const lastStepUp = new Date(currentSession.step_up_authenticated_at).getTime();
    const now = Date.now();
    return now - lastStepUp <= maxAgeMinutes * 60 * 1000;
  };

  const logout = () => {
    setCurrentUserState(null);
    setCurrentSessionState(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  };

  const logoutAllSessions = () => {
    logout();
  };

  // ==========================================
  // BILLING & SUBSCRIPTION ACTIONS
  // ==========================================

  const createBillingOrder = (params: {
    actorId?: string;
    actorType?: "PERSONAL" | "ORGANIZATION";
    actorName?: string;
    orderType: BillingOrderType;
    planCode?: BillingPlanCode;
    billingPeriod?: BillingPeriod;
    addonSelections?: { addonCode: string; quantity: number }[];
    promoCode?: string;
  }): BillingOrder => {
    const order = BillingService.createBillingOrder({
      actorId: params.actorId || organization.id,
      actorType: params.actorType || "ORGANIZATION",
      actorName: params.actorName || organization.name,
      orderType: params.orderType,
      planCode: params.planCode,
      billingPeriod: params.billingPeriod || "MONTHLY",
      addonSelections: params.addonSelections,
      promoCode: params.promoCode,
    });

    const updatedOrders = [order, ...billingOrders];
    setBillingOrdersState(updatedOrders);
    setStored(STORAGE_KEYS.BILLING_ORDERS, updatedOrders);

    // If total amount is 0 (e.g. FREE plan or 100% coupon), auto-confirm immediately
    if (order.total_amount === 0) {
      confirmBillingOrder(order.id);
    }

    return order;
  };

  const confirmBillingOrder = (orderId: string) => {
    const targetOrder = billingOrders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const { updatedOrder, updatedSubscription, invoice } =
      BillingService.processPaymentWebhook(targetOrder, subscription);

    // Update orders list
    const updatedOrders = billingOrders.map((o) => (o.id === orderId ? updatedOrder : o));
    setBillingOrdersState(updatedOrders);
    setStored(STORAGE_KEYS.BILLING_ORDERS, updatedOrders);

    // Update active subscription and list of subscriptions
    setSubscriptionState(updatedSubscription);
    setStored(STORAGE_KEYS.SUBSCRIPTION, updatedSubscription);

    const updatedSubs = subscriptions.map((s) => (s.actor_id === updatedSubscription.actor_id ? updatedSubscription : s));
    if (!subscriptions.some((s) => s.actor_id === updatedSubscription.actor_id)) {
      updatedSubs.push(updatedSubscription);
    }
    setSubscriptionsState(updatedSubs);
    setStored(STORAGE_KEYS.SUBSCRIPTIONS, updatedSubs);

    if (currentContext.actor_id === updatedSubscription.actor_id) {
      const updatedCtx = { ...currentContext, plan_code: updatedSubscription.plan_code };
      setCurrentContextState(updatedCtx);
      setStored(STORAGE_KEYS.ACTIVE_CONTEXT, updatedCtx);
    }

    // Add invoice
    const updatedInvoices = [invoice, ...billingInvoices];
    setBillingInvoicesState(updatedInvoices);
    setStored(STORAGE_KEYS.BILLING_INVOICES, updatedInvoices);

    // Add notification
    const newNotif: AppNotification = {
      id: `notif-bill-${Date.now()}`,
      organization_id: organization.id,
      title: "Gói Dịch Vụ Đã Kích Hoạt",
      message: `Thanh toán ${updatedOrder.order_number} thành công! Gói ${updatedSubscription.plan_code} đã được kích hoạt.`,
      type: "ORDER",
      is_read: false,
      created_at: new Date().toISOString(),
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotificationsState(updatedNotifs);
    setStored(STORAGE_KEYS.NOTIFICATIONS, updatedNotifs);

    return { updatedOrder, updatedSubscription, invoice };
  };

  const cancelSubscription = () => {
    const updated = BillingService.cancelSubscription(subscription);
    setSubscriptionState(updated);
    setStored(STORAGE_KEYS.SUBSCRIPTION, updated);
  };

  const schedulePlanDowngrade = (targetPlanCode: BillingPlanCode) => {
    const updated = BillingService.scheduleDowngrade(subscription, targetPlanCode);
    setSubscriptionState(updated);
    setStored(STORAGE_KEYS.SUBSCRIPTION, updated);
  };

  const reactivateSubscription = () => {
    const updated = BillingService.reactivateSubscription(subscription);
    setSubscriptionState(updated);
    setStored(STORAGE_KEYS.SUBSCRIPTION, updated);
  };

  const totalSales = orders.reduce((acc, o) => (o.order_status !== "CANCELLED" ? acc + o.total_amount : acc), 0);
  const totalCashReceived = orders.reduce(
    (acc, o) => (o.payment?.payment_status === "PAID" ? acc + o.total_amount : acc),
    0
  );
  const totalReceivable = totalSales - totalCashReceived;
  const totalCOGS = orders.reduce((acc, o) => {
    if (o.order_status === "CANCELLED") return acc;
    const cogs = o.items?.reduce((itemAcc, it) => itemAcc + it.cost_price * it.quantity, 0) || 0;
    return acc + cogs;
  }, 0);
  const grossProfit = totalSales - totalCOGS;
  const totalOperatingExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const estimatedNetProfit = grossProfit - totalOperatingExpenses;

  return {
    isLoaded,
    personalActor,
    organization,
    organizations,
    organizationMembers,
    currentContext,
    store,
    categories,
    collections,
    offers,
    products,
    warehouses,
    inventory,
    movements,
    requests,
    quotations,
    quotationVersions,
    documentHashes,
    verificationRecords,
    merkleBatches,
    blockchainAnchors,
    transactions,
    orders,
    parties,
    ledger,
    expenses,
    notifications,
    shippingMethods,
    shippingZones,
    paymentAccounts,
    currentUser,
    currentSession,
    passkeys,
    subscription,
    subscriptions,
    billingOrders,
    billingInvoices,
    // Context & Org Actions
    switchContext,
    createOrganization,
    transferStoreToOrganization,
    getWorkContexts,
    // Actions
    updateOrganization,
    updateStore,
    addPaymentAccount,
    updatePaymentAccount,
    deletePaymentAccount,
    setDefaultPaymentAccount,
    updateStorePaymentSettings,
    updateStoreFulfillmentSettings,
    updateShippingSettings,
    addShippingMethod,
    updateShippingMethod,
    deleteShippingMethod,
    addShippingZone,
    updateShippingZone,
    deleteShippingZone,
    updateOrderShippingQuote,
    createOffer,
    updateOffer,
    deleteOffer,
    addProduct,
    updateProduct,
    deleteProduct,
    syncProductsFromOfferItems,
    updateProductStatus,
    updateManualAvailability,
    restockProduct,
    updateStoreVisibilitySettings,
    updateStorePublicSettings,
    createRequest,
    deleteRequest,
    submitQuotation,
    markQuotationViewed,
    acceptQuotation,
    claimGuestQuotations,
    createOrder,
    confirmPayment,
    updateOrderStatus,
    createExpense,
    markNotificationRead,
    generateVietQRUrl,
    anchorPendingBatch,
    recordVerificationEvent,
    loginWithPhone,
    loginWithPasskey,
    addPasskey,
    removePasskey,
    renamePasskey,
    updatePrimaryPhone,
    updateUserProfile,
    performStepUpAuth,
    isStepUpValid,
    logout,
    logoutAllSessions,
    // Billing Actions
    createBillingOrder,
    confirmBillingOrder,
    cancelSubscription,
    schedulePlanDowngrade,
    reactivateSubscription,
    // Financials
    financials: {
      totalSales,
      totalCashReceived,
      totalReceivable,
      totalCOGS,
      grossProfit,
      totalOperatingExpenses,
      estimatedNetProfit,
      ordersCount: orders.length,
      averageOrderValue: orders.length ? totalSales / orders.length : 0,
    },
  };
}

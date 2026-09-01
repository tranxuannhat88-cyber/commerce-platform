"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Tag,
  Plus,
  QrCode,
  ExternalLink,
  Search,
  Trash2,
  Edit,
  X,
  Layers,
  Image as ImageIcon,
  CreditCard,
  Check,
  Camera,
  Upload,
  AlertTriangle,
  ListOrdered,
  Paperclip,
  FileText,
  FileDown,
  Package,
  CheckSquare,
  Square,
  Library,
  Sparkles,
  PlusCircle,
  FolderPlus,
  Truck,
  Percent,
  Calendar,
  ChevronDown,
  ChevronUp,
  Settings2,
  Coins,
  ShieldCheck,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND, slugify, formatThousands, parseThousands, compressImageFile } from "@/lib/utils";
import { CopyButton } from "@/components/shared/copy-button";
import { QRModal, BankInfo } from "@/components/shared/qr-modal";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppUrlService } from "@/lib/services/url";
import {
  Offer,
  OfferType,
  OfferStructure,
  OfferItem,
  OfferAttachment,
  OfferVariant,
  Product,
  PaymentMethodType,
  FulfillmentMethodType,
  ShippingFeeRuleType,
  OfferPaymentOverride,
  OfferFulfillmentOverride,
  ActorPaymentAccount,
  Store,
} from "@/types";

export const POPULAR_BANKS = [
  { bin: "970422", name: "MBBank (Ngân Hàng TMCP Quân Đội)", shortName: "MBBank" },
  { bin: "970436", name: "Vietcombank (Ngoại Thương VN)", shortName: "Vietcombank" },
  { bin: "970407", name: "Techcombank (Kỹ Thương VN)", shortName: "Techcombank" },
  { bin: "970415", name: "VietinBank (Công Thương VN)", shortName: "VietinBank" },
  { bin: "970418", name: "BIDV (Đầu Tư & Phát Triển VN)", shortName: "BIDV" },
  { bin: "970432", name: "VPBank (Việt Nam Thịnh Vượng)", shortName: "VPBank" },
  { bin: "970416", name: "ACB (Á Châu)", shortName: "ACB" },
  { bin: "970423", name: "TPBank (Tiên Phong)", shortName: "TPBank" },
  { bin: "970403", name: "Sacombank (Sài Gòn Thương Tín)", shortName: "Sacombank" },
  { bin: "970448", name: "OCB (Phương Đông)", shortName: "OCB" },
  { bin: "970425", name: "ABBANK (An Bình)", shortName: "ABBANK" },
  { bin: "970437", name: "HDBank (Phát Triển TP.HCM)", shortName: "HDBank" },
  { bin: "970454", name: "VietCapitalBank (Bản Việt / BVBank)", shortName: "BVBank" },
  { bin: "970428", name: "NamABank (Nam Á)", shortName: "NamABank" },
  { bin: "970440", name: "SeABank (Đông Nam Á)", shortName: "SeABank" },
  { bin: "970441", name: "VIB (Quốc Tế)", shortName: "VIB" },
  { bin: "970405", name: "Agribank (Nông Nghiệp & PTNT)", shortName: "Agribank" },
  { bin: "970443", name: "SHB (Sài Gòn - Hà Nội)", shortName: "SHB" },
  { bin: "970431", name: "Eximbank (Xuất Nhập Khẩu)", shortName: "Eximbank" },
  { bin: "970426", name: "MSB (Hàng Hải)", shortName: "MSB" },
  { bin: "970430", name: "PGBank (Thịnh Vượng & Phát Triển)", shortName: "PGBank" },
  { bin: "970427", name: "VietABank (Việt Á)", shortName: "VietABank" },
  { bin: "970433", name: "VietBank (Việt Nam Thương Tín)", shortName: "VietBank" },
  { bin: "970449", name: "LPBank (Lộc Phát VN)", shortName: "LPBank" },
];

export function resolveOfferBankInfo(
  offer: Offer | null | undefined,
  store: Store,
  paymentAccounts: ActorPaymentAccount[] = []
) {
  // 1. Check custom payment account override in offer
  if (offer?.payment_override?.mode === "OFFER_OVERRIDE" && offer.payment_override.custom_payment_account_id) {
    const matched = paymentAccounts.find((a) => a.id === offer.payment_override?.custom_payment_account_id);
    if (matched && matched.account_number) {
      return {
        bank_bin: matched.bank_bin || "970422",
        bank_name: matched.bank_name || matched.bank_short_name || "Ngân hàng",
        bank_short_name: matched.bank_short_name || matched.bank_name || "Ngân hàng",
        account_number: matched.account_number,
        account_name: matched.account_name || "",
        qr_image_url: matched.qr_image_url,
        is_configured: true,
      };
    }
  }

  // 2. Check embedded legacy payment_settings in offer
  if (offer?.payment_settings?.bank_account_no) {
    return {
      bank_bin: offer.payment_settings.bank_bin || "970422",
      bank_name: offer.payment_settings.bank_name || "Ngân hàng",
      bank_short_name: offer.payment_settings.bank_name?.split("(")[0]?.trim() || "Ngân hàng",
      account_number: offer.payment_settings.bank_account_no,
      account_name: offer.payment_settings.bank_account_name || "",
      qr_image_url: undefined,
      is_configured: true,
    };
  }

  // 3. Check default payment account in actor payment accounts
  const defaultAcc = paymentAccounts.find((a) => a.is_default) || paymentAccounts[0];
  if (defaultAcc && defaultAcc.account_number) {
    return {
      bank_bin: defaultAcc.bank_bin || "970422",
      bank_name: defaultAcc.bank_name || defaultAcc.bank_short_name || "Ngân hàng",
      bank_short_name: defaultAcc.bank_short_name || defaultAcc.bank_name || "Ngân hàng",
      account_number: defaultAcc.account_number,
      account_name: defaultAcc.account_name || "",
      qr_image_url: defaultAcc.qr_image_url,
      is_configured: true,
    };
  }

  // 4. Check store payment settings
  if (store.payment_settings?.bank_account_no) {
    return {
      bank_bin: store.payment_settings.bank_bin || "970422",
      bank_name: store.payment_settings.bank_name || "Ngân hàng",
      bank_short_name: store.payment_settings.bank_name?.split("(")[0]?.trim() || "Ngân hàng",
      account_number: store.payment_settings.bank_account_no,
      account_name: store.payment_settings.bank_account_name || "",
      qr_image_url: undefined,
      is_configured: true,
    };
  }

  // 5. Unconfigured (No fake fallback!)
  return {
    bank_bin: "",
    bank_name: "",
    bank_short_name: "",
    account_number: "",
    account_name: "",
    qr_image_url: undefined,
    is_configured: false,
  };
}

export interface FormVariantState {
  id: string;
  name: string;
  price: string;
  compare_price: string;
}

export interface FormItemState {
  id: string;
  name: string;
  price: string;
  compare_price: string;
  unit: string;
  category: string;
  description: string;
  image_url: string;
  // Variants option
  enable_variants: boolean;
  variants: FormVariantState[];
  // Gallery option
  enable_gallery: boolean;
  gallery: string[];
  // Attachments option
  enable_attachments: boolean;
  attachments: OfferAttachment[];
}

const createDefaultItem = (index: number = 0): FormItemState => ({
  id: `item-${Date.now()}-${index}`,
  name: "",
  price: "",
  compare_price: "",
  unit: "cái",
  category: "Chung",
  description: "",
  image_url: "",
  enable_variants: false,
  variants: [
    { id: `var-1-${Date.now()}`, name: "Phiên bản tiêu chuẩn", price: "", compare_price: "" },
  ],
  enable_gallery: false,
  gallery: [],
  enable_attachments: false,
  attachments: [],
});

function OffersContent() {
  const {
    offers,
    store,
    organization,
    createOffer,
    updateOffer,
    deleteOffer,
    updateStore,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    syncProductsFromOfferItems,
    paymentAccounts,
    addPaymentAccount,
    updatePaymentAccount,
    deletePaymentAccount,
    setDefaultPaymentAccount,
  } = useCommerceStore();

  const [activeTab, setActiveTab] = useState<"ALL" | "SINGLE" | "CATALOG" | "LIBRARY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deletingOffer, setDeletingOffer] = useState<Offer | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [selectedQR, setSelectedQR] = useState<{ url: string; title: string; subtitle?: string; bankInfo?: BankInfo } | null>(null);

  // Bank Accounts & VietQR Modal Management State
  const [isBankAccountsModalOpen, setIsBankAccountsModalOpen] = useState(false);
  const [isEditingBankAcc, setIsEditingBankAcc] = useState(false);
  const [editingBankAccId, setEditingBankAccId] = useState<string | null>(null);
  const [bankAccBin, setBankAccBin] = useState("970422");
  const [bankAccName, setBankAccName] = useState("MBBank (Ngân Hàng TMCP Quân Đội)");
  const [bankAccShortName, setBankAccShortName] = useState("MBBank");
  const [bankAccNumber, setBankAccNumber] = useState("");
  const [bankAccHolder, setBankAccHolder] = useState("");
  const [bankAccQrImage, setBankAccQrImage] = useState("");
  const [bankAccIsDefault, setBankAccIsDefault] = useState(false);

  // Product Library Picker Modal State
  const [isProductLibraryPickerOpen, setIsProductLibraryPickerOpen] = useState(false);
  const [selectedLibraryProductIds, setSelectedLibraryProductIds] = useState<string[]>([]);
  const [productLibrarySearch, setProductLibrarySearch] = useState("");
  const [productLibraryCategory, setProductLibraryCategory] = useState("ALL");

  // Master Product Modal State (for creating directly in library)
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [editingLibraryProduct, setEditingLibraryProduct] = useState<Product | null>(null);
  const [libProdItem, setLibProdItem] = useState<FormItemState>(createDefaultItem());

  // Unified Form State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Chung");
  const [formShortDesc, setFormShortDesc] = useState("");
  const [enableCustomCover, setEnableCustomCover] = useState(false);
  const [customCoverImage, setCustomCoverImage] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic available categories from products, offers, and store defaults
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    const defaults = [
      "Chung",
      "Thiết bị & Máy móc",
      "Vật tư & Linh kiện",
      "Gia công cơ khí",
      "Dịch vụ kỹ thuật",
      "Điện tử & Tự động hóa",
      "Nội thất xưởng",
      "Dụng cụ & Đồ nghề",
    ];
    defaults.forEach((c) => set.add(c));
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    offers.forEach((o) => {
      if (o.category_id && o.category_id.trim()) set.add(o.category_id.trim());
      o.items?.forEach((it) => {
        if (it.category && it.category.trim()) set.add(it.category.trim());
      });
    });
    return Array.from(set);
  }, [products, offers]);

  // Dynamic Product / Service Items List
  const [catalogItemsList, setCatalogItemsList] = useState<FormItemState[]>([createDefaultItem()]);

  // Payment Override State
  const [paymentOverrideMode, setPaymentOverrideMode] = useState<"STORE_DEFAULT" | "OFFER_OVERRIDE">("STORE_DEFAULT");
  const [customPaymentAccountId, setCustomPaymentAccountId] = useState<string>("");
  const [customPaymentMethods, setCustomPaymentMethods] = useState<PaymentMethodType[]>(["VIETQR", "COD"]);
  const [customDepositType, setCustomDepositType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [customDepositPercentage, setCustomDepositPercentage] = useState<number>(30);
  const [customDepositFixed, setCustomDepositFixed] = useState<string>("");
  const [customPayLaterTerms, setCustomPayLaterTerms] = useState<"NET_7" | "NET_15" | "NET_30" | "NET_45" | "CUSTOM">("NET_30");

  // Fulfillment Override State
  const [fulfillmentOverrideMode, setFulfillmentOverrideMode] = useState<"STORE_DEFAULT" | "OFFER_OVERRIDE">("STORE_DEFAULT");
  const [customEnableFixedFee, setCustomEnableFixedFee] = useState<boolean>(true);
  const [customFixedFeeDistanceKm, setCustomFixedFeeDistanceKm] = useState<string>("10");
  const [customFixedFee, setCustomFixedFee] = useState<string>("30000");
  const [customEnableFreeThreshold, setCustomEnableFreeThreshold] = useState<boolean>(true);
  const [customFreeThreshold, setCustomFreeThreshold] = useState<string>("500000");
  const [customEnableFreeDistance, setCustomEnableFreeDistance] = useState<boolean>(false);
  const [customFreeDistanceKm, setCustomFreeDistanceKm] = useState<string>("5");
  const [customEnablePickup, setCustomEnablePickup] = useState<boolean>(true);
  const [customPickupAddress, setCustomPickupAddress] = useState<string>("");
  const [customEnableQuoteLater, setCustomEnableQuoteLater] = useState<boolean>(false);

  // Bank & VietQR Payment Settings State
  const defaultBankBin = store.payment_settings?.bank_bin || "970422";
  const defaultAccountNo = store.payment_settings?.bank_account_no || "";
  const defaultAccountName = store.payment_settings?.bank_account_name || "";
  const hasStoreBankProfile = Boolean(defaultAccountNo && defaultAccountName);

  const [useCustomBank, setUseCustomBank] = useState(false);
  const [formBankBin, setFormBankBin] = useState(defaultBankBin);
  const [formBankAccountNo, setFormBankAccountNo] = useState(defaultAccountNo);
  const [formBankAccountName, setFormBankAccountName] = useState(defaultAccountName);
  const [saveAsDefaultStoreBank, setSaveAsDefaultStoreBank] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setEditingOffer(null);
      setFormName("");
      setFormShortDesc("");
      setCatalogItemsList([createDefaultItem()]);
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (store.payment_settings?.bank_account_no) {
      setFormBankBin(store.payment_settings.bank_bin || "970422");
      setFormBankAccountNo(store.payment_settings.bank_account_no);
      setFormBankAccountName(store.payment_settings.bank_account_name || "");
    }
  }, [store.payment_settings]);

  // Bank Account Modal Handlers
  const handleOpenManageBankAccounts = (accToEdit?: ActorPaymentAccount) => {
    if (accToEdit) {
      setIsEditingBankAcc(true);
      setEditingBankAccId(accToEdit.id);
      setBankAccBin(accToEdit.bank_bin || "970422");
      const foundBank = POPULAR_BANKS.find((b) => b.bin === accToEdit.bank_bin);
      setBankAccName(accToEdit.bank_name || foundBank?.name || "Ngân hàng");
      setBankAccShortName(accToEdit.bank_short_name || foundBank?.shortName || "Ngân hàng");
      setBankAccNumber(accToEdit.account_number || "");
      setBankAccHolder(accToEdit.account_name || "");
      setBankAccQrImage(accToEdit.qr_image_url || "");
      setBankAccIsDefault(accToEdit.is_default);
    } else if (paymentAccounts.length === 0) {
      setIsEditingBankAcc(true);
      setEditingBankAccId(null);
      setBankAccBin("970422");
      setBankAccName("MBBank (Ngân Hàng TMCP Quân Đội)");
      setBankAccShortName("MBBank");
      setBankAccNumber(store.payment_settings?.bank_account_no || "");
      setBankAccHolder(store.payment_settings?.bank_account_name || "");
      setBankAccQrImage("");
      setBankAccIsDefault(true);
    } else {
      setIsEditingBankAcc(false);
      setEditingBankAccId(null);
    }
    setIsBankAccountsModalOpen(true);
  };

  const handleStartAddNewBankAccount = () => {
    setIsEditingBankAcc(true);
    setEditingBankAccId(null);
    setBankAccBin("970422");
    setBankAccName("MBBank (Ngân Hàng TMCP Quân Đội)");
    setBankAccShortName("MBBank");
    setBankAccNumber("");
    setBankAccHolder("");
    setBankAccQrImage("");
    setBankAccIsDefault(paymentAccounts.length === 0);
  };

  const handleSaveBankAccountForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccNumber.trim() || !bankAccHolder.trim()) {
      alert("Vui lòng nhập đầy đủ Số tài khoản và Tên chủ tài khoản");
      return;
    }

    const bankObj = POPULAR_BANKS.find((b) => b.bin === bankAccBin);
    const shortName = bankAccShortName || bankObj?.shortName || "Ngân hàng";
    const fullName = bankAccName || bankObj?.name || shortName;

    if (editingBankAccId) {
      updatePaymentAccount(editingBankAccId, {
        bank_bin: bankAccBin,
        bank_name: fullName,
        bank_short_name: shortName,
        account_number: bankAccNumber.trim(),
        account_name: bankAccHolder.trim().toUpperCase(),
        qr_image_url: bankAccQrImage.trim() || undefined,
        is_default: bankAccIsDefault,
      });
      if (bankAccIsDefault) {
        setDefaultPaymentAccount(editingBankAccId);
      }
      setToastMessage("✓ Đã cập nhật tài khoản ngân hàng thành công!");
    } else {
      const created = addPaymentAccount({
        actor_id: store.owner_actor_id || "personal_actor",
        actor_type: store.owner_actor_type || "PERSONAL",
        bank_bin: bankAccBin,
        bank_name: fullName,
        bank_short_name: shortName,
        account_number: bankAccNumber.trim(),
        account_name: bankAccHolder.trim().toUpperCase(),
        qr_image_url: bankAccQrImage.trim() || undefined,
        is_default: bankAccIsDefault || paymentAccounts.length === 0,
        verification_status: "VERIFIED",
      });
      if (bankAccIsDefault) {
        setDefaultPaymentAccount(created.id);
      }
      setToastMessage("✓ Đã thêm tài khoản nhận tiền mới thành công!");
    }

    setTimeout(() => setToastMessage(null), 3000);
    setIsEditingBankAcc(false);
    setEditingBankAccId(null);
  };

  const handleDeleteBankAcc = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài khoản ngân hàng này?")) {
      deletePaymentAccount(id);
      setToastMessage("✓ Đã xóa tài khoản ngân hàng");
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleSetDefaultBankAcc = (id: string) => {
    setDefaultPaymentAccount(id);
    setToastMessage("✓ Đã đặt làm tài khoản nhận tiền mặc định");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCustomQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 600, 0.7);
      setBankAccQrImage(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  // =========================================================================
  // PRODUCT LIBRARY ACTIONS
  // =========================================================================
  const handleSelectProductsFromLibrary = () => {
    if (selectedLibraryProductIds.length === 0) return;
    const chosen = products.filter((p) => selectedLibraryProductIds.includes(p.id));
    const newRows: FormItemState[] = chosen.map((p, idx) => ({
      id: `item-${Date.now()}-${p.id}-${idx}`,
      name: p.name,
      price: formatThousands(p.price),
      compare_price: p.compare_at_price ? formatThousands(p.compare_at_price) : "",
      unit: p.unit || "cái",
      category: p.category || "Chung",
      description: p.description || "",
      image_url: p.image_url || "",
      enable_variants: Boolean(p.variants && p.variants.length > 0),
      variants: p.variants && p.variants.length > 0
        ? p.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: formatThousands(v.price),
            compare_price: v.compare_at_price ? formatThousands(v.compare_at_price) : "",
          }))
        : [{ id: `var-1`, name: "Phiên bản tiêu chuẩn", price: formatThousands(p.price), compare_price: "" }],
      enable_gallery: Boolean(p.gallery && p.gallery.length > 0),
      gallery: p.gallery || [],
      enable_attachments: Boolean(p.attachments && p.attachments.length > 0),
      attachments: p.attachments || [],
    }));

    setCatalogItemsList((prev) => {
      const isOnlyDefaultEmpty = prev.length === 1 && !prev[0].name.trim() && !prev[0].price;
      return isOnlyDefaultEmpty ? newRows : [...prev, ...newRows];
    });

    setIsProductLibraryPickerOpen(false);
    setSelectedLibraryProductIds([]);
  };

  const handleOpenCreateProductInLibrary = (prod?: Product) => {
    if (prod) {
      setEditingLibraryProduct(prod);
      setLibProdItem({
        id: prod.id,
        name: prod.name,
        price: formatThousands(prod.price),
        compare_price: prod.compare_at_price ? formatThousands(prod.compare_at_price) : "",
        unit: prod.unit || "cái",
        category: prod.category || "Chung",
        description: prod.description || "",
        image_url: prod.image_url || "",
        enable_variants: Boolean(prod.variants && prod.variants.length > 0),
        variants: prod.variants && prod.variants.length > 0
          ? prod.variants.map((v) => ({
              id: v.id,
              name: v.name,
              price: formatThousands(v.price),
              compare_price: v.compare_at_price ? formatThousands(v.compare_at_price) : "",
            }))
          : [{ id: `var-lib-1`, name: "Phiên bản tiêu chuẩn", price: formatThousands(prod.price), compare_price: "" }],
        enable_gallery: Boolean(prod.gallery && prod.gallery.length > 0),
        gallery: prod.gallery || [],
        enable_attachments: Boolean(prod.attachments && prod.attachments.length > 0),
        attachments: prod.attachments || [],
      });
    } else {
      setEditingLibraryProduct(null);
      setLibProdItem(createDefaultItem());
    }
    setIsCreateProductModalOpen(true);
  };

  const handleUpdateLibProdField = (field: keyof FormItemState, value: any) => {
    const finalVal = (field === "price" || field === "compare_price") ? formatThousands(value) : value;
    setLibProdItem((prev) => ({ ...prev, [field]: finalVal }));
  };

  const handleLibProdImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const compressed = await compressImageFile(file, 600, 0.7);
      setLibProdItem((prev) => ({ ...prev, image_url: compressed }));
    } catch (err) {
      console.error("Error reading image:", err);
    }
  };

  const handleAddLibProdGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const filesArray = Array.from(files);
    e.target.value = "";
    try {
      const base64List = await Promise.all(
        filesArray.map((file) => compressImageFile(file, 600, 0.7))
      );
      setLibProdItem((prev) => {
        const existing = prev.gallery || [];
        const uniqueNew = base64List.filter((img) => !existing.includes(img));
        const combined = [...existing, ...uniqueNew].slice(0, 5);
        return {
          ...prev,
          enable_gallery: true,
          gallery: combined,
        };
      });
    } catch (err) {
      console.error("Error reading gallery:", err);
    }
  };

  const handleRemoveLibProdGallery = (photoIndex: number) => {
    setLibProdItem((prev) => {
      const filtered = prev.gallery.filter((_, idx) => idx !== photoIndex);
      return {
        ...prev,
        gallery: filtered,
        enable_gallery: filtered.length > 0,
      };
    });
  };

  const handleLibProdAttachmentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (event) => {
      const sizeKb = Math.round(file.size / 1024);
      let fileUrl = (event.target?.result as string) || "";
      if (file.size > 80 * 1024) {
        fileUrl = `blob:${file.name}`;
      }
      const newAttachment: OfferAttachment = {
        id: `att-lib-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: file.name,
        file_url: fileUrl,
        file_type: file.type || file.name.split(".").pop() || "file",
        file_size: sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`,
      };
      setLibProdItem((prev) => {
        const existing = prev.attachments || [];
        const nextAtts = existing.some((a) => a.name === file.name)
          ? existing
          : [...existing, newAttachment];
        return {
          ...prev,
          enable_attachments: true,
          attachments: nextAtts,
        };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLibProdAttachment = (attId: string) => {
    setLibProdItem((prev) => {
      const filtered = prev.attachments.filter((a) => a.id !== attId);
      return {
        ...prev,
        attachments: filtered,
        enable_attachments: filtered.length > 0,
      };
    });
  };

  const handleAddLibProdVariantRow = () => {
    setLibProdItem((prev) => {
      const nextNum = prev.variants.length + 1;
      return {
        ...prev,
        enable_variants: true,
        variants: [
          ...prev.variants,
          { id: `var-lib-${Date.now()}-${nextNum}`, name: `Phiên bản ${nextNum}`, price: prev.price || "", compare_price: "" },
        ],
      };
    });
  };

  const handleUpdateLibProdVariantField = (varIndex: number, field: keyof FormVariantState, value: string) => {
    setLibProdItem((prev) => {
      const copyVars = [...prev.variants];
      const finalVal = (field === "price" || field === "compare_price") ? formatThousands(value) : value;
      copyVars[varIndex] = { ...copyVars[varIndex], [field]: finalVal };
      return { ...prev, variants: copyVars };
    });
  };

  const handleRemoveLibProdVariantRow = (varIndex: number) => {
    setLibProdItem((prev) => {
      if (prev.variants.length <= 1) return prev;
      return {
        ...prev,
        variants: prev.variants.filter((_, idx) => idx !== varIndex),
      };
    });
  };

  const handleSaveProductInLibrary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!libProdItem.name.trim()) return;

    const parsedPrice = parseThousands(libProdItem.price) || 0;
    const parsedCompare = libProdItem.compare_price ? parseThousands(libProdItem.compare_price) : undefined;
    const hasVariants = libProdItem.enable_variants && libProdItem.variants.length > 0;
    const itemVariants: OfferVariant[] = hasVariants
      ? libProdItem.variants.map((v) => ({
          id: v.id,
          name: v.name.trim() || "Phiên bản",
          price: parseThousands(v.price) || parsedPrice,
          compare_at_price: v.compare_price ? parseThousands(v.compare_price) : undefined,
          created_at: new Date().toISOString(),
        }))
      : [];

    const productPayload = {
      organization_id: organization.id,
      store_id: store.id,
      name: libProdItem.name.trim(),
      price: parsedPrice,
      compare_at_price: parsedCompare,
      cost_price: parsedPrice * 0.5,
      unit: libProdItem.unit.trim() || "cái",
      category: libProdItem.category.trim() || "Chung",
      description: libProdItem.description.trim(),
      image_url: libProdItem.image_url?.trim() || undefined,
      gallery: (libProdItem.enable_gallery || libProdItem.gallery.length > 0) ? libProdItem.gallery : [],
      attachments: (libProdItem.enable_attachments || libProdItem.attachments.length > 0) ? libProdItem.attachments : [],
      variants: itemVariants,
      is_available: true,
    };

    if (editingLibraryProduct) {
      updateProduct(editingLibraryProduct.id, productPayload);
      setToastMessage(`Đã cập nhật sản phẩm "${libProdItem.name}" trong Thư viện!`);
    } else {
      addProduct(productPayload);
      setToastMessage(`Đã thêm sản phẩm "${libProdItem.name}" vào Thư viện thành công!`);
    }
    setTimeout(() => setToastMessage(null), 3000);
    setIsCreateProductModalOpen(false);
  };

  const handleCreateOfferFromProduct = (prod: Product) => {
    setEditingOffer(null);
    setFormName(prod.name);
    setFormShortDesc(prod.description || "");
    setEnableCustomCover(false);
    setCustomCoverImage("");
    setCatalogItemsList([
      {
        id: `item-${Date.now()}`,
        name: prod.name,
        price: formatThousands(prod.price),
        compare_price: prod.compare_at_price ? formatThousands(prod.compare_at_price) : "",
        unit: prod.unit || "cái",
        category: prod.category || "Chung",
        description: prod.description || "",
        image_url: prod.image_url || "",
        enable_variants: Boolean(prod.variants && prod.variants.length > 0),
        variants: prod.variants && prod.variants.length > 0
          ? prod.variants.map((v) => ({
              id: v.id,
              name: v.name,
              price: formatThousands(v.price),
              compare_price: v.compare_at_price ? formatThousands(v.compare_at_price) : "",
            }))
          : [{ id: `var-1`, name: "Phiên bản tiêu chuẩn", price: formatThousands(prod.price), compare_price: "" }],
        enable_gallery: Boolean(prod.gallery && prod.gallery.length > 0),
        gallery: prod.gallery || [],
        enable_attachments: Boolean(prod.attachments && prod.attachments.length > 0),
        attachments: prod.attachments || [],
      },
    ]);
    setIsCreateOpen(true);
  };

  // =========================================================================
  // ITEM LIST MUTATIONS
  // =========================================================================
  const handleAddCatalogItemRow = () => {
    setCatalogItemsList([...catalogItemsList, createDefaultItem(catalogItemsList.length)]);
  };

  const handleRemoveCatalogItemRow = (index: number) => {
    if (catalogItemsList.length <= 1) return;
    setCatalogItemsList(catalogItemsList.filter((_, idx) => idx !== index));
  };

  const handleUpdateCatalogItemField = (index: number, field: keyof FormItemState, value: any) => {
    const updated = [...catalogItemsList];
    const finalVal = (field === "price" || field === "compare_price") && typeof value === "string" 
      ? formatThousands(value) 
      : value;
    updated[index] = { ...updated[index], [field]: finalVal };
    setCatalogItemsList(updated);
  };

  // Item Image Upload Handler
  const handleItemImageFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const compressed = await compressImageFile(file, 600, 0.7);
      handleUpdateCatalogItemField(index, "image_url", compressed);
    } catch (err) {
      console.error("Error reading image:", err);
    }
  };

  // Item Additional Gallery Photos (Max 5) - Atomic & Deduplicated
  const handleAddItemGalleryFile = async (itemIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    e.target.value = ""; // Clear input immediately to prevent double-firing

    try {
      const base64List = await Promise.all(
        filesArray.map((file) => compressImageFile(file, 600, 0.7))
      );

      setCatalogItemsList((prev) => {
        const copy = [...prev];
        const item = copy[itemIndex];
        const existing = item.gallery || [];
        
        // Deduplicate and enforce max 5 items
        const uniqueNew = base64List.filter((img) => !existing.includes(img));
        const combined = [...existing, ...uniqueNew].slice(0, 5);
        
        item.enable_gallery = true;
        item.gallery = combined;
        return copy;
      });
    } catch (err) {
      console.error("Error reading gallery files:", err);
    }
  };

  const handleRemoveItemGallery = (itemIndex: number, photoIndex: number) => {
    setCatalogItemsList((prev) => {
      const copy = [...prev];
      const filtered = copy[itemIndex].gallery.filter((_, idx) => idx !== photoIndex);
      copy[itemIndex].gallery = filtered;
      copy[itemIndex].enable_gallery = filtered.length > 0;
      return copy;
    });
  };

  // Item Attachment File Upload
  const handleItemAttachmentFileUpload = (itemIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // Clear input

    const reader = new FileReader();
    reader.onload = (event) => {
      const sizeKb = Math.round(file.size / 1024);
      let fileUrl = (event.target?.result as string) || "";
      if (file.size > 80 * 1024) {
        fileUrl = `blob:${file.name}`;
      }
      const newAttachment: OfferAttachment = {
        id: `att-item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: file.name,
        file_url: fileUrl,
        file_type: file.type || file.name.split(".").pop() || "file",
        file_size: sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`,
      };
      setCatalogItemsList((prev) => {
        const copy = [...prev];
        const existingAtts = copy[itemIndex].attachments || [];
        // Avoid duplicate filename attachments
        const nextAtts = existingAtts.some((a) => a.name === file.name)
          ? existingAtts
          : [...existingAtts, newAttachment];
        copy[itemIndex].enable_attachments = true;
        copy[itemIndex].attachments = nextAtts;
        return copy;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveItemAttachment = (itemIndex: number, attId: string) => {
    setCatalogItemsList((prev) => {
      const copy = [...prev];
      const filtered = copy[itemIndex].attachments.filter((a) => a.id !== attId);
      copy[itemIndex].attachments = filtered;
      copy[itemIndex].enable_attachments = filtered.length > 0;
      return copy;
    });
  };

  // Item Variants Mutations
  const handleAddVariantRow = (itemIndex: number) => {
    setCatalogItemsList((prev) => {
      const copy = [...prev];
      const item = copy[itemIndex];
      const nextNum = item.variants.length + 1;
      item.variants = [
        ...item.variants,
        { id: `var-${Date.now()}-${nextNum}`, name: `Phiên bản ${nextNum}`, price: item.price || "", compare_price: "" },
      ];
      return copy;
    });
  };

  const handleUpdateVariantField = (
    itemIndex: number,
    varIndex: number,
    field: keyof FormVariantState,
    value: string
  ) => {
    setCatalogItemsList((prev) => {
      const copy = [...prev];
      const item = copy[itemIndex];
      const finalVal = (field === "price" || field === "compare_price") ? formatThousands(value) : value;
      item.variants[varIndex] = { ...item.variants[varIndex], [field]: finalVal };
      return copy;
    });
  };

  const handleRemoveVariantRow = (itemIndex: number, varIndex: number) => {
    setCatalogItemsList((prev) => {
      const copy = [...prev];
      const item = copy[itemIndex];
      if (item.variants.length <= 1) return copy;
      item.variants = item.variants.filter((_, idx) => idx !== varIndex);
      return copy;
    });
  };

  // Open Edit Modal with Pre-filled data
  const handleOpenEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormName(offer.name);
    setFormCategory(offer.category_id || offer.items?.[0]?.category || "Chung");
    setFormShortDesc(offer.short_description || "");

    if (offer.items && offer.items.length > 0) {
      setCatalogItemsList(
        offer.items.map((it, idx) => ({
          id: it.id || `item-${Date.now()}-${idx}`,
          name: it.name,
          price: formatThousands(it.price),
          compare_price: it.compare_at_price ? formatThousands(it.compare_at_price) : "",
          unit: it.unit || "cái",
          category: it.category || "Chung",
          description: it.description || "",
          image_url: it.image_url || "",
          enable_variants: Boolean(it.variants && it.variants.length > 0),
          variants: it.variants && it.variants.length > 0
            ? it.variants.map((v) => ({
                id: v.id,
                name: v.name,
                price: formatThousands(v.price),
                compare_price: v.compare_at_price ? formatThousands(v.compare_at_price) : "",
              }))
            : [{ id: `var-1`, name: "Phiên bản tiêu chuẩn", price: formatThousands(it.price), compare_price: "" }],
          enable_gallery: Boolean(it.gallery && it.gallery.length > 0),
          gallery: it.gallery || [],
          enable_attachments: Boolean(it.attachments && it.attachments.length > 0),
          attachments: it.attachments || [],
        }))
      );
    } else {
      setCatalogItemsList([
        {
          id: `item-${Date.now()}`,
          name: offer.name,
          price: formatThousands(offer.price),
          compare_price: offer.compare_at_price ? formatThousands(offer.compare_at_price) : "",
          unit: offer.service_unit || "cái",
          category: "Chung",
          description: offer.short_description || offer.description || "",
          image_url: offer.image_url || "",
          enable_variants: Boolean(offer.variants && offer.variants.length > 0),
          variants: offer.variants && offer.variants.length > 0
            ? offer.variants.map((v) => ({
                id: v.id,
                name: v.name,
                price: formatThousands(v.price),
                compare_price: v.compare_at_price ? formatThousands(v.compare_at_price) : "",
              }))
            : [{ id: `var-1`, name: "Phiên bản tiêu chuẩn", price: formatThousands(offer.price), compare_price: "" }],
          enable_gallery: Boolean(offer.gallery && offer.gallery.length > 0),
          gallery: offer.gallery || [],
          enable_attachments: Boolean(offer.attachments && offer.attachments.length > 0),
          attachments: offer.attachments || [],
        },
      ]);
    }

    if (offer.image_url && offer.items && offer.items.length > 1 && offer.image_url !== offer.items[0]?.image_url) {
      setEnableCustomCover(true);
      setCustomCoverImage(offer.image_url);
    } else {
      setEnableCustomCover(false);
      setCustomCoverImage("");
    }

    // Load Payment Override
    if (offer.payment_override?.mode === "OFFER_OVERRIDE") {
      setPaymentOverrideMode("OFFER_OVERRIDE");
      setCustomPaymentAccountId(offer.payment_override.custom_payment_account_id || "");
      setCustomPaymentMethods(offer.payment_override.enabled_methods || ["VIETQR", "COD"]);
      setCustomDepositType(offer.payment_override.deposit_type || "PERCENTAGE");
      setCustomDepositPercentage(offer.payment_override.deposit_percentage || 30);
      setCustomDepositFixed(offer.payment_override.deposit_fixed_amount ? formatThousands(offer.payment_override.deposit_fixed_amount) : "");
      setCustomPayLaterTerms((offer.payment_override.pay_later_terms as any) || "NET_30");
    } else {
      setPaymentOverrideMode("STORE_DEFAULT");
      setCustomPaymentAccountId("");
      setCustomPaymentMethods(["VIETQR", "COD"]);
      setCustomDepositType("PERCENTAGE");
      setCustomDepositPercentage(30);
      setCustomDepositFixed("");
      setCustomPayLaterTerms("NET_30");
    }

    // Load Fulfillment Override
    if (offer.fulfillment_override?.mode === "OFFER_OVERRIDE") {
      setFulfillmentOverrideMode("OFFER_OVERRIDE");
      setCustomEnableFixedFee(offer.fulfillment_override.enable_fixed_fee !== false);
      setCustomFixedFeeDistanceKm(offer.fulfillment_override.fixed_fee_distance_km ? String(offer.fulfillment_override.fixed_fee_distance_km) : "10");
      setCustomFixedFee(offer.fulfillment_override.fixed_fee ? formatThousands(offer.fulfillment_override.fixed_fee) : "30000");
      setCustomEnableFreeThreshold(offer.fulfillment_override.enable_free_threshold !== false && Boolean(offer.fulfillment_override.free_shipping_threshold));
      setCustomFreeThreshold(offer.fulfillment_override.free_shipping_threshold ? formatThousands(offer.fulfillment_override.free_shipping_threshold) : "500000");
      setCustomEnableFreeDistance(Boolean(offer.fulfillment_override.enable_free_distance && offer.fulfillment_override.free_distance_km));
      setCustomFreeDistanceKm(offer.fulfillment_override.free_distance_km ? String(offer.fulfillment_override.free_distance_km) : "5");
      setCustomEnablePickup(offer.fulfillment_override.enable_pickup !== false && (offer.fulfillment_override.enabled_methods?.includes("STORE_PICKUP") ?? true));
      setCustomPickupAddress(offer.fulfillment_override.pickup_instructions_override || "");
      setCustomEnableQuoteLater(Boolean(offer.fulfillment_override.enable_quote_later || offer.fulfillment_override.enabled_methods?.includes("SHIPPING_QUOTE_LATER")));
    } else {
      setFulfillmentOverrideMode("STORE_DEFAULT");
      setCustomEnableFixedFee(true);
      setCustomFixedFeeDistanceKm("10");
      setCustomFixedFee("30000");
      setCustomEnableFreeThreshold(true);
      setCustomFreeThreshold("500000");
      setCustomEnableFreeDistance(false);
      setCustomFreeDistanceKm("5");
      setCustomEnablePickup(true);
      setCustomPickupAddress("");
      setCustomEnableQuoteLater(false);
    }

    if (offer.payment_settings?.bank_account_no) {
      setUseCustomBank(true);
      setFormBankBin(offer.payment_settings.bank_bin || "970422");
      setFormBankAccountNo(offer.payment_settings.bank_account_no);
      setFormBankAccountName(offer.payment_settings.bank_account_name || "");
    } else {
      setUseCustomBank(false);
    }

    setIsCreateOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateOpen(false);
    setEditingOffer(null);
    setFormName("");
    setFormCategory("Chung");
    setFormShortDesc("");
    setEnableCustomCover(false);
    setCustomCoverImage("");
    setCatalogItemsList([createDefaultItem()]);
    setUseCustomBank(false);
    setPaymentOverrideMode("STORE_DEFAULT");
    setCustomPaymentAccountId("");
    setCustomPaymentMethods(["VIETQR", "COD"]);
    setCustomDepositType("PERCENTAGE");
    setCustomDepositPercentage(30);
    setCustomDepositFixed("");
    setCustomPayLaterTerms("NET_30");
    setFulfillmentOverrideMode("STORE_DEFAULT");
    setCustomEnableFixedFee(true);
    setCustomFixedFeeDistanceKm("10");
    setCustomFixedFee("30000");
    setCustomEnableFreeThreshold(true);
    setCustomFreeThreshold("500000");
    setCustomEnableFreeDistance(false);
    setCustomFreeDistanceKm("5");
    setCustomEnablePickup(true);
    setCustomPickupAddress("");
    setCustomEnableQuoteLater(false);
    if (searchParams.get("create") === "true") {
      router.replace("/sell/offers");
    }
  };

  const filteredOffers = offers.filter((o) => {
    const isMulti = (o.items && o.items.length > 1) || o.offer_structure === "MENU_CATALOG";
    if (activeTab === "SINGLE" && isMulti) return false;
    if (activeTab === "CATALOG" && !isMulti) return false;
    const matchSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resolvedName = formName.trim() || catalogItemsList[0]?.name?.trim() || "Offer Thương Mại Mới";

      // Resolve Bank Info
      const chosenBankBin = useCustomBank ? formBankBin : defaultBankBin;
      const chosenAccountNo = useCustomBank ? formBankAccountNo.trim() : defaultAccountNo;
      const chosenAccountName = useCustomBank ? formBankAccountName.trim().toUpperCase() : defaultAccountName;

      const offerPaymentSettings = chosenAccountNo
        ? {
            bank_bin: chosenBankBin,
            bank_name: POPULAR_BANKS.find((b) => b.bin === chosenBankBin)?.name || "Ngân Hàng",
            bank_account_no: chosenAccountNo,
            bank_account_name: chosenAccountName,
            enable_bank_transfer: true,
            enable_cod: true,
          }
        : undefined;

      if (saveAsDefaultStoreBank && chosenAccountNo) {
        updateStore({
          payment_settings: offerPaymentSettings,
        });
      }

      // Map Items (if item name is blank, default to resolvedName)
      const validItems: OfferItem[] = catalogItemsList.map((it, idx) => {
        const itemName = it.name.trim() || (catalogItemsList.length === 1 ? resolvedName : `Sản phẩm ${idx + 1}`);
        const itemPrice = parseThousands(it.price) || 0;
        const itemComparePrice = it.compare_price ? parseThousands(it.compare_price) : undefined;
        const itemVariants: OfferVariant[] = it.enable_variants
          ? it.variants
              .filter((v) => v.name.trim() !== "")
              .map((v, vIdx) => ({
                id: v.id || `var-${Date.now()}-${vIdx}`,
                name: v.name.trim(),
                price: parseThousands(v.price) || itemPrice,
                compare_at_price: v.compare_price ? parseThousands(v.compare_price) : undefined,
                cost_price: (parseThousands(v.price) || itemPrice) * 0.5,
                created_at: new Date().toISOString(),
              }))
          : [];

        return {
          id: it.id || `item-${Date.now()}-${idx}`,
          name: itemName,
          price: itemPrice,
          compare_at_price: itemComparePrice,
          cost_price: itemPrice * 0.5,
          unit: it.unit.trim() || "cái",
          category: it.category.trim() || "Chung",
          description: it.description.trim(),
          image_url: it.image_url?.trim() || undefined,
          gallery: (it.enable_gallery || it.gallery.length > 0) ? it.gallery : [],
          attachments: (it.enable_attachments || it.attachments.length > 0) ? it.attachments : [],
          variants: itemVariants.length > 0 ? itemVariants : undefined,
          is_available: true,
        };
      });

      const isMultiple = validItems.length > 1;
      const basePrice = validItems.length > 0 ? Math.min(...validItems.map((p) => p.price)) : 0;
      
      // Primary Image: Custom cover if set, otherwise first item's image
      const primaryImg =
        (enableCustomCover && customCoverImage.trim())
          ? customCoverImage.trim()
          : (validItems.length > 0 && validItems[0].image_url ? validItems[0].image_url : undefined);
          
      const topGallery = validItems[0]?.gallery || [];
      const topAttachments = validItems[0]?.attachments || [];
      const topVariants = !isMultiple && validItems[0]?.variants ? validItems[0].variants : undefined;

      const orgId = organization.id || store.organization_id || "org-2k-tech";
      const storeId = store.id || "store-2k-official";

      const paymentOverridePayload: OfferPaymentOverride = {
        mode: paymentOverrideMode,
        custom_payment_account_id: paymentOverrideMode === "OFFER_OVERRIDE" && customPaymentAccountId ? customPaymentAccountId : undefined,
        enabled_methods: paymentOverrideMode === "OFFER_OVERRIDE" ? customPaymentMethods : undefined,
        deposit_type: paymentOverrideMode === "OFFER_OVERRIDE" && customPaymentMethods.includes("DEPOSIT") ? customDepositType : undefined,
        deposit_percentage: paymentOverrideMode === "OFFER_OVERRIDE" && customPaymentMethods.includes("DEPOSIT") ? customDepositPercentage : undefined,
        deposit_fixed_amount: paymentOverrideMode === "OFFER_OVERRIDE" && customPaymentMethods.includes("DEPOSIT") && customDepositFixed ? parseThousands(customDepositFixed) : undefined,
        pay_later_terms: paymentOverrideMode === "OFFER_OVERRIDE" && customPaymentMethods.includes("PAY_LATER") ? customPayLaterTerms : undefined,
      };

      const enabledFulfillmentList: FulfillmentMethodType[] = [];
      if (customEnableFixedFee || customEnableFreeThreshold || customEnableFreeDistance) {
        enabledFulfillmentList.push("DELIVERY");
      }
      if (customEnablePickup) {
        enabledFulfillmentList.push("STORE_PICKUP");
      }
      if (customEnableQuoteLater) {
        enabledFulfillmentList.push("SHIPPING_QUOTE_LATER");
      }

      const fulfillmentOverridePayload: OfferFulfillmentOverride = {
        mode: fulfillmentOverrideMode,
        enabled_methods: fulfillmentOverrideMode === "OFFER_OVERRIDE" ? enabledFulfillmentList : undefined,
        enable_fixed_fee: fulfillmentOverrideMode === "OFFER_OVERRIDE" ? customEnableFixedFee : undefined,
        fixed_fee_distance_km: fulfillmentOverrideMode === "OFFER_OVERRIDE" && customEnableFixedFee && customFixedFeeDistanceKm ? Number(customFixedFeeDistanceKm) : undefined,
        fixed_fee: fulfillmentOverrideMode === "OFFER_OVERRIDE" && customEnableFixedFee && customFixedFee ? parseThousands(customFixedFee) : undefined,
        enable_free_threshold: fulfillmentOverrideMode === "OFFER_OVERRIDE" ? customEnableFreeThreshold : undefined,
        free_shipping_threshold: fulfillmentOverrideMode === "OFFER_OVERRIDE" && customEnableFreeThreshold && customFreeThreshold ? parseThousands(customFreeThreshold) : undefined,
        enable_free_distance: fulfillmentOverrideMode === "OFFER_OVERRIDE" ? customEnableFreeDistance : undefined,
        free_distance_km: fulfillmentOverrideMode === "OFFER_OVERRIDE" && customEnableFreeDistance && customFreeDistanceKm ? Number(customFreeDistanceKm) : undefined,
        enable_pickup: fulfillmentOverrideMode === "OFFER_OVERRIDE" ? customEnablePickup : undefined,
        pickup_instructions_override: fulfillmentOverrideMode === "OFFER_OVERRIDE" && customEnablePickup && customPickupAddress ? customPickupAddress : undefined,
        enable_quote_later: fulfillmentOverrideMode === "OFFER_OVERRIDE" ? customEnableQuoteLater : undefined,
      };

      if (editingOffer) {
        updateOffer(editingOffer.id, {
          name: resolvedName,
          slug: slugify(resolvedName),
          store_slug: store.slug || "auto",
          category_id: formCategory.trim() || "Chung",
          short_description: formShortDesc.trim() || (isMultiple ? `Bảng giá gồm ${validItems.length} sản phẩm/dịch vụ.` : validItems[0]?.description || ""),
          description: formShortDesc.trim() || (isMultiple ? `Bảng giá gồm ${validItems.length} sản phẩm/dịch vụ.` : validItems[0]?.description || ""),
          price: basePrice,
          compare_at_price: !isMultiple && validItems[0]?.compare_at_price ? validItems[0].compare_at_price : undefined,
          cost_price: basePrice * 0.5,
          offer_structure: isMultiple ? "MENU_CATALOG" : "SINGLE",
          image_url: primaryImg,
          gallery: topGallery,
          attachments: topAttachments,
          variants: topVariants,
          items: validItems,
          payment_settings: offerPaymentSettings,
          payment_override: paymentOverridePayload,
          fulfillment_override: fulfillmentOverridePayload,
        });
      } else {
        createOffer({
          organization_id: orgId,
          store_id: storeId,
          store_slug: store.slug || "auto",
          offer_type: "PRODUCT",
          offer_structure: isMultiple ? "MENU_CATALOG" : "SINGLE",
          name: resolvedName,
          slug: slugify(resolvedName),
          category_id: formCategory.trim() || "Chung",
          short_description: formShortDesc.trim() || (isMultiple ? `Bảng giá gồm ${validItems.length} sản phẩm/dịch vụ.` : validItems[0]?.description || ""),
          description: formShortDesc.trim() || (isMultiple ? `Bảng giá gồm ${validItems.length} sản phẩm/dịch vụ.` : validItems[0]?.description || ""),
          price: basePrice,
          compare_at_price: !isMultiple && validItems[0]?.compare_at_price ? validItems[0].compare_at_price : undefined,
          cost_price: basePrice * 0.5,
          status: "ACTIVE",
          image_url: primaryImg,
          gallery: topGallery,
          attachments: topAttachments,
          variants: topVariants,
          inventory_tracking: !isMultiple,
          items: validItems,
          payment_settings: offerPaymentSettings,
          payment_override: paymentOverridePayload,
          fulfillment_override: fulfillmentOverridePayload,
        });
      }

      // Auto-sync products into Master Product Library
      syncProductsFromOfferItems(validItems, orgId);

      setToastMessage(editingOffer ? `Đã lưu cập nhật Offer "${resolvedName}" thành công!` : `Đã tạo Offer "${resolvedName}" và phát hành thành công!`);
      setTimeout(() => setToastMessage(null), 4000);

      handleCloseModal();
    } catch (err: any) {
      console.error("Error saving offer:", err);
      alert(`Đã xảy ra lỗi khi lưu Offer: ${err.message || err}`);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingOffer) {
      deleteOffer(deletingOffer.id);
      setDeletingOffer(null);
      setToastMessage("Đã xóa Offer thành công.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-600/30 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-emerald-700 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Create CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100">
            Sản Phẩm & Dịch Vụ (Offers)
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Quản lý, chỉnh sửa, thư viện sản phẩm gốc và phát hành link Offer thương mại
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenManageBankAccounts()}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Quản lý tài khoản ngân hàng và mã VietQR nhận tiền"
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Tài Khoản VietQR</span>
            {resolveOfferBankInfo(null, store, paymentAccounts).is_configured ? (
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono">
                {resolveOfferBankInfo(null, store, paymentAccounts).bank_short_name}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px]">
                Chưa thêm
              </span>
            )}
          </button>

          {activeTab === "LIBRARY" ? (
            <button
              onClick={() => handleOpenCreateProductInLibrary()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Sản Phẩm Vào Thư Viện</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingOffer(null);
                setFormName("");
                setFormShortDesc("");
                setCatalogItemsList([createDefaultItem()]);
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo Offer Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-200/60 dark:bg-neutral-800 rounded-xl w-full md:w-auto overflow-x-auto">
          {(["ALL", "SINGLE", "CATALOG", "LIBRARY"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              {tab === "ALL" && `Tất cả Offers (${offers.length})`}
              {tab === "SINGLE" && `📦 Đơn lẻ (${offers.filter((o) => !o.items || o.items.length <= 1).length})`}
              {tab === "CATALOG" && `📋 Bảng giá nhiều SP (${offers.filter((o) => o.items && o.items.length > 1).length})`}
              {tab === "LIBRARY" && `🗄️ Thư Viện Sản Phẩm Gốc (${products.length})`}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={activeTab === "LIBRARY" ? "Tìm theo tên hoặc mã SKU sản phẩm..." : "Tìm kiếm Offer theo tên..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      {/* Main Content Area: Offers Grid vs Master Product Library Grid */}
      {activeTab === "LIBRARY" ? (
        /* MASTER PRODUCT LIBRARY VIEW */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-purple-900 dark:text-purple-200">
            <div className="flex items-center gap-2">
              <Library className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <p className="font-bold">Thư Viện Sản Phẩm / Dịch Vụ Gốc (Master Catalog)</p>
                <p className="text-[11px] text-purple-700 dark:text-purple-300">
                  Lưu trữ danh mục sản phẩm của doanh nghiệp. Bạn có thể chọn nhanh các sản phẩm này khi tạo bất kỳ Offer/Bảng giá nào.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenCreateProductInLibrary()}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Sản Phẩm Mới</span>
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 space-y-3">
              <Package className="w-12 h-12 text-neutral-300 mx-auto" />
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                Chưa có sản phẩm nào trong thư viện phù hợp với từ khóa tìm kiếm
              </p>
              <button
                onClick={() => handleOpenCreateProductInLibrary()}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer"
              >
                + Thêm Sản Phẩm Đầu Tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div className="relative aspect-16/9 bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                      {prod.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-100/80 dark:bg-neutral-800/80">
                          <Package className="w-10 h-10 mb-1 opacity-40" />
                          <span className="text-[10px] font-medium opacity-60">Chưa có hình ảnh</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-900/80 text-white backdrop-blur-md">
                          {prod.category || "Chung"}
                        </span>
                        {prod.sku && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-600 text-white">
                            SKU: {prod.sku}
                          </span>
                        )}
                        {prod.variants && prod.variants.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-600 text-white">
                            {prod.variants.length} phiên bản
                          </span>
                        )}
                        {prod.gallery && prod.gallery.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-600 text-white flex items-center gap-1">
                            <ImageIcon className="w-2.5 h-2.5" />
                            <span>+{prod.gallery.length} ảnh</span>
                          </span>
                        )}
                        {prod.attachments && prod.attachments.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-600 text-white flex items-center gap-1">
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>{prod.attachments.length} file</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1">
                        {prod.name}
                      </h3>

                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-blue-600 dark:text-blue-400">
                          {formatVND(prod.price)}
                        </span>
                        {prod.compare_at_price && (
                          <span className="text-xs text-neutral-400 line-through">
                            {formatVND(prod.compare_at_price)}
                          </span>
                        )}
                        <span className="text-xs text-neutral-400">/{prod.unit || "cái"}</span>
                      </div>

                      {prod.description && (
                        <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                          {prod.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCreateOfferFromProduct(prod)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>⚡ Tạo Offer Nhanh</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenCreateProductInLibrary(prod)}
                        className="p-1.5 text-neutral-600 hover:text-blue-600 hover:bg-white dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
                        title="Chỉnh sửa sản phẩm"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingProduct(prod)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-white dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                        title="Xóa khỏi thư viện"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* OFFERS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffers.map((offer) => {
            const offerUrl = AppUrlService.getOfferUrl(store.slug, offer.slug);
            const isCatalog = offer.offer_structure === "MENU_CATALOG" || (offer.items && offer.items.length > 1);
            const resolvedBank = resolveOfferBankInfo(offer, store, paymentAccounts);
            const vietQrImgUrl = resolvedBank.is_configured
              ? `https://img.vietqr.io/image/${resolvedBank.bank_bin}-${resolvedBank.account_number}-compact2.png?amount=${offer.price || 0}&addInfo=${encodeURIComponent(offer.name)}&accountName=${encodeURIComponent(resolvedBank.account_name)}`
              : "";

            return (
              <div
                key={offer.id}
                onClick={() => handleOpenEdit(offer)}
                className={`group bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between cursor-pointer ${
                  isCatalog ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                <div>
                  {/* Offer Image & Badges */}
                  <div className="relative aspect-16/9 bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                    {((offer.items && offer.items.length > 0 && offer.items[0].image_url) || offer.image_url) ? (
                      <img
                        src={(offer.items && offer.items.length > 0 && offer.items[0].image_url) || offer.image_url}
                        alt={offer.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-100/80 dark:bg-neutral-800/80">
                        <Package className="w-10 h-10 mb-1 opacity-40" />
                        <span className="text-[10px] font-medium opacity-60">Chưa có hình ảnh</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                      {isCatalog ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-700 text-white backdrop-blur-md flex items-center gap-1">
                          <ListOrdered className="w-3 h-3" />
                          <span>BẢNG GIÁ ({offer.items?.length || 0} MỤC)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-900/80 text-white backdrop-blur-md">
                          {offer.offer_type === "PRODUCT" ? "📦 SẢN PHẨM" : "🛠️ DỊCH VỤ"}
                        </span>
                      )}

                      {offer.gallery && offer.gallery.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-600 text-white">
                          +{offer.gallery.length} ảnh
                        </span>
                      )}

                      {offer.attachments && offer.attachments.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-600 text-white flex items-center gap-1">
                          <Paperclip className="w-2.5 h-2.5" />
                          <span>{offer.attachments.length} file</span>
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                          offer.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-neutral-200 text-neutral-700"
                        }`}
                      >
                        {offer.status}
                      </span>
                    </div>
                  </div>

                  {/* Offer Body */}
                  <div className="p-4 space-y-2.5">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {offer.name}
                    </h3>

                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-blue-600 dark:text-blue-400">
                        {isCatalog ? `Từ ${formatVND(offer.price)}` : formatVND(offer.price)}
                      </span>
                      {offer.compare_at_price && (
                        <span className="text-xs text-neutral-400 line-through">
                          {formatVND(offer.compare_at_price)}
                        </span>
                      )}
                      {offer.service_unit && (
                        <span className="text-xs text-neutral-400">/{offer.service_unit}</span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                      {offer.short_description || offer.description}
                    </p>

                    {resolvedBank.is_configured ? (
                      <div className="pt-1 flex items-center justify-between gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            VietQR: <strong className="text-neutral-800 dark:text-neutral-200">{resolvedBank.bank_short_name}</strong> • <span className="font-mono font-semibold">{resolvedBank.account_number}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenManageBankAccounts();
                          }}
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold shrink-0 ml-1 cursor-pointer"
                        >
                          Đổi/Sửa
                        </button>
                      </div>
                    ) : (
                      <div className="pt-1 flex items-center justify-between gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <CreditCard className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span className="truncate">Chưa cấu hình TK VietQR</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenManageBankAccounts();
                          }}
                          className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer shadow-xs"
                        >
                          + Thêm TK
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Offer Sharing Actions */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="p-4 pt-0 border-t border-neutral-100 dark:border-neutral-800/80 mt-2 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5">
                    <CopyButton text={offerUrl} label="Copy Link" className="text-xs py-1.5" />
                    <button
                      onClick={() =>
                        setSelectedQR({
                          url: offerUrl,
                          title: offer.name,
                          subtitle: isCatalog ? `Từ ${formatVND(offer.price)}` : formatVND(offer.price),
                          bankInfo: {
                            bank_name: resolvedBank.bank_name,
                            bank_short_name: resolvedBank.bank_short_name,
                            bank_bin: resolvedBank.bank_bin,
                            account_number: resolvedBank.account_number,
                            account_name: resolvedBank.account_name,
                            qr_image_url: resolvedBank.qr_image_url,
                            vietqr_url: vietQrImgUrl,
                          },
                        })
                      }
                      className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Mã QR Offer & VietQR Thanh Toán"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(offer)}
                      className="p-1.5 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 dark:text-neutral-300 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                      title="Chỉnh sửa Offer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Sửa</span>
                    </button>

                    <a
                      href={offerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                      title="Mở trang Offer"
                    >
                      <span>Mở Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => setDeletingOffer(offer)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Xóa Offer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNIFIED SINGLE-WINDOW CREATE & EDIT OFFER MODAL                           */}
      {/* ========================================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* 1. PERMANENTLY FIXED MODAL HEADER */}
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-white dark:bg-neutral-900 z-20">
              <div>
                <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                  {editingOffer ? `Chỉnh Sửa: ${editingOffer.name}` : "Tạo Offer Thương Mại Mới"}
                </h3>
                <p className="text-xs text-neutral-500">
                  Thiết lập sản phẩm/dịch vụ, phiên bản, hình ảnh, tài liệu và VietQR 24/7
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. SCROLLABLE MODAL BODY */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
              <form onSubmit={handleFormSubmit} className="space-y-5">
                {/* Offer Title & Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Tên Offer / Sản Phẩm / Bảng Giá *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Bàn thao tác cơ khí chuyên dụng (hoặc Bảng Giá Thiết Bị Xưởng 2K)"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      <span>Danh mục phân loại</span>
                    </label>
                    <input
                      type="text"
                      list="dynamic-categories-datalist"
                      placeholder="Chọn hoặc nhập phân loại mới..."
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold focus:ring-2 focus:ring-blue-500"
                    />
                    <datalist id="dynamic-categories-datalist">
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Dynamic Product / Service Items List */}
                <div className="space-y-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <ListOrdered className="w-4 h-4 text-emerald-600" />
                      <span>Danh Sách Sản Phẩm / Dịch Vụ:</span>
                    </span>
                    <span className="text-[11px] font-bold text-neutral-400">
                      {catalogItemsList.length} mục
                    </span>
                  </div>

                  <div className="space-y-4">
                    {catalogItemsList.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/80 space-y-3 text-xs shadow-xs"
                      >
                        {/* Item Main Attributes Row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                          {/* Thumbnail with Click to Upload / Camera */}
                          <div className="relative group w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 border overflow-hidden shrink-0 flex items-center justify-center">
                            {item.image_url ? (
                              <>
                                <img
                                  src={item.image_url}
                                  alt={item.name || "Preview"}
                                  className="w-full h-full object-cover"
                                />
                                <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[9px] font-bold">
                                  <Camera className="w-3.5 h-3.5" />
                                  <span>Đổi</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleItemImageFileChange(idx, e)}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateCatalogItemField(idx, "image_url", "");
                                  }}
                                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs cursor-pointer z-10 hover:bg-red-700"
                                  title="Xóa ảnh"
                                >
                                  ×
                                </button>
                              </>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-400 hover:text-emerald-600">
                                <Camera className="w-4 h-4" />
                                <span className="text-[9px] font-semibold mt-0.5">+ Ảnh</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleItemImageFileChange(idx, e)}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>

                          {/* Name */}
                          <div className="flex-1 w-full">
                            <input
                              type="text"
                              placeholder="Tên sản phẩm / dịch vụ * (vd: Bàn thao tác...)"
                              value={item.name}
                              onChange={(e) => handleUpdateCatalogItemField(idx, "name", e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Price (VNĐ) */}
                          <div className="w-full sm:w-32">
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="3.500.000"
                                value={item.price}
                                onChange={(e) => handleUpdateCatalogItemField(idx, "price", e.target.value)}
                                className="w-full px-3 py-2 pr-7 rounded-xl bg-neutral-50 dark:bg-neutral-800 border text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono text-right focus:ring-2 focus:ring-emerald-500"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 font-semibold pointer-events-none">
                                đ
                              </span>
                            </div>
                          </div>

                          {/* Giá gạch (Compare at price) */}
                          <div className="w-full sm:w-32">
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Giá gạch..."
                                value={item.compare_price}
                                onChange={(e) => handleUpdateCatalogItemField(idx, "compare_price", e.target.value)}
                                className="w-full px-3 py-2 pr-7 rounded-xl bg-neutral-50 dark:bg-neutral-800 border text-xs text-neutral-400 dark:text-neutral-500 line-through font-mono text-right focus:ring-2 focus:ring-emerald-500"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 font-semibold pointer-events-none">
                                đ
                              </span>
                            </div>
                          </div>

                          {/* Unit */}
                          <div className="w-full sm:w-20">
                            <input
                              type="text"
                              placeholder="Đơn vị"
                              value={item.unit}
                              onChange={(e) => handleUpdateCatalogItemField(idx, "unit", e.target.value)}
                              className="w-full px-2.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border text-xs text-neutral-600 dark:text-neutral-300 text-center"
                            />
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveCatalogItemRow(idx)}
                            disabled={catalogItemsList.length <= 1}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl disabled:opacity-20 cursor-pointer shrink-0"
                            title="Xóa mục này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Description & Category Row */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Mô tả ngắn gọn (thông số kỹ thuật, quy cách, kích thước, bảo hành...)"
                              value={item.description}
                              onChange={(e) => handleUpdateCatalogItemField(idx, "description", e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border text-xs text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 bg-neutral-50 dark:bg-neutral-800/80 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 pl-2 whitespace-nowrap flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Phân loại:</span>
                            </span>
                            <div className="relative">
                              <input
                                type="text"
                                list="dynamic-categories-datalist"
                                placeholder="Chọn hoặc nhập mới..."
                                value={item.category || ""}
                                onChange={(e) => handleUpdateCatalogItemField(idx, "category", e.target.value)}
                                className="w-44 sm:w-52 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Advanced Options Checkboxes for this item */}
                        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-4 text-[11px]">
                          {/* Variants Toggle */}
                          <div className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              id={`var-toggle-${idx}`}
                              checked={item.enable_variants}
                              onChange={(e) => handleUpdateCatalogItemField(idx, "enable_variants", e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <label
                              htmlFor={`var-toggle-${idx}`}
                              className={`cursor-pointer select-none ${item.enable_variants ? "font-bold text-blue-600 dark:text-blue-400" : "text-neutral-400"}`}
                            >
                              🏷️ Phiên bản / Mức giá riêng
                            </label>
                          </div>

                          {/* Gallery Photos Toggle */}
                          <div className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              id={`gal-toggle-${idx}`}
                              checked={item.enable_gallery}
                              onChange={(e) => handleUpdateCatalogItemField(idx, "enable_gallery", e.target.checked)}
                              className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <label
                              htmlFor={`gal-toggle-${idx}`}
                              className={`cursor-pointer select-none ${item.enable_gallery ? "font-bold text-purple-600 dark:text-purple-400" : "text-neutral-400"}`}
                            >
                              🖼️ Bộ sưu tập ảnh ({item.gallery?.length || 0}/5)
                            </label>
                          </div>

                          {/* Attachments Toggle */}
                          <div className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              id={`att-toggle-${idx}`}
                              checked={item.enable_attachments}
                              onChange={(e) => handleUpdateCatalogItemField(idx, "enable_attachments", e.target.checked)}
                              className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <label
                              htmlFor={`att-toggle-${idx}`}
                              className={`cursor-pointer select-none ${item.enable_attachments ? "font-bold text-amber-600 dark:text-amber-400" : "text-neutral-400"}`}
                            >
                              📎 File / Bản vẽ đính kèm ({item.attachments?.length || 0})
                            </label>
                          </div>
                        </div>

                        {/* EXPANDED VARIANTS PANEL */}
                        {item.enable_variants && (
                          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2 animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200">
                                Các Phiên Bản / Phân Loại & Mức Giá:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddVariantRow(idx)}
                                className="px-2 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 cursor-pointer"
                              >
                                + Thêm phiên bản
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {item.variants.map((v, vIdx) => (
                                <div key={v.id || vIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Tên phiên bản (vd: Khung Inox, Bản 1.2m...)"
                                    value={v.name}
                                    onChange={(e) => handleUpdateVariantField(idx, vIdx, "name", e.target.value)}
                                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                                  />
                                  <div className="w-28 relative">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      placeholder="Giá bán"
                                      value={v.price}
                                      onChange={(e) => handleUpdateVariantField(idx, vIdx, "price", e.target.value)}
                                      className="w-full px-2.5 py-1.5 pr-6 rounded-lg bg-white dark:bg-neutral-900 border text-xs font-mono font-bold text-right text-emerald-600"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-neutral-400 font-semibold pointer-events-none">đ</span>
                                  </div>
                                  <div className="w-28 relative">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      placeholder="Giá gạch"
                                      value={v.compare_price}
                                      onChange={(e) => handleUpdateVariantField(idx, vIdx, "compare_price", e.target.value)}
                                      className="w-full px-2.5 py-1.5 pr-6 rounded-lg bg-white dark:bg-neutral-900 border text-xs font-mono line-through text-right text-neutral-400"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-neutral-400 pointer-events-none">đ</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariantRow(idx, vIdx)}
                                    disabled={item.variants.length <= 1}
                                    className="p-1.5 text-neutral-400 hover:text-red-500 disabled:opacity-20 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* EXPANDED GALLERY PANEL FOR THIS ITEM */}
                        {item.enable_gallery && (
                          <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-2 animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200">
                                Ảnh Phụ Chi Tiết Của Sản Phẩm Này (Tối đa 5 ảnh):
                              </span>
                              {item.gallery.length < 5 && (
                                <label className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer">
                                  <Upload className="w-3 h-3" />
                                  <span>+ Thêm ảnh phụ</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => handleAddItemGalleryFile(idx, e)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>

                            {item.gallery.length > 0 ? (
                              <div className="grid grid-cols-5 gap-2 pt-1">
                                {item.gallery.map((gUrl, gIdx) => (
                                  <div key={gIdx} className="relative aspect-square rounded-lg overflow-hidden border border-purple-200 bg-white shadow-xs group">
                                    <img src={gUrl} alt="" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItemGallery(idx, gIdx)}
                                      className="absolute top-1 right-1 p-0.5 rounded-full bg-red-600 text-white cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-neutral-400 italic">Chưa có ảnh phụ nào cho mục này.</p>
                            )}
                          </div>
                        )}

                        {/* EXPANDED ATTACHMENTS PANEL FOR THIS ITEM */}
                        {item.enable_attachments && (
                          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2 animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                                Tài Liệu & File Đính Kèm Của Mục Này:
                              </span>
                              <label className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer">
                                <FileDown className="w-3 h-3" />
                                <span>+ Tải file đính kèm</span>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.dwg,.dxf,.zip,.rar,.xlsx,.png,.jpg"
                                  onChange={(e) => handleItemAttachmentFileUpload(idx, e)}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {item.attachments.length > 0 ? (
                              <div className="space-y-1 pt-1">
                                {item.attachments.map((a) => (
                                  <div key={a.id} className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-amber-200 flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">{a.name}</span>
                                      <span className="text-[10px] text-neutral-400 shrink-0">({a.file_size})</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItemAttachment(idx, a.id)}
                                      className="text-neutral-400 hover:text-red-600 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-neutral-400 italic">Chưa có tài liệu đính kèm cho mục này.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* NÚT THÊM SẢN PHẨM / CHỌN TỪ THƯ VIỆN DƯỚI CÙNG DANH SÁCH */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleAddCatalogItemRow}
                      className="w-full py-2.5 px-4 rounded-2xl border-2 border-dashed border-emerald-400 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>+ Thêm Sản Phẩm Mới</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLibraryProductIds([]);
                        setProductLibrarySearch("");
                        setIsProductLibraryPickerOpen(true);
                      }}
                      className="w-full py-2.5 px-4 rounded-2xl border-2 border-dashed border-blue-400 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Package className="w-4 h-4 text-blue-600" />
                      <span>📦 Chọn Từ Thư Viện ({products.length})</span>
                    </button>
                  </div>
                </div>

                {/* Mô tả ngắn gọn / Ghi chú chung */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Mô tả ngắn gọn / Giới thiệu chung
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Báo giá thiết bị cơ khí xưởng sản xuất, bảo hành 12 tháng tận nơi..."
                    value={formShortDesc}
                    onChange={(e) => setFormShortDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                {/* Tùy chọn Ảnh bìa / Banner đại diện riêng cho Bảng giá */}
                <div className={`p-3.5 rounded-2xl border transition-all ${enableCustomCover ? "bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/60" : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/80 opacity-80 hover:opacity-100"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enableCustomCoverToggle"
                        checked={enableCustomCover}
                        onChange={(e) => {
                          setEnableCustomCover(e.target.checked);
                          if (!e.target.checked) setCustomCoverImage("");
                        }}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <label
                        htmlFor="enableCustomCoverToggle"
                        className={`text-xs cursor-pointer select-none ${enableCustomCover ? "font-bold text-purple-900 dark:text-purple-200" : "font-medium text-neutral-600 dark:text-neutral-400"}`}
                      >
                        🖼️ Đặt Ảnh bìa / Banner đại diện riêng cho Bảng giá này
                        {!enableCustomCover && (
                          <span className="text-[11px] text-neutral-400 font-normal italic ml-1.5">
                            (Mặc định sẽ tự động lấy ảnh của sản phẩm đầu tiên)
                          </span>
                        )}
                      </label>
                    </div>
                  </div>

                  {enableCustomCover && (
                    <div className="pt-3 mt-2 border-t border-purple-200 dark:border-purple-900/60 flex flex-col sm:flex-row items-center gap-3.5 animate-in fade-in">
                      <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border border-purple-300 dark:border-purple-800 shrink-0 flex items-center justify-center shadow-xs">
                        {customCoverImage ? (
                          <img src={customCoverImage} alt="Banner Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-2 text-neutral-400">
                            <ImageIcon className="w-5 h-5 mx-auto mb-0.5 opacity-50" />
                            <span className="text-[9px] block">Chưa chọn ảnh</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 w-full space-y-1.5">
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Tải ảnh từ máy</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                e.target.value = "";
                                try {
                                  const compressed = await compressImageFile(file, 1000, 0.8);
                                  setCustomCoverImage(compressed);
                                } catch (err) {
                                  console.error("Error reading cover image:", err);
                                }
                              }}
                              className="hidden"
                            />
                          </label>

                          <label className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all">
                            <Camera className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Chụp Camera</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                e.target.value = "";
                                try {
                                  const compressed = await compressImageFile(file, 1000, 0.8);
                                  setCustomCoverImage(compressed);
                                } catch (err) {
                                  console.error("Error reading cover image:", err);
                                }
                              }}
                              className="hidden"
                            />
                          </label>

                          {customCoverImage && (
                            <button
                              type="button"
                              onClick={() => setCustomCoverImage("")}
                              className="text-xs text-red-500 hover:underline cursor-pointer ml-1"
                            >
                              Xóa ảnh
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400">
                          Ảnh này sẽ hiển thị làm banner trang bảng giá và thumbnail khi chia sẻ link Zalo/Facebook.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ========================================================================= */}
                {/* 1. PAYMENT OVERRIDE SECTION                                               */}
                {/* ========================================================================= */}
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                        Cấu Hình Phương Thức Thanh Toán
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${paymentOverrideMode === "STORE_DEFAULT" ? "bg-white dark:bg-neutral-900 border-blue-500 ring-1 ring-blue-500/30 font-bold text-blue-900 dark:text-blue-200" : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"}`}>
                      <input
                        type="radio"
                        name="paymentOverrideMode"
                        checked={paymentOverrideMode === "STORE_DEFAULT"}
                        onChange={() => setPaymentOverrideMode("STORE_DEFAULT")}
                        className="text-blue-600"
                      />
                      <span>Kế thừa thiết lập Cửa hàng (Mặc định)</span>
                    </label>

                    <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${paymentOverrideMode === "OFFER_OVERRIDE" ? "bg-white dark:bg-neutral-900 border-blue-500 ring-1 ring-blue-500/30 font-bold text-blue-900 dark:text-blue-200" : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"}`}>
                      <input
                        type="radio"
                        name="paymentOverrideMode"
                        checked={paymentOverrideMode === "OFFER_OVERRIDE"}
                        onChange={() => setPaymentOverrideMode("OFFER_OVERRIDE")}
                        className="text-blue-600"
                      />
                      <span>Tùy chỉnh riêng cho Offer này</span>
                    </label>
                  </div>

                  {/* READ-ONLY SUMMARY WHEN STORE_DEFAULT */}
                  {paymentOverrideMode === "STORE_DEFAULT" && (() => {
                    const defaultBank = resolveOfferBankInfo(null, store, paymentAccounts);
                    return (
                      <div className="p-3.5 rounded-xl bg-white/90 dark:bg-neutral-900 border border-blue-200 dark:border-blue-800/80 space-y-2.5 text-xs animate-in fade-in">
                        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                          <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            <span>Chi tiết thiết lập thanh toán mặc định của Cửa hàng:</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                            Đang áp dụng
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                          <div className="space-y-1">
                            <p className="text-[11px] text-neutral-500 font-medium">Tài khoản nhận tiền VietQR:</p>
                            {defaultBank.is_configured ? (
                              <div>
                                <div className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                  <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span className="truncate">
                                    {defaultBank.bank_short_name} • <span className="font-mono">{defaultBank.account_number}</span>
                                  </span>
                                </div>
                                <p className="text-[10px] text-neutral-400">
                                  Chủ TK: {defaultBank.account_name}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="text-[11px] text-amber-600 font-bold block">Chưa cấu hình tài khoản ngân hàng</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenManageBankAccounts()}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer shadow-xs"
                                >
                                  + Thêm tài khoản ngân hàng
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <p className="text-[11px] text-neutral-500 font-medium">Phương thức thanh toán được hỗ trợ:</p>
                            <div className="flex flex-wrap gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 font-bold text-[10px] text-emerald-700 dark:text-emerald-300">
                                ✓ VietQR / Chuyển khoản
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold text-[10px] text-neutral-700 dark:text-neutral-300">
                                ✓ Thu tiền COD
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold text-[10px] text-neutral-700 dark:text-neutral-300">
                                ✓ Tại cửa hàng
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                          <div className="flex items-center gap-2">
                            <span>💡 Đang kế thừa chính sách thanh toán chung của cửa hàng.</span>
                            <button
                              type="button"
                              onClick={() => handleOpenManageBankAccounts()}
                              className="font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              (Sửa tài khoản ngân hàng)
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPaymentOverrideMode("OFFER_OVERRIDE")}
                            className="font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Chỉnh sửa riêng cho Offer này</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* INTERACTIVE CONTROLS WHEN OFFER_OVERRIDE */}
                  {paymentOverrideMode === "OFFER_OVERRIDE" && (
                    <div className="pt-3 border-t border-blue-200 dark:border-blue-900/60 space-y-3 animate-in fade-in text-xs">
                      {/* Choose Payment Account */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                            Tài khoản ngân hàng nhận tiền VietQR:
                          </label>
                          <button
                            type="button"
                            onClick={() => handleOpenManageBankAccounts()}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Quản lý / Thêm tài khoản</span>
                          </button>
                        </div>
                        <select
                          value={customPaymentAccountId}
                          onChange={(e) => {
                            if (e.target.value === "__ADD_NEW__") {
                              handleOpenManageBankAccounts();
                            } else {
                              setCustomPaymentAccountId(e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 font-bold"
                        >
                          <option value="">-- Dùng tài khoản mặc định của Cửa hàng --</option>
                          {paymentAccounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.bank_short_name} - {acc.account_number} ({acc.account_name}) {acc.is_default ? "★ Mặc định" : ""}
                            </option>
                          ))}
                          <option value="__ADD_NEW__">+ Thêm tài khoản ngân hàng mới...</option>
                        </select>
                      </div>

                      {/* Payment Methods Checkboxes */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                          Cho phép các phương thức (Thêm / Bớt tùy chỉnh):
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { id: "VIETQR", label: "VietQR / Chuyển khoản" },
                            { id: "COD", label: "Thu tiền COD" },
                            { id: "PAY_AT_STORE", label: "Tại cửa hàng" },
                            { id: "DEPOSIT", label: "Đặt cọc trước" },
                            { id: "PAY_LATER", label: "Trả sau (NET terms)" },
                          ].map((pm) => {
                            const isChecked = customPaymentMethods.includes(pm.id as PaymentMethodType);
                            return (
                              <label
                                key={pm.id}
                                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                                  isChecked
                                    ? "bg-white dark:bg-neutral-900 border-blue-400 font-bold text-blue-900 dark:text-blue-200 shadow-2xs"
                                    : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setCustomPaymentMethods(customPaymentMethods.filter((m) => m !== pm.id));
                                    } else {
                                      setCustomPaymentMethods([...customPaymentMethods, pm.id as PaymentMethodType]);
                                    }
                                  }}
                                  className="rounded text-blue-600"
                                />
                                <span className="text-[11px]">{pm.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Deposit Config */}
                      {customPaymentMethods.includes("DEPOSIT") && (
                        <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
                          <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-bold">Mức đặt cọc:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="5"
                              max="95"
                              value={customDepositPercentage}
                              onChange={(e) => setCustomDepositPercentage(Number(e.target.value))}
                              className="w-16 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-center font-bold text-xs"
                            />
                            <span className="font-bold">%</span>
                          </div>
                        </div>
                      )}

                      {/* Pay Later Config */}
                      {customPaymentMethods.includes("PAY_LATER") && (
                        <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
                          <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-bold">Kỳ hạn trả sau:</span>
                          <select
                            value={customPayLaterTerms}
                            onChange={(e) => setCustomPayLaterTerms(e.target.value as any)}
                            className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 font-bold text-xs"
                          >
                            <option value="NET_7">NET 7 (7 ngày)</option>
                            <option value="NET_15">NET 15 (15 ngày)</option>
                            <option value="NET_30">NET 30 (30 ngày)</option>
                            <option value="NET_45">NET 45 (45 ngày)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ========================================================================= */}
                {/* 2. FULFILLMENT OVERRIDE SECTION                                           */}
                {/* ========================================================================= */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                        Cấu Hình Vận Chuyển & Giao Hàng
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${fulfillmentOverrideMode === "STORE_DEFAULT" ? "bg-white dark:bg-neutral-900 border-emerald-500 ring-1 ring-emerald-500/30 font-bold text-emerald-900 dark:text-emerald-200" : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"}`}>
                      <input
                        type="radio"
                        name="fulfillmentOverrideMode"
                        checked={fulfillmentOverrideMode === "STORE_DEFAULT"}
                        onChange={() => setFulfillmentOverrideMode("STORE_DEFAULT")}
                        className="text-emerald-600"
                      />
                      <span>Kế thừa thiết lập Cửa hàng (Mặc định)</span>
                    </label>

                    <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${fulfillmentOverrideMode === "OFFER_OVERRIDE" ? "bg-white dark:bg-neutral-900 border-emerald-500 ring-1 ring-emerald-500/30 font-bold text-emerald-900 dark:text-emerald-200" : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"}`}>
                      <input
                        type="radio"
                        name="fulfillmentOverrideMode"
                        checked={fulfillmentOverrideMode === "OFFER_OVERRIDE"}
                        onChange={() => setFulfillmentOverrideMode("OFFER_OVERRIDE")}
                        className="text-emerald-600"
                      />
                      <span>Tùy chỉnh riêng cho Offer này</span>
                    </label>
                  </div>

                  {/* READ-ONLY SUMMARY WHEN STORE_DEFAULT */}
                  {fulfillmentOverrideMode === "STORE_DEFAULT" && (
                    <div className="p-3.5 rounded-xl bg-white/90 dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-800/80 space-y-2.5 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                        <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Chi tiết thiết lập vận chuyển mặc định của Cửa hàng:</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                          Đang áp dụng
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                        <div className="space-y-0.5">
                          <p className="text-[11px] text-neutral-500 font-medium">Chính sách phí giao hàng:</p>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                            Phí cố định: {formatVND(store.shipping_settings?.default_fixed_fee ?? 30000)}
                          </div>
                          <p className="text-[10px] text-neutral-400">
                            Miễn phí ship cho đơn từ: {formatVND(store.shipping_settings?.free_shipping_threshold ?? 500000)}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] text-neutral-500 font-medium">Hình thức giao nhận hỗ trợ:</p>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 font-bold text-[10px] text-emerald-700 dark:text-emerald-300">
                              ✓ Giao hàng tận nơi (Toàn quốc)
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold text-[10px] text-neutral-700 dark:text-neutral-300">
                              ✓ Nhận tại cửa hàng / kho
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                        <span>💡 Đang kế thừa chính sách vận chuyển chung của cửa hàng.</span>
                        <button
                          type="button"
                          onClick={() => setFulfillmentOverrideMode("OFFER_OVERRIDE")}
                          className="font-bold text-emerald-600 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>Chỉnh sửa riêng cho Offer này</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* INTERACTIVE CONTROLS WHEN OFFER_OVERRIDE */}
                  {fulfillmentOverrideMode === "OFFER_OVERRIDE" && (
                    <div className="pt-3 border-t border-emerald-200 dark:border-emerald-900/60 space-y-3 animate-in fade-in text-xs">
                      {/* UNIFIED FULFILLMENT METHODS LIST */}
                      <div className="space-y-3">
                        {/* 1. Phí giao hàng cố định trong phạm vi */}
                        <div
                          className={`p-3 rounded-xl border transition-all space-y-2 ${
                            customEnableFixedFee
                              ? "bg-white dark:bg-neutral-900 border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-2xs"
                              : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 opacity-80"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                            <label className="flex items-start gap-2.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={customEnableFixedFee}
                                onChange={(e) => setCustomEnableFixedFee(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 rounded mt-0.5"
                              />
                              <div className="space-y-0.5">
                                <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                                  Phí giao hàng cố định trong phạm vi
                                </span>
                                <span className="text-neutral-500 text-[11px]">
                                  Áp dụng mức phí vận chuyển cố định cho Offer này trong phạm vi quy định
                                </span>
                              </div>
                            </label>

                            {customEnableFixedFee && (
                              <div className="flex flex-wrap items-center gap-2.5 pl-6 md:pl-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-neutral-500 font-bold whitespace-nowrap">Phạm vi:</span>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="1"
                                      min="1"
                                      max="1000"
                                      value={customFixedFeeDistanceKm}
                                      onChange={(e) => setCustomFixedFeeDistanceKm(e.target.value)}
                                      className="w-20 px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-bold text-xs text-right pr-7"
                                    />
                                    <span className="absolute right-2 top-1.5 text-xs font-bold text-neutral-400">km</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-neutral-500 font-bold whitespace-nowrap">Mức phí:</span>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={customFixedFee}
                                      onChange={(e) => setCustomFixedFee(formatThousands(e.target.value))}
                                      className="w-28 px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-bold text-xs text-right pr-6"
                                    />
                                    <span className="absolute right-2 top-1.5 text-xs font-bold text-neutral-400">đ</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 2. Miễn phí giao hàng với đơn hàng giá trị trên */}
                        <div
                          className={`p-3 rounded-xl border transition-all space-y-2 ${
                            customEnableFreeThreshold
                              ? "bg-white dark:bg-neutral-900 border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-2xs"
                              : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 opacity-80"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <label className="flex items-start gap-2.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={customEnableFreeThreshold}
                                onChange={(e) => setCustomEnableFreeThreshold(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 rounded mt-0.5"
                              />
                              <div className="space-y-0.5">
                                <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                                  Miễn phí giao hàng với đơn hàng giá trị trên
                                </span>
                                <span className="text-neutral-500 text-[11px]">
                                  Tự động freeship khi mua đơn hàng đạt hạn mức
                                </span>
                              </div>
                            </label>

                            {customEnableFreeThreshold && (
                              <div className="flex items-center gap-2 pl-6 sm:pl-0">
                                <span className="text-xs text-neutral-500 font-bold whitespace-nowrap">Đơn từ:</span>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={customFreeThreshold}
                                    onChange={(e) => setCustomFreeThreshold(formatThousands(e.target.value))}
                                    className="w-32 px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-bold text-xs text-right pr-6"
                                  />
                                  <span className="absolute right-2 top-1.5 text-xs font-bold text-neutral-400">đ</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 3. Miễn phí giao hàng trong phạm vi */}
                        <div
                          className={`p-3 rounded-xl border transition-all space-y-2 ${
                            customEnableFreeDistance
                              ? "bg-white dark:bg-neutral-900 border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-2xs"
                              : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 opacity-80"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <label className="flex items-start gap-2.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={customEnableFreeDistance}
                                onChange={(e) => setCustomEnableFreeDistance(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 rounded mt-0.5"
                              />
                              <div className="space-y-0.5">
                                <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                                  Miễn phí giao hàng trong phạm vi
                                </span>
                                <span className="text-neutral-500 text-[11px]">
                                  Miễn phí ship trong bán kính quanh cửa hàng / kho
                                </span>
                              </div>
                            </label>

                            {customEnableFreeDistance && (
                              <div className="flex items-center gap-2 pl-6 sm:pl-0">
                                <span className="text-xs text-neutral-500 font-bold whitespace-nowrap">Bán kính:</span>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={customFreeDistanceKm}
                                    onChange={(e) => setCustomFreeDistanceKm(e.target.value)}
                                    className="w-20 px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-bold text-xs text-right pr-7"
                                  />
                                  <span className="absolute right-2 top-1.5 text-xs font-bold text-neutral-400">km</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 4. Nhận tại Cửa hàng / Showroom */}
                        <div
                          className={`p-3 rounded-xl border transition-all space-y-2 ${
                            customEnablePickup
                              ? "bg-white dark:bg-neutral-900 border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-2xs"
                              : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 opacity-80"
                          }`}
                        >
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={customEnablePickup}
                              onChange={(e) => setCustomEnablePickup(e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded mt-0.5"
                            />
                            <div className="space-y-0.5">
                              <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                                Nhận Tại Cửa Hàng / Showroom
                              </span>
                              <span className="text-neutral-500 text-[11px]">
                                Miễn phí 100%, khách tự đến lấy hàng
                              </span>
                            </div>
                          </label>

                          {customEnablePickup && (
                            <div className="pl-6 pt-1 space-y-1 animate-in fade-in">
                              <label className="block text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                                Địa chỉ & Hướng dẫn nhận hàng riêng của Offer (nếu khác địa chỉ cửa hàng):
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Để trống nếu lấy theo địa chỉ cửa hàng..."
                                value={customPickupAddress}
                                onChange={(e) => setCustomPickupAddress(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                              />
                            </div>
                          )}
                        </div>

                        {/* 5. Báo Phí Giao Hàng Sau (Quote Later) */}
                        <div
                          className={`p-3 rounded-xl border transition-all space-y-2 ${
                            customEnableQuoteLater
                              ? "bg-white dark:bg-neutral-900 border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-2xs"
                              : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 opacity-80"
                          }`}
                        >
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={customEnableQuoteLater}
                              onChange={(e) => setCustomEnableQuoteLater(e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded mt-0.5"
                            />
                            <div className="space-y-0.5">
                              <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                                Báo Phí Giao Hàng Sau (Quote Later)
                              </span>
                              <span className="text-neutral-500 text-[11px]">
                                Dành cho hàng cồng kềnh, máy móc (Người bán liên hệ báo giá cước thực tế)
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleFormSubmit}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingOffer ? "Lưu Thay Đổi Offer" : "Tạo Offer & Phát Hành Ngay"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODALS */}
      {/* ========================================================================= */}
      <ConfirmModal
        isOpen={!!deletingOffer}
        onClose={() => setDeletingOffer(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa Offer"
        itemName={deletingOffer?.name}
        message={
          <span>
            Bạn có chắc chắn muốn xóa Offer này không? Link bán hàng công khai của offer này sẽ bị vô hiệu hóa. Dữ liệu các đơn hàng đã đặt trước đó vẫn được lưu trữ an toàn.
          </span>
        }
        confirmText="Xóa Offer"
      />

      <ConfirmModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => {
          if (deletingProduct) {
            deleteProduct(deletingProduct.id);
            setDeletingProduct(null);
            setToastMessage("Đã xóa sản phẩm khỏi thư viện.");
            setTimeout(() => setToastMessage(null), 3000);
          }
        }}
        title="Xác nhận xóa Sản phẩm"
        itemName={deletingProduct?.name}
        message={
          <span>
            Bạn có chắc chắn muốn xóa sản phẩm này khỏi <strong>Thư Viện Gốc (Master Catalog)</strong> không? Thao tác này sẽ loại bỏ sản phẩm khỏi thư viện dùng chung của cửa hàng.
          </span>
        }
        confirmText="Xóa Sản Phẩm"
      />

      {/* ========================================================================= */}
      {/* PRODUCT LIBRARY PICKER MODAL (SELECT PRODUCTS FOR OFFER)                  */}
      {/* ========================================================================= */}
      {isProductLibraryPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-white dark:bg-neutral-900 z-20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100">
                    Chọn Sản Phẩm Từ Thư Viện Gốc
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Tick chọn các sản phẩm/dịch vụ bạn muốn đưa vào Offer/Bảng giá này
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProductLibraryPickerOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên sản phẩm, danh mục, SKU..."
                  value={productLibrarySearch}
                  onChange={(e) => setProductLibrarySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (selectedLibraryProductIds.length === products.length) {
                    setSelectedLibraryProductIds([]);
                  } else {
                    setSelectedLibraryProductIds(products.map((p) => p.id));
                  }
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-700 dark:text-neutral-200 cursor-pointer whitespace-nowrap"
              >
                {selectedLibraryProductIds.length === products.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-neutral-100 dark:divide-neutral-800">
              {products
                .filter((p) =>
                  p.name.toLowerCase().includes(productLibrarySearch.toLowerCase()) ||
                  (p.sku && p.sku.toLowerCase().includes(productLibrarySearch.toLowerCase())) ||
                  (p.category && p.category.toLowerCase().includes(productLibrarySearch.toLowerCase()))
                )
                .map((prod) => {
                  const isSelected = selectedLibraryProductIds.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setSelectedLibraryProductIds((prev) =>
                          isSelected ? prev.filter((id) => id !== prod.id) : [...prev, prod.id]
                        );
                      }}
                      className={`pt-2.5 first:pt-0 flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800"
                          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                      }`}
                    >
                      <div className="text-blue-600 shrink-0">
                        {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />}
                      </div>

                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-neutral-400 opacity-50" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                            {prod.name}
                          </h4>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            {prod.category || "Chung"}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                            {formatVND(prod.price)}
                          </span>
                          {prod.compare_at_price && (
                            <span className="text-[10px] text-neutral-400 line-through">
                              {formatVND(prod.compare_at_price)}
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-400">/{prod.unit || "cái"}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                          {prod.variants && prod.variants.length > 0 && (
                            <span className="text-purple-600 font-semibold">● {prod.variants.length} phiên bản</span>
                          )}
                          {prod.attachments && prod.attachments.length > 0 && (
                            <span className="text-amber-600 font-semibold">● {prod.attachments.length} file đính kèm</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/80 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                Đã chọn: <strong className="text-blue-600 font-bold">{selectedLibraryProductIds.length}</strong> sản phẩm
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductLibraryPickerOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={selectedLibraryProductIds.length === 0}
                  onClick={handleSelectProductsFromLibrary}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Thêm {selectedLibraryProductIds.length > 0 ? `(${selectedLibraryProductIds.length})` : ""} Vào Offer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT PRODUCT DIRECTLY IN LIBRARY MODAL                           */}
      {/* ========================================================================= */}
      {isCreateProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-white dark:bg-neutral-900 z-20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100">
                    {editingLibraryProduct ? "Chỉnh Sửa Sản Phẩm Trong Thư Viện" : "Thêm Sản Phẩm Mới Vào Thư Viện"}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Lưu thông tin sản phẩm mẫu, bảng giá, hình ảnh, tài liệu kỹ thuật để tái sử dụng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateProductModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
              <form onSubmit={handleSaveProductInLibrary} className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/80 space-y-3 text-xs shadow-xs">
                  {/* Item Main Attributes Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                    {/* Thumbnail with Click to Upload / Camera */}
                    <div className="relative group w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 border overflow-hidden shrink-0 flex items-center justify-center">
                      {libProdItem.image_url ? (
                        <>
                          <img
                            src={libProdItem.image_url}
                            alt={libProdItem.name || "Preview"}
                            className="w-full h-full object-cover"
                          />
                          <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[9px] font-bold">
                            <Camera className="w-3.5 h-3.5" />
                            <span>Đổi</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLibProdImageFileChange}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateLibProdField("image_url", "");
                            }}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs cursor-pointer z-10 hover:bg-red-700"
                            title="Xóa ảnh"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-400 hover:text-purple-600">
                          <Camera className="w-4 h-4" />
                          <span className="text-[9px] font-semibold mt-0.5">+ Ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLibProdImageFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        required
                        placeholder="Tên sản phẩm / dịch vụ * (vd: Bàn thao tác...)"
                        value={libProdItem.name}
                        onChange={(e) => handleUpdateLibProdField("name", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Price (VNĐ) */}
                    <div className="w-full sm:w-32">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          inputMode="numeric"
                          placeholder="3.500.000"
                          value={libProdItem.price}
                          onChange={(e) => handleUpdateLibProdField("price", e.target.value)}
                          className="w-full px-3 py-2 pr-7 rounded-xl bg-neutral-50 dark:bg-neutral-800 border text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono text-right focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 font-semibold pointer-events-none">
                          đ
                        </span>
                      </div>
                    </div>

                    {/* Giá gạch (Compare at price) */}
                    <div className="w-full sm:w-32">
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Giá gạch..."
                          value={libProdItem.compare_price}
                          onChange={(e) => handleUpdateLibProdField("compare_price", e.target.value)}
                          className="w-full px-3 py-2 pr-7 rounded-xl bg-neutral-50 dark:bg-neutral-800 border text-xs text-neutral-400 dark:text-neutral-500 line-through font-mono text-right focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 font-semibold pointer-events-none">
                          đ
                        </span>
                      </div>
                    </div>

                    {/* Unit */}
                    <div className="w-full sm:w-20">
                      <input
                        type="text"
                        placeholder="Đơn vị"
                        value={libProdItem.unit}
                        onChange={(e) => handleUpdateLibProdField("unit", e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border text-xs text-neutral-600 dark:text-neutral-300 text-center"
                      />
                    </div>
                  </div>

                  {/* Description & Category Row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Mô tả ngắn gọn (thông số kỹ thuật, quy cách, kích thước, bảo hành...)"
                        value={libProdItem.description}
                        onChange={(e) => handleUpdateLibProdField("description", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border text-xs text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 bg-neutral-50 dark:bg-neutral-800/80 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 pl-2 whitespace-nowrap flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-purple-600" />
                        <span>Phân loại:</span>
                      </span>
                      <div className="relative">
                        <input
                          type="text"
                          list="dynamic-categories-datalist"
                          placeholder="Chọn hoặc nhập mới..."
                          value={libProdItem.category || ""}
                          onChange={(e) => handleUpdateLibProdField("category", e.target.value)}
                          className="w-44 sm:w-52 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:ring-2 focus:ring-purple-500 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Advanced Options Checkboxes for this item */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-4 text-[11px]">
                    {/* Variants Toggle */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id="lib-var-toggle"
                        checked={libProdItem.enable_variants}
                        onChange={(e) => handleUpdateLibProdField("enable_variants", e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label
                        htmlFor="lib-var-toggle"
                        className={`cursor-pointer select-none ${libProdItem.enable_variants ? "font-bold text-blue-600 dark:text-blue-400" : "text-neutral-400"}`}
                      >
                        🏷️ Phiên bản / Mức giá riêng
                      </label>
                    </div>

                    {/* Gallery Photos Toggle */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id="lib-gal-toggle"
                        checked={libProdItem.enable_gallery}
                        onChange={(e) => handleUpdateLibProdField("enable_gallery", e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <label
                        htmlFor="lib-gal-toggle"
                        className={`cursor-pointer select-none ${libProdItem.enable_gallery ? "font-bold text-purple-600 dark:text-purple-400" : "text-neutral-400"}`}
                      >
                        🖼️ Bộ sưu tập ảnh ({libProdItem.gallery?.length || 0}/5)
                      </label>
                    </div>

                    {/* Attachments Toggle */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id="lib-att-toggle"
                        checked={libProdItem.enable_attachments}
                        onChange={(e) => handleUpdateLibProdField("enable_attachments", e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <label
                        htmlFor="lib-att-toggle"
                        className={`cursor-pointer select-none ${libProdItem.enable_attachments ? "font-bold text-amber-600 dark:text-amber-400" : "text-neutral-400"}`}
                      >
                        📎 File / Bản vẽ đính kèm ({libProdItem.attachments?.length || 0})
                      </label>
                    </div>
                  </div>

                  {/* EXPANDED VARIANTS PANEL */}
                  {libProdItem.enable_variants && (
                    <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200">
                          Các Phiên Bản / Phân Loại & Mức Giá:
                        </span>
                        <button
                          type="button"
                          onClick={handleAddLibProdVariantRow}
                          className="px-2 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 cursor-pointer"
                        >
                          + Thêm phiên bản
                        </button>
                      </div>

                      <div className="space-y-2">
                        {libProdItem.variants.map((v, vIdx) => (
                          <div key={v.id || vIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Tên phiên bản (vd: Màu đen / Size XL / Inox 304)"
                              value={v.name}
                              onChange={(e) => handleUpdateLibProdVariantField(vIdx, "name", e.target.value)}
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border text-[11px] font-medium"
                            />
                            <div className="relative w-28">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Giá bán"
                                value={v.price}
                                onChange={(e) => handleUpdateLibProdVariantField(vIdx, "price", e.target.value)}
                                className="w-full px-2.5 py-1.5 pr-6 rounded-lg bg-white dark:bg-neutral-900 border text-[11px] font-bold text-blue-600 text-right font-mono"
                              />
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-neutral-400 font-semibold pointer-events-none">
                                đ
                              </span>
                            </div>
                            <div className="relative w-28">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Giá gạch"
                                value={v.compare_price}
                                onChange={(e) => handleUpdateLibProdVariantField(vIdx, "compare_price", e.target.value)}
                                className="w-full px-2.5 py-1.5 pr-6 rounded-lg bg-white dark:bg-neutral-900 border text-[11px] text-neutral-400 line-through text-right font-mono"
                              />
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-neutral-400 font-semibold pointer-events-none">
                                đ
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveLibProdVariantRow(vIdx)}
                              disabled={libProdItem.variants.length <= 1}
                              className="p-1.5 text-neutral-400 hover:text-red-600 disabled:opacity-20 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EXPANDED GALLERY PANEL */}
                  {libProdItem.enable_gallery && (
                    <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200">
                          Bộ Sưu Tập Ảnh Sản Phẩm ({libProdItem.gallery?.length || 0}/5):
                        </span>
                        <div className="flex items-center gap-1.5">
                          <label className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] cursor-pointer flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            <span>+ Thêm ảnh</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleAddLibProdGalleryFile}
                              className="hidden"
                            />
                          </label>
                          <label className="px-2 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 font-bold text-[10px] cursor-pointer flex items-center gap-1">
                            <Camera className="w-3 h-3 text-emerald-600" />
                            <span>Chụp</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleAddLibProdGalleryFile}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {libProdItem.gallery && libProdItem.gallery.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {libProdItem.gallery.map((photo, pIdx) => (
                            <div key={pIdx} className="relative group w-14 h-14 rounded-lg overflow-hidden border bg-white dark:bg-neutral-900 shrink-0">
                              <img src={photo} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveLibProdGallery(pIdx)}
                                className="absolute inset-0 bg-red-600/70 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-neutral-400 italic">
                          Chưa có ảnh phụ nào. Bấm nút "+ Thêm ảnh" hoặc "Chụp" để thêm tối đa 5 ảnh.
                        </p>
                      )}
                    </div>
                  )}

                  {/* EXPANDED ATTACHMENTS PANEL */}
                  {libProdItem.enable_attachments && (
                    <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                          Tài Liệu / Bản Vẽ Kỹ Thuật Đính Kèm ({libProdItem.attachments?.length || 0}):
                        </span>
                        <label className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] cursor-pointer flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          <span>+ Đính kèm file</span>
                          <input
                            type="file"
                            onChange={handleLibProdAttachmentFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {libProdItem.attachments && libProdItem.attachments.length > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          {libProdItem.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between text-[11px]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">{att.name}</span>
                                {att.file_size && (
                                  <span className="text-[10px] text-neutral-400 shrink-0">({att.file_size})</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveLibProdAttachment(att.id)}
                                className="text-neutral-400 hover:text-red-600 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-neutral-400 italic">
                          Chưa có tài liệu nào đính kèm (PDF catalogue, bản vẽ CAD/DXF, chứng chỉ CO/CQ...).
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Actions Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateProductModalOpen(false)}
                    className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 rounded-xl cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    {editingLibraryProduct ? "Lưu Cập Nhật Sản Phẩm" : "Lưu Vào Thư Viện"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* BANK ACCOUNTS & VIETQR MANAGEMENT MODAL */}
      {isBankAccountsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                    {isEditingBankAcc
                      ? editingBankAccId
                        ? "Chỉnh Sửa Tài Khoản Ngân Hàng"
                        : "Thêm Tài Khoản Ngân Hàng Mới"
                      : "Quản Lý Tài Khoản Ngân Hàng & VietQR"}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isEditingBankAcc
                      ? "Điền thông tin tài khoản ngân hàng nhận tiền và mã QR thanh toán"
                      : `Danh sách các tài khoản ngân hàng nhận tiền (${paymentAccounts.length})`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsBankAccountsModalOpen(false);
                  setIsEditingBankAcc(false);
                  setEditingBankAccId(null);
                }}
                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {isEditingBankAcc ? (
                /* FORM ADD / EDIT BANK ACCOUNT */
                <form onSubmit={handleSaveBankAccountForm} className="space-y-4">
                  {/* Select Bank */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Ngân hàng thụ hưởng: <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bankAccBin}
                      onChange={(e) => {
                        const bin = e.target.value;
                        setBankAccBin(bin);
                        const b = POPULAR_BANKS.find((item) => item.bin === bin);
                        if (b) {
                          setBankAccName(b.name);
                          setBankAccShortName(b.shortName);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.bin} value={b.bin}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Account Number */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Số tài khoản: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: 0988123456 hoặc 1029384756"
                        value={bankAccNumber}
                        onChange={(e) => setBankAccNumber(e.target.value.replace(/\s+/g, ""))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden tracking-wide"
                      />
                    </div>

                    {/* Account Name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Tên chủ tài khoản: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: NGUYEN VAN A"
                        value={bankAccHolder}
                        onChange={(e) => setBankAccHolder(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* QR Image Upload / Auto Preview */}
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                          Mã VietQR thanh toán tự động
                        </span>
                        <p className="text-[11px] text-neutral-400">
                          Hệ thống tự động sinh mã VietQR theo chuẩn Napas247, hoặc bạn có thể tải lên ảnh mã QR riêng.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-32 h-32 rounded-2xl bg-white p-2 border border-neutral-200 shadow-xs flex items-center justify-center shrink-0">
                        {bankAccQrImage ? (
                          <img src={bankAccQrImage} alt="QR" className="w-full h-full object-contain" />
                        ) : bankAccNumber ? (
                          <img
                            src={`https://img.vietqr.io/image/${bankAccBin}-${bankAccNumber}-compact2.png?accountName=${encodeURIComponent(bankAccHolder)}`}
                            alt="VietQR"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-neutral-400 p-2 text-[10px]">
                            <QrCode className="w-8 h-8 mx-auto mb-1 opacity-40" />
                            <span>Nhập STK để sinh mã VietQR</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 flex-1 text-xs">
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 text-neutral-700 dark:text-neutral-200 font-bold cursor-pointer shadow-xs transition-all">
                          <Upload className="w-4 h-4 text-blue-600" />
                          <span>Tải ảnh mã QR riêng (tùy chọn)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCustomQrUpload}
                            className="hidden"
                          />
                        </label>
                        {bankAccQrImage && (
                          <button
                            type="button"
                            onClick={() => setBankAccQrImage("")}
                            className="block text-red-500 hover:underline text-[11px]"
                          >
                            Xóa ảnh QR riêng (dùng VietQR tự động)
                          </button>
                        )}
                        <p className="text-[10px] text-neutral-400">
                          Định dạng hỗ trợ: JPG, PNG. Ảnh sẽ được tự động tối ưu hóa hiển thị sắc nét.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Is Default Checkbox */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bankAccIsDefault}
                      onChange={(e) => setBankAccIsDefault(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-blue-950 dark:text-blue-200 block">
                        Đặt làm tài khoản nhận tiền mặc định cho toàn bộ Cửa hàng & Offer
                      </span>
                      <span className="text-[11px] text-blue-700 dark:text-blue-400">
                        Tất cả các Offer mới và mặc định sẽ tự động nhận tiền về tài khoản này.
                      </span>
                    </div>
                  </label>

                  {/* Form Footer Buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    {paymentAccounts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingBankAcc(false);
                          setEditingBankAccId(null);
                        }}
                        className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 rounded-xl cursor-pointer"
                      >
                        Quay lại danh sách
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      {editingBankAccId ? "Lưu Cập Nhật Tài Khoản" : "Thêm Tài Khoản Ngay"}
                    </button>
                  </div>
                </form>
              ) : (
                /* ACCOUNTS LIST VIEW */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                      Tài khoản đang hoạt động:
                    </span>
                    <button
                      type="button"
                      onClick={handleStartAddNewBankAccount}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Tài Khoản Mới</span>
                    </button>
                  </div>

                  {paymentAccounts.length === 0 ? (
                    <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 space-y-3">
                      <CreditCard className="w-10 h-10 text-neutral-400 mx-auto opacity-50" />
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                          Chưa có tài khoản ngân hàng nào được thiết lập
                        </p>
                        <p className="text-xs text-neutral-500">
                          Thêm tài khoản ngân hàng để tạo mã VietQR tự động và nhận tiền từ khách hàng.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleStartAddNewBankAccount}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                      >
                        + Thêm Tài Khoản Ngân Hàng Đầu Tiên
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {paymentAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                            acc.is_default
                              ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 ring-1 ring-blue-500/20"
                              : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-xs text-neutral-900 dark:text-neutral-100">
                                {acc.bank_short_name || acc.bank_name}
                              </span>
                              {acc.is_default ? (
                                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                                  ★ Mặc định
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultBankAcc(acc.id)}
                                  className="text-[10px] text-neutral-500 hover:text-blue-600 hover:underline font-semibold cursor-pointer"
                                >
                                  Đặt làm mặc định
                                </button>
                              )}
                            </div>

                            <p className="font-mono text-base font-black text-blue-600 dark:text-blue-400 tracking-wider">
                              {acc.account_number}
                            </p>

                            <div className="text-[11px] text-neutral-600 dark:text-neutral-300">
                              <span className="text-neutral-400">Chủ TK: </span>
                              <strong className="uppercase">{acc.account_name}</strong>
                            </div>
                          </div>

                          <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => handleOpenManageBankAccounts(acc)}
                              className="text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteBankAcc(acc.id)}
                              className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {selectedQR && (
        <QRModal
          isOpen={true}
          onClose={() => setSelectedQR(null)}
          url={selectedQR.url}
          title={selectedQR.title}
          subtitle={selectedQR.subtitle}
          bankInfo={selectedQR.bankInfo}
        />
      )}

      {/* CONFIRM DELETE OFFER MODAL */}
      {deletingOffer && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeletingOffer(null)}
          onConfirm={() => {
            if (deletingOffer) {
              deleteOffer(deletingOffer.id);
              setDeletingOffer(null);
            }
          }}
          title="Xác nhận xóa Offer"
          message={`Bạn có chắc chắn muốn xóa Offer "${deletingOffer.name}"? Hành động này sẽ gỡ bỏ liên kết và bảng giá này khỏi Cửa hàng.`}
          confirmText="Xác nhận xóa"
          cancelText="Hủy bỏ"
          variant="danger"
        />
      )}

      {/* CONFIRM DELETE PRODUCT FROM LIBRARY MODAL */}
      {deletingProduct && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeletingProduct(null)}
          onConfirm={() => {
            if (deletingProduct) {
              deleteProduct(deletingProduct.id);
              setDeletingProduct(null);
            }
          }}
          title="Xác nhận xóa sản phẩm khỏi thư viện"
          message={`Bạn có chắc chắn muốn xóa sản phẩm "${deletingProduct.name}" khỏi thư viện gốc?`}
          confirmText="Xóa sản phẩm"
          cancelText="Hủy bỏ"
          variant="danger"
        />
      )}
    </div>
  );
}

export default function OffersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Đang tải danh sách Offer...</div>}>
      <OffersContent />
    </Suspense>
  );
}

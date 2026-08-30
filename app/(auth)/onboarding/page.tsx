"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Building,
  Store as StoreIcon,
  Tag,
  CreditCard,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Package,
  Wrench,
  Layers,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { slugify, formatVND } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function OnboardingPage() {
  const router = useRouter();
  const { updateOrganization, updateStore, createOffer } = useCommerceStore();
  const [step, setStep] = useState(1);

  // Step 1: Organization
  const [orgName, setOrgName] = useState("Công Ty TNHH 2K Solutions");
  const [taxCode, setTaxCode] = useState("0109988776");

  // Step 2: Store
  const [storeName, setStoreName] = useState("2K Smart Commerce");
  const [storeSlug, setStoreSlug] = useState("2k-store");

  // Step 3: What do you sell?
  const [sellType, setSellType] = useState<"PRODUCT" | "SERVICE" | "BOTH">("BOTH");

  // Step 4: Payment setup
  const [bankBin, setBankBin] = useState("970422");
  const [bankAccountNo, setBankAccountNo] = useState("098812345688");
  const [bankAccountName, setBankAccountName] = useState("CONG TY TNHH 2K SOLUTIONS");

  // Step 5: First Offer
  const [offerName, setOfferName] = useState("Combo Nước Rửa Công Nghiệp & Bảo Trì Định Kỳ");
  const [offerPrice, setOfferPrice] = useState("850000");

  const handleFinishOnboarding = () => {
    // 1. Update Org
    updateOrganization({
      name: orgName,
      slug: slugify(orgName),
      tax_code: taxCode,
    });

    // 2. Update Store
    updateStore({
      store_name: storeName,
      slug: storeSlug,
      payment_settings: {
        bank_bin: bankBin,
        bank_account_no: bankAccountNo,
        bank_account_name: bankAccountName,
        enable_cod: true,
        enable_bank_transfer: true,
      },
    });

    // 3. Create First Offer
    createOffer({
      organization_id: "org-2k-tech",
      store_id: "store-2k-official",
      offer_type: sellType === "SERVICE" ? "SERVICE" : "PRODUCT",
      name: offerName,
      slug: slugify(offerName),
      price: Number(offerPrice) || 500000,
      cost_price: (Number(offerPrice) || 500000) * 0.6,
      status: "ACTIVE",
      inventory_tracking: sellType !== "SERVICE",
      short_description: "Offer khởi tạo đầu tiên của bạn sẵn sàng chia sẻ.",
      image_url: "https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=600",
    });

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans flex items-center justify-center p-4 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-xl w-full bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
              {step}/5
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Khởi tạo Cửa Hàng & Kênh Bán
              </p>
              <p className="text-[10px] text-neutral-400">Thiết lập 5 bước siêu nhanh</p>
            </div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-5 h-1.5 rounded-full transition-all ${
                  step >= i ? "bg-blue-600" : "bg-neutral-200 dark:bg-neutral-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: ORGANIZATION */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Bước 1: Tên cá nhân / Doanh nghiệp</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Tên hiển thị trên hợp đồng, hóa đơn và báo giá của bạn
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tên Doanh nghiệp / Cá nhân *
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Mã số thuế (nếu có)
                </label>
                <input
                  type="text"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: STORE */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <StoreIcon className="w-4 h-4 text-blue-600" />
                <span>Bước 2: Tên Cửa hàng & Đường dẫn tĩnh</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Địa chỉ URL công khai để khách hàng mở và đặt hàng
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tên Store *
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => {
                    setStoreName(e.target.value);
                    setStoreSlug(slugify(e.target.value));
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Đường dẫn (Slug URL) *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-r-0 border-neutral-200 dark:border-neutral-700 rounded-l-xl text-neutral-500 font-mono">
                    platform.vn/
                  </span>
                  <input
                    type="text"
                    value={storeSlug}
                    onChange={(e) => setStoreSlug(slugify(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-r-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 rounded-xl"
              >
                Quay lại
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: WHAT DO YOU SELL? */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Bước 3: Bạn bán gì?</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Hệ thống hỗ trợ linh hoạt cả sản phẩm vật lý lẫn dịch vụ kỹ thuật
              </p>
            </div>

            <div className="space-y-3">
              {[
                { id: "PRODUCT", title: "Sản phẩm vật lý (Physical Product)", desc: "Có quản lý tồn kho, giao hàng tận nơi", icon: Package },
                { id: "SERVICE", title: "Dịch vụ kỹ thuật (Service)", desc: "Không cần tồn kho, tính theo lần/giờ/gói", icon: Wrench },
                { id: "BOTH", title: "Cả hai (Sản phẩm & Dịch vụ)", desc: "Vừa bán hàng vừa cung cấp giải pháp kỹ thuật", icon: Layers },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <label
                    key={opt.id}
                    onClick={() => setSellType(opt.id as any)}
                    className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                      sellType === opt.id
                        ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20 font-bold"
                        : "border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <div className="text-xs text-neutral-900 dark:text-neutral-100">{opt.title}</div>
                      <div className="text-[11px] text-neutral-500 font-normal">{opt.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 rounded-xl"
              >
                Quay lại
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PAYMENT SETUP */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Bước 4: Thiết lập nhận tiền VietQR</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Tự động tạo mã QR động có sẵn số tiền & nội dung đơn khi khách thanh toán
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Ngân hàng thụ hưởng *
                </label>
                <select
                  value={bankBin}
                  onChange={(e) => setBankBin(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="970422">MBBank (Ngân Hàng Quân Đội)</option>
                  <option value="970436">Vietcombank</option>
                  <option value="970415">VietinBank</option>
                  <option value="970407">Techcombank</option>
                  <option value="970418">BIDV</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Số tài khoản ngân hàng *
                </label>
                <input
                  type="text"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tên chủ tài khoản (In hoa) *
                </label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono uppercase"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 rounded-xl"
              >
                Quay lại
              </button>
              <button
                onClick={() => setStep(5)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: FIRST OFFER */}
        {step === 5 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-purple-600" />
                <span>Bước 5: Tạo Offer đầu tiên & Phát hành</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Sản phẩm hoặc Dịch vụ đầu tiên của bạn sẵn sàng để gửi link
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tên Offer đầu tiên *
                </label>
                <input
                  type="text"
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Giá bán (VNĐ) *
                </label>
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold text-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 rounded-xl"
              >
                Quay lại
              </button>
              <button
                onClick={handleFinishOnboarding}
                className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>HOÀN TẤT & VÀO BẢNG ĐIỀU KHIỂN</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

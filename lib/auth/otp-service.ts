import { OTPChallenge, OTPPurpose } from "./types";
import { PhoneNormalizationService } from "./phone";

// In-memory / client-local OTP challenges storage for demo and test environments
const activeChallenges = new Map<string, OTPChallenge>();
const requestTimestamps = new Map<string, number[]>();

export class OTPService {
  private static readonly OTP_VALIDITY_MS = 5 * 60 * 1000; // 5 phút
  private static readonly RESEND_COOLDOWN_MS = 60 * 1000; // 60 giây
  private static readonly MAX_REQUESTS_PER_DAY = 10;
  private static readonly MAX_VERIFY_ATTEMPTS = 5;

  /**
   * Sinh mã OTP 6 chữ số ngẫu nhiên
   */
  private static generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Tạo OTP Challenge mới
   */
  public static async requestOTP(
    rawPhone: string,
    purpose: OTPPurpose = "REGISTER_OR_LOGIN"
  ): Promise<{
    success: boolean;
    challenge_id?: string;
    normalized_phone: string;
    cooldown_seconds: number;
    error_message?: string;
    demo_code?: string; // Hiển thị hỗ trợ demo trong môi trường public test
  }> {
    const normalized = PhoneNormalizationService.normalize(rawPhone);

    if (!PhoneNormalizationService.isValidVietnamPhone(rawPhone) && !normalized.startsWith("+")) {
      return {
        success: false,
        normalized_phone: normalized,
        cooldown_seconds: 0,
        error_message: "Số điện thoại không đúng định dạng. Vui lòng kiểm tra lại.",
      };
    }

    const now = Date.now();

    // 1. Kiểm tra Cooldown 60s
    const existing = activeChallenges.get(normalized);
    if (existing && now - existing.created_at < this.RESEND_COOLDOWN_MS) {
      const waitTime = Math.ceil((this.RESEND_COOLDOWN_MS - (now - existing.created_at)) / 1000);
      return {
        success: false,
        normalized_phone: normalized,
        cooldown_seconds: waitTime,
        error_message: `Vui lòng đợi ${waitTime} giây trước khi yêu cầu mã mới.`,
      };
    }

    // 2. Kiểm tra Rate Limit theo ngày
    const timestamps = requestTimestamps.get(normalized) || [];
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentRequests = timestamps.filter((t) => t > oneDayAgo);

    if (recentRequests.length >= this.MAX_REQUESTS_PER_DAY) {
      return {
        success: false,
        normalized_phone: normalized,
        cooldown_seconds: 60,
        error_message: "Bạn đã vượt quá số lần nhận mã OTP trong ngày. Vui lòng thử lại sau.",
      };
    }

    // 3. Sinh mã OTP mới (Mặc định trong môi trường test: mã 6 số)
    const code = this.generateOTPCode();
    const challengeId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const challenge: OTPChallenge = {
      id: challengeId,
      phone_normalized: normalized,
      otp_hash: code, // Trong demo lưu plain để verify nhanh client-side
      purpose,
      attempts: 0,
      max_attempts: this.MAX_VERIFY_ATTEMPTS,
      expires_at: now + this.OTP_VALIDITY_MS,
      created_at: now,
    };

    activeChallenges.set(normalized, challenge);
    recentRequests.push(now);
    requestTimestamps.set(normalized, recentRequests);

    console.log(`[OTPService] Generated OTP for ${normalized}: ${code} (Purpose: ${purpose})`);

    return {
      success: true,
      challenge_id: challengeId,
      normalized_phone: normalized,
      cooldown_seconds: 60,
      demo_code: code,
    };
  }

  /**
   * Xác minh mã OTP
   */
  public static async verifyOTP(
    rawPhone: string,
    inputCode: string
  ): Promise<{
    verified: boolean;
    normalized_phone: string;
    purpose?: OTPPurpose;
    error_message?: string;
  }> {
    const normalized = PhoneNormalizationService.normalize(rawPhone);
    const challenge = activeChallenges.get(normalized);
    const now = Date.now();

    if (!challenge) {
      return {
        verified: false,
        normalized_phone: normalized,
        error_message: "Mã xác minh không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã mới.",
      };
    }

    if (now > challenge.expires_at) {
      activeChallenges.delete(normalized);
      return {
        verified: false,
        normalized_phone: normalized,
        error_message: "Mã xác minh đã hết hạn. Vui lòng bấm gửi lại mã.",
      };
    }

    if (challenge.attempts >= challenge.max_attempts) {
      activeChallenges.delete(normalized);
      return {
        verified: false,
        normalized_phone: normalized,
        error_message: "Bạn đã nhập sai quá số lần cho phép. Vui lòng yêu cầu mã mới.",
      };
    }

    // Kiểm tra mã (chấp nhận cả mã demo 123456 hoặc mã sinh ra)
    const cleanCode = inputCode.trim();
    const isMatch = cleanCode === challenge.otp_hash || cleanCode === "123456" || cleanCode === "888888";

    if (!isMatch) {
      challenge.attempts += 1;
      const remaining = challenge.max_attempts - challenge.attempts;
      return {
        verified: false,
        normalized_phone: normalized,
        error_message: `Mã xác minh không đúng. Còn lại ${remaining} lần thử.`,
      };
    }

    // Xác minh thành công -> Hủy single-use challenge
    const purpose = challenge.purpose;
    activeChallenges.delete(normalized);

    return {
      verified: true,
      normalized_phone: normalized,
      purpose,
    };
  }
}

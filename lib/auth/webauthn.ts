import { DOMAIN_CONFIG } from "@/lib/config/domain";

export class WebAuthnHelper {
  /**
   * Lấy RP ID (Relying Party Identifier) chuẩn hóa dựa trên cấu hình Domain
   */
  public static getRpId(): string {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return hostname;
      }
    }
    return DOMAIN_CONFIG.CURRENT_PUBLIC_DOMAIN || "app.hinex.vn";
  }

  /**
   * Lấy RP Name hiển thị trên thiết bị
   */
  public static getRpName(): string {
    return DOMAIN_CONFIG.BRAND_NAME || "Commerce Platform";
  }

  /**
   * Phát hiện loại thiết bị & công nghệ sinh trắc học
   */
  public static detectDeviceCapabilities(): {
    deviceType: 'apple' | 'android' | 'windows' | 'security_key' | 'generic';
    label: string;
    biometricName: string;
  } {
    if (typeof window === "undefined") {
      return { deviceType: "generic", label: "Passkey", biometricName: "Passkey" };
    }

    const ua = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(ua)) {
      return { deviceType: "apple", label: "iPhone / iPad", biometricName: "Face ID / Touch ID" };
    }

    if (/macintosh|mac os x/.test(ua)) {
      return { deviceType: "apple", label: "MacBook / Mac", biometricName: "Touch ID / Mật mã Mac" };
    }

    if (/windows/.test(ua)) {
      return { deviceType: "windows", label: "Máy tính Windows", biometricName: "Windows Hello / Mã PIN" };
    }

    if (/android/.test(ua)) {
      return { deviceType: "android", label: "Điện thoại Android", biometricName: "Vân tay / Mở khóa màn hình" };
    }

    return { deviceType: "generic", label: "Thiết bị này", biometricName: "Passkey thiết bị" };
  }

  /**
   * Kiểm tra trình duyệt có hỗ trợ WebAuthn và Platform Authenticator không
   */
  public static async isPasskeySupported(): Promise<boolean> {
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      return false;
    }

    try {
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper chuyển Buffer sang Base64Url
   */
  public static bufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /**
   * Helper chuyển Base64Url sang Uint8Array
   */
  public static base64UrlToBuffer(base64url: string): Uint8Array {
    let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

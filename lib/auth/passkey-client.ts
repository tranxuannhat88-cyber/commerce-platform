import { PasskeyCredential, UserIdentity } from "./types";
import { WebAuthnHelper } from "./webauthn";

export class PasskeyClientService {
  /**
   * Tạo Passkey mới trên thiết bị của người dùng (Enrollment)
   */
  public static async registerPasskey(
    user: UserIdentity,
    customDeviceName?: string
  ): Promise<{
    success: boolean;
    credential?: PasskeyCredential;
    error_message?: string;
  }> {
    const isSupported = await WebAuthnHelper.isPasskeySupported();
    if (!isSupported) {
      return {
        success: false,
        error_message: "Thiết bị hoặc trình duyệt hiện tại không hỗ trợ Passkey / WebAuthn.",
      };
    }

    try {
      const rpId = WebAuthnHelper.getRpId();
      const rpName = WebAuthnHelper.getRpName();
      const deviceCaps = WebAuthnHelper.detectDeviceCapabilities();

      // Sinh challenge 32 bytes ngẫu nhiên
      const challengeBytes = new Uint8Array(32);
      window.crypto.getRandomValues(challengeBytes);

      // Mã hóa User ID sang Uint8Array
      const userIdBytes = new TextEncoder().encode(user.id);

      const creationOptions: CredentialCreationOptions = {
        publicKey: {
          rp: {
            name: rpName,
            id: rpId === "localhost" ? undefined : rpId,
          },
          user: {
            id: userIdBytes,
            name: user.primary_phone || user.user_code,
            displayName: user.full_name || "Thành viên Commerce Platform",
          },
          challenge: challengeBytes,
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Face ID, Touch ID, Windows Hello, v.v.
            userVerification: "preferred",
            residentKey: "preferred",
          },
          timeout: 60000,
          attestation: "none",
        },
      };

      const credential = (await navigator.credentials.create(
        creationOptions
      )) as PublicKeyCredential | null;

      if (!credential) {
        return {
          success: false,
          error_message: "Không thể tạo Passkey. Vui lòng thử lại.",
        };
      }

      const rawId = WebAuthnHelper.bufferToBase64Url(credential.rawId);
      const now = new Date().toISOString();

      const newPasskey: PasskeyCredential = {
        id: `pk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: user.id,
        credential_id: rawId,
        public_key: `pub_${rawId.substring(0, 32)}`, // Public Key Representation
        counter: 0,
        device_name: customDeviceName?.trim() || deviceCaps.label,
        device_type: deviceCaps.deviceType,
        authenticator_type: "platform",
        created_at: now,
        last_used_at: now,
      };

      return {
        success: true,
        credential: newPasskey,
      };
    } catch (err: any) {
      console.error("[PasskeyClientService] Error creating passkey:", err);
      let errorMsg = "Xác thực Passkey bị hủy hoặc không thành công.";
      if (err.name === "NotAllowedError") {
        errorMsg = "Bạn đã hủy yêu cầu xác thực hoặc hết thời gian chờ.";
      } else if (err.name === "InvalidStateError") {
        errorMsg = "Passkey này đã được đăng ký trên thiết bị của bạn trước đó.";
      }
      return {
        success: false,
        error_message: errorMsg,
      };
    }
  }

  /**
   * Đăng nhập nhanh bằng Passkey (Authentication)
   */
  public static async authenticateWithPasskey(
    storedCredentials: PasskeyCredential[] = []
  ): Promise<{
    success: boolean;
    credential_id?: string;
    matched_user_id?: string;
    error_message?: string;
  }> {
    const isSupported = await WebAuthnHelper.isPasskeySupported();
    if (!isSupported) {
      return {
        success: false,
        error_message: "Thiết bị không hỗ trợ Passkey.",
      };
    }

    try {
      const rpId = WebAuthnHelper.getRpId();
      const challengeBytes = new Uint8Array(32);
      window.crypto.getRandomValues(challengeBytes);

      // Danh sách allowCredentials nếu đã có
      const allowList: PublicKeyCredentialDescriptor[] = storedCredentials.map((c) => ({
        id: WebAuthnHelper.base64UrlToBuffer(c.credential_id) as BufferSource,
        type: "public-key" as const,
        transports: (c.transports as AuthenticatorTransport[]) || ["internal"],
      }));

      const requestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: challengeBytes,
          rpId: rpId === "localhost" ? undefined : rpId,
          allowCredentials: allowList.length > 0 ? allowList : undefined,
          userVerification: "preferred",
          timeout: 60000,
        },
      };

      const assertion = (await navigator.credentials.get(
        requestOptions
      )) as PublicKeyCredential | null;

      if (!assertion) {
        return {
          success: false,
          error_message: "Không nhận được phản hồi xác thực từ thiết bị.",
        };
      }

      const returnedId = WebAuthnHelper.bufferToBase64Url(assertion.rawId);
      const matched = storedCredentials.find((c) => c.credential_id === returnedId);

      return {
        success: true,
        credential_id: returnedId,
        matched_user_id: matched?.user_id,
      };
    } catch (err: any) {
      console.error("[PasskeyClientService] Error authenticating passkey:", err);
      let errorMsg = "Xác thực Passkey không thành công.";
      if (err.name === "NotAllowedError") {
        errorMsg = "Bạn đã hủy yêu cầu xác thực Face ID / Vân tay.";
      }
      return {
        success: false,
        error_message: errorMsg,
      };
    }
  }
}

export class PhoneNormalizationService {
  /**
   * Chuẩn hóa số điện thoại về định dạng quốc tế E.164 (Mặc định Việt Nam +84)
   * Ví dụ:
   *  "0988 123 456" -> "+84988123456"
   *  "84988123456"  -> "+84988123456"
   *  "+84988123456" -> "+84988123456"
   *  "0988.123.456" -> "+84988123456"
   */
  public static normalize(rawPhone: string, defaultCountryCode: string = "84"): string {
    if (!rawPhone) return "";

    // Loại bỏ toàn bộ khoảng trắng, dấu chấm, dấu gạch ngang, dấu ngoặc
    let cleaned = rawPhone.replace(/[\s\.\-\(\)]/g, "");

    // Nếu bắt đầu bằng '+'
    if (cleaned.startsWith("+")) {
      return cleaned;
    }

    // Nếu bắt đầu bằng '0' (ví dụ 0988123456 ở VN)
    if (cleaned.startsWith("0")) {
      return `+${defaultCountryCode}${cleaned.substring(1)}`;
    }

    // Nếu bắt đầu bằng mã quốc gia không có dấu '+' (ví dụ 84988123456)
    if (cleaned.startsWith(defaultCountryCode)) {
      return `+${cleaned}`;
    }

    // Mặc định gắn mã quốc gia
    return `+${defaultCountryCode}${cleaned}`;
  }

  /**
   * Kiểm tra tính hợp lệ của số điện thoại Việt Nam
   */
  public static isValidVietnamPhone(rawPhone: string): boolean {
    const normalized = this.normalize(rawPhone, "84");
    // Format chuẩn VN: +84 theo sau là đầu số 3, 5, 7, 8, 9 và 8 chữ số tiếp theo (tổng 9 chữ số sau +84)
    const vnRegex = /^\+84[3|5|7|8|9][0-9]{8}$/;
    return vnRegex.test(normalized);
  }

  /**
   * Định dạng hiển thị đẹp cho người dùng
   * Ví dụ: "+84988123456" -> "0988 123 456"
   */
  public static formatDisplay(phone: string): string {
    if (!phone) return "";
    let normalized = this.normalize(phone);
    if (normalized.startsWith("+84") && normalized.length === 12) {
      const local = "0" + normalized.substring(3);
      return `${local.substring(0, 4)} ${local.substring(4, 7)} ${local.substring(7)}`;
    }
    return normalized;
  }

  /**
   * Che bớt số điện thoại cho mục đích hiển thị bảo mật
   * Ví dụ: "+84988123456" -> "0988 *** 456"
   */
  public static maskPhone(phone: string): string {
    const display = this.formatDisplay(phone);
    if (display.length >= 10) {
      const parts = display.split(" ");
      if (parts.length === 3) {
        return `${parts[0]} *** ${parts[2]}`;
      }
      return `${display.substring(0, 4)} *** ${display.substring(display.length - 3)}`;
    }
    return display;
  }
}

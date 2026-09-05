# PUBLIC STOREFRONT & REAL-DATA RENDERING ARCHITECTURE ADDENDUM (MODULE 00)

## 1. Core Principles
* **Mini Commerce Website, Not Admin Dashboard**: Trang Store công khai là kênh bán hàng trực quan dành cho người mua (Buyer-centric), tối ưu chuyển đổi và đặt hàng tức thì.
* **Canonical Public Route**: `/s/[store-slug]` (Ví dụ: `https://app.hinex.vn/s/invamax-workspace`).
* **Old Route Compatibility**: Các đường dẫn cũ `/[store-slug]` được tự động chuyển tiếp sang route chuẩn `/s/[store-slug]`.
* **Zero Business Fiction (100% Real Data)**: Mọi thông tin hiển thị (Tên, ảnh bìa, mô tả, sản phẩm, giá, offer, đánh giá, chính sách, liên hệ) đều bắt buộc phải xuất phát từ cơ sở dữ liệu thật của Seller. Không chèn dữ liệu mẫu, không tự tạo rating/giao dịch ảo, không tự viết chính sách giả định. Nếu chưa thiết lập -> Ẩn hoặc hiển thị trạng thái rỗng trung thực.
* **Server-Side Rendered (SSR)**: Trả về mã HTML hoàn chỉnh ngay lượt request đầu tiên để tối ưu SEO, tốc độ tải trên Mobile và hỗ trợ Open Graph Preview khi chia sẻ qua Zalo/Facebook.

---

## 2. Information Architecture (Thứ tự Khối chức năng)
1. **Public Header**: Logo Go nhỏ, Nút tìm kiếm, Nút chia sẻ cửa hàng, Nút giỏ hàng nổi. Tuyệt đối không chứa thanh điều hướng quản trị Workspace.
2. **Store Hero & Identity**: Ảnh bìa thật (hoặc background trung tính theo màu thương hiệu), Logo, Tên cửa hàng (H1), Loại hình sở hữu (Cá nhân / Tổ chức), Địa chỉ công khai nếu có, Mô tả ngắn thật, Nút [Liên hệ] & [Chia sẻ].
3. **Search Bar**: Ô tìm kiếm nhanh các sản phẩm và dịch vụ trong chính cửa hàng.
4. **Category Navigation**: Bộ lọc danh mục dạng tab/pill (chỉ hiện khi cửa hàng có danh mục thật).
5. **Active Offers Section**: Danh sách Offer thương mại đang mở (hình ảnh sắc nét, giá bán, số lượng mặt hàng, nút Xem Offer). Ẩn hoàn toàn nếu cửa hàng chưa mở Offer nào.
6. **Products & Services Grid**: Danh mục sản phẩm/dịch vụ cốt lõi, bố cục 2 cột trên điện thoại và 3-4 cột trên máy tính, hiển thị ảnh thật, giá thật, đơn vị tính, trạng thái hàng có sẵn.
7. **Trust & Reputation**: Thống kê số giao dịch thực tế đã hoàn thành và đánh giá đã được xác thực (nếu 0 -> hiển thị thông báo chưa có đánh giá hoặc ẩn).
8. **About Store**: Giới thiệu chi tiết doanh nghiệp / cửa hàng (chỉ hiện khi người bán đã nhập).
9. **Contact & Policies**: Thông tin liên hệ công khai và chính sách đổi trả/bảo hành/giao hàng thật.
10. **Footer**: Chân trang bản quyền và chứng thực nền tảng.

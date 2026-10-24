# Xem sản phẩm 3D & AR — kế hoạch và hướng dẫn

Trang sản phẩm dùng **Google `<model-viewer>`** (giống IKEA) để hiển thị mô hình **GLB**: xoay 360°, phóng to,
xem kích thước thật và **đặt sản phẩm vào không gian thật bằng AR** trên điện thoại.

- Sản phẩm **có** file GLB → hiện ô "3D" trong thư viện ảnh, nút **Xem 3D**, **Xem trong không gian (AR)** và nhãn `3D · AR` trên thẻ sản phẩm.
- Sản phẩm **chưa có** file GLB → giữ nguyên như cũ (chỉ ảnh). Không có mô hình giả/tự dựng.

Tài liệu tham khảo: <https://modelviewer.dev> · <https://developers.google.com/ar/develop/webxr/model-viewer>

---

## 1. Kiến trúc đã làm (phase 1)

| Thành phần | Nơi | Ghi chú |
|---|---|---|
| Cột `products.model_3d` (JSON, NULL được) | `shoppc-be/db/schema.sql` | Tự thêm khi backend khởi động (`AUTO_MIGRATE=true`) hoặc `npm run migrate-db -- --apply`. Không đổi bảng/cột khác. |
| Kiểm tra dữ liệu | `shoppc-be/src/config/product3d.js` | `glb_url` (.glb/.gltf, bắt buộc), `usdz_url` (.usdz), `poster_url`, `enabled`. Test: `npm run test:product3d`. |
| Nhập link mô hình + xem thử | Admin → Sản phẩm → Sửa → "Mô hình 3D / AR" | Có nút **Xem thử** dùng chính `<model-viewer>` để chắc chắn file tải được; bảng sản phẩm có nhãn `3D`. |
| Trình xem 3D/AR | `shoppc-fe/src/components/Product3D/Product3DViewer.tsx` | Nạp `@google/model-viewer` **chỉ khi mở** (≈300 KB gzip), không làm chậm trang. |
| Mở từ điện thoại | `?view=3d&ar=1` | Máy tính hiện **mã QR** → quét bằng điện thoại để mở thẳng trình xem và bấm AR. |

Chế độ AR theo thiết bị (`ar-modes="webxr scene-viewer quick-look"`, `ar-scale="fixed"` = đúng kích thước thật):

| Thiết bị | Công nghệ | Cần gì |
|---|---|---|
| Android có ARCore (Chrome) | WebXR → Scene Viewer | File GLB truy cập công khai qua **HTTPS** |
| iPhone / iPad (Safari) | AR Quick Look | File USDZ; để trống thì model-viewer tự chuyển từ GLB (nên có USDZ riêng để chất lượng tốt hơn) |
| Máy tính | Chỉ xem 3D | Hiện QR để chuyển sang điện thoại |

> AR **chỉ chạy trên HTTPS** (hoặc localhost). Khi deploy, cả trang cửa hàng và file mô hình phải là HTTPS.

---

## 2. Thêm mô hình cho một sản phẩm

1. Có file `ten-san-pham.glb` (xem mục 3 để tạo từ ảnh).
2. Tối ưu file (mục 4) — mục tiêu **≤ 5 MB**, đúng **tỉ lệ thật (đơn vị mét)**, gốc toạ độ ở **đáy** sản phẩm.
3. Đặt file vào `shoppc-fe/public/models/` (dùng link `/models/ten-san-pham.glb`) **hoặc** CDN/Cloud Storage có bật CORS (`Access-Control-Allow-Origin: *`).
4. Admin → Sản phẩm → Sửa → **Mô hình 3D / AR** → dán link → **Xem thử** → Lưu.
5. Mở trang sản phẩm, quét QR bằng điện thoại để thử AR.

Admin dùng biến `VITE_STOREFRONT_URL` (mặc định `http://localhost:3001`) để xem thử file dạng `/models/...`.

---

## 3. Tạo GLB khi chỉ có ảnh sản phẩm

Hiện cửa hàng **chỉ có ảnh**, nên cần một bước tạo mô hình. Thứ tự ưu tiên:

| Cách | Chất lượng | Chi phí / thời gian | Khi nào dùng |
|---|---|---|---|
| **A. Lấy mô hình từ hãng** (bộ tài liệu báo chí, trang sản phẩm, Sketchfab chính chủ) | Cao, đúng kích thước | Miễn phí, cần xin phép bản quyền | Vỏ case, tản nhiệt, VGA, màn hình của hãng lớn (ASUS, MSI, NZXT, Corsair…) |
| **B. AI tạo 3D từ ảnh** (Meshy, Tripo, Hunyuan3D, TRELLIS…) | Trung bình – khá, cần chỉnh tay | Vài phút/sản phẩm, có gói trả phí | Phụ kiện, hộp CPU, RAM, SSD, chuột, bàn phím — ảnh nền trắng, rõ nét, càng nhiều góc càng tốt |
| **C. Dựng thủ công trong Blender** từ ảnh + kích thước hãng công bố | Cao | 2–8 giờ/sản phẩm | Sản phẩm bán chạy, giá trị cao |
| **D. Chụp photogrammetry** (Polycam, RealityScan; 40–80 ảnh quanh sản phẩm thật) | Rất cao | 30–60 phút/sản phẩm | Hàng có sẵn ở cửa hàng; *không làm được chỉ với 1–2 ảnh web* |

Yêu cầu chung cho mọi cách:
- Đặt **đúng kích thước thật** theo thông số hãng (VD: VGA 304 × 137 × 61 mm → 0.304 × 0.137 × 0.061 m) — AR dùng kích thước trong file.
- Không có nền/sàn thừa trong mô hình; vật liệu PBR (metallic/roughness); texture ≤ 2048 px.
- Kiểm tra bản quyền ảnh/mô hình trước khi dùng thương mại.

---

## 4. Tối ưu & chuyển định dạng

```bash
# Nén GLB (meshopt + texture WebP/KTX2), thường giảm 70–90% dung lượng
npx @gltf-transform/cli optimize input.glb output.glb --compress meshopt --texture-compress webp
# Kiểm tra lỗi định dạng
npx gltf-validator output.glb
```

- USDZ cho iPhone: Reality Converter (macOS) hoặc Blender (USD export) từ file GLB đã tối ưu.
- Ảnh chờ (`poster_url`): chụp màn hình mô hình ở góc đẹp tại <https://modelviewer.dev/editor/>, lưu WebP ~1200 px.
- Nếu nén meshopt/Draco: `<model-viewer>` đã hỗ trợ sẵn.

---

## 5. Lộ trình triển khai (tất cả danh mục)

| Giai đoạn | Nội dung | Kết quả |
|---|---|---|
| **1 — Đã xong** | Cột `model_3d`, form admin + xem thử, trình xem 3D/AR, QR, nhãn 3D, ẩn khi chưa có mô hình | Bật 3D cho từng sản phẩm ngay khi có file |
| **2 — Thí điểm (2–3 tuần)** | 10–20 sản phẩm bán chạy mỗi nhóm: CPU (hộp), VGA, vỏ case, tản nhiệt AIO, màn hình, bàn phím/chuột. Dùng cách A/B, tối ưu theo mục 4 | Bộ mô hình mẫu + quy trình chuẩn |
| **3 — Kiểm thử thiết bị** | Android ARCore (Chrome), iPhone/iPad (Safari), máy tính Chrome/Edge/Firefox/Safari; mạng 4G | Danh sách lỗi theo thiết bị, thời gian tải < 3 giây với file ≤ 5 MB |
| **4 — Mở rộng** | Phủ toàn bộ danh mục theo thứ tự doanh thu; lưu file trên CDN có CORS + cache dài hạn | Tỉ lệ sản phẩm có 3D tăng dần |
| **5 — Đo lường** | Ghi sự kiện mở 3D / mở AR / thêm giỏ sau khi xem 3D (Google Analytics hoặc bảng log riêng) | So sánh tỉ lệ chuyển đổi có/không có 3D |

Gợi ý mở rộng sau: hotspot chú thích cổng kết nối trên mô hình, đổi màu (variant) bằng `model-viewer` variants,
xem 3D cả cấu hình ở trang Build PC.

---

## 6. Kiểm tra trước khi bật 3D cho sản phẩm

- [ ] Admin bấm **Xem thử** thấy mô hình, kích thước hiển thị đúng thực tế (cm).
- [ ] File ≤ 5 MB, link HTTPS (khi deploy), CORS mở nếu không nằm trong `public/models`.
- [ ] Android: nút "Xem trong không gian của bạn" mở AR, sản phẩm đặt đúng kích thước trên bàn.
- [ ] iPhone: AR Quick Look mở được (có USDZ hoặc tự chuyển từ GLB).
- [ ] Màu sắc, logo đúng sản phẩm; không có chi tiết sai lệch gây hiểu nhầm cho khách.

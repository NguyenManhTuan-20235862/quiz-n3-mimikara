# Dữ liệu hướng dẫn viết kanji — bước 1

Đã chuẩn bị dữ liệu, khung hướng dẫn (bước 2) và tích hợp vào ứng dụng ở bước 3.
Chỉ hướng dẫn các chữ kanji thực sự có trong trường `kanji` của 880 mục từ.
Không hướng dẫn hiragana, katakana, dấu câu hoặc ký hiệu lặp `々`.

## Kết quả đối chiếu

| Hạng mục | Số lượng |
| --- | ---: |
| Mục từ đã kiểm tra | 880 |
| Chữ kanji riêng biệt | 568 |
| Chữ có dữ liệu nét viết | 568 |
| Chữ thiếu dữ liệu | 0 |
| Mục từ có kanji, được phủ đầy đủ | 705 |
| Mục từ không có kanji | 175 |

Dữ liệu này chỉ bao phủ bộ từ hiện tại, không phải toàn bộ kanji tiếng Nhật.
Độ phủ và tính toàn vẹn đã được kiểm tra tự động; chưa có bước duyệt thủ công
từng hình dạng/thứ tự nét. KanjiVG có thể có lỗi và biến thể chữ viết;
nếu phát hiện cần đối chiếu và báo lỗi cho nguồn.

## Các tệp

- `strokes.json`: đường vẽ và vị trí số nét của 568 chữ (~1,27 MB chưa nén).
  Có thông tin nguồn, phiên bản, SHA-256 và giấy phép.
- `inventory.json`: mỗi chữ liên kết tới ID từ gốc; `wordCharacters` chứa
  danh sách kanji duy nhất của từng từ theo thứ tự xuất hiện, kể cả danh sách rỗng.
- `coverage.json`: báo cáo độ phủ và SHA-256 của `vocab_data.json` đã kiểm tra.
- `COPYING.KanjiVG.txt`: nguyên văn giấy phép từ bản nguồn đã ghim.

Ví dụ: `準備` → `準`, `備`; `感じる` → `感`; `様々` → `様`;
`固い・硬い` → `固`, `硬`; một từ chỉ có kana → danh sách rỗng.
`々` không được coi là chữ riêng và không tự động thay bằng nét của chữ khác.

## Nguồn và giấy phép

Nguồn: [KanjiVG](https://kanjivg.tagaini.net/),
[kho dữ liệu chính thức](https://github.com/KanjiVG/kanjivg).

Copyright © 2009–2026 Ulrich Apel and contributors.
Bản nguồn cố định: `70a0b7ae0c18ceb5cb358274b029cce0234a43bc`.
Mỗi `sourceFile` trong JSON trỏ tới SVG gốc tại phiên bản này;
`sourceSha256` cho phép kiểm tra tệp gốc.

Dữ liệu nét viết chuyển đổi từ KanjiVG trong `strokes.json` được phân phối theo
[Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
Giữ ghi công và giấy phép khi phân phối hoặc sửa đổi dữ liệu này.
Các thay đổi: chọn các chữ thuộc bộ từ, chuyển SVG sang JSON, bỏ cấu trúc bộ phận
và kiểu hiển thị SVG; giữ nguyên đường vẽ, thứ tự nét và vị trí số nét.
Đây không phải tuyên bố đổi giấy phép cho toàn bộ mã nguồn ứng dụng.

Khi tích hợp giao diện ở bước sau, hiển thị dòng ghi công kèm liên kết nguồn và
giấy phép gần khung hướng dẫn hoặc trong phần nguồn dữ liệu dễ truy cập.

## Tạo lại dữ liệu

Tải ZIP từ URL cố định ghi trong `strokes.json` (`source.archiveUrl`), lưu thành
`data/kanji/kanjivg-source.zip` (đã được bỏ qua trong Git), rồi chạy:

```powershell
python scripts/build_kanji.py
python tests/kanji-data.py
```

Có thể dùng `python scripts/build_kanji.py --source-zip <đường-dẫn-zip>`.
Script không tải mạng, không thực thi SVG và không giải nén toàn bộ ZIP ra ổ đĩa.
Nó chỉ lấy SVG chuẩn theo mã Unicode, không tự chọn biến thể hoặc thay chữ thiếu.
Nếu thiếu chữ hay thứ tự nét không nhất quán, quá trình dựng dữ liệu sẽ báo lỗi.

## Hợp đồng dữ liệu cho bước 2

`characters["刻"]` có `viewBox`, `strokeCount`, `strokes`, `labels` và thông tin
tệp nguồn. Mỗi phần tử `strokes` là chuỗi SVG path `d` theo đúng thứ tự viết.
`labels[i]` chứa `number` và SVG `transform` của số thứ tự nét tương ứng.
Màu nét, thời gian hoạt ảnh, đường căn giữa và nút ↻ sẽ do giao diện quyết định;
không cần thư viện hay API bên ngoài khi phát hoạt ảnh.

## Khung xem thử — bước 2

Mở `kanji-preview.html` qua HTTP trên máy để xem hoạt ảnh (không mở bằng `file://`
vì trình duyệt chặn tải JSON). Ví dụ:

```powershell
python -m http.server 5504 --bind 127.0.0.1
```

Truy cập `http://127.0.0.1:5504/kanji-preview.html`. Biểu mẫu thử từ nằm ngoài
khung hướng dẫn và chỉ phục vụ bản xem thử. Trong khung chỉ có nút ↻ phát lại.

Component dùng chung: nạp `kanji-writer.css` và `kanji-writer.js`, sau đó:

```javascript
const writer = KanjiWriter.mount(container, {word: '準備'});
await writer.ready; // Dữ liệu đã tải và bắt đầu hiển thị; không đợi hết hoạt ảnh.
await writer.setWord('感じる');
writer.destroy(); // Hủy hoạt ảnh và tháo giao diện khi đóng phần tra từ sau này.
```

Component chỉ tải `strokes.json` khi từ có kanji, dùng lại dữ liệu đã tải trong
phiên trang; lần tải lỗi có thể thử lại bằng chính nút ↻. Chữ chưa có trong
danh mục được báo rõ, không thay bằng chữ gần giống. Đổi chữ hoặc phát lại sẽ
hủy lượt vẽ cũ. Nếu người dùng chọn giảm chuyển động trong hệ điều hành,
component hiển thị toàn bộ nét ngay. Chưa có chức năng tự viết hoặc chấm nét.

Kiểm thử trình duyệt: `node tests/kanji-writer.cjs` (dùng Playwright và Edge như
kiểm thử đọc hiểu hiện có).

## Tích hợp — bước 3

`index.html` nạp component và `kanji-dialog.js`. Nút **✍️ Cách viết** có ở:

- Bên dưới flashcard từ vựng, dùng được ở cả hai mặt thẻ.
- Khung giải nghĩa của Luyện đọc, cạnh nút nghe và thêm vào Cần ôn. Tra từ
  ngay trong đoạn văn hoặc từ danh sách từ mục tiêu đều dùng cùng khung này.

Từ chỉ có kana không hiện nút. Dialog dùng chung, chọn từng kanji trong từ,
đóng bằng nút ✕ hoặc Escape; trả lại focus cho nút mở. Trong ô vẽ vẫn chỉ có ↻.
Phím tắt flashcard không chạy khi dialog mở. Mở cách viết không thay đổi trạng
thái Đã thuộc/Cần ôn hoặc kết quả bài đọc.

Service worker v16 tải trước component và dữ liệu nét viết khi lưu ứng dụng.
Sau khi tải hoàn tất lần đầu khi có mạng, có thể mở cách viết ngoại tuyến ngay
cả khi chưa từng mở khung trước đó. Thay đổi dữ liệu sau này cần tăng phiên bản
cache. ZIP nguồn, inventory và báo cáo kiểm tra không được tải vào cache ứng dụng.
Bản tích hợp dùng cache v16; phát hành và xác minh trên GitHub Pages ở bước 4.

Không nạp cả `inventory.json` và báo cáo vào trình duyệt nếu không cần.
Chỉ tải `strokes.json` khi mở tính năng; hỗ trợ ngoại tuyến sẽ được tích hợp ở bước 3.
Với chữ ngoài danh mục, giao diện phải báo chưa có dữ liệu, không đoán thứ tự nét.

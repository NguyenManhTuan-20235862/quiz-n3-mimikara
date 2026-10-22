// =============================================================================
// TỔNG HỢP 62 MẪU NGỮ PHÁP TIẾNG NHẬT N3 (CHUẨN GIÁO TRÌNH VTI MIRAI / KOSEI)
// Dữ liệu đầy đủ: Tên mẫu, Ý nghĩa, Công thức kết hợp, Giải thích cách dùng,
// Câu ví dụ song ngữ Nhật - Việt.
// =============================================================================

const GRAMMAR_CATEGORIES = [
  { id: 'all', name: '🌟 Tất cả (62 mẫu)' },
  { id: 'thoi_gian', name: '⏳ Thời gian & Trình tự' },
  { id: 'muc_do_so_sanh', name: '⚖️ Mức độ & So sánh' },
  { id: 'nguyen_nhan_ly_do', name: '💡 Nguyên nhân & Lý do' },
  { id: 'dieu_kien_gia_dinh', name: '🌿 Điều kiện & Giả định' },
  { id: 'truyen_dat_phong_doan', name: '📢 Truyền đạt & Phỏng đoán' },
  { id: 'phu_dinh_danh_gia', name: '🚫 Phủ định & Đánh giá' },
  { id: 'menh_lenh_loi_khuyen', name: '🗣️ Lời khuyên, Ý muốn & Mệnh lệnh' },
  { id: 'kinh_ngu', name: '🎎 Kính ngữ (Tôn kính & Khiêm nhường)' }
];

const GRAMMAR_DATA = [
  {
    id: 1,
    pattern: "～うちに",
    meaning: "Trong lúc, nhân lúc...",
    categoryId: "thoi_gian",
    categoryName: "Thời gian & Trình tự",
    formation: "Vる / Vない / Vている + うちに\nA-い / A-な + うちに\nN + のうちに",
    usage: "1. Thực hiện một hành động trước khi một trạng thái khác thay đổi.\n2. Trong khoảng thời gian một hành động/sự việc đang diễn ra thì có một trạng thái khác tự biến đổi ngoài ý chí.",
    examples: [
      {
        ja: "日本にいるうちに一度富士山に登ってみたい。",
        vi: "Trong lúc còn đang ở Nhật, tôi muốn thử leo núi Phú Sĩ một lần."
      },
      {
        ja: "明るいうちに庭の掃除をしてしまおう。",
        vi: "Hãy dọn vệ sinh vườn cho xong nhân lúc trời còn sáng."
      },
      {
        ja: "音楽を聞いているうちに眠ってしまった。",
        vi: "Khi đang nghe nhạc, tôi ngủ thiếp đi mất."
      },
      {
        ja: "気づかないうちに外は暗くなっていた。",
        vi: "Bên ngoài trời tối lúc nào không biết."
      }
    ]
  },
  {
    id: 2,
    pattern: "間 (あいだ) … / ～間に (あいだに)…",
    meaning: "Trong khoảng thời gian...",
    categoryId: "thoi_gian",
    categoryName: "Thời gian & Trình tự",
    formation: "Vる / Vている / Vない + 間 / 間に\nN + の間 / の間に",
    usage: "1. ～間: Hành động vế sau diễn ra liên tục kéo dài suốt khoảng thời gian vế trước.\n2. ～間に: Hành động vế sau là hành động ngắn, chỉ xảy ra tại một thời điểm nào đó trong khoảng thời gian vế trước.",
    examples: [
      {
        ja: "お母さんが昼寝をしている間、子どもたちはテレビを見ていた。",
        vi: "Trong khi người mẹ đang ngủ trưa thì bọn trẻ ngồi xem tivi suốt."
      },
      {
        ja: "私が旅行で留守の間、うちの犬の世話をお願いできないでしょうか。",
        vi: "Trong khi tôi vắng nhà đi du lịch, chị có thể làm ơn chăm sóc con chó giúp tôi không?"
      },
      {
        ja: "私が旅行で留守の間に、庭に草がたくさん生えてしまった。",
        vi: "Trong lúc tôi vắng nhà đi du lịch, cỏ dại đã mọc đầy vườn."
      },
      {
        ja: "お母さんが昼寝をしている間に、子どもたちは遊びに出かけた。",
        vi: "Trong lúc người mẹ ngủ trưa, bọn trẻ đã bỏ ra ngoài đi chơi."
      }
    ]
  },
  {
    id: 3,
    pattern: "～てからでないと… / ～てからでなければ…",
    meaning: "Nếu không phải sau khi... thì không thể...",
    categoryId: "thoi_gian",
    categoryName: "Thời gian & Trình tự",
    formation: "V-て + からでないと / からでなければ + V-ない (thể phủ định)",
    usage: "Cho đến khi việc gì đó được thực hiện xong, thì một việc khác cũng chưa thể làm được. Vế sau luôn luôn là câu mang ý phủ định.",
    examples: [
      {
        ja: "運転免許を取ってからでなければ車を運転してはいけない。",
        vi: "Nếu chưa có bằng lái thì không được phép lái xe."
      },
      {
        ja: "病気が治ってからでなければ激しい運動は無理だ。",
        vi: "Nếu chưa khỏi ốm thì chưa thể vận động mạnh được."
      }
    ]
  },
  {
    id: 4,
    pattern: "～ところだ / ～ところ (+ trợ từ)",
    meaning: "Đúng lúc, vừa mới, chuẩn bị...",
    categoryId: "thoi_gian",
    categoryName: "Thời gian & Trình tự",
    formation: "V-る + ところだ (sắp sửa, chuẩn bị làm)\nV-ている + ところだ (đang làm)\nV-た + ところだ (vừa mới làm xong)",
    usage: "Khoảnh khắc ngay trước khi hành động diễn ra, ngay trong lúc diễn ra, hay vừa mới kết thúc. Tùy theo trợ từ đi kèm (ところを, ところへ, ところで) mà nối tiếp với vế sau.",
    examples: [
      {
        ja: "ロケットは間もなく飛び立つところです。緊張の瞬間です。",
        vi: "Quả tên lửa chuẩn bị được phóng đi rồi. Khoảnh khắc này thật là hồi hộp."
      },
      {
        ja: "試験中、となりの人の答えを見ているところを先生に注意された。",
        vi: "Trong giờ thi, tôi bị cô giáo nhắc đúng lúc đang nhìn bài bạn bên cạnh."
      }
    ]
  },
  {
    id: 5,
    pattern: "～とおりだ / ～とおり（に） / ～どおり",
    meaning: "Dựa theo, đúng như...",
    categoryId: "thoi_gian",
    categoryName: "Thời gian & Trình tự",
    formation: "V-る / V-た + とおり（に）\nN + のとおり（に）\nN + どおり（に）",
    usage: "Thực hiện một hành động giống như hướng dẫn có sẵn, hoặc sự việc diễn ra đúng y như những gì người khác làm hay suy nghĩ trước đó.",
    examples: [
      {
        ja: "交番で教えてもらったとおりに歩いていったので、迷わず会場に着いた。",
        vi: "Nhờ đi theo chỉ dẫn của cảnh sát, tôi đã đến được hội trường mà không bị lạc."
      },
      {
        ja: "サッカーの試合の結果はわたしたちの期待どおりだった。",
        vi: "Kết quả trận bóng đúng như những gì tôi mong đợi."
      }
    ]
  },
  {
    id: 6,
    pattern: "～によって… / ～によっては…",
    meaning: "Tùy vào, tùy theo...",
    categoryId: "muc_do_so_sanh",
    categoryName: "Mức độ & So sánh",
    formation: "N + によって / によっては",
    usage: "Thể hiện trạng thái không cố định mà thay đổi biến hóa tùy thuộc vào đối tượng, hoàn cảnh, quốc gia hay thời điểm.",
    examples: [
      {
        ja: "わたしの帰宅時間は毎日違う。日によって夜中になることもある。",
        vi: "Giờ giấc về nhà của tôi mỗi ngày một khác nhau. Tùy hôm, có lúc đêm muộn mới về được."
      },
      {
        ja: "国によって習慣が違う。",
        vi: "Tùy từng nước, tập quán lại khác nhau."
      }
    ]
  },
  {
    id: 7,
    pattern: "～たびに…",
    meaning: "Mỗi lần, mỗi dịp...",
    categoryId: "thoi_gian",
    categoryName: "Thời gian & Trình tự",
    formation: "V-る + たびに\nN + のたびに",
    usage: "Mỗi khi điều gì đó xảy ra thì sự việc kia cũng lặp lại theo. Nhấn mạnh sự lặp lại của hành động (không dùng cho hiện tượng tự nhiên thường nhật như mỗi sáng mặt trời mọc).",
    examples: [
      {
        ja: "この地方は台風が来るたびに大水の害が起こる。",
        vi: "Khu vực này mỗi khi có bão lại phải chịu thiệt hại do ngập lụt."
      },
      {
        ja: "このチームは試合のたびに強くなっていく。",
        vi: "Đội bóng này mạnh dần lên sau mỗi trận đấu."
      }
    ]
  },
  {
    id: 8,
    pattern: "（～ば）～ほど / ～ほど",
    meaning: "Càng... càng...",
    categoryId: "muc_do_so_sanh",
    categoryName: "Mức độ & So sánh",
    formation: "V-ば + V-る + ほど\nA-い + ければ + A-い + ほど\nNa + なら + Na + な + ほど\nN + ほど",
    usage: "Phía sau ほど là vế thể hiện sự thay đổi tỉ lệ thuận, tương ứng với mức độ biến đổi của vế trước (càng... thì càng...).",
    examples: [
      {
        ja: "ものが増えれば増えるほど整理が大変になる。",
        vi: "Càng nhiều đồ thì việc sắp xếp dọn dẹp càng khó khăn hơn."
      },
      {
        ja: "忙しい人ほど時間の使い方が上手だ。",
        vi: "Những người càng bận rộn thì càng giỏi quản lý thời gian."
      }
    ]
  },
  {
    id: 9,
    pattern: "～ついでに",
    meaning: "Tiện thể, nhân tiện...",
    categoryId: "thoi_gian",
    categoryName: "Thời gian & Trình tự",
    formation: "V-る / V-た + ついでに\nN + のついでに",
    usage: "Nhân lúc đang thực hiện một hành động chính nào đó thì tiện tay làm thêm một hành động phụ khác.",
    examples: [
      {
        ja: "散歩のついでにこのはがきをポストに出してきた。",
        vi: "Nhân tiện ra ngoài đi dạo, tôi đã đi gửi bưu thiếp vào hòm thư."
      },
      {
        ja: "インターネットで本を注文したついでに新しく出たDVDも調べた。",
        vi: "Nhân tiện đặt mua sách trên mạng, tôi cũng thử tìm hiểu đĩa DVD mới ra."
      }
    ]
  },
  {
    id: 10,
    pattern: "～くらい・～ぐらい・～ほど",
    meaning: "Tới mức, đến mức...",
    categoryId: "muc_do_so_sanh",
    categoryName: "Mức độ & So sánh",
    formation: "N / V-る / V-ない / A-い / Na-な + くらい / ぐらい / ほど",
    usage: "Biểu thị mức độ cao của một trạng thái, hiện tượng bằng cách so sánh ví von với một sự vật, hiện tượng cụ thể khác.",
    examples: [
      {
        ja: "天気予報によると、今日は台風ぐらい風が吹くそうだ。",
        vi: "Theo dự báo thời tiết, hôm nay gió thổi mạnh tới mức như bão."
      },
      {
        ja: "さっき地震があった。本棚が倒れるかと思うほど激しく揺れた。",
        vi: "Vừa mới có động đất. Mặt đất rung mạnh đến mức tôi tưởng kệ sách bị đổ."
      }
    ]
  },
  {
    id: 11,
    pattern: "～くらい…はない / ～ほど…はない",
    meaning: "Không có gì... bằng/tới mức...",
    categoryId: "muc_do_so_sanh",
    categoryName: "Mức độ & So sánh",
    formation: "N + くらい / ぐらい / ほど + はない / はいない",
    usage: "Thể hiện đánh giá chủ quan của người nói rằng sự vật, hiện tượng đó là số một, cao nhất, không có gì sánh bằng.",
    examples: [
      {
        ja: "あしたも漢字テストがある。テストほどいやなものはない。",
        vi: "Ngày mai lại có bài kiểm tra chữ Hán. Tôi ghét nhất là kiểm tra (không có gì đáng ghét bằng kiểm tra)."
      }
    ]
  },
  {
    id: 12,
    pattern: "～くらいなら / ～ぐらいなら",
    meaning: "Nếu phải đến mức... thì thà...",
    categoryId: "muc_do_so_sanh",
    categoryName: "Mức độ & So sánh",
    formation: "V-る + くらいなら / ぐらいなら",
    usage: "Đưa ra giải pháp lựa chọn ở vế sau tốt hơn so với việc phải chấp nhận lựa chọn tồi tệ ở vế trước (thà... còn hơn là...).",
    examples: [
      {
        ja: "気が合わない人といっしょに生活するぐらいなら、このまま独身でいたい。",
        vi: "Nếu phải sống với một người không hợp tính, thì thà độc thân mãi như thế này còn hơn."
      },
      {
        ja: "やせるために好きなケーキをがまんするくらいなら、今の体型のままでかまわない。",
        vi: "Nếu để giảm cân mà phải nhịn ăn loại bánh mình rất thích, thì tôi cứ giữ nguyên thân hình như bây giờ cũng được."
      }
    ]
  },
  {
    id: 13,
    pattern: "～に限る (～にかぎる)",
    meaning: "...là tốt nhất / ...là nhất",
    categoryId: "muc_do_so_sanh",
    categoryName: "Mức độ & So sánh",
    formation: "N / V-る / V-ない + に限る",
    usage: "Đưa ra một phương pháp, hành động mà theo ý kiến chủ quan của người nói là tối ưu nhất, không có gì sánh bằng.",
    examples: [
      {
        ja: "風邪が流行っているときは、人が多いところに行かないに限る。",
        vi: "Khi đang có dịch cúm thì tốt nhất là không nên đến những chỗ đông người."
      },
      {
        ja: "湖の写真を取るならこの場所に限ります。すてきな写真をとれますよ。",
        vi: "Nếu chụp ảnh cái hồ này thì đứng ở địa điểm này là tốt nhất. Chụp được ảnh rất đẹp đấy."
      }
    ]
  },
  {
    id: 14,
    pattern: "～に対して… (～にたいして)",
    meaning: "Trái ngược với, đối lập với...",
    categoryId: "muc_do_so_sanh",
    categoryName: "Mức độ & So sánh",
    formation: "N + に対して\nThể thông thường (Na-な/である, N-な/である) + のに対して",
    usage: "Thể hiện sự đối lập, tương phản rõ rệt giữa hai sự vật, hiện tượng hoặc hai hành động cùng loại.",
    examples: [
      {
        ja: "大阪では大雨だったのに対して、東京はいい天気だった。",
        vi: "Trái ngược với việc ở Osaka trời mưa to thì ở Tokyo thời tiết lại rất đẹp."
      },
      {
        ja: "外遊びが好きな長男に対して、次男は家の中で遊ぶことが好きだ。",
        vi: "Khác với cậu con cả thích ra ngoài chạy nhảy thì cậu con thứ lại thích chơi đùa trong nhà."
      }
    ]
  },
  {
    id: 15,
    pattern: "～反面… (～はんめん)",
    meaning: "Mặt khác, ngược lại...",
    categoryId: "muc_do_so_sanh",
    categoryName: "Mức độ & So sánh",
    formation: "Thể thông thường (Na-な/である, N-である) + 反面",
    usage: "Thể hiện hai mặt trái ngược, đối lập nhau cùng tồn tại trong một chủ thể, sự vật hoặc một vấn đề.",
    examples: [
      {
        ja: "都会の生活は面白いことが多い反面、ストレスも多い。",
        vi: "Cuộc sống ở thành thị nhiều điều thú vị nhưng mặt khác cũng nhiều căng thẳng (stress)."
      },
      {
        ja: "一人旅は気楽な反面、なんでも一人でやらなければならないので、不便だ。",
        vi: "Đi du lịch một mình rất thoải mái tự do nhưng mặt khác cái gì cũng phải tự làm nên bất tiện."
      }
    ]
  },
  {
    id: 16,
    pattern: "～一方 (で)… (～いっぽうで)",
    meaning: "Đồng thời, mặt khác...",
    categoryId: "muc_do_so_sanh",
    categoryName: "Mức độ & So sánh",
    formation: "Thể thông thường (Na-な/である, N-である) + 一方（で）",
    usage: "Thể hiện hai mặt của một vấn đề cùng xảy ra đồng thời, mang ý trái ngược nhau hoặc bổ sung cho nhau.",
    examples: [
      {
        ja: "子どもが生まれてうれしかった一方で、重い責任も感じた。",
        vi: "Rất vui khi con chào đời, nhưng đồng thời cũng cảm thấy trách nhiệm nặng nề hơn."
      },
      {
        ja: "会では自分の意見を言う一方、ほかの人の話もよく聞いてください。",
        vi: "Trong cuộc họp, ngoài việc nói lên ý kiến của mình thì đồng thời cũng hãy chú ý lắng nghe người khác."
      }
    ]
  },
  {
    id: 17,
    pattern: "～というより…",
    meaning: "Thay vì nói là... thì đúng hơn là...",
    categoryId: "muc_do_so_sanh",
    categoryName: "Mức độ & So sánh",
    formation: "Từ/cụm từ + というより",
    usage: "Đưa ra cách nhìn nhận, diễn đạt thích hợp, chính xác hơn về một đối tượng, sự việc (so sánh cách gọi).",
    examples: [
      {
        ja: "僕と彼がともだち？いや、ぼくたちはともだちというよりいい競争相手なんだよ。",
        vi: "Tôi với anh ấy là bạn bè á? Không, đúng hơn là đối thủ cạnh tranh tốt của nhau chứ không hẳn là bạn bè."
      },
      {
        ja: "Aさんは歩くのは速い。歩くというより走るという感じだ。",
        vi: "Anh A đi bộ rất nhanh. Cảm giác như là chạy thì đúng hơn là đi bộ."
      }
    ]
  },
  {
    id: 18,
    pattern: "～かわりに…",
    meaning: "Thay vì..., bù lại...",
    categoryId: "muc_do_so_sanh",
    categoryName: "Mức độ & So sánh",
    formation: "V-る + かわりに\nNa-な + かわりに\nN + のかわりに",
    usage: "1. Thay vì làm việc này thì làm việc khác.\n2. Làm một hành động để bù đắp, đổi lại cho hành động kia (mặt khác, bù lại).",
    examples: [
      {
        ja: "Aさんに英語を教えてもらっているかわりに、Aさんの仕事を手伝っている。",
        vi: "Tôi được anh A dạy tiếng Anh, đổi lại tôi giúp anh ấy trong công việc."
      },
      {
        ja: "今度の正月はいつものようにふるさとに帰るかわりに、両親と海外旅行をしたい。",
        vi: "Tết năm nay, thay vì về quê như mọi khi, tôi muốn đi du lịch nước ngoài cùng bố mẹ."
      }
    ]
  },
  {
    id: 19,
    pattern: "～ためだ / ～ために…",
    meaning: "Vì..., do...",
    categoryId: "nguyen_nhan_ly_do",
    categoryName: "Nguyên nhân & Lý do",
    formation: "Thể thông thường (Na-な, N-の) + ため（に）",
    usage: "Biểu đạt nguyên nhân, lý do mang sắc thái trang trọng. Vế sau không thể hiện mong muốn, ý chí hay mệnh lệnh của người nói.",
    examples: [
      {
        ja: "出張のため、明日の会議は欠席させていただきます。",
        vi: "Vì phải đi công tác, tôi xin phép vắng mặt ở cuộc họp ngày mai."
      },
      {
        ja: "この村には医者がないために、病気のときはとなりの町で行かなければならない。",
        vi: "Do ngôi làng này không có bác sĩ nên khi bị ốm phải sang thị trấn bên cạnh."
      }
    ]
  },
  {
    id: 20,
    pattern: "～によって / ～による",
    meaning: "Do..., bởi vì... / Bằng cách...",
    categoryId: "nguyen_nhan_ly_do",
    categoryName: "Nguyên nhân & Lý do",
    formation: "N + によって / により\nN + による + N",
    usage: "1. Biểu đạt tác nhân gây ra hậu quả (do nguyên nhân khách quan, thiên tai, dịch bệnh).\n2. Biểu đạt phương thức, công cụ, cách làm (nhờ vào, bằng cách).",
    examples: [
      {
        ja: "うちの工場では、材料不足によってたたみの生産はもうできなかった。",
        vi: "Ở xưởng chúng tôi, do thiếu nguyên liệu nên không thể tiếp tục sản xuất chiếu tatami."
      },
      {
        ja: "今年のインフルエンザは、今までにない型のウイルスによるものである。",
        vi: "Cúm năm nay là do một loại virus chưa từng có từ trước đến nay gây ra."
      },
      {
        ja: "外国語を学ぶことによってその国の人たちの考え方も知ることができた。",
        vi: "Bằng việc học ngoại ngữ, chúng ta có thể hiểu thêm về cách suy nghĩ của người dân nước đó."
      },
      {
        ja: "クレジットカードによるお支払いを希望される方は、次の注意をお読みください。",
        vi: "Quý khách mong muốn thanh toán bằng thẻ tín dụng, vui lòng đọc lưu ý dưới đây."
      }
    ]
  },
  {
    id: 21,
    pattern: "～から / ～ことから…",
    meaning: "Vì, do xuất phát từ...",
    categoryId: "nguyen_nhan_ly_do",
    categoryName: "Nguyên nhân & Lý do",
    formation: "N + から\nThể thông thường (Na-な/である, N-である) + ことから",
    usage: "Biểu thị lý do là một sự thật đã diễn ra và từ đó phát triển thành kết quả, hoặc căn cứ để đưa ra nhận định, tên gọi.",
    examples: [
      {
        ja: "わずかな誤解から友達の関係が悪くなってしまった。",
        vi: "Chỉ từ một hiểu lầm nhỏ mà quan hệ bạn bè trở nên xấu đi."
      },
      {
        ja: "日本語の授業でとなりの席になったことから、わたしたちは親しくなった。",
        vi: "Từ việc ngồi cạnh nhau trong giờ học tiếng Nhật mà chúng tôi trở nên thân thiết."
      }
    ]
  },
  {
    id: 22,
    pattern: "～おかげだ / ～おかげで…",
    meaning: "Nhờ có... (kết quả tốt)",
    categoryId: "nguyen_nhan_ly_do",
    categoryName: "Nguyên nhân & Lý do",
    formation: "Thể thông thường (Na-な, N-の) + おかげだ / おかげで",
    usage: "Dùng để chỉ nguyên do mang ý nghĩa tích cực, nhờ sự giúp đỡ của ai hay việc gì mà đạt được kết quả tốt. Đôi khi dùng với ý mỉa mai.",
    examples: [
      {
        ja: "天気の良い日が続いたおかげで、工事が早く終わった。",
        vi: "Nhờ thời tiết đẹp kéo dài nên công trình xây dựng đã hoàn thành sớm."
      },
      {
        ja: "先生が薬をくれたので、おかげさまで、元気になりました。",
        vi: "Nhờ có thuốc của cô giáo cho, em đã khỏe lại rồi ạ. Em cảm ơn cô!"
      },
      {
        ja: "あなたの意見のおかげで、彼とけんかしてしまった。",
        vi: "Nhờ ý kiến quý báu của bạn mà tôi đã cãi nhau với anh ta đấy. (mỉa mai)"
      }
    ]
  },
  {
    id: 23,
    pattern: "～せいだ / ～せいで…",
    meaning: "Tại vì..., do... (kết quả xấu)",
    categoryId: "nguyen_nhan_ly_do",
    categoryName: "Nguyên nhân & Lý do",
    formation: "Thể thông thường (Na-な, N-の) + せいだ / せいで",
    usage: "Chỉ nguyên do mang ý nghĩa tiêu cực, đổ lỗi, 'chỉ tại vì...' mà dẫn đến kết quả xấu, hỏng việc.",
    examples: [
      {
        ja: "最近忙しかったせいで、かなり疲れている。",
        vi: "Tại vì dạo này bận rộn nên tôi thấy khá mệt mỏi."
      },
      {
        ja: "隣の部屋の音楽の音のせいで、勉強に集中できない。",
        vi: "Tại vì tiếng nhạc phòng bên cạnh mà tôi không thể tập trung học được."
      }
    ]
  },
  {
    id: 24,
    pattern: "～のだから / ～んだから…",
    meaning: "Vì là... nên đương nhiên...",
    categoryId: "nguyen_nhan_ly_do",
    categoryName: "Nguyên nhân & Lý do",
    formation: "Thể thông thường (Na-な, N-な) + のだから / んだから",
    usage: "Nêu ra một lý do mà cả người nói và người nghe đều đã biết rõ hoặc là một sự thật hiển nhiên, từ đó đưa ra kết luận đương nhiên.",
    examples: [
      {
        ja: "世界が広いのだから、いろいろな習慣があるのは当然だ。",
        vi: "Bởi vì thế giới này rất rộng lớn, nên việc có nhiều tập quán khác nhau là điều đương nhiên."
      }
    ]
  },
  {
    id: 25,
    pattern: "～(の)なら…",
    meaning: "Nếu là... thì...",
    categoryId: "dieu_kien_gia_dinh",
    categoryName: "Điều kiện & Giả định",
    formation: "Thể thông thường + (の)なら\n* Riêng Na và N dùng なら trực tiếp (không dùng のなら)",
    usage: "Nhắc lại thông tin vừa nghe được từ đối phương hoặc bối cảnh sự việc để đưa ra đề xuất, phán đoán hành động tiếp theo.",
    examples: [
      {
        ja: "その箱、もう使わないんですか、使わないなら私にください。",
        vi: "Cái hộp đó anh không dùng nữa à? Nếu không dùng thì cho tôi nhé."
      },
      {
        ja: "その本、読んでしまったのなら私に貸してくれませんか。",
        vi: "Quyển sách đó nếu anh đã đọc xong rồi thì cho tôi mượn được không?"
      }
    ]
  },
  {
    id: 26,
    pattern: "～ては… / ～では…",
    meaning: "Nếu mà... (thì kết quả xấu)",
    categoryId: "dieu_kien_gia_dinh",
    categoryName: "Điều kiện & Giả định",
    formation: "V-て + は\nA-くて + は\nNa-で / N-で + は\nThể thông thường (Na/Nだ-な) + のでは",
    usage: "Đưa ra giả định hành động mang sắc thái tiêu cực, nếu cứ làm việc đó thì sẽ dẫn tới hậu quả xấu, bị người khác chê trách.",
    examples: [
      {
        ja: "そんな無責任な態度ではみんなにきらわれますよ。",
        vi: "Nếu anh giữ thái độ vô trách nhiệm như thế thì sẽ bị mọi người ghét đấy."
      },
      {
        ja: "Aさんは手術したばかりだから、お見舞いに行ってはかえって迷惑だ。",
        vi: "Anh A vừa phẫu thuật xong, nếu bây giờ đi thăm thì ngược lại còn gây phiền toái cho anh ấy."
      }
    ]
  },
  {
    id: 27,
    pattern: "～さえ～ば… / ～さえ～なら…",
    meaning: "Chỉ cần... thì...",
    categoryId: "dieu_kien_gia_dinh",
    categoryName: "Điều kiện & Giả định",
    formation: "N + さえ + V-ば / A-ければ / Na-なら / N-なら\nV-ます + さえすれば",
    usage: "Đưa ra điều kiện tối thiểu nhất, chỉ cần thỏa mãn được điều kiện này thôi thì điều kia chắc chắn sẽ xảy ra hoặc giải quyết được.",
    examples: [
      {
        ja: "体さえ丈夫ならどんなことにも挑戦できる。",
        vi: "Chỉ cần cơ thể khỏe mạnh thì bất cứ việc gì tôi cũng dám thử thách."
      },
      {
        ja: "「ごめんなさい」さえ言えば、相手は許してくれるだろう。",
        vi: "Chỉ cần nói câu 'Tôi xin lỗi' thôi thì đối phương sẽ tha thứ cho bạn."
      }
    ]
  },
  {
    id: 28,
    pattern: "たとえ～ても… / たとえ～でも…",
    meaning: "Cho dù... thì vẫn...",
    categoryId: "dieu_kien_gia_dinh",
    categoryName: "Điều kiện & Giả định",
    formation: "たとえ + V-ても / A-くても / Na-でも / N-でも",
    usage: "Đưa ra giả thiết mạnh mẽ: Dù có xảy ra tình huống khó khăn, bất lợi đến đâu thì ý chí, hành động ở vế sau vẫn không hề thay đổi.",
    examples: [
      {
        ja: "たとえ周りの人たちにどんなに反対されても、僕はプロの歌手になりたい。",
        vi: "Cho dù những người xung quanh có phản đối thế nào đi nữa, tôi vẫn muốn trở thành ca sĩ chuyên nghiệp."
      },
      {
        ja: "たとえ高くても、仕事に必要なものは買わなければならない。",
        vi: "Dù có đắt đỏ thế nào, những đồ cần thiết cho công việc vẫn phải mua."
      }
    ]
  },
  {
    id: 29,
    pattern: "～ば… / ～たら… (giả định trái ngược thực tế)",
    meaning: "Giá mà..., nếu như... (tiếc nuối)",
    categoryId: "dieu_kien_gia_dinh",
    categoryName: "Điều kiện & Giả định",
    formation: "V-ば / V-たら\nA-ければ / A-かったら\nNa/N-なら / Na/N-だったら",
    usage: "Đưa ra giả định không có thật trong quá khứ hoặc hiện tại, thể hiện sự tiếc nuối hoặc thở phào nhẹ nhõm vì sự việc đã may mắn không xảy ra.",
    examples: [
      {
        ja: "お金とひまがあればわたしも海外旅行するんだけど…",
        vi: "Giá mà có tiền và thời gian rảnh thì tôi cũng đi du lịch nước ngoài rồi đấy..."
      },
      {
        ja: "もし寝坊していたらこの飛行機に乗れなかった。間に合ってよかった。",
        vi: "Nếu mà ngủ quên thì đã không lên kịp chuyến bay này rồi. May mà đến kịp giờ."
      }
    ]
  },
  {
    id: 30,
    pattern: "～ということだ / ～とのことだ",
    meaning: "Nghe nói rằng, có vẻ như...",
    categoryId: "truyen_dat_phong_doan",
    categoryName: "Truyền đạt & Phỏng đoán",
    formation: "Thể thông thường + ということだ / とのことだ",
    usage: "Truyền đạt lại thông tin nghe được một cách trang trọng, lịch sự (hơn ～だそうだ). Thường đi kèm với nguồn thông tin: ～によると / ～によれば.",
    examples: [
      {
        ja: "市のお知らせによれば、この道路は来週から工事が始まるということだ。",
        vi: "Theo thông báo của thành phố, con đường này nghe nói tuần sau sẽ bắt đầu thi công."
      },
      {
        ja: "店の人の話では、この地方の米はとてもおいしいということだ。",
        vi: "Theo lời người bán hàng thì gạo của vùng này nghe nói rất ngon."
      }
    ]
  },
  {
    id: 31,
    pattern: "～と言われている (～といわれている)",
    meaning: "Người ta nói rằng, được cho là...",
    categoryId: "truyen_dat_phong_doan",
    categoryName: "Truyền đạt & Phỏng đoán",
    formation: "Thể thông thường + と言われている",
    usage: "Thuật lại thông tin, nhận định chung của xã hội, dư luận hoặc nhiều người cùng công nhận.",
    examples: [
      {
        ja: "今年は黒い服が流行するといわれている。",
        vi: "Người ta nói rằng năm nay quần áo màu đen sẽ thịnh hành."
      },
      {
        ja: "納豆は体にいいといわれている。",
        vi: "Món natto được người ta nói rằng rất tốt cho sức khỏe."
      }
    ]
  },
  {
    id: 32,
    pattern: "～とか",
    meaning: "Nghe đồn là, nghe nói rằng...",
    categoryId: "truyen_dat_phong_doan",
    categoryName: "Truyền đạt & Phỏng đoán",
    formation: "Thể thông thường + とか",
    usage: "Truyền đạt lại thông tin gián tiếp qua nghe đồn, tai nghe nhưng người nói không dám chắc chắn 100%.",
    examples: [
      {
        ja: "来月また出張だとか。今度はどちらに行かれるんですか。",
        vi: "Nghe đồn tháng sau anh lại đi công tác à? Lần này anh đi đâu thế?"
      },
      {
        ja: "足の裏を日に当てると健康にいいとか。本当だろうか。",
        vi: "Nghe nói phơi lòng bàn chân dưới nắng tốt cho sức khỏe. Liệu có thật không nhỉ?"
      }
    ]
  },
  {
    id: 33,
    pattern: "～って",
    meaning: "Nói rằng..., bảo là... (văn nói)",
    categoryId: "truyen_dat_phong_doan",
    categoryName: "Truyền đạt & Phỏng đoán",
    formation: "Thể thông thường + って",
    usage: "Dùng trong văn nói hàng ngày thân mật, rút gọn của trợ từ trích dẫn と (言っていた, 聞いた).",
    examples: [
      {
        ja: "小川さん、今日は休むって言ってたよ。",
        vi: "Anh Ogawa bảo là hôm nay nghỉ đấy."
      },
      {
        ja: "駅前にタイ料理レストランができたんだって。行ってみようよ。",
        vi: "Nghe bảo trước ga mới mở nhà hàng Thái Lan đấy. Hôm nào đi thử đi!"
      }
    ]
  },
  {
    id: 34,
    pattern: "～という",
    meaning: "Nghe nói rằng... (văn viết)",
    categoryId: "truyen_dat_phong_doan",
    categoryName: "Truyền đạt & Phỏng đoán",
    formation: "Thể thông thường + という",
    usage: "Truyền đạt lại thông tin trong văn viết hoặc bản tin, sắc thái trang trọng hơn だそうだ.",
    examples: [
      {
        ja: "この辺りは昔、広い野原だったという。",
        vi: "Nghe nói vùng này ngày xưa từng là một thảo nguyên rộng lớn."
      },
      {
        ja: "この祭りは村で古くから行われてきたという。",
        vi: "Nghe nói lễ hội này đã được tổ chức từ thời xa xưa ở ngôi làng."
      }
    ]
  },
  {
    id: 35,
    pattern: "～はずがない / ～わけがない",
    meaning: "Tuyệt đối không, không thể nào...",
    categoryId: "phu_dinh_danh_gia",
    categoryName: "Phủ định & Đánh giá",
    formation: "Thể thông thường (Na-な/である, N-の/である) + はずがない / わけがない",
    usage: "Khẳng định phủ định một cách mạnh mẽ dựa trên cơ sở lý lẽ, quan điểm khách quan của người nói rằng chuyện đó chắc chắn không xảy ra.",
    examples: [
      {
        ja: "ちゃんと約束したんだから、彼がこないはずがない。どうしたのかな。",
        vi: "Đã hẹn đàng hoàng rồi thì không thể nào anh ấy không đến được. Có chuyện gì xảy ra chăng?"
      },
      {
        ja: "試合に勝つために毎日練習しているのだ。練習が厳しくないわけがない。",
        vi: "Vì để chiến thắng giải đấu mà ngày nào cũng tập luyện. Không thể nào việc tập luyện lại không nghiêm khắc được."
      }
    ]
  },
  {
    id: 36,
    pattern: "～とは限らない (～とはかぎらない)",
    meaning: "Không hẳn là, chưa chắc đã...",
    categoryId: "phu_dinh_danh_gia",
    categoryName: "Phủ định & Đánh giá",
    formation: "Thể thông thường (Na/N đôi khi giữ nguyên だ) + とは限らない",
    usage: "Bác bỏ quan điểm phiến diện, khẳng định rằng luôn có trường hợp ngoại lệ (không phải lúc nào cũng 100% như thế).",
    examples: [
      {
        ja: "この歌は古くから歌われているが、日本人がみんな知っているとは限らない。",
        vi: "Bài hát này được hát từ lâu rồi nhưng không hẳn là người Nhật nào cũng biết."
      },
      {
        ja: "値段が高いものが必ず質がいいとは限らない。",
        vi: "Đồ đắt tiền chưa chắc đã có chất lượng tốt."
      }
    ]
  },
  {
    id: 37,
    pattern: "～わけではない / ～というわけではない",
    meaning: "Không hẳn là, không phải là...",
    categoryId: "phu_dinh_danh_gia",
    categoryName: "Phủ định & Đánh giá",
    formation: "Thể thông thường (Na-な, N-の/な/である) + わけではない / というわけではない",
    usage: "Phủ định một phần, đính chính lại để tránh hiểu lầm: Không hoàn toàn như đối phương nghĩ.",
    examples: [
      {
        ja: "長い間本をお借りしたままでしたが、忘れていたわけではありません。",
        vi: "Tôi mượn sách suốt thời gian dài mà chưa trả, nhưng không phải là do tôi quên đâu."
      },
      {
        ja: "いつでも電話に出られるわけではありません。連絡はメールでお願いします。",
        vi: "Không phải lúc nào tôi cũng nghe máy được. Xin vui lòng liên lạc qua email."
      }
    ]
  },
  {
    id: 38,
    pattern: "～ないことはない",
    meaning: "Không phải là không..., cũng có thể...",
    categoryId: "phu_dinh_danh_gia",
    categoryName: "Phủ định & Đánh giá",
    formation: "V-ない + ことはない\nA-くない + ことはない\nNa-じゃない + ことはない",
    usage: "Dùng hình thức phủ định 2 lần để khẳng định nhẹ nhàng, dè dặt: Vẫn có khả năng làm được nhưng có chút khó khăn hoặc điều kiện.",
    examples: [
      {
        ja: "ここから駅まで歩けないことはありませんが、かなり時間がかかりますよ。",
        vi: "Từ đây đi bộ ra ga không phải là không thể, nhưng khá là tốn thời gian đấy."
      },
      {
        ja: "この店のカレーもおいしくないことはないが、私はもっと辛いのが好きだ。",
        vi: "Món cà ri quán này không phải là không ngon, chỉ là tôi thích loại cay hơn thôi."
      }
    ]
  },
  {
    id: 39,
    pattern: "～ことは～が…",
    meaning: "Đúng là có... thật nhưng mà...",
    categoryId: "phu_dinh_danh_gia",
    categoryName: "Phủ định & Đánh giá",
    formation: "V / A / Na + ことは + V / A / Na (cùng từ) + が / けれど",
    usage: "Thừa nhận vế đầu đúng là như vậy thật, nhưng ở vế sau đưa ra một điểm chưa hoàn toàn hài lòng hoặc không quan trọng lắm.",
    examples: [
      {
        ja: "彼からの手紙は読んだことは読んだんですが、意味がよくわかりませんでした。",
        vi: "Thư anh ấy gửi thì tôi đã đọc rồi thật đấy, nhưng tôi không hiểu rõ ý nghĩa cho lắm."
      },
      {
        ja: "私は泳げることは泳げますが、長い距離はだめなんです。",
        vi: "Đúng là tôi biết bơi thật, nhưng bơi cự ly dài thì tôi chịu."
      }
    ]
  },
  {
    id: 40,
    pattern: "～てもらいたい / ～ていただきたい / ～てほしい",
    meaning: "Muốn ai đó làm gì cho mình...",
    categoryId: "menh_lenh_loi_khuyen",
    categoryName: "Lời khuyên, Ý muốn & Mệnh lệnh",
    formation: "V-て / V-ないで + もらいたい / いただきたい / ほしい",
    usage: "Bày tỏ mong muốn đối phương làm (hoặc không làm) việc gì đó cho mình. Khác với ～たい (tự bản thân muốn làm).",
    examples: [
      {
        ja: "この書類、ちょっと見ていただきたいんですが、今よろしいでしょうか。",
        vi: "Tôi muốn nhờ ông xem qua tập tài liệu này một chút, bây giờ có tiện không ạ?"
      },
      {
        ja: "この仕事はだれにも手伝ってもらいたくない。自分一人でやりたい。",
        vi: "Công việc này tôi không muốn ai giúp đỡ cả. Tôi muốn tự mình làm."
      }
    ]
  },
  {
    id: 41,
    pattern: "～（さ）せてもらいたい / ～（さ）せていただきたい",
    meaning: "Xin phép cho tôi được làm...",
    categoryId: "menh_lenh_loi_khuyen",
    categoryName: "Lời khuyên, Ý muốn & Mệnh lệnh",
    formation: "V-sai khiến thể て + もらいたい / いただきたい / ほしい",
    usage: "Bày tỏ nguyện vọng, xin phép người nghe cho phép chính bản thân mình được thực hiện một hành động nào đó.",
    examples: [
      {
        ja: "すみません、今日は体調が悪いので、早く帰らせていただきたいのですが…",
        vi: "Xin lỗi, hôm nay em thấy trong người không khỏe, em xin phép được về sớm có được không ạ?"
      },
      {
        ja: "昼休みが短いね。昼ご飯をもっとゆっくり食べさせてもらいたいね。",
        vi: "Nghỉ trưa ngắn quá nhỉ. Ước gì được cho ăn trưa thong thả hơn một chút."
      }
    ]
  },
  {
    id: 42,
    pattern: "～といい / ～たらいい / ～ばいい",
    meaning: "Mong là... / Nên làm...",
    categoryId: "menh_lenh_loi_khuyen",
    categoryName: "Lời khuyên, Ý muốn & Mệnh lệnh",
    formation: "1. Bày tỏ mong ước: Thể điều kiện (ば/たら/と) + いい (が/なあ)\n2. Khuyên nhủ: V-たらいい / V-ばいい + ですよ",
    usage: "1. Bày tỏ mong ước một việc tốt đẹp sẽ xảy ra dù nằm ngoài tầm kiểm soát của mình.\n2. Đưa ra lời khuyên, gợi ý cho đối phương nên làm gì.",
    examples: [
      {
        ja: "最近ずっと体の調子が悪い。悪い病気でなければいいが…",
        vi: "Gần đây người cứ mệt suốt. Mong là không phải bệnh nặng gì..."
      },
      {
        ja: "疲れているようですね。あしたはゆっくり休むといいですよ。",
        vi: "Trông bạn có vẻ mệt mỏi. Ngày mai bạn nên nghỉ ngơi thong thả đi nhé."
      },
      {
        ja: "申込書の書き方が分からなければ、事務の人に聞いてみたらいいですよ。",
        vi: "Nếu không biết cách điền đơn đăng ký thì bạn thử hỏi nhân viên văn phòng xem sao."
      }
    ]
  },
  {
    id: 43,
    pattern: "命令（しろ）/ 禁止（～な）",
    meaning: "Thể mệnh lệnh (Hãy làm!) / Cấm chỉ (Cấm làm!)",
    categoryId: "menh_lenh_loi_khuyen",
    categoryName: "Lời khuyên, Ý muốn & Mệnh lệnh",
    formation: "Mệnh lệnh: Nhóm 1 đổi đuôi e (書け); Nhóm 2 bỏ ます thêm ろ (見ろ); Nhóm 3 (しろ, 来い こい)\nCấm đoán: V-る + な (食べるな, 行くな)",
    usage: "Cách nói mệnh lệnh, cấm đoán gay gắt, thường dùng bởi nam giới, huấn luyện viên thể thao cổ vũ, hoặc ghi trên biển báo hiệu.",
    examples: [
      {
        ja: "犬に「座れ。」とめいれいした。犬は命令に従った。",
        vi: "Tôi ra lệnh cho chú chó 'Ngồi xuống!'. Chú chó đã nghe theo mệnh lệnh."
      },
      {
        ja: "【試合で】監督「走れ、走れ！」",
        vi: "Trong trận đấu, huấn luyện viên hô: 'Chạy đi, chạy nhanh lên!'"
      }
    ]
  },
  {
    id: 44,
    pattern: "～こと",
    meaning: "Phải... / Cấm...",
    categoryId: "menh_lenh_loi_khuyen",
    categoryName: "Lời khuyên, Ý muốn & Mệnh lệnh",
    formation: "V-る + こと (Phải làm)\nV-ない + こと (Không được làm)",
    usage: "Dùng để truyền đạt mệnh lệnh, quy tắc, chỉ dẫn hoặc cảnh báo trên các văn bản, thông báo, nội quy.",
    examples: [
      {
        ja: "申込書を書く前に注意書きをよく読むこと。",
        vi: "Trước khi viết đơn đăng ký, phải đọc kỹ các mục lưu ý."
      },
      {
        ja: "教室を出る前に、電気を消すこと。",
        vi: "Trước khi rời khỏi phòng học, phải tắt đèn điện."
      }
    ]
  },
  {
    id: 45,
    pattern: "～べきだ / ～べきではない",
    meaning: "Nên làm... / Không nên làm...",
    categoryId: "menh_lenh_loi_khuyen",
    categoryName: "Lời khuyên, Ý muốn & Mệnh lệnh",
    formation: "V-る + べきだ / べきではない\n* する → するべき / すべき",
    usage: "Thể hiện quan điểm, đạo lý thông thường là nên/không nên làm việc đó, nếu không làm sau này sẽ hối hận.",
    examples: [
      {
        ja: "せっかく会社に入ったのだから、簡単にやめるべきではない。",
        vi: "Đã cất công vào được công ty rồi thì không nên từ bỏ một cách dễ dàng."
      },
      {
        ja: "これは大事なことですから、もう少し話し合ってから決めるべきだとおもいます。",
        vi: "Vì đây là việc hệ trọng nên tôi nghĩ nên bàn bạc thêm chút nữa rồi hãy quyết định."
      }
    ]
  },
  {
    id: 46,
    pattern: "～たらどうか",
    meaning: "Thử làm... xem sao? / Sao không làm...?",
    categoryId: "menh_lenh_loi_khuyen",
    categoryName: "Lời khuyên, Ý muốn & Mệnh lệnh",
    formation: "V-たら + どうか / どうですか",
    usage: "Đưa ra lời khuyên nhẹ nhàng cho đối phương thử làm một việc gì đó. Đôi khi mang sắc thái trách móc nhẹ.",
    examples: [
      {
        ja: "体のことが心配なら、一度健康診断を受けたらどうでしょうか。",
        vi: "Nếu lo lắng về sức khỏe thì bạn thử đi khám tổng quát một lần xem sao?"
      },
      {
        ja: "悪いのはそっちですよ。一言謝ったらどうですか。",
        vi: "Người có lỗi là anh đấy. Sao anh không thử nói một lời xin lỗi đi?"
      }
    ]
  },
  {
    id: 47,
    pattern: "～ようにする / ～ようにしている",
    meaning: "Cố gắng làm... / Duy trì thói quen...",
    categoryId: "menh_lenh_loi_khuyen",
    categoryName: "Lời khuyên, Ý muốn & Mệnh lệnh",
    formation: "V-る / V-ない + ようにする / ようにしている",
    usage: "Thể hiện sự quyết tâm, nỗ lực có ý thức của bản thân để tạo lập hoặc duy trì một thói quen tốt hàng ngày.",
    examples: [
      {
        ja: "健康のために、毎日一時間は歩くようにしている。",
        vi: "Vì sức khỏe, mỗi ngày tôi đều cố gắng đi bộ một tiếng."
      },
      {
        ja: "日本語が上手に話せるために、できるだけ会話を練習するようにしている。",
        vi: "Để nói tiếng Nhật giỏi, ngày nào tôi cũng cố gắng luyện hội thoại nhiều nhất có thể."
      }
    ]
  },
  {
    id: 48,
    pattern: "～（よ）うとする",
    meaning: "Định làm gì... / Cố thử làm gì...",
    categoryId: "menh_lenh_loi_khuyen",
    categoryName: "Lời khuyên, Ý muốn & Mệnh lệnh",
    formation: "V-ý chí (よう・おう) + とする",
    usage: "Diễn tả hành động đang định làm ngay tức khắc trong khoảnh khắc, hoặc cố gắng thực hiện điều gì nhưng bất thành (dùng ようとしたが...).",
    examples: [
      {
        ja: "父に事情を説明しようとしたが、父は話を聞こうとはしなかった。",
        vi: "Tôi vừa định giải thích sự tình cho bố thì bố chẳng buồn nghe."
      },
      {
        ja: "明日は大切なテストなので早く寝ようとしても、なかなか眠れなかった。",
        vi: "Vì mai có bài thi quan trọng nên tôi cố đi ngủ sớm nhưng mãi mà không ngủ được."
      }
    ]
  },
  {
    id: 49,
    pattern: "～ことにする",
    meaning: "Quyết định làm/không làm gì...",
    categoryId: "menh_lenh_loi_khuyen",
    categoryName: "Lời khuyên, Ý muốn & Mệnh lệnh",
    formation: "V-る / V-ない + ことにする",
    usage: "Thể hiện quyết định do chính bản thân mình chủ động đưa ra dựa trên ý chí cá nhân.",
    examples: [
      {
        ja: "コセイセンターはハノイに一番良さそうなので、ここで日本語を勉強することにします。",
        vi: "Trung tâm Kosei có vẻ tốt nhất ở Hà Nội nên tôi quyết định sẽ học tiếng Nhật ở đây."
      },
      {
        ja: "冷蔵庫がこわれたので、新しいのを買うことにした。",
        vi: "Tủ lạnh hỏng mất rồi nên tôi quyết định mua cái mới."
      }
    ]
  },
  {
    id: 50,
    pattern: "～ことにしている",
    meaning: "Duy trì quy tắc thói quen...",
    categoryId: "menh_lenh_loi_khuyen",
    categoryName: "Lời khuyên, Ý muốn & Mệnh lệnh",
    formation: "V-る / V-ない + ことにしている",
    usage: "Diễn tả một thói quen hoặc quy tắc sống do chính mình tự đặt ra và đang quyết tâm kiên trì duy trì đều đặn.",
    examples: [
      {
        ja: "健康のため、毎朝牛乳を飲むことにしている。",
        vi: "Để giữ sức khỏe, tôi duy trì thói quen uống sữa mỗi sáng."
      },
      {
        ja: "部長の言葉はいつもとてもきびしいが、わたしは気にしないことにしている。",
        vi: "Lời của trưởng phòng lúc nào cũng rất khắt khe nhưng tôi quyết định không bận tâm làm gì."
      }
    ]
  },
  {
    id: 51,
    pattern: "～ことになる",
    meaning: "Được quyết định là..., hóa ra là...",
    categoryId: "menh_lenh_loi_khuyen",
    categoryName: "Lời khuyên, Ý muốn & Mệnh lệnh",
    formation: "V-る / V-ない + ことになる",
    usage: "Nói về quyết định, quy tắc do người khác, hoàn cảnh bên ngoài hoặc tập thể quyết định (không phụ thuộc ý chí người nói).",
    examples: [
      {
        ja: "本校では、教室で日本語しか話せないことになる。",
        vi: "Ở trường này, trong lớp học quy định là chỉ được nói tiếng Nhật."
      },
      {
        ja: "この仕事を引き受けると他の町へ引っ越すことになる。",
        vi: "Nếu nhận công việc này thì đồng nghĩa với việc sẽ phải chuyển nhà sang thị trấn khác."
      }
    ]
  },
  {
    id: 52,
    pattern: "～ことになっている",
    meaning: "Quy định là..., theo thông lệ là...",
    categoryId: "menh_lenh_loi_khuyen",
    categoryName: "Lời khuyên, Ý muốn & Mệnh lệnh",
    formation: "V-る / V-ない + ことになっている",
    usage: "Diễn tả các tập quán, luật lệ, quy định chung của xã hội/tổ chức đã thành nếp từ trước đến nay.",
    examples: [
      {
        ja: "本校では、教室では日本語しか話せないことになっている。",
        vi: "Ở trường này có quy định là trong lớp chỉ được phép nói tiếng Nhật."
      },
      {
        ja: "法律では、２０歳未満はお酒を飲んではいけないことになっている。",
        vi: "Theo quy định của pháp luật, người dưới 20 tuổi không được phép uống rượu."
      }
    ]
  },
  {
    id: 53,
    pattern: "～みたいだ",
    meaning: "Hình như... / Giống như là...",
    categoryId: "truyen_dat_phong_doan",
    categoryName: "Truyền đạt & Phỏng đoán",
    formation: "N / V / A + みたいだ (chia như tính từ đuôi na)",
    usage: "1. Phỏng đoán không chắc chắn dựa trên cảm nhận trực quan hoặc kinh nghiệm cá nhân.\n2. So sánh ví von: giống như thể là... (thực tế thì không phải).",
    examples: [
      {
        ja: "部長は怒ると怖いみたいだ。",
        vi: "Hình như trưởng phòng mà nổi giận thì đáng sợ lắm."
      },
      {
        ja: "こんなに遅かったら、たぶん、田中さんは来ないみたいだね。",
        vi: "Muộn thế này rồi thì chắc là anh Tanaka không đến đâu."
      },
      {
        ja: "このパンはケーキみたいに甘くてやわらかい。",
        vi: "Cái bánh mì này ngọt và mềm giống như bánh kem vậy."
      },
      {
        ja: "ガラスみたいな氷を靴で踏んで遊んだ。",
        vi: "Tôi giẫm lên lớp băng trông trong suốt như kính để chơi đùa."
      }
    ]
  },
  {
    id: 54,
    pattern: "～らしい",
    meaning: "Nghe nói là... / Đậm chất, đúng chất...",
    categoryId: "truyen_dat_phong_doan",
    categoryName: "Truyền đạt & Phỏng đoán",
    formation: "1. Thể thông thường + らしい (truyền đạt, suy đoán có căn cứ)\n2. N + らしい (đúng bản chất thực sự của đối tượng)",
    usage: "1. Truyền đạt lại thông tin nghe được hoặc phỏng đoán có căn cứ khá cao.\n2. Đi với danh từ mang ý khen ngợi: toát lên đúng bản chất thực sự của sự vật (đậm chất xuân, rất nam tính...).",
    examples: [
      {
        ja: "田中さんは来ないらしいよ。",
        vi: "Nghe nói anh Tanaka không đến đâu."
      },
      {
        ja: "今日は暖かくて春らしい1日だった。",
        vi: "Hôm nay ấm áp, đúng là một ngày mang đậm không khí mùa xuân."
      },
      {
        ja: "いつもの元気なリーくんらしくないよ。どうしたの？",
        vi: "Chẳng giống bạn Lee hoạt bát thường ngày gì cả. Cậu làm sao thế?"
      }
    ]
  },
  {
    id: 55,
    pattern: "～そうだ (truyền đạt)",
    meaning: "Nghe nói là...",
    categoryId: "truyen_dat_phong_doan",
    categoryName: "Truyền đạt & Phỏng đoán",
    formation: "Thể thông thường + そうだ",
    usage: "Truyền đạt lại nguyên văn điều đã nghe được từ ai đó hoặc nguồn tin cụ thể cho đối phương mà không thêm thắt ý kiến cá nhân.",
    examples: [
      {
        ja: "部長は怒ると怖いそうだ。",
        vi: "Nghe nói trưởng phòng mà tức giận thì đáng sợ lắm."
      },
      {
        ja: "田中さんって来ないそうだよ。",
        vi: "Anh Tanaka nghe nói là sẽ không đến đâu."
      }
    ]
  },
  {
    id: 56,
    pattern: "～っぽい",
    meaning: "Có vẻ như..., như là... (hơi hướng tiêu cực)",
    categoryId: "truyen_dat_phong_doan",
    categoryName: "Truyền đạt & Phỏng đoán",
    formation: "N / V-ます (bỏ ます) / A-い (bỏ い) + っぽい",
    usage: "Cảm thấy người hay sự vật mang tính chất, đặc điểm nào đó rõ rệt (dù bản chất không phải), thường dùng với sắc thái tiêu cực hoặc chê bai.",
    examples: [
      {
        ja: "彼女はわがままばかり言って、子供っぽい人だ。",
        vi: "Cô ấy toàn vòi vĩnh ích kỷ, tính tình như trẻ con vậy."
      },
      {
        ja: "弟はあきっぽくて、何でも途中でやめてしまう。",
        vi: "Em trai tôi cả thèm chóng chán, việc gì cũng bỏ dở giữa chừng."
      }
    ]
  },
  {
    id: 57,
    pattern: "～たばかり",
    meaning: "Vừa mới làm gì xong...",
    categoryId: "thoi_gian",
    categoryName: "Thời gian & Trình tự",
    formation: "V-た + ばかり",
    usage: "Thể hiện hành động vừa mới xảy ra theo cảm nhận chủ quan của người nói (thời gian thực tế có thể đã trôi qua vài tháng nhưng người nói vẫn cảm thấy mới).",
    examples: [
      {
        ja: "でき上がったばかりのケーキをみんなで食べた。",
        vi: "Mọi người cùng nhau thưởng thức chiếc bánh vừa mới ra lò."
      },
      {
        ja: "さっきご飯を食べたばかりなのに、もうおなかがすいてしまった。",
        vi: "Vừa mới ăn cơm ban nãy xong mà giờ bụng đã đói cồn cào rồi."
      }
    ]
  },
  {
    id: 58,
    pattern: "～たところ",
    meaning: "Vừa mới... / Sau khi làm thử thì...",
    categoryId: "thoi_gian",
    categoryName: "Thời gian & Trình tự",
    formation: "V-た + ところ",
    usage: "1. Hành động vừa mới kết thúc tại thời điểm nói theo thước đo thời gian khách quan.\n2. Sau khi làm thử việc gì đó thì phát hiện ra kết quả bất ngờ.",
    examples: [
      {
        ja: "もしもし、今、駅に着いたところです。",
        vi: "Alo, tôi vừa mới đến ga đây."
      },
      {
        ja: "ケーキができ上がったところへ子供たちが帰って来た。",
        vi: "Đúng lúc chiếc bánh vừa làm xong thì bọn trẻ đi học về."
      }
    ]
  },
  {
    id: 59,
    pattern: "～はずだ",
    meaning: "Chắc chắn là...",
    categoryId: "truyen_dat_phong_doan",
    categoryName: "Truyền đạt & Phỏng đoán",
    formation: "Thể thông thường (Na-な, N-の) + はずだ",
    usage: "Người nói phán đoán dựa trên cơ sở dữ liệu vững chắc và tin tưởng mức độ chính xác là rất cao.",
    examples: [
      {
        ja: "いい薬を使ったから、きっとすぐ治るはずですよ。",
        vi: "Đã dùng thuốc tốt rồi thì chắc chắn sẽ khỏi nhanh thôi."
      },
      {
        ja: "この商品は人気があるから、十日ぐらいで売り切れるはずだ。",
        vi: "Sản phẩm này rất được ưa chuộng nên chắc chắn sẽ bán hết sạch trong vòng 10 ngày."
      }
    ]
  },
  {
    id: 60,
    pattern: "～わけだ",
    meaning: "Thảo nào..., hèn chi..., đương nhiên là...",
    categoryId: "nguyen_nhan_ly_do",
    categoryName: "Nguyên nhân & Lý do",
    formation: "Thể thông thường (Na-な, N-な/である) + わけだ",
    usage: "Sau khi nghe giải thích hoặc hiểu ra nguyên do, người nói thốt lên lý giải sự việc: 'Thảo nào mà... là điều đương nhiên!'.",
    examples: [
      {
        ja: "なるほど、この薬を使えば早く治るわけですね。じゃあ使ってみましょう。",
        vi: "À ra thế, uống thuốc này vào sẽ nhanh khỏi là vì vậy. Thế thì tôi uống thử xem."
      },
      {
        ja: "彼はあんなに食べたら、太るわけだ。なるほどな。",
        vi: "Cậu ta ăn nhiều như thế thì thảo nào mà béo (béo là phải). Tôi hiểu rồi."
      }
    ]
  },
  {
    id: 61,
    pattern: "Tôn kính ngữ (尊敬語 - そんけいご)",
    meaning: "Kính trọng hành động của người khác",
    categoryId: "kinh_ngu",
    categoryName: "Kính ngữ (Tôn kính & Khiêm nhường)",
    formation: "1. Động từ đặc biệt:\n• いる・行く・来る → いらっしゃる\n• 食べる・飲む → 召し上がる (めしあがる)\n• 言う → おっしゃる\n• 見る → ご覧になる (ごらんになる)\n• 知っている → ご存知です (ごぞんじです)\n• する → なさる\n2. お + V-ます (bỏ ます) + になる / ご + N + になる\n3. Thể bị động: V-れる / られる",
    usage: "Dùng để tôn kính hành động của đối phương, cấp trên, khách hàng, đối tác hoặc người có địa vị cao hơn.",
    examples: [
      {
        ja: "今晩はお宅にいらっしゃるでしょう。(Tối nay ông có nhà không ạ?)",
        vi: "Tối nay bác có ở nhà không ạ?"
      },
      {
        ja: "和食を召し上がります。お酒も召し上がります。",
        vi: "Ông ấy dùng món Nhật và cũng uống cả rượu nữa."
      },
      {
        ja: "お名前は何とおっしゃいますか。",
        vi: "Quý danh của quý khách là gì ạ?"
      },
      {
        ja: "今日は何時ごろおかえりになりますか。",
        vi: "Hôm nay khoảng mấy giờ thì anh về nhà ạ?"
      },
      {
        ja: "社長はもう帰られましたか。",
        vi: "Giám đốc đã về rồi ạ?"
      }
    ]
  },
  {
    id: 62,
    pattern: "Khiêm nhường ngữ (謙譲語 - けんじょうご)",
    meaning: "Hạ mình để tôn kính đối phương",
    categoryId: "kinh_ngu",
    categoryName: "Kính ngữ (Tôn kính & Khiêm nhường)",
    formation: "1. Động từ đặc biệt:\n• 行く・来る → 参る (まいります)\n• 見る → 拝見する (はいけんする)\n• 言う → 申す (もうします) / 申し上げる\n• 聞く・訪ねる → 伺う (うかがう)\n• 食べる・飲む・もらう → いただく\n• する → 致す (いたします)\n• 知っている → 存じております\n2. お + V-ます (bỏ ます) + する / いたす\n3. ご + N + する / いたす",
    usage: "Dùng khi nói về hành động của chính bản thân mình hoặc người trong gia đình/công ty mình (nhóm mình) trước mặt người ngoài nhằm thể hiện sự khiêm tốn.",
    examples: [
      {
        ja: "先生のご本をお借りしてもよろしいでしょうか。",
        vi: "Em xin phép mượn sách của thầy có được không ạ?"
      },
      {
        ja: "ご返信をお待ちいたしております。",
        vi: "Tôi xin phép được chờ đợi hồi âm từ quý khách."
      },
      {
        ja: "先月、大学を卒業いたしました。",
        vi: "Tháng trước tôi vừa tốt nghiệp đại học."
      },
      {
        ja: "はじめまして。山田と申します。",
        vi: "Rất hân hạnh được làm quen. Tôi tên là Yamada."
      },
      {
        ja: "行き先はよく存じております。",
        vi: "Tôi biết rất rõ địa điểm đích đến rồi ạ."
      }
    ]
  }
];

// Helper functions for Grammar
function getAllGrammarList() {
  return GRAMMAR_DATA;
}

function getGrammarById(id) {
  return GRAMMAR_DATA.find(g => g.id === Number(id));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GRAMMAR_CATEGORIES, GRAMMAR_DATA, getAllGrammarList, getGrammarById };
}


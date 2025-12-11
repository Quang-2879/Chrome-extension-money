chrome.storage.sync.get('multiplier', function (data) {
  const multiplier = data.multiplier || 1;

  if (multiplier <= 1) {
    return;
  }

  // === Logger tiện dùng ===
  function addLog(msg) {
    chrome.storage.local.get({ logs: [] }, (res) => {
      const logs = res.logs;
      logs.push(new Date().toISOString() + ": " + msg);
      chrome.storage.local.set({ logs });
    });
  }

  // Lưu giá trị gốc để không nhân nhiều lần
  const originalValues = new WeakMap();

  // Regex cải tiến: bắt mọi ký hiệu + tiền liền nhau
  const currencySymbols = /[₫$€¥£₹]|đ/;

  // === Hàm đọc số từ text (đã FIX lỗi thập phân) ===
  function extractNumber(text) {
    let cleaned = text.replace(currencySymbols, '').trim();

    // Nếu dạng "20,03" → đổi về "20.03"
    if (cleaned.includes(',')) {
      // trường hợp kiểu EU: dấu phẩy là decimal → chuyển thành '.'
      cleaned = cleaned.replace(/\./g, ''); // bỏ dấu . nếu là thousands
      cleaned = cleaned.replace(',', '.');  // chuyển decimal
    } else {
      // trường hợp kiểu "20.03" → giữ nguyên
      // cleaned = cleaned.replace(/[^\d.]/g, '');
      cleaned = cleaned.replace(/\./g, ''); // bỏ dấu . nếu là thousands
    }

    const num = parseFloat(cleaned);
    
    return isNaN(num) ? null : num;
  }

  // === Hàm xử lý toàn bộ ===
  function processAll() {
    const elements = document.querySelectorAll('span._3dfi._3dfj');

    elements.forEach((el) => {
      const text = el.textContent.trim();

      if (!(/[₫$€¥£₹]|đ/).test(text)) return;

      let originalValue = originalValues.get(el);

      if (originalValue == null) {
        originalValue = extractNumber(text);
        
        if (originalValue == null) return;

        originalValues.set(el, originalValue);
      }

      // Tính lại số đã đổi (vẫn giữ phần thập phân)
      // let newValue = (originalValue * multiplier).toLocaleString('vi-VN', {
      //   minimumFractionDigits: 2,
      //   maximumFractionDigits: 2
      // });
      let newValue = (originalValue * multiplier).toLocaleString('vi-VN');

      // Nếu là VND → không có phần thập phân
      if (text.includes("₫") || text.includes("đ")) {
        newValue = (originalValue * multiplier).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
      }

      // Lấy ký hiệu tiền tệ đầu tiên
      const symbol = (text.match(/[₫$€¥£₹]|đ/) || [''])[0];
      const replaced = `${newValue} ${symbol}`;

      if (el.textContent !== replaced) {
        addLog(`Sửa '${text}' → '${replaced}'`);
        el.textContent = replaced;
      }
    });
  }

  addLog("Khởi động content script");

  // chạy 1 lần khi load
  processAll();

  // === Debounce để tránh spam ===
  let debounceTimer = null;
  function debounceProcess() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processAll, 100); // 100ms tối ưu
  }

  // === Observer theo dõi DOM thay đổi ===
  const observer = new MutationObserver(() => {
    addLog("Phát hiện DOM thay đổi");
    debounceProcess();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

});

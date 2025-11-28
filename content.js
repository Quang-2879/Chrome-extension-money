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

  // === Hàm đọc số từ text ===
  function extractNumber(text) {
    return parseInt(
      text
        .replace(currencySymbols, '')
        .replace(/[^\d]/g, ''), // loại ., , khoảng trắng
      10
    );
  }

  // === Hàm xử lý toàn bộ ===
  function processAll() {
    const elements = document.querySelectorAll('a.user-profile, span._3dfi._3dfj');

    elements.forEach((el) => {
      const text = el.textContent.trim();

      // Clone regex để tránh trạng thái `.test()` sai
      if (!(/[₫$€¥£₹]|đ/).test(text)) return;

      let originalValue = originalValues.get(el);

      if (!originalValue) {
        originalValue = extractNumber(text);

        if (!originalValue || isNaN(originalValue)) return;

        originalValues.set(el, originalValue);
      }

      // Tính lại số đã đổi
      let newValue = (originalValue * multiplier).toLocaleString('vi-VN');

      // Nếu là VND → không có phần thập phân
      if (text.includes("₫") || text.includes("đ")) {
        newValue = newValue.split(',')[0];
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

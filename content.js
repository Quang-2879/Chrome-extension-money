chrome.storage.sync.get('multiplier', function(data) {
  const multiplier = data.multiplier || 1;

  // Hàm ghi log vào Chrome storage
  function addLog(message) {
    chrome.storage.local.get({logs: []}, function(result) {
      const logs = result.logs;
      logs.push(new Date().toISOString() + ": " + message);
      chrome.storage.local.set({logs: logs});
    });
  }

  // Lưu trữ giá trị gốc của các phần tử để tránh nhân nhiều lần
  const originalValuesMap = new Map();

  // Biểu thức chính quy để nhận diện mọi loại ký hiệu tiền tệ (bao gồm $, €, ₫, ¥, £, v.v.)
  const currencyRegex = /[₫$€¥£₹]/g;

  // Hàm để thay đổi số tiền
  function changeMoneyValues() {
    let elements = document.querySelectorAll('span._3dfi._3dfj');

    if (elements.length === 0) {
      addLog('Không tìm thấy phần tử chứa số tiền nào.');
    } else {
      Promise.all(Array.from(elements).map(element => {
        return new Promise(resolve => {
          let originalText = element.textContent.trim(); // Lấy giá trị text gốc

          // Kiểm tra xem có chứa bất kỳ ký tự tiền tệ nào không
          if (currencyRegex.test(originalText)) {
            // Bóc tách số tiền từ chuỗi, bỏ dấu . và ký tự tiền tệ
            let moneyValue = originalText.replace(currencyRegex, '').replace(/[\,\.\s]/g, '');
            let originalValue = parseInt(moneyValue, 10);

            // Nếu số tiền hợp lệ và chưa thay đổi
            if (!isNaN(originalValue) && !originalValuesMap.has(element)) {
              // Lưu giá trị gốc của phần tử này
              originalValuesMap.set(element, originalValue);

              let newValue = (originalValue * multiplier).toLocaleString('vi-VN'); // Nhân với hệ số và định dạng lại

              // Nếu tiền tệ là VND (₫), loại bỏ phần thập phân
              if (originalText.includes('₫')) {
                newValue = newValue.split(',')[0]; // Loại bỏ phần sau dấu phẩy
              }

              addLog('Sửa ' + originalText + ' thành ' + newValue);

              // Thay thế số tiền cũ bằng số tiền mới, giữ nguyên ký hiệu tiền tệ
              element.textContent = newValue + ' ' + originalText.match(currencyRegex)[0];
            }
          }
          resolve();
        });
      })).then(() => {
        addLog('Hoàn thành thay đổi các phần tử.');
      });
    }
  }

  // Chạy lại việc thay đổi tiền liên tục và mạnh mẽ
  function repeatChange() {
    let attempts = 0; // Đếm số lần thử

    const intervalId = setInterval(() => {
      attempts++;
      addLog('Thử lần ' + attempts + ': Kiểm tra và sửa đổi số tiền.');
      changeMoneyValues();

      if (attempts >= 2000) { // Giới hạn 2000 lần kiểm tra (tương đương 20 giây với mỗi 10ms)
        clearInterval(intervalId); // Dừng lại sau 20 giây
        addLog('Dừng kiểm tra sau 20 giây.');
      }
    }, 10); // Giữ thời gian chờ giữa các lần kiểm tra là 10ms
  }

  // Bắt đầu quá trình ngay lập tức
  addLog('Bắt đầu quá trình ngay lập tức.');
  repeatChange(); // Không cần setTimeout, bắt đầu ngay khi tiện ích chạy

  // Sử dụng MutationObserver để theo dõi sự thay đổi của DOM
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(mutation => {
      addLog('Phát hiện sự thay đổi trong DOM.');
      changeMoneyValues();  // Áp dụng lại thay đổi ngay khi DOM bị thay đổi
    });
  });

  // Cấu hình Observer để theo dõi các thay đổi trong document
  const config = {
    childList: true,
    subtree: true,
    characterData: true
  };

  // Bắt đầu quan sát các thay đổi trong toàn bộ trang
  observer.observe(document.body, config);

  addLog('Đã thiết lập xong MutationObserver và lặp kiểm tra.');
});

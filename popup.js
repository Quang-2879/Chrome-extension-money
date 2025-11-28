document.addEventListener('DOMContentLoaded', function() {
  // Khi giao diện popup mở, hiển thị số nhân đã lưu
  chrome.storage.sync.get('multiplier', function(data) {
    const multiplier = data.multiplier || '';
    document.getElementById('multiplier').value = multiplier;
  });

  // Khi nhấn nút "Lưu", lưu số nhân và làm mới trang
  document.getElementById('save').addEventListener('click', function() {
    const multiplier = document.getElementById('multiplier').value;

    if (multiplier) {
      chrome.storage.sync.set({ multiplier: parseFloat(multiplier) }, function() {
        console.log('Số nhân đã được lưu:', multiplier);

        // Làm mới trang web sau khi lưu số nhân
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          chrome.tabs.reload(tabs[0].id);
        });
      });
    }
  });

  // Hàm để tạo và tải file log
  // document.getElementById('export-log').addEventListener('click', function() {
  //   chrome.storage.local.get({ logs: [] }, function(result) {
  //     const logs = result.logs.join('\n');
  //     const blob = new Blob([logs], { type: 'text/plain' });
  //     const url = URL.createObjectURL(blob);

  //     // Tạo link tải xuống
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = 'log.txt';
  //     a.click();

  //     // Giải phóng URL Blob sau khi tải xong
  //     URL.revokeObjectURL(url);
  //   });
  // });

  // Nút Reset: xóa storage và reload tab
  document.getElementById('reset').addEventListener('click', function() {
    // Xóa toàn bộ storage (sync + local)
    chrome.storage.sync.clear(() => {
      chrome.storage.local.clear(() => {
        console.log('Đã xóa toàn bộ storage.');

        // Reload tab hiện tại
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          chrome.tabs.reload(tabs[0].id);
        });
      });
    });
  });

});

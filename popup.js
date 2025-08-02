(async () => {
  const xcomOrigins = ["https://x.com", "https://www.x.com"];

  // Xóa tất cả dữ liệu duyệt web liên quan đến x.com
  chrome.browsingData.remove({ origins: xcomOrigins }, {
    cookies: true,
    cache: true,
    localStorage: true,
    indexedDB: true
  });

  // Xoá cookie thủ công
  chrome.cookies.getAll({ domain: "x.com" }, (cookies) => {
    cookies.forEach(cookie => {
      const url = `https://${cookie.domain}${cookie.path}`;
      chrome.cookies.remove({ url, name: cookie.name });
    });
  });

  // Tìm tab x.com đang mở để inject script xoá localStorage/sessionStorage/cache
  const [tab] = await chrome.tabs.query({ url: "*://*.x.com/*" });

  if (tab && tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        localStorage.clear();
        sessionStorage.clear();
        if ('caches' in window) {
          caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
        }
        indexedDB.databases().then(dbs => {
          dbs.forEach(db => indexedDB.deleteDatabase(db.name));
        });
      }
    });

    // Reload tab sau khi dọn xong
    setTimeout(() => chrome.tabs.reload(tab.id), 2000);
  }

  document.getElementById("status").textContent = "✅ Đã xoá dữ liệu x.com!";
})();

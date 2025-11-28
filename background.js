chrome.runtime.onStartup.addListener(() => {
    console.log("AAAAA started!");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "keep_alive") {
        sendResponse({ status: "alive" });
    }
});

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === "complete") {
//         chrome.scripting.executeScript({
//             target: { tabId: tabId },
//             files: ["content.js"]
//         });
//     }
// });
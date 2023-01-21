chrome.webRequest.onCompleted.addListener(
    (details) => {
        if (details.statusCode === 200) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0].id) {
                    chrome.tabs.sendMessage(tabs[0].id, { msg: 'getBookData' });
                }
            });
        }
    },
    {
        urls: ['https://api.juejin.cn/booklet_api/v1/section/get*'],
        types: ['xmlhttprequest']
    },
    ['responseHeaders']
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!tab.url?.match(/^https:\/\/juejin\.cn.*/)) {
        return;
    }

    if (changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tabId, { msg: 'tabOnUpdated' });
    }
});

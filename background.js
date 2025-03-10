chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'fetchJitoBundle') {
    const apiUrl = `https://bundles.jito.wtf/api/v1/bundles/transaction/${request.signature}`;
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        // 检查返回数据是否为数组且有内容
        const isBundle = Array.isArray(data) && data.length > 0 && data[0].bundle_id;
        
        if (isBundle) {
          const bundleId = data[0].bundle_id;
          const bundleUrl = `https://explorer.jito.wtf/bundle/${bundleId}`;
          
          // Create a tab to load the bundle explorer page
          chrome.tabs.create({ url: bundleUrl, active: false }, (tab) => {
            // Listen for when the page is fully loaded
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
              if (tabId === tab.id && changeInfo.status === 'complete') {
                // Remove the listener to avoid multiple calls
                chrome.tabs.onUpdated.removeListener(listener);
                
                // Wait a bit more for any JavaScript to complete
                setTimeout(() => {
                  chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                      // Using your simpler matching algorithm
                      const divs = document.querySelectorAll('div');
                      for (let div of divs) {
                        if (div.textContent.trim() === 'Validator Tip') {
                          let nextDiv = div.nextElementSibling;
                          if (nextDiv && nextDiv.tagName === 'DIV') {
                            return nextDiv.textContent.trim();
                          }
                        }
                      }
                      return null;
                    }
                  }, (results) => {
                    // Get the result and close the tab
                    const validatorTip = results && results[0] && results[0].result ? results[0].result : null;
                    chrome.tabs.remove(tab.id);
                    
                    sendResponse({
                      success: true,
                      isBundle,
                      bundleUrl,
                      validatorTip
                    });
                  });
                }, 3000); // Additional wait time after page load completes
              }
            });
          });
          return true; // Keep the message channel open
        } else {
          sendResponse({ success: true, isBundle });
          return false;
        }
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
        return false;
      });
    return true; // Async response needs to return true
  }
});

// Listen for navigation events
chrome.webNavigation.onHistoryStateUpdated.addListener(
  function(details) {
    if (details.url.includes("solscan.io/tx/")) {
      //console.log('debug bg send checkJitoBundle for navigation')
      //chrome.tabs.sendMessage(details.tabId, { action: "checkJitoBundle" });
      chrome.tabs.sendMessage(details.tabId, { action: "checkJitoBundle" })
      .catch((error) => {
        //console.error("sendMessage failed:", error);
        // 等待 1 秒后重试
        setTimeout(() => {
          chrome.tabs.sendMessage(details.tabId, { action: "checkJitoBundle" })
            .catch((err) => console.error("Retry sendMessage failed:", err));
        }, 3000);
      });
    
    }
  },
  { url: [{ hostSuffix: "solscan.io" }] }
);

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes("solscan.io/tx/")) {
    //console.log('debug bg send checkJitoBundle for tab updates')
    //chrome.tabs.sendMessage(tabId, { action: "checkJitoBundle" });
    chrome.tabs.sendMessage(tabId, { action: "checkJitoBundle" })
    .catch((error) => {
      //console.error("sendMessage failed:", error);
      // 等待 1 秒后重试
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { action: "checkJitoBundle" })
          .catch((err) => console.error("Retry sendMessage failed:", err));
      }, 3000);
    });
  
  }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //console.log('fetching jito bundle...')
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
          
          // 获取 bundle 详细信息
          fetch(`https://bundles.jito.wtf/api/v1/bundles/bundle/${bundleId}`)
            .then(response => response.json())
            .then(bundleData => {
              if (Array.isArray(bundleData) && bundleData.length > 0) {
                const landedTipLamports = bundleData[0].landedTipLamports;
                // 将 lamports 转换为 SOL (1 SOL = 1,000,000,000 lamports)
                const solAmount = landedTipLamports / 1000000000;
                // 格式化 SOL 数量
                const formattedSol = Number(solAmount).toString();    
                const validatorTip = formattedSol   
                // 发送结果给 content.js                
                sendResponse({
                  success: true,
                  isBundle,
                  bundleUrl,
                  validatorTip,
                  bundleId
                });
              } else {
                const validatorTip = `null`;
                sendResponse({
                  success: true,
                  isBundle,
                  bundleUrl,
                  validatorTip,
                  bundleId
                });
              }
            })
            .catch(error => {
              const validatorTip = `null`;
              sendResponse({
                success: true,
                isBundle,
                bundleUrl,
                validatorTip,
                bundleId
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
  } else if (request.type === 'fetchValidator') {
    const targetURL = "https://v.0slot.trade/fetchvinfo.php";    
    // 设定允许的 User-Agent 和 Access Key
    const allowedUserAgent = "0slot.trade even faster solana transactions";
    const accessKey = "0slot.trade";
    const txSignature = request.signature;
    const apiUrl = `${targetURL}?access_key=${accessKey}&signature=${txSignature}`;
    fetch(apiUrl, {
      method: "GET",
      headers: {
        "X-Custom-Header": allowedUserAgent
    }})
      .then(response => response.json())
      .then(data => {
          let ip_address = "unknown";
          let city = "unknown";
          let country = "unknown";
          if (data.ip_address) {
            ip_address = data.ip_address          
          }
          if (data.city) {
            city = data.city
          }
          if (data.country) {
            country = data.country
          }
          
          sendResponse({
            success: true,
            ip_address,
            city,
            country
          });

          return true;
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
        return false;
      });
    return true;
  }
});
<<<<<<< HEAD
/**
 * ThreatIntel Scanner Pro - Background Service Worker
 */

const KEY_API = 'abuseIPDBKey';
const KEY_MODE = 'filteringMode'; 
const KEY_ALLOW = 'allowList';
const KEY_BLOCK = 'blockList';

/**
 * DNS Resolution Helper
 * Resolves a domain to an IP using Google DNS-over-HTTPS
 */
async function resolveDomainToIp(domain) {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
    const data = await response.json();
    if (data.Answer && data.Answer.length > 0) {
      // Find the first A record (IPv4 address)
      const aRecord = data.Answer.find(record => record.type === 1);
      return aRecord ? aRecord.data : null;
    }
    return null;
  } catch (err) {
    console.error("DNS Resolution error:", err);
    return null;
  }
}

/**
 * Validates if a specific URL is allowed to perform scans.
 */
async function isUrlAllowed(url) {
  if (!url || url.startsWith('chrome-extension://')) return true;

  const settings = await chrome.storage.local.get([KEY_MODE, KEY_ALLOW, KEY_BLOCK]);
  const mode = settings[KEY_MODE] || 'everywhere';
  
  if (mode === 'everywhere') return true;

  const list = mode === 'allow' ? (settings[KEY_ALLOW] || []) : (settings[KEY_BLOCK] || []);

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    const isOnList = list.some(item => {
      const cleanItem = item.toLowerCase().trim();
      return hostname === cleanItem || hostname.endsWith('.' + cleanItem);
    });

    if (mode === 'allow') return isOnList;
    if (mode === 'block') return !isOnList;
  } catch (e) {
    return false;
  }

  return true;
}

/**
 * Perform API lookup against AbuseIPDB
 */
async function checkIpReputation(ip) {
  const settings = await chrome.storage.local.get([KEY_API]);
  const apiKey = settings[KEY_API];

  if (!apiKey) throw new Error("API Key missing in settings.");

  const url = `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&verbose=true`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 
      'Key': apiKey, 
      'Accept': 'application/json' 
    }
  });

  if (response.status === 401) throw new Error("Invalid API Key.");
  if (response.status === 429) throw new Error("API Limit exceeded.");
  if (!response.ok) throw new Error("Reputation API Error.");

  const json = await response.json();
  const data = json.data;

  return { 
    success: true, 
    score: data.abuseConfidenceScore, 
    geo: data.countryCode, 
    isp: data.isp,
    domain: data.domain,
    usage: data.usageType
  };
}

/**
 * Unified Message Listener
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_SCOPE") {
    isUrlAllowed(sender.tab?.url).then(allowed => sendResponse({ allowed }));
    return true;
  }

  if (message.type === "CHECK_INDICATOR") {
    isUrlAllowed(sender.tab?.url).then(async (allowed) => {
      if (!allowed) {
        sendResponse({ success: false, error: "Out of scope" });
        return;
      }

      try {
        let targetIp = message.value;

        // If it's a domain/URL, resolve it to an IP first
        if (message.category === 'Domain' || message.category === 'URL') {
          // Extract hostname if it's a full URL

	let hostname;
	try {
          hostname = message.category === 'URL' 
            ? new URL(message.value).hostname 
            : message.value;
	} catch (e) {
  		sendResponse({ success: false, error: "Invalid URL format." });
  		return;
		}
            
          targetIp = await resolveDomainToIp(hostname);
          
          if (!targetIp) {
            throw new Error("Could not resolve domain to IP.");
          }
        }

        const result = await checkIpReputation(targetIp);
        // Add the resolved IP to the response for the UI tooltip
        result.resolvedIp = targetIp; 
        sendResponse(result);
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }
=======
/**
 * ThreatIntel Scanner Pro - Background Service Worker
 */

const KEY_API = 'abuseIPDBKey';
const KEY_MODE = 'filteringMode'; 
const KEY_ALLOW = 'allowList';
const KEY_BLOCK = 'blockList';

/**
 * DNS Resolution Helper
 * Resolves a domain to an IP using Google DNS-over-HTTPS
 */
async function resolveDomainToIp(domain) {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
    const data = await response.json();
    if (data.Answer && data.Answer.length > 0) {
      // Find the first A record (IPv4 address)
      const aRecord = data.Answer.find(record => record.type === 1);
      return aRecord ? aRecord.data : null;
    }
    return null;
  } catch (err) {
    console.error("DNS Resolution error:", err);
    return null;
  }
}

/**
 * Validates if a specific URL is allowed to perform scans.
 */
async function isUrlAllowed(url) {
  if (!url || url.startsWith('chrome-extension://')) return true;

  const settings = await chrome.storage.local.get([KEY_MODE, KEY_ALLOW, KEY_BLOCK]);
  const mode = settings[KEY_MODE] || 'everywhere';
  
  if (mode === 'everywhere') return true;

  const list = mode === 'allow' ? (settings[KEY_ALLOW] || []) : (settings[KEY_BLOCK] || []);

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    const isOnList = list.some(item => {
      const cleanItem = item.toLowerCase().trim();
      return hostname === cleanItem || hostname.endsWith('.' + cleanItem);
    });

    if (mode === 'allow') return isOnList;
    if (mode === 'block') return !isOnList;
  } catch (e) {
    return false;
  }

  return true;
}

/**
 * Perform API lookup against AbuseIPDB
 */
async function checkIpReputation(ip) {
  const settings = await chrome.storage.local.get([KEY_API]);
  const apiKey = settings[KEY_API];

  if (!apiKey) throw new Error("API Key missing in settings.");

  const url = `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&verbose=true`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 
      'Key': apiKey, 
      'Accept': 'application/json' 
    }
  });

  if (response.status === 401) throw new Error("Invalid API Key.");
  if (response.status === 429) throw new Error("API Limit exceeded.");
  if (!response.ok) throw new Error("Reputation API Error.");

  const json = await response.json();
  const data = json.data;

  return { 
    success: true, 
    score: data.abuseConfidenceScore, 
    geo: data.countryCode, 
    isp: data.isp,
    domain: data.domain,
    usage: data.usageType
  };
}

/**
 * Unified Message Listener
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_SCOPE") {
    isUrlAllowed(sender.tab?.url).then(allowed => sendResponse({ allowed }));
    return true;
  }

  if (message.type === "CHECK_INDICATOR") {
    isUrlAllowed(sender.tab?.url).then(async (allowed) => {
      if (!allowed) {
        sendResponse({ success: false, error: "Out of scope" });
        return;
      }

      try {
        let targetIp = message.value;

        // If it's a domain/URL, resolve it to an IP first
        if (message.category === 'Domain' || message.category === 'URL') {
          // Extract hostname if it's a full URL
          const hostname = message.category === 'URL' 
            ? new URL(message.value).hostname 
            : message.value;
            
          targetIp = await resolveDomainToIp(hostname);
          
          if (!targetIp) {
            throw new Error("Could not resolve domain to IP.");
          }
        }

        const result = await checkIpReputation(targetIp);
        // Add the resolved IP to the response for the UI tooltip
        result.resolvedIp = targetIp; 
        sendResponse(result);
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }
>>>>>>> 910a9e47d659ec1079730b112aba3c34bf106b25
});
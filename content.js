<<<<<<< HEAD
/**
 * ThreatIntel Scanner - Content Script
 * Responsible for UI injection and DOM monitoring.
 */

(function() {
  // Check scope before initializing anything
  chrome.runtime.sendMessage({ type: "CHECK_SCOPE" }, (response) => {
    if (response && response.allowed) {
      initScanner();
    } else {
      console.log("ThreatIntel Scanner: Domain not in scope. Disabling UI.");
    }
  });



function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}



  function initScanner() {
    console.log("ThreatIntel Scanner: Initialized on authorized domain.");

    // Optimized Regex for IoCs
    const IPV4_REGEX = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    
    // Improved IPv6 Regex to handle all standard compression and edge cases
    const IPV6_REGEX = /\b(?:(?:[0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\b/g;
    
    const URL_REGEX = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    const DOMAIN_REGEX = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,})\b/gi;

    const EXCLUDED_EXTENSIONS = ['.exe', '.dll', '.bin', '.msi', '.sh', '.bat', '.zip', '.rar', '.7z', '.tmp', '.log', '.sys', '.cfg'];

    let processedNodes = new WeakSet();
    let clearBtn = null;

    window.clearThreatIntelResults = function() {
      const badges = document.querySelectorAll('.ti-result-badge');
      badges.forEach(badge => {
        badge.className = badge.className.split(' ').filter(c => c.startsWith('ti-id-')).join(' ') + ' ti-result-badge ti-hidden';
        badge.textContent = '';
        badge.title = '';
        badge.style.display = 'none';
      });
      if (clearBtn) clearBtn.style.display = 'none';
    };

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "UI_COMMAND_CLEAR") window.clearThreatIntelResults();
    });

    function scanNode(root) {
      if (!root || processedNodes.has(root)) return;

      const walker = document.createTreeWalker(
        root, 
        NodeFilter.SHOW_TEXT, 
        {
          acceptNode: (node) => {
            const parent = node.parentNode;
            if (!parent || 
                ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'CANVAS', 'SELECT'].includes(parent.tagName) || 
                parent.isContentEditable || 
                parent.getAttribute('contenteditable') === 'true' ||
                parent.closest('[contenteditable="true"]') ||
                parent.closest('.hunting-search') ||
                parent.closest('.search-container') || 
                parent.closest('.ti-container') || 
                parent.closest('.ti-wrapper-node')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let node;
      const nodesToProcess = [];
      while (node = walker.nextNode()) {
        const val = node.nodeValue;
	IPV4_REGEX.lastIndex = 0;
	IPV6_REGEX.lastIndex = 0;
	URL_REGEX.lastIndex = 0;
	DOMAIN_REGEX.lastIndex = 0;
        if (IPV4_REGEX.test(val) || IPV6_REGEX.test(val) || URL_REGEX.test(val) || DOMAIN_REGEX.test(val)) {
          nodesToProcess.push(node);
        }
        [IPV4_REGEX, IPV6_REGEX, URL_REGEX, DOMAIN_REGEX].forEach(r => r.lastIndex = 0);
      }
      nodesToProcess.forEach(processTextNode);
    }

    function processTextNode(textNode) {
      const parent = textNode.parentNode;
      if (!parent) return;

      let content = textNode.nodeValue;
      const items = [];
      
      const extract = (regex, cat) => {
        regex.lastIndex = 0;
        const catCode = cat.slice(0, 3).toUpperCase();
        content = content.replace(regex, match => {
          if (cat === 'Domain') {
            const lowerMatch = match.toLowerCase();
            if (EXCLUDED_EXTENSIONS.some(ext => lowerMatch.endsWith(ext))) {
              return match; 
            }
          }
          const id = btoa(unescape(encodeURIComponent(match))).replace(/[^a-z0-9]/gi, '');
          items.push({ id, val: match, cat, placeholder: `__TI_${catCode}_${id}__` });
          return `__TI_${catCode}_${id}__`;
        });
      };

      extract(URL_REGEX, 'URL');
      extract(IPV4_REGEX, 'IP');
      extract(IPV6_REGEX, 'IP');
      extract(DOMAIN_REGEX, 'Domain');

      if (items.length === 0) return;

      const wrapper = document.createElement('span');
      wrapper.className = 'ti-wrapper-node';
      
      items.forEach(item => {
        const escapedPlaceholder = item.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const placeholderRegex = new RegExp(escapedPlaceholder, 'g');
        content = content.replace(placeholderRegex, createBadgeHtml(item.val, item.cat));
      });

      wrapper.innerHTML = content;
      wrapper.querySelectorAll('.ti-trigger').forEach(btn => btn.onclick = handleScanRequest);

      parent.replaceChild(wrapper, textNode);
      processedNodes.add(wrapper);
    }

    function createBadgeHtml(value, category) {
  	const safeId = btoa(unescape(encodeURIComponent(value))).replace(/[^a-z0-9]/gi, '');
  	const safe = escapeHtml(value);
  	return `<span class="ti-container">${safe}<button class="ti-trigger" data-value="${safe}" data-category="${category}" data-id="${safeId}">🔍</button><span class="ti-result-badge ti-id-${safeId} ti-hidden"></span></span>`;
	}

    function handleScanRequest(e) {
      e.preventDefault();
      const btn = e.currentTarget;
      const { value, category, id } = btn.dataset;
      const relatedBadges = document.querySelectorAll(`.ti-id-${id}`);

      showClearButton();

      relatedBadges.forEach(b => {
        b.style.display = 'inline-block';
        b.classList.remove('ti-hidden', 'ti-danger', 'ti-safe');
        b.innerText = "⏳";
      });

      chrome.runtime.sendMessage({ type: "CHECK_INDICATOR", value, category }, (response) => {
        relatedBadges.forEach(badge => {
          if (chrome.runtime.lastError || (response && !response.success)) {
            badge.innerText = "!";
            badge.title = response?.error || "Scanning restricted.";
            badge.classList.add('ti-hidden'); 
            badge.style.display = 'inline-block';
            return;
          }
          const score = response.score || 0;
          badge.innerText = `${score}%`;
          badge.className = `ti-result-badge ti-id-${id} ${score > 50 ? 'ti-danger' : 'ti-safe'}`;
          badge.title = `ISP: ${response.isp || 'N/A'}\nCountry: ${response.geo || 'N/A'}\nResolved: ${response.resolvedIp || 'N/A'}`;
          badge.style.display = 'inline-block';
        });
      });
    }

    function showClearButton() {
      if (!clearBtn) {
        clearBtn = document.createElement('button');
        clearBtn.id = 'ti-clear-all';
        clearBtn.innerHTML = '🗑️ Clear Results';
        clearBtn.onclick = window.clearThreatIntelResults;
        document.body.appendChild(clearBtn);
      }
      clearBtn.style.display = 'block';
    }

    const startExecution = () => {
      if (!document.body) return;
      scanNode(document.body);
      const observer = new MutationObserver(m => {
        for (const record of m) {
          for (const n of record.addedNodes) {
            if (n.nodeType === 1) scanNode(n);
            else if (n.nodeType === 3) scanNode(n.parentNode);
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };

    startExecution();
  }
=======
/**
 * ThreatIntel Scanner - Content Script
 * Responsible for UI injection and DOM monitoring.
 */

(function() {
  // Check scope before initializing anything
  chrome.runtime.sendMessage({ type: "CHECK_SCOPE" }, (response) => {
    if (response && response.allowed) {
      initScanner();
    } else {
      console.log("ThreatIntel Scanner: Domain not in scope. Disabling UI.");
    }
  });

  function initScanner() {
    console.log("ThreatIntel Scanner: Initialized on authorized domain.");

    // Optimized Regex for IoCs
    const IPV4_REGEX = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    
    // Improved IPv6 Regex to handle all standard compression and edge cases
    const IPV6_REGEX = /\b(?:(?:[0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\b/g;
    
    const URL_REGEX = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    const DOMAIN_REGEX = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,})\b/gi;

    const EXCLUDED_EXTENSIONS = ['.exe', '.dll', '.bin', '.msi', '.sh', '.bat', '.zip', '.rar', '.7z', '.tmp', '.log', '.sys', '.cfg'];

    let processedNodes = new WeakSet();
    let clearBtn = null;

    window.clearThreatIntelResults = function() {
      const badges = document.querySelectorAll('.ti-result-badge');
      badges.forEach(badge => {
        badge.className = badge.className.split(' ').filter(c => c.startsWith('ti-id-')).join(' ') + ' ti-result-badge ti-hidden';
        badge.textContent = '';
        badge.title = '';
        badge.style.display = 'none';
      });
      if (clearBtn) clearBtn.style.display = 'none';
    };

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "UI_COMMAND_CLEAR") window.clearThreatIntelResults();
    });

    function scanNode(root) {
      if (!root || processedNodes.has(root)) return;

      const walker = document.createTreeWalker(
        root, 
        NodeFilter.SHOW_TEXT, 
        {
          acceptNode: (node) => {
            const parent = node.parentNode;
            if (!parent || 
                ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'CANVAS', 'SELECT'].includes(parent.tagName) || 
                parent.isContentEditable || 
                parent.getAttribute('contenteditable') === 'true' ||
                parent.closest('[contenteditable="true"]') ||
                parent.closest('.hunting-search') ||
                parent.closest('.search-container') || 
                parent.closest('.ti-container') || 
                parent.closest('.ti-wrapper-node')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let node;
      const nodesToProcess = [];
      while (node = walker.nextNode()) {
        const val = node.nodeValue;
        if (IPV4_REGEX.test(val) || IPV6_REGEX.test(val) || URL_REGEX.test(val) || DOMAIN_REGEX.test(val)) {
          nodesToProcess.push(node);
        }
        [IPV4_REGEX, IPV6_REGEX, URL_REGEX, DOMAIN_REGEX].forEach(r => r.lastIndex = 0);
      }
      nodesToProcess.forEach(processTextNode);
    }

    function processTextNode(textNode) {
      const parent = textNode.parentNode;
      if (!parent) return;

      let content = textNode.nodeValue;
      const items = [];
      
      const extract = (regex, cat) => {
        regex.lastIndex = 0;
        const catCode = cat.slice(0, 3).toUpperCase();
        content = content.replace(regex, match => {
          if (cat === 'Domain') {
            const lowerMatch = match.toLowerCase();
            if (EXCLUDED_EXTENSIONS.some(ext => lowerMatch.endsWith(ext))) {
              return match; 
            }
          }
          const id = btoa(unescape(encodeURIComponent(match))).replace(/[^a-z0-9]/gi, '');
          items.push({ id, val: match, cat, placeholder: `__TI_${catCode}_${id}__` });
          return `__TI_${catCode}_${id}__`;
        });
      };

      extract(URL_REGEX, 'URL');
      extract(IPV4_REGEX, 'IP');
      extract(IPV6_REGEX, 'IP');
      extract(DOMAIN_REGEX, 'Domain');

      if (items.length === 0) return;

      const wrapper = document.createElement('span');
      wrapper.className = 'ti-wrapper-node';
      
      items.forEach(item => {
        const escapedPlaceholder = item.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const placeholderRegex = new RegExp(escapedPlaceholder, 'g');
        content = content.replace(placeholderRegex, createBadgeHtml(item.val, item.cat));
      });

      wrapper.innerHTML = content;
      wrapper.querySelectorAll('.ti-trigger').forEach(btn => btn.onclick = handleScanRequest);

      parent.replaceChild(wrapper, textNode);
      processedNodes.add(wrapper);
    }

    function createBadgeHtml(value, category) {
      const safeId = btoa(unescape(encodeURIComponent(value))).replace(/[^a-z0-9]/gi, '');
      return `<span class="ti-container">${value}<button class="ti-trigger" data-value="${value}" data-category="${category}" data-id="${safeId}">🔍</button><span class="ti-result-badge ti-id-${safeId} ti-hidden"></span></span>`;
    }

    function handleScanRequest(e) {
      e.preventDefault();
      const btn = e.currentTarget;
      const { value, category, id } = btn.dataset;
      const relatedBadges = document.querySelectorAll(`.ti-id-${id}`);

      showClearButton();

      relatedBadges.forEach(b => {
        b.style.display = 'inline-block';
        b.classList.remove('ti-hidden', 'ti-danger', 'ti-safe');
        b.innerText = "⏳";
      });

      chrome.runtime.sendMessage({ type: "CHECK_INDICATOR", value, category }, (response) => {
        relatedBadges.forEach(badge => {
          if (chrome.runtime.lastError || (response && !response.success)) {
            badge.innerText = "!";
            badge.title = response?.error || "Scanning restricted.";
            badge.classList.add('ti-hidden'); 
            badge.style.display = 'inline-block';
            return;
          }
          const score = response.score || 0;
          badge.innerText = `${score}%`;
          badge.className = `ti-result-badge ti-id-${id} ${score > 50 ? 'ti-danger' : 'ti-safe'}`;
          badge.title = `ISP: ${response.isp || 'N/A'}\nCountry: ${response.geo || 'N/A'}\nResolved: ${response.resolvedIp || 'N/A'}`;
          badge.style.display = 'inline-block';
        });
      });
    }

    function showClearButton() {
      if (!clearBtn) {
        clearBtn = document.createElement('button');
        clearBtn.id = 'ti-clear-all';
        clearBtn.innerHTML = '🗑️ Clear Results';
        clearBtn.onclick = window.clearThreatIntelResults;
        document.body.appendChild(clearBtn);
      }
      clearBtn.style.display = 'block';
    }

    const startExecution = () => {
      if (!document.body) return;
      scanNode(document.body);
      const observer = new MutationObserver(m => {
        for (const record of m) {
          for (const n of record.addedNodes) {
            if (n.nodeType === 1) scanNode(n);
            else if (n.nodeType === 3) scanNode(n.parentNode);
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };

    startExecution();
  }
>>>>>>> 910a9e47d659ec1079730b112aba3c34bf106b25
})();
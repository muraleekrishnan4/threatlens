/**
 * Professional Options Controller for ThreatIntel Scanner Pro.
 * Manages extension scope settings and implements advanced Bulk Scan functionality.
 */

// 1. Settings Management

/**
 * We now store separate lists for Allow and Block modes 
 * so the textbox updates when the radio button changes.
 */
let currentSettings = {
  allowList: [],
  blockList: []
};

const saveOptions = () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  const filterMode = document.querySelector('input[name="filterMode"]:checked').value;
  
  const filterList = document.getElementById('filterList').value
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Update local cache before saving
  if (filterMode === 'allow') {
    currentSettings.allowList = filterList;
  } else {
    currentSettings.blockList = filterList;
  }

  // Determine if we should be in a "Global" state (no restrictions)
  // If the list for the current mode is empty, we signal to background.js to allow all
  const isListEmpty = filterList.length === 0;

  chrome.storage.local.set({
    abuseIPDBKey: apiKey,
    filteringMode: isListEmpty ? 'everywhere' : filterMode, 
    allowList: currentSettings.allowList,
    blockList: currentSettings.blockList,
    // We explicitly store the intended mode even if empty so UI stays consistent
    intendedMode: filterMode 
  }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Settings saved successfully!';
    status.className = 'success';
    setTimeout(() => { 
      status.textContent = ''; 
      status.className = '';
    }, 2500);
  });
};

const restoreOptions = () => {
  chrome.storage.local.get({
    abuseIPDBKey: '',
    intendedMode: 'allow',
    allowList: [],
    blockList: []
  }, (items) => {
    currentSettings.allowList = items.allowList;
    currentSettings.blockList = items.blockList;
    
    document.getElementById('apiKey').value = items.abuseIPDBKey;
    
    // Restore the intended UI mode (Allow or Block)
    const radio = document.querySelector(`input[name="filterMode"][value="${items.intendedMode}"]`);
    if (radio) radio.checked = true;

    // Load the correct list into the textbox based on the saved intended mode
    updateTextbox(items.intendedMode);
  });
};

const updateTextbox = (mode) => {
  const list = mode === 'allow' ? currentSettings.allowList : currentSettings.blockList;
  document.getElementById('filterList').value = list.join('\n');
};

// Event listener for radio button toggle to swap textbox content
document.querySelectorAll('input[name="filterMode"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    updateTextbox(e.target.value);
  });
});

/**
 * Utility to unmask de-fanged indicators
 */
const unmaskIndicator = (val) => {
  return val.replace(/\[\.\]/g, '.').replace(/\(\.\)/g, '.').replace(/hxxp/gi, 'http');
};

/**
 * DNS Resolution Helper
 */
const resolveDomain = async (domain) => {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
    const data = await response.json();
    if (data.Answer && data.Answer.length > 0) {
      const aRecord = data.Answer.find(record => record.type === 1);
      return aRecord ? aRecord.data : null;
    }
    return null;
  } catch (err) {
    console.error("DNS Resolution error:", err);
    return null;
  }
};

/**
 * Bulk Processing Logic
 */
const runBulkCheck = async () => {
  const bulkInput = document.getElementById('bulkInput').value;
  const resultsTable = document.getElementById('bulkResultsBody');
  const bulkStatus = document.getElementById('bulkStatus');
  
  const indicators = bulkInput.split(/[\n,\s]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  if (indicators.length === 0) {
    bulkStatus.textContent = "Please enter at least one IP or Domain.";
    return;
  }

  bulkStatus.textContent = `Processing ${indicators.length} items...`;
  resultsTable.innerHTML = ''; 

  for (const rawItem of indicators) {
    const item = unmaskIndicator(rawItem);
    const IP_REGEX = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    const isIP = IP_REGEX.test(item);
    const category = isIP ? 'IP' : 'Domain';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item} ${item !== rawItem ? `<small style="color:gray">(${rawItem})</small>` : ''}</td>
      <td>${category}</td>
      <td class="status-cell">⏳ Loading...</td>
    `;
    resultsTable.appendChild(row);

    const statusCell = row.querySelector('.status-cell');
    let queryValue = item;

    if (!isIP) {
      statusCell.textContent = "🔍 Resolving DNS...";
      const resolvedIp = await resolveDomain(item);
      if (!resolvedIp) {
        statusCell.textContent = "Error: DNS Resolve Failed";
        statusCell.style.color = "#d93025";
        continue; 
      }
      queryValue = resolvedIp;
      statusCell.textContent = `⏳ Scanning (${resolvedIp})...`;
    }

    chrome.runtime.sendMessage({ 
      type: "CHECK_INDICATOR", 
      value: queryValue, 
      category: 'IP' 
    }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        statusCell.textContent = response?.error || "Reputation Error";
        statusCell.style.color = "#d93025";
      } else {
        const score = response.score || 0;
        const country = response.geo || 'N/A';
        const isp = response.isp || 'N/A';
        
        statusCell.textContent = `${score}% [${country}] (${isp})`;
        statusCell.style.color = score > 50 ? "#d93025" : "#1e8e3e";
        if (!isIP) {
          statusCell.title = `Resolved IP: ${queryValue}`;
        }
      }
    });

    await new Promise(r => setTimeout(r, 400));
  }

  bulkStatus.textContent = "Bulk check completed.";
};

const clearBulk = () => {
  document.getElementById('bulkInput').value = '';
  document.getElementById('bulkResultsBody').innerHTML = '';
  document.getElementById('bulkStatus').textContent = '';
};

// Event Listeners
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

if (document.getElementById('runBulk')) {
  document.getElementById('runBulk').addEventListener('click', runBulkCheck);
}
if (document.getElementById('clearBulk')) {
  document.getElementById('clearBulk').addEventListener('click', clearBulk);
}
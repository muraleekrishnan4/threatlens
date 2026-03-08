# 🛡️ ThreatLens

<p align="center">
  <img src="assets/icon.png" alt="ThreatLens" width="96"/>
</p>

<p align="center">
  <b>A professional Chrome extension for real-time IoC detection and IP reputation scanning.</b><br/>
  Automatically highlights IPs, domains, and URLs on any webpage and checks them against AbuseIPDB.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/manifest-v3-blue?style=flat-square" alt="Manifest V3"/>
  <img src="https://img.shields.io/badge/version-1.3-green?style=flat-square" alt="Version"/>
  <img src="https://img.shields.io/badge/license-MIT-orange?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/browser-Chrome-yellow?style=flat-square" alt="Chrome"/>
</p>

---

## ✨ Features

- **Automatic IoC Detection** — Scans page text for IPv4, IPv6, domains, and URLs in real time
- **AbuseIPDB Integration** — One-click reputation check with abuse confidence score, ISP, and country
- **Bulk Scanner** — Paste a list of IPs/domains in the options page and scan them all at once
- **De-fanging Support** — Automatically unmasks `hxxp://`, `[.]`, `(.)` indicators
- **Scope Control** — Run only on allowlisted sites or block specific domains
- **Non-destructive UI** — Injects badges without breaking page layout or editable fields
- **MutationObserver** — Detects and scans dynamically loaded content automatically

---

## 📸 Screenshot

> Badges appear inline next to detected indicators. Click 🔍 to scan, see the score and metadata in a tooltip.

<div style="display: flex; justify-content: center; align-items: flex-start; gap: 20px; flex-wrap: wrap; text-align: center;">

  <div>
    <p>Inline Scanning</p>
    <img src="https://github.com/user-attachments/assets/9e675df2-6b55-4a1e-942c-c3ec4422eee9" width="400"/>
  </div>
<br>
  <div>
    <p>Options Page</p>
    <img src="https://github.com/user-attachments/assets/b4f4e1f7-dd37-4f3a-bc8d-e46d59e6c568" height="400"/>
    <img src="https://github.com/user-attachments/assets/74f7f835-d92e-47ed-9b7d-9424fa80bb67" height="400"/>
  </div>

</div>

| Inline Scanning | Options Page |
|---|---|
| IPs and domains are highlighted with a subtle badge | Configure API key, scope, and run bulk scans |

---

## 🚀 Installation

### From Source (Developer Mode)

1. Clone the repository:
   ```bash
   git clone https://github.com/muraleekrishnan4/threatlens.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top-right)

4. Click **Load unpacked** and select the cloned folder

5. Open the extension **Options** page and enter your [AbuseIPDB API key](https://www.abuseipdb.com/account/api)

---

## ⚙️ Configuration

Open the extension options page (right-click the extension icon → Options):

| Setting | Description |
|---|---|
| **API Key** | Your AbuseIPDB v2 API key (free tier supported) |
| **Allowlist mode** | Extension only runs on domains you specify |
| **Blocklist mode** | Extension runs everywhere except specified domains |
| **Bulk Scanner** | Paste multiple IPs/domains for batch reputation checks |

---

## 🔑 Getting an API Key

1. Register for a free account at [abuseipdb.com](https://www.abuseipdb.com)
2. Go to **Account → API** and create a key
3. The free tier allows **1,000 checks/day** — sufficient for typical use

---

## 🏗️ Project Structure

```
threat-lens/
├── manifest.json       # Chrome Extension Manifest V3
├── background.js       # Service worker: scope filtering, DNS resolution, API calls
├── content.js          # DOM scanning, badge injection, MutationObserver
├── options.html        # Settings & bulk scan UI
├── options.js          # Options logic and bulk scan controller
├── styles.css          # Badge and UI styles
├── icon.png            # Extension icon (16, 48, 128px)
└── assets/
    └── icon.png        # Source PNG icon
```

---

## 🧠 How It Works

1. **Scope Check** — On page load, `content.js` asks `background.js` if the current URL is in scope
2. **DOM Scan** — A `TreeWalker` traverses all visible text nodes, skipping scripts, inputs, and editable areas
3. **Regex Matching** — Text is matched against patterns for IPv4, IPv6, URLs, and domains
4. **Badge Injection** — Matched indicators are wrapped in a `<span>` with a 🔍 trigger button
5. **Reputation Lookup** — On click, `background.js` resolves domains via Google DNS-over-HTTPS, then queries AbuseIPDB
6. **Result Display** — A colored badge shows the abuse confidence score (🟢 safe / 🔴 danger)

---

## 🔒 Permissions

| Permission | Reason |
|---|---|
| `storage` | Save API key and filter settings locally |
| `activeTab` | Read the current tab's URL for scope checking |
| `scripting` | Inject content scripts |
| `contextMenus` | Future: right-click scan support |
| `https://api.abuseipdb.com/*` | Reputation API calls |
| `https://dns.google/*` | DNS-over-HTTPS for domain resolution |

No data is sent anywhere except AbuseIPDB (for lookups you explicitly trigger) and Google DNS (for domain resolution). No telemetry, no tracking.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue before submitting a pull request for significant changes.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [AbuseIPDB](https://www.abuseipdb.com) for the threat intelligence API
- [Google DNS-over-HTTPS](https://developers.google.com/speed/public-dns/docs/doh) for domain resolution

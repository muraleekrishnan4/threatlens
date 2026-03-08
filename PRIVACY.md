\# Privacy Policy — ThreatLens



\*\*Last updated: March 2026\*\*



\## Overview



ThreatLens is a Chrome extension that scans web pages for IP addresses, domains, 

and URLs, and checks their reputation using the AbuseIPDB API. 

This policy explains what data is handled and how.



\## Data We Collect



ThreatLens does \*\*not\*\* collect, store, or transmit any personal user data.



\## Data Handled Locally



The following data is processed \*\*locally on your device only\*\* and is never 

sent to the developer:



\- \*\*AbuseIPDB API Key\*\* — Stored locally using Chrome's `storage` API. 

&nbsp; Only transmitted directly to AbuseIPDB when you trigger a scan.

\- \*\*Filter lists\*\* — Your allowlist/blocklist preferences are stored locally 

&nbsp; and never leave your device.



\## Third-Party Services



ThreatLens interacts with the following external services \*\*only when you 

explicitly trigger a scan\*\*:



| Service | Purpose | Privacy Policy |

|---|---|---|

| AbuseIPDB | IP/domain reputation lookup | https://www.abuseipdb.com/privacy-policy |

| Google DNS-over-HTTPS | Resolve domain names to IP addresses | https://policies.google.com/privacy |



No data is sent to these services automatically — only when you click the 

scan button.



\## Permissions



| Permission | Why It's Needed |

|---|---|

| `storage` | Save your API key and settings locally |

| `activeTab` | Check if the current site is in your configured scope |

| `scripting` | Scan page text for IoC indicators |



\## Changes to This Policy



If this policy changes, the updated version will be committed to this 

repository with a new date.



\## Contact



If you have any questions, open an issue at:

https://github.com/muraleekrishnan4/threatlens/issues




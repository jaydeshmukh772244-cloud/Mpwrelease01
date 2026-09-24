---
name: Expo PDF sharing
description: Native Expo PDF export behavior for reports
---

For native Expo reports, pass the URI returned by `expo-print` `printToFileAsync` directly to `expo-sharing`; if sharing fails, fall back to `printAsync` so Android can use its system “Save as PDF” flow. Avoid an extra `expo-file-system` copy or rename step unless there is a verified need.

**Why:** The extra cache-file operation can fail on a device even after PDF generation succeeds, and some Android environments can also reject the share intent. Both cases otherwise surface as the app's generic PDF error alert.

**How to apply:** Keep web exports on the browser print flow. On native, try `printToFileAsync` followed by `shareAsync(uri, ...)`, then use `printAsync({ html, orientation: 'landscape' })` as the user-visible fallback; catch and log only if both paths fail.
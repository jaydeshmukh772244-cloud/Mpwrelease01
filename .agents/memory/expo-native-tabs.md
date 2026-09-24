---
name: Expo native tabs exports
description: The installed Expo Router version exposes native tab icons and labels as nested Trigger components.
---

Use `NativeTabs.Trigger.Icon` and `NativeTabs.Trigger.Label` inside each trigger rather than importing standalone `Icon` and `Label` exports from the unstable native-tabs module.

**Why:** The standalone exports were not present in the Expo Router version installed in this workspace, which blocked TypeScript validation.

**How to apply:** When editing the mobile tab layout, verify the installed module typings and keep the nested API unless the Expo Router version is intentionally upgraded.
import "dotenv/config";
import { isTextbeeConfigured, sendSMS, formatPhoneNumber } from "../src/services/textbeeService.js";
import {
  getAdminMobileNumber,
  sendCollectorAlert,
  sendAdminCriticalAlert,
  sendAdminEscalationAlert,
  sendAdminDeviceOfflineAlert,
} from "../src/services/smsNotificationService.js";
import { alertConfig } from "../src/config/alertConfig.js";

async function runSmsDiagnostics() {
  console.log("==========================================");
  console.log("📡 EcoTrack SMS Gateway Diagnostics & Scenarios");
  console.log("==========================================");

  // 1. Configuration Check
  console.log("\n[1] Checking Configuration...");
  const configured = isTextbeeConfigured();
  console.log(`- TextBee Configured: ${configured ? "✅ YES" : "❌ NO"}`);
  console.log(`- Alert System Disabled: ${alertConfig.disableAllAlerts ? "❌ YES (Alerts Suppressed)" : "✅ NO (Alerts Enabled)"}`);

  const adminMobile = await getAdminMobileNumber();
  console.log(`- Admin Mobile Number: ${adminMobile ? adminMobile : "⚠️ NOT SET"}`);

  if (!configured) {
    console.error("\n❌ TextBee credentials are missing in backend/.env!");
    console.error("Please ensure TEXTBEE_API_KEY and TEXTBEE_DEVICE_ID are defined.");
    process.exit(1);
  }

  // 2. Format Test
  console.log("\n[2] Phone Number Formatting Test...");
  const sampleNum = adminMobile || "7019311747";
  const formatted = formatPhoneNumber(sampleNum);
  console.log(`- Raw: "${sampleNum}" -> Formatted: "${formatted}"`);

  // 3. Direct SMS Dispatch Test
  console.log(`\n[3] Testing Direct SMS Dispatch to ${sampleNum}...`);
  const testMessage = `[EcoTrack Test] SMS notification test at ${new Date().toLocaleTimeString()}. System is active.`;
  const sendRes = await sendSMS(sampleNum, testMessage);
  console.log("- Send Result:", sendRes);

  // 4. Mock Bin Scenarios
  const mockBin = {
    id: "BIN001",
    location: "College Library",
    fillLevel: 96,
  };
  const mockCollector = {
    name: "Default Collector",
    mobile: sampleNum,
  };

  console.log("\n[4] Scenario 1: Collector Critical Alert (95%+)...");
  const colRes = await sendCollectorAlert({
    bin: mockBin,
    fillLevel: 96,
    alertType: "COLLECTION_REQUIRED",
    collector: mockCollector,
  });
  console.log("- Collector Alert Result:", colRes.status, colRes.error || "");

  console.log("\n[5] Scenario 2: Admin Critical Full Alert (100%)...");
  const adminRes = await sendAdminCriticalAlert({
    bin: { ...mockBin, fillLevel: 100 },
    fillLevel: 100,
    collectorName: mockCollector.name,
  });
  console.log("- Admin Critical Result:", adminRes.status, adminRes.error || "");

  console.log("\n==========================================");
  console.log("🎉 SMS Scenarios Verification Complete");
  console.log("==========================================");
}

runSmsDiagnostics().catch((err) => {
  console.error("Fatal error during SMS diagnostics:", err);
  process.exit(1);
});


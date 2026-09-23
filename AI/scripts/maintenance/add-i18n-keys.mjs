import fs from 'fs';

const additions = {
  'src/i18n/hi.ts': `
  honorificTitle: "आप मुझे किस तरह संबोधित करना चाहेंगे?",
  honorificAriaLabel: "सम्बोधन चुनें",
  controlCenterSubtitle: "इवेंट और अनुमतियाँ",
  pendingApprovalsLabel: "लंबित अनुमोदन",
  noPendingApprovals: "कोई अनुमोदन लंबित नहीं है",
  recentEventsLabel: "हाल की कार्य गतिविधियाँ",
  noEvents: "अभी तक कोई घटना नहीं",
  permissionAuditLabel: "अनुमति ऑडिट",
  noAuditEntries: "अभी तक कोई ऑडिट प्रविष्टि नहीं",
  apiKeyPrompt: "इस अनुमोदन पर निर्णय लेने के लिए x-api-key दर्ज करें:",
  decisionFailed: "असफल",
  connectFailed: "सर्वर से कनेक्ट नहीं हो सका",
  approveAction: "स्वीकृत करें",
  rejectAction: "अस्वीकार करें",
`,
  'src/i18n/ar.ts': `
  honorificTitle: "كيف تفضل أن أخاطبك؟",
  honorificAriaLabel: "اختر لقب المخاطبة",
  controlCenterSubtitle: "الأحداث والأذونات",
  pendingApprovalsLabel: "الموافقات المعلقة",
  noPendingApprovals: "لا توجد موافقات معلقة",
  recentEventsLabel: "أحداث المهام الأخيرة",
  noEvents: "لا توجد أحداث بعد",
  permissionAuditLabel: "سجل تدقيق الأذونات",
  noAuditEntries: "لا توجد إدخالات تدقيق بعد",
  apiKeyPrompt: "أدخل x-api-key لاتخاذ قرار بشأن هذه الموافقة:",
  decisionFailed: "فشل",
  connectFailed: "تعذر الاتصال بالخادم",
  approveAction: "موافقة",
  rejectAction: "رفض",
`,
};

for (const [file, block] of Object.entries(additions)) {
  let text = fs.readFileSync(file, 'utf8');
  const lastBrace = text.lastIndexOf('};');
  if (lastBrace === -1) {
    console.log(`!!! Could not find closing "};" in ${file} — skipped`);
    continue;
  }
  text = text.slice(0, lastBrace) + block + text.slice(lastBrace);
  fs.writeFileSync(file, text, 'utf8');
  console.log(`updated ${file}`);
}

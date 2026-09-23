import fs from 'fs';

const keys = [
  'honorificTitle','honorificAriaLabel','controlCenterSubtitle','pendingApprovalsLabel',
  'noPendingApprovals','recentEventsLabel','noEvents','permissionAuditLabel',
  'noAuditEntries','apiKeyPrompt','decisionFailed','connectFailed',
  'approveAction','rejectAction'
];

const content = fs.readFileSync('src/i18n/en.ts', 'utf8');

for (const k of keys) {
  const re = new RegExp(`\\b${k}\\s*:\\s*(.+?),?\\s*$`, 'm');
  const match = content.match(re);
  console.log(`${k}: ${match ? match[1] : '!!! NOT FOUND IN en.ts !!!'}`);
}

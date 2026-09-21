export type StatusCode =
  | "ONLINE" | "READY" | "ACTIVE" | "DEVELOPING"
  | "OFFLINE" | "ERROR" | "LOADING" | "UPDATING"
  | "TIMEOUT" | "UNKNOWN" | "HEALTHY" | "DEGRADED";

export interface StatusLabel { code: StatusCode; km: string; en: string; color: string; }

export const STATUS_LABELS: Record<StatusCode, StatusLabel> = {
  ONLINE:     { code: "ONLINE",     km: "កំពុងដំណើរការ", en: "The system is running and available.", color: "#22d3ee" },
  READY:      { code: "READY",      km: "រួចរាល់", en: "The feature is prepared and ready for use.", color: "#38bdf8" },
  ACTIVE:     { code: "ACTIVE",     km: "កំពុងសកម្ម", en: "The feature is currently active or being used.", color: "#4ade80" },
  DEVELOPING: { code: "DEVELOPING", km: "កំពុងអភិវឌ្ឍ", en: "The feature is under development and gaining additional capabilities.", color: "#facc15" },
  OFFLINE:    { code: "OFFLINE",    km: "មិនដំណើរការ", en: "The feature or service is currently unavailable.", color: "#94a3b8" },
  ERROR:      { code: "ERROR",      km: "មានបញ្ហា", en: "The system has detected an error that requires investigation.", color: "#f87171" },
  LOADING:    { code: "LOADING",    km: "កំពុងផ្ទុក", en: "The system is loading or initializing required resources.", color: "#c084fc" },
  UPDATING:   { code: "UPDATING",   km: "កំពុងធ្វើបច្ចុប្បន្នភាព", en: "The system is updating data or system components.", color: "#fb923c" },
  TIMEOUT:    { code: "TIMEOUT",    km: "អស់ពេលរង់ចាំ", en: "No response was received within the allowed time.", color: "#fbbf24" },
  UNKNOWN:    { code: "UNKNOWN",    km: "មិនទាន់ដឹងស្ថានភាព", en: "There is not enough information to determine the status.", color: "#64748b" },
  HEALTHY:    { code: "HEALTHY",    km: "ធម្មតា", en: "All required core services respond.", color: "#4ade80" },
  DEGRADED:   { code: "DEGRADED",   km: "ថយចុះ", en: "The system is usable, but some services have problems.", color: "#fb923c" },
};

export interface StatusCard {
  id: string; nameKm: string; nameEn: string;
  descKm: string; descEn: string;
  extra?: { labelEn: string; value: string }[];
  commands?: string[];
}

export const AI_NAME = "𝒦𝒽𝑜𝑒𝓂 𝒮𝑜𝓀𝓈𝒾𝓋𝓊𝓉𝒽𝒶 AI";
export const PAGE_TITLE_KM = "ខួរក្បាល AI";
export const PAGE_TITLE_EN = "AI BRAIN";
export const LAST_UPDATED = "2026-09-21";

export const AI_STATUS_CARDS: StatusCard[] = [
  { id: "core", nameKm: "ខួរចម្បង AI", nameEn: "AI CORE",
    descKm: "ខួរចម្បង AI កំពុងដំណើរការធម្មតា និងអាចទទួលសំណួរ ដំណើរការព័ត៌មាន និងភ្ជាប់ទៅមុខងារផ្សេងៗរបស់ប្រព័ន្ធ។",
    descEn: "The AI Core is running normally and is ready to process requests, conversations, and connected system functions." },
  { id: "memory", nameKm: "ការចងចាំ", nameEn: "MEMORY",
    descKm: "ប្រព័ន្ធចងចាំត្រូវបានរៀបចំរួចរាល់សម្រាប់រក្សាទុក និងយកព័ត៌មាននៃការសន្ទនាមកប្រើប្រាស់។",
    descEn: "The memory system is ready to store and retrieve supported conversation information." },
  { id: "learning", nameKm: "ការរៀន", nameEn: "LEARNING",
    descKm: "ប្រព័ន្ធរៀនអាចទទួលចំណេះដឹងដែលបានបញ្ចូលដោយអ្នកប្រើ តាមរយៈមុខងារ /learn ហើយអាចយកចំណេះដឹងនោះមកប្រើនៅពេលក្រោយ។",
    descEn: "The learning system can accept approved knowledge through /learn and use the stored knowledge in future interactions." },
  { id: "knowledge", nameKm: "មូលដ្ឋានចំណេះដឹង", nameEn: "KNOWLEDGE",
    descKm: "ប្រព័ន្ធចំណេះដឹងត្រូវបានរៀបចំសម្រាប់ផ្ទុក និងរៀបចំព័ត៌មានតាមប្រភេទ ដើម្បីឱ្យ AI អាចស្វែងរក និងប្រើប្រាស់បាន។",
    descEn: "The knowledge system is prepared to organize, store, retrieve, and use structured information." },
  { id: "english-brain", nameKm: "ខួរភាសាអង់គ្លេស", nameEn: "ENGLISH BRAIN",
    descKm: "ខួរភាសាអង់គ្លេសកំពុងត្រូវបានបង្កើត និងបន្ថែមចំណេះដឹងអំពី vocabulary, grammar, conversation, translation និងការកែសម្រួលប្រយោគ។",
    descEn: "The English Brain is being developed with vocabulary, grammar, conversation, translation, and English correction capabilities." },
  { id: "khmer-brain", nameKm: "ខួរភាសាខ្មែរ", nameEn: "KHMER BRAIN",
    descKm: "ខួរភាសាខ្មែរអាចទទួលការសន្ទនា យល់ពាក្យបញ្ជា និងប្រើចំណេះដឹងដែលបានរៀនជាភាសាខ្មែរ។",
    descEn: "The Khmer Brain supports Khmer conversation, command handling, and the use of learned Khmer knowledge." },
  { id: "tools", nameKm: "ឧបករណ៍ AI", nameEn: "TOOLS",
    descKm: "ឧបករណ៍ AI ដែលបានភ្ជាប់អាចប្រើសម្រាប់ស្កេនកូដ អានឯកសារ ពិនិត្យបញ្ហា និងគ្រប់គ្រងចំណេះដឹង។",
    descEn: "The connected AI tools are ready for code scanning, file reading, diagnostics, and knowledge management.",
    commands: ["/scan", "/read", "/funcs", "/check", "/help", "/learn", "/learned", "/forget"] },
  { id: "api", nameKm: "ប្រព័ន្ធ API", nameEn: "API",
    descKm: "API server កំពុងដំណើរការ និងអាចទទួលសំណើពី UI ឬ client ដែលបានភ្ជាប់។",
    descEn: "The API server is running and can receive requests from connected clients or the user interface.",
    extra: [{ labelEn: "Endpoint", value: "POST /api/chat" }] },
  { id: "model", nameKm: "ម៉ូដែល AI", nameEn: "MODEL",
    descKm: "ប្រព័ន្ធកំពុងប្រើ KHOEM local model សម្រាប់ដំណើរការសំណួរ និងការសន្ទនា។",
    descEn: "The system is currently using the KHOEM local model for request processing and conversation.",
    extra: [{ labelEn: "Provider", value: "KHOEM" }, { labelEn: "Model", value: "khoem-local" }] },
  { id: "session", nameKm: "សម័យសន្ទនា", nameEn: "SESSION",
    descKm: "Session បច្ចុប្បន្នកំពុងរក្សាទុកបរិបទនៃការសន្ទនា ដើម្បីឱ្យ AI អាចបន្តការសន្ទនាបានជាប់លាប់។",
    descEn: "The current session maintains supported conversation context so the AI can continue the interaction consistently.",
    extra: [{ labelEn: "Session", value: "default" }] },
];

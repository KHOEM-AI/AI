// Company, entertainment, sea/boat and hotel assets + corporate character templates. Data only, modest depictions.
const A = (group, subgroup, nameKm, nameEn, appearance, tags = "", alcohol = false) => ({
  group, subgroup, nameKm, nameEn, region: "asia", country: "KH", appearance,
  actions: [], tags: ["extra2", ...tags.split(",").filter(Boolean)], alcohol,
});

export const EXTRA_ASSETS = [
  // ក្រុមហ៊ុន៖ អគារ និងបន្ទប់
  A("buildings", "office", "អគារក្រុមហ៊ុនកញ្ចក់", "Glass office tower", "អគារខ្ពស់កញ្ចក់ខៀវ មានឡូហ្គោលើជាន់ក្រោម", "company"),
  A("buildings", "office", "កន្លែងទទួលភ្ញៀវក្រុមហ៊ុន", "Company reception", "តុទទួលភ្ញៀវពណ៌ស ឡូហ្គោធំលើជញ្ជាំង សាឡុងរង់ចាំ", "company"),
  A("buildings", "office", "ការិយាល័យទូទៅ", "Open office", "តុធ្វើការជួរៗ កុំព្យូទ័រ បុគ្គលិកអង្គុយផ្ទាល់មុខ", "company"),
  A("buildings", "office", "ការិយាល័យប្រធាន", "Executive office", "តុធំឈើ កៅអីស្បែក បង្អួចកញ្ចក់ធំមើលទៅទីក្រុង", "company,rich"),
  A("buildings", "meeting", "បន្ទប់ប្រជុំក្រុមហ៊ុន", "Boardroom", "តុប្រជុំវែង កៅអីស្បែកជុំវិញ ទូរទស្សន៍អេក្រង់ធំនៅពីក្រោយខ្នងប្រធាន បញ្ចាំងស្លាយ", "company,meeting"),
  A("buildings", "meeting", "ការរៀបអង្គុយប្រជុំទល់មុខ", "Facing-seat meeting layout", "ប្រធាននៅក្បាលតុ អនុប្រធាននិងអ្នកពាក់ព័ន្ធអង្គុយទល់មុខគ្នាទាំងសងខាង មានសៀវភៅ និងប៊ិចមុខម្នាក់ៗ", "company,meeting"),
  A("buildings", "meeting", "បន្ទប់ប្រជុំតូច", "Small meeting room", "តុមូល កៅអីបួន ក្ដារស", "company,meeting"),
  // ក្រុមហ៊ុន៖ ឧបករណ៍
  A("tech", "gadget", "កុំព្យូទ័រយួរដៃ", "Laptop", "កុំព្យូទ័រយួរដៃពណ៌ប្រាក់ លើតុ", "company"),
  A("tech", "gadget", "ម៉ាស៊ីនបញ្ចាំងរូប", "Projector", "ម៉ាស៊ីនបញ្ចាំងព្យួរលើពិដាន", "company,meeting"),
  A("tech", "gadget", "អេក្រង់ទូរទស្សន៍ប្រជុំ", "Meeting display screen", "អេក្រង់ធំជាប់ជញ្ជាំង បង្ហាញក្រាហ្វិក", "company,meeting"),
  A("tech", "gadget", "ទូរស័ព្ទតុការិយាល័យ", "Desk phone", "ទូរស័ព្ទតុពណ៌ខ្មៅ មានប៊ូតុងច្រើន", "company"),
  A("tech", "gadget", "ម៉ាស៊ីនថតចម្លង", "Copier", "ម៉ាស៊ីនថតចម្លងធំ ក្រដាសចេញមក", "company"),
  A("tech", "stationery", "សៀវភៅកត់ត្រា", "Notebook", "សៀវភៅកត់ត្រាបិទស្បែក លើតុប្រជុំ", "company,meeting"),
  A("tech", "stationery", "ប៊ិច", "Pen", "ប៊ិចខ្មៅរាងស្ដើង", "company,meeting"),
  A("tech", "stationery", "ឯកសារកិច្ចសន្យា", "Contract papers", "ក្រដាសកិច្ចសន្យាជាបណ្ដុំ មានកន្លែងចុះហត្ថលេខា", "company"),
  A("tech", "stationery", "ផ្ទាំងឈ្មោះតុ", "Desk nameplate", "ផ្ទាំងឈ្មោះ និងតួនាទីលើតុ", "company,meeting"),
  A("tech", "stationery", "ក្ដារសសរសេរ", "Whiteboard", "ក្ដារសមានប៊ិចពណ៌ ដាក់ផែនការ", "company,meeting"),
  A("kitchenware", "drinkware", "ដបទឹក និងកែវក្នុងបន្ទប់ប្រជុំ", "Meeting water set", "ដបទឹកកែវ និងកែវម្នាក់មួយ លើតុប្រជុំ", "company,meeting"),
  // សម្លៀកបំពាក់ក្រុមហ៊ុន (សុភាព)
  A("fashion", "office", "ឈុតការិយាល័យស្រី", "Office woman outfit", "អាវកាក់ពណ៌ទន់ ខោ ឬសំពត់វែងដល់ជង្គង់ ក្រវាត់កស្អាត", "clothes,company"),
  A("fashion", "office", "ឈុតការិយាល័យបុរស", "Office man outfit", "អាវសដៃវែង ចងក្រវ៉ាត់ក ខោស្អាត ស្បែកជើងខ្មៅ", "clothes,company"),
  A("fashion", "office", "ឈុតអាវធំប្រធាន", "Executive suit", "អាវធំទាំងឈុត កុមារស្អាត នាឡិកា", "clothes,company,rich"),
  A("fashion", "office", "ឈុតលេខា", "Secretary outfit", "អាវដៃវែងស្អាត សំពត់ត្រង់ ស្លាកឈ្មោះ", "clothes,company"),
  A("fashion", "office", "ឯកសណ្ឋានបុគ្គលិកក្រុមហ៊ុន", "Company staff uniform", "អាវពណ៌ក្រុមហ៊ុន មានឡូហ្គោ និងស្លាកឈ្មោះ", "clothes,company"),
  A("fashion", "service", "ឯកសណ្ឋានអ្នកសម្អាត", "Cleaner uniform", "អាវពណ៌ខៀវ ខោវែង ស្រោមដៃ", "clothes,service"),
  A("fashion", "service", "ឯកសណ្ឋានបុគ្គលិកសណ្ឋាគារ", "Hotel staff uniform", "អាវកាក់ខ្មៅ អាវសក្រវ៉ាត់", "clothes,service"),
  A("fashion", "travel", "ឈុតដើរលេងឆ្នេរ", "Beach outing outfit", "អាវដៃខ្លីស្រាល ខោវែង មួកបាំងថ្ងៃ", "clothes,sea"),
  // កន្លែងកម្សាន្ត
  A("places", "club", "ក្លឹបយប់", "Night club", "បន្ទប់ភ្លើងពណ៌ ឆាកតន្ត្រី មនុស្សជុំវិញតុ", "entertainment,night"),
  A("places", "bar", "បារ", "Bar", "តុបារ កៅអីខ្ពស់ ដបស្រាជួរក្រោយ ភ្លើងទន់", "entertainment,night", true),
  A("places", "club", "បន្ទប់ខារ៉ាអូខេ", "Karaoke room", "បន្ទប់បិទ សាឡុង អេក្រង់ចម្រៀង មីក្រូហ្វូន", "entertainment,night"),
  A("places", "restaurant", "ភោជនីយដ្ឋានប្រណីត", "Fine dining restaurant", "តុក្រណាត់ស ចង្កៀងទន់ អ្នកបម្រើស្លៀកឯកសណ្ឋាន", "dining,rich"),
  A("places", "restaurant", "កាហ្វេទំនើប", "Modern cafe", "កាហ្វេមានកៅអីឈើ កញ្ចក់ធំ កាហ្វេក្តៅលើតុ", "entertainment"),
  A("places", "club", "កន្លែងកម្សាន្តលើដំបូលអគារ", "Rooftop lounge", "កន្លែងអង្គុយលើដំបូល ទេសភាពទីក្រុងពេលយប់", "entertainment,night,rich"),
  // សមុទ្រ និងសណ្ឋាគារ
  A("places", "sea", "ឆ្នេរសមុទ្រ", "Beach", "ខ្សាច់ស ដើមដូង រលកទន់ ព្រះអាទិត្យ", "sea"),
  A("places", "sea", "កំពង់ផែ", "Harbor", "កំពង់ផែមានទូកចតច្រើន បង្គោលចងទូក", "sea"),
  A("vehicles", "boat", "ទូកដងអុំ", "Rowing boat", "ទូកឈើតូច មានដងអុំពីរ", "sea,poor"),
  A("vehicles", "boat", "ទូកម៉ាស៊ីនអ្នកនេសាទ", "Fishing boat", "ទូកឈើមានម៉ាស៊ីន មានអួនគរនៅលើ", "sea,poor"),
  A("vehicles", "boat", "ទូកល្បឿនលឿន", "Speedboat", "ទូកស្ពីតពណ៌សរលោង មានម៉ាស៊ីនពីរ", "sea,rich"),
  A("vehicles", "boat", "ទូកទេសចរណ៍", "Tour boat", "ទូកធំមានដំបូលសម្រាប់ទេសចរ", "sea"),
  A("vehicles", "ship", "កប៉ាល់ដឹកអ្នកដំណើរ", "Passenger ferry", "កប៉ាល់ពីរជាន់ ដឹកអ្នកដំណើរឆ្លងកោះ", "sea"),
  A("vehicles", "ship", "កប៉ាល់ទេសចរណ៍ប្រណីត", "Luxury cruise ship", "កប៉ាល់ធំច្រើនជាន់ សណ្ឋាគារអណ្ដែត ស្រះទឹកលើដំបូល", "sea,rich"),
  A("vehicles", "ship", "ទូកយ៉ាត", "Yacht", "ទូកយ៉ាតសរលោង ជាន់លើមានកៅអីអង្គុយ", "sea,rich"),
  A("vehicles", "safety", "អាវការពារជីវិត", "Life jacket", "អាវភ្លឺពណ៌ទឹកក្រូច មានខ្សែចងថ្ងៃ", "sea"),
  A("buildings", "hotel", "សណ្ឋាគារប្រាំផ្កាយ", "Five-star hotel", "អគារខ្ពស់ស្អាត ទ្វារចូលធំ បុគ្គលិកស្វាគមន៍", "hotel,rich"),
  A("buildings", "hotel", "បន្ទប់ទទួលភ្ញៀវសណ្ឋាគារ", "Hotel lobby", "ឡូប៊ីធំ ចង្កៀងវ៉ោតធំ កម្រាលថ្មម៉ាប", "hotel,rich"),
  A("buildings", "hotel", "បន្ទប់សណ្ឋាគារ", "Hotel room", "គ្រែធំ ក្រណាត់ស តុតូច បង្អួចមើលសមុទ្រ", "hotel,rich"),
  A("buildings", "hotel", "បន្ទប់ក្នុងកប៉ាល់", "Cruise cabin", "បន្ទប់តូចស្អាត គ្រែតាំងជញ្ជាំង បង្អួចមូល", "hotel,sea"),
];

const C = (name, role, tags, gender, face, age, body, hair, outfit, wealth) => ({
  name, role, tags,
  identity: { gender, face },
  current: { age, body, hair, outfit, wealth },
});

export const EXTRA_CHARACTERS = [
  C("លោកប្រធានវិសាល", "ប្រធានក្រុមហ៊ុន", ["boss","company"], "male", "មុខស្ងប់ ភ្នែកមុតស្រួច", 52, "រាងជាប់", "សក់ខ្មៅលាយស", "ឈុតអាវធំប្រធាន", "អ្នកមាន"),
  C("អនុប្រធានចន្ទា", "អនុប្រធានស្រី", ["deputy","company"], "female", "មុខស្រួច ញញឹមយ៉ាងសុភាព", 44, "រាងស្ដើង", "សក់ខ្លីតុប", "ឈុតការិយាល័យស្រី", "មធ្យមខ្ពស់"),
  C("អនុប្រធានរងបូរ៉ា", "អនុប្រធានរង", ["deputy","company"], "male", "មុខមូល វ៉ែនតា", 38, "រាងល្មម", "សក់ខ្មៅសិត", "ឈុតការិយាល័យបុរស", "មធ្យមខ្ពស់"),
  C("ប្រធានផ្នែកទីផ្សារសុជាតា", "ប្រធានផ្នែកទីផ្សារ", ["manager","company"], "female", "មុខស្អាតនិងធ្ងន់", 36, "រាងស្ដើង", "សក់វែងរួញបន្តិច", "ឈុតការិយាល័យស្រី", "មធ្យមខ្ពស់"),
  C("ប្រធានផ្នែកហិរញ្ញវត្ថុសុខុម", "ប្រធានផ្នែកហិរញ្ញវត្ថុ", ["manager","company"], "male", "មុខរឹងរូស វ៉ែនតា", 45, "រាងធាត់បន្តិច", "សក់ស្តើង", "ឈុតការិយាល័យបុរស", "មធ្យមខ្ពស់"),
  C("លេខាម៉ាលា", "លេខាប្រធាន", ["staff","company"], "female", "មុខរាងពងក្រពើ ញញឹមទន់", 28, "រាងស្ដើង", "សក់បួងតុប", "ឈុតលេខា", "មធ្យម"),
  C("បុគ្គលិកថ្មីសំណាង", "បុគ្គលិកថ្មី", ["staff","company"], "male", "មុខក្មេង ភ្នែកភ្លឺ", 23, "រាងស្ដើង", "សក់ខ្លីរាបស្មើ", "ឯកសណ្ឋានបុគ្គលិកក្រុមហ៊ុន", "ក្រីក្រ"),
  C("បុគ្គលិកជំនាញវណ្ណា", "បុគ្គលិកជំនាញ", ["staff","company"], "female", "មុខស្រទន់ វ៉ែនតា", 31, "រាងល្មម", "សក់វែងចងកន្ទុយ", "ឯកសណ្ឋានបុគ្គលិកក្រុមហ៊ុន", "មធ្យម"),
  C("ដៃគូអាជីវកម្មលោកហ៊ុយ", "ដៃគូអាជីវកម្ម", ["partner","company"], "male", "មុខសាច់ ញញឹមឆ្លាត", 50, "រាងធាត់", "សក់ខ្មៅសិត", "ឈុតអាវធំប្រធាន", "អ្នកមាន"),
  C("អតិថិជនVIPលោកស្រីរុនី", "អតិថិជន VIP", ["client","company"], "female", "មុខក្រអឺតក្រទមតិចៗ", 47, "រាងស្ដើង", "សក់វែងចំហ", "ឈុតការិយាល័យស្រី", "អ្នកមាន"),
  C("អ្នកសម្អាតយាយឡៃ", "អ្នកសម្អាត", ["service","company"], "female", "មុខជ្រួញ ញញឹមទន់", 55, "រាងតូច", "សក់ស", "ឯកសណ្ឋានអ្នកសម្អាត", "ក្រីក្រ"),
  C("អ្នកបើកបរលោកសុខ", "អ្នកបើកបរ", ["service","company"], "male", "មុខស្ងប់ ពុកមាត់ស្តើង", 42, "រាងធំ", "សក់ខ្លី", "ឯកសណ្ឋានបុគ្គលិកក្រុមហ៊ុន", "មធ្យម"),
  C("អ្នកស៊ីសំណូកគីមហុង", "មន្ត្រីស៊ីសំណូក", ["villain","company"], "male", "មុខញញឹមមិនពិត", 48, "រាងធាត់", "សក់វាស់ត្រង់", "ឈុតការិយាល័យបុរស", "អ្នកមាន"),
  C("បុគ្គលិកក្បត់ថារ៉ា", "បុគ្គលិកក្បត់", ["villain","company"], "male", "មុខរលោង ភ្នែកភ្ញាក់ភ្លាមៗ", 34, "រាងស្ដើង", "សក់ខ្មៅចំហៀង", "ឈុតការិយាល័យបុរស", "មធ្យម"),
  C("អ្នកគ្រប់គ្រងសណ្ឋាគារសុធា", "អ្នកគ្រប់គ្រងសណ្ឋាគារ", ["service","hotel"], "female", "មុខស្រស់ ញញឹមស្វាគមន៍", 40, "រាងស្ដើង", "សក់បួងមូល", "ឯកសណ្ឋានបុគ្គលិកសណ្ឋាគារ", "មធ្យមខ្ពស់"),
  C("ប្រធានទូកលោកតាម៉ៅ", "ប្រធានទូក", ["captain","sea"], "male", "មុខជួរជ្រួញព្រោះព្រះអាទិត្យ", 50, "រាងរឹងមាំ", "សក់ក្រហមស្ដើង", "ឈុតដើរលេងឆ្នេរ", "មធ្យម"),
];

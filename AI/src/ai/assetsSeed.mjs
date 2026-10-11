// src/ai/assetsSeed.mjs (មិនដាក់ក្នុង src/data ព្រោះ .gitignore មាន data/)
// Seed តូច ដើម្បីសាកល្បងបណ្ណាល័យ (សរសេរដោយ AI — source "ai", មិនទាន់ផ្ទៀងផ្ទាត់ពិត)។
// ទម្រង់ជួរ: [group, subgroup, nameKm, nameEn, region, country, appearance, actions[], tags[], alcohol?]
// region: asia | europe | africa | north_america | south_america | middle_east | oceania | global
const ROWS = [
  // ម្ហូប (food)
  ["food", "main_dish", "អាម៉ុក", "Fish amok", "asia", "KH", "ត្រីចំហុយក្នុងស្លឹកចេក ទឹកខ្ទិះលឿង", [], ["khmer", "steamed"]],
  ["food", "noodle", "នំបញ្ចុក", "Num banh chok", "asia", "KH", "ខ្ញុំបំពង់ជ្រលក់សម្លទឹកត្រី បន្លែស្រស់", [], ["khmer", "breakfast"]],
  ["food", "rice_dish", "បាយសាច់ជ្រូក", "Bai sach chrouk", "asia", "KH", "សាច់ជ្រូកអាំងលើបាយ ជាមួយបន្លែជ្រក់", [], ["khmer", "breakfast"]],
  ["food", "noodle", "ផូ", "Pho", "asia", "VN", "មីសម្លក្នុងចានធំ សាច់គោ ជីរ", [], ["vietnamese", "soup"]],
  ["food", "noodle", "ផាត់ថៃ", "Pad Thai", "asia", "TH", "មីឆាសណ្តែកដី ស្ពៃ ក្តាមឬបង្គា", [], ["thai", "stir-fry"]],
  ["food", "rice_dish", "ស៊ូស៊ី", "Sushi", "asia", "JP", "បាយដុំតូចៗលើត្រីឆៅឬបន្លែ រុំសារ៉ាយ", [], ["japanese"]],
  ["food", "side_dish", "គីមឈី", "Kimchi", "asia", "KR", "ស្ពៃក្តោបជ្រក់ក្រហមហឹរ", [], ["korean", "fermented"]],
  ["food", "rice_dish", "ប៊ីរីយ៉ានី", "Biryani", "asia", "IN", "បាយឆាគ្រឿងទេស ជាមួយសាច់ ពណ៌លឿងទឹកក្រូច", [], ["indian"]],
  ["food", "main_dish", "ភីហ្សា", "Pizza", "europe", "IT", "ម្សៅមូលបន្តិចអាំង ឈីស ប៉េងប៉ោះ", [], ["italian", "baked"]],
  ["food", "bakery", "ក្រូសង់", "Croissant", "europe", "FR", "នំរាងអឌ្ឍចន្ទ ស្រទាប់ៗ ពណ៌មាស", [], ["french", "bakery"]],
  ["food", "bread", "អ៊ីនជេរ៉ា", "Injera", "africa", "ET", "នំបុ័ងទន់ស្តើងមានរន្ធតូចៗ ប្រើជំនួសស្លាបព្រា", [], ["ethiopian", "fermented"]],
  ["food", "main_dish", "តាជីនម៉ារ៉ុក", "Moroccan tagine", "africa", "MA", "ម្ហូបស្ងោរក្នុងឆ្នាំងដីមានគម្របកោណ", [], ["moroccan", "stew"]],
  ["food", "street_food", "តាកូ", "Taco", "north_america", "MX", "នំពោតបត់ ដាក់សាច់ និងបន្លែ", [], ["mexican"]],
  ["food", "main_dish", "សេវីឆេ", "Ceviche", "south_america", "PE", "ត្រីឆៅជ្រលក់ទឹកក្រូចឆ្មា ខ្ទឹមក្រហម", [], ["peruvian", "seafood"]],
  ["food", "dip", "ហ៊ូមុស", "Hummus", "middle_east", "", "ម្សៅសណ្តែកអង្កាមកិន ពណ៌ក្រែម ប្រេងអូលីវ", [], ["levantine", "vegan"]],
  // ផ្លែឈើ / បន្លែ
  ["fruits", "tropical", "ស្វាយ", "Mango", "asia", "", "ផ្លែរាងពង ពណ៌បៃតងទៅលឿង", [], ["tropical"]],
  ["fruits", "tropical", "ចេក", "Banana", "asia", "", "ផ្លែវែងកោង ពណ៌លឿង ក្រៅទន់", [], ["tropical"]],
  ["fruits", "tropical", "ធូរេន", "Durian", "asia", "", "ផ្លែធំមានបន្លា ក្លិនខ្លាំង សាច់លឿង", [], ["tropical", "strong-smell"]],
  ["fruits", "temperate", "ផ្លែប៉ោម", "Apple", "global", "", "ផ្លែមូល ក្រហម ឬបៃតង", [], ["temperate"]],
  ["vegetables", "fruit_veg", "ប៉េងប៉ោះ", "Tomato", "global", "", "ផ្លែមូលក្រហម ស្រទន់", [], ["salad"]],
  ["vegetables", "fruit_veg", "ត្រសក់", "Cucumber", "global", "", "ផ្លែវែងបៃតង ស្រស់", [], ["salad"]],
  // ភេសជ្ជៈ
  ["drinks", "non_alcoholic", "តែ", "Tea", "global", "", "ទឹកពណ៌ត្នោតឬបៃតងក្នុងកែវ ឬពែង", ["ចាក់", "ផឹក"], ["hot"]],
  ["drinks", "non_alcoholic", "កាហ្វេ", "Coffee", "global", "", "ទឹកពណ៌ខ្មៅត្នោត ក្នុងពែង", ["ចាក់", "ផឹក"], ["hot"]],
  ["drinks", "alcoholic", "ស្រាបៀរ", "Beer", "global", "", "ទឹកពណ៌មាសមានពពុះ ក្នុងកែវឬដប", ["ចាក់", "ផឹក"], ["adult-only"], true],
  // គ្រឿងប្រើប្រាស់ក្នុងផ្ទះ (បង្ហាញក្នុងរឿងតែប៉ុណ្ណោះ)
  ["appliances", "cooling", "ម៉ាស៊ីនត្រជាក់", "Air conditioner", "global", "", "ប្រអប់ពណ៌ស ព្យួរជញ្ជាំង មានឧបករណ៍បញ្ជា", ["បើក", "បិទ", "បញ្ចេញខ្យល់ត្រជាក់"], ["home"]],
  ["appliances", "cooling", "កង្ហារ", "Electric fan", "global", "", "ស្លាបបង្វិល មានទ្រ ឬព្យួរ", ["បើក", "បិទ", "បក់ខ្យល់"], ["home"]],
  ["appliances", "cooling", "ទូទឹកកក", "Refrigerator", "global", "", "ទូធំមានទ្វារ ខាងក្នុងត្រជាក់", ["បើកទ្វារ", "បិទទ្វារ"], ["kitchen"]],
  ["appliances", "laundry", "ម៉ាស៊ីនបោកគក់", "Washing machine", "global", "", "ប្រអប់ការ៉េ មានទ្វារមូល", ["បើក", "បិទ", "បោកខោអាវ"], ["home"]],
  ["appliances", "media", "ទូរទស្សន៍", "Television", "global", "", "អេក្រង់ផ្ទះ ព្យួរឬតាំងលើតុ", ["បើក", "បិទ", "បង្ហាញរូបភាព"], ["home"]],
  ["appliances", "media", "ធុងបាស", "Bass speaker", "global", "", "ឧបករណ៍បំពងសំឡេងធំ", ["បើក", "បិទ", "ចាក់តន្ត្រី"], ["audio"]],
  ["appliances", "controls", "ឧបករណ៍បញ្ជាពីចម្ងាយ", "Remote control", "global", "", "ឧបករណ៍ដៃតូចមានប៊ូតុង", ["ចុចប៊ូតុង"], ["home"]],
  // សម្ភារៈបរិភោគ
  ["kitchenware", "tableware", "ចាន", "Plate", "global", "", "ចានមូលរាប", ["ដាក់អាហារ"], ["dining"]],
  ["kitchenware", "utensil", "ស្លាបព្រា", "Spoon", "global", "", "ស្លាបព្រាមានដងវែង", ["ដួស", "បរិភោគ"], ["dining"]],
  ["kitchenware", "utensil", "សម", "Fork", "global", "", "សមមានធ្មេញ", ["ចាក់", "បរិភោគ"], ["dining"]],
  ["kitchenware", "utensil", "ចង្កឹះ", "Chopsticks", "asia", "", "ដំបងតូចពីរ", ["ក្តាប់", "បរិភោគ"], ["dining"]],
  ["kitchenware", "cookware", "ឆ្នាំង", "Cooking pot", "global", "", "ឆ្នាំងមូលមានគម្រប", ["ដាំ", "ស្ងោរ"], ["cooking"]],
  // ផ្កា
  ["plants", "flower", "ផ្កាឈូក", "Lotus", "asia", "", "ផ្កាដុះក្នុងទឹក ស្លឹកធំមូល ក្រអូមច្រើនស្រទាប់", [], ["flower", "water"]],
  ["plants", "flower", "ផ្កាកុលាប", "Rose", "global", "", "ផ្កាមានស្រទាប់ ដើមមានបន្លា", [], ["flower"]],
  ["plants", "flower", "ផ្កាអ័រគីដេ", "Orchid", "global", "", "ផ្កាកោងស្រទន់ ដើមធ្លាក់", [], ["flower", "indoor"]],
  // យានយន្ត
  ["vehicles", "two_wheel", "ម៉ូតូ", "Motorcycle", "global", "", "យានពីរកង់ មានម៉ាស៊ីន", ["បើក", "ឈប់"], ["transport"]],
  ["vehicles", "two_wheel", "កង់", "Bicycle", "global", "", "យានពីរកង់ជាន់ដោយជើង", ["ជិះ"], ["transport"]],
  ["vehicles", "water", "ទូក", "Boat", "global", "", "យានលើទឹក", ["ចែវ", "ជិះ"], ["transport"]],
  // ទីតាំងកម្សាន្ត
  ["places", "recreation", "ឆ្នេរសមុទ្រ", "Beach", "global", "", "ខ្សាច់ និងរលក", [], ["leisure"]],
  ["places", "recreation", "ទឹកធ្លាក់", "Waterfall", "global", "", "ទឹកហូរពីកម្ពស់ ព័ទ្ធដោយព្រៃ", [], ["leisure", "nature"]],
  ["animals", "attraction", "សួនសត្វ", "Zoo", "global", "", "សួនដែលមានសត្វច្រើនប្រភេទក្នុងទ្រុង", [], ["family"]],
];

export const SEED_ASSETS = ROWS.map(
  ([group, subgroup, nameKm, nameEn, region, country, appearance, actions, tags, alcohol]) => ({
    group, subgroup, nameKm, nameEn, region, country, appearance, actions, tags, alcohol: alcohol === true,
  })
);

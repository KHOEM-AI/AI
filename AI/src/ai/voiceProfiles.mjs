// បញ្ជីសំឡេង ៣៦ មុខ (ក្មេង, ចាស់, ប្រុស, ស្រី, តារាវីដេអូ)
export const VOICE_PROFILES = {
  // ១. ក្រុមក្មេង (Kids)
  kid_boy_1:    { base: "female", pitch: "+30Hz", rate: "+10%", desc: "ក្មេងប្រុស រស់រវើក" },
  kid_boy_2:    { base: "male",   pitch: "+25Hz", rate: "+15%", desc: "ក្មេងប្រុស ជ្រុលជ្រុល" },
  kid_girl_1:   { base: "female", pitch: "+35Hz", rate: "+10%", desc: "ក្មេងស្រី ព្រលឹងខ្ពស់" },
  kid_girl_2:   { base: "female", pitch: "+40Hz", rate: "+5%",  desc: "ក្មេងស្រី ព្រលឹងខ្ពស់" },
  kid_cartoon:  { base: "female", pitch: "+45Hz", rate: "+20%", desc: "សំឡេងតុក្កតា" },
  kid_whisper:  { base: "female", pitch: "+20Hz", rate: "-10%", desc: "ក្មេងស្រី ខ្សឹប" },

  // ២. ក្រុមតារាវីដេអូ / TikToker
  tiktok_male_1:   { base: "male",   pitch: "+10Hz", rate: "+25%", desc: "TikToker ប្រុស និយាយលឿន" },
  tiktok_male_2:   { base: "male",   pitch: "+5Hz",  rate: "+20%", desc: "TikToker ប្រុស ស្រែក" },
  tiktok_female_1: { base: "female", pitch: "+15Hz", rate: "+25%", desc: "TikToker ស្រី និយាយលឿន" },
  tiktok_female_2: { base: "female", pitch: "+10Hz", rate: "+30%", desc: "TikToker ស្រី ជ្រុលជ្រុល" },
  tiktok_vlogger:  { base: "female", pitch: "+5Hz",  rate: "+15%", desc: "Vlogger ធម្មតា" },
  tiktok_hype:     { base: "male",   pitch: "+15Hz", rate: "+35%", desc: "Hype Man (អ្នកបំផុសអារម្មណ៍)" },

  // ៣. ក្រុមមនុស្សពេញវ័យ (Adults)
  adult_male_normal:   { base: "male",   pitch: "0Hz",   rate: "0%",  desc: "ប្រុសពេញវ័យ ធម្មតា" },
  adult_male_deep:     { base: "male",   pitch: "-10Hz", rate: "-5%", desc: "ប្រុស សំឡេងធ្ងន់" },
  adult_male_soft:     { base: "male",   pitch: "+5Hz",  rate: "-10%",desc: "ប្រុស សំឡេងទន់" },
  adult_female_normal: { base: "female", pitch: "0Hz",   rate: "0%",  desc: "ស្រីពេញវ័យ ធម្មតា" },
  adult_female_soft:   { base: "female", pitch: "+5Hz",  rate: "-5%", desc: "ស្រី សំឡេងទន់ភ្លន់" },
  adult_female_strict: { base: "female", pitch: "-5Hz",  rate: "+5%", desc: "ស្រី សំឡេងម៉ឺងម៉ាត់" },

  // ៤. ក្រុមមនុស្សចាស់ (Elderly)
  old_male_1:   { base: "male",   pitch: "-15Hz", rate: "-20%", desc: "ចាស់ប្រុស និយាយយឺត" },
  old_male_2:   { base: "male",   pitch: "-20Hz", rate: "-15%", desc: "ចាស់ប្រុស សំឡេងញ័រ" },
  old_female_1: { base: "female", pitch: "-10Hz", rate: "-20%", desc: "ចាស់ស្រី និយាយយឺត" },
  old_female_2: { base: "female", pitch: "-15Hz", rate: "-25%", desc: "ចាស់ស្រី សំឡេងញ័រ" },
  old_grandpa:  { base: "male",   pitch: "-25Hz", rate: "-30%", desc: "តា និយាយយឺតៗ" },
  old_grandma:  { base: "female", pitch: "-20Hz", rate: "-30%", desc: "យាយ និយាយយឺតៗ" },

  // ៥. ក្រុមអ្នកនិទានរឿង / អ្នកអានព័ត៌មាន
  story_epic:    { base: "male",   pitch: "-5Hz",  rate: "-15%", desc: "អ្នកនិទានរឿងវីរបុរស" },
  story_mystery: { base: "male",   pitch: "-10Hz", rate: "-25%", desc: "អ្នកនិទានរឿងរន្ធត់" },
  news_anchor_m: { base: "male",   pitch: "0Hz",   rate: "+5%",  desc: "អ្នកអានព័ត៌មាន ប្រុស" },
  news_anchor_f: { base: "female", pitch: "0Hz",   rate: "+5%",  desc: "អ្នកអានព័ត៌មាន ស្រី" },
  audiobook_m:   { base: "male",   pitch: "-5Hz",  rate: "-10%", desc: "អ្នកអានសៀវភៅ ប្រុស" },
  audiobook_f:   { base: "female", pitch: "-5Hz",  rate: "-10%", desc: "អ្នកអានសៀវភៅ ស្រី" },

  // ៦. ក្រុមពិសេស / សំឡេង AI និងរូបយន្ត
  robot_ai:      { base: "male",   pitch: "-15Hz", rate: "+0%",  desc: "AI មនុស្សយន្ត" },
  robot_female:  { base: "female", pitch: "-10Hz", rate: "+0%",  desc: "AI មនុស្សយន្ត ស្រី" },
  alien:         { base: "female", pitch: "+50Hz", rate: "+15%", desc: "សំឡេងមនុស្សភពក្រៅ" },
  monster:       { base: "male",   pitch: "-35Hz", rate: "-20%", desc: "សំឡេងយក្ស / បិសាច" },
  ghost:         { base: "female", pitch: "+15Hz", rate: "-30%", desc: "សំឡេងខ្មោះ" },
  superhero:     { base: "male",   pitch: "-10Hz", rate: "+10%", desc: "សំឡេង Superhero" }
};

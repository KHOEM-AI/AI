import { testWords } from '../src/ai/voiceTestWords.mjs';
import { generateVoice } from '../src/ai/ttsEngine.mjs';
import { VOICE_PROFILES } from '../src/ai/voiceProfiles.mjs';

const profiles = Object.keys(VOICE_PROFILES);

async function run() {
  console.log(`🎙️ ចាប់ផ្តើមបង្កើតសំឡេងចំនួន ${testWords.length} ពាក្យ...`);

  for (let i = 0; i < testWords.length; i++) {
    const word = testWords[i];
    // ឆ្លាស់សំឡេងគ្នាទៅតាមលំដាប់ (ដើម្បីឱ្យឮសំឡេងច្រើនប្រភេទ)
    const profileKey = profiles[i % profiles.length];
    const fileName = `public/audio/test/${String(i + 1).padStart(3, '0')}_${profileKey}.mp3`;

    try {
      await generateVoice(word, profileKey, fileName);
      console.log(`✅ [${i + 1}/${testWords.length}] ${word} (${profileKey})`);
    } catch (err) {
      console.error(`❌ បរាជ័យនៅពាក្យ: ${word}`, err.message);
    }
  }
  console.log("🎉 បង្កើតសំឡេងរួចរាល់ទាំងអស់! សូមចូលទៅកាន់ថត public/audio/test/");
}

run();

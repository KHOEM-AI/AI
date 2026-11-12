import { spawn } from 'node:child_process';
import { VOICE_PROFILES } from './voiceProfiles.mjs';

export async function generateVoice(text, profileKey, outputPath) {
  const profile = VOICE_PROFILES[profileKey] || VOICE_PROFILES['adult_female_normal'];

  // បង្ខំប្រើសំឡេងស្រី (SreymomNeural) ជាគោល ព្រោះសំឡេងប្រុសរបស់ Microsoft ខូច
  const voiceName = 'km-KH-SreymomNeural';

  const getSafePitch = (p, isMale) => {
    let num = parseInt(p.replace('Hz', '').replace('+', ''));
    // បើជាសំឡេងប្រុស បន្ថែមការបន្ថយកម្ពស់សំឡេង -20Hz ដើម្បីឱ្យឮធ្ងន់
    if (isMale) num -= 20;

    if (num > 20) num = 20;
    if (num < -20) num = -20;
    return (num >= 0 ? '+' : '') + num + 'Hz';
  };

  const getSafeRate = (r) => {
    let num = parseInt(r.replace('%', '').replace('+', ''));
    if (num > 30) num = 30;
    if (num < -30) num = -30;
    return (num >= 0 ? '+' : '') + num + '%';
  };

  const safePitch = getSafePitch(profile.pitch, profile.base === 'male');
  const safeRate = getSafeRate(profile.rate);

  const args = [
    '-m', 'edge_tts',
    '--voice', voiceName,
    '--text', text,
    '--write-media', outputPath,
    '--rate', safeRate,
    '--pitch', safePitch
  ];

  return new Promise((resolve, reject) => {
    const child = spawn('python3', args);
    let errorOutput = '';
    child.stderr.on('data', (data) => { errorOutput += data.toString(); });
    child.on('close', (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`TTS បរាជ័យ: ${errorOutput}`));
    });
  });
}

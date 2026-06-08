// emoticons.js

// 헬퍼: 기본 SVG 템플릿 생성기
function createEmoticonSVG(bg, elements) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="custom-emoticon-svg">
      <circle cx="50" cy="50" r="48" fill="${bg}" />
      ${elements}
    </svg>
  `;
}

// 공통 눈/입/효과 파츠
const PARTS = {
  // 눈
  eyes_happy: '<path d="M 25 45 Q 35 30 45 45" fill="none" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/><path d="M 55 45 Q 65 30 75 45" fill="none" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/>',
  eyes_open: '<circle cx="33" cy="42" r="7" fill="#2D3748"/><circle cx="67" cy="42" r="7" fill="#2D3748"/>',
  eyes_wide: '<circle cx="33" cy="42" r="9" fill="#2D3748"/><circle cx="67" cy="42" r="9" fill="#2D3748"/>',
  eyes_star: '<polygon points="33,28 36,37 45,37 38,43 41,52 33,46 25,52 28,43 21,37 30,37" fill="#2D3748"/><polygon points="67,28 70,37 79,37 72,43 75,52 67,46 59,52 62,43 55,37 64,37" fill="#2D3748"/>',
  eyes_heart: '<path d="M33 32 A 4 4 0 0 0 25 36 Q 25 42 33 48 Q 41 42 41 36 A 4 4 0 0 0 33 32" fill="#E53E3E"/><path d="M67 32 A 4 4 0 0 0 59 36 Q 59 42 67 48 Q 75 42 75 36 A 4 4 0 0 0 67 32" fill="#E53E3E"/>',
  eyes_angry: '<path d="M 22 35 L 42 45" stroke="#2D3748" stroke-width="7" stroke-linecap="round"/><path d="M 78 35 L 58 45" stroke="#2D3748" stroke-width="7" stroke-linecap="round"/><circle cx="33" cy="47" r="5" fill="#2D3748"/><circle cx="67" cy="47" r="5" fill="#2D3748"/>',
  eyes_sad: '<path d="M 25 40 Q 35 30 45 40" fill="none" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/><path d="M 55 40 Q 65 30 75 40" fill="none" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/>',
  eyes_sad_closed: '<path d="M 22 45 Q 35 55 42 45" fill="none" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/><path d="M 78 45 Q 65 55 58 45" fill="none" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/>',
  eyes_dead: '<path d="M 25 35 L 45 45 M 25 45 L 45 35" stroke="#2D3748" stroke-width="5" stroke-linecap="round"/><path d="M 55 35 L 75 45 M 55 45 L 75 35" stroke="#2D3748" stroke-width="5" stroke-linecap="round"/>',
  eyes_straight: '<path d="M 25 42 L 42 42" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/><path d="M 58 42 L 75 42" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/>',
  eyes_side: '<circle cx="28" cy="42" r="6" fill="#2D3748"/><circle cx="62" cy="42" r="6" fill="#2D3748"/>',
  eyes_sparkle: '<circle cx="33" cy="42" r="8" fill="#2D3748"/><circle cx="36" cy="39" r="3" fill="white"/><circle cx="67" cy="42" r="8" fill="#2D3748"/><circle cx="70" cy="39" r="3" fill="white"/>',
  
  // 입
  mouth_smile: '<path d="M 30 60 Q 50 80 70 60" fill="none" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/>',
  mouth_big_smile: '<path d="M 30 60 Q 50 85 70 60 Z" fill="#2D3748"/>',
  mouth_open: '<ellipse cx="50" cy="65" rx="10" ry="14" fill="#2D3748"/>',
  mouth_small_open: '<circle cx="50" cy="65" r="6" fill="#2D3748"/>',
  mouth_frown: '<path d="M 35 70 Q 50 55 65 70" fill="none" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/>',
  mouth_straight: '<path d="M 38 65 L 62 65" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/>',
  mouth_wavy: '<path d="M 30 65 Q 35 55 40 65 T 50 65 T 60 65 T 70 65" fill="none" stroke="#2D3748" stroke-width="5" stroke-linecap="round"/>',
  mouth_pout: '<path d="M 45 65 L 55 65" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="65" r="5" fill="#2D3748"/>',
  
  // 효과
  blush: '<ellipse cx="20" cy="55" rx="10" ry="6" fill="#F56565" opacity="0.5"/><ellipse cx="80" cy="55" rx="10" ry="6" fill="#F56565" opacity="0.5"/>',
  blush_big: '<ellipse cx="25" cy="55" rx="15" ry="10" fill="#F56565" opacity="0.7"/><ellipse cx="75" cy="55" rx="15" ry="10" fill="#F56565" opacity="0.7"/>',
  tear_L: '<path d="M 33 55 Q 33 70 28 75 Q 23 70 23 55 Z" fill="#4299E1"/>',
  tear_R: '<path d="M 67 55 Q 67 70 72 75 Q 77 70 77 55 Z" fill="#4299E1"/>',
  sweat: '<path d="M 80 25 Q 85 40 80 45 Q 75 40 75 25 Z" fill="#90CDF4"/>',
  anger_vein: '<path d="M 70 20 L 75 20 M 75 20 L 75 25 M 75 20 L 80 15 M 75 20 L 70 25" stroke="#E53E3E" stroke-width="4" stroke-linecap="round"/>',
};

// 긍정 이모티콘 15종
export const POSITIVE_EMOTICONS = [
  { id: 'pos_excited', label: '신나요', svg: createEmoticonSVG('#FFD166', PARTS.eyes_star + PARTS.mouth_big_smile) },
  { id: 'pos_glad', label: '기뻐요', svg: createEmoticonSVG('#F4E285', PARTS.eyes_happy + PARTS.mouth_smile + PARTS.blush) },
  { id: 'pos_amazed', label: '놀라워요', svg: createEmoticonSVG('#81D4FA', PARTS.eyes_wide + PARTS.mouth_open) },
  { id: 'pos_flutter', label: '설레요', svg: createEmoticonSVG('#F48FB1', PARTS.eyes_heart + PARTS.mouth_small_open + PARTS.blush) },
  { id: 'pos_confident', label: '자신있어요', svg: createEmoticonSVG('#81C784', '<path d="M 25 35 L 42 42" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/><path d="M 58 42 L 75 35" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/>' + PARTS.eyes_open + '<path d="M 30 65 Q 50 80 70 55" fill="none" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/>') },
  { id: 'pos_happy', label: '행복해요', svg: createEmoticonSVG('#FFD54F', PARTS.eyes_happy + '<path d="M 25 55 Q 50 90 75 55 Z" fill="#2D3748"/><path d="M 35 60 Q 50 70 65 60 Z" fill="white"/>') },
  { id: 'pos_proud', label: '자랑스러워요', svg: createEmoticonSVG('#FBC02D', PARTS.eyes_happy + PARTS.mouth_big_smile) },
  { id: 'pos_fulfilled', label: '뿌듯해요', svg: createEmoticonSVG('#AED581', PARTS.eyes_happy + PARTS.mouth_smile) },
  { id: 'pos_overwhelmed', label: '벅차올라요', svg: createEmoticonSVG('#4DD0E1', PARTS.eyes_sparkle + PARTS.mouth_big_smile + PARTS.tear_L + PARTS.tear_R) },
  { id: 'pos_enthusiastic', label: '열광해요', svg: createEmoticonSVG('#FF8A65', PARTS.eyes_star + '<ellipse cx="50" cy="70" rx="15" ry="20" fill="#2D3748"/>') },
  { id: 'pos_thankful', label: '감사해요', svg: createEmoticonSVG('#F8BBD0', PARTS.eyes_happy + PARTS.mouth_smile + PARTS.blush_big) },
  { id: 'pos_love', label: '사랑해요', svg: createEmoticonSVG('#EF5350', PARTS.eyes_heart + PARTS.mouth_big_smile) },
  { id: 'pos_touched', label: '감동이에요', svg: createEmoticonSVG('#90A4AE', PARTS.eyes_sparkle + PARTS.mouth_smile + PARTS.tear_L) },
  { id: 'pos_relieved', label: '후련해요', svg: createEmoticonSVG('#B3E5FC', PARTS.eyes_straight + PARTS.mouth_smile + '<path d="M 55 65 Q 65 65 75 55" fill="none" stroke="#E2E8F0" stroke-width="4" stroke-linecap="round"/>') },
  { id: 'pos_peaceful', label: '평온해요', svg: createEmoticonSVG('#D1C4E9', PARTS.eyes_straight + PARTS.mouth_smile) },
];

// 부정 이모티콘 18종
export const NEGATIVE_EMOTICONS = [
  { id: 'neg_angry', label: '화나요', svg: createEmoticonSVG('#E53E3E', PARTS.eyes_angry + PARTS.mouth_frown + PARTS.anger_vein) },
  { id: 'neg_annoyed', label: '짜증나요', svg: createEmoticonSVG('#ED8936', '<path d="M 25 38 L 42 42" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/><path d="M 58 42 L 75 38" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/>' + PARTS.eyes_open + '<path d="M 35 68 L 65 62" stroke="#2D3748" stroke-width="6" stroke-linecap="round"/>') },
  { id: 'neg_stuffy', label: '답답해요', svg: createEmoticonSVG('#A0AEC0', PARTS.eyes_straight + PARTS.mouth_wavy) },
  { id: 'neg_confused', label: '혼란스러워요', svg: createEmoticonSVG('#9F7AEA', PARTS.eyes_dead + PARTS.mouth_wavy) },
  { id: 'neg_unfair', label: '억울해요', svg: createEmoticonSVG('#38B2AC', PARTS.eyes_sad + PARTS.mouth_frown + PARTS.tear_L + PARTS.tear_R) },
  { id: 'neg_scared', label: '무서워요', svg: createEmoticonSVG('#4299E1', '<circle cx="33" cy="42" r="12" fill="white"/><circle cx="33" cy="42" r="3" fill="#2D3748"/><circle cx="67" cy="42" r="12" fill="white"/><circle cx="67" cy="42" r="3" fill="#2D3748"/>' + PARTS.mouth_wavy) },
  { id: 'neg_nervous', label: '긴장돼요', svg: createEmoticonSVG('#A3E635', PARTS.eyes_wide + PARTS.mouth_straight + PARTS.sweat) },
  { id: 'neg_envious', label: '부러워요', svg: createEmoticonSVG('#48BB78', PARTS.eyes_side + PARTS.mouth_pout) },
  { id: 'neg_sad', label: '슬퍼요', svg: createEmoticonSVG('#63B3ED', PARTS.eyes_sad_closed + PARTS.mouth_frown + PARTS.tear_L + PARTS.tear_R) },
  { id: 'neg_hate', label: '미워요', svg: createEmoticonSVG('#C53030', '<path d="M 25 45 L 42 35" stroke="#2D3748" stroke-width="7" stroke-linecap="round"/><path d="M 58 35 L 75 45" stroke="#2D3748" stroke-width="7" stroke-linecap="round"/>' + PARTS.eyes_open + PARTS.mouth_straight) },
  { id: 'neg_upset', label: '속상해요', svg: createEmoticonSVG('#DD6B20', PARTS.eyes_sad + PARTS.mouth_frown) },
  { id: 'neg_embarrassed', label: '부끄러워요', svg: createEmoticonSVG('#ED64A6', PARTS.eyes_wide + PARTS.mouth_small_open + PARTS.blush_big) },
  { id: 'neg_worried', label: '걱정돼요', svg: createEmoticonSVG('#B794F4', PARTS.eyes_sad + PARTS.mouth_straight + PARTS.sweat) },
  { id: 'neg_lonely', label: '외로워요', svg: createEmoticonSVG('#718096', '<circle cx="28" cy="46" r="6" fill="#2D3748"/><circle cx="62" cy="46" r="6" fill="#2D3748"/>' + PARTS.mouth_frown + PARTS.tear_L) },
  { id: 'neg_sorry', label: '미안해요', svg: createEmoticonSVG('#63B3ED', PARTS.eyes_sad_closed + PARTS.mouth_straight + PARTS.sweat) },
  { id: 'neg_disappointed', label: '실망이에요', svg: createEmoticonSVG('#B0BEC5', PARTS.eyes_straight + PARTS.mouth_frown) },
  { id: 'neg_awkward', label: '어색해요', svg: createEmoticonSVG('#D4E157', PARTS.eyes_side + PARTS.mouth_straight + PARTS.sweat) },
  { id: 'neg_regretful', label: '아쉬워요', svg: createEmoticonSVG('#7986CB', PARTS.eyes_open + PARTS.mouth_frown) },
];

// 통합된 이모티콘 맵 (ID로 검색하기 위함)
export const ALL_CUSTOM_EMOTICONS = [...POSITIVE_EMOTICONS, ...NEGATIVE_EMOTICONS].reduce((acc, emo) => {
  acc[emo.id] = emo;
  return acc;
}, {});

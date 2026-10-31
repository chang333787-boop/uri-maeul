const WORDS = [

  '시발', '씨발', '씨바', '시바', '씨빨', '시빨', '쉬발', '슈발', '씌발', '쓰발', '쒸발', '십알', '십발', '시벌', '씨벌', '씨팔', '시팔', '씨팔', '싀발', '띠발', '띠바', '씨부랄', '시부랄', '썅', '쌍놈', '쌍년', '씹', '좆', '좃', '죶', '좇같', '젖같', '존나', '졸라', '존내', '존니', '졸랭',
  '병신', '븅신', '빙신', '병쉰', '병싄', '등신', '머저리', '개새', '개세끼', '개색', '개쌔', '개쉐', '개섀', '개놈', '개년', '개같', '개소리', '개빡', '새끼', '쌔끼', '섀끼', '쉐끼', '새꺄', '색끼', '시키야',
  '미친', '미췬', '미틴', '미칀', '또라이', '돌아이', '또라', '지랄', '즤랄', '찌랄', '닥쳐', '닥치', '꺼져', '꺼지라', '디져', '디지셈', '뒤지셈', '죽어라', '죽을래', '죽여버', '죽일', '패버', '패줄',

  '니애미', '느금', '느그애미', '늬애미', '니애비', '느그애비', '애미뒤', '애비뒤', '엠창', '엄창', '니미', '니기미', '느그엄마',

  '보지', '자지', '섹스', '쎅스', '섹시', '야동', '야사', '포르노', '자위', '꼬추', '고추만', '가슴만져', '빨통', '창녀', '걸레년', '몸매',

  '찐따', '애자', '장애새', '틀딱', '한남', '김치녀', '맘충', '급식충', '진지충', '일베', '메갈', '흑형', '똥꼬충',

  '바보', '멍청', '멍충', '돼지새', '못생', '찐찌버거', '루저', '호구', '쪼다', '저능', '뇌없', '노답', '극혐', '꺼지',

  'fuck', 'fuk', 'fck', 'fxck', 'shit', 'sht', 'bitch', 'btch', 'biatch', 'asshole', 'dick', 'pussy', 'cock', 'sex', 'porn', 'wtf', 'stfu', 'nigg', 'retard', 'damn', 'bastard', 'slut', 'whore',
];
const JAMO = ['ㅅㅂ', 'ㅆㅂ', 'ㅂㅅ', 'ㅄ', 'ㅈㄹ', 'ㅁㅊ', 'ㄱㅅㄲ', 'ㅅㄲ', 'ㄲㅈ', 'ㄴㄱㅁ', 'ㅈㄴ', 'ㅈㄲ', 'ㄷㅊ', 'ㅂㄹ', 'ㅆㄹㄱ', 'ㅅㅂㄹ', 'ㅗ', 'ㅂㅁ', 'ㅇㅁ'];
const ALLOW = ['시바견', '시바이누', '바보온달', '보지마', '보지말', '보지않', '보지도', '보지못', '보지만', '보지요', '보지는', '자지마', '자지말', '자지않', '자지도', '자지못', '자지만', '자지요', '자지는', '안자지', '고추장', '고추잠자리', '풋고추', '빨간고추', '섹시한'];
const norm = (s) => String(s || '').normalize('NFKC').toLowerCase();
const glue = (s) => norm(s).replace(/[^가-힣a-z]/g, '');
const jamoOnly = (s) => String(s || '').replace(/[^ㄱ-ㅎㅏ-ㅣ]/g, '');
export const CHAT_MAX = 40;
export function checkChat(text) {
  const raw = String(text || '').replace(/\s+/g, ' ').trim();
  if (!raw) return { ok: false, why: '' };
  if (raw.length > CHAT_MAX) return { ok: false, why: CHAT_MAX + '글자까지 보낼 수 있어요' };
  const n = norm(raw);
  if (/(https?:|www\.|\.(com|kr|net|org|io|me|gg)\b|discord|kakao|오픈채팅|카톡)/i.test(n)) return { ok: false, why: '주소·링크·연락처는 보낼 수 없어요' };
  if (/01[016789][-.\s]?\d{3,4}/.test(n) || (n.replace(/\D/g, '').length >= 7)) return { ok: false, why: '전화번호 같은 숫자는 보낼 수 없어요' };
  let g = glue(raw); for (const a of ALLOW) g = g.split(a).join('');
  for (const w of WORDS) if (g.includes(w)) return { ok: false, why: '고운 말로 바꿔 써요 🙂' };
  const j = jamoOnly(raw);
  if (j && JAMO.some((w) => j.includes(w))) return { ok: false, why: '고운 말로 바꿔 써요 🙂' };
  if (/(.)\1{7,}/.test(n)) return { ok: false, why: '같은 글자를 너무 많이 써요' };
  return { ok: true, text: raw };
}

export const QUICK = ['안녕! 👋', '여기로 와!', '같이 하자!', '고마워!', '잘했어! 👍', '도와줘!', '잠깐만!', '어디야?'];

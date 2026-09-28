// 혼동되는 문자(0/O, 1/I/L) 제외한 32자 알파벳
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 8;

export function generateCode() {
  // 256 % 32 === 0 이라 모듈로 편향이 없음
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  let code = '';
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return code;
}

/** 화면 표시용: XXXX-XXXX */
export function formatCode(code) {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** 사용자가 입력한 문자열을 저장/비교용 형태로 정규화 (대시 제거, 대문자) */
export function normalizeCode(input) {
  return String(input || '').replace(/[\s-]/g, '').toUpperCase();
}

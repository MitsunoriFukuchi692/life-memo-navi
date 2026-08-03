// ============================================================
// 生年月日まわりの共通ユーティリティ（登録画面・設定画面で共用）
// ============================================================

export const CURRENT_YEAR = new Date().getFullYear();

// 生年の選択肢（新しい順・111年分）。シニア利用が中心なので広めに用意する
export const BIRTH_YEARS = Array.from({ length: 111 }, (_, i) => CURRENT_YEAR - i);

// 西暦→和暦の表記（生年の目安。年単位のため境界年は近似）
export function wareki(year: number): string {
  const eras: { name: string; start: number }[] = [
    { name: '令和', start: 2019 },
    { name: '平成', start: 1989 },
    { name: '昭和', start: 1926 },
    { name: '大正', start: 1912 },
    { name: '明治', start: 1868 },
  ];
  for (const e of eras) {
    if (year >= e.start) {
      const n = year - e.start + 1;
      return `${e.name}${n === 1 ? '元' : n}年`;
    }
  }
  return '';
}

// 年・月からその月の日数を返す（未選択時は31）
export function daysInMonth(year: string, month: string): number {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

// 満年齢を計算する
export function ageFromBirthdate(y: string, m: string, d: string): number {
  const b = new Date(Number(y), Number(m) - 1, Number(d));
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const md = now.getMonth() - b.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

// 年・月・日 → "YYYY-MM-DD"
export function toBirthdate(y: string, m: string, d: string): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// "YYYY-MM-DD"（や ISO 文字列）→ { y, m, d }。未設定は空文字
export function parseBirthdate(s?: string): { y: string; m: string; d: string } {
  const match = (s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return { y: '', m: '', d: '' };
  return { y: match[1], m: String(Number(match[2])), d: String(Number(match[3])) };
}

// 表示用ラベル "1950年6月3日（昭和25年）"
export function formatBirthdateLabel(s?: string): string {
  const { y, m, d } = parseBirthdate(s);
  if (!y) return '未設定';
  return `${y}年${m}月${d}日（${wareki(Number(y))}）`;
}

// Family Member Data for Fortune & Biorhythm
// 이름(Name)을 키로 사용하여 매핑
// 생년월일 형식: YYYY-MM-DD
// gender: 'M' or 'F'

export const familyData = {
    // 사용자 제공 데이터 (2025-12-09 Update)
    "kukky": { name: "kukky", birthdate: "1976-11-22", gender: "M", slor: "solar" },
    "soony": { name: "soony", birthdate: "1983-06-18", gender: "F", slor: "solar" },
    "joowon": { name: "joowon", birthdate: "2011-01-26", gender: "M", slor: "solar" },
    "raim": { name: "raim", birthdate: "2015-02-14", gender: "F", slor: "solar" }
};

export function getZodiac(dateStr) {
    const date = new Date(dateStr);
    const m = date.getMonth() + 1;
    const d = date.getDate();

    if ((m == 3 && d >= 21) || (m == 4 && d <= 19)) return "양자리";
    if ((m == 4 && d >= 20) || (m == 5 && d <= 20)) return "황소자리";
    if ((m == 5 && d >= 21) || (m == 6 && d <= 21)) return "쌍둥이자리";
    if ((m == 6 && d >= 22) || (m == 7 && d <= 22)) return "게자리";
    if ((m == 7 && d >= 23) || (m == 8 && d <= 22)) return "사자자리";
    if ((m == 8 && d >= 23) || (m == 9 && d <= 22)) return "처녀자리";
    if ((m == 9 && d >= 23) || (m == 10 && d <= 22)) return "천칭자리";
    if ((m == 10 && d >= 23) || (m == 11 && d <= 21)) return "전갈자리";
    if ((m == 11 && d >= 22) || (m == 12 && d <= 21)) return "사수자리";
    if ((m == 12 && d >= 22) || (m == 1 && d <= 19)) return "염소자리";
    if ((m == 1 && d >= 20) || (m == 2 && d <= 18)) return "물병자리";
    return "물고기자리";
}

export function getChineseZodiac(dateStr) {
    const year = new Date(dateStr).getFullYear();
    const animals = ["원숭이", "닭", "개", "돼지", "쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양"];
    return animals[year % 12] + "띠";
}

// ============================================================================
// 『쁘니토체스 (BB Chess)』 - 커스텀 벡터 게임 아이콘·시너지 문장·3D 캔버스 아트 시스템
// (이모지 완전 배제 · 그라데이션 & 베벨 하이라이트 기반 상용 게임풍 UI 에셋)
// ============================================================================

const GameIcons = {
  // 공통 HUD / 액션 SVG 아이콘 반환
  svg(name, size = 18) {
    const s = size;
    switch (name) {
      case 'heart':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="gi_ht" x1="16" y1="4" x2="16" y2="29" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#ff6b8b"/><stop offset="55%" stop-color="#e11d48"/><stop offset="100%" stop-color="#881337"/>
            </linearGradient>
          </defs>
          <path d="M16 28.5C16 28.5 3.5 20.4 3.5 11.4C3.5 6.9 7 3.8 11 3.8C13.6 3.8 15.2 5.2 16 6.8C16.8 5.2 18.4 3.8 21 3.8C25 3.8 28.5 6.9 28.5 11.4C28.5 20.4 16 28.5 16 28.5Z" fill="url(#gi_ht)" stroke="#4c0519" stroke-width="2.2" stroke-linejoin="round"/>
          <ellipse cx="10.5" cy="9.5" rx="3.2" ry="2" transform="rotate(-25 10.5 9.5)" fill="#fff" fill-opacity="0.65"/>
        </svg>`;

      case 'coin':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="gi_cn" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#fef08a"/><stop offset="45%" stop-color="#facc15"/><stop offset="100%" stop-color="#b45309"/>
            </linearGradient>
          </defs>
          <circle cx="16" cy="17" r="12" fill="#78350f"/>
          <circle cx="16" cy="15.2" r="12" fill="url(#gi_cn)" stroke="#78350f" stroke-width="2"/>
          <circle cx="16" cy="15.2" r="8.5" stroke="#b45309" stroke-width="1.5" fill="#eab308" fill-opacity="0.35"/>
          <path d="M16 9.5L18.2 13.5L22.5 14.3L19.2 17.4L20 21.8L16 19.6L12 21.8L12.8 17.4L9.5 14.3L13.8 13.5L16 9.5Z" fill="#fef9c3" stroke="#92400e" stroke-width="1"/>
        </svg>`;

      case 'crown':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="gi_cr" x1="16" y1="5" x2="16" y2="26" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/>
            </linearGradient>
          </defs>
          <path d="M4 24L6.2 10.5L11.8 16L16 7L20.2 16L25.8 10.5L28 24H4Z" fill="url(#gi_cr)" stroke="#451a03" stroke-width="2.2" stroke-linejoin="round"/>
          <rect x="4" y="23.5" width="24" height="4" rx="1.8" fill="#d97706" stroke="#451a03" stroke-width="2"/>
          <circle cx="16" cy="18.5" r="2.1" fill="#f43f5e" stroke="#fff" stroke-width="0.8"/>
          <circle cx="9.8" cy="19.2" r="1.5" fill="#38bdf8"/>
          <circle cx="22.2" cy="19.2" r="1.5" fill="#38bdf8"/>
        </svg>`;

      case 'swords':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <path d="M6 25L24 7M24 7H18.5M24 7V12.5" stroke="#fffbeb" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M26 25L8 7M8 7H13.5M8 7V12.5" stroke="#fde68a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4.5 22.5L9.5 27.5M27.5 22.5L22.5 27.5" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
        </svg>`;

      case 'xp':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="gi_xp" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#bae6fd"/><stop offset="50%" stop-color="#0ea5e9"/><stop offset="100%" stop-color="#1d4ed8"/>
            </linearGradient>
          </defs>
          <path d="M16 3L26 14L16 29L6 14L16 3Z" fill="url(#gi_xp)" stroke="#0f172a" stroke-width="2.1" stroke-linejoin="round"/>
          <path d="M16 5L22 14L16 17L10 14L16 5Z" fill="#e0f2fe" fill-opacity="0.7"/>
        </svg>`;

      case 'reroll':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <path d="M7 14C7.9 9.5 11.8 6.2 16.5 6.2C20.5 6.2 24 8.6 25.4 12.2" stroke="#451a03" stroke-width="3.2" stroke-linecap="round"/>
          <path d="M26 7V13H20" stroke="#451a03" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M25 18C24.1 22.5 20.2 25.8 15.5 25.8C11.5 25.8 8 23.4 6.6 19.8" stroke="#451a03" stroke-width="3.2" stroke-linecap="round"/>
          <path d="M6 25V19H12" stroke="#451a03" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

      case 'lockClosed':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <path d="M10.5 14V10.5C10.5 7.46 12.96 5 16 5C19.04 5 21.5 7.46 21.5 10.5V14" stroke="#fef08a" stroke-width="3" stroke-linecap="round"/>
          <rect x="6.5" y="13.5" width="19" height="14" rx="3.5" fill="#f59e0b" stroke="#451a03" stroke-width="2"/>
          <circle cx="16" cy="20" r="2.2" fill="#451a03"/>
        </svg>`;

      case 'lockOpen':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <path d="M10.5 14V10C10.5 6.96 12.96 4.5 16 4.5C18.5 4.5 20.6 6.1 21.3 8.4" stroke="#cbd5e1" stroke-width="2.8" stroke-linecap="round"/>
          <rect x="6.5" y="14" width="19" height="13.5" rx="3.5" fill="#64748b" stroke="#1e293b" stroke-width="2"/>
          <circle cx="16" cy="20.5" r="2" fill="#0f172a"/>
        </svg>`;

      case 'book':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <rect x="6" y="4.5" width="20" height="23" rx="3" fill="#b45309" stroke="#292524" stroke-width="2"/>
          <path d="M10 4.5V27.5" stroke="#78350f" stroke-width="2.2"/>
          <rect x="13" y="9" width="9" height="6" rx="1.2" fill="#fef08a" stroke="#78350f" stroke-width="1.2"/>
          <path d="M8.5 24.5H24.5" stroke="#fef3c7" stroke-width="2.2" stroke-linecap="round"/>
        </svg>`;

      case 'soundOn':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <path d="M6 12.5H11L18 7V25L11 19.5H6V12.5Z" fill="#fde68a" stroke="#292524" stroke-width="2" stroke-linejoin="round"/>
          <path d="M22 11.5C23.8 13.5 23.8 18.5 22 20.5" stroke="#fde68a" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M25.5 8.5C28.5 12.2 28.5 19.8 25.5 23.5" stroke="#fbbf24" stroke-width="2.4" stroke-linecap="round"/>
        </svg>`;

      case 'soundOff':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <path d="M6 12.5H11L18 7V25L11 19.5H6V12.5Z" fill="#94a3b8" stroke="#1e293b" stroke-width="2" stroke-linejoin="round"/>
          <path d="M22 12L28 20M28 12L22 20" stroke="#fb7185" stroke-width="2.8" stroke-linecap="round"/>
        </svg>`;

      case 'sell':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <path d="M8 12H24L22.4 26H9.6L8 12Z" fill="#fb7185" stroke="#4c0519" stroke-width="2" stroke-linejoin="round"/>
          <path d="M6 9.5H26" stroke="#fecdd3" stroke-width="2.8" stroke-linecap="round"/>
          <path d="M12.5 9V6.5H19.5V9" stroke="#fecdd3" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="16" cy="19" r="3.8" fill="#facc15" stroke="#78350f" stroke-width="1.4"/>
        </svg>`;

      case 'inspect':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <circle cx="14.5" cy="14.5" r="7.5" fill="#bae6fd" fill-opacity="0.35" stroke="#7dd3fc" stroke-width="2.6"/>
          <path d="M20.2 20.2L26.5 26.5" stroke="#fde68a" stroke-width="3.2" stroke-linecap="round"/>
        </svg>`;

      case 'bolt':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <path d="M18 3L7 17.5H15.5L13.5 29L25 14.5H16.5L18 3Z" fill="#facc15" stroke="#78350f" stroke-width="2" stroke-linejoin="round"/>
        </svg>`;

      case 'trophy':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <path d="M9 5H23V13C23 17 19.9 20 16 20C12.1 20 9 17 9 13V5Z" fill="#facc15" stroke="#78350f" stroke-width="2"/>
          <path d="M9 8H5.5C5.5 12.5 7.5 14.5 9.5 15M23 8H26.5C26.5 12.5 24.5 14.5 22.5 15" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M16 20V25M11 26H21" stroke="#d97706" stroke-width="2.8" stroke-linecap="round"/>
        </svg>`;

      case 'chest':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <rect x="4.5" y="9" width="23" height="16.5" rx="3" fill="#b45309" stroke="#451a03" stroke-width="2"/>
          <path d="M4.5 15.5H27.5" stroke="#451a03" stroke-width="2.2"/>
          <rect x="13.5" y="13" width="5" height="5.5" rx="1.2" fill="#facc15" stroke="#451a03" stroke-width="1.6"/>
        </svg>`;

      case 'gear':
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
          <path d="M14 4H18L19 7.5L22.5 8.5L25.5 6.5L28.5 9.5L26.5 12.5L27.5 16L31 17V21L27.5 22L26.5 25.5L28.5 28.5L25.5 31.5L22.5 29.5L19 30.5L18 34H14L13 30.5L9.5 29.5L6.5 31.5L3.5 28.5L5.5 25.5L4.5 22L1 21V17L4.5 16L5.5 12.5L3.5 9.5L6.5 6.5L9.5 8.5L13 7.5L14 4Z" transform="scale(0.85) translate(2.5, 2.5)" fill="#e2e8f0" stroke="#334155" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="16" cy="16" r="4.5" fill="#f59e0b" stroke="#78350f" stroke-width="1.8"/>
        </svg>`;

      case 'leftArrow':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none">
          <path d="M15 19L8 12L15 5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

      case 'rightArrow':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none">
          <path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

      case 'home':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none">
          <path d="M3 10L12 3L21 10V20C21 20.6 20.6 21 20 21H15V14H9V21H4C3.4 21 3 20.6 3 20V10Z" fill="#facc15" stroke="#78350f" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>`;

      case 'restart':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none">
          <path d="M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C15.5 3 18.5 5 20 8" stroke="#38bdf8" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M21 3V8H16" stroke="#38bdf8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

      case 'info':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9.5" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.8"/>
          <circle cx="12" cy="8" r="1.4" fill="#ffffff"/>
          <path d="M12 11V16M10.5 16H13.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        </svg>`;

      case 'grid':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7.5" height="7.5" rx="2" fill="#cbd5e1" stroke="#334155" stroke-width="1.8"/>
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" fill="#cbd5e1" stroke="#334155" stroke-width="1.8"/>
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" fill="#cbd5e1" stroke="#334155" stroke-width="1.8"/>
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" fill="#cbd5e1" stroke="#334155" stroke-width="1.8"/>
        </svg>`;

      case 'card':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="3" width="16" height="18" rx="3" fill="#cbd5e1" stroke="#334155" stroke-width="1.8"/>
          <circle cx="12" cy="9" r="3" fill="#f59e0b"/>
          <path d="M7 16H17" stroke="#334155" stroke-width="2" stroke-linecap="round"/>
        </svg>`;

      case 'store':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none">
          <path d="M3 9L5 4H19L21 9V20C21 20.6 20.6 21 20 21H4C3.4 21 3 20.6 3 20V9Z" fill="#b45309" stroke="#f59e0b" stroke-width="1.8"/>
          <path d="M2 9H22" stroke="#fef08a" stroke-width="2"/>
          <path d="M9 21V13H15V21" fill="#451a03"/>
        </svg>`;

      case 'fullscreen':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none">
          <path d="M4 9V4H9M20 9V4H15M4 15V20H9M20 15V20H15" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

      case 'fullscreenExit':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none">
          <path d="M9 4V9H4M15 4V9H20M9 20V15H4M15 20V15H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

      default:
        return `<svg width="${s}" height="${s}" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="#fbbf24"/></svg>`;
    }
  },

  // 성급 별 배지 SVG (1성 브론즈/실버, 2성 골드, 3성 로열 크라운 골드)
  starsHtml(star, size = 11) {
    if (star === 3) {
      return `<span class="inline-flex items-center gap-0.5">${this.svg('crown', size + 3)}</span>`;
    }
    const fill = star === 2 ? '#facc15' : '#e2e8f0';
    const stroke = star === 2 ? '#78350f' : '#334155';
    const oneStar = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
      <path d="M12 2.4L14.9 8.3L21.4 9.2L16.7 13.8L17.8 20.3L12 17.2L6.2 20.3L7.3 13.8L2.6 9.2L9.1 8.3L12 2.4Z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
    </svg>`;
    return `<span class="inline-flex items-center -space-x-0.5">${oneStar.repeat(star)}</span>`;
  },

  // 13종 시너지 전용 벡터 문장(Crest) 아이콘
  synergySvg(synName, size = 14) {
    const meta = SYNERGY_DB[synName];
    const col = meta ? meta.color : '#f59e0b';
    let glyph = '';

    switch (synName) {
      case '일상힐링': // 네잎클로버
        glyph = `<circle cx="12" cy="11.5" r="4.2" fill="#4ade80"/><circle cx="20" cy="11.5" r="4.2" fill="#4ade80"/><circle cx="12" cy="19.5" r="4.2" fill="#22c55e"/><circle cx="20" cy="19.5" r="4.2" fill="#22c55e"/><circle cx="16" cy="15.5" r="2.2" fill="#fef08a"/>`;
        break;
      case '스위트파티': // 케이크 크라운
        glyph = `<rect x="7.5" y="15" width="17" height="8.5" rx="2.5" fill="#fda4af"/><path d="M7.5 16C10 18.5 13 18.5 16 16C19 18.5 22 18.5 24.5 16V14C24.5 11.5 21 10 16 10C11 10 7.5 11.5 7.5 14V16Z" fill="#fff"/><circle cx="16" cy="8.5" r="2.6" fill="#e11d48"/>`;
        break;
      case '동물농장': // 발바닥 패드
        glyph = `<ellipse cx="16" cy="19.5" rx="5.5" ry="4.5" fill="#fbcfe8"/><circle cx="9.5" cy="12.5" r="2.4" fill="#fbcfe8"/><circle cx="13.8" cy="9.8" r="2.4" fill="#fbcfe8"/><circle cx="18.2" cy="9.8" r="2.4" fill="#fbcfe8"/><circle cx="22.5" cy="12.5" r="2.4" fill="#fbcfe8"/>`;
        break;
      case '러블리스타': // 슈팅스타
        glyph = `<path d="M16 6.5L18.6 12.6L25.2 13.3L20.1 17.7L21.6 24.2L16 20.7L10.4 24.2L11.9 17.7L6.8 13.3L13.4 12.6L16 6.5Z" fill="#fde047"/>`;
        break;
      case '원소판타지': // 프리즘 크리스탈
        glyph = `<path d="M16 6L23.5 16L16 26L8.5 16L16 6Z" fill="#ddd6fe"/><path d="M16 6L23.5 16L16 18.5V6Z" fill="#fff" fill-opacity="0.75"/>`;
        break;
      case '모험항해': // 닻(Anchor)
        glyph = `<circle cx="16" cy="9" r="2.3" stroke="#e0f2fe" stroke-width="2"/><path d="M16 11.5V24M11.5 14.5H20.5M9 19.5C9.8 23 12.6 24.8 16 24.8C19.4 24.8 22.2 23 23 19.5" stroke="#e0f2fe" stroke-width="2.4" stroke-linecap="round"/>`;
        break;
      case '왕국전사': // 검과 방패
        glyph = `<path d="M9 8.5H23V16C23 20.5 19.8 23.8 16 25.5C12.2 23.8 9 20.5 9 16V8.5Z" fill="#fecaca"/><path d="M16 9.5V22.5M12.5 14H19.5" stroke="#991b1b" stroke-width="2.6" stroke-linecap="round"/>`;
        break;
      case '선봉대': // 중장갑 방패
        glyph = `<path d="M8.5 8L16 6L23.5 8V15.8C23.5 20.8 19.9 24.3 16 26C12.1 24.3 8.5 20.8 8.5 15.8V8Z" fill="#dbeafe" stroke="#1e3a8a" stroke-width="1.6"/><path d="M16 7.5V24.2" stroke="#60a5fa" stroke-width="2"/>`;
        break;
      case '타격대': // 임팩트 크레센트
        glyph = `<path d="M8 22L22 8M22 8H15M22 8V15" stroke="#fef08a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 25L25 11" stroke="#fca5a5" stroke-width="2.2" stroke-linecap="round"/>`;
        break;
      case '잠입자': // 쌍단검
        glyph = `<path d="M8 23L23 8M24 23L9 8" stroke="#e2e8f0" stroke-width="2.8" stroke-linecap="round"/><circle cx="16" cy="15.5" r="2.4" fill="#38bdf8"/>`;
        break;
      case '포격수': // 포탄 스파크
        glyph = `<circle cx="15" cy="17.5" r="6.5" fill="#1e293b" stroke="#fed7aa" stroke-width="1.6"/><path d="M19.5 12L23 8.5" stroke="#fde047" stroke-width="2.4" stroke-linecap="round"/><circle cx="24" cy="7.5" r="2.2" fill="#facc15"/>`;
        break;
      case '비전술사': // 아케인 룬 성좌
        glyph = `<circle cx="16" cy="16" r="7.5" stroke="#f3e8ff" stroke-width="2"/><path d="M16 6.5L18.2 13.8L25.5 16L18.2 18.2L16 25.5L13.8 18.2L6.5 16L13.8 13.8L16 6.5Z" fill="#fde047"/>`;
        break;
      case '신비술사': // 초승달과 별
        glyph = `<path d="M19.5 8.2C14.8 8.6 11.2 12.5 11.2 17.2C11.2 20.6 13.1 23.6 16 25C11.2 25.2 7.2 21.4 7.2 16.5C7.2 11.6 11.2 7.8 16 7.8C17.3 7.8 18.5 8 19.5 8.2Z" fill="#ccfbf1"/><circle cx="20.5" cy="13.5" r="2.4" fill="#fef08a"/>`;
        break;

      default:
        glyph = `<circle cx="16" cy="16" r="6" fill="#fff"/>`;
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" class="shrink-0">
      <polygon points="16,2 28.5,9 28.5,23 16,30 3.5,23 3.5,9" fill="${col}" stroke="#0f172a" stroke-width="2.2"/>
      ${glyph}
    </svg>`;
  }
};

// ----------------------------------------------------------------------------
// Canvas 전용 3D 피규어 받침대·왕관·투사체·상태이상 벡터 렌더러 (이모지 제로)
// ----------------------------------------------------------------------------
const CanvasArt = {
  // 3D 원통형 피규어 받침대(Pedestal) 렌더링
  drawPedestal(ctx, cx, cy, rx, ry, depth, rimColor, topColor, isSelected = false) {
    ctx.save();

    // 1) 테이블 접촉 그림자 (Ambient Occlusion + Soft Drop Shadow)
    ctx.fillStyle = 'rgba(28, 16, 8, 0.34)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + depth + 2.5, rx * 1.12, ry * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // 선택 링 발광
    if (isSelected) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.ellipse(cx, cy + depth * 0.5, rx + 5, ry + 3.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2) 원통형 옆면(3D Side Cylinder Wall)
    const sideGrad = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy);
    sideGrad.addColorStop(0, '#1e293b');
    sideGrad.addColorStop(0.28, rimColor);
    sideGrad.addColorStop(0.55, '#ffffff');
    sideGrad.addColorStop(0.75, rimColor);
    sideGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = sideGrad;
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy);
    ctx.lineTo(cx - rx, cy + depth);
    ctx.ellipse(cx, cy + depth, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + rx, cy);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // 3) 받침대 상판(Glossy Top Plate)
    const topGrad = ctx.createRadialGradient(cx - rx * 0.25, cy - ry * 0.25, 2, cx, cy, rx);
    topGrad.addColorStop(0, '#ffffff');
    topGrad.addColorStop(0.35, topColor);
    topGrad.addColorStop(1, rimColor);

    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // 상판 내측 메탈 베벨 링
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.68)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.84, ry * 0.80, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  },

  // 캔버스 성급 배지 (3성 입체 왕관 / 1~2성 입체 별)
  drawStarBadge(ctx, cx, cy, star) {
    ctx.save();
    ctx.translate(cx, cy);
    if (star === 3) {
      // 입체 황금 왕관 렌더링
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-9, 4);
      ctx.lineTo(-10.5, -5);
      ctx.lineTo(-4.5, -0.5);
      ctx.lineTo(0, -7.5);
      ctx.lineTo(4.5, -0.5);
      ctx.lineTo(10.5, -5);
      ctx.lineTo(9, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 루비 보석 포인트
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, 0.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const count = star === 2 ? 2 : 1;
      const gap = 9.5;
      const startX = -((count - 1) * gap) * 0.5;
      for (let i = 0; i < count; i++) {
        this.drawMiniStar(ctx, startX + i * gap, 0, star === 2 ? 5.2 : 4.6, star === 2 ? '#facc15' : '#e2e8f0');
      }
    }
    ctx.restore();
  },

  drawMiniStar(ctx, x, y, r, fill) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a1 = (i * 72 - 90) * (Math.PI / 180);
      const a2 = ((i * 72 + 36) - 90) * (Math.PI / 180);
      if (i === 0) ctx.moveTo(Math.cos(a1) * r, Math.sin(a1) * r);
      else ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
      ctx.lineTo(Math.cos(a2) * (r * 0.45), Math.sin(a2) * (r * 0.45));
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },

  // 이모지 없는 고퀄리티 투사체 드로잉 ('cookie', 'bomb', 'heart', 'citrus', 'coinbag', 'orb')
  drawProjectile(ctx, p, timeSec) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(timeSec * 8);

    switch (p.kind) {
      case 'cookie': {
        ctx.fillStyle = '#d97706';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#451a03';
        for (const [dx, dy] of [[-2.5, -2], [2.5, -1.5], [0, 2.5], [-2, 2]]) {
          ctx.beginPath();
          ctx.arc(dx, dy, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'bomb': {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 하이라이트
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.arc(-3, -3, 2.8, 0, Math.PI * 2);
        ctx.fill();
        // 불꽃 심지
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(6.5, -6.5, 3.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'heart': {
        ctx.rotate(-timeSec * 8);
        ctx.fillStyle = '#f43f5e';
        ctx.strokeStyle = '#881337';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, 5.5);
        ctx.bezierCurveTo(-7, 1, -7, -5, -3, -5);
        ctx.bezierCurveTo(-1, -5, 0, -3, 0, -2);
        ctx.bezierCurveTo(0, -3, 1, -5, 3, -5);
        ctx.bezierCurveTo(7, -5, 7, 1, 0, 5.5);
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'citrus': {
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#fef9c3';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-5, 0); ctx.lineTo(5, 0);
        ctx.moveTo(0, -5); ctx.lineTo(0, 5);
        ctx.stroke();
        break;
      }

      default: {
        const r = p.radius || 5;
        const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r * 1.3);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.45, p.color || '#f59e0b');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  },

  // 기절(회전 입체 별) / 수면(Z 글리프) 상태이상 이펙트
  drawStatusIndicator(ctx, x, y, stunned, sleeping, timeSec) {
    ctx.save();
    if (stunned) {
      for (let i = 0; i < 3; i++) {
        const ang = timeSec * 5.5 + (i * Math.PI * 2) / 3;
        const sx = x + Math.cos(ang) * 14;
        const sy = y + Math.sin(ang) * 4.5;
        this.drawMiniStar(ctx, sx, sy, 3.8, '#fde047');
      }
    } else if (sleeping) {
      const floatY = (timeSec * 14) % 14;
      ctx.font = '900 10px "Pretendard", sans-serif';
      ctx.fillStyle = '#c4b5fd';
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 2.4;
      ctx.strokeText('Zzz', x + 10, y - floatY * 0.4);
      ctx.fillText('Zzz', x + 10, y - floatY * 0.4);
    }
    ctx.restore();
  }
};


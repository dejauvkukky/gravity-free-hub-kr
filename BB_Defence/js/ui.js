(function () {
  'use strict';

  const BB = (window.BB = window.BB || {});

  const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

  class GameUI {
    constructor() {
      this.buttons = [];
      this.hoveredCardId = null;
    }

    clearButtons() {
      this.buttons.length = 0;
    }

    addButton(id, x, y, w, h, onClick) {
      this.buttons.push({ id, x, y, w, h, onClick });
    }

    hitTest(mx, my) {
      for (let i = this.buttons.length - 1; i >= 0; i--) {
        const b = this.buttons[i];
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
          return b;
        }
      }
      return null;
    }

    draw(ctx, game) {
      this.clearButtons();

      if (game.state === 'TITLE') {
        this.drawTitleScreen(ctx, game);
        if (game.showCodex) {
          this.clearButtons();
          this.drawCodexModal(ctx, game);
        }
        return;
      }

      if (game.state === 'STAGE_SELECT') {
        this.drawStageSelectScreen(ctx, game);
        if (game.showCodex) {
          this.clearButtons();
          this.drawCodexModal(ctx, game);
        }
        return;
      }

      if (game.isPortrait) {
        this.drawPortraitInGameUI(ctx, game);
      } else {
        this.drawLandscapeTopHud(ctx, game);
        this.drawLandscapeBossBar(ctx, game);
        this.drawLandscapeWaveBanner(ctx, game);
        this.drawLandscapeBottomDeck(ctx, game);
      }

      if (game.dragState && game.dragState.dragging && game.state === 'PLAYING') {
        const img = game.images.units[game.dragState.cardId];
        if (img && img.complete) {
          ctx.save();
          ctx.globalAlpha = 0.88;
          const dy = game.dragState.pointerType === 'touch' ? game.canvasMouseY - 68 : game.canvasMouseY;
          ctx.drawImage(img, game.canvasMouseX - 64, dy - 64, 128, 128);
          ctx.restore();
        }
      }

      if (game.showCodex) {
        this.clearButtons();
        this.drawCodexModal(ctx, game);
      } else if (game.state === 'PAUSED') {
        this.clearButtons();
        this.drawPauseModal(ctx, game);
      } else if (game.state === 'VICTORY' || game.state === 'GAMEOVER') {
        this.clearButtons();
        this.drawResultModal(ctx, game);
      }
    }

    // =========================================================================
    // 1. 타이틀 화면 (세련된 MZ 감성 타이포그래피 & 클린 글래스 카드)
    // =========================================================================
    drawTitleScreen(ctx, game) {
      const VW = game.viewW;
      const VH = game.viewH;
      const t = game.titleTime;

      const vig = ctx.createRadialGradient(VW / 2, VH / 2, 160, VW / 2, VH / 2, Math.max(VW, VH) * 0.72);
      vig.addColorStop(0, 'rgba(24, 15, 38, 0.28)');
      vig.addColorStop(1, 'rgba(14, 9, 24, 0.84)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, VW, VH);

      if (game.isPortrait) {
        const topRow = ['jammanbo', 'dandan', 'nyamnyam', 'yori', 'ttolttol', 'malang'];
        topRow.forEach(function (id, idx) {
          const img = game.images.units[id];
          if (!img || !img.complete) return;
          const sx = 112 + idx * 171;
          const sy = 310 + (idx % 2) * 44 + Math.sin(t * 3 + idx) * 7;
          ctx.drawImage(img, sx - 88, sy - 88, 176, 176);
        });

        const botRow = ['dog', 'pig', 'makeup', 'love', 'cutie', 'secret'];
        botRow.forEach(function (id, idx) {
          const img = game.images.units[id];
          if (!img || !img.complete) return;
          const sx = 112 + idx * 171;
          const sy = 1600 - (idx % 2) * 42 + Math.sin(t * 3 + idx + 1.4) * 7;
          ctx.drawImage(img, sx - 88, sy - 88, 176, 176);
        });

        ctx.save();
        const pw = 980;
        const ph = 890;
        const px = (VW - pw) / 2;
        const py = 490;

        ctx.shadowColor = 'rgba(15, 10, 30, 0.45)';
        ctx.shadowBlur = 42;
        ctx.fillStyle = 'rgba(255, 252, 248, 0.97)';
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.75)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 44);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        const badgeGrad = ctx.createLinearGradient(VW / 2 - 350, py - 34, VW / 2 + 350, py + 34);
        badgeGrad.addColorStop(0, '#ec4899');
        badgeGrad.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = badgeGrad;
        ctx.beginPath();
        ctx.roundRect(VW / 2 - 350, py - 34, 700, 68, 34);
        ctx.fill();
        ctx.font = BB.font(700, 31);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('✦ 5단계 테마 맵 · 피규어 전략 디펜스 ✦', VW / 2, py + 11);

        ctx.font = BB.font(800, 104);
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#2d1636';
        ctx.lineWidth = 13;
        ctx.strokeText('말랑쁘니 디펜스', VW / 2, py + 176);
        const titleGrad = ctx.createLinearGradient(0, py + 75, 0, py + 185);
        titleGrad.addColorStop(0, '#ff5c8a');
        titleGrad.addColorStop(1, '#ff85a1');
        ctx.fillStyle = titleGrad;
        ctx.fillText('말랑쁘니 디펜스', VW / 2, py + 170);

        ctx.font = BB.font(600, 36);
        ctx.fillStyle = '#475569';
        ctx.fillText('터치 & 드래그로 간편하게 배치하는', VW / 2, py + 252);
        ctx.fillText('12종 말랑쁘니 디오라마 디펜스', VW / 2, py + 302);

        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(px + 44, py + 340, pw - 88, 152, 26);
        ctx.fill();
        ctx.stroke();

        ctx.font = BB.font(600, 30);
        ctx.fillStyle = '#334155';
        ctx.fillText('⭐증폭패드  ·  🎲장애물  ·  ⏩가속레일  ·  🌀스프링', VW / 2, py + 398);
        ctx.fillText('🎁선물상자  ·  🔮차원포탈  ·  🎵별빛오르골', VW / 2, py + 454);

        drawStyledButton(ctx, px + 56, py + 530, pw - 112, 152, '🗺️ 스테이지 선택 · 시작', '#ff5c8a', '#db2777', 44);
        this.addButton('open_stage_select', px + 56, py + 530, pw - 112, 152, function () {
          game.openStageSelect();
        });

        const halfW = (pw - 136) / 2;
        drawStyledButton(ctx, px + 56, py + 710, halfW, 132, '📖 캐릭터·기믹 도감', '#3b82f6', '#2563eb', 35);
        this.addButton('open_codex', px + 56, py + 710, halfW, 132, function () {
          BB.sound.play('ui_click');
          game.showCodex = true;
        });

        drawStyledButton(ctx, px + 80 + halfW, py + 710, halfW, 132, '⛶ 전체화면 전환', '#8b5cf6', '#6d28d9', 35);
        this.addButton('fullscreen_title', px + 80 + halfW, py + 710, halfW, 132, function () {
          game.toggleFullscreen();
        });

        ctx.restore();
        return;
      }

      // 가로형 타이틀 (1920 x 1080)
      const leftSpots = [
        ['dandan', 310, 610], ['nyamnyam', 175, 535], ['yori', 410, 725],
        ['ttolttol', 195, 745], ['malang', 395, 465], ['jammanbo', 285, 835]
      ];
      leftSpots.forEach(function (item, idx) {
        const img = game.images.units[item[0]];
        if (!img || !img.complete) return;
        const bob = Math.sin(t * 3.2 + idx) * 6;
        ctx.save();
        ctx.translate(item[1], item[2] + bob);
        ctx.fillStyle = 'rgba(255, 250, 238, 0.8)';
        ctx.beginPath();
        ctx.ellipse(0, 68, 48, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(img, -82, -92, 164, 164);
        ctx.restore();
      });

      const rightSpots = [
        ['secret', 1595, 555], ['cutie', 1745, 650], ['pig', 1495, 720],
        ['dog', 1625, 810], ['makeup', 1745, 470], ['love', 1515, 445]
      ];
      rightSpots.forEach(function (item, idx) {
        const img = game.images.units[item[0]];
        if (!img || !img.complete) return;
        const bob = Math.sin(t * 3.0 + idx + 1.5) * 6;
        const sc = item[0] === 'secret' ? 1.16 : 1.0;
        ctx.save();
        ctx.translate(item[1], item[2] + bob);
        ctx.fillStyle = 'rgba(58, 22, 92, 0.55)';
        ctx.beginPath();
        ctx.ellipse(0, 68 * sc, 48 * sc, 15 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.scale(sc, sc);
        ctx.drawImage(img, -82, -92, 164, 164);
        ctx.restore();
      });

      ctx.save();
      const panelW = 980;
      const panelH = 560;
      const px = (VW - panelW) / 2;
      const py = 210;

      ctx.shadowColor = 'rgba(15, 10, 30, 0.45)';
      ctx.shadowBlur = 40;
      ctx.fillStyle = 'rgba(255, 252, 248, 0.97)';
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.75)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(px, py, panelW, panelH, 38);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      const badgeGrad = ctx.createLinearGradient(VW / 2 - 285, py - 28, VW / 2 + 285, py + 28);
      badgeGrad.addColorStop(0, '#ec4899');
      badgeGrad.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = badgeGrad;
      ctx.beginPath();
      ctx.roundRect(VW / 2 - 285, py - 28, 570, 56, 28);
      ctx.fill();
      ctx.font = BB.font(700, 25);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('✦ 5단계 테마 배경 · 기믹 디펜스 ✦', VW / 2, py + 9);

      ctx.font = BB.font(800, 90);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#2d1636';
      ctx.lineWidth = 12;
      ctx.strokeText('말랑쁘니 디펜스', VW / 2, py + 140);
      const titleGrad = ctx.createLinearGradient(0, py + 55, 0, py + 150);
      titleGrad.addColorStop(0, '#ff5c8a');
      titleGrad.addColorStop(1, '#ff85a1');
      ctx.fillStyle = titleGrad;
      ctx.fillText('말랑쁘니 디펜스', VW / 2, py + 134);

      ctx.font = BB.font(600, 29);
      ctx.fillStyle = '#475569';
      ctx.fillText('햇살 책상부터 황혼 성소까지, 터치 & 드래그로 5가지 기믹 맵을 공략하세요', VW / 2, py + 204);

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(px + 48, py + 236, panelW - 96, 122, 22);
      ctx.fill();
      ctx.stroke();
      ctx.font = BB.font(600, 25);
      ctx.fillStyle = '#334155';
      ctx.fillText('⭐증폭패드  ·  🎲장애물블록  ·  ⏩가속레일  ·  🌀스프링발판', VW / 2, py + 285);
      ctx.fillText('🎁선물상자  ·  🔮차원포탈  ·  🎵태엽오르골', VW / 2, py + 332);

      const startBtn = { x: px + 48, y: py + 396, w: 394, h: 116 };
      const codexBtn = { x: px + 460, y: py + 396, w: 266, h: 116 };
      const fullBtn = { x: px + 744, y: py + 396, w: 188, h: 116 };

      drawStyledButton(ctx, startBtn.x, startBtn.y, startBtn.w, startBtn.h, '🗺️ 스테이지 선택', '#ff5c8a', '#db2777', 34);
      drawStyledButton(ctx, codexBtn.x, codexBtn.y, codexBtn.w, codexBtn.h, '📖 캐릭터·기믹 도감', '#3b82f6', '#2563eb', 28);
      drawStyledButton(ctx, fullBtn.x, fullBtn.y, fullBtn.w, fullBtn.h, '⛶ 전체화면', '#8b5cf6', '#6d28d9', 27);

      this.addButton('open_stage_select', startBtn.x, startBtn.y, startBtn.w, startBtn.h, function () {
        game.openStageSelect();
      });
      this.addButton('open_codex', codexBtn.x, codexBtn.y, codexBtn.w, codexBtn.h, function () {
        BB.sound.play('ui_click');
        game.showCodex = true;
      });
      this.addButton('fullscreen_title', fullBtn.x, fullBtn.y, fullBtn.w, fullBtn.h, function () {
        game.toggleFullscreen();
      });

      ctx.restore();
    }

    // =========================================================================
    // 2. 단계 선택창 (분할 포커스 쇼케이스 + 1~5단계 탭 + 테마 배경 미리보기!)
    // =========================================================================
    drawStageSelectScreen(ctx, game) {
      const VW = game.viewW;
      const VH = game.viewH;
      const self = this;

      const sIdx = Math.max(0, Math.min(BB.STAGES.length - 1, game.previewStageIndex || 0));
      const st = BB.STAGES[sIdx];
      const isHard = game.isHardMode ? game.isHardMode() : false;
      const diffSpec = game.getDifficultySpec ? game.getDifficultySpec() : BB.DIFFICULTIES.normal;
      const stars = game.getStageStar ? game.getStageStar(st.id) : (game.stageStars[st.id] || 0);
      const stageBgImg = game.getStageBgImage(sIdx);
      const themeAccent = isHard ? '#e11d48' : st.badgeColor;

      ctx.save();
      ctx.fillStyle = isHard ? 'rgba(26, 8, 22, 0.84)' : 'rgba(14, 10, 26, 0.80)';
      ctx.fillRect(0, 0, VW, VH);

      if (game.isPortrait) {
        drawStyledButton(ctx, 32, 22, 232, 86, '◀ 타이틀', '#64748b', '#334155', 32);
        this.addButton('back_to_title', 32, 22, 232, 86, function () {
          BB.sound.play('ui_click');
          game.state = 'TITLE';
        });

        ctx.textAlign = 'center';
        ctx.font = BB.font(800, 45);
        ctx.fillStyle = isHard ? '#fda4af' : '#fef08a';
        ctx.fillText('🗺️ 스테이지 선택', VW / 2, 81);

        drawStyledButton(ctx, VW - 264, 22, 232, 86, '📖 도감', '#6366f1', '#4338ca', 32);
        this.addButton('stage_codex', VW - 264, 22, 232, 86, function () {
          BB.sound.play('ui_click');
          game.showCodex = true;
        });

        // [난이도 선택 토글 바: 노말 vs 어려움]
        drawStyledButton(
          ctx, 32, 122, 498, 90,
          isHard ? '🌱 노말 모드' : '✓ 🌱 노말 모드',
          !isHard ? '#10b981' : '#334155',
          !isHard ? '#047857' : '#1e293b',
          33
        );
        this.addButton('diff_normal_btn', 32, 122, 498, 90, function () {
          game.setDifficulty('normal');
        });

        drawStyledButton(
          ctx, 550, 122, 498, 90,
          isHard ? '✓ 🔥 어려움 모드' : '🔥 어려움 모드',
          isHard ? '#f43f5e' : '#334155',
          isHard ? '#9f1239' : '#1e293b',
          33
        );
        this.addButton('diff_hard_btn', 550, 122, 498, 90, function () {
          game.setDifficulty('hard');
        });

        // [상단 1~5단계 대형 탭 바]
        const tabW = 192;
        const tabGap = 14;
        const tabStartX = 32;
        const tabY = 228;
        const tabH = 114;

        BB.STAGES.forEach(function (item, idx) {
          const tx = tabStartX + idx * (tabW + tabGap);
          const isSel = idx === sIdx;
          const itemStars = game.getStageStar ? game.getStageStar(item.id) : (game.stageStars[item.id] || 0);
          const starStr = '★'.repeat(itemStars) + '☆'.repeat(3 - itemStars);
          const tabAccent = isHard ? '#f43f5e' : item.badgeColor;

          ctx.fillStyle = isSel ? tabAccent : 'rgba(30, 41, 59, 0.92)';
          ctx.strokeStyle = isSel ? '#ffffff' : tabAccent;
          ctx.lineWidth = isSel ? 5 : 2.5;
          ctx.beginPath();
          ctx.roundRect(tx, tabY - (isSel ? 5 : 0), tabW, tabH, 24);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.font = BB.font(800, 34);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(item.id + '단계', tx + tabW / 2, tabY + 48 - (isSel ? 5 : 0));

          ctx.font = BB.font(700, 26);
          ctx.fillStyle = itemStars > 0 ? (isHard ? '#fde68a' : '#fde047') : 'rgba(255,255,255,0.42)';
          ctx.fillText(starStr, tx + tabW / 2, tabY + 92 - (isSel ? 5 : 0));

          self.addButton('stage_tab_' + item.id, tx, tabY - 6, tabW, tabH + 6, function () {
            BB.sound.play('ui_click');
            game.previewStageIndex = idx;
          });
        });

        // [중앙 포커스 스테이지 대형 쇼케이스 카드]
        const cx = 32;
        const cy = 358;
        const cw = 1016;
        const ch = 1344;

        ctx.fillStyle = isHard ? '#fffafa' : '#ffffff';
        ctx.strokeStyle = themeAccent;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(cx, cy, cw, ch, 36);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = themeAccent;
        ctx.beginPath();
        ctx.roundRect(cx + 24, cy + 20, cw - 48, 88, 24);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.font = BB.font(800, 43);
        ctx.fillStyle = '#ffffff';
        ctx.fillText((isHard ? '🔥 [어려움] ' : '') + st.name, VW / 2, cy + 79, cw - 80);

        const mapX = cx + 126;
        const mapY = cy + 124;
        const mapW = cw - 252;
        const mapH = 392;
        drawStageDioramaPreview(ctx, st, stageBgImg, mapX, mapY, mapW, mapH);

        drawStyledButton(ctx, cx + 22, mapY + 126, 88, 140, '◀', '#475569', '#1e293b', 40);
        this.addButton('prev_stage_btn', cx + 22, mapY + 126, 88, 140, function () {
          game.stepStagePreview(-1);
        });

        drawStyledButton(ctx, cx + cw - 110, mapY + 126, 88, 140, '▶', '#475569', '#1e293b', 40);
        this.addButton('next_stage_preview_btn', cx + cw - 110, mapY + 126, 88, 140, function () {
          game.stepStagePreview(1);
        });

        ctx.fillStyle = isHard ? '#fff1f2' : '#f8fafc';
        ctx.strokeStyle = isHard ? '#fda4af' : '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(cx + 36, cy + 532, cw - 72, 108, 20);
        ctx.fill();
        ctx.stroke();

        const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        ctx.font = BB.font(700, 31);
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText(
          '🌊 총 ' + st.waves.length + '웨이브   ·   💧 시작 ' + st.initialDream + '   ·   ' + diffSpec.badge + ' 기록 ' + starStr,
          VW / 2,
          cy + 576
        );

        ctx.font = BB.font(600, 27);
        ctx.fillStyle = isHard ? '#be123c' : '#047857';
        ctx.fillText(diffSpec.shortInfo, VW / 2, cy + 620);

        ctx.font = BB.font(600, 33);
        ctx.fillStyle = '#334155';
        wrapKoreanText(ctx, st.subtitle, VW / 2, cy + 686, cw - 88, 46, 'center');

        ctx.textAlign = 'left';
        ctx.font = BB.font(800, 30);
        ctx.fillStyle = '#0f766e';
        ctx.fillText('🧩 이 스테이지의 핵심 기믹 (' + st.gimmickTags.length + '종)', cx + 44, cy + 786);

        const tags = st.gimmickTags;
        const twoCol = tags.length > 4;
        tags.forEach(function (tag, tIdx) {
          const meta = BB.GIMMICK_META[tag];
          if (!meta) return;

          if (twoCol) {
            const col = tIdx % 2;
            const row = Math.floor(tIdx / 2);
            const gx = cx + 36 + col * 480;
            const gy = cy + 804 + row * 162;
            const gw = 464;
            const gh = 148;

            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = meta.color;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.roundRect(gx, gy, gw, gh, 20);
            ctx.fill();
            ctx.stroke();

            ctx.textAlign = 'left';
            ctx.font = BB.font(700, 31);
            ctx.fillStyle = '#0f172a';
            ctx.fillText(meta.icon + ' ' + meta.name, gx + 20, gy + 46);

            ctx.font = BB.font(500, 26);
            ctx.fillStyle = '#475569';
            wrapKoreanText(ctx, meta.shortDesc || meta.desc, gx + 20, gy + 88, gw - 36, 35, 'left');
          } else {
            const gx = cx + 36;
            const gy = cy + 804 + tIdx * 118;
            const gw = cw - 72;
            const gh = 106;

            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = meta.color;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.roundRect(gx, gy, gw, gh, 20);
            ctx.fill();
            ctx.stroke();

            ctx.textAlign = 'left';
            ctx.font = BB.font(700, 32);
            ctx.fillStyle = '#0f172a';
            ctx.fillText(meta.icon + ' ' + meta.name, gx + 24, gy + 44);

            ctx.font = BB.font(500, 29);
            ctx.fillStyle = '#475569';
            ctx.fillText(meta.shortDesc || meta.desc, gx + 24, gy + 86);
          }
        });

        drawStyledButton(
          ctx, 32, 1718, 1016, 168,
          isHard ? '🔥 [어려움] ' + st.name + ' 출전!' : '▶ ' + st.name + ' 출전하기',
          themeAccent, isHard ? '#881337' : '#1e293b', 44
        );
        this.addButton('play_stage_' + st.id, 32, 1718, 1016, 168, function () {
          game.startStage(sIdx);
        });

        ctx.restore();
        return;
      }

      // 가로 모드 단계 선택 (1920 x 1080)
      drawStyledButton(ctx, 48, 18, 224, 80, '◀ 타이틀로', '#64748b', '#334155', 28);
      this.addButton('back_to_title', 48, 18, 224, 80, function () {
        BB.sound.play('ui_click');
        game.state = 'TITLE';
      });

      ctx.textAlign = 'center';
      ctx.font = BB.font(800, 42);
      ctx.fillStyle = isHard ? '#fda4af' : '#fef08a';
      ctx.fillText('🗺️ 스테이지 & 난이도 선택', 636, 72);

      // [가로 모드 난이도 토글 버튼]
      drawStyledButton(
        ctx, 1004, 18, 286, 80,
        isHard ? '🌱 노말 모드' : '✓ 🌱 노말 모드',
        !isHard ? '#10b981' : '#334155',
        !isHard ? '#047857' : '#1e293b',
        27
      );
      this.addButton('diff_normal_btn', 1004, 18, 286, 80, function () {
        game.setDifficulty('normal');
      });

      drawStyledButton(
        ctx, 1304, 18, 286, 80,
        isHard ? '✓ 🔥 어려움 모드' : '🔥 어려움 모드',
        isHard ? '#f43f5e' : '#334155',
        isHard ? '#9f1239' : '#1e293b',
        27
      );
      this.addButton('diff_hard_btn', 1304, 18, 286, 80, function () {
        game.setDifficulty('hard');
      });

      drawStyledButton(ctx, VW - 288, 18, 240, 80, '📖 도감 보기', '#6366f1', '#4338ca', 28);
      this.addButton('stage_codex', VW - 288, 18, 240, 80, function () {
        BB.sound.play('ui_click');
        game.showCodex = true;
      });

      const tabW = 348;
      const tabGap = 21;
      const tabStartX = 48;
      const tabY = 116;
      const tabH = 98;

      BB.STAGES.forEach(function (item, idx) {
        const tx = tabStartX + idx * (tabW + tabGap);
        const isSel = idx === sIdx;
        const itemStars = game.getStageStar ? game.getStageStar(item.id) : (game.stageStars[item.id] || 0);
        const starStr = '★'.repeat(itemStars) + '☆'.repeat(3 - itemStars);
        const tabAccent = isHard ? '#f43f5e' : item.badgeColor;

        ctx.fillStyle = isSel ? tabAccent : 'rgba(30, 41, 59, 0.92)';
        ctx.strokeStyle = isSel ? '#ffffff' : tabAccent;
        ctx.lineWidth = isSel ? 4.5 : 2.5;
        ctx.beginPath();
        ctx.roundRect(tx, tabY - (isSel ? 5 : 0), tabW, tabH, 22);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = BB.font(700, 26);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(item.id + '단계 · ' + (item.shortName || ''), tx + tabW / 2, tabY + 43 - (isSel ? 5 : 0));

        ctx.font = BB.font(700, 23);
        ctx.fillStyle = itemStars > 0 ? '#fde047' : 'rgba(255,255,255,0.42)';
        ctx.fillText(starStr, tx + tabW / 2, tabY + 80 - (isSel ? 5 : 0));

        self.addButton('stage_tab_' + item.id, tx, tabY - 6, tabW, tabH + 6, function () {
          BB.sound.play('ui_click');
          game.previewStageIndex = idx;
        });
      });

      const cx = 48;
      const cy = 232;
      const cw = 1824;
      const ch = 818;

      ctx.fillStyle = isHard ? '#fffafa' : '#ffffff';
      ctx.strokeStyle = themeAccent;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(cx, cy, cw, ch, 34);
      ctx.fill();
      ctx.stroke();

      const mapX = cx + 38;
      const mapY = cy + 36;
      const mapW = 840;
      const mapH = 580;
      drawStageDioramaPreview(ctx, st, stageBgImg, mapX, mapY, mapW, mapH);

      drawStyledButton(ctx, mapX, cy + 644, 250, 96, '◀ 이전 단계', '#475569', '#1e293b', 28);
      this.addButton('prev_stage_btn', mapX, cy + 644, 250, 96, function () {
        game.stepStagePreview(-1);
      });

      ctx.textAlign = 'center';
      ctx.font = BB.font(800, 32);
      ctx.fillStyle = '#334155';
      ctx.fillText((sIdx + 1) + ' / ' + BB.STAGES.length + ' STAGE', mapX + mapW / 2, cy + 704);

      drawStyledButton(ctx, mapX + mapW - 250, cy + 644, 250, 96, '다음 단계 ▶', '#475569', '#1e293b', 28);
      this.addButton('next_stage_preview_btn', mapX + mapW - 250, cy + 644, 250, 96, function () {
        game.stepStagePreview(1);
      });

      const rx = cx + 914;
      const rw = 872;

      ctx.fillStyle = themeAccent;
      ctx.beginPath();
      ctx.roundRect(rx, cy + 30, rw, 80, 22);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.font = BB.font(800, 39);
      ctx.fillStyle = '#ffffff';
      ctx.fillText((isHard ? '🔥 [어려움] ' : '') + st.name, rx + rw / 2, cy + 84, rw - 36);

      ctx.fillStyle = isHard ? '#fff1f2' : '#f8fafc';
      ctx.strokeStyle = isHard ? '#fda4af' : '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(rx, cy + 124, rw, 84, 18);
      ctx.fill();
      ctx.stroke();

      const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      ctx.font = BB.font(700, 26);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(
        '🌊 총 ' + st.waves.length + '웨이브  ·  💧 시작 꿈방울 ' + st.initialDream + '  ·  ' + diffSpec.badge + ' 달성 ' + starStr,
        rx + rw / 2,
        cy + 160
      );

      ctx.font = BB.font(600, 23);
      ctx.fillStyle = isHard ? '#be123c' : '#047857';
      ctx.fillText(diffSpec.detailInfo, rx + rw / 2, cy + 195, rw - 28);

      ctx.textAlign = 'left';
      ctx.font = BB.font(600, 28);
      ctx.fillStyle = '#334155';
      wrapKoreanText(ctx, st.subtitle, rx + 12, cy + 244, rw - 24, 40, 'left');

      const gTags = st.gimmickTags;
      const gStartY = cy + 328;
      gTags.forEach(function (tag, gIdx) {
        const meta = BB.GIMMICK_META[tag];
        if (!meta) return;
        const col = gIdx % 2;
        const row = Math.floor(gIdx / 2);
        const gx = rx + col * 442;
        const gy = gStartY + row * 108;
        const gw = 428;
        const gh = 96;

        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = meta.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(gx, gy, gw, gh, 18);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = BB.font(700, 25);
        ctx.fillStyle = '#0f172a';
        ctx.fillText(meta.icon + ' ' + meta.name, gx + 18, gy + 36);

        ctx.font = BB.font(500, 22);
        ctx.fillStyle = '#475569';
        ctx.fillText(meta.shortDesc || meta.desc, gx + 18, gy + 73, gw - 32);
      });

      drawStyledButton(
        ctx, rx, cy + 668, rw, 116,
        isHard ? '🔥 [어려움] ' + st.name + ' 출전하기' : '▶ ' + st.name + ' 출전하기',
        themeAccent, isHard ? '#881337' : '#1e293b', 37
      );
      this.addButton('play_stage_' + st.id, rx, cy + 668, rw, 116, function () {
        game.startStage(sIdx);
      });

      ctx.restore();
    }

    // =========================================================================
    // 3. 모바일 세로 모드 전용 인게임 UI (1080 x 1920)
    // =========================================================================
    drawPortraitInGameUI(ctx, game) {
      const VW = game.viewW;
      const self = this;

      ctx.save();

      const pulse = 1 + game.dreamPulse * 0.14;
      ctx.fillStyle = 'rgba(28, 20, 42, 0.94)';
      ctx.strokeStyle = 'rgba(255, 240, 210, 0.72)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(18, 16, 316, 102, 24);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(72, 67);
      ctx.scale(pulse, pulse);
      const dg = ctx.createRadialGradient(-6, -6, 2, 0, 0, 30);
      dg.addColorStop(0, '#ffffff');
      dg.addColorStop(0.5, '#93e5ff');
      dg.addColorStop(1, '#c084fc');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.textAlign = 'left';
      ctx.font = BB.font(600, 25);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('꿈방울', 116, 48);
      ctx.font = BB.font(800, 50);
      ctx.fillStyle = '#fef08a';
      ctx.fillText(String(game.dream), 116, 100);

      ctx.fillStyle = 'rgba(28, 20, 42, 0.94)';
      ctx.strokeStyle = 'rgba(255, 210, 225, 0.62)';
      ctx.beginPath();
      ctx.roundRect(344, 16, 226, 102, 24);
      ctx.fill();
      ctx.stroke();

      for (let i = 0; i < BB.CONST.INITIAL_LIVES; i++) {
        const hx = 394 + i * 63;
        const hy = 51;
        ctx.fillStyle = i < game.lives ? '#fb7185' : 'rgba(148, 163, 184, 0.3)';
        ctx.strokeStyle = i < game.lives ? '#ffffff' : 'rgba(148,163,184,0.4)';
        ctx.lineWidth = 2.8;
        BB.drawHeart(ctx, hx, hy, 22);
        ctx.fill();
        ctx.stroke();
      }

      const speedActive = game.gameSpeed > 1.1;
      drawHudPillButton(ctx, 580, 16, 154, 102, speedActive ? '⚡ 2x' : '▶ 1x', speedActive ? '#f59e0b' : '#475569', 33);
      this.addButton('toggle_speed', 580, 16, 154, 102, function () {
        game.toggleSpeed();
      });

      drawHudPillButton(ctx, 744, 16, 154, 102, '📖 도감', '#6366f1', 31);
      this.addButton('open_codex_ingame', 744, 16, 154, 102, function () {
        BB.sound.play('ui_click');
        game.showCodex = true;
      });

      drawHudPillButton(ctx, 908, 16, 154, 102, '⏸ 메뉴', '#ec4899', 31);
      this.addButton('pause_game', 908, 16, 154, 102, function () {
        BB.sound.play('ui_click');
        game.state = 'PAUSED';
      });

      ctx.fillStyle = 'rgba(28, 20, 42, 0.94)';
      ctx.strokeStyle = 'rgba(255, 240, 210, 0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(18, 126, VW - 36, 100, 22);
      ctx.fill();
      ctx.stroke();

      const totalW = game.currentStage.waves.length;
      const wNum = Math.min(totalW, game.waveIndex + 1);
      const isHard = game.isHardMode ? game.isHardMode() : false;
      ctx.textAlign = 'left';
      ctx.font = BB.font(800, 31);
      ctx.fillStyle = isHard ? '#fda4af' : (wNum === totalW ? '#f5d0fe' : '#fde68a');
      ctx.fillText(
        (isHard ? '🔥 HARD · ' : '🌱 ') + 'STAGE ' + game.currentStage.id + ' · WAVE ' + wNum + '/' + totalW,
        44,
        169
      );

      ctx.textAlign = 'right';
      ctx.font = BB.font(600, 30);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText('처치 ' + game.kills + '  ·  남은 적 ' + game.getRemainingInWave(), VW - 44, 169);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(44, 186, VW - 88, 24, 12);
      ctx.fill();

      const pg = ctx.createLinearGradient(44, 0, VW - 44, 0);
      pg.addColorStop(0, '#38bdf8');
      pg.addColorStop(0.6, '#a855f7');
      pg.addColorStop(1, '#f43f5e');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.roundRect(46, 188, Math.max(16, (VW - 92) * game.getOverallProgress()), 20, 10);
      ctx.fill();

      const boss = game.enemies.find(e => !e.dead && e.spec.isBoss);
      if (boss) {
        const bx = 56;
        const by = 248;
        const bw = VW - 112;
        const bh = 62;
        ctx.fillStyle = 'rgba(42, 14, 68, 0.95)';
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 31);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.roundRect(bx + 5, by + 5, Math.max(18, (bw - 10) * Math.max(0, boss.hp / boss.maxHp)), bh - 10, 26);
        ctx.fill();

        ctx.font = BB.font(800, 31);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('👑 시크릿쁘니  ' + Math.ceil(boss.hp) + ' / ' + boss.maxHp, VW / 2, by + 42);
      } else if (game.bannerTimer > 0) {
        const p = game.bannerTimer / game.bannerDuration;
        const alpha = p > 0.85 ? (1 - p) / 0.15 : p < 0.18 ? p / 0.18 : 1.0;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = 'rgba(22, 14, 38, 0.94)';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(36, 250, VW - 72, 162, 28);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = BB.font(800, 38);
        ctx.fillStyle = '#fde047';
        ctx.fillText(game.bannerTitle, VW / 2, 305);

        ctx.font = BB.font(600, 31);
        ctx.fillStyle = '#ffffff';
        wrapKoreanText(ctx, game.bannerSubtitle, VW / 2, 353, VW - 120, 40, 'center');
        ctx.restore();
      }

      // [C] 디오라마 아래 2줄 대형 설명·안내 박스
      ctx.fillStyle = game.shovelMode ? 'rgba(154, 52, 18, 0.95)' : 'rgba(24, 16, 38, 0.95)';
      ctx.strokeStyle = game.selectedCard ? '#f59e0b' : game.shovelMode ? '#fb923c' : 'rgba(255,255,255,0.26)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(18, 820, VW - 36, 134, 24);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      if (game.selectedCard && BB.ALLY_DB[game.selectedCard]) {
        const sp = BB.ALLY_DB[game.selectedCard];
        ctx.font = BB.font(700, 35);
        ctx.fillStyle = '#fde047';
        ctx.fillText('👆 ' + sp.name + ' (' + sp.role + ') · 원하는 빈 칸을 터치하세요', VW / 2, 871);

        ctx.font = BB.font(500, 32);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(sp.shortDesc || sp.desc, VW / 2, 926);
      } else if (game.shovelMode) {
        ctx.font = BB.font(700, 35);
        ctx.fillStyle = '#fed7aa';
        ctx.fillText('⛏️ 철거 모드 활성화', VW / 2, 871);

        ctx.font = BB.font(500, 32);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('주황 점선 테두리가 표시된 아군을 터치하면 제거합니다.', VW / 2, 926);
      } else if (game.hoveredGimmickObj) {
        const gm = game.hoveredGimmickObj;
        ctx.font = BB.font(700, 35);
        ctx.fillStyle = '#7dd3fc';
        ctx.fillText(gm.icon + ' ' + gm.name, VW / 2, 871);

        ctx.font = BB.font(500, 32);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(gm.shortDesc || gm.desc, VW / 2, 926);
      } else {
        ctx.font = BB.font(700, 34);
        ctx.fillStyle = '#fde68a';
        ctx.fillText('🗺️ ' + game.currentStage.name, VW / 2, 871);

        ctx.font = BB.font(500, 31);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText('카드를 터치 후 타일 터치, 또는 전장으로 바로 드래그하세요', VW / 2, 926);
      }

      // [D] 엄지 퀵 액션 바
      const mbox = game.grid.getFirstMusicBox();
      const hasSelection = !!(game.selectedCard || game.shovelMode);

      drawHudPillButton(
        ctx, 18, 966, 328, 116,
        game.shovelMode ? '⛏️ 철거 켜짐' : '⛏️ 철거 모드',
        game.shovelMode ? '#ea580c' : '#475569',
        34
      );
      this.addButton('shovel_btn', 18, 966, 328, 116, function () {
        game.toggleShovel();
      });

      if (mbox) {
        const mReady = mbox.charge >= mbox.maxCharge;
        const pct = Math.floor((mbox.charge / mbox.maxCharge) * 100);
        drawHudPillButton(
          ctx, 360, 966, 360, 116,
          mReady ? '🎵 오르골 발동!' : '🎵 오르골 ' + pct + '%',
          mReady ? '#10b981' : '#334155',
          33
        );
        this.addButton('quick_music_box', 360, 966, 360, 116, function () {
          game.grid.tryTriggerMusicBox(mbox, game);
        });
      } else {
        drawHudPillButton(ctx, 360, 966, 360, 116, '⛶ 전체화면', '#334155', 33);
        this.addButton('quick_fullscreen', 360, 966, 360, 116, function () {
          game.toggleFullscreen();
        });
      }

      drawHudPillButton(
        ctx, 734, 966, 328, 116,
        '✕ 선택 취소',
        hasSelection ? '#e11d48' : '#1e293b',
        34
      );
      this.addButton('cancel_selection_btn', 734, 966, 328, 116, function () {
        game.cancelSelection();
      });

      // [E] 하단 3열 x 2행 초대형 아군 카드 덱
      const cardW = 336;
      const cardH = 394;
      const gapX = 18;
      const gapY = 20;
      const startX = 18;
      const startY = 1096;

      BB.ALLY_ORDER.forEach(function (id, idx) {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const spec = BB.ALLY_DB[id];
        const cdRem = game.deckCooldowns[id] || 0;
        const canAfford = game.dream >= spec.cost;
        const ready = cdRem <= 0 && canAfford;
        const isSelected = game.selectedCard === id;

        const cx = startX + col * (cardW + gapX);
        const cy = startY + row * (cardH + gapY) - (isSelected ? 10 : 0);

        ctx.fillStyle = isSelected ? '#fffbeb' : ready ? 'rgba(255, 252, 248, 0.98)' : 'rgba(203, 213, 225, 0.85)';
        ctx.strokeStyle = isSelected ? '#f59e0b' : ready ? spec.accent : '#64748b';
        ctx.lineWidth = isSelected ? 7 : 4;
        ctx.beginPath();
        ctx.roundRect(cx, cy, cardW, cardH, 28);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = spec.badgeBg;
        ctx.beginPath();
        ctx.roundRect(cx + 16, cy + 14, cardW - 32, 52, 18);
        ctx.fill();
        ctx.font = BB.font(700, 28);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(spec.role, cx + cardW / 2, cy + 49);

        const img = game.images.units[id];
        if (img && img.complete) {
          ctx.save();
          if (!ready) ctx.globalAlpha = 0.52;
          ctx.drawImage(img, cx + (cardW - 180) / 2, cy + 70, 180, 180);
          ctx.restore();
        }

        ctx.font = BB.font(800, 38);
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText(spec.name, cx + cardW / 2, cy + 295);

        ctx.fillStyle = canAfford ? '#0f172a' : '#991b1b';
        ctx.beginPath();
        ctx.roundRect(cx + 44, cy + 314, cardW - 88, 64, 32);
        ctx.fill();
        ctx.font = BB.font(800, 36);
        ctx.fillStyle = canAfford ? '#fef08a' : '#fecaca';
        ctx.fillText('💧 ' + spec.cost, cx + cardW / 2, cy + 358);

        if (cdRem > 0) {
          const cdRatio = Math.min(1, cdRem / spec.deckCd);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.70)';
          ctx.beginPath();
          ctx.roundRect(cx, cy + cardH * (1 - cdRatio), cardW, cardH * cdRatio, 26);
          ctx.fill();

          ctx.font = BB.font(800, 64);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 6;
          ctx.strokeText(cdRem.toFixed(1) + 's', cx + cardW / 2, cy + 215);
          ctx.fillText(cdRem.toFixed(1) + 's', cx + cardW / 2, cy + 215);
        }

        self.addButton('card_' + id, cx, cy, cardW, cardH, function () {
          game.selectCard(id);
        });
      });

      ctx.restore();
    }

    // =========================================================================
    // 4. 가로 모드 인게임 HUD & 대형 터치 덱
    // =========================================================================
    drawLandscapeTopHud(ctx, game) {
      ctx.save();
      const pulse = 1 + game.dreamPulse * 0.14;
      const mbox = game.grid.getFirstMusicBox();

      ctx.fillStyle = 'rgba(28, 20, 42, 0.92)';
      ctx.strokeStyle = 'rgba(255, 240, 210, 0.70)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(184, 12, 268, 94, 24);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(236, 59);
      ctx.scale(pulse, pulse);
      const dg = ctx.createRadialGradient(-6, -6, 2, 0, 0, 26);
      dg.addColorStop(0, '#ffffff');
      dg.addColorStop(0.5, '#93e5ff');
      dg.addColorStop(1, '#c084fc');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const diffSpec = game.getDifficultySpec ? game.getDifficultySpec() : BB.DIFFICULTIES.normal;
      ctx.textAlign = 'left';
      ctx.font = BB.font(600, 20);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('꿈방울 (+' + (diffSpec.passiveDreamAmount || 15) + ')', 276, 42);
      ctx.font = BB.font(800, 44);
      ctx.fillStyle = '#fef08a';
      ctx.fillText(String(game.dream), 276, 91);

      ctx.fillStyle = 'rgba(28, 20, 42, 0.92)';
      ctx.strokeStyle = 'rgba(255, 210, 225, 0.60)';
      ctx.beginPath();
      ctx.roundRect(464, 12, 216, 94, 24);
      ctx.fill();
      ctx.stroke();

      ctx.font = BB.font(600, 19);
      ctx.fillStyle = '#fbcfe8';
      ctx.textAlign = 'center';
      ctx.fillText('방어선 라이프', 572, 37);
      for (let i = 0; i < BB.CONST.INITIAL_LIVES; i++) {
        const hx = 514 + i * 58;
        const hy = 54;
        ctx.fillStyle = i < game.lives ? '#fb7185' : 'rgba(148, 163, 184, 0.32)';
        ctx.strokeStyle = i < game.lives ? '#ffffff' : 'rgba(148,163,184,0.4)';
        ctx.lineWidth = 2.4;
        BB.drawHeart(ctx, hx, hy, 19);
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(28, 20, 42, 0.92)';
      ctx.strokeStyle = 'rgba(255, 240, 210, 0.60)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(692, 12, 550, 94, 24);
      ctx.fill();
      ctx.stroke();

      const totalW = game.currentStage.waves.length;
      const wNum = Math.min(totalW, game.waveIndex + 1);
      const isHard = game.isHardMode ? game.isHardMode() : false;
      ctx.textAlign = 'left';
      ctx.font = BB.font(800, 25);
      ctx.fillStyle = isHard ? '#fda4af' : (wNum === totalW ? '#f5d0fe' : '#fde68a');
      ctx.fillText(
        (isHard ? '🔥 HARD · ' : '🌱 ') + 'STAGE ' + game.currentStage.id + ' · WAVE ' + wNum + '/' + totalW,
        716,
        49
      );

      ctx.textAlign = 'right';
      ctx.font = BB.font(600, 23);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText('처치 ' + game.kills + '  ·  남은 적 ' + game.getRemainingInWave(), 1216, 49);

      const barX = 718;
      const barY = 66;
      const barW = 498;
      const barH = 22;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 11);
      ctx.fill();

      const pg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      pg.addColorStop(0, '#38bdf8');
      pg.addColorStop(0.6, '#a855f7');
      pg.addColorStop(1, '#f43f5e');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.roundRect(barX + 2, barY + 2, Math.max(12, (barW - 4) * game.getOverallProgress()), barH - 4, 9);
      ctx.fill();

      let bx = 1254;
      const speedActive = game.gameSpeed > 1.1;
      drawHudPillButton(ctx, bx, 14, 140, 90, speedActive ? '⚡ 2.0x' : '▶ 1.0x', speedActive ? '#f59e0b' : '#475569', 26);
      this.addButton('toggle_speed', bx, 14, 140, 90, function () {
        game.toggleSpeed();
      });
      bx += 150;

      if (mbox) {
        const mReady = mbox.charge >= mbox.maxCharge;
        const pct = Math.floor((mbox.charge / mbox.maxCharge) * 100);
        drawHudPillButton(ctx, bx, 14, 178, 90, mReady ? '🎵 오르골!' : '🎵 ' + pct + '%', mReady ? '#10b981' : '#334155', 26);
        this.addButton('hud_music_box', bx, 14, 178, 90, function () {
          game.grid.tryTriggerMusicBox(mbox, game);
        });
        bx += 188;
      } else {
        const bgmOn = BB.sound.bgmEnabled;
        drawHudPillButton(ctx, bx, 14, 148, 90, bgmOn ? '🎵 BGM' : '🔇 BGM', bgmOn ? '#0ea5e9' : '#334155', 26);
        this.addButton('toggle_bgm', bx, 14, 148, 90, function () {
          BB.sound.toggleBgm();
        });
        bx += 158;
      }

      drawHudPillButton(ctx, bx, 14, 140, 90, '📖 도감', '#6366f1', 27);
      this.addButton('open_codex_ingame', bx, 14, 140, 90, function () {
        BB.sound.play('ui_click');
        game.showCodex = true;
      });
      bx += 150;

      drawHudPillButton(ctx, bx, 14, 140, 90, '⏸ 메뉴', '#ec4899', 27);
      this.addButton('pause_game', bx, 14, 140, 90, function () {
        BB.sound.play('ui_click');
        game.state = 'PAUSED';
      });

      ctx.restore();
    }

    drawLandscapeBossBar(ctx, game) {
      const boss = game.enemies.find(e => !e.dead && e.spec.isBoss);
      if (!boss) return;

      const w = 780;
      const h = 50;
      const x = (BB.CONST.WIDTH - w) / 2;
      const y = 114;

      ctx.save();
      ctx.fillStyle = 'rgba(42, 14, 68, 0.94)';
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 25);
      ctx.fill();
      ctx.stroke();

      const ratio = Math.max(0, boss.hp / boss.maxHp);
      const bg = ctx.createLinearGradient(x, 0, x + w, 0);
      bg.addColorStop(0, '#c084fc');
      bg.addColorStop(0.5, '#ec4899');
      bg.addColorStop(1, '#f43f5e');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(x + 5, y + 5, Math.max(14, (w - 10) * ratio), h - 10, 20);
      ctx.fill();

      ctx.font = BB.font(800, 26);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('👑 최종보스 시크릿쁘니  ' + Math.ceil(boss.hp) + ' / ' + boss.maxHp, x + w / 2, y + 34);
      ctx.restore();
    }

    drawLandscapeWaveBanner(ctx, game) {
      if (game.bannerTimer <= 0) return;
      const p = game.bannerTimer / game.bannerDuration;
      const alpha = p > 0.85 ? (1 - p) / 0.15 : p < 0.18 ? p / 0.18 : 1.0;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      const bw = 1040;
      const bh = 124;
      const bx = (BB.CONST.WIDTH - bw) / 2;
      const by = 148;

      ctx.fillStyle = 'rgba(22, 14, 38, 0.92)';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 26);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = BB.font(800, 36);
      ctx.fillStyle = '#fde047';
      ctx.fillText(game.bannerTitle, BB.CONST.WIDTH / 2, by + 50);

      ctx.font = BB.font(600, 26);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(game.bannerSubtitle, BB.CONST.WIDTH / 2, by + 94);
      ctx.restore();
    }

    drawLandscapeBottomDeck(ctx, game) {
      const deckY = 894;
      const cardW = 204;
      const cardH = 174;
      const gap = 14;
      const hasCancel = !!(game.selectedCard || game.shovelMode);
      const totalDeckW = 6 * cardW + 5 * gap + 16 + 158 + (hasCancel ? 14 + 148 : 0);
      const startX = Math.round((BB.CONST.WIDTH - totalDeckW) / 2);

      ctx.save();

      const activeId = game.selectedCard || this.hoveredCardId;
      if (activeId && BB.ALLY_DB[activeId]) {
        const sp = BB.ALLY_DB[activeId];
        ctx.fillStyle = 'rgba(20, 14, 34, 0.94)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(220, 824, 1480, 56, 20);
        ctx.fill();
        ctx.stroke();

        ctx.font = BB.font(600, 26);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fef08a';
        const hint = game.isMobileUI ? '(빈 타일 터치)' : '(타일 클릭/드래그 · 우클릭 취소)';
        ctx.fillText('[' + sp.name + ' · ' + sp.role + ']  ' + (sp.shortDesc || sp.desc) + '  ' + hint, 960, 861);
      } else if (game.shovelMode) {
        ctx.fillStyle = 'rgba(138, 44, 15, 0.95)';
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(330, 824, 1260, 56, 20);
        ctx.fill();
        ctx.stroke();

        ctx.font = BB.font(600, 26);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffedd5';
        ctx.fillText('⛏️ 철거 모드: 주황 테두리가 표시된 아군 피규어를 터치하면 제거합니다.', 960, 861);
      } else if (game.hoveredGimmickObj) {
        const gm = game.hoveredGimmickObj;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.strokeStyle = gm.color || '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(280, 824, 1360, 56, 20);
        ctx.fill();
        ctx.stroke();

        ctx.font = BB.font(600, 26);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#bae6fd';
        ctx.fillText(gm.icon + ' [' + gm.name + ']  ' + (gm.shortDesc || gm.desc), 960, 861);
      }

      const self = this;
      BB.ALLY_ORDER.forEach(function (id, idx) {
        const spec = BB.ALLY_DB[id];
        const cdRem = game.deckCooldowns[id] || 0;
        const canAfford = game.dream >= spec.cost;
        const ready = cdRem <= 0 && canAfford;
        const isSelected = game.selectedCard === id;

        const cx = startX + idx * (cardW + gap);
        const cy = deckY - (isSelected ? 14 : 0);

        ctx.fillStyle = isSelected ? '#fffbeb' : ready ? 'rgba(255, 252, 248, 0.98)' : 'rgba(203, 213, 225, 0.84)';
        ctx.strokeStyle = isSelected ? '#f59e0b' : ready ? spec.accent : '#64748b';
        ctx.lineWidth = isSelected ? 5.5 : 3.2;
        ctx.beginPath();
        ctx.roundRect(cx, cy, cardW, cardH, 22);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = spec.badgeBg;
        ctx.beginPath();
        ctx.roundRect(cx + 10, cy + 8, cardW - 20, 32, 11);
        ctx.fill();
        ctx.font = BB.font(700, 20);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        const roleLabel = game.isMobileUI ? spec.role : '[' + spec.hotkey + '] ' + spec.role;
        ctx.fillText(roleLabel, cx + cardW / 2, cy + 30);

        const img = game.images.units[id];
        if (img && img.complete) {
          ctx.save();
          if (!ready) ctx.globalAlpha = 0.55;
          ctx.drawImage(img, cx + (cardW - 82) / 2, cy + 38, 82, 82);
          ctx.restore();
        }

        ctx.font = BB.font(800, 26);
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText(spec.name, cx + cardW / 2, cy + 135);

        ctx.fillStyle = canAfford ? '#0f172a' : '#991b1b';
        ctx.beginPath();
        ctx.roundRect(cx + 28, cy + 141, cardW - 56, 28, 14);
        ctx.fill();
        ctx.font = BB.font(800, 22);
        ctx.fillStyle = canAfford ? '#fef08a' : '#fecaca';
        ctx.fillText('💧 ' + spec.cost, cx + cardW / 2, cy + 162);

        if (cdRem > 0) {
          const cdRatio = Math.min(1, cdRem / spec.deckCd);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.70)';
          ctx.beginPath();
          ctx.roundRect(cx, cy + cardH * (1 - cdRatio), cardW, cardH * cdRatio, 20);
          ctx.fill();

          ctx.font = BB.font(800, 40);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 4.5;
          ctx.strokeText(cdRem.toFixed(1) + 's', cx + cardW / 2, cy + 98);
          ctx.fillText(cdRem.toFixed(1) + 's', cx + cardW / 2, cy + 98);
        }

        self.addButton('card_' + id, cx, cy, cardW, cardH, function () {
          game.selectCard(id);
        });
      });

      const sx = startX + 6 * (cardW + gap) + 2;
      const sy = deckY - (game.shovelMode ? 12 : 0);
      const sw = 158;
      const sh = cardH;

      ctx.fillStyle = game.shovelMode ? '#ffedd5' : 'rgba(42, 30, 56, 0.95)';
      ctx.strokeStyle = game.shovelMode ? '#f97316' : '#cbd5e1';
      ctx.lineWidth = game.shovelMode ? 5.5 : 3.2;
      ctx.beginPath();
      ctx.roundRect(sx, sy, sw, sh, 22);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '46px ' + EMOJI_FONT;
      ctx.fillText('⛏️', sx + sw / 2, sy + 76);
      ctx.font = BB.font(700, 26);
      ctx.fillStyle = game.shovelMode ? '#9a3412' : '#f8fafc';
      ctx.fillText('철거하기', sx + sw / 2, sy + 125);
      if (!game.isMobileUI) {
        ctx.font = BB.font(600, 17);
        ctx.fillStyle = game.shovelMode ? '#c2410c' : '#cbd5e1';
        ctx.fillText('단축키 [S]', sx + sw / 2, sy + 153);
      }

      this.addButton('shovel_btn', sx, sy, sw, sh, function () {
        game.toggleShovel();
      });

      if (hasCancel) {
        const canX = sx + sw + 14;
        drawStyledButton(ctx, canX, deckY + 8, 148, cardH - 16, '✕ 취소', '#f43f5e', '#be123c', 28);
        this.addButton('cancel_selection_btn', canX, deckY + 8, 148, cardH - 16, function () {
          game.cancelSelection();
        });
      }

      ctx.restore();
    }

    // =========================================================================
    // 5. 도감 모달 (3탭 분할 [아군 / 적군 / 맵 기믹] + 초대형 상세 확대 카드!)
    // =========================================================================
    drawCodexModal(ctx, game) {
      const VW = game.viewW;
      const VH = game.viewH;
      const self = this;

      const tab = game.codexTab || 'ally';
      const list = game.getCodexList();
      const selIdx = Math.max(0, Math.min(list.length - 1, game.codexSelectedIndex || 0));
      const selId = list[selIdx];

      ctx.save();
      ctx.fillStyle = 'rgba(14, 10, 26, 0.88)';
      ctx.fillRect(0, 0, VW, VH);

      if (game.isPortrait) {
        const pw = 1024;
        const ph = 1860;
        const px = (VW - pw) / 2;
        const py = (VH - ph) / 2;

        ctx.fillStyle = '#fcfaf7';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 38);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = BB.font(800, 48);
        ctx.fillStyle = '#1e162b';
        ctx.fillText('📖 말랑쁘니 & 기믹 도감', VW / 2, py + 76);

        const tabDefs = [
          { key: 'ally', label: '🛡️ 아군 (6)', onCol: '#10b981', darkCol: '#047857' },
          { key: 'enemy', label: '👾 적군 (6)', onCol: '#a855f7', darkCol: '#6b21a8' },
          { key: 'gimmick', label: '🧩 기믹 (7)', onCol: '#f59e0b', darkCol: '#b45309' }
        ];
        const tW = 304;
        const tGap = 18;
        tabDefs.forEach(function (td, i) {
          const tx = px + 38 + i * (tW + tGap);
          const active = tab === td.key;
          drawStyledButton(
            ctx, tx, py + 106, tW, 96, td.label,
            active ? td.onCol : '#94a3b8',
            active ? td.darkCol : '#64748b',
            33
          );
          self.addButton('codex_tab_' + td.key, tx, py + 106, tW, 96, function () {
            game.setCodexTab(td.key);
          });
        });

        const cols = tab === 'gimmick' ? 4 : 3;
        const itemW = tab === 'gimmick' ? 226 : 306;
        const itemH = 216;
        const gapX = tab === 'gimmick' ? 14 : 15;
        const gapY = 16;
        const gridStartX = px + (pw - (cols * itemW + (cols - 1) * gapX)) / 2;
        const gridStartY = py + 230;

        list.forEach(function (id, idx) {
          const c = idx % cols;
          const r = Math.floor(idx / cols);
          const ix = gridStartX + c * (itemW + gapX);
          const iy = gridStartY + r * (itemH + gapY);
          const isSel = idx === selIdx;

          const itemMeta = tab === 'ally' ? BB.ALLY_DB[id]
            : tab === 'enemy' ? BB.ENEMY_DB[id]
            : BB.GIMMICK_META[id];

          ctx.fillStyle = isSel ? '#fffbeb' : '#ffffff';
          ctx.strokeStyle = isSel ? '#f59e0b' : (itemMeta.accent || itemMeta.color || '#cbd5e1');
          ctx.lineWidth = isSel ? 6.5 : 3;
          ctx.beginPath();
          ctx.roundRect(ix, iy, itemW, itemH, 24);
          ctx.fill();
          ctx.stroke();

          if (tab === 'gimmick') {
            ctx.textAlign = 'center';
            ctx.font = '66px ' + EMOJI_FONT;
            ctx.fillText(itemMeta.icon, ix + itemW / 2, iy + 104);

            ctx.font = BB.font(700, 27);
            ctx.fillStyle = '#0f172a';
            ctx.fillText(itemMeta.name.split(' ')[0], ix + itemW / 2, iy + 160);
            const restName = itemMeta.name.split(' ').slice(1).join(' ');
            if (restName) {
              ctx.font = BB.font(600, 25);
              ctx.fillStyle = '#475569';
              ctx.fillText(restName, ix + itemW / 2, iy + 195);
            }
          } else {
            const img = game.images.units[id];
            if (img && img.complete) {
              ctx.drawImage(img, ix + (itemW - 132) / 2, iy + 12, 132, 132);
            }
            ctx.textAlign = 'center';
            ctx.font = BB.font(700, 31);
            ctx.fillStyle = '#0f172a';
            ctx.fillText(itemMeta.name, ix + itemW / 2, iy + 188);
          }

          self.addButton('codex_item_' + idx, ix, iy, itemW, itemH, function () {
            BB.sound.play('ui_click');
            game.codexSelectedIndex = idx;
          });
        });

        const dx = px + 36;
        const dy = py + 700;
        const dw = pw - 72;
        const dh = 994;

        this.drawCodexDetailCardPortrait(ctx, game, tab, selId, dx, dy, dw, dh);

        drawStyledButton(ctx, VW / 2 - 260, py + ph - 140, 520, 114, '✕ 도감 닫기', '#ef4444', '#b91c1c', 38);
        this.addButton('close_codex', VW / 2 - 260, py + ph - 140, 520, 114, function () {
          BB.sound.play('ui_click');
          game.showCodex = false;
        });

        ctx.restore();
        return;
      }

      // 가로 모드 도감 (1920 x 1080)
      const pw = 1824;
      const ph = 1012;
      const px = (VW - pw) / 2;
      const py = (VH - ph) / 2;

      ctx.fillStyle = '#fcfaf7';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 34);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = BB.font(800, 42);
      ctx.fillStyle = '#1e162b';
      ctx.fillText('📖 말랑쁘니 & 기믹 도감', px + 44, py + 78);

      const tabDefs = [
        { key: 'ally', label: '🛡️ 아군 (6)', onCol: '#10b981', darkCol: '#047857' },
        { key: 'enemy', label: '👾 적군 (6)', onCol: '#a855f7', darkCol: '#6b21a8' },
        { key: 'gimmick', label: '🧩 기믹 (7)', onCol: '#f59e0b', darkCol: '#b45309' }
      ];
      tabDefs.forEach(function (td, i) {
        const tx = px + 680 + i * 282;
        const active = tab === td.key;
        drawStyledButton(
          ctx, tx, py + 24, 266, 82, td.label,
          active ? td.onCol : '#94a3b8',
          active ? td.darkCol : '#64748b',
          28
        );
        self.addButton('codex_tab_' + td.key, tx, py + 24, 266, 82, function () {
          game.setCodexTab(td.key);
        });
      });

      drawStyledButton(ctx, px + pw - 252, py + 24, 212, 82, '✕ 닫기', '#ef4444', '#b91c1c', 28);
      this.addButton('close_codex', px + pw - 252, py + 24, 212, 82, function () {
        BB.sound.play('ui_click');
        game.showCodex = false;
      });

      const gx0 = px + 40;
      const gy0 = py + 132;
      const rowsCount = Math.ceil(list.length / 2);
      const cellW = 330;
      const cellH = rowsCount === 4 ? 198 : 268;
      const cellGapX = 18;
      const cellGapY = 16;

      list.forEach(function (id, idx) {
        const c = idx % 2;
        const r = Math.floor(idx / 2);
        const ix = gx0 + c * (cellW + cellGapX);
        const iy = gy0 + r * (cellH + cellGapY);
        const isSel = idx === selIdx;

        const itemMeta = tab === 'ally' ? BB.ALLY_DB[id]
          : tab === 'enemy' ? BB.ENEMY_DB[id]
          : BB.GIMMICK_META[id];

        ctx.fillStyle = isSel ? '#fffbeb' : '#ffffff';
        ctx.strokeStyle = isSel ? '#f59e0b' : (itemMeta.accent || itemMeta.color || '#cbd5e1');
        ctx.lineWidth = isSel ? 5.5 : 2.8;
        ctx.beginPath();
        ctx.roundRect(ix, iy, cellW, cellH, 22);
        ctx.fill();
        ctx.stroke();

        if (tab === 'gimmick') {
          ctx.textAlign = 'center';
          ctx.font = '58px ' + EMOJI_FONT;
          ctx.fillText(itemMeta.icon, ix + cellW / 2, iy + 96);
          ctx.font = BB.font(700, 27);
          ctx.fillStyle = '#0f172a';
          ctx.fillText(itemMeta.name, ix + cellW / 2, iy + 162);
        } else {
          const imgSz = rowsCount === 4 ? 116 : 156;
          const img = game.images.units[id];
          if (img && img.complete) {
            ctx.drawImage(img, ix + (cellW - imgSz) / 2, iy + 14, imgSz, imgSz);
          }
          ctx.textAlign = 'center';
          ctx.font = BB.font(700, 30);
          ctx.fillStyle = '#0f172a';
          ctx.fillText(itemMeta.name, ix + cellW / 2, iy + cellH - 52);

          ctx.font = BB.font(600, 22);
          ctx.fillStyle = tab === 'ally' ? itemMeta.badgeBg : '#7e22ce';
          ctx.fillText(itemMeta.role, ix + cellW / 2, iy + cellH - 18);
        }

        self.addButton('codex_item_' + idx, ix, iy, cellW, cellH, function () {
          BB.sound.play('ui_click');
          game.codexSelectedIndex = idx;
        });
      });

      const dx = px + 748;
      const dy = py + 132;
      const dw = pw - 788;
      const dh = 840;

      this.drawCodexDetailCardLandscape(ctx, game, tab, selId, dx, dy, dw, dh);

      ctx.restore();
    }

    drawCodexDetailCardPortrait(ctx, game, tab, id, dx, dy, dw, dh) {
      const meta = tab === 'ally' ? BB.ALLY_DB[id]
        : tab === 'enemy' ? BB.ENEMY_DB[id]
        : BB.GIMMICK_META[id];
      if (!meta) return;

      const borderCol = tab === 'ally' ? meta.accent : tab === 'enemy' ? '#c084fc' : meta.color;
      ctx.fillStyle = tab === 'enemy' ? '#faf5ff' : '#ffffff';
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.roundRect(dx, dy, dw, dh, 30);
      ctx.fill();
      ctx.stroke();

      drawStyledButton(ctx, dx + 24, dy + 110, 92, 128, '◀', '#64748b', '#334155', 40);
      this.addButton('codex_prev', dx + 24, dy + 110, 92, 128, function () {
        game.stepCodexEntry(-1);
      });

      drawStyledButton(ctx, dx + dw - 116, dy + 110, 92, 128, '▶', '#64748b', '#334155', 40);
      this.addButton('codex_next', dx + dw - 116, dy + 110, 92, 128, function () {
        game.stepCodexEntry(1);
      });

      if (tab === 'gimmick') {
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = meta.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(dx + 250, dy + 180, 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = '100px ' + EMOJI_FONT;
        ctx.fillText(meta.icon, dx + 250, dy + 214);
      } else {
        const img = game.images.units[id];
        if (img && img.complete) {
          ctx.drawImage(img, dx + 130, dy + 32, 260, 260);
        }
      }

      ctx.textAlign = 'left';
      ctx.font = BB.font(800, 56);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(meta.name, dx + 410, dy + 148, dw - 540);

      const roleText = tab === 'gimmick' ? '맵 특수 기믹 · 장치' : meta.role;
      const roleBg = tab === 'ally' ? meta.badgeBg : tab === 'enemy' ? '#9333ea' : '#0f766e';
      ctx.fillStyle = roleBg;
      ctx.beginPath();
      ctx.roundRect(dx + 410, dy + 178, 340, 68, 22);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.font = BB.font(700, 33);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(roleText, dx + 410 + 170, dy + 223);

      const diffSpec = game.getDifficultySpec ? game.getDifficultySpec() : BB.DIFFICULTIES.normal;
      const isHardEnemy = tab === 'enemy' && diffSpec && diffSpec.id === 'hard';
      const stats = [];
      if (tab === 'ally') {
        stats.push('💧 비용 ' + meta.cost);
        stats.push('❤️ 체력 ' + (meta.type === 'bomb' ? '무적' : meta.hp));
        stats.push(meta.type === 'resource' ? '✨ 생산 +25' : '⚔️ 공격력 ' + meta.atk);
        stats.push('⏱️ 쿨타임 ' + meta.deckCd + '초');
      } else if (tab === 'enemy') {
        const eHp = Math.round(meta.hp * (diffSpec.enemyHpMult || 1));
        const eAtk = Math.round(meta.atk * (diffSpec.enemyAtkMult || 1));
        const eSpd = Math.round(meta.speed * (diffSpec.enemySpeedMult || 1));
        stats.push('❤️ 체력 ' + eHp + (isHardEnemy ? ' 🔥' : ''));
        stats.push('⚔️ 공격력 ' + eAtk + (isHardEnemy ? ' 🔥' : ''));
        stats.push('👟 이동속도 ' + eSpd + (isHardEnemy ? ' 🔥' : ''));
        stats.push('💧 처치보상 +' + meta.dropDream);
      }

      let descBoxY = dy + 330;
      if (stats.length > 0) {
        const sw = (dw - 92) / 2;
        stats.forEach(function (stTxt, sIdx) {
          const sc = sIdx % 2;
          const sr = Math.floor(sIdx / 2);
          const sx = dx + 36 + sc * (sw + 20);
          const sy = dy + 318 + sr * 92;

          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(sx, sy, sw, 76, 18);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.font = BB.font(700, 34);
          ctx.fillStyle = '#0f172a';
          ctx.fillText(stTxt, sx + sw / 2, sy + 50);
        });
        descBoxY = dy + 520;
      } else {
        descBoxY = dy + 340;
      }

      const descBoxH = dh - (descBoxY - dy) - 36;
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(dx + 36, descBoxY, dw - 72, descBoxH, 24);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = BB.font(800, 34);
      ctx.fillStyle = '#0284c7';
      ctx.fillText('✦ 특징 및 활용 포인트', dx + 68, descBoxY + 62);

      ctx.font = BB.font(500, 41);
      ctx.fillStyle = '#1e293b';
      wrapKoreanText(ctx, meta.desc, dx + 68, descBoxY + 132, dw - 136, 60, 'left');
    }

    drawCodexDetailCardLandscape(ctx, game, tab, id, dx, dy, dw, dh) {
      const meta = tab === 'ally' ? BB.ALLY_DB[id]
        : tab === 'enemy' ? BB.ENEMY_DB[id]
        : BB.GIMMICK_META[id];
      if (!meta) return;

      const borderCol = tab === 'ally' ? meta.accent : tab === 'enemy' ? '#c084fc' : meta.color;
      ctx.fillStyle = tab === 'enemy' ? '#faf5ff' : '#ffffff';
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.roundRect(dx, dy, dw, dh, 28);
      ctx.fill();
      ctx.stroke();

      if (tab === 'gimmick') {
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = meta.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(dx + 165, dy + 165, 96, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = '92px ' + EMOJI_FONT;
        ctx.fillText(meta.icon, dx + 165, dy + 196);
      } else {
        const img = game.images.units[id];
        if (img && img.complete) {
          ctx.drawImage(img, dx + 36, dy + 24, 260, 260);
        }
      }

      ctx.textAlign = 'left';
      ctx.font = BB.font(800, 52);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(meta.name, dx + 324, dy + 124);

      const roleText = tab === 'gimmick' ? '맵 특수 기믹 · 장치' : meta.role;
      const roleBg = tab === 'ally' ? meta.badgeBg : tab === 'enemy' ? '#9333ea' : '#0f766e';
      ctx.fillStyle = roleBg;
      ctx.beginPath();
      ctx.roundRect(dx + 324, dy + 152, 320, 62, 20);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.font = BB.font(700, 29);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(roleText, dx + 324 + 160, dy + 193);

      const diffSpec = game.getDifficultySpec ? game.getDifficultySpec() : BB.DIFFICULTIES.normal;
      const isHardEnemy = tab === 'enemy' && diffSpec && diffSpec.id === 'hard';
      const stats = [];
      if (tab === 'ally') {
        stats.push('💧 비용 ' + meta.cost);
        stats.push('❤️ 체력 ' + (meta.type === 'bomb' ? '무적' : meta.hp));
        stats.push(meta.type === 'resource' ? '✨ 꿈방울 +25' : '⚔️ 공격력 ' + meta.atk);
        stats.push('⏱️ 재사용 ' + meta.deckCd + '초');
      } else if (tab === 'enemy') {
        const eHp = Math.round(meta.hp * (diffSpec.enemyHpMult || 1));
        const eAtk = Math.round(meta.atk * (diffSpec.enemyAtkMult || 1));
        const eSpd = Math.round(meta.speed * (diffSpec.enemySpeedMult || 1));
        stats.push('❤️ 체력 ' + eHp + (isHardEnemy ? ' 🔥' : ''));
        stats.push('⚔️ 공격력 ' + eAtk + (isHardEnemy ? ' 🔥' : ''));
        stats.push('👟 이동속도 ' + eSpd + (isHardEnemy ? ' 🔥' : ''));
        stats.push('💧 처치보상 +' + meta.dropDream);
      }

      let descBoxY = dy + 300;
      if (stats.length > 0) {
        const sw = (dw - 96) / 2;
        stats.forEach(function (stTxt, sIdx) {
          const sc = sIdx % 2;
          const sr = Math.floor(sIdx / 2);
          const sx = dx + 38 + sc * (sw + 20);
          const sy = dy + 294 + sr * 80;

          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(sx, sy, sw, 66, 16);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.font = BB.font(700, 30);
          ctx.fillStyle = '#0f172a';
          ctx.fillText(stTxt, sx + sw / 2, sy + 44);
        });
        descBoxY = dy + 472;
      } else {
        descBoxY = dy + 310;
      }

      const descBoxH = dh - (descBoxY - dy) - 118;
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(dx + 38, descBoxY, dw - 76, descBoxH, 22);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = BB.font(800, 30);
      ctx.fillStyle = '#0284c7';
      ctx.fillText('✦ 특징 및 활용 포인트', dx + 68, descBoxY + 52);

      ctx.font = BB.font(500, 36);
      ctx.fillStyle = '#1e293b';
      wrapKoreanText(ctx, meta.desc, dx + 68, descBoxY + 112, dw - 136, 52, 'left');

      drawStyledButton(ctx, dx + 38, dy + dh - 94, 240, 74, '◀ 이전 항목', '#64748b', '#334155', 27);
      this.addButton('codex_prev', dx + 38, dy + dh - 94, 240, 74, function () {
        game.stepCodexEntry(-1);
      });

      const list = game.getCodexList();
      const curIdx = Math.max(0, Math.min(list.length - 1, game.codexSelectedIndex || 0));
      ctx.textAlign = 'center';
      ctx.font = BB.font(700, 28);
      ctx.fillStyle = '#475569';
      ctx.fillText((curIdx + 1) + ' / ' + list.length, dx + dw / 2, dy + dh - 46);

      drawStyledButton(ctx, dx + dw - 278, dy + dh - 94, 240, 74, '다음 항목 ▶', '#64748b', '#334155', 27);
      this.addButton('codex_next', dx + dw - 278, dy + dh - 94, 240, 74, function () {
        game.stepCodexEntry(1);
      });
    }

    // =========================================================================
    // 6. 일시정지 / 환경설정 모달
    // =========================================================================
    drawPauseModal(ctx, game) {
      const VW = game.viewW;
      const VH = game.viewH;
      const sc = game.isPortrait ? 1.42 : 1.18;

      ctx.save();
      ctx.fillStyle = 'rgba(14, 10, 26, 0.80)';
      ctx.fillRect(0, 0, VW, VH);

      const pw = Math.round(670 * sc);
      const ph = Math.round(590 * sc);
      const px = (VW - pw) / 2;
      const py = (VH - ph) / 2;

      const isHard = game.isHardMode ? game.isHardMode() : false;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = isHard ? '#e11d48' : '#f59e0b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 34);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = BB.font(800, 38 * sc);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(
        '⏸ [' + (isHard ? '🔥어려움' : '🌱노말') + '] ' + game.currentStage.name,
        VW / 2,
        py + Math.round(78 * sc),
        pw - Math.round(56 * sc)
      );

      const subW = Math.round((pw - 96 * sc) / 3);
      const subY = py + Math.round(112 * sc);
      const subH = Math.round(74 * sc);
      const bgmOn = BB.sound.bgmEnabled;
      const sfxOn = BB.sound.sfxEnabled;

      drawStyledButton(ctx, px + Math.round(36 * sc), subY, subW, subH, bgmOn ? '🎵 BGM 켜짐' : '🔇 BGM 꺼짐', bgmOn ? '#0ea5e9' : '#64748b', '#1e293b', Math.round(22 * sc));
      this.addButton('pause_bgm', px + Math.round(36 * sc), subY, subW, subH, function () {
        BB.sound.toggleBgm();
      });

      drawStyledButton(ctx, px + Math.round(48 * sc) + subW, subY, subW, subH, sfxOn ? '🔊 효과음 켜짐' : '🔇 효과음 꺼짐', sfxOn ? '#10b981' : '#64748b', '#1e293b', Math.round(22 * sc));
      this.addButton('pause_sfx', px + Math.round(48 * sc) + subW, subY, subW, subH, function () {
        BB.sound.toggleSfx();
      });

      drawStyledButton(ctx, px + Math.round(60 * sc) + subW * 2, subY, subW, subH, '⛶ 전체화면', '#6366f1', '#312e81', Math.round(22 * sc));
      this.addButton('pause_full', px + Math.round(60 * sc) + subW * 2, subY, subW, subH, function () {
        game.toggleFullscreen();
      });

      const btnW = pw - Math.round(96 * sc);
      const btnX = px + Math.round(48 * sc);
      const btnH = Math.round(76 * sc);

      drawStyledButton(ctx, btnX, py + Math.round(212 * sc), btnW, btnH, '▶ 계속 플레이', '#10b981', '#047857', Math.round(29 * sc));
      this.addButton('resume_btn', btnX, py + Math.round(212 * sc), btnW, btnH, function () {
        BB.sound.play('ui_click');
        game.state = 'PLAYING';
      });

      drawStyledButton(ctx, btnX, py + Math.round(304 * sc), btnW, btnH, '🔄 현재 스테이지 다시 시작', '#3b82f6', '#1d4ed8', Math.round(27 * sc));
      this.addButton('restart_btn', btnX, py + Math.round(304 * sc), btnW, btnH, function () {
        game.startNewGame();
      });

      drawStyledButton(ctx, btnX, py + Math.round(396 * sc), btnW, btnH, '🗺️ 스테이지 선택 화면으로', '#8b5cf6', '#6d28d9', Math.round(27 * sc));
      this.addButton('to_stage_select_btn', btnX, py + Math.round(396 * sc), btnW, btnH, function () {
        game.openStageSelect();
      });

      drawStyledButton(ctx, btnX, py + Math.round(488 * sc), btnW, Math.round(70 * sc), '🏠 메인 타이틀로', '#64748b', '#334155', Math.round(25 * sc));
      this.addButton('to_title_btn', btnX, py + Math.round(488 * sc), btnW, Math.round(70 * sc), function () {
        BB.sound.play('ui_click');
        game.state = 'TITLE';
      });

      ctx.restore();
    }

    // =========================================================================
    // 7. 승리 / 패배 결과 모달
    // =========================================================================
    drawResultModal(ctx, game) {
      const VW = game.viewW;
      const VH = game.viewH;
      const isWin = game.state === 'VICTORY';
      const hasNextStage = isWin && game.stageIndex < BB.STAGES.length - 1;
      const sc = game.isPortrait ? 1.24 : 1.12;

      ctx.save();
      ctx.fillStyle = 'rgba(14, 10, 26, 0.84)';
      ctx.fillRect(0, 0, VW, VH);

      const pw = Math.round(800 * sc);
      const ph = Math.round(540 * sc);
      const px = (VW - pw) / 2;
      const py = (VH - ph) / 2;

      const isHard = game.isHardMode ? game.isHardMode() : false;
      const diffTag = isHard ? '[🔥어려움]' : '[🌱노말]';

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = isWin ? (isHard ? '#e11d48' : '#fbbf24') : '#fb7185';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 36);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = BB.font(800, 48 * sc);
      ctx.fillStyle = isWin ? (isHard ? '#be123c' : '#d97706') : '#e11d48';
      ctx.fillText(
        isWin
          ? (isHard ? '🔥 ' : '🎉 ') + game.currentStage.id + '단계 ' + diffTag + ' 클리어!'
          : '💔 ' + diffTag + ' 방어선 돌파...',
        VW / 2,
        py + Math.round(96 * sc),
        pw - Math.round(56 * sc)
      );

      if (isWin) {
        const stars = '★'.repeat(game.lives) + '☆'.repeat(Math.max(0, 3 - game.lives));
        ctx.font = BB.font(800, 58 * sc);
        ctx.fillStyle = isHard ? '#e11d48' : '#f59e0b';
        ctx.fillText(stars, VW / 2, py + Math.round(174 * sc));
      } else {
        ctx.font = BB.font(700, 30 * sc);
        ctx.fillStyle = '#475569';
        ctx.fillText(
          game.currentStage.name + '  ·  도달 WAVE ' + Math.min(game.currentStage.waves.length, game.waveIndex + 1),
          VW / 2,
          py + Math.round(166 * sc)
        );
      }

      const mins = Math.floor(game.playTime / 60);
      const secs = Math.floor(game.playTime % 60);
      const timeStr = mins + '분 ' + (secs < 10 ? '0' : '') + secs + '초';

      ctx.font = BB.font(700, 29 * sc);
      ctx.fillStyle = '#0f172a';
      ctx.fillText('물리친 침공 쁘니 ' + game.kills + '기   ·   소요 시간 ' + timeStr, VW / 2, py + Math.round(246 * sc));

      ctx.font = BB.font(500, 26 * sc);
      ctx.fillStyle = '#475569';
      wrapKoreanText(
        ctx,
        isWin
          ? (hasNextStage
              ? '새로운 테마 배경과 기믹이 기다리는 다음 단계에 도전하세요!'
              : (isHard
                  ? '전 스테이지(1~5단계) 🔥 어려움 모드를 완벽히 제패하셨습니다!'
                  : '노말 전 단계를 제패하셨습니다! 스테이지 선택창에서 🔥 어려움 모드에도 도전해 보세요!'))
          : '맵의 특수 기믹(⭐패드, 🎁상자, 🎵오르골)을 활용하거나 난이도를 조정해 보세요!',
        VW / 2,
        py + Math.round(306 * sc),
        pw - Math.round(80 * sc),
        Math.round(36 * sc),
        'center'
      );

      const btnY = py + Math.round(392 * sc);
      const btnH = Math.round(94 * sc);

      if (hasNextStage) {
        const w1 = Math.round(268 * sc);
        const w2 = Math.round(210 * sc);
        const gap = Math.round(18 * sc);
        const sx = VW / 2 - (w1 + w2 * 2 + gap * 2) / 2;

        drawStyledButton(ctx, sx, btnY, w1, btnH, '▶ 다음 단계로', '#10b981', '#047857', Math.round(28 * sc));
        this.addButton('next_stage_btn', sx, btnY, w1, btnH, function () {
          game.startStage(game.stageIndex + 1);
        });

        drawStyledButton(ctx, sx + w1 + gap, btnY, w2, btnH, '🔄 다시 하기', '#ff5c8a', '#db2777', Math.round(26 * sc));
        this.addButton('retry_btn', sx + w1 + gap, btnY, w2, btnH, function () {
          game.startNewGame();
        });

        drawStyledButton(ctx, sx + w1 + w2 + gap * 2, btnY, w2, btnH, '🗺️ 맵 선택', '#3b82f6', '#2563eb', Math.round(26 * sc));
        this.addButton('result_stage_btn', sx + w1 + w2 + gap * 2, btnY, w2, btnH, function () {
          game.openStageSelect();
        });
      } else {
        const bw = Math.round(285 * sc);
        drawStyledButton(ctx, VW / 2 - bw - 18, btnY, bw, btnH, '🔄 다시 도전하기', '#ff5c8a', '#db2777', Math.round(28 * sc));
        this.addButton('retry_btn', VW / 2 - bw - 18, btnY, bw, btnH, function () {
          game.startNewGame();
        });

        drawStyledButton(ctx, VW / 2 + 18, btnY, bw, btnH, '🗺️ 스테이지 선택', '#3b82f6', '#2563eb', Math.round(28 * sc));
        this.addButton('result_stage_btn', VW / 2 + 18, btnY, bw, btnH, function () {
          game.openStageSelect();
        });
      }

      ctx.restore();
    }
  }

  function drawStageDioramaPreview(ctx, st, bgImg, x, y, w, h) {
    ctx.save();

    ctx.fillStyle = '#1e162b';
    ctx.strokeStyle = st.badgeColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(x - 3, y - 3, w + 6, h + 6, 22);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 18);
    ctx.clip();

    if (bgImg && bgImg.complete && bgImg.naturalWidth) {
      ctx.drawImage(bgImg, x, y, w, h);
    } else {
      ctx.fillStyle = '#efe4cf';
      ctx.fillRect(x, y, w, h);
    }

    const gx0 = x + (BB.CONST.GRID_X / 1920) * w;
    const gy0 = y + (BB.CONST.GRID_Y / 1080) * h;
    const gw = ((BB.CONST.GRID_COLS * BB.CONST.CELL_W) / 1920) * w;
    const gh = ((BB.CONST.GRID_ROWS * BB.CONST.CELL_H) / 1080) * h;
    const cw = gw / 9;
    const ch = gh / 5;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(gx0, gy0, gw, gh);

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 9; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(30,20,10,0.08)';
        ctx.fillRect(gx0 + c * cw + 1, gy0 + r * ch + 1, cw - 2, ch - 2);
      }
    }

    const colMap = {
      POWER_PAD: 'rgba(253, 224, 71, 0.88)',
      BLOCK: 'rgba(148, 163, 184, 0.90)',
      SPEED_BELT: 'rgba(251, 113, 133, 0.88)',
      SPRING_TRAP: 'rgba(56, 189, 248, 0.88)',
      GIFT_BOX: 'rgba(244, 114, 182, 0.90)',
      PORTAL_IN: 'rgba(192, 132, 252, 0.90)',
      PORTAL_OUT: 'rgba(192, 132, 252, 0.90)',
      MUSIC_BOX: 'rgba(52, 211, 153, 0.92)'
    };
    const iconMap = {
      POWER_PAD: '⭐', BLOCK: '🎲', SPEED_BELT: '⏩',
      SPRING_TRAP: '🌀', GIFT_BOX: '🎁', PORTAL_IN: '🔮',
      PORTAL_OUT: '✨', MUSIC_BOX: '🎵'
    };

    st.tiles.forEach(function (t) {
      const tx = gx0 + t.c * cw;
      const ty = gy0 + t.r * ch;
      ctx.fillStyle = colMap[t.type] || '#cbd5e1';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(tx + 2, ty + 2, cw - 4, ch - 4, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = Math.max(25, Math.round(ch * 0.56)) + 'px ' + EMOJI_FONT;
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(iconMap[t.type] || '', tx + cw / 2, ty + ch * 0.72);
    });

    ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
    ctx.beginPath();
    ctx.roundRect(x + 16, y + 14, 380, 52, 26);
    ctx.fill();
    ctx.font = BB.font(700, 27);
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.fillText('🎨 테마: ' + (st.shortName || st.name), x + 206, y + 49);

    ctx.restore();
  }

  function drawStyledButton(ctx, x, y, w, h, label, topCol, botCol, fontSize) {
    ctx.save();
    ctx.fillStyle = botCol;
    ctx.beginPath();
    ctx.roundRect(x, y + 5, w, h, 24);
    ctx.fill();

    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, topCol);
    g.addColorStop(1, botCol);
    ctx.fillStyle = g;
    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 24);
    ctx.fill();
    ctx.stroke();

    ctx.font = BB.font(700, fontSize);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + fontSize * 0.34, w - 20);
    ctx.restore();
  }

  function drawHudPillButton(ctx, x, y, w, h, label, bgCol, fontSize) {
    const fs = fontSize || 24;
    ctx.save();
    ctx.fillStyle = bgCol;
    ctx.strokeStyle = 'rgba(255,255,255,0.82)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = BB.font(700, fs);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + fs * 0.34, w - 16);
    ctx.restore();
  }

  function wrapKoreanText(ctx, text, anchorX, startY, maxWidth, lineHeight, align) {
    if (!text) return;
    ctx.textAlign = align || 'left';
    const tokens = String(text).split(' ');
    let line = '';
    let y = startY;

    for (let i = 0; i < tokens.length; i++) {
      const word = tokens[i];
      const testLine = line ? line + ' ' + word : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, anchorX, y);
        line = word;
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, anchorX, y);
    }
  }

  BB.GameUI = GameUI;
})();

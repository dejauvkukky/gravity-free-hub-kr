(function () {
  'use strict';

  const BB = (window.BB = window.BB || {});

  const STORAGE_KEY = 'bb_defence_stage_stars_v1';
  const DIFF_STORAGE_KEY = 'bb_defence_difficulty_v1';

  class GridManager {
    constructor() {
      this.rows = BB.CONST.GRID_ROWS;
      this.cols = BB.CONST.GRID_COLS;
      this.cells = [];
      this.specials = [];
      this.animTime = 0;
      this.reset();
    }

    reset(stageSpec) {
      this.cells = [];
      this.specials = [];
      for (let r = 0; r < this.rows; r++) {
        const rowArr = [];
        const spArr = [];
        for (let c = 0; c < this.cols; c++) {
          rowArr.push(null);
          spArr.push({ type: BB.CONST.TILE.EMPTY, r: r, c: c });
        }
        this.cells.push(rowArr);
        this.specials.push(spArr);
      }

      if (stageSpec && stageSpec.tiles) {
        for (let i = 0; i < stageSpec.tiles.length; i++) {
          const t = stageSpec.tiles[i];
          const center = this.cellCenter(t.r, t.c);
          this.specials[t.r][t.c] = {
            type: t.type,
            r: t.r,
            c: t.c,
            cx: center.x,
            cy: center.y,
            variant: t.variant || 'dice',
            cooldown: 0,
            maxCd: 7.5,
            boingAnim: 0,
            hp: t.hp || 280,
            maxHp: t.hp || 280,
            reward: t.reward || 75,
            hitShake: 0,
            pairId: t.pairId || '',
            outRow: t.outRow !== undefined ? t.outRow : t.r,
            outCol: t.outCol !== undefined ? t.outCol : t.c,
            portalColor: t.portalColor || '#c084fc',
            charge: 11.5,
            maxCharge: 15.5
          };
        }
      }
    }

    rowCenterY(row) {
      return BB.CONST.GRID_Y + row * BB.CONST.CELL_H + BB.CONST.CELL_H * 0.5;
    }

    cellCenter(row, col) {
      return {
        x: BB.CONST.GRID_X + col * BB.CONST.CELL_W + BB.CONST.CELL_W * 0.5,
        y: BB.CONST.GRID_Y + row * BB.CONST.CELL_H + BB.CONST.CELL_H * 0.5
      };
    }

    screenToCell(wx, wy) {
      const gx = wx - BB.CONST.GRID_X;
      const gy = wy - BB.CONST.GRID_Y;
      if (gx < 0 || gy < 0) return null;
      const col = Math.floor(gx / BB.CONST.CELL_W);
      const row = Math.floor(gy / BB.CONST.CELL_H);
      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
      return { row, col };
    }

    getSpecial(row, col) {
      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
      return this.specials[row][col];
    }

    getSpecialTileAtPos(row, x) {
      const col = Math.floor((x - BB.CONST.GRID_X) / BB.CONST.CELL_W);
      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
      const sp = this.specials[row][col];
      return sp && sp.type !== BB.CONST.TILE.EMPTY ? sp : null;
    }

    getFirstMusicBox() {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.specials[r][c].type === BB.CONST.TILE.MUSIC_BOX) {
            return this.specials[r][c];
          }
        }
      }
      return null;
    }

    canPlaceAt(row, col) {
      if (this.cells[row][col] !== null) return false;
      const sp = this.specials[row][col];
      if (!sp) return false;
      return sp.type === BB.CONST.TILE.EMPTY || sp.type === BB.CONST.TILE.POWER_PAD;
    }

    isOccupied(row, col) {
      return !this.canPlaceAt(row, col);
    }

    setCell(row, col, ally) {
      this.cells[row][col] = ally;
    }

    clearCell(row, col, expectedAlly) {
      if (!expectedAlly || this.cells[row][col] === expectedAlly) {
        this.cells[row][col] = null;
      }
    }

    hasGiftBoxAhead(row, minX) {
      for (let c = 0; c < this.cols; c++) {
        const sp = this.specials[row][c];
        if (sp.type === BB.CONST.TILE.GIFT_BOX && sp.cx > minX - 10) return true;
      }
      return false;
    }

    findHitGiftBox(row, x, hitDist) {
      for (let c = 0; c < this.cols; c++) {
        const sp = this.specials[row][c];
        if (sp.type === BB.CONST.TILE.GIFT_BOX && Math.abs(sp.cx - x) <= hitDist) {
          return sp;
        }
      }
      return null;
    }

    getGiftBoxesInRange(row, minX, maxX) {
      const list = [];
      for (let c = 0; c < this.cols; c++) {
        const sp = this.specials[row][c];
        if (sp.type === BB.CONST.TILE.GIFT_BOX && sp.cx >= minX && sp.cx <= maxX) {
          list.push(sp);
        }
      }
      return list;
    }

    damageGiftBoxesInArea(centerRow, centerX, radius, dmg, game) {
      for (let r = Math.max(0, centerRow - 1); r <= Math.min(this.rows - 1, centerRow + 1); r++) {
        for (let c = 0; c < this.cols; c++) {
          const sp = this.specials[r][c];
          if (sp.type === BB.CONST.TILE.GIFT_BOX && Math.abs(sp.cx - centerX) <= radius) {
            this.damageGiftBox(sp, dmg, game);
          }
        }
      }
    }

    damageGiftBox(sp, dmg, game) {
      if (!sp || sp.type !== BB.CONST.TILE.GIFT_BOX) return;
      sp.hp -= dmg;
      sp.hitShake = 0.22;
      game.floatingTexts.push(new BB.FloatingText(sp.cx, sp.cy - 48, '-' + Math.round(dmg), '#fbcfe8', 20));

      if (sp.hp <= 0) {
        BB.sound.play('gift_open');
        const total = sp.reward || 75;
        const count = Math.max(1, Math.round(total / 25));
        for (let i = 0; i < count; i++) {
          game.dreamBubbles.push(new BB.DreamBubble(sp.cx + (i - 1) * 24, sp.cy - 20, 25, false));
        }
        game.floatingTexts.push(new BB.FloatingText(sp.cx, sp.cy - 68, '🎁 선물 개봉! +' + total, '#fef08a', 26));
        for (let k = 0; k < 16; k++) {
          game.spawnParticle(sp.cx, sp.cy - 10, {
            vx: (Math.random() - 0.5) * 220,
            vy: -40 - Math.random() * 160,
            gravity: 240,
            size: 7,
            color: ['#f472b6', '#fde047', '#60a5fa', '#ffffff'][k % 4],
            life: 0.55,
            shape: k % 2 === 0 ? 'star' : 'circle'
          });
        }
        sp.type = BB.CONST.TILE.EMPTY;
      }
    }

    activateSpringTrap(sp, enemy, game) {
      sp.cooldown = sp.maxCd;
      sp.boingAnim = 1.0;
      BB.sound.play('spring');

      if (enemy.spec.isBoss) {
        enemy.takeDamage(120, game, 'spring');
        game.floatingTexts.push(new BB.FloatingText(sp.cx, sp.cy - 60, '🌀 스프링 충격!', '#38bdf8', 24));
      } else {
        enemy.takeDamage(55, game, 'spring');
        if (!enemy.dead) {
          enemy.applyBounceBack(280);
          game.floatingTexts.push(new BB.FloatingText(sp.cx, sp.cy - 60, '보잉~!!', '#7dd3fc', 25));
        }
      }

      for (let k = 0; k < 10; k++) {
        game.spawnParticle(sp.cx, sp.cy, {
          vx: (Math.random() - 0.5) * 160,
          vy: -60 - Math.random() * 120,
          size: 6, color: '#7dd3fc', life: 0.35, shape: 'star'
        });
      }
    }

    warpEnemyThroughPortal(sp, enemy, game) {
      const dest = this.cellCenter(sp.outRow, sp.outCol);
      BB.sound.play('portal');

      for (let k = 0; k < 12; k++) {
        game.spawnParticle(enemy.x, enemy.y - 14, {
          vx: (Math.random() - 0.5) * 160,
          vy: (Math.random() - 0.5) * 160,
          size: 7, color: sp.portalColor, life: 0.4, shape: 'star'
        });
        game.spawnParticle(dest.x, dest.y - 14, {
          vx: (Math.random() - 0.5) * 160,
          vy: (Math.random() - 0.5) * 160,
          size: 7, color: sp.portalColor, life: 0.45, shape: 'star'
        });
      }

      enemy.row = sp.outRow;
      enemy.x = dest.x;
      enemy.y = dest.y;
      game.floatingTexts.push(new BB.FloatingText(dest.x, dest.y - 68, '🔮 워프!', sp.portalColor, 22));
    }

    tryTriggerMusicBox(sp, game) {
      if (!sp || sp.type !== BB.CONST.TILE.MUSIC_BOX) return false;
      if (sp.charge < sp.maxCharge) {
        BB.sound.play('error');
        game.floatingTexts.push(new BB.FloatingText(sp.cx, sp.cy - 65, '오르골 충전 중...', '#cbd5e1', 22));
        return true;
      }

      sp.charge = 0;
      BB.sound.play('music_box');
      game.triggerShake(8, 0.3);
      game.effects.push(new BB.VisualEffect({
        kind: 'ring',
        x: sp.cx,
        y: sp.cy,
        radius: 1350,
        color: 'rgba(52, 211, 153, 0.45)',
        life: 0.65
      }));
      game.floatingTexts.push(new BB.FloatingText(960, 290, '🎵 별빛 오르골 발동! 전체 적 피해 & 5초 둔화!', '#6ee7b7', 30));

      game.enemies.forEach(e => {
        if (!e.dead) {
          e.slowTimer = 5.0;
          e.takeDamage(90, game, 'music');
        }
      });
      return true;
    }

    tryTriggerAnyReadyMusicBox(game) {
      const mbox = this.getFirstMusicBox();
      if (mbox) {
        return this.tryTriggerMusicBox(mbox, game);
      }
      return false;
    }

    update(dt) {
      this.animTime += dt;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const sp = this.specials[r][c];
          if (sp.cooldown > 0) sp.cooldown = Math.max(0, sp.cooldown - dt);
          if (sp.boingAnim > 0) sp.boingAnim = Math.max(0, sp.boingAnim - dt * 3.2);
          if (sp.hitShake > 0) sp.hitShake = Math.max(0, sp.hitShake - dt * 4.0);
          if (sp.type === BB.CONST.TILE.MUSIC_BOX && sp.charge < sp.maxCharge) {
            sp.charge = Math.min(sp.maxCharge, sp.charge + dt);
          }
        }
      }
    }

    drawGroundLayer(ctx, game) {
      const GX = BB.CONST.GRID_X;
      const GY = BB.CONST.GRID_Y;
      const CW = BB.CONST.CELL_W;
      const CH = BB.CONST.CELL_H;
      const stage = game.currentStage;

      ctx.save();

      ctx.strokeStyle = stage.borderAccent || 'rgba(251, 191, 36, 0.35)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(GX - 6, GY - 6, this.cols * CW + 12, this.rows * CH + 12, 20);
      ctx.stroke();

      const defGrad = ctx.createLinearGradient(BB.CONST.DEFENSE_LINE_X - 8, GY, BB.CONST.DEFENSE_LINE_X + 8, GY);
      defGrad.addColorStop(0, 'rgba(255, 210, 120, 0)');
      defGrad.addColorStop(0.5, 'rgba(255, 195, 110, 0.65)');
      defGrad.addColorStop(1, 'rgba(255, 210, 120, 0)');
      ctx.fillStyle = defGrad;
      ctx.fillRect(BB.CONST.DEFENSE_LINE_X - 8, GY + 6, 16, this.rows * CH - 12);

      const showStrongGrid = !!(game.selectedCard || game.shovelMode);

      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const tx = GX + c * CW;
          const ty = GY + r * CH;
          const sp = this.specials[r][c];
          const even = (r + c) % 2 === 0;

          ctx.fillStyle = even
            ? (showStrongGrid ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.09)')
            : (showStrongGrid ? 'rgba(180, 145, 110, 0.14)' : 'rgba(180, 145, 110, 0.04)');
          ctx.beginPath();
          ctx.roundRect(tx + 3, ty + 3, CW - 6, CH - 6, 12);
          ctx.fill();

          if (showStrongGrid) {
            ctx.strokeStyle = 'rgba(120, 92, 68, 0.32)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          if (sp.type === BB.CONST.TILE.POWER_PAD) {
            this.drawPowerPad(ctx, sp, tx, ty, CW, CH);
          } else if (sp.type === BB.CONST.TILE.SPEED_BELT) {
            this.drawSpeedBelt(ctx, sp, tx, ty, CW, CH);
          } else if (sp.type === BB.CONST.TILE.SPRING_TRAP) {
            this.drawSpringTrap(ctx, sp, tx, ty, CW, CH);
          } else if (sp.type === BB.CONST.TILE.PORTAL_IN || sp.type === BB.CONST.TILE.PORTAL_OUT) {
            this.drawPortalTile(ctx, sp);
          }
        }
      }

      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const sp = this.specials[r][c];
          if (sp.type === BB.CONST.TILE.PORTAL_IN) {
            const outPt = this.cellCenter(sp.outRow, sp.outCol);
            ctx.save();
            ctx.strokeStyle = sp.portalColor;
            ctx.globalAlpha = 0.44;
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 8]);
            ctx.lineDashOffset = -this.animTime * 28;
            ctx.beginPath();
            ctx.moveTo(sp.cx, sp.cy);
            ctx.quadraticCurveTo((sp.cx + outPt.x) * 0.5, (sp.cy + outPt.y) * 0.5 - 32, outPt.x, outPt.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // 터치 드래그 및 호버 시 십자(행·열) 크로스헤어 + 사거리 프리뷰 렌더링
      const hover = this.screenToCell(game.worldMouseX, game.worldMouseY);
      const shouldPreview = hover && game.state === 'PLAYING' && !game.showCodex &&
        (!game.isTouchInput || (game.dragState && game.dragState.dragging));

      if (shouldPreview) {
        const tx = GX + hover.col * CW;
        const ty = GY + hover.row * CH;
        const center = this.cellCenter(hover.row, hover.col);
        const canPlace = this.canPlaceAt(hover.row, hover.col);

        if (game.selectedCard) {
          const spec = BB.ALLY_DB[game.selectedCard];

          // 모바일 손가락 가림 방지용 행·열 십자 크로스헤어 가이드!
          if (game.dragState && game.dragState.dragging) {
            ctx.fillStyle = canPlace ? 'rgba(74, 222, 128, 0.11)' : 'rgba(248, 113, 113, 0.11)';
            ctx.fillRect(GX, ty + 4, this.cols * CW, CH - 8);
            ctx.fillRect(tx + 4, GY, CW - 8, this.rows * CH);
          }

          if (canPlace) {
            if (spec.type === 'ranged' || spec.type === 'pierce') {
              ctx.fillStyle = 'rgba(110, 231, 183, 0.16)';
              ctx.fillRect(center.x, ty + 8, BB.CONST.WIDTH - center.x, CH - 16);
            } else if (spec.type === 'melee_aoe') {
              ctx.fillStyle = 'rgba(253, 186, 116, 0.24)';
              ctx.beginPath();
              ctx.roundRect(center.x - 20, ty + 6, spec.range + 20, CH - 12, 14);
              ctx.fill();
            } else if (spec.type === 'bomb') {
              ctx.fillStyle = 'rgba(244, 114, 182, 0.20)';
              ctx.strokeStyle = 'rgba(244, 114, 182, 0.75)';
              ctx.lineWidth = 2.5;
              ctx.setLineDash([8, 6]);
              ctx.beginPath();
              ctx.arc(center.x, center.y + 6, spec.range, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.setLineDash([]);
            }

            ctx.fillStyle = 'rgba(74, 222, 128, 0.32)';
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(tx + 4, ty + 4, CW - 8, CH - 8, 14);
            ctx.fill();
            ctx.stroke();

            const ghostImg = game.images.units[game.selectedCard];
            if (ghostImg && ghostImg.complete) {
              ctx.save();
              ctx.globalAlpha = 0.72;
              const sz = game.selectedCard === 'jammanbo' ? 116 : 122;
              ctx.drawImage(ghostImg, center.x - sz / 2, center.y + 42 - sz, sz, sz);
              ctx.restore();
            }
          } else {
            ctx.fillStyle = 'rgba(248, 113, 113, 0.34)';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(tx + 4, ty + 4, CW - 8, CH - 8, 14);
            ctx.fill();
            ctx.stroke();
          }
        } else if (game.shovelMode && this.cells[hover.row][hover.col]) {
          ctx.fillStyle = 'rgba(251, 146, 60, 0.36)';
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(tx + 4, ty + 4, CW - 8, CH - 8, 14);
          ctx.fill();
          ctx.stroke();
        }
      }

      // 철거 모드 활성화 시 모든 배치된 아군 칸에 주황 테두리 표시 (모바일 터치 시인성 극대화!)
      if (game.shovelMode) {
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            if (this.cells[r][c] && !this.cells[r][c].dead) {
              const tx = GX + c * CW;
              const ty = GY + r * CH;
              ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
              ctx.lineWidth = 3.5;
              ctx.setLineDash([8, 6]);
              ctx.beginPath();
              ctx.roundRect(tx + 6, ty + 6, CW - 12, CH - 12, 14);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        }
      }

      ctx.restore();
    }

    drawRowProps(ctx, row) {
      for (let c = 0; c < this.cols; c++) {
        const sp = this.specials[row][c];
        if (sp.type === BB.CONST.TILE.BLOCK) {
          this.drawBlockProp(ctx, sp);
        } else if (sp.type === BB.CONST.TILE.GIFT_BOX) {
          this.drawGiftBoxProp(ctx, sp);
        } else if (sp.type === BB.CONST.TILE.MUSIC_BOX) {
          this.drawMusicBoxProp(ctx, sp);
        }
      }
    }

    drawPowerPad(ctx, sp, tx, ty, cw, ch) {
      const pulse = 0.85 + Math.sin(this.animTime * 3.5 + sp.c) * 0.15;
      ctx.save();
      ctx.fillStyle = 'rgba(254, 243, 199, 0.58)';
      ctx.strokeStyle = 'rgba(245, 158, 11, ' + (0.65 * pulse).toFixed(2) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(tx + 12, ty + 12, cw - 24, ch - 24, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(251, 191, 36, 0.55)';
      BB.drawMiniStar(ctx, sp.cx, sp.cy + 4, 26 * pulse, 5);

      ctx.font = BB.font(800, 20);
      ctx.strokeStyle = 'rgba(255, 252, 235, 0.95)';
      ctx.lineWidth = 4;
      ctx.fillStyle = '#92400e';
      ctx.textAlign = 'center';
      ctx.strokeText('⚡+35%', sp.cx, ty + ch - 15);
      ctx.fillText('⚡+35%', sp.cx, ty + ch - 15);
      ctx.restore();
    }

    drawSpeedBelt(ctx, sp, tx, ty, cw, ch) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 228, 230, 0.74)';
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(tx + 6, ty + 18, cw - 12, ch - 36, 12);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(tx + 8, ty + 20, cw - 16, ch - 40, 10);
      ctx.clip();

      const scroll = (this.animTime * 68) % 36;
      ctx.strokeStyle = 'rgba(225, 29, 72, 0.65)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let ox = -20; ox < cw + 36; ox += 36) {
        const ax = tx + ox - scroll + 36;
        const ay = sp.cy;
        ctx.beginPath();
        ctx.moveTo(ax + 12, ay - 14);
        ctx.lineTo(ax - 2, ay);
        ctx.lineTo(ax + 12, ay + 14);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawSpringTrap(ctx, sp) {
      const ready = sp.cooldown <= 0;
      const bounceLift = sp.boingAnim * 22;

      ctx.save();
      ctx.translate(sp.cx, sp.cy + 14);

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(0, 6, 42, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      const topY = ready ? -10 - bounceLift : -2;
      ctx.beginPath();
      ctx.moveTo(-18, 4);
      ctx.lineTo(18, (4 + topY) * 0.5);
      ctx.lineTo(-18, topY);
      ctx.stroke();

      ctx.fillStyle = ready ? '#38bdf8' : '#64748b';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, topY, 38, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (ready) {
        ctx.font = BB.font(800, 17);
        ctx.fillStyle = '#082f49';
        ctx.textAlign = 'center';
        ctx.fillText('점프!', 0, topY + 6);
      } else {
        const ratio = 1 - sp.cooldown / sp.maxCd;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, topY, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawPortalTile(ctx, sp) {
      const isIn = sp.type === BB.CONST.TILE.PORTAL_IN;
      ctx.save();
      ctx.translate(sp.cx, sp.cy + 4);

      const rg = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
      rg.addColorStop(0, '#ffffff');
      rg.addColorStop(0.45, sp.portalColor);
      rg.addColorStop(1, 'rgba(30, 15, 60, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(0, 0, 46, 32, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(this.animTime * (isIn ? -2.2 : 2.2));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.font = BB.font(800, 20);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 4.5;
      ctx.textAlign = 'center';
      const label = isIn ? '🔮입구' : '✨출구';
      ctx.strokeText(label, sp.cx, sp.cy + 46);
      ctx.fillText(label, sp.cx, sp.cy + 46);
      ctx.restore();
    }

    drawBlockProp(ctx, sp) {
      ctx.save();
      ctx.translate(sp.cx, sp.cy + 14);

      ctx.fillStyle = 'rgba(35, 25, 20, 0.28)';
      ctx.beginPath();
      ctx.ellipse(2, 16, 44, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      if (sp.variant === 'crystal') {
        ctx.fillStyle = '#a855f7';
        ctx.strokeStyle = '#f3e8ff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-26, 14);
        ctx.lineTo(-34, -22);
        ctx.lineTo(-14, -44);
        ctx.lineTo(-2, 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.moveTo(4, 14);
        ctx.lineTo(14, -36);
        ctx.lineTo(32, -16);
        ctx.lineTo(24, 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const cg = ctx.createLinearGradient(0, -64, 0, 16);
        cg.addColorStop(0, '#f5d0fe');
        cg.addColorStop(0.5, '#c084fc');
        cg.addColorStop(1, '#6b21a8');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.moveTo(-18, 16);
        ctx.lineTo(-14, -38);
        ctx.lineTo(0, -64);
        ctx.lineTo(15, -36);
        ctx.lineTo(18, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (sp.variant === 'eraser') {
        ctx.rotate(-0.14);
        ctx.fillStyle = '#fff1f2';
        ctx.strokeStyle = '#fda4af';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-38, -26, 76, 42, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(-16, -28, 54, 46, 8);
        ctx.fill();
        ctx.stroke();

        ctx.font = BB.font(800, 13);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('ERASER', 11, 0);
      } else {
        ctx.fillStyle = '#fef3c7';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-34, -42, 68, 60, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -12, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#334155';
        [[-16, -28], [16, -28], [-16, 4], [16, 4]].forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], 4.8, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.restore();
    }

    drawGiftBoxProp(ctx, sp) {
      const shakeX = sp.hitShake > 0 ? Math.sin(this.animTime * 55) * 6 : 0;
      const bob = Math.sin(this.animTime * 3.5 + sp.c) * 2.5;

      ctx.save();
      ctx.translate(sp.cx + shakeX, sp.cy + 14 + bob);

      ctx.fillStyle = 'rgba(40, 20, 35, 0.26)';
      ctx.beginPath();
      ctx.ellipse(0, 16, 40, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f472b6';
      ctx.strokeStyle = '#be185d';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.roundRect(-32, -34, 64, 50, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.roundRect(-36, -44, 72, 16, 7);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.fillRect(-7, -44, 14, 60);
      ctx.beginPath();
      ctx.ellipse(-12, -49, 12, 7, -0.35, 0, Math.PI * 2);
      ctx.ellipse(12, -49, 12, 7, 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = BB.font(800, 19);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#831843';
      ctx.lineWidth = 4.2;
      ctx.textAlign = 'center';
      ctx.strokeText('💧+75', 0, 10);
      ctx.fillText('💧+75', 0, 10);

      ctx.restore();

      if (sp.hp < sp.maxHp) {
        const w = 64;
        const x = sp.cx - w / 2;
        const y = sp.cy - 48;
        ctx.save();
        ctx.fillStyle = '#4c0519';
        ctx.beginPath();
        ctx.roundRect(x, y, w, 7, 3.5);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, Math.max(4, (w - 2) * (sp.hp / sp.maxHp)), 5, 2.5);
        ctx.fill();
        ctx.restore();
      }
    }

    drawMusicBoxProp(ctx, sp) {
      const ready = sp.charge >= sp.maxCharge;
      const bounce = ready ? Math.abs(Math.sin(this.animTime * 6)) * 8 : 0;

      ctx.save();
      ctx.translate(sp.cx, sp.cy + 14 - bounce);

      if (ready) {
        ctx.fillStyle = 'rgba(52, 211, 153, 0.32)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 52, 20, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#0f766e';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-36, -34, 72, 48, 12);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(0, -42);
      ctx.rotate(this.animTime * (ready ? 3.2 : 0.7));
      ctx.fillStyle = ready ? '#fde047' : '#94a3b8';
      BB.drawMiniStar(ctx, 0, 0, 18, 5);
      ctx.restore();

      if (ready) {
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-52, -82, 104, 30, 15);
        ctx.fill();
        ctx.stroke();
        ctx.font = BB.font(800, 19);
        ctx.fillStyle = '#78350f';
        ctx.textAlign = 'center';
        ctx.fillText('🎵터치!', 0, -60);
      } else {
        const ratio = sp.charge / sp.maxCharge;
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-28, -9, 56, 9, 4.5);
        ctx.fill();
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.roundRect(-27, -8, Math.max(4, 54 * ratio), 7, 3.5);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      // 반응형 가상 해상도 (가로 1920x1080 <-> 세로 1080x1920 실시간 전환!)
      this.viewW = 1920;
      this.viewH = 1080;
      this.isPortrait = false;
      this.isMobileUI = false;
      this.isTouchInput = false;

      // 세로 모드에서 전장 월드(344~1568)를 1:1 비율 유지한 채 캔버스에 매핑하는 카메라 파라미터
      this.cam = {
        scale: 1,
        worldX: 0,
        worldY: 0,
        screenX: 0,
        screenY: 0,
        clipW: 1920,
        clipH: 1080
      };

      this.grid = new GridManager();
      this.ui = new BB.GameUI();

      this.images = { bg: null, stageBgs: {}, units: {} };
      this.loadedCount = 0;
      const stageBgKeys = Object.keys(BB.ASSETS.stageBgs || {});
      this.totalAssets = Math.max(1, stageBgKeys.length) + Object.keys(BB.ASSETS.units).length;
      this.assetsReady = false;

      this.state = 'LOADING';
      this.showCodex = false;
      this.codexTab = 'ally'; // 'ally' | 'enemy' | 'gimmick'
      this.codexSelectedIndex = 0;
      this.titleTime = 0;

      this.stageIndex = 0;
      this.previewStageIndex = 0;
      this.currentStage = BB.STAGES[0];
      this.difficulty = this.loadDifficulty();
      this.activeWaves = [];
      this.stageStars = this.loadStageStars();

      this.canvasMouseX = 960;
      this.canvasMouseY = 540;
      this.worldMouseX = 960;
      this.worldMouseY = 540;
      this.dragState = null;
      this.swipeStart = null;
      this.possibleTapDeselect = false;

      this.hoveredGimmickText = '';
      this.hoveredGimmickObj = null;
      this.gameSpeed = 1.0;

      this.resetMatchState();
      this.resizeViewport();
      this.bindEvents();
      this.preloadAssets();

      this.lastTimestamp = performance.now();
      const self = this;
      requestAnimationFrame(function loop(ts) {
        self.frame(ts);
        requestAnimationFrame(loop);
      });
    }

    loadDifficulty() {
      try {
        const raw = window.localStorage && window.localStorage.getItem(DIFF_STORAGE_KEY);
        if (raw && BB.DIFFICULTIES && BB.DIFFICULTIES[raw]) return raw;
      } catch (e) {}
      return 'normal';
    }

    setDifficulty(diffId) {
      if (!BB.DIFFICULTIES || !BB.DIFFICULTIES[diffId]) return;
      if (this.difficulty !== diffId) {
        this.difficulty = diffId;
        try {
          if (window.localStorage) {
            window.localStorage.setItem(DIFF_STORAGE_KEY, diffId);
          }
        } catch (e) {}
      }
      BB.sound.play('ui_click');
    }

    toggleDifficulty() {
      this.setDifficulty(this.difficulty === 'hard' ? 'normal' : 'hard');
    }

    getDifficultySpec() {
      return (BB.DIFFICULTIES && BB.DIFFICULTIES[this.difficulty]) || BB.DIFFICULTIES.normal;
    }

    isHardMode() {
      return this.difficulty === 'hard';
    }

    loadStageStars() {
      try {
        const raw = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) || {};
      } catch (e) {}
      return {};
    }

    getStageStar(stageId, diffId) {
      const d = diffId || this.difficulty;
      const key = d === 'hard' ? 'hard_' + stageId : stageId;
      return this.stageStars[key] || 0;
    }

    saveStageStar(stageId, stars, diffId) {
      const d = diffId || this.difficulty;
      const key = d === 'hard' ? 'hard_' + stageId : stageId;
      const prev = this.stageStars[key] || 0;
      if (stars > prev) {
        this.stageStars[key] = stars;
        try {
          if (window.localStorage) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stageStars));
          }
        } catch (e) {}
      }
    }

    buildStageWaves(stage, diffSpec) {
      const baseWaves = (stage && stage.waves) || [];
      const tier = (diffSpec && diffSpec.waveTier) || 1;
      const tScale = (diffSpec && diffSpec.spawnTimeScale) || 0.90;
      const pScale = (diffSpec && diffSpec.prepTimeScale) || 0.88;

      return baseWaves.map(function (w, wIdx) {
        const isFirst = wIdx === 0;
        const isFinal = wIdx === baseWaves.length - 1;
        const spawns = w.spawns.map(function (s, sIdx) {
          let scaledT = s.t;
          if (!isFirst) {
            scaledT = +(s.t * tScale).toFixed(2);
          } else if (tier >= 2 && sIdx >= 2) {
            scaledT = +(s.t * 0.90).toFixed(2);
          }
          return {
            t: scaledT,
            unit: s.unit,
            row: s.row
          };
        });

        if (spawns.length > 0) {
          const lastT = spawns[spawns.length - 1].t;
          if (tier === 1) {
            // 노말 모드 (구 어려움 수준 증원 기본 적용)
            if (isFirst) {
              spawns.push({ t: +(lastT + 3.5).toFixed(2), unit: 'dog', row: 2 });
            } else {
              const midRow = (stage.id + wIdx) % BB.CONST.GRID_ROWS;
              const endRow = (stage.id + wIdx + 2) % BB.CONST.GRID_ROWS;
              spawns.push({
                t: +(lastT * 0.52).toFixed(2),
                unit: wIdx === 1 ? 'makeup' : 'love',
                row: midRow
              });
              spawns.push({
                t: +(lastT + 2.2).toFixed(2),
                unit: isFinal ? 'cutie' : 'pig',
                row: endRow
              });
            }
          } else if (tier >= 2) {
            // 어려움 모드 (다중 라인 정예 편대 협공 대폭 강화!)
            if (isFirst) {
              spawns.push({ t: +(Math.max(4.0, lastT - 2.5)).toFixed(2), unit: 'dog', row: (stage.id + 1) % BB.CONST.GRID_ROWS });
              spawns.push({ t: +(lastT + 2.6).toFixed(2), unit: 'makeup', row: 2 });
            } else {
              const rA = (stage.id * 2 + wIdx) % BB.CONST.GRID_ROWS;
              const rB = isFinal ? ((stage.id + wIdx) % 3 + 1) : ((stage.id * 2 + wIdx + 2) % BB.CONST.GRID_ROWS);
              const rC = (stage.id * 2 + wIdx + 4) % BB.CONST.GRID_ROWS;

              spawns.push({
                t: +(lastT * 0.30).toFixed(2),
                unit: wIdx === 1 ? 'dog' : 'makeup',
                row: rC
              });
              spawns.push({
                t: +(lastT * 0.54).toFixed(2),
                unit: 'pig',
                row: rA
              });
              spawns.push({
                t: +(lastT * 0.58).toFixed(2),
                unit: wIdx === 1 ? 'makeup' : 'love',
                row: rA
              });
              spawns.push({
                t: +(lastT + 1.8).toFixed(2),
                unit: isFinal ? 'cutie' : 'pig',
                row: rB
              });
              if (isFinal) {
                spawns.push({
                  t: +(lastT + 2.6).toFixed(2),
                  unit: 'love',
                  row: rB
                });
              }
            }
          }
          spawns.sort(function (a, b) { return a.t - b.t; });
        }

        return {
          wave: w.wave,
          title: (tier >= 2 ? '🔥 [어려움] ' : '') + w.title,
          subtitle: w.subtitle,
          prepTime: isFirst ? w.prepTime : Math.max(tier >= 2 ? 3.2 : 3.8, +(w.prepTime * pScale).toFixed(2)),
          spawns: spawns
        };
      });
    }

    getDreamCollectorWorldPos() {
      if (this.isPortrait) {
        return { x: 480, y: 215 };
      }
      return { x: 425, y: 62 };
    }

    toggleFullscreen() {
      BB.sound.play('ui_click');
      try {
        const doc = window.document;
        const el = doc.documentElement;
        if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
          if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
          else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        } else {
          if (doc.exitFullscreen) doc.exitFullscreen().catch(function () {});
          else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
        }
      } catch (e) {}
    }

    resizeViewport() {
      const ww = Math.max(240, window.innerWidth || 1920);
      const wh = Math.max(240, window.innerHeight || 1080);
      const hasTouch = ('ontouchstart' in window) || ((window.navigator && window.navigator.maxTouchPoints) > 0);

      this.isPortrait = wh > ww * 1.04;
      this.isMobileUI = this.isPortrait || hasTouch || ww <= 1100 || wh <= 640;

      if (this.isPortrait) {
        this.viewW = 1080;
        this.viewH = 1920;
        // 전장 월드 X(292..1652 = 1360폭)를 세로 화면 폭(1048px)에 1:1 정비율 매핑!
        const sc = 1048 / 1360;
        this.cam = {
          scale: sc,
          worldX: 292,
          worldY: 186,
          screenX: 16,
          screenY: 238,
          clipW: 1048,
          clipH: 572
        };
      } else {
        this.viewW = 1920;
        this.viewH = 1080;
        this.cam = {
          scale: 1,
          worldX: 0,
          worldY: 0,
          screenX: 0,
          screenY: 0,
          clipW: 1920,
          clipH: 1080
        };
      }

      if (this.canvas.width !== this.viewW || this.canvas.height !== this.viewH) {
        this.canvas.width = this.viewW;
        this.canvas.height = this.viewH;
      }

      const targetRatio = this.viewW / this.viewH;
      let cw = ww;
      let ch = ww / targetRatio;
      if (ch > wh) {
        ch = wh;
        cw = wh * targetRatio;
      }
      const marginFactor = this.isMobileUI ? 1.0 : 0.985;
      this.canvas.style.width = Math.floor(cw * marginFactor) + 'px';
      this.canvas.style.height = Math.floor(ch * marginFactor) + 'px';
    }

    toCanvasCoords(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / Math.max(1, rect.width)) * this.viewW,
        y: ((clientY - rect.top) / Math.max(1, rect.height)) * this.viewH
      };
    }

    canvasToWorld(vx, vy) {
      const c = this.cam;
      if (this.isPortrait) {
        // 전장 디오라마 프레임 바깥을 터치했으면 월드 그리드 바깥 좌표 반환
        if (vx < c.screenX || vx > c.screenX + c.clipW || vy < c.screenY || vy > c.screenY + c.clipH) {
          return { x: -9999, y: -9999 };
        }
      }
      return {
        x: c.worldX + (vx - c.screenX) / c.scale,
        y: c.worldY + (vy - c.screenY) / c.scale
      };
    }

    resetMatchState() {
      this.currentStage = BB.STAGES[this.stageIndex] || BB.STAGES[0];
      this.grid.reset(this.currentStage);

      this.dream = this.currentStage.initialDream || BB.CONST.INITIAL_DREAM;
      this.dreamPulse = 0;
      this.passiveTimer = 0;
      this.welcomeBubbleDropped = false;

      this.lives = BB.CONST.INITIAL_LIVES;
      this.kills = 0;
      this.playTime = 0;

      this.selectedCard = null;
      this.shovelMode = false;
      this.dragState = null;
      this.deckCooldowns = {};
      BB.ALLY_ORDER.forEach(id => {
        this.deckCooldowns[id] = 0;
      });

      this.allies = [];
      this.enemies = [];
      this.projectiles = [];
      this.dreamBubbles = [];
      this.effects = [];
      this.particles = [];
      this.floatingTexts = [];

      const diffSpec = this.getDifficultySpec();
      const waves = this.buildStageWaves(this.currentStage, diffSpec);
      this.activeWaves = waves;
      this.waveIndex = 0;
      this.waveClock = 0;
      this.waveSpawnCursor = 0;
      this.waveClearDelay = 0;
      this.totalScheduledEnemies = waves.reduce((acc, w) => acc + w.spawns.length, 0);
      this.spawnedSoFar = 0;

      this.bannerTitle = '';
      this.bannerSubtitle = '';
      this.bannerDuration = 3.4;
      this.bannerTimer = 0;

      this.shakeMag = 0;
      this.shakeTimer = 0;
    }

    getStageBgImage(stageIdx) {
      const st = BB.STAGES[stageIdx] || BB.STAGES[0];
      const key = st ? (st.bgKey || st.id) : 1;
      const img = this.images.stageBgs[key];
      if (img && img.complete && img.naturalWidth) return img;
      return this.images.bg;
    }

    stepStagePreview(delta) {
      const len = BB.STAGES.length;
      this.previewStageIndex = (this.previewStageIndex + delta + len) % len;
      BB.sound.play('ui_click');
    }

    getCodexList() {
      if (this.codexTab === 'enemy') return BB.ENEMY_ORDER;
      if (this.codexTab === 'gimmick') return BB.GIMMICK_ORDER;
      return BB.ALLY_ORDER;
    }

    setCodexTab(tab) {
      if (this.codexTab !== tab) {
        this.codexTab = tab;
        this.codexSelectedIndex = 0;
      }
      BB.sound.play('ui_click');
    }

    stepCodexEntry(delta) {
      const list = this.getCodexList();
      if (!list.length) return;
      this.codexSelectedIndex = (this.codexSelectedIndex + delta + list.length) % list.length;
      BB.sound.play('ui_click');
    }

    preloadAssets() {
      const self = this;
      // MZ 감성 웹폰트(SUITE, Pretendard, Outfit) 비동기 프리로드 트리거 (오프라인에서도 무블로킹!)
      try {
        if (window.document && window.document.fonts && window.document.fonts.load) {
          ['500 28px SUITE', '700 36px SUITE', '800 48px SUITE', '700 36px Outfit', '700 32px Pretendard'].forEach(function (spec) {
            window.document.fonts.load(spec).catch(function () {});
          });
        }
      } catch (e) {}

      function onAssetDone() {
        self.loadedCount++;
        if (self.loadedCount >= self.totalAssets && !self.assetsReady) {
          self.assetsReady = true;
          self.state = 'TITLE';
        }
      }

      const stageBgs = BB.ASSETS.stageBgs || { 1: BB.ASSETS.bg };
      Object.keys(stageBgs).forEach(function (k) {
        const img = new Image();
        img.onload = onAssetDone;
        img.onerror = onAssetDone;
        img.src = stageBgs[k];
        self.images.stageBgs[k] = img;
        if (String(k) === '1') self.images.bg = img;
      });

      Object.keys(BB.ASSETS.units).forEach(function (key) {
        const img = new Image();
        img.onload = onAssetDone;
        img.onerror = onAssetDone;
        img.src = BB.ASSETS.units[key];
        self.images.units[key] = img;
      });
    }

    bindEvents() {
      const self = this;
      window.addEventListener('resize', function () {
        self.resizeViewport();
      });
      window.addEventListener('orientationchange', function () {
        setTimeout(function () { self.resizeViewport(); }, 120);
      });

      this.canvas.addEventListener('pointerdown', function (e) {
        if (e.button === 2) {
          self.cancelSelection();
          return;
        }
        self.isTouchInput = (e.pointerType === 'touch' || e.pointerType === 'pen');
        BB.sound.init();

        const pt = self.toCanvasCoords(e.clientX, e.clientY);
        self.canvasMouseX = pt.x;
        self.canvasMouseY = pt.y;
        const wpt = self.canvasToWorld(pt.x, pt.y);
        self.worldMouseX = wpt.x;
        self.worldMouseY = wpt.y;

        if (self.showCodex || self.state === 'STAGE_SELECT') {
          self.swipeStart = { vx: pt.x, vy: pt.y };
        } else {
          self.swipeStart = null;
        }

        self.onPointerDown(pt.x, pt.y, e.pointerType || 'mouse');
      });

      this.canvas.addEventListener('pointermove', function (e) {
        const pt = self.toCanvasCoords(e.clientX, e.clientY);
        self.canvasMouseX = pt.x;
        self.canvasMouseY = pt.y;

        if (self.dragState) {
          const d = Math.hypot(pt.x - self.dragState.startVx, pt.y - self.dragState.startVy);
          if (d > 20) {
            self.dragState.dragging = true;
            self.possibleTapDeselect = false;
          }
        }

        // 터치 드래그 중에는 손가락 위로 프리뷰가 보이도록 Y축 오프셋 보정!
        const aimY = (self.dragState && self.dragState.dragging && self.dragState.pointerType === 'touch')
          ? pt.y - 54
          : pt.y;
        const wpt = self.canvasToWorld(pt.x, aimY);
        self.worldMouseX = wpt.x;
        self.worldMouseY = wpt.y;

        if (self.state === 'PLAYING' && !self.showCodex) {
          // 스와이프/마우스 이동으로 꿈방울 회수
          for (let i = 0; i < self.dreamBubbles.length; i++) {
            const b = self.dreamBubbles[i];
            if (!b.collecting && Math.hypot(b.x - wpt.x, b.y - wpt.y) < 68) {
              b.collect();
            }
          }

          if (!self.isTouchInput) {
            self.ui.hoveredCardId = null;
            const hit = self.ui.hitTest(pt.x, pt.y);
            if (hit && hit.id.indexOf('card_') === 0) {
              self.ui.hoveredCardId = hit.id.replace('card_', '');
            }
          }

          self.updateHoveredGimmick(wpt.x, wpt.y);
        }
      });

      window.addEventListener('pointerup', function (e) {
        const pt = self.toCanvasCoords(e.clientX, e.clientY);

        // 단계 선택창 및 도감 좌우 스와이프 페이지 전환 지원!
        if (self.swipeStart && (self.showCodex || self.state === 'STAGE_SELECT')) {
          const dx = pt.x - self.swipeStart.vx;
          const dy = pt.y - self.swipeStart.vy;
          self.swipeStart = null;
          if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.3) {
            if (self.showCodex) {
              self.stepCodexEntry(dx < 0 ? 1 : -1);
            } else if (self.state === 'STAGE_SELECT') {
              self.stepStagePreview(dx < 0 ? 1 : -1);
            }
            return;
          }
        }
        self.swipeStart = null;

        if (!self.dragState) return;
        const ds = self.dragState;
        self.dragState = null;

        if (ds.dragging) {
          const aimY = ds.pointerType === 'touch' ? pt.y - 54 : pt.y;
          const wpt = self.canvasToWorld(pt.x, aimY);
          const cell = self.grid.screenToCell(wpt.x, wpt.y);
          if (cell && self.grid.canPlaceAt(cell.row, cell.col)) {
            self.tryPlaceAlly(ds.cardId, cell.row, cell.col);
          } else {
            // 전장 밖(덱 영역 등)으로 드래그 후 손을 떼면 선택 취소
            self.selectedCard = null;
          }
        } else if (self.possibleTapDeselect) {
          self.selectedCard = null;
          BB.sound.play('ui_click');
        }
        self.possibleTapDeselect = false;
      });

      this.canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        self.cancelSelection();
      });

      window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          if (self.showCodex) {
            self.showCodex = false;
            BB.sound.play('ui_click');
          } else if (self.state === 'STAGE_SELECT') {
            self.state = 'TITLE';
            BB.sound.play('ui_click');
          } else if (self.selectedCard || self.shovelMode) {
            self.cancelSelection();
          } else if (self.state === 'PLAYING') {
            self.state = 'PAUSED';
            BB.sound.play('ui_click');
          } else if (self.state === 'PAUSED') {
            self.state = 'PLAYING';
            BB.sound.play('ui_click');
          }
          return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          if (self.showCodex) {
            self.stepCodexEntry(dir);
            return;
          }
          if (self.state === 'STAGE_SELECT') {
            self.stepStagePreview(dir);
            return;
          }
        }

        if ((e.key === 'd' || e.key === 'D') && (self.state === 'STAGE_SELECT' || self.showCodex)) {
          self.toggleDifficulty();
          return;
        }

        if (self.state !== 'PLAYING' || self.showCodex) return;

        if (e.key >= '1' && e.key <= '6') {
          const idx = parseInt(e.key, 10) - 1;
          if (BB.ALLY_ORDER[idx]) self.selectCard(BB.ALLY_ORDER[idx]);
        } else if (e.key === 's' || e.key === 'S' || e.key === '0') {
          self.toggleShovel();
        } else if (e.key === 'e' || e.key === 'E') {
          self.grid.tryTriggerAnyReadyMusicBox(self);
        } else if (e.key === ' ') {
          e.preventDefault();
          self.state = 'PAUSED';
          BB.sound.play('ui_click');
        } else if (e.key === 'f' || e.key === 'F') {
          self.toggleSpeed();
        }
      });
    }

    updateHoveredGimmick(wx, wy) {
      this.hoveredGimmickText = '';
      this.hoveredGimmickObj = null;
      const cell = this.grid.screenToCell(wx, wy);
      if (cell) {
        const sp = this.grid.getSpecial(cell.row, cell.col);
        if (sp && sp.type !== BB.CONST.TILE.EMPTY) {
          const metaKey = sp.type === BB.CONST.TILE.PORTAL_OUT ? 'PORTAL_IN' : sp.type;
          const meta = BB.GIMMICK_META[metaKey];
          if (meta) {
            this.hoveredGimmickObj = meta;
            this.hoveredGimmickText = meta.icon + ' [' + meta.name + '] ' + (meta.shortDesc || meta.desc);
          }
        }
      }
    }

    onPointerDown(vx, vy, pointerType) {
      // 1. UI 버튼 히트 판정 (카드 클릭 시 탭 선택 & 드래그 배치 동시 시작!)
      const hitBtn = this.ui.hitTest(vx, vy);
      if (hitBtn) {
        if (hitBtn.id.indexOf('card_') === 0 && this.state === 'PLAYING' && !this.showCodex) {
          const cardId = hitBtn.id.replace('card_', '');
          const spec = BB.ALLY_DB[cardId];
          if ((this.deckCooldowns[cardId] || 0) > 0 || this.dream < spec.cost) {
            BB.sound.play('error');
            return;
          }
          if (this.selectedCard === cardId) {
            this.possibleTapDeselect = true;
          } else {
            this.shovelMode = false;
            this.selectedCard = cardId;
            this.possibleTapDeselect = false;
            BB.sound.play('ui_click');
          }
          this.dragState = {
            cardId: cardId,
            startVx: vx,
            startVy: vy,
            dragging: false,
            pointerType: pointerType
          };
          return;
        }

        hitBtn.onClick();
        return;
      }

      if (this.state !== 'PLAYING' || this.showCodex) return;

      const wpt = this.canvasToWorld(vx, vy);
      this.updateHoveredGimmick(wpt.x, wpt.y);

      // 2. 꿈방울 광역 터치 회수 (모바일에서는 반경 96px 내 구슬 일괄 회수!)
      const bubbleRadius = pointerType === 'touch' ? 96 : 64;
      let collectedAny = false;
      for (let i = 0; i < this.dreamBubbles.length; i++) {
        const b = this.dreamBubbles[i];
        if (!b.collecting && Math.hypot(b.x - wpt.x, b.y - wpt.y) < bubbleRadius) {
          b.collect();
          collectedAny = true;
        }
      }
      if (collectedAny && !this.selectedCard && !this.shovelMode) return;

      const cell = this.grid.screenToCell(wpt.x, wpt.y);
      if (!cell) return;

      // 3. 오르골 터치 발동
      const sp = this.grid.getSpecial(cell.row, cell.col);
      if (!this.selectedCard && !this.shovelMode && sp && sp.type === BB.CONST.TILE.MUSIC_BOX) {
        this.grid.tryTriggerMusicBox(sp, this);
        return;
      }

      // 4. 삽(철거) 처리
      if (this.shovelMode) {
        const existing = this.grid.cells[cell.row][cell.col];
        if (existing && !existing.dead && existing.type !== 'bomb') {
          existing.dead = true;
          this.grid.clearCell(cell.row, cell.col, existing);
          BB.sound.play('shovel');
          for (let k = 0; k < 8; k++) {
            this.spawnParticle(existing.x, existing.y, {
              vx: (Math.random() - 0.5) * 140,
              vy: (Math.random() - 0.7) * 130,
              size: 7, color: '#fde68a', life: 0.35
            });
          }
          this.shovelMode = false;
        } else {
          BB.sound.play('error');
        }
        return;
      }

      // 5. 선택된 유닛 탭 배치
      if (this.selectedCard) {
        this.tryPlaceAlly(this.selectedCard, cell.row, cell.col);
      }
    }

    // 기존 테스트/외부 호출 호환용 월드 클릭 래퍼
    handlePrimaryClick(wx, wy) {
      this.onPointerDown(wx, wy, 'mouse');
    }

    selectCard(id) {
      this.shovelMode = false;
      if (this.selectedCard === id) {
        this.selectedCard = null;
        BB.sound.play('ui_click');
        return;
      }
      const spec = BB.ALLY_DB[id];
      if ((this.deckCooldowns[id] || 0) > 0 || this.dream < spec.cost) {
        BB.sound.play('error');
        return;
      }
      this.selectedCard = id;
      BB.sound.play('ui_click');
    }

    toggleShovel() {
      this.selectedCard = null;
      this.shovelMode = !this.shovelMode;
      BB.sound.play('ui_click');
    }

    cancelSelection() {
      if (this.selectedCard || this.shovelMode || this.dragState) {
        this.selectedCard = null;
        this.shovelMode = false;
        this.dragState = null;
        BB.sound.play('ui_click');
      }
    }

    toggleSpeed() {
      this.gameSpeed = this.gameSpeed > 1.1 ? 1.0 : 2.0;
      BB.sound.play('ui_click');
    }

    tryPlaceAlly(id, row, col) {
      const spec = BB.ALLY_DB[id];
      if (!this.grid.canPlaceAt(row, col)) {
        BB.sound.play('error');
        return false;
      }
      if (this.dream < spec.cost || (this.deckCooldowns[id] || 0) > 0) {
        BB.sound.play('error');
        return false;
      }

      this.dream -= spec.cost;
      this.deckCooldowns[id] = spec.deckCd;
      const center = this.grid.cellCenter(row, col);
      const sp = this.grid.getSpecial(row, col);
      const onPowerPad = sp && sp.type === BB.CONST.TILE.POWER_PAD;

      const ally = new BB.Ally(id, row, col, center.x, center.y, onPowerPad);
      this.grid.setCell(row, col, ally);
      this.allies.push(ally);
      this.selectedCard = null;
      BB.sound.play('place');

      if (onPowerPad && spec.type !== 'bomb') {
        this.floatingTexts.push(new BB.FloatingText(center.x, center.y - 54, '⭐ 별빛 가속 +35%!', '#fde047', 21));
      }

      for (let i = 0; i < 8; i++) {
        this.spawnParticle(center.x, center.y + 26, {
          vx: (Math.random() - 0.5) * 140,
          vy: -25 - Math.random() * 60,
          size: 5 + Math.random() * 4,
          color: onPowerPad ? '#fde047' : '#ffffff',
          life: 0.32
        });
      }
      return true;
    }

    addDream(amount, fxX, fxY) {
      this.dream = Math.min(BB.CONST.MAX_DREAM, this.dream + amount);
      this.dreamPulse = 1.0;
      if (fxX !== undefined && fxY !== undefined) {
        this.floatingTexts.push(new BB.FloatingText(fxX, fxY, '+' + amount, '#fef08a', 26));
      }
    }

    spawnParticle(x, y, opts) {
      if (this.particles.length > 260) return;
      this.particles.push(new BB.Particle(x, y, opts));
    }

    triggerShake(mag, dur) {
      this.shakeMag = Math.max(this.shakeMag, mag);
      this.shakeTimer = Math.max(this.shakeTimer, dur);
    }

    openStageSelect() {
      BB.sound.play('ui_click');
      this.showCodex = false;
      this.previewStageIndex = this.stageIndex;
      this.state = 'STAGE_SELECT';
    }

    startStage(stageIdx, diffId) {
      if (diffId && BB.DIFFICULTIES && BB.DIFFICULTIES[diffId]) {
        this.difficulty = diffId;
        try {
          if (window.localStorage) {
            window.localStorage.setItem(DIFF_STORAGE_KEY, diffId);
          }
        } catch (e) {}
      }
      this.stageIndex = Math.max(0, Math.min(BB.STAGES.length - 1, stageIdx));
      this.previewStageIndex = this.stageIndex;
      this.startNewGame();
    }

    startNewGame() {
      this.resetMatchState();
      this.showCodex = false;
      this.state = 'PLAYING';
      BB.sound.startBgm(false);
      this.announceWave(0);
    }

    announceWave(idx) {
      const waves = this.activeWaves.length ? this.activeWaves : this.currentStage.waves;
      const w = waves[idx];
      if (!w) return;
      this.bannerTitle = w.title;
      this.bannerSubtitle = w.subtitle;
      this.bannerDuration = 3.5;
      this.bannerTimer = 3.5;
      BB.sound.play('wave_start');
    }

    onLineBreached(row) {
      if (this.state !== 'PLAYING') return;
      this.lives--;
      BB.sound.play('life_lost');
      this.triggerShake(16, 0.42);

      const ry = this.grid.rowCenterY(row);
      this.effects.push(new BB.VisualEffect({
        kind: 'beam',
        x: BB.CONST.DEFENSE_LINE_X - 20,
        y: ry - 10,
        x2: BB.CONST.GRID_X + 460,
        color: '#fda4af',
        subColor: '#fde047',
        life: 0.45
      }));
      this.floatingTexts.push(new BB.FloatingText(520, ry - 40, '💔 방어선 돌파!', '#fda4af', 28));

      this.enemies.forEach(e => {
        if (!e.dead && e.row === row && e.x < BB.CONST.GRID_X + 440) {
          if (e.spec.isBoss) {
            e.x = Math.min(BB.CONST.SPAWN_X - 60, e.x + 260);
          } else {
            e.takeDamage(999, this, 'bomb');
          }
        }
      });

      if (this.lives <= 0) {
        this.lives = 0;
        this.state = 'GAMEOVER';
        BB.sound.play('gameover');
      }
    }

    getRemainingInWave() {
      const waves = this.activeWaves.length ? this.activeWaves : this.currentStage.waves;
      const w = waves[this.waveIndex];
      if (!w) return 0;
      const unspawned = Math.max(0, w.spawns.length - this.waveSpawnCursor);
      const alive = this.enemies.filter(e => !e.dead).length;
      return unspawned + alive;
    }

    getOverallProgress() {
      if (this.totalScheduledEnemies === 0) return 0;
      return Math.min(1, this.spawnedSoFar / this.totalScheduledEnemies);
    }

    updateWaveSystem(dt) {
      const waves = this.activeWaves.length ? this.activeWaves : this.currentStage.waves;
      const w = waves[this.waveIndex];
      if (!w) return;

      this.waveClock += dt;
      if (this.waveClock < w.prepTime) return;

      const relT = this.waveClock - w.prepTime;
      const diffSpec = this.getDifficultySpec();
      while (this.waveSpawnCursor < w.spawns.length && relT >= w.spawns[this.waveSpawnCursor].t) {
        const item = w.spawns[this.waveSpawnCursor];
        this.waveSpawnCursor++;
        this.spawnedSoFar++;

        const row = item.row >= 0 ? item.row : Math.floor(Math.random() * BB.CONST.GRID_ROWS);
        const sy = this.grid.rowCenterY(row);
        const enemy = new BB.Enemy(item.unit, row, BB.CONST.SPAWN_X, sy, diffSpec);
        this.enemies.push(enemy);

        if (enemy.spec.isBoss) {
          this.triggerShake(10, 0.35);
          this.floatingTexts.push(new BB.FloatingText(1460, sy - 95, '👑 시크릿쁘니 등장!', '#f5d0fe', 30));
        } else if (enemy.spec.isMiniBoss) {
          this.floatingTexts.push(new BB.FloatingText(1490, sy - 80, '🎀 큐티쁘니 등장!', '#fde047', 25));
        }
      }

      if (this.waveSpawnCursor >= w.spawns.length && this.enemies.length === 0) {
        this.waveClearDelay += dt;
        if (this.waveClearDelay >= 2.2) {
          this.waveClearDelay = 0;
          if (this.waveIndex < waves.length - 1) {
            this.waveIndex++;
            this.waveClock = 0;
            this.waveSpawnCursor = 0;
            const clearBonus = (diffSpec && diffSpec.waveClearBonus) || 25;
            this.addDream(clearBonus, 960, 260);
            this.announceWave(this.waveIndex);
          } else {
            this.state = 'VICTORY';
            this.saveStageStar(this.currentStage.id, Math.max(1, this.lives));
            BB.sound.play('victory');
            for (let i = 0; i < 45; i++) {
              this.spawnParticle(450 + Math.random() * 1020, 260 + Math.random() * 240, {
                vx: (Math.random() - 0.5) * 260,
                vy: -80 - Math.random() * 180,
                gravity: 190,
                size: 8 + Math.random() * 6,
                color: ['#fde047', '#f472b6', '#60a5fa', '#4ade80'][i % 4],
                life: 1.4,
                shape: 'star'
              });
            }
          }
        }
      }
    }

    frame(timestamp) {
      const rawDt = Math.min(0.05, Math.max(0.001, (timestamp - this.lastTimestamp) / 1000));
      this.lastTimestamp = timestamp;

      if (this.state === 'TITLE' || this.state === 'STAGE_SELECT') {
        this.titleTime += rawDt;
      } else if (this.state === 'PLAYING' && !this.showCodex) {
        const dt = rawDt * this.gameSpeed;
        this.updateGameplay(dt, rawDt);
      } else if (this.state === 'VICTORY') {
        this.particles.forEach(p => p.update(rawDt));
        this.particles = this.particles.filter(p => !p.dead);
      }

      this.render();
    }

    updateGameplay(dt, rawDt) {
      this.playTime += dt;
      if (this.dreamPulse > 0) this.dreamPulse = Math.max(0, this.dreamPulse - rawDt * 3.5);
      if (this.bannerTimer > 0) this.bannerTimer = Math.max(0, this.bannerTimer - rawDt);
      if (this.shakeTimer > 0) this.shakeTimer = Math.max(0, this.shakeTimer - rawDt);

      this.grid.update(dt);

      if (!this.welcomeBubbleDropped && this.playTime >= 1.5) {
        this.welcomeBubbleDropped = true;
        this.dreamBubbles.push(new BB.DreamBubble(680, 320, 25, true));
      }

      this.passiveTimer += dt;
      if (this.passiveTimer >= BB.CONST.PASSIVE_DREAM_INTERVAL) {
        this.passiveTimer -= BB.CONST.PASSIVE_DREAM_INTERVAL;
        const dc = this.getDreamCollectorWorldPos();
        const diffSpec = this.getDifficultySpec();
        const passiveAmt = (diffSpec && diffSpec.passiveDreamAmount) || BB.CONST.PASSIVE_DREAM_AMOUNT;
        this.addDream(passiveAmt, dc.x + 65, dc.y + 35);
      }

      BB.ALLY_ORDER.forEach(id => {
        if (this.deckCooldowns[id] > 0) {
          this.deckCooldowns[id] = Math.max(0, this.deckCooldowns[id] - dt);
        }
      });

      this.updateWaveSystem(dt);

      for (let i = 0; i < this.allies.length; i++) this.allies[i].update(dt, this);
      for (let i = 0; i < this.enemies.length; i++) this.enemies[i].update(dt, this);
      for (let i = 0; i < this.projectiles.length; i++) this.projectiles[i].update(dt, this);
      for (let i = 0; i < this.dreamBubbles.length; i++) this.dreamBubbles[i].update(dt, this);
      for (let i = 0; i < this.effects.length; i++) this.effects[i].update(dt);
      for (let i = 0; i < this.particles.length; i++) this.particles[i].update(dt);
      for (let i = 0; i < this.floatingTexts.length; i++) this.floatingTexts[i].update(dt);

      this.allies = this.allies.filter(a => !a.dead);
      this.enemies = this.enemies.filter(e => !e.dead);
      this.projectiles = this.projectiles.filter(p => !p.dead);
      this.dreamBubbles = this.dreamBubbles.filter(b => !b.dead);
      this.effects = this.effects.filter(fx => !fx.dead);
      this.particles = this.particles.filter(p => !p.dead);
      this.floatingTexts = this.floatingTexts.filter(ft => !ft.dead);
    }

    render() {
      const ctx = this.ctx;
      const VW = this.viewW;
      const VH = this.viewH;

      ctx.clearRect(0, 0, VW, VH);

      if (this.state === 'LOADING') {
        ctx.fillStyle = '#161024';
        ctx.fillRect(0, 0, VW, VH);
        ctx.font = BB.font(700, 36);
        ctx.fillStyle = '#fde68a';
        ctx.textAlign = 'center';
        ctx.fillText('말랑쁘니 피규어 준비 중... (' + this.loadedCount + '/' + this.totalAssets + ')', VW / 2, VH / 2);
        return;
      }

      // 세로 모드에서는 어두운 포근한 배경 베이스를 먼저 채움
      if (this.isPortrait) {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, VH);
        bgGrad.addColorStop(0, '#241834');
        bgGrad.addColorStop(0.5, '#2d1e3e');
        bgGrad.addColorStop(1, '#1b1228');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, VW, VH);
      }

      if (this.state === 'TITLE' || this.state === 'STAGE_SELECT') {
        // 타이틀(1단계 배경) 및 스테이지 선택(현재 선택된 단계의 배경!) 커버 렌더링
        const menuBg = this.state === 'STAGE_SELECT'
          ? this.getStageBgImage(this.previewStageIndex)
          : this.getStageBgImage(0);
        if (menuBg && menuBg.complete && menuBg.naturalWidth) {
          if (this.isPortrait) {
            const sc = Math.max(VW / 1920, VH / 1080);
            const dw = 1920 * sc;
            const dh = 1080 * sc;
            ctx.drawImage(menuBg, (VW - dw) * 0.5, (VH - dh) * 0.5, dw, dh);
          } else {
            ctx.drawImage(menuBg, 0, 0, VW, VH);
          }
        }
        this.ui.draw(ctx, this);
        return;
      }

      // 인게임 전장 렌더링 (가로: 전체 화면 / 세로: 중앙 디오라마 액자 클리핑 + 1:1 카메라 변환!)
      ctx.save();
      const c = this.cam;
      if (this.isPortrait) {
        // 디오라마 액자 외곽 테두리
        ctx.fillStyle = '#140c1f';
        ctx.strokeStyle = (this.currentStage && this.currentStage.badgeColor) || '#f6ad55';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(c.screenX - 3, c.screenY - 3, c.clipW + 6, c.clipH + 6, 22);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(c.screenX, c.screenY, c.clipW, c.clipH, 18);
        ctx.clip();
      }

      ctx.translate(c.screenX, c.screenY);
      ctx.scale(c.scale, c.scale);
      ctx.translate(-c.worldX, -c.worldY);

      if (this.shakeTimer > 0) {
        const sx = (Math.random() - 0.5) * this.shakeMag * 2;
        const sy = (Math.random() - 0.5) * this.shakeMag * 2;
        ctx.translate(sx, sy);
      }

      const stageBg = this.getStageBgImage(this.stageIndex);
      if (stageBg && stageBg.complete && stageBg.naturalWidth) {
        ctx.drawImage(stageBg, 0, 0, BB.CONST.WIDTH, BB.CONST.HEIGHT);
      } else {
        ctx.fillStyle = '#e7dec8';
        ctx.fillRect(0, 0, BB.CONST.WIDTH, BB.CONST.HEIGHT);
      }

      if (this.currentStage && this.currentStage.tintColor) {
        ctx.fillStyle = this.currentStage.tintColor;
        ctx.fillRect(0, 0, BB.CONST.WIDTH, BB.CONST.HEIGHT);
      }

      this.grid.drawGroundLayer(ctx, this);

      for (let i = 0; i < this.effects.length; i++) {
        if (this.effects[i].kind === 'lane_telegraph') {
          this.effects[i].draw(ctx);
        }
      }

      for (let r = 0; r < BB.CONST.GRID_ROWS; r++) {
        this.grid.drawRowProps(ctx, r);
        for (let i = 0; i < this.allies.length; i++) {
          if (this.allies[i].row === r) this.allies[i].draw(ctx, this.images);
        }
        for (let i = 0; i < this.enemies.length; i++) {
          if (this.enemies[i].row === r) this.enemies[i].draw(ctx, this.images);
        }
      }

      for (let i = 0; i < this.projectiles.length; i++) this.projectiles[i].draw(ctx);
      for (let i = 0; i < this.effects.length; i++) {
        if (this.effects[i].kind !== 'lane_telegraph') this.effects[i].draw(ctx);
      }
      for (let i = 0; i < this.particles.length; i++) this.particles[i].draw(ctx);
      for (let i = 0; i < this.dreamBubbles.length; i++) this.dreamBubbles[i].draw(ctx);
      for (let i = 0; i < this.floatingTexts.length; i++) this.floatingTexts[i].draw(ctx);

      ctx.restore();

      // UI 및 드래그 중인 손가락 커서 아이콘 렌더링
      this.ui.draw(ctx, this);
    }
  }

  window.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('game-canvas');
    BB.game = new Game(canvas);
  });
})();

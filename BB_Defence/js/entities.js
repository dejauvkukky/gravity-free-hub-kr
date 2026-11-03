(function () {
  'use strict';

  const BB = (window.BB = window.BB || {});

  const flashCanvas = document.createElement('canvas');
  flashCanvas.width = 220;
  flashCanvas.height = 220;
  const flashCtx = flashCanvas.getContext('2d');

  function drawSpriteWithFlash(ctx, img, x, y, drawW, drawH, flashAlpha) {
    if (!img || !img.complete || !img.naturalWidth) return;
    ctx.drawImage(img, x, y, drawW, drawH);

    if (flashAlpha > 0.02) {
      flashCtx.clearRect(0, 0, 220, 220);
      flashCtx.globalCompositeOperation = 'source-over';
      flashCtx.drawImage(img, 0, 0, 220, 220);
      flashCtx.globalCompositeOperation = 'source-in';
      flashCtx.fillStyle = 'rgba(255, 255, 255, ' + Math.min(0.88, flashAlpha).toFixed(3) + ')';
      flashCtx.fillRect(0, 0, 220, 220);
      ctx.drawImage(flashCanvas, 0, 0, 220, 220, x, y, drawW, drawH);
    }
  }

  class Ally {
    constructor(id, row, col, x, y, onPowerPad) {
      const spec = BB.ALLY_DB[id];
      this.id = id;
      this.spec = spec;
      this.name = spec.name;
      this.type = spec.type;
      this.row = row;
      this.col = col;
      this.x = x;
      this.y = y;

      this.onPowerPad = !!onPowerPad;
      this.powerBoost = this.onPowerPad ? 1.35 : 1.0;

      this.maxHp = spec.hp;
      this.hp = spec.hp;
      this.atk = spec.atk;
      this.range = spec.range;
      this.actionCd = spec.actionCd || 1.5;
      this.timer = spec.firstActionDelay !== undefined
        ? this.actionCd - spec.firstActionDelay
        : this.actionCd * 0.55;

      this.age = 0;
      this.dropAnim = 1.0;
      this.recoil = 0;
      this.hitFlash = 0;
      this.zzzTimer = 1.2;
      this.fuse = 0;
      this.dead = false;

      if (this.type === 'bomb') {
        BB.sound.play('fuse');
      }
    }

    takeDamage(amount, game) {
      if (this.dead || this.type === 'bomb') return;
      this.hp -= amount;
      this.hitFlash = 0.16;

      if (this.id === 'dandan') {
        game.spawnParticle(this.x + 22, this.y - 12, {
          vx: 40, vy: -35, size: 7, color: '#ffe57f', life: 0.25, shape: 'star'
        });
      }

      if (this.hp <= 0) {
        this.hp = 0;
        this.dead = true;
        BB.sound.play('pop_die');
        for (let i = 0; i < 10; i++) {
          game.spawnParticle(this.x, this.y - 10, {
            vx: (Math.random() - 0.5) * 180,
            vy: (Math.random() - 0.7) * 180,
            size: 7 + Math.random() * 6,
            color: i % 2 === 0 ? '#ffffff' : this.spec.accent,
            life: 0.42
          });
        }
        game.grid.clearCell(this.row, this.col, this);
      }
    }

    update(dt, game) {
      if (this.dead) return;
      this.age += dt;
      if (this.dropAnim > 0) this.dropAnim = Math.max(0, this.dropAnim - dt * 4.2);
      if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - dt * 5.0);
      if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt * 4.5);

      const effDt = dt * this.powerBoost;

      // 1. 말랑쁘니 (3x3 시한폭탄)
      if (this.type === 'bomb') {
        this.fuse += dt;
        if (this.fuse >= this.spec.fuseTime) {
          this.explode(game);
        }
        return;
      }

      // 2. 잠만보쁘니 (꿈방울 생산 — 별빛 패드 위에서는 35% 빠르게 생산!)
      if (this.type === 'resource') {
        this.timer += effDt;
        this.zzzTimer -= dt;
        if (this.zzzTimer <= 0) {
          this.zzzTimer = 2.1;
          game.spawnParticle(this.x + 18, this.y - 44, {
            vx: 14, vy: -28, size: 17, color: '#d8b4fe', life: 1.15, shape: 'text', text: 'Zzz'
          });
        }
        if (this.timer >= this.actionCd) {
          this.timer = 0;
          this.recoil = 1.0;
          BB.sound.play('dream_spawn');
          game.dreamBubbles.push(new BB.DreamBubble(this.x + 8, this.y - 34, this.spec.produceAmount, false));
        }
        return;
      }

      // 3. 단단쁘니 (메인 탱커 + 근접 태권도 정권 잽)
      if (this.type === 'tank') {
        this.timer += effDt;
        if (this.timer >= this.actionCd) {
          const closeEnemy = game.enemies.find(e =>
            !e.dead && e.jumpTimer <= 0 && e.row === this.row && e.x >= this.x - 10 && e.x <= this.x + this.range
          );
          if (closeEnemy) {
            this.timer = 0;
            this.recoil = 0.7;
            closeEnemy.takeDamage(this.atk, game, 'melee');
            BB.sound.play('hit');
          }
        }
        return;
      }

      // 4. 공격형 유닛들 (냠냠 / 요리 / 똘똘 — 적군 및 선물상자 자동 타격!)
      this.timer += effDt;
      if (this.timer < this.actionCd) return;

      if (this.type === 'ranged') {
        const hasEnemy = game.enemies.some(e =>
          !e.dead && e.row === this.row && e.x > this.x - 10 && e.x < BB.CONST.WIDTH - 24
        );
        const hasBox = game.grid.hasGiftBoxAhead(this.row, this.x);
        if (hasEnemy || hasBox) {
          this.timer = 0;
          this.recoil = 0.85;
          BB.sound.play('cookie_throw');
          game.projectiles.push(new BB.Projectile({
            kind: 'cookie',
            layer: BB.CONST.LAYER.ALLY_PROJ,
            mask: BB.CONST.LAYER.ENEMY,
            row: this.row,
            x: this.x + 34,
            y: this.y - 16,
            vx: this.spec.projSpeed,
            dmg: this.atk,
            radius: 16
          }));
        }
      } else if (this.type === 'melee_aoe') {
        const targets = game.enemies.filter(e =>
          !e.dead && e.jumpTimer <= 0 && e.row === this.row && e.x >= this.x - 24 && e.x <= this.x + this.range
        );
        const boxes = game.grid.getGiftBoxesInRange(this.row, this.x - 10, this.x + this.range);
        if (targets.length > 0 || boxes.length > 0) {
          this.timer = 0;
          this.recoil = 1.0;
          BB.sound.play('pan_swing');
          game.effects.push(new BB.VisualEffect({
            kind: 'slash',
            x: this.x + 24,
            y: this.y - 12,
            life: 0.26
          }));
          targets.forEach(e => {
            e.takeDamage(this.atk, game, 'melee');
            if (!e.spec.isBoss) {
              e.x = Math.min(BB.CONST.SPAWN_X, e.x + 15);
            }
            for (let k = 0; k < 4; k++) {
              game.spawnParticle(e.x, e.y - 18, {
                vx: 40 + Math.random() * 80,
                vy: (Math.random() - 0.5) * 90,
                size: 7, color: '#ffd54f', life: 0.28, shape: 'star'
              });
            }
          });
          boxes.forEach(b => game.grid.damageGiftBox(b, this.atk, game));
        }
      } else if (this.type === 'pierce') {
        const targets = game.enemies.filter(e =>
          !e.dead && e.row === this.row && e.x >= this.x - 10 && e.x < BB.CONST.WIDTH - 10
        );
        const boxes = game.grid.getGiftBoxesInRange(this.row, this.x, BB.CONST.WIDTH);
        if (targets.length > 0 || boxes.length > 0) {
          this.timer = 0;
          this.recoil = 1.0;
          BB.sound.play('laser');
          game.effects.push(new BB.VisualEffect({
            kind: 'beam',
            x: this.x + 30,
            y: this.y - 16,
            x2: BB.CONST.WIDTH,
            color: '#69f0ae',
            subColor: '#40c4ff',
            life: 0.30
          }));
          targets.forEach(e => {
            e.takeDamage(this.atk, game, 'pierce');
            for (let k = 0; k < 4; k++) {
              game.spawnParticle(e.x, e.y - 16, {
                vx: (Math.random() - 0.5) * 110,
                vy: (Math.random() - 0.5) * 110,
                size: 6, color: '#80ffd4', life: 0.3, shape: 'star'
              });
            }
          });
          boxes.forEach(b => game.grid.damageGiftBox(b, this.atk, game));
        }
      }
    }

    explode(game) {
      this.dead = true;
      game.grid.clearCell(this.row, this.col, this);
      BB.sound.play('explosion');
      game.triggerShake(13, 0.34);

      game.effects.push(new BB.VisualEffect({
        kind: 'ring',
        x: this.x,
        y: this.y - 6,
        radius: this.range,
        color: 'rgba(255, 130, 210, 0.78)',
        life: 0.42
      }));

      game.enemies.forEach(e => {
        if (!e.dead && Math.abs(e.row - this.row) <= 1 && Math.abs(e.x - this.x) <= this.range) {
          e.takeDamage(this.atk, game, 'bomb');
        }
      });

      // 주변 3x3 선물상자도 즉시 폭파 개봉!
      game.grid.damageGiftBoxesInArea(this.row, this.x, this.range, this.atk, game);

      const colors = ['#ff80ab', '#ea80fc', '#ffe57f', '#80d8ff', '#ffffff'];
      for (let i = 0; i < 28; i++) {
        const ang = (Math.PI * 2 * i) / 28 + Math.random() * 0.2;
        const spd = 120 + Math.random() * 290;
        game.spawnParticle(this.x, this.y - 12, {
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 35,
          gravity: 260,
          size: 7 + Math.random() * 7,
          color: colors[i % colors.length],
          life: 0.52 + Math.random() * 0.2,
          shape: i % 2 === 0 ? 'star' : 'circle'
        });
      }
    }

    draw(ctx, images) {
      const img = images.units[this.id];
      const dropOffset = -this.dropAnim * this.dropAnim * 56;

      let sx = 1 + Math.sin(this.age * 4.2 + this.col) * 0.032;
      let sy = 1 - Math.sin(this.age * 4.2 + this.col) * 0.032;
      let offsetX = 0;

      if (this.recoil > 0) {
        sx += this.recoil * 0.14;
        sy -= this.recoil * 0.10;
        offsetX = -this.recoil * 6;
      }

      if (this.type === 'bomb') {
        const p = Math.min(1, this.fuse / this.spec.fuseTime);
        const swell = 1 + p * 0.34 + Math.sin(this.fuse * 45) * 0.05;
        sx *= swell;
        sy *= swell;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 110, 195, ' + (0.12 + p * 0.18).toFixed(3) + ')';
        ctx.strokeStyle = 'rgba(255, 220, 245, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.arc(this.x, this.y + 6, this.range * (0.85 + p * 0.15), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(this.x + offsetX, this.y + 38 + dropOffset);

      // 별빛 증폭 패드 위에 있을 때 황금 후광 표시
      if (this.onPowerPad) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.28)';
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 48, 17, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(70, 52, 36, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 42, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 252, 240, 0.88)';
      ctx.strokeStyle = this.onPowerPad ? '#f59e0b' : this.spec.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 38, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (this.type === 'resource') {
        const prog = Math.min(1, this.timer / this.actionCd);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 41, 13.5, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog);
        ctx.stroke();
      }

      ctx.scale(sx, sy);
      const drawSize = this.id === 'jammanbo' ? 118 : 124;
      const flash = this.type === 'bomb'
        ? Math.max(0, Math.sin(this.fuse * 32) * 0.55)
        : this.hitFlash * 4.5;
      drawSpriteWithFlash(ctx, img, -drawSize / 2, -drawSize + 8, drawSize, drawSize, flash);

      ctx.restore();

      if (this.type !== 'bomb' && this.hp < this.maxHp) {
        drawUnitHpBar(ctx, this.x, this.y - 76, 68, 8, this.hp / this.maxHp, '#4ade80', '#14532d');
      }
    }
  }

  class Enemy {
    constructor(id, row, x, y, diffSpec) {
      const spec = BB.ENEMY_DB[id];
      const diff = diffSpec || (BB.game && BB.game.getDifficultySpec ? BB.game.getDifficultySpec() : BB.DIFFICULTIES.normal);
      this.id = id;
      this.spec = spec;
      this.name = spec.name;
      this.type = spec.type;
      this.row = row;
      this.x = x;
      this.y = y;

      this.isHard = !!(diff && diff.id === 'hard');
      this.maxHp = Math.round(spec.hp * (diff.enemyHpMult || 1));
      this.hp = this.maxHp;
      this.atk = Math.round(spec.atk * (diff.enemyAtkMult || 1));
      this.baseSpeed = spec.speed * (diff.enemySpeedMult || 1);
      this.attackRateMult = diff.enemyAttackRateMult || 1.0;
      this.auraMult = (spec.speedMult || 1.35) + (diff.bufferAuraBonus || 0);
      this.bossMultiLanes = diff.bossMultiLanes || 3;
      this.bossSummonCount = diff.bossSummonCount || 2;
      this.skillDmg = spec.skillDmg ? Math.round(spec.skillDmg * (diff.enemyAtkMult || 1)) : 0;
      this.skillCd = spec.skillCd ? spec.skillCd * (diff.bossCdScale || 1) : 0;
      this.summonCd = spec.summonCd ? spec.summonCd * (diff.bossCdScale || 1) : 0;
      this.scale = spec.scale || 1.0;
      this.hitRadius = 34 * this.scale;

      this.speedMult = 1.0;
      this.buffedTimer = 0;
      this.slowTimer = 0; // 태엽 오르골 둔화 타이머
      this.heartParticleTimer = 0.4;
      this.beltTrailTimer = 0;

      // 스프링 공중 넉백 점프 상태
      this.jumpTimer = 0;
      this.jumpDuration = 0.48;
      this.jumpStartX = x;
      this.jumpEndX = x;

      // 차원 거울 포탈 재진입 방지 기록
      this.teleported = {};

      this.state = 'MOVE';
      this.attackTimer = 0.4;
      this.skillTimer = 2.6;
      this.summonTimer = 5.5;
      this.castTelegraph = 0;
      this.targetRows = [];

      this.age = Math.random() * 2;
      this.lunge = 0;
      this.hitFlash = 0;
      this.dead = false;
    }

    applyBounceBack(dist) {
      this.jumpDuration = 0.48;
      this.jumpTimer = 0.48;
      this.jumpStartX = this.x;
      this.jumpEndX = Math.min(BB.CONST.SPAWN_X - 24, this.x + dist);
    }

    takeDamage(amount, game, sourceType) {
      if (this.dead) return;
      this.hp -= amount;
      this.hitFlash = 0.15;

      const color = sourceType === 'bomb' ? '#ff9be2'
        : sourceType === 'pierce' ? '#80ffd4'
        : sourceType === 'spring' ? '#38bdf8'
        : sourceType === 'music' ? '#6ee7b7'
        : sourceType === 'melee' ? '#ffd54f'
        : '#ffffff';
      game.floatingTexts.push(new BB.FloatingText(
        this.x + (Math.random() - 0.5) * 18,
        this.y - 70 * this.scale,
        '-' + Math.round(amount),
        color,
        sourceType === 'bomb' ? 30 : 22
      ));

      if (this.hp <= 0) {
        this.hp = 0;
        this.dead = true;
        game.kills++;
        BB.sound.play('pop_die');

        if (this.spec.dropDream > 0) {
          game.dreamBubbles.push(new BB.DreamBubble(this.x, this.y - 24, this.spec.dropDream, false));
        }

        const pCount = this.spec.isBoss ? 28 : this.spec.isMiniBoss ? 18 : 11;
        for (let i = 0; i < pCount; i++) {
          game.spawnParticle(this.x, this.y - 22, {
            vx: (Math.random() - 0.5) * 230,
            vy: (Math.random() - 0.7) * 220,
            gravity: 220,
            size: 6 + Math.random() * 7,
            color: i % 2 === 0 ? '#e9d5ff' : this.spec.accent,
            life: 0.48,
            shape: i % 3 === 0 ? 'star' : 'circle'
          });
        }
      }
    }

    update(dt, game) {
      if (this.dead) return;
      this.age += dt;
      if (this.lunge > 0) this.lunge = Math.max(0, this.lunge - dt * 5);
      if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt * 4.5);
      if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);

      // 스프링 발판에 의해 공중으로 튕겨 날아가는 중!
      if (this.jumpTimer > 0) {
        this.jumpTimer = Math.max(0, this.jumpTimer - dt);
        const p = 1 - this.jumpTimer / this.jumpDuration;
        this.x = this.jumpStartX + (this.jumpEndX - this.jumpStartX) * p;
        return;
      }

      if (this.buffedTimer > 0) {
        this.buffedTimer -= dt;
        this.heartParticleTimer -= dt;
        if (this.heartParticleTimer <= 0) {
          this.heartParticleTimer = 0.55;
          game.spawnParticle(this.x + (Math.random() - 0.5) * 28, this.y - 54, {
            vx: 0, vy: -34, size: 7, color: '#ff6ba9', life: 0.55, shape: 'heart'
          });
        }
      } else {
        this.speedMult = 1.0;
      }

      // 사랑쁘니 광역 가속 버프 부여
      if (this.type === 'buffer') {
        const r = this.spec.auraRadius;
        const boost = this.auraMult || this.spec.speedMult;
        for (let i = 0; i < game.enemies.length; i++) {
          const other = game.enemies[i];
          if (!other.dead && other !== this) {
            if (Math.hypot(other.x - this.x, other.y - this.y) <= r) {
              other.speedMult = Math.max(other.speedMult, boost);
              other.buffedTimer = 0.2;
            }
          }
        }
      }

      // 맵 타일 기믹 체크 (가속 테이프 / 스프링 트랩 / 차원 포탈)
      let beltMult = 1.0;
      const underTile = game.grid.getSpecialTileAtPos(this.row, this.x);
      if (underTile) {
        if (underTile.type === BB.CONST.TILE.SPEED_BELT) {
          beltMult = 1.65;
          this.beltTrailTimer -= dt;
          if (this.beltTrailTimer <= 0) {
            this.beltTrailTimer = 0.12;
            game.spawnParticle(this.x + 22, this.y + 24, {
              vx: 75, vy: -8, size: 5, color: '#fda4af', life: 0.22
            });
          }
        } else if (underTile.type === BB.CONST.TILE.SPRING_TRAP && underTile.cooldown <= 0 && Math.abs(this.x - underTile.cx) < 28) {
          game.grid.activateSpringTrap(underTile, this, game);
          if (this.dead || this.jumpTimer > 0) return;
        } else if (underTile.type === BB.CONST.TILE.PORTAL_IN && !this.teleported[underTile.pairId] && Math.abs(this.x - underTile.cx) < 24) {
          this.teleported[underTile.pairId] = true;
          game.grid.warpEnemyThroughPortal(underTile, this, game);
        }
      }

      const slowFactor = this.slowTimer > 0 ? 0.55 : 1.0;
      const totalRate = this.speedMult * slowFactor;

      // 시크릿쁘니 (최종 보스) 특수 패턴
      if (this.spec.isBoss) {
        this.summonTimer -= dt * slowFactor;
        if (this.summonTimer <= 0 && this.x > BB.CONST.GRID_X + 350) {
          this.summonTimer = this.summonCd || this.spec.summonCd;
          const rows = [Math.max(0, this.row - 1), Math.min(BB.CONST.GRID_ROWS - 1, this.row + 1)];
          if ((this.bossSummonCount || 2) >= 3) {
            rows.push(this.row);
          }
          const diffSpec = game.getDifficultySpec ? game.getDifficultySpec() : null;
          rows.forEach((r, sIdx) => {
            const sx = Math.min(BB.CONST.SPAWN_X - 30, this.x + 65 + sIdx * 24);
            const sy = game.grid.rowCenterY(r);
            const unitId = (this.isHard && sIdx === 2)
              ? 'makeup'
              : (Math.random() < 0.50 ? 'dog' : 'makeup');
            game.enemies.push(new Enemy(unitId, r, sx, sy, diffSpec));
            for (let k = 0; k < 8; k++) {
              game.spawnParticle(sx, sy - 20, {
                vx: (Math.random() - 0.5) * 140,
                vy: (Math.random() - 0.5) * 140,
                size: 7, color: '#f5d0fe', life: 0.4, shape: 'star'
              });
            }
          });
          game.floatingTexts.push(new BB.FloatingText(this.x, this.y - 115, this.isHard ? '🔥 정예 호위대 소환!' : '호위병 소환!', '#f5d0fe', 24));
        }

        if (this.castTelegraph > 0) {
          this.castTelegraph -= dt;
          if (this.castTelegraph <= 0) {
            BB.sound.play('boss_skill');
            this.lunge = 1.0;
            const boltDmg = this.skillDmg || this.spec.skillDmg;
            this.targetRows.forEach(r => {
              game.projectiles.push(new BB.Projectile({
                kind: 'star_bolt',
                layer: BB.CONST.LAYER.ENEMY_PROJ,
                mask: BB.CONST.LAYER.ALLY,
                row: r,
                x: this.x - 36,
                y: game.grid.rowCenterY(r) - 14,
                vx: -410,
                dmg: boltDmg,
                radius: 18
              }));
            });
          }
          return;
        }

        this.skillTimer -= dt * slowFactor;
        if (this.skillTimer <= 0) {
          this.skillTimer = this.skillCd || this.spec.skillCd;
          this.castTelegraph = 0.95;
          const pool = [0, 1, 2, 3, 4].filter(r => r !== this.row);
          pool.sort(() => Math.random() - 0.5);
          const extraLanes = Math.min(pool.length, Math.max(2, (this.bossMultiLanes || 3) - 1));
          this.targetRows = [this.row].concat(pool.slice(0, extraLanes));
          this.targetRows.forEach(r => {
            game.effects.push(new BB.VisualEffect({
              kind: 'lane_telegraph',
              x: this.x,
              y: game.grid.rowCenterY(r) - 10,
              life: 0.92
            }));
          });
          return;
        }
      }

      // 전방 아군 탐색
      let blocker = null;
      let rangedTarget = null;
      let minDist = Infinity;

      for (let i = 0; i < game.allies.length; i++) {
        const a = game.allies[i];
        if (a.dead || a.type === 'bomb' || a.row !== this.row) continue;
        const d = this.x - a.x;
        if (d >= -16 && d < minDist) {
          minDist = d;
          if (d <= 68) blocker = a;
          if (this.type === 'ranged' && d <= this.spec.range) rangedTarget = a;
        }
      }

      const atkRate = totalRate * (this.attackRateMult || 1.0);
      if (blocker) {
        this.state = 'ATTACK';
        this.attackTimer -= dt * atkRate;
        if (this.attackTimer <= 0) {
          this.attackTimer = 0.85;
          this.lunge = 1.0;
          blocker.takeDamage(this.atk * 0.85, game);
          BB.sound.play('hit');
        }
      } else if (this.type === 'ranged' && rangedTarget) {
        this.state = 'ATTACK';
        this.attackTimer -= dt * atkRate;
        if (this.attackTimer <= 0) {
          this.attackTimer = this.spec.attackCd;
          this.lunge = 0.85;
          BB.sound.play('enemy_shot');
          game.projectiles.push(new BB.Projectile({
            kind: 'puff_heart',
            layer: BB.CONST.LAYER.ENEMY_PROJ,
            mask: BB.CONST.LAYER.ALLY,
            row: this.row,
            x: this.x - 28,
            y: this.y - 16,
            vx: -this.spec.projSpeed,
            dmg: this.atk,
            radius: 15
          }));
        }
      } else {
        this.state = 'MOVE';
        this.x -= this.baseSpeed * totalRate * beltMult * dt;

        if (this.x <= BB.CONST.DEFENSE_LINE_X) {
          this.dead = true;
          game.onLineBreached(this.row, this);
        }
      }
    }

    draw(ctx, images) {
      const img = images.units[this.id];
      const jumpArcY = this.jumpTimer > 0
        ? Math.sin((1 - this.jumpTimer / this.jumpDuration) * Math.PI) * 95
        : 0;
      const walkBob = (this.state === 'MOVE' && this.jumpTimer <= 0)
        ? Math.abs(Math.sin(this.age * (this.baseSpeed * 0.11) * this.speedMult)) * 7
        : 0;
      const walkTilt = this.jumpTimer > 0
        ? (1 - this.jumpTimer / this.jumpDuration) * 0.55
        : this.state === 'MOVE'
        ? Math.sin(this.age * (this.baseSpeed * 0.11) * this.speedMult) * 0.055 - 0.035
        : -this.lunge * 0.12;
      const lungeX = -this.lunge * 11;

      ctx.save();
      ctx.translate(this.x + lungeX, this.y + 38);

      if (this.type === 'buffer') {
        const pulse = 0.96 + Math.sin(this.age * 4) * 0.04;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 105, 165, 0.36)';
        ctx.fillStyle = 'rgba(255, 105, 165, 0.07)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, -18, this.spec.auraRadius * pulse, this.spec.auraRadius * 0.55 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 적군 그림자 발판 (오르골 슬로우 걸리면 민트블루 링, 어려움 모드는 크림슨 링 표시!)
      const baseW = 40 * this.scale;
      const baseH = 13 * this.scale;
      ctx.fillStyle = this.isHard ? 'rgba(68, 12, 34, 0.56)' : 'rgba(46, 16, 75, 0.52)';
      ctx.strokeStyle = this.slowTimer > 0
        ? '#38bdf8'
        : this.buffedTimer > 0
        ? '#ff6ba9'
        : this.isHard
        ? '#fb7185'
        : '#c084fc';
      ctx.lineWidth = (this.slowTimer > 0 || this.buffedTimer > 0) ? 3.5 : 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, baseW, baseH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.translate(0, -walkBob - jumpArcY);
      ctx.rotate(walkTilt);

      const sx = this.scale * (1 + Math.sin(this.age * 5) * 0.024);
      const sy = this.scale * (1 - Math.sin(this.age * 5) * 0.024);
      ctx.scale(sx, sy);

      const drawSize = 124;
      const flash = this.castTelegraph > 0
        ? 0.35 + Math.sin(this.age * 24) * 0.25
        : this.hitFlash * 4.5;
      drawSpriteWithFlash(ctx, img, -drawSize / 2, -drawSize + 8, drawSize, drawSize, flash);

      ctx.restore();

      // 둔화 아이콘 표시
      if (this.slowTimer > 0) {
        ctx.save();
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#7dd3fc';
        ctx.textAlign = 'center';
        ctx.fillText('❄️♪', this.x, this.y - 88 * this.scale - jumpArcY);
        ctx.restore();
      }

      if (this.hp < this.maxHp || this.spec.isMiniBoss || this.spec.isBoss) {
        const bw = this.spec.isBoss ? 96 : this.spec.isMiniBoss ? 82 : 66;
        const by = this.y - 78 * this.scale - jumpArcY;
        drawUnitHpBar(ctx, this.x, by, bw, 8, this.hp / this.maxHp, '#fb7185', '#4c0519');
      }
    }
  }

  function drawUnitHpBar(ctx, cx, y, w, h, ratio, fillCol, bgCol) {
    const r = Math.max(0, Math.min(1, ratio));
    const x = cx - w / 2;
    ctx.save();
    ctx.fillStyle = bgCol;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    ctx.stroke();

    if (r > 0) {
      ctx.fillStyle = fillCol;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, Math.max(4, (w - 2) * r), h - 2, (h - 2) / 2);
      ctx.fill();
    }
    ctx.restore();
  }

  BB.Ally = Ally;
  BB.Enemy = Enemy;
})();

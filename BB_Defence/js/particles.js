(function () {
  'use strict';

  const BB = (window.BB = window.BB || {});

  class DreamBubble {
    constructor(x, y, amount, fromSky) {
      this.x = x;
      this.y = fromSky ? y - 90 : y;
      this.targetY = fromSky ? y + 10 : y - 28;
      this.vx = (Math.random() - 0.5) * (fromSky ? 16 : 46);
      this.vy = fromSky ? 65 : -135;
      this.fromSky = !!fromSky;
      this.amount = amount;
      this.age = 0;
      this.autoCollectDelay = fromSky ? 1.8 : 1.35;
      this.collecting = false;
      this.dead = false;
      this.radius = amount >= 25 ? 28 : 22;
      this.phase = Math.random() * Math.PI * 2;
    }

    collect() {
      if (this.collecting || this.dead) return;
      this.collecting = true;
      BB.sound.play('dream_collect');
    }

    update(dt, game) {
      this.age += dt;
      if (!this.collecting) {
        if (this.fromSky) {
          if (this.y < this.targetY) {
            this.y += this.vy * dt;
            this.x += this.vx * dt;
          }
        } else {
          this.vy += 290 * dt;
          this.x += this.vx * dt;
          this.y += this.vy * dt;
          if (this.y > this.targetY + 34 && this.vy > 0) {
            this.y = this.targetY + 34;
            this.vy *= -0.35;
            this.vx *= 0.5;
          }
        }
        if (this.age >= this.autoCollectDelay) {
          this.collect();
        }
      } else {
        // 상단 꿈방울 카운터 방향으로 부드럽게 빨려 들어감
        const target = game.getDreamCollectorWorldPos ? game.getDreamCollectorWorldPos() : { x: 425, y: 62 };
        const tx = target.x;
        const ty = target.y;
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 28) {
          game.addDream(this.amount, this.x, this.y);
          this.dead = true;
          return;
        }
        const spd = 980 + this.age * 350;
        this.x += (dx / dist) * spd * dt;
        this.y += (dy / dist) * spd * dt;
      }
    }

    draw(ctx) {
      const pulse = 1 + Math.sin(this.age * 6 + this.phase) * 0.07;
      const r = this.radius * pulse;
      const bobY = this.collecting ? 0 : Math.sin(this.age * 4 + this.phase) * 4;

      ctx.save();
      ctx.translate(this.x, this.y + bobY);

      // 외곽 무지개빛 후광
      const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.55);
      glow.addColorStop(0, 'rgba(255, 248, 195, 0.95)');
      glow.addColorStop(0.55, 'rgba(176, 226, 255, 0.72)');
      glow.addColorStop(1, 'rgba(235, 185, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
      ctx.fill();

      // 구슬 본체
      const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.32, r * 0.1, 0, 0, r);
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.45, '#bfeaff');
      bodyGrad.addColorStop(0.82, '#e5b8ff');
      bodyGrad.addColorStop(1, '#8ec5fc');
      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 내부 반짝이 별과 하이라이트
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.34, -r * 0.34, r * 0.26, r * 0.15, -0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff59d';
      drawMiniStar(ctx, r * 0.16, r * 0.14, r * 0.34, 4);

      ctx.restore();
    }
  }

  class Projectile {
    constructor(opts) {
      this.kind = opts.kind; // 'cookie' | 'puff_heart' | 'star_bolt'
      this.layer = opts.layer;
      this.mask = opts.mask;
      this.row = opts.row;
      this.x = opts.x;
      this.y = opts.y;
      this.vx = opts.vx;
      this.dmg = opts.dmg;
      this.radius = opts.radius || 16;
      this.rot = 0;
      this.age = 0;
      this.trailTimer = 0;
      this.dead = false;
    }

    update(dt, game) {
      this.age += dt;
      this.x += this.vx * dt;
      this.rot += (this.vx > 0 ? 7.5 : -6.5) * dt;
      this.trailTimer += dt;

      if (this.trailTimer >= 0.045) {
        this.trailTimer = 0;
        if (this.kind === 'cookie') {
          game.spawnParticle(this.x - 10, this.y + (Math.random() - 0.5) * 8, {
            vx: -35, vy: (Math.random() - 0.5) * 24,
            size: 4, color: '#e2a45b', life: 0.26
          });
        } else if (this.kind === 'puff_heart') {
          game.spawnParticle(this.x + 10, this.y + (Math.random() - 0.5) * 10, {
            vx: 28, vy: -15,
            size: 5, color: '#ff8cc6', life: 0.3
          });
        } else if (this.kind === 'star_bolt') {
          game.spawnParticle(this.x + 12, this.y + (Math.random() - 0.5) * 12, {
            vx: 35, vy: (Math.random() - 0.5) * 30,
            size: 6, color: '#ffe57f', life: 0.36, shape: 'star'
          });
        }
      }

      if (this.x < 220 || this.x > BB.CONST.WIDTH + 80) {
        this.dead = true;
        return;
      }

      // 충돌 판정 (Layer 3 -> Enemy 및 선물상자 / Layer 4 -> Ally 엄격 분리!)
      if (this.mask & BB.CONST.LAYER.ENEMY) {
        let hitEnemy = null;
        for (let i = 0; i < game.enemies.length; i++) {
          const e = game.enemies[i];
          if (!e.dead && e.jumpTimer <= 0 && e.row === this.row && Math.abs(e.x - this.x) < this.radius + e.hitRadius) {
            hitEnemy = e;
            break;
          }
        }
        const hitBox = !hitEnemy ? game.grid.findHitGiftBox(this.row, this.x, this.radius + 32) : null;

        if (hitEnemy || hitBox) {
          if (hitEnemy) {
            hitEnemy.takeDamage(this.dmg, game, 'cookie');
          } else if (hitBox) {
            game.grid.damageGiftBox(hitBox, this.dmg, game);
          }
          BB.sound.play('hit');
          for (let k = 0; k < 6; k++) {
            game.spawnParticle(this.x, this.y, {
              vx: (Math.random() - 0.5) * 170,
              vy: (Math.random() - 0.8) * 160,
              size: 4 + Math.random() * 3,
              color: k % 2 === 0 ? '#d28b47' : '#5d3a1a',
              life: 0.35,
              gravity: 340
            });
          }
          this.dead = true;
          return;
        }
      } else if (this.mask & BB.CONST.LAYER.ALLY) {
        for (let i = 0; i < game.allies.length; i++) {
          const a = game.allies[i];
          if (!a.dead && a.type !== 'bomb' && a.row === this.row && Math.abs(a.x - this.x) < this.radius + 36) {
            a.takeDamage(this.dmg, game);
            BB.sound.play('hit');
            const hitColor = this.kind === 'star_bolt' ? '#ffe082' : '#ff80ab';
            for (let k = 0; k < 6; k++) {
              game.spawnParticle(this.x, this.y, {
                vx: (Math.random() - 0.5) * 160,
                vy: (Math.random() - 0.5) * 160,
                size: 5,
                color: hitColor,
                life: 0.32,
                shape: this.kind === 'star_bolt' ? 'star' : 'circle'
              });
            }
            this.dead = true;
            return;
          }
        }
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      if (this.kind === 'cookie') {
        ctx.rotate(this.rot);
        // 그림자
        ctx.fillStyle = 'rgba(60, 35, 15, 0.24)';
        ctx.beginPath();
        ctx.arc(2, 5, 15, 0, Math.PI * 2);
        ctx.fill();
        // 바삭한 초코칩 쿠키
        const g = ctx.createRadialGradient(-4, -4, 2, 0, 0, 15);
        g.addColorStop(0, '#f4be7c');
        g.addColorStop(1, '#c67f39');
        ctx.fillStyle = g;
        ctx.strokeStyle = '#8d531d';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 초코칩 5개
        ctx.fillStyle = '#4a2810';
        [[-5, -5], [5, -4], [0, 2], [-6, 6], [6, 5]].forEach(function (pt) {
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], 2.7, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (this.kind === 'puff_heart') {
        const s = 1 + Math.sin(this.age * 14) * 0.1;
        ctx.scale(s, s);
        ctx.shadowColor = '#ff4081';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ff6aa9';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        drawHeart(ctx, 0, -6, 15);
        ctx.fill();
        ctx.stroke();
      } else if (this.kind === 'star_bolt') {
        ctx.rotate(this.rot);
        ctx.shadowColor = '#ffd54f';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#fff59d';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        drawMiniStar(ctx, 0, 0, 18, 5);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  class VisualEffect {
    constructor(opts) {
      this.kind = opts.kind; // 'beam' | 'slash' | 'ring' | 'lane_telegraph'
      this.x = opts.x;
      this.y = opts.y;
      this.x2 = opts.x2 || opts.x + 200;
      this.radius = opts.radius || 100;
      this.color = opts.color || '#ffffff';
      this.subColor = opts.subColor || '#ffd54f';
      this.life = opts.life || 0.35;
      this.maxLife = this.life;
      this.dead = false;
    }

    update(dt) {
      this.life -= dt;
      if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
      const p = 1 - this.life / this.maxLife;
      const alpha = Math.max(0, 1 - p);

      ctx.save();
      if (this.kind === 'beam') {
        // 똘똘쁘니 직선 관통 지식 광선
        const h = (26 * (1 - p * 0.65));
        ctx.globalAlpha = alpha;
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + h);
        grad.addColorStop(0, this.color);
        grad.addColorStop(0.5, '#ffffff');
        grad.addColorStop(1, this.subColor);

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 18;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y - h / 2, this.x2 - this.x, h, h / 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(this.x, this.y - h * 0.24, this.x2 - this.x, h * 0.48, h * 0.24);
        ctx.fill();
      } else if (this.kind === 'slash') {
        // 요리쁘니 프라이팬 광역 스윙 아크
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#fff8e1';
        ctx.shadowColor = '#ff7043';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 18 * (1 - p * 0.5);
        ctx.lineCap = 'round';
        const r = 90 + p * 95;
        ctx.beginPath();
        ctx.arc(0, 0, r, -0.68, 0.68);
        ctx.stroke();

        ctx.strokeStyle = '#ffab40';
        ctx.lineWidth = 8 * (1 - p * 0.5);
        ctx.beginPath();
        ctx.arc(10, 0, r * 0.86, -0.62, 0.62);
        ctx.stroke();
      } else if (this.kind === 'ring') {
        // 말랑쁘니 3x3 대폭발 / 방어선 충격파 링
        const curR = this.radius * (0.22 + 0.88 * Math.pow(p, 0.55));
        ctx.globalAlpha = alpha;
        const rg = ctx.createRadialGradient(this.x, this.y, curR * 0.15, this.x, this.y, curR);
        rg.addColorStop(0, 'rgba(255,255,255,0.65)');
        rg.addColorStop(0.6, this.color);
        rg.addColorStop(1, 'rgba(255,150,220,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(this.x, this.y, curR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 7 * alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, curR * 0.94, 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.kind === 'lane_telegraph') {
        // 시크릿쁘니 멀티라인 공격 예고선
        const blink = 0.22 + Math.abs(Math.sin(p * Math.PI * 4)) * 0.25;
        ctx.fillStyle = 'rgba(225, 145, 255, ' + blink.toFixed(3) + ')';
        ctx.fillRect(BB.CONST.GRID_X, this.y - 36, this.x - BB.CONST.GRID_X, 72);
        ctx.strokeStyle = 'rgba(255, 230, 140, ' + (blink * 1.8).toFixed(3) + ')';
        ctx.setLineDash([14, 10]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(BB.CONST.GRID_X, this.y);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  class Particle {
    constructor(x, y, opts) {
      this.x = x;
      this.y = y;
      this.vx = opts.vx || 0;
      this.vy = opts.vy || 0;
      this.gravity = opts.gravity || 0;
      this.size = opts.size || 6;
      this.color = opts.color || '#ffffff';
      this.life = opts.life || 0.5;
      this.maxLife = this.life;
      this.shape = opts.shape || 'circle'; // 'circle' | 'star' | 'heart' | 'text'
      this.text = opts.text || '';
      this.dead = false;
    }

    update(dt) {
      this.life -= dt;
      if (this.life <= 0) {
        this.dead = true;
        return;
      }
      this.vy += this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    draw(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(this.x, this.y);

      if (this.shape === 'star') {
        ctx.fillStyle = this.color;
        drawMiniStar(ctx, 0, 0, this.size, 4);
      } else if (this.shape === 'heart') {
        ctx.fillStyle = this.color;
        drawHeart(ctx, 0, -this.size * 0.4, this.size);
        ctx.fill();
      } else if (this.shape === 'text') {
        ctx.font = BB.font(800, this.size);
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(30, 18, 45, 0.85)';
        ctx.lineWidth = 3.5;
        ctx.strokeText(this.text, 0, 0);
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, 0, 0);
      } else {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class FloatingText {
    constructor(x, y, text, color, size) {
      this.x = Math.max(410, Math.min(1530, x));
      this.y = y;
      this.text = text;
      this.color = color || '#ffffff';
      const baseSize = size || 26;
      const isMob = BB.game && BB.game.isMobileUI;
      this.size = Math.round(baseSize * (isMob ? 1.38 : 1.18));
      this.life = 0.95;
      this.maxLife = 0.95;
      this.dead = false;
    }

    update(dt) {
      this.life -= dt;
      this.y -= 42 * dt;
      if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
      const p = 1 - this.life / this.maxLife;
      const alpha = p < 0.72 ? 1 : (1 - p) / 0.28;
      const scale = p < 0.16 ? 0.72 + (p / 0.16) * 0.4 : 1.0;

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(this.x, this.y);
      ctx.scale(scale, scale);
      ctx.font = BB.font(800, this.size);
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(20, 12, 32, 0.92)';
      ctx.lineWidth = Math.max(5, Math.round(this.size * 0.20));
      ctx.strokeText(this.text, 0, 0);
      ctx.fillStyle = this.color;
      ctx.fillText(this.text, 0, 0);
      ctx.restore();
    }
  }

  function drawMiniStar(ctx, cx, cy, outerR, points) {
    const innerR = outerR * 0.45;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / points;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = cx + Math.cos(ang) * r;
      const py = cy + Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawHeart(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.35);
    ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.45);
    ctx.bezierCurveTo(x - size, y + size * 0.95, x, y + size * 1.25, x, y + size * 1.45);
    ctx.bezierCurveTo(x, y + size * 1.25, x + size, y + size * 0.95, x + size, y + size * 0.45);
    ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.35);
    ctx.closePath();
  }

  BB.DreamBubble = DreamBubble;
  BB.Projectile = Projectile;
  BB.VisualEffect = VisualEffect;
  BB.Particle = Particle;
  BB.FloatingText = FloatingText;
  BB.drawMiniStar = drawMiniStar;
  BB.drawHeart = drawHeart;
})();


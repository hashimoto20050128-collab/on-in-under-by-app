/* =========================================================================
   common.js  -- 共有エンジン
   - 配置できる物品の定義
   - Scene: 背景＋ドラッグ配置／リサイズができる描画エンジン（編集／閲覧両対応）
   - buildPalette: 物品トレイ（タップで配置）
   - scoreGuess: 正解との「近さ」を 0〜100 で採点
   ========================================================================= */

/* 物品の定義（natW/natH は元画像の縦横比、w は背景幅に対する基本サイズの割合） */
const OBJECTS = [
  { id: 'lamp',   en: 'lamp',   ja: 'ランプ',   img: 'assets/lamp.png',   natW: 255, natH: 280, w: 0.085 },
  { id: 'pencil', en: 'pencil', ja: 'えんぴつ', img: 'assets/pencil.png', natW: 247, natH: 103, w: 0.11  },
  { id: 'ball',   en: 'ball',   ja: 'ボール',   img: 'assets/ball.png',   natW: 156, natH: 148, w: 0.06  },
  { id: 'book',   en: 'book',   ja: '本',       img: 'assets/book.png',   natW: 154, natH: 123, w: 0.075 },
  { id: 'plant',  en: 'plant',  ja: '植木',     img: 'assets/plant.png',  natW: 135, natH: 178, w: 0.05  },
];
const OBJ_BY_ID = Object.fromEntries(OBJECTS.map(o => [o.id, o]));
const SCENE_RATIO = 1918 / 1077; // 背景の縦横比

/* ---------------------------------------------------------------- Scene */
class Scene {
  /* container: 描画先の要素 / opts: {editable, allowResize, onChange} */
  constructor(container, opts = {}) {
    this.container = container;
    this.editable = !!opts.editable;
    this.allowResize = !!opts.allowResize;
    this.onChange = opts.onChange || (() => {});
    this.state = {};          // { id: {x, y, scale} }  x,y は中心の 0〜1 座標
    this.selected = null;
    this.nodes = {};          // id -> wrapper element

    container.classList.add('scene');
    this.bg = document.createElement('img');
    this.bg.className = 'scene-bg';
    this.bg.src = 'assets/bg.png';
    this.bg.draggable = false;
    container.appendChild(this.bg);

    // 何もないところをタップしたら選択解除
    container.addEventListener('pointerdown', (e) => {
      if (e.target === container || e.target === this.bg) this._select(null);
    });
  }

  setEditable(v) { this.editable = v; this._renderControls(); }
  setAllowResize(v) { this.allowResize = v; this._renderControls(); }

  /* 状態をまとめてセットして再描画 */
  setState(state) {
    this.state = {};
    if (state) for (const id in state) {
      const s = state[id];
      if (s && typeof s.x === 'number') {
        this.state[id] = { x: s.x, y: s.y, scale: s.scale || 1 };
      }
    }
    this._renderAll();
  }
  getState() { return JSON.parse(JSON.stringify(this.state)); }
  clear() { this.state = {}; this.selected = null; this._renderAll(); this.onChange(); }

  /* 物品を中央付近に置く（トレイから呼ぶ） */
  place(id) {
    if (this.state[id]) return;
    // 少しずらして重ならないように
    const n = Object.keys(this.state).length;
    this.state[id] = { x: 0.42 + (n % 3) * 0.06, y: 0.45 + Math.floor(n / 3) * 0.08, scale: 1 };
    this._renderAll();
    this._select(id);
    this.onChange();
  }
  remove(id) {
    delete this.state[id];
    if (this.selected === id) this.selected = null;
    this._renderAll();
    this.onChange();
  }

  /* ---- 内部描画 ---- */
  _renderAll() {
    // 既存ノードを消す
    for (const id in this.nodes) this.nodes[id].remove();
    this.nodes = {};
    for (const id in this.state) this._renderObject(id);
    this._renderControls();
  }

  _sizeFor(id) {
    const o = OBJ_BY_ID[id];
    const rect = this.container.getBoundingClientRect();
    const w = rect.width * o.w * (this.state[id].scale || 1);
    const h = w * (o.natH / o.natW);
    return { w, h };
  }

  _renderObject(id) {
    const o = OBJ_BY_ID[id];
    const wrap = document.createElement('div');
    wrap.className = 'obj';
    wrap.dataset.id = id;
    const img = document.createElement('img');
    img.src = o.img; img.draggable = false; img.alt = o.en;
    wrap.appendChild(img);
    this.container.appendChild(wrap);
    this.nodes[id] = wrap;
    this._position(id);

    if (this.editable) {
      wrap.style.cursor = 'grab';
      wrap.addEventListener('pointerdown', (e) => this._startDrag(e, id));
    }
  }

  _position(id) {
    const wrap = this.nodes[id];
    if (!wrap) return;
    const rect = this.container.getBoundingClientRect();
    const { w, h } = this._sizeFor(id);
    const s = this.state[id];
    wrap.style.width = w + 'px';
    wrap.style.height = h + 'px';
    wrap.style.left = (s.x * rect.width - w / 2) + 'px';
    wrap.style.top = (s.y * rect.height - h / 2) + 'px';
    wrap.classList.toggle('selected', this.selected === id && this.editable);
  }

  _select(id) {
    this.selected = id;
    for (const k in this.nodes) this.nodes[k].classList.toggle('selected', k === id && this.editable);
    this._renderControls();
  }

  /* 選択中の物品に削除ボタン／リサイズハンドルを表示 */
  _renderControls() {
    // 既存コントロールを除去
    this.container.querySelectorAll('.obj-ctrl').forEach(n => n.remove());
    if (!this.editable || !this.selected || !this.nodes[this.selected]) return;
    const id = this.selected;
    const wrap = this.nodes[id];

    const del = document.createElement('button');
    del.className = 'obj-ctrl obj-del';
    del.type = 'button';
    del.textContent = '✕';
    del.title = 'もどす';
    del.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
    del.addEventListener('click', (e) => { e.stopPropagation(); this.remove(id); });
    wrap.appendChild(del);

    if (this.allowResize) {
      const rz = document.createElement('div');
      rz.className = 'obj-ctrl obj-resize';
      rz.title = '大きさをかえる';
      rz.addEventListener('pointerdown', (e) => this._startResize(e, id));
      wrap.appendChild(rz);
    }
  }

  _startDrag(e, id) {
    if (!this.editable) return;
    e.preventDefault();
    this._select(id);
    const rect = this.container.getBoundingClientRect();
    const wrap = this.nodes[id];
    wrap.setPointerCapture(e.pointerId);
    wrap.style.cursor = 'grabbing';
    const move = (ev) => {
      let x = (ev.clientX - rect.left) / rect.width;
      let y = (ev.clientY - rect.top) / rect.height;
      this.state[id].x = Math.min(0.99, Math.max(0.01, x));
      this.state[id].y = Math.min(0.99, Math.max(0.01, y));
      this._position(id);
    };
    const up = (ev) => {
      wrap.releasePointerCapture(e.pointerId);
      wrap.style.cursor = 'grab';
      wrap.removeEventListener('pointermove', move);
      wrap.removeEventListener('pointerup', up);
      this.onChange();
    };
    wrap.addEventListener('pointermove', move);
    wrap.addEventListener('pointerup', up);
  }

  _startResize(e, id) {
    e.preventDefault(); e.stopPropagation();
    const rect = this.container.getBoundingClientRect();
    const s = this.state[id];
    const cx = s.x * rect.width, cy = s.y * rect.height;
    const base = Math.hypot((e.clientX - rect.left) - cx, (e.clientY - rect.top) - cy) / s.scale;
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const d = Math.hypot((ev.clientX - rect.left) - cx, (ev.clientY - rect.top) - cy);
      let scale = d / base;
      s.scale = Math.min(2.2, Math.max(0.5, scale));
      this._position(id);
    };
    const up = () => {
      handle.releasePointerCapture(e.pointerId);
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      this.onChange();
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  }

  relayout() { for (const id in this.state) this._position(id); }
}

/* -------------------------------------------------------------- Palette */
/* container にトレイを作る。タップで scene に配置／取り出し。 */
function buildPalette(container, scene) {
  container.innerHTML = '';
  const items = {};
  OBJECTS.forEach(o => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tray-item';
    btn.innerHTML = `<img src="${o.img}" alt="${o.en}"><span class="tray-en">${o.en}</span><span class="tray-ja">${o.ja}</span>`;
    btn.addEventListener('click', () => {
      if (scene.state[o.id]) { scene.remove(o.id); }
      else { scene.place(o.id); }
      refresh();
    });
    container.appendChild(btn);
    items[o.id] = btn;
  });
  function refresh() {
    OBJECTS.forEach(o => items[o.id].classList.toggle('used', !!scene.state[o.id]));
  }
  refresh();
  return { refresh };
}

/* -------------------------------------------------------------- Scoring */
function _closeness(a, b) {
  const TH = 0.35;              // この距離以上はなれると 0 点
  if (!a && !b) return 1;       // 両方とも置いていない＝正解
  if (!a || !b) return 0;       // 片方だけ置いている＝はずれ
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  return Math.max(0, 1 - d / TH);
}
/* target/guess は state（{id:{x,y,scale}}）。0〜100 の近さを返す */
function scoreGuess(target, guess) {
  target = target || {}; guess = guess || {};
  let sum = 0;
  OBJECTS.forEach(o => { sum += _closeness(target[o.id], guess[o.id]); });
  return Math.round((sum / OBJECTS.length) * 100);
}

/* ------------------------------------------------------- 画像として保存 */
async function exportSceneImage(sceneEl, filename) {
  if (typeof html2canvas === 'undefined') { alert('画像ライブラリの読み込みに失敗しました'); return; }
  const canvas = await html2canvas(sceneEl, { backgroundColor: null, scale: 2, useCORS: true });
  const link = document.createElement('a');
  link.download = filename || 'my-room.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

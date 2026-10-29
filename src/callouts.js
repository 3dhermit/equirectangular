/**
 * Callout system: projects 3D anchor points onto the equirectangular view
 * and positions HTML labels that track as the camera moves.
 *
 * Pattern: each callout has a world-space anchor (Vector3) and a DOM element.
 * Every frame, project the anchor through the camera, convert to screen UV,
 * and set the label's left/top in percent. Hide when behind the camera.
 */

import * as THREE from 'three';

export class CalloutManager {
  constructor(camera, container) {
    this.camera = camera;
    this.container = container; // DOM element holding the 360 view
    this.callouts = [];
    this.raycaster = new THREE.Raycaster();
    this._tmp = new THREE.Vector3();
  }

  /**
   * @param {string} id
   * @param {THREE.Vector3} anchor - world-space position
   * @param {string} label - visible text
   * @param {object} [opts]
   * @param {string} [opts.video] - optional URL; clicking plays inline
   * @param {() => void} [opts.onClick]
   */
  add(id, anchor, label, opts = {}) {
    const el = document.createElement('div);
    el.className = 'callout';
    el.dataset.id = id;
    el.innerHTML = `<span class="callout-pin"></span><span class="callout-text">${label}</span>`;
    this.container.appendChild(el);

    const entry = { id, anchor: anchor clone(), el, opts };
    el.addEventListener('click', () => {
      if (opts.video) this._playVideo(opts.video, el);
      if (opts.onClick) opts.onClick(entry);
    });

    this.callouts.push(entry);
    return entry;
  }

  remove(id) {
    const i = this.callouts.findIndex(c => c.id === id);
    if (i >= 0) {
      this.callouts[i].el.remove();
      this.callouts.splice(i, 1);
    }
  }

  update() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    for (const c of this.callouts) {
      this._tmp.copy(c.anchor).project(this.camera);
      // behind camera
      if (this._tmp.z > 1) {
        c.el.style.display = 'none';
        continue;
      }
      const x = (this._tmp.x * 0.5 + 0.5) * 100;
      const y = (-this._tmp.y * 0.5 + 0.5) * 100;
      // clamp to visible frame
      if (x < 0 || x > 100 || y < 0 || y > 100) {
        c.el.style.display = 'none';
        continue;
      }
      c.el.style.display = 'block';
      c.el.style.left = x + '%';
      c.el.style.top = y + '%';
    }
  }

  _playVideo(url, anchorEl) {
    // Simple inline player: a floating <video> near the callout.
    let player = this.container.querySelector('.callout-player');
    if (!player) {
      player = document.createElement('video);
      player.className = 'callout-player';
      player.controls = true;
      player.playsInline = true;
      this.container.appendChild(player);
    }
    player.src = url;
    player.style.left = anchorEl.style.left;
    player.style.top = anchorEl.style.top;
    player.play().catch(() => {});
  }
}

/*
 * Example usage inside your render loop:
 *
 *   const callouts = new CalloutManager(camera, container);
 *   callouts.add('pump', new THREE.Vector3(2, 1, -3), 'Main Pump Assembly', {
 *     video: 'assets/pump-exploded.mp4'
 *   });
 *   callouts.add('valve', new THREE.Vector3(-1.5, 0.5, 2), 'Shutoff Valve', {
 *     onClick: (c) => highlightMesh('valve_mesh')
 *   });
 *
 *   // in requestAnimationFrame:
 *   callouts.update();
 */

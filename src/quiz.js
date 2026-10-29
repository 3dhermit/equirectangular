/**
 * Quiz layer: DOM-based questions sitting in the overlay pass.
 * Answering a question can trigger splat-world reactions —
 * highlight a mesh, play a clip, or show an exploded view —
 * without touching the CubeCamera render path.
 *
 * Pattern: quiz items are plain data. The UI renders them as
 * overlay panels. Reactions are callbacks you register per item.
 */

export class QuizManager {
  constructor(container, reactions = {}) {
    this.container = container;
    this.reactions = reactions; // { itemId: () => void }
    this.items = [];
    this.current = null;
    this.score = 0;
    this._panel = null;
  }

  add(item) {
    // item: { id, question, choices: [{ text, correct }], reaction }
    this.items.push(item);
    if (item.reaction) this.reactions[item.id] = item.reaction;
  }

  start() {
    if (this.items.length === 0) return;
    this.current = 0;
    this.score = 0;
    this._show(this.items[0]);
  }

  _show(item) {
    this._clearPanel();
    this._panel = document.createElement('div);
    this._panel.className = 'quiz-panel';
    this._panel.innerHTML = `
      <div class="quiz-q">${item.question}</div>
      <div class="quiz-choices">
        ${item.choices.map((c, i) =>
          `<button data-i="${i}">${c.text}</button>`).join('')}
      </div>
      <div class="quiz-progress">${this.current + 1} / ${this.items.length}</div>
    `;
    this._panel.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => this._answer(item, +btn.dataset.i));
    });
    this.container.appendChild(this._panel);
  }

  _answer(item, choiceIndex) {
    const correct = item.choices[choiceIndex].correct;
    if (correct) {
      this.score++;
      this._flash(this._panel, 'correct);
      if (this.reactions[item.id]) this.reactions[item.id](true);
    } else {
      this._flash(this._panel, 'incorrect);
      if (this.reactions[item.id]) this.reactions[item.id](false);
    }
    setTimeout(() => {
      this.current++;
      if (this.current < this.items.length) {
        this._show(this.items[this.current]);
      } else {
        this._showResults();
      }
    }, 1200);
  }

  _showResults() {
    this._clearPanel();
    this._panel = document.createElement('div);
    this._panel.className = 'quiz-panel quiz-results';
    this._panel.innerHTML = `
      <div class="quiz-q">Score: ${this.score} / ${this.items.length}</div>
      <button class="quiz-restart">Try Again</button>
    `;
    this._panel.querySelector('.quiz-restart').addEventListener('click', () => this.start());
    this.container.appendChild(this._panel);
  }

  _flash(el, kind) {
    el.classList.add('quiz-' + kind);
    setTimeout(() => el.classList.remove('quiz-' + kind), 1000);
  }

  _clearPanel() {
    if (this._panel) {
      this._panel.remove();
      this._panel = null;
    }
  }
}

/*
 * Example: wire a reaction that highlights a mesh in the splat scene.
 *
 *   const quiz = new QuizManager(container, {
 *     pump_q1: (correct) => {
 *       const mesh = scene.getObjectByName('pump_housing);
 *       if (mesh) mesh.material.emissive.setHex(correct ? 0x00ff88 : 0xff4444);
 *       setTimeout(() => mesh.material.emissive.setHex(0x000000), 2000);
 *     }
 *   });
 *   quiz.add({
 *     id: 'pump_q1',
 *     question: 'Which component moves fluid through the system?',
 *     choices: [
 *       { text: 'The impeller', correct: true },
 *       { text: 'The housing', correct: false },
 *       { text: 'The seal', correct: false }
 *     ]
 *   });
 *   quiz.start();
 */

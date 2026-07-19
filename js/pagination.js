// Displays HTML content inside a viewport clipped to exactly 2 line-heights,
// continuously scrolling the full rendered text upward (teleprompter-style)
// using real layout (Range.getClientRects) so bold/italic/underline/color
// formatting survives untouched — the full HTML is rendered once and
// "scrolling" is just sliding it vertically at a steady speed. Any single
// line too wide for the viewport (e.g. an unbroken long word/URL) pauses
// the vertical scroll and horizontally marquees just that line before
// vertical scrolling resumes.

export class Paginator {
  constructor(containerEl, innerEl, opts = {}) {
    this.containerEl = containerEl;
    this.innerEl = innerEl;
    this.scrollSpeedPxPerSec = opts.scrollSpeedPxPerSec ?? 40;
    this.marqueeSpeedPxPerSec = opts.marqueeSpeedPxPerSec ?? 90;
    this.startPauseMs = opts.startPauseMs ?? 800;
    this.loopPauseMs = opts.loopPauseMs ?? 900;

    this.lines = [];
    this.maxScroll = 0;
    this._raf = null;
    this._playing = false;

    this._onResize = this._debounce(() => this._recompute(), 150);
    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', this._onResize);
  }

  _debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  setHtml(html) {
    this.stop();
    this.innerEl.innerHTML = html || '';
    this._recompute();
  }

  _recompute() {
    this.innerEl.style.transition = 'none';
    this.innerEl.style.transform = 'translate(0px, 0px)';

    const inner = this.innerEl;
    this.lines = [];
    this.maxScroll = 0;
    if (!inner.textContent || !inner.textContent.trim()) return;

    const containerWidth = this.containerEl.clientWidth;
    const containerHeight = this.containerEl.clientHeight;
    const range = document.createRange();
    range.selectNodeContents(inner);
    const rects = Array.from(range.getClientRects()).filter((r) => r.height > 0);
    if (rects.length === 0) return;

    const innerTop = inner.getBoundingClientRect().top;
    this.lines = rects.map((r) => ({
      top: r.top - innerTop,
      height: r.height,
      width: r.width,
      overflows: r.width > containerWidth + 1,
    }));

    const last = this.lines[this.lines.length - 1];
    const contentHeight = last.top + last.height;
    this.maxScroll = Math.max(0, contentHeight - containerHeight);
  }

  start({ loop = true } = {}) {
    this.stop();
    if (!this.lines.length) return;
    this._playing = true;

    if (this.maxScroll <= 0) {
      this.innerEl.style.transition = 'none';
      this.innerEl.style.transform = 'translate(0px, 0px)';
      return;
    }

    const containerWidth = this.containerEl.clientWidth;
    let yPos = 0;
    let xPos = 0;
    let lastTs = null;
    let phase = 'wait-start';
    let phaseStart = 0;
    let marqueeLine = null;
    let marqueeFrom = 0;
    let marqueeTo = 0;
    const marqueed = new Set();

    const setTransform = () => {
      this.innerEl.style.transition = 'none';
      this.innerEl.style.transform = `translate(${-xPos}px, ${-yPos}px)`;
    };

    const findCrossedOverflowLine = (prevY, nextY) =>
      this.lines.find((l) => l.overflows && !marqueed.has(l) && l.top > prevY - 1 && l.top <= nextY);

    const frame = (ts) => {
      if (!this._playing) return;
      if (lastTs === null) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      if (phase === 'wait-start') {
        if (!phaseStart) phaseStart = ts;
        if (ts - phaseStart >= this.startPauseMs) phase = 'scroll';
      } else if (phase === 'scroll') {
        const prevY = yPos;
        const nextY = Math.min(this.maxScroll, yPos + this.scrollSpeedPxPerSec * dt);
        const crossed = findCrossedOverflowLine(prevY, nextY);
        if (crossed) {
          yPos = crossed.top;
          marqueeLine = crossed;
          marqueeFrom = 0;
          marqueeTo = Math.max(0, crossed.width - containerWidth);
          xPos = 0;
          phase = 'marquee';
        } else {
          yPos = nextY;
          if (yPos >= this.maxScroll) {
            phase = 'wait-end';
            phaseStart = 0;
          }
        }
        setTransform();
      } else if (phase === 'marquee') {
        xPos = Math.min(marqueeTo, xPos + this.marqueeSpeedPxPerSec * dt);
        setTransform();
        if (xPos >= marqueeTo) {
          marqueed.add(marqueeLine);
          xPos = 0;
          setTransform();
          phase = 'scroll';
        }
      } else if (phase === 'wait-end') {
        if (!phaseStart) phaseStart = ts;
        if (ts - phaseStart >= this.loopPauseMs) {
          if (!loop) {
            this._playing = false;
            return;
          }
          yPos = 0;
          xPos = 0;
          marqueed.clear();
          setTransform();
          phase = 'wait-start';
          phaseStart = 0;
        }
      }

      this._raf = requestAnimationFrame(frame);
    };

    this._raf = requestAnimationFrame(frame);
  }

  stop() {
    this._playing = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onResize);
  }
}

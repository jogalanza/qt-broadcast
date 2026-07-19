// Displays HTML content two rendered lines at a time inside a viewport
// clipped to exactly 2 line-heights, using real layout (Range.getClientRects)
// rather than estimated text measurement, so bold/italic/underline/color
// formatting survives paging untouched (the full HTML is rendered once and
// "paging" is just sliding it vertically, like a film reel).

export class Paginator {
  constructor(containerEl, innerEl, opts = {}) {
    this.containerEl = containerEl;
    this.innerEl = innerEl;
    this.dwellPerWordMs = opts.dwellPerWordMs ?? 350;
    this.minDwellMs = opts.minDwellMs ?? 2500;
    this.marqueeSpeedPxPerSec = opts.marqueeSpeedPxPerSec ?? 90;
    this.pages = [];
    this._playing = false;
    this._timer = null;
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
    this.pages = this._computePages();
  }

  _computePages() {
    const inner = this.innerEl;
    if (!inner.textContent || !inner.textContent.trim()) return [];

    const containerWidth = this.containerEl.clientWidth;
    const range = document.createRange();
    range.selectNodeContents(inner);
    const rects = Array.from(range.getClientRects()).filter((r) => r.height > 0);
    if (rects.length === 0) return [];

    const innerTop = inner.getBoundingClientRect().top;
    const lines = rects.map((r) => ({
      top: r.top - innerTop,
      width: r.width,
      overflows: r.width > containerWidth + 1,
    }));

    const totalWords = inner.textContent.trim().split(/\s+/).length;
    const lineCount = lines.length;
    const pages = [];
    for (let i = 0; i < lineCount; i += 2) {
      const pair = lines.slice(i, i + 2);
      const wordsInPage = Math.max(1, Math.round((pair.length / lineCount) * totalWords));
      pages.push({
        topOffset: pair[0].top,
        needsMarquee: pair.some((l) => l.overflows),
        marqueeWidth: Math.max(...pair.map((l) => l.width)),
        approxWordCount: wordsInPage,
      });
    }
    return pages;
  }

  start({ loop = true } = {}) {
    this.stop();
    if (!this.pages.length) return;
    this._playing = true;
    let index = 0;

    const advance = () => {
      if (!this._playing) return;
      if (index >= this.pages.length) {
        if (!loop) return; // stay on the last page shown
        index = 0;
      }
      const page = this.pages[index];
      this._showPage(page);

      if (page.needsMarquee) {
        this._timer = setTimeout(() => {
          if (!this._playing) return;
          this._marquee(page, () => {
            this._timer = setTimeout(() => {
              index++;
              advance();
            }, 400);
          });
        }, 350);
      } else {
        const dwell = Math.max(this.minDwellMs, page.approxWordCount * this.dwellPerWordMs);
        this._timer = setTimeout(() => {
          index++;
          advance();
        }, dwell);
      }
    };
    advance();
  }

  _showPage(page) {
    this.innerEl.style.transition = 'transform 300ms ease';
    this.innerEl.style.transform = `translate(0px, -${page.topOffset}px)`;
  }

  _marquee(page, done) {
    const distance = page.marqueeWidth - this.containerEl.clientWidth;
    if (distance <= 0) {
      done();
      return;
    }
    const durationMs = Math.max(600, (distance / this.marqueeSpeedPxPerSec) * 1000);
    this.innerEl.style.transition = `transform ${durationMs}ms linear`;
    this.innerEl.style.transform = `translate(-${distance}px, -${page.topOffset}px)`;
    this._timer = setTimeout(() => {
      if (!this._playing) return;
      done();
    }, durationMs);
  }

  stop() {
    this._playing = false;
    if (this._timer) clearTimeout(this._timer);
    this._timer = null;
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onResize);
  }
}

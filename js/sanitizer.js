const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'BR', 'SPAN', 'DIV']);
const COLOR_STYLE_RE = /^color:\s*(#[0-9a-fA-F]{3,6}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))\s*;?$/;

function cleanNode(node, out) {
  if (node.nodeType === Node.TEXT_NODE) {
    out.appendChild(document.createTextNode(node.nodeValue));
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const tag = node.tagName;
  if (!ALLOWED_TAGS.has(tag)) {
    // Unwrap: keep children, drop the disallowed wrapper.
    for (const child of Array.from(node.childNodes)) cleanNode(child, out);
    return;
  }

  const clean = document.createElement(tag);
  if (tag === 'SPAN' || tag === 'DIV') {
    const style = node.getAttribute('style') || '';
    const decl = style.split(';').map((s) => s.trim()).find((s) => COLOR_STYLE_RE.test(s + ';'));
    if (decl) clean.setAttribute('style', decl.endsWith(';') ? decl : decl + ';');
  }
  for (const child of Array.from(node.childNodes)) cleanNode(child, clean);
  out.appendChild(clean);
}

export function sanitizeHtml(dirtyHtml) {
  const doc = new DOMParser().parseFromString(dirtyHtml || '', 'text/html');
  const out = document.createElement('div');
  for (const child of Array.from(doc.body.childNodes)) cleanNode(child, out);
  return out.innerHTML;
}

export function htmlToPlainText(html) {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  // Preserve block/line breaks as spaces so words don't run together.
  doc.querySelectorAll('br, div, p').forEach((el) => el.insertAdjacentText('beforebegin', ' '));
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

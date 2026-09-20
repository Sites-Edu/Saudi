const designs = [
  { id: 1, file: 'assets/cards/card1.jpeg' },
  { id: 2, file: 'assets/cards/card2.png' },
  { id: 3, file: 'assets/cards/card3.png' },
  { id: 4, file: 'assets/cards/card4.png' },
  { id: 5, file: 'assets/cards/card5.jpeg' },
  { id: 6, file: 'assets/cards/card6.png' },
  { id: 7, file: 'assets/cards/card7.jpeg' },
  { id: 8, file: 'assets/cards/card8.png' },
  { id: 9, file: 'assets/cards/card9.png' },
  { id: 10, file: 'assets/cards/card10.jpeg' },
  { id: 11, file: 'assets/cards/card11.png' },
  { id: 12, file: 'assets/cards/card12.png' },
  { id: 13, file: 'assets/cards/card13.jpeg' }
];

const nameInput = document.getElementById('nameInput');
const messageInput = document.getElementById('messageInput');
const charCount = document.getElementById('charCount');
const designGrid = document.getElementById('designGrid');
const createBtn = document.getElementById('createBtn');
const previewSection = document.getElementById('previewSection');
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const newCardBtn = document.getElementById('newCardBtn');
const creationCount = document.getElementById('creationCount');

let currentImage = null;
let currentDesign = 0;

const arabicDigits = value => String(value).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

function renderDesigns() {
  designGrid.innerHTML = designs.map((d, index) => `
    <div class="design-option">
      <input type="radio" name="design" id="design-${d.id}" value="${index}" ${index === 0 ? 'checked' : ''}>
      <label class="design-label" for="design-${d.id}">
        <img src="${d.file}" alt="التصميم ${arabicDigits(index + 1)}" loading="lazy">
        <div class="design-name">التصميم ${arabicDigits(index + 1)}</div>
      </label>
    </div>
  `).join('');
  designGrid.addEventListener('change', e => {
    if (e.target.name === 'design') currentDesign = Number(e.target.value);
  });
}

function updateCounter() {
  const count = Number(localStorage.getItem('nationalDayCardsCreated') || 0);
  creationCount.textContent = arabicDigits(count);
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function getSelectedDesign() {
  const selected = document.querySelector('input[name="design"]:checked');
  return selected ? Number(selected.value) : 0;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(text, maxWidth, font) {
  ctx.font = font;
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = line + ' ' + words[i];
    if (ctx.measureText(test).width <= maxWidth) line = test;
    else { lines.push(line); line = words[i]; }
  }
  lines.push(line);
  return lines;
}

function fitMessage(text, maxWidth, maxLines, startingSize) {
  let size = startingSize;
  let lines = [];
  while (size >= 42) {
    const font = `700 ${size}px Saudi, Tahoma, Arial`;
    lines = wrapText(text, maxWidth, font);
    if (lines.length <= maxLines) return { size, lines, font };
    size -= 4;
  }
  const font = `700 42px Saudi, Tahoma, Arial`;
  return { size: 42, lines: wrapText(text, maxWidth, font).slice(0, maxLines), font };
}

function drawCenteredText(text, x, y, maxWidth, startSize, color, maxLines = 3, shadow = true) {
  const fit = fitMessage(text, maxWidth, maxLines, startSize);
  ctx.font = fit.font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
  }
  const lineHeight = fit.size * 1.32;
  const firstY = y - ((fit.lines.length - 1) * lineHeight) / 2;
  fit.lines.forEach((line, i) => ctx.fillText(line, x, firstY + i * lineHeight));
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  return { size: fit.size, lines: fit.lines, lineHeight };
}

function drawName(name, x, y, maxWidth, startSize) {
  let size = startSize;
  while (size > 28) {
    ctx.font = `700 ${size}px Saudi, Tahoma, Arial`;
    if (ctx.measureText(name).width <= maxWidth) break;
    size -= 2;
  }
  ctx.font = `700 ${size}px Saudi, Tahoma, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,.45)';
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 2;
  ctx.fillText(name, x, y);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
}

async function createCard() {
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  currentDesign = getSelectedDesign();
  if (!name) { showToast('فضلاً اكتب الاسم أولاً'); nameInput.focus(); return; }
  if (!message) { showToast('فضلاً اكتب كلماتك للوطن'); messageInput.focus(); return; }

  createBtn.disabled = true;
  createBtn.style.opacity = '.7';
  try {
    await document.fonts.ready;
    currentImage = await loadImage(designs[currentDesign].file);
    canvas.width = currentImage.naturalWidth || currentImage.width;
    canvas.height = currentImage.naturalHeight || currentImage.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

    // The original card image remains untouched; only the user's message and name are drawn over it.
    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const messageY = h * 0.64;
    const maxTextWidth = w * 0.76;
    const startSize = Math.max(72, Math.round(w * 0.095));
    const result = drawCenteredText(message, centerX, messageY, maxTextWidth, startSize, '#ffffff', 3, true);
    const nameY = messageY + (result.lines.length * result.lineHeight * 0.66) + h * 0.055;
    drawName(name, centerX, nameY, w * 0.50, Math.max(44, Math.round(w * 0.055)));

    previewSection.hidden = false;
    previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const count = Number(localStorage.getItem('nationalDayCardsCreated') || 0) + 1;
    localStorage.setItem('nationalDayCardsCreated', String(count));
    updateCounter();
  } catch (error) {
    console.error(error);
    showToast('حدث خطأ أثناء إنشاء البطاقة');
  } finally {
    createBtn.disabled = false;
    createBtn.style.opacity = '1';
  }
}

async function downloadCard() {
  if (!canvas.width) return;
  const safeName = (nameInput.value.trim() || 'بطاقة').replace(/[\\/:*?"<>|]/g, '-');
  const link = document.createElement('a');
  link.download = `بطاقة-اليوم-الوطني-${safeName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function shareCard() {
  if (!canvas.width) return;
  try {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1));
    const file = new File([blob], 'بطاقة-اليوم-الوطني.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      await navigator.share({ title: 'بطاقة اليوم الوطني السعودي', text: 'بطاقتي بمناسبة اليوم الوطني السعودي 🇸🇦', files: [file] });
    } else if (navigator.share) {
      await navigator.share({ title: 'بطاقة اليوم الوطني السعودي', text: 'بطاقتي بمناسبة اليوم الوطني السعودي 🇸🇦' });
    } else {
      await downloadCard();
      showToast('تم تجهيز البطاقة للمشاركة');
    }
  } catch (e) {
    if (e.name !== 'AbortError') showToast('يمكنك تحميل البطاقة ومشاركتها من جهازك');
  }
}

function newCard() {
  nameInput.value = '';
  messageInput.value = '';
  charCount.textContent = '٠';
  currentDesign = 0;
  const first = document.querySelector('input[name="design"]');
  if (first) first.checked = true;
  previewSection.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  nameInput.focus();
}

messageInput.addEventListener('input', () => {
  charCount.textContent = arabicDigits(messageInput.value.length);
});
createBtn.addEventListener('click', createCard);
downloadBtn.addEventListener('click', downloadCard);
shareBtn.addEventListener('click', shareCard);
newCardBtn.addEventListener('click', newCard);

renderDesigns();
updateCounter();

const designs = [
  { id: 1, file: 'assets/cards/card1.jpeg' }, { id: 2, file: 'assets/cards/card2.png' },
  { id: 3, file: 'assets/cards/card3.png' }, { id: 4, file: 'assets/cards/card4.png' },
  { id: 5, file: 'assets/cards/card5.jpeg' }, { id: 6, file: 'assets/cards/card6.png' },
  { id: 7, file: 'assets/cards/card7.jpeg' }, { id: 8, file: 'assets/cards/card8.png' },
  { id: 9, file: 'assets/cards/card9.png' }, { id: 10, file: 'assets/cards/card10.jpeg' },
  { id: 11, file: 'assets/cards/card11.png' }, { id: 12, file: 'assets/cards/card12.png' },
  { id: 13, file: 'assets/cards/card13.jpeg' }
];

const $ = id => document.getElementById(id);
const nameInput=$('nameInput'), messageInput=$('messageInput'), charCount=$('charCount');
const designGrid=$('designGrid'), createBtn=$('createBtn'), previewSection=$('previewSection');
const canvas=$('previewCanvas'), ctx=canvas.getContext('2d'), downloadBtn=$('downloadBtn'), shareBtn=$('shareBtn'), creationCount=$('creationCount');
const arabicDigits = value => String(value).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);

let currentImage=null, currentDesign=0;
const MESSAGE_SIZE=39;
const NAME_SIZE=37;
const BASE_CARD_WIDTH=864;

async function createCard(){
  const name=nameInput.value.trim();
  const message=messageInput.value.trim();
  if(!name){showToast('اكتبي الاسم أولاً');nameInput.focus();return}
  if(!message){showToast('اكتبي الكلمات أولاً');messageInput.focus();return}
  currentDesign=getSelectedDesign();
  const design=designs[currentDesign];
  try{
    createBtn.disabled=true;
    currentImage=await loadImage(design.file);
    canvas.width=currentImage.naturalWidth||currentImage.width;
    canvas.height=currentImage.naturalHeight||currentImage.height;
    drawCard();
    previewSection.hidden=false;
    localStorage.setItem('nationalDayCardsCreated',String(Number(localStorage.getItem('nationalDayCardsCreated')||0)+1));
    updateCounter();
    previewSection.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){
    console.error(err);
    showToast('تعذر تحميل البطاقة، حاولي مرة أخرى');
  }finally{createBtn.disabled=false}
}

function renderDesigns(){
  designGrid.innerHTML=designs.map((d,i)=>`<div class="design-option"><input type="radio" name="design" id="design-${d.id}" value="${i}" ${i===0?'checked':''}><label class="design-label" for="design-${d.id}"><img src="${d.file}" alt="التصميم ${arabicDigits(i+1)}" loading="lazy"><div class="design-name">التصميم ${arabicDigits(i+1)}</div></label></div>`).join('');
  designGrid.addEventListener('change',e=>{if(e.target.name==='design'){currentDesign=Number(e.target.value);}});
}
function updateCounter(){creationCount.textContent=arabicDigits(Number(localStorage.getItem('nationalDayCardsCreated')||0));}
function showToast(message){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=message;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),2400)}
function loadImage(src){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=rej;img.src=src})}
function getSelectedDesign(){const s=document.querySelector('input[name="design"]:checked');return s?Number(s.value):0}
function wrapText(text,maxWidth,font){ctx.font=font;const words=text.trim().split(/\s+/).filter(Boolean);if(!words.length)return[];const lines=[];let line=words[0];for(let i=1;i<words.length;i++){const test=line+' '+words[i];if(ctx.measureText(test).width<=maxWidth)line=test;else{lines.push(line);line=words[i]}}lines.push(line);return lines}
function fitMessage(text,maxWidth,maxLines,startingSize){
  const scale=canvas.width/BASE_CARD_WIDTH;
  const size=Math.round(startingSize*scale);
  const font=`700 ${size}px Saudi, Tahoma, Arial`;
  const lines=wrapText(text,maxWidth,font);
  return{size,lines,font};
}
function drawCenteredText(text,x,y,maxWidth,startSize,color,maxLines=999){
  const fit=fitMessage(text,maxWidth,maxLines,startSize);
  ctx.font=fit.font;
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillStyle=color;
  ctx.shadowColor='rgba(0,0,0,.35)';
  ctx.shadowBlur=8;
  ctx.shadowOffsetY=3;
  const lineHeight=fit.size*1.32;
  const firstY=y-((fit.lines.length-1)*lineHeight)/2;
  fit.lines.forEach((line,i)=>ctx.fillText(line,x,firstY+i*lineHeight));
  ctx.shadowColor='transparent';
  ctx.shadowBlur=0;
  ctx.shadowOffsetY=0;
  return{size:fit.size,lines:fit.lines,lineHeight};
}
function drawName(name,x,y,startSize){
  const scale=canvas.width/BASE_CARD_WIDTH;
  const size=Math.round(startSize*scale);
  ctx.font=`700 ${size}px Saudi, Tahoma, Arial`;
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillStyle='#fff';
  ctx.shadowColor='rgba(0,0,0,.45)';
  ctx.shadowBlur=7;
  ctx.shadowOffsetY=2;
  ctx.fillText(name,x,y);
  ctx.shadowColor='transparent';
  ctx.shadowBlur=0;
  ctx.shadowOffsetY=0;
  return size;
}

function drawCard(){
  if(!currentImage)return;
  const w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(currentImage,0,0,w,h);
  const message=messageInput.value.trim();
  const name=nameInput.value.trim();
  const messageY=h*0.49;
  const nameY=h*0.62;
  if(message) drawCenteredText(message,w/2,messageY,w*.78,MESSAGE_SIZE,'#fff',999);
  if(name) drawName(name,w/2,nameY,NAME_SIZE);
}
function resetSettings(){ drawCard(); }
async function downloadCard(){if(!canvas.width)return;const safe=(nameInput.value.trim()||'بطاقة').replace(/[\\/:*?"<>|]/g,'-');const link=document.createElement('a');link.download=`بطاقة-اليوم-الوطني-${safe}.png`;link.href=canvas.toDataURL('image/png');link.click()}
function newCard(){
  nameInput.value='';
  messageInput.value='';
  charCount.textContent='٠';
  const first=document.querySelector('input[name="design"][value="0"]');
  if(first){ first.checked=true; currentDesign=0; }
  currentImage=null;
  canvas.width=0;
  canvas.height=0;
  previewSection.hidden=true;
  window.scrollTo({top:0,behavior:'smooth'});
  nameInput.focus();
}

async function shareCard(){if(!canvas.width)return;try{const blob=await new Promise(r=>canvas.toBlob(r,'image/png',1));const file=new File([blob],'بطاقة-اليوم-الوطني.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share)await navigator.share({title:'بطاقة اليوم الوطني السعودي',text:'بطاقتي بمناسبة اليوم الوطني السعودي 🇸🇦',files:[file]});else if(navigator.share)await navigator.share({title:'بطاقة اليوم الوطني السعودي',text:'بطاقتي بمناسبة اليوم الوطني السعودي 🇸🇦'});else{await downloadCard();showToast('تم تجهيز البطاقة للمشاركة')}}catch(e){if(e.name!=='AbortError')showToast('يمكنك تحميل البطاقة ومشاركتها من جهازك')}}
messageInput.addEventListener('input',()=>{charCount.textContent=arabicDigits(messageInput.value.length);if(currentImage)drawCard()});nameInput.addEventListener('input',()=>{if(currentImage)drawCard()});
createBtn.addEventListener('click',createCard);downloadBtn.addEventListener('click',downloadCard);shareBtn.addEventListener('click',shareCard);newCardBtn.addEventListener('click',newCard);
renderDesigns();updateCounter();

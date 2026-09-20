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
const canvas=$('previewCanvas'), ctx=canvas.getContext('2d'), downloadBtn=$('downloadBtn'), shareBtn=$('shareBtn'), newCardBtn=$('newCardBtn'), creationCount=$('creationCount');
const controls=$('textControls');
const arabicDigits = value => String(value).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);

let currentImage=null, currentDesign=0, activeTarget='message', dragging=false, dragTarget=null;
let settings={message:{x:50,y:64,size:100},name:{x:50,y:78,size:60}};

function renderDesigns(){
  designGrid.innerHTML=designs.map((d,i)=>`<div class="design-option"><input type="radio" name="design" id="design-${d.id}" value="${i}" ${i===0?'checked':''}><label class="design-label" for="design-${d.id}"><img src="${d.file}" alt="التصميم ${arabicDigits(i+1)}" loading="lazy"><div class="design-name">التصميم ${arabicDigits(i+1)}</div></label></div>`).join('');
  designGrid.addEventListener('change',e=>{if(e.target.name==='design'){currentDesign=Number(e.target.value); resetSettings(false);}});
}
function updateCounter(){creationCount.textContent=arabicDigits(Number(localStorage.getItem('nationalDayCardsCreated')||0));}
function showToast(message){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=message;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),2400)}
function loadImage(src){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=rej;img.src=src})}
function getSelectedDesign(){const s=document.querySelector('input[name="design"]:checked');return s?Number(s.value):0}
function wrapText(text,maxWidth,font){ctx.font=font;const words=text.trim().split(/\s+/).filter(Boolean);if(!words.length)return[];const lines=[];let line=words[0];for(let i=1;i<words.length;i++){const test=line+' '+words[i];if(ctx.measureText(test).width<=maxWidth)line=test;else{lines.push(line);line=words[i]}}lines.push(line);return lines}
function fitMessage(text,maxWidth,maxLines,startingSize){let size=startingSize,lines=[];while(size>=30){const font=`700 ${size}px Saudi, Tahoma, Arial`;lines=wrapText(text,maxWidth,font);if(lines.length<=maxLines)return{size,lines,font};size-=2}const font='700 30px Saudi, Tahoma, Arial';return{size:30,lines:wrapText(text,maxWidth,font).slice(0,maxLines),font}}
function drawCenteredText(text,x,y,maxWidth,startSize,color,maxLines=3){const fit=fitMessage(text,maxWidth,maxLines,startSize);ctx.font=fit.font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=8;ctx.shadowOffsetY=3;const lineHeight=fit.size*1.32;const firstY=y-((fit.lines.length-1)*lineHeight)/2;fit.lines.forEach((line,i)=>ctx.fillText(line,x,firstY+i*lineHeight));ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;return{size:fit.size,lines:fit.lines,lineHeight}}
function drawName(name,x,y,startSize){let size=startSize;while(size>24){ctx.font=`700 ${size}px Saudi, Tahoma, Arial`;if(ctx.measureText(name).width<=canvas.width*.55)break;size-=2}ctx.font=`700 ${size}px Saudi, Tahoma, Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=7;ctx.shadowOffsetY=2;ctx.fillText(name,x,y);ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;return size}

function drawCard(){
  if(!currentImage)return;
  const w=canvas.width,h=canvas.height,s=settings;
  ctx.clearRect(0,0,w,h);ctx.drawImage(currentImage,0,0,w,h);
  const mx=w*s.message.x/100,my=h*s.message.y/100,nx=w*s.name.x/100,ny=h*s.name.y/100;
  const msgSize=Math.max(30,Math.round(w*.095*(s.message.size/100)));
  const maxTextWidth=w*.78;
  const result=drawCenteredText(messageInput.value.trim(),mx,my,maxTextWidth,msgSize,'#fff',3);
  drawName(nameInput.value.trim(),nx,ny,Math.max(24,Math.round(w*.055*(s.name.size/60))));
}
function syncControls(){
  const map={messageSize:['message','size'],messageX:['message','x'],messageY:['message','y'],nameSize:['name','size'],nameX:['name','x'],nameY:['name','y']};
  Object.entries(map).forEach(([id,[target,key]])=>$(id).value=settings[target][key]);
  $('messageSizeValue').textContent=arabicDigits(settings.message.size);$('nameSizeValue').textContent=arabicDigits(settings.name.size);
  $('messageXValue').textContent=arabicDigits(settings.message.x)+'٪';$('messageYValue').textContent=arabicDigits(settings.message.y)+'٪';
  $('nameXValue').textContent=arabicDigits(settings.name.x)+'٪';$('nameYValue').textContent=arabicDigits(settings.name.y)+'٪';
}
function resetSettings(redraw=true){settings={message:{x:50,y:64,size:100},name:{x:50,y:78,size:60}};syncControls();if(redraw)drawCard()}
function setupControls(){
  const bindings=[['messageSize','message','size'],['messageX','message','x'],['messageY','message','y'],['nameSize','name','size'],['nameX','name','x'],['nameY','name','y']];
  bindings.forEach(([id,target,key])=>$(id).addEventListener('input',e=>{settings[target][key]=Number(e.target.value);syncControls();drawCard()}));
  document.querySelectorAll('.move-mode').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.move-mode').forEach(b=>b.classList.remove('active'));btn.classList.add('active');activeTarget=btn.dataset.target}));
  $('resetTextBtn').addEventListener('click',()=>resetSettings(true));
}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*(canvas.width/r.width),y:(e.clientY-r.top)*(canvas.height/r.height)}}
function pointerDown(e){if(!canvas.width)return;const p=canvasPoint(e),target=activeTarget;dragging=true;dragTarget=target;canvas.setPointerCapture?.(e.pointerId);settings[target].x=Math.max(5,Math.min(95,p.x/canvas.width*100));settings[target].y=Math.max(10,Math.min(95,p.y/canvas.height*100));syncControls();drawCard()}
function pointerMove(e){if(!dragging)return;const p=canvasPoint(e),t=dragTarget;settings[t].x=Math.max(5,Math.min(95,p.x/canvas.width*100));settings[t].y=Math.max(10,Math.min(95,p.y/canvas.height*100));syncControls();drawCard()}
function pointerUp(){dragging=false;dragTarget=null}
canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);

async function createCard(){
  const name=nameInput.value.trim(),message=messageInput.value.trim();currentDesign=getSelectedDesign();
  if(!name){showToast('فضلاً اكتب الاسم أولاً');nameInput.focus();return}if(!message){showToast('فضلاً اكتب كلماتك للوطن');messageInput.focus();return}
  createBtn.disabled=true;createBtn.style.opacity='.7';
  try{await document.fonts.ready;currentImage=await loadImage(designs[currentDesign].file);canvas.width=currentImage.naturalWidth||currentImage.width;canvas.height=currentImage.naturalHeight||currentImage.height;resetSettings(false);drawCard();previewSection.hidden=false;controls.hidden=false;previewSection.scrollIntoView({behavior:'smooth',block:'start'});const c=Number(localStorage.getItem('nationalDayCardsCreated')||0)+1;localStorage.setItem('nationalDayCardsCreated',String(c));updateCounter()}catch(e){console.error(e);showToast('حدث خطأ أثناء إنشاء البطاقة')}finally{createBtn.disabled=false;createBtn.style.opacity='1'}
}
async function downloadCard(){if(!canvas.width)return;const safe=(nameInput.value.trim()||'بطاقة').replace(/[\\/:*?"<>|]/g,'-');const link=document.createElement('a');link.download=`بطاقة-اليوم-الوطني-${safe}.png`;link.href=canvas.toDataURL('image/png');link.click()}
async function shareCard(){if(!canvas.width)return;try{const blob=await new Promise(r=>canvas.toBlob(r,'image/png',1));const file=new File([blob],'بطاقة-اليوم-الوطني.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share)await navigator.share({title:'بطاقة اليوم الوطني السعودي',text:'بطاقتي بمناسبة اليوم الوطني السعودي 🇸🇦',files:[file]});else if(navigator.share)await navigator.share({title:'بطاقة اليوم الوطني السعودي',text:'بطاقتي بمناسبة اليوم الوطني السعودي 🇸🇦'});else{await downloadCard();showToast('تم تجهيز البطاقة للمشاركة')}}catch(e){if(e.name!=='AbortError')showToast('يمكنك تحميل البطاقة ومشاركتها من جهازك')}}
function newCard(){nameInput.value='';messageInput.value='';charCount.textContent='٠';currentDesign=0;const first=document.querySelector('input[name="design"]');if(first)first.checked=true;previewSection.hidden=true;controls.hidden=true;resetSettings(false);window.scrollTo({top:0,behavior:'smooth'});nameInput.focus()}
messageInput.addEventListener('input',()=>{charCount.textContent=arabicDigits(messageInput.value.length);if(currentImage)drawCard()});nameInput.addEventListener('input',()=>{if(currentImage)drawCard()});
createBtn.addEventListener('click',createCard);downloadBtn.addEventListener('click',downloadCard);shareBtn.addEventListener('click',shareCard);newCardBtn.addEventListener('click',newCard);
renderDesigns();updateCounter();setupControls();syncControls();

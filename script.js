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

let currentImage=null, currentDesign=0, activeTarget='message', dragging=false, dragTarget=null, dragStart=null;
let settings={message:{x:50,y:64,size:100},name:{x:50,y:78,size:60}};

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
    resetSettings(false);
    drawCard();
    previewSection.hidden=false;
    controls.hidden=false;
    activeTarget='message';
    $('moveMessageBtn').classList.add('active');
    $('moveNameBtn').classList.remove('active');
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
  designGrid.addEventListener('change',e=>{if(e.target.name==='design'){currentDesign=Number(e.target.value); resetSettings(false);}});
}
function updateCounter(){creationCount.textContent=arabicDigits(Number(localStorage.getItem('nationalDayCardsCreated')||0));}
function showToast(message){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=message;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),2400)}
function loadImage(src){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=rej;img.src=src})}
function getSelectedDesign(){const s=document.querySelector('input[name="design"]:checked');return s?Number(s.value):0}
function wrapText(text,maxWidth,font){ctx.font=font;const words=text.trim().split(/\s+/).filter(Boolean);if(!words.length)return[];const lines=[];let line=words[0];for(let i=1;i<words.length;i++){const test=line+' '+words[i];if(ctx.measureText(test).width<=maxWidth)line=test;else{lines.push(line);line=words[i]}}lines.push(line);return lines}
function fitMessage(text,maxWidth,maxLines,startingSize){let size=startingSize,lines=[];while(size>=24){const font=`700 ${size}px Saudi, Tahoma, Arial`;lines=wrapText(text,maxWidth,font);if(lines.length<=maxLines)return{size,lines,font};size-=2}const font='700 24px Saudi, Tahoma, Arial';return{size:24,lines:wrapText(text,maxWidth,font),font}}
function drawCenteredText(text,x,y,maxWidth,startSize,color,maxLines=3){const fit=fitMessage(text,maxWidth,maxLines,startSize);ctx.font=fit.font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=8;ctx.shadowOffsetY=3;const lineHeight=fit.size*1.32;const firstY=y-((fit.lines.length-1)*lineHeight)/2;fit.lines.forEach((line,i)=>ctx.fillText(line,x,firstY+i*lineHeight));ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;return{size:fit.size,lines:fit.lines,lineHeight}}
function drawName(name,x,y,startSize){let size=startSize;while(size>24){ctx.font=`700 ${size}px Saudi, Tahoma, Arial`;if(ctx.measureText(name).width<=canvas.width*.55)break;size-=2}ctx.font=`700 ${size}px Saudi, Tahoma, Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=7;ctx.shadowOffsetY=2;ctx.fillText(name,x,y);ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;return size}

function drawCard(){
  if(!currentImage)return;
  const w=canvas.width,h=canvas.height,s=settings;
  ctx.clearRect(0,0,w,h);ctx.drawImage(currentImage,0,0,w,h);
  const mx=w*s.message.x/100,my=h*s.message.y/100,nx=w*s.name.x/100,ny=h*s.name.y/100;
  const msgSize=Math.max(30,Math.round(w*.095*(s.message.size/100)));
  const maxTextWidth=w*.78;
  const result=drawCenteredText(messageInput.value.trim(),mx,my,maxTextWidth,msgSize,'#fff',999);
  drawName(nameInput.value.trim(),nx,ny,Math.max(24,Math.round(w*.055*(s.name.size/60))));
}
function syncControls(){
  const map={messageSize:['message','size'],nameSize:['name','size']};
  Object.entries(map).forEach(([id,[target,key]])=>$(id).value=settings[target][key]);
  $('messageSizeValue').textContent=arabicDigits(settings.message.size);
  $('nameSizeValue').textContent=arabicDigits(settings.name.size);
}
function resetSettings(redraw=true){settings={message:{x:50,y:64,size:100},name:{x:50,y:78,size:60}};syncControls();if(redraw)drawCard()}
function setupControls(){
  $('moveMessageBtn').addEventListener('click',()=>{activeTarget='message';$('moveMessageBtn').classList.add('active');$('moveNameBtn').classList.remove('active');showToast('يمكنك الآن تحريك الكلمات بإصبعك')});
  $('moveNameBtn').addEventListener('click',()=>{activeTarget='name';$('moveNameBtn').classList.add('active');$('moveMessageBtn').classList.remove('active');showToast('يمكنك الآن تحريك الاسم بإصبعك')});
  const bindings=[['messageSize','message','size'],['nameSize','name','size']];
  bindings.forEach(([id,target,key])=>$(id).addEventListener('input',e=>{
    settings[target][key]=Number(e.target.value);
    syncControls();
    drawCard();
  }));
  canvas.addEventListener('pointerdown',pointerDown);
  canvas.addEventListener('pointermove',pointerMove);
  canvas.addEventListener('pointerup',pointerUp);
  canvas.addEventListener('pointercancel',pointerUp);
}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*(canvas.width/r.width),y:(e.clientY-r.top)*(canvas.height/r.height)}}
function getTextHitBoxes(){
  const w=canvas.width,h=canvas.height;
  return {
    message:{x:w*settings.message.x/100,y:h*settings.message.y/100,r:Math.max(55,w*.12)},
    name:{x:w*settings.name.x/100,y:h*settings.name.y/100,r:Math.max(45,w*.09)}
  };
}
function pointerDown(e){
  if(!canvas.width)return;
  const p=canvasPoint(e),boxes=getTextHitBoxes();
  const target=activeTarget;
  const available=target==='message' ? messageInput.value.trim().length>0 : nameInput.value.trim().length>0;
  if(!available)return;
  const d=Math.hypot(p.x-boxes[target].x,p.y-boxes[target].y);
  if(d>Math.max(boxes[target].r,70))return;
  dragging=true;dragTarget=target;
  const t=settings[target];
  dragStart={x:p.x,y:p.y,x0:t.x,y0:t.y};
  canvas.setPointerCapture?.(e.pointerId);
  canvas.classList.add('dragging');
  e.preventDefault();
}
function pointerMove(e){
  if(!dragging || !dragTarget)return;
  const p=canvasPoint(e),w=canvas.width,h=canvas.height,t=settings[dragTarget];
  t.x=Math.max(5,Math.min(95,dragStart.x0+(p.x-dragStart.x)/w*100));
  t.y=Math.max(8,Math.min(95,dragStart.y0+(p.y-dragStart.y)/h*100));
  drawCard();
  e.preventDefault();
}
function pointerUp(e){
  if(!dragging)return;
  dragging=false;dragTarget=null;dragStart=null;
  canvas.classList.remove('dragging');
  try{canvas.releasePointerCapture?.(e.pointerId)}catch(_){}
  syncControls();
}
async function downloadCard(){if(!canvas.width)return;const safe=(nameInput.value.trim()||'بطاقة').replace(/[\\/:*?"<>|]/g,'-');const link=document.createElement('a');link.download=`بطاقة-اليوم-الوطني-${safe}.png`;link.href=canvas.toDataURL('image/png');link.click()}
async function shareCard(){if(!canvas.width)return;try{const blob=await new Promise(r=>canvas.toBlob(r,'image/png',1));const file=new File([blob],'بطاقة-اليوم-الوطني.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share)await navigator.share({title:'بطاقة اليوم الوطني السعودي',text:'بطاقتي بمناسبة اليوم الوطني السعودي 🇸🇦',files:[file]});else if(navigator.share)await navigator.share({title:'بطاقة اليوم الوطني السعودي',text:'بطاقتي بمناسبة اليوم الوطني السعودي 🇸🇦'});else{await downloadCard();showToast('تم تجهيز البطاقة للمشاركة')}}catch(e){if(e.name!=='AbortError')showToast('يمكنك تحميل البطاقة ومشاركتها من جهازك')}}
function newCard(){activeTarget='message';$('moveMessageBtn').classList.add('active');$('moveNameBtn').classList.remove('active');nameInput.value='';messageInput.value='';charCount.textContent='٠';currentDesign=0;const first=document.querySelector('input[name="design"]');if(first)first.checked=true;previewSection.hidden=true;controls.hidden=true;resetSettings(false);window.scrollTo({top:0,behavior:'smooth'});nameInput.focus()}
messageInput.addEventListener('input',()=>{charCount.textContent=arabicDigits(messageInput.value.length);if(currentImage)drawCard()});nameInput.addEventListener('input',()=>{if(currentImage)drawCard()});
createBtn.addEventListener('click',createCard);downloadBtn.addEventListener('click',downloadCard);shareBtn.addEventListener('click',shareCard);newCardBtn.addEventListener('click',newCard);
renderDesigns();updateCounter();setupControls();syncControls();

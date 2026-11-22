/* Offline PDF generator: A4, one page, WinAnsi, no network libraries. */
(function(){'use strict';
const M=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const W=['So','Mo','Di','Mi','Do','Fr','Sa'];
const CP={'€':128,'‚':130,'ƒ':131,'„':132,'…':133,'†':134,'‡':135,'ˆ':136,'‰':137,'Š':138,'‹':139,'Œ':140,'Ž':142,'‘':145,'’':146,'“':147,'”':148,'•':149,'–':150,'—':151,'˜':152,'™':153,'š':154,'›':155,'œ':156,'ž':158,'Ÿ':159};
function bytes(s){let a=[];for(const c of s){let n=c.codePointAt(0);a.push(n<=255?n:(CP[c]||63));}return a;}
function safe(s){return String(s??'').replace(/[\\()]/g,'\\$&').replace(/[\r\n]/g,' ').replace(/[^\x20-\x7e\xa0-\xff€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/g,'?');}
function text(x,y,str,size=9,bold=false){return `BT /F${bold?2:1} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${safe(str)}) Tj ET\n`;}
function line(x1,y1,x2,y2){return `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`;}
function rect(x,y,w,h,fill=false){return `${x} ${y} ${w} ${h} re ${fill?'f':'S'}\n`;}
function minutes(t){if(!/^\d\d:\d\d$/.test(t||''))return null;let [h,m]=t.split(':').map(Number);return h*60+m;}
function dur(r){let a=minutes(r.start),b=minutes(r.end);if(a===null||b===null)return 0;let n=(b-a+1440)%1440;return Math.max(0,n-Math.max(0,Number(r.break)||0));}
function fmt(n){return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}
function crop(s,n){s=String(s||'');return s.length>n?s.slice(0,n-1)+'…':s;}
function build(){
 let st=JSON.parse(localStorage.getItem('mf_arbeitszeit_v1')||'{}');let emp=(st.employees||[]).find(e=>e.id===st.selected)||(st.employees||[])[0]||{id:'m1',name:''};
 let mt=document.getElementById('monthTitle').textContent.trim().split(/\s+/),mo=M.indexOf(mt[0]),year=Number(mt[1]);if(mo<0||!year)throw Error('Monat konnte nicht gelesen werden');
 let count=new Date(year,mo+1,0).getDate(),entries=st.entries||{};
 const x=49,width=497,top=842;let c='0 G 0 g 0.7 w\n';
 c+=text(49,792,'Vorlage zur Dokumentation der täglichen Arbeitszeit',11.3,true);
 c+=text(49,770,'Firma:',9.2)+text(185,770,'Ihr Malermeister Mario Ficker',9.2);
 c+=text(49,751,'Name des Mitarbeiters:',9.2)+text(185,751,emp.name,9.2);
 c+=text(49,732,'Pers.-Nr.:',9.2)+text(305,732,'Monat/Jahr:',9.2)+text(395,732,`${String(mo+1).padStart(2,'0')}/${year}`,9.2);
 c+=line(181,765,545,765)+line(181,746,545,746)+line(181,727,244,727)+line(390,727,545,727);
 let col=[49,86,137,189,237,290,316,389,546],yTop=714,hHead=31,rowH=14.45;
 c+='0.76 g\n'+rect(49,yTop-hHead,width,hHead,true)+'0 g\n';
 for(let i=0;i<col.length;i++)c+=line(col[i],yTop,col[i],yTop-hHead-rowH*31);
 c+=line(49,yTop,546,yTop)+line(49,yTop-hHead,546,yTop-hHead);
 for(let i=1;i<=31;i++)c+=line(49,yTop-hHead-i*rowH,546,yTop-hHead-i*rowH);
 const labels=[['Kalen-','dertag'],['Beginn','(Uhrzeit)'],['Pause','(Dauer)'],['Ende','(Uhrzeit)'],['Dauer','(Summe)'],['*'],['aufgezeichnet','am:'],['Bemerkungen']];
 labels.forEach((ls,i)=>{let cx=(col[i]+col[i+1])/2;ls.forEach((t,j)=>{let xx=cx-t.length*2.05;c+=text(xx,yTop-12-j*11,t,7.5,i===7);});});
 let total=0;
 for(let d=1;d<=31;d++){
  let y=yTop-hHead-(d-.5)*rowH-2.7;if(d>count)continue;
  let date=new Date(year,mo,d),key=emp.id+'|'+`${year}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,r=entries[key]||{},v=dur(r);total+=v;
  let vals=[`${d}`,r.start||'',r.break!==undefined&&r.break!==''?`${r.break} Min.`:'',r.end||'',v?fmt(v):'',r.code||'',r.recorded?String(r.recorded).split('-').reverse().join('.'):'',crop(r.note,32)];
  vals.forEach((val,i)=>{if(!val)return;let font=i===7?6.7:7.6;let px=col[i]+3;if(i===0)px=col[i]+13;if(i===7)font=6.4;c+=text(px,y,crop(val,i===7?32:i===6?10:14),font);});
 }
 let bottom=yTop-hHead-rowH*31;
 c+=text(201,bottom-18,'Summe:',9,true)+text(243,bottom-18,fmt(total)+' Std.',9,true);
 c+=line(242,bottom-22,303,bottom-22);
 let sy=bottom-58;c+=line(70,sy,290,sy)+line(320,sy,540,sy);
 c+=text(70,sy-12,'Datum',7)+text(115,sy-12,'Unterschrift des Arbeitnehmers',7);
 c+=text(320,sy-12,'Datum',7)+text(365,sy-12,'Unterschrift des Arbeitgebers',7);
 c+=text(49,sy-36,'* Tragen Sie in diese Spalte eines der folgenden Kürzel ein, wenn es für diesen Kalendertag zutrifft:',7.2,true);
 let keys=[['K','Krank'],['U','Urlaub'],['UU','unbezahlter Urlaub'],['F','Feiertag'],['SA','Stundenweise abwesend'],['SU','Stundenweise Urlaub']];
 keys.forEach(([k,v],i)=>{c+=text(215,sy-54-i*11,k,8,true)+text(248,sy-54-i*11,v,8);});
 return {pdf:serialize(c),name:`Stundenzettel_${emp.name.replace(/[^a-zA-Z0-9äöüÄÖÜß-]/g,'_')}_${year}-${String(mo+1).padStart(2,'0')}.pdf`};
}
function serialize(content){
 let chunks=[],len=0,offset=[0];function push(s){let a=bytes(s);chunks.push(a);len+=a.length;}
 push('%PDF-1.4\n%âãÏÓ\n');
 const objs=[null,'<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',`<< /Length ${bytes(content).length} >>\nstream\n${content}endstream`];
 for(let i=1;i<objs.length;i++){offset[i]=len;push(`${i} 0 obj\n${objs[i]}\nendobj\n`);}
 let xref=len;push(`xref\n0 ${objs.length}\n0000000000 65535 f \n`);for(let i=1;i<objs.length;i++)push(`${String(offset[i]).padStart(10,'0')} 00000 n \n`);
 push(`trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 let out=new Uint8Array(len),p=0;for(const a of chunks){out.set(a,p);p+=a.length;}return new Blob([out],{type:'application/pdf'});
}
async function make(preview){try{const {pdf,name}=build(),file=new File([pdf],name,{type:'application/pdf'});if(!preview&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'Stundenzettel'});return}catch(e){if(e.name==='AbortError')return;}}
 const url=URL.createObjectURL(pdf);if(preview){let w=window.open(url,'_blank');if(!w)download(url,name);}else download(url,name);
 setTimeout(()=>URL.revokeObjectURL(url),120000);
 }catch(e){alert('PDF konnte nicht erstellt werden: '+e.message);}}
function download(url,name){let a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();}
window.MFpdf={make};
})();

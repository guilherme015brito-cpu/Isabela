/* Spatial table parser shared by browser OCR and the regression checks. */
(function(root){
  const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'').replace(/1/g,'l');
  function distance(a,b){const d=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let previous=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const old=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,previous+(a[i-1]!==b[j-1]));previous=old}}return d[b.length]}
  const center=w=>({x:(w.bbox.x0+w.bbox.x1)/2,y:(w.bbox.y0+w.bbox.y1)/2});
  function parseScale(data,name='Isabela'){
    let words=data.words||[];
    if(!words.length&&data.blocks)for(const b of data.blocks)for(const p of b.paragraphs||[])for(const l of p.lines||[])words.push(...(l.words||[]));
    words=words.filter(w=>w.bbox&&normalize(w.text));
    const keys=['banheiro','sala','cozinha','lavanderia'],labels=['Banheiro','Sala','Cozinha','Lavanderia e garagem'],target=normalize(name),rows=[[],[],[],[]],notes=[];
    const headings=keys.map(k=>words.filter(w=>{const n=normalize(w.text);return n===k||n.includes(k)||(k.length>4&&distance(n,k)<=1)}).sort((a,b)=>(b.confidence||0)-(a.confidence||0))[0]);
    if(headings.some(h=>!h))return {rows,complete:false,assigned:0,notes:['O leitor reconheceu texto, mas não localizou todos os títulos das colunas. Confira os ambientes manualmente.'],text:data.text||''};
    const centers=headings.map(center),medianHeight=[...headings.map(w=>w.bbox.y1-w.bbox.y0)].sort((a,b)=>a-b)[2],headerSlope=(centers[3].y-centers[0].y)/(centers[3].x-centers[0].x),referenceY=centers[0].y;
    const boundary=centers[0].x-(centers[1].x-centers[0].x)*.48;
    const candidates=words.filter(w=>{const p=center(w),n=normalize(w.text);return p.x>boundary&&p.x<centers[3].x+(centers[3].x-centers[2].x)*.65&&p.y>referenceY+headerSlope*(p.x-centers[0].x)+medianHeight*2.5&&n.length>=3&&!['semana','garagem','lavanderia','outubro','limpo'].includes(n)});
    const cols=Array.from({length:4},()=>[]);
    for(const w of candidates){const p=center(w);const col=centers.reduce((best,c,i)=>Math.abs(c.x-p.x)<Math.abs(centers[best].x-p.x)?i:best,0);cols[col].push(w)}
    let assigned=0,validColumns=0;
    for(let col=0;col<4;col++){
      const list=cols[col].sort((a,b)=>center(a).y-center(b).y),groups=[];
      for(const w of list){const y=center(w).y,last=groups.at(-1);if(last&&Math.abs(last.y-y)<medianHeight*.75){last.words.push(w);last.y=last.words.reduce((sum,x)=>sum+center(x).y,0)/last.words.length}else groups.push({y,words:[w]})}
      if(groups.length!==4){notes.push(`${labels[col]}: reconhecidas ${groups.length} linhas; revise essa coluna.`);continue}
      validColumns++;
      groups.forEach((group,row)=>{if(group.words.some(w=>{const n=normalize(w.text);return n===target||(target.length>=5&&distance(n,target)<=1)})){rows[row].push(labels[col]);assigned++}});
    }
    if(!assigned)notes.push(`Não foi encontrada uma correspondência segura para ${name}. Confira o texto reconhecido e preencha as semanas.`);
    return {rows,complete:validColumns===4&&assigned>0,assigned,notes,text:data.text||''};
  }
  async function readCells(worker,photo,geometry,name='Isabela',progress=()=>{}){
    const labels=['Banheiro','Sala','Cozinha','Lavanderia e garagem'],keys=['banheiro','sala','cozinha','lavanderia'],rows=[[],[],[],[]],notes=[],target=normalize(name),width=geometry.width,height=geometry.height,header=geometry.headerRatio*height,rowHeight=(height-header)/4;
    const texts=[];let assigned=0,valid=0;await worker.setParameters({tessedit_pageseg_mode:'6',preserve_interword_spaces:'1',user_defined_dpi:'300'});
    for(let col=0;col<4;col++){
      progress(col*5,20);const left=Math.round(col*width/4+35),cellWidth=Math.round(width/4-70),headerResult=await worker.recognize(photo,{rectangle:{left,top:25,width:cellWidth,height:Math.max(30,Math.round(header-50))}}),heading=normalize(headerResult.data.text);
      const recognized=heading.includes(keys[col])||(keys[col].length>4&&heading.split(/\s/).some(v=>distance(v,keys[col])<=1));if(!recognized)notes.push(`Confira o título de ${labels[col]}.`);
      texts.push(`${labels[col]}: ${headerResult.data.text.trim()}`);
      for(let row=0;row<4;row++){
        progress(col*5+row+1,20);const result=await worker.recognize(photo,{rectangle:{left,top:Math.round(header+row*rowHeight+22),width:cellWidth,height:Math.max(25,Math.round(rowHeight-44))}}),text=result.data.text.trim(),n=normalize(text);
        texts.push(`${row+1}ª semana / ${labels[col]}: ${text}`);
        if(recognized&&n.length>=3){valid++;if(n===target||(target.length>=5&&distance(n,target)<=1)){rows[row].push(labels[col]);assigned++}}
        else notes.push(`${row+1}ª semana / ${labels[col]}: leitura incompleta.`);
      }
    }
    return {rows,assigned,complete:valid===16&&assigned>0,notes,text:texts.join('\n')};
  }
  root.ScaleOCR={parseScale,readCells,normalize,distance};
  if(typeof module!=='undefined')module.exports=root.ScaleOCR;
})(typeof window!=='undefined'?window:globalThis);

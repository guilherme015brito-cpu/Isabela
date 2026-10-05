(function(root){
  function preparePixels(rgba,width,height){
    const sw=Math.min(800,width),sh=Math.round(height*sw/width),gray=new Uint8Array(sw*sh),ratio=width/sw;
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){const i=(Math.min(height-1,Math.round(y*ratio))*width+Math.min(width-1,Math.round(x*ratio)))*4;gray[y*sw+x]=rgba[i]*.299+rgba[i+1]*.587+rgba[i+2]*.114}
    const at=(x,y)=>x>=0&&x<sw&&y>=0&&y<sh?gray[Math.round(y)*sw+Math.round(x)]:255;
    const horizontal=[];
    for(let b=Math.round(sh*.2);b<sh*.82;b++){let best={score:0,s:0,b:0};for(let s=-.1;s<=.101;s+=.01){let count=0,n=0;for(let x=Math.round(sw*.32);x<sw*.90;x+=3){const y=b+s*(x-sw*.6);if(Math.min(at(x,y-1),at(x,y),at(x,y+1))<95)count++;n++}if(count/n>best.score)best={score:count/n,s,b:b-s*sw*.6}}horizontal.push(best)}
    const lines=[];for(const line of horizontal.sort((a,b)=>b.score-a.score)){const mid=line.b+line.s*sw*.6;if(line.score>.72&&!lines.some(l=>Math.abs(l.b+l.s*sw*.6-mid)<sh*.04))lines.push(line);if(lines.length===6)break}lines.sort((a,b)=>(a.b+a.s*sw*.6)-(b.b+b.s*sw*.6));
    if(lines.length!==6)return {rgba,width,height,rectified:false};
    const y0=lines[0].b+lines[0].s*sw*.6,y1=lines[5].b+lines[5].s*sw*.6,mid=(y0+y1)/2,vertical=[];
    for(let c=Math.round(sw*.25);c<sw*.96;c++){let best={score:0,s:0,c:0};for(let s=-.22;s<=.221;s+=.01){let n=0,count=0;for(let y=Math.round(y0+5);y<y1-5;y+=3){const x=c+s*(y-mid),dark=Math.min(at(x-1,y),at(x,y),at(x+1,y))<100,edge=Math.max(at(x-5,y),at(x+5,y))>145;if(dark&&edge)count++;n++}if(count/n>best.score)best={score:count/n,s,c:c-s*mid}}vertical.push(best)}
    const cols=[];for(const v of vertical.sort((a,b)=>b.score-a.score)){const x=v.c+v.s*mid;if(v.score>.48&&!cols.some(l=>Math.abs(l.c+l.s*mid-x)<sw*.10))cols.push(v);if(cols.length===5)break}cols.sort((a,b)=>(a.c+a.s*mid)-(b.c+b.s*mid));if(cols.length!==5)return {rgba,width,height,rectified:false};
    const cross=(h,v)=>{const y=(h.s*v.c+h.b)/(1-h.s*v.s);return {x:(v.s*y+v.c)*ratio,y:y*ratio}};
    const a=cross(lines[0],cols[0]),b=cross(lines[0],cols[4]),c=cross(lines[5],cols[4]),d=cross(lines[5],cols[0]);
    const dx1=b.x-c.x,dx2=d.x-c.x,dx3=a.x-b.x+c.x-d.x,dy1=b.y-c.y,dy2=d.y-c.y,dy3=a.y-b.y+c.y-d.y,den=dx1*dy2-dx2*dy1;
    const g=(dx3*dy2-dx2*dy3)/den,h=(dx1*dy3-dx3*dy1)/den,A=b.x-a.x+g*b.x,B=d.x-a.x+h*d.x,D=b.y-a.y+g*b.y,E=d.y-a.y+h*d.y;
    const w=1800,ht=Math.round(w*((Math.hypot(d.x-a.x,d.y-a.y)+Math.hypot(c.x-b.x,c.y-b.y))/2)/((Math.hypot(b.x-a.x,b.y-a.y)+Math.hypot(c.x-d.x,c.y-d.y))/2)),out=new Uint8ClampedArray(w*ht*4);
    for(let y=0;y<ht;y++)for(let x=0;x<w;x++){const u=x/(w-1),v=y/(ht-1),q=g*u+h*v+1,sx=Math.max(0,Math.min(width-1,Math.round((A*u+B*v+a.x)/q))),sy=Math.max(0,Math.min(height-1,Math.round((D*u+E*v+a.y)/q))),source=(sy*width+sx)*4,i=(y*w+x)*4,lum=rgba[source]*.299+rgba[source+1]*.587+rgba[source+2]*.114,val=Math.max(0,Math.min(255,(lum-128)*1.45+165));out[i]=out[i+1]=out[i+2]=val;out[i+3]=255}
    // Erase narrow grid strokes without erasing the names inside the cells.
    for(let k=0;k<=4;k++){const x=Math.round(k*w/4);for(let xx=Math.max(0,x-7);xx<Math.min(w,x+8);xx++)for(let y=0;y<ht;y++){const i=(y*w+xx)*4;out[i]=out[i+1]=out[i+2]=255}}
    const headerRatio=(lines[1].b+lines[1].s*sw*.6-y0)/(y1-y0);
    for(let k=0;k<=5;k++){const yy=k===0?0:Math.round((headerRatio+(k-1)*(1-headerRatio)/4)*ht);for(let y=Math.max(0,yy-8);y<Math.min(ht,yy+9);y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;out[i]=out[i+1]=out[i+2]=255}}
    return {rgba:out,width:w,height:ht,rectified:true,corners:[a,b,c,d],headerRatio};
  }
  root.ScalePhoto={preparePixels};if(typeof module!=='undefined')module.exports=root.ScalePhoto;
})(typeof window!=='undefined'?window:globalThis);

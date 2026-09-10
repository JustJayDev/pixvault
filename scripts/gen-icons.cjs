const zlib=require('zlib'),fs=require('fs');
const T=(()=>{const t=new Int32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c}return t})();
function crc(b){let c=-1;for(let i=0;i<b.length;i++)c=T[(c^b[i])&255]^(c>>>8);return (c^-1)>>>0}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(type),data]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([len,td,c])}
function png(w,h,raw){const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))])}
function hex(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]}
const V=hex('#7c3aed'),C=hex('#22d3ee'),BG=hex('#0b0b12'),W=[255,255,255];
function draw(S){const px=Buffer.alloc(S*S*4);const set=(x,y,r,g,b)=>{const i=(y*S+x)*4;px[i]=r;px[i+1]=g;px[i+2]=b;px[i+3]=255};
for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=(y*S+x)*4;px[i]=BG[0];px[i+1]=BG[1];px[i+2]=BG[2];px[i+3]=255;
const nx=x/S-.5,ny=y/S-.5,d=Math.sqrt(nx*nx+ny*ny);const t=Math.min(1,Math.max(0,d*1.9));
const bg=[V[0]+(C[0]-V[0])*t,V[1]+(C[1]-V[1])*t,V[2]+(C[2]-V[2])*t];
const m=S*.09,r2=S*.5-m;const dx=Math.abs(nx*S)-r2,dy=Math.abs(ny*S)-r2;const dist=Math.sqrt(Math.max(dx,0)**2+Math.max(dy,0)**2)+Math.min(Math.max(dx,dy),0);
if(dist>1.5)continue;
const ring=Math.abs(d*S*.5-S*.34);if(ring<S*.045)set(x,y,bg[0],bg[1],bg[2]);
if(d<.30)set(x,y,bg[0],bg[1],bg[2]);
const ang=Math.atan2(ny,nx);const sp=Math.abs(((ang/(Math.PI/6))%1+1)%1-.5);
if(d>.10&&d<.30&&sp<.06)set(x,y,W[0],W[1],W[2]);
if(d<.085)set(x,y,W[0],W[1],W[2]);
if(d>.30&&d<.34&&ring>=S*.045)set(x,y,bg[0],bg[1],bg[2]);
}
return png(S,S,px)}
fs.mkdirSync('/root/pixvault/public/icons',{recursive:true});
for(const s of [192,512])fs.writeFileSync('/root/pixvault/public/icons/icon-'+s+'.png',draw(s));
console.log('icons done:',fs.readdirSync('/root/pixvault/public/icons').join(', '))
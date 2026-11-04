const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=require('../dist/cloud-core.js');
const initial=()=>core.canonical({settings:{theme:'rose',shopping:{lists:[{id:'market',name:'Mercado',items:[{id:'a',name:'Arroz',done:false},{id:'b',name:'Feijão',done:false}]}]}}});
function client(local,base,remote,onUpload){
  const storage=new Map();let writes=0,snapshot={revision:1,data:structuredClone(remote)};
  const context=vm.createContext({
    window:{IsabelaSyncCore:core},db:structuredClone(local),seed:{settings:{}},structuredClone,AbortSignal,
    navigator:{onLine:true},document:{activeElement:null},$:()=>null,render:()=>{},
    setTimeout:()=>0,clearTimeout:()=>{},
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
    rpc:(name,args)=>({abortSignal:async()=>{
      if(name==='isabela_load')return {data:structuredClone(snapshot)};
      writes++;if(onUpload)onUpload(context);
      if(args.expected_revision!==snapshot.revision)return {data:{...structuredClone(snapshot),conflict:true}};
      snapshot={revision:snapshot.revision+1,data:structuredClone(args.document)};
      return {data:structuredClone(snapshot)};
    }})
  });
  vm.runInContext(fs.readFileSync(require.resolve('../dist/cloud.js'),'utf8'),context);
  context.base=structuredClone(base);
  vm.runInContext("cloudState.session={user:{id:'owner'}};cloudState.client={rpc};cloudCache={owner:'owner',ready:true,base,revision:1};",context);
  return {context,storage,sync:()=>vm.runInContext('cloudSynchronize()',context),read:code=>vm.runInContext(code,context),writes:()=>writes,remote:()=>snapshot};
}
test('cloud client uploads combined purchases and saves the acknowledged local snapshot',async()=>{
  const b=initial(),l=initial(),r=initial();l.settings.shopping.lists[0].items[0].done=true;r.settings.shopping.lists[0].items[1].done=true;
  const c=client(l,b,r);await c.sync();
  assert.equal(c.writes(),1);assert.ok(c.remote().data.settings.shopping.lists[0].items.every(i=>i.done));
  assert.ok(JSON.parse(c.storage.get('isabela-v1')).settings.shopping.lists[0].items.every(i=>i.done));
  assert.equal(c.read('cloudDirty()'),false);
});
test('cloud client surfaces concurrent item renames without overwriting the server',async()=>{
  const b=initial(),l=initial(),r=initial();l.settings.shopping.lists[0].items[0].name='Local';r.settings.shopping.lists[0].items[0].name='Remote';
  const c=client(l,b,r);await c.sync();
  assert.equal(c.writes(),0);assert.equal(c.read('cloudState.conflict.result.conflicts.length'),1);
  assert.match(c.read('cloudState.message'),/revisar/);
});
test('cloud client preserves an item added during an upload and sends it next time',async()=>{
  const b=initial(),l=initial();l.settings.shopping.lists[0].items[0].done=true;
  let added=false;
  const c=client(l,b,b,ctx=>{if(!added){ctx.db.settings.shopping.lists[0].items.push({id:'c',name:'Leite',done:false});added=true;}});
  await c.sync();assert.equal(c.read('db.settings.shopping.lists[0].items.length'),3);assert.equal(c.read('cloudDirty()'),true);
  await c.sync();assert.equal(c.remote().data.settings.shopping.lists[0].items.length,3);assert.equal(c.read('cloudDirty()'),false);
});
test('network errors retain purchases locally and retry successfully',async()=>{
  const b=initial(),l=initial();l.settings.shopping.lists[0].items[0].done=true;
  const c=client(l,b,b);c.context.originalRpc=c.context.rpc;
  c.read("cloudState.client.rpc=()=>({abortSignal:async()=>{throw Error('network offline')}})");
  await c.sync();assert.equal(c.read('cloudState.status'),'error');assert.equal(c.read('db.settings.shopping.lists[0].items[0].done'),true);
  c.read('cloudState.client.rpc=originalRpc');await c.sync();
  assert.equal(c.read('cloudDirty()'),false);assert.equal(c.remote().data.settings.shopping.lists[0].items[0].done,true);
});

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const core = require('../dist/cloud-core.js');
const item = (id, name = id, done = false) => ({id, name, done});
const list = (id, items = []) => ({id, name: id, items});
const doc = lists => core.canonical({settings: lists === undefined ? {theme:'rose'} : {theme:'rose', shopping:{lists}}});
const base = () => doc([list('Mercado', [item('feijao'), item('arroz')])]);
const items = data => data.settings.shopping.lists[0].items;
const merge = (b,l,r,choices) => core.merge(b,l,r,choices);

test('old documents remain valid without initializing shopping', () => {
  const old = doc();
  assert.equal(core.assertDocument(old), old);
  assert.equal('shopping' in old.settings, false);
  assert.deepEqual(merge(old,old,old), {data:old,conflicts:[]});
});
test('valid lists, empty lists, duplicate names and checked items survive JSON backup', () => {
  const data = doc([list('empty'),list('market',[item('a','Arroz'),item('b','Arroz',true)])]);
  assert.deepEqual(core.assertDocument(JSON.parse(JSON.stringify(data))),data);
});
test('invalid shopping backups are rejected', () => {
  const invalid = [null,[],{}, {lists:{}}, {lists:[null]}, {lists:[{id:'a',name:' ',items:[]}]},
    {lists:[list('same'),list('same')]}, {lists:[list('a',[item('same'),item('same')])]},
    {lists:[list('a',[{id:'x',name:'X',done:'true'}])]}, {lists:[list('a',[item('x','x'.repeat(201))])]},
    {lists:[{id:'a',name:'a'.repeat(101),items:[]}]}, {lists:[{id:' ',name:'A',items:[]}]},
    {lists:[{id:'x',name:'X',items:null}]}];
  for(const shopping of invalid) assert.throws(()=>core.assertDocument({...doc(),settings:{shopping}}),/compras/);
});
test('different items checked on two devices combine without a conflict', () => {
  const b=base(),l=structuredClone(b),r=structuredClone(b);
  items(l)[0].done=true;items(r)[1].done=true;
  const result=merge(b,l,r);
  assert.equal(result.conflicts.length,0);assert.ok(items(result.data).every(i=>i.done));
});
test('rename and check of the same item combine', () => {
  const b=base(),l=structuredClone(b),r=structuredClone(b);
  items(l)[0].name='Feijão preto';items(r)[0].done=true;
  assert.deepEqual(items(merge(b,l,r).data)[0],item('feijao','Feijão preto',true));
});
test('concurrent additions and new lists are retained', () => {
  const b=base(),l=structuredClone(b),r=structuredClone(b);
  items(l).push(item('leite'));items(r).push(item('pao'));
  l.settings.shopping.lists.push(list('Farmácia'));
  r.settings.shopping.lists.push(list('Casa'));
  const result=merge(b,l,r);
  assert.equal(result.conflicts.length,0);assert.equal(items(result.data).length,4);
  assert.equal(result.data.settings.shopping.lists.length,3);
});
test('first shopping lists created independently combine from an old base', () => {
  const result=merge(doc(),doc([list('A')]),doc([list('B')]));
  assert.equal(result.conflicts.length,0);assert.equal(result.data.settings.shopping.lists.length,2);
});
test('deletion does not resurrect unchanged items or lists', () => {
  const b=base(),l=structuredClone(b);
  items(l).pop();assert.equal(items(merge(b,l,b).data).length,1);
  l.settings.shopping.lists=[];assert.deepEqual(merge(b,l,b).data,l);
});
test('concurrent rename conflicts expose choices for the exact item', () => {
  const b=base(),l=structuredClone(b),r=structuredClone(b);
  items(l)[0].name='Feijão preto';items(r)[0].name='Feijão carioca';
  const result=merge(b,l,r);assert.equal(result.conflicts.length,1);
  const key=result.conflicts[0].key;
  assert.equal(items(merge(b,l,r,{[key]:'remote'}).data)[0].name,'Feijão carioca');
  assert.equal(items(merge(b,l,r,{[key]:'local'}).data)[0].name,'Feijão preto');
});
test('deletion versus editing requires a choice instead of silent loss', () => {
  const b=base(),l=structuredClone(b),r=structuredClone(b);
  items(l).shift();items(r)[0].done=true;
  let result=merge(b,l,r);assert.equal(result.conflicts.length,1);
  assert.equal(items(merge(b,l,r,{[result.conflicts[0].key]:'remote'}).data).length,2);
  l.settings.shopping.lists=[];result=merge(b,l,r);assert.equal(result.conflicts.length,1);
  assert.equal(merge(b,l,r,{[result.conflicts[0].key]:'local'}).data.settings.shopping.lists.length,0);
});
test('initial synchronization preserves local priority and remote-only items', () => {
  const l=base(),r=base();items(l)[0].name='Local';items(r)[0].name='Remote';items(r).push(item('extra'));
  r.settings.shopping.lists.push(list('Farmácia'));
  const result=core.preferLocal(l,r);
  assert.equal(items(result)[0].name,'Local');assert.equal(items(result).length,3);
  assert.equal(result.settings.shopping.lists.length,2);
  assert.deepEqual(core.preferLocal(doc(),r).settings.shopping,r.settings.shopping);
});
test('edits during an in-flight upload are rebased without losing purchases', () => {
  const sent=base(),current=structuredClone(sent),ack=structuredClone(sent);
  items(current)[0].done=true;items(ack)[1].done=true;
  const result=core.rebase(sent,current,ack);
  assert.equal(result.conflicts.length,0);assert.ok(items(result.data).every(i=>i.done));
});
test('unrelated data is preserved across shopping merges', () => {
  const b=base();b.settings.nutrition={plans:[],measurements:[]};b.banks=[{id:'bank',name:'Bank',initial:12}];
  const l=structuredClone(b),r=structuredClone(b);items(l)[0].done=true;r.settings.theme='night';
  const result=core.assertDocument(merge(b,l,r).data);
  assert.deepEqual(result.banks,b.banks);assert.deepEqual(result.settings.nutrition,b.settings.nutrition);
  assert.equal(result.settings.theme,'night');
});
function uiContext(save=true,shopping){
  const context=vm.createContext({structuredClone,db:{settings:shopping?{shopping}:{}},save:()=>save});
  vm.runInContext(fs.readFileSync(require.resolve('../dist/shopping.js'),'utf8'),context);
  return context;
}
test('completion requires at least one item and reopens on an unchecked item', () => {
  const ctx=uiContext();
  assert.equal(vm.runInContext('shoppingComplete({items:[]})',ctx),false);
  assert.equal(vm.runInContext('shoppingComplete({items:[{done:true}]})',ctx),true);
  assert.equal(vm.runInContext('shoppingComplete({items:[{done:true},{done:false}]})',ctx),false);
});
test('failed local saves roll back both existing and previously absent shopping data', () => {
  const ctx=uiContext(false,{lists:[list('A')]});
  const previous=JSON.stringify(ctx.db);
  assert.equal(vm.runInContext("shoppingCommit(data => data.lists[0].name='Changed')",ctx),false);
  assert.equal(JSON.stringify(ctx.db),previous);
  const fresh=uiContext(false);
  vm.runInContext("shoppingCommit(data => data.lists.push({id:'A'}))",fresh);
  assert.equal('shopping' in fresh.db.settings,false);
});
test('all new offline assets are loaded and precached', () => {
  const html=fs.readFileSync(require.resolve('../dist/index.html'),'utf8');
  const worker=fs.readFileSync(require.resolve('../dist/sw.js'),'utf8');
  for(const file of ['shopping.js','shopping.css']) {assert.ok(html.includes(file));assert.ok(worker.includes(file));}
  assert.ok(html.indexOf('shopping.js')<html.indexOf('controls.js'));
});

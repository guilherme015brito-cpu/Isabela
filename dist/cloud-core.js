(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.IsabelaSyncCore=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const collections=['tasks','categories','financeCategories','banks','transactions','projects','importBatches'];
  const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  function stable(v){if(Array.isArray(v))return '['+v.map(stable).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';return JSON.stringify(v)}
  const equal=(a,b)=>stable(a)===stable(b);
  function canonical(source){const result={};for(const key of collections)result[key]=clone(source[key]||[]);result.settings=clone(source.settings||{});delete result.settings.collapsed;return result}
  function assertDocument(doc){
    if(!doc||typeof doc!=='object'||!doc.settings||typeof doc.settings!=='object'||Array.isArray(doc.settings))throw Error('A cópia de dados recebida é inválida.');
    for(const key of collections){if(!Array.isArray(doc[key]))throw Error('Coleção inválida: '+key);const ids=new Set();for(const item of doc[key]){if(!item||typeof item.id!=='string'||!item.id||item.id.length>180||ids.has(item.id))throw Error('Registro inválido em '+key);ids.add(item.id)}}
    for(const t of doc.tasks)if(typeof t.name!=='string'||!t.name.trim()||typeof t.done!=='boolean'||!/^\d{4}-\d{2}-\d{2}$/.test(t.date)||!Number.isFinite(parseDate(t.date))||(t.end&&(!Number.isFinite(parseDate(t.end))||t.end<t.date)))throw Error('Uma tarefa tem datas inválidas.');
    for(const b of doc.banks)if(!Number.isFinite(b.initial))throw Error('Um banco tem saldo inválido.');
    for(const p of doc.projects)if(!Number.isFinite(p.target)||p.target<=0)throw Error('Um plano tem meta inválida.');
    for(const t of doc.transactions)if(!Number.isFinite(parseDate(t.date))||!Number.isFinite(t.amount)||t.amount<=0||!['in','out'].includes(t.type)||!doc.banks.some(b=>b.id===t.bank)||(t.project&&!doc.projects.some(p=>p.id===t.project)))throw Error('Uma movimentação ficou sem banco ou plano. Revise os registros antes de sincronizar.');
    return doc;
  }
  function parseDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return NaN;const d=new Date(s+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s?+d:NaN}
  function merge(base,local,remote,choices={}){
    const result={settings:{}},conflicts=[];
    const choose=(key,b,l,r,label)=>{
      if(equal(l,r))return clone(l);
      if(equal(l,b))return clone(r);
      if(equal(r,b))return clone(l);
      if(choices[key]==='local')return clone(l);
      if(choices[key]==='remote')return clone(r);
      conflicts.push({key,label,local:clone(l),remote:clone(r)});return clone(l);
    };
    for(const collection of collections){
      const b=new Map((base?.[collection]||[]).map(v=>[v.id,v])),l=new Map(local[collection].map(v=>[v.id,v])),r=new Map(remote[collection].map(v=>[v.id,v]));
      const ids=new Set([...r.keys(),...l.keys(),...b.keys()]);result[collection]=[];
      for(const id of ids){const record=choose(collection+':'+id,b.get(id),l.get(id),r.get(id),(l.get(id)||r.get(id)||b.get(id))?.name||'Registro da escala');if(record!==undefined)result[collection].push(record)}
    }
    for(const key of new Set([...Object.keys(base?.settings||{}),...Object.keys(local.settings),...Object.keys(remote.settings)])){
      const value=choose('settings:'+key,base?.settings?.[key],local.settings[key],remote.settings[key],key==='notifications'?'Preferências de notificações':'Configuração: '+key);if(value!==undefined)result.settings[key]=value;
    }
    return {data:result,conflicts};
  }
  function preferLocal(local,remote){
    const result={settings:{...clone(remote.settings),...clone(local.settings)}};
    for(const key of collections){const records=new Map(remote[key].map(item=>[item.id,clone(item)]));for(const item of local[key])records.set(item.id,clone(item));result[key]=[...records.values()]}
    return result;
  }
  // Aplicar um snapshot não pode apagar alterações feitas enquanto a rede respondia.
  function rebase(sent,current,acknowledged){return merge(sent,current,acknowledged)}
  return {collections,clone,stable,equal,canonical,assertDocument,merge,rebase,preferLocal};
});

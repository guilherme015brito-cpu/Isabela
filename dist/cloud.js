'use strict';
const cloudCore=window.IsabelaSyncCore;
const cloudCacheKey='isabela-cloud-v1',cloudBackupKey='isabela-before-cloud-v1';
const cloudCollectionNames={tasks:'Tarefas',categories:'Categorias',financeCategories:'Categorias do caixa',banks:'Bancos',transactions:'Movimentações',projects:'PLAN',importBatches:'Escalas'};
const cloudState={client:null,session:null,busy:false,authBusy:false,email:'',code:'',requested:false,message:'',status:'local',migration:null,conflict:null,timer:null,retry:0,paused:false};
let cloudCache;try{cloudCache=JSON.parse(localStorage.getItem(cloudCacheKey))||{}}catch{cloudCache={}}
function cloudDefaultBase(){return cloudCore.canonical({...structuredClone(seed),financeCategories:[{id:'food',name:'Alimentação',emoji:'🍽️',color:'#efa58c'},{id:'transport',name:'Transporte',emoji:'🚌',color:'#97c5e3'},{id:'bills',name:'Contas',emoji:'💡',color:'#f2c75c'},{id:'shopping',name:'Compras',emoji:'🛒',color:'#e9a8be'},{id:'salary',name:'Renda',emoji:'💰',color:'#a8c9ba'}]})}
function cloudCurrent(){return cloudCore.canonical(db)}
function cloudDirty(){return !cloudCache.base||!cloudCore.equal(cloudCurrent(),cloudCache.base)}
function cloudCounts(data){return `${data.tasks.length} tarefas · ${data.banks.length} bancos · ${data.transactions.length} movimentações · ${data.projects.length} planos`}
function cloudEditing(){return !!$('#modal')?.open||document.activeElement?.matches('input,textarea,select,[contenteditable="true"]')}
function cloudCacheSave(){try{localStorage.setItem(cloudCacheKey,JSON.stringify(cloudCache));return true}catch{cloudState.message='Não foi possível atualizar a cópia local. Exporte uma cópia dos seus dados.';return false}}
function cloudBackup(){try{if(!localStorage.getItem(cloudBackupKey))localStorage.setItem(cloudBackupKey,JSON.stringify({created:new Date().toISOString(),data:db}));return true}catch{cloudState.message='Não foi possível guardar a cópia anterior. Exporte seus dados antes de ativar.';cloudRefresh();return false}}
function cloudApply(data){
  const previous=cloudCurrent(),collapsed=db.settings.collapsed;
  db={...db,...structuredClone(data),settings:{...seed.settings,...data.settings,collapsed}};
  try{localStorage.setItem('isabela-v1',JSON.stringify(db))}catch{cloudState.message='Não foi possível salvar a cópia neste aparelho. Exporte uma cópia nas Configurações.'}
  if(!cloudCore.equal(previous,cloudCurrent())&&!cloudEditing())render();
}
function cloudStatusText(){
  if(!cloudState.client)return 'Conexão indisponível';
  if(!cloudState.session)return 'Somente neste aparelho';
  if(cloudState.migration)return 'Revisar primeira sincronização';
  if(cloudState.conflict)return 'Revisar alterações';
  if(cloudState.busy)return 'Sincronizando…';
  if(cloudState.paused)return 'Sincronização precisa de atenção';
  if(navigator.onLine===false)return 'Sem internet · dados locais';
  if(cloudState.status==='error')return 'Alterações aguardando conexão';
  if(cloudDirty())return 'Alterações aguardando envio';
  return 'Sincronizado';
}
function cloudSettings(){
  const s=cloudState,connected=!!s.session,delivery=window.IsabelaCloudConfig?.emailDeliveryReady===true;
  const updated=cloudCache.lastSynced?new Date(cloudCache.lastSynced).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'';
  let content;
  if(!connected){
    content=`<p class="muted">Vincule este aparelho para guardar sua rotina na nuvem e acessar os mesmos dados no celular e no computador.</p>${!delivery?'<div class="notice cloud-wait">A ativação por e-mail está em preparação. Você pode continuar usando o app e fazendo cópias dos seus dados.</div>':''}<form id="cloudemailform" class="form"><label>E-mail de ativação<input id="cloudemail" type="email" autocomplete="email" placeholder="Seu e-mail cadastrado" required value="${esc(s.email)}" ${s.authBusy?'disabled':''}></label><button class="primary" type="submit" ${s.authBusy||!s.client||!delivery?'disabled':''}>${s.authBusy?'Aguarde…':s.requested?'Enviar novo código':'Receber código de ativação'}</button></form>${s.requested?`<form id="cloudcodeform" class="form"><label>Código recebido por e-mail<input id="cloudcode" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" minlength="6" maxlength="10" required value="${esc(s.code)}" ${s.authBusy?'disabled':''}></label><button class="primary" ${s.authBusy?'disabled':''}>Ativar este aparelho</button><small>Confira também a pasta de spam. Abra o app pelo ícone da Tela de Início antes de inserir o código.</small></form>`:''}`;
  }else{
    content=`<p class="cloud-account">${icon('spark')}<span>${esc(s.session.user.email||'Aparelho vinculado')}</span></p><p class="muted">As alterações são sincronizadas ao salvar e enquanto o app está aberto. Sem internet, continuam guardadas neste aparelho.</p>${updated?`<small>Última sincronização: ${esc(updated)}</small>`:''}<div class="row wrap cloud-actions"><button class="primary" id="cloudsync" ${s.busy?'disabled':''}>Sincronizar agora</button><button id="cloudsignout">Desvincular este aparelho</button></div>`;
    if(s.migration)content+=`<div class="cloud-review"><h3>Conectar seus dados</h3><p>Neste aparelho: ${cloudCounts(cloudCurrent())}.</p><p>Na nuvem: ${s.migration.data?cloudCounts(s.migration.data):'Nenhum dado salvo ainda'}.</p><small>Antes de continuar, o app guarda uma cópia dos dados atuais neste aparelho.</small><div class="cloud-actions row wrap"><button class="primary" id="cloudmigrate">${s.migration.data?'Combinar com a nuvem':'Enviar dados deste aparelho'}</button>${s.migration.data?'<button id="cloudusecloud">Usar dados da nuvem</button>':''}</div></div>`;
    if(s.conflict)content+=`<div class="cloud-review"><h3>Revisar alterações de dois aparelhos</h3><p>Escolha qual versão manter nos registros alterados nos dois aparelhos. As demais alterações serão combinadas.</p><form id="cloudconflictform" class="form">${s.conflict.result.conflicts.map((c,i)=>`<label>${esc(cloudCollectionNames[c.key.split(':')[0]]||'Configurações')} · ${esc(c.label)}<select name="conflict${i}" required><option value="">Escolher uma versão…</option><option value="local">${c.local===undefined?'Exclusão neste aparelho':'Versão deste aparelho'}</option><option value="remote">${c.remote===undefined?'Exclusão na nuvem':'Versão da nuvem'}</option></select><small>Neste aparelho: ${esc(cloudDescribe(c.local))}<br>Na nuvem: ${esc(cloudDescribe(c.remote))}</small></label>`).join('')}<button class="primary">Confirmar escolhas e sincronizar</button></form></div>`;
  }
  return `<section class="card cloud-card" id="cloudsettings"><div class="row between wrap"><h2>Sincronização</h2><span class="badge" id="cloudstatus" role="status">${esc(cloudStatusText())}</span></div>${content}<p id="cloudfeedback" role="status" aria-live="polite">${esc(s.message)}</p>${localStorage.getItem(cloudBackupKey)?'<button id="cloudbackup" class="ghost">Baixar cópia anterior à ativação</button>':''}</section>`;
}
function cloudDescribe(value){if(value===undefined)return 'Registro excluído';if(value&&typeof value==='object')return JSON.stringify(value).slice(0,400);return String(value)}
function cloudRefresh(){const panel=$('#cloudsettings');if(!panel)return;const active=document.activeElement;
  if(panel.contains(active)&&active.matches('input,textarea,select')){const status=$('#cloudstatus'),feedback=$('#cloudfeedback');if(status)status.textContent=cloudStatusText();if(feedback)feedback.textContent=cloudState.message;return}
  panel.outerHTML=cloudSettings();bindCloudSettings();
}
function cloudMessage(message){cloudState.message=message;cloudRefresh()}
function cloudFriendly(error){const text=String(error?.message||'');
  if(/email.*not.*authorized|email_address_not_authorized|smtp/i.test(text+' '+error?.code))return 'O envio de e-mails ainda precisa ser configurado. Seus dados continuam neste aparelho.';
  if(error?.status===429||/rate|too many|after.*seconds/i.test(text))return 'Aguarde alguns minutos antes de solicitar outro código.';
  if(/expired|invalid.*token|otp_expired/i.test(text+' '+error?.code))return 'Código inválido ou expirado. Confira o e-mail ou solicite outro código.';
  if(error?.code==='42501')return 'Esse e-mail não está habilitado para sincronizar este app.';
  if(/fetch|network|timeout|abort|offline/i.test(text))return 'Sem conexão com a nuvem. Seus dados estão guardados neste aparelho e o app tentará novamente.';
  return 'Não foi possível concluir a sincronização. Seus dados continuam neste aparelho. Tente novamente.';
}
async function cloudRPC(name,args){const result=await cloudState.client.rpc(name,args).abortSignal(AbortSignal.timeout(25000));if(result.error)throw result.error;return result.data}
function cloudCheckRemote(remote){if(!remote||!Number.isSafeInteger(remote.revision)||remote.revision<0)throw Error('Resposta de sincronização inválida');if(remote.data)cloudCore.assertDocument(remote.data);return remote}
function cloudConflict(base,local,remote,result){cloudState.conflict={base:structuredClone(base),local:structuredClone(local),remote:structuredClone(remote),result};cloudState.message='Abra Configurações → Sincronização para revisar as alterações.';cloudRefresh()}
async function cloudDiscover(){
  if(!cloudState.session||navigator.onLine===false)return;
  if(cloudState.busy)return;cloudState.busy=true;cloudRefresh();
  try{
    const owner=cloudState.session.user.id;
    const remote=cloudCheckRemote(await cloudRPC('isabela_load'));
    if(cloudState.session?.user.id!==owner)return;
    const sameOwner=cloudCache.owner===cloudState.session.user.id;
    if(sameOwner&&cloudCache.ready&&cloudCache.base){cloudState.status='ready';cloudState.busy=false;return await cloudSynchronize()}
    if(remote.data&&cloudCore.equal(cloudCurrent(),cloudDefaultBase())&&!cloudEditing()){
      if(!cloudBackup())return;cloudCache={owner:cloudState.session.user.id,revision:remote.revision,base:remote.data,ready:true,lastSynced:new Date().toISOString()};cloudApply(remote.data);cloudCacheSave();cloudState.status='ready';
    }else{cloudState.migration=remote;cloudState.message='Escolha como conectar os dados deste aparelho. Nada foi enviado ainda.'}
  }catch(error){cloudState.status='error';cloudState.message=cloudFriendly(error)}finally{cloudState.busy=false;cloudRefresh()}
}
async function cloudMigrate(useRemote=false){
  if(!cloudState.migration||!cloudState.session||!cloudBackup())return;
  const remote=cloudState.migration,local=cloudCurrent(),base=remote.data?cloudDefaultBase():local;
  cloudState.migration=null;cloudCache={owner:cloudState.session.user.id,revision:remote.revision,base:remote.data||base,ready:true};
  if(useRemote){cloudApply(remote.data);cloudCache.lastSynced=new Date().toISOString();cloudCacheSave()}
  else if(remote.data){const result=cloudCore.merge(base,local,remote.data);if(result.conflicts.length){cloudConflict(base,local,remote,result);cloudCacheSave();return}cloudApply(result.data);cloudCacheSave();await cloudSynchronize(true)}
  else{cloudCache.forceUpload=true;cloudCacheSave();await cloudSynchronize(true)}
  if(!cloudState.conflict&&!cloudState.paused&&cloudState.status!=='error')cloudState.message='Aparelho vinculado. Seus dados locais anteriores continuam disponíveis na cópia de segurança.';cloudRefresh();
}
async function cloudSynchronize(force=false){
  if(!cloudState.session||!cloudCache.ready||cloudCache.owner!==cloudState.session.user.id){if(force)await cloudDiscover();return}
  if(cloudState.migration||cloudState.conflict||cloudState.busy||cloudState.paused)return;
  if(navigator.onLine===false){cloudState.status='offline';cloudRefresh();return}
  if(cloudEditing()){cloudSchedule(2000);return}
  cloudState.busy=true;cloudRefresh();const owner=cloudState.session.user.id;
  try{
    let remote=cloudCheckRemote(await cloudRPC('isabela_load'));
    for(let attempt=0;attempt<3;attempt++){
      if(cloudState.session?.user.id!==owner)return;
      if(cloudEditing()){cloudSchedule(2000);return}
      const local=cloudCurrent(),base=cloudCache.base||local;
      const result=remote.data?cloudCore.merge(base,local,remote.data):{data:local,conflicts:[]};
      if(result.conflicts.length){cloudConflict(base,local,remote,result);return}
      cloudCore.assertDocument(result.data);
      if(remote.data&&cloudCore.equal(result.data,remote.data)&&!cloudCache.forceUpload){
        cloudCache={...cloudCache,revision:remote.revision,base:remote.data,lastSynced:new Date().toISOString()};cloudApply(remote.data);cloudCacheSave();break;
      }
      const sent=result.data,ack=cloudCheckRemote(await cloudRPC('isabela_sync',{expected_revision:remote.revision,document:sent}));
      if(ack.conflict){remote=ack;continue}
      if(cloudState.session?.user.id!==owner)return;
      // Retain commits made locally while the upload was in flight.
      const duringRequest=cloudCore.merge(local,cloudCurrent(),sent);
      cloudCache={...cloudCache,revision:ack.revision,base:ack.data,lastSynced:new Date().toISOString(),forceUpload:false};
      if(duringRequest.conflicts.length){cloudConflict(local,cloudCurrent(),{...ack,data:sent},duringRequest);cloudCacheSave();return}
      cloudApply(duringRequest.data);cloudCacheSave();break;
    }
    cloudState.status='ready';cloudState.retry=0;cloudState.message=cloudDirty()?'Novas alterações aguardam o próximo envio.':'Tudo atualizado na nuvem.';
  }catch(error){cloudState.status='error';cloudState.message=cloudFriendly(error);if(error.code==='22023'||error.code==='42501'||error.code==='PGRST202'){cloudState.paused=true;cloudState.message=error.code==='22023'?error.message:cloudState.message}else{cloudState.retry=Math.min((cloudState.retry||0)+1,6);cloudSchedule(Math.min(60000,5000*2**cloudState.retry))}}
  finally{cloudState.busy=false;cloudRefresh();if(cloudDirty()&&cloudState.status==='ready'&&!cloudState.conflict)cloudSchedule(1000)}
}
function cloudSchedule(delay=800){clearTimeout(cloudState.timer);cloudState.timer=setTimeout(()=>{if(cloudCache.ready)void cloudSynchronize();else if(cloudState.session&&!cloudState.migration)void cloudDiscover()},delay)}
async function cloudSendCode(e){
  e.preventDefault();if(cloudState.authBusy||!cloudState.client||window.IsabelaCloudConfig?.emailDeliveryReady!==true)return;
  const email=$('#cloudemail').value.trim().toLowerCase();cloudState.email=email;cloudState.authBusy=true;cloudState.message='Solicitando código…';document.activeElement?.blur();cloudRefresh();
  try{const {error}=await cloudState.client.auth.signInWithOtp({email,options:{shouldCreateUser:true}});if(error)throw error;cloudState.requested=true;cloudState.message='Código solicitado. Confira sua caixa de entrada e a pasta de spam.'}
  catch(error){cloudState.message=cloudFriendly(error)}finally{cloudState.authBusy=false;cloudRefresh()}
}
async function cloudVerify(e){
  e.preventDefault();if(cloudState.authBusy)return;cloudState.code=$('#cloudcode').value.trim();cloudState.authBusy=true;cloudState.message='Verificando código…';document.activeElement?.blur();cloudRefresh();
  try{const {data,error}=await cloudState.client.auth.verifyOtp({email:cloudState.email,token:cloudState.code,type:'email'});if(error)throw error;cloudState.code='';await cloudSetSession(data.session)}catch(error){cloudState.message=cloudFriendly(error)}finally{cloudState.authBusy=false;cloudRefresh()}
}
async function cloudSetSession(session){const previous=cloudState.session?.user.id;cloudState.session=session;cloudState.paused=false;if(session){cloudState.email=session.user.email||'';cloudState.message='Aparelho autenticado.';if(previous!==session.user.id)await cloudDiscover()}else{cloudState.migration=null;cloudState.conflict=null;cloudState.status='local';cloudRefresh()}}
function bindCloudSettings(){
  const on=(id,event,fn)=>{const el=$(id);if(el)el[event]=fn};
  on('#cloudemail','oninput',e=>cloudState.email=e.target.value);on('#cloudcode','oninput',e=>cloudState.code=e.target.value);
  on('#cloudemailform','onsubmit',cloudSendCode);on('#cloudcodeform','onsubmit',cloudVerify);
  on('#cloudsync','onclick',()=>{cloudState.paused=false;void cloudSynchronize(true)});
  on('#cloudmigrate','onclick',()=>void cloudMigrate());on('#cloudusecloud','onclick',()=>void cloudMigrate(true));
  on('#cloudsignout','onclick',()=>{modal(`<h2>Desvincular este aparelho?</h2><p>Os dados continuam neste aparelho e na nuvem. ${cloudDirty()?'Há alterações locais ainda não enviadas. Elas serão retomadas quando você ativar este aparelho novamente.':''}</p><div class="modal-actions"><button id="cloudcancelout">Cancelar</button><button id="cloudconfirmout">Desvincular</button></div>`);$('#cloudcancelout').onclick=close;$('#cloudconfirmout').onclick=async()=>{const {error}=await cloudState.client.auth.signOut({scope:'local'});if(error){toast(cloudFriendly(error));return}close();await cloudSetSession(null);render()}});
  on('#cloudbackup','onclick',()=>{try{const backup=JSON.parse(localStorage.getItem(cloudBackupKey));const url=URL.createObjectURL(new Blob([JSON.stringify(backup.data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='isabela-antes-da-sincronizacao.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch{cloudMessage('Não foi possível abrir a cópia anterior.')}});
  on('#cloudconflictform','onsubmit',async e=>{e.preventDefault();const conflict=cloudState.conflict;if(!conflict)return;const f=new FormData(e.target),choices={};conflict.result.conflicts.forEach((c,i)=>choices[c.key]=f.get('conflict'+i));const result=cloudCore.merge(conflict.base,conflict.local,conflict.remote.data,choices);if(result.conflicts.length)return;
    try{const latest=cloudCurrent(),rebased=cloudCore.merge(conflict.local,latest,result.data);if(rebased.conflicts.length){cloudConflict(conflict.local,latest,{...conflict.remote,data:result.data},rebased);return}cloudCore.assertDocument(rebased.data);cloudApply(rebased.data);cloudCache.base=conflict.remote.data;cloudCache.revision=conflict.remote.revision;cloudState.conflict=null;cloudState.paused=false;cloudCacheSave();document.activeElement?.blur();await cloudSynchronize(true)}catch(error){cloudMessage(error.message)}});
}
window.IsabelaCloud={changed(){cloudState.paused=false;if(cloudState.session){cloudSchedule();cloudRefresh()}},sync:cloudSynchronize};
(async function cloudStart(){
 try{
  const config=window.IsabelaCloudConfig;
  if(!window.IsabelaSupabase?.createClient||!config?.url||!config?.publishableKey){cloudState.message='A conexão com a nuvem não está disponível nesta versão.';return}
  cloudState.client=window.IsabelaSupabase.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'isabela-auth-v1'},global:{fetch:(url,options={})=>fetch(url,{...options,signal:options.signal||AbortSignal.timeout(25000)})}});
  cloudState.client.auth.onAuthStateChange((event,session)=>{if(event!=='INITIAL_SESSION')setTimeout(()=>void cloudSetSession(session),0)});
  const {data,error}=await cloudState.client.auth.getSession();if(error)cloudState.message=cloudFriendly(error);else await cloudSetSession(data.session);
  cloudRefresh();window.addEventListener('online',()=>cloudSchedule(50));window.addEventListener('offline',cloudRefresh);
  window.addEventListener('focus',()=>cloudSchedule(100));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')cloudSchedule(100)});
  setInterval(()=>{if(document.visibilityState!=='hidden')cloudSchedule(100)},30000);
  $('#modal')?.addEventListener('close',()=>cloudSchedule(100));
 }catch(error){cloudState.status='error';cloudState.message=cloudFriendly(error);cloudRefresh()}
})();

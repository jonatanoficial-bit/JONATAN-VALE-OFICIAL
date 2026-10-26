import { people, roomCatalog } from './content.js';
import { additionalRooms, chapters, caseTasks } from './campaign.js';
import { topics, topicRestriction, wasTopicUsed } from './phone.js';
import { bindMapControls } from './map.js';
import { exportSave, importSave, listSaves, listAutoSave, listCareerSafety, loadLatestGame, loadGame, saveGame } from './persistence.js';
import { playCue, setAudioActive } from './audio.js';
import { t } from './i18n.js';
import { renderApp, lookupOpeningChoice, lookupVehicle } from './render.js';
import { advanceWorld, worldTime } from './sim.js';
import { createInitialState, reducer } from './state.js';
const root=document.querySelector('#app'),toastRegion=document.querySelector('#toast-region');
let state=createInitialState(),ui={hasSave:false,saveSlots:null,selectedIncident:null,selectedIncoming:null,selectedRoom:null,selectedContact:'P04',callResult:null,selectedArt:null};
let saveChain=Promise.resolve(),restoreFocusKey=null,installPrompt=null;
const focusKey=element=>element?.dataset?JSON.stringify(Object.entries(element.dataset).sort()):null;
const focusable='button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]';
function toast(message,tone='info'){const element=document.createElement('div');element.className='toast toast-'+tone;element.textContent=message;toastRegion.append(element);while(toastRegion.children.length>3)toastRegion.firstChild.remove();setTimeout(()=>element.remove(),4500);}
function cue(kind='click'){playCue(kind,state.settings);}
function render(){
 const pageScroll=window.scrollY;
 const oldDialog=root.querySelector('[role="dialog"]'),active=root.contains(document.activeElement)?document.activeElement:null;
 const key=focusKey(active),scrolls=['.main-content','.contact-list','.sidebar nav','.chapter-list'].map(selector=>({selector,top:root.querySelector(selector)?.scrollTop||0,left:root.querySelector(selector)?.scrollLeft||0}));
 if(!oldDialog&&active)restoreFocusKey=key;
 root.innerHTML=renderApp(state,ui);
 document.body.classList.toggle('dialog-open',!!root.querySelector('[role="dialog"]'));
 setAudioActive(state.settings.sound&&!document.hidden);
 document.documentElement.classList.toggle('high-contrast',state.settings.highContrast);document.documentElement.classList.toggle('reduced-motion',state.settings.reducedMotion);document.documentElement.style.setProperty('--font-scale',state.settings.fontScale);
 if(state.career?.status==='dismissed')root.querySelectorAll('[data-action]').forEach(element=>{if(!['navigate','new-game','confirm-new','continue','open-saves','quick-save','save-slot','confirm-save','load-slot','export-save','close-modal','view-art','install-app','confirm-import'].includes(element.dataset.action))element.disabled=true;});
 for(const item of scrolls){const element=root.querySelector(item.selector);if(element){element.scrollTop=item.top;element.scrollLeft=item.left;}}
 window.scrollTo({top:pageScroll,behavior:'instant'});
 if(state.screen==='map')bindMapControls(root);
 root.querySelector('#import-save')?.addEventListener('change',onImport);
 const dialog=root.querySelector('[role="dialog"]');
 if(dialog){root.querySelectorAll('.sidebar,.top-hud,.main-content').forEach(el=>el.inert=true);const next=oldDialog?[...dialog.querySelectorAll(focusable)].find(el=>focusKey(el)===key):null;(next||dialog.querySelector(focusable))?.focus({preventScroll:true});}
 else {const next=[...root.querySelectorAll(focusable)].find(el=>focusKey(el)===(oldDialog?restoreFocusKey:key));next?.focus({preventScroll:true});}
}
function autosave(){const snapshot=structuredClone(state);saveChain=saveChain.then(()=>saveGame(snapshot,0,'autosave')).then(saved=>{state.lastSavedAt=saved.lastSavedAt;ui.hasSave=true;}).catch(()=>toast('O salvamento automático falhou. Exporte um backup.','warning'));return saveChain;}
function commit(action,{save=false,message=''}={}){const next=reducer(state,action);if(next===state){toast('Verifique os recursos, a disponibilidade e os requisitos dessa ação.','warning');return false;}state=next;render();if(save)autosave();if(message)toast(message,'success');return true;}
function navigate(screen){ui.selectedIncident=null;ui.selectedIncoming=null;ui.callResult=null;ui.selectedArt=null;commit({type:'NAVIGATE',screen});const main=root.querySelector('.main-content');if(main)main.scrollTop=0;window.scrollTo({top:0,behavior:'instant'});}
async function refreshSaves(){[ui.saveSlots,ui.autoSave,ui.careerSafety]=await Promise.all([listSaves(),listAutoSave(),listCareerSafety()]);ui.hasSave=[...ui.saveSlots,ui.autoSave].some(s=>s&&!s.empty&&!s.corrupt);}
async function quickSave(slot=1){try{const saved=await saveGame(state,slot,'manual');state.lastSavedAt=saved.lastSavedAt;await refreshSaves();render();toast(t('save.saved',{slot}),'success');}catch(e){toast(e.message,'warning');}}
async function loadSlot(slot=null){try{await saveChain;const loaded=slot===null?await loadLatestGame():await loadGame(slot);if(!loaded)return toast('Este arquivo está vazio.','warning');state=loaded;state.speed=0;if(['title','saves','gallery','settings'].includes(state.screen))state.screen=state.storyStage==='office'?'office':'intro';ui={...ui,selectedIncident:null,selectedIncoming:null,callResult:null,selectedArt:null,confirm:null};render();autosave();toast(t('save.restored'),'success');}catch(e){toast(e.message,'warning');}}
function advance(minutes,{automatic=false}={}){
 if(state.career?.status==='dismissed')return toast('O mandato terminou. Você pode consultar o histórico ou começar outra carreira.','warning');
 const before=state,previousStop=state.director?.lastStop;
 const next=advanceWorld(state,minutes,{interrupt:true});
 const stopped=next.director?.lastStop&&JSON.stringify(next.director.lastStop)!==JSON.stringify(previousStop);
 const dismissed=next.career?.status==='dismissed'&&before.career?.status!=='dismissed';
 if(dismissed){const snapshot=structuredClone(before);saveChain=saveChain.then(()=>saveGame(snapshot,4,'career-safety')).then(()=>{ui.careerSafety={slot:4,day:snapshot.day,savedAt:new Date().toISOString()};if(state.career.status==='dismissed')render();}).catch(()=>toast('Não foi possível criar o backup anterior à decisão. Seus arquivos manuais continuam disponíveis.','warning'));next.screen='campaign';ui.selectedIncident=null;ui.selectedIncoming=null;}
 state=next;
 if(ui.selectedIncident&&!state.activeIncidents.some(i=>i.id===ui.selectedIncident))ui.selectedIncident=null;
 if(ui.selectedIncoming&&!state.incomingCalls?.some(c=>c.id===ui.selectedIncoming&&c.status==='ringing'))ui.selectedIncoming=null;
 render();
 if(stopped){cue(state.director.lastStop.type==='call'?'call':'warning');toast(state.director.lastStop.title+' O relógio foi pausado.','info');}
 if(!automatic||stopped||before.day!==state.day||dismissed)autosave();
}
async function onImport(event){try{const imported=await importSave(event.target.files?.[0]);ui.pendingImport=imported;ui.confirm={kind:'import',title:'Importar campanha',text:'Escolha o arquivo de destino. O progresso atual será preservado no salvamento automático antes da importação.'};render();}catch(e){toast(e.message,'warning');}}
function closeModal(){ui.selectedIncident=null;ui.selectedIncoming=null;ui.callResult=null;ui.selectedArt=null;ui.confirm=null;ui.pendingImport=null;render();}
function startNewGame(){const preferences={...state.settings};state=createInitialState(Date.now()>>>0);state.settings=preferences;state.screen='intro';ui={...ui,selectedIncident:null,selectedIncoming:null,callResult:null,selectedArt:null,confirm:null};render();}
root.addEventListener('click',async event=>{
 const target=event.target.closest('[data-action]');if(!target||target.disabled)return;const action=target.dataset.action;cue(action==='phone-call'?'call':'click');
 if(action==='new-game'){if(ui.hasSave){ui.confirm={kind:'new',title:'Iniciar outra gestão?',text:'Os arquivos manuais serão mantidos. O salvamento automático passará a acompanhar a nova campanha após a primeira decisão.'};render();}else startNewGame();return;}
 if(action==='navigate'){if(target.dataset.screen==='saves')await refreshSaves();return navigate(target.dataset.screen);}
 if(action==='continue')return loadSlot();
 if(action==='confirm-new'){startNewGame();return;}
 if(action==='confirm-import'){const imported=ui.pendingImport;if(!imported)return;const slot=Number(target.dataset.slot);try{await saveChain;if(state.storyStage==='office')await saveGame(state,0,'backup-before-import');await saveGame(imported,slot,'import');ui.confirm=null;ui.pendingImport=null;await loadSlot(slot);await refreshSaves();toast('Backup importado no arquivo '+slot+'.','success');}catch(e){toast(e.message,'warning');}return;}
 if(action==='confirm-save'){const slot=ui.confirm?.slot;ui.confirm=null;if(slot)await quickSave(slot);return;}
 if(action==='dismiss-tutorial')return commit({type:'DISMISS_TUTORIAL'},{save:true});
 if(action==='continue-campaign')return commit({type:'CONTINUE_CAMPAIGN'},{save:true,message:'A gestão continua em modo livre.'});
 if(action==='install-app'){if(!installPrompt)return toast('No menu do navegador, use Instalar aplicativo ou Adicionar à tela inicial.');await installPrompt.prompt();installPrompt=null;ui.canInstall=false;render();return;}
 if(action==='restart'){state=createInitialState();return render();}
 if(action==='open-saves'){await refreshSaves();navigate('saves');return;}
 if(action==='opening-choice'){const choice=lookupOpeningChoice(target.dataset.choice);commit({type:'OPENING_CHOICE',choice});render();autosave();return;}
 if(action==='accept-second-call'){commit({type:'ACCEPT_SECOND_CALL'});render();autosave();return;}
 if(action==='answer-incoming'){ui.selectedIncoming=target.dataset.id;ui.selectedIncident=null;ui.callResult=null;state=reducer(state,{type:'SET_SPEED',speed:0});render();return;}
 if(action==='respond-incoming'){const call=state.incomingCalls?.find(c=>c.id===target.dataset.id),choice=call?.choices.find(c=>c.id===target.dataset.choice);if(!call||!choice)return;if(commit({type:'RESPOND_INCOMING_CALL',id:call.id,choiceId:choice.id},{save:true})){ui.selectedIncoming=null;ui.callResult={personId:call.personId,title:call.title,result:choice.result};render();}return;}
 if(action==='defer-incoming'){if(commit({type:'DEFER_INCOMING_CALL',id:target.dataset.id},{save:true,message:'A secretaria registrou o retorno. A ligação reaparecerá no horário combinado.'})){ui.selectedIncoming=null;render();}return;}
 if(action==='crisis-decision')return commit({type:'CRISIS_DECISION',id:target.dataset.id,choiceId:target.dataset.choice},{save:true,message:'Decisão comunicada. Aguarde a atualização das equipes.'});
 if(action==='career-plan')return commit({type:'CAREER_PLAN',plan:target.dataset.plan},{save:true,message:'Plano autorizado. Os resultados exigem tempo de execução.'});
 if(action==='pay-arrears')return commit({type:'PAY_ARREARS'},{save:true,message:'Obrigações regularizadas até o limite do caixa disponível.'});
 if(action==='wait-next-event'){advance(480);return;}
 if(action==='select-contact'){ui.selectedContact=target.dataset.id;navigate('phone');return;}
 if(action==='phone-call'){
  const p=target.dataset.person,t=topics[p]?.find(t=>t.id===target.dataset.topic);if(!t)return;
  const reason=topicRestriction(state,t),already=wasTopicUsed(state,p,t.id);
  const result=reason?reason+' A secretaria registrou a consulta e indicou os requisitos.':already?'Esta pauta já foi registrada. O acordo permanece válido e os efeitos não se repetem.':t.result;
  if(!reason&&!already){if(!commit({type:'PHONE_CALL',payload:{personId:p,topic:t.id,result,effects:t.effects}},{save:true}))return;}
  ui.callResult={personId:p,title:t.title,result};render();return;
 }
 if(action==='purchase')return commit({type:'PURCHASE',item:lookupVehicle(target.dataset.type)},{save:true,message:'Aquisição autorizada. Entrega prevista em uma hora de jogo.'});
 if(action==='hire')return commit({type:'HIRE',person:state.candidatePool.find(c=>c.id===target.dataset.id)},{save:true,message:'Contratação concluída e folha atualizada.'});
 if(action==='select-room'){ui.selectedRoom=ui.selectedRoom===target.dataset.room?null:target.dataset.room;render();return;}
 if(action==='place-room'){if(!ui.selectedRoom)return;const room=[...roomCatalog,...additionalRooms].find(r=>r.type===ui.selectedRoom);if(commit({type:'PLACE_ROOM',payload:{room,x:Number(target.dataset.x),y:Number(target.dataset.y)}},{save:true,message:'Obra autorizada. O prazo está no registro de comando.'})){ui.selectedRoom=null;render();}return;}
 if(action==='open-incident'){ui.selectedIncident=target.dataset.id;ui.callResult=null;render();return;}
 if(action==='close-modal'){closeModal();return;}
 if(action==='dispatch')return commit({type:'DISPATCH',incidentId:target.dataset.incident,vehicleId:target.dataset.vehicle},{save:true,message:'Unidade despachada. A rota e o ETA estão no centro de comando.'});
 if(action==='resolve-incident'){if(commit({type:'RESOLVE_INCIDENT',incidentId:target.dataset.id,choice:target.dataset.choice},{save:true,message:'Ocorrência concluída e efeitos registrados.'})){ui.selectedIncident=null;render();}return;}
 if(action==='case-task'){const task=caseTasks.find(t=>t.id===target.dataset.id);return commit({type:'START_CASE_TASK',payload:task},{save:true,message:'Diligência autorizada. Acompanhe o prazo no caso.'});}
 if(action==='case-hypothesis')return commit({type:'CASE_HYPOTHESIS',hypothesis:target.dataset.hypothesis},{save:true,message:'Revisão registrada no caso.'});
 if(action==='maintain-vehicle')return commit({type:'MAINTAIN_VEHICLE',id:target.dataset.id},{save:true,message:'Veículo encaminhado à manutenção.'});
 if(action==='staff-order')return commit({type:'STAFF_ORDER',id:target.dataset.id,order:target.dataset.order},{save:true,message:'Ordem registrada na escala do profissional.'});
 if(action==='campaign-decision'){const chapter=chapters.find(c=>c.id===target.dataset.chapter),choice=chapter.choices.find(c=>c.id===target.dataset.choice);return commit({type:'CAMPAIGN_DECISION',payload:{chapter,choice}},{save:true,message:'Decisão registrada. O legado da gestão foi atualizado.'});}
 if(action==='next-chapter'||action==='advance-day'){advance(480);return;}
 if(action==='advance-time'){advance(Number(target.dataset.minutes));return;}
 if(action==='set-speed')return commit({type:'SET_SPEED',speed:Number(target.dataset.speed)});
 if(action==='quick-save')return quickSave(1);
 if(action==='save-slot'){const slot=Number(target.dataset.slot),existing=ui.saveSlots?.find(s=>s.slot===slot);if(existing&&!existing.empty){ui.confirm={kind:'save',slot,title:'Substituir arquivo '+slot+'?',text:'O progresso gravado neste arquivo será substituído pela gestão atual. Você pode cancelar e exportar um backup antes.'};render();return;}return quickSave(slot);}
 if(action==='load-slot')return loadSlot(Number(target.dataset.slot));
 if(action==='export-save'){exportSave(state);return toast('Backup preparado para download.','success');}
 if(action==='view-art'){ui.selectedArt=target.dataset.id;render();}
});
root.addEventListener('change',event=>{const t=event.target.closest('[data-setting]');if(!t)return;const key=t.dataset.setting,value=t.type==='checkbox'?t.checked:Number(t.value);commit({type:'UPDATE_SETTINGS',settings:{[key]:value}},{save:state.storyStage==='office'});try{localStorage.setItem('comissario-preferences',JSON.stringify(state.settings));}catch{}});
document.addEventListener('keydown',event=>{
 const dialog=root.querySelector('[role="dialog"]');
 if(dialog&&event.key==='Tab'){const items=[...dialog.querySelectorAll(focusable)];if(!items.length)return;const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}return;}
 if(event.key==='Escape'&&dialog){event.preventDefault();closeModal();return;}
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 if(event.key==='Escape'){ui.selectedIncident=null;ui.callResult=null;ui.selectedArt=null;if(!['title','intro'].includes(state.screen))navigate(state.storyStage==='office'?'office':'title');else render();}
 if(event.code==='Space'&&document.activeElement?.tagName!=='BUTTON'&&state.storyStage==='office'){event.preventDefault();commit({type:'SET_SPEED',speed:state.speed?0:1});}
 if(['1','2','3'].includes(event.key)&&state.storyStage==='office')commit({type:'SET_SPEED',speed:[1,3,6][Number(event.key)-1]});
});
setInterval(()=>{if(document.hidden||!state.speed||state.storyStage!=='office'||state.career?.status==='dismissed'||['settings','saves','gallery'].includes(state.screen)||root.querySelector('[role="dialog"]')||document.activeElement?.tagName==='INPUT'||root.querySelector('button:active'))return;advance(state.speed,{automatic:true});},2000);
setInterval(()=>{if(state.storyStage==='office')autosave();},30000);
document.addEventListener('visibilitychange',()=>{setAudioActive(!document.hidden&&state.settings.sound);if(document.hidden&&state.storyStage==='office')autosave();});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;ui.canInstall=true;if(state.screen==='settings')render();});
window.addEventListener('online',()=>toast('Conexão restabelecida. Seus arquivos continuam neste dispositivo.'));
window.addEventListener('offline',()=>toast('Sem conexão. A campanha e os backups locais continuam disponíveis.'));
async function boot(){try{const pref=JSON.parse(localStorage.getItem('comissario-preferences')||'null');if(pref)state=reducer(state,{type:'UPDATE_SETTINGS',settings:pref});}catch{}await refreshSaves();render();if('serviceWorker'in navigator&&location.protocol.startsWith('http')){navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>toast('Cache offline indisponível. Você pode exportar seu progresso.','warning'));}}
boot().catch(error=>{root.textContent='Falha ao iniciar a aplicação: '+error.message;});

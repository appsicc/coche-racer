const STORAGE_KEY="diagnosticsCenterData";
const MODULE_KEYS=[["garageCodesData","Códigos de garaje"],["posterCreatorData","Creador de pósters"],["trailerModeData","Modo tráiler"],["showroomProData","Showroom Pro"],["economyAdvancedData","Banco"],["partsProData","Piezas Pro"],["sponsorsData","Patrocinadores"],["seasonPassData","Temporada"],["pilotProfileData","Piloto Pro"],["skillChallengesData","Retos habilidad"],["replayModeData","Repetición"],["customRoutesData","Rutas"],["graphicsSettingsData","Gráficos"],["engineAudioProData","Motor Pro"]];
export const diagnosticsCenterState={data:loadData(),report:null};
export function setupDiagnosticsCenter(state,showScreen){
 state.diagnosticsCenter=diagnosticsCenterState;
 const btn=document.getElementById("diagnosticsBtn");
 if(btn)btn.onclick=()=>{runDiagnostics(state,false);showScreen("diagnosticsScreen");};
 const run=document.getElementById("runDiagnostics"); if(run)run.onclick=()=>runDiagnostics(state,true);
 const exp=document.getElementById("diagnosticsExportReport"); if(exp)exp.onclick=()=>exportReport(state);
 const clean=document.getElementById("diagnosticsCleanSoft"); if(clean)clean.onclick=()=>softClean(state);
 const cache=document.getElementById("diagnosticsRefreshCache"); if(cache)cache.onclick=()=>{localStorage.setItem("lastCacheRefreshRequest",new Date().toISOString());runDiagnostics(state,true);window.showToast?.("Caché marcada para refresco");};
 runDiagnostics(state,false);
}
export function updateDiagnosticsCenter(){updateDiagnosticsHUD();}
function runDiagnostics(state,notify){const report=buildReport(state);diagnosticsCenterState.report=report;diagnosticsCenterState.data.lastRun=new Date().toISOString();diagnosticsCenterState.data.lastScore=report.score;saveData();renderReport(report);if(notify)window.showToast?.("Diagnóstico completado: "+report.score+"/100");}
function buildReport(state){
 const modules=MODULE_KEYS.map(([key,label])=>{const raw=localStorage.getItem(key);const parsed=safeJSON(raw,null);const size=raw?raw.length:0;const status=raw?(parsed?"ok":"bad"):"warn";return{key,label,status,size,note:raw?(parsed?"Datos correctos":"JSON dañado"):"Sin datos todavía"};});
 const storageUsed=estimateStorage();const wallet=Number(localStorage.getItem("walletCoins")||0);const selectedCar=Number(localStorage.getItem("selectedCarIndex")||state.selectedCarIndex||0);const selectedMap=Number(localStorage.getItem("selectedMapIndex")||state.selectedMapIndex||0);const fps=Number(state.graphicsSettings?.estimatedFPS||0);const carCount=state.manifest?.cars?.length||0;const mapCount=state.manifest?.maps?.length||0;
 const recommendations=[];let score=100;
 modules.forEach(m=>{if(m.status==="bad"){score-=10;recommendations.push("Revisa "+m.label+": parece tener datos dañados.");}else if(m.status==="warn"){score-=1;}});
 if(storageUsed>750000){score-=8;recommendations.push("El guardado local pesa bastante. Usa limpieza suave si notas lentitud.");}
 if(fps&&fps<28){score-=12;recommendations.push("FPS bajos detectados. Usa perfil gráfico Móvil rápido.");}
 if(wallet<100)recommendations.push("Tienes pocas monedas. Completa temporada, patrocinadores o rutas.");
 if(selectedCar>=carCount&&carCount>0){score-=8;recommendations.push("El coche seleccionado no existe en el manifest.");}
 if(selectedMap>=mapCount&&mapCount>0){score-=8;recommendations.push("El mapa seleccionado no existe en el manifest.");}
 if(!recommendations.length)recommendations.push("Todo parece estable. Puedes seguir creando contenido y probar nuevas funciones.");
 score=Math.max(0,Math.min(100,Math.round(score)));
 return{createdAt:new Date().toISOString(),score,status:score>=85?"Excelente":score>=65?"Correcto":score>=45?"Revisar":"Crítico",modules,storage:{used:storageUsed,wallet,selectedCar,selectedMap,carCount,mapCount,fps},recommendations};
}
function renderReport(report){
 setText("diagnosticsScore",report.score+"/100");setText("diagnosticsStatus",report.status);setText("diagnosticsLastRun",formatDate(report.createdAt));const fill=document.getElementById("diagnosticsFill");if(fill)fill.style.width=report.score+"%";
 const modules=document.getElementById("diagnosticsModules");if(modules)modules.innerHTML=report.modules.map(m=>`<div class="diagnostics-row ${m.status}"><b>${statusIcon(m.status)} ${escapeHTML(m.label)}</b><p>${escapeHTML(m.note)} · ${m.size} chars</p></div>`).join("");
 const storage=document.getElementById("diagnosticsStorage");if(storage){const s=report.storage;const rows=[["LocalStorage usado",formatBytes(s.used)],["Monedas",String(s.wallet)],["Coche seleccionado",s.selectedCar+"/"+Math.max(0,s.carCount-1)],["Mapa seleccionado",s.selectedMap+"/"+Math.max(0,s.mapCount-1)],["FPS estimado",s.fps?String(s.fps):"--"]];storage.innerHTML=rows.map(([k,v])=>`<div class="diagnostics-row ok"><b>${escapeHTML(k)}</b><p>${escapeHTML(v)}</p></div>`).join("");}
 const rec=document.getElementById("diagnosticsRecommendations");if(rec)rec.innerHTML=report.recommendations.map(text=>`<div class="diagnostics-row ${report.score>=80?"ok":"warn"}"><b>Recomendación</b><p>${escapeHTML(text)}</p></div>`).join("");
 updateDiagnosticsHUD();
}
function exportReport(state){const report=diagnosticsCenterState.report||buildReport(state);const blob=new Blob([JSON.stringify(report,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="diagnostico_racing_realista_v67.json";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
function softClean(state){["telemetryProData","damageProData","extremeWeatherData","posterCreatorData","trailerModeData"].forEach(key=>{const data=safeJSON(localStorage.getItem(key),null);if(!data)return;if(Array.isArray(data.history))data.history=data.history.slice(0,8);if(Array.isArray(data.log))data.log=data.log.slice(0,8);if(Array.isArray(data.runs))data.runs=data.runs.slice(0,8);if(Array.isArray(data.saved))data.saved=data.saved.slice(0,4);localStorage.setItem(key,JSON.stringify(data));});runDiagnostics(state,true);window.showToast?.("Limpieza suave completada");}
function updateDiagnosticsHUD(){const hud=document.getElementById("hudDiagnostics");if(!hud)return;const score=diagnosticsCenterState.data.lastScore||0;hud.textContent=score?score+"/100":"--";}
function estimateStorage(){let total=0;for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);total+=key.length+(localStorage.getItem(key)||"").length;}return total;}
function statusIcon(status){return status==="ok"?"✅":status==="bad"?"❌":"⚠️";}
function safeJSON(raw,fallback){try{return raw?JSON.parse(raw):fallback;}catch{return fallback;}}
function loadData(){try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");return data&&typeof data.lastScore==="number"?data:createData();}catch{return createData();}}
function createData(){return{lastRun:null,lastScore:0};}
function saveData(){localStorage.setItem(STORAGE_KEY,JSON.stringify(diagnosticsCenterState.data));}
function formatBytes(bytes){if(bytes<1024)return bytes+" B";if(bytes<1024*1024)return Math.round(bytes/1024)+" KB";return(bytes/1024/1024).toFixed(1)+" MB";}
function formatDate(date){try{return new Date(date).toLocaleString();}catch{return"--";}}
function escapeHTML(text){return String(text).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}

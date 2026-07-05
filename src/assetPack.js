export const assetPackState={assets:[
{id:"car",name:"Coche deportivo futurista",path:"assets/generated/futuristic_sport_car_black_neon.svg"},
{id:"map",name:"Ciudad nocturna cyberpunk",path:"assets/generated/night_cyberpunk_city_race_map.svg"},
{id:"nitro",name:"Icono de nitro",path:"assets/generated/nitro_icon_blue_bottle.svg"},
{id:"coin",name:"Moneda dorada",path:"assets/generated/gold_racing_coin.svg"},
{id:"barrel",name:"Barril obstáculo",path:"assets/generated/red_metal_barrel_obstacle.svg"}]};
export function setupAssetPack(state,showScreen){state.assetPack=assetPackState;const btn=document.getElementById("assetPackBtn");if(btn)btn.onclick=()=>{renderAssetPack();showScreen("assetPackScreen");};renderAssetPack();}
export function updateAssetPack(){const hud=document.getElementById("hudAssetPack");if(hud)hud.textContent=assetPackState.assets.length+" assets";}
function renderAssetPack(){const list=document.getElementById("assetPackList");if(!list)return;list.innerHTML=assetPackState.assets.map(asset=>`<div class="asset-pack-row"><img src="${asset.path}" alt="${asset.name}"><div><b>${asset.name}</b><p>${asset.path}</p></div></div>`).join("");}
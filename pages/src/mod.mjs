import * as common from '/pages/src/common.mjs';

const doc = document.documentElement;
doc.classList.remove("frame");

const DEBUG       = "";//"/debug";
var   USER        = 0;
const SERVER      = (DEBUG!="")?"http://arwen.lan:5000":"https://ladder.cycleracing.club";

var INTERESTEDIN = [];

const scoreForPos = pos=>[12,10,8,7,6,5,4,3,2,1][pos-1]??0;
const tops        = Array.from(Array(12).keys()).map( (a,i)=>( 10+ (45*(i-1)) ));


var positionsCreated = 0;
const riderHTML = (riderId,isHome) =>{
    if (positionsCreated>=10) return "";
    let thisPos = ++positionsCreated;
    let output =
    `<div class="rider ${isHome?"home":"away"}Rider scaleMe" data-rider-id="${riderId}" data-move-to-position="${thisPos}" data-original-height="40" data-scale="onlyHeight">
        <div class="score forHome scaleMe" data-font-size="25" data-line-height="40" data-scale="textOnly"> ${scoreForPos(thisPos)} </div>
        <div class="name forHome text-truncate scaleMe" data-font-size="25" data-line-height="40" data-scale="textOnly">  </div>
        <div class="position scaleMe" data-font-size="18" data-line-height="40" data-scale="textOnly"> ${thisPos} </div>
        <div class="name forAway text-truncate scaleMe" data-font-size="25" data-line-height="40" data-scale="textOnly">  </div>
        <div class="score forAway scaleMe" data-font-size="25" data-line-height="40" data-scale="textOnly"> ${scoreForPos(thisPos)} </div>
    </div>`;
    return output;
}
async function fetchFromLadder(){
    if (USER==0) return null;
    console.log("Setting up",`${SERVER}/whatFixtureShouldIBeIn/${USER}${DEBUG}`);
    let myLadderData = await fetch(`${SERVER}/whatFixtureShouldIBeIn/${USER}${DEBUG}`).then(response=>response.json());
    if (!myLadderData || myLadderData.length==0){
        console.log("Timeout here and try again later",myLadderData);
        return null;
    }
    myLadderData = myLadderData?.[0] || [];

    INTERESTEDIN = [...JSON.parse(myLadderData?.homeSignups),...JSON.parse(myLadderData?.awaySignups)];
    console.log("Found riders from ladder :", INTERESTEDIN, myLadderData);
    renderOneOffs(myLadderData, INTERESTEDIN);
    return true;
}
async function main() {
    // common.initInteractionListeners();
    let refresh;
    const setRefresh = () => {
        refresh = 1 * 1000 - 100; // 1s
    };
    setRefresh();

    common.subscribe('athlete/watching', async data => {
        // console.log(data.athleteId, USER);
        let olduser = USER;
        if (data.athleteId != USER){
            USER         = data.athleteId;
            console.log("Switched to ",USER);
            // INTERESTEDIN = [];
            if (USER!=0) await fetchFromLadder();
        }
    });

    await fetchFromLadder();

    let lastRefresh = 0;
    common.subscribe('nearby', data => {
        try{
            data = data.filter(x => INTERESTEDIN.includes(x.athleteId));
        } catch {}
        data.sort( (a,b)=>{
            a.state.eventDistance - b.state.eventDistance; // will mostly be correct since eventPosition doesn't exist ?!
        })
        // console.log("nearby",data);
        const elapsed = Date.now() - lastRefresh;
        if (elapsed >= refresh) {
            lastRefresh = Date.now();
            renderData(data);
        }
    });
}

main();

function renderData(data){
  resizeFunc();

    document.querySelectorAll(".position").forEach(e=>e.textContent="-1");
    let homeScore = 0;
    let awayScore = 0;
    let position = 0;
    for(let rider of data){
        // console.log("Rendering for ", rider.athleteId);
        let domForRider = document.querySelector(`.rider[data-rider-id="${rider.athlete.id}"]`);
        if (!domForRider){
            console.error("Didn't find HTML for ",rider.athlete.id);
            continue;
        }
        let riderPos = ++position;
        domForRider.querySelectorAll(".score").forEach(e=>e.textContent=scoreForPos(riderPos));
        domForRider.querySelector(".position").textContent=riderPos;
        domForRider.querySelectorAll(".name").forEach(e=>e.textContent=rider.athlete.sanitizedFullname);
        domForRider.style.position = "absolute";
        domForRider.style.top = `${tops[riderPos]}px`;
    }
    document.querySelectorAll(".rider").forEach(e=>{
        if (e.querySelector(".position").textContent=="-1"){
            e.classList.add("hide");
        } else {
            e.classList.remove("hide");
        }
        if (!e.classList.contains("hide")){
            if (e.classList.contains("homeRider")) homeScore += ~~(e.querySelector(".score").textContent);
            if (e.classList.contains("awayRider")) awayScore += ~~(e.querySelector(".score").textContent);
        }
    });
    let homeScoreDom = document.querySelector(".homeScore");
    let awayScoreDom = document.querySelector(".awayScore");

    awayScoreDom.textContent = awayScore;
    homeScoreDom.textContent = homeScore;
    if (homeScore>awayScore){
        homeScoreDom.classList.remove("losing");
        homeScoreDom.classList.add("winning");
        awayScoreDom.classList.remove("winning");
        awayScoreDom.classList.add("losing");
    } else if (homeScore<awayScore){
        homeScoreDom.classList.remove("winning");
        homeScoreDom.classList.add("losing");
        awayScoreDom.classList.remove("losing");
        awayScoreDom.classList.add("winning");
    } else {
        homeScoreDom.classList.remove("winning");
        homeScoreDom.classList.remove("losing");
        awayScoreDom.classList.remove("winning");
        awayScoreDom.classList.remove("losing");
    }
}
function renderOneOffs(data, ids){
    document.querySelector(".SplashHomeTeam").textContent = data.homeTeamName;
    document.querySelector(".SplashAwayTeam").textContent = data.awayTeamName;
    document.querySelector(".homeScore").textContent = 0;
    document.querySelector(".awayScore").textContent = 0;
    let domDest = document.querySelector(".scoreList");
    positionsCreated = 0;
    domDest.innerHTML = "";
    data.homeSignups = JSON.parse(data.homeSignups);
    data.awaySignups = JSON.parse(data.awaySignups);
    for(let id of ids){
        if (domDest){
            let thisCard = riderHTML(id, data.homeSignups.includes(id));
            // console.log(id,thisCard);
            domDest.insertAdjacentHTML('beforeend', thisCard);
        }
    }
}

function testCards(){
    document.querySelector(".SplashHomeTeam").textContent = "My Home Team";
    document.querySelector(".SplashAwayTeam").textContent = "My Away Team";
    document.querySelector(".homeScore").textContent = 0;
    document.querySelector(".awayScore").textContent = 0;
    let domDest = document.querySelector(".scoreList");
    positionsCreated = 0;
    domDest.innerHTML = "";
    for(let j=0; j<10; j++){
        if (domDest){
            let thisCard = riderHTML(44249, (j%2==0) );
            // console.log(id,thisCard);
            domDest.insertAdjacentHTML('beforeend', thisCard);
        }
    }
}

var homeRiders = [];
var awayRiders = [];
var riderNum   = 0;
function renderRiders(){
    let homeRider = homeRiders?.[riderNum] || {ZPName:"",club:"",ZRRank:""};
    let awayRider = awayRiders?.[riderNum] || {ZPName:"",club:"",ZRRank:""};
    riderNum ++;
    if (riderNum>=5) riderNum=0;
    let domHome = document.querySelector(".homeRider");
    let domAway = document.querySelector(".awayRider");
    domHome.classList.add("riderHide");
    domAway.classList.add("riderHide");
    setTimeout( _=>{
        domHome.innerHTML = `${homeRider.ZPName} // <span class="small">${homeRider.club}</span> // ${homeRider.ZRRank}`;
        domAway.innerHTML = `${awayRider.ZPName} // <span class="small">${awayRider.club}</span> // ${homeRider.ZRRank}`;
        domHome.classList.remove("riderHide");
        domAway.classList.remove("riderHide");
    }, 550);
}

var backgroundOpacity = 0;
window.addEventListener('keydown', (e)=>{
    if (e.isComposing || e.keyCode === 229) return;
    if (e.code=="Escape"  ) {
        location.reload();
    } else if (e.code == "ArrowUp"){
        backgroundOpacity += 0.10;
        backgroundOpacity = Math.min(1,backgroundOpacity);
        document.body.style["background"] = `rgba(0,0,0,${backgroundOpacity})`;
    } else if (e.code == "ArrowDown"){
        backgroundOpacity -= 0.10;
        backgroundOpacity = Math.min(1,backgroundOpacity);
        document.body.style["background"] = `rgba(0,0,0,${backgroundOpacity})`;
    }
});

window.addEventListener("resize", resizeFunc);

function resizeFunc(evt){
    document.body.style["background"] = `rgba(0,0,0,${backgroundOpacity})`;
    // console.log("Resize finished");
    let xScale   = window.innerWidth / 800 ;
    let yScale   = window.innerHeight / 660 ;
    let smallest = Math.min(xScale,yScale);
    // console.log("window is now size ",window.innerWidth,window.innerHeight, xScale, yScale);
    let scoreSpuds = document.querySelectorAll(".scaleMe");
    scoreSpuds?.forEach(elem=>{
        let originalWidth  = elem.getAttribute("data-original-size") || elem.getAttribute("data-original-width");
        let originalHeight = elem.getAttribute("data-original-size") || elem.getAttribute("data-original-height");
        let aspect         = elem.getAttribute("data-aspect");
        let fontSize       = elem.getAttribute("data-font-size") || 0;
        let margins        = elem.getAttribute("data-margins")?.split(",") || null;
        let fontLine       = elem.getAttribute("data-line-height") || null;
        let mode           = elem.getAttribute("data-scale") || "smallest";
        if (mode=="smallest"){
            elem.style.width  = elem.style["min-width" ] = `${originalWidth  * smallest}px`;
            elem.style.height = elem.style["min-height"] = `${originalHeight * smallest}px`;
            elem.style["font-size"] = `${fontSize * smallest}px`
            if (fontLine) elem.style["line-height"] = `${fontLine * smallest}px`;
        } else if (mode=="onlyHeight"){
            elem.style.height = elem.style["min-height"] = `${originalHeight * smallest}px`;
            elem.style["font-size"] = `${fontSize * smallest}px`
            if (fontLine) elem.style["line-height"] = `${fontLine * smallest}px`;
        } else if (mode=="textOnly"){
            elem.style["font-size"] = `${fontSize * smallest}px`
            if (fontLine) elem.style["line-height"] = `${fontLine * smallest}px`;
        } else if (mode=="margins"){
            // console.log("margins only",elem);
        }
        if (margins){
            // t,l,b,r
            const marginTxt = ["top","left","bottom","right"];
            for (let i=0; i< margins.length; i++){
                let value = margins[i];
                if (value === null) {
                    // delete elem.style[`margin-${marginTxt[i]}`];
                    continue;
                }
                if (value == "auto") elem.style[`margin-${marginTxt[i]}`] = "auto";
                // console.log( value , originalWidth , parseFloat(elem.style.width) );
                if (i%2==0){
                    // y
                    let hVal = (value / originalHeight) * parseFloat(elem.style.height);
                    if (!isNaN(hVal)) elem.style[`margin-${marginTxt[i]}`] = `${hVal}px`;
                } else {
                    // x
                    let wVal = (value / originalWidth) * parseFloat(elem.style.width);
                    if (!isNaN(wVal)) elem.style[`margin-${marginTxt[i]}`] = `${wVal}px`;
                }
            }
        }
    })
}
resizeFunc();
// testCards();

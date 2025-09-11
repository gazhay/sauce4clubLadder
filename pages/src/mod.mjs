import * as common from '/pages/src/common.mjs';
import * as utils  from './utils.js';
import * as data   from './data.js';

// Attach to global scope
Object.assign(globalThis, utils, data);

const doc = document.documentElement;
doc.classList.remove("frame");

var   GAPPY       = false;
var   EVENT       = null;

// console.log("ClubLadder mod ",DEBUG, SERVER);
const GAP_SIZE = 15; //meters

var scoreForPos  = pos =>[10,9,8,7,6,5,4,3,2,1][pos-1]??0;
let tops         = Array.from(Array(12).keys()).map( (a,i) =>( 10+ (45*(i-1)) ));
let riderCache   = [];

let riderMaxes   = {};
let finishers    = [];

var positionsCreated = 0;
var homeTextColor    = null;
var awayTextColor    = null;
let ts               = 0;
const fakeClubs      = {
    homeClub: {
        id: 1,
        zwiftClubId: 168,
        name: 'Team Type 1',
        remoteAvatar: null,
        color1: '#5684b6',
        color2: '#254076',
        textColor1: '#ffffff',
        textColor2: '#254076',
    },
    awayClub: {
        id: 66,
        zwiftClubId: 161,
        name: 'ZSUN Racing',
        remoteAvatar: null,
        color1: '#1c1300',
        color2: '#ffffff',
        textColor1: '#ffd808',
        textColor2: '#ffffff',
    }
};


// Global Setup
function setupClubColors(data) {
  if (data?.homeClub?.color1) { document.documentElement.style.setProperty("--ladder-secondary-bg", data.homeClub.color1); }
  if (data?.awayClub?.color1) { document.documentElement.style.setProperty("--ladder-tertiary-bg", data.awayClub.color1); }

  if (data?.homeClub?.textColor1) {
    let homeScore = document.querySelector(".homeScore");
    let homeText = getContrastingTextColor(data.homeClub.color1, data.homeClub.textColor1);
    console.log(`${data.homeClub.name} Color`, data.homeClub.color1, "text color", data.homeClub.textColor1, "contrast color", homeText);
    homeScore.style.color = homeText;
    document.querySelectorAll(".homeRider").forEach(cell => cell.style.color = homeText);
    document.querySelectorAll(".forHome").forEach(elem => elem.style.color = homeText);
  }

  if (data?.awayClub?.textColor1) {
    let awayScore = document.querySelector(".awayScore");
    let awayText = getContrastingTextColor(data.awayClub.color1, data.awayClub.textColor1);
    console.log(`${data.awayClub.name} Color`, data.awayClub.color1, "text color", data.awayClub.textColor1, "contrast color", awayText);
    awayScore.style.color = awayText;
    document.querySelectorAll(".awayRider").forEach(cell => cell.style.color = awayText);
    document.querySelectorAll(".forAway").forEach(elem => elem.style.color = awayText);
  }
}

// Rider Setup
const riderHTML = (riderId,isHome, fakeNames=false) =>{
    // if (positionsCreated>=10) return "";
    let thisPos = ++positionsCreated;
    let output =
    `<div class="rider ${positionsCreated>=10?"d-none":""} ${isHome?"home":"away"}Rider scaleMe" data-rider-id="${riderId}" data-move-to-position="${thisPos}" data-original-height="40" data-scale="onlyHeight">
        <div class="score forHome scaleMe" data-font-size="25" data-line-height="40" data-scale="textOnly"> ${scoreForPos(thisPos)} </div>
        <div class="name forHome text-truncate scaleMe" data-font-size="25" data-line-height="40" data-scale="textOnly"> ${"JimBob" + (Math.random()*1000).toFixed(0)} </div>
        <div class="position scaleMe" data-font-size="18" data-line-height="40" data-scale="textOnly"> ${thisPos} </div>
        <div class="name forAway text-truncate scaleMe" data-font-size="25" data-line-height="40" data-scale="textOnly"> ${"JimBob" + (Math.random()*1000).toFixed(0)} </div>
        <div class="score forAway scaleMe" data-font-size="25" data-line-height="40" data-scale="textOnly"> ${scoreForPos(thisPos)} </div>
    </div>`;
    return output;
}
function setupIndividuals(data, ids){
    // console.log("SI:",data,ids);
    document.querySelector(".SplashHomeTeam").textContent = data.homeTeamName;
    document.querySelector(".SplashAwayTeam").textContent = data.awayTeamName;
    document.querySelector(".homeScore").textContent = 0;
    document.querySelector(".awayScore").textContent = 0;
    let domDest = document.querySelector(".scoreList");
    positionsCreated = 0;
    domDest.innerHTML = "";
    try{
        data.homeSignups = JSON.parse(data.homeSignups);
        data.awaySignups = JSON.parse(data.awaySignups);
    } catch (e){
        console.error(e)
    }
    for(let id of ids){
        if (domDest){
            // console.log("Insering",id,domDest)
            let thisCard = riderHTML(id, data.homeSignups.includes(id));
            // console.log(id,thisCard);
            domDest.insertAdjacentHTML('beforeend', thisCard);
        } else console.error("Scorelist missing");
    }
}

function groupRaceCompetitors(competitors, bikeLengthSeparation = 5) {
    // Handle empty input
    if (!competitors || competitors.length === 0) {
        return [];
    }

    // Sort competitors by distance (descending) if not already sorted
    const sortedCompetitors = [...competitors].sort((a, b) => b.distance - a.distance);

    // Initialize groups with the first competitor
    const groups = [[sortedCompetitors[0]]];

    for (let i = 1; i < sortedCompetitors.length; i++) {
        const currentCompetitor         = sortedCompetitors[i];
        const lastGroup                 = groups[groups.length - 1];
        const lastCompetitorInLastGroup = lastGroup[lastGroup.length - 1];

        // Check if the current competitor is separated by more than the bike length
        // If they are too far apart, start a new group
        if (lastCompetitorInLastGroup.distance - currentCompetitor.distance > bikeLengthSeparation) {
            groups.push([currentCompetitor]);
        } else {
            // If they're close enough, add to the current group
            lastGroup.push(currentCompetitor);
        }
    }

    return groups;
}
function scaleDistanceToPixels(meters) {
    const minMeters = 15;
    const maxMeters = 30;
    const minPixels = 2;
    const maxPixels = 10;

    // Clamp the input to your range
    const clampedMeters = Math.max(minMeters, Math.min(maxMeters, meters));

    // Scale linearly from 15-30m to 2-10px
    const pixelValue = ((clampedMeters - minMeters) / (maxMeters - minMeters)) * (maxPixels - minPixels) + minPixels;

    return `${Math.round(pixelValue)}px`;
}


function renderData(){
    resizeFunc();
    if (!homeTextColor) setupClubColors();
    else{
        document.querySelectorAll(".forHome")?.forEach(elem=>elem.style.color=`${homeTextColor}!important`);
        document.querySelectorAll(".forAway")?.forEach(elem=>elem.style.color=`${awayTextColor}!important`);
    }
    document.querySelectorAll(".position").forEach(e=>e.textContent="-1");
    let homeScore = 0;
    let awayScore = 0;
    let position  = 0;
    let lastDist  = 0;
    riderCache.sort( (a,b)=>{
        let aVal = a.state.eventDistance;
        let bVal = b.state.eventDistance;
        return aVal - bVal; // will mostly be correct since eventPosition doesn't exist ?!
    });

    // let gap = 0;
    // let lastDistance = 0;
    riderCache.forEach((rider, index) => {
        let riderBefore = index > 0 ? riderCache[index - 1] : null;
        let riderAfter  = index < riderCache.length - 1 ? riderCache[index + 1] : null;

        console.log("Rendering for ", rider.athleteId);
        let domForRider = document.querySelector(`.rider[data-rider-id="${rider.athlete.id}"]`);
        if (!domForRider){
            console.error("Didn't find HTML for ",rider.athlete.id);
            return;
        }

        let beforeDist = riderBefore.state.eventDistance - rider.state.eventDistance;
        let afterDist  = rider.state.eventDistance       - riderAfter.state.eventDistance;
        if (riderBefore && ((beforeDist) > GAP_SIZE)){
            domForRider.classList.add("headOfGroup");
            domForRider.style['margin-top'] = scaleDistanceToPixels(beforeDist);
        } else {
            domForRider.classList.remove("headOfGroup");
            domForRider.style['margin-top'] = "inherit";
        }

        if (riderAfter && ((afterDist) > GAP_SIZE)){
            domForRider.classList.add("rearOfGroup");
            domForRider.style['margin-bottom'] = scaleDistanceToPixels(beforeDist);

        } else {
            domForRider.classList.remove("rearOfGroup");
            domForRider.style['margin-bottom'] = "inherit";
        }

        let riderPos = index + 1;
        domForRider.querySelectorAll(".score").forEach(e=>e.textContent=scoreForPos(riderPos));
        domForRider.querySelector(".position").textContent=riderPos;
        domForRider.querySelectorAll(".name").forEach(e=>e.textContent=rider.athlete.sanitizedFullname);
        domForRider.style.position = "absolute";
        domForRider.style.top = `${tops[riderPos]}px`;
    });


    // let groups   = riderCache.map( a => {return {id:a.athleteId, distance:a.state.eventDistance}});
    // groups       = groupRaceCompetitors(groups, 5); // 5 bikelength drop thingy
    // let groupNum = 1;
    // for (let group of groups) {
    //     let lastofGroup = null;
    //     // Remove groupEdge from all riders first
    //     document.querySelectorAll('.groupEdge').forEach(el => { el.classList.remove('groupEdge'); });
    //     const riderMap = new Map(riderCache.map(r => [r.athleteId, r]));
    //     for (let riderId of group.map(a => a.id)) {
    //         let rider = riderMap.get(riderId);
    //         let domForRider = document.querySelector(`.rider[data-rider-id="${rider.athlete.id}"]`);
    //
    //         if (!domForRider) {
    //             console.error("Didn't find HTML for ", rider.athlete.id);
    //             continue;
    //         }
    //
    //         let riderPos = ++position;
    //         domForRider.querySelectorAll(".score").forEach(e => e.textContent = scoreForPos(riderPos));
    //         domForRider.querySelector(".position").textContent = riderPos;
    //         domForRider.querySelectorAll(".name").forEach(e => e.textContent = rider.athlete.sanitizedFullname);
    //         domForRider.style.position = "absolute";
    //         domForRider.style.top = `${tops[riderPos]}px`;
    //
    //         // Remove all Group_ classes
    //         for (let i = 0; i < 10; i++) {
    //             domForRider.classList.remove(`Group_${i+1}`)
    //         }
    //
    //         domForRider.classList.add(`Group_${groupNum}`);
    //
    //         if (Date.now() - rider.staleness > 10 * 1000) {
    //             domForRider.classList.add("delayed");
    //         } else {
    //             domForRider.classList.remove("gapped");
    //         }
    //
    //         lastDist = rider.state.eventDistance;
    //         lastofGroup = domForRider;
    //     }
    //
    //     if (lastofGroup) {
    //         lastofGroup.classList.add('groupEdge');
    //     } else {
    //         console.error("Last of group missing", groupNum);
    //     }
    //
    //     groupNum++;
    // }
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

// UI Stuff
var backgroundOpacity = 0;
window.addEventListener('keydown', async e=>{
    // console.log(e);
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
    } else if (e.code == "KeyP"){
        document.querySelector(".scoreList").classList.toggle("d-none");
    } else if (e.code == "KeyT"){
        document.querySelector(".topBar").classList.toggle("d-none");
    } else if (e.code == "KeyA"){
        const result = await createInputModal({
            title        : 'Add rider',
            numericLabel : 'ZwiftId',
            selectLabel  : 'Team',
            selectOptions: ['Home','Away']
        });

        if (result) {
            let zwiftId = result.numeric;
            let team    = result.select;

            let thisCard = riderHTML(zwiftId, team=="Home");
            let domDest  = document.querySelector(".scoreList");
            domDest.insertAdjacentHTML('beforeend', thisCard);

            common.subscribe(`athlete/${zwiftId}`, onAthleteData);
            console.log('Added Rider:', zwiftId);
            resizeFunc();
        } else {
            // console.log('Dialog cancelled');
        }
    } else if (e.code == "KeyZ"){
        console.log("Trying Test")
        testCards();
        resizeFunc();
    }
});

// Wild scaling function
window.addEventListener("resize", resizeFunc);
function resizeFunc(evt){
    document.body.style["background"] = `rgba(0,0,0,${backgroundOpacity})`;
    // console.log("Resize finished");
    let xScale   = window.innerWidth / 800 ;
    let yScale   = window.innerHeight / 660 ;
    // document.querySelector(".scoreList").style.height = `${window.innerHeight-100}px`; // topbar is 100px
    let smallest = Math.min(xScale,yScale);
    // 45 = 600-100 / 10
    let onePos = ((window.innerHeight-100)/10);
    tops = Array.from(Array(12).keys()).map( (a,i)=>( 10+ ( onePos *(i-1)) ));
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

// Add a rider function
function createInputModal(options = {}) {
    const {
        title = 'Input Dialog',
        numericLabel = 'Number',
        numericValue = '',
        selectLabel = 'Select',
        selectOptions = []
    } = options;

    return new Promise((resolve) => {
        // Create modal container with a unique, unlikely-to-conflict ID
        const modalContainer = document.createElement('div');
        modalContainer.id                    = 'anthropic-input-modal-' + Date.now();
        modalContainer.style.position        = 'fixed';
        modalContainer.style.top             = '0';
        modalContainer.style.left            = '0';
        modalContainer.style.width           = '100%';
        modalContainer.style.height          = '100%';
        modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalContainer.style.display         = 'flex';
        modalContainer.style.justifyContent  = 'center';
        modalContainer.style.alignItems      = 'center';
        modalContainer.style.zIndex          = '10000';

        // Create modal content
        const modalContent                 = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding         = '20px';
        modalContent.style.borderRadius    = '5px';
        modalContent.style.width           = '300px';
        modalContent.style.boxShadow       = '0 4px 6px rgba(0, 0, 0, 0.1)';

        // Construct modal HTML
        modalContent.innerHTML = `
            <h2 style="margin-bottom: 15px;">${title}</h2>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px;">
                <label for="anthropic-numeric-input">${numericLabel}:</label>
                <input
                    type="number"
                    id="anthropic-numeric-input"
                    style="padding: 5px; width: 100%;"
                    value="${numericValue}"
                >
                <label for="anthropic-select-input">${selectLabel}:</label>
                <select
                    id="anthropic-select-input"
                    style="padding: 5px; width: 100%;"
                >
                    ${selectOptions.map(option =>
                        `<option value="${option}">${option}</option>`
                    ).join('')}
                </select>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <button id="anthropic-ok-button" style="padding: 5px 10px;">OK</button>
                <button id="anthropic-cancel-button" style="padding: 5px 10px;">Cancel</button>
            </div>
        `;

        // Append content to container
        modalContainer.appendChild(modalContent);

        // Append to body
        document.body.appendChild(modalContainer);

        // Get references to elements
        const numericInput = modalContainer.querySelector('#anthropic-numeric-input');
        const selectInput  = modalContainer.querySelector('#anthropic-select-input');
        const okButton     = modalContainer.querySelector('#anthropic-ok-button');
        const cancelButton = modalContainer.querySelector('#anthropic-cancel-button');

        // OK button handler
        okButton.addEventListener('click', () => {
            const result = {
                numeric: numericInput.value,
                select: selectInput.value
            };
            document.body.removeChild(modalContainer);
            resolve(result);
        });

        // Cancel button handler
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(modalContainer);
            resolve(null);
        });

        // Focus on numeric input when modal opens
        numericInput.focus();
    });
}

main().then(_=>{
    resizeFunc();
});


// Debug stuff
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
            let id = 44249+j;
            let thisCard = riderHTML(id, (j%2==0) );
            domDest.insertAdjacentHTML('beforeend', thisCard);
            if (j==5) {
                document.querySelector(`div.rider[data-rider-id="${id}"]`)?.classList?.add("rearOfGroup");
            } else if (j==6){
                document.querySelector(`div.rider[data-rider-id="${id}"]`)?.classList?.add("headOfGroup", "rearOfGroup");
                document.querySelector(`div.rider[data-rider-id="${id}"]`)?.setAttribute("data-margin", 10);
                document.querySelector(`div.rider[data-rider-id="${id}"]`).style['margin-top'] = scaleDistanceToPixels(20);

            } else if (j==7){
                document.querySelector(`div.rider[data-rider-id="${id}"]`)?.classList?.add("headOfGroup");
            }
            // catch (e){
                // console.error(e);
            // }
        }
    }
}

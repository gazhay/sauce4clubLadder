import * as common from '/pages/src/common.mjs';

const doc = document.documentElement;
doc.classList.remove("frame");

const DEBUG       = "";//"debug";
var   USER        = 0;
const SERVER      = (DEBUG!="")?"http://arwen.lan:5000":"https://ladder.cycleracing.club";
var   GAPPY       = false;
var   EVENT       = null;

console.log("ClubLadder mod ",DEBUG, SERVER);

var INTERESTEDIN  = [];

var scoreForPos = pos=>[10,9,8,7,6,5,4,3,2,1][pos-1]??0;
let tops        = Array.from(Array(12).keys()).map( (a,i)=>( 10+ (45*(i-1)) ));
let riderCache    = [];

let riderMaxes    = {};
let finishers     = [];
const ColorDark = "#ffffff";
const ColorLight = "#000000";

function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

const contrastColor = (incol, darkColor = ColorDark, lightColor = ColorLight) => {
    const threshold = 186;
    let rgb;

    if (typeof incol === 'string' && incol.startsWith("#")) {
        rgb = hexToRgb(incol);
    } else if (Array.isArray(incol) && incol.length === 3) {
        rgb = incol;
    } else {
        throw new Error("Invalid color format. Please provide a hex color or an RGB array.");
    }

    return (((rgb[0] * 0.299) + (rgb[1] * 0.587) + (rgb[2] * 0.114)) > threshold) ? darkColor : lightColor;
};

function getContrastingTextColor(backgroundColor, textColor) {
  // Calculate the relative luminance of the background and text colors
  const backgroundLuminance = calculateLuminance(backgroundColor);
  const textLuminance = calculateLuminance(textColor);

  // Determine the appropriate contrasting color
  const luminanceDiff = Math.abs(backgroundLuminance - textLuminance);
  return luminanceDiff > 0.5 ? textColor : invertColor(textColor);
}

function calculateLuminance(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance;
}

function invertColor(hexColor) {
  const r = 255 - parseInt(hexColor.slice(1, 3), 16);
  const g = 255 - parseInt(hexColor.slice(3, 5), 16);
  const b = 255 - parseInt(hexColor.slice(5, 7), 16);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const fakeClubs = {homeClub:
  {
    id          : 1,
    zwiftClubId : 168,
    name        : 'Team Type 1',
    remoteAvatar: null,
    color1      : '#5684b6',
    color2      : '#254076',
    textColor1  : '#ffffff',
    textColor2  : '#254076',
}, awayClub:
  {
    id          : 66,
    zwiftClubId : 161,
    name        : 'ZSUN Racing',
    remoteAvatar: null,
    color1      : '#1c1300',
    color2      : '#ffffff',
    textColor1  : '#ffd808',
    textColor2  : '#ffffff',
  }
};

var positionsCreated = 0;
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
async function fetchFromLadder(fake=false){
    if (fake){
        testCards();
        return setupClubColors(fakeClubs);
    }
    if (USER==0 && DEBUG=="") return null;
    console.log("Setting up",`${SERVER}/whatFixtureShouldIBeIn/${USER}${DEBUG}`);
    let myLadderData = await fetch(`${SERVER}/whatFixtureShouldIBeIn/${USER}${DEBUG}`).then(response=>response.json());
    if (!myLadderData || myLadderData.length==0){
        console.log("Timeout here and try again later",myLadderData);
        return null;
    }
    myLadderData = myLadderData?.[0] || [];

    // Now we have to get the points structure for ladder matches
    await fetch(`${SERVER}/api/pointsStructure`).then(response=>response.json()).then(scores=>{
        if (scores && scores?.length>0){
            scoreForPos = pos=>[...scores][pos-1]??0;
        }
    }).catch(err=>{console.log("Failed to fetch points",err)});

    let oldInterests = INTERESTEDIN;
    INTERESTEDIN = [...JSON.parse(myLadderData?.homeSignups),...JSON.parse(myLadderData?.awaySignups)];
    console.log("Found riders from ladder :", INTERESTEDIN, myLadderData);
    for (let subs of oldInterests){
        common.unsubscribe(`athlete/${subs}`, onAthleteData);
    }
    console.log(">>>>",INTERESTEDIN)
    for(let rider of INTERESTEDIN){
        // console.log("real subscribe",rider)
        common.subscribe(`athlete/${rider}`, onAthleteData);
    }
    setupIndividuals(myLadderData, INTERESTEDIN);

    setupClubColors(myLadderData);

    return true;
}

var homeTextColor = null;
var awayTextColor = null;
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

let ts = 0;
function onAthleteData(data) {
    console.log(data);
    data.staleness = new Date();
    // If no existing max, initialize from incoming data
    if (!riderMaxes[data.athleteId]) {
        // console.log(`Initializing max distance for athlete ${data.athleteId}`);
        riderMaxes[data.athleteId] = data.state.eventDistance || 0;
    }

    // Always use the larger value
    const previousMax = riderMaxes[data.athleteId];
    riderMaxes[data.athleteId] = Math.max(
        riderMaxes[data.athleteId],
        data.state.eventDistance || 0
    );

    // if (previousMax !== riderMaxes[data.athleteId]) {
    //     console.log(`Updated max distance for athlete ${data.athleteId}:
    //         ${previousMax} → ${riderMaxes[data.athleteId]}`);
    // }

    // Ensure event distance is set
    data.state.eventDistance = riderMaxes[data.athleteId];

    const now = Date.now();
    if (now - ts > 1900) {
        ts = now;
        renderData();
    }
}

async function main() {
    common.subscribe('athlete/watching', async data => {
        let olduser = USER;
        if (data.athleteId != USER){
            USER         = data.athleteId;
            console.log("Switched to ",USER);
            if (USER!=0) await fetchFromLadder();
        }
    });

    await fetchFromLadder();

    for(let rider of INTERESTEDIN){
        console.log("Subscribe",rider)
        common.subscribe(`athlete/${rider}`, onAthleteData);
    }
}
main();

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

        // Check if the current competitor is within bike length separation
        // If distance difference is less than bike length, add to the current group
        if (lastCompetitorInLastGroup.distance - currentCompetitor.distance < bikeLengthSeparation) {
            lastGroup.push(currentCompetitor);
        } else {
            // Start a new group
            groups.push([currentCompetitor]);
        }
    }

    return groups;
}

function renderData(){
    resizeFunc();
    if (!homeTextColor) setupClubColors();
    else{
        console.log("render fix")
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
    let groups   = riderCache.map( a => {return {id:a.athleteId, distance:a.state.eventDistance}});
    groups       = groupRaceCompetitors(groups, 5); // 5 bikelength drop thingy
    let groupNum = 1;
    for (let group of groups) {
        let lastofGroup = null;

        // Remove groupEdge from all riders first
        document.querySelectorAll('.groupEdge').forEach(el => {
            el.classList.remove('groupEdge');
        });

        for (let riderId of group.map(a => id)) {
            let rider = riderCache.find(a => a.athleteId == riderId);
            let domForRider = document.querySelector(`.rider[data-rider-id="${rider.athlete.id}"]`);

            if (!domForRider) {
                console.error("Didn't find HTML for ", rider.athlete.id);
                continue;
            }

            let riderPos = ++position;
            domForRider.querySelectorAll(".score").forEach(e => e.textContent = scoreForPos(riderPos));
            domForRider.querySelector(".position").textContent = riderPos;
            domForRider.querySelectorAll(".name").forEach(e => e.textContent = rider.athlete.sanitizedFullname);
            domForRider.style.position = "absolute";
            domForRider.style.top = `${tops[riderPos]}px`;

            // Remove all Group_ classes
            for (let i = 0; i < 10; i++) {
                domForRider.classList.remove(`Group_${i+1}`)
            }

            domForRider.classList.add(`Group_${groupNum}`);

            if (Date.now() - rider.staleness > 10 * 1000) {
                domForRider.classList.add("delayed");
            } else {
                domForRider.classList.remove("gapped");
            }

            lastDist = rider.state.eventDistance;
            lastofGroup = domForRider;
        }

        if (lastofGroup) {
            lastofGroup.classList.add('groupEdge');
        } else {
            console.error("Last of group missing", groupNum);
        }

        groupNum++;
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
function setupIndividuals(data, ids){
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
            if (j<6) {
                document.querySelector(`div.rider[data-rider-id="${id}"]`)?.classList?.add("Group_1");
            } else if (j==6){
                document.querySelector(`div.rider[data-rider-id="${id}"]`)?.classList?.add("Group_1", "groupEdge");
            } else if (j>6){
                document.querySelector(`div.rider[data-rider-id="${id}"]`)?.classList?.add("Group_2");
            }
            // catch (e){
                // console.error(e);
            // }
        }
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
    } else if (e.code == "KeyT"){
        console.log("Trying Test")
        testCards();
        resizeFunc();
    }
});

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
resizeFunc();
// testCards();

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
        modalContainer.id = 'anthropic-input-modal-' + Date.now();
        modalContainer.style.position = 'fixed';
        modalContainer.style.top = '0';
        modalContainer.style.left = '0';
        modalContainer.style.width = '100%';
        modalContainer.style.height = '100%';
        modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalContainer.style.display = 'flex';
        modalContainer.style.justifyContent = 'center';
        modalContainer.style.alignItems = 'center';
        modalContainer.style.zIndex = '10000';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '5px';
        modalContent.style.width = '300px';
        modalContent.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

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

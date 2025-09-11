import * as common from '/pages/src/common.mjs';

const DEBUG       = "";//"debug";
var   USER        = 0;
const SERVER      = (DEBUG!="")?"http://arwen.lan:5000":"https://ladder.cycleracing.club";
var INTERESTEDIN  = [];

// Data poll and render
export function onAthleteData(data) {
    // console.log(data);
    data.staleness = new Date();
    // If no existing max, initialize from incoming data
    if (!riderMaxes[data.athleteId]) {
        // console.log(`Initializing max distance for athlete ${data.athleteId}`);
        riderMaxes[data.athleteId] = data.state.eventDistance || 0;
    }

    let existing = riderCache.findIndex(a=>a.athleteId==data.athleteId);
    if (existing==-1){
        riderCache.push(data);
    } else {
        riderCache.splice(existing, 1, data);
    }

    // Always use the larger value
    const previousMax = riderMaxes[data.athleteId];
    riderMaxes[data.athleteId] = Math.max(
        riderMaxes[data.athleteId],
        data.state.eventDistance || 0
    );

    data.state.eventDistance = riderMaxes[data.athleteId];

    const now = Date.now();
    if (now - ts > 1900) {
        ts = now;
        renderData();
    }
}
export async function fetchFromLadder(fake=false){
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
    // console.log(">>>>",INTERESTEDIN)
    positionsCreated=0;
    for(let rider of INTERESTEDIN){
        // console.log("real subscribe",rider)
        common.subscribe(`athlete/${rider}`, onAthleteData);
    }
    setupIndividuals(myLadderData, INTERESTEDIN);

    setupClubColors(myLadderData);

    return true;
}
// initial subscription
export async function main() {
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

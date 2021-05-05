import { minAppend, msToTime, numberWithCommas, objVals } from "@giveback007/util-lib";
import { cmdReady } from "./commands";
import { getData, getState, setState } from "./store";
import { isNumber } from "./utils";

const { log, clear } = console;

export function header() {
    setState({ selTruck: 0 });

    const state = getState();
    const data = getData();

    setState(state);

    clear();
    if (data.dataRefreshedOn) {
        const x = msToTime(Date.now() - data.dataRefreshedOn, true);
        log(`[Data refreshed ${x.d} days ${x.h} hours and ${x.m} minutes ago.]`);
    }
    
    log(`
|| H - [Home]
|| R - [Refresh Data]
|| #### - [Select Truck]`);
    log('\n');
}

export function homeScreen() {
    setState({ selScreen: "home" });
    const data = getData();

    header();

    log('          | Truck# | Oil-Mi Left |     Odo |     Changed-On | Max-Life');
    log('------------------------------------------------------------------------');

    for (const tr in data.trucks) {
        const m = minAppend;
        const t = data.trucks[tr];
        const o = data.oil[tr];

        let note = t.odo ? '???' : 'NO-ODO!';
        let left = '???';
        let chng = '???';
        let life = '???';
        
        if (o) {
            const rem = o.life - (t.odo - o.odo);
            const dt = new Date(o.time);

            if (rem < 1001 && t.odo) {
                note = 'WARNING!';
                left = `!!! ${(rem / 1000).toFixed(1)}K`;
            } else if (t.odo) {
                note = rem < 3001 ? 'LOW' : ' ';
                left = `${(rem / 1000).toFixed(1)}K`;
            }

            chng = `${(o.odo / 1000).toFixed(1)}K - ${dt.getMonth() + 1}/${dt.getDate()}`;
            life = `${(o.life / 1000).toFixed(0)}K`;
        }

        const odom = (t.odo / 1000).toFixed(1) + 'K';       
        log(`${m(note, 9, ' ')} |${m(t.truck, 7, ' ')} |${m(left, 12, ' ')} |${m(odom, 8, ' ')} |${m(chng, 15, ' ')} | ${m(life, 8, ' ')}`);
    }

    if (!objVals(data.trucks).length)
        log('NO DATA --- use command "R" to get data');

    cmdReady();
}

export function truckScreen(truck: string) {
    const data = getData();

    const t = data.trucks[truck];
    const o = data.oil[truck]
    if (!t) return errorScreen(truck);

    header();
    log('|| N - [ADD New Oil] \n');
    setState({ selScreen: "truck", selTruck: truck });
    
    const oilAt = o ? numberWithCommas(o.odo) : '???';
    const date = o ? new Date(o.time).toDateString() : '???';
    log("TRUCK   : " + t.truck);
    log('DRIVER  : ' + t.driver);
    log('ODOM    : ' + numberWithCommas(t.odo));
    log('OIL @   : ' + oilAt);
    log('OIL DATE: ' + date);
    cmdReady();
}

export function errorScreen(cmd: string | number) {
    setState({ selScreen: "error" });
    header();

    if (isNumber(cmd))
        log(`Truck-# "${cmd}" was not found.`);
    else 
        log(`Command "${cmd}" is invalid.`);
    
    cmdReady();
}

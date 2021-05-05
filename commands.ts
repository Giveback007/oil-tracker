import { clone, wait } from "@giveback007/util-lib";
import { errorScreen, header, homeScreen, truckScreen } from "./screens";
import { getData, getState, setData, setState } from "./store";
import { Oil } from "./types";
import { clear, isNumber, isValidDate, log, scrapeData, toDate } from "./utils";
const readline = require('readline');

export const question = (qText: string): Promise<string> => new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    rl.question(qText, (answer: string) => {
        rl.close();
        res(answer);
    })
});

export function cmdReady() {
    log('\nEnter command or truck-#:');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('', (answer: string) => {
        rl.close();
        command(answer);
    })
}

async function command(x: string) {
    if (isNumber(x)) return truckScreen(x);

    const state = getState();
    const data = getData();

    const cmd = x.toUpperCase();
    switch (cmd) {
        case 'N': {
            setState({ selScreen: "new-oil" });
            const tr = state.selTruck;
            if (!tr) {
                header();
                log('ERROR select truck first before adding new oil');
                return cmdReady();
            }

            const oil: Oil = {
                truck: tr,
                life: 20000,
                odo: Math.floor(data.trucks[tr].odo / 100) * 100,
                time: Date.now()
            }

            clear();
            log(`[Leave empty to add: "${(oil.odo / 1000).toFixed(1)}K"]`)
            const odo = await question('Odometer @ Change, eg: 356. (10 = 10,000) :: ');
            if (odo && !isNumber(odo)) {
                log(`ERROR INVALID: ${odo}`);
                return wait(3000).then(process.exit());
            }
            if (odo) oil.odo = Number(odo) * 1000;
            log('->  ' + (oil.odo / 1000).toFixed(1) + 'K');
            

            log(`\n[Leave empty to add: "${new Date(oil.time).toDateString()}"]`)
            const dateInp = await question('Date @ Change, eg: 4/16 :: ');
            const date = toDate(dateInp);
            if (dateInp && !isValidDate(date)) {
                log(`ERROR INVALID: ${date}`);
                return wait(3000).then(process.exit());
            }
            if (dateInp) oil.time = date.getTime();
            log('->  ' + new Date(oil.time).toDateString());

            log(`\n[Leave empty to add: "${(oil.life / 1000).toFixed(0)}K"]`);
            const life = await question('Max Oil Life Miles, eg: 30. (10 = 10,000) :: ');
            if (life && !isNumber(life)) {
                log(`ERROR INVALID: ${life}`);
                return wait(3000).then(process.exit());
            };
            if (life) oil.life = Number(life) * 1000;
            log('->  ' + (oil.life / 1000).toFixed(0) + 'K');

            log(`\n\n Truck ${tr} Oil @ ${(oil.odo / 1000).toFixed(1)}K`)
            await wait(1500);
            
            const newData = clone(data);
            newData.oil[tr] = oil;
            setData(newData);
            return homeScreen();
        }
        case 'H': {
            return homeScreen();
        }
        case 'R': {
            const trucks = await scrapeData();
            const update = { ...data, trucks: { ...data.trucks } };

            update.dataRefreshedOn = Date.now();
            for (const tr in trucks)
                update.trucks[tr] = trucks[tr];

            await setData(update);

            if (state.selScreen === 'truck')
                truckScreen(state.selTruck);
            else
                homeScreen();

            break;
        }
        case '': {
            if (getState().selScreen === "new-oil") return homeScreen();
        }
        default: errorScreen(cmd);
    }
}

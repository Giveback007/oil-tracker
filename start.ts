import { homeScreen } from './screens';
import { setData, setState } from './store';
import { clear, log, readJSON, writeJSON } from './utils';

async function run() {
    clear();
    log("...");

    try {
        await readJSON('./data.json');
    } catch (error) {
        await writeJSON('./data.json', {});
    }

    setState(await readJSON('./keys.json'));
    setData(await readJSON('./data.json'));
    
    homeScreen();
}

const keepOpen = () => setTimeout(keepOpen, 1000);
keepOpen();

run();

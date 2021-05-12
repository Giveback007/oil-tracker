import puppeteer, { Browser, Page } from 'puppeteer';
import { Dict, sec, wait } from '@giveback007/util-lib';
import { promises as fsPromises } from 'fs';
import { Truck } from './types';
import { getState } from './store';

const { writeFile, readFile } = fsPromises;

export const { log, clear } = console;

const fillInput = async (page: Page, inp: string, txt: string) => {
    await page.focus(inp);
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');

    await page.type(inp, txt);
}

export const pageGoto = (page: Page, link: string) =>
    page.goto(link, { waitUntil: 'networkidle0' });

export async function scrapePage(browser: Browser, email: string, pass: string, waitSec: number) {
    const state = getState();
    const page = await browser.newPage();
    await pageGoto(page, state.site);

    await fillInput(page, '#Email', email);
    await fillInput(page, '#Password', pass);

    await page.click("#login_button");
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // SEARCH 1000 logs over past 8 days:
    // ps=1000 (loads 1k items) // s=-1 (sort by date)
    await pageGoto(page, state.search);

    const arrDict = await page.evaluate(() => {
        const toDate = (d: string) => {
            const year = new Date().getFullYear();
        
            const date = new Date(d);
            if (date.getFullYear() < year - 1) date.setFullYear(year);
            if (date.getTime() > Date.now()) date.setFullYear(year - 1);
        
            return date;
        }

        const data: Dict<Truck[]> = {};
        
        document.querySelectorAll('#dataContainer table tbody .tr-action').forEach(row => {
            const x = row.querySelectorAll('a');

            const truck = x[3].innerText;
            const date = toDate(x[0].innerText);
            
            if (!data[truck]) data[truck] = [];

            data[truck].push({
                truck, 
                odo: 0,
                link: x[0].href,
                driver: x[1].innerText,
                time: date.getTime(),
                date: date.toDateString()
            });
            
        });

        for (const tr in data)
            data[tr] = data[tr].sort((a, b) => b.time - a.time);
        
        return data;
    });

    const data: Dict<Truck> = {};
    for (const tr in arrDict) {
        const odo = await getOdo(page, arrDict[tr], waitSec);
        data[tr] = { ...arrDict[tr][0], odo };
    }
    
    await pageGoto(page, state.logoff);
    return data;

}

async function getOdo(page: Page, tr: Truck[], waitSec: number) {
    for (const x of tr) {
        await pageGoto(page, x.link);
        
        // countdown:
        if (waitSec) page.evaluate((waitSec: number) => {
            const body = document.getElementsByTagName('body')[0];
            const div = document.createElement("div");
            body.appendChild(div);

            (div as any).style = 'position: fixed; top: 0; right: 0; border: solid 3px black; z-index: 9999; padding: 10px 50px; font-size: 95px; background: white';
            div.innerText = waitSec + '';
            let i = waitSec;
            setInterval(() => i ? div.innerText = (--i) + '' : null, 1000);
        }, waitSec)
        await wait(sec(waitSec));

        const odo = await page.evaluate(() => {
            const rows = document.querySelectorAll('#eld-ev-o-text-block table tbody tr');

            let odo = 0;
            for (let i = rows.length - 1; !odo; i--) {
                if (i < 0) return 0;

                const odoStr = rows[i].querySelectorAll('td')[6].innerText || '';
                odo = odoStr ? Number(odoStr) : 0;
            }
    
            return odo;
        });

        if (odo > 0) return odo;
    }

    return 0;
}

export async function scrapeData(waitSec: number = 0) {
    const { _1, _2 } = getState();

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
        // executablePath: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
    });

    
    const data1 = await scrapePage(browser, _1.email, _1.pass, waitSec);
    const data2 = await scrapePage(browser, _2.email, _2.pass, waitSec);

    const data: Dict<Truck> = { ...data1, ...data2 };

    browser.close();
    return data;
}

export function isNumber(x: string | number) {
    if (x === '') return false;
    return !isNaN(x as any);
};

export const isValidDate = (date: Date) => !isNaN(date.getTime());

export const toDate = (d: string) => {
    const year = new Date().getFullYear();

    const date = new Date(d);
    if (date.getFullYear() < year - 1) date.setFullYear(year);
    if (date.getTime() > Date.now()) date.setFullYear(year - 1);

    return date;
}

export const readJSON = async (pth: string) => JSON.parse(await readFile(pth, 'utf8'));
export const writeJSON = (pth: string, data: any) => writeFile(pth, JSON.stringify(data), 'utf8');

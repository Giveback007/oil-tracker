import { AnyObj } from "@giveback007/util-lib";
import { Data, Keys, State } from "./types";
import { writeJSON } from "./utils";

let state: State = {
    ...{} as Keys,
    selTruck: '',
    selScreen: 'home'
}

let data: Data = { } as any;

export function setState(obj: AnyObj) {
    state = {...state};
    for (const key in obj) (state as any)[key] = obj[key];
}

export const getState = () => state;

export async function setData(obj: AnyObj) {
    data = { ...{oil: {}, trucks: {}}, ...data};
    for (const key in obj) (data as any)[key] = obj[key];

    await writeJSON('./data.json', data);
}

export const getData = () => data;

import { Dict } from "@giveback007/util-lib"

export type Key = { email: string, pass: string };

export type Keys = {
    site: string;
    search: string;
    logoff: string;
    _1: Key;
    _2: Key;
}

export type State = {
    selTruck: string;
    selScreen: string;
} & Keys;

export type Data = {
    dataRefreshedOn: number;
    oil: Dict<Oil>;
    trucks: Dict<Truck>;
}

export type Oil = {
    truck: string;
    time: number;
    odo: number;
    life: number;
}

export type Truck = {
    truck: string;
    driver: string;
    link: string;
    date: string;
    time: number;
    odo: number;
}
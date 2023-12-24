/*
List internet hosts contacted by ledger live
*/

import { getEnvDefault, getEnv, getAllEnvNames } from "@ledgerhq/live-env";

async function main() {
    const envNames = getAllEnvNames();
    envNames.forEach(envName => {
        const ev = getEnvDefault(envName)
        if (ev.toString().startsWith("http")) {
            console.log(ev)
        }
    })
}


main()
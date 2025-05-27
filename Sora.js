import SoulDew from "./SoulDew/SoulDew.js";
import OPFSWrapper from "./Utilities/OPFSWrapper.js";
import * as ObjectFactory from "./Utilities/ObjectFactory.js";
import * as MathUtility from "./Utilities/Math.js";
import * as AlgorithmUtility from "./Utilities/AlgorithmUtility.js";
import * as CryptoUtility from "./Utilities/CryptoUtility.js";

const Sora = Object.seal({
    version: "InDev",
    enviornment: typeof window !== "undefined" ? "Browser" : "Node",
    debug: false,
    debugLevel: 0,
    toggleDebug() {
        this.debug = !this.debug;
        console.log(`Debug mode is now ${this.debug ? "enabled" : "disabled"}`);
    },
});

globalThis.SoraJS = Object.seal({
    SoulDew,
    OPFSWrapper,
    ObjectFactory,
    MathUtility,
    AlgorithmUtility,
    CryptoUtility,
});

globalThis.Sora = Sora;

export {
    Sora,
    SoulDew,
    OPFSWrapper,
    ObjectFactory,
    MathUtility,
    AlgorithmUtility,
    CryptoUtility,
};

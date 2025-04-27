import SoulDew from "./SoulDew/SoulDew.js";
import OPFSWrapper from "./Utilities/OPFSWrapper.js";
import * as ObjectFactory from "./Utilities/ObjectFactory.js"
import * as MathUtility from "./Utilities/Math.js"

const Sora = Object.seal({
    version: "InDev",
    enviornment: (typeof window !== "undefined") ? "Browser" : "Node",
    debug: false,
    debugLevel: 0,
    toggleDebug() {
        this.debug = !this.debug;
        console.log(`Debug mode is now ${this.debug ? "enabled" : "disabled"}`);
    }
});

export {
    Sora,
    SoulDew,
    OPFSWrapper,
    ObjectFactory,
    MathUtility,
};
import SoulDew from "./SoulDew/SoulDew.js";
import OPFSWrapper from "./Utilities/OPFSWrapper.js";
import * as ObjectFactory from "./Utilities/ObjectFactory.js"
import * as MathUtility from "./Utilities/Math.js"

const Sora = Object.freeze({
    version: "InDev",
    enviornment: (typeof window !== "undefined") ? "Browser" : "Node",
});

export {
    Sora,
    SoulDew,
    OPFSWrapper,
    ObjectFactory,
    MathUtility,
};
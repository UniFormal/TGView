import Clusterer from "./layout/Clusterer";
import Optimizer from "./layout/Optimizer";

import StatusLogger from "./dom/StatusLogger";
import Resizer from "./dom/Resizer";
import DOMCreator from "./dom/DOMCreator";
import TGViewDOMListener from "./dom/GlobalListener";

const tgview = {
    layout: {
        Clusterer: Clusterer,
        Optimizer: Optimizer,
    },
    dom: {
        DOMCreator: DOMCreator,
        GlobalListener: TGViewDOMListener,
        Resizer: Resizer,
        StatusLogger: StatusLogger,
    },
    core: {

    }
}

export default tgview;
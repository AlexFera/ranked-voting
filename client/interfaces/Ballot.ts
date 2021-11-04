import type Item from "./Item";

interface Ballot {
    selected_items: Item[],
    remaining_items: Item[]
}

export default Ballot;
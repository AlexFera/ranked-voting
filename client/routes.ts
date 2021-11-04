import Index from "./pages/Index.svelte";
import About from "./pages/About.svelte";
import Vote from "./pages/Vote.svelte";
import NotFound from "./pages/NotFound.svelte";
import Unauthorized from "./pages/Unauthorized.svelte";

const routes = {
    "/": Index,
    "/about": About,
    "/vote/:token": Vote,
    "/unauthorized": Unauthorized,
    // Catch-all, must be last
    "*": NotFound
}

export default routes;
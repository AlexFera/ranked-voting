<script lang="ts">
    import Router from "svelte-spa-router";
    import routes from "../routes";
    import { push } from "svelte-spa-router";

    function onConditionsFailed(event) {
        push("/unauthorized");
    }
</script>

<nav class="navbar" role="navigation" aria-label="main navigation">
    <!-- navbar items, navbar burger... -->
    <div class="navbar-brand">
        <a class="navbar-item" href="/#/">
            <img src="/icons/favicon-512x512.png" alt="Ranked Voting Icon" />
        </a>

        <a
            href="/#"
            role="button"
            class="navbar-burger"
            data-target="navMenu"
            aria-label="menu"
            aria-expanded="false"
        >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
        </a>
    </div>

    <!-- navbar start, navbar end -->
    <div class="navbar-menu" id="navMenu">
        <div class="navbar-start">
            <a class="navbar-item" href="#/"> Home </a>

            <a class="navbar-item" href="#/about"> About </a>
        </div>
    </div>
</nav>

<Router {routes} on:conditionsFailed={onConditionsFailed} />

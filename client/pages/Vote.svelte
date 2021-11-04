<style>
    .sortable > div {
      -webkit-touch-callout:none;
      -ms-touch-action:none; touch-action:none;
      -moz-user-select:none; -webkit-user-select:none; -ms-user-select:none; user-select:none;
    }
  
    div:global(.ui-sortable-placeholder) { height:20px }
  
    .listItemHandle {
      display:block; position:absolute;
      top:0px; right:4px; width:24px; height:24px;
      background-color:transparent;
      background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAUklEQVRYR+3UwREAIAgDQWiXgtKuFqA+MTzOAiSzBjPMJ83zgwAIXAUkrY5yVtUxjwAzBTre/3UnazizA/wDdgHW0C5g7wAB7AL2EhIAAQR+CmweoTAhD/IaqwAAAABJRU5ErkJggg==");
      cursor:grab;
    }
  </style>

<script context="module">
    import { enableBodyScroll, disableBodyScroll } from 'body-scroll-lock'
  </script>

<script lang="ts">
    import type Item from "../interfaces/Item";
    import type Ballot from "../interfaces/Ballot";
    import { sortable } from "svelte-agnostic-draggable";
    import { onMount } from "svelte";
    /**** map all touch events to mouse events ****/
    import mapTouchToMouseFor from "svelte-touch-to-mouse";
    mapTouchToMouseFor(".listItemHandle");

    let ballot: Ballot;
    let winner: Item;
    let listView;
    let listItems: string[];
    let remainingListItems: string[];

    export let params = {};

    onMount(async () => {
        const listItemsResponse = await fetch(
            `http://127.0.0.1:8000/api/ballot?token=${params.token}`,
            {
                credentials: "omit",
            }
        );
        ballot = await listItemsResponse.json();
        listItems = ballot.selected_items.map((x) => x.title);
        remainingListItems = ballot.remaining_items.map((x) => x.title);

        const getResultsResponse = await fetch(
            "http://127.0.0.1:8000/api/results"
        );
        winner = await getResultsResponse.json();
    });

    function onSortableActivate() {
        disableBodyScroll(document.body);
    }

    function onSortableDeactivate() {
        enableBodyScroll(document.body);
    }

    async function onSortableUpdate() {
        let votes: number[] = [];
        const itemViewList: HTMLCollection = listView.children;
        for (let i: number = 0, l = itemViewList.length; i < l; i++) {
            const htmlElement = itemViewList[i];
            if (htmlElement.id === "not-included-on-ballot") {
                break;
            }

            const listKey: string = htmlElement.dataset.listKey;
            if (listKey) {
                const item: Item = ballot.selected_items
                    .concat(ballot.remaining_items)
                    .find((x: Item) => x.title === listKey);
                votes.push(item.id);
            }
        }

        await sendBallot(votes);
        const getResultsResponse = await fetch(
            "http://127.0.0.1:8000/api/results"
        );
        winner = await getResultsResponse.json();
    }

    async function sendBallot(votes: number[]) {
        await fetch(
            `http://127.0.0.1:8000/api/vote/?token=${params.token}`,
            {
                method: "POST",
                cache: "no-cache",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "omit",
                body: JSON.stringify(votes),
            }
        );
    }
</script>

<section class="section">
    <div class="container">
        {#if winner}
            <div class="card">
                <header class="card-header">
                    <p class="card-header-title">The winner of the election</p>
                </header>
                <div class="card-content">
                    <div class="content">
                        <p class="title">
                            {winner.title}
                        </p>

                        <p class="subtitle">
                            {winner.body}
                        </p>
                    </div>
                </div>
            </div>
        {/if}
        <br />
        <div class="columns">
            <div class="column">
                <p class="subtitle">I'm voting for:</p>
                {#if listItems}
                    <div
                        class="sortable > div"
                        bind:this={listView}
                        use:sortable={{
                            cursor: "grabbing",
                            handle: ".listItemHandle",
                            tolerance: "intersect",
                            zIndex: 10,
                        }}
                        style="display:block; position:relative; width:200px; margin:20px"
                        on:sortable:activate={onSortableActivate}
                        on:sortable:deactivate={onSortableDeactivate}
                        on:sortable:update={onSortableUpdate}
                    >
                        {#each listItems as listItem}
                            <div
                                data-list-key={listItem}
                                style="display:inline-block; position:relative;width:198px; border:solid 1px black; margin:1px; padding:5px;background-color:hsl(200deg,50%,90%);line-height:20px;"
                            >
                                {listItem}
                                <div class="listItemHandle" />
                            </div>
                        {/each}
                        <!-- <hr id="vote-line" /> -->
                        <p id="not-included-on-ballot" class="help is-danger">
                            I do not want to vote for:
                        </p>
                        {#each remainingListItems as listItem}
                            <div
                                data-list-key={listItem}
                                style="display:inline-block; position:relative;width:198px; border:solid 1px black; margin:1px; padding:5px;background-color:hsl(200deg,50%,90%);line-height:20px;"
                            >
                                {listItem}
                                <div class="listItemHandle" />
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
</section>
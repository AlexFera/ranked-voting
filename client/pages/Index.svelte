<script lang="ts">
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import type Item from "../interfaces/Item";

    let isValid: boolean = true;
    let validationMessage: string = "";
    let username: string;
    let winner: Item;

    onMount(async () => {
        const getWinnerResponse = await fetch(
            "http://127.0.0.1:8000/api/results"
        );
        winner = await getWinnerResponse.json();
    });

    const handleCreateUser = async () => {
        isValid = true;
        validationMessage = "";
        if (
            !username ||
            !username.match(/^[a-zA-Z0-9\-\.\_]+$/) ||
            username.length > 50
        ) {
            isValid = false;
            validationMessage = "Username is invalid";
            return;
        }

        const user = {
            id: 0,
            username: username,
        };

        const response = await fetch("http://127.0.0.1:8000/api/user/", {
            method: "POST",
            cache: "no-cache",
            credentials: "omit",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const obj = await response.json();
        if (obj.status === "error") {
            isValid = false;
            validationMessage = obj.reason;
        } else {
            push(`/vote/${obj.token}`);
        }
    };
</script>

<section class="hero is-primary">
    <div class="hero-body">
        <p class="title">Welcome</p>
        <p class="subtitle">to Ranked Voting</p>
    </div>
</section>

<section class="section">
    <div class="container">
        {#if winner}
            <div class="card">
                <header class="card-header">
                    <p class="card-header-title">
                        The winner of the current election
                    </p>
                </header>
                <div class="card-content">
                    <div class="content">
                        <p class="title">{winner.title}</p>
                        <p class="subtitle">{winner.body}</p>
                    </div>
                </div>
            </div>
        {/if}
        <br />
        <h1 class="title">Cast your own vote</h1>
        <form on:submit|preventDefault>
            <div class="field">
                <label class="label" for="username">Username</label>
                <div class="control">
                    <input
                        bind:value={username}
                        id="username-input"
                        class="input"
                        class:is-danger={!isValid}
                        type="text"
                        name="username"
                        placeholder="Enter a unique username"
                    />
                </div>
                {#if !isValid}
                    <span class="validation-hint">
                        <p class="help is-danger">{validationMessage}</p>
                    </span>
                {/if}
            </div>

            <div class="field is-grouped">
                <div class="control">
                    <button
                        on:click={handleCreateUser}
                        class="button is-primary"
                    >
                        Register me to vote
                    </button>
                </div>
            </div>
        </form>
        <br />
    </div>
</section>

<section id="about" class="section">
    <div class="container">
        <h1 class="title">Ranked Voting</h1>
        <br />
        <h2 class="subtitle">
            This is a Web App example that uses <a href="https://svelte.dev"
                >Svelte</a
            >
            as the frontend with Rust <a href="https://rocket.rs">Rocket</a> as
            the backend API to do
            <a href="https://ballotpedia.org/Ranked-choice_voting_(RCV"
                >ranked choice voting.</a
            >
        </h2>
        <h2 class="subtitle">
            Each user ranks the candidates according to their preference, and an
            election is run after each vote is cast.
        </h2>
        <h2 class="subtitle">
            The implementation is <em>not</em> secure. There is no registration mechanism.
            Users simply identity with a self-chosen username, so any user can change
            any other&#39;s ballot simply by giving their username.
        </h2>

        <h2 class="subtitle">
            Built With:
            <ul>
                <li><a href="https://rocket.rs/">Rocket</a></li>
                <li><a href="https://svelte.dev/">Svelte</a></li>
                <li><a href="https://bulma.io">Bulma</a></li>
            </ul>         
        </h2>
    </div>
</section>

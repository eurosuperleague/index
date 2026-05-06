# ESL Media Article Template Guide

This guide is for humans or AIs creating future files inside `2bslmedia/content/articles/`.

The goal is simple:
- every article should keep the same ESL Media article shell
- every article should auto-pick up the shared right rail
- every article should look like the existing newspaper-style pages without custom rebuilding

## Required file setup

Every article file should:
- live in `2bslmedia/content/articles/`
- be a standalone `.html` file
- include `@import url("../media-shared.css");` inside its `<style>` block
- use `<body class="media-article">`
- include one main article container: `<div class="paper"> ... </div>`
- include the shared rail script before `</body>`:

```html
<script src="../article-rail.js"></script>
</body>
```

The `article-rail.js` script automatically:
- nudges the article layout left on desktop
- adds a right rail
- shows a recommended-articles list
- shows two random ads from `2bslmedia/content/Ads/`

## Required page structure

Use this structure in order:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARTICLE TITLE - ESL Media</title>
  <style>
    @import url("../media-shared.css");

    :root {
      --gold: #111b36;
      --ink: #0F0F0F;
      --off-white: #F5F0E8;
      --red: #111b36;
      --mid: #3A3A3A;
      --light: #E8E2D5;
    }

    /* Add only article-specific styles here */
  </style>
</head>
<body class="media-article">
  <header class="site-topbar">
    <div class="site-topbar-inner">
      <div class="site-topbar-brand">
        <div class="site-edition-pill">Front Page</div>
        <div>European Super League Sports Desk</div>
      </div>
      <ul class="site-topbar-nav">
        <li><a href="../../homepage.html" class="active">Home</a></li>
        <li><a href="../all-articles.html">All Articles</a></li>
        <li><a href="../articles/ecl_awards_predictions.html">Latest</a></li>
        <li><a href="../analysis.html">Analysis</a></li>
        <li><a href="../scouting.html">Scouting</a></li>
        <li><a href="../../index.htm">League Site</a></li>
      </ul>
    </div>
  </header>

  <div class="site-ticker">
    <div class="site-ticker-inner">
      <span class="site-ticker-label">Top Story</span>
      <div class="site-ticker-track">
        <div class="site-ticker-item">Ticker item one</div>
        <div class="site-ticker-item">Ticker item two</div>
        <div class="site-ticker-item">Ticker item one</div>
        <div class="site-ticker-item">Ticker item two</div>
      </div>
    </div>
  </div>

  <div class="paper">
    <div class="masthead">
      <div class="league-name">European Super League - Feature</div>
      <div class="section-label">Category - Desk - Season</div>
    </div>

    <h1 class="headline">Article headline here</h1>
    <p class="dek">One-sentence deck here.</p>

    <div class="byline-bar">
      <span class="byline">Author Name</span>
      <span class="dateline">Season and descriptor</span>
    </div>

    <div class="body-text">
      <p class="drop-cap">First paragraph starts here.</p>
      <p>Second paragraph.</p>
    </div>

    <hr class="footer-rule">
    <div class="footer-text">European Super League - Season - Desk</div>
  </div>

  <script src="../article-rail.js"></script>
</body>
</html>
```

## Writing rules

Use these conventions:
- headline in title case
- dek is 1 sentence, 20 to 35 words
- byline line is short and uppercase-friendly
- first paragraph should use `class="drop-cap"`
- body copy should be broken into readable short paragraphs
- use `section-header` blocks for major subsections
- use existing helper classes like `pull-quote`, `stat-box`, `player-callout`, `section-header`, `footer-rule`, and `footer-text` when useful
- published article copy must read like a real sports article, not an AI note or production memo
- do not mention JSON files, templates, prompts, databases, repo structure, source extraction, or any behind-the-scenes workflow in the visible article
- writer persona guidance is internal only and should shape the prose without being named inside the article body

## Approval rule

Before generating any new article, always ask the user for approval in chat first.

Do not draft immediately, even if the angle sounds clear.

Confirm these before writing:
- article format: one article or multiple articles
- tier/category: CLB, ELB, ECL, Analysis, Scouting, etc.
- rough length
- writer persona/voice
- whether it should be added to homepage, analysis, scouting, or archive pages
- how it should appear on the homepage power board

Only start writing once the user answers.

Example confirmation:
- `Do you want this as one article or three separate pieces, and which writer voice should I use?`

## Writer personas

Use a named writer persona for every future article request.

Default options:
- `Damon Cross`
  Voice: loud, confrontational, TV-debate energy, inspired by a Stephen A.-style columnist.
  Best for: awards takes, contender pressure pieces, panic meter columns, bold predictions.
- `Nina Vale`
  Voice: data-first, measured, analytical, evidence-heavy.
  Best for: power rankings, standings breakdowns, league leader analysis, trend stories.
- `Graham Trent`
  Voice: dry, observant, polished, lightly wry long-form reporter.
  Best for: profiles, features, scene-setting pieces, club identity essays.
- `Malik Sparks`
  Voice: high-energy comedy columnist with rapid-fire reactions, exaggerated disbelief, sharp self-awareness, and a big little-man chip on his shoulder. The rhythm should feel fast, animated, and punchline-heavy while still landing real basketball points.
  Best for: roast columns, chaotic game reactions, fan frustration pieces, locker-room absurdity, funny panic-meter articles, and stories where the league needs to be laughed at before it gets analyzed.

Always note the chosen persona in the article plan before drafting.

## Team-biased reporter personas

Use these when the article should read like a biased fan-columnist for a specific team. Each reporter has the same base personality, but the name changes by team.

Shared voice: biased fan-columnist with long-memory grudges, half-serious historical comparisons, confident overreactions, fake-objective analysis, and constant references to how this team has spiritually changed them. Funny, nostalgic, self-important, weirdly persuasive, and always convinced their team's pain or greatness matters more than everyone else's.

Best for: team-biased columns, homer previews, rivalry pieces, legacy debates, emotional playoff reactions, front-office second guessing, fanbase therapy articles, and arguments where the conclusion was clearly decided before the evidence was gathered.

Team assignments:
- `AC Milan` - `Marco Redline`
- `AFC Richmond` - `Ted Pressbox`
- `Ajax` - `Johan Backpage`
- `Aston Villa` - `Vinnie Midlands`
- `Atletico Madrid` - `Diego Grudge`
- `Barcelona` - `Pablo Parquet`
- `Bayern Munich` - `Klaus Banner`
- `Benfica` - `Rui Ledger`
- `Brighton` - `Benny Seaside`
- `Chelsea` - `Grant Bridge`
- `Crystal Palace` - `Eddie Selhurst`
- `FL Fart` - `Barry Windham`
- `Inter Milan` - `Luca Nerazzurri`
- `Juventus` - `Tony Turin`
- `Manchester City` - `Cal Bluebook`
- `Manchester United` - `Marty Trafford`
- `Marseille` - `Remy Southstand`
- `Monaco` - `Luc Riviera`
- `Paris Saint-Germain` - `Nico Parc`
- `Real Madrid` - `Sergio Crown`
- `Sheffield United` - `Billy Bramall`
- `Sporting CP` - `Nuno Greenroom`
- `Tottenham Hotspur` - `Harry Northbank`
- `Valencia` - `Mateo Mestalla`

## Style rules

Keep the tone consistent with the current site:
- serious sports-desk/editorial voice
- newspaper-like pacing
- strong serif headline, clean sans-serif metadata
- no bright colors
- blue-led accents only
- no custom page chrome unless absolutely necessary

## If making a brand-new article

Follow this checklist:
1. Copy an existing article file as the base.
2. Replace title, headline, dek, byline, dateline, masthead labels, ticker items, and body copy.
3. Keep the shared header classes unchanged.
4. Keep the `.paper` wrapper unchanged.
5. Keep the `<script src="../article-rail.js"></script>` line in place.
6. Add only the minimum extra CSS needed for that specific article.

## If updating recommendations

The live article metadata is powered by:
- `2bslmedia/content/media-articles.js`

The right-rail recommendation list is rendered from that shared manifest through:
- `2bslmedia/content/article-rail.js`

When a new article is added, add its metadata object there:
- `file`
- `title`
- `category`
- `desk`
- `sortKey`
- `tag`
- `author`
- `meta`
- `blurb`

If you skip this step, the page will still render, but the new article will not appear in recommendations.

## Homepage power board rule

Every newly published article must also be placed on the homepage power board in:
- `2bslmedia/homepage.html`

That is a required publishing step, not an optional promo step.

When adding a new article:
1. update the homepage power board entry text and link
2. make sure the board reflects the newest live stories first
3. remove older placeholder or superseded entries if space is limited

Do not publish a new article without updating the homepage power board to include it.



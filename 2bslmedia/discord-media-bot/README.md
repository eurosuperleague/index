# ESL Media Discord Bot

This bot watches the ESL Media article manifest and posts in Discord whenever a new article appears.

## What it does

- reads `../content/media-articles.js`
- remembers which articles it has already announced
- posts only new articles to a Discord channel
- can optionally ping a role each time

## Setup

1. Create a Discord bot in the Discord Developer Portal.
2. Invite it to your server with permission to:
   - `View Channels`
   - `Send Messages`
   - `Embed Links`
3. Copy `.env.example` to `.env`.
4. Fill in:
   - `DISCORD_BOT_TOKEN`
   - `DISCORD_CHANNEL_ID`
   - optional `DISCORD_ROLE_ID`

## Run it

From `2bslmedia/discord-media-bot`:

```powershell
npm run once
```

That checks once and posts any articles it has not announced yet.

For continuous polling:

```powershell
npm start
```

By default it checks every 5 minutes.

## GitHub Actions

If you want this to run automatically without keeping your PC on, use the GitHub Actions workflow in:

- `.github/workflows/esl-media-discord.yml`

Add these repository secrets in GitHub:

- `DISCORD_BOT_TOKEN`
- `DISCORD_CHANNEL_ID`
- optional `DISCORD_ROLE_ID`

Once those secrets are set, GitHub Actions will:

- check the article manifest every 5 minutes
- post only newly published articles
- update the tracked state file automatically

The state file is:

- `2bslmedia/discord-media-bot/data/announced-articles.json`

It is intentionally committed so GitHub Actions knows what has already been announced across runs.

## How publishing works

The bot reads from:

- `2bslmedia/content/media-articles.js`

That means once a new article is added to the live media manifest, the bot will see it and announce it on the next check.

## Important note

The bot stores its announced state locally in:

- `2bslmedia/discord-media-bot/data/announced-articles.json`

If you delete that file, it will treat all current articles as unannounced again.

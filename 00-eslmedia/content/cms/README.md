# ESL Media Static CMS

This is the no-backend CMS flow for ESL Media.

Editors use `00-eslmedia/admin/index.html`, powered by Decap CMS, to create JSON article entries in `00-eslmedia/content/cms/articles/`. The public site does not read those draft files directly.

When content is ready, run:

```powershell
py -3 00-build/scripts/build_esl_media_static_cms.py
```

The build exports entries with `status: "published"` and scheduled entries whose publish date has arrived. It writes article HTML into `00-eslmedia/content/articles/` and injects generated manifest entries into `00-eslmedia/content/media-articles.js` between the CMS markers.

No local SQLite database or private app server is required. The only hosted piece needed for the online editor is Decap CMS GitHub authentication, which lets the admin page commit CMS JSON files back to this repository.

## Community Submission Import

The public submission preview page at `00-eslmedia/content/submit.html` has **Copy CMS JSON** and **Download JSON** buttons.

To import one of those submissions:

1. Open `00-eslmedia/admin/import.html`.
2. Choose the downloaded JSON file.
3. Copy the normalized JSON and create a matching file in `00-eslmedia/content/cms/articles/`.
4. Open Decap Admin and edit/review the new article entry.
4. Change `status` to `published` when ready.
5. Run `py -3 00-build/scripts/build_esl_media_static_cms.py`.

# 🌷 Buddy To-Do

A cute to-do list that lives on your phone like an app. It shows your Google Calendar schedule next to your tasks, and Pebble (your little otter buddy 🦦) cheers you on and sends reminders.

Everything is plain HTML/CSS/JS, so it runs free on GitHub Pages. Your tasks are saved on your phone (in the browser's storage).

---

## Step 1: Put it on GitHub Pages (about 5 minutes)

1. Sign in at [github.com](https://github.com) and click **New repository**.
   - Name it `buddy-todo` (or anything you like), set it to **Public**, and click **Create repository**.
2. On the new repo page, click **uploading an existing file**. Drag in **all the files and the `icons` folder** from this folder (`index.html`, `styles.css`, `app.js`, `config.js`, `sw.js`, `manifest.webmanifest`, `icons/`). Click **Commit changes**.
3. Go to **Settings → Pages**. Under "Build and deployment", pick **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. After a minute your site is live at:
   `https://YOUR-GITHUB-USERNAME.github.io/buddy-todo/`

## Step 2: Connect Google Calendar (about 10 minutes, one time)

Google needs to know your site is allowed to ask for calendar access.

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and create a **new project** (e.g. "Buddy To-Do").
2. Search for **Google Calendar API** and click **Enable**.
3. Open **APIs & Services → OAuth consent screen** (it may be called **Google Auth Platform**):
   - User type: **External**. App name: "Buddy To-Do". Add your email where it asks.
   - Under **Audience / Test users**, add your own Gmail address. (Leaving the app in "Testing" is fine. It's just for you.)
4. Open **Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins:** `https://YOUR-GITHUB-USERNAME.github.io`
   - **Authorized redirect URIs:** `https://YOUR-GITHUB-USERNAME.github.io/buddy-todo/` (keep the slash at the end)
   - Click **Create** and copy the **Client ID**.
5. In your GitHub repo, open `config.js`, click the ✏️ pencil, paste the Client ID in place of `PASTE_YOUR_CLIENT_ID_HERE`, and commit.
6. Open your site, tap **Connect Google Calendar**, and approve. Google may warn "this app isn't verified". That's normal for a personal app: tap **Continue**.

## Step 3: Install it on your phone

- **iPhone:** open the link in **Safari** → tap the **Share** button → **Add to Home Screen**. Then open Buddy **from the home screen icon** and go to ⚙️ Settings → **Turn on notifications**. (Requires iOS 16.4 or newer.)
- **Android:** open the link in **Chrome** → ⋮ menu → **Install app** / **Add to Home screen**. Then ⚙️ Settings → **Turn on notifications**.

---

## How reminders work (please read 💗)

A website on GitHub Pages has no server running in the background, so there are two kinds of reminders:

| Reminder | When it works |
|---|---|
| **Buddy notifications** for task times and upcoming events | While the app is open or was used recently. Phones pause web apps in the background, so these can be late or skipped if Buddy has been closed a while. |
| **"Also put it on my Google Calendar"** switch on a task | **Always**, even when Buddy is closed. The task becomes a calendar event with an alert at that time, so your phone's calendar app sends the notification. |

So for anything you really can't miss, flip on the Google Calendar switch when you add the task. Make sure notifications are on for the **Google Calendar app** (or the iPhone Calendar app, if your Google account is synced there).

## Customizing

- ⚙️ **Settings** lets you rename your otter, change its fur color, and pick how early you get event reminders.
- **Categories:** 8 come built in, each with its own color: 📚 School, 💼 Work, 🧹 Chores, 💪 Health, 🛁 Self-care, 🛒 Errands, 💬 Social and 🎮 Fun. As you type a task, Pebble picks the category for you ("dentist" → Health, "laundry" → Chores). Tap another one if Pebble guessed wrong. In Settings you can rename them, change the emoji, tap the color dot to recolor, or add your own. Pebble auto-picks a category you made when the task contains words from its name. To teach Pebble new words for the built-in ones, edit `CATEGORY_KEYWORDS` in `app.js`.
- **Importance:** every task is 🔥 High, ⭐ Medium or 🌱 Low. Tasks with a time are listed first under "Timed" in clock order. Everything else is sorted from most to least important.
- Tap your buddy for encouragement 💕
- Unfinished tasks from earlier days carry over to today automatically.
- Tap any task to edit or delete it.

## Updating the app later

Edit files on GitHub and commit. If your phone keeps showing an old version, change `buddy-v1` to `buddy-v2` at the top of `sw.js`, then close and reopen the app.

# Getting Started with RAIS² Newsletter Manager

This guide will help you set up the RAIS² Newsletter Manager on your computer. No programming experience needed — just follow the steps below.

## What You Need

- A computer (Windows, Mac, or Linux)
- A web browser (Google Chrome recommended, Firefox also works)
- Python 3 (a free program — we'll show you how to install it)
- The project files (we'll show you how to get them)

## Step 1: Install Python

Python is a program that lets us run a small web server on your computer. You only need to install it once.

### On Mac

Mac usually comes with Python pre-installed. Open **Terminal** (search for "Terminal" in Spotlight with Cmd+Space) and type:

```bash
python3 --version
```

If you see a version number (like `Python 3.11.5`), you're all set. If not, download it from [https://www.python.org/downloads/](https://www.python.org/downloads/).

### On Windows

1. Go to [https://www.python.org/downloads/](https://www.python.org/downloads/)
2. Click the big yellow **Download Python** button
3. Run the installer
4. **IMPORTANT:** Check the box that says **"Add Python to PATH"** at the bottom of the installer window
5. Click **Install Now**

To verify the installation, open **Command Prompt** (search for "cmd" in the Start menu) and type:

```bash
python --version
```

or

```bash
python3 --version
```

If you see a version number, the installation was successful.

### On Linux

Open a terminal and run:

```bash
sudo apt install python3   # Ubuntu / Debian
# or
sudo dnf install python3   # Fedora
```

## Step 2: Get the Project Files

### Option A: Download as ZIP (Easiest)

1. Go to the project page on GitHub
2. Click the green **Code** button
3. Click **Download ZIP**
4. Extract the ZIP file to a folder on your computer (for example, your Desktop)

### Option B: Using Git (If You Have It Installed)

```bash
git clone <repository-url>
```

Replace `<repository-url>` with the actual URL of the repository.

## Step 3: Start the Server

### On Mac / Linux

1. Open **Terminal**
2. Navigate to the project folder. For example, if you extracted it to your Desktop:
   ```bash
   cd ~/Desktop/rais2-newsletter-static
   ```
3. Start the server:
   ```bash
   python3 -m http.server 8080
   ```
4. You should see a message like: `Serving HTTP on :: port 8080 ...`

### On Windows

1. Open **Command Prompt** (search for "cmd" in the Start menu)
2. Navigate to the project folder:
   ```bash
   cd C:\Users\YourName\Desktop\rais2-newsletter-static
   ```
   Replace `YourName` with your actual Windows username.
3. Start the server:
   ```bash
   python -m http.server 8080
   ```
   or
   ```bash
   python3 -m http.server 8080
   ```
4. You should see a message like: `Serving HTTP on :: port 8080 ...`

> **What does this do?** It turns your computer into a tiny web server that only you can access. The data stays on your machine — no one else on the internet can see it.

## Step 4: Open in Your Browser

1. Open Google Chrome (or Firefox)
2. Type this address in the address bar: **http://localhost:8080**
3. Press Enter
4. You should see the RAIS² Newsletter Manager dashboard

> **What is localhost?** "localhost" means your computer is talking to itself. It's like calling your own phone number — the data never leaves your machine. Everything runs locally.

## Stopping the Server

When you're done working:

1. Go back to the Terminal or Command Prompt window where the server is running
2. Press **Ctrl + C** on your keyboard
3. The server will stop

Next time you want to use the newsletter tool, just start again from **Step 3**. Your data is saved in the browser automatically and will still be there.

## Troubleshooting

### "python3: command not found"

- **Windows:** Try `python` instead of `python3`. On Windows, the command is sometimes just `python`.
- **Mac:** Install Python from [https://www.python.org/downloads/](https://www.python.org/downloads/) and try again.
- **All systems:** Make sure you close and reopen your terminal after installing Python so it picks up the new installation.

### "Address already in use" (Port 8080)

Another program is already using port 8080. Try a different port number:

```bash
python3 -m http.server 8081
```

Then open [http://localhost:8081](http://localhost:8081) in your browser instead.

### Page shows old content or changes are not appearing

The newsletter tool uses a service worker that caches files for offline use. Sometimes this means you see an older version of a page. To fix this:

1. **Quick fix:** Add `?nocache=1` to the end of the URL (for example, `http://localhost:8080?nocache=1`)
2. **Full fix:** Open Chrome DevTools (press **F12**), go to the **Application** tab, click **Service Workers** in the left sidebar, and click **Unregister**. Then reload the page.

### Blank page or errors in the browser

- Make sure you are in the correct folder — the one that contains the file `index.html`. You can check by listing the files:
  ```bash
  ls        # Mac / Linux
  dir       # Windows
  ```
  You should see `index.html`, `builder.html`, `css/`, `js/`, and other project files.
- Check that the terminal still shows the server running. If it stopped, start it again.
- Try opening the page in a different browser.
- Open the browser's developer console (press **F12**, then click the **Console** tab) to see if there are any error messages.

### Data seems to have disappeared

All data is stored in your browser's localStorage. This means:

- If you switch to a different browser, you won't see your data (it's saved per browser).
- If you clear your browser data or cookies, your newsletter data will be deleted too.
- Using a private/incognito window will start with a blank slate.

To avoid losing work, use the **Archive** feature to save completed newsletters and consider exporting important data regularly.

## What's Next?

Now that the tool is running, here are some guides to help you get the most out of it:

- **[User Guide](user-guide-en.md)** — Learn how to use all features: scraping, CSV import, building newsletters, and more
- **[Email Setup](email-setup-en.md)** — Configure email sending so you can send newsletters directly via Gmail
- **[AI Assistant Setup](ai-setup-en.md)** — Set up AI-assisted text generation to help write newsletter content (free options available)

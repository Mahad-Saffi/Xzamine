# Xzamine Chrome Extension

## Overview
The **Xzamine** is a Chrome extension that helps users analyze tweets for compliance with Pakistan’s **Prevention of Electronic Crimes Act (PECCA)**. It uses AI-powered analysis to provide real-time feedback on the legality of tweets.

---

## Features
- **Real-Time Tweet Analysis**: Adds a "Check Legality" button under each tweet on X (Twitter).
- **Custom Tweet Checker**: Allows users to check tweet text for legality verification.
- **AI-Powered Feedback**: Displays whether a tweet is compliant or violating, along with relevant details.
- **Dynamic Integration**: Automatically detects new tweets and adds functionality.

---

## Installation
1. Clone or download this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer Mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `extension` folder from this project.
5. The extension will now appear in your Chrome toolbar.

---

## Usage
1. Navigate to Twitter.
2. Use the "Check Legality" button under tweets to analyze their compliance.
3. Open the extension popup to manually check custom tweet text.

---

## File Structure
extension/
├── icons/              # Extension icons
├── popup/              
│   ├── popup.html      # Popup UI
│   ├── popup.css       # Popup styling
│   └── popup.js        # Popup functionality
├── content.js          # Injects functionality into Twitter's UI
├── background.js       # Handles background tasks and messaging
├── manifest.json       # Extension configuration
└── README.md           # Project documentation

---

## Future Enhancements
- Add support for other social media platforms.
- Improve UI/UX for better user experience.

---

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.
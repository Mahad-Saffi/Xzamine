# Xzamine

## Overview
**Xzamine** is a Legal Post Checker Chrome extension designed to analyze posts on X for compliance with Pakistan’s **Prevention of Electronic Crimes Act (PECA)**. It leverages AI-powered sentiment and legal analysis using the Gemma3 model (locally via Ollama) and GPT-4o-mini (via OpenAI API) to provide real-time feedback on the legality and sentiment of posts, helping users identify potentially non-compliant content.

---

## Table of Contents
- [Features](#features)
- [Technical Stack](#technical-stack)
- [How It Works](#how-it-works)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [Contributors](#contributors)
- [License](#license)

---

## Features
- **Real-Time Post Analysis**: Adds an "Analyze" button to each post on X, enabling users to check posts for compliance and sentiment with a single click.
- **Sentiment Feedback**: Displays the sentiment of the post (e.g., "Normal Post" or a PECA violation category like "Hate Speech (Sec 10A)") directly on the button after initial analysis.
- **Detailed Compliance Reports**: Provides a "Show Report" button after detailed analysis is received, opening a new tab with a comprehensive report including:
  - Post owner, username, and content.
  - Sentiment and confidence score.
  - Detailed analysis with probabilities for each PECA category, toxic score, cultural context, legal definitions, protected group analysis, and rationale.
- **Dynamic Integration**: Uses a MutationObserver to automatically detect and add analysis buttons to newly loaded posts on X.
- **Error Handling**: Displays error messages on the button if analysis fails, ensuring user feedback in all scenarios.

---

## Technical Stack
- **Frontend**:
  - **Languages**: HTML, CSS, JavaScript
  - **Chrome Extension API**: Manifest V3, utilizing `chrome.runtime` for messaging and `chrome.tabs` for report display.
- **Backend**:
  - **Language**: Python
  - **Framework**: Flask, running on a local server (`http://127.0.0.1:3000`), defined in `server.py`.
  - **Task Queue**: Celery, with Redis as the message broker and result backend (configured in `xzamine.py`).
  - **Structure**:
    - `server.py`: Main Flask application script that defines API endpoints (`/data` for post analysis, `/task/:task_id` for polling detailed results).
    - `server/` (package):
      - `xzamine.py`: Core logic for post analysis, integrating Gemma3 (via `ChatOllama`) and GPT-4o-mini (via `ChatOpenAI`) for sentiment and legal compliance checks. Uses Celery for asynchronous detailed analysis.
      - `analysis_structured_output.py`: Defines Pydantic models (`SentimentResult` and `Analysis`) for structured output of sentiment and detailed analysis results.
      - `prompt.py`: Placeholder for prompt management (currently empty, but intended to manage prompts for AI models).
    - `.env`: Stores environment variables, such as the OpenAI API key, Celery broker URL, and model type (`MODEL_TYPE` to toggle between `openai` and `ollama`).
  - **AI Models**:
    - **Local**: Gemma3 (via `ChatOllama`, defaulting to `Gemma3`) for local sentiment and compliance analysis.
    - **External**: GPT-4o-mini (via `ChatOpenAI`) for enhanced natural language processing and legal analysis.
  - **Dependencies**:
    - `langchain-openai` and `langchain-ollama` for model integration.
    - `pydantic` for structured output parsing.
    - `flask-cors` for handling CORS in Flask.
- **Styling**: Custom CSS for buttons and report pages, with responsive design and visual feedback (e.g., color-coded sentiment indicators).

---

## How It Works
1. **Post Detection**: The extension scans X for post containers and appends an "Analyze" button to each post using a MutationObserver (`content.js`).
2. **Analysis Trigger**: Clicking the "Analyze" button sends post data (owner, username, text) to the background script (`background.js`).
3. **Sentiment Analysis**: The background script sends a POST request to `http://127.0.0.1:3000/data`. The Flask backend (`server.py`) processes the request by invoking `invoke_sentiment` from `xzamine.py`, which uses either Gemma3 or GPT-4o-mini (based on `MODEL_TYPE`) to analyze the post, returning sentiment and confidence scores structured as a `SentimentResult` object.
4. **Button Update**: The "Analyze" button updates to display the sentiment (e.g., green for "Normal Post," red for PECA violations).
5. **Detailed Analysis**: The `/data` endpoint triggers a Celery task (`process_detailed_analysis` in `xzamine.py`) for detailed analysis, returning a `task_id`. The extension polls `http://127.0.0.1:3000/task/:task_id` to retrieve the results, which are processed by `invoke_detailed_analysis` and structured as an `Analysis` object, including probabilities for all PECA categories, toxic score, and compliance details.
6. **Report Display**: Once detailed analysis is complete, a "Show Report" button appears, allowing users to view a comprehensive report in a new tab (`content.js`).

---

## Future Enhancements
- Expand support to other social media platforms (e.g., Facebook, Instagram).
- Enhance UI/UX with more interactive elements and improved report visualizations.
- Integrate additional legal frameworks for broader compliance checking.
- Add support for batch analysis of multiple posts.
- Implement caching for frequently analyzed posts to improve performance.

---

## Contributing
Contributions are welcome! Please fork this repository and submit a pull request with your changes. Ensure your code adheres to the existing structure and includes appropriate tests. For backend contributions, ensure compatibility with Flask, Celery, and the existing AI model integrations. Set up Redis locally for Celery to function properly.

---

## Contributors
- **[Abdul Rehman](https://github.com/aabr2612)** 
- **[Ahmad Bin Rashid](https://github.com/ahmad-bin-rashid)**
- **[Mahad Saffi](https://github.com/mahad-saffi)**

---

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

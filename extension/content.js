console.log('Content script running...');

const appendButtonToPosts = () => {
    const postDiv = document.querySelectorAll('.css-175oi2r.r-1iusvr4.r-16y2uox.r-1777fci.r-kzbkwu');

    postDiv.forEach((post) => {
        const buttonDiv = post.querySelector('.css-175oi2r.r-1awozwy.r-18u37iz.r-1cmwbt1.r-1wtj0ep');
        const postText = post.querySelectorAll('.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3');

        if (buttonDiv && !buttonDiv.querySelector('.custom-button')) {
            const button = document.createElement('button');
            button.innerText = 'Analyze';
            button.className = 'custom-button';
            button.style.cssText = `
                margin-left: 10px;
                padding: 4px 12px;
                border-radius: 20px;
                border: 1px solid #1d9bf0;
                background-color: #1d9bf0;
                color: white;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
            `;

            button.addEventListener('click', async () => {
                button.innerText = 'Checking...';
                button.style.opacity = '0.5';
                button.disabled = true;

                const allPostText = Array.from(postText).map(text => text.innerText);
                const postOwner = allPostText[0] || '';
                const postOwnerUsername = allPostText[3] || '';
                const postTextBody = allPostText.length >= 9 
                    ? allPostText.slice(5, -4).join(' ') 
                    : allPostText.join(' ') || 'No text';

                try {
                    const analyzeResponse = await new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage({
                            action: 'analyze_post',
                            postOwner,
                            postOwnerUsername,
                            postTextBody
                        }, (response) => {
                            if (chrome.runtime.lastError) {
                                reject(new Error(chrome.runtime.lastError.message));
                            } else if (!response || response.status !== 'success') {
                                reject(new Error('Invalid response from analyze_post'));
                            } else {
                                resolve(response);
                            }
                        });
                    });

                    let detailedAnalysis = null;
                    if (analyzeResponse.task_id) {
                        detailedAnalysis = await new Promise((resolve, reject) => {
                            const pollTask = async () => {
                                try {
                                    const response = await fetch(`http://127.0.0.1:3000/task/${analyzeResponse.task_id}`, {
                                        method: 'GET',
                                        headers: {'Content-Type': 'application/json'}
                                    });
                                    const data = await response.json();
                                    if (data.status === 'completed') {
                                        resolve(data.result);
                                    } else if (data.status === 'failed') {
                                        reject(new Error(data.error));
                                    } else {
                                        setTimeout(pollTask, 2000);
                                    }
                                } catch (error) {
                                    reject(error);
                                }
                            };
                            pollTask();
                        });
                    }

                    const reportButton = document.createElement('button');
                    reportButton.innerText = 'Show Report';
                    reportButton.className = 'report-button';
                    reportButton.style.cssText = `
                        margin-left: 10px;
                        padding: 4px 12px;
                        border-radius: 20px;
                        border: 1px solid #328c14;
                        background-color: #328c14;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.2s;
                    `;

                    button.innerText = analyzeResponse.sentiment;
                    button.style.opacity = '1';
                    button.disabled = false;
                    if (analyzeResponse.sentiment === 'Normal Post') {
                        button.style.backgroundColor = '#328c14';
                        button.style.borderColor = '#328c14';
                    } else {
                        button.style.backgroundColor = '#dc1919';
                        button.style.borderColor = '#dc1919';
                    }

                    reportButton.addEventListener('click', () => {
                        const resultsPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Post Analysis Results</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            background-color: #f5f7fa;
            color: #333;
        }
        .container {
            background: #ffffff;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a1a;
            text-align: center;
            padding-bottom: 16px;
            border-bottom: 2px solid #e0e0e0;
            margin-bottom: 20px;
        }
        .result-item {
            margin: 15px 0;
        }
        .result-item label {
            font-weight: 600;
            color: #555;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .result-item p {
            margin: 8px 0;
            color: #333;
            font-size: 16px;
        }
        .post-content {
            background-color: #f9f9f9;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #ddd;
            font-size: 15px;
            line-height: 1.5;
        }
        .sentiment-indicator {
            font-weight: 700;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            text-align: center;
            display: inline-block;
            margin-top: 8px;
        }
        .sentiment-normal {
            background: #e8f5e9;
            color: #2e7d32;
            border: 1px solid #a5d6a7;
        }
        .sentiment-warning {
            background: #ffebee;
            color: #c62828;
            border: 1px solid #ef9a9a;
        }
        .probability-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 10px;
        }
        .probability-item {
            background: #ffffff;
            padding: 14px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .probability-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .probability-label {
            font-size: 14px;
            color: #444;
            font-weight: 500;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .probability-value {
            font-weight: 600;
            color: #1d9bf0;
            font-size: 14px;
        }
        .probability-bar {
            height: 8px;
            background: #e8ecef;
            border-radius: 4px;
            overflow: hidden;
        }
        .probability-fill {
            height: 100%;
            background: linear-gradient(90deg, #1d9bf0, #4ab8ff);
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        .detail-card {
            padding: 16px;
            margin: 15px 0;
            border-left: 4px solid;
            border-radius: 6px;
            background: #fff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .legal-definition { border-color: #4caf50; background: #f1f8e9; }
        .cultural-context { border-color: #ff9800; background: #fff3e0; }
        .protected-group { border-color: #e53935; background: #ffebee; }
        .detail-title {
            font-size: 15px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 8px;
        }
        .detail-content {
            font-size: 14px;
            line-height: 1.6;
            color: #555;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Post Analysis Results</h1>
        <div class="result-item">
            <label>Post Owner:</label>
            <p>${postOwner}</p>
        </div>
        <div class="result-item">
            <label>Username:</label>
            <p>${postOwnerUsername}</p>
        </div>
        <div class="result-item">
            <label>Post Content:</label>
            <div class="post-content">
                <p>${postTextBody}</p>
            </div>
        </div>
        <div class="result-item">
            <label>Sentiment:</label>
            <p class="sentiment-indicator ${analyzeResponse.sentiment === 'Normal Post' ? 'sentiment-normal' : 'sentiment-warning'}">${analyzeResponse.sentiment}</p>
        </div>
        <div class="result-item">
            <label>Confidence:</label>
            <p>${(analyzeResponse.confidence * 100).toFixed(1)}%</p>
        </div>
        <div class="result-item">
            <label>Detailed Analysis:</label>
            <div id="detailed-analysis">
                ${detailedAnalysis ? `
                    <div class="probability-grid">
                        ${Object.entries(detailedAnalysis.probabilities || {})
                            .sort(([, a], [, b]) => b - a)
                            .map(([label, value]) => `
                                <div class="probability-item">
                                    <div class="probability-label">
                                        <span>${label}</span>
                                        <span class="probability-value">${(value * 100).toFixed(1)}%</span>
                                    </div>
                                    <div class="probability-bar">
                                        <div class="probability-fill" style="width: ${(value * 100).toFixed(1)}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                    </div>
                    <div class="result-item">
                        <div class="detail-title">Confidence Score</div>
                        <div class="detail-content">${(detailedAnalysis.confidence_score || 0).toFixed(2)}</div>
                    </div>
                    <div class="result-item">
                        <div class="detail-title">Toxic Score</div>
                        <div class="detail-content">${(detailedAnalysis.toxic_score || 0).toFixed(2)}</div>
                    </div>
                    <div class="detail-card cultural-context">
                        <div class="detail-title">Cultural Context</div>
                        <div class="detail-content">${detailedAnalysis.cultural_context || 'No context available'}</div>
                    </div>
                    <div class="detail-card legal-definition">
                        <div class="detail-title">Legal Definition</div>
                        <div class="detail-content">${detailedAnalysis.legal_definition || 'No legal definition available'}</div>
                    </div>
                    <div class="detail-card protected-group">
                        <div class="detail-title">Protected Group Analysis</div>
                        <div class="detail-content">${detailedAnalysis.protected_group_analysis || 'No group analysis available'}</div>
                    </div>
                    <div class="result-item">
                        <div class="detail-title">Rationale</div>
                        <div class="detail-content">${detailedAnalysis.rationale || 'No rationale available'}</div>
                    </div>
                ` : '<p>No detailed analysis available</p>'}
            </div>
        </div>
    </div>
</body>
</html>
                        `;

                        const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(resultsPage);
                        chrome.runtime.sendMessage({
                            action: 'open_results_tab',
                            url: dataUrl
                        });
                    });

                    button.parentNode.replaceChild(reportButton, button);
                } catch (error) {
                    console.error('Error:', error.message);
                    button.innerText = 'Error';
                    button.style.backgroundColor = '#dc1919';
                    button.style.borderColor = '#dc1919';
                    button.style.opacity = '1';
                    button.disabled = false;
                }
            });
            buttonDiv.appendChild(button);
        }
    });
};

appendButtonToPosts();
const observer = new MutationObserver(appendButtonToPosts);
observer.observe(document.body, { childList: true, subtree: true });
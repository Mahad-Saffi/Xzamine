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
            // Add your styling here
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

            button.addEventListener('click', () => {
                button.innerText = 'Checking...';
                const allPostText = Array.from(postText).map(text => text.innerText);
                const postOwner = allPostText[0] || '';
                const postOwnerUsername = allPostText[3] || '';
                const postTextBody = allPostText.length >= 9 
                    ? allPostText.slice(5, -4).join(' ') 
                    : allPostText.join(' ') || 'No text';

                chrome.runtime.sendMessage({
                    action: 'analyze_post',
                    postOwner,
                    postOwnerUsername,
                    postTextBody
                }, (response) => {
                    if (!response) {
                        handleError(button);
                        return;
                    }
                    
                    if (response.status === 'success') {
                        button.style.opacity = '1';
                        button.innerText = response.sentiment;
                        
                        if (response.sentiment === 'Normal Post') {
                            button.style.backgroundColor = '#328c14';
                            button.style.borderColor = '#328c14';
                        } else {
                            // Red color for any non-normal sentiment
                            button.style.backgroundColor = '#dc1919';
                            button.style.borderColor = '#dc1919';
                        }
                        
                        if (response.task_id) {
                            chrome.storage.local.set({
                                [response.task_id]: {
                                    post: postTextBody,
                                    sentiment: response.sentiment,
                                    confidence: response.confidence,
                                    task_id: response.task_id,
                                    status: 'pending'
                                }
                            });
                            pollDetailedAnalysis(response.task_id, button);
                        }
                    } else {
                        handleError(button);
                    }
                });
            });

            buttonDiv.appendChild(button);
        }
    });
};

const handleError = (button) => {
    console.error('Analysis failed');
    button.innerText = 'Normal';
    button.style.backgroundColor = '#328c14';  // Green color
    button.style.borderColor = '#328c14';
    button.style.opacity = '0.5';  // Half opacity for error state
};

const pollDetailedAnalysis = (taskId, button) => {
    const pollInterval = setInterval(() => {
        chrome.runtime.sendMessage({
            action: 'poll_task',
            task_id: taskId
        }, (response) => {
            if (response.status === 'completed') {
                clearInterval(pollInterval);
                button.title = `Confidence: ${response.result.confidence_score}\n` +
                             `Toxic Score: ${response.result.toxic_score}\n` +
                             `Rationale: ${response.result.rationale}\n` +
                             `Cultural Context: ${response.result.cultural_context}`;
            } else if (response.status === 'failed') {
                clearInterval(pollInterval);
                handleError(button);
                button.title = 'Analysis failed';
            }
        });
    }, 2000);
};

const observer = new MutationObserver(appendButtonToPosts);
observer.observe(document.body, { childList: true, subtree: true });
appendButtonToPosts();
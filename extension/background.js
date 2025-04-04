// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    const postData = {
        postOwner: request.postOwner,
        postOwnerUsername: request.postOwnerUsername,
        postTextBody: request.postTextBody,
    };
    console.log('Post data received:', postData);

    // send one of these 3 responses to content script
    sendResponse({ status: 'success', message: 'Legal' });
    // sendResponse({ status: 'failure', message: 'illegal' });
    // sendResponse({ status: 'error', message: 'Error' });


    // Handle the request to get post data

    // send an api call to AI model to check legality of postData if AI model check the data as legal, send response as true otherwise false
    // Example API call to AI model (replace with actual API call)
    // fetch('https://api.example.com/check-legality', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(postData),
    // })
    // .then(response => response.json())
    // .then(data => {
    //     // Process the response from the AI model
    //     console.log('AI model response:', data);
    //     // Assuming the AI model returns a legality status
    //     const isLegal = data.isLegal; // Replace with actual property from the response

    //     if (isLegal) {
    //         sendResponse({ status: 'success', message: 'Legal' });
    //     } else {
    //         sendResponse({ status: 'error', message: 'illegal' });
    //     }
    // })
    // .catch(error => {
    //     console.error('Error checking legality:', error);
    //     sendResponse({ status: 'error', message: 'Error' });
    // });

    // return true; // Keep the message channel open for sendResponse
});


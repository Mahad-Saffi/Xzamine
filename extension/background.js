chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyze_post') {
      const postData = {
          postOwner: request.postOwner,
          postOwnerUsername: request.postOwnerUsername,
          postTextBody: request.postTextBody
      };
      console.log('Sending to backend:', postData);
      fetch('http://127.0.0.1:3000/data', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(postData)
      })
          .then(response => {
              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
          })
          .then(data => {
              console.log('Backend response:', data);
              if (data.error) {
                  throw new Error(data.error);
              }
              sendResponse({
                  status: 'success',
                  message: 'Post analyzed successfully',
                  sentiment: data.sentiment,
                  confidence: data.confidence,
                  task_id: data.task_id
              });
          })
          .catch(error => {
              console.error('Error checking legality:', error);
              sendResponse({ status: 'error', message: error.message });
          });
      return true;
  } else if (request.action === 'poll_task') {
      fetch(`http://127.0.0.1:3000/task/${request.task_id}`, {
          method: 'GET',
          headers: {'Content-Type': 'application/json'}
      })
          .then(response => response.json())
          .then(data => {
              console.log('Poll task response:', data);
              sendResponse(data);
          })
          .catch(error => {
              console.error('Error polling task:', error);
              sendResponse({ status: 'error', error: error.message });
          });
      return true;
  }
  return true;
});
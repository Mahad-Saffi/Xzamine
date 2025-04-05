// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const postData = {
    postOwner: request.postOwner,
    postOwnerUsername: request.postOwnerUsername,
    postTextBody: request.postTextBody,
  };
  console.log("Post data received:", postData);

  // Send the post or comment data to the backend Flask API for analysis
  fetch("http://127.0.0.1:3000/data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("AI model response: ", data);

      const isLegal = data.isLegal;

      if (isLegal) {
        sendResponse({ status: "success", message: "Legal" });
      } else {
        sendResponse({ status: "failure", message: "Illegal" });
      }
    })
    .catch((error) => {
      console.error("Error checking legality:", error);
      sendResponse({ status: "error", message: "Error" });
    });

  return true; // keeps message channel open
});

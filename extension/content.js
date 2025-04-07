// Log to confirm the content script is running
console.log('Content script running...');

// Function to append a button to the specified div in all posts
const appendButtonToPosts = () => {
    
    // Grab html of the document using html tag
    const html = document.querySelector('html');

    // grabing div that contain the post (parent div) using the class="css-175oi2r r-1iusvr4 r-16y2uox r-1777fci r-kzbkwu" of div
    const postDiv = document.querySelectorAll('.css-175oi2r.r-1iusvr4.r-16y2uox.r-1777fci.r-kzbkwu');

    postDiv.forEach((post) => {
        // Grab the button div of parent div using the class "css-175oi2r r-1awozwy r-18u37iz r-1cmwbt1 r-1wtj0ep" of div
        const buttonDiv = post.querySelector('.css-175oi2r.r-1awozwy.r-18u37iz.r-1cmwbt1.r-1wtj0ep');
        
        // Grab text of the post in the span tag using the class "css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3" of span
        const postText = post.querySelectorAll('.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3');

        // Check if the button is already appended
        if (!buttonDiv.querySelector('.custom-button')) {
            // Create a new button
            const button = document.createElement('button');
            button.innerText = 'Analyze';
            button.className = 'custom-button';
            if (html.style.colorScheme === 'dark') {
                button.style.colorScheme = 'dark';
                button.style.backgroundColor = '#eff3f4';
                button.style.color = '#0f1419';
                button.style.borderColor = '#000000';
            } else if (html.style.colorScheme === 'light') {
                button.style.colorScheme = 'light';
                button.style.backgroundColor = '#0f1419';
                button.style.color = '#eff3f4';
            }
            button.style.cursor = 'pointer';
            button.style.padding = '7px 16px';

            // make below style important to override the default style of the button
            button.style.setProperty('border-bottom-left-radius', '9999px', 'important');
            button.style.setProperty('border-bottom-right-radius', '9999px', 'important');
            button.style.setProperty('border-top-left-radius', '9999px', 'important');
            button.style.setProperty('border-top-right-radius', '9999px', 'important');

            button.style.borderWidth = '1px';
            button.style.borderStyle = 'solid';
            button.style.fontSize = '15px';
            button.style.fontWeight = '700';
            button.style.borderRadius = '999px';
            button.style.textAlign = 'center';
            button.style.opacity = '1';
            
            button.classList.add('r-sdzlij');
            button.classList.add('r-37j5jr');
            // Add click event listener to the button
            button.addEventListener('click', () => {
                button.innerText = 'Checking...';
                console.log('Button clicked!');

                // gather all the innertext of the post in an array
                const allPostText = Array.from(postText).map(text => text.innerText)
                
                // remove the first five elements and last four elements of the array
                const postOwner = allPostText[0];
                const postOwnerUsername = allPostText[3];
                const postTextBody = allPostText.slice(5, -4);
                
                // const postTextString = Array.from(postText).map(text => text).join(' ');
                
                // Log the text of the post to the console
                // console.log('Post owner:', postOwner);
                // console.log('Post owner username:', postOwnerUsername);
                // console.log('Post text:', postTextBody.join(' '));
                console.log('All Post text:', allPostText);

                // Send the data to the background script
                chrome.runtime.sendMessage({
                    postOwner: postOwner,
                    postOwnerUsername: postOwnerUsername,
                    postTextBody: postTextBody.join(' '),
                    
                }, (response) => {
                    console.log('Response from background script:', response);
                    button.innerText = response.message;     // Update button text based on response
                    button.style.opacity = '1';             // make the button opaque
                    
                    // Change button color based on response
                    if (response.status === 'success') {
                        button.innerText = 'Legal'; // Update button text
                        button.style.backgroundColor = '#328c14'; // green color
                        button.style.borderColor = '#328c14'; // green color
                        
                    } else if (response.status === 'failure') {
                        button.innerText = 'Illegal'; // Update button text
                        button.style.backgroundColor = '#dc1919'; // red color
                        button.style.borderColor = '#dc1919'; // red color
                        button.disabled = true; // disable the button

                    } else {
                        button.style.opacity = '0.5';
                    }
                });
            });

            // Append the button to the post
            buttonDiv.appendChild(button);
        }
    });
};

// Observe changes in the DOM to dynamically add buttons to new posts
const observer = new MutationObserver(() => {
    appendButtonToPosts();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial call to add buttons to existing posts
appendButtonToPosts();
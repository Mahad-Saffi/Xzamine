document.addEventListener("DOMContentLoaded", () => {
  const statusElement = document.getElementById("status");

  fetch("http://127.0.0.1:3000/")
    .then((res) => {
      if (res.ok) {
        return res.json();
      }
      throw new Error("Failed to connect");
    })
    .then((data) => {
      console.log("Connected to backend:", data);
      statusElement.innerText = "Extension is Active ✅";
      statusElement.style.color = "green";
    })
    .catch((err) => {
      console.error("Connection error:", err);
      statusElement.innerText = "Failed to connect to backend ❌";
      statusElement.style.color = "red";
    });
});

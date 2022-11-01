function startResearch() {
  const researchName = document.getElementById("researchName").value;
  const researchLimit = Number(document.getElementById("researchLimit").value);

  fetch("/startResearch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ researchName, researchLimit }),
  });
}

/*
window.addEventListener("DOMContentLoaded", () => {
  const torLogsDiv = document.getElementById("tor-logs");
  setInterval(async () => {
    const lastLog = (
      await fetch("/tor-logs")
        .then((res) => res.text())
        .catch((err) => {
          console.error(err);
          return "Failed to fetch tor logs";
        })
    ).trim();

    if (lastLog != torLogsDiv.innerText) {
      torLogsDiv.innerText = lastLog;
    }
  }, 100);
});
*/
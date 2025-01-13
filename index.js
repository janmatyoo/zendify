document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("analyticsTable");
    const addSiteButton = document.getElementById("addSiteBtn");
    const newSiteInput = document.getElementById("newSite");
    const distractionSitesList = document.getElementById("distractionSitesList");
  
    // Function to fetch and update the table
    function updateAnalyticsTable() {
      chrome.storage.local.get(["closedTabs"], (data) => {
        const closedTabs = data.closedTabs || {};
  
        // Clear existing table rows
        tableBody.innerHTML = '';
  
        for (const [site, count] of Object.entries(closedTabs)) {
          const row = document.createElement("tr");
          row.innerHTML = `<td>${site}</td><td>${count}</td>`;
          tableBody.appendChild(row);
        }
      });
    }
  
    // Update the table every 5 seconds
    setInterval(updateAnalyticsTable, 500);
  
    // Add a new distraction site (via button or Enter key)
    function addNewSite() {
      const newSite = newSiteInput.value.trim();
      if (newSite) {
        chrome.storage.local.get(["distractionSites"], (data) => {
          const distractionSites = data.distractionSites || [];
          if (!distractionSites.includes(newSite)) {
            distractionSites.push(newSite);
            chrome.storage.local.set({ distractionSites }, () => {
              updateAnalyticsTable();
              displayDistractionSites(); // Update the site list
              newSiteInput.value = ''; // Clear input
            });
          }
        });
      }
    }

    // Add event listener to the Add Site button
    addSiteButton.addEventListener("click", addNewSite);

    // Add event listener to handle the Enter key
    newSiteInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        addNewSite();  // Trigger the site addition
      }
    });
  
    // Display the list of distraction sites
    function displayDistractionSites() {
      chrome.storage.local.get(["distractionSites"], (data) => {
        const distractionSites = data.distractionSites || [];
        distractionSitesList.innerHTML = ''; // Clear the list before re-populating
  
        if (distractionSites.length === 0) {
          distractionSitesList.innerHTML = '<p>No sites added yet.</p>';
        } else {
          distractionSites.forEach((site) => {
            const siteElement = document.createElement("div");
            siteElement.className = 'distraction-item';
            siteElement.innerHTML = ` 
              <span>${site}</span>
              <button class="remove-btn" data-site="${site}">Remove</button>
            `;
            distractionSitesList.appendChild(siteElement);
  
            // Add event listener to remove button
            siteElement.querySelector(".remove-btn").addEventListener("click", () => {
              removeDistractionSite(site);
            });
          });
        }
      });
    }
  
    // Remove a distraction site
    function removeDistractionSite(site) {
      chrome.storage.local.get(["distractionSites"], (data) => {
        const distractionSites = data.distractionSites || [];
        const index = distractionSites.indexOf(site);
        if (index !== -1) {
          distractionSites.splice(index, 1);
          chrome.storage.local.set({ distractionSites }, () => {
            displayDistractionSites(); // Re-render the list
            updateAnalyticsTable(); // Update the table
          });
        }
      });
    }
  
    // Initial setup
    displayDistractionSites(); // Display the distraction sites when the page loads
    updateAnalyticsTable(); // Update the table immediately
});

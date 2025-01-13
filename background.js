// Variable to store the last closed tab ID
let lastClosedTabId = null;

// Listen for tab switch or creation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const activeTab = await chrome.tabs.get(activeInfo.tabId);

        // Retrieve all the distraction sites from storage
        chrome.storage.local.get(["distractionSites"], (data) => {
            const distractionSites = data.distractionSites || [];

            // Check if any of the open tabs are distraction sites and close them if they are not the active tab
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    // Skip if the tab is already the active tab
                    if (tab.id !== activeTab.id) {
                        for (let site of distractionSites) {
                            if (tab.url && tab.url.includes(site)) {
                                lastClosedTabId = tab.id
                                forceCloseTab(tab.id);  // Close distraction tab
                                recordClosedTab(site);
                                break;  // Close only the first match
                            }
                        }
                    }
                });
            });
        });
    } catch (error) {
        console.error("Error handling activated tab:", error);
    }
});

// Listen for new tab creation
chrome.tabs.onCreated.addListener((tab) => {
    try {
        // Retrieve all the distraction sites from storage
        chrome.storage.local.get(["distractionSites"], (data) => {
            const distractionSites = data.distractionSites || [];

            // Check if the new tab URL matches any distraction site
            for (let site of distractionSites) {
                if (tab.url && tab.url.includes(site)) {
                    // Do nothing: let the site open and be used
                    return;
                }
            }
        });
    } catch (error) {
        console.error("Error handling new tab:", error);
    }
});

// Force close a tab if it matches a distraction site when switching away
function forceCloseTab(tabId, attempts = 5) {
    if (attempts <= 0) return;

    chrome.tabs.remove(tabId).catch((error) => {
        if (error.message.includes("Tabs cannot be edited")) {
            setTimeout(() => forceCloseTab(tabId, attempts - 1), 100); // Retry after a short delay
        } else if (error.message.includes("No tab with id")) {
            console.warn(`Tab already closed or non-existent.`);
        } else {
            console.error(`Error closing tab:`, error);
        }
    });
}

// Function to record the closed tab for analytics
async function recordClosedTab(site) {
    chrome.storage.local.get(["closedTabs"], (data) => {
        const closedTabs = data.closedTabs || {};
        closedTabs[site] = (closedTabs[site] || 0) + 1;

        chrome.storage.local.set({ closedTabs });
    });
}

// Function to add a new distraction site
function addDistractionSite(site) {
    chrome.storage.local.get(["distractionSites"], (data) => {
        const distractionSites = data.distractionSites || [];
        if (!distractionSites.includes(site)) {
            distractionSites.push(site);
            chrome.storage.local.set({ distractionSites });
        }
    });
}

// // Listen for Ctrl+Shift+T and close the last reopened tab
// chrome.commands.onCommand.addListener((command) => {
//     if (command === "disable-shortcut") {
//         // Close the last reopened tab when Ctrl+Shift+T is pressed
//         if (lastClosedTabId !== null) {
//             chrome.tabs.remove(lastClosedTabId, () => {
//                 console.log("Last reopened tab closed because Ctrl+Shift+T was pressed");
//                 lastClosedTabId = null; // Reset after closing
//             });
//         } else {
//             console.log("No last closed tab to close");
//         }
//     }
// });


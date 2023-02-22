import { handleAnchorActive, handleCatalogContainer, handleCatalogContent } from './anchor';

window.addEventListener('scroll', onScroll);

function onScroll() {
    handleAnchorActive();
}

function handleTabUpdated() {
    handleCatalogContainer();
}

function handleGetBookData() {
    handleCatalogContent();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.msg === 'tabOnUpdated') {
        handleTabUpdated();
    }
    if (request.msg === 'getBookData') {
        handleGetBookData();
    }
});

const api_url = "http://127.0.0.1:3333";
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        const sendInformation = (api_url) => {
            const sumbitInformation = async () => {
                const data = {
                    name: 'URLChange',
                    timestamp: Date.now(),
                    parameters: { tab_name: document.title, url: document.URL }
                };
                await fetch(`${api_url}/events/store`, {
                    method: 'POST',
                    headers: { "Content-type": "application/json; charset=UTF-8" },
                    body: JSON.stringify(data)
                })
                    .then(() => { })
                    .catch(() => { });
            };
            sumbitInformation();
        };
        chrome.scripting.executeScript({ target: { tabId }, func: sendInformation, args: [api_url] });
    }
});
chrome.webNavigation.onCompleted.addListener(async (details) => {
    const { tabId, frameId } = details;
    // En el primer instante en el que se carga por completo la pagina (para evitar multiples injecciones)
    if (frameId === 0) {
        chrome.scripting
            .executeScript({
            target: { tabId },
            func: addEventListeners,
            args: [api_url]
        })
            .catch(() => { });
    }
});
const addEventListeners = (api_url) => {
    const windowListeners = () => {
        const scrollEvent = (element) => {
            // Timestamp cuando inicio el scroll
            let starts = 0;
            // Timestamp cuando termina el scroll
            let ends = 0;
            // Timer entre el inicio y finalizacion del scroll
            let scrollTimer;
            element.addEventListener('scroll', (event) => {
                if (starts === 0) {
                    starts = Date.now();
                }
                clearTimeout(scrollTimer);
                scrollTimer = setTimeout(() => {
                    scrollEnd(event, starts, ends);
                    starts = 0;
                }, 750);
            });
            const scrollEnd = async (event, starts, ends) => {
                ends = Date.now();
                const data = {
                    name: event.type,
                    timestamp: Date.now(),
                    parameters: {
                        tab_name: document.title,
                        url: document.URL,
                        startsTimestamp: starts,
                        endsTimestamp: ends,
                        x: element.scrollX,
                        y: element.scrollY
                    }
                };
                await fetch(`${api_url}/events/store`, {
                    method: 'POST',
                    headers: { "Content-type": "application/json; charset=UTF-8" },
                    body: JSON.stringify(data)
                })
                    .then(() => { })
                    .catch(() => { });
            };
        };
        scrollEvent(window);
    };
    const bodyListeners = () => {
        const bodyElement = document.body;
        bodyElement.addEventListener('click', async (event) => {
            const data = {
                name: event.type,
                timestamp: Date.now(),
                parameters: { tab_name: document.title, url: document.URL, x: event.x, y: event.y }
            };
            await fetch(`${api_url}/events/store`, {
                method: 'POST',
                headers: { "Content-type": "application/json; charset=UTF-8" },
                body: JSON.stringify(data)
            })
                .then(() => { })
                .catch(() => { });
        });
    };
    const divsListeners = () => {
        // Recuperando todos los elementos
        const allDivs = Array.from(document.getElementsByTagName('div'));
        const scrollEvent = (element) => {
            // Timestamp cuando inicio el scroll
            let starts = 0;
            // Timestamp cuando termina el scroll
            let ends = 0;
            // Timer entre el inicio y finalizacion del scroll
            let scrollTimer;
            element.addEventListener('scroll', (event) => {
                if (starts === 0) {
                    starts = Date.now();
                }
                clearTimeout(scrollTimer);
                scrollTimer = setTimeout(() => {
                    scrollEnd(event, starts, ends);
                    starts = 0;
                }, 750);
            });
            const scrollEnd = async (event, starts, ends) => {
                ends = Date.now();
                const data = {
                    name: event.type,
                    timestamp: Date.now(),
                    parameters: {
                        tab_name: document.title,
                        url: document.URL,
                        startsTimestamp: starts,
                        endsTimestamp: ends,
                        x: element.scrollLeft,
                        y: element.scrollTop
                    }
                };
                await fetch(`${api_url}/events/store`, {
                    method: 'POST',
                    headers: { "Content-type": "application/json; charset=UTF-8" },
                    body: JSON.stringify(data)
                })
                    .then(() => { })
                    .catch(() => { });
            };
        };
        // Agregando eventos a cada elemento
        allDivs.forEach((element) => {
            scrollEvent(element);
        });
    };
    const inputListeners = () => {
        // Recuperando todos los inputs
        const inputsElements = Array.from(document.getElementsByTagName('input'));
        const focusEvents = (element) => {
            element.addEventListener('focusin', async (event) => {
                const data = {
                    name: event.type,
                    timestamp: Date.now(),
                    parameters: { tab_name: document.title, url: document.URL }
                };
                await fetch(`${api_url}/events/store`, {
                    method: 'POST',
                    headers: { "Content-type": "application/json; charset=UTF-8" },
                    body: JSON.stringify(data)
                })
                    .then(() => { })
                    .catch(() => { });
            });
            element.addEventListener('focusout', async (event) => {
                const data = {
                    name: event.type,
                    timestamp: Date.now(),
                    parameters: { tab_name: document.title, url: document.URL }
                };
                await fetch(`${api_url}/events/store`, {
                    method: 'POST',
                    headers: { "Content-type": "application/json; charset=UTF-8" },
                    body: JSON.stringify(data)
                })
                    .then(() => { })
                    .catch(() => { });
            });
        };
        const typingEvent = (element) => {
            // Timestamp cuando inicio el scroll
            let starts = 0;
            // Timestamp cuando termina el scroll
            let ends = 0;
            // Timer entre el inicio y finalizacion del typing
            let typingTimer;
            element.addEventListener('keypress', (event) => {
                if (starts === 0) {
                    starts = Date.now();
                }
                clearTimeout(typingTimer);
                typingTimer = setTimeout(() => {
                    typingEnd(event, starts, ends);
                    starts = 0;
                }, 2000);
            });
            const typingEnd = async (event, starts, ends) => {
                ends = Date.now();
                const data = {
                    name: event.type,
                    timestamp: Date.now(),
                    parameters: { tab_name: document.title, url: document.URL, startsTimestamp: starts, endsTimestamp: ends }
                };
                await fetch(`${api_url}/events/store`, {
                    method: 'POST',
                    headers: { "Content-type": "application/json; charset=UTF-8" },
                    body: JSON.stringify(data)
                })
                    .then(() => { })
                    .catch(() => { });
            };
        };
        // Agregando eventos a cada elemento
        inputsElements.forEach((element) => {
            focusEvents(element);
            typingEvent(element);
        });
    };
    windowListeners();
    bodyListeners();
    divsListeners();
    inputListeners();
};
export {};

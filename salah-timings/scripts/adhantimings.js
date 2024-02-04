const REQUIRED_WAQT_NAMES = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
const ADHAN_API = 'https://api.aladhan.com/v1/timingsByAddress';
const POSTAL_API = 'https://api.postalpincode.in';
const LOCATION_FINDER_API = 'https://nominatim.openstreetmap.org/reverse';

const locationDetails = document.querySelector('.location-details');
const adhanTimings = document.querySelector('.adhan-timings');
const prayerTimes = document.querySelector('.prayer-times');
const overlay = document.getElementById('overlay');
const searchInputField = document.querySelector('.location-search-input');
const suggestionsContainer = document.querySelector('.suggestions-container');

var isMutationUpdated = false;

adhanTimings.style.height = `${document.querySelector('body').clientHeight - document.querySelector('footer').clientHeight - adhanTimings.offsetTop}px`;

getAdhanTimings(formatDate(new Date()));

async function getAdhanTimings(date, adhanApi) {
    displayLoading(true);

    if (isMutationUpdated) {
        observer.disconnect(); // disconnect observing once handled
    }

    try {
        displayError(false, '');

        let userAddress;

        // fetching user location information from local storage if available
        let userLocationData = JSON.parse(localStorage.getItem('user_location'));

        // if not available on local storage, then fetch user Geo location
        if (userLocationData == undefined) {
            userLocationData = await getUserLocation();
        }

        // if adhanApi is not defined in the calling function and the user location data is found
        if (adhanApi === undefined && userLocationData !== undefined) {
            // stroing user location to local storage
            localStorage.getItem('user_location') == undefined && localStorage.setItem('user_location', JSON.stringify(userLocationData));

            updateLocationDetails(userLocationData.area, userLocationData.postcode);

            userAddress = typeof userLocationData.address != 'object' && userLocationData.address.replace(/[^a-zA-Z0-9-_]/g, ' ');
        }

        // constructing adhanApi if calling function not passing directly
        adhanApi = (adhanApi == undefined) ? `${ADHAN_API}/${date}?address=${encodeURIComponent(userAddress)}` : adhanApi;
        console.log('Adhan API: ', adhanApi);

        const prayerTimesData = await getPrayerTimes(adhanApi);
        displayPrayerTimes(prayerTimesData);
    } catch (err) {
        displayError(true, 'Something went wrong, please try again');
        console.error('Unable to get adhan timings ', err);
    } finally {
        displayLoading(false);

        // making sure that the prayer times screen shown when adhan API is triggered
        document.querySelector('[name="show-calendar"]').classList.remove('active');
        document.querySelector('.show-calendar.fa-calendar-days').classList.remove('active');
        document.getElementById('calendar-container').classList.remove('active');
        adhanTimings.classList.add('active');
    }
}

// this function helps to fetch user's Geo Location
async function getUserLocation() {
    try {
        displayError(false, '');

        const position = await requestPosition();

        if (position) {
            const { latitude, longitude } = position.coords;

            const response = await fetch(`${LOCATION_FINDER_API}?format=json&lat=${latitude}&lon=${longitude}`);
            const userLocationData = await response.json();

            if (userLocationData.hasOwnProperty('address')) {
                return {
                    area: getLocalArea(userLocationData.address),
                    postcode: userLocationData.address.postcode,
                    address: userLocationData.display_name,
                    latitude: userLocationData.lat,
                    longitude: userLocationData.lon,
                    lastUpdatedOn: new Date().toLocaleString()
                };
            }
        } else {
            displayError('true', 'Error: Location access denied, Please enable location and refresh to server you better.');
        }
    } catch (err) {
        displayError('true', 'Exception: Location access denied, Please enable location and refresh to server you better.');
        console.warn('Unable to get user location ', err);
    }
}

// util function to rtriee user location postion
function requestPosition() {
    var options = {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 1000
    }

    return new Promise(function (resolve, reject) {
        navigator.geolocation.getCurrentPosition(
            pos => { resolve(pos); },
            err => { reject(err); },
            options);
    });
}

async function getPrayerTimes(adhanApi) {
    try {
        const response = await fetch(adhanApi);
        const prayerTimesResponse = await response.json();

        return prayerTimesResponse.data;
    } catch (err) {
        console.error('Unable to get prayer timings ', err);
    }
}

function displayPrayerTimes(prayerTimesData) {
    prayerTimes.innerHTML = ``;

    let today = new Date(prayerTimesData.date.readable).toDateString() == new Date().toDateString() ? 'today' : '';
    today != '' ? document.querySelector('.calendar-date').classList.add(today) : document.querySelector('.calendar-date').classList.remove('today');
    document.querySelector('.readable-date').textContent = `${today ? 'Today' : prayerTimesData.date.gregorian.weekday.en}, ${prayerTimesData.date.readable}`;
    document.querySelector('.hijri-date').textContent = `${prayerTimesData.date.hijri.day} ${prayerTimesData.date.hijri.month.en} ${prayerTimesData.date.hijri.year}`;

    let selectedDate = prayerTimesData.date.readable;
    document.querySelector('.calendar-prev-day').setAttribute('data-date-tracking', formatDate(new Date(selectedDate).getTime() - 86400000));
    document.querySelector('.calendar-next-day').setAttribute('data-date-tracking', formatDate(new Date(selectedDate).getTime() + 86400000));

    // document.querySelector('.method-name').textContent = `Source: ${prayerTimesData.meta.method.name}`;

    Object.entries(prayerTimesData.timings).map(prayerTime => {
        let waqtName = prayerTime[0].toLowerCase();
        if (REQUIRED_WAQT_NAMES.includes(waqtName)) {
            prayerTimes.innerHTML += `<div class="prayer-time"></div>`;
            let lastPrayerTime = [...document.querySelectorAll('.prayer-time')].at(-1);
            let time = prayerTime[1].replace(/[^0-9:]/g, '');
            lastPrayerTime.innerHTML += `<span class="${waqtName} ${waqtName === 'sunrise' ? 'not-a-prayer' : ''}">${prayerTime[0]}</span> <span class="${waqtName}-time" data-waqt-tracking="${time}:00">${withTimeFormat(time)}</span>`;

        }
    });

    if (today) {
        addCurrentPrayerTimeClass();
        updateCurrentWaqtContainer();
    }
}

// util function to fomrmat time
function withTimeFormat(time) {
    time = time.toString().match(/^([01]\d|2[0-3]) (:) ([0-5]\d)(:[0-5]\d)?$/) || [time]

    if (time.length > 1) {
        time = time.slice(1);
        time[5] = +time[0] < 12 ? ' AM' : ' PM';
        time[0] = +time[0] % 12 || 12;
    }

    return time.join('');
}

// this function helps to find on going prayer time and adds 'current-prayer-time' class
function addCurrentPrayerTimeClass() {
    const allPrayerTimeElements = document.querySelectorAll('.prayer-time');
    let currentDate = new Date();
    let currentTimeString = currentDate.getHours() + ':' + currentDate.getMinutes() + ':' + currentDate.getSeconds();

    for (let i = 0; i <= allPrayerTimeElements.length - 1; i++) {
        let isIsha = allPrayerTimeElements[i].querySelector('.prayer-time span:first-child').classList.contains('isha');
        let waqtStartTime = allPrayerTimeElements[i].querySelector('.prayer-time span:last-child').getAttribute('data-waqt-tracking');
        let waqtEndTime = !isIsha ? allPrayerTimeElements[i + 1].querySelector('.prayer-time span:last-child').getAttribute('data-waqt-tracking')
            : allPrayerTimeElements[0].querySelector('.prayer-time span:last-child').getAttribute('data-waqt-tracking');

        if (isCurrentPrayerTimeRunning(currentTimeString, waqtStartTime, waqtEndTime) || isIsha) {
            if (allPrayerTimeElements[i].querySelector('.prayer-time span:first-child').classList.contains('sunrise')) {
                allPrayerTimeElements[1].classList.add('not-a-prayer');
                allPrayerTimeElements[2].classList.add('current-prayer-time'); // not setting class for Sunrise
            } else {
                allPrayerTimeElements[1].classList.contains('not-a-prayer') && allPrayerTimeElements[1].classList.remove('not-a-prayer');
                allPrayerTimeElements[i].classList.add('current-prayer-time');
            }
            break;
        }
    }

    function isCurrentPrayerTimeRunning(current, start, end) {
        let currentTime = new Date('2000-01-01 ' + current);
        let startTime = new Date('2000-01-01 ' + start);
        let endTime = new Date('2000-01-01 ' + end);

        return currentTime >= startTime && currentTime < endTime;
    }
}

function updateCurrentWaqtContainer() {
    const currentPrayerTime = document.querySelector('.prayer-times .prayer-time.current-prayer-time');
    const currentWaqtName = currentPrayerTime != undefined ? currentPrayerTime.firstChild.textContent : '';

    const allPrayerTimeElements = document.querySelectorAll('.prayer-time');
    let currentDate = new Date();
    let currentTimeString = currentDate.getHours() + ':' + currentDate.getMinutes() + ':' + currentDate.getSeconds();

    let nextPrayerIndex = -1;

    for (let i = 0; i <= allPrayerTimeElements.length - 1; i++) {

        let nextPrayerTime = new Date('2000-01-01 ' + allPrayerTimeElements[i].querySelector('.prayer-time span:last-child').getAttribute('data-waqt-tracking'));
        let currentTime = new Date('2000-01-01 ' + currentTimeString);

        if (nextPrayerTime > currentTime) {
            nextPrayerIndex = i;
            break;
        }
    }

    const currentPrayerWaqtElement = document.querySelector('.current-prayer-waqt');

    // adding dynamic background image for current prayer
    currentPrayerWaqtElement.style.backgroundImage = `url('/salah-timings/images/hero_image_${currentWaqtName.toLowerCase()}.jpg')`;
    // currentPrayerWaqtElement.style.backgroundImage = `url('../images/hero_image_${currentWaqtName.toLowerCase()}.jpg')`;

    const currentWaqtNameElement = document.createElement('div');
    currentWaqtNameElement.textContent = currentWaqtName.toLowerCase() !== 'sunrise' ? currentWaqtName : 'Dhuhr';
    currentWaqtNameElement.classList.add('current-waqt');

    // adding Now/Next prayer indicator when Sunrise or Not A Prayer time occurs
    currentWaqtNameElement.setAttribute('data-when', document.querySelector('.prayer-times .prayer-time.not-a-prayer') ? 'Next' : 'Now');

    currentPrayerWaqtElement.innerHTML = ''; // Clear existing content
    currentPrayerWaqtElement.appendChild(currentWaqtNameElement);

    // Clear any existing intervals
    clearInterval(currentPrayerWaqtElement.interval);

    if (nextPrayerIndex != -1) {
        var nextPrayerTime = new Date('2000-01-01 ' + allPrayerTimeElements[nextPrayerIndex].querySelector('.prayer-time span:last-child').getAttribute('data-waqt-tracking'));
        let currentTime = new Date('2000-01-01 ' + currentTimeString);

        // Calculate the remaining time in milliseconds
        var timeDiff = nextPrayerTime - currentTime;

        const nextWaqtCountdownSpanElement = document.createElement('span');

        // Start a new interval and store its ID
        currentPrayerWaqtElement.interval = setInterval(() => {
            handleCountdown();
        }, 1000);

        // trigger the interval immediately to update the countdown without waiting for the first second to elapse
        handleCountdown();

        function handleCountdown() {
            // Calculate hours, minutes, and seconds from the remaining time
            var hours = Math.floor(timeDiff / (1000 * 60 * 60));
            var minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

            nextWaqtCountdownSpanElement.textContent = 'Next prayer in -' + hours + ':' + minutes + ':' + seconds;
            nextWaqtCountdownSpanElement.classList.add('next-waqt-countdown');

            if (seconds > 0) {
                currentPrayerWaqtElement.appendChild(nextWaqtCountdownSpanElement);
            }

            // Update the remaining time
            timeDiff -= 1000;

            // clearing previous waqt name and countdown when it finishes
            if (hours == 0 && minutes == 0 && seconds == 0) {
                currentPrayerTime.classList.remove('current-prayer-time');
                clearInterval(currentPrayerWaqtElement.interval); // Clear the interval when the countdown reaches zero
                nextWaqtCountdownSpanElement.remove();
                document.querySelector('.current-waqt').remove();

                addCurrentPrayerTimeClass();
                updateCurrentWaqtContainer();
            }
        }
    }
}


// Check visibility state when the page becomes visible or hidden
document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === 'visible') {
        // Updating prayer times with correct day when previous day finished
        if (new Date(document.querySelector('.readable-date').textContent).toDateString() !== new Date().toDateString()) {
            getAdhanTimings(formatDate(new Date()));
        }
        // Update the timer and current prayer time when the page becomes visible
        document.querySelector('.current-prayer-time') && document.querySelector('.current-prayer-time').classList.remove('current-prayer-time');
        addCurrentPrayerTimeClass();
        updateCurrentWaqtContainer();
    }
});

var observerCallback = function (mutationList, observer) {
    if (document.querySelector('.next-waqt-countdown') != undefined)
        document.querySelector('.next-waqt-countdown').remove();
    for (var mutation of mutationList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            if (mutation.addedNodes[0].classList && mutation.addedNodes[0].classList.contains('prayer-time')) {
                updateCurrentWaqtContainer();
                isMutationUpdated = true;
                break;
            }
        }
    }
};

var observer = new MutationObserver(observerCallback);

var observerConfig = {
    childList: true,
    subtree: true
};

observer.observe(prayerTimes, observerConfig);

document.querySelector('.user-location').addEventListener('click', (event) => {
    const userLocatoinModalTarget = document.querySelector(event.target.closest('.user-location').dataset.modalTarget);
    document.querySelector('.location-search-input').value = '';
    document.querySelector('.location-search-input').focus();
    openModal(userLocatoinModalTarget);
});

overlay.addEventListener('click', () => {
    closeModal(document.querySelector('.user-location-modal.active'));
});

function openModal(modal) {
    if (modal == null) return;

    modal.classList.add('active');
    overlay.classList.add('active');
}

function closeModal(modal) {
    if (modal == null) return;

    modal.classList.remove('active');
    overlay.classList.remove('active');
}

document.querySelector('.current-location').addEventListener('click', () => {
    updateUserLocation(); // update to current location
    getWeather(); // update to current weather
});

async function updateUserLocation() {
    closeModal(document.querySelector('.user-location-modal.active'));
    displayLoading(true);

    try {
        const userLocationData = await getUserLocation();

        if (!userLocationData) return;

        userLocationData['lastUpdatedOn'] = new Date().toLocaleString();
        localStorage.setItem('user_location', JSON.stringify(userLocationData));

        getAdhanTimings(formatDate(new Date()));
    } catch (err) {
        console.error('Unable to get user address ', err);
    } finally {
        displayLoading(false);
    }
}

// on click of previous-day button
document.querySelector('.calendar-prev-day').addEventListener('click', (e) => {
    getAdhanTimings(e.target.parentElement.dataset.dateTracking);
});

// on click of next-day button
document.querySelector('.calendar-next-day').addEventListener('click', (e) => {
    getAdhanTimings(e.target.parentElement.dataset.dateTracking);
});

let startX = 0;
// Swipe right event listener
adhanTimings.addEventListener('touchstart', (event) => {
    startX = event.changedTouches[0].clientX;
}, false);

adhanTimings.addEventListener('touchend', (event) => {
    let endX = event.changedTouches[0].clientX;
    let deltaX = endX - startX;

    if (deltaX > 100) {
        getAdhanTimings(event.currentTarget.querySelector('.calendar-prev-day').dataset.dateTracking);
    } else if (deltaX < -100) {
        getAdhanTimings(event.currentTarget.querySelector('.calendar-next-day').dataset.dateTracking);
    }
}, false);


function formatDate(d) {
    const date = new Date(d);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
}

function displayLoading(flag) {
    if (flag) {
        const loadElement = document.createElement('div');
        loadElement.classList.add('loading', 'popup');
        loadElement.textContent = 'Loading...';
        document.querySelector('body').appendChild(loadElement);
        overlay.classList.add('active');
    } else {
        document.querySelector('.loading') && document.querySelector('.loading').remove();
        overlay.classList.remove('active');
    }
}

function displayError(flag, errorMessage) {
    if (flag) {
        const errorElement = document.createElement('div');
        errorElement.classList.add('error', 'popup');
        errorElement.textContent = errorMessage;
        document.querySelector('body').appendChild(errorElement);
        // overlay.classList.add('active');
    } else {
        document.querySelector('.error') && document.querySelector('.error').remove();
        // overlay.classList.remove('active');
    }
}

function getLocalArea(address) {
    if (address.hasOwnProperty('county') && address.county) return address.county;
    else if (address.hasOwnProperty('neighbourhood') && address.neighbourhood) return address.neighbourhood;
    else if (address.hasOwnProperty('village') && address.village) return address.village;
    else if (address.hasOwnProperty('road') && address.road) return address.road;
    else if (address.hasOwnProperty('suburban') && address.road) return address.suburban;
    else if (address.hasOwnProperty('town') && address.road) return address.town;
}

// debounce helps to prevent unnecessary calls to api until specified timeout
let timeoutId;
const debounce = (callback) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        callback();
    }, 500);
}

searchInputField.addEventListener('input', (event) => {
    debounce(async () => {
        let searchInput = event.target.value;

        if (searchInput.length < 3) {
            // Clear suggestions and hide the container if input length is below desired length
            clearSuggestions();
            return;
        }

        let searchSuggestionsData;
        let apiIdentifier = 'postoffice';

        // if search input starts with a digit, meaning it's a pincode search
        if ((/^[0-9]*$/).test(searchInput.charAt(0)) && searchInput.length == 6) {
            event.target.setAttribute('maxlength', '6');
            apiIdentifier = 'pincode';
            searchSuggestionsData = await locationSearchSuggestions(searchInput, apiIdentifier);
        }
        // if search input doesnt start with a digit, meaning it's a postoffice search
        else if (!(/^[0-9]*$/).test(searchInput.charAt(0))) {
            event.target.removeAttribute('maxlength');
            console.log('Searching...', searchInput);
            searchSuggestionsData = await locationSearchSuggestions(searchInput, apiIdentifier);
        }
        searchSuggestionsData && updateUI(searchSuggestionsData);
    });
});

// this function helps to fetch search suggestion results from POSTAL API
async function locationSearchSuggestions(searchInput, apiIdentifier) {
    try {
        suggestionsContainer.style.display = 'block';
        suggestionsContainer.innerHTML = `<span class="waiting-text">Please wait...</span>`;

        const response = await fetch(`${POSTAL_API}/${apiIdentifier}/${searchInput}`);
        const data = await response.json();

        let suggestionResults = data[0].PostOffice;

        if (!suggestionResults) return [];

        if (apiIdentifier === 'postoffice') {
            suggestionResults = suggestionResults.filter(suggestionResult =>
                suggestionResult.Name.toLowerCase().startsWith(searchInput.toLowerCase())
            );
        }

        return suggestionResults;

    } catch (err) {
        console.error('Error in getting search suggestions', err);
        return [];
    } finally {
        suggestionsContainer.innerHTML = '';
    }
}

/* this function helps to add the search suggestions data as list items 
 to suggestion container so that user can select */
function updateUI(searchSuggestionsData) {

    // clear previous suggestions
    suggestionsContainer.innerHTML = '';

    // check if there are any suggestions
    if (searchSuggestionsData.length === 0) {
        suggestionsContainer.style.display = 'block';
        suggestionsContainer.innerHTML = '<p>No address found</p>';
        return;
    }

    // create a list to hold the suggestions
    const suggestionsList = document.createElement('ul');

    // iterate through the suggestions and create list items
    searchSuggestionsData.forEach((suggestion) => {
        const listItem = document.createElement('li');

        // list item content
        listItem.textContent = `${suggestion.Name}, ${suggestion.District}, ${suggestion.State}, ${suggestion.Pincode}`;

        // add click event listener to handle selection
        listItem.addEventListener('click', () => {
            suggestionsContainer.innerHTML = ''; // Clear suggestions after selection

            /* appending 'a' if any postoffice name ending with 'pet'. 
               for example Pullampet should be Pullampeta to get right prayer timing results as per Al-Adhan API */
            if (suggestion.Name.toLowerCase().endsWith('pet')) {
                suggestion.Name += 'a';
            }

            let userAddress = `${suggestion.Name}, ${suggestion.District}, ${suggestion.State}, ${suggestion.Pincode}`;

            let adhanApi = `${ADHAN_API}/${formatDate(new Date())}?address=${encodeURIComponent(userAddress)}`;
            closeModal(document.querySelector('.user-location-modal.active'));

            updateLocationDetails(suggestion.Name, suggestion.Pincode);

            let userLocationData = {
                area: suggestion.Name,
                postcode: suggestion.Pincode,
                address: `${suggestion.Name}, ${suggestion.District}, ${suggestion.State}, ${suggestion.Pincode}`
            }

            userLocationData['lastUpdatedOn'] = new Date().toLocaleString();
            localStorage.setItem('user_location', JSON.stringify(userLocationData));

            getAdhanTimings(formatDate(new Date()), adhanApi);
        });

        suggestionsList.appendChild(listItem);
    });

    // append the suggestions list to the container
    suggestionsContainer.appendChild(suggestionsList);

    // show the suggestions container
    suggestionsContainer.style.display = 'block';
}

function clearSuggestions() {
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.style.display = 'none';
}

// add a click event listener to clear suggestions and hide the container if user clicks outside of it
document.addEventListener('click', (event) => {
    if (!event.target.matches('.location-search-input')) {
        clearSuggestions();
    }
});

// add a click event listener to close the suggestions container if user clicks outside of it
document.addEventListener('click', (event) => {
    const suggestionsContainer = document.querySelector('.suggestions-container');
    if (!event.target.closest('.suggestions-container') && !event.target.matches('.location-search-input')) {
        suggestionsContainer.style.display = 'none';
    }
});


// this function helps to add locaation area and pincode upon location updation
function updateLocationDetails(locationArea, locationPostCode) {
    locationDetails.innerHTML = '';

    // create location area element
    const locationAreaSpanElement = document.createElement('span');
    locationAreaSpanElement.innerHTML = locationArea;
    locationAreaSpanElement.classList.add('loc-area');

    // create location postcode element
    const locationPostCodeSpanElement = document.createElement('span');
    locationPostCodeSpanElement.textContent = locationPostCode;
    locationPostCodeSpanElement.classList.add('loc-postcode');

    // refresh/update icon
    locationPostCodeSpanElement.innerHTML += `<i class="fa-solid fa-rotate-right update-icon"></i>`;

    locationDetails.appendChild(locationAreaSpanElement);
    locationDetails.appendChild(locationPostCodeSpanElement);
}
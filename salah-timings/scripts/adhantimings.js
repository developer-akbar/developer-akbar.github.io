const REQUIRED_WAQT_NAMES = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
const ADHAN_API = 'https://api.aladhan.com/v1/calendarByAddress/';

var isMutationUpdated = false;

const locationDetails = document.querySelector('.location-details');
const adhanTimings = document.querySelector('.adhan-timings');
const prayerTimes = document.querySelector('.prayer-times');
const overlay = document.getElementById('overlay');

adhanTimings.style.height = `${document.querySelector('body').clientHeight - document.querySelector('footer').clientHeight - adhanTimings.offsetTop - 16}px`;

getAdhanTimings(formatDate(new Date())); // on page load for current date

async function getAdhanTimings(date) {
    displayLoading(true);

    if (isMutationUpdated) {
        observer.disconnect(); // disconnect observing once handled
    }

    locationDetails.innerHTML = '';

    // retrieving user location from local storage if available, else fetching from API
    let userLocationData = JSON.parse(localStorage.getItem('user_location'));

    try {
        displayError(false);

        if (userLocationData == undefined) {
            userLocationData = await getUserLocation();
        }

        if (userLocationData !== undefined) {
            localStorage.getItem('user_location') == undefined && localStorage.setItem('user_location', JSON.stringify(userLocationData));

            locationDetails.innerHTML += `<span class="loc-area">${getLocalArea(userLocationData.address)}</span><span class="loc-postcode">${userLocationData.address.postcode}</span>`;
            let userAddress = userLocationData.display_name;
            userAddress = userAddress.replace(/[^a-zA-Z0-9-_]/g, ' ');
            let adhanApi = `https://api.aladhan.com/v1/timingsByAddress/${date}?address=${encodeURIComponent(userAddress)}`;

            console.log('Adhan API: ', adhanApi);

            const prayerTimesData = await getPrayerTimes(adhanApi);
            displayPrayerTimes(prayerTimesData);
        } else {
            console.warn('Unable to get user location details');
        }
    } catch (err) {
        displayError(true);
        console.error('Unable to get adhan timings ', err);
    } finally {
        displayLoading(false);
    }
}

async function getUserLocation() {
    try {
        displayError(false);

        console.time('Location Api Response Time');

        position = await requestPoistion();
        const {latitude, longitude} = position.coords;
        // const latitude = 14.1232565;
        // const longitude = 79.2043402;
        // const latitude = 14.193148;
        // const longitude = 79.156995;

        const MAP_API = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

        const response = await fetch(MAP_API);
        const userLocationData = await response.json();

        console.timeEnd('Location Api Response Time');

        if (userLocationData.hasOwnProperty('address')) {
            return userLocationData;
        }
    } catch (err) {
        displayError(true);
        console.warn('Unable to get user location ', err);
    }
}

async function getPrayerTimes(adhanApi) {
    try {
        // displayError(false);

        console.time('Adhan Api Response Time');

        const response = await fetch(adhanApi);
        const prayerTimesResponse = await response.json();

        console.timeEnd('Adhan Api Response Time');

        return prayerTimesResponse.data;
    } catch (err) {
        // displayError(true);
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

    document.querySelector('.current-prayer-waqt .method-name').textContent = `Source: ${prayerTimesData.meta.method.name}`;

    Object.entries(prayerTimesData.timings).map(prayerTime => {
        let waqtName = prayerTime[0].toLowerCase();
        if (REQUIRED_WAQT_NAMES.includes(waqtName)) {
            prayerTimes.innerHTML += `<div class="prayer-time"></div>`;
            let lastPrayerTime = [...document.querySelectorAll('.prayer-time')].at(-1);
            let time = prayerTime[1].replace(/[^0-9:]/g, '');
            lastPrayerTime.innerHTML += `<span class="${waqtName}">${prayerTime[0]}</span> <span class="${waqtName}-time" data-waqt-tracking="${time}:00">${withTimeFormat(time)}</span>`;

        }
    });

    if (today) {
        addCurrentPrayerTimeClass();
    }
}

// util function to rtriee user location postion
function requestPoistion() {
    var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    }

    return new Promise(function (resolve, reject) {
        navigator.geolocation.getCurrentPosition(
            pos => { resolve(pos); },
            err => { reject(pos); },
            options);
    });
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
            allPrayerTimeElements[i].classList.add('current-prayer-time');
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

    const currentPrayerwaqtElement = document.querySelector('.current-prayer-waqt');

    const currentPrayerTime = document.querySelector('.prayer-times .prayer-time.current-prayer-time');
    const currentWaqtName = currentPrayerTime != undefined ? currentPrayerTime.firstChild.textContent : '';

    const currentWaqtNameElement = document.createElement('div');
    currentWaqtNameElement.textContent = currentWaqtName;
    currentWaqtNameElement.classList.add('current-waqt');

    currentPrayerwaqtElement.appendChild(currentWaqtNameElement);

    if (nextPrayerIndex != -1) {
        var nextPrayerTime = new Date('2000-01-01 ' + allPrayerTimeElements[nextPrayerIndex].querySelector('.prayer-time span:last-child').getAttribute('data-waqt-tracking'));
        let currentTime = new Date('2000-01-01 ' + currentTimeString);

        var timeDiff = nextPrayerTime - currentTime;

        const nextWaqtCountdownSpanElement = document.createElement('span');
        setInterval(() => {
            timeDiff -= 1000;
            var hours = Math.floor(timeDiff / (1000 * 60 * 60))
            var minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            nextWaqtCountdownSpanElement.textContent = 'Next prayer in -' + hours + ':' + minutes + ':' + seconds;
            nextWaqtCountdownSpanElement.classList.add('next-waqt-countdown');

            if (seconds > 0) {
                currentPrayerwaqtElement.appendChild(nextWaqtCountdownSpanElement);
            }

            // clearing previous waqt name and countdown when it finishes
            if (hours == 0 && minutes == 0 && seconds == 0) {
                currentPrayerTime.classList.remove('current-prayer-time');
                nextWaqtCountdownSpanElement.remove();
                document.querySelector('.current-waqt').remove();
                addCurrentPrayerTimeClass();
                updateCurrentWaqtContainer();

            }
        }, 1000);
    }

}

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
    updateUserLocation();
});

async function updateUserLocation() {
    closeModal(document.querySelector('.user-location-modal.active'));
    displayLoading(true);

    try {
        // displayError(false);

        // locationDetails.innerHTML = '';
        const userLocationData = await getUserLocation();
        userLocationData['lastUpdatedOn'] = new Date().toLocaleString();
        localStorage.setItem('user_location', JSON.stringify(userLocationData));

        // locationDetails.innerHTML += `<span class="loc-area">${userLocationData.address.neighbourhood}</span><span class="loc-postcode">${userLocationData.address.postcode}</span>`;

        getAdhanTimings(formatDate(new Date()));
    } catch (err) {
        // displayError(true);
        console.error('Unable to get user address ', err);
    }
    displayLoading(false);
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
        loadElement.textContent = 'Loaidng...';
        document.querySelector('body').appendChild(loadElement);
        overlay.classList.add('active');
    } else {
        document.querySelector('.loading') && document.querySelector('.loading').remove();
        overlay.classList.remove('active');
    }
}

function displayError(flag) {
    if (flag) {
        const errorElement = document.createElement('div');
        errorElement.classList.add('error', 'popup');
        errorElement.textContent = 'Something went wrong, please try again';
        document.querySelector('body').appendChild(errorElement);
        // overlay.classList.add('active');
    } else {
        document.querySelector('.error') && document.querySelector('.error').remove();
        // overlay.classList.remove('active');
    }
}

function getLocalArea(address) {
    if(address.hasOwnProperty('neighbourhood') && address.neighbourhood) return address.neighbourhood;
    else if(address.hasOwnProperty('village') && address.village) return address.village;
    else if(address.hasOwnProperty('county') && address.county) return address.county;
    else if(address.hasOwnProperty('road') && address. road) return address.road;
}
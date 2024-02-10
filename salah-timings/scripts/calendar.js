var dateCellClicked = false;
let currentMonthIndex = 0;
let currentYear;
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const islamicMonthNames = ['Muḥarram', 'Ṣafar', 'Rabīʿ al-Awwal', 'Rabīʿ al-Thānī', 'Jumādā al-Awwal', 'Jumādā al-Thānī', 'Rajab', 'Shaʿbān', 'Ramaḍān', 'Shawwāl', 'Dhū al-Qaʿdah', 'Dhū al-Ḥijjah'];
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const calendarContainer = document.getElementById('calendar-container');

function initCalendar() {
    calendarContainer.innerHTML = '';

    // get current date
    const currentDate = new Date();
    currentYear = currentYear || currentDate.getFullYear();

    const monthName = monthNames[currentDate.getMonth()];

    const calendarHeader = document.createElement('div');
    calendarHeader.classList.add('calendar-header');

    const prevMonthBtn = document.createElement('button');
    prevMonthBtn.classList.add('prev-month-btn');
    prevMonthBtn.textContent = 'Previous';
    prevMonthBtn.addEventListener('click', () => showCalendar(-1));
    calendarHeader.appendChild(prevMonthBtn);

    const currentDayBtn = document.createElement('div');
    currentDayBtn.classList.add('current-day-btn');
    currentDayBtn.textContent = 'Today';
    currentDayBtn.addEventListener('click', () => showCurrentDay());
    calendarHeader.appendChild(currentDayBtn);

    const headerText = document.createElement('h2');

    if (currentMonthIndex === 12) {
        headerText.textContent = `${currentYear + 1}-1`;
    } else {
        headerText.textContent = `${currentYear} - ${monthNames[currentMonthIndex]}`; // showing Year - MonthName
    }
    calendarHeader.appendChild(headerText);

    const nextMonthBtn = document.createElement('button');
    nextMonthBtn.classList.add('next-month-btn');
    nextMonthBtn.textContent = 'Next';
    nextMonthBtn.addEventListener('click', () => showCalendar(1));
    calendarHeader.appendChild(nextMonthBtn);

    calendarContainer.appendChild(calendarHeader);

    const table = document.createElement('table');

    const headerRow = document.createElement('tr');
    headerRow.classList.add('week-names');
    daysOfWeek.forEach(day => {
        const th = document.createElement('th');
        th.classList.add('week-day');
        th.setAttribute('title', day)
        th.textContent = day.substring(0, 3);
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // calcualte first day of the month
    const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay();

    // calculate the number of days in a month
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();

    // create calendar cells
    let dayCount = 1;
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            let dayCount = i * 7 + j - firstDayOfMonth + 1;

            if (dayCount > 0 && dayCount <= daysInMonth) {
                cell.classList.add('month-day');
                cell.setAttribute('data-date-tracking', `${dayCount}-${currentMonthIndex + 1}-${currentYear}`);
                // cell.innerHTML = dayCount;

                const islamicCalendar = convertToIslamicDate(dayCount, currentMonthIndex+1, currentYear);
                cell.innerHTML = `${dayCount} <br> <span class="islamic-date" title="${islamicCalendar.day} - ${islamicCalendar.islamicMonthName}">${islamicCalendar.day}-${islamicCalendar.month}</span>`;

                // adding class if islamic calendar date is first
                if(islamicCalendar.day == 1) {
                    cell.classList.add('islamic-month-first-day');
                }
                const dayCellDate = new Date(currentYear, currentMonthIndex, dayCount);
                if (isCurrentDay(currentDate, dayCellDate)) {
                    cell.classList.add('current-day');
                }

                // add click logic
                cell.addEventListener('click', (element) => {
                    getAdhanTimings(element.target.dataset.dateTracking);

                    document.querySelector('[name="show-calendar"]').classList.toggle('active');
                    document.querySelector('.show-calendar.fa-calendar-days').classList.toggle('active');
                    calendarContainer.classList.toggle('active');
                    document.querySelector('.adhan-timings').classList.toggle('active');
                });
                dayCount++;
            }
            row.classList.add(`week-${i + 1}`);
            (/week-/).test(row.className) && row.appendChild(cell);

            if (dayCount > daysInMonth) {
                break; // stop creating rows if all days have displayed
            }
        }

        // adding table row only if there is at least a day available in week row
        (row.firstChild.classList.contains('month-day') || row.lastChild.classList.contains('month-day')) 
            && table.appendChild(row);
    }

    calendarContainer.appendChild(table);
    calendarContainer.style.height = `${document.querySelector('body').clientHeight - document.querySelector('footer').clientHeight - calendarContainer.offsetTop - 16}px`;
}

function showCalendar(monthOffset) {
    currentMonthIndex += monthOffset;

    if (currentMonthIndex < 0) {
        currentMonthIndex += 12;
        currentYear--
    } else if (currentMonthIndex > 11) {
        currentMonthIndex -= 12;
        currentYear++;
    }
    initCalendar();
}

function showCurrentDay() {
    currentMonthIndex = new Date().getMonth();
    currentYear = new Date().getFullYear();
    initCalendar();
}

function isCurrentDay(currentDate, cellDate) {
    return currentDate.toDateString() === cellDate.toDateString();
}

const showCalendarCheckbox = document.querySelector('[name="show-calendar"]');
showCalendarCheckbox.addEventListener('click', () => {
    showCalendarCheckbox.classList.toggle('active');
    document.querySelector('.show-calendar.fa-calendar-days').classList.toggle('active');
    calendarContainer.classList.toggle('active');
    adhanTimings.classList.toggle('active');

    if (showCalendarCheckbox.checked) {
        showCurrentDay(); // showing current day and month calendar
    }
});



let calendarStartX = 0;
// Swipe right/left event listeners to show previous/next months
calendarContainer.addEventListener('touchstart', (event) => {
    startX = event.changedTouches[0].clientX;
}, false);

calendarContainer.addEventListener('touchend', (event) => {
    let endX = event.changedTouches[0].clientX;
    let deltaX = endX - startX;

    if (deltaX > 100) {
        showCalendar(-1);
    } else if (deltaX < -100) {
        showCalendar(1);
    }
}, false);


// hleper function
function intPart(floatNum) {
    if (floatNum < -0.0000001) {
        return Math.ceil(floatNum - 0.0000001)
    }
    return Math.floor(floatNum + 0.0000001)
}

// this function helps to convert georgian date into islamic date
function convertToIslamicDate(day, month, year) {
    d = parseInt(day)
    m = parseInt(month)
    y = parseInt(year)

    delta = 0
    if ((y > 1582) || ((y == 1582) && (m > 10)) || ((y == 1582) && (m == 10) && (d > 14))) {
        //added +delta=1 on jd to comply isna rulling 2007
        jd = intPart((1461 * (y + 4800 + intPart((m - 14) / 12))) / 4) + intPart((367 * (m - 2 - 12 * (intPart((m - 14) / 12)))) / 12) -
            intPart((3 * (intPart((y + 4900 + intPart((m - 14) / 12)) / 100))) / 4) + d - 32075 + delta
    }
    else {
        //added +1 on jd to comply isna rulling
        jd = 367 * y - intPart((7 * (y + 5001 + intPart((m - 9) / 7))) / 4) + intPart((275 * m) / 9) + d + 1729777 + delta
    }
    //arg.JD.value=jd
    //added -1 on jd1 to comply isna rulling
    jd1 = jd - delta
    //arg.wd.value=weekDay(jd1%7)
    l = jd - 1948440 + 10632
    n = intPart((l - 1) / 10631)
    l = l - 10631 * n + 354
    j = (intPart((10985 - l) / 5316)) * (intPart((50 * l) / 17719)) + (intPart(l / 5670)) * (intPart((43 * l) / 15238))
    l = l - (intPart((30 - j) / 15)) * (intPart((17719 * j) / 50)) - (intPart(j / 16)) * (intPart((15238 * j) / 43)) + 29
    m = intPart((24 * l) / 709)
    d = l - intPart((709 * m) / 24)
    y = 30 * n + j - 30

    // d + "-" + islamicMonthNames[m];
    let res = {
        day: d,
        month: m,
        islamicMonthName: islamicMonthNames[m -1]
    };
    return res;
}
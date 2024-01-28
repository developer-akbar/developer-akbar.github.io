var dateCellClicked = false;
let currentMonthIndex = 0;
let currentYear;
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const calendarContainer = document.getElementById('calendar-container');

function initCalendar() {
    calendarContainer.innerHTML = '';

    // get current date
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
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
                cell.textContent = dayCount;

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

            if (dayCount - 1 > daysInMonth) {
                break; // stop creating rows if all days have displayed
            }
            row.appendChild(cell);
        }
        table.appendChild(row);
    }

    calendarContainer.appendChild(table);
    // calendarContainer.style.height = `${document.querySelector('body').clientHeight - document.querySelector('footer').clientHeight - calendarContainer.offsetTop - 16}px`;
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
        initCalendar();
    }
});



let calendarStartX = 0;
// Swipe right/left event listeners to show previous/next months
document.querySelector('#calendar-container').addEventListener('touchstart', (event) => {
    startX = event.changedTouches[0].clientX;
}, false);

document.querySelector('#calendar-container').addEventListener('touchend', (event) => {
    let endX = event.changedTouches[0].clientX;
    let deltaX = endX - startX;

    if (deltaX > 100) {
        showCalendar(-1);
    } else if (deltaX < -100) {
        showCalendar(1);
    }
}, false);
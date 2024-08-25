const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

document.addEventListener('DOMContentLoaded', async function () {

    const masterData = await utility.initializeMasterData();
    generateReports();

    // Calculate expenses by category
    function calculateExpensesByCategory() {
        const expensesFiltered = masterData.filter(expense => expense["Income/Expense"] === "Expense");
        const expensesByCategory = {};
        expensesFiltered.forEach(expense => {
            expensesByCategory[expense.Category] = (expensesByCategory[expense.Category] || 0) + parseFloat(expense.INR);
        });
        return expensesByCategory;
    }

    // Calculate total expenses
    function calculateTotalExpenses() {
        const expensesFiltered = masterData.filter(expense => expense["Income/Expense"] === "Expense");
        return expensesFiltered.reduce((total, expense) => total + parseFloat(expense.INR), 0);
    }

    // Function to generate and display yearly expense reports
    function generateYearlyExpenseReports() {
        const yearlyExpenses = groupExpensesByYear();

        const reportContainer = document.getElementById('reportContainer');
        reportContainer.innerHTML = ''; // Clear existing content

        for (const year in yearlyExpenses) {
            const yearElement = document.createElement('div');
            yearElement.className = 'year';
            yearElement.textContent = year;
            reportContainer.appendChild(yearElement);

            const monthlyReportsElement = document.createElement('div');
            monthlyReportsElement.className = 'monthlyReports';
            yearElement.appendChild(monthlyReportsElement);

            const monthlyExpenseReports = generateMonthlyExpenseReports(yearlyExpenses[year]);
            for (const month in monthlyExpenseReports) {
                const monthElement = document.createElement('div');
                monthElement.textContent = month + ': $' + monthlyExpenseReports[month].toFixed(2);
                monthlyReportsElement.appendChild(monthElement);
            }

            yearElement.addEventListener('click', function () {
                monthlyReportsElement.classList.toggle('show');
            });
        }
    }

    // Function to group expenses by year
    function groupExpensesByYear() {
        const yearlyExpenses = {};
        masterData.forEach(expense => {
            const year = new Date(convertDateFormat(expense.Date)).getFullYear();
            yearlyExpenses[year] = yearlyExpenses[year] || [];
            yearlyExpenses[year].push(expense);
        });
        return yearlyExpenses;
    }

    // Function to generate monthly expense reports
    function generateMonthlyExpenseReports() {
        const monthlyExpenseReports = {};
        expenses.forEach(expense => {
            const monthYear = new Date(convertDateFormat(expense.Date)).toLocaleString('default', { month: 'long', year: 'numeric' });
            monthlyExpenseReports[monthYear] = (monthlyExpenseReports[monthYear] || 0) + parseFloat(expense.INR);
        });
        return monthlyExpenseReports;
    }

    // Function to generate the HTML table
    function generateExpenseTable() {
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Create header row
        const headerRow = document.createElement('tr');
        const headerCell = document.createElement('th');
        headerCell.textContent = 'Expense Category';
        headerRow.appendChild(headerCell);

        // Add years as header cells
        for (const year in expenses[Object.keys(masterData)[0]]) {
            const yearHeader = document.createElement('th');
            yearHeader.textContent = year;
            headerRow.appendChild(yearHeader);
        }
        thead.appendChild(headerRow);

        // Create rows for each expense category
        for (const category in expenses) {
            const categoryRow = document.createElement('tr');
            const categoryNameCell = document.createElement('td');
            categoryNameCell.textContent = category;
            categoryRow.appendChild(categoryNameCell);

            // Add expenses for each year
            for (const year in expenses[category]) {
                const expenseCell = document.createElement('td');
                expenseCell.textContent = expenses[category][year];
                categoryRow.appendChild(expenseCell);
            }

            tbody.appendChild(categoryRow);
        }

        table.appendChild(thead);
        table.appendChild(tbody);
        return table;
    }

    // Function to generate and display reports for expenses
    function generateReports() {
        // Filter expenses based on "Income/Expense" attribute
        const expensesFiltered = masterData.filter(expense => expense["Income/Expense"] === "Expense");

        // Group expenses by category and year
        const expensesByCategoryAndYear = {};
        expensesFiltered.forEach(expense => {
            const category = expense.Category;
            const year = new Date(convertDateFormat(expense.Date)).getFullYear();
            expensesByCategoryAndYear[category] = expensesByCategoryAndYear[category] || {};
            expensesByCategoryAndYear[category][year] = (expensesByCategoryAndYear[category][year] || 0) + parseFloat(expense.INR);
        });

        // Get sorted unique years
        const years = [...new Set(expensesFiltered.map(expense => new Date(convertDateFormat(expense.Date)).getFullYear()))].sort();

        // Get sorted unique categories
        const categories = Object.keys(expensesByCategoryAndYear).sort();

        // Create table headers for years
        const tableHeaderRow = document.createElement('tr');
        const categoryHeader = document.createElement('th');
        categoryHeader.setAttribute('id', 'categoryHeader');
        categoryHeader.textContent = 'Category';

        const spanElement = document.createElement('span');
        spanElement.setAttribute('id', 'sortIcon');
        spanElement.textContent = '▼';
        categoryHeader.appendChild(spanElement);

        const totalExpenses = calculateTotalExpenses(masterData);
        const yearTotal = document.createElement('p');
        yearTotal.classList.add('total-expenses');
        yearTotal.classList.add(`amount`);
        yearTotal.textContent = totalExpenses;
        categoryHeader.appendChild(yearTotal);

        tableHeaderRow.appendChild(categoryHeader);
        years.forEach(year => {
            const yearHeader = document.createElement('th');
            yearHeader.setAttribute('id', 'yearHeader');
            yearHeader.textContent = year;

            const spanElement = document.createElement('span');
            spanElement.setAttribute('id', 'sortIcon');
            spanElement.textContent = '▼';

            yearHeader.appendChild(spanElement);
            tableHeaderRow.appendChild(yearHeader);

            // add year total expenses
            const yearTotalExpenses = groupExpensesByYear(masterData);
            const yearTotal = document.createElement('p');
            yearTotal.classList.add('year-total-expenses');
            yearTotal.classList.add(`amount`);
            yearTotal.setAttribute('title', `Total '${year}' expenses`);
            yearTotal.textContent = calculateTotalExpenses(yearTotalExpenses[year]);
            yearHeader.appendChild(yearTotal);
        });

        // Create table body
        const tableBody = document.createElement('tbody');
        categories.forEach(category => {
            const tableRow = document.createElement('tr');
            const categoryCell = document.createElement('td');
            categoryCell.classList.add('category-name');
            const spanElement = document.createElement('span');
            spanElement.textContent = category;
            // categoryCell.textContent = category;
            categoryCell.appendChild(spanElement);
            tableRow.appendChild(categoryCell);

            years.forEach(year => {
                const amount = expensesByCategoryAndYear[category][year] || 0;
                const amountCell = document.createElement('td');
                amountCell.classList.add(`year-${year}`);
                amountCell.classList.add(`amount`);
                amountCell.setAttribute('title', `'${category}' expenses in ${year}`);
                amountCell.textContent = amount.toFixed(2);
                amountCell.addEventListener('click', () => {
                    displayMonthlyWise(category, year, expensesFiltered);
                });
                tableRow.appendChild(amountCell);
            });

            const categoryTotalExpenses = calculateExpensesByCategory(masterData);
            const categoryTotal = document.createElement('span');
            categoryTotal.classList.add('category-total-expenses');
            categoryTotal.classList.add(`amount`);
            categoryTotal.setAttribute('title', `Total '${category}' expenses`);
            categoryTotal.textContent = categoryTotalExpenses[category].toFixed(2);
            categoryCell.appendChild(categoryTotal);

            tableBody.appendChild(tableRow);
        });

        // Display table
        const expensesTable = document.getElementById('expenses-table');
        if (expensesTable == null) return;
        expensesTable.innerHTML = '';
        expensesTable.appendChild(tableHeaderRow);
        expensesTable.appendChild(tableBody);

        // Add event listeners to category cells for displaying monthly-wise expenses
        document.querySelectorAll('.category-name').forEach(categoryCell => {
            categoryCell.addEventListener('click', () => {
                const category = categoryCell.textContent;
                const year = new Date().getFullYear(); // Update with the desired year
                displayMonthlyWise(category, year, expenses);
            });
        });
    }

});

let initializedSorting = false;

function initializeSorting() {
    // Ensure initializeSorting function is called only once
    if (initializedSorting) {
        return;
    }

    // Get all elements with the class 'yearHeader'
    document.querySelectorAll('#yearHeader').forEach((yearHeader, yearIndex) => {
        yearHeader.addEventListener('click', () => {
            // Toggle sorting order
            const sortIcon = yearHeader.querySelector('#sortIcon');
            const ascending = toggleSortOrder(sortIcon);

            // Sort table data based on the clicked year column index and ascending order
            sortTableData(ascending, yearIndex + 1, null);
        });
    });

    // Get all elements with the class 'categoryHeader'
    document.querySelectorAll('#categoryHeader').forEach((categoryHeader, categoryIndex) => {
        categoryHeader.addEventListener('click', () => {
            // Toggle sorting order
            const sortIcon = categoryHeader.querySelector('#sortIcon');
            const ascending = toggleSortOrder(sortIcon);

            // Sort table data based on the clicked category column index and ascending order
            sortTableData(ascending, null, categoryIndex);
        });
    });

    // Set initializedSorting to true to prevent multiple calls
    initializedSorting = true;
}


function toggleSortOrder(sortIcon) {
    // Toggle sort order
    let ascending = sortIcon.textContent === '▼';
    sortIcon.textContent = ascending ? '▲' : '▼';
    return ascending;
}

document.addEventListener('DOMContentLoaded', () => {
    // Create a new MutationObserver instance
    const observer = new MutationObserver((mutationsList, observer) => {
        // Check if the yearHeader element is added to the DOM
        mutationsList.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                const yearHeader = document.getElementById('yearHeader');
                if (yearHeader) {
                    // If the yearHeader element is added, initialize the sorting functionality
                    initializeSorting();

                    // Disconnect the observer to stop observing further mutations
                    observer.disconnect();
                }
            }
        });
    });

    // Start observing mutations in the document body
    observer.observe(document.body, { childList: true, subtree: true });
});

// Function to sort the table data
function sortTableData(ascending, yearIndex, categoryIndex) {
    const table = document.getElementById('expenses-table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((rowA, rowB) => {
        let valueA, valueB;
        if (yearIndex !== null) {
            // If sorting based on the year column
            valueA = parseInt(rowA.children[yearIndex].textContent.replace(/₹|,/g, ""));
            valueB = parseInt(rowB.children[yearIndex].textContent.replace(/₹|,/g, ""));
        } else if (categoryIndex !== null) {
            // If sorting based on the category column
            valueA = rowA.children[categoryIndex].textContent;
            valueB = rowB.children[categoryIndex].textContent;
        }

        // Compare values and sort accordingly
        if (valueA < valueB) return ascending ? -1 : 1;
        if (valueA > valueB) return ascending ? 1 : -1;
        return 0;
    });

    // Append sorted rows to table body
    tbody.innerHTML = '';
    rows.forEach(row => {
        tbody.appendChild(row);
    });
}

// Function to toggle overlay visibility
function toggleOverlay(show) {
    const overlay = document.querySelector('.overlay');
    if (show) {
        overlay.style.display = 'block';
    } else {
        overlay.style.display = 'none';
    }
}

function displayMonthlyWise(category, year, expenses) {
    // Check if a popup container already exists
    let popupContainer = document.querySelector('.popup-container');

    // If a popup container does not exist, create one
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.classList.add('popup-container', 'monthly-expenses-container');
        document.body.appendChild(popupContainer);
    }

    // Show overlay to prevent clicks on background content
    toggleOverlay(true);

    // Calculate monthly expenses
    const monthlyExpenses = Array.from({ length: 12 }, (_, i) => {
        const monthExpenses = expenses.filter(expense => {
            const expenseYear = new Date(convertDateFormat(expense.Date)).getFullYear();
            const expenseMonth = new Date(convertDateFormat(expense.Date)).getMonth();
            return expenseYear === year && expenseMonth === i && expense.Category === category;
        });
        return monthExpenses.reduce((total, expense) => total + parseFloat(expense.INR), 0);
    });

    let tableRows = '';
    monthlyExpenses.forEach((expense, index) => {
        tableRows += `<tr><td class="month">${MONTHS[index]}</td><td class="amount">${expense.toFixed(2)}</td></tr>`;
    });
    const totalExpenses = monthlyExpenses.reduce((total, expense) => total + parseFloat(expense), 0);
    const popupContent = `
        <div class="popup monthly-expenses">
            <div class="navigation-buttons">
                <button onclick="showPreviousYear('${category}', ${year})">Previous Year</button>
                <button onclick="showNextYear('${category}', ${year})">Next Year</button>
            </div>
            <h3>${category} Expenses (${year})</h3>
            <table>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            <div class="yearly-stats">
                <p class="stats-avg">Avg: ${(totalExpenses / 12).toFixed(2)}</p>
                <p class="stats-total">Total: ${totalExpenses.toFixed(2)}</p>
            </div>
            <button class="close-button" onclick="closePopup(this, 'main-popup')">Close</button>
        </div>
    `;

    // Update the content of the existing popup container
    popupContainer.innerHTML = popupContent;

    // Add event listeners to month rows for displaying day-wise expenses
    document.querySelectorAll('.month').forEach(monthCell => {
        monthCell.addEventListener('click', () => {
            const monthName = monthCell.textContent;
            const monthIndex = MONTHS.indexOf(monthName);
            monthCell.closest('.popup-container').setAttribute('hidden', 'true');
            displayDayWise('.monthly-expenses-container', category, year, expenses, monthIndex + 1); // Month index is zero-based
        });
    });
}

function showPreviousYear(category, year) {
    year--;
    displayMonthlyWise(category, year, masterExpenses);
}

function showNextYear(category, year) {
    year++;
    displayMonthlyWise(category, year, masterExpenses);
}

function displayDayWise(rootElement, category, year, expenses, month) {
    // Create an array to store accumulated expenses for each day of the month
    const accumulatedExpenses = Array.from({ length: 31 }, () => []);

    // Filter expenses for the selected category, year, and month
    const monthExpenses = expenses.filter(expense => {
        const expenseYear = new Date(convertDateFormat(expense.Date)).getFullYear();
        const expenseMonth = new Date(convertDateFormat(expense.Date)).getMonth() + 1; // Months are zero-based
        return expenseYear === year && expenseMonth === month && expense.Category === category;
    });

    // Calculate accumulated expenses for each day
    monthExpenses.forEach(expense => {
        const expenseDate = new Date(convertDateFormat(expense.Date));
        const dayOfMonth = expenseDate.getDate();
        accumulatedExpenses[dayOfMonth - 1].push(expense);
    });

    const monthTotalExpenses = monthExpenses.reduce((total, expense) => total + parseFloat(expense.INR), 0).toFixed(2);

    // Create the calendar view popup content
    const popupContent = `
        <div class="popup daily-expenses">
            <div class="navigation-buttons">
            <button onclick="showPreviousMonth('${category}', ${year}, ${month})">Previous Month</button>
            <button onclick="showNextMonth('${category}', ${year}, ${month})">Next Month</button>
        </div>
            <h3>${category} Expenses: ${monthTotalExpenses} (${MONTHS[month - 1]} ${year})</h3>
            <div class="calendar-container">
                <div class="calendar-header">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                </div>
                <div class="calendar-grid">
                    ${generateCalendarGrid(year, month, accumulatedExpenses)}
                </div>
            </div>
            <div class="expenses-list" id="expensesList"></div>
            <button class="close-button" onclick="closePopup(this, '${rootElement}')">Back</button>
        </div>
    `;

    // Create or update the popup container
    let popupContainer = document.querySelector('.daily-expenses-container');
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.classList.add('popup-container');
        popupContainer.classList.add('daily-expenses-container');
        document.body.appendChild(popupContainer);
    }

    // Show overlay to prevent clicks on background content
    toggleOverlay(true);

    popupContainer.innerHTML = popupContent;
}

function showPreviousMonth(category, year, month) {
    if (month === 1) {
        year--; // If current month is January, decrement the year
        month = 12; // Set the month to December
    } else {
        month--; // Decrement the month
    }
    displayDayWise('.monthly-expenses-container', category, year, masterExpenses, month);
}

function showNextMonth(category, year, month) {
    if (month === 12) {
        year++; // If current month is December, increment the year
        month = 1; // Set the month to January
    } else {
        month++; // Increment the month
    }
    displayDayWise('.monthly-expenses-container', category, year, masterExpenses, month);
}

function generateCalendarGrid(year, month, accumulatedExpenses) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // Get the day of the week for the first day of the month (0: Sunday, 1: Monday, etc.)
    const lastDayOfWeek = new Date(year, month - 1, daysInMonth).getDay(); // Get the day of the week for the last day of the month
    let calendarGridHTML = '<div class="week-row">';

    // Add empty cells to align the first day of the month correctly
    for (let i = 0; i < firstDayOfWeek; i++) {
        calendarGridHTML += '<div class="day-cell empty"></div>'; // Empty cell for days before the first day of the month
    }

    for (let i = 1; i <= daysInMonth; i++) {
        // Generate a grid cell for each day
        const dayOfWeek = new Date(year, month - 1, i).getDay(); // Month is zero-based
        if (dayOfWeek === 0 && i !== 1) calendarGridHTML += '</div><div class="week-row">'; // Start new week row on Sundays, except for the first week
        // Calculate total accumulated expenses for the day
        const dayTotal = accumulatedExpenses[i - 1].reduce((total, expense) => total + parseFloat(expense.INR), 0);

        // Append the day cell to the calendar grid
        calendarGridHTML += `<div class="day-cell ${dayTotal > 0 ? 'has-expense' : ''}" title="Total Expenses: ₹${dayTotal}" onclick='showExpensesList(this, ".daily-expenses-container", ${i}, ${JSON.stringify(accumulatedExpenses[i - 1])})'><span class="date">${i}</span><span class="day-total">${dayTotal > 0 ? dayTotal : ''}</span></div>`;
    }

    // Add empty cells to align the last day of the month correctly
    for (let i = lastDayOfWeek + 1; i < 7; i++) {
        calendarGridHTML += '<div class="day-cell empty"></div>'; // Empty cell for days after the last day of the month
    }

    calendarGridHTML += '</div>'; // Close the last week row
    return calendarGridHTML;
}

function showExpensesList(thisElement, rootElement, day, accumulatedExpenses) {
    // thisElement.closest('.popup-container').classList.add('hide-this');
    if (thisElement.classList.contains('has-expense')) {
        document.querySelector(rootElement).setAttribute('hidden', 'true');
    }

    const expensesListContainer = document.getElementById('expensesList');
    expensesListContainer.innerHTML = ''; // Clear previous content

    const expenses = accumulatedExpenses; // Get expenses for the selected day

    if (expenses.length === 0) {
        expensesListContainer.textContent = `No expenses for the date ${day} in this month.`;
        return;
    }

    // const expensesList = document.createElement('ul');
    let tableRows = '';
    expenses.forEach(expense => {
        // const expenseItem = document.createElement('li');
        // expenseItem.textContent = `Amount: ₹${expense.INR}, Note: ${expense.Note}, Description: ${expense.Description}`;
        const expenseDate = new Date(convertDateFormat(expense.Date));
        const formattedDate = `${expenseDate.getDate()}/${expenseDate.getMonth() + 1}/${expenseDate.getFullYear()}`;
        tableRows += `<tr><td>${expenseDate.toDateString()}</td><td>${expense.INR}</td><td>${expense.Note}</td><td>${expense.Description}</td></tr>`;
        // expensesList.appendChild(expenseItem);
    });

    // Create the day-wise expenses popup content
    const popupContent = `
        <div class="popup list-day-expenses">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Note</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            <button class="close-button" onclick="closePopup(this, '${rootElement}')">Back</button>
        </div>
    `;

    // Create or update the popup container
    let popupContainer = document.querySelector('.list-day-expenses-container');
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.classList.add('popup-container');
        popupContainer.classList.add('list-day-expenses-container');
        document.body.appendChild(popupContainer);
    }

    // Show overlay to prevent clicks on background content
    toggleOverlay(true);

    popupContainer.innerHTML = popupContent;
}

function closePopup(element, parentPopupContainer) {
    const popupContainer = element.closest('.popup-container');
    const popupContainerEl = document.querySelector(parentPopupContainer);
    if (popupContainerEl) {
        popupContainerEl.removeAttribute('hidden');
    }
    if (popupContainer) {
        popupContainer.remove();
    }

    // Hide overlay when popup is closed
    if (parentPopupContainer === 'main-popup') {
        toggleOverlay(false);
    }
}

function convertDateFormat(dateString) {
    const parts = dateString.includes('/') ? dateString.split("/") : dateString.split("-");
    const convertedDate = `${parts[1]}/${parts[0]}/${parts[2]}`;
    return convertedDate;
}

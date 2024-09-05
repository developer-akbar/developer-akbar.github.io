document.addEventListener('DOMContentLoaded', async function () {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const currentPeriod = document.getElementById('current-period');
    const currentYear = document.getElementById('current-year');

    let currentDailyDate = new Date();
    let currentMonthlyDate = new Date();

    currentPeriod.textContent = formatDate(currentDailyDate);
    currentYear.textContent = formatYear(currentMonthlyDate);

    const masterData = await utility.initializeMasterData() || [];
    updateDailyTransactions();

    window.addTransaction = function (newTransaction) { // Define addTransaction globally
        const masterExpenses = JSON.parse(localStorage.getItem('masterExpenses'));

        const existingIndex = masterExpenses.length > 0 ? masterExpenses.findIndex(expense => expense.ID == newTransaction.ID) : -1;

        if (existingIndex > -1) {
            masterExpenses[existingIndex] = newTransaction;
        } else {
            masterExpenses.push(newTransaction);
        }

        localStorage.setItem('masterExpenses', JSON.stringify(masterExpenses));

        // Update currentDailyDate and currentMonthlyDate to the new transaction's date
        showModifiedTransactionPeriod(newTransaction);

        // Smooth scroll to the new transaction row
        setTimeout(() => {
            const transactionRow = document.getElementById(`transaction-${newTransaction.ID}`);
            if (transactionRow) {
                transactionRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                transactionRow.classList.add('highlight');
                setTimeout(() => {
                    transactionRow.classList.remove('highlight');
                }, 1000); // Match the duration of the CSS animation
            }
        }, 100);
    };

    window.showModifiedTransactionPeriod = function (newTransaction) {
        const transactionDate = new Date(convertDateFormat(newTransaction.Date));
        currentDailyDate = transactionDate;
        currentMonthlyDate = transactionDate;

        // Set active tab and update transactions
        setActiveTab('daily');
        updateDailyTransactions();

        currentPeriod.textContent = formatDate(currentDailyDate);
        currentYear.textContent = formatYear(currentMonthlyDate);
    }

    function setActiveTab(tabName) {
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName);
            content.style.display = content.id === tabName ? 'block' : 'none';
        });
    }

    function updateDailyTransactions() {
        document.querySelector('.selected-total-wrapper').style.display = 'none';

        const dailyTransactionsContainer = document.getElementById('daily-transactions');
        dailyTransactionsContainer.innerHTML = ''; // Clear previous transactions

        if (localStorage.getItem('masterExpenses') === null) return;

        // Filter transactions for the current month and year
        const filteredTransactions = JSON.parse(localStorage.getItem('masterExpenses')).filter(expense => {
            const expenseDate = new Date(convertDateFormat(expense.Date));
            return expenseDate.getMonth() === currentDailyDate.getMonth() && expenseDate.getFullYear() === currentDailyDate.getFullYear();
        });

        // sorting transactions by date
        filteredTransactions.sort((a, b) => new Date(convertDateFormat(b.Date)) - new Date(convertDateFormat(a.Date)));

        // Group transactions by day
        const transactionsByDay = filteredTransactions.reduce((acc, expense) => {
            const date = new Date(convertDateFormat(expense.Date)).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(expense);
            return acc;
        }, {});

        const tableElement = document.createElement('table');

        // Display transactions grouped by day
        if (Object.entries(transactionsByDay).length > 0) {
            for (const [date, transactions] of Object.entries(transactionsByDay)) {
                const tableBodyElement = document.createElement('tbody');
                tableBodyElement.className = 'transaction-day-wrapper';

                const dayContainer = tableElement.insertRow();
                dayContainer.className = 'transaction-day';

                const dayHeader = dayContainer.insertCell();
                dayHeader.classList.add('day-header');
                dayHeader.setAttribute('colspan', '5'); // Adjusted for mobile view

                const dayContent = document.createElement('h3');
                dayContent.classList.add('day-content');
                dayContent.textContent = date;

                const totals = calculateTotals(transactions);
                const dayTotals = document.createElement('div');
                dayTotals.classList.add('day-totals');
                dayTotals.innerHTML = `<p class="income">${formatIndianCurrency(totals.income)}</p><p class="expense">${formatIndianCurrency(totals.expense)}</p>`;
                dayContent.appendChild(dayTotals);
                dayHeader.appendChild(dayContent);
                dayContainer.appendChild(dayHeader);
                tableBodyElement.appendChild(dayContainer);

                transactions.forEach(expense => {
                    const transactionRow = createTransactionRow(expense);
                    tableBodyElement.appendChild(transactionRow);
                    tableElement.appendChild(tableBodyElement);
                });
            }
        } else {
            const tableColumn = document.createElement('td');
            tableColumn.className = 'no-transactions-msg';
            tableColumn.textContent = 'No transactions';
            tableElement.appendChild(tableColumn);
        }
        dailyTransactionsContainer.appendChild(tableElement);

        const monthlyTotals = calculateTotals(filteredTransactions);
        document.getElementById('daily-income').innerHTML = `<p>Income</p> <p>${formatIndianCurrency(monthlyTotals.income)}</p>`;
        document.getElementById('daily-expenses').innerHTML = `<p>Expenses</p> <p>${formatIndianCurrency(monthlyTotals.expense)}</p>`;
        document.getElementById('daily-balance').innerHTML = `<p>Balance</p> <p>${formatIndianCurrency(monthlyTotals.income - monthlyTotals.expense)}</p>`;
    }

    function updateMonthlyTransactions() {
        if (masterData.length == 0) return;

        const monthlyTransactionsContainer = document.getElementById('monthly-transactions');
        monthlyTransactionsContainer.innerHTML = ''; // Clear previous transactions

        // Filter transactions for the current year
        const filteredTransactions = masterData.filter(expense => {
            const expenseDate = new Date(convertDateFormat(expense.Date));
            return expenseDate.getFullYear() === currentMonthlyDate.getFullYear();
        });

        filteredTransactions.sort((a, b) => new Date(convertDateFormat(b.Date)) - new Date(convertDateFormat(a.Date)));

        // Group transactions by month
        const transactionsByMonth = filteredTransactions.reduce((acc, expense) => {
            const month = new Date(convertDateFormat(expense.Date)).getMonth();
            if (!acc[month]) {
                acc[month] = [];
            }
            acc[month].push(expense);
            return acc;
        }, {});

        // Display transactions grouped by month
        for (let i = 11; i >= 0; i--) {
            const monthContainer = document.createElement('div');
            monthContainer.className = 'transaction-row';
            monthContainer.dataset.month = i; // Add this line to store the month index

            const monthName = document.createElement('span');
            monthName.textContent = new Date(2024, i).toLocaleString('default', { month: 'short' });

            const totals = transactionsByMonth[i] ? calculateTotals(transactionsByMonth[i]) : { income: 0, expenses: 0 };
            const income = document.createElement('span');
            income.className = 'amount income';
            income.textContent = formatIndianCurrency(totals.income);
            const expenses = document.createElement('span');
            expenses.className = 'amount expense';
            expenses.textContent = formatIndianCurrency(totals.expense);
            const balance = document.createElement('span');
            balance.className = 'amount balance';
            balance.textContent = formatIndianCurrency(totals.income - totals.expense);

            monthContainer.appendChild(monthName);
            monthContainer.appendChild(income);
            monthContainer.appendChild(expenses);
            monthContainer.appendChild(balance);

            monthlyTransactionsContainer.appendChild(monthContainer);
        }

        const yearlyTotals = calculateTotals(filteredTransactions);
        document.getElementById('monthly-income').innerHTML = `<p>Income</p> <p>${formatIndianCurrency(yearlyTotals.income)}</p>`;
        document.getElementById('monthly-expenses').innerHTML = `<p>Expenses</p> <p>${formatIndianCurrency(yearlyTotals.expense)}</p>`;
        document.getElementById('monthly-balance').innerHTML = `<p>Balance</p> <p>${formatIndianCurrency(yearlyTotals.income - yearlyTotals.expense)}</p>`;
        // Add click event listener for each month row to switch to Daily tab
        const monthRows = document.querySelectorAll('#monthly-transactions .transaction-row');
        monthRows.forEach(row => {
            row.addEventListener('click', () => {
                currentDailyDate = new Date(currentMonthlyDate.getFullYear(), row.dataset.month);
                setActiveTab('daily');
                document.getElementById('daily-transactions').style.display = 'block';
                document.getElementById('monthly-transactions').style.display = 'none';
                document.getElementById('total-transactions').style.display = 'none';
                currentPeriod.textContent = formatDate(currentDailyDate);
                updateDailyTransactions();
            });
        });
    }

    function updateTotalTransactions() {
        if (masterData.length == 0) return;

        const totalTransactionsContainer = document.getElementById('total-transactions');
        totalTransactionsContainer.innerHTML = ''; // Clear previous transactions

        // Group transactions by year
        const transactionsByYear = masterData.reduce((acc, expense) => {
            const year = new Date(convertDateFormat(expense.Date)).getFullYear();
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(expense);
            return acc;
        }, {});

        // Display transactions grouped by year
        for (const [year, transactions] of Object.entries(transactionsByYear).sort((a, b) => Number.parseInt(b) - Number.parseInt(a))) {
            const yearContainer = document.createElement('div');
            yearContainer.className = 'transaction-row';
            yearContainer.dataset.year = year; // Add this line to store the year

            const yearName = document.createElement('span');
            yearName.textContent = year;

            const totals = calculateTotals(transactions);
            const income = document.createElement('span');
            income.className = 'amount income';
            income.textContent = formatIndianCurrency(totals.income);
            const expenses = document.createElement('span');
            expenses.className = 'amount expense';
            expenses.textContent = formatIndianCurrency(totals.expense);
            const balance = document.createElement('span');
            balance.className = 'amount balance';
            balance.textContent = formatIndianCurrency(totals.income - totals.expense);

            yearContainer.appendChild(yearName);
            yearContainer.appendChild(income);
            yearContainer.appendChild(expenses);
            yearContainer.appendChild(balance);

            totalTransactionsContainer.appendChild(yearContainer);
        }

        const totalTotals = calculateTotals(masterData);
        document.getElementById('total-income').innerHTML = `<p>Income</p> <p>${formatIndianCurrency(totalTotals.income)}</p>`;
        document.getElementById('total-expenses').innerHTML = `<p>Expenses</p> <p>${formatIndianCurrency(totalTotals.expense)}</p>`;
        document.getElementById('total-balance').innerHTML = `<p>Balance</p> <p>${formatIndianCurrency(totalTotals.income - totalTotals.expense)}</p>`;

        // Add click event listener for each year row to switch to Monthly tab
        const yearRows = document.querySelectorAll('#total-transactions .transaction-row');
        yearRows.forEach(row => {
            row.addEventListener('click', () => {
                currentMonthlyDate = new Date(row.dataset.year);
                setActiveTab('monthly');
                currentYear.textContent = formatYear(currentMonthlyDate);
                document.getElementById('daily-transactions').style.display = 'none';
                document.getElementById('monthly-transactions').style.display = 'flex';
                document.getElementById('total-transactions').style.display = 'none';
                updateMonthlyTransactions();
            });
        });
    }

    // Initial setup
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            setActiveTab(tabName);
            if (tabName === 'daily') {
                currentPeriod.textContent = formatDate(currentDailyDate);
                updateDailyTransactions();
            } else if (tabName === 'monthly') {
                currentYear.textContent = formatYear(currentMonthlyDate);
                updateMonthlyTransactions();
            } else if (tabName === 'total') {
                updateTotalTransactions();
            }
        });
    });

    // Call initial tab setting
    setActiveTab('daily');

    // Add click event listeners for the tabs
    document.querySelector('[data-tab="daily"]').addEventListener('click', function () {
        document.getElementById('daily-transactions').style.display = 'block';
        document.getElementById('monthly-transactions').style.display = 'none';
        document.getElementById('total-transactions').style.display = 'none';
    });

    document.querySelector('[data-tab="monthly"]').addEventListener('click', function () {
        document.getElementById('daily-transactions').style.display = 'none';
        document.getElementById('monthly-transactions').style.display = 'flex';
        document.getElementById('total-transactions').style.display = 'none';
    });

    document.querySelector('[data-tab="total"]').addEventListener('click', function () {
        document.getElementById('daily-transactions').style.display = 'none';
        document.getElementById('monthly-transactions').style.display = 'none';
        document.getElementById('total-transactions').style.display = 'flex';
    });

    // Ensure only one tab content is visible at a time initially
    document.getElementById('daily-transactions').style.display = 'flex';
    document.getElementById('monthly-transactions').style.display = 'none';
    document.getElementById('total-transactions').style.display = 'none';

    // Event listeners for period navigation
    const updateDailyPeriod = (direction) => {
        currentDailyDate.setMonth(currentDailyDate.getMonth() + direction);
        updateDailyTransactions();
        currentPeriod.textContent = formatDate(currentDailyDate);
    };

    const updateMonthlyPeriod = (direction) => {
        currentMonthlyDate.setFullYear(currentMonthlyDate.getFullYear() + direction);
        updateMonthlyTransactions();
        currentYear.textContent = formatYear(currentMonthlyDate);
    };

    // Event listeners for period navigation
    document.getElementById('prev-period').addEventListener('click', () => updateDailyPeriod(-1));
    document.getElementById('next-period').addEventListener('click', () => updateDailyPeriod(1));

    document.getElementById('prev-year').addEventListener('click', () => updateMonthlyPeriod(-1));
    document.getElementById('next-year').addEventListener('click', () => updateMonthlyPeriod(1));

    let startX = 0;
    // Swipe right/left event listener
    document.querySelector('.viewable-content').addEventListener('touchstart', (event) => {
        startX = event.changedTouches[0].clientX;
    }, false);

    document.querySelector('.viewable-content').addEventListener('touchend', (event) => {
        let endX = event.changedTouches[0].clientX;
        let deltaX = endX - startX;

        if (deltaX > 100) { // Swipe right
            if (document.querySelector('.tab-content.active').getAttribute('id') === 'daily') {
                updateDailyPeriod(-1);
            }
            if (document.querySelector('.tab-content.active').getAttribute('id') === 'monthly') {
                updateMonthlyPeriod(-1);
            }
        } else if (deltaX < -100) { // Swipe left
            if (document.querySelector('.tab-content.active').getAttribute('id') === 'daily') {
                updateDailyPeriod(1);
            }
            if (document.querySelector('.tab-content.active').getAttribute('id') === 'monthly') {
                updateMonthlyPeriod(1);
            }
        }
    }, false);

});

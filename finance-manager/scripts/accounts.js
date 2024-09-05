// accounts.js

document.addEventListener('DOMContentLoaded', async () => {
    const accountsSection = document.getElementById('accounts-section');
    const dailyTransactionsSection = document.getElementById('daily-transactions-section');
    const selectedAccountDisplay = document.getElementById('selected-account');
    const currentPeriod = document.getElementById('current-period');
    const backButton = document.getElementById('back-button');

    let currentDailyDate = new Date();
    let selectedAccount = null;

    const masterData = await utility.initializeMasterData();
    const accountGroups = JSON.parse(localStorage.getItem('accountGroups')) || [];
    const accountMappings = JSON.parse(localStorage.getItem('accountMappings')) || {};
    const accounts = JSON.parse(localStorage.getItem('accounts')) || getAccounts();

    currentPeriod.textContent = formatDate(currentDailyDate);
    updateAccountBalances();

    // hiding account group container if there are not accounts mapped.
    document.querySelectorAll('.group-container').forEach(groupContainer => {
        if (groupContainer.querySelectorAll('.account-row').length <= 0) {
            groupContainer.style.display = 'none'
        }
    });

    function updateAccountBalances() {
        const accountsBalancesContainer = document.getElementById('accounts-balances');
        accountsBalancesContainer.innerHTML = ''; // Clear previous balances

        if (localStorage.getItem('masterExpenses') === null) return;

        // Calculate account balances
        const accountBalances = JSON.parse(localStorage.getItem('masterExpenses')).reduce((acc, expense) => {
            const account = expense.Account;
            const amount = parseFloat(expense.INR);
            if (!acc[account]) {
                acc[account] = 0;
            }
            if (expense["Income/Expense"] === "Income") {
                acc[account] += amount;
            } else if (expense["Income/Expense"] === "Expense") {
                acc[account] -= amount;
            } else if (expense["Income/Expense"] === "Transfer-Out") {
                acc[account] -= amount;
                const targetAccount = expense.Category;
                if (!acc[targetAccount]) {
                    acc[targetAccount] = 0;
                }
                acc[targetAccount] += amount;
            }
            return acc;
        }, {});

        let assets = 0;
        let liabilities = 0;

        // Display accounts group-wise if groups are available
        if (accountGroups.length > 0 && Object.keys(accountMappings).length > 0) {
            accountGroups.forEach(group => {
                const groupContainer = document.createElement('div');
                groupContainer.className = 'group-container';
                const groupTitle = document.createElement('h3');
                groupTitle.textContent = group.name;
                groupContainer.appendChild(groupTitle);

                const groupAccounts = accountMappings[group.name] || [];

                groupAccounts.forEach(account => {
                    const balance = accountBalances[account] || 0;
                    const accountContainer = document.createElement('div');
                    accountContainer.className = 'account-row';
                    accountContainer.dataset.account = account;

                    const accountName = document.createElement('span');
                    accountName.className = 'line-clamp';
                    accountName.title = account;
                    accountName.textContent = account;

                    const accountBalance = document.createElement('span');
                    accountBalance.className = 'amount';
                    accountBalance.textContent = formatIndianCurrency(balance);
                    if (balance >= 0) {
                        accountBalance.classList.add('positive');
                        assets += balance;
                    } else {
                        accountBalance.classList.add('negative');
                        liabilities += Math.abs(balance);
                    }

                    accountContainer.appendChild(accountName);
                    accountContainer.appendChild(accountBalance);
                    groupContainer.appendChild(accountContainer);
                });

                accountsBalancesContainer.appendChild(groupContainer);
            });
        }

        // Display unmapped accounts
        const mappedAccounts = Object.values(accountMappings).flat();
        const unmappedAccounts = accounts.filter(account => !mappedAccounts.includes(account));

        if (unmappedAccounts.length > 0) {
            const unmappedGroupContainer = document.createElement('div');
            unmappedGroupContainer.className = 'group-container';
            const unmappedGroupTitle = document.createElement('h3');
            // unmappedGroupTitle.textContent = 'Unmapped Accounts';
            unmappedGroupContainer.appendChild(unmappedGroupTitle);

            unmappedAccounts.forEach(account => {
                const balance = accountBalances[account] || 0;
                const accountContainer = document.createElement('div');
                accountContainer.className = 'account-row';
                accountContainer.dataset.account = account;

                const accountName = document.createElement('span');
                accountName.title = account;
                accountName.textContent = account;

                const accountBalance = document.createElement('span');
                accountBalance.className = 'amount';
                accountBalance.textContent = formatIndianCurrency(balance);
                if (balance >= 0) {
                    accountBalance.classList.add('positive');
                    assets += balance;
                } else {
                    accountBalance.classList.add('negative');
                    liabilities += Math.abs(balance);
                }

                accountContainer.appendChild(accountName);
                accountContainer.appendChild(accountBalance);
                unmappedGroupContainer.appendChild(accountContainer);
            });

            accountsBalancesContainer.appendChild(unmappedGroupContainer);
        }

        const balance = assets - liabilities;

        document.getElementById('assets').innerHTML = `<p>Assets</p><p>${formatIndianCurrency(assets)}</p>`;
        document.getElementById('liabilities').innerHTML = `<p>Liabilities</p><p>${formatIndianCurrency(liabilities)}</p>`;
        document.getElementById('balance').innerHTML = `<p>Balance</p><p>${formatIndianCurrency(balance)}</p>`;

        // Add click event listener for each account row to switch to Daily tab with filtered transactions
        const accountRows = document.querySelectorAll('.account-row');
        accountRows.forEach(row => {
            row.addEventListener('click', () => {
                selectedAccount = row.dataset.account;
                selectedAccountDisplay.textContent = `Transactions for ${selectedAccount}`;
                currentDailyDate = new Date(); // Reset to current month
                updateAccountTransactions();
                accountsSection.style.display = 'none';
                dailyTransactionsSection.style.display = 'block';
            });
        });
    }

    function getAccounts() {
        if (localStorage.getItem('masterExpenses') === null) return;
        
        const accountBalances = JSON.parse(localStorage.getItem('masterExpenses')).reduce((acc, expense) => {
            const account = expense.Account;
            if (!acc.includes(account)) {
                acc.push(account);
            }
            if (expense["Income/Expense"] === "Transfer-Out") {
                const targetAccount = expense.Category;
                if (!acc.includes(targetAccount)) {
                    acc.push(targetAccount);
                }
            }
            return acc;
        }, []);

        return accountBalances;
    }

    function updateAccountTransactions() {
        document.querySelector('.selected-total-wrapper').style.display = 'none';

        const accountTransactionsContainer = document.getElementById('account-transactions');
        accountTransactionsContainer.innerHTML = ''; // Clear previous transactions

        // Filter transactions for the current month and year for the selected account
        const filteredTransactions = JSON.parse(localStorage.getItem('masterExpenses')).filter(expense => {
            const expenseDate = new Date(convertDateFormat(expense.Date));
            const matchesDate = expenseDate.getMonth() === currentDailyDate.getMonth() && expenseDate.getFullYear() === currentDailyDate.getFullYear();
            const matchesAccount = expense.Account === selectedAccount || (expense["Income/Expense"] === "Transfer-Out" && expense.Category === selectedAccount);
            return matchesDate && matchesAccount;
        });

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

                const dayContainer = document.createElement('tr');
                dayContainer.className = 'transaction-day';

                const dayHeader = dayContainer.insertCell();
                dayHeader.classList.add('day-header');
                dayHeader.setAttribute('colspan', '5');

                const dayContent = document.createElement('h3');
                dayContent.classList.add('day-content');
                dayContent.textContent = date;

                const totals = calculateAccountTotals(transactions);
                const dayTotals = document.createElement('div');
                dayTotals.classList.add('day-totals');
                dayTotals.innerHTML = `<p class="deposits">${formatIndianCurrency(totals.deposits)}</p> <p class="withdrawal">${formatIndianCurrency(totals.withdrawal)}</p>`;
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
        accountTransactionsContainer.appendChild(tableElement);

        const monthlyTotals = calculateAccountTotals(filteredTransactions);
        document.getElementById('account-deposits').innerHTML = `<p>Deposits</p><p>${formatIndianCurrency(monthlyTotals.deposits)}</p>`;
        document.getElementById('account-withdrawal').innerHTML = `<p>Withdrawal</p><p>${formatIndianCurrency(monthlyTotals.withdrawal)}</p>`;
        document.getElementById('account-total').innerHTML = `<p>Total</p><p>${formatIndianCurrency(monthlyTotals.deposits - monthlyTotals.withdrawal)}</p>`;
        document.getElementById('account-balance').innerHTML = `<p>Balance</p><p>${formatIndianCurrency(calculateMonthEndBalance(selectedAccount, currentDailyDate))}</p>`;

        selectedAccountDisplay.textContent = `${selectedAccount}`;
    }

    function calculateMonthEndBalance(account, date) {
        const transactions = JSON.parse(localStorage.getItem('masterExpenses')).filter(expense => {
            const expenseDate = new Date(convertDateFormat(expense.Date));
            return expenseDate <= date && (expense.Account === account || (expense["Income/Expense"] === "Transfer-Out" && expense.Category === account));
        });

        return transactions.reduce((acc, expense) => {
            const amount = parseFloat(expense.INR);
            if (expense.Account === account) {
                if (expense["Income/Expense"] === "Income") {
                    acc += amount;
                } else if (expense["Income/Expense"] === "Expense") {
                    acc -= amount;
                } else if (expense["Income/Expense"] === "Transfer-Out") {
                    acc -= amount;
                }
            }
            if (expense.Category === account && expense["Income/Expense"] === "Transfer-Out") {
                acc += amount;
            }
            return acc;
        }, 0);
    }

    function calculateAccountTotals(transactions) {
        return transactions.reduce((acc, expense) => {
            const amount = parseFloat(expense.INR);
            if (expense["Income/Expense"] === "Income") {
                acc.deposits += amount;
            } else if (expense["Income/Expense"] === "Expense") {
                acc.withdrawal += amount;
            } else if (expense["Income/Expense"] === "Transfer-Out") {
                if (expense.Account === selectedAccount) {
                    acc.withdrawal += amount;
                }
                if (expense.Category === selectedAccount) {
                    acc.deposits += amount;
                }
            }
            return acc;
        }, { deposits: 0, withdrawal: 0 });
    }

    // Back button event listener
    backButton.addEventListener('click', () => {
        accountsSection.style.display = 'block';
        dailyTransactionsSection.style.display = 'none';
    });

    const updatePeriod = (direction) => {
        currentDailyDate.setMonth(currentDailyDate.getMonth() + direction);
        updateAccountTransactions();
        currentPeriod.textContent = formatDate(currentDailyDate);
    };

    // Event listeners for period navigation
    document.getElementById('prev-period').addEventListener('click', () => updatePeriod(-1));
    document.getElementById('next-period').addEventListener('click', () => updatePeriod(1));

    let startX = 0;
    // Swipe right/left event listener
    document.querySelector('.viewable-content').addEventListener('touchstart', (event) => {
        startX = event.changedTouches[0].clientX;
    }, false);

    document.querySelector('.viewable-content').addEventListener('touchend', (event) => {
        let endX = event.changedTouches[0].clientX;
        let deltaX = endX - startX;

        if (deltaX > 100) { // Swipe right
            updatePeriod(-1);
        } else if (deltaX < -100) { // Swipe left
            updatePeriod(1);
        }
    }, false);
});

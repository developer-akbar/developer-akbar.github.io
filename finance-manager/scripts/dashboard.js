document.addEventListener('DOMContentLoaded', async () => {
    const totalIncomeElem = document.getElementById('total-income');
    const totalExpensesElem = document.getElementById('total-expenses');
    const expenseChangeElem = document.getElementById('expense-change');
    const mostSpendingCategoryElem = document.getElementById('most-spending-category');
    const avgMonthlySpendingElem = document.getElementById('avg-monthly-spending');
    const avgYearlySpendingElem = document.getElementById('avg-yearly-spending');
    const recentTransactionsList = document.getElementById('recent-transactions-list');
    const yearlyAnalysisList = document.getElementById('yearly-analysis-list');

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const isFirst10Days = currentDate.getDate() <= 10;
    const monthToShow = isFirst10Days ? currentMonth - 1 : currentMonth;
    const yearToShow = isFirst10Days && currentMonth === 0 ? currentYear - 1 : currentYear;

    const masterData = await utility.initializeMasterData();
    if (masterData === null) return;

    const displayMonth = new Date(yearToShow, monthToShow);

    document.querySelector('.summary-section h3').textContent = `${isFirst10Days ? 'Previous Month\'s' : 'Current Month\'s'} (${displayMonth.toLocaleString('default', { month: 'short' })}, ${displayMonth.getFullYear()}) Summary`;

    // Calculate totals for the month to show
    const monthData = masterData.filter(expense => {
        const date = new Date(convertDateFormat(expense.Date));
        return date.getMonth() === monthToShow && date.getFullYear() === yearToShow;
    });

    const totalIncome = monthData.filter(expense => expense["Income/Expense"] === "Income")
        .reduce((acc, expense) => acc + parseFloat(expense.INR), 0);
    const totalExpenses = monthData.filter(expense => expense["Income/Expense"] === "Expense")
        .reduce((acc, expense) => acc + parseFloat(expense.INR), 0);

    totalIncomeElem.textContent = formatIndianCurrency(totalIncome);
    totalExpensesElem.textContent = formatIndianCurrency(totalExpenses);

    // Calculate the percentage change in expenses compared to the previous month
    const previousMonthData = masterData.filter(expense => {
        const date = new Date(convertDateFormat(expense.Date));
        return date.getMonth() === monthToShow - 1 && date.getFullYear() === yearToShow;
    });

    const previousMonthExpenses = previousMonthData.filter(expense => expense["Income/Expense"] === "Expense")
        .reduce((acc, expense) => acc + parseFloat(expense.INR), 0);

    if (previousMonthExpenses > 0) {
        const expenseChange = ((totalExpenses - previousMonthExpenses) / previousMonthExpenses) * 100;
        expenseChangeElem.innerHTML = `<b class="${Math.sign(expenseChange) > 0 ? 'negative' : 'positive'}">
        You have spent 
        ${Math.sign(expenseChange) > 0 ? 'more' : 'less'} 
        than ${Math.abs(expenseChange.toFixed(2))}% from previous month.</b>`;
    }

    // Determine the most spending category
    const categoryTotals = monthData.reduce((acc, expense) => {
        if (expense["Income/Expense"] === "Expense") {
            if (!acc[expense.Category]) {
                acc[expense.Category] = 0;
            }
            acc[expense.Category] += parseFloat(expense.INR);
        }
        return acc;
    }, {});

    const mostSpendingCategory = Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b);
    const mostSpendingPercentage = (categoryTotals[mostSpendingCategory] / totalExpenses) * 100;

    mostSpendingCategoryElem.innerHTML = `${mostSpendingCategory} 
                                            (${mostSpendingPercentage < 100
            ? mostSpendingPercentage.toFixed(2)
            : `<b class="negative">${mostSpendingPercentage.toFixed(2)}</b>`}%)`;

    // Calculate average monthly and yearly spending
    const totalExpensesAll = masterData.filter(expense => expense["Income/Expense"] === "Expense")
        .reduce((acc, expense) => acc + parseFloat(expense.INR), 0);
    const monthsInData = new Set(masterData.map(expense => {
        const date = new Date(convertDateFormat(expense.Date));
        return `${date.getFullYear()}-${date.getMonth()}`;
    })).size;
    const yearsInData = new Set(masterData.map(expense => new Date(convertDateFormat(expense.Date)).getFullYear())).size;

    const avgMonthlySpending = totalExpensesAll / monthsInData;
    const avgYearlySpending = totalExpensesAll / yearsInData;

    avgMonthlySpendingElem.innerHTML = `<b>${formatIndianCurrency(avgMonthlySpending)}</b>`;
    avgYearlySpendingElem.innerHTML = `<b>${formatIndianCurrency(avgYearlySpending)}</b>`;

    const currentMonthSpendingComparison = ((totalExpenses - avgMonthlySpending) / avgMonthlySpending) * 100;
    expenseChangeElem.innerHTML += `<br>
    <b class="${Math.sign(currentMonthSpendingComparison) > 0 ? 'negative' : 'positive'}">
        Compared to average monthly spending, you have spent 
        ${Math.sign(currentMonthSpendingComparison) > 0 ? 'more' : 'less'} 
        than ${Math.abs(currentMonthSpendingComparison.toFixed(2))}%.</b>`;

    // Render the monthly category spending chart
    document.querySelector('.charts-section h3').textContent = `${isFirst10Days ? 'Previous Month\'s' : 'Current Month\'s'} Category Spendings (${displayMonth.toLocaleString('default', { month: 'short' })}, ${displayMonth.getFullYear()})`;

    const monthlyCategorySpendingChartCtx = document.getElementById('monthly-category-spending-chart').getContext('2d');
    new Chart(monthlyCategorySpendingChartCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: Object.keys(categoryTotals).map((_, i) => `hsl(${i * 30}, 100%, 75%)`)
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(2);
                            return `${label}: ${formatIndianCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Render the total category spending chart
    const allCategoryTotals = masterData.reduce((acc, expense) => {
        if (expense["Income/Expense"] === "Expense") {
            if (!acc[expense.Category]) {
                acc[expense.Category] = 0;
            }
            acc[expense.Category] += parseFloat(expense.INR);
        }
        return acc;
    }, {});

    const totalCategorySpendingChartCtx = document.getElementById('total-category-spending-chart').getContext('2d');
    new Chart(totalCategorySpendingChartCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(allCategoryTotals),
            datasets: [{
                data: Object.values(allCategoryTotals),
                backgroundColor: Object.keys(allCategoryTotals).map((_, i) => `hsl(${i * 30}, 100%, 75%)`)
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false // Disable the default legend display
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(2);
                            return `${context.label}: ${formatIndianCurrency(context.raw)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Display last 6 months expenses
    let currentMonthlyDate = new Date();
    const filteredTransactions = masterData.filter(expense => {
        const expenseDate = new Date(convertDateFormat(expense.Date));
        return expenseDate.getFullYear() === currentMonthlyDate.getFullYear();
    });

    const transactionsByMonth = filteredTransactions.reduce((acc, expense) => {
        const month = new Date(convertDateFormat(expense.Date)).getMonth();
        if (!acc[month]) {
            acc[month] = [];
        }
        acc[month].push(expense);
        return acc;
    }, {});

    for (let i = (new Date().getMonth()); i > (new Date().getMonth() - 6); i--) {
        const totals = transactionsByMonth[i] ? calculateTotals(transactionsByMonth[i]) : { income: 0, expenses: 0 };
        const listItem = document.createElement('li');
        listItem.classList.add('recent-transaction');

        if (parseInt(i) === currentMonth) {
            listItem.classList.add('current-month');
        } else if (parseInt(i) > currentMonth) {
            listItem.classList.add('future-month');
        }
        listItem.innerHTML = `<span class="month-year">${formatDate(new Date(currentMonthlyDate.getFullYear(), i))}</span>
                                <span class="expense">${formatIndianCurrency(totals.expense)}</span>`;
        recentTransactionsList.appendChild(listItem);
    }

    // Render the monthly trends chart
    const trendsChartCtx = document.getElementById('trends-chart').getContext('2d');
    const months = [];
    const incomeTrends = [];
    const expenseTrends = [];

    for (let i = (new Date().getMonth()); i > (new Date().getMonth() - 6); i--) {
        const date = new Date();
        date.setMonth(i);
        months.push(date.toLocaleString('default', { month: 'short' }));

        const totals = transactionsByMonth[i] ? calculateTotals(transactionsByMonth[i]) : { income: 0, expenses: 0 };
        incomeTrends.push(totals.income);
        expenseTrends.push(totals.expense);
    }

    new Chart(trendsChartCtx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: incomeTrends,
                    borderColor: '#4caf50',
                    fill: false,
                    backgroundColor: '#4141c1'
                },
                {
                    label: 'Expenses',
                    data: expenseTrends,
                    borderColor: '#f44336',
                    fill: false,
                    backgroundColor: '#d25050'
                }
            ]
        },
        options: {
            responsive: true
        }
    });

    // Yearly analysis
    const transactionsByYear = masterData.reduce((acc, expense) => {
        const year = new Date(convertDateFormat(expense.Date)).getFullYear();
        if (!acc[year]) {
            acc[year] = [];
        }
        acc[year].push(expense);
        return acc;
    }, {});

    let totalExpensesAcrossYears = 0;

    const headerItem = document.createElement('li');
    headerItem.className = 'yearly-analysis-item header';
    headerItem.innerHTML = `<span class="year">Year</span>
                        <span class="">Yearly Spendings</span>
                        <span class="">Monthly Avg</span>`;
    yearlyAnalysisList.appendChild(headerItem);

    // Reference to the node after which new items should be inserted
    let insertAfterNode = headerItem;

    Object.keys(transactionsByYear).forEach(year => {
        const yearTransactions = transactionsByYear[year];
        const yearlyTotal = yearTransactions.filter(expense => expense["Income/Expense"] === "Expense")
            .reduce((acc, expense) => acc + parseFloat(expense.INR), 0);

        const monthlyAverage = yearlyTotal / 12;
        totalExpensesAcrossYears += yearlyTotal;

        const listItem = document.createElement('li');
        listItem.className = 'yearly-analysis-item';

        if (parseInt(year) === currentYear) {
            listItem.classList.add('current-year');
        } else if (parseInt(year) > currentYear) {
            listItem.classList.add('future-year');
        }

        listItem.innerHTML = `<span class="year">${year}</span>
                          <span class="expense">${formatIndianCurrency(yearlyTotal)}</span>
                          <span class="monthly-average">${formatIndianCurrency(monthlyAverage)}</span>`;

        // Insert the new list item after the reference node
        insertAfterNode.insertAdjacentElement('afterend', listItem);
    });

    // Add total expenses and average monthly expenses
    const totalAverageMonthlyExpenses = totalExpensesAcrossYears / monthsInData;
    const totalListItem = document.createElement('li');
    totalListItem.className = 'yearly-analysis-item';
    totalListItem.innerHTML = `<span class="year">Total</span>
                            <span class="expense">${formatIndianCurrency(totalExpensesAcrossYears)}</span>
                            <span class="monthly-average">${formatIndianCurrency(totalAverageMonthlyExpenses)}</span>`;
    yearlyAnalysisList.appendChild(totalListItem);
});

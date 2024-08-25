
const categorySpendingChartCtx = document.getElementById('category-spending-chart').getContext('2d');
const subcategoryTrendChartCtx = document.getElementById('subcategory-trend-chart').getContext('2d');
let categorySpendingChart;
let subcategoryTrendChart;

export function updateCategorySpendingChart(categories) {
    const labels = Object.keys(categories);
    const data = Object.values(categories).map(category => category.total);
    const backgroundColors = labels.map((_, i) => `hsl(${i * 30}, 100%, 75%)`);

    if (categorySpendingChart) {
        categorySpendingChart.destroy();
    }

    categorySpendingChart = new Chart(categorySpendingChartCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors
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
}

export function updateSubcategoryTrendChart(masterExpenses, selectedCategory, selectedSubcategory, currentTab, currentMonthlyDate) {
    const filteredTransactions = masterExpenses.filter(expense => {
        const expenseDate = new Date(convertDateFormat(expense.Date));
        return expense.Category === selectedCategory && (!selectedSubcategory || expense.Subcategory === selectedSubcategory);
    });

    const transactionsByPeriod = filteredTransactions.reduce((acc, expense) => {
        const expenseDate = new Date(convertDateFormat(expense.Date));
        let period;

        if (currentTab === 'monthly') {
            period = `${expenseDate.getFullYear()}-${expenseDate.getMonth() + 1}`;
        } else if (currentTab === 'yearly') {
            period = `${expenseDate.getFullYear()}`;
        } else if (currentTab === 'financial-yearly') {
            const year = expenseDate.getMonth() < 3 ? expenseDate.getFullYear() - 1 : expenseDate.getFullYear();
            period = `${year}-${year + 1}`;
        } else {
            period = `${expenseDate.getFullYear()}`;
        }

        if (!acc[period]) {
            acc[period] = 0;
        }
        acc[period] += parseFloat(expense.INR);
        return acc;
    }, {});

    const currentYear = currentMonthlyDate.getFullYear();
    let labels = Object.keys(transactionsByPeriod).reverse();
    const originalLabels = [...labels]; // Store all labels for the 'All' view
    const limit = 9; // Number of periods to show by default

    // Filter and slice the keys to get the last 9 elements including the current period
    if (currentTab === 'monthly') {
        labels = labels.filter(label => {
            const [year, month] = label.split('-').map(Number);
            return year < currentYear || (year === currentYear && month <= currentMonthlyDate.getMonth() + 1);
        }).slice(-limit);
    } else if (currentTab === 'yearly') {
        labels = labels.filter(label => Number(label) <= currentYear).slice(-limit);
    } else if (currentTab === 'financial-yearly') {
        labels = labels.filter(label => {
            const [startYear, endYear] = label.split('-').map(Number);
            return endYear <= currentYear + 1;
        }).slice(-limit);
    }

    const data = labels.map(period => transactionsByPeriod[period]);
    const backgroundColors = labels.map((_, i) => `hsl(${i * 30}, 100%, 75%)`);

    if (subcategoryTrendChart) {
        subcategoryTrendChart.destroy();
    }

    subcategoryTrendChart = new Chart(subcategoryTrendChartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${selectedSubcategory ? selectedSubcategory : 'All Subcategories'}`,
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#4caf50',
                fill: false
            }]
        },
        options: {
            responsive: true
        }
    });

    document.getElementById('subcategory-trend-title').textContent = `${selectedSubcategory ? selectedSubcategory : 'All Subcategories'} Trends`;
    document.getElementById('subcategory-trend-section').style.display = 'flex';

    // Handle 'All' CTA click event
    const allTrendsButton = document.getElementById('show-all-trends-cta');
    let showingAll = false; // Flag to track if showing all data

    if (allTrendsButton.classList.contains('active')) {
        allTrendsButton.classList.remove('active');
    }

    allTrendsButton.onclick = () => {
        showingAll = !showingAll; // Toggle the flag

        if (showingAll) {
            const allData = originalLabels.map(period => transactionsByPeriod[period]);
            const allBackgroundColors = originalLabels.map((_, i) => `hsl(${i * 30}, 100%, 75%)`);

            if (subcategoryTrendChart) {
                subcategoryTrendChart.destroy();
            }

            subcategoryTrendChart = new Chart(subcategoryTrendChartCtx, {
                type: 'line',
                data: {
                    labels: originalLabels,
                    datasets: [{
                        label: `${selectedSubcategory ? selectedSubcategory : 'All Subcategories'}`,
                        data: allData,
                        backgroundColor: allBackgroundColors,
                        borderColor: '#4caf50',
                        fill: false
                    }]
                },
                options: {
                    responsive: true
                }
            });

            document.getElementById('subcategory-trend-title').textContent = `${selectedSubcategory ? selectedSubcategory : 'All Subcategories'} Trends (All)`;
            allTrendsButton.classList.add('active'); // Update CTA appearance
            allTrendsButton.setAttribute('title', 'Show recent trends');
        } else {
            if (subcategoryTrendChart) {
                subcategoryTrendChart.destroy();
            }

            subcategoryTrendChart = new Chart(subcategoryTrendChartCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${selectedSubcategory ? selectedSubcategory : 'All Subcategories'}`,
                        data: data,
                        backgroundColor: backgroundColors,
                        borderColor: '#4caf50',
                        fill: false
                    }]
                },
                options: {
                    responsive: true
                }
            });

            document.getElementById('subcategory-trend-title').textContent = `${selectedSubcategory ? selectedSubcategory : 'All Subcategories'} Trends`;
            allTrendsButton.classList.remove('active'); // Update CTA appearance
            allTrendsButton.setAttribute('title', 'Show all trends');
        }
    };
}
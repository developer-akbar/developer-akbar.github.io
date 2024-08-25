// search.js
document.addEventListener('DOMContentLoaded', async () => {
    const clearFiltersButton = document.getElementById('clear-filters');
    const suggestionsDiv = document.getElementById('suggestions');
    const period = document.getElementById('period');
    const periodNavigation = document.getElementById('period-navigation');
    const currentPeriod = document.getElementById('current-period');
    const prevPeriodButton = document.getElementById('prev-period');
    const nextPeriodButton = document.getElementById('next-period');
    const filterToggle = document.getElementById('filter-toggle');
    const filterWrapper = document.getElementById('filter-wrapper');
    const searchResultsWrapper = document.querySelector('.search-results-wrapper');
    const customStart = document.getElementById('custom-start');
    const customEnd = document.getElementById('custom-end');
    const searchInput = document.getElementById('searchInput');

    searchInput.focus();

    let periodType = 'all';
    let currentDate = new Date();

    const masterData = await utility.initializeMasterData();

    searchInput.addEventListener('input', showSuggestions);

    // hide suggestions list when focus out
    document.addEventListener('click', function(event) {
        if (!searchInput.contains(event.target) && !suggestionsDiv.contains(event.target)) {
            suggestionsDiv.innerHTML = '';
        }
    });
    searchInput.addEventListener('keydown', navigateSuggestions);
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            let searchResults = performSearch();

            // Show the filter options after performing the search
            if (searchResults.length > 0) {
                clearFiltersButton.style.display = 'inline-block';
                populateFilterOptions(searchResults);
            }
        }
    });
    document.getElementById('searchButton').addEventListener('click', (e) => {
        e.preventDefault();

        // Clear existing options first
        document.getElementById('account-select').querySelector('.custom-options').innerHTML = '<div class="custom-option"><input type="checkbox" id="account-all" value="all"> <label for="account-all">All</label></div>';
        document.getElementById('category-select').querySelector('.custom-options').innerHTML = '<div class="custom-option"><input type="checkbox" id="category-all" value="all"> <label for="category-all">All</label></div>';

        let searchResults = performSearch();

        // Show the filter options after performing the search
        if (searchResults.length > 0) {
            clearFiltersButton.style.display = 'inline-block';
            populateFilterOptions(searchResults);
        }
    });

    period.addEventListener('change', toggleCustomPeriod);
    period.addEventListener('change', updatePeriodDisplay);
    prevPeriodButton.addEventListener('click', () => changePeriod(-1));
    nextPeriodButton.addEventListener('click', () => changePeriod(1));
    filterToggle.addEventListener('click', () => {
        if (filterWrapper.style.display === 'none' || filterWrapper.style.display === '') {
            filterWrapper.style.display = 'block';
            searchResultsWrapper.style.display = 'flex';
        } else {
            filterWrapper.style.display = 'none';
            searchResultsWrapper.style.display = 'block';
        }
    });

    document.getElementById('account-select').addEventListener('change', performSearch);
    document.getElementById('category-select').addEventListener('change', performSearch);
    document.getElementById('incomeExpense-select').addEventListener('change', performSearch);
    document.getElementById('min-amount').addEventListener('change', performSearch);
    document.getElementById('max-amount').addEventListener('change', performSearch);

    customStart.addEventListener('change', () => {
        if (customStart.value && customEnd.value) {
            document.querySelector('.custom-period').textContent = `${customStart.value} - ${customEnd.value}`;
            performSearch();
        }
    });
    customEnd.addEventListener('change', () => {
        if (customStart.value && customEnd.value) {
            document.querySelector('.custom-period').textContent = `${customStart.value} - ${customEnd.value}`;
            performSearch();
        }
    });

    // Initialize custom dropdowns
    initializeCustomSelect('account-select');
    initializeCustomSelect('category-select');
    initializeCustomSelect('incomeExpense-select');

    // Clear all filters
    clearFiltersButton.addEventListener('click', clearAllFilters);

    function toggleCustomPeriod() {
        if (period.value === 'custom') {
            const today = new Date();

            const firstDayOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
            const lastDayOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));

            // Populating with current month's first and last dates
            customStart.value = firstDayOfMonth.toISOString().substring(0, 10);
            customEnd.value = lastDayOfMonth.toISOString().substring(0, 10);

            customStart.style.display = 'inline';
            customEnd.style.display = 'inline';
            document.querySelector('.custom-period').style.display = 'flex';
            periodNavigation.style.display = 'none';
        } else if (['weekly', 'monthly', 'annually', 'financial-yearly'].includes(period.value)) {
            customStart.style.display = 'none';
            customEnd.style.display = 'none';
            periodNavigation.style.display = 'flex';
            document.querySelector('.custom-period').style.display = 'none';
        } else {
            customStart.style.display = 'none';
            customEnd.style.display = 'none';
            periodNavigation.style.display = 'none';
            document.querySelector('.custom-period').style.display = 'none';
        }
    }

    function updatePeriodDisplay() {
        periodType = period.value;
        currentDate = new Date(); // Reset to current date on period change
        updatePeriodLabel();
        performSearch();
    }

    function changePeriod(direction) {
        if (periodType === 'weekly') {
            currentDate.setDate(currentDate.getDate() + (direction * 7));
        } else if (periodType === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + direction);
        } else if (periodType === 'annually') {
            currentDate.setFullYear(currentDate.getFullYear() + direction);
        } else if (periodType === 'financial-yearly') {
            currentDate.setFullYear(currentDate.getFullYear() + direction);
        }
        updatePeriodLabel();
        performSearch();
    }

    function updatePeriodLabel() {
        if (periodType === 'weekly') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            currentPeriod.textContent = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
        } else if (periodType === 'monthly') {
            const month = currentDate.toLocaleString('default', { month: 'long' });
            currentPeriod.textContent = `${month} ${currentDate.getFullYear()}`;
        } else if (periodType === 'annually') {
            currentPeriod.textContent = `${currentDate.getFullYear()}`;
        } else if (periodType === 'financial-yearly') {
            const currentYear = currentDate.getUTCFullYear();
            const currentMonth = currentDate.getUTCMonth();
        
            let financialYearStart, financialYearEnd;
        
            if (currentMonth >= 3) { // April to December
                financialYearStart = new Date(Date.UTC(currentYear, 3, 1)); // April 1st
                financialYearEnd = new Date(Date.UTC(currentYear + 1, 2, 31, 23, 59, 59, 999)); // March 31st of next year
            } else { // January to March
                financialYearStart = new Date(Date.UTC(currentYear - 1, 3, 1)); // April 1st of previous year
                financialYearEnd = new Date(Date.UTC(currentYear, 2, 31, 23, 59, 59, 999)); // March 31st
            }
        
            currentPeriod.textContent = `Apr ${financialYearStart.getUTCFullYear()} - Mar ${financialYearEnd.getUTCFullYear()}`;
        }
    }

    function showSuggestions() {
        const searchInput = document.getElementById('searchInput').value.toLowerCase();
        suggestionsDiv.innerHTML = '';

        if (searchInput.length === 0) {
            return;
        }

        const notesSet = new Set();
        const regex = /^[a-zA-Z\s]+$/; // Only letters and spaces

        masterData && masterData.forEach(expense => {
            if (regex.test(expense.Note) && expense.Note.toLowerCase().includes(searchInput)) {
                notesSet.add(expense.Note);
            }
        });

        const suggestions = Array.from(notesSet); // Array.from(notesSet).slice(0, 10) Limit to n suggestions
        const suggestionsList = document.createElement('ul');

        suggestions.forEach(suggestion => {
            const listItem = document.createElement('li');
            listItem.textContent = suggestion;
            listItem.className = 'suggestion-item';

            listItem.addEventListener('click', () => {
                document.getElementById('searchInput').value = suggestion;
                const searchResults = performSearch();

                // Show the filter options after performing the search
                if (searchResults.length > 0) {
                    clearFiltersButton.style.display = 'inline-block';
                    populateFilterOptions(searchResults);
                }
                suggestionsDiv.innerHTML = '';
            });
            suggestionsList.appendChild(listItem);
        });
        suggestionsDiv.appendChild(suggestionsList);
    }

    function navigateSuggestions(e) {
        const suggestions = document.querySelectorAll('.suggestion-item');
        if (suggestions.length === 0) return;

        let index = Array.from(suggestions).findIndex(item => item.classList.contains('selected'));

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (index !== -1) {
                suggestions[index].classList.remove('selected');
            }
            index = (index + 1) % suggestions.length;
            suggestions[index].classList.add('selected');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (index !== -1) {
                suggestions[index].classList.remove('selected');
            }
            index = (index - 1 + suggestions.length) % suggestions.length;
            suggestions[index].classList.add('selected');
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (index !== -1) {
                suggestions[index].click();
            }
        }
    }

    async function performSearch() {
        document.querySelector('.selected-total-wrapper').style.display = 'none';
    
        filterToggle.style.display = 'block';
    
        const searchInput = document.getElementById('searchInput').value.toLowerCase();
        const period = document.getElementById('period').value;
        const selectedAccounts = getSelectedCheckboxValues('account-select');
        const selectedCategory = getSelectedCheckboxValues('category-select');
        const selectedIncomeExpense = getSelectedCheckboxValues('incomeExpense-select');
        const minAmount = document.getElementById('min-amount').value;
        const maxAmount = document.getElementById('max-amount').value;
    
        const masterData = await utility.initializeMasterData();
        if (masterData === null) return;

        let searchResults = masterData.filter(expense => {
            const description = expense.Description.toLowerCase();
            const note = expense.Note.toLowerCase();
            return description.includes(searchInput) || note.includes(searchInput);
        });

        // sort results by latest transaction date
        searchResults.sort((a, b) => new Date(convertDateFormat(b.Date)) - new Date(convertDateFormat(a.Date)));
    
        if (period !== 'all') {
            searchResults = searchResults.filter(expense => {
                const expenseDate = new Date(convertDateFormat(expense.Date));
                if (period === 'weekly') {
                    const startOfWeek = new Date(currentDate);
                    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    return expenseDate >= startOfWeek && expenseDate <= endOfWeek;
                } else if (period === 'monthly') {
                    return expenseDate.getMonth() === currentDate.getMonth() && expenseDate.getFullYear() === currentDate.getFullYear();
                } else if (period === 'annually') {
                    return expenseDate.getFullYear() === currentDate.getFullYear();
                } else if (period === 'financial-yearly') {
                    let financialYearStart, financialYearEnd;
    
                    if (currentDate.getMonth() >= 3) { // April to December
                        financialYearStart = new Date(currentDate.getFullYear(), 3, 1);
                        financialYearEnd = new Date(currentDate.getFullYear() + 1, 2, 31, 23, 59, 59, 999);
                    } else { // January to March
                        financialYearStart = new Date(currentDate.getFullYear() - 1, 3, 1);
                        financialYearEnd = new Date(currentDate.getFullYear(), 2, 31, 23, 59, 59, 999);
                    }
    
                    return expenseDate >= financialYearStart && expenseDate <= financialYearEnd;
                } else if (period === 'custom' && customStart.value && customEnd.value) {
                    return expenseDate >= new Date(customStart.value) && expenseDate <= new Date(customEnd.value);
                }
            });
        }
    
        if (selectedAccounts.length > 0) {
            if (selectedAccounts.includes('all')) {
                searchResults = searchResults.filter(expense => true);
            } else {
                searchResults = searchResults.filter(expense => selectedAccounts.includes(expense.Account));
            }
        }
    
        if (selectedCategory.length > 0) {
            if (selectedCategory.includes('all')) {
                searchResults = searchResults.filter(expense => true);
            } else {
                searchResults = searchResults.filter(expense => selectedCategory.includes(expense.Category));
            }
        }
    
        if (minAmount || maxAmount) {
            searchResults = searchResults.filter(expense => {
                const price = parseFloat(expense.INR);
                return (!minAmount || price >= minAmount) && (!maxAmount || price <= maxAmount);
            });
        }
    
        if (selectedIncomeExpense.length > 0) {
            if (selectedIncomeExpense.includes('all')) {
                searchResults = searchResults.filter(expense => true);
            } else {
                searchResults = searchResults.filter(expense => selectedIncomeExpense.includes(expense["Income/Expense"]));
            }
        }
    
        displaySearchResults(searchResults);
        displaySelectedFilters();

        // Rretain selected filters if any
        const selectedFilters = {
            accounts: selectedAccounts,
            categories: selectedCategory,
            incomeExpense: selectedIncomeExpense
        };
        populateFilterOptions(searchResults, selectedFilters);
    
        suggestionsDiv.innerHTML = '';
    
        return searchResults;
    }

    function displaySearchResults(transactions) {
        // clear previous results
        if (document.getElementById('selected-total')) {
            document.getElementById('selected-total').textContent = '';
        }

        // clear previous results
        document.getElementById('total-income').innerHTML = `<p>Income</p> <p>0.00</p>`;
        document.getElementById('total-expenses').innerHTML = `<p>Expenses</p> <p>0.00</p>`;
        document.getElementById('total-transfers').innerHTML = `<p>Transfer</p> <p>0.00</p>`;

        const searchResultsDiv = document.getElementById('searchResults');
        searchResultsDiv.innerHTML = ''; // Clear previous results

        const resultCountElement = document.querySelector('.search-count');
        if (transactions.length === 0) {
            searchResultsDiv.innerHTML = '<p class="no-results-info">No matching results found.</p>';
            resultCountElement.innerHTML = '';
            return;
        } else {
            resultCountElement.innerHTML = `Showing ${transactions.length} results.`;
        }

        const table = document.createElement('table');
        const headerRow = table.insertRow();
        headerRow.classList.add('transaction-row');
        ['Select', 'Category', 'Amount', 'Note', 'Description'].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.classList.add(headerText.toLowerCase());
        });

        let totalIncome = transactions.filter(expense => expense["Income/Expense"] === "Income")
            .reduce((total, expense) => total + parseFloat(expense.INR), 0).toFixed(2);
        let totalExpenses = transactions.filter(expense => expense["Income/Expense"] === "Expense")
            .reduce((total, expense) => total + parseFloat(expense.INR), 0).toFixed(2);
        let totalTransfer = transactions.filter(expense => expense["Income/Expense"] === "Transfer-Out")
            .reduce((total, expense) => total + parseFloat(expense.INR), 0).toFixed(2);

        document.getElementById('total-income').innerHTML = `<p>Income</p> <p>${formatIndianCurrency(parseFloat(totalIncome))}</p>`;
        document.getElementById('total-expenses').innerHTML = `<p>Expenses</p> <p>${formatIndianCurrency(parseFloat(totalExpenses))}</p>`;
        document.getElementById('total-transfers').innerHTML = `<p>Transfer</p> <p>${formatIndianCurrency(parseFloat(totalTransfer))}</p>`;

        transactions.forEach(expense => {
            const dayContainer = table.insertRow();
            dayContainer.className = 'transaction-day';

            const dayHeader = dayContainer.insertCell();
            dayHeader.classList.add('day-header');
            dayHeader.setAttribute('colspan', '5'); // Adjusted for mobile view

            const dayContent = document.createElement('h3');
            dayContent.classList.add('day-content');
            dayContent.textContent = new Date(convertDateFormat(expense.Date)).toDateString();;
            dayHeader.appendChild(dayContent);
            dayContainer.appendChild(dayHeader);
            table.appendChild(dayContainer);

            const row = table.insertRow();
            row.classList.add('transaction-row');

            const checkboxCell = row.insertCell();
            const inputElement = document.createElement('input');
            inputElement.type = 'checkbox';
            inputElement.className = 'select-checkbox';
            inputElement.setAttribute('data-id', expense.ID)
            inputElement.addEventListener('change', updateSelectedTotal);
            checkboxCell.appendChild(inputElement);

            const dateElement = row.insertCell();
            const dateCell = document.createElement('p');
            dateCell.textContent = new Date(convertDateFormat(expense.Date)).toDateString();
            dateCell.className = 'date';
            const categoryElement = document.createElement('p');
            categoryElement.classList.add('transaction-category', 'line-clamp');
            categoryElement.textContent = `${expense.Category}`;
            dateElement.appendChild(dateCell);
            dateElement.appendChild(categoryElement);

            const noteCell = row.insertCell();
            noteCell.textContent = expense.Note;
            noteCell.classList.add('note');

            row.addEventListener('click', (event) => {
                // Check if the clicked element is not a checkbox
                if (!event.target.matches('input[type="checkbox"]')) {
                    typeof editTransaction === 'undefined' ? showTransactionDetails(expense) : editTransaction(expense.ID);
                }
            });

            const descriptionCell = row.insertCell();
            descriptionCell.textContent = expense.Description.replaceAll('|new-line|', '\n').replaceAll('|comma|', ',');
            descriptionCell.classList.add('description');

            const amountCell = row.insertCell();
            amountCell.textContent = formatIndianCurrency(parseFloat(expense.INR));
            const type = expense['Income/Expense'] === 'Expense' ? 'expense' : expense['Income/Expense'] === 'Income' ? 'income' : 'transfer-out';
            amountCell.classList.add('amount', type);
        });

        searchResultsDiv.appendChild(table);
    }

    // Show filters
    function populateFilterOptions(searchResults, selectedFilters = {}) {
        const accounts = getAccountsOrCategories(searchResults, 'Account');
        const categories = getAccountsOrCategories(searchResults, 'Category');
    
        // Set count for Filters
        document.querySelector('.account-count').textContent = `(${Object.keys(accounts).length})`;
        document.querySelector('.category-count').textContent = `(${Object.keys(categories).length})`;
    
        const accountSelect = document.getElementById('account-select').querySelector('.custom-options');
        const categorySelect = document.getElementById('category-select').querySelector('.custom-options');
    
        // Clear existing options first
        accountSelect.innerHTML = '<div class="custom-option"><input type="checkbox" id="account-all" value="all"> <label for="account-all">All</label></div>';
        categorySelect.innerHTML = '<div class="custom-option"><input type="checkbox" id="category-all" value="all"> <label for="category-all">All</label></div>';
    
        for (let account in accounts) {
            if (accounts.hasOwnProperty(account)) {
                const option = document.createElement('div');
                option.className = 'custom-option';
                option.innerHTML = `<input type="checkbox" id="account-${account}" value="${account}" ${selectedFilters.accounts?.includes(account) ? 'checked' : ''}><label for="account-${account}">${account} <span class="filter-option-count">(${accounts[account].count})</span></label>`;
                accountSelect.appendChild(option);
            }
        }
    
        for (let category in categories) {
            if (categories.hasOwnProperty(category)) {
                const option = document.createElement('div');
                option.className = 'custom-option';
                option.innerHTML = `<input type="checkbox" id="category-${category}" value="${category}" ${selectedFilters.categories?.includes(category) ? 'checked' : ''}><label for="category-${category}">${category} <span class="filter-option-count ${categories[category].type.toLowerCase()}">(${categories[category].count}) (${formatIndianCurrency(categories[category].total)})</span></label>`;
                categorySelect.appendChild(option);
            }
        }
    
        // Reinitialize custom selects
        initializeCustomSelect('account-select');
        initializeCustomSelect('category-select');
    }

    function getAccountsOrCategories(searchResults, key) {
        const result = {};

        searchResults.forEach(item => {
            const { Subcategory, INR } = item;
            const mainKey = item[key];
            const type = item["Income/Expense"];

            if (key === 'Category' && (type !== 'Expense' && type !== 'Income')) {
                return; // Skip if the key is 'Category' and the type is neither 'Expense' nor 'Income'
            }

            if (!result[mainKey]) {
                result[mainKey] = { type: '', count: 0, total: 0, subcategories: {} };
            }

            result[mainKey].type = type;
            result[mainKey].count += 1;
            result[mainKey].total += parseFloat(INR);

            if (Subcategory) {
                if (!result[mainKey].subcategories[Subcategory]) {
                    result[mainKey].subcategories[Subcategory] = 0;
                }
                result[mainKey].subcategories[Subcategory] += parseFloat(INR);
            }
        });

        return result;
    }

    function getSelectedCheckboxValues(selectId) {
        const checkboxes = document.getElementById(selectId).querySelectorAll('input[type="checkbox"]:checked');
        const values = Array.from(checkboxes).map(checkbox => checkbox.value);
        // If 'All' is selected, return an empty array to indicate all values should be considered.
        return values.includes('all') ? [] : values;
    }

    function initializeCustomSelect(selectId) {
        const selectWrapper = document.getElementById(selectId);
        const options = selectWrapper.querySelectorAll('.custom-option input[type="checkbox"]');
        const allOption = selectWrapper.querySelector('input[value="all"]');

        options.forEach(option => {
            option.addEventListener('change', (event) => {
                if (event.target.value === 'all') {
                    options.forEach(opt => opt.checked = event.target.checked);
                } else {
                    const allChecked = Array.from(options).every(opt => opt.checked || opt.value === 'all');
                    allOption.checked = allChecked;
                }
                performSearch();
            });
        });
    }

    function displaySelectedFilters() {
        const selectedFiltersDiv = document.getElementById('selected-filters');
        selectedFiltersDiv.innerHTML = '';

        const selectedFilters = [
            { id: 'period', name: 'Period', element: document.getElementById('period') },
            { id: 'account-select', name: 'Account', element: document.getElementById('account-select').querySelector('.custom-options') },
            { id: 'category-select', name: 'Category', element: document.getElementById('category-select').querySelector('.custom-options') },
            { id: 'incomeExpense-select', name: 'Type', element: document.getElementById('incomeExpense-select').querySelector('.custom-options') },
            { id: 'min-amount', name: 'Min Amount', element: document.getElementById('min-amount') },
            { id: 'max-amount', name: 'Max Amount', element: document.getElementById('max-amount') }
        ];

        selectedFilters.forEach(filter => {
            let value = '';

            if (filter.element.tagName === 'SELECT') {
                if (filter.element.multiple) {
                    value = getSelectedCheckboxValues(filter.id).join(', ');
                } else {
                    value = filter.element.options[filter.element.selectedIndex].text;
                }
            } else if (filter.element.tagName === 'DIV' && filter.element.querySelectorAll('input[type="checkbox"]:checked').length > 0) {
                value = getSelectedCheckboxValues(filter.id).join(', ');
            } else {
                value = filter.element.value;
            }

            if (value && value !== 'all' && value !== '') {
                const filterSpan = document.createElement('span');
                filterSpan.textContent = `${filter.name}: ${value}`;
                const removeFilter = document.createElement('span');
                removeFilter.textContent = '✖';
                removeFilter.classList.add('remove-filter');
                removeFilter.addEventListener('click', () => {
                    if (filter.element.tagName === 'SELECT') {
                        if (filter.element.multiple) {
                            Array.from(filter.element.querySelectorAll('input[type="checkbox"]:checked')).forEach(checkbox => {
                                checkbox.checked = false;
                            });
                        } else {
                            filter.element.value = 'all';
                            document.getElementById('period-navigation').style.display = 'none';
                        }
                    } else if (filter.element.tagName === 'DIV') {
                        Array.from(filter.element.querySelectorAll('input[type="checkbox"]:checked')).forEach(checkbox => {
                            checkbox.checked = false;
                        });
                    } else {
                        filter.element.value = '';
                    }
                    performSearch();
                });
                filterSpan.appendChild(removeFilter);
                selectedFiltersDiv.appendChild(filterSpan);
            }
        });

        // Adding filter count to filter icon to indicate user that some filters are applied
        addFilterCount(filterToggle);
    }

    function clearAllFilters() {
        document.getElementById('period').value = 'all';
        customStart.style.display = 'none';
        customEnd.style.display = 'none';

        document.querySelectorAll('.custom-options input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
        document.getElementById('min-amount').value = '';
        document.getElementById('max-amount').value = '';

        periodNavigation.style.display = 'none';
        
        performSearch();
    }

    let startX = 0;

    // Swipe right/left event listener
    document.querySelector('.viewable-content').addEventListener('touchstart', (event) => {
        startX = event.changedTouches[0].clientX;
    }, false);

    document.querySelector('.viewable-content').addEventListener('touchend', (event) => {
        let endX = event.changedTouches[0].clientX;
        let deltaX = endX - startX;

        if (deltaX > 100) {
            if (document.querySelector('.period-navigation').style.display === 'flex') {
                changePeriod(-1); // Swipe right
            }
        } else if (deltaX < -100) {
            if (document.querySelector('.period-navigation').style.display === 'flex') {
                changePeriod(1); // Swipe left
            }
        }
    }, false);

    function addFilterCount(filterToggle) {
        let filtersAvailable = false;
        if (document.querySelector('.selected-filters').childElementCount == 1) {
            filtersAvailable = !document.querySelector('.selected-filters span').innerText.includes('Period: All');
            filterToggle.hasAttribute('data-filters-count') && filterToggle.removeAttribute('data-filters-count');
        } else if (document.querySelector('.selected-filters').childElementCount > 1) {
            filtersAvailable = true;
            filterToggle.setAttribute('data-filters-count', document.querySelector('.selected-filters').childElementCount - 1);
        }
        filterToggle.classList.toggle('active', filtersAvailable);
    }
});

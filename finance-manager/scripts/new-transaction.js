document.addEventListener('DOMContentLoaded', async function () {
    const masterExpenses = JSON.parse(localStorage.getItem('masterExpenses')) || [];

    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const transactionModal = document.getElementById('transaction-modal');
    const transactionForm = document.getElementById('transaction-form');
    const typeOptions = document.getElementById('type-options');
    const dateField = document.getElementById('date');
    const nonTransferFields = document.getElementById('non-transfer-fields');
    const transferFields = document.getElementById('transfer-fields');
    const accountBtn = document.getElementById('account-btn');
    const categoryBtn = document.getElementById('category-btn');
    const subcategoryBtn = document.getElementById('subcategory-btn');
    const fromAccountBtn = document.getElementById('from-account-btn');
    const toAccountBtn = document.getElementById('to-account-btn');
    const accountGrid = document.getElementById('account-grid');
    const categoryGrid = document.getElementById('category-grid');
    const subcategoryGrid = document.getElementById('subcategory-grid');
    const fromAccountGrid = document.getElementById('from-account-grid');
    const noteElement = document.getElementById('note');
    const toAccountGrid = document.getElementById('to-account-grid');
    const cancelBtn = document.querySelector('.cancel-btn');
    const suggestionsDiv = document.getElementById('suggestions');

    dateField.value = new Date().toISOString().substring(0, 10);

    let accounts = [];
    let categories = [];
    let subcategories = [];

    function resetTransactionForm() {
        document.getElementById('transaction-id').value = '';
        document.querySelectorAll('.type-option').forEach(option => option.classList.remove('active'));
        typeOptions.querySelector('.type-option[data-value="Expense"]').classList.add('active');
        accountBtn.textContent = '';
        categoryBtn.textContent = '';
        subcategoryBtn.textContent = '';
        fromAccountBtn.textContent = '';
        toAccountBtn.textContent = '';
        dateField.value = new Date().toISOString().substring(0, 10);
        noteElement.value = '';
        suggestionsDiv.innerHTML = '';
        document.getElementById('description').value = '';
        document.getElementById('amount').value = '';

        nonTransferFields.style.display = 'block';
        transferFields.style.display = 'none';
    }

    function toggleGrid(grid) {
        hideAllGrids();
        grid.classList.toggle('active');
    }

    function hideAllGrids() {
        document.querySelectorAll('.grid').forEach(grid => grid.classList.remove('active'));
    }

    function populateDropdowns() {
        const type = document.querySelector('.type-option.active').dataset.value;

        accountGrid.innerHTML = createGridHeader('Account');
        fromAccountGrid.innerHTML = createGridHeader('From Account');
        toAccountGrid.innerHTML = createGridHeader('To Account');
        categoryGrid.innerHTML = createGridHeader('Category');
        subcategoryGrid.innerHTML = '';

        accounts && accounts.sort().forEach(account => {
            appendGridSpan(accountGrid, account);
            appendGridSpan(fromAccountGrid, account);
            appendGridSpan(toAccountGrid, account);
        });

        Object.keys(categories).flat().sort().forEach(category => appendGridSpan(categoryGrid, category));
        populateSubcategories();
    }

    function populateSubcategories() {
        const selectedCategory = categoryBtn.textContent;
        subcategories = getSubcategories(selectedCategory);

        subcategoryGrid.innerHTML = '';
        if (subcategories.length > 0) {
            subcategoryGrid.innerHTML = createGridHeader('Subcategories');
            subcategories.forEach(subcategory => appendGridSpan(subcategoryGrid, subcategory));
            document.getElementById('subcategory-row').style.display = 'flex';
        } else {
            document.getElementById('subcategory-row').style.display = 'none';
            // document.getElementById('amount').focus(); // Automatically focus on the amount field if no subcategories
        }
    }

    function createGridHeader(label) {
        const header = document.createElement('div');
        header.className = 'grid-header';

        const pElement = document.createElement('p');
        pElement.textContent = label;

        const linkElement = document.createElement('a');
        linkElement.href = 'settings.html';
        linkElement.textContent = 'Add new';

        header.appendChild(pElement);
        header.appendChild(linkElement);
        return header.outerHTML;
    }

    function appendGridSpan(grid, text) {
        const span = document.createElement('span');
        span.textContent = text;
        grid.appendChild(span);
    }

    function getStoredCategories() {
        const typeValue = document.querySelector('.type-option.active').dataset.value;

        const storedCategories = JSON.parse(localStorage.getItem('categories'));
        if (storedCategories) {
            const categories = Object.entries(storedCategories).reduce((acc, [key, value]) => {
                if (value.type === typeValue) {
                    acc[key] = {
                        subcategories: value.subcategories
                    };
                }
                return acc;
            }, {});
            return categories;
        } else {
            const categories = {};

            if (masterExpenses.length === 0) {
                // Defining default categories initially
                const defaultCategories = '{"Housing":{"type":"Expense","subcategories":["Rent","Groceries","Electricity","Gas"]},"Travel":{"type":"Expense","subcategories":[]},"Utilities":{"type":"Expense","subcategories":["Recharge","DTH","Water"]},"Shopping":{"type":"Expense","subcategories":[]},"Health":{"type":"Expense","subcategories":["Medicines","Hospital"]},"Subscriptions":{"type":"Expense","subcategories":["Netflix","Prime"]},"Entertainment":{"type":"Expense","subcategories":["Cinema","Outing"]},"Groceries":{"type":"Expense","subcategories":[]},"Dining":{"type":"Expense","subcategories":[]},"Salary":{"type":"Income","subcategories":[]},"Bonus":{"type":"Income","subcategories":[]},"Petty Cash":{"type":"Income","subcategories":[]}}';
                localStorage.setItem('categories', JSON.stringify(JSON.parse(defaultCategories)));
                return JSON.parse(defaultCategories);
            } else {
                masterExpenses.forEach(expense => {
                    if (expense["Income/Expense"] === typeValue) {
                        if (!categories[expense.Category]) {
                            categories[expense.Category] = { subcategories: [] };
                        }
                        if (expense.Subcategory && !categories[expense.Category].subcategories.includes(expense.Subcategory)) {
                            categories[expense.Category].subcategories.push(expense.Subcategory);
                        }
                    }
                });
            }
            return categories;
        }
    }

    function getSubcategories(category) {
        return [...new Set(categories[category]?.subcategories)];
    }

    addTransactionBtn.addEventListener('click', () => {
        transactionModal.style.display = 'block';
        resetTransactionForm();

        document.querySelector('.submit-btn').style.display = 'block';
        document.querySelector('.delete-button').style.display = 'none';
        populateDropdowns();
        document.querySelector('.type-option[data-value="Expense"]').classList.add('active');
        toggleGrid(accountGrid);
    });

    cancelBtn.addEventListener('click', () => transactionModal.style.display = 'none');
    window.addEventListener('click', event => { if (event.target === transactionModal) transactionModal.style.display = 'none'; });

    typeOptions.addEventListener('click', event => {
        if (event.target.classList.contains('type-option')) {
            document.querySelectorAll('.type-option').forEach(option => option.classList.remove('active'));
            event.target.classList.add('active');
            const isTransfer = event.target.dataset.value === 'Transfer-Out';
            nonTransferFields.style.display = isTransfer ? 'none' : 'block';
            transferFields.style.display = isTransfer ? 'block' : 'none';
            if (isTransfer) {
                fromAccountBtn.textContent = accountBtn.textContent;
                toAccountBtn.textContent = '';
                toggleGrid(fromAccountGrid);
            } else {
                categoryBtn.textContent = '';
                subcategoryBtn.textContent = '';
                document.getElementById('subcategory-row').style.display = 'none';
                toggleGrid(accountGrid);
                populateDropdowns();
            }
            fetchDropdowns(); // update account, category dropdown values on change of type
        }
    });

    dateField.addEventListener('change', () => {
        accountBtn.focus();
        toggleGrid(accountGrid);
    });

    const gridButtons = [
        { button: accountBtn, grid: accountGrid, nextFocus: categoryBtn, nextGrid: categoryGrid },
        { button: categoryBtn, grid: categoryGrid, nextFocus: subcategoryBtn, nextGrid: subcategoryGrid },
        { button: subcategoryBtn, grid: subcategoryGrid, nextFocus: document.getElementById('amount') },
        { button: fromAccountBtn, grid: fromAccountGrid, nextFocus: toAccountBtn, nextGrid: toAccountGrid },
        { button: toAccountBtn, grid: toAccountGrid, nextFocus: document.getElementById('amount') }
    ];

    gridButtons.forEach(({ button, grid, nextFocus, nextGrid }) => {
        button.addEventListener('click', () => toggleGrid(grid));
        grid.addEventListener('click', event => {
            if (event.target.tagName === 'SPAN') {
                button.textContent = event.target.textContent;
                grid.classList.remove('active');
                if (nextFocus) {
                    nextFocus.focus();
                    if (nextGrid && button !== subcategoryBtn) {
                        toggleGrid(nextGrid);
                    } else if (button === subcategoryBtn && document.getElementById('subcategory-row').style.display === 'none') {
                        document.getElementById('amount').focus();
                    }
                }
                if (button === categoryBtn) {
                    populateSubcategories();
                    // Clear subcategory if no subcategories are found
                    if (document.getElementById('subcategory-row').style.display === 'none') {
                        subcategoryBtn.textContent = '';
                    }
                }
            }
        });
    });

    ['amount', 'note', 'description'].forEach(id => document.getElementById(id).addEventListener('focus', hideAllGrids));

    noteElement.addEventListener('input', showSuggestions);

    // hide suggestions list when focus out
    document.addEventListener('click', function (event) {
        if (!noteElement.contains(event.target) && !suggestionsDiv.contains(event.target)) {
            suggestionsDiv.innerHTML = '';
        }
    });

    window.editTransaction = function (id) {
        document.getElementById('transaction-modal').style.display = 'none';

        if (localStorage.getItem('masterExpenses') === null) return;
        const transaction = JSON.parse(localStorage.getItem('masterExpenses')).find(expense => expense.ID == id);
        if (transaction) {
            document.getElementById('transaction-id').value = transaction.ID;
            document.querySelector('.type-option.active').classList.remove('active');
            document.querySelector(`.type-option[data-value="${transaction['Income/Expense']}"]`).classList.add('active');
            document.getElementById('date').value = formatDateField(convertDateFormat(transaction.Date), 'show-date');
            document.getElementById(transaction['Income/Expense'] === 'Transfer-Out' ? 'from-account-btn' : 'account-btn').textContent = transaction.Account;
            if (transaction['Income/Expense'] !== 'Transfer-Out') {
                categoryBtn.textContent = transaction.Category;
                subcategoryBtn.textContent = transaction.Subcategory;
                populateSubcategories();
            } else {
                document.getElementById('to-account-btn').textContent = transaction.Category;
            }
            document.getElementById('note').value = transaction.Note;
            document.getElementById('amount').value = transaction.INR;
            document.getElementById('description').value = transaction.Description.replaceAll('|new-line|', '\n').replaceAll('|comma|', ',');

            document.querySelector('.submit-btn').style.display = 'none';
            document.querySelector('.delete-button').style.display = 'block';
            document.querySelector('.delete-button').setAttribute('onclick', 'deleteTransaction(' + id + ')');

            nonTransferFields.style.display = transaction['Income/Expense'] === 'Transfer-Out' ? 'none' : 'block';
            transferFields.style.display = transaction['Income/Expense'] === 'Transfer-Out' ? 'block' : 'none';

            transactionModal.style.display = 'block';
            transactionModal.querySelectorAll('form .field').forEach(field => {
                field.addEventListener('click', () => {
                    document.querySelector('.submit-btn').style.display = 'block';
                    document.querySelector('.delete-button').style.display = 'none';
                });
            });
            accountGrid.classList.remove('active');
        }
    }

    transactionForm.addEventListener('submit', event => {
        event.preventDefault();

        const id = document.getElementById('transaction-id').value;
        const type = document.querySelector('.type-option.active').dataset.value;
        const date = dateField.value;
        const account = document.getElementById(type === 'Transfer-Out' ? 'from-account-btn' : 'account-btn').textContent;
        const category = type === 'Transfer-Out' ? document.getElementById('to-account-btn').textContent : categoryBtn.textContent;
        const subcategory = type === 'Transfer-Out' ? '' : subcategoryBtn.textContent;
        const note = noteElement.value;
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value;

        if (!date || !account || (type !== 'Transfer-Out' && !category) || (type === 'Transfer-Out' && !category) || isNaN(amount)) {
            alert('Please fill all mandatory fields.');
            return;
        }

        const transaction = {
            Date: formatDateField(date, 'add-date'),
            Account: account,
            Category: category,
            Subcategory: subcategory,
            Note: note,
            INR: amount,
            'Income/Expense': type,
            Description: description,
            Amount: amount,
            Currency: 'INR',
            ID: id || Date.now()
        };

        transactionModal.style.display = 'none';

        // Add the transaction and update the UI
        if (window.addTransaction) {
            window.addTransaction(transaction);
        }
    });

    function fetchTransactionsFromLocalStorage() {
        const storedData = JSON.parse(localStorage.getItem('masterExpenses')) || [];
        masterExpenses.length = 0; // Clear the array
        masterExpenses.push(...storedData);
    }

    function fetchDropdowns() {
        accounts = getStoredAccounts();
        categories = getStoredCategories();

        populateDropdowns();
    }

    function getStoredAccounts() {
        const storedAccounts = JSON.parse(localStorage.getItem('accounts'));
        if (storedAccounts && storedAccounts.length > 0) {
            return storedAccounts;
        } else {
            if (masterExpenses.length === 0) {
                // Defining default acccounts initially
                const defaultAccounts = ["Cash", "Bank Accounts", "Credit Cards"];
                localStorage.setItem('accounts', JSON.stringify(defaultAccounts));
                return defaultAccounts;
            } else {
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
        }
    }

    fetchTransactionsFromLocalStorage();
    fetchDropdowns();

    function showSuggestions() {
        const noteInput = noteElement.value.toLowerCase();
        suggestionsDiv.innerHTML = '';

        if (noteInput.length === 0) {
            return;
        }

        const notesSet = new Set();
        const regex = /^[a-zA-Z\s]+$/; // Only letters and spaces

        masterExpenses.forEach(expense => {
            if (regex.test(expense.Note) && expense.Note.toLowerCase().includes(noteInput)) {
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
                noteElement.value = suggestion;
                suggestionsDiv.innerHTML = '';
            });
            suggestionsList.appendChild(listItem);
        });
        suggestionsDiv.appendChild(suggestionsList);
    }

    function formatDateField(dateString, datePurpose) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        if (datePurpose === 'add-date') {
            return `${day}/${month}/${year}`;
        } else if (datePurpose === 'show-date') {
            return `${year}-${month}-${day}`;
        }
    }

    function toISODateString(dateString) {
        const dateObj = new Date(dateString);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
});

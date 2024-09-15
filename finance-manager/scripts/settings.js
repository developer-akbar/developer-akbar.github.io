document.addEventListener('DOMContentLoaded', async () => {
    const masterExpenses = JSON.parse(localStorage.getItem('masterExpenses')) || [];

    const addAccountGroupBtn = document.getElementById('add-account-group-btn');
    const addAccountBtn = document.getElementById('add-account-btn');
    const accountGroupsList = document.getElementById('account-groups-list');
    const accountsList = document.getElementById('accounts-list');
    const groupModal = document.getElementById('group-modal');
    const modalTitle = document.getElementById('modal-title');
    const groupForm = document.getElementById('group-form');
    const groupNameInput = document.getElementById('group-name');
    const groupIdInput = document.getElementById('group-id');
    const closeGroupBtn = groupModal.querySelector('.close-group-btn');
    const cancelGroupBtn = groupForm.querySelector('.cancel-group-btn');
    const deleteGroupBtn = groupForm.querySelector('.delete-group-btn');
    const unmappedHeading = document.getElementById('unmapped-accounts-heading');

    const accountModal = document.getElementById('account-modal');
    const accountModalTitle = document.getElementById('account-modal-title');
    const accountForm = document.getElementById('account-form');
    const accountIdInput = document.getElementById('account-id');
    const accountNameInput = document.getElementById('account-name');
    const accountGroupSelect = document.getElementById('account-group-select');
    const closeAccountBtn = accountModal.querySelector('.close-account-btn');
    const cancelAccountBtn = accountForm.querySelector('.cancel-account-btn');
    const deleteAccountBtn = accountForm.querySelector('.delete-account-btn');

    const categoriesList = document.getElementById('categories-list');
    const categoryModal = document.getElementById('category-modal');
    const categoryForm = document.getElementById('category-form');
    const categoryNameInput = document.getElementById('category-name');
    const categoryType = document.getElementById('category-type');
    const subcategoryModal = document.getElementById('subcategory-modal');
    const subcategoryForm = document.getElementById('subcategory-form');
    const subcategoryNameInput = document.getElementById('subcategory-name');
    const closeCategoryBtn = categoryModal.querySelector('.close-category-btn');
    const closeSubcategoryBtn = subcategoryModal.querySelector('.close-subcategory-btn');
    const cancelCategoryBtn = categoryForm.querySelector('.cancel-category-btn');
    const cancelSubcategoryBtn = subcategoryForm.querySelector('.cancel-subcategory-btn');
    const deleteCategoryBtn = categoryModal.querySelector('.delete-category-btn');
    const deleteSubcategoryBtn = subcategoryModal.querySelector('.delete-subcategory-btn');
    const parentCategorySelect = document.getElementById('parent-category-select');
    const unmappedSubcategoriesHeading = document.getElementById('unmapped-subcategories-heading');
    const subcategoriesList = document.getElementById('subcategories-list');

    const unmappedSubcategorySelectModal = document.getElementById('unmapped-subcategory-select-modal');
    const closeUnmappedSubcategorySelectBtn = unmappedSubcategorySelectModal.querySelector('.close-unmapped-subcategory-select-btn');
    const unmappedSubcategoryTitle = document.getElementById('unmapped-subcategory-title');
    const deleteUnmappedSubcategoryBtn = document.getElementById('delete-unmapped-subcategory-btn');
    const unmappedSubcategoryNameSpan = document.getElementById('unmapped-subcategory-name');
    const unmappedSubcategorySelectList = document.getElementById('unmapped-subcategory-select-list');

    const unmappedAccountSelectModal = document.getElementById('unmapped-account-select-modal');
    const closeUnmappedAccountSelectBtn = unmappedAccountSelectModal.querySelector('.close-unmapped-account-select-btn');
    const unmappedAccountTitle = document.getElementById('unmapped-account-title');
    const deleteUnmappedAccountBtn = document.getElementById('delete-unmapped-account-btn');
    const unmappedAccountNameSpan = document.getElementById('unmapped-account-name');
    const unmappedAccountSelectList = document.getElementById('unmapped-account-select-list');

    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelector('.setting-items-content').style.display = 'block';
            document.querySelector('.setting-items').style.display = 'none';
            document.querySelector('#selected-setting-item').textContent = tab.textContent;

            tabs.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Back button event listener
    document.querySelector('#back-button').addEventListener('click', () => {
        document.querySelector('.setting-items-content').style.display = 'none';
        document.querySelector('.setting-items').style.display = 'block';
    });

    let selectedAccount = null;
    let selectedSubcategory = null;

    let accountGroups = JSON.parse(localStorage.getItem('accountGroups')) || [{ "id": 1, "name": "Cash" }, { "id": 2, "name": "Bank Accounts" }, { "id": 3, "name": "Credit Cards" }];
    let accountMappings = JSON.parse(localStorage.getItem('accountMappings')) || { "Cash": ["Cash"], "Bank Accounts": ["Bank Accounts"], "Credit Cards": ["Credit Cards"] };
    let accounts = getStoredAccounts();
    let categories = getStoredCategories();

    localStorage.setItem('accounts', JSON.stringify(accounts));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('accountGroups', JSON.stringify(accountGroups));
    localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

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
                const accounts = JSON.parse(localStorage.getItem('masterExpenses')).reduce((acc, expense) => {
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

                return accounts;
            }
        }
    }

    function getStoredCategories() {
        const storedCategories = JSON.parse(localStorage.getItem('categories'));
        if (storedCategories && Object.entries(storedCategories).length > 0) {
            return storedCategories;
        } else {
            const categories = {};

            if (masterExpenses.length === 0) {
                // Defining default categories initially
                const defaultCategories = '{"Housing":{"type":"Expense","subcategories":["Rent","Groceries","Electricity","Gas"]},"Travel":{"type":"Expense","subcategories":[]},"Utilities":{"type":"Expense","subcategories":["Recharge","DTH","Water"]},"Shopping":{"type":"Expense","subcategories":[]},"Health":{"type":"Expense","subcategories":["Medicines","Hospital"]},"Subscriptions":{"type":"Expense","subcategories":["Netflix","Prime"]},"Entertainment":{"type":"Expense","subcategories":["Cinema","Outing"]},"Groceries":{"type":"Expense","subcategories":[]},"Dining":{"type":"Expense","subcategories":[]},"Salary":{"type":"Income","subcategories":[]},"Bonus":{"type":"Income","subcategories":[]},"Petty Cash":{"type":"Income","subcategories":[]}}';
                localStorage.setItem('categories', JSON.stringify(JSON.parse(defaultCategories)));
                return JSON.parse(defaultCategories);
            } else {
                masterExpenses.forEach(expense => {
                    if (expense["Income/Expense"] !== 'Transfer-Out') {
                        if (!categories[expense.Category]) {
                            categories[expense.Category] = { type: expense["Income/Expense"], subcategories: [] };
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

    function renderGroups() {
        accountGroupsList.innerHTML = '';
        accountGroups.forEach(group => {
            if (group.id == undefined && group.name == undefined) return;

            const groupBox = document.createElement('div');
            groupBox.classList.add('group-box');
            groupBox.dataset.id = group.id;
            groupBox.innerHTML = `<h3>${group.name}<span class="edit-group"> &#9997;</span></h3><ul class="mapped-accounts" id="account-${group.name.replace(' ', '-').toLowerCase()}"></ul>`;

            const spanElem = document.createElement('span');
            spanElem.classList.add('add-account-btn');
            spanElem.setAttribute('title', 'Click to add new account');
            groupBox.appendChild(spanElem);

            // Add account directly in the specific account group
            groupBox.querySelector('.add-account-btn').addEventListener('click', () => {
                const groupName = groupBox.querySelector('.add-account-btn').parentElement.querySelector('h3').textContent.split(' ');
                groupName.pop();
                openAccountModal('add', groupName.join(' '));
            });

            accountGroupsList.appendChild(groupBox);

            if (accountMappings[group.name]) {
                accountMappings[group.name].forEach(account => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="account-name">${account}</span>`;
                    li.dataset.account = account;

                    li.addEventListener('click', () => openAccountModal('edit', group.name, account));
                    groupBox.querySelector('.mapped-accounts').appendChild(li);
                });
            }

            const sortableElement = groupBox.querySelector('.mapped-accounts');
            new Sortable(sortableElement, {
                group: {
                    name: 'mapped-accounts',
                    pull: false,
                },
                onEnd: function (evt) {
                    const groupName = accountGroups.find(group => group.id == groupBox.dataset.id).name;
                    const targetElement = evt.to;

                    if (targetElement && targetElement.children) {
                        const items = Array.from(targetElement.children);
                        accountMappings[groupName] = items.map(item => item.dataset.account);
                        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

                        const uniqueAccounts = [...new Set(accountMappings[groupName])];
                        accountMappings[groupName] = uniqueAccounts;
                        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));
                        renderGroups();
                    } else {
                        console.warn('Sortable event target is null or has no children');
                    }
                },
                delay: 300,
                delayOnTouchOnly: true,
                touchStartThreshold: 3
            });

            groupBox.addEventListener('dragover', handleDragOver);
            groupBox.addEventListener('drop', handleDrop);
        });

        renderUnmappedAccounts();
    }

    function renderUnmappedAccounts() {
        accountsList.innerHTML = '';

        const mappedAccounts = Object.values(accountMappings).flat();
        const unmappedAccounts = accounts.filter(account => !mappedAccounts.includes(account));

        const combinedUnmappedAccounts = unmappedAccounts.concat(accountMappings['Unmapped Accounts'] || []);

        combinedUnmappedAccounts.forEach(account => {
            const div = document.createElement('div');
            div.textContent = account;
            div.classList.add('account-item');
            div.dataset.account = account;
            div.setAttribute('draggable', true);
            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('click', handleAccountClick);
            accountsList.appendChild(div);
        });

        unmappedHeading.style.display = combinedUnmappedAccounts.length ? 'block' : 'none';

        new Sortable(accountsList, {
            group: {
                name: 'unmapped-accounts',
                pull: 'clone',
                put: false,
            },
            sort: false
        });
    }

    function openModal(group = {}) {
        groupModal.style.display = 'flex';
        modalTitle.textContent = group.id ? 'Edit Group' : 'Add Group';
        groupNameInput.value = group.name || '';

        if (modalTitle.textContent === 'Edit Group') {
            deleteGroupBtn.style.display = 'inline';
            document.querySelector('.save-group-btn').style.display = 'none';
        } else {
            deleteGroupBtn.style.display = 'none';
            document.querySelector('.save-group-btn').style.display = 'inline';
        }

        groupForm.querySelectorAll('.field').forEach(field => {
            field.addEventListener('input', () => {
                deleteGroupBtn.style.display = 'none';
                document.querySelector('.save-group-btn').style.display = 'inline';
            });
        });

        groupIdInput.value = group.id || '';
    }

    function closeModal(modal, form) {
        modal.style.display = 'none';
        form.reset();
    }

    function saveGroup(event) {
        event.preventDefault();

        const id = groupIdInput.value ? parseInt(groupIdInput.value, 10) : Date.now();
        const name = groupNameInput.value.trim();

        const groupIndex = accountGroups.findIndex(group => group.id === id);
        if (groupIndex > -1) {
            const oldName = accountGroups[groupIndex].name;
            accountGroups[groupIndex].name = name;
            accountMappings[name] = accountMappings[oldName];
            delete accountMappings[oldName];
        } else {
            accountGroups.push({ id, name });
        }

        localStorage.setItem('accountGroups', JSON.stringify(accountGroups));
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

        renderGroups();
        closeModal(groupModal, groupForm);
    }

    function handleGroupClick(event) {
        if (event.target.classList.contains('edit-group')) {
            const groupId = parseInt(event.target.closest('.group-box').dataset.id, 10);
            const group = accountGroups.find(group => group.id === groupId);
            openModal(group);
        }
    }

    function handleDragStart(event) {
        if (event.target.closest('#accounts-list')) {
            event.dataTransfer.setData('text/plain', event.target.dataset.account);
        } else {
            event.preventDefault();
        }
    }

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleDrop(event) {
        const account = event.dataTransfer.getData('text/plain');
        const groupId = event.target.closest('.group-box').dataset.id;
        const groupName = accountGroups.find(group => group.id == groupId).name;

        if (accountMappings['Unmapped Accounts']) {
            const index = accountMappings['Unmapped Accounts'].indexOf(account);
            if (index > -1) {
                accountMappings['Unmapped Accounts'].splice(index, 1);
                if (accountMappings['Unmapped Accounts'].length === 0) {
                    delete accountMappings['Unmapped Accounts'];
                }
            }
        }

        if (!accountMappings[groupName]) {
            accountMappings[groupName] = [];
        }

        if (!accounts.includes(account)) accounts.push(account);
        localStorage.setItem('accounts', JSON.stringify(accounts));

        accountMappings[groupName].push(account);
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

        renderGroups();
    }

    function handleAccountClick(event) {
        selectedAccount = event.target.dataset.account;
        openUnmappedAccountSelectModal();
    }

    function openUnmappedAccountSelectModal() {
        unmappedAccountSelectList.innerHTML = '';
        unmappedAccountTitle.textContent = 'Move or Delete Account';
        unmappedAccountNameSpan.textContent = selectedAccount;
        deleteUnmappedAccountBtn.innerHTML = `Delete <i>${selectedAccount}</i>`;

        accountGroups.forEach(group => {
            const li = document.createElement('li');
            li.textContent = group.name;
            li.addEventListener('click', () => selectGroupForAccount(group.name));
            unmappedAccountSelectList.appendChild(li);
        });
        unmappedAccountSelectModal.style.display = 'flex';
    }

    function selectGroupForAccount(groupName) {
        if (accountMappings['Unmapped Accounts']) {
            const index = accountMappings['Unmapped Accounts'].indexOf(selectedAccount);
            if (index > -1) {
                accountMappings['Unmapped Accounts'].splice(index, 1);
                if (accountMappings['Unmapped Accounts'].length === 0) {
                    delete accountMappings['Unmapped Accounts'];
                }
            }
        }

        if (!accountMappings[groupName]) {
            accountMappings[groupName] = [];
        }

        if (!accounts.includes(selectedAccount)) accounts.push(selectedAccount);
        localStorage.setItem('accounts', JSON.stringify(accounts));

        accountMappings[groupName].push(selectedAccount);
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));
        selectedAccount = null;
        closeUnmappedAccountSelectModal();
        renderGroups();
    }

    addAccountBtn.addEventListener('click', () => {
        openAccountModal();
    });

    // Open modal to create or edit an account
    function openAccountModal(mode, groupName = '', account = '') {
        accountModal.style.display = 'flex';

        if (mode === 'edit') {
            accountModalTitle.textContent = 'Edit Account';
            accountNameInput.value = account;
            accountIdInput.value = account;
            // accountGroupSelect.disabled = true;
            deleteAccountBtn.style.display = 'inline';
            document.querySelector('.save-account-btn').style.display = 'none';

            accountForm.querySelectorAll('.field').forEach(field => {
                field.addEventListener('input', () => {
                    deleteAccountBtn.style.display = 'none';
                    document.querySelector('.save-account-btn').style.display = 'inline';
                });
            });
        } else {
            accountModalTitle.textContent = 'Add New Account';
            accountNameInput.value = '';
            accountIdInput.value = '';
            // accountGroupSelect.disabled = false;
            deleteAccountBtn.style.display = 'none';
            document.querySelector('.save-account-btn').style.display = 'inline';
        }

        accountGroupSelect.innerHTML = '<option value="" disabled selected>Select Group</option>';
        accountGroups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.name;
            option.textContent = group.name;
            if (group.name === groupName) {
                option.selected = true;
            }
            accountGroupSelect.appendChild(option);
        });
    }

    // Close the account modal
    closeAccountBtn.addEventListener('click', () => closeModal(accountModal, accountForm));

    cancelAccountBtn.addEventListener('click', () => closeModal(accountModal, accountForm));

    // Handle account creation and editing
    accountForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const accountId = accountIdInput.value.trim();
        const accountName = accountNameInput.value.trim();
        const selectedGroup = accountGroupSelect.value;

        // Update masterExpenses if the account name is being edited
        if (accountId) {
            updateMasterExpensesAccountName(accountId, accountName);
        }

        // Remove account from old group if editing
        if (accountId) {
            for (const group in accountMappings) {
                const index = accountMappings[group].indexOf(accountId);
                if (index > -1) {
                    accountMappings[group].splice(index, 1);
                    if (accountMappings[group].length === 0) {
                        delete accountMappings[group];
                    }
                    break;
                }
            }
        }

        if (!accountMappings[selectedGroup]) {
            accountMappings[selectedGroup] = [];
        }

        accountMappings[selectedGroup].push(accountName);

        if (!accountId) {
            accounts.push(accountName);
        } else {
            accounts = accounts.map(acc => acc === accountId ? accountName : acc);
        }

        localStorage.setItem('accounts', JSON.stringify(accounts));
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

        closeModal(accountModal, accountForm);
        renderGroups();
    });

    // Function to update account name in masterExpenses
    function updateMasterExpensesAccountName(oldName, newName) {
        const masterExpenses = JSON.parse(localStorage.getItem('masterExpenses')) || [];

        // Update the account and category fields
        masterExpenses.forEach(transaction => {
            if (transaction.Account === oldName) {
                transaction.Account = newName;
            }
            if (transaction.Category === oldName) {
                transaction.Category = newName;
            }
        });

        // Save the updated masterExpenses back to localStorage
        localStorage.setItem('masterExpenses', JSON.stringify(masterExpenses));
    }

    // Delete group and move accounts to unmapped
    function deleteGroup() {
        const groupId = parseInt(groupIdInput.value, 10);
        const groupName = groupNameInput.value.trim();

        // Check if the group has any mappings
        if (accountMappings[groupName]) {
            accountMappings['Unmapped Accounts'] = accountMappings['Unmapped Accounts'] || [];
            accountMappings['Unmapped Accounts'].push(...accountMappings[groupName]);
            delete accountMappings[groupName];
        }

        // Delete the group from the accountGroups array
        accountGroups = accountGroups.filter(group => group.id !== groupId);

        // Update localStorage
        localStorage.setItem('accountGroups', JSON.stringify(accountGroups));
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

        renderGroups();
        closeModal(groupModal, groupForm);
    }

    deleteGroupBtn.addEventListener('click', deleteGroup);

    // Function to remove account
    function removeAccount() {
        const accountName = accountIdInput.value.trim();

        accounts = accounts.filter(acc => acc !== accountName);
        for (const group in accountMappings) {
            accountMappings[group] = accountMappings[group].filter(acc => acc !== accountName);
        }
        accountMappings['Unmapped Accounts'] = accountMappings['Unmapped Accounts'] || [];
        accountMappings['Unmapped Accounts'].push(accountName);

        localStorage.setItem('accounts', JSON.stringify(accounts));
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

        renderGroups();
        closeModal(accountModal, accountForm);
    }

    deleteAccountBtn.addEventListener('click', removeAccount);

    addAccountGroupBtn.addEventListener('click', () => openModal());
    groupForm.addEventListener('submit', saveGroup);
    closeGroupBtn.addEventListener('click', () => closeModal(groupModal, groupForm));
    cancelGroupBtn.addEventListener('click', () => closeModal(groupModal, groupForm));
    accountGroupsList.addEventListener('click', handleGroupClick);

    renderGroups();

    function renderCategories() {
        categoriesList.innerHTML = '';
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};

        Object.keys(storedCategories).forEach(category => {
            if (category === 'Unmapped Subcategories') return; // Skip Unmapped Subcategories as a group-box

            const categoryBox = document.createElement('div');
            categoryBox.classList.add('group-box', `${storedCategories[category].type.toLowerCase()}-box`);
            categoryBox.dataset.id = category.replace(' ', '-').toLowerCase();
            categoryBox.innerHTML = `<h3 class="${storedCategories[category].type.toLowerCase()}">${category}<span class="edit-group edit-category"> &#9997;</span></h3><ul class="mapped-subcategories" id="category-${category.replace(' ', '-').toLowerCase()}"></ul>`;
            // categoriesList.appendChild(categoryBox);

            const subcategoryBox = categoryBox.querySelector('.mapped-subcategories');

            storedCategories[category].subcategories && storedCategories[category].subcategories.forEach(subcategory => {
                const li = document.createElement('li');
                li.classList.add('subcategory-item');
                li.innerHTML = `<span class="subcategory-name">${subcategory}</span>`;
                li.dataset.subcategory = subcategory;

                li.addEventListener('click', () => openSubcategoryModal('edit', category, subcategory));
                categoryBox.querySelector('.mapped-subcategories').appendChild(li);
            });

            const spanElem = document.createElement('span');
            spanElem.classList.add('add-subcategory-btn');
            spanElem.setAttribute('title', 'Click to add new subcategory');
            categoryBox.appendChild(spanElem);

            // Add subcategory directly in the specific category
            categoryBox.querySelector('.add-subcategory-btn').addEventListener('click', () => {
                const categoryName = categoryBox.querySelector('.add-subcategory-btn').parentElement.querySelector('h3').textContent.split(' ');
                categoryName.pop();
                openSubcategoryModal('add', categoryName.join(' '));
            });

            categoriesList.appendChild(categoryBox);

            new Sortable(subcategoryBox, {
                group: {
                    name: 'mapped-subcategories',
                    pull: false,
                },
                onEnd: function (evt) {
                    const targetElement = evt.to;
                    const items = Array.from(targetElement.children);
                    storedCategories[category].subcategories = items.map(item => item.dataset.subcategory);
                    localStorage.setItem('categories', JSON.stringify(storedCategories));
                    renderCategories();
                },
                delay: 300,
                delayOnTouchOnly: true,
                touchStartThreshold: 3
            });

            categoryBox.querySelector('.edit-category').addEventListener('click', () => {
                openCategoryModal('edit', category, storedCategories[category].type);
            });
        });

        renderUnmappedSubcategories();
    }

    function renderUnmappedSubcategories() {

        subcategoriesList.innerHTML = '';

        const mappedSubcategories = Object.values(JSON.parse(localStorage.getItem('categories'))).flatMap(cat => cat.subcategories);
        const unmappedSubcategories = JSON.parse(localStorage.getItem('categories'))['Unmapped Subcategories'] || [];

        if (document.getElementById('unmapped-subcategories-heading')) {
            if (unmappedSubcategories.length === 0) {
                document.getElementById('unmapped-subcategories-heading').style.display = 'none';
                return;
            }
            document.getElementById('unmapped-subcategories-heading').style.display = 'block';
        }

        unmappedSubcategories.forEach(subcategory => {
            const div = document.createElement('div');
            div.textContent = subcategory;
            div.classList.add('subcategory-item');
            div.dataset.subcategory = subcategory;
            div.setAttribute('draggable', true);
            div.addEventListener('dragstart', handleDragStartSubcategory);
            div.addEventListener('click', handleSubcategoryClick);
            subcategoriesList.appendChild(div);
        });

        unmappedSubcategoriesHeading.style.display = unmappedSubcategories.length ? 'block' : 'none';

        new Sortable(subcategoriesList, {
            group: {
                name: 'unmapped-subcategories',
                pull: 'clone',
                put: false,
            },
            sort: false
        });
    }

    function openCategoryModal(mode, categoryName = '', type = '') {
        if (mode === 'edit') {
            categoryModal.querySelector('h2').textContent = 'Edit Category';
            categoryModal.dataset.category = categoryName;
            categoryModal.dataset.categoryType = type;
            categoryNameInput.value = categoryName;
            categoryType.value = type;
            categoryType.disabled = true;
            deleteCategoryBtn.style.display = 'inline';
            document.querySelector('.save-category-btn').style.display = 'none';
            categoryForm.querySelectorAll('.field').forEach(field => {
                field.addEventListener('input', () => {
                    deleteCategoryBtn.style.display = 'none';
                    document.querySelector('.save-category-btn').style.display = 'inline';
                });
            });
        } else {
            categoryModal.querySelector('h2').textContent = 'Add Category';
            categoryNameInput.value = '';
            categoryType.disabled = false;
            deleteCategoryBtn.style.display = 'none';
        }
        categoryModal.style.display = 'flex';
    }

    function openSubcategoryModal(mode, categoryName = '', subcategoryName = '') {
        if (mode === 'edit') {
            subcategoryModal.querySelector('h2').textContent = 'Edit Subcategory';
            subcategoryNameInput.value = subcategoryName;
            deleteSubcategoryBtn.style.display = 'inline';
            parentCategorySelect.disabled = true;
            document.querySelector('.save-subcategory-btn').style.display = 'none';
            subcategoryForm.querySelectorAll('.field').forEach(field => {
                field.addEventListener('input', () => {
                    deleteSubcategoryBtn.style.display = 'none';
                    document.querySelector('.save-subcategory-btn').style.display = 'inline';
                });
            });
        } else {
            subcategoryModal.querySelector('h2').textContent = 'Add Subcategory';
            subcategoryNameInput.value = '';
            parentCategorySelect.disabled = false;
            deleteSubcategoryBtn.style.display = 'none';
        }
        subcategoryModal.dataset.category = categoryName;
        subcategoryModal.dataset.subcategory = subcategoryName;
        subcategoryModal.style.display = 'flex';
        parentCategorySelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
        Object.keys(JSON.parse(localStorage.getItem('categories'))).forEach(category => {
            const option = document.createElement('option');
            if (category === 'Unmapped Subcategories') return;
            option.value = category;
            option.textContent = category;
            if (category === categoryName) {
                option.selected = true;
            }
            parentCategorySelect.appendChild(option);
        });
    }

    function handleDragStartSubcategory(event) {
        if (event.target.closest('#subcategories-list')) {
            event.dataTransfer.setData('text/plain', event.target.dataset.subcategory);
        } else {
            event.preventDefault();
        }
    }

    function handleSubcategoryClick(event) {
        selectedSubcategory = event.target.dataset.subcategory;
        openUnmappedSubcategorySelectModal();
    }

    function openUnmappedSubcategorySelectModal() {

        unmappedSubcategorySelectList.innerHTML = '';
        unmappedSubcategoryTitle.textContent = 'Move or Delete Subcategory';
        unmappedSubcategoryNameSpan.textContent = selectedSubcategory;

        Object.keys(JSON.parse(localStorage.getItem('categories'))).forEach(category => {
            const li = document.createElement('li');
            li.textContent = category;
            li.addEventListener('click', () => selectCategoryForSubcategory(category));
            unmappedSubcategorySelectList.appendChild(li);
        });

        deleteUnmappedSubcategoryBtn.innerHTML = `Delete <i>${selectedSubcategory}</i>`;
        deleteUnmappedSubcategoryBtn.addEventListener('click', () => deleteUnmappedSubcategory());
        unmappedSubcategorySelectModal.style.display = 'flex';
    }

    function deleteUnmappedAccount() {
        const storedAccounts = JSON.parse(localStorage.getItem('accounts')) || [];
        const unmappedAccounts = accountMappings['Unmapped Accounts'] || [];
        const accountIndex = unmappedAccounts.indexOf(selectedAccount);
        if (accountIndex > -1) {
            unmappedAccounts.splice(accountIndex, 1);
        }

        const accountIndexInAccounts = storedAccounts.indexOf(selectedAccount);
        if (accountIndexInAccounts > -1) {
            storedAccounts.splice(accountIndexInAccounts, 1);
        }

        localStorage.setItem('accounts', JSON.stringify(storedAccounts));
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));
        renderGroups();
        closeUnmappedAccountSelectModal();
    }

    function deleteUnmappedSubcategory() {
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};
        const index = storedCategories['Unmapped Subcategories'].indexOf(selectedSubcategory);
        if (index > -1) {
            storedCategories['Unmapped Subcategories'].splice(index, 1);
            localStorage.setItem('categories', JSON.stringify(storedCategories));
            renderCategories();
            closeUnmappedSubcategorySelectModal();
        }
    }

    function selectCategoryForSubcategory(categoryName) {
        const subcategoryName = selectedSubcategory;

        let unmappedSubcategories = JSON.parse(localStorage.getItem('unmappedSubcategories')) || [];
        let categories = JSON.parse(localStorage.getItem('categories')) || {};

        // Add subcategory to the selected category
        if (!categories[categoryName]) {
            categories[categoryName] = [];
        }
        categories[categoryName].subcategories.push(subcategoryName);
        localStorage.setItem('categories', JSON.stringify(categories));

        // Remove from unmapped subcategories
        deleteUnmappedSubcategory();

        selectedSubcategory = null;
        closeUnmappedSubcategorySelectModal();
        renderUnmappedSubcategories();
        renderCategories();
    }

    function closeUnmappedSubcategorySelectModal() {
        unmappedSubcategorySelectModal.style.display = 'none';
    }

    function closeUnmappedAccountSelectModal() {
        unmappedAccountSelectModal.style.display = 'none';
    }

    function saveCategory(event) {
        event.preventDefault();
        const categoryName = categoryNameInput.value.trim();
        const type = categoryType.value;
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};

        const oldCategoryName = categoryModal.dataset.category;

        if (categoryModal.querySelector('h2').textContent === 'Add Category') {
            storedCategories[categoryName] = { type: type, subcategories: [] };
        } else {
            const oldType = categoryModal.dataset.categoryType;
            const oldSubcategories = storedCategories[oldCategoryName].subcategories;
            if (oldCategoryName !== categoryName || oldType !== type) {
                delete storedCategories[oldCategoryName];
                storedCategories[categoryName] = { type: type, subcategories: oldSubcategories };

                // Update masterExpenses if the category name has changed
                updateMasterExpensesCategory(oldCategoryName, categoryName);
            }
        }

        localStorage.setItem('categories', JSON.stringify(storedCategories));
        renderCategories();
        closeModal(categoryModal, categoryForm);
    }

    function saveSubcategory(event) {
        event.preventDefault();
        const categoryName = parentCategorySelect.value;
        const subcategoryName = subcategoryNameInput.value.trim();
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};

        const oldCategoryName = subcategoryModal.dataset.category;
        const oldSubcategoryName = subcategoryModal.dataset.subcategory;

        if (subcategoryModal.querySelector('h2').textContent === 'Add Subcategory') {
            if (!storedCategories[categoryName].subcategories.includes(subcategoryName)) {
                storedCategories[categoryName].subcategories.push(subcategoryName);
            }
        } else {
            const subcategoryIndex = storedCategories[oldCategoryName].subcategories.indexOf(oldSubcategoryName);
            if (subcategoryIndex > -1) {
                storedCategories[oldCategoryName].subcategories.splice(subcategoryIndex, 1);
            }

            if (!storedCategories[categoryName].subcategories.includes(subcategoryName)) {
                storedCategories[categoryName].subcategories.push(subcategoryName);
            }

            // Update masterExpenses if the subcategory name has changed
            if (oldSubcategoryName !== subcategoryName) {
                updateMasterExpensesSubcategory(oldCategoryName, oldSubcategoryName, subcategoryName);
            }
        }

        localStorage.setItem('categories', JSON.stringify(storedCategories));
        renderCategories();
        closeModal(subcategoryModal, subcategoryForm);
    }

    // Function to update category name in masterExpenses
    function updateMasterExpensesCategory(oldCategory, newCategory) {
        const masterExpenses = JSON.parse(localStorage.getItem('masterExpenses')) || [];

        masterExpenses.forEach(transaction => {
            if (transaction.Category === oldCategory) {
                transaction.Category = newCategory;
            }
        });

        // Save the updated masterExpenses back to localStorage
        localStorage.setItem('masterExpenses', JSON.stringify(masterExpenses));
    }

    // Function to update subcategory name in masterExpenses
    function updateMasterExpensesSubcategory(category, oldSubcategory, newSubcategory) {
        const masterExpenses = JSON.parse(localStorage.getItem('masterExpenses')) || [];

        masterExpenses.forEach(transaction => {
            if (transaction.Category === category && transaction.Subcategory === oldSubcategory) {
                transaction.Subcategory = newSubcategory;
            }
        });

        // Save the updated masterExpenses back to localStorage
        localStorage.setItem('masterExpenses', JSON.stringify(masterExpenses));
    }

    function deleteCategory() {
        const categoryName = categoryNameInput.value.trim();
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};
        delete storedCategories[categoryName];
        localStorage.setItem('categories', JSON.stringify(storedCategories));
        renderCategories();
        closeModal(categoryModal, categoryForm);
    }

    function deleteSubcategory() {
        const categoryName = subcategoryModal.dataset.category;
        const subcategoryName = subcategoryNameInput.value.trim();
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};

        const subcategoryIndex = storedCategories[categoryName].subcategories.indexOf(subcategoryName);
        if (subcategoryIndex > -1) {
            storedCategories[categoryName].subcategories.splice(subcategoryIndex, 1);
        }

        if (!storedCategories['Unmapped Subcategories']) {
            storedCategories['Unmapped Subcategories'] = [];
        }
        storedCategories['Unmapped Subcategories'].push(subcategoryName);

        localStorage.setItem('categories', JSON.stringify(storedCategories));
        renderCategories();
        closeModal(subcategoryModal, subcategoryForm);
    }

    categoryForm.addEventListener('submit', saveCategory);
    subcategoryForm.addEventListener('submit', saveSubcategory);
    deleteCategoryBtn.addEventListener('click', deleteCategory);
    deleteSubcategoryBtn.addEventListener('click', deleteSubcategory);
    closeCategoryBtn.addEventListener('click', () => closeModal(categoryModal, categoryForm));
    closeSubcategoryBtn.addEventListener('click', () => closeModal(subcategoryModal, subcategoryForm));
    cancelCategoryBtn.addEventListener('click', () => closeModal(categoryModal, categoryForm));
    cancelSubcategoryBtn.addEventListener('click', () => closeModal(subcategoryModal, subcategoryForm));
    closeUnmappedSubcategorySelectBtn.addEventListener('click', closeUnmappedSubcategorySelectModal);
    closeUnmappedAccountSelectBtn.addEventListener('click', closeUnmappedAccountSelectModal);
    deleteUnmappedAccountBtn.addEventListener('click', deleteUnmappedAccount);

    document.getElementById('add-category-btn').addEventListener('click', () => openCategoryModal('add'));
    document.getElementById('add-subcategory-btn').addEventListener('click', () => openSubcategoryModal('add'));

    renderCategories();
});

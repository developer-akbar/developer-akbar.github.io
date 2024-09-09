document.addEventListener('DOMContentLoaded', function () {
    const csvConversionDetails = JSON.parse(localStorage.getItem('csvConversionDetails'));
    const updatedElement = document.querySelector('.csv-updated-at');
    if (csvConversionDetails) {
        updatedElement.parentElement.style.display = 'block';
        const updatedAt = csvConversionDetails.updated_at;
        const timeAgoText = timeAgo(updatedAt);
        updatedElement.textContent = timeAgoText;
        updatedElement.title = new Date(updatedAt).toLocaleString(); // Full date and time
    } else {
        updatedElement.parentElement.style.display = 'none';
    }

    document.getElementById('convertButton').addEventListener('click', async () => {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select an Excel file first.');
            return;
        }

        // Show loader
        document.getElementById('loader').style.display = 'block';

        // Load XLSX library dynamically
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js';
        script.onload = () => {
            checkForExistingData(file);
        };
        document.body.appendChild(script);
    });

    function checkForExistingData(file) {
        const existingData = localStorage.getItem('masterExpenses');
        if (existingData) {
            // Show modal if data already exists
            showConsentModal(file);
        } else {
            // No existing data, proceed to convert
            convertToCSV(file);
        }
    }

    function showConsentModal(file) {
        const modal = document.getElementById('consent-modal');
        const closeButton = modal.querySelector('.close-button');
        const mergeButton = document.getElementById('mergeButton');
        const overrideButton = document.getElementById('overrideButton');

        // Show the modal
        modal.style.display = 'flex';

        // Close the modal
        closeButton.onclick = () => {
            modal.style.display = 'none';
            // Hide loader if the modal is closed without action
            document.getElementById('loader').style.display = 'none';
        };

        // When user clicks merge
        mergeButton.onclick = () => {
            modal.style.display = 'none';
            convertToCSV(file, 'merge');
        };

        // When user clicks override
        overrideButton.onclick = () => {
            modal.style.display = 'none';
            convertToCSV(file, 'override');
        };
    }

    async function convertToCSV(file, mode = 'override') {
        const reader = new FileReader();
        reader.onload = async function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            try {
                // Fetch existing transactions from storage
                let existingTransactions = JSON.parse(localStorage.getItem('masterExpenses')) || [];

                // Convert worksheet to CSV data, replacing line breaks in cells
                let csvData = XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\n', strip: false });

                // Handle line breaks within cells
                csvData = csvData.replace(/"([^"]*)"/g, function (match, p1) {
                    return p1.replace(/\n/g, '|new-line|').replace(/,/g, '|comma|');
                });

                // Now split the CSV into rows
                csvData = csvData.split('\n').map((row, index) => {
                    index = index === 0 ? 0 : existingTransactions.length + index;
                    return row.length > 0
                        ? transformString(row, index).split(',').map(cell => `${cell.replace(/,/g, ';')}`).join(',')
                        : '';
                }).join('\n');

                let newTransactions = utility.parseCSV(csvData);

                // Find duplicates
                // const duplicates = findDuplicates(existingTransactions, newTransactions);

                if (mode === 'merge' && newTransactions.length > 0) {
                    const duplicates = [];
                    const nonDuplicates = [];

                    newTransactions.forEach(newTransaction => {
                        const isDuplicate = existingTransactions.some(existingTransaction =>
                            isDuplicateTransaction(existingTransaction, newTransaction)
                        );

                        if (isDuplicate) {
                            duplicates.push(newTransaction);
                        } else {
                            nonDuplicates.push(newTransaction);
                        }
                    });

                    if (duplicates.length > 0) {
                        // Show duplicate summary and get user's decision
                        const userDecision = await showDuplicateSummary(duplicates);

                        switch (userDecision) {
                            case 'skip':
                                // Keep non-duplicates only
                                existingTransactions = [...existingTransactions, ...nonDuplicates];
                                break;

                            case 'override':
                                // Remove duplicates from existing transactions and add all new transactions
                                existingTransactions = existingTransactions.filter(existingTxn =>
                                    !duplicates.some(dup => isDuplicateTransaction(dup, existingTxn))
                                );
                                existingTransactions = [...existingTransactions, ...duplicates, ...nonDuplicates];
                                break;

                            case 'manual':
                                // Handle manually based on user input
                                duplicates.forEach(expense => {
                                    const transactionRow = createTransactionRow(expense);
                                    document.getElementById('duplicate-table').querySelector('tbody').appendChild(transactionRow);
                                });
                                document.getElementById('duplicate-list').style.display = 'block';
                                break;
                        }
                    } else {
                        existingTransactions = [...existingTransactions, ...newTransactions];
                    }
                } else if (csvData) { // Only override if new csvData is provided
                    existingTransactions = newTransactions;
                }

                localStorage.setItem('masterExpenses', JSON.stringify(existingTransactions));

                updateAccountsAndCategories(newTransactions, mode);

                // Save CSV conversion status and update time in local storage
                const csvConversionDetails = {
                    updated_at: new Date().toLocaleString(),
                    isCSVProcessed: false
                };
                localStorage.setItem('csvConversionDetails', JSON.stringify(csvConversionDetails));

                alert('Data processed successfully.');
                location.reload();
            } catch (err) {
                alert('Error processing data:', err.message);
                console.error('Error processing data:', err);
            } finally {
                // Hide loader after processing is done
                document.getElementById('loader').style.display = 'none';
            }
        };
        reader.readAsArrayBuffer(file);
    }


    // This function helps to replace commas(,) which are delimiter in csv conversion.
    // Not to break the excel file structure when converting to csv
    // Replace line breaks inside the quoted text with a pipe symbol
    function transformString(inputString, index) {
        // Find all quoted texts after commas and replace them accordingly
        let outputString = inputString.replace(/,"([^"]*)"/g, function (match, p1) {
            // Replace commas with semicolons inside the quoted text
            let transformedText = p1.replace(/,/g, ';');
            return ',' + transformedText;
        });
        outputString = outputString + ',' + (index === 0 ? 'ID' : '' + index);
        return outputString;
    }

    // util function to find timeago timestamps
    function timeAgo(updatedAt) {
        const now = new Date();
        const updatedTime = new Date(updatedAt);
        const elapsedTime = now - updatedTime; // Time difference in milliseconds

        const seconds = Math.floor(elapsedTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 60) {
            return 'Just now';
        } else if (minutes < 60) {
            return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        } else if (days < 7) {
            return `${days} day${days === 1 ? '' : 's'} ago`;
        } else if (weeks < 4) {
            return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
        } else if (months < 12) {
            return `${months} month${months === 1 ? '' : 's'} ago`;
        } else {
            return `${years} year${years === 1 ? '' : 's'} ago`;
        }
    }

    // Function to check if two transactions are duplicates
    function isDuplicateTransaction(txn1, txn2) {
        return formatDateField(convertDateFormat(txn1.Date).toLocaleString(), 'show-date') === formatDateField(convertDateFormat(txn2.Date).toLocaleString(), 'show-date') &&
            txn1.Account === txn2.Account &&
            txn1.Category === txn2.Category &&
            txn1.Subcategory === txn2.Subcategory &&
            txn1.Note === txn2.Note &&
            txn1.INR === txn2.INR &&
            txn1["Income/Expense"] === txn2["Income/Expense"];
    }

    // Function to show duplicate summary and get user decision
    async function showDuplicateSummary(duplicates) {
        return new Promise((resolve) => {
            // Display summary modal to the user
            const modal = document.getElementById('duplicate-modal');
            const skipButton = document.getElementById('skipButton');
            const overrideDuplicates = document.getElementById('override-duplicates');
            const manualButton = document.getElementById('manualButton');

            modal.querySelector('.duplicate-count').textContent = duplicates.length;
            modal.style.display = 'flex';

            skipButton.onclick = () => resolve('skip');
            overrideDuplicates.onclick = () => resolve('override');
            manualButton.onclick = () => resolve('manual');
        });
    }

    function updateAccountsAndCategories(newExpenses, mode) {
        // Update accounts
        const newAccounts = newExpenses.reduce((acc, expense) => {
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

        let existingAccounts = JSON.parse(localStorage.getItem('accounts')) || [];
        if (mode === 'merge') {
            existingAccounts = [...new Set([...existingAccounts, ...newAccounts])]; // Avoid duplicates
        } else {
            existingAccounts = newAccounts;
        }
        localStorage.setItem('accounts', JSON.stringify(existingAccounts));

        // Update categories
        const newCategories = newExpenses.reduce((acc, expense) => {
            if (expense["Income/Expense"] !== 'Transfer-Out') {
                if (!acc[expense.Category]) {
                    acc[expense.Category] = { type: expense["Income/Expense"], subcategories: [] };
                }
                if (expense.Subcategory && !acc[expense.Category].subcategories.includes(expense.Subcategory)) {
                    acc[expense.Category].subcategories.push(expense.Subcategory);
                }
            }
            return acc;
        }, {});

        let existingCategories = JSON.parse(localStorage.getItem('categories')) || {};
        if (mode === 'merge') {
            for (let category in newCategories) {
                if (existingCategories[category]) {
                    const existingSubcategories = existingCategories[category].subcategories;
                    const newSubcategories = newCategories[category].subcategories;
                    existingCategories[category].subcategories = [...new Set([...existingSubcategories, ...newSubcategories])]; // Avoid duplicates
                } else {
                    existingCategories[category] = newCategories[category];
                }
            }
        } else {
            existingCategories = newCategories;
        }
        localStorage.setItem('categories', JSON.stringify(existingCategories));

        // Update accountMappings (similar approach as above)
        let accountMappings = JSON.parse(localStorage.getItem('accountMappings')) || { "Cash": ["Cash"], "Bank Accounts": ["Bank Accounts"], "Credit Cards": ["Credit Cards"] };
        if (mode === 'merge') {
            newAccounts.forEach(account => {
                if (!accountMappings['Unmapped Accounts']) {
                    accountMappings['Unmapped Accounts'] = [];
                }
                if (!existingAccounts.includes(account) && !accountMappings['Unmapped Accounts'].includes(account)) {
                    accountMappings['Unmapped Accounts'].push(account);
                }
            });
        } else {
            accountMappings = JSON.parse(localStorage.getItem('accountMappings')) || { "Cash": ["Cash"], "Bank Accounts": ["Bank Accounts"], "Credit Cards": ["Credit Cards"] };
        }
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

        // Update accountGroups (use similar approach as categories if needed)
        let accountGroups = JSON.parse(localStorage.getItem('accountGroups')) || [{ "id": 1, "name": "Cash" }, { "id": 2, "name": "Bank Accounts" }, { "id": 3, "name": "Credit Cards" }];
        if (mode === 'merge') {
            // Logic to merge new account groups, if needed
        }
        localStorage.setItem('accountGroups', JSON.stringify(accountGroups));
    }

    document.getElementById('exportButton').addEventListener('click', exportToCSV);

    function exportToCSV() {
        const masterExpenses = JSON.parse(localStorage.getItem('masterExpenses')) || [];
        if (masterExpenses.length === 0) {
            alert('No data available to export.');
            return;
        }

        // Define the CSV headers
        const headers = ['Date', 'Account', 'Category', 'Subcategory', 'Note', 'INR', 'Income/Expense', 'Description', 'Amount', 'Currency', 'ID'];

        // Map data to CSV format
        const csvRows = [headers.join(',')]; // Add header row

        masterExpenses.forEach(expense => {
            const row = [
                expense.Date,
                expense.Account,
                expense.Category,
                expense.Subcategory || '',
                expense.Note || '',
                expense.INR || 0,
                expense["Income/Expense"],
                expense.Description || '',
                expense.Amount || '',
                expense.Currency || 'INR',
                expense.ID || ''
            ].map(field => `"${field}"`); // Enclose each field in quotes to handle commas and newlines

            csvRows.push(row.join(',')); // Join fields into a CSV row
        });

        const csvContent = csvRows.join('\n');

        // Create a blob from CSV content
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const date = new Date();
        const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
        const fileName = `Finance_Manager_complete_${formattedDate}.csv`;

        // Create a link to download the file
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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

});
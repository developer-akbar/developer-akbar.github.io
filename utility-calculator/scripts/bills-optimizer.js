function clearResults() {
    document.getElementById('result-container').style.display = 'none';
}

function calculateOptimalStrategies() {
    try {
        const optimizedResultContainer = document.getElementById("optimize-result");
        optimizedResultContainer.style.display = 'none';
        const unpaidBillsContainer = document.getElementById("unpaid-bills-container");
        unpaidBillsContainer.style.display = 'none';


        const billsInput = document.getElementById("bills").value;
        let balancesInput = document.getElementById("balances").value;

        if (billsInput == '' || balancesInput == '') {
            alert("Please enter input values");
            return;
        }

        document.getElementById('result-container').style.display = 'block';
        document.getElementById("loader").style.display = 'block';

        var bills = billsInput.split(',').map(Number);
        const walletBalances = balancesInput.split(',').map(Number);

        const strategies = [];

        // Sort bills and wallets in descending order
        bills.sort((a, b) => b - a);
        walletBalances.sort((a, b) => b - a);

        for (const walletBalance of walletBalances) {
            const bestCombination = findBestCombination(bills, walletBalance);
            strategies.push({ walletBalance, combination: bestCombination });

            // Remove bills used in the best combination from the array
            bills = bills.filter(bill => !bestCombination.includes(bill));
        }

        setTimeout(() => {
            displayOptimalStrategies(strategies);
        }, 500);
    } catch (err) {
        document.getElementById('result-container').style.display = 'block';
        document.getElementById("loader").style.display = 'block';
        console.error('Something went wrong with logic ', err);
        setTimeout(() => {
            displayError(err);
        }, 500);
    }
}

function displayError(err) {
    loader.style.display = 'none';

    document.getElementById("result-container").style.width = '50%';
    const balanceContainer = document.getElementById("optimize-result");
    balanceContainer.style.display = 'inline-table';
    balanceContainer.innerHTML = "";

    balanceContainer.innerHTML += `<p>Something went wrong with strategy logic, unable to serve right now.</p>
    <p class="report-error" onclick="sendEmail('${err.message}')">Report this issue.</p>`;
}

function sendEmail(err) {
    const email = "akbar.ak219@gmail.com";
    const subject = "There is something wrong with your code";
    const body = `'${err}' in ${window.location.href}.\n Rectify the bug`;

    const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;

    window.location.href = mailtoLink;

    setTimeout(() => {
        const balanceContainer = document.getElementById("optimize-result");
        balanceContainer.style.display = 'inline-table';
        balanceContainer.innerHTML = "";
        balanceContainer.innerHTML += `Thanks for reporting us the bug, we will fix it soon.`;
    }, 2000);
}

function findBestCombination(bills, walletBalance) {
    let bestCombination = [];
    let bestSum = 0;
    let allCombinations = [];
    
    function findCombinationRecursive(index, currentCombination, currentSum) {
        if (currentSum <= walletBalance && currentCombination.length > bestCombination.length) {
            bestCombination = [...currentCombination];
            bestSum = currentSum;

            // console.log('Best combinations: ', bestCombination, ' Sum: ', bestSum);
            allCombinations.push(bestCombination);
        }

        for (let i = index; i < bills.length; i++) {
            const newSum = currentSum + bills[i];
            if (newSum <= walletBalance) {
                currentCombination.push(bills[i]);
                findCombinationRecursive(i + 1, currentCombination, newSum);
                currentCombination.pop();
            }
        }
    }

    findCombinationRecursive(0, [], 0);

    // retrieving bestest combination amongst all combinations
    let maxSum = -1;
    let bestestCombinationArray = [];

    for (const combination of allCombinations) {
        const combinationSum = combination.reduce((acc, current) => acc + current, 0);

        if (combinationSum > maxSum) {
            maxSum = combinationSum;
            bestestCombinationArray = combination;
        }
    }
    // console.log("The bestest combination: ", bestestCombinationArray);

    return bestestCombinationArray;
}

function displayOptimalStrategies(strategies) {
    try {
        loader.style.display = 'none';

        document.getElementById("result-container").style.width = '50%';
        const balanceContainer = document.getElementById("optimize-result");
        balanceContainer.style.display = 'inline-table';
        balanceContainer.innerHTML = "";

        balanceContainer.innerHTML += `<tr>
        <th>Wallet</th>
        <th>Pay bills</th>
        <th>Balance</th>
        </tr>`;

        let totalWalletBalance = 0;
        let totalRemainingBalance = 0;
        if (strategies.length > 0) {
            for (const strategy of strategies) {
                balanceContainer.innerHTML += `<tr>
                <td>${strategy.walletBalance}</td>
                <td>${strategy.combination.join(", ")} (${eval(strategy.combination.join("+")) || 'No bills matched'})</td>
                <td>${strategy.walletBalance - eval(strategy.combination.join("+") || 0)}</td>
            </tr>`;
                totalWalletBalance += strategy.walletBalance;
                totalRemainingBalance += (strategy.walletBalance - eval(strategy.combination.join("+") || 0));
            }
            balanceContainer.innerHTML += `<tr>
            <td class="last-table-td">${totalWalletBalance}</td>
            <td class="last-table-td"></td>
            <td class="last-table-td">${totalRemainingBalance}</td>
        </tr>`;
        } else {
            balanceContainer.textContent = "No valid combinations found for any balance.";
        }

        var allBills = document.getElementById("bills").value.split(',');
        var paidBills = [].concat(...strategies.map(element => element.combination));
        var unpaidBills = allBills.filter(function (paidBill) {
            return !paidBills.includes(+paidBill);
        });
        setTimeout(() => {
            displayUnapidBills(unpaidBills, totalRemainingBalance);
        }, 600);
    } catch (err) {
        displayError();
    }
}

function displayUnapidBills(unpaidBills, totalRemainingBalance) {
    const unpaidBillsContainer = document.getElementById("unpaid-bills-container");
    unpaidBillsContainer.innerHTML = '';
    unpaidBillsContainer.style.display = 'block';

    if (unpaidBills.length > 0) {
        unpaidBillsContainer.innerHTML += `<p>Unmatched bills: ${unpaidBills.join(", ")}. <br>Remaining wallets balance is ${totalRemainingBalance}</p?`;
    } else {
        unpaidBillsContainer.innerHTML += `<p>Great! You covered all bills. <br>Remaining wallets balance is ${totalRemainingBalance}</p>`;
    }
}
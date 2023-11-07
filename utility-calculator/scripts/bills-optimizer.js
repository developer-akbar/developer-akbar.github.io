function clearResults() {
    document.getElementById('result-container').style.display = 'none';
}

function calculateOptimalStrategies() {
    const optimizedResultContainer = document.getElementById("optimize-result");
    optimizedResultContainer.style.display = 'none';
    const unpaidBillsContainer = document.getElementById("unpaid-bills-container");
    unpaidBillsContainer.style.display = 'none';


    const billsInput = document.getElementById("bills").value;
    let balancesInput = document.getElementById("balances").value;
    let minDifference = document.getElementById("min-difference").value;

    if (billsInput == '' || balancesInput == '') {
        alert("Please enter input values");
        return;
    }

    // if (!(/^\d*\,*\d*$/).test(billsInput) || !(/^\d*\,*\d*$/).test(balancesInput)) {
    //     alert("Please enter valid input values");
    //     return;
    // }

    document.getElementById('result-container').style.display = 'block';
    document.getElementById("loader").style.display = 'block';

    var bills = billsInput.split(',').map(Number);
    const walletBalances = balancesInput.split(',').map(Number);

    const strategies = [];

    // Sort bills and wallets in descending order
    bills.sort((a, b) => b - a);
    walletBalances.sort((a, b) => b - a);

    for (const walletBalance of walletBalances) {
        const bestCombination = findBestCombination(bills, walletBalance, minDifference);
        strategies.push({ walletBalance, combination: bestCombination });

        // Remove bills used in the best combination from the array
        bills = bills.filter(bill => !bestCombination.includes(bill));
    }

    setTimeout(() => {
        displayOptimalStrategies(strategies);
    }, 500);

    var allBills = billsInput.split(',');
    var paidBills = [].concat(...strategies.map(element => element.combination));
    var unpaidBills = allBills.filter(function (paidBill) {
        return !paidBills.includes(+paidBill);
    });
    setTimeout(() => {
        displayUnapidBills(unpaidBills);
    }, 600);

}

function findBestCombination(bills, walletBalance, minDifference) {
    let bestCombination = [];
    let finalBestCombination = [];
    let bestSum = 0;

    function findCombinationRecursive(index, currentCombination, currentSum) {
        if (currentSum <= walletBalance && currentCombination.length > bestCombination.length) {
            bestCombination = [...currentCombination];
            bestSum = currentSum;

            if (Math.abs(walletBalance - currentSum) < minDifference) {
                finalBestCombination = [...bestCombination];
            }
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

    return finalBestCombination.length > 0 ? finalBestCombination : bestCombination;
}

function displayOptimalStrategies(strategies) {
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

    if (strategies.length > 0) {
        let totalWalletBalance = 0;
        let totalRemainingBalance = 0;
        for (const strategy of strategies) {
            balanceContainer.innerHTML += `<tr>
                <td>${strategy.walletBalance}</td>
                <td>${strategy.combination.join(", ")}</td>
                <td>${strategy.walletBalance - eval(strategy.combination.join("+")) || strategy.walletBalance}</td>
            </tr>`;
            totalWalletBalance += strategy.walletBalance;
            totalRemainingBalance += (strategy.walletBalance - eval(strategy.combination.join("+")) || strategy.walletBalance);
        }
        balanceContainer.innerHTML += `<tr>
            <td class="last-table-td">${totalWalletBalance}</td>
            <td class="last-table-td"></td>
            <td class="last-table-td">${totalRemainingBalance}</td>
        </tr>`;
    } else {
        balanceContainer.textContent = "No valid combinations found for any balance.";
    }
}

function displayUnapidBills(unpaidBills) {
    const unpaidBillsContainer = document.getElementById("unpaid-bills-container");
    unpaidBillsContainer.innerHTML = '';

    if (unpaidBills.length > 0) {
        unpaidBillsContainer.style.display = 'block';
        unpaidBillsContainer.innerHTML += `<p>Unmatched bills: ${unpaidBills.join(", ")}</p?`;
    }
}
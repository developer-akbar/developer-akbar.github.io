function scrollToTop() {
    window.scrollTo(0, 0);
}

document.addEventListener('scroll', () => {
    var scrolled = window.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
    
    // setting header shadow to separate from body content
    if(scrolled > 20) {
        document.querySelector('header').style.boxShadow = 'var(--box-shadow)';
    } else {
        document.querySelector('header').style.boxShadow = 'unset';
    }

    // toggling scroll to top button when certain scroll to bottom
    if (scrolled > 799) {
        document.querySelector('.scroll-to-top').style.display = 'block';
    } else {
        document.querySelector('.scroll-to-top').style.display = 'none';
    }

    // adding scroll indicator to indicate how much percentage of the content scrolled
    const scrollPercentage = (scrolled / (document.documentElement.scrollHeight - document.documentElement.clientHeight) * 100);
    document.querySelector('.scroll-indicator').style.width = `${scrollPercentage}%`;
});

const asGrid = document.querySelector('.as-grid');
const asList = document.querySelector('.as-list');
asGrid.addEventListener("click", () => {
    document.querySelector('.saved-strategies').style.display = 'grid';
    document.querySelector('.saved-strategies').classList.remove('list');
    asList.classList.remove('active');
    asGrid.classList.add('active');
});
asList.addEventListener("click", () => {
    document.querySelector('.saved-strategies').style.display = 'unset';
    document.querySelector('.saved-strategies').classList.add('list');
    asGrid.classList.remove('active');
    asList.classList.add('active');
});

const textareaEls = document.querySelectorAll('textarea');
textareaEls.forEach(textarea => {
    const textareaInitialHeight = parseInt(getComputedStyle(textarea).getPropertyValue('height'));
    textarea.addEventListener("input", () => {
        textarea.style.height = `${textareaInitialHeight}px`;
        const textareaNewHeight = textarea.scrollHeight - textareaInitialHeight;
        textarea.style.height = `${textareaNewHeight}px`;
    })
});

const LOCAL_STORAGE_SAVED_STRATEGIES = 'saved-strategies';

let localSavedStrategies = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SAVED_STRATEGIES)) ?? [];

// displaying saved strategies on page load
document.addEventListener('DOMContentLoaded', function () {
    localSavedStrategies.map(r => document.querySelector('.saved-strategies').innerHTML += r);
    handleSavedStrategiesHeading();
})

function clearResults() {
    if (window.outerWidth > 600) {
        document.querySelector('FORM').style.width = '60%';
    }
    document.getElementById('result-container').style.display = 'none';
}

function calculateOptimalStrategies() {
    try {
        const optimizedStrategy = document.getElementById("optimized-strategy");
        optimizedStrategy.style.display = 'none';
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
        //walletBalances.sort((a, b) => b - a);

        for (const walletBalance of walletBalances) {
            const bestCombination = findBestCombination(bills, walletBalance);
            strategies.push({ walletBalance, combination: bestCombination });

            // Remove bills used in the best combination from the array
            bills = bills.filter(bill => !bestCombination.includes(bill));
        }
        localStorage.setItem('strategies', JSON.stringify(strategies)); // saving strategies to local storage

        // const localStrategies = JSON.parse(localStorage.getItem('strategies'))
        // const savedStrategy = localStrategies.find((strategy) => strategy.walletBalance == '2115');

        setTimeout(() => {
            document.querySelector('FORM').style.width = 'auto';
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
    document.getElementById("result-container").style.width = '50%';
    loader.style.display = 'none';
    const optimizedStrategy = document.getElementById("optimized-strategy");
    optimizedStrategy.style.display = 'inline-table';
    optimizedStrategy.innerHTML = "";

    optimizedStrategy.innerHTML += `<p>Something went wrong with strategy logic, unable to serve right now.</p>
    <p class="report-error" onclick="sendEmail('${err.message}')">Report this issue.</p>`;
}

function sendEmail(err) {
    const email = "akbar.ak219@gmail.com";
    const subject = "There is something wrong with your code";
    const body = `'${err}' in ${window.location.href}.\n Rectify the bug`;

    const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;

    window.location.href = mailtoLink;

    setTimeout(() => {
        const optimizedStrategy = document.getElementById("optimized-strategy");
        optimizedStrategy.style.display = 'inline-table';
        optimizedStrategy.innerHTML = "";
        optimizedStrategy.innerHTML += `Thanks for reporting us the bug, we will fix it soon.`;
    }, 2000);
}

function findBestCombination(bills, walletBalance) {
    let bestCombination = [];
    let allCombinations = [];

    function findCombinationRecursive(index, currentCombination, currentSum) {
        if (currentSum <= walletBalance) {
            bestCombination = [...currentCombination];
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

    // retrieving best combination amongst all combinations
    let maxSum = -1;
    let bestCombinationArray = [];
    for (const combination of allCombinations) {
        const combinationSum = combination.reduce((acc, current) => acc + current, 0);

        if (combinationSum > maxSum) {
            maxSum = combinationSum;
            bestCombinationArray = combination;
        }
    }

    return bestCombinationArray;
}

function displayOptimalStrategies(strategies) {
    try {
        loader.style.display = 'none';

        document.getElementById("result-container").style.width = '50%';
        const optimizedStrategy = document.getElementById("optimized-strategy");
        optimizedStrategy.style.display = 'inline-table';
        // balanceContainer.style.width = '100%';
        optimizedStrategy.innerHTML = "";

        optimizedStrategy.innerHTML += `<tr>
        <th>Wallet</th>
        <th>Pay bills</th>
        <th>Balance</th>
        </tr>`;

        let totalWalletBalance = 0;
        let totalRemainingBalance = 0;
        if (strategies.length > 0) {
            for (const strategy of strategies) {
                optimizedStrategy.innerHTML += `<tr>
                <td>${strategy.walletBalance}</td>
                <td>${strategy.combination.join(", ")} (${eval(strategy.combination.join("+")) || 'No bills matched'})</td>
                <td>${strategy.walletBalance - eval(strategy.combination.join("+") || 0)}</td>
            </tr>`;
                totalWalletBalance += strategy.walletBalance;
                totalRemainingBalance += (strategy.walletBalance - eval(strategy.combination.join("+") || 0));
            }
            optimizedStrategy.innerHTML += `<tr>
            <td class="last-table-td">${totalWalletBalance}</td>
            <td class="last-table-td">
                <button type="button" class="button save-strategy" onclick="saveStrategy(this)">Save this strategy</button>
            </td>
            <td class="last-table-td">${totalRemainingBalance}</td>
        </tr>`;
        } else {
            optimizedStrategy.textContent = "No valid combinations found for any balance.";
        }

        var allBills = document.getElementById("bills").value.split(',');
        var paidBills = [].concat(...strategies.map(element => element.combination));
        var unpaidBills = allBills.filter(function (paidBill) {
            return !paidBills.includes(+paidBill);
        });
        setTimeout(() => {
            displayUnpaidBills(unpaidBills, totalRemainingBalance);
        }, 50);
    } catch (err) {
        displayError();
    }
}

function displayUnpaidBills(unpaidBills, totalRemainingBalance) {
    const unpaidBillsContainer = document.getElementById("unpaid-bills-container");
    unpaidBillsContainer.innerHTML = '';
    unpaidBillsContainer.style.display = 'block';

    if (unpaidBills.length > 0) {
        unpaidBillsContainer.style.backgroundColor = 'red';
        unpaidBillsContainer.innerHTML += `<p>Unmatched bills: ${unpaidBills.join(", ")}. <br>Remaining wallets balance is ${totalRemainingBalance}</p?`;
    } else {
        unpaidBillsContainer.style.backgroundColor = '#30a630b3';
        unpaidBillsContainer.innerHTML += `<p>Great! You covered all bills. <br>Remaining wallets balance is ${totalRemainingBalance}</p>`;
    }
}

// save strategies to local storage and display

function saveStrategy(thisElement) {
    const btnCurrentText = thisElement.innerText;
    thisElement.innerText = 'Please wait, saving strategy...';

    let currentTime = new Date().getTime();

    var optimizedStrategy = document.getElementById('optimized-strategy').cloneNode(true);

    optimizedStrategy.setAttribute('class', `saved-${optimizedStrategy.getAttribute('id')}`);
    optimizedStrategy.setAttribute('id', `table-${currentTime}`);
    optimizedStrategy.querySelector('.save-strategy').classList.add('delete-strategy');
    optimizedStrategy.querySelector('.delete-strategy').classList.remove('save-strategy');
    optimizedStrategy.querySelector('.delete-strategy').textContent = 'Delete this strategy';
    optimizedStrategy.querySelector('.delete-strategy').setAttribute('onclick', 'deleteStrategy(this)');

    document.querySelector('.saved-strategies').innerHTML += `<div class="strategy-wrapper"></div>`;
    let lastAddedStrategyWrapper = [...document.querySelectorAll('.strategy-wrapper')].at(-1);
    lastAddedStrategyWrapper.setAttribute('id', `strategy-wrapper-${currentTime}`);
    lastAddedStrategyWrapper.innerHTML += `<div class="info flex"><span class="saved-on">Saved on ${new Date().toLocaleString()}</span><button type="button" class="button recalculate" onclick="recalculate(this)">Recalculate</button></div>`;
    lastAddedStrategyWrapper.innerHTML += `<input type="hidden" class="input-bills" data-bills="${document.getElementById('bills').value}">`;
    lastAddedStrategyWrapper.innerHTML += `<input type="hidden" class="input-balances" data-bills="${document.getElementById('balances').value}">`;

    handleSavedStrategiesHeading();

    var savedStrategy = new DOMParser().parseFromString(optimizedStrategy.outerHTML, "text/html").querySelector('.saved-optimized-strategy').outerHTML;
    lastAddedStrategyWrapper.innerHTML += savedStrategy;

    setTimeout(() => {
        // saving to local storage
        localSavedStrategies.unshift([...document.querySelectorAll('.strategy-wrapper')].at(-1).outerHTML);
        localStorage.setItem(LOCAL_STORAGE_SAVED_STRATEGIES, JSON.stringify(localSavedStrategies));

        thisElement.innerText = 'Woohoo!! Strategy saved. Calculate with new input';
        thisElement.setAttribute('disabled', 'disabled');
        thisElement.style.backgroundColor = 'grey';
    }, 1000);
}

function deleteStrategy(thisElement) {
    let savedStrategies1 = document.querySelector('.saved-strategies');
    savedStrategies1.classList.add('deleting');

    let strategyWrapper = thisElement.closest('.strategy-wrapper');
    strategyWrapper.classList.add('delete-saved-strategy');

    setTimeout(() => {
        strategyWrapper.remove();
        savedStrategies1.classList.remove('deleting');

        const toBeDeletedStrategy = localSavedStrategies.find(r => r.includes(strategyWrapper.getAttribute('id')));
        localSavedStrategies.indexOf(toBeDeletedStrategy);
        localSavedStrategies.splice(localSavedStrategies.indexOf(toBeDeletedStrategy), 1);
        handleSavedStrategiesHeading();
        localStorage.setItem(LOCAL_STORAGE_SAVED_STRATEGIES, JSON.stringify(localSavedStrategies));
    }, 500);
}

function recalculate(thisElement) {
    let savedBills = thisElement.closest('.strategy-wrapper').querySelector('.input-bills').dataset.bills;
    let savedBalances = thisElement.closest('.strategy-wrapper').querySelector('.input-balances').dataset.bills;

    document.getElementById('bills').value = savedBills;
    document.getElementById('balances').value = savedBalances;    
    document.getElementById('bills').focus();
}

document.querySelectorAll('.collapsible').forEach(collapsible => {
    collapsible.addEventListener("click", () => {
        document.querySelector('.fa-circle-info.collapsible').classList.toggle('active');
        let collapsibleContent = document.querySelector('.collapsible-content');
        collapsibleContent.classList.toggle('active');
    });
});

function handleSavedStrategiesHeading() {
    if(document.querySelector('.saved-strategies').childElementCount == 0) {
        document.querySelector('.saved-strategies-heading').style.display = 'none';
    } else {
        document.querySelector('.saved-strategies-heading').style.display = 'flex'; 
    }
}

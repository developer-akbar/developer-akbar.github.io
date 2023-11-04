$($('#menu li')[0]).addClass('active'); // adding active class to first menu itme
var activeSection = $('ul#menu').find('li.active').attr('name'); // finding active item's matching section
$('#' + activeSection).show(); // showing section which is active on initial load

// toggling the sections
$(document).on("click", ".section-item", function(event) {
    $('.section-item').removeClass('active')
    $(this).addClass('active');

    $('.section').hide();
    $('#' + $(this).attr('name')).show();

    //event.preventDefault();
});

$(document).on("click", ".time-diff-button", function() {
    $("#time-diff-result").text('');

    var fromTime = $('.from-time').val();
    var toTime = $('.to-time').val();

    var fromMilSec = new Date(new Date().toLocaleDateString() + ' ' + fromTime).getTime();
    var toMilSec = new Date(new Date().toLocaleDateString() + ' ' + toTime).getTime();

    if (fromMilSec > toMilSec) {
        const today = new Date(); // get today's date
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1); // Add 1 to today's date and set it to tomorrow
        toMilSec = new Date(tomorrow.toLocaleDateString() + ' ' + toTime).getTime();
    }

    var diffTime = toMilSec - fromMilSec
    var result = convertMsToTime(diffTime);
    console.log('Time difference: ', result);
    $("#time-diff-result").append(result);
});

$(document).on("click", ".date-diff-button", function() {
    $("#date-diff-result").text('');

    var fromDate = $('.from-date').val();
    var toDate = $('.to-date').val();
    var countFromDate = $('.count-from-date').is(':checked');

    var today = new Date();
    var selectedDate = new Date(fromDate);

    var addDay = countFromDate ? (new Date(toDate) > new Date(fromDate) ? 1 : -1) : 0;

    var dateDiff = new Date(toDate) - new Date(fromDate);
    var result = (dateDiff / 1000 / 3600 / 24) + addDay;
    console.log('Date difference: ', result, ' days');
    $("#date-diff-result").append(`${result} days`);
});

$(document).on("click", ".add-days-button", function() {
    $("#add-days-result").text('');

    var startDate = $('.start-date').val();
    var noOfDays = $('.no-of-days').val();
    var countFromDate = $('.count-start-date').is(':checked');

    var addDay = countFromDate ? (noOfDays > 0 ? 1 : (noOfDays == 0 ? 0 : -1)) : 0;

    var selectedDate = new Date(startDate);
    var timeInMillis = selectedDate.setDate(selectedDate.getDate() + parseInt(noOfDays) - addDay);
    var result = new Date(timeInMillis).toDateString();
    console.log('Future Date: ', result);
    $("#add-days-result").append(result);
});

$(document).on("click", ".add-time-button", function() {
    $("#add-time-result").text('');

    var startTime = $('.start-time').val();
    var addTime = $('.add-time').val();

    var startTimeInMilSec = new Date(new Date().toLocaleDateString() + ' ' + startTime).getTime();
    var addTimeInMilSec = new Date(new Date().toLocaleDateString() + ' ' + addTime).getTime();

    if (startTimeInMilSec > addTimeInMilSec) {
        const today = new Date(); // get today's date
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1); // Add 1 to today's date and set it to tomorrow
        addTimeInMilSec = new Date(tomorrow.toLocaleDateString() + ' ' + addTime).getTime();
    }

    var addTime = addTimeInMilSec + startTimeInMilSec
    var result = convertMsToTime(addTime);
    console.log('Time difference: ', result);
    $("#add-time-result").append(result);
});

$(document).on("click", ".bmi-button", function() {
    $("#bmi-result").text('');

    var height = $('.height').val();
    var weight = $('.weight').val();

    var bmi = (weight / (height * height)).toFixed(2); // upto 2 decimals

    console.log('Your BMI: ', bmi);

    var status = '';
    if (bmi < 18.5) status = 'You are underwieght. Eat healthy food and do exercises.';
    if (bmi > 18.5 && bmi <= 25) status = 'You are fit. Keep it up.';
    if (bmi > 25 && bmi <= 30) status = 'You are overweight. Do physical exercises.';
    if (bmi > 30) status = 'You have obesity, loose your weight.';

    $("#bmi-result").append(`Your BMI is ${bmi}. ${status}`);
});

$(document).on("click", ".emi-button", function() {
    $("#emi-result").text('');

    var loanAmount = $('.loan-amount').val();
    var tenure = parseInt($('.tenure').val());
    var interestRate = $('.interest-rate').val();

    if (interestRate != "" || interestRate != 0) {
        interestRate = parseFloat(interestRate);
    } else {
        interestRate = parseFloat($("#interest-rate").data("defaultintrestrate"));
    }
    var ipa = (interestRate / 12) / 100;
    var processingFee = $("input[name='processingFee']").val();
    if (processingFee != "") {
        processingFee = parseFloat(processingFee);
    } else {
        processingFee = parseFloat($("#processing-fee").data("defaultprocessingfee"));
    }
    var emi = loanAmount * ipa * (Math.pow((1 + ipa), tenure) / (Math.pow((1 + ipa), tenure) - 1));
    
    var today = new Date();
    today.setMonth(today.getMonth() + tenure);

    console.log('Your EMI: ', formatNumber(Math.round(emi)));

    $("#emi-result").append(`Total Interest ${formatNumber(Math.round(emi * tenure - loanAmount))}`);
    $("#emi-result").append(`<br>Total amount payable ${formatNumber(Math.round(emi * tenure))}`);
    $("#emi-result").append(`<br>EMI you have to pay ${formatNumber(Math.round(emi))}`);
    $("#emi-result").append(`<br> Your loan will clear by ${today.toLocaleDateString()} if you opt today`);
});

$(document).on("click", "input[type='reset']", function() {
    $(this).closest('FORM').find('.section-result').text('');
});

function formatNumber(number) {
    if(number != undefined) {
        return number.toLocaleString("en-IN");
    }
}

function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}

function convertMsToTime(milliseconds) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds = seconds % 60;
    minutes = minutes % 60;

    // If you don't want to roll hours over, e.g. 24 to 00
    // comment (or remove) the line below
    // commenting next line gets you `24:00:00` instead of `00:00:00`
    // or `36:15:31` instead of `12:15:31`, etc.
    hours = hours % 24;

    return `${padTo2Digits(hours)} hours ${padTo2Digits(minutes)} minuts ${padTo2Digits(seconds,)} seconds`;
}

// JavaScript for mobile menu toggle and item selection

$(document).ready(function() {
    // Initialize the selected section as null
    var selectedSection = null;

    // Function to generate the mobile menu list
    function generateMobileMenuList() {
        // Clear the existing menu list
        $("#menu-list").empty();

        // Create a list item for each section except the selected one
        $("#sections .section").each(function() {
            var sectionTitle = $(this).attr('id');
            var sectionText = $(this).attr('title');

            if (sectionTitle !== selectedSection) {
                var listItem = $("<li>").addClass("section-item").attr("name", sectionTitle).text(sectionText);
                $("#menu-list").append(listItem);
            }
        });
    }

    // Toggle the mobile menu when the button is clicked
    $("#menu-toggle").click(function() {
        $("#mobile-menu").toggleClass("expanded");

        // Generate the mobile menu list when the button is clicked
        if ($("#mobile-menu").hasClass("expanded")) {
            generateMobileMenuList();
        }
    });

    // Handle menu item selection
    $("#menu-list").on("click", "li", function() {
        var sectionTitle = $(this).attr("name");
        var sectionText = $(this).text();

        // Set the selected section
        selectedSection = sectionTitle;

        // Set the button text to the selected section title
        $("#menu-toggle").text(sectionText);

        // Hide the mobile menu list
        $("#mobile-menu").removeClass("expanded");
    });

    // Generate the initial mobile menu list
    generateMobileMenuList();
});
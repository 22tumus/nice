
console.log("pay.js loaded");

var form = document.getElementById('loginForm');
console.log("Form element:", form);
if (form) 
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log("Form submitted. Starting payment process...");

    var phoneInput = document.getElementById('phoneNumber');
    var phoneNumber = phoneInput.value.trim();
    // Get amount from the displayed amount
    var amount = document.getElementById('amount').innerText;

    console.log("Received phone number:", phoneNumber);
    console.log("Received amount:", amount);
    // Find the button that submitted the form (handles button or input)
    var payButton = e.submitter || this.querySelector('button[type="submit"]') || this.querySelector('input[type="submit"]');
    var textProp = (payButton && payButton.tagName === 'INPUT') ? 'value' : 'innerText';
    var originalText = payButton ? payButton[textProp] : "";
    var messageDiv = document.getElementById('paymentMessage');

    messageDiv.innerText = ""; // Clear previous messages
    messageDiv.style.color = "red";

    // Validate phone number (must be 10 digits)
    if (phoneNumber.length !== 10 || isNaN(phoneNumber)) {
        messageDiv.innerText = "Please enter a valid 10-digit phone number";
        return;
    }

    if (phoneNumber.startsWith('0')) {
        phoneNumber = "+256" + phoneNumber.substring(1);
    }

    // Disable button and show loading state
    if (payButton) {
        payButton.disabled = true;
        payButton[textProp] = "Processing...";
    }

    // Call Payment API
    // Replace 'YOUR_PAYMENT_API_URL_HERE' with your actual server endpoint
    var payload = { phone_number: phoneNumber, amount: Number(amount) };
    console.log("Sending payload:", payload);

    fetch('https://backend.tumusiimesadas.com/api/pay', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(data => {
        console.log("API response data:", data);
        console.log("Type of data:", typeof data);
        if (data.success) {
            // Payment Succeeded: Login to MikroTik
            // Assuming the API returns the username/password or we use the phone number
            var user = data.username || phoneNumber;
            var pass = data.password || phoneNumber;
            window.location.href = "http://192.168.88.1/login?username=" + encodeURIComponent(user) + "&password=" + encodeURIComponent(pass);
        } else {
            // Payment Failed: Show reason
            messageDiv.innerText = "Payment failed: " + (data.message || "Unknown error");
            if (payButton) {
                payButton.disabled = false;
                payButton[textProp] = originalText;
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        messageDiv.innerText = "Connection error. Please try again.";
        if (payButton) {
            payButton.disabled = false;
            payButton[textProp] = originalText;
        }
    });
});
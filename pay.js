
console.log("pay.js loaded");

var form = document.getElementById('loginForm');

if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        var phoneInput = document.getElementById('phoneNumber');
        var phoneNumber = phoneInput.value.trim();
        var amountText = document.getElementById('amount').innerText;
        var amount = amountText.replace(/[^0-9]/g, ''); 

        var payButton = e.submitter || this.querySelector('button[type="submit"]');
        var textProp = (payButton && payButton.tagName === 'INPUT') ? 'value' : 'innerText';
        var originalText = payButton ? payButton[textProp] : "";
        var messageDiv = document.getElementById('paymentMessage');

        messageDiv.innerText = ""; 
        messageDiv.style.color = "blue"; // Set to blue for "Processing" state

        if (phoneNumber.length !== 10 || isNaN(phoneNumber)) {
            messageDiv.style.color = "red";
            messageDiv.innerText = "Please enter a valid 10-digit phone number";
            return;
        }

        let formattedPhone = phoneNumber;
        if (phoneNumber.startsWith('0')) {
            formattedPhone = "+256" + phoneNumber.substring(1);
        }

        if (payButton) {
            payButton.disabled = true;
            payButton[textProp] = "Processing...";
        }

        var payload = { phone_number: formattedPhone, amount: Number(amount) };

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            // 1. Initial POST request
            const postResponse = await fetch('https://backend.tumusiimesadas.com/api/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            // Avoid crashing if response is empty
            await postResponse.json().catch(() => ({}));

            // 2. The 6-second Polling Loop
            let found = false;
            let attempts = 0;
            const maxAttempts = 20;

            while (!found && attempts < maxAttempts) {
                attempts++;
                messageDiv.innerText = `Waiting for payment confirmation... (Attempt ${attempts}/20)`;
                
                await sleep(6000); 

                // CORRECTED URL: Removed curly braces, added ?amount=
                const url = `https://backend.tumusiimesadas.com/api/filter?amount=${amount}`
                console.log("Checking URL:", url);

                const getResponse = await fetch(url);
                
                // Safety check to handle HTML error pages
                const responseText = await getResponse.text();
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error("Server returned HTML instead of JSON. Check backend route.");
                    continue; // Skip this attempt and try again in 6s
                }

                console.log("Response data:", data);

                // 3. Logic to read: { "message": "success", "code": "34" }
                if (data && data.message === "success" && data.code) {
                    found = true;
                    const voucherCode = data.code; 
                    
                    console.log("Success! Voucher Code is:", voucherCode);
                    
                    // Redirect to MikroTik: Code as username, Code as password
                    window.location.href = "http://192.168.88.1/login?username=" + encodeURIComponent(voucherCode) +  "&password=" + encodeURIComponent(voucherCode);
                    return; 
                }
            }

            if (!found) {
                messageDiv.style.color = "red";
                messageDiv.innerText = "Payment not detected. If you were charged, please contact support.";
            }

        } catch (error) {
            console.error('Error:', error);
            messageDiv.style.color = "red";
            messageDiv.innerText = "Connection error. Please try again.";
        } finally {
            if (payButton) {
                payButton.disabled = false;
                payButton[textProp] = originalText;
            }
        }
    });
}

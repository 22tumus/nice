document.getElementById('loginForm').addEventListener('submit', function(e) {
    // If the payment phone number input exists, this is the payment form.
    // Return early and let pay.js handle the submission.
    if (document.getElementById('phoneNumber')) {
        return;
    }
    e.preventDefault(); // Prevent default form submission
    var voucher = document.getElementById('username').value;
    window.location.href = "http://192.168.88.1/login?username=" + encodeURIComponent(voucher) + "&password=" + encodeURIComponent(voucher);
});

var FALLBACK_VIDEO_URL = 'elephanths.mp4';
var FALLBACK_BG_URL = 'dessert-on-a-plate.jpg';

function renderPackages(packages) {
    var packagesContainer = document.getElementById('packagesContainer');
    if (!packagesContainer) return;

    if (!Array.isArray(packages) || packages.length === 0) {
        packagesContainer.innerHTML = '<p style="color: black;">No packages available right now.</p>';
        return;
    }

    var activePackages = packages.filter(function(pkg) {
        return pkg && pkg.active === true;
    });

    var getPackageOrder = function(category) {
        var value = String(category || '').toLowerCase();
        if (value.indexOf('day') !== -1 || value.indexOf('daily') !== -1) return 1;
        if (value.indexOf('week') !== -1 || value.indexOf('weekly') !== -1) return 2;
        if (value.indexOf('month') !== -1 || value.indexOf('monthly') !== -1) return 3;
        return 99;
    };

    activePackages.sort(function(a, b) {
        return getPackageOrder(a.category) - getPackageOrder(b.category);
    });

    if (activePackages.length === 0) {
        packagesContainer.innerHTML = '<p style="color: black;">No active packages available right now.</p>';
        return;
    }

    packagesContainer.innerHTML = activePackages.map(function(pkg) {
        var category = pkg.category || 'Package';
        var amount = String(pkg.amount || '0').replace(/[^0-9]/g, '');
        var duration = pkg.duration || category;
        var datalimit = pkg.datalimit || 'Unlimited';
        var speedlimit = pkg.speedlimit || 'Unlimited';

        return (
            '<p style="margin-bottom: 0; color: black; font-weight: bold;">' + category + '</p>' +
            '<p style="margin-top: 0; display: flex; justify-content: space-between; align-items: center; color: black;">' +
                'shs ' + amount +
                ' <button type="button" class="payMobile" data-amount="' + amount + '" data-duration="' + duration + '" data-datalimit="' + datalimit + '" data-speedlimit="' + speedlimit + '" style="width: 100px;">Pay</button>' +
            '</p>'
        );
    }).join('');
}

async function loadPackages() {
    var packagesContainer = document.getElementById('packagesContainer');
    if (!packagesContainer) return;

    try {
        var response = await fetch('https://backend.tumusiimesadas.com/api/packages');
        if (!response.ok) {
            console.error('Packages API failed:', response.status, response.statusText);
            throw new Error('Unable to load packages right now.');
        }
        var data = await response.json();

        var packages = Array.isArray(data)
            ? data
            : (Array.isArray(data.packages) ? data.packages : (Array.isArray(data.data) ? data.data : []));
        renderPackages(packages);
    } catch (error) {
        packagesContainer.innerHTML = '<p style="color: red;">Failed to load packages: </p>';
        console.error(error);
    }
}

async function loadPromoVideo() {
    var video = document.getElementById('promoVideo');
    var status = document.getElementById('promoVideoStatus');
    if (!video) return;

    video.onerror = function() {
        var code = video.error ? video.error.code : 0;
        var reason = 'unknown';
        if (code === 1) reason = 'aborted';
        if (code === 2) reason = 'network';
        if (code === 3) reason = 'decode';
        if (code === 4) reason = 'source not supported';

        // Captive portal browsers often block remote media. Fall back to local file once.
        if (video.dataset.fallbackApplied !== '1') {
            video.dataset.fallbackApplied = '1';
            video.src = FALLBACK_VIDEO_URL;
            video.load();
            if (status) status.textContent = 'Video loaded.';
            video.play().catch(function() {});
            return;
        }

        if (status) status.textContent = 'Video failed to load.';
        console.error('Video element error:', reason, code);
    };

    video.onloadeddata = function() {
        if (status) status.textContent = 'Video ready.';
    };

    try {
        var apiUrl = 'https://backend.tumusiimesadas.com/api/media?type=video';
        if (status) status.textContent = 'Loading video...';

        var response = await fetch(apiUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Media failed');

        var contentType = response.headers.get('content-type') || '';
        var data;

        if (contentType.indexOf('application/json') !== -1) {
            data = await response.json();
        } else {
            var textBody = (await response.text()).trim();
            if (!textBody) throw new Error('Empty media response');
            try {
                data = JSON.parse(textBody);
            } catch (parseError) {
                data = textBody;
            }
        }

        if (!data || !Array.isArray(data.data) || !data.data[0] || !data.data[0].secureUrl) {
            throw new Error('Missing data[0].secureUrl in media response');
        }

        var mediaUrl = String(data.data[0].secureUrl || '').trim();

        if (!mediaUrl || !/^https:\/\//i.test(mediaUrl)) {
            throw new Error('data[0].secureUrl must be an https URL');
        }

        video.dataset.fallbackApplied = '0';
        video.src = mediaUrl;
        if (status) status.textContent = 'Video loaded.';
        video.load();
        video.play().catch(function() {
            // Autoplay may be blocked by browser policies; controls remain available.
        });
    } catch (error) {
        video.dataset.fallbackApplied = '1';
        video.src = FALLBACK_VIDEO_URL;
        video.load();
        if (status) status.textContent = 'Video loaded.';
        video.play().catch(function() {});
        console.error('Failed to load secure media URL:', error);
    }
}

async function loadBackgroundImage() {
    try {
        // Keep local fallback by default; replace only when secure image succeeds.
        document.body.style.backgroundImage = 'url("' + FALLBACK_BG_URL + '")';

        var apiUrl = 'https://backend.tumusiimesadas.com/api/media?type=image';
        var response = await fetch(apiUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Image media failed');

        var contentType = response.headers.get('content-type') || '';
        var data;

        if (contentType.indexOf('application/json') !== -1) {
            data = await response.json();
        } else {
            var textBody = (await response.text()).trim();
            if (!textBody) throw new Error('Empty image media ');
            data = JSON.parse(textBody);
        }

        if (!data || !Array.isArray(data.data) || !data.data[0] || !data.data[0].secureUrl) {
            throw new Error('Missing data[0].secureUrl in image response');
        }

        var imageUrl = String(data.data[0].secureUrl || '').trim();
        if (!/^https:\/\//i.test(imageUrl)) {
            throw new Error('data[0].secureUrl for image must be an https URL');
        }

        document.body.style.backgroundImage = 'url("' + imageUrl + '")';
    } catch (error) {
        document.body.style.backgroundImage = 'url("' + FALLBACK_BG_URL + '")';
        console.error('Failed to load secure background image:', error);
    }
}

document.addEventListener('click', function(e) {
    var button = e.target.closest('.payMobile');
    if (!button) return;

    var amount = button.getAttribute('data-amount');
    var duration = button.getAttribute('data-duration');
    var datalimit = button.getAttribute('data-datalimit');
    var speedlimit = button.getAttribute('data-speedlimit');
    var url = 'pay.html?amount=' + encodeURIComponent(amount) + '&duration=' + encodeURIComponent(duration) + '&datalimit=' + encodeURIComponent(datalimit) + '&speedlimit=' + encodeURIComponent(speedlimit);
    window.location.href = url;
});

loadPackages();
loadPromoVideo();
loadBackgroundImage();

window.addEventListener('load', function() {
    setTimeout(function() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        loadingOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 3000); // 3 detik
});
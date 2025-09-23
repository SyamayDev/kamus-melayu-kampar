document.addEventListener("DOMContentLoaded", function () {
  let dictionary = [];
  let currentData = []; // Data yang sedang ditampilkan
  let listening = false;
  let startIndex = 0; // Indeks awal data yang ditampilkan
  let endIndex = 0; // Indeks akhir data yang ditampilkan
  const itemsPerPage = 15; // Tampilkan 15 item per halaman
  let isLoading = false; // Flag untuk mencegah loading ganda

  // Ambil elemen dari DOM
  const searchInput = document.getElementById("searchInput");
  const resultsContainer = document.getElementById("results");
  const searchLabel = document.getElementById("search-label");
  const voiceSearchBtn = document.getElementById("voiceSearchBtn");
  const searchContainer = document.querySelector(".search-container");
  const mainNavbar = document.querySelector(".navbar");

  // Fungsi untuk memfilter dan menampilkan hasil
  function handleSearch() {
    window.removeEventListener("scroll", handleScroll);
    const query = searchInput.value.toLowerCase();

    if (query) {
      currentData = dictionary.filter(
        (item) =>
          item.indonesian.toLowerCase().includes(query) ||
          item.melayu_kampar.toLowerCase().includes(query) ||
          (item.english && item.english.toLowerCase().includes(query))
      );
      resultsContainer.innerHTML = ""; // Reset untuk pencarian baru
      startIndex = 0;
      endIndex = itemsPerPage - 1;
      displayResults(currentData);
    } else {
      resetToInitialView();
    }
  }

  function displayResults(data) {
    const scrollPosition = resultsContainer.scrollTop; // Simpan posisi scroll
    const itemsToDisplay = data.slice(startIndex, endIndex + 1);

    if (itemsToDisplay.length === 0) {
      resultsContainer.innerHTML = `<p class="text-center text-muted col-12 mt-4">Kata tidak ditemukan.</p>`;
      return;
    }

    // Hapus elemen lama jika ada
    while (resultsContainer.children.length > itemsPerPage) {
      resultsContainer.removeChild(resultsContainer.firstElementChild);
    }

    // Tambahkan item baru di bawah
    itemsToDisplay.forEach((item) => {
      if (!resultsContainer.querySelector(`[data-id="${item.id || item.indonesian}"]`)) {
        const card = `
          <div class="col-12 col-md-6 col-lg-4" data-id="${item.id || item.indonesian}">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">${item.indonesian}</h5>
                <p class="card-text"><strong>Melayu:</strong> ${item.melayu_kampar}</p>
                <p class="card-text"><strong>Inggris:</strong> ${item.english}</p>
              </div>
            </div>
          </div>
        `;
        resultsContainer.insertAdjacentHTML("beforeend", card);
      }
    });

    // Kembalikan posisi scroll
    setTimeout(() => {
      resultsContainer.scrollTop = scrollPosition; // Kembalikan posisi scroll setelah pembaruan
    }, 0);
  }

  // Event listener untuk input ketikan
  searchInput.addEventListener("input", () => {
    if (searchInput.value.length === 0) {
      searchLabel.classList.remove("a11y-hidden");
    } else {
      searchLabel.classList.add("a11y-hidden");
    }
    handleSearch();
  });

  // --- Logika untuk Pencarian Suara ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(() => console.log("Izin mikrofon diberikan"))
    .catch((err) => console.error("Izin mikrofon ditolak:", err));

  if (SpeechRecognition) {
    voiceSearchBtn.classList.add("show");
    const labelSpan = searchLabel.querySelector("span");
    if (labelSpan) labelSpan.classList.add("show");

    voiceSearchBtn.addEventListener("click", () => {
      if (!listening) {
        const recognition = new SpeechRecognition();
        recognition.lang = "id-ID";

        recognition.onstart = () => {
          voiceSearchBtn.classList.add("active");
          listening = true;
        };

        recognition.onspeechend = () => {
          recognition.stop();
          voiceSearchBtn.classList.remove("active");
          listening = false;
        };

        recognition.onerror = () => {
          voiceSearchBtn.classList.remove("active");
          listening = false;
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          searchInput.value = transcript;
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        };

        recognition.start();
      }
    });
  }

  // --- Logika untuk Sticky Search Header ---
  if (searchContainer) {
    const placeholder = document.createElement("div");
    placeholder.classList.add("search-placeholder");
    searchContainer.after(placeholder);

    const triggerPoint = searchContainer.offsetTop;

    window.addEventListener("scroll", () => {
      if (window.scrollY > triggerPoint) {
        if (!searchContainer.classList.contains("is-sticky")) {
          placeholder.style.height = `${searchContainer.offsetHeight}px`;
          searchContainer.classList.add("is-sticky");
        }
      } else {
        if (searchContainer.classList.contains("is-sticky")) {
          searchContainer.classList.remove("is-sticky");
          placeholder.style.height = "0px";
        }
      }
    });
  }

  // --- Logika untuk Infinite Scroll Dua Arah ---
  function loadMoreItems(direction) {
    if (isLoading) return;
    isLoading = true;

    const scrollPosition = resultsContainer.scrollTop; // Simpan posisi scroll

    if (direction === "down" && endIndex < currentData.length - 1) {
      startIndex = endIndex + 1;
      endIndex = Math.min(startIndex + itemsPerPage - 1, currentData.length - 1);
      displayResults(currentData);
    } else if (direction === "up" && startIndex > 0) {
      endIndex = startIndex - 1;
      startIndex = Math.max(endIndex - (itemsPerPage - 1), 0);
      displayResults(currentData);
    }

    setTimeout(() => {
      resultsContainer.scrollTop = scrollPosition; // Kembalikan posisi scroll
    }, 0);
    isLoading = false;
  }

  function handleScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 200 && !isLoading && endIndex < currentData.length - 1) {
      loadMoreItems("down");
    } else if (scrollTop <= 200 && !isLoading && startIndex > 0) {
      loadMoreItems("up");
    }
  }

  function resetToInitialView() {
    resultsContainer.innerHTML = "";
    startIndex = 0;
    endIndex = itemsPerPage - 1;
    currentData = dictionary;
    displayResults(currentData);
    window.addEventListener("scroll", handleScroll);
  }

  // Muat data kamus dari JSON
  fetch("data.json")
    .then((response) => {
      if (!response.ok) throw new Error("Gagal memuat data.json");
      return response.json();
    })
    .then((data) => {
      dictionary = data;
      resetToInitialView();
    })
    .catch((error) => {
      console.error("Error:", error);
      resultsContainer.innerHTML = `<p class="text-center text-danger col-12 mt-4">Tidak dapat memuat data kamus.</p>`;
    });

  window.addEventListener("scroll", handleScroll);
});
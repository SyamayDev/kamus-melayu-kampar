document.addEventListener("DOMContentLoaded", function () {
  let dictionary = [];
  let currentData = []; // Data yang sedang ditampilkan
  let listening = false;
  let page = 1;
  const itemsPerPage = 15; // Tampilkan 15 item per halaman
  let isLoading = false; // Flag untuk mencegah loading ganda

  // Ambil elemen dari DOM
  const searchInput = document.getElementById("searchInput");
  const resultsContainer = document.getElementById("results");
  const searchLabel = document.getElementById("search-label");
  const voiceSearchBtn = document.getElementById("voiceSearchBtn");
  const refreshBtn = document.getElementById("refreshBtn"); // Tambahkan elemen refresh
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
      resultsContainer.innerHTML = ""; // Kosongkan untuk pencarian baru
      page = 1;
      displayResults(currentData);
    } else {
      resetToInitialView();
    }
  }

  function displayResults(data) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const itemsToDisplay = data.slice(start, end);

    if (itemsToDisplay.length === 0 && start === 0) {
      resultsContainer.innerHTML = `<p class="text-center text-muted col-12 mt-4">Kata tidak ditemukan.</p>`;
      return;
    }

    itemsToDisplay.forEach((item) => {
      const card = `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="card">
            <div class="card-body d-flex align-items-center">
              <div>
                <h5 class="card-title">${item.indonesian}</h5>
                <p class="card-text"><strong>Melayu:</strong> ${
                  item.melayu_kampar
                }</p>
                <p class="card-text"><strong>Inggris:</strong> ${
                  item.english
                }</p>
              </div>
              ${
                item.audio
                  ? `
                <button class="speaker-btn" onclick="playAudio('${item.audio}', this)">
                  <i class="bi bi-volume-up-fill"></i>
                </button>
              `
                  : ""
              }
            </div>
          </div>
        </div>
      `;
      resultsContainer.insertAdjacentHTML("beforeend", card);
      // jumlah item tanpa audio ditampilakn di console
      if (!item.audio) {
        console.log("Item tanpa audio:", item);
      }
    });
  }

  // Fungsi untuk memutar audio
  window.playAudio = function (audioFile, button) {
    const audioPath = `audio/${audioFile}`;
    const audio = new Audio(audioPath);
    button.classList.add("playing"); // Tambahkan kelas playing saat audio dimulai
    audio.play().catch((error) => {
      console.error("Error memutar audio:", error);
      alert(
        "Gagal memutar audio. Pastikan file audio tersedia di " + audioPath
      );
    });
    audio.onended = () => {
      button.classList.remove("playing"); // Hapus kelas playing saat audio selesai
    };
    audio.onerror = () => {
      button.classList.remove("playing"); // Hapus kelas playing jika error
    };
  };

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
  const SpeechRecognition =
    window.webkitSpeechRecognition || window.SpeechRecognition;

  if (SpeechRecognition) {
    voiceSearchBtn.classList.add("show");
    const labelSpan = searchLabel.querySelector("span");
    if (labelSpan) labelSpan.classList.add("show");

    voiceSearchBtn.addEventListener("click", () => {
      if (!listening) {
        if (!("webkitSpeechRecognition" in window)) {
          alert("Browser Anda tidak mendukung fitur pencarian suara.");
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "id-ID";
        recognition.continuous = false;
        recognition.interimResults = true;

        // Buat elemen popup untuk menampilkan status suara
        let voicePopup = document.createElement("div");
        voicePopup.className = "voice-popup";
        voicePopup.id = "voicePopup";
        voicePopup.innerHTML = "<p>Mendengarkan...</p>";
        document.body.appendChild(voicePopup);

        // Hapus modal backdrop jika ada
        document.body.classList.remove("modal-open");
        if (document.querySelector(".modal-backdrop")) {
          document.querySelector(".modal-backdrop").remove();
        }

        recognition.onresult = (event) => {
          const interimTranscript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join("");
          voicePopup.innerHTML = `<p>${
            interimTranscript || "Mendengarkan..."
          }</p>`;
          if (event.results[0].isFinal) {
            searchInput.value = event.results[0][0].transcript;
            searchInput.dispatchEvent(new Event("input", { bubbles: true }));
            setTimeout(() => {
              voicePopup.remove();
              document.body.classList.remove("modal-open");
            }, 1000);
          }
        };

        recognition.onend = () => {
          if (voicePopup.innerHTML.includes("Mendengarkan...")) {
            voicePopup.innerHTML = "<p>Tidak ada suara terdeteksi</p>";
            setTimeout(() => {
              voicePopup.remove();
              document.body.classList.remove("modal-open");
            }, 1000);
          }
        };

        recognition.onerror = (event) => {
          voicePopup.innerHTML = `<p>Error: ${event.error}</p>`;
          setTimeout(() => {
            voicePopup.remove();
            document.body.classList.remove("modal-open");
          }, 1000);
          console.error("Voice recognition error:", event.error);
        };

        recognition.start();
        listening = true;

        // Hentikan recognition saat tombol diklik lagi atau waktu habis
        voiceSearchBtn.addEventListener(
          "click",
          () => {
            if (listening) {
              recognition.stop();
              listening = false;
              if (voicePopup) voicePopup.remove();
            }
          },
          { once: true }
        );
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

  // --- Logika untuk Infinite Scroll ke Bawah ---
  function loadMoreItems() {
    if (isLoading) return;
    isLoading = true;

    const start = page * itemsPerPage;
    const end = start + itemsPerPage;
    const itemsToDisplay = currentData.slice(start, end);

    if (itemsToDisplay.length > 0) {
      displayResults(currentData);
      page++;
    } else {
      window.removeEventListener("scroll", handleScroll);
    }

    isLoading = false;
  }

  function handleScroll() {
    if (
      window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 200 &&
      !isLoading &&
      page * itemsPerPage < currentData.length
    ) {
      loadMoreItems();
    }
  }

  function resetToInitialView() {
    resultsContainer.innerHTML = "";
    page = 1;
    currentData = dictionary;
    displayResults(currentData);
    window.addEventListener("scroll", handleScroll);
  }

  // --- Logika untuk Tombol Refresh ---
  refreshBtn.addEventListener("click", () => {
    location.reload(); // Segarkan halaman saat tombol diklik
  });

  // Muat data kamus dari variabel global
  if (window.kamusData) {
    dictionary = window.kamusData;
    resetToInitialView();
  } else {
    console.error("Error: kamusData not found.");
    resultsContainer.innerHTML = `<p class="text-center text-danger col-12 mt-4">Tidak dapat memuat data kamus.</p>`;
  }

  window.addEventListener("scroll", handleScroll);
});

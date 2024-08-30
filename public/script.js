document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("videoForm");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const successMessage = document.getElementById("successMessage");
  const dismissSuccessBtn = document.getElementById("dismissSuccessBtn");
  const inputs = form.querySelectorAll("input[required]");
  const fileUpload = document.getElementById("fileUpload");
  const fileUploadText = document.getElementById("fileUploadText");
  const progressContainer = document.querySelector(".progress-container");
  const progressBar = document.querySelector(".progress-bar");
  const progressText = document.querySelector(".progress-text");
  const dropArea = document.getElementById("dropArea");

  function validateEmail(email) {
    const re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  function validateInput(input, shouldShowError = true) {
    let isValid = input.value.trim() !== "";

    if (input.type === "email") {
      isValid = validateEmail(input.value.trim());
    }

    input.classList.toggle("invalid", !isValid);

    const errorMessage = input.nextElementSibling;
    if (errorMessage && errorMessage.classList.contains("error-message")) {
      if (shouldShowError && input.dataset.touched === "true") {
        errorMessage.style.display = isValid ? "none" : "block";
      } else {
        errorMessage.style.display = "none";
      }
    }
  }

  function validateForm() {
    let isValid = true;
    inputs.forEach((input) => {
      validateInput(input, true);
      if (
        input.value.trim() === "" ||
        (input.type === "email" && !validateEmail(input.value.trim()))
      ) {
        isValid = false;
      }
    });

    const videoLink = document.getElementById("videoLink").value.trim();
    const fileUpload = document.getElementById("fileUpload");

    if (videoLink === "" && fileUpload.files.length === 0) {
      isValid = false;
      alert("Please provide either a video link or upload a file.");
    }

    return isValid;
  }

  function handleFile(file) {
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB in bytes

    if (file.size > maxSize) {
      alert("File size exceeds 5GB limit. Please choose a smaller file.");
      fileUpload.value = ""; // Clear the file input
      fileUploadText.textContent = "Drop files here or Browse";
    } else {
      fileUploadText.textContent = file.name;
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  }

  function handleDrop(e) {
    const file = e.dataTransfer.files[0];
    if (file) {
      fileUpload.files = e.dataTransfer.files; // Set the files property
      handleFile(file);
    }
  }

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    dropArea.classList.add("highlight");
  }

  function unhighlight() {
    dropArea.classList.remove("highlight");
  }

  function showLoading() {
    loadingOverlay.style.display = "flex";
    progressContainer.style.display = "block";
    updateProgressBar(0);
  }

  function hideLoading() {
    loadingOverlay.style.display = "none";
    progressContainer.style.display = "none";
  }

  function showSuccessMessage() {
    successMessage.style.display = "block";
  }

  function hideSuccessMessage() {
    successMessage.style.display = "none";
  }

  dismissSuccessBtn.addEventListener("click", hideSuccessMessage);

  function updateProgressBar(percent) {
    progressBar.style.width = percent + "%";
    progressText.textContent = Math.round(percent) + "% Uploaded";
    void progressBar.offsetWidth; // Force a reflow
  }

  function handleError(message) {
    hideLoading();
    alert(message);
  }

  function uploadFile(formData) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/submit-video", true);

    const startTime = Date.now();
    let uploadComplete = false;
    let actualProgress = 0;

    function animateProgress() {
      const elapsed = Date.now() - startTime;
      const duration = 3000; // 3 seconds

      if (elapsed < duration && !uploadComplete) {
        // Slow crawl to 90% over 3 seconds
        const simulatedProgress = Math.min(90, (elapsed / duration) * 90);
        updateProgressBar(Math.max(simulatedProgress, actualProgress));
        requestAnimationFrame(animateProgress);
      } else if (uploadComplete) {
        // Quick jump to 100% at the end
        updateProgressBar(100);
      }
    }

    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) {
        actualProgress = Math.round((e.loaded / e.total) * 100);
      }
    };

    xhr.onloadstart = function () {
      showLoading();
      animateProgress();
    };

    xhr.onload = function () {
      if (xhr.status === 200) {
        uploadComplete = true;
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 3000 - elapsedTime);

        setTimeout(() => {
          updateProgressBar(100); // Ensure it reaches 100%

          setTimeout(() => {
            try {
              const response = JSON.parse(xhr.responseText);
              hideLoading();
              showSuccessMessage();
              form.reset();
              fileUploadText.textContent = "Drop files here or Browse";
            } catch (error) {
              console.error("Response is not JSON:", xhr.responseText);
              handleError("Unexpected server response");
            }
          }, 200); // Short delay to show 100% before hiding
        }, remainingTime);
      } else {
        console.error("Server responded with status:", xhr.status);
        console.error("Response text:", xhr.responseText);
        handleError("Server error occurred");
      }
    };

    xhr.onerror = function () {
      handleError("Network error occurred");
    };

    xhr.send(formData);
  }

  // Initialize input validation
  inputs.forEach((input) => {
    input.addEventListener("input", function () {
      this.dataset.touched = "true";
      validateInput(this);
    });
    input.addEventListener("blur", function () {
      this.dataset.touched = "true";
      validateInput(this);
    });
    validateInput(input, false);
  });

  // File upload handling
  fileUpload.addEventListener("change", handleFileSelect);

  // Make the entire drop area clickable
  dropArea.addEventListener("click", function (e) {
    if (e.target !== fileUpload) {
      e.preventDefault();
      fileUpload.click();
    }
  });

  // Drag and drop functionality
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });

  dropArea.addEventListener("drop", handleDrop, false);

  // Form submission
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (validateForm()) {
      const formData = new FormData(form);
      uploadFile(formData);
    }
  });
});

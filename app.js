const postIdInput = document.getElementById('postId');
const filenameInput = document.getElementById('filename');
const urlPreview = document.getElementById('urlPreview');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const btnDownload = document.getElementById('btnDownload');
const btnView = document.getElementById('btnView');

// Update preview URL saat input berubah
function updatePreview() {
    const postId = postIdInput.value.trim();
    const filename = filenameInput.value.trim();
    
    if (postId && filename) {
        const url = `https://www.lexaloffle.com/bbs/cposts/${postId}/${filename}.p8.png`;
        urlPreview.textContent = url;
    } else {
        urlPreview.textContent = 'URL akan muncul di sini...';
    }
}

// Event listeners untuk input
postIdInput.addEventListener('input', updatePreview);
filenameInput.addEventListener('input', updatePreview);

// Fungsi untuk mendapatkan URL file
function getFileUrl() {
    const postId = postIdInput.value.trim();
    const filename = filenameInput.value.trim();

    if (!postId || !filename) {
        showResult('error', '❌ Mohon isi Post ID dan Nama File!');
        return null;
    }

    return `https://www.lexaloffle.com/bbs/cposts/${postId}/${filename}.p8.png`;
}

// Fungsi untuk menampilkan hasil
function showResult(type, message) {
    result.className = `result ${type}`;
    result.textContent = message;
    result.style.display = 'block';
}

// Fungsi untuk menyembunyikan hasil
function hideResult() {
    result.style.display = 'none';
}

// Fungsi download file
async function downloadFile() {
    const url = getFileUrl();
    if (!url) return;

    hideResult();
    loading.style.display = 'block';
    btnDownload.disabled = true;
    btnView.disabled = true;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`File tidak ditemukan (${response.status})`);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${filenameInput.value.trim()}.p8.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        showResult('success', '✅ File berhasil didownload!');
    } catch (error) {
        showResult('error', `❌ Error: ${error.message}`);
    } finally {
        loading.style.display = 'none';
        btnDownload.disabled = false;
        btnView.disabled = false;
    }
}

// Fungsi view source
function viewSource() {
    const url = getFileUrl();
    if (!url) return;

    window.open(url, '_blank');
    showResult('success', '✅ File dibuka di tab baru!');
}

// Event listeners untuk tombol
btnDownload.addEventListener('click', downloadFile);
btnView.addEventListener('click', viewSource);

// Support untuk Enter key
postIdInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        filenameInput.focus();
    }
});

filenameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        downloadFile();
    }
});
